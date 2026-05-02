-- BBY (Body by you) - initial schema
-- Run in Supabase SQL Editor (paste + Run).

-- 1) PROFILES (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  goal text check (goal in ('perte_de_poids','prise_de_masse','tonification','remise_en_forme','bien_etre')),
  fitness_level text check (fitness_level in ('debutant','intermediaire','avance')),
  daily_kcal_target int,
  protein_target_g int,
  hydration_target_ml int default 2500,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) PROGRAMS + SESSIONS (training)
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  duration_weeks int,
  level text check (level in ('debutant','intermediaire','avance')),
  cover_url text,
  created_at timestamptz default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade,
  title text not null,
  description text,
  duration_min int,
  video_url text,
  order_index int default 0,
  created_at timestamptz default now()
);

create table public.session_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  perceived_difficulty int check (perceived_difficulty between 1 and 5),
  created_at timestamptz default now()
);

alter table public.programs enable row level security;
alter table public.sessions enable row level security;
alter table public.session_completions enable row level security;

create policy "programs_read" on public.programs
  for select to authenticated using (true);
create policy "sessions_read" on public.sessions
  for select to authenticated using (true);

create policy "completions_select_own" on public.session_completions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "completions_insert_own" on public.session_completions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "completions_update_own" on public.session_completions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 3) NUTRITION
create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_at timestamptz not null default now(),
  meal_type text check (meal_type in ('petit_dejeuner','dejeuner','diner','collation')),
  title text,
  kcal int,
  protein_g int,
  carbs_g int,
  fat_g int,
  created_at timestamptz default now()
);

create table public.hydration_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ml int not null check (ml > 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz default now()
);

alter table public.meal_entries enable row level security;
alter table public.hydration_entries enable row level security;

create policy "meals_all_own" on public.meal_entries
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "hydration_all_own" on public.hydration_entries
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 4) MINDSET
create table public.mindset_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text check (kind in ('intention','journal','meditation_done','affirmation_seen')),
  body text,
  mood text check (mood in ('great','good','neutral','tired','low')),
  created_at timestamptz default now()
);

alter table public.mindset_entries enable row level security;
create policy "mindset_all_own" on public.mindset_entries
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 5) Indexes
create index meals_user_day on public.meal_entries (user_id, eaten_at desc);
create index hydration_user_day on public.hydration_entries (user_id, logged_at desc);
create index completions_user_day on public.session_completions (user_id, started_at desc);
create index mindset_user_day on public.mindset_entries (user_id, created_at desc);
