-- 20260529020000_briefing_pattern_eval_critic.sql
--
-- Critic-scoring support for the B.7 Eval Harness production-sampling
-- substrate (canon §4.21).
--
-- The briefing_pattern_eval table (20260529010000) captures the gate's
-- verdict at synthesis time. This migration adds the layer that lets
-- the retroactive critic worker write critic_score + critic_notes +
-- critic_model + scored_at back into existing rows.
--
-- Two pieces:
--   1. UPDATE policy on briefing_pattern_eval scoped to service_role.
--      Authenticated readers stay read-only.
--   2. The pattern_eval_voice_signal view is extended to expose
--      mean_critic_score so the rolling-30d voice signal includes the
--      independent critic's read, not just gate metrics.

-- Service-role only UPDATE. Authenticated members never write here —
-- the critic worker runs as service_role from the briefing-pattern-
-- critic Edge Function and is the sole author of these columns.
create policy briefing_pattern_eval_update_service_role
    on public.briefing_pattern_eval for update
    to service_role
    using (true)
    with check (true);


-- Extend the voice signal view to surface mean_critic_score. Drop and
-- recreate because adding a column to a view requires the create-or-
-- replace form to match column types exactly; cleanest path is a full
-- redefinition.
drop view if exists public.pattern_eval_voice_signal;

create view public.pattern_eval_voice_signal
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
        avg(critic_score) filter (where critic_score is not null) as mean_critic_score,
        sum(case when critic_score is not null then 1 else 0 end) as scored_count,
        max(captured_at) as last_captured_at
    from public.briefing_pattern_eval
    where captured_at >= now() - interval '30 days'
        and cluster_type is not null
        and anchor is not null
    group by workspace_id, cluster_type, anchor;

grant select on public.pattern_eval_voice_signal to authenticated, service_role;
