-- 20260529010000_briefing_pattern_eval.sql
--
-- Production-sampling half of the Eval Harness (canon §4.21).
--
-- Every Pattern that lands in briefing_patterns gets a paired row in
-- pattern_eval capturing the quality gate's verdict at synthesis
-- time. This is the regression substrate — if a future deploy starts
-- producing Patterns with more hedging, more banned vocabulary, lower
-- gate-passes-on-first-try rate, the diff is observable in this
-- table without re-running the LLM.
--
-- The pre-merge half of the eval harness (corpus + vitest gate) lives
-- in src/briefing/lib/synthesis/*.test.ts — that's the existing
-- coverage. This migration adds the table that the production-side
-- writes go to.
--
-- Optional follow-up (not in this PR): a critic LLM that retroactively
-- scores N% of pattern_eval rows on voice fidelity + claim/evidence
-- alignment + recommended-move quality. Schema is forward-compatible
-- with that — critic_score + critic_notes + critic_model + scored_at
-- columns are nullable so the critic can fill them later.

create table public.briefing_pattern_eval (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    pattern_id uuid not null references public.briefing_patterns(id) on delete cascade,
    -- One row per pattern. Re-runs of the same pattern (rare; we don't
    -- re-synthesize) would conflict on this; in practice the unique
    -- constraint is a safety net, not a contention point.
    constraint briefing_pattern_eval_one_per_pattern unique (pattern_id),

    -- Captured at synthesis time, never updated:
    captured_at timestamptz not null default now(),
    gate_passes boolean not null,
    gate_failures text[] not null default '{}',
    -- Full gate.checks snapshot (per-check pass/fail + detail) for
    -- regression diffing. Compact enough to query at scale.
    gate_checks jsonb not null default '[]'::jsonb,
    -- Synthesis attempt metrics — repair_used means draft was rejected
    -- by critique and a repair pass had to run; a rising trend here
    -- is a quality signal worth watching.
    repair_used boolean not null default false,
    -- Quick-access fields denormalized from briefing_patterns +
    -- briefing_clusters so eval queries don't need to join three
    -- tables. Read-only mirrors; the source of truth is the parent
    -- rows.
    cluster_type text,
    anchor text,
    confidence numeric(3,2),
    synthesis_cost_usd numeric(8,4),

    -- Retroactive critic scoring (future work). Nullable at insert.
    critic_score numeric(3,2),
    critic_notes jsonb,
    critic_model text,
    scored_at timestamptz
);

create index briefing_pattern_eval_workspace_captured_idx
    on public.briefing_pattern_eval(workspace_id, captured_at desc);
create index briefing_pattern_eval_anchor_idx
    on public.briefing_pattern_eval(workspace_id, cluster_type, anchor);
create index briefing_pattern_eval_unscored_idx
    on public.briefing_pattern_eval(workspace_id)
    where critic_score is null;

alter table public.briefing_pattern_eval enable row level security;

-- Workspace-member read; only service-role writes (the Edge Function
-- inserts these as part of synthesis). No update / delete policies —
-- the rows are immutable once written. The critic-scoring follow-up
-- will need an UPDATE policy scoped to service-role, added then.
create policy briefing_pattern_eval_select_workspace
    on public.briefing_pattern_eval for select
    to authenticated
    using (public.is_workspace_member(workspace_id));


-- pattern_eval_voice_signal:
-- Rolling 30-day voice-quality signal per (workspace, cluster_type,
-- anchor). Tracks the gate-pass rate, the repair-used rate, and the
-- mean confidence. A drop in any of these is the early warning that
-- a prompt change has degraded quality.
create or replace view public.pattern_eval_voice_signal
with (security_invoker = true)
as
    select
        workspace_id,
        cluster_type,
        anchor,
        count(*) as pattern_count,
        sum(case when gate_passes then 1 else 0 end)::numeric / count(*) as gate_pass_rate,
        sum(case when repair_used then 1 else 0 end)::numeric / count(*) as repair_rate,
        avg(confidence) as mean_confidence,
        avg(synthesis_cost_usd) as mean_cost_usd,
        max(captured_at) as last_captured_at
    from public.briefing_pattern_eval
    where captured_at >= now() - interval '30 days'
        and cluster_type is not null
        and anchor is not null
    group by workspace_id, cluster_type, anchor;

grant select on public.pattern_eval_voice_signal to authenticated, service_role;
