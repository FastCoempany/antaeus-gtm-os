-- Captured meetings — the calendar lane (auto-capture stage 3, the
-- capture + priors plan, founder-directed walk-off-the-street version:
-- paste your calendar's secret iCal link, no OAuth, no admin).
--
-- The calendar-sync Edge Function fetches the workspace's ICS feed,
-- keeps ONLY events with an attendee at a watched Signal Console
-- account (personal events are never stored), and upserts rows here.
-- Members read; the service role is the sole writer (same posture as
-- observations).

create table if not exists public.captured_meetings (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    account_name text not null,
    title text not null default '',
    starts_at timestamptz not null,
    ends_at timestamptz,
    attendees jsonb not null default '[]'::jsonb,
    source text not null default 'ics',
    -- The ICS UID + start instant identify one occurrence (recurring
    -- events share a UID across occurrences).
    ics_uid text not null,
    created_at timestamptz not null default now()
);

create unique index if not exists captured_meetings_occurrence_key
    on public.captured_meetings (workspace_id, ics_uid, starts_at);
create index if not exists captured_meetings_workspace_starts
    on public.captured_meetings (workspace_id, starts_at desc);

alter table public.captured_meetings enable row level security;

drop policy if exists captured_meetings_select_members on public.captured_meetings;
create policy captured_meetings_select_members
    on public.captured_meetings for select
    using (public.is_workspace_member(workspace_id));

-- No insert/update/delete policies: writes are service-role only.
