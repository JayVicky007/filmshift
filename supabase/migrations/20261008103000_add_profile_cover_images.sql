-- Add a public, user-managed profile cover image.
alter table public.profiles
  add column if not exists cover_image_url text;

grant update (cover_image_url) on table public.profiles to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-covers',
  'profile-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view profile covers" on storage.objects;
drop policy if exists "Users can upload their own profile covers" on storage.objects;
drop policy if exists "Users can update their own profile covers" on storage.objects;
drop policy if exists "Users can delete their own profile covers" on storage.objects;

create policy "Anyone can view profile covers"
on storage.objects
for select
to public
using (bucket_id = 'profile-covers');

create policy "Users can upload their own profile covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own profile covers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own profile covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);
