-- ============================================================
-- ROOMIO DATABASE SCHEMA (Supabase / Postgres)
-- Run this in the Supabase SQL editor, top to bottom.
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------
create type user_role as enum ('guest', 'user', 'owner', 'service_provider', 'admin');
create type property_type as enum ('dormitory', 'rental_house');
create type room_type as enum ('single', 'shared', 'studio', 'one_bedroom', 'two_bedroom', 'whole_house');
create type gender_policy as enum ('any', 'male_only', 'female_only');
create type availability_status as enum ('available', 'almost_full', 'full');
create type listing_status as enum ('pending', 'approved', 'rejected', 'archived');
create type service_category as enum ('electrician', 'aircon_repair', 'appliance_repair', 'plumber', 'general_technician');
create type message_status as enum ('unread', 'read');

-- ------------------------------------------------------------
-- REFERENCE TABLES
-- ------------------------------------------------------------
create table districts (
  id serial primary key,
  name_th text not null,
  name_en text not null unique
);

insert into districts (name_th, name_en) values
  ('เมืองสงขลา', 'Mueang Songkhla'),
  ('หาดใหญ่', 'Hat Yai'),
  ('สะเดา', 'Sadao'),
  ('รัตภูมิ', 'Rattaphum'),
  ('สทิงพระ', 'Sathing Phra'),
  ('จะนะ', 'Chana'),
  ('นาทวี', 'Na Thawi'),
  ('เทพา', 'Thepha'),
  ('สะบ้าย้อย', 'Saba Yoi'),
  ('ระโนด', 'Ranot'),
  ('กระแสสินธุ์', 'Krasae Sin'),
  ('สิงหนคร', 'Singhanakhon'),
  ('ควนเนียง', 'Khuan Niang'),
  ('บางกล่ำ', 'Bang Klam'),
  ('นาหม่อม', 'Na Mom'),
  ('คลองหอยโข่ง', 'Khlong Hoi Khong');

create table universities (
  id serial primary key,
  name text not null,
  district_id int references districts(id),
  lat double precision,
  lng double precision
);

insert into universities (name, district_id, lat, lng) values
  ('Prince of Songkla University (Hat Yai Campus)', 2, 7.0086, 100.4977),
  ('Hatyai University', 2, 7.0064, 100.4747),
  ('Songkhla Rajabhat University', 1, 7.1897, 100.6039),
  ('Thaksin University (Songkhla Campus)', 1, 7.2050, 100.5960),
  ('Rajamangala University of Technology Srivijaya (Songkhla)', 1, 7.2010, 100.5940);

-- ------------------------------------------------------------
-- USERS (extends Supabase auth.users)
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  line_id text,
  facebook_url text,
  avatar_url text,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text := new.raw_user_meta_data->>'role';
  safe_role user_role;
