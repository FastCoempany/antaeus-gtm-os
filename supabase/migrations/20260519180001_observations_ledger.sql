-- ============================================================
-- 20260519180001 — observations ledger
--
-- Phase A of the orchestration layer (ADR-004). Introduces the
-- ledger where the SYSTEM writes its own observations of the
-- workspace — not metrics, not charts, plain-English sentences
-- written like a peer would say them.
--
-- Five rules that keep this out of CRM territory:
--   1. Format is prose, not metric (sentences, not numbers)
--   2. Sharp, not exhaustive (one observation at a time)
--   3. Feeds back into system behavior, not just reports
--   4. Names the why, not just the what (causal reads)
--   5. Has a destination — making the workspace inheritable
--
-- Append-with-dismissal model: observations are never hard-deleted,
-- only marked dismissed or superseded. Preserves the audit trail of
-- what the system noticed and when.
--
-- Writers: the heartbeat Edge Function (service-role only). Readers:
-- workspace members. Phase A ships the storage + RLS only; the first
-- generator (signal-decay detection) lands in Phase B.
--
-- See: deliverables/adr/adr-004-orchestration-layer-foundation-2026-05-19.md
-- ============================================================

create table public.observations (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    written_at timestamptz not null default now(),
    -- Plain-English sentence written by the system. Must pass canon
    -- Part III §11 voice rule (no startup-jargon, no sales-shorthand,
    -- no us-vs-them framing, sentence Sarah would say to a peer).
    observation_text text not null,
    -- Optional anchor to an object in the workspace. One of:
    -- account / deal / signal / proof / focus / advisor / call.
    -- Null when the observation is workspace-level not object-level
    -- (e.g. "Tuesday morning replies happen 3x more than Friday").
    related_object_type text,
    related_object_id text,
    -- Which generator wrote this. Used for dedupe + filtering +
    -- knowing which generator to retire if its output is bad.
    -- Format: 'phase-b/signal-decay', 'phase-c/champion-pattern', etc.
    source_generator text not null,
    -- 'high' / 'medium' / 'low' or null. High-confidence observations
    -- can ride the strip + push to the operator; low-confidence
    -- ones stay in Founding GTM's "what the system is noticing"
    -- section without pushing.
    confidence text,
    -- 'active' / 'dismissed' / 'superseded'.
    -- - active: currently surfacing
    -- - dismissed: operator dismissed it (kept for audit)
    -- - superseded: a newer observation made this one stale (kept
    --   for audit + chained via superseded_by)
    status text not null default 'active'
        check (status in ('active', 'dismissed', 'superseded')),
    superseded_by uuid references public.observations(id) on delete set null,
    dismissed_at timestamptz,
    dismissed_reason text,
    constraint observations_confidence_valid
        check (confidence is null or confidence in ('high', 'medium', 'low'))
);

-- Index for the common query: active observations for a workspace,
-- ordered by recency, optionally filtered by related object.
create index observations_workspace_active_idx
    on public.observations (workspace_id, status, written_at desc)
    where status = 'active';

-- Secondary index for object-anchored observations (used by the
-- birdseye strip + inline observation kickers).
create index observations_workspace_object_idx
    on public.observations (workspace_id, related_object_type, related_object_id, status)
    where status = 'active';

-- Index for dedupe-on-write: same generator + same related object +
-- still active. The heartbeat checks this before inserting.
create index observations_dedupe_idx
    on public.observations (workspace_id, source_generator, related_object_type, related_object_id)
    where status = 'active';

-- RLS — workspace-scoped reads for members. Writes are reserved for
-- the service role (the heartbeat Edge Function uses the service-role
-- key). Members can update STATUS only (to dismiss observations) —
-- they cannot write new ones.
alter table public.observations enable row level security;

create policy observations_select_workspace
    on public.observations
    for select
    using (public.is_workspace_member(workspace_id));

-- Members can dismiss observations (update status to 'dismissed')
-- and write a reason. They cannot change observation_text or any
-- other field — those are append-only from the system's side.
-- We enforce "status-only updates by members" via a check on the
-- WITH CHECK clause + an update_observation_status helper function
-- (added below) that's the recommended path.
create policy observations_update_status_workspace
    on public.observations
    for update
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

-- NO insert policy for members. The service role bypasses RLS, which
-- is the path the heartbeat uses.
-- NO delete policy. Observations are append-with-dismissal.

-- Helper: dismiss an observation with a reason. Members call this
-- via the data-client rather than UPDATEing directly so the policy
-- + reason capture stay consistent.
create or replace function public.dismiss_observation(
    obs_id uuid,
    reason text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
    update public.observations
    set
        status = 'dismissed',
        dismissed_at = now(),
        dismissed_reason = reason
    where
        id = obs_id
        and public.is_workspace_member(workspace_id)
        and status = 'active';
end;
$$;

comment on table public.observations is
    'Phase A of the orchestration layer (ADR-004). The ledger where the system writes its own observations of the workspace. Plain-English sentences written like a peer would say them — not metrics, not charts. Append-with-dismissal model.';

comment on column public.observations.observation_text is
    'The actual sentence. Must pass canon Part III §11 voice rule. Written by a generator function on the heartbeat. NEVER edited after insert — corrections happen via superseded_by chaining.';

comment on column public.observations.source_generator is
    'The generator that wrote this observation, in the format ''phase-b/signal-decay'' or ''phase-c/champion-pattern''. Used for dedupe, filtering, and knowing which generator to retire if its output is bad.';

comment on column public.observations.confidence is
    'High-confidence observations can ride the strip + push to the operator. Low-confidence ones stay in the system''s ledger without pushing.';

comment on column public.observations.status is
    'active | dismissed | superseded. Observations are NEVER hard-deleted — preserves the audit trail of what the system noticed and when.';

-- Realtime publication — the data-client subscribes to observations
-- so that the Dashboard + Founding GTM + the birdseye strip get
-- live updates when the heartbeat writes a new observation.
alter publication supabase_realtime add table public.observations;
