# Roomio

Find dormitories, rental houses, and trusted local service providers in Songkhla Province, Thailand.

This is **Phase 1** of the build: project foundation, database schema, and the full public-facing
browsing experience (home, search/filter, dormitory & rental house listings, property detail with
map, service provider directory & detail, auth). It runs against a real Supabase backend — there is
no mock or placeholder data baked into the app; you seed real listings through Supabase itself.

## What's included in this phase

- Next.js 15 (App Router) + TypeScript + Tailwind, configured as an installable PWA
- Complete Postgres schema (`supabase/schema.sql`) with every table from the spec — users/profiles,
  properties, property images, service providers, favorites, messages, reviews, notifications,
  districts, universities — plus Row Level Security policies for guest/user/owner/service
  provider/admin access, storage buckets, and triggers (auto-profile-on-signup, rating rollups,
  view-count increments)
- Supabase auth (email/password) wired through `@supabase/ssr`, with middleware that protects
  `/dashboard`, `/profile`, `/favorites` and enforces owner/admin-only routes
- **Full signup/login system**: registration collects full name, phone, email, password, and a
  role choice (ผู้ใช้ทั่วไป / เจ้าของที่พัก / ผู้ให้บริการ — `admin` can never be set through
  signup, only granted manually in Supabase); the `handle_new_user` trigger validates the role
  server-side. Includes forgot-password (`/auth/forgot-password`) and set-new-password
  (`/auth/update-password`) pages using Supabase's email reset flow.
- **Admin backend** (`/dashboard/admin`, admin-only): overview stats, a user management table to
  view every member and change their role, and an approval queue to approve/reject pending
  property and service-provider listings — all backed by real server actions
  (`lib/actions/admin.ts`) that re-check `role = admin` server-side before touching the database,
  on top of the RLS policies already enforcing the same rule at the Postgres level
- Home page: hero, live search bar (name/district/university), the three category buttons, and
  Latest / Popular / Available-now sections pulling real data
- Dormitories & rental house listing pages with filters (district, university, price range, room
  type, gender policy, available-now) and pagination-ready queries
- Property detail page: photo gallery, facilities, Google Maps location, owner contact (phone/LINE/
  Facebook), favorite + share buttons
- Local services directory with category and district filters, plus provider detail pages
  (business hours, rating, contact)
- **Membership / loyalty system**: `profiles.loyalty_points` + a `loyalty_transactions` ledger
  table (RLS: users read their own history, only admins can award points), three tiers (ทองแดง /
  เงิน / ทอง at 0 / 300 / 800 points with 0% / 5% / 10% discounts — see `LOYALTY_TIERS` in
  `lib/constants.ts`), a `/profile` page showing the member's tier card + recent transaction
  history, and an admin page at `/dashboard/admin/loyalty` to award points by phone number after a
  completed booking or service call
- **ค่าน้ำชา (support/tip) page** at `/support` — embeds your PromptPay QR
  (`public/images/promptpay-qr.jpg`) with suggested amounts, linked from the header (coffee icon)
  and footer
- Design system implemented exactly to spec: Poppins, primary #2563EB, secondary #22C55E, accent
  #F97316, rounded/soft-shadow "Airbnb-grade" component style

## What's next (Phase 4+ — tell me which to build first)

1. **Owner dashboard** — create/edit property & service listings, photo upload to Supabase Storage,
   availability toggle, per-listing view statistics
2. **Messaging** — real-time threads between guests and owners/providers (Supabase Realtime)
3. **Reviews** — write/read reviews on service providers and properties
4. Let owners (not just admins) award loyalty points directly for their own customers
5. Structured data (JSON-LD) + full SEO metadata per listing page
6. Cloudflare Pages deployment config (`wrangler.toml`, edge runtime adjustments) + CI

> **Updating an existing Supabase project?** All functions in `schema.sql` now use
> `create or replace function`, so it's safe to re-run the whole file — it won't error on things
> that already exist. Table/column additions (like `loyalty_points`) use plain `create table` /
> `alter table`, so if you already ran an earlier version of this file, just run the new
> `LOYALTY / MEMBERSHIP SYSTEM` block manually instead of the whole script.

## Setup

1. **Create a Supabase project** at supabase.com.
2. In the SQL editor, run `supabase/schema.sql` top to bottom. This creates every table, enum,
   trigger, RLS policy, and storage bucket.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (same page — needed later for the admin dashboard)
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Google Cloud Console — enable "Maps JavaScript API")
4. Install and run:
   ```bash
   npm install
   npm run dev
   ```
5. Open http://localhost:3000. The site will render with empty listing sections until you either:
   - Sign up a user, then manually flip their `profiles.role` to `owner` in the Supabase table
     editor and insert a row into `properties` (status must be `approved` to show publicly), or
   - Wait for the Phase 2 owner dashboard so this can be done through the UI.

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage) ·
Google Maps · next-pwa

## Icons

`public/icons/icon-192.png` and `icon-512.png` are referenced by the manifest but not generated
here — drop in your Roomio app icon at those two sizes (location-pin + house-window mark, per the
brand concept) before deploying.
