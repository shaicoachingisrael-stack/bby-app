-- Allow a user to delete their own auth.users row + all related data via RLS cascade.
-- Apple App Store requires a single-action account deletion flow.

create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated;
