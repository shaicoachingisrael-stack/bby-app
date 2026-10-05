-- 023_mindset_programs.sql
-- Programmes guidés Mindset (Note dev §3.7) — parcours de bien-être multi-jours.
-- Distincts des `programs`/`sessions` d'entraînement (fitness).
-- Contenu marque (admin + auto-traduit) + progression personnelle (RLS own-row).

-- ============================================================
-- 1. PROGRAMMES (contenu marque)
-- ============================================================
create table if not exists public.mindset_programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  subtitle text,
  description text,
  day_count int not null default 7,
  cover_url text,
  sort_order int not null default 0,
  i18n jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.mindset_programs enable row level security;
drop policy if exists "mindset_programs_read_all" on public.mindset_programs;
create policy "mindset_programs_read_all" on public.mindset_programs
  for select to authenticated using (true);
drop policy if exists "mindset_programs_admin_write" on public.mindset_programs;
create policy "mindset_programs_admin_write" on public.mindset_programs
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- ============================================================
-- 2. ÉTAPES (contenu marque) — une ou plusieurs par jour
-- ============================================================
create table if not exists public.mindset_program_steps (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.mindset_programs(id) on delete cascade,
  day_number int not null,
  kind text not null check (kind in ('breathing', 'affirmation', 'reading', 'journal_prompt', 'meditation')),
  ref_slug text,                                                          -- respiration (slug statique)
  ref_content_id uuid references public.mindset_content(id) on delete set null, -- affirmation/lecture/méditation
  title text,
  prompt_text text,
  sort_order int not null default 0,
  i18n jsonb default '{}'::jsonb
);

alter table public.mindset_program_steps enable row level security;
drop policy if exists "mindset_program_steps_read_all" on public.mindset_program_steps;
create policy "mindset_program_steps_read_all" on public.mindset_program_steps
  for select to authenticated using (true);
drop policy if exists "mindset_program_steps_admin_write" on public.mindset_program_steps;
create policy "mindset_program_steps_admin_write" on public.mindset_program_steps
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create index if not exists idx_program_steps
  on public.mindset_program_steps (program_id, day_number, sort_order);

-- ============================================================
-- 3. PROGRESSION (données cliente, RLS own-row)
-- ============================================================
create table if not exists public.mindset_program_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.mindset_programs(id) on delete cascade,
  current_day int not null default 1,
  started_at timestamptz default now(),
  last_activity_at timestamptz default now(),
  completed_at timestamptz,
  unique (user_id, program_id)
);

alter table public.mindset_program_progress enable row level security;
drop policy if exists "program_progress_select_own" on public.mindset_program_progress;
create policy "program_progress_select_own" on public.mindset_program_progress
  for select using (auth.uid() = user_id);
drop policy if exists "program_progress_insert_own" on public.mindset_program_progress;
create policy "program_progress_insert_own" on public.mindset_program_progress
  for insert with check (auth.uid() = user_id);
drop policy if exists "program_progress_update_own" on public.mindset_program_progress;
create policy "program_progress_update_own" on public.mindset_program_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "program_progress_delete_own" on public.mindset_program_progress;
create policy "program_progress_delete_own" on public.mindset_program_progress
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 4. SEED — 2 parcours (AVANT les triggers de traduction)
-- ============================================================
insert into public.mindset_programs (slug, title, subtitle, description, day_count, sort_order) values
  ('7-jours-mieux-dormir', 'Sept jours pour mieux dormir', 'Un soir après l''autre',
   'Un parcours doux pour préparer le corps et le mental au repos, soir après soir.', 7, 1),
  ('10-jours-ancrage', 'Dix jours d''ancrage', 'Revenir à soi',
   'Dix rendez-vous courts pour se reconnecter au présent et retrouver de la stabilité.', 10, 2)
on conflict (slug) do nothing;

