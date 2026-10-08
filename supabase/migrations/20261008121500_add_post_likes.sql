create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_id_idx
  on public.post_likes (user_id);

alter table public.post_likes enable row level security;
revoke all on public.post_likes from public, anon, authenticated;
grant insert (post_id, user_id) on public.post_likes to authenticated;
grant delete on public.post_likes to authenticated;

drop policy if exists "Users can like published posts" on public.post_likes;
drop policy if exists "Users can remove their own post likes" on public.post_likes;

create policy "Users can like published posts"
on public.post_likes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.posts
    where posts.id = post_likes.post_id
      and posts.status = 'published'
  )
);

create policy "Users can remove their own post likes"
on public.post_likes
for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.get_post_like_summary(p_post_ids uuid[])
returns table (
  post_id uuid,
  like_count bigint,
  liked_by_me boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    posts.id,
    count(post_likes.user_id),
    coalesce(bool_or(post_likes.user_id = auth.uid()), false)
  from public.posts
  left join public.post_likes on post_likes.post_id = posts.id
  where posts.id = any(coalesce(p_post_ids, array[]::uuid[]))
    and posts.status = 'published'
  group by posts.id;
$$;

revoke all on function public.get_post_like_summary(uuid[]) from public;
grant execute on function public.get_post_like_summary(uuid[]) to anon, authenticated;
