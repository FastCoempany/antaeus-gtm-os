-- Settings "Delete everything" (canon §4.20) — server-side wipe.
--
-- Several workspace tables are written only by the system (the
-- heartbeat, the calendar sync, the research Edge Functions) or are
-- append-only for members (readiness history, briefing audit
-- envelopes). RLS gives members no DELETE policy on them, so a
-- client-side, row-by-row delete can't empty the workspace. This
-- function runs as the table owner, checks the caller is a member of
-- the workspace, and deletes every workspace-scoped row.
--
-- Kept on purpose: public.workspaces, public.workspace_members (so the
-- operator can keep signing in) and public.profiles (per person, not
-- per workspace).
--
-- Defensive: each table runs in its own sub-transaction. One failing
-- table is reported in `errors` and the rest still go. Tables that
-- don't exist yet (a preview branch behind main) are skipped.
--
-- Order is children first so each count reflects rows that table
-- actually held (a parent delete would otherwise cascade them away
-- first and report 0). The list mirrors
-- src/settings/lib/workspace-tables.ts — workspace-tables.test.ts
-- fails if the two drift.
--
-- Returns: { "deleted": { "<table>": <rows> }, "errors": { "<table>": "<message>" } }
--
-- Additive only: new function, no table or policy changes.

create or replace function public.delete_workspace_data(ws uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    target_tables text[] := array[
        'workspace_sessions',
        'studio_artifacts',
        'scheduled_skill_fires',
        'scheduled_skills',
        'active_observation_variants',
        'workspace_skill_overrides',
        'proposed_modifications',
        'observations',
        'briefing_html_snapshots',
        'briefing_trigger_fires',
        'briefing_watchlist_triggers',
        'briefing_watchlist_entities',
        'briefing_periphery_candidates',
        'briefing_pattern_feedback',
        'briefing_pattern_eval',
        'briefing_audit_envelopes',
        'briefing_patterns',
        'briefing_clusters',
        'briefing_enriched_items',
        'briefing_raw_items',
        'briefing_runs',
        'outdoors_events',
        'outdoors_events_runs',
        'founding_gtm_shares',
        'handoff_artifacts',
        'readiness_snapshots',
        'advisor_deployments',
        'proofs',
        'discovery_call_logs',
        'discovery_frameworks',
        'deals',
        'captured_meetings',
        'sequences',
        'prospecting_research_runs',
        'signals',
        'signal_console_accounts',
        'pipeline_settings',
        'icps',
        'workspace_profile'
    ];
    t text;
    n bigint;
    deleted jsonb := '{}'::jsonb;
    errors jsonb := '{}'::jsonb;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;
    if ws is null or not public.is_workspace_member(ws) then
        raise exception 'not a member of workspace %', ws;
    end if;

    foreach t in array target_tables loop
        if to_regclass('public.' || t) is null then
            continue;
        end if;
        begin
            execute format('delete from public.%I where workspace_id = $1', t)
                using ws;
            get diagnostics n = row_count;
            deleted := deleted || jsonb_build_object(t, n);
        exception when others then
            errors := errors || jsonb_build_object(t, sqlerrm);
        end;
    end loop;

    return jsonb_build_object('deleted', deleted, 'errors', errors);
end;
$$;

comment on function public.delete_workspace_data(uuid) is
    'Settings "Delete everything": deletes every workspace-scoped row for a workspace the caller belongs to. Keeps workspaces, workspace_members, profiles.';

revoke all on function public.delete_workspace_data(uuid) from public;
revoke all on function public.delete_workspace_data(uuid) from anon;
grant execute on function public.delete_workspace_data(uuid) to authenticated;
