-- 022_breathing_entries.sql
-- Autorise l'enregistrement des séances de respiration dans mindset_entries
-- (kind='breathing_done'), pour l'historique (Note dev §3.1 / §3.9).

alter table public.mindset_entries drop constraint if exists mindset_entries_kind_check;
alter table public.mindset_entries add constraint mindset_entries_kind_check
  check (kind in ('intention', 'journal', 'meditation_done', 'affirmation_seen', 'breathing_done'));
