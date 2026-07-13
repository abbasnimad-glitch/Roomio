# Roomio — Supabase Migrations

All SQL for this project lives here, numbered in the order it must be run.
**Run every file in a fresh Supabase project, in ascending numeric order, with no gaps.**
Each file is idempotent-safe to re-run where practical (`if not exists` / `drop ... if exists` guards),
but running them out of order is not supported and may fail with a missing-table/column error.

The loose `.sql` files that used to live directly under `supabase/` (`schema.sql`,
`security_patch_critical.sql`, etc.) have been consolidated here. They are kept in
`supabase/` for backward compatibility with anything already referencing those exact
paths, but this `migrations/` folder — not the loose files — is now the source of truth
for new deployments.

| File | Purpose | Depends on |
|---|---|---|
| `0001_initial_schema.sql` | All base tables, enums, RLS policies, triggers, and storage buckets (`property-images`, `provider-images`, `avatars`). | — |
| `0002_security_rls_column_guards.sql` | **Critical.** Closes column-level RLS gaps `0001` alone can't express: without this, any signed-in user could set their own `role` to `admin`, edit their own `loyalty_points`, or self-approve a pending listing by editing `status` directly via the client SDK. | `0001` |
| `0003_owner_dashboard_storage_policies.sql` | Grants owners write access (insert/delete) to their own folder in the `property-images` bucket. Without this, image upload from the Owner Dashboard fails with a permission error — `0001` only makes the bucket public for *reads*. | `0001` |
| `0004_admin_user_suspension.sql` | Adds `profiles.is_suspended` plus triggers that block a suspended user from creating new properties/service providers/messages/reviews, even with a still-valid session (defense in depth alongside the middleware-level sign-out). | `0001` |
| `0005_search_performance_indexes.sql` | Indexes for filters the search UI exposes but `0001` never indexed (university, room type, availability), a composite `(status, property_type)` index, and a trigram index for keyword search. | `0001` |
| `0006_favorites_realtime.sql` | Adds the `favorites` table to the `supabase_realtime` publication so `postgres_changes` events fire for it. | `0001` |
| `0007_review_system.sql` | Adds `properties.rating_avg`/`rating_count` (mirrors the `service_providers` pattern `0001` already had), a `review_images` table + storage bucket/policies, and a one-review-per-user-per-listing constraint. | `0001` |
| `0008_notification_system.sql` | Triggers that auto-generate `notifications` rows for new messages, property status changes, availability changes, and favorite-listing updates; enables Realtime on `notifications`. | `0001` (references tables `0001` already has; ordered here chronologically, no hard dependency on `0007`) |
| `0009_chat_realtime.sql` | Adds `messages` to the `supabase_realtime` publication. | `0001` |
| `0010_avatars_and_provider_images_storage_policies.sql` | Grants users write access to their own `avatars/<user_id>/` folder, and service-provider owners write access to their own `provider-images/<service_provider_id>/` folder. Without this, no one could ever upload a profile avatar or provider photo — `0001` only made those buckets public for *reads*, same gap `0003` fixed for `property-images`. | `0001` |
| `0011_service_provider_availability.sql` | Adds `service_providers.is_available` (a simple "currently taking jobs" toggle) — `properties` already had an equivalent `availability` enum from `0001`; service providers had no equivalent concept at all until this migration. | `0001` |
| `0012_premium_listing.sql` | Adds `is_featured`/`featured_until` to both `properties` and `service_providers` for Premium Listing (featured placement, sorting priority, expiry). Extends the existing `properties_guard_status_column`/`service_providers_guard_status_column` trigger functions (via `create or replace function`) so only admins can set these columns — same mechanism already protecting `status`. | `0001`, `0002` |
| `0013_boost_listing.sql` | Adds `is_boosted`/`boost_start_at`/`boost_end_at` to both tables for Boost Listing — a separate, scheduled date-range promotion distinct from Premium Listing's single-expiry flag. Further extends the same guard trigger functions so only admins can set these too. | `0001`, `0002`, `0012` |
| `0014_verification.sql` | Adds `is_verified` to `profiles` (Verified Owner / Verified Technician — a person-level check, reusing the existing profile system) and to `properties` (Verified Property — a listing-level check). Extends `profiles_guard_privileged_columns` and `properties_guard_status_column` so only admins can set either. | `0001`, `0002` |
| `0015_payment_system_architecture.sql` | **Architecture only — no gateway integrated.** Adds `subscription_plans`, `subscriptions`, `premium_purchases` (the business record behind a Featured/Boost purchase), and `payments` (a generic ledger, optionally linked to a subscription or premium purchase), each with RLS (self-read, admin-write). `method`/`provider` on `payments` are free text since no gateway has been chosen yet. | `0001`, `0002`, `0012`, `0013` |
| `0016_reference_data_rls.sql` | **Critical fix (found during Release Candidate audit).** `districts` and `universities` were the only two tables in the schema with RLS never enabled — any authenticated client could write to them directly via the SDK, bypassing the app. Enables RLS with public-read/admin-write policies, same pattern as `subscription_plans`. | `0001` |
| `0017_boost_payment_system.sql` | Adds `boost_payments` (payment-gated flow for Boost Listing) with RLS restricting writes to insert-only-for-own-property; no client can UPDATE status directly. Two SECURITY DEFINER RPCs (`admin_approve_boost_payment`, `finalize_boost_payment_service`) are the only way to transition a payment to `paid` and activate the boost, each with a different, appropriately-scoped trust model. Extends `properties_guard_status_column` with a transaction-local bypass flag so these RPCs — and only these — can set the boost columns without being an admin. | `0001`, `0002`, `0013` |
| `0018_analytics_events.sql` | Adds `analytics_events`, a first-party event ledger (distinct from the GA4/PostHog integration) powering Owner Dashboard Metrics and admin stats. RLS allows insert from anyone including guests (self-attributed only), and read access scoped to a property's own owner or admin. | `0001` |
| `0019_analytics_query_optimization.sql` | Adds `get_property_event_counts(property_id)`, a grouped-count RPC used by `getPropertyStats()` instead of fetching every raw event row. Not security definer — runs with the caller's own privileges, so the existing `analytics_events` RLS policy applies unchanged. | `0018` |

## Applying migrations

1. Open the Supabase **SQL Editor** for your project.
2. Open each file above **in order**, paste its full contents, and run it.
3. Confirm "Success. No rows returned" (or similar) before moving to the next file.

### If you already ran only the old `schema.sql`

`0001_initial_schema.sql` is byte-identical to the old `supabase/schema.sql`. If your
project already has that applied, skip `0001` and start at `0002` — everything from
`0002` onward is purely additive (`alter table add column if not exists`, `create index
if not exists`, `create policy` for previously-missing policies) and safe to layer on top
of an existing `0001`-equivalent schema.

## Adding a new migration

Create the next-numbered file (`0012_...sql`) here, not a loose file under `supabase/`.
Add a row to the table above describing its purpose and dependencies, and update
`DEPLOYMENT.md`'s run-order list to match.
