alter table public.posts
  add column if not exists is_pinned boolean not null default false,
  add column if not exists pinned_at timestamptz;

create index if not exists posts_pinned_published_idx
  on public.posts (is_pinned desc, published_at desc)
  where status = 'published';

grant update (is_pinned, pinned_at) on public.posts to authenticated;

drop policy if exists "Admins can update published post pins" on public.posts;
create policy "Admins can update published post pins"
on public.posts
for update
to authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  status = 'published'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create or replace function public.enforce_admin_post_pinning()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_admin boolean;
begin
  if new.is_pinned is not distinct from old.is_pinned
    and new.pinned_at is not distinct from old.pinned_at then
    return new;
  end if;

  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
  into is_admin;

  if not is_admin then
    raise exception 'Only admins can pin or unpin posts.'
      using errcode = '42501';
  end if;

  if new.is_pinned then
    new.pinned_at = case
      when new.is_pinned is distinct from old.is_pinned or old.pinned_at is null
        then now()
      else old.pinned_at
    end;
  else
    new.pinned_at = null;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_admin_post_pinning() from public, anon, authenticated;

drop trigger if exists posts_enforce_admin_pinning on public.posts;
create trigger posts_enforce_admin_pinning
before update of is_pinned, pinned_at on public.posts
for each row execute function public.enforce_admin_post_pinning();
