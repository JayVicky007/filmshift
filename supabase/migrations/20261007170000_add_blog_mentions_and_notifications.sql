create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  comment_id uuid not null references public.comments(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  type text not null check (type = 'comment_mention'),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_id, comment_id, type)
);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_unread_recipient_idx
  on public.notifications (recipient_id)
  where read_at is null;

alter table public.notifications enable row level security;

revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

drop policy if exists "Users can read their own notifications" on public.notifications;
drop policy if exists "Users can mark their own notifications as read" on public.notifications;

create policy "Users can read their own notifications"
on public.notifications
for select
to authenticated
using (recipient_id = auth.uid());

create policy "Users can mark their own notifications as read"
on public.notifications
for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

create or replace function public.notify_comment_mentions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mentioned_profile record;
begin
  if tg_op = 'UPDATE' and new.body is not distinct from old.body then
    return new;
  end if;

  for mentioned_profile in
    select profiles.id, profiles.username
    from public.profiles
    where profiles.id <> new.author_id
      and profiles.username ~ '^[a-z0-9_-]{3,30}$'
      and new.body ~* (
        '(^|[^a-z0-9_-])@'
        || profiles.username
        || '([^a-z0-9_-]|$)'
      )
  loop
    insert into public.notifications (
      recipient_id,
      actor_id,
      comment_id,
      post_id,
      type
    )
    values (
      mentioned_profile.id,
      new.author_id,
      new.id,
      new.post_id,
      'comment_mention'
    )
    on conflict (recipient_id, comment_id, type) do nothing;
  end loop;

  return new;
end;
$$;

revoke all on function public.notify_comment_mentions() from public, anon, authenticated;

drop trigger if exists comments_notify_mentions_after_insert on public.comments;
create trigger comments_notify_mentions_after_insert
after insert on public.comments
for each row execute function public.notify_comment_mentions();

drop trigger if exists comments_notify_mentions_after_edit on public.comments;
create trigger comments_notify_mentions_after_edit
after update of body on public.comments
for each row
when (old.body is distinct from new.body)
execute function public.notify_comment_mentions();
