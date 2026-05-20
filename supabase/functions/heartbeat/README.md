# `heartbeat` — Phase A orchestration layer Edge Function

The system's pulse. Wakes up every N minutes (default 30), inspects each active workspace, runs registered observation generators, and writes the candidates into the `observations` ledger.

**Phase A ships this as a skeleton** — `REGISTERED_GENERATORS` is empty. The function runs cleanly end-to-end but writes nothing. Phase B will register the first generator (signal-decay detection) and the visible Dashboard "this week's reads" card.

## Why this exists

See `deliverables/adr/adr-004-orchestration-layer-foundation-2026-05-19.md`.

The short version: Antaeus today does nothing when the operator isn't there. The heartbeat is the engine that lets the system look around between user sessions, notice things, and write its own observations to the ledger that the rooms then read.

## Deployment

This function is deployed by the founder via Supabase CLI:

```bash
# From repo root, with the Supabase CLI linked to the project
supabase functions deploy heartbeat --no-verify-jwt
```

`--no-verify-jwt` because the function authenticates via the service-role key it receives in the cron's `net.http_post` Authorization header. No user JWT is involved (this is a system-internal call).

## Schedule (pg_cron)

The cron schedule lives in `supabase/migrations/20260519180002_heartbeat_schedule.sql`. After deploying the function, the migration registers a pg_cron job that POSTs to the function URL every 30 minutes.

The migration is commented out by default — the founder uncomments the `select cron.schedule(...)` line and applies the migration AFTER:

1. The function is deployed (so the URL resolves).
2. The `app.heartbeat_url` and `app.service_role_key` database settings are set:
   ```sql
   alter database postgres set app.heartbeat_url = 'https://<project-ref>.supabase.co/functions/v1/heartbeat';
   alter database postgres set app.service_role_key = '<service_role_key>';
   ```

This two-step pattern keeps the cron from invoking a missing function during initial rollout.

## Manual invocation (testing)

```bash
curl -X POST 'https://<project-ref>.supabase.co/functions/v1/heartbeat' \
     -H 'Authorization: Bearer <service-role-key>' \
     -H 'content-type: application/json' \
     -d '{}'
```

Response shape:

```json
{
  "ok": true,
  "startedAt": "2026-05-19T18:30:00.000Z",
  "endedAt": "2026-05-19T18:30:00.142Z",
  "durationMs": 142,
  "workspaces": 4,
  "generators": 0,
  "totals": { "produced": 0, "inserted": 0, "deduped": 0, "errored": 0 },
  "perWorkspace": []
}
```

Phase A returns `generators: 0` always — the registry is empty. Phase B onward returns counts of what each generator produced.

## Active-workspace filter

The heartbeat only runs against "active" workspaces — those with a `workspace_sessions` row updated in the last 7 days OR any observation written in that window. Avoids running generators against dormant workspaces. The threshold is the `HEARTBEAT_ACTIVE_DAYS` constant.

## Generator contract

When Phase B+ adds generators, each implements the `RegisteredGenerator` shape inlined in `index.ts`:

```typescript
interface RegisteredGenerator {
  readonly id: string;  // e.g. "phase-b/signal-decay"
  readonly run: (ctx: GeneratorContext) => Promise<ReadonlyArray<ObservationCandidate>>;
}
```

The contract is duplicated here from `src/lib/observations/types.ts` because Edge Functions run in Deno and can't import from the Node-flavored `src/` tree. New generator authors copy the contract + author the pure function. Tests for the generator live in `src/lib/observations/__phase-b__/*.test.ts` so they run in the regular vitest setup; the Edge Function imports them by re-implementing the same logic against the Deno-native Supabase client.

## Voice rule reminder

Every `observation_text` a generator writes MUST pass canon Part III §11. Plain English, no startup-jargon, no sales-shorthand, no us-vs-them framing. Generators that produce gummy copy will be retired by ID via the `source_generator` column.
