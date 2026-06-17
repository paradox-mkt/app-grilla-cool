-- =========================================================================
-- First user becomes admin; subsequent users are editors.
-- Broaden brand/content/idea access so any authenticated user can use the app.
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_first boolean;
begin
  select count(*) = 0 into is_first from public.profiles;
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    case when is_first then 'admin'::public.app_role else 'editor'::public.app_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Open team workspace: any authenticated user can read/write brands, content_items, ideas.
drop policy if exists "brands_read_accessible" on public.brands;
drop policy if exists "brands_admin_all"       on public.brands;
drop policy if exists "brands_all_authed"      on public.brands;
create policy "brands_read_authed" on public.brands for select to authenticated using (true);
create policy "brands_write_authed" on public.brands for all to authenticated using (true) with check (true);

drop policy if exists "content_read_members"     on public.content_items;
drop policy if exists "content_insert_members"   on public.content_items;
drop policy if exists "content_update_own_admin" on public.content_items;
drop policy if exists "content_delete_own_admin" on public.content_items;
create policy "content_read_authed"   on public.content_items for select to authenticated using (true);
create policy "content_insert_authed" on public.content_items for insert to authenticated with check (user_id = auth.uid());
create policy "content_update_authed" on public.content_items for update to authenticated using (true) with check (true);
create policy "content_delete_authed" on public.content_items for delete to authenticated using (true);

drop policy if exists "ideas_read"   on public.ideas;
drop policy if exists "ideas_insert" on public.ideas;
drop policy if exists "ideas_update" on public.ideas;
drop policy if exists "ideas_delete" on public.ideas;
create policy "ideas_read_authed"   on public.ideas for select to authenticated using (true);
create policy "ideas_insert_authed" on public.ideas for insert to authenticated with check (user_id = auth.uid());
create policy "ideas_update_authed" on public.ideas for update to authenticated using (true) with check (true);
create policy "ideas_delete_authed" on public.ideas for delete to authenticated using (true);
