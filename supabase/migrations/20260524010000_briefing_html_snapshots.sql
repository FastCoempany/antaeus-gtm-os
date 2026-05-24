-- ============================================================
-- 20260524010000 — briefing_html_snapshots (Briefing B.1c)
--
-- The snapshot store the HTML-diff source fetcher uses to detect
-- meaningful changes on URLs the operator wants to monitor (a
-- competitor's pricing page, a key product page, etc.).
--
-- One row per (workspace_id, url). On each pipeline run, the
-- fetcher:
--   1. Reads the row (if any) for each URL in the workspace's
--      HydratedContext.tracked_urls
--   2. Fetches the URL, strips HTML to text, hashes (SHA-256)
--   3. If no prior row exists, INSERTs the snapshot — establishes
--      baseline, emits no RawItem (no diff to report)
--   4. If a prior row exists and the hash matches, UPDATEs
--      last_seen_at — no diff to report
--   5. If a prior row exists and the hash differs, UPDATEs the row
--      (new hash, new text, new last_changed_at) AND emits a
--      RawItem to briefing_raw_items with the diff context
--
-- This is the "establish baseline, alert on delta" pattern. The
-- alternative (storing every snapshot indefinitely) doesn't fit
-- the surface — the operator wants to know WHEN a page changed
-- and roughly WHAT changed, not the full version history.
--
-- The text_content column is the stripped text of the most recent
-- snapshot — kept so a future "what changed" UI (B.6 audit
-- envelopes territory) can diff the prior vs current text. Storage
-- cost is modest; pages average 5-20KB stripped.
--
-- Ref: deliverables/specs/briefing/01-build-phase-plan.md §B.1
-- Ref: deliverables/specs/briefing/signal_console_intelligence_coverage_audit.md §3.1 (Wayback Machine row)
-- Ref: deliverables/adr/adr-006-briefing-room-2026-05-23.md
-- ============================================================

create table public.briefing_html_snapshots (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null
        default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    url text not null,
    content_hash text not null,
    text_content text,
    char_count integer not null default 0,
    first_seen_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    last_changed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- One canonical snapshot per (workspace, url). The fetcher
    -- UPSERTs on every run.
    unique (workspace_id, url)
);

create index briefing_html_snapshots_workspace_idx
    on public.briefing_html_snapshots(workspace_id);
create index briefing_html_snapshots_last_changed_idx
    on public.briefing_html_snapshots(workspace_id, last_changed_at desc nulls last);

alter table public.briefing_html_snapshots enable row level security;

create policy briefing_html_snapshots_select_workspace
    on public.briefing_html_snapshots
    for select using (public.is_workspace_member(workspace_id));

create policy briefing_html_snapshots_insert_workspace
    on public.briefing_html_snapshots
    for insert with check (public.is_workspace_member(workspace_id));

create policy briefing_html_snapshots_update_workspace
    on public.briefing_html_snapshots
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

create policy briefing_html_snapshots_delete_workspace
    on public.briefing_html_snapshots
    for delete using (public.is_workspace_member(workspace_id));

-- updated_at autobump trigger — reuses public.update_updated_at_column()
-- which was created back in 20260424170000_workspaces_and_members.sql
-- and is used by every workspace-scoped table that tracks edits.
create trigger briefing_html_snapshots_set_updated_at
    before update on public.briefing_html_snapshots
    for each row execute function public.update_updated_at_column();

-- Realtime publication — operator-facing UIs (the future "watched
-- pages" surface, if it ships) can subscribe to changes. The
-- pipeline itself doesn't need realtime; it reads + writes via
-- the service role.
alter publication supabase_realtime add table public.briefing_html_snapshots;

comment on table public.briefing_html_snapshots is
    'Snapshot store for the HTML-diff Briefing source (B.1c). One row per (workspace, url). The pipeline UPSERTs on every run and emits a briefing_raw_items row when content_hash changes.';
