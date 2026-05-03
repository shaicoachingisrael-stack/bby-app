-- Expo push tokens, one row per device per user
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_token text not null,
  platform text check (platform in ('ios', 'android', 'web')),
  device_name text,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, expo_token)
);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_own_select" on public.push_tokens;
create policy "push_tokens_own_select" on public.push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "push_tokens_own_insert" on public.push_tokens;
create policy "push_tokens_own_insert" on public.push_tokens
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "push_tokens_own_update" on public.push_tokens;
create policy "push_tokens_own_update" on public.push_tokens
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "push_tokens_own_delete" on public.push_tokens;
create policy "push_tokens_own_delete" on public.push_tokens
  for delete to authenticated using ((select auth.uid()) = user_id);

create index push_tokens_user on public.push_tokens (user_id);
