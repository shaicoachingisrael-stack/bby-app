-- Storage buckets for admin-uploaded program covers and session videos.
-- Public read so the user-facing app can stream without signed URLs.

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('program-covers', 'program-covers', true, 10 * 1024 * 1024),       -- 10 MB
  ('session-videos', 'session-videos', true, 200 * 1024 * 1024)       -- 200 MB
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "admin_media_read" on storage.objects;
create policy "admin_media_read" on storage.objects
  for select
  using (bucket_id in ('program-covers', 'session-videos'));

drop policy if exists "admin_media_write" on storage.objects;
create policy "admin_media_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('program-covers', 'session-videos')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "admin_media_update" on storage.objects;
create policy "admin_media_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('program-covers', 'session-videos')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "admin_media_delete" on storage.objects;
create policy "admin_media_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('program-covers', 'session-videos')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
