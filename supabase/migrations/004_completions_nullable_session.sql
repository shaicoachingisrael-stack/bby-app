-- Allow logging session completions without a real session row yet
-- (used while we don't have a seeded programs/sessions catalog).
alter table public.session_completions
  alter column session_id drop not null;
