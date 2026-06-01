-- 20260601200000_outdoors_events.sql
--
-- ADR-015 (2026-06-01): Outdoors Events room — first-ship schema.
--
-- A single table tracking offline gatherings the operator wants on
-- their radar. Strictly informational; no deal-attribution, no ROI.
-- Workspace-scoped via RLS using the existing is_workspace_member()
-- helper.
--
-- Per ADR-015 §6 the schema is minimum-viable:
--   - name (required)
--   - kind (free text — operator authors; no enum)
--   - where_at (free text — city, venue, virtual)
--   - start_date / end_date (optional)
--   - status (enum, default 'watching')
--   - tags (text array — persona / industry / whatever)
--   - notes (free text)
--   - source_url (optional)

create table if not exists public.outdoors_events (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    created_by uuid default auth.uid() references auth.users(id) on delete set null,
    -- Required: what the operator calls it.
    name text not null,
    -- Free-text classifier — "conference" / "mixer" / "trade show" / etc.
    -- No enum per founder direction; operator authors freely.
    kind text,
    -- Free-text location — "Las Vegas, NV" / "Online" / venue name.
    where_at text,
    start_date date,
    end_date date,
    -- Status lifecycle. Five values cover the journey from radar to
    -- archive. 'attending' is the optional active-during-event state;
    -- many events skip directly from 'planning' to 'attended'.
    status text not null default 'watching'
        check (status in (
            'watching',
            'planning',
            'attending',
            'attended',
            'passed',
            'archived'
        )),
    -- Operator-authored tags for filtering. ICP persona names, industry
    -- labels, whatever the operator wants.
    tags text[] not null default array[]::text[],
    notes text,
    source_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.outdoors_events is
    'ADR-015: offline gatherings the operator is tracking. Strictly informational; not a sacred noun.';

-- ─── Indexes ────────────────────────────────────────────────────────

create index if not exists outdoors_events_workspace_status_idx
    on public.outdoors_events (workspace_id, status);

create index if not exists outdoors_events_workspace_start_date_idx
    on public.outdoors_events (workspace_id, start_date)
    where start_date is not null;

-- ─── RLS ────────────────────────────────────────────────────────────

alter table public.outdoors_events enable row level security;

create policy outdoors_events_select_workspace
    on public.outdoors_events for select
    using (public.is_workspace_member(workspace_id));

create policy outdoors_events_insert_workspace
    on public.outdoors_events for insert
    with check (public.is_workspace_member(workspace_id));

create policy outdoors_events_update_workspace
    on public.outdoors_events for update
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

create policy outdoors_events_delete_workspace
    on public.outdoors_events for delete
    using (public.is_workspace_member(workspace_id));

-- ─── updated_at trigger ─────────────────────────────────────────────

-- Use the existing public.touch_updated_at() helper if present; else
-- declare it. (Most existing tables share one; defensive create.)
create or replace function public.outdoors_events_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists outdoors_events_touch_updated_at on public.outdoors_events;
create trigger outdoors_events_touch_updated_at
    before update on public.outdoors_events
    for each row execute function public.outdoors_events_touch_updated_at();

-- ─── Realtime ───────────────────────────────────────────────────────

alter publication supabase_realtime add table public.outdoors_events;
