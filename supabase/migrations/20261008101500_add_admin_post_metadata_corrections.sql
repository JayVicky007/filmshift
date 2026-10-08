alter table public.notifications
  alter column comment_id drop not null,
  add column if not exists message text;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('comment_mention', 'admin_post_correction'));

create table if not exists public.post_metadata_corrections (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  post_title text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  previous_media_type text,
  new_media_type text not null,
  previous_tmdb_id integer,
  new_tmdb_id integer,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists post_metadata_corrections_created_at_idx
  on public.post_metadata_corrections (created_at desc);

alter table public.post_metadata_corrections enable row level security;
revoke all on public.post_metadata_corrections from public, anon, authenticated;
grant select on public.post_metadata_corrections to authenticated;

drop policy if exists "Admins can read post metadata correction history"
  on public.post_metadata_corrections;
create policy "Admins can read post metadata correction history"
on public.post_metadata_corrections
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can read all posts" on public.posts;
create policy "Admins can read all posts"
on public.posts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create or replace function public.admin_correct_post_metadata(
  p_post_id uuid,
  p_media_type text,
  p_tmdb_id integer,
  p_reason text
)
returns table (
  id uuid,
  title text,
  slug text,
  status text,
  media_type text,
  tmdb_id integer,
  author_id uuid,
  previous_media_type text,
  previous_tmdb_id integer,
  reason text,
  corrected_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_post public.posts%rowtype;
  previous_media_type text;
  previous_tmdb_id integer;
  normalized_reason text := btrim(p_reason);
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can correct post metadata.'
      using errcode = '42501';
  end if;

  if p_media_type is null or p_media_type not in ('movie', 'tv', 'general') then
    raise exception 'Choose Movie, TV Show, or General / Other.'
      using errcode = '22023';
  end if;

  if p_tmdb_id is not null and p_tmdb_id <= 0 then
    raise exception 'TMDB ID must be a positive integer.'
      using errcode = '22023';
  end if;

  if p_media_type = 'general' and p_tmdb_id is not null then
    raise exception 'General / Other posts cannot have a linked TMDB title.'
      using errcode = '22023';
  end if;

  if normalized_reason is null or char_length(normalized_reason) < 10
    or char_length(normalized_reason) > 500 then
    raise exception 'Provide a correction reason between 10 and 500 characters.'
      using errcode = '22023';
  end if;

  select *
  into target_post
  from public.posts
  where posts.id = p_post_id
  for update;

  if not found then
    raise exception 'Post not found.'
      using errcode = 'P0002';
  end if;

  if target_post.media_type is not distinct from p_media_type
    and target_post.tmdb_id is not distinct from p_tmdb_id then
    raise exception 'The selected metadata is already set on this post.'
      using errcode = '22023';
  end if;

  previous_media_type := target_post.media_type;
  previous_tmdb_id := target_post.tmdb_id;

  update public.posts
  set
    media_type = p_media_type,
    tmdb_id = p_tmdb_id,
    updated_at = now()
  where posts.id = p_post_id
  returning * into target_post;

  insert into public.post_metadata_corrections (
    post_id,
    post_title,
    actor_id,
    previous_media_type,
    new_media_type,
    previous_tmdb_id,
    new_tmdb_id,
    reason
  )
  values (
    target_post.id,
    target_post.title,
    auth.uid(),
    previous_media_type,
    target_post.media_type,
    previous_tmdb_id,
    target_post.tmdb_id,
    normalized_reason
  );

  insert into public.notifications (
    recipient_id,
    actor_id,
    comment_id,
    post_id,
    type,
    message
  )
  values (
    target_post.author_id,
    auth.uid(),
    null,
    target_post.id,
    'admin_post_correction',
    normalized_reason
  );

  return query
  select
    target_post.id,
    target_post.title,
    target_post.slug,
    target_post.status,
    target_post.media_type,
    target_post.tmdb_id,
    target_post.author_id,
    previous_media_type,
    previous_tmdb_id,
    normalized_reason,
    now();
end;
$$;

revoke all on function public.admin_correct_post_metadata(uuid, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.admin_correct_post_metadata(uuid, text, integer, text)
  to authenticated;
