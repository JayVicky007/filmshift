alter table public.profiles enable row level security;
alter table public.posts enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "Allow individuals CRUD control over own posts" on public.posts;
drop policy if exists "Allow public read access to published posts" on public.posts;
drop policy if exists "Published posts are publicly readable" on public.posts;
drop policy if exists "Users can create their own posts" on public.posts;
drop policy if exists "Users can update their own posts" on public.posts;
drop policy if exists "Users can delete their own posts" on public.posts;

create policy "Profiles are publicly readable"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

revoke insert, update on public.profiles from public, anon, authenticated;

do $$
declare
  writable_columns text;
  insertable_columns text;
begin
  select string_agg(format('%I', column_name), ', ' order by ordinal_position)
  into writable_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = any (array['username', 'display_name', 'avatar_url', 'bio']);

  if writable_columns is not null then
    execute format(
      'grant update (%s) on table public.profiles to authenticated',
      writable_columns
    );
  end if;

  select string_agg(format('%I', column_name), ', ' order by ordinal_position)
  into insertable_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = any (array['id', 'username', 'display_name', 'avatar_url', 'bio']);

  if insertable_columns is not null then
    execute format(
      'grant insert (%s) on table public.profiles to authenticated',
      insertable_columns
    );
  end if;
end;
$$;

create policy "Published posts are publicly readable"
on public.posts
for select
to anon, authenticated
using (status = 'published' or auth.uid() = author_id);

create policy "Users can create their own posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = author_id);

create policy "Users can update their own posts"
on public.posts
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "Users can delete their own posts"
on public.posts
for delete
to authenticated
using (auth.uid() = author_id);

drop policy if exists "Users can upload their own avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;
drop policy if exists "Anyone can view avatars" on storage.objects;

create policy "Users can upload their own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Anyone can view avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'avatars';
