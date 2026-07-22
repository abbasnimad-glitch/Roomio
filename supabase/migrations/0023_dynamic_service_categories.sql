-- ============================================================
-- Migration 0023: Dynamic Service Categories
-- ============================================================
-- NOTE: This migration was run manually against production via the
-- Supabase SQL Editor before this file was created. This file is a
-- retroactive record of what was executed, reconstructed from the
-- live database schema. It documents history — it is NOT meant to
-- be re-run against this database. If setting up a fresh environment,
-- run this file once on an empty schema.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create service_categories table
-- ------------------------------------------------------------
create table if not exists service_categories (
  id integer generated always as identity primary key,
  key text not null unique,
  name_th text not null,
  name_en text not null,
  icon text not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now()
);

comment on table service_categories is
  'Admin-managed service categories, replacing the previous ServiceCategory enum.';

-- ------------------------------------------------------------
-- 2. Seed categories
--    First 5 rows map 1:1 to the original ServiceCategory enum values
--    (electrician, aircon_repair, appliance_repair, plumber,
--    general_technician). Rows 6-8 (mover, cleaning, other) were
--    added at the same time to expand coverage now that categories
--    are admin-editable.
-- ------------------------------------------------------------
insert into service_categories (key, name_th, name_en, icon, sort_order) values
  ('electrician',        'ช่างไฟฟ้า',              'Electrician',            'Zap',            1),
  ('aircon_repair',      'ซ่อมแอร์',                'Air conditioner repair', 'Wind',           2),
  ('appliance_repair',   'ซ่อมเครื่องใช้ไฟฟ้า',      'Appliance repair',       'Wrench',         3),
  ('plumber',            'ช่างประปา',               'Plumber',                'Droplets',       4),
  ('general_technician', 'ช่างทั่วไป',               'General technician',     'Hammer',         5),
  ('mover',              'ขนย้าย/รถขนของ',          'Moving/Transport',       'Truck',          6),
  ('cleaning',           'แม่บ้าน/ทำความสะอาด',     'Cleaning service',       'Sparkles',       7),
  ('other',              'อื่นๆ',                   'Other',                  'MoreHorizontal', 8)
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- STATUS: Steps 3-6 below have ALREADY been applied to production.
-- The old `category` enum column no longer exists on service_providers
-- (confirmed: querying it now returns "column sp.category does not
-- exist"). Do NOT attempt to re-run steps 3-6 against this database —
-- they are not written defensively against a missing source column
-- and will error. They're kept here only as a historical record for
-- setting up a fresh environment from scratch.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 3. Add category_id column to service_providers (nullable first,
--    so existing rows aren't rejected before backfill)
-- ------------------------------------------------------------
alter table service_providers
  add column if not exists category_id integer references service_categories(id);

-- ------------------------------------------------------------
-- 4. Backfill category_id from the old category enum column
-- ------------------------------------------------------------
update service_providers sp
set category_id = sc.id
from service_categories sc
where sp.category::text = sc.key
  and sp.category_id is null;

-- ------------------------------------------------------------
-- 5. Enforce not-null now that backfill is complete
-- ------------------------------------------------------------
alter table service_providers
  alter column category_id set not null;

-- ------------------------------------------------------------
-- 6. Drop the old enum column (and the enum type, if no longer used
--    elsewhere). Confirm nothing else references the ServiceCategory
--    enum type before running this in a fresh environment.
-- ------------------------------------------------------------
alter table service_providers
  drop column if exists category;

-- If the underlying Postgres enum type is no longer referenced anywhere:
-- drop type if exists service_category;

-- ------------------------------------------------------------
-- 7. Index for lookups/joins
-- ------------------------------------------------------------
create index if not exists idx_service_providers_category_id
  on service_providers(category_id);

-- ------------------------------------------------------------
-- 8. RLS: allow public read of categories, restrict writes to admin
--    Adjust to match your existing RLS conventions for admin-only
--    tables (e.g. reuse an existing is_admin() helper if you have one).
-- ------------------------------------------------------------
alter table service_categories enable row level security;

drop policy if exists "service_categories_select_all" on service_categories;
create policy "service_categories_select_all"
  on service_categories for select
  using (true);

-- Reuses the existing is_admin() helper function already used by other
-- admin-only tables in this project.
drop policy if exists "service_categories_admin_write" on service_categories;
create policy "service_categories_admin_write"
  on service_categories for all
  using (is_admin())
  with check (is_admin());
