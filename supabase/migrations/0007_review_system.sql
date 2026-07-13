-- ============================================================
-- ROOMIO — REVIEW SYSTEM PATCH
-- Run this in the Supabase SQL editor after schema.sql.
--
-- schema.sql already has a reviews table, RLS, and a trigger that
-- keeps service_providers.rating_avg/rating_count in sync — but there
-- was never an equivalent for properties (no rating columns at all),
-- no way to attach images to a review, and no constraint stopping a
-- user from submitting unlimited reviews for the same listing.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Average Rating / Review Count for properties
--    (mirrors the existing service_providers rating columns + trigger)
-- ------------------------------------------------------------
alter table properties add column if not exists rating_avg numeric(3,2) not null default 0;
alter table properties add column if not exists rating_count int not null default 0;

create or replace function public.refresh_property_rating()
returns trigger as $$
declare
  target_property_id uuid;
begin
  if TG_OP = 'DELETE' then
    target_property_id := old.property_id;
  else
    target_property_id := new.property_id;
  end if;

  update properties p
  set rating_count = sub.cnt,
      rating_avg = sub.avg_rating
  from (
    select property_id, count(*) cnt, avg(rating)::numeric(3,2) avg_rating
    from reviews
    where property_id = target_property_id
    group by property_id
  ) sub
  where p.id = sub.property_id;

  if not found and target_property_id is not null then
    update properties set rating_count = 0, rating_avg = 0 where id = target_property_id;
  end if;

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists reviews_property_after_insert_update on reviews;
create trigger reviews_property_after_insert_update
  after insert or update on reviews
  for each row when (new.property_id is not null)
  execute procedure public.refresh_property_rating();

drop trigger if exists reviews_property_after_delete on reviews;
create trigger reviews_property_after_delete
  after delete on reviews
  for each row when (old.property_id is not null)
  execute procedure public.refresh_property_rating();

-- ------------------------------------------------------------
-- 2) One review per user per listing
--    (unique constraints ignore NULLs, so a user can still hold one
--    property review AND one service-provider review at once)
-- ------------------------------------------------------------
alter table reviews add constraint reviews_author_property_unique unique (author_id, property_id);
alter table reviews add constraint reviews_author_provider_unique unique (author_id, service_provider_id);

-- ------------------------------------------------------------
-- 3) Review images
-- ------------------------------------------------------------
create table if not exists review_images (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references reviews(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table review_images enable row level security;

create policy "review_images_select_all" on review_images for select using (true);

create policy "review_images_manage_author" on review_images
  for all using (
    exists (select 1 from reviews r where r.id = review_id and (r.author_id = auth.uid() or public.is_admin()))
  );

insert into storage.buckets (id, name, public) values ('review-images', 'review-images', true)
  on conflict (id) do nothing;

-- Storage writes follow the same "<owning-row-id>/filename" convention as
-- property-images: ownership is checked against the review, not the file.
create policy "review_images_storage_insert_author"
on storage.objects for insert
with check (
  bucket_id = 'review-images'
  and exists (
    select 1 from reviews r
    where r.id::text = (storage.foldername(name))[1]
      and (r.author_id = auth.uid() or public.is_admin())
  )
);

create policy "review_images_storage_delete_author"
on storage.objects for delete
using (
  bucket_id = 'review-images'
  and exists (
    select 1 from reviews r
    where r.id::text = (storage.foldername(name))[1]
      and (r.author_id = auth.uid() or public.is_admin())
  )
);
