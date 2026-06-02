-- 20260602240000_phase_f_apply_side_effects.sql
--
-- ADR-017 (Phase F PR 4 of 4) — apply-logic schema.
--
-- When the operator accepts a proposal, the side effect lands in one
-- of two new workspace-scoped tables:
--
--   workspace_skill_overrides   — Lane 1 (skill default refinement).
--                                 Per-workspace override of a recipe's
--                                 default params. The skills dispatcher
--                                 reads from this table at invocation
--                                 time + merges into recipe defaults
--                                 before the URL is built.
--
--   active_observation_variants — Lane 2 (observation generator
--                                 proposal). A parameterized variant
--                                 of an existing Phase B generator
--                                 with a workspace-specific filter.
--                                 The heartbeat's Phase F variant
--                                 runner reads from this table on each
--                                 tick + invokes the base generator
--                                 with the filter applied.
--
-- Both tables FK back to proposed_modifications.id so the audit chain
-- is preserved: "this override was applied because the operator
-- accepted proposal X on date Y."
--
-- RLS: workspace members can SELECT (the dispatcher + heartbeat need
-- to read). Writes are service-role-only (the apply client writes
-- through the Edge Function path, not direct DB writes from the
-- client SDK) — except that for Lane 1 the operator's accept-click
-- triggers an immediate workspace_skill_overrides UPSERT because
-- skill override is a perceived-immediate change. Operator UPDATE is
-- gated to the operator's own workspace.

-- ─── workspace_skill_overrides ─────────────────────────────────────

create table if not exists public.workspace_skill_overrides (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    skill_id text not null,
    params jsonb not null,
    accepted_proposal_id uuid
        references public.proposed_modifications(id) on delete set null,
    applied_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

comment on table public.workspace_skill_overrides is
    'ADR-017 PR 4 Lane 1: per-workspace overrides of a skill recipe''s default params. Skills dispatcher reads at every invocation + merges before URL build.';

-- One override per (workspace, skill). Accepting a second proposal for
-- the same skill replaces the prior override.
create unique index if not exists workspace_skill_overrides_unique_idx
    on public.workspace_skill_overrides (workspace_id, skill_id);

alter table public.workspace_skill_overrides enable row level security;

create policy workspace_skill_overrides_select_workspace
    on public.workspace_skill_overrides for select
    using (public.is_workspace_member(workspace_id));

-- Members can write their own workspace's overrides (the accept-click
-- triggers an UPSERT from the client). The detection path also writes
-- via the service role — both authenticated and service-role keys
-- pass this policy.
create policy workspace_skill_overrides_insert_workspace
    on public.workspace_skill_overrides for insert
    with check (public.is_workspace_member(workspace_id));

create policy workspace_skill_overrides_update_workspace
    on public.workspace_skill_overrides for update
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

create policy workspace_skill_overrides_delete_workspace
    on public.workspace_skill_overrides for delete
    using (public.is_workspace_member(workspace_id));

alter publication supabase_realtime add table public.workspace_skill_overrides;

-- ─── active_observation_variants ──────────────────────────────────

create table if not exists public.active_observation_variants (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    base_generator_id text not null,
    variant_name text not null,
    filter jsonb not null,
    accepted_proposal_id uuid
        references public.proposed_modifications(id) on delete set null,
    applied_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

comment on table public.active_observation_variants is
    'ADR-017 PR 4 Lane 2: parameterized variants of Phase B generators registered when operator accepts a proposal. Heartbeat reads on each tick + invokes the base generator with the filter applied.';

create unique index if not exists active_observation_variants_unique_idx
    on public.active_observation_variants (workspace_id, base_generator_id, variant_name);

alter table public.active_observation_variants enable row level security;

create policy active_observation_variants_select_workspace
    on public.active_observation_variants for select
    using (public.is_workspace_member(workspace_id));

create policy active_observation_variants_insert_workspace
    on public.active_observation_variants for insert
    with check (public.is_workspace_member(workspace_id));

create policy active_observation_variants_update_workspace
    on public.active_observation_variants for update
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

create policy active_observation_variants_delete_workspace
    on public.active_observation_variants for delete
    using (public.is_workspace_member(workspace_id));

alter publication supabase_realtime add table public.active_observation_variants;
