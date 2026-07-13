-- ============================================================
-- ROOMIO — BOOST PAYMENT SYSTEM
-- Run in the Supabase SQL editor after 0001_initial_schema.sql
-- (and after 0002_security_rls_column_guards.sql, 0013_boost_listing.sql).
--
-- Adds a real payment-gated flow for Boost Listing (0013): an owner must
-- create a boost_payments record and successfully pay (Stripe, verified
-- server-side, or PromptPay, approved by an admin) before their
-- property's is_boosted/boost_start_at/boost_end_at flags are set.
--
-- Security model:
--   - Only the property's own owner may INSERT a boost_payments row for
--     it (enforced by RLS, checked against properties.owner_id).
--   - The owner may UPDATE their own payment while it's still 'pending'
--     (e.g. to set payment_method / stripe_session_id on the payment
--     step), but a column-guard trigger (mirroring the one already on
--     properties/service_providers/profiles) locks status / paid_at /
--     activated_at / approved_by regardless — the owner can never flip
--     their own payment to 'paid'. Only two paths can do that:
--       1. admin_approve_boost_payment(payment_id) — a SECURITY DEFINER
--          RPC that strictly requires public.is_admin(). Used for the
--          PromptPay manual-approval flow.
--       2. finalize_boost_payment_service(payment_id) — a SECURITY
--          DEFINER RPC with NO caller-identity check, callable only via
--          the Supabase service-role key (a server-only secret, never
--          exposed to the browser). Used for the Stripe flow, invoked
--          from the confirmBoostPayment server action only after that
--          action has independently verified payment success by calling
--          Stripe's API directly.
--   - Both RPCs delegate to a shared, idempotent activation routine
--     (guarded by boost_payments.activated_at) so a payment can never
--     activate — and therefore never extend — a boost more than once.
--   - Activating the boost requires writing properties.is_boosted /
--     boost_start_at / boost_end_at, which the existing
--     properties_guard_status_column trigger (0002/0012/0013/0014)
--     normally restricts to admins only. A transaction-local session
--     flag (roomio.bypass_guard) lets these two RPCs — and only these
--     two — through; it is set exclusively inside the RPCs themselves,
--     not settable directly via the client SDK (set_config lives in
--     pg_catalog, which PostgREST does not expose as a callable RPC).
-- ============================================================

create type boost_payment_status as enum ('pending', 'paid', 'failed');

create table boost_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  amount numeric(10,2) not null,
  status boost_payment_status not null default 'pending',
  payment_method text, -- 'stripe' | 'promptpay' — chosen on the payment step, so nullable until then
  stripe_session_id text,
  approved_by uuid references profiles(id), -- admin who manually approved a PromptPay payment
  activated_at timestamptz, -- idempotency guard: boost is applied at most once per payment
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index boost_payments_user_idx on boost_payments(user_id);
create index boost_payments_property_idx on boost_payments(property_id);
create index boost_payments_status_idx on boost_payments(status);

alter table boost_payments enable row level security;

-- Owner can read their own payments; admin can read all.
create policy "boost_payments_select_self_or_admin" on boost_payments
  for select using (user_id = auth.uid() or public.is_admin());

-- Only the property's own owner may create a pending payment for it.
create policy "boost_payments_insert_own_property" on boost_payments
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid())
  );

-- The owner may update their OWN payment only while it's still pending
-- (e.g. to set payment_method / stripe_session_id on the payment step) —
-- checked against the row as it stood before the update, so this can't be
-- used on an already-paid/failed row. Admins may update freely.
create policy "boost_payments_update_own_pending_or_admin" on boost_payments
  for update using ((user_id = auth.uid() and status = 'pending') or public.is_admin());

-- Column guard: even with the UPDATE policy above, an owner can never set
-- status/paid_at/activated_at/approved_by themselves — only an admin, or
-- the two RPCs below via the transaction-local bypass flag, can.
create or replace function public.boost_payments_guard_status_columns()
returns trigger as $$
begin
  if not public.is_admin() and coalesce(current_setting('roomio.bypass_guard', true), 'false') <> 'true' then
    new.status := old.status;
    new.paid_at := old.paid_at;
    new.activated_at := old.activated_at;
    new.approved_by := old.approved_by;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger boost_payments_guard_status_columns_trg
  before update on boost_payments
  for each row execute procedure public.boost_payments_guard_status_columns();

-- ------------------------------------------------------------
-- Shared activation routine (idempotent)
-- ------------------------------------------------------------
create or replace function public._activate_paid_boost(target_payment_id uuid)
returns void as $$
declare
  payment_row boost_payments%rowtype;
