-- ============================================================
-- ROOMIO — ADMIN DASHBOARD: USER SUSPENSION
-- Run this in the Supabase SQL editor after schema.sql
-- (and after security_patch_critical.sql, if applied).
--
-- Adds a soft-suspend flag to profiles so admins can suspend a user
-- from the Admin Dashboard. Enforcement happens in two places:
--   1. App layer: middleware.ts signs a suspended user out and blocks
--      access to protected routes (immediate, user-facing).
--   2. DB layer (defense in depth): a suspended user is blocked from
--      creating new properties, service providers, messages, or
--      reviews even if they still hold a valid session somehow.
-- ============================================================

alter table profiles add column if not exists is_suspended boolean not null default false;

create or replace function public.is_suspended()
returns boolean as $$
  select coalesce((select is_suspended from profiles where id = auth.uid()), false);
$$ language sql security definer stable;

create or replace function public.reject_if_suspended()
returns trigger as $$
begin
  if public.is_suspended() then
    raise exception 'บัญชีนี้ถูกระงับการใช้งาน ไม่สามารถทำรายการนี้ได้';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists properties_reject_suspended_trg on properties;
create trigger properties_reject_suspended_trg
  before insert on properties
  for each row execute procedure public.reject_if_suspended();

drop trigger if exists service_providers_reject_suspended_trg on service_providers;
create trigger service_providers_reject_suspended_trg
  before insert on service_providers
  for each row execute procedure public.reject_if_suspended();

drop trigger if exists messages_reject_suspended_trg on messages;
create trigger messages_reject_suspended_trg
  before insert on messages
  for each row execute procedure public.reject_if_suspended();

drop trigger if exists reviews_reject_suspended_trg on reviews;
create trigger reviews_reject_suspended_trg
  before insert on reviews
  for each row execute procedure public.reject_if_suspended();
