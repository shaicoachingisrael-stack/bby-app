-- Track whether the user has completed the onboarding wizard.
alter table public.profiles
  add column if not exists onboarded_at timestamptz;
