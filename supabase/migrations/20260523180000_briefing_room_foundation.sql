-- ============================================================================
-- 20260523180000_briefing_room_foundation.sql
--
-- Briefing room — B.0a foundation schema
--
-- Adds the seven tables that B.0 → B.2 of the Briefing build phase plan
-- requires. Reserved table names for B.3 (triggers) and B.4 (periphery)
-- are NOT included here — those land in their own migrations to keep
-- this one focused on the foundation.
--
-- Tables created:
--   1. briefing_runs                  — pipeline run state
--   2. briefing_raw_items             — Stage 3.1 Ingest output
--   3. briefing_enriched_items        — Stage 3.3 Enrich output
--   4. briefing_clusters              — Stage 3.4 Cluster output
--   5. briefing_patterns              — Stage 5 Synthesize output
--   6. briefing_audit_envelopes       — Defensibility obligation; every
--                                       synthesis captured here
--   7. briefing_pattern_feedback      — operator Used/Met/Noise marks
--
-- Naming convention: `briefing_*` prefix on every table so the Briefing
-- room's data sits in its own namespace, doesn't collide with the
-- Signal Console substrate (`signal_console_accounts`, `signals`), and
-- is grep-able as a unit.
--
-- All tables are workspace-scoped (workspace_id NOT NULL with the
-- existing current_user_default_workspace_id() default + RLS policies
-- following migration 0005 pattern). Feedback table is additionally
-- user-scoped (one mark per pattern per user).
--
-- Realtime publication added for the four tables the UI subscribes to:
-- briefing_runs (progress), briefing_patterns (new patterns surface),
-- briefing_audit_envelopes (show-your-work), briefing_pattern_feedback
-- (operator marks).
--
-- Ref: deliverables/specs/briefing/01-build-phase-plan.md §B.0
-- Ref: deliverables/specs/briefing/signal_console_recipe_layer_spec_v0.4.md
-- Ref: deliverables/adr/adr-006-briefing-room-2026-05-23.md
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────
-- 1. briefing_runs — pipeline run state
-- ────────────────────────────────────────────────────────────────────────

