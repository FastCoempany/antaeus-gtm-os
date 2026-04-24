-- ============================================================================
-- Migration 0004 — new noun tables (proofs, advisor_deployments, readiness_snapshots, handoff_artifacts)
-- ============================================================================
-- Adds the four sacred nouns that were never persisted server-side in the
-- pre-Phase-2 schema. Prior to this migration, these objects lived only in
-- localStorage (PoC Framework, Advisor Deploy, Readiness Score, Handoff Kit).
--
-- All four tables are workspace-scoped from day one — workspace_id is NOT NULL
-- with a default resolving to the caller's first owned workspace (via the
-- helper installed in migration 0003). created_by is a pure audit trail and
-- not used for access control; RLS is by workspace membership, not user
-- ownership.
--
-- Ref: deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md §6 Subphase 2.1
-- ============================================================================

-- ----------------------------------------------------------------------------
-- proofs — PoC Framework
-- ----------------------------------------------------------------------------
-- One row per forged proof object. The room's "four molds" (claim, owner,
-- metric, kill rule) are first-class columns for query + indexing; everything
-- else (heat ledger, proof pack references, diagnosis) lives in data jsonb.
-- A proof may reference a deal; if the deal is deleted the proof survives
-- (set null) because the evidence it encodes can still be useful downstream.
-- ----------------------------------------------------------------------------

create table if not exists public.proofs (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    created_by uuid default (select auth.uid()) references auth.users(id) on delete set null,
    deal_id uuid references public.deals(id) on delete set null,
    claim text,
    claim_owner text,
    success_metric text,
    kill_rule text,
    outcome_state text not null default 'open'
        check (outcome_state in ('open', 'passed', 'failed', 'abandoned')),
    duration_days integer not null default 14 check (duration_days > 0),
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists proofs_workspace_id_idx on public.proofs (workspace_id);
create index if not exists proofs_deal_id_idx on public.proofs (deal_id);
create index if not exists proofs_outcome_state_idx on public.proofs (outcome_state);

drop trigger if exists proofs_set_updated_at on public.proofs;
create trigger proofs_set_updated_at
before update on public.proofs
for each row execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- advisor_deployments — Advisor Deploy
-- ----------------------------------------------------------------------------
-- One row per ask routed through external leverage (investor/advisor/customer).
-- Advisor identity is intentionally stored as free text for Phase 2 — we do
-- not model advisors as a first-class table yet, because the UI currently
-- treats the rolodex as per-workspace freeform. If/when advisors become
-- cross-workspace shareable, this column can be upgraded to an advisor_id fk.
-- ----------------------------------------------------------------------------

create table if not exists public.advisor_deployments (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    created_by uuid default (select auth.uid()) references auth.users(id) on delete set null,
    deal_id uuid references public.deals(id) on delete set null,
    advisor_name text,
    advisor_tier text check (advisor_tier in ('investor', 'advisor', 'customer', 'other', null)),
    ask_moment text,
    ask_text text,
    outcome_stamp text check (outcome_stamp in ('send', 'hold', 'reroute', null)),
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists advisor_deployments_workspace_id_idx on public.advisor_deployments (workspace_id);
create index if not exists advisor_deployments_deal_id_idx on public.advisor_deployments (deal_id);
create index if not exists advisor_deployments_outcome_idx on public.advisor_deployments (outcome_stamp);

drop trigger if exists advisor_deployments_set_updated_at on public.advisor_deployments;
create trigger advisor_deployments_set_updated_at
before update on public.advisor_deployments
for each row execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- readiness_snapshots — Readiness Score
-- ----------------------------------------------------------------------------
-- One row per point-in-time readiness calculation. Snapshots are append-only
-- by design — updates would defeat the purpose of tracking readiness over
-- time. A new calculation creates a new row; the "current" readiness is the
-- most recent row for the workspace.
--
-- dimension_scores is jsonb (not columns) because the 7 dimensions are a
-- product-layer concern that may evolve; we do not want schema churn every
-- time a dimension is added or renamed.
-- ----------------------------------------------------------------------------

create table if not exists public.readiness_snapshots (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    created_by uuid default (select auth.uid()) references auth.users(id) on delete set null,
    overall_score integer check (overall_score between 0 and 100),
    verdict text check (verdict in ('hire_ready', 'partial', 'thin')),
    dimension_scores jsonb not null default '{}'::jsonb,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists readiness_snapshots_workspace_id_idx on public.readiness_snapshots (workspace_id);
create index if not exists readiness_snapshots_workspace_created_idx
    on public.readiness_snapshots (workspace_id, created_at desc);

-- Note: no updated_at / trigger — snapshots are append-only.

-- ----------------------------------------------------------------------------
-- handoff_artifacts — Founding GTM / Handoff Kit
-- ----------------------------------------------------------------------------
-- One row per exportable handoff kit. Unlike readiness_snapshots (append-only
-- log), handoff_artifacts are mutable drafts — the user iterates on them,
-- adding proof + loss patterns + playbook section until exporting. The
-- exported_at column marks the snapshot moment; once exported, further edits
-- are allowed (but should produce a new row if the founder wants provenance).
-- Product layer decides whether to branch.
-- ----------------------------------------------------------------------------

create table if not exists public.handoff_artifacts (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    created_by uuid default (select auth.uid()) references auth.users(id) on delete set null,
    title text,
    sections jsonb not null default '{}'::jsonb,
    completeness_score integer check (completeness_score between 0 and 100),
    exported_at timestamptz,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists handoff_artifacts_workspace_id_idx on public.handoff_artifacts (workspace_id);
create index if not exists handoff_artifacts_exported_at_idx
    on public.handoff_artifacts (workspace_id, exported_at desc);

drop trigger if exists handoff_artifacts_set_updated_at on public.handoff_artifacts;
create trigger handoff_artifacts_set_updated_at
before update on public.handoff_artifacts
for each row execute function public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- RLS — enabled here; policies live in migration 0005 alongside the
-- workspace-scoped policy rewrite for the existing tables.
-- ----------------------------------------------------------------------------

alter table public.proofs enable row level security;
alter table public.advisor_deployments enable row level security;
alter table public.readiness_snapshots enable row level security;
alter table public.handoff_artifacts enable row level security;

-- ----------------------------------------------------------------------------
-- Grants — authenticated users only; anon has no business reading these.
-- ----------------------------------------------------------------------------

grant select, insert, update, delete on public.proofs to authenticated;
grant select, insert, update, delete on public.advisor_deployments to authenticated;
grant select, insert on public.readiness_snapshots to authenticated;  -- append-only
grant select, insert, update, delete on public.handoff_artifacts to authenticated;
