-- ============================================================================
-- Migration 0005 — workspace-scoped RLS policies
-- ============================================================================
-- Drops the user_id-based "own row" policies that governed every data table
-- pre-Phase-2 and replaces them with workspace-membership policies. A row is
-- visible / writable if and only if the caller is a member of its workspace.
--
-- This is the one migration in Phase 2.1 that materially changes access
-- control semantics. Everything before it (0001–0004) was additive; this one
-- flips the gate. Once 0005 runs, a user who is not a member of a workspace
-- cannot see any data for that workspace — regardless of who owns the row.
--
-- Pre-migration invariant (provided by 0002 + 0003):
--   - every auth.users row has a default workspace
--   - every existing data row has its workspace_id set to that default
--   (this is mechanically true for now because every data table is 0 rows,
--    but the machinery would work even if it weren't)
--
-- Tables rewritten:
--   - icps
--   - deals
--   - sequences
--   - signal_console_accounts
--   - discovery_frameworks
--   - discovery_call_logs
--   - pipeline_settings     (if present)
--   - profiles              (special-cased — see below)
--   - studio_artifacts      (if present)
--
-- Tables with workspace-scoped policies added:
--   - proofs
--   - advisor_deployments
--   - readiness_snapshots
--   - handoff_artifacts
--
-- Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.1
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: is-member check. Used by every policy below. Created here (not in
-- 0001) because 0001 only needed inline queries; 0005 uses it on ~10 tables
-- and extracting it improves plan reuse.
-- ----------------------------------------------------------------------------

create or replace function public.is_workspace_member(w uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
    select exists (
        select 1
        from public.workspace_members
        where workspace_id = w
          and user_id = (select auth.uid())
    )
$$;

-- ----------------------------------------------------------------------------
-- Policy rewrite macro — applied per existing data table.
-- For each table T that has a workspace_id column, we:
--   1. Drop the legacy T_select_own / T_insert_own / T_update_own / T_delete_own
--      policies if they exist.
--   2. Create T_select_workspace / T_insert_workspace / T_update_workspace /
--      T_delete_workspace policies that key on workspace membership.
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
        'studio_artifacts'
    ];
    t text;
begin
    foreach t in array target_tables loop
        if not exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = t
        ) then
            raise notice 'Skipping RLS rewrite for % (table not present)', t;
            continue;
        end if;

        if not exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
              and table_name = t
              and column_name = 'workspace_id'
        ) then
            raise warning 'Skipping RLS rewrite for % (no workspace_id column — migration 0003 may have skipped it)', t;
            continue;
        end if;

        -- Ensure RLS is on (it should be already, but defensive)
        execute format('alter table public.%I enable row level security', t);

        -- Drop legacy user-scoped policies (idempotent via `if exists`)
        execute format('drop policy if exists "%s_select_own" on public.%I', t, t);
        execute format('drop policy if exists "%s_insert_own" on public.%I', t, t);
        execute format('drop policy if exists "%s_update_own" on public.%I', t, t);
        execute format('drop policy if exists "%s_delete_own" on public.%I', t, t);

        -- Drop workspace-scoped policies in case this migration is re-run
        execute format('drop policy if exists "%s_select_workspace" on public.%I', t, t);
        execute format('drop policy if exists "%s_insert_workspace" on public.%I', t, t);
        execute format('drop policy if exists "%s_update_workspace" on public.%I', t, t);
        execute format('drop policy if exists "%s_delete_workspace" on public.%I', t, t);

        execute format(
            'create policy "%s_select_workspace" on public.%I
             for select using (public.is_workspace_member(workspace_id))',
            t, t
        );
        execute format(
            'create policy "%s_insert_workspace" on public.%I
             for insert with check (public.is_workspace_member(workspace_id))',
            t, t
        );
        execute format(
            'create policy "%s_update_workspace" on public.%I
             for update using (public.is_workspace_member(workspace_id))
             with check (public.is_workspace_member(workspace_id))',
            t, t
        );
        execute format(
            'create policy "%s_delete_workspace" on public.%I
             for delete using (public.is_workspace_member(workspace_id))',
            t, t
        );

        raise notice 'Rewrote RLS for %', t;
    end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles — special case
-- ----------------------------------------------------------------------------
-- profiles carries workspace_id (added in 0003) but is also the row that
-- describes the user themselves. Access semantics: a user can always see
-- their own profile; they can also see profiles of anyone in a shared
-- workspace (so teammates are legible). Write access is restricted to the
-- profile owner — you cannot edit a teammate's profile.
-- ----------------------------------------------------------------------------

