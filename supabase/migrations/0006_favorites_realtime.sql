-- ============================================================
-- ROOMIO — FAVORITES: REALTIME PATCH
-- Run this in the Supabase SQL editor after schema.sql.
--
-- schema.sql creates the favorites table with RLS, but never adds it
-- to the supabase_realtime publication. Without this, no
-- postgres_changes events are ever broadcast for the table, so the
-- realtime sync in FavoriteButton.tsx and FavoritesRealtimeSync.tsx
-- would silently receive nothing.
--
-- Existing RLS policies still apply to realtime delivery — a client
-- only ever receives change events for rows it's allowed to select,
-- so this does not widen access, it only enables the live stream.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'favorites'
  ) then
    alter publication supabase_realtime add table favorites;
  end if;
end $$;
