-- 030_ingredient_names_i18n.sql
-- Traduction des ingrédients. Plutôt que de traduire chaque ligne de chaque
-- recette, on tient un dictionnaire : un nom d'ingrédient = une entrée, traduite
-- une seule fois par la fonction translate-content. La fiche recette et la liste
-- de courses y lisent le nom dans la langue de l'utilisatrice.
-- Seules les recettes BBY alimentent le dictionnaire : une recette perso est
-- privée, son contenu ne part jamais à la traduction.

create table if not exists public.ingredient_names (
  id uuid primary key default gen_random_uuid(),
  name_key text not null unique,     -- même clé que la liste de courses (shopping_name_key)
  name text not null,                -- nom français tel que saisi la première fois
  i18n jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.ingredient_names enable row level security;

drop policy if exists "ingredient_names_read" on public.ingredient_names;
create policy "ingredient_names_read" on public.ingredient_names
  for select to authenticated using (true);
-- aucune policy d'écriture : seuls les déclencheurs (security definer) y écrivent.

-- Un ingrédient d'une recette BBY entre au dictionnaire s'il n'y est pas déjà.
create or replace function public.ingredient_name_register()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.shopping_name_key(new.name) <> ''
     and exists (select 1 from public.recipes r where r.id = new.recipe_id and r.owner_id is null) then
    insert into public.ingredient_names (name_key, name)
    values (public.shopping_name_key(new.name), btrim(new.name))
    on conflict (name_key) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists ingredient_name_register on public.recipe_ingredients;
create trigger ingredient_name_register
  after insert or update of name on public.recipe_ingredients
  for each row execute function public.ingredient_name_register();

drop trigger if exists translate_ingredient_name on public.ingredient_names;

-- Reprise : les ingrédients déjà en base (recettes BBY). Faite AVANT de poser le
-- déclencheur de traduction : ces entrées sont traduites ensuite par un appel
-- direct à la fonction, hors de cette transaction.
insert into public.ingredient_names (name_key, name)
select distinct on (public.shopping_name_key(i.name))
  public.shopping_name_key(i.name), btrim(i.name)
from public.recipe_ingredients i
join public.recipes r on r.id = i.recipe_id and r.owner_id is null
where public.shopping_name_key(i.name) <> ''
order by public.shopping_name_key(i.name), i.created_at
on conflict (name_key) do nothing;

-- Une nouvelle entrée du dictionnaire part à la traduction. La demande est un
-- appel réseau (pg_net) : s'il échoue, on l'ignore — l'entrée reste en français
-- et l'enregistrement de la recette n'est jamais bloqué.
create or replace function public.trigger_translate_ingredient_name()
returns trigger language plpgsql as $$
begin
  begin
    perform public.schedule_translate_content('ingredient_names', new.id);
  exception when others then
    raise warning 'translate ingredient_names %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists translate_ingredient_name on public.ingredient_names;
create trigger translate_ingredient_name
  after insert on public.ingredient_names
  for each row execute function public.trigger_translate_ingredient_name();