begin
  select * into payment_row from boost_payments where id = target_payment_id;
  if payment_row.id is null then
    raise exception 'ไม่พบข้อมูลการชำระเงิน';
  end if;

  -- Defense in depth: this function has no caller-identity check of its
  -- own (it's an internal helper, called only from the two RPCs below,
  -- which already set status='paid' before calling it) — but a leading
  -- underscore is just a naming convention, not an actual PostgREST
  -- access restriction, so without this check a client could otherwise
  -- call it directly via supabase.rpc() on a still-pending payment. The
  -- REVOKE below closes this off structurally too.
  if payment_row.status <> 'paid' then
    raise exception 'ยังไม่ได้ชำระเงิน';
  end if;

  if payment_row.activated_at is not null then
    return; -- already activated — no-op, prevents double activation
  end if;

  update properties
  set is_boosted = true,
      boost_start_at = now(),
      boost_end_at = now() + interval '7 days'
  where id = payment_row.property_id;

  update boost_payments set activated_at = now() where id = target_payment_id;
end;
$$ language plpgsql security definer;

-- Belt and suspenders: prevent any client from calling this internal
-- helper directly via supabase.rpc(); it should only ever be invoked
-- from within admin_approve_boost_payment / finalize_boost_payment_service.
revoke execute on function public._activate_paid_boost(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Admin manual approval (PromptPay)
-- ------------------------------------------------------------
create or replace function public.admin_approve_boost_payment(target_payment_id uuid)
returns void as $$
declare
  payment_row boost_payments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'เฉพาะแอดมินเท่านั้นที่อนุมัติการชำระเงินได้';
  end if;

  select * into payment_row from boost_payments where id = target_payment_id;
  if payment_row.id is null then
    raise exception 'ไม่พบข้อมูลการชำระเงิน';
  end if;

  -- Covers both the boost_payments status update below and the
  -- properties update inside _activate_paid_boost.
  perform set_config('roomio.bypass_guard', 'true', true);

  if payment_row.status = 'pending' then
    update boost_payments
    set status = 'paid', paid_at = now(), approved_by = auth.uid()
    where id = target_payment_id;
  end if;

  perform public._activate_paid_boost(target_payment_id);
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- Server-verified Stripe confirmation
-- No caller-identity check: only reachable via the service-role key,
-- which is a server-only secret never exposed to the browser. The
-- confirmBoostPayment server action calls this only after independently
-- verifying the Stripe Checkout Session's payment_status with Stripe's
-- own API.
-- ------------------------------------------------------------
create or replace function public.finalize_boost_payment_service(target_payment_id uuid)
returns void as $$
declare
  payment_row boost_payments%rowtype;
begin
  select * into payment_row from boost_payments where id = target_payment_id;
  if payment_row.id is null then
    raise exception 'ไม่พบข้อมูลการชำระเงิน';
  end if;

  perform set_config('roomio.bypass_guard', 'true', true);

  if payment_row.status = 'pending' then
    update boost_payments set status = 'paid', paid_at = now() where id = target_payment_id;
  end if;

  perform public._activate_paid_boost(target_payment_id);
end;
$$ language plpgsql security definer;

-- CRITICAL: this function has no internal caller-identity check (it can't
-- meaningfully check auth.uid(), since it's designed to be called only via
-- the service-role key from trusted server code after Stripe verification).
-- Without this REVOKE, PostgREST would expose it to any authenticated
-- client, who could call it directly on their own pending payment and get
-- a free boost without ever paying. service_role is intentionally not
-- revoked — that's the only caller this function is meant to have.
revoke execute on function public.finalize_boost_payment_service(uuid) from public, anon, authenticated;
grant execute on function public.finalize_boost_payment_service(uuid) to service_role;

-- ------------------------------------------------------------
-- Extend the existing properties guard trigger to allow the two RPCs
-- above through, alongside the existing admin bypass.
-- ------------------------------------------------------------
create or replace function public.properties_guard_status_column()
returns trigger as $$
begin
  if not public.is_admin() and coalesce(current_setting('roomio.bypass_guard', true), 'false') <> 'true' then
    new.status := old.status;
    new.is_featured := old.is_featured;
    new.featured_until := old.featured_until;
    new.is_boosted := old.is_boosted;
    new.boost_start_at := old.boost_start_at;
    new.boost_end_at := old.boost_end_at;
    new.is_verified := old.is_verified;
  end if;
  return new;
end;
$$ language plpgsql;
