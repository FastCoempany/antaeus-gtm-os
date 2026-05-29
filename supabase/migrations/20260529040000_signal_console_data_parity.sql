-- 20260529040000_signal_console_data_parity.sql
--
-- Phase 4.5 Checkpoint 2 / Step 2 per ADR-005. Schema additions for
-- Signal Console's data-parity retrofit, scoped per the Step 1 audit
-- (deliverables/audit/data-parity-signal-console-2026-05-29.md §3).
--
-- Three concrete changes, all additive (per ADR-005 §"Schema design
-- principles — additive over redesign"):
--
--   3.1 New column workspaces.gtm_config jsonb. Replaces the per-user
--       localStorage override gtmos_enrichment_base_url with a
--       workspace-level config blob other rooms can extend over
--       Phase 4.5 lifecycle. Nullable-by-default so existing rows
--       continue to parse.
--
--   3.2 New SQL function signal_console_health_snapshot() returning
--       jsonb. Computes the same shape SignalRoomHealthSnapshot
--       carries today, server-side, so Dashboard's command-
--       intelligence rail can read live from Postgres instead of
--       gtmos_signal_room_health localStorage. Single RPC call,
--       single jsonb response — same I/O shape as the localStorage
--       read.
--
--   3.3 No-op for profiles.ui_preferences: gtmos_sc_heat_bands_
--       dismissed graduates to a key under the existing jsonb
--       column. No schema change needed; documented here so the
--       Step 3 + Step 4 PRs know which key to read/write.

-- ============================================================
-- 3.1 workspaces.gtm_config
-- ============================================================

alter table public.workspaces
    add column if not exists gtm_config jsonb not null default '{}'::jsonb;

comment on column public.workspaces.gtm_config is
'Workspace-level configuration blob. Other rooms extend this with their config keys over Phase 4.5 lifecycle. Signal Console reads gtm_config->>''enrichment_base_url'' to replace the legacy gtmos_enrichment_base_url localStorage override.';


-- ============================================================
-- 3.2 signal_console_health_snapshot() function
-- ============================================================
--
-- Returns one jsonb per workspace, matching the SignalRoomHealthSnapshot
-- shape from src/signal-console/lib/health-snapshot.ts. Service-role
-- callers can pass any workspace_id; authenticated callers get the
-- caller's default workspace via current_user_default_workspace_id().
--
-- The function is SECURITY INVOKER so RLS scopes the reads to the
-- caller's workspace membership.

create or replace function public.signal_console_health_snapshot(
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
    accounts_with_metrics as (
        select
            a.id,
            a.account_name,
            a.heat,
            -- 4-band classification mirrors heatBand() in
            -- src/signal-console/lib/heat.ts.
            case
                when a.heat >= 91 then 'Hot'
                when a.heat >= 75 then 'Active'
                when a.heat >= 50 then 'Watch'
                else 'Low'
            end as band,
            (
                select count(*) from public.signals s
                    where s.account_id = a.id and s.flagged is not true
            ) as signal_count,
            (
                select count(*) from public.signals s
                    where s.account_id = a.id
                        and s.flagged is not true
                        and coalesce(s.published_date, s.fetched_at, s.captured_at)
                            >= now() - interval '14 days'
            ) as recent_count,
            (
                select count(*) from public.signals s
                    where s.account_id = a.id
                        and s.flagged is not true
                        and s.confidence >= 0.90
            ) as high_confidence_count
        from public.signal_console_accounts a
        where a.workspace_id = (select id from target)
    ),
    aggregates as (
        select
            count(*) as account_count,
            sum(signal_count) as signal_count,
            sum(case when heat >= 75 then 1 else 0 end) as ready_count
        from accounts_with_metrics
    ),
    top_account as (
        select
            id, account_name, heat, band,
            signal_count, recent_count, high_confidence_count
        from accounts_with_metrics
        order by heat desc, account_name asc
        limit 1
    ),
    hot_accounts as (
        select jsonb_agg(jsonb_build_object(
            'id', id,
            'name', account_name,
            'heat', heat,
            'band', band,
            'signalCount', signal_count,
            'recentSignals', recent_count,
            'highConfidenceSignals', high_confidence_count
        ) order by heat desc, account_name asc) as items
        from (
            select id, account_name, heat, band, signal_count, recent_count, high_confidence_count
            from accounts_with_metrics
            order by heat desc, account_name asc
            limit 5
        ) hot
    )
    select jsonb_build_object(
        'capturedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'workspaceId', (select id from target),
        'accountCount', coalesce((select account_count from aggregates), 0),
        'signalCount', coalesce((select signal_count from aggregates), 0),
        'readyCount', coalesce((select ready_count from aggregates), 0),
        'topAccountId', (select id from top_account),
        'topAccountName', coalesce((select account_name from top_account), ''),
        'topHeat', coalesce((select heat from top_account), 0),
        'topBand', coalesce((select band from top_account), 'Low'),
        'topSignalCount', coalesce((select signal_count from top_account), 0),
        'topHighConfidenceCount', coalesce((select high_confidence_count from top_account), 0),
        'topRecentCount', coalesce((select recent_count from top_account), 0),
        'hot_accounts', coalesce((select items from hot_accounts), '[]'::jsonb)
    );
$$;

grant execute on function public.signal_console_health_snapshot(uuid) to authenticated, service_role;

comment on function public.signal_console_health_snapshot(uuid) is
'Returns the SignalRoomHealthSnapshot shape (src/signal-console/lib/health-snapshot.ts) as jsonb. Replaces the gtmos_signal_room_health localStorage write; Dashboard reads this server-side via the RPC.';
