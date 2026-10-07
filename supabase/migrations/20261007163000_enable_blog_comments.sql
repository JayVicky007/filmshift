create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_post_created_at_idx
  on public.comments (post_id, created_at);

create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references public.comments(id) on delete set null,
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  reported_comment_body text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create unique index if not exists comment_reports_reporter_comment_idx
  on public.comment_reports (reporter_id, comment_id)
  where comment_id is not null;

create index if not exists comment_reports_open_created_at_idx
  on public.comment_reports (created_at)
  where resolved_at is null;

alter table public.comments enable row level security;
alter table public.comment_reports enable row level security;

revoke all on public.comments from public, anon, authenticated;
revoke all on public.comment_reports from public, anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (post_id, author_id, body) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant update (is_removed) on public.comments to authenticated;
grant delete on public.comments to authenticated;
grant insert (comment_id, post_id, reporter_id, reason, details)
  on public.comment_reports to authenticated;
grant select on public.comment_reports to authenticated;
grant update (resolved_at, resolved_by) on public.comment_reports to authenticated;

drop policy if exists "Published post comments are publicly readable" on public.comments;
drop policy if exists "Users can comment on published posts" on public.comments;
drop policy if exists "Users can edit their own comments" on public.comments;
drop policy if exists "Admins can moderate comments" on public.comments;
drop policy if exists "Authors and admins can delete comments" on public.comments;
drop policy if exists "Admins can read comment reports" on public.comment_reports;
drop policy if exists "Users can report comments on published posts" on public.comment_reports;
drop policy if exists "Admins can resolve comment reports" on public.comment_reports;

create policy "Published post comments are publicly readable"
on public.comments
for select
to anon, authenticated
using (
  (
    not is_removed
    and exists (
      select 1
      from public.posts
      where posts.id = comments.post_id
        and posts.status = 'published'
    )
  )
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Users can comment on published posts"
on public.comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.posts
    where posts.id = comments.post_id
      and posts.status = 'published'
  )
);

create policy "Users can edit their own comments"
on public.comments
for update
to authenticated
using (
  author_id = auth.uid()
  and not is_removed
  and exists (
    select 1
    from public.posts
    where posts.id = comments.post_id
      and posts.status = 'published'
  )
)
with check (author_id = auth.uid() and not is_removed);

create policy "Admins can moderate comments"
on public.comments
for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Authors and admins can delete comments"
on public.comments
for delete
to authenticated
using (
  author_id = auth.uid()
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can read comment reports"
on public.comment_reports
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Users can report comments on published posts"
on public.comment_reports
for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and comment_id is not null
  and exists (
    select 1
    from public.comments
    join public.posts on posts.id = comments.post_id
    where comments.id = comment_reports.comment_id
      and comments.post_id = comment_reports.post_id
      and comments.author_id <> auth.uid()
      and not comments.is_removed
      and posts.status = 'published'
  )
);

create policy "Admins can resolve comment reports"
on public.comment_reports
for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  resolved_by = auth.uid()
  and (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
);

create or replace function public.enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_comment_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.author_id::text, 0));

  select count(*)
  into recent_comment_count
  from public.comments
  where author_id = new.author_id
    and created_at > now() - interval '10 minutes';

  if recent_comment_count >= 5 then
    raise exception 'Comment rate limit reached. Please wait before posting again.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.update_comment_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.body is distinct from old.body and old.author_id <> auth.uid() then
    raise exception 'You can only edit your own comment.'
      using errcode = '42501';
  end if;

  if new.is_removed is distinct from old.is_removed
    and not exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  then
    raise exception 'Only an admin can moderate a comment.'
      using errcode = '42501';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.snapshot_comment_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  comment_row public.comments%rowtype;
  recent_report_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.reporter_id::text, 1));

  select count(*)
  into recent_report_count
  from public.comment_reports
  where reporter_id = new.reporter_id
    and created_at > now() - interval '24 hours';

  if recent_report_count >= 20 then
    raise exception 'Report rate limit reached. Please try again later.'
      using errcode = 'P0001';
  end if;

  select *
  into comment_row
  from public.comments
  where id = new.comment_id
    and post_id = new.post_id
    and not is_removed;

  if not found then
    raise exception 'This comment is no longer available to report.'
      using errcode = 'P0001';
  end if;

  new.reported_comment_body = comment_row.body;
  return new;
end;
$$;

drop trigger if exists comments_rate_limit on public.comments;
create trigger comments_rate_limit
before insert on public.comments
for each row execute function public.enforce_comment_rate_limit();

drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at
before update on public.comments
for each row execute function public.update_comment_timestamp();

drop trigger if exists comment_reports_snapshot_and_rate_limit on public.comment_reports;
create trigger comment_reports_snapshot_and_rate_limit
before insert on public.comment_reports
for each row execute function public.snapshot_comment_report();
