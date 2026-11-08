-- 037 — Outils de la coach (novembre 2026)
-- 1. Notification à UNE cliente : la ligne d'historique ne doit être vue que par elle.
-- 2. Repères d'une cliente réglés par la coach : la coach peut lire / écrire
--    nutrition_targets, et ses valeurs ne sont plus écrasées par le calcul
--    automatique quand la cliente change son poids, son âge, etc.
-- Ajouts seulement : rien n'est supprimé, les versions déjà publiées continuent de marcher.

-- 1. Notifications ciblées -----------------------------------------------------
alter table public.notifications
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

drop policy if exists notifications_read_all on public.notifications;
drop policy if exists notifications_read_own_or_all on public.notifications;
create policy notifications_read_own_or_all on public.notifications
  for select using (user_id is null or user_id = (select auth.uid()) or public.is_admin());

-- 2. Repères réglés par la coach ------------------------------------------------
alter table public.nutrition_targets
  add column if not exists set_by_coach boolean not null default false;

drop policy if exists nutrition_targets_admin_select on public.nutrition_targets;
drop policy if exists nutrition_targets_admin_insert on public.nutrition_targets;
drop policy if exists nutrition_targets_admin_update on public.nutrition_targets;
create policy nutrition_targets_admin_select on public.nutrition_targets
  for select using (public.is_admin());
create policy nutrition_targets_admin_insert on public.nutrition_targets
  for insert with check (public.is_admin());
create policy nutrition_targets_admin_update on public.nutrition_targets
  for update using (public.is_admin()) with check (public.is_admin());

-- Le recalcul automatique saute les clientes dont la coach a fixé les repères.
create or replace function public.handle_profile_nutrition()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
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
    if exists (select 1 from public.nutrition_targets t where t.user_id = NEW.id and t.set_by_coach) then
      return NEW;
    end if;
    perform public.compute_nutrition_targets_for_user(NEW.id);
  end if;
  return NEW;
end;
$function$;
