# Outdoors Events discovery (ADR-016 PR 2)

Web-search-grounded event discovery for the Outdoors Events room.
Reads a workspace's product category, runs real web searches for
offline gatherings (direct / adjacent / indirect to the category),
and upserts typed event rows to `outdoors_events`.

## Deploy

```bash
supabase functions deploy outdoors-events-discovery --no-verify-jwt
```

`--no-verify-jwt` because the cron path invokes with the service-role
key and the client path passes the user JWT; the function authenticates
to the DB with the service role internally.

## Env

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are provided automatically
in the Edge Function runtime.

## Invoke

On-demand from the room ("Run discovery now"):

```json
POST { "action": "run_one", "workspaceId": "<uuid>" }
```

Admin escape-hatch — every active workspace in one call (manual only;
no cron):

```json
POST { "action": "run_all" }
```

## Cadence

**On-demand only.** Founder direction 2026-06-02: no weekly cron. The
operator triggers discovery by clicking "Run discovery now" in the
room when they want a fresh sweep, and not before. The legacy cron
migration file was deleted in the same PR that locked this doctrine —
if a scheduled fire is wanted later, a new migration adds it cleanly.

## Cost

Per-workspace weekly ceiling of $2.00 (token + web-search). At
$THROTTLE_AT the run drops to direct-tier-only with fewer searches;
at 1.5× the ceiling the run pauses and writes a `paused` ledger row.
Each run's `total_cost_usd` + `llm_call_count` land in
`outdoors_events_runs` for the room footer.

## Hallucination guard

Every discovered event must carry a real `https://` source URL or it's
dropped at parse time (`parseDiscoveredEvents` in `_shared.ts`). The
system prompt forbids inventing events, dates, or URLs and requires web
search to confirm each is real + upcoming. The `relevance_reason` runs
through a voice-lite banned-vocab gate; failures are dropped, not
re-rolled.

## Dedupe

Events dedupe on the `(workspace_id, dedupe_key)` unique index.
`dedupe_key = slug(name)__year-month__slug(city)`.

`upsertEvents` does an **insert-new / update-discovery-columns split**
so a re-run never clobbers operator-owned state:

- New dedupe keys → inserted with `status: "watching"`.
- Existing dedupe keys → only the discovery columns refresh
  (`relevance_tier`, `relevance_reason`, `source_url`, dates, `kind`,
  `where_at`, `discovered_at`, `run_id`). `status` and `notes` are
  left untouched — if the operator moved an event to "attending", a
  re-discovery keeps it there.
