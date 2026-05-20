-- ============================================================
-- 20260519180000 — workspace_sessions
--
-- Phase A of the orchestration layer (ADR-004). Introduces a
-- workspace-scoped session object that all rooms read from + write
-- to. Carries the operator's current focused object (account/deal/
-- signal/etc.) plus a rolling log of the last 20 cross-room actions.
--
-- One row per workspace. Updated frequently (every focus change in
-- any room). Read by every room. Subscribed to via Supabase Realtime
-- for cross-tab consistency.
--
-- Why this exists: continuity params (URL strings — returnTo,
-- focusObject, etc.) are limited to short identifiers passed via
-- href. A real session object carries structured state, persists
-- across page loads, and is the foundation for the birdseye strip,
-- inter-room push, and the observations ledger.
--
-- See: deliverables/adr/adr-004-orchestration-layer-foundation-2026-05-19.md
-- ============================================================

create table public.workspace_sessions (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    focused_object_type text,
    focused_object_id text,
    focused_object_name text,
    focused_object_room text,
    -- Rolling log of the last 20 cross-room actions. jsonb array.
    -- Each element shape (validated in TypeScript, not DB):
    --   {
    --     at: ISO8601 timestamp,
    --     room: 'signal-console' | 'deal-workspace' | ...,
    --     verb: 'focus' | 'save' | 'advance' | 'dismiss' | ...,
    --     objectType: same set as focused_object_type | null,
    --     objectId: string | null,
    --     summary: string  // plain-english one-liner for the strip
    --   }
    recent_actions jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- One session per workspace.
    constraint workspace_sessions_workspace_id_key unique (workspace_id)
);

-- Helpful index for the data-client when filtering by workspace.
create index workspace_sessions_workspace_id_idx
    on public.workspace_sessions (workspace_id);

-- RLS — workspace-scoped read + write for members.
alter table public.workspace_sessions enable row level security;

create policy workspace_sessions_select_workspace
    on public.workspace_sessions
    for select
    using (public.is_workspace_member(workspace_id));

create policy workspace_sessions_insert_workspace
    on public.workspace_sessions
    for insert
    with check (public.is_workspace_member(workspace_id));

create policy workspace_sessions_update_workspace
    on public.workspace_sessions
    for update
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

create policy workspace_sessions_delete_workspace
    on public.workspace_sessions
    for delete
    using (public.is_workspace_member(workspace_id));

-- Auto-bump updated_at on row update (matches the pattern used on
-- other tables in 20260424170003).
create or replace function public.touch_workspace_session_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger workspace_sessions_touch_updated_at
    before update on public.workspace_sessions
    for each row execute function public.touch_workspace_session_updated_at();

-- Realtime publication — required for Supabase Realtime subscribe to
-- work on this table. Without this, the data-client subscribe call
-- returns silently with no events. Matches the pattern on deals/
-- proofs/etc.
alter publication supabase_realtime add table public.workspace_sessions;

comment on table public.workspace_sessions is
    'Phase A of the orchestration layer (ADR-004). One session per workspace carrying the operator''s current focused object + recent cross-room actions. Read by every room, written by any room when focus changes. Subscribed to via Realtime for cross-tab consistency.';

comment on column public.workspace_sessions.focused_object_type is
    'One of: account, deal, signal, call, proof, advisor, focus, approach. Null when no object is focused (e.g. operator is on Dashboard).';

comment on column public.workspace_sessions.focused_object_name is
    'Denormalized object name for fast birdseye-strip render without a join. Updated when focus changes.';

comment on column public.workspace_sessions.focused_object_room is
    'The room that owns this object as its primary surface (e.g. account → signal-console, deal → deal-workspace). Lets the birdseye strip know where "home" is.';

comment on column public.workspace_sessions.recent_actions is
    'Rolling log of the last 20 cross-room actions, newest first. jsonb array. Schema validated in src/lib/session/types.ts.';
