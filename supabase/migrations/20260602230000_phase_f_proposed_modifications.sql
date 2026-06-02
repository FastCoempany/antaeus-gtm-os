-- 20260602230000_phase_f_proposed_modifications.sql
--
-- ADR-017 (Phase F bounded self-modification, PR 1 of 4).
--
-- Approved 2026-06-02 with six locked picks:
--   1. Doctrine = proposals operator must accept (bounded)
--   2. Surface = new "Suggestions" section in Briefing room
--   3. Cooldown = 30 days after dismiss
--   4. Skill scope = per-workspace override (not recipe-file edit)
--   5. Lane 2 v1 = parameterized variants of existing generators only
--   6. Settings toggle to disable proposals entirely = yes (default ON)
--
-- This migration ships the schema layer only. PR 2 = detection Edge
-- Function. PR 3 = Briefing Suggestions UI. PR 4 = apply logic +
-- cooldown enforcement.
--
-- Additive only — no existing tables modified except workspace_profile
-- gains one nullable boolean column for the disable toggle.

-- ─── proposed_modifications ────────────────────────────────────────

create table if not exists public.proposed_modifications (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,

    -- Which of the two ADR-017 lanes this proposal lives in.
    kind text not null
        check (kind in ('skill_default', 'observation_generator')),

    -- Short label rendered in the Suggestions list.
    title text not null,

    -- Peer-voice explanation of the detected pattern, voice-validated
    -- at write time (canon Part III §11).
    what_noticed text not null,

    -- Peer-voice explanation of what would change on accept.
    what_changes text not null,

    proposed_at timestamptz not null default now(),

    -- When operator first opened the proposal. Null = not yet seen.
    viewed_at timestamptz,

    -- Operator's decision. Null = pending. accepted = applied.
    -- dismissed = no change + cooldown. snoozed = same as dismissed
    -- but operator opted in to remembering (the UX surface is identical).
    decision text
        check (decision in ('accepted', 'dismissed', 'snoozed') or decision is null),

    decided_at timestamptz,

    -- What to apply when accepted. Schema varies by kind:
    --
    -- kind = 'skill_default':
    --   { "skill_id": "whats-at-risk",
    --     "param": "stage_filter",
    --     "value": "negotiation" }
    --
    -- kind = 'observation_generator':
    --   { "generator_id": "deal_decay",
    --     "variant_name": "monday_morning",
    --     "schedule": { "day_of_week": 1, "hour": 8, "timezone": "America/Chicago" },
    --     "filter": { "stage": "negotiation" } }
    payload jsonb not null,

    -- Re-fire cooldown for dismissed/snoozed proposals. Detection
    -- generators check this before writing a new proposal of the same
    -- shape. 30 days per ADR-017 §Approved pick 3.
    cooldown_until timestamptz,

    created_at timestamptz not null default now()
);

comment on table public.proposed_modifications is
    'ADR-017 Phase F: system-authored proposals the operator must accept before any change is applied. Bounded self-modification, both lanes.';

comment on column public.proposed_modifications.kind is
    'ADR-017 lane: skill_default (Lane 1) or observation_generator (Lane 2). v1 of Lane 2 limited to parameterized variants of existing generators per the §Approved pick 5.';

comment on column public.proposed_modifications.payload is
    'What to apply on accept. Schema varies by kind — see migration comments for the two shapes. Detection generators write; the apply path (PR 4) reads.';

comment on column public.proposed_modifications.cooldown_until is
    'Re-fire dedupe: detection generators must not write a new proposal of the same shape until now() > cooldown_until. 30 days post-dismiss per ADR-017 §Approved pick 3.';

-- ─── Indexes ───────────────────────────────────────────────────────

-- "Show me my proposals" — Briefing Suggestions section ordering.
create index if not exists proposed_modifications_workspace_proposed_at_idx
    on public.proposed_modifications (workspace_id, proposed_at desc);

-- Pending-only filter for the Suggestions section badge / count.
create index if not exists proposed_modifications_workspace_pending_idx
    on public.proposed_modifications (workspace_id)
    where decision is null;

-- Cooldown dedupe lookups by (workspace_id, kind, payload-shape-hash).
-- We don't have a payload-hash column in v1 — detection generators dedupe
-- in-memory using payload + kind. The index supports that lookup.
create index if not exists proposed_modifications_workspace_kind_cooldown_idx
    on public.proposed_modifications (workspace_id, kind, cooldown_until);

-- ─── RLS ───────────────────────────────────────────────────────────

alter table public.proposed_modifications enable row level security;

-- Workspace members can read every row in their workspace.
create policy proposed_modifications_select_workspace
    on public.proposed_modifications for select
    using (public.is_workspace_member(workspace_id));

-- Workspace members can mark their own workspace's proposals as
-- viewed/accepted/dismissed/snoozed. This is the operator's accept-
-- decision write path; PR 4 (apply logic) consumes it.
create policy proposed_modifications_update_workspace
    on public.proposed_modifications for update
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

-- INSERT + DELETE are service-role only. The detection Edge Function
-- (PR 2) is the sole authorized author of new proposals; we never
-- want the client SDK to forge a proposal. We expose no insert/delete
-- policy here, which means RLS denies those writes through the anon/
-- authed keys; only the service-role bypass succeeds.

-- ─── Realtime ──────────────────────────────────────────────────────

alter publication supabase_realtime add table public.proposed_modifications;

-- ─── workspace_profile: phase_f_proposals_enabled toggle ──────────

-- Per ADR-017 §Approved pick 6: the operator can disable proposals
-- entirely via a Settings toggle. Default ON. Nullable for backward-
-- compatibility with existing workspace_profile rows; client code
-- treats null as "enabled" (the default).
alter table public.workspace_profile
    add column if not exists phase_f_proposals_enabled boolean default true;

comment on column public.workspace_profile.phase_f_proposals_enabled is
    'ADR-017 Phase F: operator can disable Phase F proposals entirely. Default true (proposals enabled). Detection generators check this before writing — if false, no proposals fire for this workspace.';
