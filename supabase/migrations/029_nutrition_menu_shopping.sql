-- 029_nutrition_menu_shopping.sql
-- Brief Nutrition de Shy §2, §3, §4 :
--   §3 recettes personnelles  → recipes.owner_id + recipes.steps
--   socle                     → recipe_ingredients (nom + quantité + unité + rayon)
--   §4 menu de la semaine     → menu_items (7 jours × créneaux)
--   §2 liste de courses       → shopping_items, alimentée par déclencheurs dès
--                               qu'une recette entre dans le menu ou en sort.

-- ============================================================
-- 1. RECETTES : propriétaire (null = recette BBY) + étapes
-- ============================================================
alter table public.recipes
  add column if not exists owner_id uuid references auth.users(id) on delete cascade,
  add column if not exists steps text;

create index if not exists idx_recipes_owner on public.recipes (owner_id);

-- Lecture : les recettes BBY + les siennes. Les recettes perso restent privées
-- (l'admin ne les voit pas non plus).
drop policy if exists "recipes_read_all" on public.recipes;
drop policy if exists "recipes_read" on public.recipes;
create policy "recipes_read" on public.recipes
  for select to authenticated
  using (owner_id is null or owner_id = auth.uid());

-- L'admin gère uniquement le catalogue BBY.
drop policy if exists "recipes_admin_write" on public.recipes;
create policy "recipes_admin_write" on public.recipes
  for all to authenticated
  using (owner_id is null and public.is_admin())
  with check (owner_id is null and public.is_admin());

drop policy if exists "recipes_owner_insert" on public.recipes;
create policy "recipes_owner_insert" on public.recipes
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "recipes_owner_update" on public.recipes;
create policy "recipes_owner_update" on public.recipes
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "recipes_owner_delete" on public.recipes;
create policy "recipes_owner_delete" on public.recipes
  for delete to authenticated using (owner_id = auth.uid());

-- Les recettes perso ne partent pas à la traduction automatique (contenu privé).
create or replace function public.trigger_translate_recipes()
returns trigger language plpgsql as $$
begin
  if new.owner_id is not null then
    return new;
  end if;
  if tg_op = 'INSERT'
     or new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.ingredients is distinct from old.ingredients
     or new.steps is distinct from old.steps then
    perform public.schedule_translate_content('recipes', new.id);
  end if;
  return new;
end;
$$;

-- ============================================================
-- 2. INGRÉDIENTS STRUCTURÉS
-- ============================================================
-- unit : g, kg, ml, cl, l, cas (c. à soupe), cac (c. à café) ; null = à la pièce.
-- aisle : rayon du magasin, sert à ranger la liste de courses.
create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position int not null default 0,
  name text not null,
  quantity numeric,
  unit text check (unit in ('g', 'kg', 'ml', 'cl', 'l', 'cas', 'cac')),
  aisle text check (aisle in ('fruits_legumes', 'viandes_poissons', 'cremerie', 'epicerie', 'surgeles', 'boissons', 'autre')),
  created_at timestamptz default now()
);

create index if not exists idx_recipe_ingredients_recipe
  on public.recipe_ingredients (recipe_id, position);

alter table public.recipe_ingredients enable row level security;

drop policy if exists "recipe_ingredients_read" on public.recipe_ingredients;
create policy "recipe_ingredients_read" on public.recipe_ingredients
  for select to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and (r.owner_id is null or r.owner_id = auth.uid())
  ));

drop policy if exists "recipe_ingredients_write" on public.recipe_ingredients;
create policy "recipe_ingredients_write" on public.recipe_ingredients
  for all to authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id
      and (r.owner_id = auth.uid() or (r.owner_id is null and public.is_admin()))
  ))
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_id
      and (r.owner_id = auth.uid() or (r.owner_id is null and public.is_admin()))
  ));

