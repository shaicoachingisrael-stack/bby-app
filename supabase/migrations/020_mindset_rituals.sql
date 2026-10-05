-- 020_mindset_rituals.sql
-- Rituels quotidiens (Note dev — Onglet Mindset, §3.6).
-- Catalogue suggéré par la marque (éditable admin + auto-traduit) + liste
-- personnelle de la cliente + historique des coches (reset naturel à minuit
-- via check_date). Pas de streak, pas de gamification (conforme Note dev).

-- ============================================================
-- 1. CATALOGUE (contenu marque, lecture-tous + écriture-admin, i18n)
-- ============================================================
create table if not exists public.mindset_ritual_catalog (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  icon text not null default 'circle',
  sort_order int not null default 0,
  i18n jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.mindset_ritual_catalog enable row level security;

drop policy if exists "ritual_catalog_read_all" on public.mindset_ritual_catalog;
create policy "ritual_catalog_read_all" on public.mindset_ritual_catalog
  for select to authenticated using (true);

drop policy if exists "ritual_catalog_admin_write" on public.mindset_ritual_catalog;
create policy "ritual_catalog_admin_write" on public.mindset_ritual_catalog
  for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ============================================================
-- 2. RITUELS PERSONNELS (données cliente, RLS own-row)
-- ============================================================
create table if not exists public.mindset_user_rituals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  icon text not null default 'circle',
  catalog_id uuid references public.mindset_ritual_catalog(id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.mindset_user_rituals enable row level security;

drop policy if exists "user_rituals_select_own" on public.mindset_user_rituals;
create policy "user_rituals_select_own" on public.mindset_user_rituals
  for select using (auth.uid() = user_id);
drop policy if exists "user_rituals_insert_own" on public.mindset_user_rituals;
create policy "user_rituals_insert_own" on public.mindset_user_rituals
  for insert with check (auth.uid() = user_id);
drop policy if exists "user_rituals_update_own" on public.mindset_user_rituals;
create policy "user_rituals_update_own" on public.mindset_user_rituals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_rituals_delete_own" on public.mindset_user_rituals;
create policy "user_rituals_delete_own" on public.mindset_user_rituals
  for delete using (auth.uid() = user_id);

create index if not exists idx_user_rituals_user
  on public.mindset_user_rituals (user_id, is_active, sort_order);

-- ============================================================
-- 3. HISTORIQUE DES COCHES (données cliente, RLS own-row)
-- ============================================================
create table if not exists public.mindset_ritual_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ritual_id uuid not null references public.mindset_user_rituals(id) on delete cascade,
  check_date date not null,
  created_at timestamptz default now(),
  unique (user_id, ritual_id, check_date)
);

alter table public.mindset_ritual_checks enable row level security;

drop policy if exists "ritual_checks_select_own" on public.mindset_ritual_checks;
create policy "ritual_checks_select_own" on public.mindset_ritual_checks
  for select using (auth.uid() = user_id);
drop policy if exists "ritual_checks_insert_own" on public.mindset_ritual_checks;
create policy "ritual_checks_insert_own" on public.mindset_ritual_checks
  for insert with check (auth.uid() = user_id);
drop policy if exists "ritual_checks_delete_own" on public.mindset_ritual_checks;
create policy "ritual_checks_delete_own" on public.mindset_ritual_checks
  for delete using (auth.uid() = user_id);

create index if not exists idx_ritual_checks_user_date
  on public.mindset_ritual_checks (user_id, check_date);

-- ============================================================
-- 4. SEED — catalogue suggéré (FR ; auto-traduit après déploiement fonction)
-- ============================================================
insert into public.mindset_ritual_catalog (label, icon, sort_order) values
  ('Boire un verre d''eau au réveil', 'droplet', 1),
  ('Prendre mes compléments', 'pill', 2),
  ('Marche de 10 minutes', 'footprints', 3),
  ('Douche froide', 'snowflake', 4),
  ('5 min d''étirements', 'wind', 5),
  ('Écran off 1h avant le coucher', 'moon', 6),
  ('Trois respirations conscientes', 'leaf', 7),
  ('Écrire une gratitude', 'heart', 8),
  ('Lumière du matin', 'sunrise', 9),
  ('Ranger un espace', 'sparkles', 10)
on conflict do nothing;

-- ============================================================
-- 5. AUTO-TRADUCTION (créée APRÈS le seed pour ne pas déclencher pg_net
--    pendant la migration). Protégée : une panne de traduction ne bloque
--    jamais l'écriture (best-effort, comme prévu par la Note dev multi-langue).
-- ============================================================
create or replace function public.trigger_translate_ritual_catalog()
returns trigger language plpgsql security definer as $$
begin
  begin
    perform public.schedule_translate_content('mindset_ritual_catalog', new.id);
  exception when others then
    -- best-effort : on n'échoue jamais l'insert/update à cause de la traduction
    null;
  end;
  return new;
end;
$$;

drop trigger if exists translate_ritual_catalog on public.mindset_ritual_catalog;
create trigger translate_ritual_catalog
  after insert or update on public.mindset_ritual_catalog
  for each row execute function public.trigger_translate_ritual_catalog();
