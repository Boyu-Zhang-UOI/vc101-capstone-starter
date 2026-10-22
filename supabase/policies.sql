-- ============================================================================
-- supabase/policies.sql: the tables, grants and row-level security (RLS) for this app
-- ============================================================================
-- Run it in Supabase: SQL Editor -> New query -> paste this whole file -> Run.
-- It is safe to run again after you change it.
--
-- Every table that the browser uses needs THREE things, always together:
--
--   1. GRANT        lets the API roles reach the table at all. From 30 October 2026,
--                   Supabase no longer does this automatically for new tables. Without
--                   it you get "permission denied for table ...".
--   2. ENABLE RLS   from then on, every request is refused unless a policy allows it.
--   3. POLICIES     one rule per action (select, insert, update, delete): which rows.
--
-- A grant WITHOUT row-level security is the mistake behind the 2025-26 Supabase data
-- leaks. Never "fix" a permission-denied error by only adding a grant (and don't let an
-- AI agent do it either): add the grant, RLS and the policies in the same change.
--
-- The roles:
--   anon           anyone who has your publishable key, which means every visitor
--   authenticated  a visitor who has signed in (Supabase Auth)
--   service_role   the secret key. It skips RLS. It never goes in public/ or in a chat.
--
-- Two example patterns follow. Keep the one your app needs, rename the table and
-- columns, and delete the other. Then re-run your attack test (the RLS Attack Lab page)
-- against your real table.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Pattern A: a PUBLIC table (like a guestbook)
--   Anyone may read every row, and anyone may add a row of sensible length.
--   Nobody using the publishable key may change or delete rows.
--   Only use this for data you would be happy to see on a public notice board.
-- ----------------------------------------------------------------------------

create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  name       text        not null,
  message    text        not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Least privilege: take away everything, then grant only what the app uses.
revoke all on table public.messages from anon, authenticated;
grant select, insert on table public.messages to anon, authenticated;

drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages"
  on public.messages
  for select
  to anon, authenticated
  using ( true );  -- "true" = every row. Right only because every row is meant to be public.

drop policy if exists "Anyone can add a short message" on public.messages;
create policy "Anyone can add a short message"
  on public.messages
  for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 40
    and char_length(message) between 1 and 280
  );

-- No update or delete policy (and no grant): with RLS on, "no policy" means "no".


-- ----------------------------------------------------------------------------
-- Pattern B: PRIVATE rows, one owner each (like personal notes)
--   A signed-in user can read, add, change and delete only their own rows.
--   Visitors who are not signed in get nothing. Needs Supabase Auth (sign-in).
-- ----------------------------------------------------------------------------

create table if not exists public.notes (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  text       text        not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

revoke all on table public.notes from anon, authenticated;
grant select, insert, update, delete on table public.notes to authenticated;  -- not anon

-- auth.uid() is the signed-in user's id. Writing it as (select auth.uid()) lets the
-- database work it out once per request instead of once per row, which is what
-- Supabase's Advisors recommend.

drop policy if exists "Users can read their own notes" on public.notes;
create policy "Users can read their own notes"
  on public.notes
  for select
  to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "Users can add their own notes" on public.notes;
create policy "Users can add their own notes"
  on public.notes
  for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "Users can change their own notes" on public.notes;
create policy "Users can change their own notes"
  on public.notes
  for update
  to authenticated
  using ( (select auth.uid()) = user_id )        -- which rows they may change
  with check ( (select auth.uid()) = user_id );  -- and they can't give a row to someone else

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
  on public.notes
  for delete
  to authenticated
  using ( (select auth.uid()) = user_id );


-- ----------------------------------------------------------------------------
-- Only if a SERVER route (api/...) uses the secret key: from 30 October 2026 the
-- service_role needs a grant too. Uncomment and adjust. Never needed for the browser.
-- ----------------------------------------------------------------------------
-- grant select, insert, update, delete on table public.notes to service_role;


-- ----------------------------------------------------------------------------
-- Check your work: every table in the public schema, whether RLS is on, what the
-- browser roles may do, and how many policies it has. Any row with api_grants but
-- rls_enabled = false is a leak waiting to happen.
-- ----------------------------------------------------------------------------
select
  c.relname        as table_name,
  c.relrowsecurity as rls_enabled,
  (select string_agg(g.grantee || ': ' || g.privilege_type, ', ' order by g.grantee, g.privilege_type)
     from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.table_name = c.relname
      and g.grantee in ('anon', 'authenticated')) as api_grants,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;
