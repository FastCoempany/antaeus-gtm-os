# briefing-pipeline (Edge Function)

The orchestrator for the Briefing Recipe Layer pipeline. Wakes up on the weekly cron (Monday 06:00 UTC) or a manual POST, enumerates active workspaces, and runs each one through Stages 3.0 → 3.1 → 3.2.

Source registry: **populated by B.1b + B.1c**. All six fetchers active — HN Algolia, TechCrunch RSS, PR Newswire personnel, Wikipedia pageviews, GitHub releases atom, and HTML diff (B.1c added the sixth backed by the new `briefing_html_snapshots` table).

Context hydration: server-side stub returns `"uninitialized"` for every module — mirroring the client adapter shells from B.0c. Each per-room adapter graduates to a real read (Supabase row query) as that room hits ADR-005 Step 5 (or grows a legacy localStorage → Supabase mirror). Until then, the three watchlist-driven fetchers (HN Algolia, Wikipedia pageviews, GitHub releases atom) gracefully return zero items because the HydratedContext carries no query terms / articles / repos to act on. The two firehose-style fetchers (TechCrunch RSS, PR Newswire) return real items every run regardless of HydratedContext.

## What the pipeline verifies end-to-end

- The function authenticates with the service-role key (same pattern as the heartbeat).
- Active workspaces are enumerated by recent session **or** observation activity (canonical 7-day window).
- A `briefing_runs` row is created per workspace per invocation. It transitions through `pending → hydrating → ingesting → filtering → complete`, with a per-stage entry in `stage_log` (or terminates as `failed` with the error captured).
- Stage 3.0 produces a `HydratedContext` (all uninitialized today).
- Stage 3.1 dispatches the five active source fetchers in parallel via `Promise.allSettled`. TC + PR Newswire return real items every run; the three watchlist-driven sources return zero until the HydratedContext carries config to act on. Per-source failures are caught and reported in the response without failing the run.
- Stage 3.2 evaluates filter rules over the fetched items (pass-through in B.1b — rules graduate alongside the ICP adapter's first real read) and records the decisions.

## Required secrets

The pipeline reads two env vars at runtime:

- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by Supabase. No action needed.
- `ANTHROPIC_API_KEY` — set by you. **Required since B.2a (Stage 3.3 Enrich).** Without it, the enrich stage skips every item with a "no API key" error and the pipeline still completes — but no `briefing_enriched_items` rows land.

```bash
# Set the Anthropic key as a function secret. Get a key from
# https://console.anthropic.com → Settings → API Keys.
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...

# Verify (lists secret names only — never logs values):
supabase secrets list
```

## Deployment

```bash
# Deploy the function. --no-verify-jwt because pg_cron invokes it
# with the service-role key in Authorization, not a user JWT.
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

Expected response shape (with 5 active sources, uninitialized context):

```json
{
  "ok": true,
  "startedAt": "2026-05-24T06:00:00.000Z",
  "endedAt":   "2026-05-24T06:00:03.456Z",
  "durationMs": 3456,
  "workspaces": 1,
  "sources": 5,
  "totals": {
    "fetched": 12, "inserted": 12, "deduped": 0,
    "kept": 12, "rejected": 0
  },
  "perWorkspace": [
    {
      "workspaceId": "...",
      "runId": "...",
      "status": "complete",
      "stages": [
        { "stage": "hydrate", "outcome": "ok", "notes": "Hydrated context for 9 modules; all uninitialized in B.1a." },
        { "stage": "ingest",  "outcome": "ok", "notes": "Fetched 12 items across 5 sources (12 inserted, 0 deduped)." },
        { "stage": "filter",  "outcome": "ok", "notes": "Evaluated 12 items; 12 kept, 0 rejected. Pass-through in B.1a (rules graduate with ICP adapter)." }
      ],
      "counts": { "fetched": 12, "inserted": 12, "deduped": 0, "kept": 12, "rejected": 0 },
      "error": null
    }
  ]
}
```

Item counts vary per run — TechCrunch funding feed runs ~5-15/day, PR Newswire personnel-filtered output is more variable. On a quiet news day you may see 5-10 total; on an active day 20-40. The three watchlist-driven sources (HN Algolia, Wikipedia pageviews, GitHub releases atom) contribute zero until the HydratedContext carries config to act on.

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

B.1a — skeleton orchestrator + Stage 3.0 / 3.1 / 3.2 + cron schedule.

B.1b — five source fetchers + the registry. Every Monday's run fetches real items from TechCrunch + PR Newswire even when the HydratedContext is empty.

B.1c — sixth source fetcher (HTML diff / page snapshot) backed by the new `briefing_html_snapshots` table. Three-way semantics per URL per run: first-time fetch establishes baseline silently; matching hash bumps `last_seen_at`; differing hash updates the snapshot AND emits a `briefing_raw_items` row with the diff context. URLs to watch come from `HydratedContext.tracked_urls` — a reserved adapter slot that's empty today, so the fetcher no-ops in production until an adapter graduates to populate it.

B.2a — Stage 3.3 Enrich. First LLM call lands. For every un-enriched raw item in the workspace (oldest first, capped at 50/run), Haiku 4.5 produces structured enrichment: entities, exec_move, event_category, topic_tags, pain_tags, claim_type, summary, what_changed, user_relevance_score, matches_triggers, affects_deals, is_noise. Rows land in `briefing_enriched_items`. Per-item cost recorded; rolled up to `briefing_runs.total_cost`. `model_v_hash` recorded for B.6 audit envelopes. Cost per run typically $0.02–$0.05 (50 items × ~$0.001/item). Cross-run scope: the first run after deploy catches up on items already in the table from prior B.1+ runs.

B.2 — Stage 3.3 Enrich (first LLM call) + Stage 3.4 Cluster + Stage 3.5 Synthesize. The pipeline starts producing Patterns the briefing room can render.

B.3 through B.9 — Watchlist Triggers, Periphery Detection, Contrarian Synthesis, Audit Envelopes, Evaluation Harness, Behavioral Feedback, production cron + first real briefing.

Reference:
- `deliverables/specs/briefing/01-build-phase-plan.md`
- `deliverables/specs/briefing/signal_console_recipe_layer_spec_v0.4.md`
- `deliverables/adr/adr-006-briefing-room-2026-05-23.md`
