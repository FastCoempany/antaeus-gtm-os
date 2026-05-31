-- 20260531120000_scheduled_skills.sql
--
-- Phase E (ADR-012, 2026-05-31): server-side skill scheduling.
--
-- Two tables:
--   scheduled_skills        — one row per (workspace, skill) pair;
--                             the operator's stated schedule.
--   scheduled_skill_fires   — append-only ledger of actual fires;
--                             the heartbeat writes here, the client
--                             reads pending (unviewed) ones on app
--                             load to drive auto-navigate.
--
-- Workspace-scoped RLS via the existing is_workspace_member() helper.

-- ─── scheduled_skills ────────────────────────────────────────────────

create table if not exists public.scheduled_skills (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null default public.current_user_default_workspace_id()
        references public.workspaces(id) on delete cascade,
    created_by uuid default auth.uid() references auth.users(id) on delete set null,
    -- The bundled skill id from src/skills/recipes/. Validated at the
    -- application layer (recipes list is fixed at build time); not a
    -- foreign key because skill ids are not stored in a table.
    skill_id text not null,
    -- 'daily' | 'weekly' | 'monthly'. Schema-checked.
    cadence_kind text not null
        check (cadence_kind in ('daily', 'weekly', 'monthly')),
    -- Shape depends on cadence_kind:
    --   daily:   { hour: 9, minute: 0 }
    --   weekly:  { hour: 9, minute: 0, day_of_week: 'fri' }
    --   monthly: { hour: 9, minute: 0, day_of_month: 1 }
    cadence_data jsonb not null,
    timezone text not null default 'UTC',
    -- Pre-computed next-fire timestamp. Heartbeat polls
    -- `next_fire_at <= now()`; updated when a fire happens.
    next_fire_at timestamptz not null,
    last_fired_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- One row per (workspace, skill). Re-scheduling updates the
    -- existing row; idempotent UI.
    unique (workspace_id, skill_id)
);

comment on table public.scheduled_skills is
    'Phase E (ADR-012): operator-attached schedules for Phase C skills. One row per (workspace, skill).';

alter table public.scheduled_skills enable row level security;

create policy scheduled_skills_select_workspace
    on public.scheduled_skills for select
    using (public.is_workspace_member(workspace_id));

create policy scheduled_skills_insert_workspace
    on public.scheduled_skills for insert
    with check (public.is_workspace_member(workspace_id));

create policy scheduled_skills_update_workspace
    on public.scheduled_skills for update
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

create policy scheduled_skills_delete_workspace
    on public.scheduled_skills for delete
    using (public.is_workspace_member(workspace_id));

create index if not exists scheduled_skills_next_fire_at_idx
    on public.scheduled_skills (next_fire_at)
    where next_fire_at is not null;

-- updated_at trigger.
create or replace function public.touch_scheduled_skills_updated_at()
    returns trigger
    language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists scheduled_skills_touch_updated_at on public.scheduled_skills;
create trigger scheduled_skills_touch_updated_at
    before update on public.scheduled_skills
    for each row execute function public.touch_scheduled_skills_updated_at();

-- ─── scheduled_skill_fires ───────────────────────────────────────────

create table if not exists public.scheduled_skill_fires (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null
        references public.workspaces(id) on delete cascade,
    schedule_id uuid not null
        references public.scheduled_skills(id) on delete cascade,
    skill_id text not null,
    fired_at timestamptz not null default now(),
    viewed_at timestamptz,
    -- Phase E v1 uses (schedule_id, fired_at) as a natural unique key
    -- so the heartbeat is idempotent under retry. Two fires within
    -- the same heartbeat tick collide → no double-fire.
    unique (schedule_id, fired_at)
);

comment on table public.scheduled_skill_fires is
    'Phase E (ADR-012): pending-fire ledger written by the heartbeat. Client reads unviewed rows on app load.';

alter table public.scheduled_skill_fires enable row level security;

-- Members can read fires for their workspace + mark them viewed.
-- Writes (insert) are restricted to the service role (heartbeat).
create policy scheduled_skill_fires_select_workspace
    on public.scheduled_skill_fires for select
    using (public.is_workspace_member(workspace_id));

create policy scheduled_skill_fires_update_workspace
    on public.scheduled_skill_fires for update
    using (public.is_workspace_member(workspace_id))
    with check (public.is_workspace_member(workspace_id));

-- No insert policy → workspace members CANNOT insert. The heartbeat
-- runs under the service role which bypasses RLS.

create index if not exists scheduled_skill_fires_workspace_unviewed_idx
    on public.scheduled_skill_fires (workspace_id, fired_at desc)
    where viewed_at is null;
