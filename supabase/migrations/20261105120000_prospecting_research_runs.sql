-- Prospecting Desk research ledger (canon §4.6).
--
-- One row per paid web-research run from the Prospecting Desk room
-- ("Search the web" = action 'find', "Research companies you name" =
-- action 'research'). The prospecting-research Edge Function reads the
-- last seven days of total_cost_usd to enforce the per-workspace weekly
-- cost ceiling, and writes one row per run.
--
-- Additive only. Modeled on outdoors_events_runs
-- (20260601220000_outdoors_events_discovery.sql): workspace members can
-- read their workspace's rows; inserts + updates are service-role only
-- (no insert/update/delete policy, so RLS denies writes through the
-- anon/authenticated keys).

create table if not exists public.prospecting_research_runs (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    -- The seller who started the run (null for service-role runs).
    created_by uuid references auth.users(id) on delete set null,
    action text not null
        check (action in ('find', 'research')),
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    status text not null default 'running'
        check (status in ('running', 'completed', 'failed', 'throttled', 'paused')),
    -- Companies returned after the citation, dedupe and voice guards.
    results_count integer not null default 0,
    -- Web searches the model ran (billed per search on top of tokens).
    search_count integer not null default 0,
    total_cost_usd numeric(10, 4) not null default 0,
    llm_call_count integer not null default 0,
    error_summary text,
    -- What the seller asked for: description, ICP / focus context,
    -- companies named, how many names were excluded, throttled flag.
    inputs jsonb,
    created_at timestamptz not null default now()
);

comment on table public.prospecting_research_runs is
    'Prospecting Desk: ledger of on-demand cited web-research runs (find + research). Drives the weekly cost ceiling.';

create index if not exists prospecting_research_runs_workspace_started_idx
    on public.prospecting_research_runs (workspace_id, started_at desc);

alter table public.prospecting_research_runs enable row level security;

create policy prospecting_research_runs_select_workspace
    on public.prospecting_research_runs for select
    using (public.is_workspace_member(workspace_id));

-- Writes are service-role only — the prospecting-research Edge Function
-- is the sole author.
