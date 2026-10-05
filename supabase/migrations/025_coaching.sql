-- 025_coaching.sql
-- Offre premium « Ton coach perso » : Shy suit personnellement une cliente
-- (plan hybride assigné depuis le catalogue + quelques items custom + messagerie 1:1).
-- Le flag is_personal_coaching sera piloté plus tard par RevenueCat ; pour l'instant
-- Shy l'active à la main depuis l'admin.

-- ============================================================
-- 1. PROFIL : flag premium/perso + note privée du coach
-- ============================================================
alter table public.profiles
  add column if not exists is_personal_coaching boolean not null default false;
alter table public.profiles
  add column if not exists coaching_note text;
alter table public.profiles
  add column if not exists coaching_started_at timestamptz;

-- L'admin (Shy) doit pouvoir lister et gérer les profils de ses clientes.
-- IMPORTANT : une policy SUR profiles ne peut PAS faire un select sur profiles
-- (récursion infinie). On passe par une fonction SECURITY DEFINER qui contourne
-- la RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin = true);
$$;

-- (Les policies RLS sont permissives → ceci s'ajoute à profiles_select_own/update_own.)
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read" on public.profiles
  for select to authenticated using (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 2. PLAN PERSO — assignations (catalogue OU custom)
-- ============================================================
create table if not exists public.coaching_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  scheduled_date date,                                   -- jour prévu (null = « cette semaine / libre »)
  item_type text not null check (item_type in ('session', 'recipe', 'mindset', 'custom')),
  ref_id uuid,                                           -- id catalogue (sessions/recipes/mindset_content) ; null si custom
  title text,                                            -- libellé (custom, ou surcharge)
  description text,                                       -- pour un item custom
  video_url text,                                        -- pour un item custom
  coach_note text,                                       -- mot de Shy sur cette étape
  done boolean not null default false,
  done_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.coaching_assignments enable row level security;

-- La cliente voit et met à jour (coche « fait ») ses propres assignations.
drop policy if exists "assignments_select_own" on public.coaching_assignments;
create policy "assignments_select_own" on public.coaching_assignments
  for select using (auth.uid() = client_id);
drop policy if exists "assignments_update_own" on public.coaching_assignments;
create policy "assignments_update_own" on public.coaching_assignments
  for update using (auth.uid() = client_id) with check (auth.uid() = client_id);

-- Le coach (admin) gère toutes les assignations.
drop policy if exists "assignments_admin_all" on public.coaching_assignments;
create policy "assignments_admin_all" on public.coaching_assignments
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create index if not exists idx_coaching_assignments_client
  on public.coaching_assignments (client_id, scheduled_date, sort_order);

-- ============================================================
-- 3. MESSAGERIE 1:1 (cliente ↔ coach, async)
-- ============================================================
create table if not exists public.coaching_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,  -- identifie la conversation
  sender text not null check (sender in ('coach', 'client')),
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.coaching_messages enable row level security;

-- La cliente lit sa conversation et n'écrit que comme 'client'.
drop policy if exists "messages_select_own" on public.coaching_messages;
create policy "messages_select_own" on public.coaching_messages
  for select using (auth.uid() = client_id);
drop policy if exists "messages_insert_client" on public.coaching_messages;
create policy "messages_insert_client" on public.coaching_messages
  for insert with check (auth.uid() = client_id and sender = 'client');
drop policy if exists "messages_update_own" on public.coaching_messages;
create policy "messages_update_own" on public.coaching_messages
  for update using (auth.uid() = client_id) with check (auth.uid() = client_id);

-- Le coach (admin) lit/écrit toutes les conversations.
drop policy if exists "messages_admin_all" on public.coaching_messages;
create policy "messages_admin_all" on public.coaching_messages
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create index if not exists idx_coaching_messages_client
  on public.coaching_messages (client_id, created_at);
