# Self-Hosted Supabase Setup

Migrations for the self-hosted Supabase backend powering Paradox Content Grid.

## Apply migrations

These are plain SQL files, ordered by filename. Apply with any of:

```bash
# Option A: Supabase CLI against your self-hosted DB
supabase db push --db-url "postgres://postgres:<password>@<your-host>:5432/postgres" \
  --include-all --workdir .

# Option B: psql
for f in db/migrations/*.sql; do
  psql "postgres://postgres:<password>@<host>:5432/postgres" -f "$f"
done
```

## Environment variables

Set on the app (Vite reads at build time):

```
VITE_SUPABASE_URL=https://supabase.your-domain.tld
VITE_SUPABASE_ANON_KEY=...
```

## What's included

- `20260606000001_init_schema.sql` — tables (`profiles`, `brands`, `brand_access`,
  `content_items`, `ideas`, `share_tokens`, `comments`), enums, updated_at
  trigger, auto-profile-on-signup trigger, grants.
- `20260606000002_rls_policies.sql` — `has_role` / `has_brand_access` security-
  definer helpers + all RLS policies.
- `20260606000003_storage.sql` — `content-files` public storage bucket + policies.

## First admin user

After signing up the first account, promote it to admin:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Subsequent users default to `editor`. Grant brand access via the admin panel
(Brands page → manage access) or directly:

```sql
insert into public.brand_access (brand_id, user_id, granted_by)
values ('<brand-uuid>', '<user-uuid>', '<admin-uuid>');
```
