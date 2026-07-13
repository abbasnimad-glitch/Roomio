-- ============================================================
-- ROOMIO — ANALYTICS QUERY OPTIMIZATION
-- Run in the Supabase SQL editor after 0018_analytics_events.sql.
--
-- getPropertyStats() previously fetched every raw analytics_events row
-- for a property (event_type only, but with no LIMIT) and counted them
-- client-side in JS. For a long-lived or high-traffic listing this is an
-- unbounded fetch that grows forever.
--
-- Supabase/PostgREST has no GROUP BY in the standard REST query builder,
-- so a grouped aggregate has to go through an RPC (the same pattern
-- already used elsewhere in this schema, e.g. admin_approve_boost_payment).
--
-- This function is intentionally NOT security definer — it runs with the
-- caller's own privileges, so the existing
-- analytics_events_select_own_property_or_admin RLS policy is enforced
-- exactly as it already is for direct SELECTs. A non-owner, non-admin
-- caller gets zero rows back, same as before.
-- ============================================================

create or replace function public.get_property_event_counts(target_property_id uuid)
returns table (event_type analytics_event_type, event_count bigint)
language sql
stable
as $$
  select event_type, count(*) as event_count
  from analytics_events
  where target_type = 'property' and target_id = target_property_id
  group by event_type;
$$;
