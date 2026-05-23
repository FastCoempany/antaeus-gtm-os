# briefing-pipeline (Edge Function)

The orchestrator for the Briefing Recipe Layer pipeline. Wakes up on the weekly cron (Monday 06:00 UTC) or a manual POST, enumerates active workspaces, and runs each one through Stages 3.0 → 3.1 → 3.2.

B.1a ships this as a **skeleton in two ways**:

1. The source registry (Stage 3.1 input) is **empty**. Every B.1a run ingests zero raw items. B.1b registers six tier-A free sources and the pipeline starts moving real data.
2. Server-side context hydration returns `"uninitialized"` for every module — mirroring the client adapter shells from B.0c. Each per-room adapter graduates to a real read (Supabase row query) as that room hits ADR-005 Step 5 (or grows a legacy localStorage → Supabase mirror); the contract surface stays stable across either path.

## What B.1a verifies end-to-end

- The function authenticates with the service-role key (same pattern as the heartbeat).
- Active workspaces are enumerated by recent session **or** observation activity (canonical 7-day window).
- A `briefing_runs` row is created per workspace per invocation. It transitions through `pending → hydrating → ingesting → filtering → complete`, with a per-stage entry in `stage_log` (or terminates as `failed` with the error captured).
- Stage 3.0 produces a `HydratedContext` (all uninitialized today).
- Stage 3.1 dispatches the empty source registry, returns zero raw items.
- Stage 3.2 evaluates filter rules over zero items (vacuously true) and records the (empty) decisions.

## Deployment

```bash
# 1. Deploy the function. --no-verify-jwt because pg_cron invokes it
#    with the service-role key in Authorization, not a user JWT.
supabase functions deploy briefing-pipeline --no-verify-jwt
```

If you haven't already stored the service-role key in Vault (Phase A
did this for the heartbeat — same key is reused), do that once:

```sql
-- Run in the Supabase SQL Editor. Save the returned uuid so you can
-- rotate the key later via vault.update_secret.
select vault.create_secret(
    '<service-role-key>',
    'antaeus_service_role_key',
    'Bearer token for antaeus pg_cron jobs (heartbeat + briefing-pipeline)'
);
```

## Scheduling

The pg_cron schedule lives in `supabase/migrations/20260524000000_briefing_pipeline_schedule.sql`. The migration is **intentionally inactive** — the `select cron.schedule(...)` call is commented out. Uncomment + run it in the SQL Editor after the function is deployed and the Vault secret exists.

```sql
-- See the migration file for the canonical block. Cadence: weekly,
-- Mondays at 06:00 UTC.
select cron.schedule(
    'antaeus-briefing-weekly',
    '0 6 * * 1',
    $$
    select net.http_post(
        url := 'https://<project-ref>.supabase.co/functions/v1/briefing-pipeline',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (
                select decrypted_secret
                from vault.decrypted_secrets
                where name = 'antaeus_service_role_key'
            )
        ),
        body := '{}'::jsonb
    );
    $$
);
```

## Manual invocation

```bash
# Run against every active workspace.
curl -X POST \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://<project-ref>.supabase.co/functions/v1/briefing-pipeline

# Target one workspace.
curl -X POST \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "<uuid>"}' \
  https://<project-ref>.supabase.co/functions/v1/briefing-pipeline
```

Expected B.1a response shape:

```json
{
  "ok": true,
  "startedAt": "2026-05-24T06:00:00.000Z",
  "endedAt":   "2026-05-24T06:00:01.234Z",
  "durationMs": 1234,
  "workspaces": 1,
  "sources": 0,
  "totals": {
    "fetched": 0, "inserted": 0, "deduped": 0,
    "kept": 0, "rejected": 0
  },
  "perWorkspace": [
    {
      "workspaceId": "...",
      "runId": "...",
      "status": "complete",
      "stages": [
        { "stage": "hydrate", "outcome": "ok", "notes": "Hydrated context for 9 modules; all uninitialized in B.1a." },
        { "stage": "ingest",  "outcome": "ok", "notes": "Source registry empty in B.1a — no items fetched. B.1b registers six tier-A sources." },
        { "stage": "filter",  "outcome": "ok", "notes": "Evaluated 0 items; 0 kept, 0 rejected. Pass-through in B.1a." }
      ],
      "counts": { "fetched": 0, "inserted": 0, "deduped": 0, "kept": 0, "rejected": 0 },
      "error": null
    }
  ]
}
```

## Useful queries

```sql
-- Confirm the cron job exists + is active:
select jobid, jobname, schedule, active
from cron.job where jobname = 'antaeus-briefing-weekly';

-- See the last 5 HTTP responses (status_code 200 + JSON body in content = success):
select id, status_code, created, content::text
from net._http_response
order by created desc limit 5;

-- See the last 10 cron runs:
select start_time, end_time, status
from cron.job_run_details
where jobid in (
    select jobid from cron.job where jobname = 'antaeus-briefing-weekly'
)
order by start_time desc
limit 10;

-- See the most recent briefing runs:
select id, workspace_id, status, started_at, completed_at,
       jsonb_array_length(stage_log) as stages_logged,
       error
from public.briefing_runs
order by started_at desc
limit 10;

-- Disable + re-enable:
select cron.unschedule('antaeus-briefing-weekly');
-- ... then re-run the cron.schedule call from the migration file
```

## Why this duplicates types from `src/briefing/lib/contracts.ts`

Supabase Edge Functions run in Deno; the `src/` tree is built for Node. URL imports work in Deno but break in Vite/Vitest. Both sides conform to the same JSON shape — anything that round-trips through `briefing_runs.data.hydrated_context` reads identically on both sides — but the type declarations have to be duplicated. Same pattern as the heartbeat at `supabase/functions/heartbeat/`.

## Phasing

B.1a (this PR) — skeleton orchestrator + Stage 3.0 / 3.1 / 3.2 + cron schedule.

B.1b — six source fetchers + the registry. After B.1b, every Monday's run actually fetches ~10-30 items per workspace.

B.2 — Stage 3.3 Enrich (first LLM call) + Stage 3.4 Cluster + Stage 3.5 Synthesize. The pipeline starts producing Patterns the briefing room can render.

B.3 through B.9 — Watchlist Triggers, Periphery Detection, Contrarian Synthesis, Audit Envelopes, Evaluation Harness, Behavioral Feedback, production cron + first real briefing.

Reference:
- `deliverables/specs/briefing/01-build-phase-plan.md`
- `deliverables/specs/briefing/signal_console_recipe_layer_spec_v0.4.md`
- `deliverables/adr/adr-006-briefing-room-2026-05-23.md`
