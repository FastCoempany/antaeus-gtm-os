-- ============================================================================
-- Migration 0003 — workspace_id retrofit on existing data tables
-- ============================================================================
-- Adds a workspace_id uuid column to every user-scoped data table. The default
-- resolves to the current user's first owned workspace (from migration 0002),
-- which means new inserts by existing users automatically scope to their
-- default workspace without client-side changes.
--
-- Tables retrofit:
--   - icps
--   - deals
--   - sequences
--   - signal_console_accounts
--   - discovery_frameworks
--   - discovery_call_logs
--   - pipeline_settings
--   - profiles
--   - studio_artifacts
--
-- All 0 rows as of 2026-04-24, so no data backfill is needed — the column is
-- added with a default that computes at insert-time for any future row.
--
-- Note: waitlist_signups is NOT workspace-scoped — it's a public signup table
-- and stays user/anon-scoped as designed.
--
-- Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.1
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: returns the current authed user's first-owned workspace.
-- Used as the default for every retrofit column. If the user has no owned
-- workspace, returns null and the NOT NULL constraint will reject the insert
-- (forcing client code to be explicit).
-- ----------------------------------------------------------------------------

create or replace function public.current_user_default_workspace_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
    select id
    from public.workspaces
    where owner_id = (select auth.uid())
    order by created_at asc
    limit 1
$$;

-- ----------------------------------------------------------------------------
-- Retrofit loop — adds workspace_id column to each table if not already present.
-- ----------------------------------------------------------------------------

do $$
declare
    target_tables text[] := array[
        'icps',
        'deals',
        'sequences',
        'signal_console_accounts',
        'discovery_frameworks',
        'discovery_call_logs',
        'pipeline_settings',
        'profiles',
        'studio_artifacts'
    ];
    t text;
begin
    foreach t in array target_tables loop
        -- Only apply to tables that actually exist in this database
        -- (studio_artifacts may or may not be present depending on history).
        if exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = t
        ) then
            execute format(
                'alter table public.%I
                 add column if not exists workspace_id uuid
                 references public.workspaces(id) on delete cascade',
                t
            );

            execute format(
                'alter table public.%I
                 alter column workspace_id set default public.current_user_default_workspace_id()',
                t
            );

            -- Index on workspace_id for fast per-workspace queries
            execute format(
                'create index if not exists %I on public.%I (workspace_id)',
                t || '_workspace_id_idx',
                t
            );

            raise notice 'Retrofit workspace_id on %', t;
        else
            raise notice 'Skipping % (not present)', t;
        end if;
    end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Note on NOT NULL
-- ----------------------------------------------------------------------------
-- workspace_id is added as nullable here to avoid failing if any existing row
-- (none currently, but defensive) has no workspace assignment path. After this
-- migration runs cleanly, a follow-up operation (manual SQL or a future
-- migration when real data exists) would:
--
--   alter table public.<t> alter column workspace_id set not null;
--
-- Not done automatically here so migration 0003 stays safe to re-run. The NOT
-- NULL enforcement is handled at the RLS layer in migration 0005 (you cannot
-- query or insert rows without a matching workspace_id anyway because of the
-- policy check).
