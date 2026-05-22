-- ============================================================
-- 20260522120000 — Signal Console signals table + heat annotation
--
-- Phase 4.5 Tier 1 Signal Console Step 2 — schema delta per ADR-005
-- and audit doc 2026-05-21. First retrofit migration of Phase 4.5.
--
-- Three deltas in one migration:
--
--   Delta 1: NEW `signals` table with FK to signal_console_accounts.
--            Replaces the current jsonb array in
--            signal_console_accounts.data.signals[]. Generators
--            querying signal recency want a proper table, not a
--            recursive jsonb scan.
--
--   Delta 2: Annotate signal_console_accounts.heat as informational
--            and add a `heat_computed_at` companion column. The
--            authoritative heat is computed in-memory from signals
--            (src/signal-console/lib/heat.ts). The column stays as a
--            stored snapshot; generators querying heat decay should
--            query signals.published_date directly, not this column.
--
--   Delta 3: NEW `signals_with_account` Postgres view joining signal
--            + account context inline. Generator queries (e.g.
--            "accounts whose signals have all decayed past 14 days")
--            stay one-liner SQL.
--
-- Step 3 of Signal Console's retrofit lifecycle will add the
-- dual-write call sites that populate this new table. Step 2 is
-- schema-only.
--
-- See: deliverables/adr/adr-005-data-layer-parity-2026-05-20.md
-- See: deliverables/audit/data-parity-signal-console-2026-05-21.md
-- ============================================================

-- =====================================================================
-- DELTA 1: signals table
-- =====================================================================

create table public.signals (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references public.signal_console_accounts(id)
        on delete cascade,
    workspace_id uuid not null
        default public.current_user_default_workspace_id(),

    -- Editorial columns — denormalized for index efficiency.
    signal_type text,          -- exec_change | funding | hiring | ...
    headline text,
    source text,
    url text,

    -- Temporal columns — heat engine reads published_date first,
    -- then fetched_at, then captured_at.
    published_date timestamptz,
    fetched_at timestamptz,
    captured_at timestamptz default now(),

    -- Quality columns.
    confidence numeric(3, 2),  -- 0.00 to 1.00; +5 heat bonus when ≥ 0.90
    is_ai boolean default false,
    flagged boolean default false,
    note text,

    -- Forward-compat blob — any field that doesn't yet have a column.
    data jsonb default '{}'::jsonb,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index for the most common query shape: signals for one account,
-- ordered by recency.
create index signals_account_published_idx on public.signals(
    account_id,
    published_date desc nulls last
);

-- Index for cross-account workspace queries (the orchestration layer's
-- signal-decay generator queries by workspace, not by account).
create index signals_workspace_published_idx on public.signals(
    workspace_id,
    published_date desc nulls last
);

-- Partial index: most queries want only un-flagged signals (heat engine
-- excludes flagged). The partial index is more efficient than a full
-- one for the common case.
create index signals_unflagged_idx on public.signals(
    account_id,
    published_date desc
) where flagged = false;

-- Workspace-scoped RLS following the pattern from migration 0005.
-- Members of the workspace can read; the service role (heartbeat) writes.
-- Members can also update note + flagged (the operator-controlled fields).
alter table public.signals enable row level security;

create policy signals_select_workspace on public.signals
    for select using (public.is_workspace_member(workspace_id));

create policy signals_insert_workspace on public.signals
    for insert with check (public.is_workspace_member(workspace_id));

create policy signals_update_workspace on public.signals
    for update using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

create policy signals_delete_workspace on public.signals
    for delete using (public.is_workspace_member(workspace_id));

-- Realtime publication so cross-tab + cross-device signal updates
-- flow into Signal Console without a refresh.
alter publication supabase_realtime add table public.signals;

-- Comment for future readers + audit-doc cross-reference.
comment on table public.signals is
    'Time-limited events implying commercial opportunity, scoped to a '
    'signal_console_accounts row. Source of truth for the orchestration '
    'layer signal-decay generator. RLS gates per-workspace delivery. '
    'See deliverables/audit/data-parity-signal-console-2026-05-21.md §Delta 1.';

-- =====================================================================
-- DELTA 2: heat_computed_at + annotation on heat column
-- =====================================================================

alter table public.signal_console_accounts
    add column if not exists heat_computed_at timestamptz;

comment on column public.signal_console_accounts.heat is
    'Snapshot value at last save. Authoritative heat is computed '
    'in-memory from the signals table (see src/signal-console/lib/heat.ts). '
    'Heat-decay generators should query signals.published_date directly, '
    'not this column. See audit doc §Delta 2.';

comment on column public.signal_console_accounts.heat_computed_at is
    'When the heat snapshot was last refreshed. A stale heat_computed_at '
    'means the heat column is unreliable for current ranking. Generators '
    'reading the heat column should also check this.';

-- =====================================================================
-- DELTA 3: signals_with_account view
-- =====================================================================

create or replace view public.signals_with_account as
select
    s.id,
    s.account_id,
    s.workspace_id,
    s.signal_type,
    s.headline,
    s.source,
    s.url,
    s.published_date,
    s.fetched_at,
    s.captured_at,
    s.confidence,
    s.is_ai,
    s.flagged,
    s.note,
    s.data,
    s.created_at,
    s.updated_at,
    a.account_name,
    a.domain,
    a.ticker,
    a.industry,
    a.heat as account_heat,
    a.heat_computed_at as account_heat_computed_at
from public.signals s
inner join public.signal_console_accounts a on s.account_id = a.id;

-- Views inherit RLS from underlying tables, so signals_with_account is
-- automatically workspace-scoped via the signals table's policies. The
-- comment below makes that explicit for future readers.
comment on view public.signals_with_account is
    'Generator-friendly join of signals + signal_console_accounts. RLS '
    'is inherited from the signals table''s workspace_id policy. Use '
    'this for queries like "find accounts whose signals have all '
    'decayed past 14 days." See audit doc §Delta 3.';

-- =====================================================================
-- Useful queries for verifying after apply:
--
--   -- Confirm the signals table exists + has the expected shape:
--   \d public.signals
--
--   -- Confirm RLS policies are in place:
--   select policyname, cmd, qual, with_check
--   from pg_policies where tablename = 'signals';
--
--   -- Confirm the view exists:
--   select definition from pg_views where viewname = 'signals_with_account';
--
--   -- Confirm realtime publication:
--   select schemaname, tablename
--   from pg_publication_tables where pubname = 'supabase_realtime'
--   and tablename = 'signals';
--
--   -- Sanity: empty table just after migration (Step 3 populates it):
--   select count(*) from public.signals;
-- =====================================================================
