# Outdoors Events discovery (ADR-016 PR 2)

Web-search-grounded event discovery for the Outdoors Events room.
Reads a workspace's product category, runs real web searches for
offline gatherings (direct / adjacent / indirect to the category),
and upserts typed event rows to `outdoors_events`.

## Deploy

```bash
supabase functions deploy outdoors-events-discovery --no-verify-jwt
```

The handler validates the caller before using its internal service-role client.
`run_one` requires a valid user JWT and membership in the requested workspace,
or the service-role credential. `run_all` requires the service-role credential.
Empty, malformed, or unrecognized actions never start discovery.

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

Admin operation — each workspace with a nonempty product category (manual only;
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

Existing budget thresholds are preserved: at $1.00 spent in the last seven
days, discovery uses direct-tier events and fewer searches. At $3.00
(1.5 times the $2.00 reference budget), it returns a `paused` result without
opening a ledger row or making another paid call. A failed spend lookup
stops the request rather than treating spend as zero.
Each run's `total_cost_usd` + `llm_call_count` land in
`outdoors_events_runs` for the room footer.
Completed and failed runs use the schema's `completed_at` column. Paid-call
cost and partial write counts are retained when event persistence fails.
Ledger update failures return an explicit error rather than reporting success.

The on-demand response retains `{ok, result, error}`; administrative responses
retain `{ok, workspaces, totals, results}`. No schema migration is required.

## Hallucination guard

Every discovered event must carry a real `https://` source URL or it's
dropped at parse time (`parseDiscoveredEvents` in `_shared.ts`). The
system prompt forbids inventing events, dates, or URLs and requires web
search to confirm each is real + upcoming. The `relevance_reason` runs
through a voice-lite banned-vocab gate; failures are dropped, not
re-rolled.

## Dedupe

Events dedupe on the partial `(workspace_id, dedupe_key)` unique index
where `dedupe_key` is not null.
`dedupe_key = slug(name)__year-month__slug(city)`.

`upsertEvents` does an **insert-new / update-discovery-columns split**
so a re-run never clobbers operator-owned state:

- New dedupe keys → inserted with `status: "watching"`.
- Existing dedupe keys → only the discovery columns refresh
  (`relevance_tier`, `relevance_reason`, `source_url`, dates, `kind`,
  `where_at`, `discovered_at`, `run_id`). `status` and `notes` are
  left untouched — if the operator moved an event to "attending", a
  re-discovery keeps it there.

Repeated keys within one model response are processed once. A concurrent
insert conflict refreshes only discovery fields on the winning row;
operator-authored name, tags, status, and notes remain unchanged.
