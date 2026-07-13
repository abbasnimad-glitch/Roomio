-- ============================================================
-- ROOMIO — SEARCH SYSTEM: PERFORMANCE PATCH
-- Run this in the Supabase SQL editor after schema.sql.
--
-- schema.sql only indexed district_id, property_type, status,
-- price_monthly, and owner_id on properties. Several filters the
-- search UI actually exposes were never backed by an index, so
-- Postgres was falling back to a sequential scan for them:
--   - nearby_university_id  (University filter)
--   - room_type             (Room type filter)
--   - availability          (Available now filter)
--   - name (ILIKE '%term%')  (Keyword filter)
--
-- Also adds a composite index on (status, property_type), since
-- every property search always filters on both together (dorm vs.
-- rental house, approved-only) — one composite index serves that
-- combination faster than intersecting two separate single-column
-- index scans.
-- ============================================================

create index if not exists properties_university_idx on properties(nearby_university_id);
create index if not exists properties_room_type_idx on properties(room_type);
create index if not exists properties_availability_idx on properties(availability);
create index if not exists properties_status_type_idx on properties(status, property_type);

-- Keyword search uses ILIKE '%term%', which a plain B-tree index can't
-- accelerate (the leading wildcard rules out a prefix scan). pg_trgm's
-- trigram GIN index supports arbitrary substring ILIKE lookups instead
-- of a full sequential scan.
create extension if not exists pg_trgm;
create index if not exists properties_name_trgm_idx on properties using gin (name gin_trgm_ops);
