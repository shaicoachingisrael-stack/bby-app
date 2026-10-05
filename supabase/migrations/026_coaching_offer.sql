-- 026_coaching_offer.sql
-- Découverte + tarification du coaching perso.
-- Prix identique pour tout le monde, mais DÉGRESSIF selon la durée d'engagement
-- (formules éditables par Shy) + signal « intéressée ».

-- ============================================================
-- 1. PITCH DE L'OFFRE (une ligne, éditable par l'admin)
-- ============================================================
create table if not exists public.coaching_config (
  id text primary key default 'default',
  pitch text,
  perks text,                      -- une ligne = un bénéfice
  updated_at timestamptz default now()
);

insert into public.coaching_config (id, pitch, perks)
values (
  'default',
  'Un accompagnement rien que pour toi : ton programme sur-mesure, suivi et ajusté par Shy, avec une messagerie directe.',
  E'Programme 100% personnalisé\nSuivi et ajustements par Shy\nMessagerie directe avec ta coach\nRéponses à tes questions'
)
on conflict (id) do nothing;

alter table public.coaching_config enable row level security;
drop policy if exists "coaching_config_read" on public.coaching_config;
create policy "coaching_config_read" on public.coaching_config
  for select to authenticated using (true);
drop policy if exists "coaching_config_admin_write" on public.coaching_config;
create policy "coaching_config_admin_write" on public.coaching_config
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 2. FORMULES (par durée d'engagement) — éditables par l'admin
-- ============================================================
create table if not exists public.coaching_plans (
  id uuid primary key default gen_random_uuid(),
  months int not null,                    -- durée d'engagement (1, 3, 6, 12…)
  price_text text not null,               -- ex : « 149 €/mois »
  subtitle text,                          -- ex : « soit 447 € » / « -20% »
  highlighted boolean not null default false,  -- formule mise en avant
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.coaching_plans enable row level security;
drop policy if exists "coaching_plans_read" on public.coaching_plans;
create policy "coaching_plans_read" on public.coaching_plans
  for select to authenticated using (true);
drop policy if exists "coaching_plans_admin_write" on public.coaching_plans;
create policy "coaching_plans_admin_write" on public.coaching_plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Formules de départ (à ajuster par Shy dans l'admin)
insert into public.coaching_plans (months, price_text, subtitle, highlighted, sort_order)
values
  (1, '149 €/mois', 'Sans engagement', false, 1),
  (3, '129 €/mois', 'soit 387 € · -13%', true, 2),
  (6, '109 €/mois', 'soit 654 € · -27%', false, 3)
on conflict do nothing;

-- ============================================================
-- 3. SIGNAL D'INTÉRÊT (la cliente a levé la main)
-- ============================================================
alter table public.profiles
  add column if not exists coaching_interest boolean not null default false;
