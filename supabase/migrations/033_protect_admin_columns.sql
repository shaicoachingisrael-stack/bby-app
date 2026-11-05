-- 033_protect_admin_columns.sql
-- Faille trouvée le 05/11/2026 : la règle « profiles_update_own » (001) laissait une
-- cliente modifier TOUT son profil, y compris is_admin. Un simple
-- `update profiles set is_admin = true` lui ouvrait l'espace de la coach (profils,
-- conversations, contenus, push à toutes).
--
-- Les colonnes réservées à la coach ne bougent plus quand l'auteur n'est pas admin :
-- on remet l'ancienne valeur au lieu de refuser, pour que les mises à jour normales
-- du profil (prénom, langue, réglages) continuent de passer.
-- auth.uid() est nul pour le serveur (clé service, inscription) : laissé libre.

create or replace function public.protect_profile_admin_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_admin := false;
    new.is_personal_coaching := false;
    new.coaching_note := null;
  else
    new.is_admin := old.is_admin;
    new.is_personal_coaching := old.is_personal_coaching;
    new.coaching_note := old.coaching_note;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_admin_columns on public.profiles;
create trigger protect_profile_admin_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_admin_columns();

-- Messagerie coaching : une cliente peut marquer un message comme lu, mais ne peut
-- ni réécrire un message ni se faire passer pour la coach (sender = 'coach').
create or replace function public.protect_coaching_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.sender := old.sender;
  new.content := old.content;
  new.client_id := old.client_id;
  return new;
end;
$$;

drop trigger if exists protect_coaching_message on public.coaching_messages;
create trigger protect_coaching_message
  before update on public.coaching_messages
  for each row execute function public.protect_coaching_message();
