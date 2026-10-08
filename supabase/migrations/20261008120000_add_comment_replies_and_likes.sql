alter table public.comments
  add column if not exists parent_id uuid
  references public.comments(id) on delete cascade;

create index if not exists comments_parent_created_at_idx
  on public.comments (parent_id, created_at)
  where parent_id is not null;

grant insert (parent_id) on public.comments to authenticated;

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_user_id_idx
  on public.comment_likes (user_id);

alter table public.comment_likes enable row level security;
revoke all on public.comment_likes from public, anon, authenticated;
grant insert (comment_id, user_id) on public.comment_likes to authenticated;
grant delete on public.comment_likes to authenticated;

drop policy if exists "Users can like published post comments" on public.comment_likes;
drop policy if exists "Users can remove their own comment likes" on public.comment_likes;

create policy "Users can like published post comments"
on public.comment_likes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.comments
    join public.posts on posts.id = comments.post_id
    where comments.id = comment_likes.comment_id
      and not comments.is_removed
      and posts.status = 'published'
  )
);

create policy "Users can remove their own comment likes"
on public.comment_likes
for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.get_comment_like_summary(p_comment_ids uuid[])
returns table (
  comment_id uuid,
  like_count bigint,
  liked_by_me boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    comments.id,
    count(comment_likes.user_id),
    coalesce(bool_or(comment_likes.user_id = auth.uid()), false)
  from public.comments
  join public.posts on posts.id = comments.post_id
  left join public.comment_likes on comment_likes.comment_id = comments.id
  where comments.id = any(coalesce(p_comment_ids, array[]::uuid[]))
    and not comments.is_removed
    and posts.status = 'published'
  group by comments.id;
$$;

revoke all on function public.get_comment_like_summary(uuid[]) from public;
grant execute on function public.get_comment_like_summary(uuid[]) to anon, authenticated;

create or replace function public.validate_comment_parent()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_comment public.comments%rowtype;
begin
  if new.parent_id is null then
    return new;
  end if;

  select *
  into parent_comment
  from public.comments
  where id = new.parent_id
    and not is_removed;

  if not found
    or parent_comment.post_id <> new.post_id
    or parent_comment.parent_id is not null then
    raise exception 'Replies must be attached to an active top-level comment on the same post.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_validate_parent on public.comments;
create trigger comments_validate_parent
before insert or update of parent_id, post_id on public.comments
for each row execute function public.validate_comment_parent();

create or replace function public.hide_replies_with_parent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_removed and not old.is_removed then
    update public.comments
    set is_removed = true
    where parent_id = new.id
      and not is_removed;
  end if;

  return new;
end;
$$;

drop trigger if exists comments_hide_replies_with_parent on public.comments;
create trigger comments_hide_replies_with_parent
after update of is_removed on public.comments
for each row execute function public.hide_replies_with_parent();

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('comment_mention', 'admin_post_correction', 'comment_reply'));

create or replace function public.notify_comment_reply()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  parent_author_id uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select author_id
  into parent_author_id
  from public.comments
  where id = new.parent_id
    and not is_removed;

  if parent_author_id is not null and parent_author_id <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, comment_id, post_id, type)
    values (parent_author_id, new.author_id, new.id, new.post_id, 'comment_reply')
    on conflict (recipient_id, comment_id, type) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.notify_comment_reply() from public, anon, authenticated;

drop trigger if exists comments_notify_reply_after_insert on public.comments;
create trigger comments_notify_reply_after_insert
after insert on public.comments
for each row execute function public.notify_comment_reply();
