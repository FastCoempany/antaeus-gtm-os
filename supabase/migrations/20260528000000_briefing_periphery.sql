-- ============================================================
-- 20260528000000 — Briefing Periphery Detection (B.4)
--
-- Coverage obligation per canon §4.21 + ADR-006: surface entities the
-- operator hasn't named on their watchlist but the data says they
-- should be watching. Stage 3.3b of the Recipe Layer pipeline scores
-- off-watchlist entities by co-occurrence / vocabulary overlap /
-- investor / hiring / buyer signals; the right-rail UI then offers
-- Add to watchlist / Snooze / Dismiss.
--
-- Two tables:
--   1. briefing_periphery_candidates — one row per (run, candidate
--      entity). Carries the per-signal scores, supporting evidence,
--      and the operator's verdict.
--   2. briefing_watchlist_entities — the entities the operator has
--      explicitly named (manually or by promoting a periphery
--      candidate). Distinct from briefing_watchlist_triggers, which
--      are standing-order queries; entities are the *who*, triggers
--      are the *what to watch for*.
--
-- Ref: deliverables/specs/briefing/01-build-phase-plan.md B.4
-- Ref: deliverables/adr/adr-006-briefing-room-2026-05-23.md
-- ============================================================

-- ────────────────────────────────────────────────────────────────────────
-- 1. briefing_watchlist_entities
--
-- Created before periphery_candidates so candidates can FK-reference it
-- on promotion (promoted_from_periphery_id is the reverse direction).
-- ────────────────────────────────────────────────────────────────────────

