-- User-selected interface language, synced across devices.
alter table public.profiles
  add column if not exists locale text
    check (locale in ('fr','en','he','es','ru'))
    default 'fr';
