-- ============================================================
-- ROOMIO — ANALYTICS & CONVERSION TRACKING
-- Run in the Supabase SQL editor after 0001_initial_schema.sql.
--
-- A lightweight, first-party event ledger — distinct from the GA4/PostHog
-- integration in lib/analytics/ (that's external/third-party; this is
-- in-house data used to power Owner Dashboard Metrics and admin stats).
--
-- target_id is intentionally not a foreign key: it can point to either
-- properties or service_providers (target_type distinguishes which), and
-- this is a lightweight event log, not a core business table — an insert
-- should never fail because of an FK edge case.
-- ============================================================

create type analytics_event_type as enum ('view', 'click_contact', 'click_phone', 'click_line', 'boost_click', 'payment_success');
create type analytics_target_type as enum ('property', 'service');

create table analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  event_type analytics_event_type not null,
  target_type analytics_target_type not null,
  target_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_target_idx on analytics_events(target_type, target_id);
create index analytics_events_created_idx on analytics_events(created_at);
create index analytics_events_event_type_idx on analytics_events(event_type);

alter table analytics_events enable row level security;

-- Anyone — including anonymous/guest visitors, per this task's "works for
-- guest users" requirement — can log an event, but only ever attributed
-- to themselves: if user_id is supplied it must match the caller, and a
-- guest (no session, auth.uid() is null) may only insert with user_id null.
create policy "analytics_events_insert_any" on analytics_events
  for insert with check (user_id is null or user_id = auth.uid());

-- Owners can read events for their own properties (powers Owner Dashboard
-- Metrics / getPropertyStats); admins can read everything.
create policy "analytics_events_select_own_property_or_admin" on analytics_events
  for select using (
    public.is_admin()
    or (
      target_type = 'property'
      and exists (select 1 from properties p where p.id = target_id and p.owner_id = auth.uid())
    )
  );
