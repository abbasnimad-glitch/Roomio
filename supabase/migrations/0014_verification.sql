-- ============================================================
-- ROOMIO — VERIFICATION
-- Run in the Supabase SQL editor after 0001_initial_schema.sql
-- (and after 0002_security_rls_column_guards.sql).
--
-- Adds verification support:
--   profiles.is_verified   — Verified Owner / Verified Technician.
--                            Lives on profiles (the existing profile
--                            system) since it verifies the PERSON,
--                            regardless of whether they currently hold
--                            the 'owner' or 'service_provider' role.
--   properties.is_verified — Verified Property, a separate listing-level
--                            check (e.g. a physical inspection), distinct
--                            from the owner's own identity verification.
--
-- service_providers intentionally has no separate is_verified column —
-- for services, verification applies to the technician (their profile),
-- not to the listing itself.
--
-- Only admins may set these — extends the existing
-- profiles_guard_privileged_columns / properties_guard_status_column
-- trigger functions (via create or replace, so the triggers already
-- attached to those functions pick up the new behavior automatically).
-- ============================================================

alter table profiles add column if not exists is_verified boolean not null default false;
alter table properties add column if not exists is_verified boolean not null default false;

create index if not exists profiles_is_verified_idx on profiles(is_verified);
create index if not exists properties_is_verified_idx on properties(is_verified);

create or replace function public.profiles_guard_privileged_columns()
returns trigger as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.loyalty_points := old.loyalty_points;
    new.is_verified := old.is_verified;
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function public.properties_guard_status_column()
returns trigger as $$
begin
  if not public.is_admin() then
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
