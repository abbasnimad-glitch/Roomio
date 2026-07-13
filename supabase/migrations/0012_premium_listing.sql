-- ============================================================
-- ROOMIO — PREMIUM LISTING
-- Run in the Supabase SQL editor after 0001_initial_schema.sql
-- (and after 0002_security_rls_column_guards.sql).
--
-- Adds featured/premium listing support to both properties and
-- service_providers:
--   is_featured      — whether the listing is currently promoted
--   featured_until    — when the promotion expires (null = no expiry set)
--
-- A listing counts as "currently featured" only while
-- is_featured = true AND (featured_until is null OR featured_until > now()) —
-- computed at query time, so no background job is needed to "turn off"
-- an expired promotion.
--
-- Only admins may set these columns — this extends the existing
-- properties_guard_status_column / service_providers_guard_status_column
-- trigger functions from 0002 (via create or replace, so the triggers
-- already attached to those functions pick up the new behavior
-- automatically; no need to touch 0002 itself or re-create the triggers).
-- ============================================================

alter table properties add column if not exists is_featured boolean not null default false;
alter table properties add column if not exists featured_until timestamptz;

alter table service_providers add column if not exists is_featured boolean not null default false;
alter table service_providers add column if not exists featured_until timestamptz;

create index if not exists properties_featured_idx on properties(is_featured, featured_until);
create index if not exists service_providers_featured_idx on service_providers(is_featured, featured_until);

create or replace function public.properties_guard_status_column()
returns trigger as $$
begin
  if not public.is_admin() then
    new.status := old.status;
    new.is_featured := old.is_featured;
    new.featured_until := old.featured_until;
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
  end if;
  return new;
end;
$$ language plpgsql;
