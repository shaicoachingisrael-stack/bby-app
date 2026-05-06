-- One-time backfill: schedule translation of every existing row in the
-- four translatable tables. Requires app.translate_url and
-- app.service_role_key to be set first.
--
-- Run this AFTER:
--   1. Migration 017 applied
--   2. Edge function `translate-content` deployed
--   3. GUC vars set:
--        alter database postgres set app.translate_url = 'https://<PROJECT>.supabase.co/functions/v1/translate-content';
--        alter database postgres set app.service_role_key = '<SERVICE_ROLE_KEY>';
--      (then disconnect & reconnect SQL editor for the GUC to take effect)

do $$
declare
  r record;
begin
  for r in select id from public.programs loop
    perform public.schedule_translate_content('programs', r.id);
  end loop;
  for r in select id from public.sessions loop
    perform public.schedule_translate_content('sessions', r.id);
  end loop;
  for r in select id from public.recipes loop
    perform public.schedule_translate_content('recipes', r.id);
  end loop;
  for r in select id from public.mindset_content loop
    perform public.schedule_translate_content('mindset_content', r.id);
  end loop;
end $$;
