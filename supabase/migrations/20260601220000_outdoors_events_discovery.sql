-- 20260601220000_outdoors_events_discovery.sql
--
-- ADR-016 (2026-06-01): Outdoors Events room reframed from manual
-- tracker to discovery surface. This migration extends the existing
-- outdoors_events table with the discovery-pipeline columns and adds
-- the outdoors_events_runs ledger. PR 2 wires the actual discovery
-- pipeline; this migration prepares the schema.
--
-- Additive only — existing rows preserved. New columns are nullable
-- (legacy rows have NULL for relevance_tier etc.), so rollback is a
-- column-drop without data loss.

-- ─── outdoors_events: discovery columns ──────────────────────────────

alter table public.outdoors_events
    add column if not exists relevance_tier text
        check (relevance_tier in ('direct', 'adjacent', 'indirect')),
    add column if not exists relevance_reason text,
    add column if not exists discovered_at timestamptz,
    add column if not exists source_kind text
        check (source_kind in ('discovery_run', 'seed', 'manual') or source_kind is null),
    add column if not exists dedupe_key text,
    add column if not exists run_id uuid;

comment on column public.outdoors_events.relevance_tier is
    'ADR-016: direct (category match) | adjacent (persona match) | indirect (ICP presence). Null on legacy manual rows.';

comment on column public.outdoors_events.relevance_reason is
    'ADR-016: LLM-authored one-sentence justification; voice-gated. Null on legacy manual rows.';

comment on column public.outdoors_events.discovered_at is
    'ADR-016: when the discovery pipeline first surfaced this event. Null on manual rows.';

comment on column public.outdoors_events.source_kind is
    'ADR-016: discovery_run (pipeline) | seed (initial test data) | manual (operator-authored, deprecated post-ADR-016 PR 2).';

comment on column public.outdoors_events.dedupe_key is
    'ADR-016: workspace-scoped slug from name + start_date + city. Prevents duplicate surfacing across runs.';

comment on column public.outdoors_events.run_id is
    'ADR-016: the discovery run that produced this row. Null on legacy + manual.';

-- created_by becomes nullable for system-authored rows. (The original
-- migration already declared it nullable with a default of auth.uid();
-- this is documentation that system rows insert NULL deliberately.)

-- Indexes for the new grouping axis + dedupe lookups.
create index if not exists outdoors_events_workspace_tier_idx
    on public.outdoors_events (workspace_id, relevance_tier)
    where relevance_tier is not null;

create unique index if not exists outdoors_events_workspace_dedupe_idx
    on public.outdoors_events (workspace_id, dedupe_key)
    where dedupe_key is not null;

-- ─── outdoors_events_runs: discovery ledger ──────────────────────────

create table if not exists public.outdoors_events_runs (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    status text not null default 'running'
        check (status in ('running', 'completed', 'failed', 'throttled')),
    -- How many events the run actually wrote (post-dedupe, post-voice-gate).
    events_written integer not null default 0,
    -- Surfaced for cost telemetry on the room footer.
    total_cost_usd numeric(10, 4) not null default 0,
    -- LLM call count, useful for cost-ceiling enforcement.
    llm_call_count integer not null default 0,
    -- Operator-friendly summary of why the run ended (mostly empty on
    -- success; populated on failed / throttled).
    error_summary text,
    -- Snapshot of inputs to the run for audit-envelope reconstruction.
    -- {product_category, adjacency_seeds, query_plan, ...}
    inputs jsonb,
    created_at timestamptz not null default now()
);

comment on table public.outdoors_events_runs is
    'ADR-016: ledger of Outdoors Events discovery runs. One row per cron tick or operator-triggered refresh.';

create index if not exists outdoors_events_runs_workspace_started_idx
    on public.outdoors_events_runs (workspace_id, started_at desc);

alter table public.outdoors_events_runs enable row level security;

create policy outdoors_events_runs_select_workspace
    on public.outdoors_events_runs for select
    using (public.is_workspace_member(workspace_id));

-- Inserts + updates are service-role only — the discovery Edge Function
-- writes the ledger; operators never write to it directly. We expose
-- no insert/update/delete policy here, which means RLS denies writes
-- through the anon/authed keys; only the service-role bypass can write.

alter publication supabase_realtime add table public.outdoors_events_runs;

-- ─── Link outdoors_events.run_id → outdoors_events_runs.id ──────────

-- Add the FK only after the runs table exists. Nullable, so legacy
-- rows + manual rows don't need a runs row.
do $$
begin
    if not exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'outdoors_events_run_id_fkey'
          and table_name = 'outdoors_events'
    ) then
        alter table public.outdoors_events
            add constraint outdoors_events_run_id_fkey
            foreign key (run_id) references public.outdoors_events_runs(id)
            on delete set null;
    end if;
end$$;
