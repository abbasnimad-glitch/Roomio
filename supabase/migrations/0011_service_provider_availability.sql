-- ============================================================
-- ROOMIO — PRODUCTION PATCH 3: SERVICE PROVIDER DASHBOARD (schema support)
-- Run in the Supabase SQL editor after 0001_initial_schema.sql.
--
-- properties already has an `availability` enum (available/almost_full/
-- full) that owners control freely (only `status`, the admin-approval
-- state, is guarded). service_providers had no equivalent concept at
-- all — a technician had no way to signal "currently taking jobs" vs
-- "busy". Adds a simple boolean toggle for that, freely owner-editable
-- via the existing service_providers_update_owner_or_admin RLS policy
-- (no new policy needed — RLS is row-level, and `status` is the only
-- column already column-guarded for service_providers).
-- ============================================================

alter table service_providers add column if not exists is_available boolean not null default true;

create index if not exists service_providers_is_available_idx on service_providers(is_available);
