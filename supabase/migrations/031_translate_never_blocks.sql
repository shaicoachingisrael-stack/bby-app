-- 031_translate_never_blocks.sql
-- CORRECTIF. schedule_translate_content() appelle net.http_post (pg_net). Sur ce
-- projet l'appel lève « XX000: Quote command returned error », et comme les
-- déclencheurs de traduction (programs, sessions, recipes, mindset_content…)
-- ne rattrapaient rien, l'erreur annulait l'enregistrement lui-même : impossible
-- de créer un contenu ou d'en modifier le titre depuis l'admin.
--
-- La traduction est un confort, jamais une condition : si l'envoi échoue, on le
-- note et on laisse l'enregistrement se faire. L'app demande de toute façon la
-- traduction elle-même après chaque sauvegarde (lib/translate-content.ts).

create or replace function public.schedule_translate_content(
  p_table text,
  p_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, net, private
as $$
declare
  v_url text;
  v_key text;
begin
  select value into v_url from private.config where key = 'translate_url';
  select value into v_key from private.config where key = 'service_role_key';
  if v_url is null or v_key is null then
    return; -- pas encore configuré
  end if;

  begin
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := jsonb_build_object('table', p_table, 'id', p_id)
    );
  exception when others then
    raise warning 'schedule_translate_content(%, %) : %', p_table, p_id, sqlerrm;
  end;
end;
$$;
