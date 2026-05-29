-- 20260529050000_deal_workspace_data_parity.sql
--
-- Phase 4.5 Checkpoint 2 / Step 2 per ADR-005. Schema additions for
-- Deal Workspace's data-parity retrofit, scoped per the Step 1 audit
-- (deliverables/audit/data-parity-deal-workspace-2026-05-29.md §3).
--
-- Two additive changes:
--
--   3.1a New column deals.recovery_rank integer (not null default 0).
--        Cached recovery rank. Written by the JS save-path on every
--        deal mutation (Step 3). Unset rows sort to the bottom by
--        defaulting to 0. Avoids porting the staleness/next-step/
--        close-date math from src/deal-workspace/lib/recovery.ts to
--        PL/pgSQL — much smaller surface to maintain.
--
--   3.1b New SQL function deal_workspace_health_snapshot(p_workspace_id)
--        returning jsonb. Reads from cached recovery_rank to produce
--        the same shape DealWorkspaceHealthSnapshot has in JS today
--        (src/deal-workspace/lib/health-snapshot.ts). Replaces the
--        gtmos_deal_workspace_health localStorage write; Dashboard's
--        command-intelligence rail reads this RPC server-side.

-- ============================================================
-- 3.1a deals.recovery_rank
-- ============================================================

alter table public.deals
    add column if not exists recovery_rank integer not null default 0;

comment on column public.deals.recovery_rank is
'Cached recovery rank (0-100, higher = more at risk). Computed by the JS save-path in src/deal-workspace/lib/recovery.ts; persisted on every deal mutation. Lane thresholds: critical >= 70, at-risk 40-69, healthy < 40. The deal_workspace_health_snapshot() RPC reads this column rather than recomputing.';


-- ============================================================
-- 3.1b deal_workspace_health_snapshot() function
-- ============================================================
--
-- Returns one jsonb per workspace, matching the DealWorkspaceHealthSnapshot
-- shape from src/deal-workspace/lib/health-snapshot.ts. SECURITY INVOKER
-- so RLS scopes the read.

create or replace function public.deal_workspace_health_snapshot(
    p_workspace_id uuid default null
) returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
    with
    target as (
        select coalesce(p_workspace_id, current_user_default_workspace_id()) as id
    ),
    deals_scope as (
        select * from public.deals
        where workspace_id = (select id from target)
    ),
    active_deals as (
        -- Mirrors the legacy filter: stage NOT IN closed_won/closed_lost.
        -- The stage column carries the legacy stage IDs from
        -- src/deal-workspace/lib/deal-shape.ts; check exhaustively.
        select * from deals_scope
        where stage not in ('closed_won', 'closed_lost', 'won', 'lost', 'closed-won', 'closed-lost')
    ),
    aggregates as (
        select
            (select count(*) from active_deals) as active_count,
            (select count(*) from deals_scope where stage in ('closed_won', 'won', 'closed-won')) as won_count,
            (select count(*) from deals_scope where stage in ('closed_lost', 'lost', 'closed-lost')) as lost_count,
            (select coalesce(sum(deal_value), 0) from active_deals) as pipeline_value,
            (select count(*) from active_deals where recovery_rank >= 70) as critical_count,
            (select count(*) from active_deals where recovery_rank >= 40 and recovery_rank < 70) as at_risk_count,
            (select count(*) from active_deals where recovery_rank < 40) as healthy_count
    ),
    top_pressure as (
        -- Top 5 most-at-risk active deals. The 'cause' field is
        -- derived from the column with the strongest signal, mirroring
        -- the lane vocabulary from src/deal-workspace/lib/recovery.ts.
        -- Higher recovery_rank → more at risk, so order desc.
        select jsonb_agg(jsonb_build_object(
            'id', id,
            'account_name', coalesce(account_name, ''),
            'stage', stage,
            'value', deal_value,
            'recovery_rank', recovery_rank,
            'cause', case
                when recovery_rank >= 70 then 'Critical'
                when recovery_rank >= 40 then 'At risk'
                else 'Healthy'
            end
        ) order by recovery_rank desc, deal_value desc) as items
        from (
            select id, account_name, stage, deal_value, recovery_rank
            from active_deals
            order by recovery_rank desc, deal_value desc
            limit 5
        ) top
    )
    select jsonb_build_object(
        'capturedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'workspaceId', (select id from target),
        'activeCount', coalesce((select active_count from aggregates), 0),
        'wonCount', coalesce((select won_count from aggregates), 0),
        'lostCount', coalesce((select lost_count from aggregates), 0),
        'pipelineValue', coalesce((select pipeline_value from aggregates), 0),
        'laneCounts', jsonb_build_object(
            'critical', coalesce((select critical_count from aggregates), 0),
            'at_risk', coalesce((select at_risk_count from aggregates), 0),
            'healthy', coalesce((select healthy_count from aggregates), 0)
        ),
        'topPressure', coalesce((select items from top_pressure), '[]'::jsonb)
    );
$$;

grant execute on function public.deal_workspace_health_snapshot(uuid) to authenticated, service_role;

comment on function public.deal_workspace_health_snapshot(uuid) is
'Returns the DealWorkspaceHealthSnapshot shape (src/deal-workspace/lib/health-snapshot.ts) as jsonb. Reads from cached deals.recovery_rank. Replaces gtmos_deal_workspace_health localStorage write; Dashboard reads this RPC server-side.';
