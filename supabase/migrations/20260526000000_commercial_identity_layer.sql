-- ============================================================
-- 20260526000000 — Commercial Identity Layer (ADR-007)
--
-- Introduces the single source of truth for the operator's own
-- selling identity:
--   1. workspace_profile — what we sell (product category, value
--      prop) + onboarding state (folds in the cross-device onboarding
--      fix). One row per workspace.
--   2. signal_console_accounts.relationship_type — a competitor is an
--      account flagged 'competitor'. The competitive set is a view
--      over flagged accounts; no separate competitor table.
--
-- These seed the Briefing's category-specific intelligence:
--   product_category + value_prop (anchor) + ICP industries (queries)
--   + competitor-flagged accounts (watchlist source queries).
--
-- Ref: deliverables/adr/adr-007-commercial-identity-layer-2026-05-26.md
-- ============================================================

-- ────────────────────────────────────────────────────────────────────────
-- 1. workspace_profile — workspace-level commercial identity + onboarding
-- ────────────────────────────────────────────────────────────────────────

create table public.workspace_profile (
    workspace_id uuid primary key
        references public.workspaces(id) on delete cascade,
    -- Commercial identity (single source of truth; edited in ICP Studio).
    product_category text,
    what_we_sell text,
    value_prop text,
    -- Onboarding state — workspace-level fact, previously browser-bound
    -- (localStorage gtmos_onboarding). Folded here so it persists
    -- cross-device + a user isn't re-onboarded on a new device.
    onboarding_completed boolean not null default false,
    onboarding_answers jsonb not null default '{}'::jsonb,
    -- Forward-compat catch-all for workspace-level attributes that
    -- don't warrant their own column yet.
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger workspace_profile_set_updated_at
    before update on public.workspace_profile
    for each row execute function public.update_updated_at_column();

alter table public.workspace_profile enable row level security;

create policy workspace_profile_select_workspace on public.workspace_profile
    for select using (public.is_workspace_member(workspace_id));
create policy workspace_profile_insert_workspace on public.workspace_profile
    for insert with check (public.is_workspace_member(workspace_id));
create policy workspace_profile_update_workspace on public.workspace_profile
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy workspace_profile_delete_workspace on public.workspace_profile
    for delete using (public.is_workspace_member(workspace_id));

-- Realtime so cross-device edits (e.g. ICP Studio on laptop, briefing
-- on phone) flow without a refresh.
alter publication supabase_realtime add table public.workspace_profile;

comment on table public.workspace_profile is
    'Single source of truth for workspace-level commercial identity (product category, what we sell, value prop) + onboarding state. One row per workspace. Edited in ICP Studio; read by the Briefing. ADR-007.';

-- ────────────────────────────────────────────────────────────────────────
-- 2. signal_console_accounts.relationship_type — the competitive set
-- ────────────────────────────────────────────────────────────────────────

-- A competitor is an account flagged 'competitor'. The competitive
-- set is a view over flagged accounts — no separate competitor table,
-- no duplicate company names. Default 'prospect' preserves existing
-- rows' semantics (everything tracked today is a prospect/target).
alter table public.signal_console_accounts
    add column relationship_type text not null default 'prospect'
    check (relationship_type in ('prospect', 'competitor', 'partner', 'customer'));

create index signal_console_accounts_relationship_idx
    on public.signal_console_accounts(workspace_id, relationship_type);

comment on column public.signal_console_accounts.relationship_type is
    'prospect (default) | competitor | partner | customer. The competitive set = accounts flagged competitor. ADR-007.';
