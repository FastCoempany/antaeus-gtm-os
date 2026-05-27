-- ============================================================
-- 20260527000000 — Briefing Watchlist Triggers (B.3a)
--
-- Operator-issued standing orders the pipeline evaluates each run.
-- Per Watchlist Trigger Grammar v0.1: a trigger is one of five types
-- (single_event / aggregation / threshold / adjacency / silence),
-- parsed from natural language into a structured parsed_query, and
-- evaluated against enriched items + per-run metrics. Fires are
-- recorded for surfacing in the briefing's right rail.
--
-- Two tables:
--   1. briefing_watchlist_triggers — the armed triggers.
--   2. briefing_trigger_fires      — a row per fire, with the evidence.
--
-- Ref: deliverables/specs/briefing/signal_console_watchlist_trigger_grammar_v0.1.md
-- Ref: deliverables/specs/briefing/01-build-phase-plan.md B.3
-- ============================================================

-- ────────────────────────────────────────────────────────────────────────
-- 1. briefing_watchlist_triggers
-- ────────────────────────────────────────────────────────────────────────

create table public.briefing_watchlist_triggers (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null
        default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    -- created_by: who armed it. Defaults to the authed user.
    created_by uuid default auth.uid() references auth.users(id) on delete set null,

    -- The operator's original phrasing + the structured parse.
    natural_language text not null,
    trigger_type text not null check (trigger_type in (
        'single_event', 'aggregation', 'threshold', 'adjacency', 'silence'
    )),
    parsed_query jsonb not null default '{}'::jsonb,
    parse_confidence numeric(3, 2) not null default 0,
    rephrased_for_confirmation text,

    -- Lifecycle (grammar §7). armed → fires → dormant → disabled.
    status text not null default 'armed' check (status in (
        'armed', 'fired_today', 'fired_this_week', 'dormant', 'disabled'
    )),

    last_fired_at timestamptz,
    fire_count integer not null default 0,
    false_fire_count integer not null default 0,
    notes text,

    -- Forward-compat catch-all.
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index briefing_watchlist_triggers_workspace_idx
    on public.briefing_watchlist_triggers(workspace_id, status);
create index briefing_watchlist_triggers_type_idx
    on public.briefing_watchlist_triggers(workspace_id, trigger_type);

create trigger briefing_watchlist_triggers_set_updated_at
    before update on public.briefing_watchlist_triggers
    for each row execute function public.update_updated_at_column();

alter table public.briefing_watchlist_triggers enable row level security;

create policy briefing_watchlist_triggers_select_workspace
    on public.briefing_watchlist_triggers
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_watchlist_triggers_insert_workspace
    on public.briefing_watchlist_triggers
    for insert with check (public.is_workspace_member(workspace_id));
create policy briefing_watchlist_triggers_update_workspace
    on public.briefing_watchlist_triggers
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy briefing_watchlist_triggers_delete_workspace
    on public.briefing_watchlist_triggers
    for delete using (public.is_workspace_member(workspace_id));

alter publication supabase_realtime add table public.briefing_watchlist_triggers;

comment on table public.briefing_watchlist_triggers is
    'Operator-issued standing orders (5 types per Watchlist Trigger Grammar v0.1). Parsed from NL into parsed_query; evaluated each pipeline run. Edited in the Briefing Watch List tab. ADR-006 / B.3.';

-- ────────────────────────────────────────────────────────────────────────
-- 2. briefing_trigger_fires
-- ────────────────────────────────────────────────────────────────────────

create table public.briefing_trigger_fires (
    id uuid primary key default gen_random_uuid(),
    trigger_id uuid not null
        references public.briefing_watchlist_triggers(id) on delete cascade,
    workspace_id uuid not null
        default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    -- The run that produced the fire. Nullable so a manual / out-of-band
    -- evaluation can still record one.
    run_id uuid references public.briefing_runs(id) on delete set null,

    fired_at timestamptz not null default now(),
    -- Enriched-item ids that satisfied the trigger (defensive read at
    -- the consumer; not an FK because items can be reaped across runs).
    evidence_item_ids uuid[] not null default '{}',
    -- Plain-English line for the right-rail "Triggers fired" surface.
    summary text not null default '',
    -- Operator feedback (grammar §3 FireEvent.user_verdict). Tunes the
    -- trigger's false_fire_count in B.8.
    user_verdict text check (user_verdict in ('useful_fire', 'false_fire') or user_verdict is null),

    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index briefing_trigger_fires_trigger_idx
    on public.briefing_trigger_fires(trigger_id, fired_at desc);
create index briefing_trigger_fires_workspace_idx
    on public.briefing_trigger_fires(workspace_id, fired_at desc);
create index briefing_trigger_fires_run_idx
    on public.briefing_trigger_fires(run_id)
    where run_id is not null;

alter table public.briefing_trigger_fires enable row level security;

create policy briefing_trigger_fires_select_workspace
    on public.briefing_trigger_fires
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_trigger_fires_insert_workspace
    on public.briefing_trigger_fires
    for insert with check (public.is_workspace_member(workspace_id));
create policy briefing_trigger_fires_update_workspace
    on public.briefing_trigger_fires
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy briefing_trigger_fires_delete_workspace
    on public.briefing_trigger_fires
    for delete using (public.is_workspace_member(workspace_id));

alter publication supabase_realtime add table public.briefing_trigger_fires;

comment on table public.briefing_trigger_fires is
    'One row per Watchlist Trigger fire, with the evidence item ids + a plain-English summary. Surfaced in the Briefing right rail; user_verdict feeds B.8 feedback. B.3.';
