-- Multi-video attachments for any content type (sessions, recipes, mindset).
-- Polymorphic via (parent_type, parent_id) so we can extend to programs etc. later.

create table public.media_attachments (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('session', 'recipe', 'mindset')),
  parent_id uuid not null,
  kind text not null check (kind in ('video', 'image')) default 'video',
  url text not null,
  title text,
  order_index int not null default 0,
  created_at timestamptz default now()
);

alter table public.media_attachments enable row level security;

drop policy if exists "media_attachments_read_all" on public.media_attachments;
create policy "media_attachments_read_all" on public.media_attachments
  for select to authenticated using (true);

drop policy if exists "media_attachments_admin_write" on public.media_attachments;
create policy "media_attachments_admin_write" on public.media_attachments
  for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create index media_attachments_parent
  on public.media_attachments (parent_type, parent_id, order_index);
