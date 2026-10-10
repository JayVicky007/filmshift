create or replace function public.admin_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can delete posts.'
      using errcode = '42501';
  end if;

  delete from public.posts
  where posts.id = p_post_id;

  if not found then
    raise exception 'Post not found.'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_delete_post(uuid)
  from public, anon, authenticated;
grant execute on function public.admin_delete_post(uuid)
  to authenticated;