begin
  -- Only allow self-service signup as 'user', 'owner', or 'service_provider'.
  -- 'admin' can never be set through signup metadata — it must be granted manually in Supabase.
  if requested_role in ('owner', 'service_provider') then
    safe_role := requested_role::user_role;
  else
    safe_role := 'user';
  end if;

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'phone',
    safe_role
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- PROPERTIES (dormitories + rental houses)
-- ------------------------------------------------------------
create table properties (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  property_type property_type not null,
  description text not null default '',
  district_id int not null references districts(id),
  nearby_university_id int references universities(id),
  address text not null,
  lat double precision not null,
  lng double precision not null,
  price_monthly numeric(10,2) not null,
  deposit numeric(10,2) not null default 0,
  room_size_sqm numeric(6,2),
  room_type room_type not null,
  gender_policy gender_policy not null default 'any',
  has_air_conditioner boolean not null default false,
  has_furniture boolean not null default false,
  has_parking boolean not null default false,
  has_wifi boolean not null default false,
  has_security boolean not null default false,
  has_laundry boolean not null default false,
  availability availability_status not null default 'available',
  status listing_status not null default 'pending',
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_district_idx on properties(district_id);
create index properties_type_idx on properties(property_type);
create index properties_status_idx on properties(status);
create index properties_price_idx on properties(price_monthly);
create index properties_owner_idx on properties(owner_id);

create table property_images (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SERVICE PROVIDERS
-- ------------------------------------------------------------
create table service_providers (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  category service_category not null,
  description text not null default '',
  phone text not null,
  line_id text,
  working_districts int[] not null default '{}',
  business_hours jsonb not null default '{}'::jsonb, -- { "mon": {"open":"08:00","close":"18:00"}, ... }
  lat double precision,
  lng double precision,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  status listing_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_providers_category_idx on service_providers(category);
create index service_providers_status_idx on service_providers(status);

create table service_provider_images (
  id uuid primary key default uuid_generate_v4(),
  service_provider_id uuid not null references service_providers(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- FAVORITES
-- ------------------------------------------------------------
create table favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  service_provider_id uuid references service_providers(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_target_check check (
    (property_id is not null and service_provider_id is null) or
    (property_id is null and service_provider_id is not null)
  ),
  unique (user_id, property_id),
  unique (user_id, service_provider_id)
);

-- ------------------------------------------------------------
-- MESSAGES (buyer <-> owner/provider threads)
-- ------------------------------------------------------------
create table messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  service_provider_id uuid references service_providers(id) on delete set null,
  body text not null,
  status message_status not null default 'unread',
  created_at timestamptz not null default now()
);

create index messages_recipient_idx on messages(recipient_id, status);
create index messages_sender_idx on messages(sender_id);

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references profiles(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  service_provider_id uuid references service_providers(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  constraint reviews_target_check check (
    (property_id is not null and service_provider_id is null) or
    (property_id is null and service_provider_id is not null)
  )
);

-- Keep service_provider rating_avg / rating_count in sync
create or replace function public.refresh_provider_rating()
returns trigger as $$
declare
  target_provider_id uuid;
begin
  if TG_OP = 'DELETE' then
    target_provider_id := old.service_provider_id;
  else
    target_provider_id := new.service_provider_id;
  end if;

  update service_providers sp
  set rating_count = sub.cnt,
      rating_avg = sub.avg_rating
  from (
    select service_provider_id, count(*) cnt, avg(rating)::numeric(3,2) avg_rating
    from reviews
    where service_provider_id = target_provider_id
    group by service_provider_id
  ) sub
  where sp.id = sub.service_provider_id;

  -- if the last review for a provider was deleted, the subquery above returns no rows,
  -- so explicitly zero it out instead of leaving a stale rating behind
  if not found and target_provider_id is not null then
    update service_providers set rating_count = 0, rating_avg = 0 where id = target_provider_id;
  end if;

  return null;
end;
$$ language plpgsql security definer;

create trigger reviews_after_insert_update
  after insert or update on reviews
  for each row when (new.service_provider_id is not null)
  execute procedure public.refresh_provider_rating();

create trigger reviews_after_delete
  after delete on reviews
  for each row when (old.service_provider_id is not null)
  execute procedure public.refresh_provider_rating();

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications(user_id, is_read);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;
alter table service_providers enable row level security;
alter table service_provider_images enable row level security;
alter table favorites enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- PROFILES: readable by anyone, editable only by self or admin
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_self" on profiles for update using (auth.uid() = id or public.is_admin());

-- PROPERTIES: public can read approved listings; owners manage their own; admins manage all
create policy "properties_select_approved_or_owner" on properties
  for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy "properties_insert_owner" on properties
  for insert with check (owner_id = auth.uid());
create policy "properties_update_owner_or_admin" on properties
  for update using (owner_id = auth.uid() or public.is_admin());
create policy "properties_delete_owner_or_admin" on properties
  for delete using (owner_id = auth.uid() or public.is_admin());

-- PROPERTY IMAGES: follow parent property visibility
create policy "property_images_select" on property_images
  for select using (
    exists (select 1 from properties p where p.id = property_id and
      (p.status = 'approved' or p.owner_id = auth.uid() or public.is_admin()))
  );
create policy "property_images_manage_owner" on property_images
  for all using (
    exists (select 1 from properties p where p.id = property_id and
      (p.owner_id = auth.uid() or public.is_admin()))
  );

-- SERVICE PROVIDERS: mirrors properties
create policy "service_providers_select_approved_or_owner" on service_providers
  for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy "service_providers_insert_owner" on service_providers
  for insert with check (owner_id = auth.uid());
create policy "service_providers_update_owner_or_admin" on service_providers
  for update using (owner_id = auth.uid() or public.is_admin());
create policy "service_providers_delete_owner_or_admin" on service_providers
  for delete using (owner_id = auth.uid() or public.is_admin());

create policy "service_provider_images_select" on service_provider_images
  for select using (
    exists (select 1 from service_providers sp where sp.id = service_provider_id and
      (sp.status = 'approved' or sp.owner_id = auth.uid() or public.is_admin()))
  );
create policy "service_provider_images_manage_owner" on service_provider_images
  for all using (
    exists (select 1 from service_providers sp where sp.id = service_provider_id and
      (sp.owner_id = auth.uid() or public.is_admin()))
  );

-- FAVORITES: only the owning user
create policy "favorites_self" on favorites for all using (user_id = auth.uid());

-- MESSAGES: only sender or recipient can see/send
create policy "messages_select_participant" on messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());
create policy "messages_insert_sender" on messages
  for insert with check (sender_id = auth.uid());
create policy "messages_update_recipient" on messages
  for update using (recipient_id = auth.uid());

-- REVIEWS: public read; only the author can write/edit their own
create policy "reviews_select_all" on reviews for select using (true);
create policy "reviews_insert_author" on reviews for insert with check (author_id = auth.uid());
create policy "reviews_update_author" on reviews for update using (author_id = auth.uid());
create policy "reviews_delete_author_or_admin" on reviews for delete using (author_id = auth.uid() or public.is_admin());

-- NOTIFICATIONS: only the owning user
create policy "notifications_self" on notifications for all using (user_id = auth.uid());

-- Increment a property's view counter (called from the property detail page)
create or replace function public.increment_property_view(property_slug text)
returns void as $$
  update properties set view_count = view_count + 1 where slug = property_slug;
$$ language sql security definer;

-- ------------------------------------------------------------
-- LOYALTY / MEMBERSHIP SYSTEM
-- ------------------------------------------------------------
alter table profiles add column loyalty_points int not null default 0;

create table loyalty_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  points int not null,
  note text not null,
  created_by uuid references profiles(id), -- admin/owner who awarded it; null if system-generated
  created_at timestamptz not null default now()
);

create index loyalty_transactions_user_idx on loyalty_transactions(user_id);

-- Keep profiles.loyalty_points in sync whenever a transaction is added/removed
create or replace function public.refresh_loyalty_points()
returns trigger as $$
declare
  target_user_id uuid;
begin
  if TG_OP = 'DELETE' then
    target_user_id := old.user_id;
  else
    target_user_id := new.user_id;
  end if;

  update profiles p
  set loyalty_points = coalesce((
    select sum(points) from loyalty_transactions where user_id = target_user_id
  ), 0)
  where p.id = target_user_id;

  return null;
end;
$$ language plpgsql security definer;

create trigger loyalty_transactions_after_change
  after insert or update or delete on loyalty_transactions
  for each row execute procedure public.refresh_loyalty_points();

alter table loyalty_transactions enable row level security;

-- Users can read their own transaction history; admins can read all
create policy "loyalty_select_self_or_admin" on loyalty_transactions
  for select using (user_id = auth.uid() or public.is_admin());

-- Only admins (or property/service owners, for their own customers) can award points.
-- Kept simple for MVP: admin-only. Loosen this later if owners should award points directly.
create policy "loyalty_insert_admin" on loyalty_transactions
  for insert with check (public.is_admin());

-- ------------------------------------------------------------
-- STORAGE BUCKETS (run once; Supabase Storage)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('provider-images', 'provider-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
