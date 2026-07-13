-- ============================================================
-- ROOMIO — REALTIME CHAT: MESSAGES REALTIME PATCH
-- Run this in the Supabase SQL editor after schema.sql.
--
-- schema.sql created messages with RLS but never added it to the
-- supabase_realtime publication, so no postgres_changes events were
-- ever broadcast for it. Existing RLS still governs delivery — a
-- client only ever receives events for rows matching
-- messages_select_participant (i.e. conversations they're part of).
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
