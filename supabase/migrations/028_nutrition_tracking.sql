-- 028_nutrition_tracking.sql
-- Brief Nutrition de Shy §1 : deux options, pas plus.
--   false (défaut) = SANS suivi : les macros s'affichent comme un simple repère,
--                    on ne compte rien, on ne coche rien.
--   true           = AVEC suivi : calories et macros suivies au fil de la journée.
-- La personne choisit dans ses réglages et peut changer d'avis à tout moment.

alter table public.profiles
  add column if not exists nutrition_tracking boolean not null default false;
