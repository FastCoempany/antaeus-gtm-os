-- ============================================================================
-- Migration 0001 — workspaces + workspace_members
-- ============================================================================
-- Introduces workspace-level scoping on top of the existing user-scoped schema.
-- Supports multi-workspace from day one (per ADR-001 §9 Q1). UI remains
-- single-workspace-per-user until a future decision; data model is ready for
-- expansion without schema migration.
--
-- Dependencies: auth.users (Supabase-managed, always present).
-- Depended on by: 0002 (backfill), 0003 (retrofit), 0004 (new tables), 0005 (RLS).
--
-- Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.1
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- workspaces
-- ----------------------------------------------------------------------------
-- The top-level tenant boundary. Every data row in every noun table carries
-- a workspace_id. Users join workspaces via workspace_members. A user can
-- belong to 0+ workspaces; a workspace can have 1+ members.
-- ----------------------------------------------------------------------------

create table if not exists public.workspaces (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique,
    owner_id uuid not null references auth.users(id) on delete restrict,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);

-- ----------------------------------------------------------------------------
-- workspace_members
-- ----------------------------------------------------------------------------
-- Junction table. Primary key (workspace_id, user_id) enforces one row per
-- user per workspace. Role determines permissions within the workspace
-- (owner = created it; admin = can manage members + data; member = data only).
-- Separate invited_at + joined_at to track acceptance flow when team features
-- are enabled later.
-- ----------------------------------------------------------------------------

create table if not exists public.workspace_members (
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'member' check (role in ('owner', 'admin', 'member')),
    invited_at timestamptz not null default now(),
    joined_at timestamptz,
    data jsonb not null default '{}'::jsonb,
    primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);

-- ----------------------------------------------------------------------------
-- Triggers: auto-update updated_at on workspaces
-- ----------------------------------------------------------------------------

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- RLS — workspaces
-- ----------------------------------------------------------------------------
-- A user can SELECT a workspace only if they are a member of it.
-- A user can INSERT a workspace only as the owner (owner_id = auth.uid()).
-- A user can UPDATE a workspace only if they are owner or admin.
-- A user can DELETE a workspace only if they are the owner.
-- ----------------------------------------------------------------------------

alter table public.workspaces enable row level security;

drop policy if exists "workspaces_select_members" on public.workspaces;
drop policy if exists "workspaces_insert_own" on public.workspaces;
drop policy if exists "workspaces_update_owner_admin" on public.workspaces;
drop policy if exists "workspaces_delete_owner" on public.workspaces;

create policy "workspaces_select_members" on public.workspaces
    for select using (
        id in (
            select workspace_id from public.workspace_members
            where user_id = (select auth.uid())
        )
    );

create policy "workspaces_insert_own" on public.workspaces
    for insert with check ((select auth.uid()) = owner_id);

create policy "workspaces_update_owner_admin" on public.workspaces
    for update using (
        id in (
            select workspace_id from public.workspace_members
            where user_id = (select auth.uid()) and role in ('owner', 'admin')
        )
    ) with check (
        id in (
            select workspace_id from public.workspace_members
            where user_id = (select auth.uid()) and role in ('owner', 'admin')
        )
    );

create policy "workspaces_delete_owner" on public.workspaces
    for delete using (
        id in (
            select workspace_id from public.workspace_members
            where user_id = (select auth.uid()) and role = 'owner'
        )
    );

-- ----------------------------------------------------------------------------
-- RLS — workspace_members
-- ----------------------------------------------------------------------------
-- A user can SELECT member rows for any workspace they belong to (so they can
-- see their teammates). A user can INSERT a member row only if they are an
-- owner/admin of the target workspace (team invite). A user can UPDATE/DELETE
-- their own row (leave workspace) or any row if they are owner/admin.
-- ----------------------------------------------------------------------------

alter table public.workspace_members enable row level security;

drop policy if exists "workspace_members_select_own_workspaces" on public.workspace_members;
drop policy if exists "workspace_members_insert_admin" on public.workspace_members;
drop policy if exists "workspace_members_update_self_or_admin" on public.workspace_members;
drop policy if exists "workspace_members_delete_self_or_admin" on public.workspace_members;

create policy "workspace_members_select_own_workspaces" on public.workspace_members
    for select using (
        workspace_id in (
            select workspace_id from public.workspace_members
            where user_id = (select auth.uid())
        )
    );

create policy "workspace_members_insert_admin" on public.workspace_members
    for insert with check (
        workspace_id in (
            select workspace_id from public.workspace_members
            where user_id = (select auth.uid()) and role in ('owner', 'admin')
        )
    );

create policy "workspace_members_update_self_or_admin" on public.workspace_members
    for update using (
        user_id = (select auth.uid())
        or workspace_id in (
            select workspace_id from public.workspace_members
            where user_id = (select auth.uid()) and role in ('owner', 'admin')
        )
    );

create policy "workspace_members_delete_self_or_admin" on public.workspace_members
    for delete using (
        user_id = (select auth.uid())
        or workspace_id in (
            select workspace_id from public.workspace_members
            where user_id = (select auth.uid()) and role in ('owner', 'admin')
        )
    );

-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------

grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
