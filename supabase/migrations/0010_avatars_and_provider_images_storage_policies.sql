-- ============================================================
-- ROOMIO — PRODUCTION PATCH 4: STORAGE RLS FOR AVATARS & PROVIDER-IMAGES
-- Run in the Supabase SQL editor after 0001_initial_schema.sql.
--
-- schema.sql created the 'avatars' and 'provider-images' buckets as
-- public (public=true only affects reads — GET via the public URL
-- bypasses RLS), but never granted any INSERT/DELETE policy on
-- storage.objects for either one. Result: no one could ever upload a
-- profile avatar or a service-provider photo through the app.
--
-- Conventions (matching property-images / review-images):
--   avatars/<user_id>/<filename>            — owner is the user themselves
--   provider-images/<service_provider_id>/<filename> — owner is the listing's owner_id
-- ============================================================

-- ------------------------------------------------------------
-- avatars: a user may only write inside their own <user_id>/ folder
-- ------------------------------------------------------------
create policy "avatars_storage_insert_self"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_storage_update_self"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_storage_delete_self"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ------------------------------------------------------------
-- provider-images: owner (or admin) of the referenced service_providers row
-- ------------------------------------------------------------
create policy "provider_images_storage_insert_owner"
on storage.objects for insert
with check (
  bucket_id = 'provider-images'
  and exists (
    select 1 from public.service_providers sp
    where sp.id::text = (storage.foldername(name))[1]
      and (sp.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "provider_images_storage_delete_owner"
on storage.objects for delete
using (
  bucket_id = 'provider-images'
  and exists (
    select 1 from public.service_providers sp
    where sp.id::text = (storage.foldername(name))[1]
      and (sp.owner_id = auth.uid() or public.is_admin())
  )
);
