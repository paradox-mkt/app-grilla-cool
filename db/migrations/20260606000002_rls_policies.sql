-- =========================================================================
-- Row Level Security
-- =========================================================================

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and role = _role)
$$;

create or replace function public.has_brand_access(_user_id uuid, _brand_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'admin')
      or exists (select 1 from public.brand_access where user_id = _user_id and brand_id = _brand_id)
$$;

create or replace function public.share_token_brand(_token text)
returns uuid language sql stable security definer set search_path = public as $$
  select brand_id from public.share_tokens
  where token = _token and is_active = true
    and (expires_at is null or expires_at > now())
  limit 1
$$;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;
grant execute on function public.has_brand_access(uuid, uuid)    to anon, authenticated;
grant execute on function public.share_token_brand(text)         to anon, authenticated;

alter table public.profiles      enable row level security;
alter table public.brands        enable row level security;
alter table public.brand_access  enable row level security;
alter table public.content_items enable row level security;
alter table public.ideas         enable row level security;
alter table public.share_tokens  enable row level security;
alter table public.comments      enable row level security;

-- profiles
drop policy if exists "profiles_self_read"   on public.profiles;
drop policy if exists "profiles_admin_read"  on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_admin_all"   on public.profiles;
create policy "profiles_self_read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_admin_read"  on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "profiles_self_update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all"   on public.profiles for all    to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- brands
drop policy if exists "brands_read_accessible"     on public.brands;
drop policy if exists "brands_read_public_token"   on public.brands;
drop policy if exists "brands_admin_all"           on public.brands;
create policy "brands_read_accessible" on public.brands for select to authenticated
  using (public.has_brand_access(auth.uid(), id));
create policy "brands_read_public_token" on public.brands for select to anon
  using (exists (select 1 from public.share_tokens s
                 where s.brand_id = brands.id and s.is_active
                   and (s.expires_at is null or s.expires_at > now())));
create policy "brands_admin_all" on public.brands for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- brand_access
drop policy if exists "brand_access_self_read" on public.brand_access;
drop policy if exists "brand_access_admin_all" on public.brand_access;
create policy "brand_access_self_read" on public.brand_access for select to authenticated using (user_id = auth.uid());
create policy "brand_access_admin_all" on public.brand_access for all    to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- content_items
drop policy if exists "content_read_members"     on public.content_items;
drop policy if exists "content_read_public"      on public.content_items;
drop policy if exists "content_insert_members"   on public.content_items;
drop policy if exists "content_update_own_admin" on public.content_items;
drop policy if exists "content_delete_own_admin" on public.content_items;
create policy "content_read_members" on public.content_items for select to authenticated
  using (public.has_brand_access(auth.uid(), brand_id));
create policy "content_read_public" on public.content_items for select to anon
  using (exists (select 1 from public.share_tokens s
                 where s.brand_id = content_items.brand_id and s.is_active
                   and (s.expires_at is null or s.expires_at > now())));
create policy "content_insert_members" on public.content_items for insert to authenticated
  with check (user_id = auth.uid() and public.has_brand_access(auth.uid(), brand_id));
create policy "content_update_own_admin" on public.content_items for update to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "content_delete_own_admin" on public.content_items for delete to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ideas
drop policy if exists "ideas_read"   on public.ideas;
drop policy if exists "ideas_insert" on public.ideas;
drop policy if exists "ideas_update" on public.ideas;
drop policy if exists "ideas_delete" on public.ideas;
create policy "ideas_read"   on public.ideas for select to authenticated using (public.has_brand_access(auth.uid(), brand_id));
create policy "ideas_insert" on public.ideas for insert to authenticated with check (user_id = auth.uid() and public.has_brand_access(auth.uid(), brand_id));
create policy "ideas_update" on public.ideas for update to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "ideas_delete" on public.ideas for delete to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- share_tokens
drop policy if exists "tokens_read_members" on public.share_tokens;
drop policy if exists "tokens_read_public"  on public.share_tokens;
drop policy if exists "tokens_manage"       on public.share_tokens;
create policy "tokens_read_members" on public.share_tokens for select to authenticated
  using (public.has_brand_access(auth.uid(), brand_id));
create policy "tokens_read_public" on public.share_tokens for select to anon
  using (is_active and (expires_at is null or expires_at > now()));
create policy "tokens_manage" on public.share_tokens for all to authenticated
  using (public.has_brand_access(auth.uid(), brand_id))
  with check (public.has_brand_access(auth.uid(), brand_id));

-- comments
drop policy if exists "comments_read_members" on public.comments;
drop policy if exists "comments_read_public"  on public.comments;
drop policy if exists "comments_insert_any"   on public.comments;
drop policy if exists "comments_admin_delete" on public.comments;
create policy "comments_read_members" on public.comments for select to authenticated
  using (exists (select 1 from public.content_items c
                 where c.id = comments.content_item_id
                   and public.has_brand_access(auth.uid(), c.brand_id)));
create policy "comments_read_public" on public.comments for select to anon
  using (exists (select 1 from public.content_items c
                 join public.share_tokens s on s.brand_id = c.brand_id
                 where c.id = comments.content_item_id and s.is_active
                   and (s.expires_at is null or s.expires_at > now())));
create policy "comments_insert_any" on public.comments for insert to anon, authenticated
  with check (share_token_id is not null and exists (
    select 1 from public.share_tokens s
    join public.content_items c on c.brand_id = s.brand_id
    where s.id = comments.share_token_id and c.id = comments.content_item_id
      and s.is_active and (s.expires_at is null or s.expires_at > now())
  ));
create policy "comments_admin_delete" on public.comments for delete to authenticated
  using (public.has_role(auth.uid(),'admin'));
