-- 032_menu_delete_account_fix.sql
-- CORRECTIF de 029. Quand un compte est supprimé, ses lignes de menu partent en
-- cascade ; le déclencheur menu_item_removed tentait alors de mettre à jour la
-- liste de courses d'une personne qui n'existe déjà plus → violation de clé
-- étrangère (23503) et la suppression du compte échouait pour toute cliente
-- ayant composé un menu. Si la personne n'existe plus, il n'y a rien à tenir à
-- jour : sa liste de courses part elle aussi en cascade.

create or replace function public.menu_item_removed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from auth.users u where u.id = old.user_id) then
    perform public.shopping_recipe_out(old.user_id, old.recipe_id);
  end if;
  return old;
end;
$$;
