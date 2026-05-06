-- GUC parameters can't be set on Supabase by non-superusers.
-- Replace the GUC-based config with a private settings table that only
-- security-definer functions read.

create schema if not exists private;
revoke all on schema private from public, authenticated, anon;

create table if not exists private.config (
  key text primary key,
  value text not null
);
revoke all on private.config from public, authenticated, anon;

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
    return; -- not configured yet, skip silently
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object('table', p_table, 'id', p_id)
  );
end;
$$;
