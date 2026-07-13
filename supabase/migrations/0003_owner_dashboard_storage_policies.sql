-- ============================================================
-- ROOMIO — OWNER DASHBOARD: STORAGE POLICIES
-- Run this in the Supabase SQL editor after schema.sql
-- (and after security_patch_critical.sql, if applied).
--
-- schema.sql creates the 'property-images' bucket as public, but public
-- only affects reads (GET via the public URL bypasses RLS). Writes
-- (INSERT/DELETE) to storage.objects still need explicit RLS policies,
-- and none exist yet — so property image uploads from the owner
-- dashboard would otherwise fail with a permission error.
--
-- Convention: uploaded files are stored at `<property_id>/<filename>`,
-- so ownership is checked by looking up the property that matches the
-- first path segment.
-- ============================================================

create policy "property_images_storage_insert_owner"
on storage.objects for insert
with check (
  bucket_id = 'property-images'
  and exists (
    select 1 from public.properties p
    where p.id::text = (storage.foldername(name))[1]
      and (p.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "property_images_storage_delete_owner"
on storage.objects for delete
using (
  bucket_id = 'property-images'
  and exists (
    select 1 from public.properties p
    where p.id::text = (storage.foldername(name))[1]
      and (p.owner_id = auth.uid() or public.is_admin())
  )
);
