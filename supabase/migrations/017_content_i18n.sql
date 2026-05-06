-- Per-content auto-translations stored as JSONB.
-- Shape: { en: { title, description, ... }, he: {...}, es: {...}, ru: {...} }
-- Source language is FR (existing columns); other locales are filled by the
-- `translate-content` edge function via OpenAI.

alter table public.programs        add column if not exists i18n jsonb default '{}'::jsonb;
alter table public.sessions        add column if not exists i18n jsonb default '{}'::jsonb;
alter table public.recipes         add column if not exists i18n jsonb default '{}'::jsonb;
alter table public.mindset_content add column if not exists i18n jsonb default '{}'::jsonb;

-- pg_net lets a trigger call an HTTP endpoint (the translate-content function).
create extension if not exists pg_net with schema extensions;

-- Helper that schedules an async POST to the translate-content function.
-- The function URL & service role key are kept in app config so we don't
-- hardcode secrets in the trigger.
create or replace function public.schedule_translate_content(
  p_table text,
  p_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_key text;
begin
  -- Read from custom GUC variables; set them once via:
  --   alter database postgres set app.translate_url = '...';
  --   alter database postgres set app.service_role_key = '...';
  v_url := current_setting('app.translate_url', true);
  v_key := current_setting('app.service_role_key', true);
  if v_url is null or v_key is null then
    return; -- not configured yet, skip silently
  end if;

  perform extensions.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object('table', p_table, 'id', p_id)
  );
end;
$$;

create or replace function public.trigger_translate_programs()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.title is distinct from old.title or new.description is distinct from old.description then
    perform public.schedule_translate_content('programs', new.id);
  end if;
  return new;
end;
$$;

create or replace function public.trigger_translate_sessions()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.title is distinct from old.title or new.description is distinct from old.description then
    perform public.schedule_translate_content('sessions', new.id);
  end if;
  return new;
end;
$$;

create or replace function public.trigger_translate_recipes()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT'
     or new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.ingredients is distinct from old.ingredients then
    perform public.schedule_translate_content('recipes', new.id);
  end if;
  return new;
end;
$$;

create or replace function public.trigger_translate_mindset()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.title is distinct from old.title or new.body is distinct from old.body then
    perform public.schedule_translate_content('mindset_content', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists translate_programs on public.programs;
create trigger translate_programs
  after insert or update on public.programs
  for each row execute function public.trigger_translate_programs();

drop trigger if exists translate_sessions on public.sessions;
create trigger translate_sessions
  after insert or update on public.sessions
  for each row execute function public.trigger_translate_sessions();

drop trigger if exists translate_recipes on public.recipes;
create trigger translate_recipes
  after insert or update on public.recipes
  for each row execute function public.trigger_translate_recipes();

drop trigger if exists translate_mindset on public.mindset_content;
create trigger translate_mindset
  after insert or update on public.mindset_content
  for each row execute function public.trigger_translate_mindset();
