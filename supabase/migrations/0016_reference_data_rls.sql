-- ============================================================
-- ROOMIO — CRITICAL FIX: MISSING RLS ON REFERENCE TABLES
-- Run in the Supabase SQL editor after 0001_initial_schema.sql.
--
-- Found during the Release Candidate audit: districts and universities
-- were the only two tables in the entire schema with RLS never enabled.
-- Every other table has RLS + explicit policies; these two were
-- unintentionally left relying on Supabase's default table grants, which
-- allow the authenticated (and possibly anon) role to INSERT/UPDATE/DELETE
-- directly via the client SDK — bypassing the app entirely and letting
-- any signed-in user corrupt the district/university reference data that
-- every property/search filter depends on.
--
-- Fix mirrors the exact pattern already used for subscription_plans
-- (0015): public read, admin-only write.
-- ============================================================

alter table districts enable row level security;
alter table universities enable row level security;

create policy "districts_select_all" on districts for select using (true);
create policy "districts_write_admin" on districts for all using (public.is_admin()) with check (public.is_admin());

create policy "universities_select_all" on universities for select using (true);
create policy "universities_write_admin" on universities for all using (public.is_admin()) with check (public.is_admin());
