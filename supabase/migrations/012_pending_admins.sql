-- Pre-load admin emails. Anyone signing up with one of these emails is
-- automatically marked as admin in their profile.

create table if not exists public.pending_admins (
  email text primary key,
  added_at timestamptz default now()
);

-- Replace the new-user trigger function to also check pending_admins
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pre_admin boolean;
begin
  select exists(
    select 1 from public.pending_admins
    where lower(email) = lower(new.email)
  ) into pre_admin;

  insert into public.profiles (id, display_name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(pre_admin, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed: Shai is the owner / coach
insert into public.pending_admins (email)
values ('shai.nataf@gmail.com')
on conflict (email) do nothing;
