-- =========================================================================
-- Storage: content-files bucket + policies
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('content-files', 'content-files', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "content_files_public_read" on storage.objects;
drop policy if exists "content_files_auth_upload" on storage.objects;
drop policy if exists "content_files_owner_upd"   on storage.objects;
drop policy if exists "content_files_owner_del"   on storage.objects;

create policy "content_files_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'content-files');

create policy "content_files_auth_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'content-files');

create policy "content_files_owner_upd" on storage.objects
  for update to authenticated
  using (bucket_id = 'content-files' and owner = auth.uid())
  with check (bucket_id = 'content-files' and owner = auth.uid());

create policy "content_files_owner_del" on storage.objects
  for delete to authenticated
  using (bucket_id = 'content-files'
         and (owner = auth.uid() or public.has_role(auth.uid(),'admin')));