do $$
begin
    if exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'profiles'
    ) then
        alter table public.profiles enable row level security;

        drop policy if exists "profiles_select_own" on public.profiles;
        drop policy if exists "profiles_insert_own" on public.profiles;
        drop policy if exists "profiles_update_own" on public.profiles;
        drop policy if exists "profiles_delete_own" on public.profiles;
        drop policy if exists "profiles_select_self_or_teammate" on public.profiles;
        drop policy if exists "profiles_insert_self" on public.profiles;
        drop policy if exists "profiles_update_self" on public.profiles;
        drop policy if exists "profiles_delete_self" on public.profiles;

        create policy "profiles_select_self_or_teammate" on public.profiles
            for select using (
                user_id = (select auth.uid())
                or (workspace_id is not null and public.is_workspace_member(workspace_id))
            );

        create policy "profiles_insert_self" on public.profiles
            for insert with check (user_id = (select auth.uid()));

        create policy "profiles_update_self" on public.profiles
            for update using (user_id = (select auth.uid()))
            with check (user_id = (select auth.uid()));

        create policy "profiles_delete_self" on public.profiles
            for delete using (user_id = (select auth.uid()));

        raise notice 'Rewrote RLS for profiles (self-or-teammate select, self-only write)';
    end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- New noun tables (0004) — workspace-scoped policies
-- ----------------------------------------------------------------------------

-- proofs
drop policy if exists "proofs_select_workspace" on public.proofs;
drop policy if exists "proofs_insert_workspace" on public.proofs;
drop policy if exists "proofs_update_workspace" on public.proofs;
drop policy if exists "proofs_delete_workspace" on public.proofs;

create policy "proofs_select_workspace" on public.proofs
    for select using (public.is_workspace_member(workspace_id));
create policy "proofs_insert_workspace" on public.proofs
    for insert with check (public.is_workspace_member(workspace_id));
create policy "proofs_update_workspace" on public.proofs
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy "proofs_delete_workspace" on public.proofs
    for delete using (public.is_workspace_member(workspace_id));

-- advisor_deployments
drop policy if exists "advisor_deployments_select_workspace" on public.advisor_deployments;
drop policy if exists "advisor_deployments_insert_workspace" on public.advisor_deployments;
drop policy if exists "advisor_deployments_update_workspace" on public.advisor_deployments;
drop policy if exists "advisor_deployments_delete_workspace" on public.advisor_deployments;

create policy "advisor_deployments_select_workspace" on public.advisor_deployments
    for select using (public.is_workspace_member(workspace_id));
create policy "advisor_deployments_insert_workspace" on public.advisor_deployments
    for insert with check (public.is_workspace_member(workspace_id));
create policy "advisor_deployments_update_workspace" on public.advisor_deployments
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy "advisor_deployments_delete_workspace" on public.advisor_deployments
    for delete using (public.is_workspace_member(workspace_id));

-- readiness_snapshots — append-only; no update/delete policy
drop policy if exists "readiness_snapshots_select_workspace" on public.readiness_snapshots;
drop policy if exists "readiness_snapshots_insert_workspace" on public.readiness_snapshots;

create policy "readiness_snapshots_select_workspace" on public.readiness_snapshots
    for select using (public.is_workspace_member(workspace_id));
create policy "readiness_snapshots_insert_workspace" on public.readiness_snapshots
    for insert with check (public.is_workspace_member(workspace_id));

-- handoff_artifacts
drop policy if exists "handoff_artifacts_select_workspace" on public.handoff_artifacts;
drop policy if exists "handoff_artifacts_insert_workspace" on public.handoff_artifacts;
drop policy if exists "handoff_artifacts_update_workspace" on public.handoff_artifacts;
drop policy if exists "handoff_artifacts_delete_workspace" on public.handoff_artifacts;

create policy "handoff_artifacts_select_workspace" on public.handoff_artifacts
    for select using (public.is_workspace_member(workspace_id));
create policy "handoff_artifacts_insert_workspace" on public.handoff_artifacts
    for insert with check (public.is_workspace_member(workspace_id));
create policy "handoff_artifacts_update_workspace" on public.handoff_artifacts
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy "handoff_artifacts_delete_workspace" on public.handoff_artifacts
    for delete using (public.is_workspace_member(workspace_id));

-- ----------------------------------------------------------------------------
-- Post-migration note
-- ----------------------------------------------------------------------------
-- After this migration runs cleanly on the preview branch:
--   1. Verify with the helper query at the bottom of 0002 that every auth
--      user has exactly one owned workspace and one membership.
--   2. Manually test as one of the 4 real users that their data is still
--      visible (0 rows means "no data is visible" which is trivially true —
--      the real check is that an insert succeeds and the new row is readable
--      back).
--   3. Only then merge the preview branch into main.
--
-- The legacy root-level SQL files (supabase-workspace-persistence.sql,
-- supabase-rls-policies.sql, supabase-profiles-bootstrap.sql) should NOT be
-- re-applied after 0005 — they would re-create the user-scoped policies and
-- break the workspace gate. They are preserved in the repo as historical
-- reference; delete them once 0005 is merged into main and verified.
