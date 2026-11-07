-- Refonte de novembre 2026 (spécifications de Shaï : Aujourd'hui, Nutrition, Mindset).
-- Uniquement des ajouts : la version déjà publiée continue de fonctionner.

-- Nutrition : affichage des calories et rythme du moment (perte de gras | maintien | prise de masse).
alter table public.profiles
  add column if not exists nutrition_show_calories boolean not null default true,
  add column if not exists nutrition_rhythm text not null default 'maintien'
    check (nutrition_rhythm in ('perte_de_gras', 'maintien', 'prise_de_masse'));

-- Journal : le bilan du soir guidé (trois victoires, gratitude, intention pour demain, autre chose).
alter table public.mindset_entries
  add column if not exists victories text[],
  add column if not exists gratitude text,
  add column if not exists tomorrow_intention text,
  add column if not exists other_text text,
  add column if not exists program_id uuid references public.mindset_programs(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

-- Rituels : l'ancrage (« Après avoir fini mon déjeuner… ») et l'origine parcours.
alter table public.mindset_user_rituals
  add column if not exists anchor text,
  add column if not exists program_id uuid references public.mindset_programs(id) on delete set null;

-- Parcours : structure d'un jour (phase, idée, question, geste, phrase à emporter).
alter table public.mindset_programs
  add column if not exists minutes_range text,
  add column if not exists for_you_if text,
  add column if not exists photo_url text;

alter table public.mindset_program_steps
  add column if not exists phase text check (phase in ('comprendre', 'essayer', 'ancrer')),
  add column if not exists idea text,
  add column if not exists gesture text,
  add column if not exists take_away text,
  add column if not exists minutes int;

-- Progression : réponses privées par jour, geste gardé (ancrage j4, secours j6, satisfaction j7).
alter table public.mindset_program_progress
  add column if not exists answers jsonb not null default '{}'::jsonb,
  add column if not exists anchor text,
  add column if not exists backup text,
  add column if not exists satisfaction_mark text,
  add column if not exists kept boolean not null default false,
  add column if not exists day_done_on date;

-- Phrases gardées (affirmation, phrase de parcours, page de journal).
create table if not exists public.saved_phrases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  source text not null check (source in ('affirmation', 'phrase_parcours', 'page_journal')),
  created_at timestamptz not null default now()
);
alter table public.saved_phrases enable row level security;
drop policy if exists saved_phrases_own on public.saved_phrases;
create policy saved_phrases_own on public.saved_phrases
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Repas notés (mode suivi) : lien optionnel vers la recette, quantité.
alter table public.meal_entries
  add column if not exists recipe_id uuid references public.recipes(id) on delete set null,
  add column if not exists quantity_label text;

-- Favoris de recettes.
create table if not exists public.recipe_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
alter table public.recipe_favorites enable row level security;
drop policy if exists recipe_favorites_own on public.recipe_favorites;
create policy recipe_favorites_own on public.recipe_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
