-- 024_mindset_favorites.sql
-- Favoris centralisés (Note dev §3.8) : la cliente marque des contenus
-- (affirmations / lectures / méditations = mindset_content) et des respirations
-- (patterns statiques identifiés par leur slug). Données personnelles, RLS own-row.

create table if not exists public.mindset_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('content', 'breathing')),
  item_id text not null,                 -- uuid de mindset_content OU slug de respiration
  created_at timestamptz default now(),
  unique (user_id, item_type, item_id)
);

alter table public.mindset_favorites enable row level security;

drop policy if exists "favorites_select_own" on public.mindset_favorites;
create policy "favorites_select_own" on public.mindset_favorites
  for select using (auth.uid() = user_id);
drop policy if exists "favorites_insert_own" on public.mindset_favorites;
create policy "favorites_insert_own" on public.mindset_favorites
  for insert with check (auth.uid() = user_id);
drop policy if exists "favorites_delete_own" on public.mindset_favorites;
create policy "favorites_delete_own" on public.mindset_favorites
  for delete using (auth.uid() = user_id);

create index if not exists idx_favorites_user on public.mindset_favorites (user_id, item_type);
