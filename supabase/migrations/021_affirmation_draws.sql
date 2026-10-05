-- 021_affirmation_draws.sql
-- Carte d'affirmation du jour (Note dev §3.4 + §4.1).
-- Le tirage est une donnée personnelle : une affirmation par utilisateur et par
-- jour, modifiable (« tirer une autre carte »), qui reste jusqu'au lendemain.
-- L'affirmation elle-même vient du contenu existant (mindset_content, kind='affirmation').

create table if not exists public.mindset_affirmation_draws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draw_date date not null,
  affirmation_id uuid not null references public.mindset_content(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, draw_date)
);

alter table public.mindset_affirmation_draws enable row level security;

drop policy if exists "affirmation_draws_select_own" on public.mindset_affirmation_draws;
create policy "affirmation_draws_select_own" on public.mindset_affirmation_draws
  for select using (auth.uid() = user_id);
drop policy if exists "affirmation_draws_insert_own" on public.mindset_affirmation_draws;
create policy "affirmation_draws_insert_own" on public.mindset_affirmation_draws
  for insert with check (auth.uid() = user_id);
drop policy if exists "affirmation_draws_update_own" on public.mindset_affirmation_draws;
create policy "affirmation_draws_update_own" on public.mindset_affirmation_draws
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "affirmation_draws_delete_own" on public.mindset_affirmation_draws;
create policy "affirmation_draws_delete_own" on public.mindset_affirmation_draws
  for delete using (auth.uid() = user_id);

create index if not exists idx_affirmation_draws_user
  on public.mindset_affirmation_draws (user_id, draw_date desc);