-- Étapes "Sept jours pour mieux dormir" (respiration + journal chaque soir)
insert into public.mindset_program_steps (program_id, day_number, kind, ref_slug, title, prompt_text, sort_order)
select p.id, s.day_number, s.kind, s.ref_slug, s.title, s.prompt_text, s.sort_order
from public.mindset_programs p
cross join lateral (values
  (1, 'breathing', 'calm', 'Un souffle pour se déposer', null::text, 1),
  (1, 'journal_prompt', null, 'Un mot sur ta journée', 'Qu''est-ce que je peux déposer ce soir ?', 2),
  (2, 'breathing', '478', 'Ralentir le rythme', null, 1),
  (3, 'breathing', 'coherence', 'Cinq minutes de calme', null, 1),
  (3, 'journal_prompt', null, 'Gratitude du soir', 'Qu''est-ce qui m''a fait du bien aujourd''hui ?', 2),
  (4, 'breathing', '478', 'Préparer le sommeil', null, 1),
  (5, 'breathing', 'calm', 'Relâcher les épaules', null, 1),
  (6, 'breathing', 'box', 'S''ancrer avant la nuit', null, 1),
  (7, 'breathing', '478', 'Dernier souffle du parcours', null, 1),
  (7, 'journal_prompt', null, 'Ce que je garde', 'Qu''est-ce que je veux garder de ces sept jours ?', 2)
) as s(day_number, kind, ref_slug, title, prompt_text, sort_order)
where p.slug = '7-jours-mieux-dormir';

-- Étapes "Dix jours d'ancrage" (une pratique par jour)
insert into public.mindset_program_steps (program_id, day_number, kind, ref_slug, title, prompt_text, sort_order)
select p.id, s.day_number, s.kind, s.ref_slug, s.title, s.prompt_text, 1
from public.mindset_programs p
cross join lateral (values
  (1, 'breathing', 'box', 'Poser ses pieds', null::text),
  (2, 'journal_prompt', null, 'Écoute du corps', 'Qu''est-ce que je remarque dans mon corps en ce moment ?'),
  (3, 'breathing', 'coherence', 'Revenir au souffle', null),
  (4, 'journal_prompt', null, 'Besoin du moment', 'De quoi ai-je besoin, là, maintenant ?'),
  (5, 'breathing', 'box', 'Quatre temps égaux', null),
  (6, 'journal_prompt', null, 'Choisir son attention', 'Où est-ce que je choisis de poser mon attention aujourd''hui ?'),
  (7, 'breathing', 'calm', 'Relâcher', null),
  (8, 'journal_prompt', null, 'Petite fierté', 'Une chose, même minuscule, dont je suis fière.'),
  (9, 'breathing', 'coherence', 'Cinq minutes pour soi', null),
  (10, 'journal_prompt', null, 'Bilan doux', 'Qu''est-ce que je veux garder de ces dix jours ?')
) as s(day_number, kind, ref_slug, title, prompt_text)
where p.slug = '10-jours-ancrage';

-- ============================================================
-- 5. AUTO-TRADUCTION (après le seed, protégée — best-effort)
-- ============================================================
create or replace function public.trigger_translate_mindset_program()
returns trigger language plpgsql security definer as $$
begin
  begin
    perform public.schedule_translate_content('mindset_programs', new.id);
  exception when others then null;
  end;
  return new;
end;
$$;
drop trigger if exists translate_mindset_program on public.mindset_programs;
create trigger translate_mindset_program
  after insert or update on public.mindset_programs
  for each row execute function public.trigger_translate_mindset_program();

create or replace function public.trigger_translate_program_step()
returns trigger language plpgsql security definer as $$
begin
  begin
    perform public.schedule_translate_content('mindset_program_steps', new.id);
  exception when others then null;
  end;
  return new;
end;
$$;
drop trigger if exists translate_program_step on public.mindset_program_steps;
create trigger translate_program_step
  after insert or update on public.mindset_program_steps
  for each row execute function public.trigger_translate_program_step();
