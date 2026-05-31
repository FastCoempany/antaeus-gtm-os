# ADR-012 — Skill scheduling (Phase E of the orchestration layer)

**Status:** Approved by founder 2026-05-31
**Date:** 2026-05-31
**Builds on:** ADR-004 (orchestration foundation), ADR-010 (Skills layer), ADR-011 (Birdseye Float)

---

## Context

ADR-004 §Phasing called Phase E "operator scheduling — cron-style 'remind me Friday', auto-running skills." With Phase C skills shipping and Phase D giving the system a persistent presence, the missing piece is letting the operator attach a schedule to a skill so the system fires it on a cadence — the operator opens the app later and the result is waiting for them.

The design-review mockup (`deliverables/mockups/phase-d-and-e-variants-2026-05-31.html`) framed one open dimension: what does "auto-run" actually do? The founder locked **E1-A: auto-navigate on arrival** on 2026-05-31.

## Decision

**Phase E ships server-side skill scheduling.** Operators attach a schedule to any Phase C skill via the Cmd+K palette; the heartbeat picks up due schedules and writes a "pending skill fire" record; when the operator next opens the app, they're auto-routed to the result room with a toast confirming which skill fired.

Six locked design points:

1. **What can be scheduled**: only Phase C skills. Bundled, deterministic, voice-gated. Arbitrary URLs / room visits are out of scope.

2. **Schedule cadence (v1)**: three options — `daily-at-time`, `weekly-on-day-at-time`, `monthly-on-date-at-time`. Times are stored as ISO-formatted local time (the operator's intent — "9am" — not UTC) plus a timezone offset. Cron expression generation is internal; the operator never sees it.

3. **Storage**: new `scheduled_skills` Supabase table, workspace-scoped via RLS. One row per `(workspace_id, skill_id)` pair — re-scheduling a skill updates the existing row. Schedules persist across sessions and devices.

4. **Trigger mechanism**: the heartbeat Edge Function (already running every 30 minutes) checks `scheduled_skills` rows whose `next_fire_at` is past, fires them, and writes a `scheduled_skill_fires` row (the pending-fire ledger). Heartbeat also updates `next_fire_at` for the next cycle.

5. **Auto-navigate semantic** (founder pick E1-A): on app load, the client reads the most-recent `scheduled_skill_fires` row for the workspace where `viewed_at IS NULL`. If found, the dispatcher resolves the skill, navigates, marks `viewed_at = now()`, and shows a toast naming which skill fired. Only ONE auto-navigate per app load (the highest-priority pending fire); subsequent fires wait for the next load.

6. **Scope**: schedules are per-workspace (not per-operator). v1 ships single-operator workspaces; multi-operator semantics are deferred to whenever the multi-user product question lands.

### What this is NOT

- **Not a workflow engine.** No branching, no chained schedules, no conditional triggers. One skill, one cadence, one auto-navigate.
- **Not a notification system.** The toast is a confirmation of an action that just happened, not a passive alert. The system doesn't ping the operator on a schedule unless they specifically asked for it (via scheduling a skill).
- **Not a cron exposure.** The operator picks "every Friday at 9am" from a structured form; the implementation converts to cron internally. Operators never write cron expressions.
- **Not arbitrary code execution.** Recipes are static; the dispatcher is deterministic; the schedule just decides WHEN, not WHAT.

## Alternatives considered (rejected)

**Write-observation instead of auto-navigate (E1-B)**. The scheduled skill fires, the result lands as an observation in the WeekReadsCard, the operator chooses when to act. Rejected because the founder explicitly picked E1-A on 2026-05-31 — auto-navigate makes the scheduled skill an active part of the operator's day rather than a passive log entry.

**Client-side scheduling via setInterval**. Schedules live in localStorage; client-side timer fires when tab is open. Rejected because the operator must have the tab open at the scheduled time, defeating the "remind me Friday" use case.

**Per-operator schedules in a multi-tenant table**. Rejected for v1 because Antaeus today is single-operator-per-workspace; the per-workspace constraint matches reality and the schema can extend later.

## Implementation plan (Phase E build)

Single branch, six waves, single PR.

| Wave | Scope |
|---|---|
| 1 | This ADR + canon updates (Part II.5 §7 Phase E reframe, Part V §6 entry) |
| 2 | Supabase migration: `scheduled_skills` + `scheduled_skill_fires` tables with RLS, plus next-fire computation helpers |
| 3 | Heartbeat extension: read due `scheduled_skills`, dispatch skill IDs, write `scheduled_skill_fires` rows |
| 4 | Schedule-this-skill UI in the Cmd+K palette: right-side ⏰ button on each skill row → modal with cadence picker |
| 5 | Client-side auto-navigate on arrival: read pending fires, dispatch skill, mark viewed, show toast |
| 6 | E2E smoke + final sweep |

CI gates: typecheck + vitest + Playwright + Vite build, all green before merge.

## Schema sketch

```sql
create table public.scheduled_skills (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    created_by uuid default auth.uid() references auth.users(id) on delete set null,
    skill_id text not null,            -- references src/skills/recipes/ id
    cadence_kind text not null,         -- 'daily' | 'weekly' | 'monthly'
    cadence_data jsonb not null,        -- { hour: 9, minute: 0, day_of_week?: 'fri', ... }
    timezone text not null default 'UTC',
    next_fire_at timestamptz not null,  -- pre-computed; heartbeat polls this
    last_fired_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (workspace_id, skill_id)
);

create table public.scheduled_skill_fires (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    schedule_id uuid not null references public.scheduled_skills(id) on delete cascade,
    skill_id text not null,
    fired_at timestamptz not null default now(),
    viewed_at timestamptz,
    unique (schedule_id, fired_at)
);
```

Workspace-scoped RLS using the existing `is_workspace_member()` helper. `scheduled_skill_fires` is service-role-write-only (heartbeat writes); members read + can update `viewed_at`.

## Voice rule

No new copy beyond the toast text and the cadence-picker UI labels. The toast text is validated against `src/lib/voice/voice-document.ts` at build time (parser test); UI labels are reviewed manually since they're not generator output.

## Authority

This ADR + the `scheduled_skills` + `scheduled_skill_fires` tables + the heartbeat extension + the client-side auto-navigate handler. The action union from ADR-010 still binds at the dispatcher layer; Phase E just decides WHEN to invoke an existing skill.
