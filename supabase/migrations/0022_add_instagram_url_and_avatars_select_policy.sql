-- 0022_add_instagram_url_and_avatars_select_policy.sql
-- 1. Adds instagram_url to profiles for the editable profile page.
-- 2. Adds the missing SELECT policy for the avatars bucket. Without it,
--    Supabase Storage's upsert-on-upload flow (used by the profile photo
--    uploader) failed with a 42501 RLS violation, even though the INSERT
--    policy itself was correctly configured — upsert needs to check for an
--    existing object first, which requires SELECT visibility.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url text;

create policy "avatars_storage_select_all"
on storage.objects for select
to public
using (bucket_id = 'avatars');