-- Reprise des recettes existantes : une ligne de l'ancien champ texte = un
-- ingrédient. « 150 g de saumon » → 150 / g / saumon ; « 1/2 avocat » → 0.5 / avocat ;
-- une ligne sans nombre devient un ingrédient sans quantité. Le champ texte reste
-- en place (rien n'est perdu), l'app lit désormais les lignes structurées.
insert into public.recipe_ingredients (recipe_id, position, name, quantity, unit)
select
  src.recipe_id,
  src.position,
  case when src.m is null then src.line else btrim(src.m[4]) end,
  case
    when src.m is null then null
    when src.m[2] is not null and src.m[2]::numeric <> 0 then round(src.m[1]::numeric / src.m[2]::numeric, 3)
    else replace(src.m[1], ',', '.')::numeric
  end,
  case when src.m is null then null else lower(src.m[3]) end
from (
  select
    r.id as recipe_id,
    l.ord::int as position,
    btrim(l.line) as line,
    regexp_match(
      btrim(l.line),
      '^(\d+(?:[.,]\d+)?)(?:\s*/\s*(\d+))?\s*(?:(kg|g|ml|cl|l)\M)?\s*(?:de\s+|d[''’]\s*)?(\S.*)$',
      'i'
    ) as m
  from public.recipes r
  cross join lateral regexp_split_to_table(r.ingredients, E'\n') with ordinality as l(line, ord)
  where r.ingredients is not null
    and btrim(l.line) <> ''
    and not exists (select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id)
) src;

-- ============================================================
-- 3. MENU DE LA SEMAINE
-- ============================================================
-- Un menu par personne : 7 jours (0 = lundi … 6 = dimanche) × créneaux de repas.
-- Composé à la main ou généré, toujours modifiable.
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day smallint not null check (day between 0 and 6),
  meal_type text not null check (meal_type in ('petit_dejeuner', 'dejeuner', 'diner', 'collation')),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_menu_items_user on public.menu_items (user_id, day);

alter table public.menu_items enable row level security;

drop policy if exists "menu_items_select_own" on public.menu_items;
create policy "menu_items_select_own" on public.menu_items
  for select using (auth.uid() = user_id);
-- On ne peut mettre au menu qu'une recette qu'on a le droit de voir.
drop policy if exists "menu_items_insert_own" on public.menu_items;
create policy "menu_items_insert_own" on public.menu_items
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id and (r.owner_id is null or r.owner_id = auth.uid())
    )
  );
drop policy if exists "menu_items_delete_own" on public.menu_items;
create policy "menu_items_delete_own" on public.menu_items
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 4. LISTE DE COURSES
-- ============================================================
-- Une ligne par ingrédient (même nom + même unité = une seule ligne, quantités
-- additionnées). unit est ramenée à une unité de base : g, ml, cas, cac ou ''.
-- refs = nombre de recettes du menu qui apportent cette ligne ; manual = ajoutée
-- à la main (elle ne disparaît pas quand une recette quitte le menu).
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  name_key text not null,
  unit text not null default '',
  quantity numeric,
  aisle text,
  checked boolean not null default false,
  manual boolean not null default false,
  refs int not null default 0,
  created_at timestamptz default now(),
  unique (user_id, name_key, unit)
);

alter table public.shopping_items enable row level security;

drop policy if exists "shopping_items_select_own" on public.shopping_items;
create policy "shopping_items_select_own" on public.shopping_items
  for select using (auth.uid() = user_id);
drop policy if exists "shopping_items_insert_own" on public.shopping_items;
create policy "shopping_items_insert_own" on public.shopping_items
  for insert with check (auth.uid() = user_id);
drop policy if exists "shopping_items_update_own" on public.shopping_items;
create policy "shopping_items_update_own" on public.shopping_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "shopping_items_delete_own" on public.shopping_items;
create policy "shopping_items_delete_own" on public.shopping_items
  for delete using (auth.uid() = user_id);

