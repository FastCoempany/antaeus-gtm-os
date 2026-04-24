-- ============================================================================
-- Migration 0006 — fix RLS recursion + add missing data columns
-- ============================================================================
-- Two corrective fixes uncovered during the Phase 2.3 live migration run.
--
-- ─── Fix 1: RLS recursion on workspace_members ──────────────────────────────
--
-- Previous state: is_workspace_member(uuid) and current_user_default_workspace_id()
-- were declared `security invoker` (migration 0005 / 0003). When the workspace-
-- scoped _workspace policies on other tables evaluate, they call is_workspace_member,
-- which queries workspace_members — which triggers the workspace_members_select_own_workspaces
-- policy — which itself queries workspace_members — infinite recursion.
-- Postgres detects this with SQLSTATE 42P17.
--
-- Fix: flip both helpers to SECURITY DEFINER. Their internal queries now run
-- with the definer's (superuser) permissions and bypass RLS — but they only
-- ever return a single boolean or uuid, so no data leaks out. This is the
-- canonical Postgres pattern for RLS helper functions.
--
-- Also rewrite the workspace_members_select_own_workspaces policy to use
-- the now-non-recursive helper instead of its original inline subquery.
--
-- ─── Fix 2: missing data columns on pipeline_settings + studio_artifacts ────
--
-- Migration 0003 (workspace_id retrofit) assumed every retrofit table had a
-- `data jsonb` column from the pre-existing schema. Most did. pipeline_settings
-- and studio_artifacts did not, and PostgREST refuses inserts that reference
-- missing columns (SQLSTATE PGRST204). Add `data jsonb not null default '{}'`
-- to both, idempotent via `add column if not exists`.
--
-- Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.3
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- Fix 1a — is_workspace_member: SECURITY INVOKER → SECURITY DEFINER
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.is_workspace_member(w uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.workspace_members
        where workspace_id = w
          and user_id = (select auth.uid())
    )
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Fix 1b — current_user_default_workspace_id: SECURITY INVOKER → SECURITY DEFINER
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.current_user_default_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select id
    from public.workspaces
    where owner_id = (select auth.uid())
    order by created_at asc
    limit 1
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Fix 1c — rewrite workspace_members_select_own_workspaces to use the helper
-- (no longer self-referential)
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "workspace_members_select_own_workspaces" on public.workspace_members;

create policy "workspace_members_select_own_workspaces" on public.workspace_members
    for select using (public.is_workspace_member(workspace_id));

-- ────────────────────────────────────────────────────────────────────────────
-- Fix 2 — add data jsonb to pipeline_settings + studio_artifacts
-- ────────────────────────────────────────────────────────────────────────────

alter table public.pipeline_settings
    add column if not exists data jsonb not null default '{}'::jsonb;

alter table public.studio_artifacts
    add column if not exists data jsonb not null default '{}'::jsonb;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification helpers (run ad-hoc after this migration)
-- ────────────────────────────────────────────────────────────────────────────
--
-- Confirm the two functions are SECURITY DEFINER now:
--
--   select proname, prosecdef
--   from pg_proc
--   where proname in ('is_workspace_member','current_user_default_workspace_id');
--   -- Expect: prosecdef = true for both rows.
--
-- Confirm pipeline_settings + studio_artifacts have data columns:
--
--   select table_name, column_name
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name in ('pipeline_settings','studio_artifacts')
--     and column_name = 'data';
--   -- Expect: 2 rows.
