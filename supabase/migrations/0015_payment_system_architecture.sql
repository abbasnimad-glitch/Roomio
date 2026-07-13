-- ============================================================
-- ROOMIO — PAYMENT SYSTEM (ARCHITECTURE ONLY)
-- Run in the Supabase SQL editor after 0001_initial_schema.sql
-- (and after 0002_security_rls_column_guards.sql, 0012_premium_listing.sql,
-- 0013_boost_listing.sql).
--
-- This migration prepares the DATA MODEL for payments, subscriptions, and
-- one-time premium purchases. It intentionally does NOT integrate any
-- payment gateway (no Stripe/Omise/PromptPay API calls, no webhooks, no
-- checkout flow) — that comes in a later phase. For now:
--   - subscription_plans / subscriptions: recurring plans a user could
--     subscribe to (e.g. an owner/technician tier with ongoing perks).
--   - premium_purchases: the business record of a one-time purchase of
--     Featured (0012) or Boost (0013) placement for a specific listing —
--     the source-of-truth/audit trail, separate from the is_featured /
--     is_boosted flags on properties/service_providers themselves (which
--     remain admin-set for now; a future gateway integration would set
--     them automatically once a purchase's payment succeeds).
--   - payments: a generic ledger of payment attempts, optionally linked
--     to the subscription or premium purchase it's paying for.
--
-- `method`/`provider` are left as free text (not enums) since the actual
-- gateway hasn't been chosen/integrated yet — enums would force a schema
-- migration the moment a gateway is picked.
-- ============================================================

create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');
create type premium_purchase_type as enum ('featured', 'boost');
create type premium_purchase_status as enum ('pending', 'active', 'expired', 'canceled');

-- ------------------------------------------------------------
-- SUBSCRIPTION PLANS (admin-managed reference data, like districts/universities)
-- ------------------------------------------------------------
create table subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  price_monthly numeric(10,2) not null,
  -- Flexible plan features (e.g. {"max_listings": 10, "includes_boost": true}) —
  -- jsonb, matching the existing business_hours column's flexible-schema convention.
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SUBSCRIPTIONS
-- ------------------------------------------------------------
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid not null references subscription_plans(id),
  status subscription_status not null default 'trialing',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_idx on subscriptions(user_id);
create index subscriptions_status_idx on subscriptions(status);

-- ------------------------------------------------------------
-- PREMIUM PURCHASES (one-time Featured / Boost placement, business record)
-- ------------------------------------------------------------
create table premium_purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  service_provider_id uuid references service_providers(id) on delete cascade,
  purchase_type premium_purchase_type not null,
  status premium_purchase_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint premium_purchases_target_check check (
    (property_id is not null and service_provider_id is null) or
    (property_id is null and service_provider_id is not null)
  )
);

create index premium_purchases_user_idx on premium_purchases(user_id);
create index premium_purchases_property_idx on premium_purchases(property_id);
create index premium_purchases_service_provider_idx on premium_purchases(service_provider_id);

-- ------------------------------------------------------------
-- PAYMENTS (generic ledger; optionally fulfills a subscription or a premium purchase)
-- ------------------------------------------------------------
create table payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'THB',
  status payment_status not null default 'pending',
  method text, -- e.g. 'promptpay' | 'card' | 'bank_transfer' — free text, no gateway chosen yet
  provider text, -- e.g. 'stripe' | 'omise' | 'manual' — free text, no gateway integrated yet
  provider_reference text, -- external payment/charge id, once a gateway is integrated
  subscription_id uuid references subscriptions(id) on delete set null,
  premium_purchase_id uuid references premium_purchases(id) on delete set null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_single_target_check check (
    not (subscription_id is not null and premium_purchase_id is not null)
  )
);

create index payments_user_idx on payments(user_id);
create index payments_status_idx on payments(status);
create index payments_subscription_idx on payments(subscription_id);
create index payments_premium_purchase_idx on payments(premium_purchase_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;
alter table premium_purchases enable row level security;
alter table payments enable row level security;

-- Plans are public reference data (like districts/universities) — anyone can browse active plans.
create policy "subscription_plans_select_active_or_admin" on subscription_plans
  for select using (is_active = true or public.is_admin());
create policy "subscription_plans_write_admin" on subscription_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- Users can read their own subscriptions; admins can read/manage all.
-- No self-service insert/update yet — the payment gateway integration (later
-- phase) is what will create/update these, generally via a trusted server
-- context. Admins can manage records directly in the meantime (e.g. for
-- manual/offline payments).
create policy "subscriptions_select_self_or_admin" on subscriptions
  for select using (user_id = auth.uid() or public.is_admin());
create policy "subscriptions_write_admin" on subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- Same pattern for premium purchases and payments.
create policy "premium_purchases_select_self_or_admin" on premium_purchases
  for select using (user_id = auth.uid() or public.is_admin());
create policy "premium_purchases_write_admin" on premium_purchases
  for all using (public.is_admin()) with check (public.is_admin());

create policy "payments_select_self_or_admin" on payments
  for select using (user_id = auth.uid() or public.is_admin());
create policy "payments_write_admin" on payments
  for all using (public.is_admin()) with check (public.is_admin());
