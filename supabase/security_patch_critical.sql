-- ============================================================
-- ROOMIO — CRITICAL SECURITY PATCH
-- Run this in the Supabase SQL editor AFTER schema.sql.
--
-- Fixes:
--   1. profiles_update_self had no column restriction — any signed-in
--      user could set their own `role` to 'admin' or edit `loyalty_points`
--      directly via the client SDK.
--   2. properties_update_owner_or_admin / service_providers_update_owner_or_admin
--      had no column restriction — an owner could flip their own listing's
--      `status` from 'pending' to 'approved', bypassing the admin queue.
--   3. (bonus, same root cause) messages_update_recipient let a recipient
--      rewrite `body`/`sender_id`, not just mark a message read.
--
-- Postgres RLS policies apply per-row, not per-column, so `using()` alone
-- can't stop someone from updating a column they shouldn't touch as long
-- as they own the row. The fix is a BEFORE UPDATE trigger that snaps
-- protected columns back to their previous value unless the actor is an
-- admin. This keeps the existing policies (so admins and self/owner
-- access still work) and just closes the column-level gap.
-- ============================================================

-- ------------------------------------------------------------
-- 1) profiles: lock down `role` and `loyalty_points`
--    (loyalty_points is also machine-maintained by
--    refresh_loyalty_points() from loyalty_transactions, so users
--    should never be able to set it directly regardless of role change)
-- ------------------------------------------------------------
create or replace function public.profiles_guard_privileged_columns()
returns trigger as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.loyalty_points := old.loyalty_points;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_guard_privileged_columns_trg on profiles;
create trigger profiles_guard_privileged_columns_trg
  before update on profiles
  for each row execute procedure public.profiles_guard_privileged_columns();

-- ------------------------------------------------------------
-- 2) properties / service_providers: lock down `status`
--    (only admins can move a listing between pending/approved/rejected/archived;
--    owners can still edit every other column on their own listing)
-- ------------------------------------------------------------
create or replace function public.properties_guard_status_column()
returns trigger as $$
begin
  if not public.is_admin() then
    new.status := old.status;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists properties_guard_status_trg on properties;
create trigger properties_guard_status_trg
  before update on properties
  for each row execute procedure public.properties_guard_status_column();

create or replace function public.service_providers_guard_status_column()
returns trigger as $$
begin
  if not public.is_admin() then
    new.status := old.status;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists service_providers_guard_status_trg on service_providers;
create trigger service_providers_guard_status_trg
  before update on service_providers
  for each row execute procedure public.service_providers_guard_status_column();

-- ------------------------------------------------------------
-- 3) (bonus) messages: a recipient may only flip `status`
--    (e.g. unread -> read), never rewrite the message itself
-- ------------------------------------------------------------
create or replace function public.messages_guard_recipient_columns()
returns trigger as $$
begin
  if old.recipient_id = auth.uid() and not public.is_admin() then
    new.sender_id := old.sender_id;
    new.recipient_id := old.recipient_id;
    new.property_id := old.property_id;
    new.service_provider_id := old.service_provider_id;
    new.body := old.body;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists messages_guard_recipient_trg on messages;
create trigger messages_guard_recipient_trg
  before update on messages
  for each row execute procedure public.messages_guard_recipient_columns();
