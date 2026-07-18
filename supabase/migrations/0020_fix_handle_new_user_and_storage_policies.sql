-- 0020_fix_handle_new_user_and_storage_policies.sql
-- Fixes applied directly on production during initial deployment (2026-07-18):
-- 1. handle_new_user trigger failed with "type user_role does not exist" when
--    called from the Auth service, because the function had no explicit
--    search_path and the calling context didn't include `public` schema.
-- 2. Storage RLS policies for property-images referenced the wrong table
--    alias in storage.foldername() — p.name (the property's display name,
--    e.g. "Sunshine Dormitory") instead of objects.name (the actual file
--    path being inserted/deleted), which made the folder-id match always
--    fail regardless of true ownership.

-- ------------------------------------------------------------
-- Fix 1: handle_new_user search_path
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data->>'role';
  safe_role public.user_role;
begin
  -- Only allow self-service signup as 'user', 'owner', or 'service_provider'.
  -- 'admin' can never be set through signup metadata — it must be granted manually in Supabase.
  if requested_role in ('owner', 'service_provider') then
    safe_role := requested_role::public.user_role;
  else
    safe_role := 'user'::public.user_role;
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
$$;

-- ------------------------------------------------------------
-- Fix 2: property-images storage policies
-- ------------------------------------------------------------
drop policy if exists "property_images_storage_insert_owner" on storage.objects;
drop policy if exists "property_images_storage_delete_owner" on storage.objects;
drop policy if exists "property_images_insert_own_folder" on storage.objects;

create policy "property_images_storage_insert_owner"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and exists (
    select 1 from properties p
    where p.id::text = (storage.foldername(objects.name))[1]
    and (p.owner_id = auth.uid() or is_admin())
  )
);

create policy "property_images_storage_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-images'
  and exists (
    select 1 from properties p
    where p.id::text = (storage.foldername(objects.name))[1]
    and (p.owner_id = auth.uid() or is_admin())
  )
);