create table public.briefing_watchlist_entities (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null
        default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    created_by uuid default auth.uid() references auth.users(id) on delete set null,

    -- Canonical name + alternate spellings the pipeline should treat as
    -- the same entity (e.g. "Deel Inc" → ["Deel", "deel.com"]).
    entity_name text not null,
    entity_aliases text[] not null default '{}',

    -- How this entity got onto the watchlist. periphery_promoted means
    -- the operator clicked "Add to watchlist" on a periphery candidate;
    -- manual means they typed it; imported is reserved for bulk import
    -- (B.4d+).
    source text not null default 'manual' check (source in (
        'periphery_promoted', 'manual', 'imported'
    )),

    -- Lifecycle. watched is the active state; snoozed pauses surface
    -- attention without removing; removed is a soft delete preserved
    -- for audit (we'll never silently re-promote a removed entity).
    status text not null default 'watched' check (status in (
        'watched', 'snoozed', 'removed'
    )),

    -- Back-reference to the periphery candidate this came from (null
    -- for manual / imported). FK target table created below; we install
    -- the FK constraint after table 2 exists.
    promoted_from_periphery_id uuid,

    notes text,

    -- Forward-compat catch-all.
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index briefing_watchlist_entities_workspace_status_idx
    on public.briefing_watchlist_entities(workspace_id, status);
create index briefing_watchlist_entities_name_idx
    on public.briefing_watchlist_entities(workspace_id, lower(entity_name));

create trigger briefing_watchlist_entities_set_updated_at
    before update on public.briefing_watchlist_entities
    for each row execute function public.update_updated_at_column();

alter table public.briefing_watchlist_entities enable row level security;

create policy briefing_watchlist_entities_select_workspace
    on public.briefing_watchlist_entities
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_watchlist_entities_insert_workspace
    on public.briefing_watchlist_entities
    for insert with check (public.is_workspace_member(workspace_id));
create policy briefing_watchlist_entities_update_workspace
    on public.briefing_watchlist_entities
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy briefing_watchlist_entities_delete_workspace
    on public.briefing_watchlist_entities
    for delete using (public.is_workspace_member(workspace_id));

alter publication supabase_realtime add table public.briefing_watchlist_entities;

comment on table public.briefing_watchlist_entities is
    'The named entities the operator is watching (manual or promoted from a periphery candidate). Distinct from briefing_watchlist_triggers — entities are the WHO, triggers are the WHAT-TO-WATCH-FOR. ADR-006 / B.4.';

-- ────────────────────────────────────────────────────────────────────────
-- 2. briefing_periphery_candidates
--
-- Per spec §B.4: "0-5 periphery candidates per run" — tight precision
-- target, not high-recall.
-- ────────────────────────────────────────────────────────────────────────

create table public.briefing_periphery_candidates (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null
        default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    -- The run that produced this candidate.
    run_id uuid not null references public.briefing_runs(id) on delete cascade,

    -- The off-watchlist entity being proposed. entity_name is the
    -- canonical form the pipeline picked; aliases are the other surface
    -- forms it appeared as across items in this run.
    entity_name text not null,
    entity_aliases text[] not null default '{}',

    -- Per-signal scores (canon §4.21 + spec §3.3b). B.4a ships
    -- co-occurrence + vocab; the other three land in later B.4 PRs.
    -- All numeric so we can store a count, a normalized fraction, or
    -- whatever each signal produces without re-migrating.
    co_occurrence_score numeric(8, 3) not null default 0,
    vocab_overlap_score numeric(8, 3) not null default 0,
    investor_map_score numeric(8, 3),
    hiring_overlap_score numeric(8, 3),
    buyer_overlap_score numeric(8, 3),
    total_score numeric(8, 3) not null default 0,

    -- Enriched-item ids that supported this candidate (where the entity
    -- appeared alongside a watched entity or shared its vocabulary).
    -- Defensive read at the consumer; not an FK because items can be
    -- reaped across runs.
    supporting_item_ids uuid[] not null default '{}',

    -- One-line plain-English explanation the UI surfaces under the
    -- candidate (e.g. "Appeared in 4 items alongside Deel and Rippling;
    -- shares 6 pain/topic tags with the watched set").
    reasoning text not null default '',

    -- Operator's verdict. candidate is the default; the right-rail UI
    -- transitions to added_to_watchlist (creates a briefing_watchlist_entities
    -- row + flips this status), snoozed (hides for this run + maybe N
    -- future runs), or dismissed (never surface this candidate again).
    status text not null default 'candidate' check (status in (
        'candidate', 'added_to_watchlist', 'snoozed', 'dismissed'
    )),
    last_action_at timestamptz,

    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index briefing_periphery_candidates_workspace_run_idx
    on public.briefing_periphery_candidates(workspace_id, run_id);
create index briefing_periphery_candidates_status_idx
    on public.briefing_periphery_candidates(workspace_id, status);
create index briefing_periphery_candidates_entity_idx
    on public.briefing_periphery_candidates(workspace_id, lower(entity_name));

create trigger briefing_periphery_candidates_set_updated_at
    before update on public.briefing_periphery_candidates
    for each row execute function public.update_updated_at_column();

alter table public.briefing_periphery_candidates enable row level security;

create policy briefing_periphery_candidates_select_workspace
    on public.briefing_periphery_candidates
    for select using (public.is_workspace_member(workspace_id));
create policy briefing_periphery_candidates_insert_workspace
    on public.briefing_periphery_candidates
    for insert with check (public.is_workspace_member(workspace_id));
create policy briefing_periphery_candidates_update_workspace
    on public.briefing_periphery_candidates
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));
create policy briefing_periphery_candidates_delete_workspace
    on public.briefing_periphery_candidates
    for delete using (public.is_workspace_member(workspace_id));

alter publication supabase_realtime add table public.briefing_periphery_candidates;

comment on table public.briefing_periphery_candidates is
    'Off-watchlist entities the periphery detector proposes the operator should be watching. 0-5 per run; precision over recall. Right-rail UI surfaces these with Add/Snooze/Dismiss. ADR-006 / B.4.';

-- ────────────────────────────────────────────────────────────────────────
-- 3. Install the back-reference FK now that both tables exist.
-- ────────────────────────────────────────────────────────────────────────

alter table public.briefing_watchlist_entities
    add constraint briefing_watchlist_entities_promoted_from_fkey
    foreign key (promoted_from_periphery_id)
    references public.briefing_periphery_candidates(id) on delete set null;