-- Clé de regroupement : minuscules, espaces resserrés.
create or replace function public.shopping_name_key(p_name text)
returns text language sql immutable as $$
  select lower(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')));
$$;

-- Ramène (quantité, unité) à l'unité de base : kg→g, cl/l→ml.
create or replace function public.shopping_base_quantity(p_quantity numeric, p_unit text)
returns numeric language sql immutable as $$
  select case p_unit
    when 'kg' then p_quantity * 1000
    when 'cl' then p_quantity * 10
    when 'l'  then p_quantity * 1000
    else p_quantity
  end;
$$;

create or replace function public.shopping_base_unit(p_unit text)
returns text language sql immutable as $$
  select case
    when p_unit in ('g', 'kg') then 'g'
    when p_unit in ('ml', 'cl', 'l') then 'ml'
    when p_unit in ('cas', 'cac') then p_unit
    else ''
  end;
$$;

-- La part d'une recette rejoint la liste d'une personne.
create or replace function public.shopping_recipe_in(p_user uuid, p_recipe uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.shopping_items as s (user_id, name, name_key, unit, quantity, aisle, refs)
  select
    p_user,
    min(i.name),
    public.shopping_name_key(i.name),
    public.shopping_base_unit(i.unit),
    sum(public.shopping_base_quantity(i.quantity, i.unit)),
    min(i.aisle),
    1
  from public.recipe_ingredients i
  where i.recipe_id = p_recipe
    and public.shopping_name_key(i.name) <> ''
  group by public.shopping_name_key(i.name), public.shopping_base_unit(i.unit)
  on conflict (user_id, name_key, unit) do update
    set quantity = nullif(coalesce(s.quantity, 0) + coalesce(excluded.quantity, 0), 0),
        aisle = coalesce(s.aisle, excluded.aisle),
        refs = s.refs + 1,
        checked = false;
$$;

-- La part d'une recette quitte la liste ; une ligne disparaît quand plus aucune
-- recette ne l'apporte (sauf si elle a été ajoutée à la main).
create or replace function public.shopping_recipe_out(p_user uuid, p_recipe uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.shopping_items s
    set quantity = nullif(greatest(coalesce(s.quantity, 0) - coalesce(c.quantity, 0), 0), 0),
        refs = greatest(s.refs - 1, 0)
  from (
    select
      public.shopping_name_key(i.name) as name_key,
      public.shopping_base_unit(i.unit) as unit,
      sum(public.shopping_base_quantity(i.quantity, i.unit)) as quantity
    from public.recipe_ingredients i
    where i.recipe_id = p_recipe
    group by 1, 2
  ) c
  where s.user_id = p_user and s.name_key = c.name_key and s.unit = c.unit and s.refs > 0;

  delete from public.shopping_items
  where user_id = p_user and refs <= 0 and manual = false;
$$;

-- Ces deux fonctions écrivent dans la liste de n'importe qui : elles ne doivent
-- être appelées que par les déclencheurs ci-dessous, jamais depuis l'app.
revoke execute on function public.shopping_recipe_in(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.shopping_recipe_out(uuid, uuid) from public, anon, authenticated;

create or replace function public.menu_item_added()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.shopping_recipe_in(new.user_id, new.recipe_id);
  return new;
end;
$$;

create or replace function public.menu_item_removed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.shopping_recipe_out(old.user_id, old.recipe_id);
  return old;
end;
$$;

drop trigger if exists menu_item_added on public.menu_items;
create trigger menu_item_added
  after insert on public.menu_items
  for each row execute function public.menu_item_added();

drop trigger if exists menu_item_removed on public.menu_items;
create trigger menu_item_removed
  before delete on public.menu_items
  for each row execute function public.menu_item_removed();

-- Une recette supprimée quitte d'abord tous les menus, tant que ses ingrédients
-- existent encore : sinon sa part resterait dans les listes de courses.
create or replace function public.recipe_leaves_menus()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.menu_items where recipe_id = old.id;
  return old;
end;
$$;

drop trigger if exists recipe_leaves_menus on public.recipes;
create trigger recipe_leaves_menus
  before delete on public.recipes
  for each row execute function public.recipe_leaves_menus();

-- Enregistre la liste d'ingrédients d'une recette d'un seul coup. Si la recette
-- est déjà dans des menus, les listes de courses concernées suivent : on retire
-- l'ancienne part, on remplace, on remet la nouvelle.
-- p_items : [{ "name": "...", "quantity": 150, "unit": "g", "aisle": "epicerie" }, …]
create or replace function public.replace_recipe_ingredients(p_recipe uuid, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
begin
  if not exists (
    select 1 from public.recipes r
    where r.id = p_recipe
      and (r.owner_id = auth.uid() or (r.owner_id is null and public.is_admin()))
  ) then
    raise exception 'not allowed';
  end if;

  for m in select user_id from public.menu_items where recipe_id = p_recipe loop
    perform public.shopping_recipe_out(m.user_id, p_recipe);
  end loop;

  delete from public.recipe_ingredients where recipe_id = p_recipe;
  insert into public.recipe_ingredients (recipe_id, position, name, quantity, unit, aisle)
  select
    p_recipe,
    (t.ord - 1)::int,
    btrim(t.item->>'name'),
    nullif(t.item->>'quantity', '')::numeric,
    nullif(t.item->>'unit', ''),
    nullif(t.item->>'aisle', '')
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(item, ord)
  where btrim(coalesce(t.item->>'name', '')) <> '';

  for m in select user_id from public.menu_items where recipe_id = p_recipe loop
    perform public.shopping_recipe_in(m.user_id, p_recipe);
  end loop;
end;
$$;

-- Ajout à la main : fusionne avec la ligne existante si l'article y est déjà.
create or replace function public.shopping_add_manual(
  p_name text,
  p_quantity numeric default null,
  p_unit text default null,
  p_aisle text default null
)
returns void
language plpgsql
as $$
begin
  if auth.uid() is null or public.shopping_name_key(p_name) = '' then
    return;
  end if;
  insert into public.shopping_items as s (user_id, name, name_key, unit, quantity, aisle, manual)
  values (
    auth.uid(),
    btrim(p_name),
    public.shopping_name_key(p_name),
    public.shopping_base_unit(p_unit),
    public.shopping_base_quantity(p_quantity, p_unit),
    p_aisle,
    true
  )
  on conflict (user_id, name_key, unit) do update
    set quantity = nullif(coalesce(s.quantity, 0) + coalesce(excluded.quantity, 0), 0),
        aisle = coalesce(s.aisle, excluded.aisle),
        manual = true,
        checked = false;
end;
$$;
