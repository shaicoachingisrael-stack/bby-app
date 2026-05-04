-- Broadcast notifications history (visible to every authenticated user)
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  data jsonb,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notifications_read_all" on public.notifications;
create policy "notifications_read_all" on public.notifications
  for select to authenticated using (true);

drop policy if exists "notifications_admin_write" on public.notifications;
create policy "notifications_admin_write" on public.notifications
  for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create index notifications_created_at on public.notifications (created_at desc);