create table public.briefing_runs (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id() references public.workspaces(id) on delete cascade,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    status text not null default 'pending' check (status in (
        'pending', 'hydrating', 'ingesting', 'filtering', 'enriching',
        'clustering', 'synthesizing', 'scoring', 'composing', 'surfacing',
        'complete', 'failed', 'aborted'
    )),
    stage_log jsonb not null default '[]'::jsonb,
    total_cost numeric(10,4) not null default 0,
    error text,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index briefing_runs_workspace_started_idx
    on public.briefing_runs(workspace_id, started_at desc);
create index briefing_runs_status_idx
    on public.briefing_runs(status)
    where status in ('pending', 'hydrating', 'ingesting', 'filtering',
                     'enriching', 'clustering', 'synthesizing', 'scoring',
                     'composing', 'surfacing');

alter table public.briefing_runs enable row level security;
create policy briefing_runs_select_workspace on public.briefing_runs
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_runs_insert_workspace on public.briefing_runs
    for insert with check (public.is_workspace_member(workspace_id));
create policy briefing_runs_update_workspace on public.briefing_runs
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy briefing_runs_delete_workspace on public.briefing_runs
    for delete using (public.is_workspace_member(workspace_id));

-- ────────────────────────────────────────────────────────────────────────
-- 2. briefing_raw_items — Stage 3.1 Ingest output
-- ────────────────────────────────────────────────────────────────────────

create table public.briefing_raw_items (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references public.briefing_runs(id) on delete cascade,
    workspace_id uuid not null default public.current_user_default_workspace_id() references public.workspaces(id) on delete cascade,
    source_id text not null,
    external_id text not null,
    title text not null,
    body text,
    url text,
    published_date timestamptz,
    fetched_at timestamptz not null default now(),
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    -- Dedup at insert: same (workspace, source, external_id) can't insert
    -- twice across runs. Re-fetches from the same source for the same
    -- external item are idempotent.
    unique (workspace_id, source_id, external_id)
);

create index briefing_raw_items_run_idx on public.briefing_raw_items(run_id);
create index briefing_raw_items_workspace_fetched_idx
    on public.briefing_raw_items(workspace_id, fetched_at desc);

alter table public.briefing_raw_items enable row level security;
create policy briefing_raw_items_select_workspace on public.briefing_raw_items
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_raw_items_insert_workspace on public.briefing_raw_items
    for insert with check (public.is_workspace_member(workspace_id));
create policy briefing_raw_items_update_workspace on public.briefing_raw_items
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy briefing_raw_items_delete_workspace on public.briefing_raw_items
    for delete using (public.is_workspace_member(workspace_id));

-- ────────────────────────────────────────────────────────────────────────
-- 3. briefing_enriched_items — Stage 3.3 Enrich output
-- ────────────────────────────────────────────────────────────────────────

create table public.briefing_enriched_items (
    id uuid primary key default gen_random_uuid(),
    raw_item_id uuid not null references public.briefing_raw_items(id) on delete cascade,
    run_id uuid not null references public.briefing_runs(id) on delete cascade,
    workspace_id uuid not null default public.current_user_default_workspace_id() references public.workspaces(id) on delete cascade,
    entities jsonb not null default '{}'::jsonb,
    exec_move jsonb,
    event_category text,
    topic_tags text[] not null default '{}',
    pain_tags text[] not null default '{}',
    claim_type text,
    summary text not null,
    what_changed text,
    user_relevance_score numeric(3,2),
    matches_triggers text[] not null default '{}',
    affects_deals text[] not null default '{}',
    is_noise boolean not null default false,
    enrichment_cost numeric(8,4) not null default 0,
    model_v_hash text,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index briefing_enriched_items_run_idx
    on public.briefing_enriched_items(run_id);
create index briefing_enriched_items_workspace_created_idx
    on public.briefing_enriched_items(workspace_id, created_at desc);
-- Generators querying by event_category / pain_tag will appreciate the
-- gin indexes. Partial index on non-noise to keep the hot path small.
create index briefing_enriched_items_pain_tags_gin
    on public.briefing_enriched_items using gin (pain_tags)
    where is_noise = false;
create index briefing_enriched_items_topic_tags_gin
    on public.briefing_enriched_items using gin (topic_tags)
    where is_noise = false;

alter table public.briefing_enriched_items enable row level security;
create policy briefing_enriched_items_select_workspace on public.briefing_enriched_items
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_enriched_items_insert_workspace on public.briefing_enriched_items
    for insert with check (public.is_workspace_member(workspace_id));
create policy briefing_enriched_items_update_workspace on public.briefing_enriched_items
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy briefing_enriched_items_delete_workspace on public.briefing_enriched_items
    for delete using (public.is_workspace_member(workspace_id));

-- ────────────────────────────────────────────────────────────────────────
-- 4. briefing_clusters — Stage 3.4 Cluster output
-- ────────────────────────────────────────────────────────────────────────

create table public.briefing_clusters (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references public.briefing_runs(id) on delete cascade,
    workspace_id uuid not null default public.current_user_default_workspace_id() references public.workspaces(id) on delete cascade,
    cluster_type text not null check (cluster_type in (
        'pain_tag', 'exec_move', 'narrative_shift', 'company_cluster'
    )),
    anchor text not null,
    -- item_ids references enriched_items.id; NOT a FK because clusters
    -- can span runs (parent_cluster_id) and would carry stale references
    -- after enriched items are reaped. Defensive read at consumer.
    item_ids uuid[] not null default '{}',
    weighted_evidence numeric(8,4) not null default 0,
    trajectory text check (trajectory in ('rising', 'stable', 'declining') or trajectory is null),
    -- parent_cluster_id links a cluster to its predecessor across runs
    -- for trajectory tracking. set null on delete to preserve current
    -- cluster history even if a parent is deleted.
    parent_cluster_id uuid references public.briefing_clusters(id) on delete set null,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index briefing_clusters_run_idx on public.briefing_clusters(run_id);
create index briefing_clusters_workspace_anchor_idx
    on public.briefing_clusters(workspace_id, cluster_type, anchor);
create index briefing_clusters_parent_idx
    on public.briefing_clusters(parent_cluster_id)
    where parent_cluster_id is not null;

alter table public.briefing_clusters enable row level security;
create policy briefing_clusters_select_workspace on public.briefing_clusters
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_clusters_insert_workspace on public.briefing_clusters
    for insert with check (public.is_workspace_member(workspace_id));
create policy briefing_clusters_update_workspace on public.briefing_clusters
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy briefing_clusters_delete_workspace on public.briefing_clusters
    for delete using (public.is_workspace_member(workspace_id));

-- ────────────────────────────────────────────────────────────────────────
-- 5. briefing_patterns — Stage 5 Synthesize output
-- ────────────────────────────────────────────────────────────────────────
--
-- The first-class noun the operator reads. Per ADR-006 question (1):
-- separate from Phase A's `observations` table because Patterns have
-- richer schema (claim + six_questions + recommended_moves +
-- attribute_grid + audit_envelope_id).

create table public.briefing_patterns (
    id uuid primary key default gen_random_uuid(),
    run_id uuid not null references public.briefing_runs(id) on delete cascade,
    workspace_id uuid not null default public.current_user_default_workspace_id() references public.workspaces(id) on delete cascade,
    pattern_type text not null check (pattern_type in (
        'standard', 'contrarian', 'periphery'
    )),
    cluster_id uuid references public.briefing_clusters(id) on delete set null,
    title text not null,
    body text not null,
    -- attribute_grid: {what_changed, trajectory, affected_deals, risk_window}
    attribute_grid jsonb not null default '{}'::jsonb,
    -- six_questions: {what_changed, evidence, confidence_rationale,
    --                 why_it_matters, who_needs_to_know, what_next}
    -- per voice doc §6.3
    six_questions jsonb not null default '{}'::jsonb,
    -- recommended_moves: [{label, destination, draft_payload, leverage}]
    -- per voice doc §6.4
    recommended_moves jsonb not null default '[]'::jsonb,
    confidence numeric(3,2) not null check (confidence >= 0 and confidence <= 1),
    evidence_count integer not null default 0,
    source_count integer not null default 0,
    trajectory text check (trajectory in ('rising', 'stable', 'declining') or trajectory is null),
    surfaced_at timestamptz not null default now(),
    -- audit_envelope_id populated by the synthesis pipeline after the
    -- envelope is written. Nullable for the brief window between
    -- pattern insert and envelope insert; defensive consumers check.
    audit_envelope_id uuid,
    matches_triggers text[] not null default '{}',
    affects_deals text[] not null default '{}',
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index briefing_patterns_workspace_surfaced_idx
    on public.briefing_patterns(workspace_id, surfaced_at desc);
create index briefing_patterns_run_idx on public.briefing_patterns(run_id);
create index briefing_patterns_type_idx on public.briefing_patterns(pattern_type);
create index briefing_patterns_cluster_idx
    on public.briefing_patterns(cluster_id)
    where cluster_id is not null;

alter table public.briefing_patterns enable row level security;
create policy briefing_patterns_select_workspace on public.briefing_patterns
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_patterns_insert_workspace on public.briefing_patterns
    for insert with check (public.is_workspace_member(workspace_id));
create policy briefing_patterns_update_workspace on public.briefing_patterns
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy briefing_patterns_delete_workspace on public.briefing_patterns
    for delete using (public.is_workspace_member(workspace_id));

-- ────────────────────────────────────────────────────────────────────────
-- 6. briefing_audit_envelopes — Defensibility obligation
-- ────────────────────────────────────────────────────────────────────────
--
-- Append-only, immutable record of every synthesis. Per Design Posture
-- v0.1 §3.3, the envelope must let the operator reconstruct what the
-- system said, on what basis, and with what supporting evidence months
-- later. Each *_jsonb field captures a frozen snapshot at the moment
-- of that stage.

create table public.briefing_audit_envelopes (
    id uuid primary key default gen_random_uuid(),
    pattern_id uuid not null references public.briefing_patterns(id) on delete cascade,
    workspace_id uuid not null default public.current_user_default_workspace_id() references public.workspaces(id) on delete cascade,
    -- Frozen snapshots at synthesis time
    cluster_snapshot jsonb not null,
    hydrated_context_snapshot jsonb not null,
    -- Synthesis stage records. Shape: { model, prompt, response,
    -- tokens_in, tokens_out, cost, model_v_hash, started_at, completed_at }
    draft_record jsonb,
    critique_record jsonb,
    revise_record jsonb,
    -- Per voice doc §6 quality gate checks
    gate_decisions jsonb not null default '{}'::jsonb,
    -- Operator actions on this pattern: append-only array of
    -- { action, timestamp, payload, user_id }
    user_actions jsonb not null default '[]'::jsonb,
    total_cost numeric(8,4) not null default 0,
    created_at timestamptz not null default now()
);

create index briefing_audit_envelopes_pattern_idx
    on public.briefing_audit_envelopes(pattern_id);
create index briefing_audit_envelopes_workspace_created_idx
    on public.briefing_audit_envelopes(workspace_id, created_at desc);

alter table public.briefing_audit_envelopes enable row level security;
create policy briefing_audit_envelopes_select_workspace on public.briefing_audit_envelopes
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_audit_envelopes_insert_workspace on public.briefing_audit_envelopes
    for insert with check (public.is_workspace_member(workspace_id));
-- Envelopes are append-only. user_actions array is updated via RPC,
-- not direct row update from clients. The update policy allows it
-- but the application path is gated.
create policy briefing_audit_envelopes_update_workspace on public.briefing_audit_envelopes
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
-- No delete policy. Audit envelopes never delete. Retention policy
-- (12-month hot, 7-year cold per spec) handled by separate archival
-- migration post-v1.

-- ────────────────────────────────────────────────────────────────────────
-- 7. briefing_pattern_feedback — operator Used/Met/Noise marks
-- ────────────────────────────────────────────────────────────────────────
--
-- One mark per pattern per user. Per ADR-006 question (5): new noun,
-- separate table. Aggregates roll up into the Pattern's weight on the
-- next pipeline run (B.6 wires the feedback loop).

create table public.briefing_pattern_feedback (
    id uuid primary key default gen_random_uuid(),
    pattern_id uuid not null references public.briefing_patterns(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    workspace_id uuid not null default public.current_user_default_workspace_id() references public.workspaces(id) on delete cascade,
    mark text not null check (mark in ('used', 'met', 'noise')),
    marked_at timestamptz not null default now(),
    note text,
    -- One mark per pattern per user; re-marks overwrite via upsert
    unique (pattern_id, user_id)
);

create index briefing_pattern_feedback_user_marked_idx
    on public.briefing_pattern_feedback(user_id, marked_at desc);
create index briefing_pattern_feedback_pattern_idx
    on public.briefing_pattern_feedback(pattern_id);

alter table public.briefing_pattern_feedback enable row level security;
-- Per-user RLS (each user sees + writes their own marks). Workspace
-- members can SELECT each others' marks for aggregation (the rollup
-- counts how many workspace-members marked a pattern Used vs Noise).
create policy briefing_pattern_feedback_select_workspace on public.briefing_pattern_feedback
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_pattern_feedback_insert_own on public.briefing_pattern_feedback
    for insert with check (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id));
create policy briefing_pattern_feedback_update_own on public.briefing_pattern_feedback
    for update using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
create policy briefing_pattern_feedback_delete_own on public.briefing_pattern_feedback
    for delete using (user_id = (select auth.uid()));

-- ────────────────────────────────────────────────────────────────────────
-- Realtime publication
-- ────────────────────────────────────────────────────────────────────────
--
-- The UI subscribes to four tables:
--   - briefing_runs (progress indicator during pipeline runs)
--   - briefing_patterns (new patterns surface in the briefing room)
--   - briefing_audit_envelopes (show-your-work UI updates)
--   - briefing_pattern_feedback (operator marks roll up live)
--
-- raw_items + enriched_items + clusters are intermediate state — the
-- pipeline writes them but the UI doesn't subscribe; saves realtime
-- bandwidth. UI reads them on-demand via the audit envelope.

alter publication supabase_realtime add table public.briefing_runs;
alter publication supabase_realtime add table public.briefing_patterns;
alter publication supabase_realtime add table public.briefing_audit_envelopes;
alter publication supabase_realtime add table public.briefing_pattern_feedback;

-- ────────────────────────────────────────────────────────────────────────
-- updated_at trigger for briefing_runs
-- ────────────────────────────────────────────────────────────────────────
--
-- Other Briefing tables are append-only (raw_items, enriched_items,
-- clusters, patterns, envelopes) or use marked_at as the canonical
-- time (feedback). Only briefing_runs gets touched after insert,
-- so it's the only one needing updated_at maintenance.

create trigger briefing_runs_updated_at
    before update on public.briefing_runs
    for each row execute function public.update_updated_at_column();

-- ────────────────────────────────────────────────────────────────────────
-- Schema documentation
-- ────────────────────────────────────────────────────────────────────────

comment on table public.briefing_runs is
    'Briefing pipeline run state. One row per pipeline invocation. Status transitions through stages; total_cost accumulates from per-stage costs in stage_log jsonb.';
comment on table public.briefing_raw_items is
    'Stage 3.1 Ingest output. Free-source fetched items, deduplicated by (workspace_id, source_id, external_id).';
comment on table public.briefing_enriched_items is
    'Stage 3.3 Enrich output. LLM-enriched items with entities, tags, relevance score, trigger matches.';
comment on table public.briefing_clusters is
    'Stage 3.4 Cluster output. Items grouped by pain_tag / exec_move / narrative_shift / company. parent_cluster_id links cross-run continuity.';
comment on table public.briefing_patterns is
    'Stage 5 Synthesize output. The first-class noun the operator reads. Three types: standard, contrarian, periphery.';
comment on table public.briefing_audit_envelopes is
    'Defensibility obligation per Design Posture v0.1 §3.3. Append-only immutable record of every Pattern synthesis. Operator can reconstruct what the system said, on what basis, months later.';
comment on table public.briefing_pattern_feedback is
    'Operator Used/Met/Noise marks. One row per pattern per user. Aggregates feed back into pattern scoring on the next pipeline run.';
