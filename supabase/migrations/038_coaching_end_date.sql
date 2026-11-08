-- 038_coaching_end_date.sql
-- Date de fin du coaching perso, fixée par Shaï dans la fiche de la cliente
-- (le paiement se fait hors de l'appli). Chaque matin, la base demande à la
-- fonction send-push de prévenir Shaï : 3 jours avant la fin, puis le jour de la fin.
-- L'accès n'est PAS coupé automatiquement : Shaï prolonge ou désactive elle-même.

alter table public.profiles
  add column if not exists coaching_ends_on date,
  -- dernière alerte envoyée pour cette date : 'soon' (J-3) ou 'end' (jour J)
  add column if not exists coaching_end_reminded text;

-- 1. Une cliente ne peut pas toucher à sa date de fin (même règle que 033).
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
    new.coaching_ends_on := null;
    new.coaching_end_reminded := null;
  else
    new.is_admin := old.is_admin;
    new.is_personal_coaching := old.is_personal_coaching;
    new.coaching_note := old.coaching_note;
    new.coaching_ends_on := old.coaching_ends_on;
    new.coaching_end_reminded := old.coaching_end_reminded;
  end if;
  return new;
end;
$$;

-- 2. Nouvelle date (ou coaching réactivé) : les alertes repartent de zéro.
--    Nom en « reset_… » : passe APRÈS protect_profile_admin_columns (ordre alphabétique).
create or replace function public.reset_coaching_end_reminded()
returns trigger
language plpgsql
as $$
begin
  if new.coaching_ends_on is distinct from old.coaching_ends_on
     or new.is_personal_coaching is distinct from old.is_personal_coaching then
    new.coaching_end_reminded := null;
  end if;
  return new;
end;
$$;

drop trigger if exists reset_coaching_end_reminded on public.profiles;
create trigger reset_coaching_end_reminded
  before update on public.profiles
  for each row execute function public.reset_coaching_end_reminded();

-- 3. Alertes dues aujourd'hui (heure d'Israël), marquées comme envoyées en même temps :
--    chaque alerte ne part qu'une fois. Réservé au serveur.
create or replace function public.claim_coaching_end_reminders()
returns table (id uuid, display_name text, ends_on date, stage text, days int)
language sql
security definer
set search_path = public
as $$
  with today as (select (now() at time zone 'Asia/Jerusalem')::date as d),
  due as (
    select p.id,
           case when p.coaching_ends_on <= t.d then 'end'
                when p.coaching_ends_on - t.d <= 3 then 'soon' end as stage,
           (p.coaching_ends_on - t.d) as days
    from public.profiles p, today t
    where p.is_personal_coaching and p.coaching_ends_on is not null
  )
  update public.profiles p
     set coaching_end_reminded = due.stage
    from due
   where p.id = due.id
     and due.stage is not null
     and p.coaching_end_reminded is distinct from due.stage
     -- 'end' déjà envoyé : on ne redescend pas à 'soon'
     and coalesce(p.coaching_end_reminded, '') <> 'end'
  returning p.id, p.display_name, p.coaching_ends_on, due.stage, due.days;
$$;

revoke all on function public.claim_coaching_end_reminders() from public, anon, authenticated;
grant execute on function public.claim_coaching_end_reminders() to service_role;

-- 4. Appel quotidien de send-push (adresse + mot de passe dans private.config).
create or replace function public.run_coaching_end_reminders()
returns void
language plpgsql
security definer
set search_path = public, net, private
as $$
declare
  v_url text;
  v_anon text;
  v_secret text;
begin
  select value into v_url from private.config where key = 'push_url';
  select value into v_anon from private.config where key = 'anon_key';
  select value into v_secret from private.config where key = 'cron_secret';
  if v_url is null or v_secret is null then
    return;
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_anon, ''),
      'x-cron-secret', v_secret
    ),
    body := jsonb_build_object('to', 'coach-reminders')
  );
end;
$$;

revoke all on function public.run_coaching_end_reminders() from public, anon, authenticated;

create extension if not exists pg_cron;
-- 6 h UTC = 8 h en Israël l'hiver, 9 h l'été.
select cron.schedule('bby-coaching-end-reminders', '0 6 * * *', $$ select public.run_coaching_end_reminders() $$);
