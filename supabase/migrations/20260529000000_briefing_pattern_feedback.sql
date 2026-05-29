-- 20260529000000_briefing_pattern_feedback.sql
--
-- Behavioral feedback loop for the Briefing room (canon §4.21).
-- The briefing_pattern_feedback table itself was created in
-- 20260523180000_briefing_room_foundation.sql with RLS already in
-- place. This migration adds the room-facing RPCs + the cluster
-- scorer's anchor-level multiplier view.
--
-- Two RPCs:
--   submit_pattern_feedback(p_pattern_id, p_mark)  — upsert this
--     user's mark; the unique (pattern_id, user_id) constraint makes
--     the second call overwrite via on conflict.
--   clear_pattern_feedback(p_pattern_id)            — delete this
--     user's mark; idempotent.
--
-- View:
--   pattern_feedback_anchor_signal — for each (workspace, cluster_type,
--   anchor), counts used/met/noise marks over the rolling 90-day
--   window and computes a multiplier:
--     multiplier = clamp(1.0 + (used - noise) * 0.15, 0.5, 1.5)
--   The cluster scorer reads this view at the start of every Stage 3.4
--   run and passes the lookup function to evaluateCluster, so anchors
--   the operator consistently marks Noise get downweighted (need more
--   evidence to qualify) and anchors marked Used get a boost.

create or replace function public.submit_pattern_feedback(
    p_pattern_id uuid,
    p_mark text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_workspace_id uuid;
    v_user_id uuid;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'not authenticated';
    end if;
    if p_mark not in ('used', 'met', 'noise') then
        raise exception 'invalid mark: %', p_mark;
    end if;
    select workspace_id into v_workspace_id
        from public.briefing_patterns
        where id = p_pattern_id;
    if v_workspace_id is null then
        raise exception 'pattern not found: %', p_pattern_id;
    end if;
    if not public.is_workspace_member(v_workspace_id) then
        raise exception 'not a member of workspace %', v_workspace_id;
    end if;
    insert into public.briefing_pattern_feedback (
        workspace_id, pattern_id, user_id, mark
    ) values (
        v_workspace_id, p_pattern_id, v_user_id, p_mark
    )
    on conflict (pattern_id, user_id)
    do update set mark = excluded.mark, marked_at = now();
end;
$$;

grant execute on function public.submit_pattern_feedback(uuid, text) to authenticated;


create or replace function public.clear_pattern_feedback(p_pattern_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;
    delete from public.briefing_pattern_feedback
        where pattern_id = p_pattern_id and user_id = auth.uid();
end;
$$;

grant execute on function public.clear_pattern_feedback(uuid) to authenticated;


-- pattern_feedback_anchor_signal:
-- security_invoker=true so it inherits the caller's RLS — service_role
-- reads see all workspaces (which the Edge Function needs); the room's
-- authenticated read sees only the operator's workspace. Postgres 15+.
create or replace view public.pattern_feedback_anchor_signal
with (security_invoker = true)
as
    select
        bpf.workspace_id,
        bc.cluster_type,
        bc.anchor,
        sum((bpf.mark = 'used')::int) as used_count,
        sum((bpf.mark = 'met')::int) as met_count,
        sum((bpf.mark = 'noise')::int) as noise_count,
        greatest(
            0.5,
            least(
                1.5,
                1.0 + (
                    sum((bpf.mark = 'used')::int)
                    - sum((bpf.mark = 'noise')::int)
                ) * 0.15
            )
        ) as multiplier
    from public.briefing_pattern_feedback bpf
    join public.briefing_patterns bp on bp.id = bpf.pattern_id
    join public.briefing_clusters bc on bc.id = bp.cluster_id
    where bpf.marked_at >= now() - interval '90 days'
        and bc.cluster_type is not null
        and bc.anchor is not null
    group by bpf.workspace_id, bc.cluster_type, bc.anchor;

grant select on public.pattern_feedback_anchor_signal to authenticated, service_role;
