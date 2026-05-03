-- Recipes catalog
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_url text,
  video_url text,
  meal_type text check (meal_type in ('petit_dejeuner','dejeuner','diner','collation')),
  prep_min int,
  kcal int,
  protein_g int,
  carbs_g int,
  fat_g int,
  ingredients text,
  created_at timestamptz default now()
);

alter table public.recipes enable row level security;

drop policy if exists "recipes_read_all" on public.recipes;
create policy "recipes_read_all" on public.recipes
  for select to authenticated using (true);

drop policy if exists "recipes_admin_write" on public.recipes;
create policy "recipes_admin_write" on public.recipes
  for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Mindset content catalog (meditations / articles / affirmations)
create table public.mindset_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('meditation', 'article', 'affirmation')),
  title text not null,
  body text,
  cover_url text,
  duration_min int,
  created_at timestamptz default now()
);

alter table public.mindset_content enable row level security;

drop policy if exists "mindset_content_read_all" on public.mindset_content;
create policy "mindset_content_read_all" on public.mindset_content
  for select to authenticated using (true);

drop policy if exists "mindset_content_admin_write" on public.mindset_content;
create policy "mindset_content_admin_write" on public.mindset_content
  for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Storage buckets for recipe + mindset media
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('recipe-media',  'recipe-media',  true, 100 * 1024 * 1024),
  ('mindset-media', 'mindset-media', true,  50 * 1024 * 1024)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "content_media_read" on storage.objects;
create policy "content_media_read" on storage.objects
  for select using (bucket_id in ('recipe-media', 'mindset-media'));

drop policy if exists "content_media_write" on storage.objects;
create policy "content_media_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('recipe-media', 'mindset-media')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "content_media_update" on storage.objects;
create policy "content_media_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('recipe-media', 'mindset-media')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "content_media_delete" on storage.objects;
create policy "content_media_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('recipe-media', 'mindset-media')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
