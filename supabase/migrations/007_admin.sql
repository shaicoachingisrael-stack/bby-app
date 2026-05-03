-- Mark certain users as admin (coach Shai). Only admins can write to programs / sessions.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Admin write policies (read remains: any authenticated user can read).
drop policy if exists "programs_admin_write" on public.programs;
create policy "programs_admin_write" on public.programs
  for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "sessions_admin_write" on public.sessions;
create policy "sessions_admin_write" on public.sessions
  for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
