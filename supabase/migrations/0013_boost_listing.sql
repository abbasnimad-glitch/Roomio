-- ============================================================
-- ROOMIO — BOOST LISTING
-- Run in the Supabase SQL editor after 0001_initial_schema.sql
-- (and after 0002_security_rls_column_guards.sql, 0012_premium_listing.sql).
--
-- Adds a separate, time-windowed promotion mechanism to properties and
-- service_providers, distinct from Premium Listing's (0012) single-expiry
-- is_featured/featured_until:
--   is_boosted     — whether a boost has been scheduled/enabled
--   boost_start_at — when the boost becomes active (null = active immediately)
--   boost_end_at   — when the boost ends (null = no end date)
--
-- A listing counts as "currently boosted" only while is_boosted = true AND
-- now() is within [boost_start_at, boost_end_at] (either bound may be
-- null/open-ended) — computed at query time, same approach as 0012.
--
-- Only admins may set these columns — extends the existing
-- properties_guard_status_column / service_providers_guard_status_column
-- trigger functions (via create or replace, so the triggers already
-- attached to those functions pick up the new behavior automatically).
-- ============================================================

alter table properties add column if not exists is_boosted boolean not null default false;
alter table properties add column if not exists boost_start_at timestamptz;
alter table properties add column if not exists boost_end_at timestamptz;

alter table service_providers add column if not exists is_boosted boolean not null default false;
alter table service_providers add column if not exists boost_start_at timestamptz;
alter table service_providers add column if not exists boost_end_at timestamptz;

create index if not exists properties_boost_idx on properties(is_boosted, boost_start_at, boost_end_at);
create index if not exists service_providers_boost_idx on service_providers(is_boosted, boost_start_at, boost_end_at);

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
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function public.service_providers_guard_status_column()
returns trigger as $$
begin
  if not public.is_admin() then
    new.status := old.status;
    new.is_featured := old.is_featured;
    new.featured_until := old.featured_until;
    new.is_boosted := old.is_boosted;
    new.boost_start_at := old.boost_start_at;
    new.boost_end_at := old.boost_end_at;
  end if;
  return new;
end;
$$ language plpgsql;
