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

The cron schedule lives in `supabase/migrations/20260519180002_heartbeat_schedule.sql`. After the function is deployed, the founder uncomments the `select cron.schedule(...)` block in the migration's comment and runs it directly in the Supabase SQL Editor. The result is a pg_cron job that POSTs to the function URL every 30 minutes.

Two prerequisites before enabling the cron:

1. **Deploy the function** (so the URL resolves):
   ```bash
   supabase functions deploy heartbeat --no-verify-jwt
   ```

2. **Store the service-role key in Supabase Vault** (the cron reads it at execution time):
   ```sql
   select vault.create_secret(
     '<service-role-key>',
     'antaeus_service_role_key',
     'Bearer token for the antaeus-heartbeat pg_cron job'
   );
   ```
   Save the returned UUID — it's how you rotate the key later via `vault.update_secret`.

Then uncomment the migration's `select cron.schedule(...)` block and run it in the SQL Editor. The block hardcodes the function URL (not a secret — the function is publicly invokable; authorization is what protects it) and reads the bearer token from `vault.decrypted_secrets`.

This two-step pattern keeps the cron from invoking a missing function during initial rollout.

**Why Vault and not `alter database postgres set app.*`?** An earlier draft of the migration used `current_setting('app.heartbeat_url')` + `current_setting('app.service_role_key')` and relied on the founder running `alter database postgres set app.* = ...` from the SQL Editor. That doesn't work on Supabase — the `postgres` role exposed via the SQL Editor lacks the superuser privilege required to alter database-level parameters (error `42501: permission denied to set parameter`). Vault is Supabase's canonical pattern for a secret a pg_cron job needs to read at execution time.

**Rotating the service-role key.** The cron reads from Vault on every fire, so a rotation is just:
```sql
select vault.update_secret(
  '<secret-uuid-from-vault.create_secret>',
  '<new-service-role-key>'
);
```
No re-scheduling required.

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
