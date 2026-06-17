-- =========================================================================
-- Paradox Content Grid — initial schema (self-hosted Supabase)
-- =========================================================================

create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('admin', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

-- profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  role        app_role not null default 'viewer',
  created_at  timestamptz not null default now()
);

-- brands
create table if not exists public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  color       text not null default '#01696f',
  description text,
  created_at  timestamptz not null default now()
);

-- brand_access
create table if not exists public.brand_access (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references public.brands(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (brand_id, user_id)
);
create index if not exists brand_access_user_idx  on public.brand_access(user_id);
create index if not exists brand_access_brand_idx on public.brand_access(brand_id);

-- content_items (extended Publication model)
create table if not exists public.content_items (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete restrict,
  title           text not null default '',
  description     text,
  date            date not null,
  format          text not null default 'post',
  status          text not null default 'draft',
  file_url        text,
  external_links  text[] not null default '{}',
  notes           text,
  objective       text,
  paid_type       text,
  campaign        text,
  image_text      text,
  copy            text,
  platforms       text[] not null default '{}',
  importance      text not null default 'relaxed',
  is_overdue      boolean not null default false,
  scheduled_at    timestamptz,
  publish_at      timestamptz,
  delivery_date   date,
  references_data jsonb not null default '[]'::jsonb,
  final_designs   jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists content_items_brand_idx on public.content_items(brand_id);
create index if not exists content_items_date_idx  on public.content_items(brand_id, date);

-- ideas
create table if not exists public.ideas (
  id                          uuid primary key default gen_random_uuid(),
  brand_id                    uuid not null references public.brands(id) on delete cascade,
  user_id                     uuid not null references public.profiles(id) on delete restrict,
  title                       text not null,
  description                 text,
  references_data             jsonb not null default '[]'::jsonb,
  converted_to_publication    boolean not null default false,
  converted_publication_id    uuid references public.content_items(id) on delete set null,
  created_at                  timestamptz not null default now()
);
create index if not exists ideas_brand_idx on public.ideas(brand_id);

-- share_tokens
create table if not exists public.share_tokens (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references public.brands(id) on delete cascade,
  token      text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists share_tokens_token_idx on public.share_tokens(token);

-- comments
create table if not exists public.comments (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  share_token_id  uuid references public.share_tokens(id) on delete set null,
  author_name     text not null,
  author_email    text,
  message         text not null,
  created_at      timestamptz not null default now()
);
create index if not exists comments_item_idx on public.comments(content_item_id);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.tg_set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'editor'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grants (PostgREST visibility)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles      to authenticated;
grant select, insert, update, delete on public.brands        to authenticated;
grant select, insert, update, delete on public.brand_access  to authenticated;
grant select, insert, update, delete on public.content_items to authenticated;
grant select, insert, update, delete on public.ideas         to authenticated;
grant select, insert, update, delete on public.share_tokens  to authenticated;
grant select, insert, update, delete on public.comments      to authenticated;
grant select on public.share_tokens  to anon;
grant select on public.brands        to anon;
grant select on public.content_items to anon;
grant select, insert on public.comments to anon;
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
