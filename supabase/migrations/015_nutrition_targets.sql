-- Module Nutrition: collected inputs + auto-computed targets via Mifflin-St Jeor.
-- Spec: BBY Module Nutrition v1.0 (mai 2026).

-- 1. Inputs collected during onboarding / editable from profile settings
alter table public.profiles
  add column if not exists sex text check (sex in ('female','male')),
  add column if not exists age int check (age between 16 and 90),
  add column if not exists height_cm int check (height_cm between 120 and 220),
  add column if not exists weight_kg numeric(5,1) check (weight_kg between 35 and 200),
  add column if not exists activity_level text check (activity_level in ('sedentary','light','moderate','active','very_active')),
  add column if not exists goal_intensity text check (goal_intensity in ('gentle','moderate','intense')),
  add column if not exists macro_split text check (macro_split in ('balanced','high_protein')) default 'balanced';

-- 2. Computed targets, one row per user
create table if not exists public.nutrition_targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bmr int,
  tdee int,
  calories int,
  protein_g int,
  carbs_g int,
  fats_g int,
  water_ml int,
  computed_at timestamptz default now()
);

alter table public.nutrition_targets enable row level security;

drop policy if exists "nutrition_targets_select_own" on public.nutrition_targets;
create policy "nutrition_targets_select_own" on public.nutrition_targets
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "nutrition_targets_insert_own" on public.nutrition_targets;
create policy "nutrition_targets_insert_own" on public.nutrition_targets
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "nutrition_targets_update_own" on public.nutrition_targets;
create policy "nutrition_targets_update_own" on public.nutrition_targets
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 3. Compute function — Mifflin-St Jeor + spec multipliers + health floors
create or replace function public.compute_nutrition_targets_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
  v_bmr numeric;
  v_activity_factor numeric;
  v_tdee numeric;
  v_multiplier numeric;
  v_calories numeric;
  v_floor numeric;
  v_protein_per_kg numeric;
  v_protein_g numeric;
  v_protein_kcal numeric;
  v_lipid_pct numeric;
  v_lipid_kcal numeric;
  v_lipid_g numeric;
  v_lipid_floor_g numeric;
  v_carbs_kcal numeric;
  v_carbs_g numeric;
  v_water_ml numeric;
  v_nutrition_goal text;
begin
  select * into p from public.profiles where id = p_user_id;

  if p.sex is null or p.age is null or p.height_cm is null or p.weight_kg is null
     or p.activity_level is null then
    return; -- inputs incomplete, skip silently
  end if;

  -- BMR Mifflin-St Jeor
  if p.sex = 'female' then
    v_bmr := 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161;
  else
    v_bmr := 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5;
  end if;

  v_activity_factor := case p.activity_level
    when 'sedentary' then 1.2
    when 'light' then 1.375
    when 'moderate' then 1.55
    when 'active' then 1.725
    when 'very_active' then 1.9
    else 1.2
  end;
  v_tdee := v_bmr * v_activity_factor;

  -- Map app goal -> nutrition goal
  v_nutrition_goal := case p.goal
    when 'perte_de_poids' then 'loss'
    when 'prise_de_masse' then 'gain'
    else 'maintenance'
  end;

  v_multiplier := case
    when v_nutrition_goal = 'loss' and p.goal_intensity = 'gentle' then 0.90
    when v_nutrition_goal = 'loss' and p.goal_intensity = 'moderate' then 0.80
    when v_nutrition_goal = 'loss' and p.goal_intensity = 'intense' then 0.75
    when v_nutrition_goal = 'gain' and p.goal_intensity = 'gentle' then 1.05
    when v_nutrition_goal = 'gain' and p.goal_intensity = 'moderate' then 1.10
    when v_nutrition_goal = 'gain' and p.goal_intensity = 'intense' then 1.15
    else 1.00
  end;

  v_calories := v_tdee * v_multiplier;

  -- Health floors
  v_floor := case when p.sex = 'female' then 1200 else 1500 end;
  if v_calories < v_floor then v_calories := v_floor; end if;
  if v_calories < v_bmr * 1.1 then v_calories := v_bmr * 1.1; end if;

  -- Proteins (g/kg)
  v_protein_per_kg := case
    when v_nutrition_goal = 'loss' and p.macro_split = 'high_protein' then 2.2
    when v_nutrition_goal = 'loss' then 2.0
    when v_nutrition_goal = 'maintenance' and p.macro_split = 'high_protein' then 2.0
    when v_nutrition_goal = 'maintenance' then 1.6
    when v_nutrition_goal = 'gain' and p.macro_split = 'high_protein' then 2.2
    when v_nutrition_goal = 'gain' then 1.8
    else 1.6
  end;
  v_protein_g := p.weight_kg * v_protein_per_kg;
  v_protein_kcal := v_protein_g * 4;

  -- Lipids
  v_lipid_pct := case when p.macro_split = 'high_protein' then 0.25 else 0.30 end;
  v_lipid_kcal := v_calories * v_lipid_pct;
  v_lipid_g := v_lipid_kcal / 9;
  -- Hormonal floor
  v_lipid_floor_g := p.weight_kg * 0.8;
  if v_lipid_g < v_lipid_floor_g then
    v_lipid_g := v_lipid_floor_g;
    v_lipid_kcal := v_lipid_g * 9;
  end if;

  -- Carbs (the rest)
  v_carbs_kcal := v_calories - v_protein_kcal - v_lipid_kcal;
  v_carbs_g := v_carbs_kcal / 4;
  if v_carbs_g < 0 then v_carbs_g := 0; end if;

  -- Hydration
  v_water_ml := p.weight_kg * 35;

  insert into public.nutrition_targets (
    user_id, bmr, tdee, calories, protein_g, carbs_g, fats_g, water_ml, computed_at
  ) values (
    p_user_id,
    round(v_bmr)::int,
    round(v_tdee)::int,
    round(v_calories)::int,
    round(v_protein_g)::int,
    round(v_carbs_g)::int,
    round(v_lipid_g)::int,
    round(v_water_ml)::int,
    now()
  )
  on conflict (user_id) do update set
    bmr = excluded.bmr,
    tdee = excluded.tdee,
    calories = excluded.calories,
    protein_g = excluded.protein_g,
    carbs_g = excluded.carbs_g,
    fats_g = excluded.fats_g,
    water_ml = excluded.water_ml,
    computed_at = excluded.computed_at;

  -- Mirror to legacy fields for backwards compat (existing UI reads these)
  update public.profiles
  set
    daily_kcal_target = round(v_calories)::int,
    protein_target_g = round(v_protein_g)::int,
    hydration_target_ml = round(v_water_ml)::int
  where id = p_user_id;
end;
$$;

-- 4. Trigger to recompute on profile insert/update
create or replace function public.handle_profile_nutrition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only recompute when one of the input fields actually changed.
  -- Prevents recursion (the function itself updates daily_kcal_target etc.)
  if TG_OP = 'INSERT' or (
    OLD.sex is distinct from NEW.sex or
    OLD.age is distinct from NEW.age or
    OLD.height_cm is distinct from NEW.height_cm or
    OLD.weight_kg is distinct from NEW.weight_kg or
    OLD.activity_level is distinct from NEW.activity_level or
    OLD.goal is distinct from NEW.goal or
    OLD.goal_intensity is distinct from NEW.goal_intensity or
    OLD.macro_split is distinct from NEW.macro_split
  ) then
    perform public.compute_nutrition_targets_for_user(NEW.id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_profile_compute_nutrition on public.profiles;
create trigger on_profile_compute_nutrition
  after insert or update on public.profiles
  for each row execute function public.handle_profile_nutrition();
