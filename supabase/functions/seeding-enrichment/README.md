# seeding-enrichment (ADR-019, slice 4 backend)

Web-search-grounded account trigger-finder for the onboarding seeding
flow. Takes the account names the operator named + their ICP, runs real
web searches (the model issues a search pass per company), and returns
each account with the single most relevant *recent* trigger — backed by a
real source URL — plus a heat score and the system's reads.

Replaces the client-side dev stub in
`src/onboarding/seeding/lib/enrichment.ts`. Same response shape, so the
UI is unchanged. When this function isn't deployed (or has no API key),
the client falls back to the deterministic stub so internal preview still
works — operators only ever see real results once it's live.

## Deploy

```bash
supabase functions deploy seeding-enrichment --no-verify-jwt
```

`--no-verify-jwt` because the client invokes with the user JWT and the
function only calls Anthropic — it never touches the DB, so it needs no
service-role auth.

## Env

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

That's the only secret. There are no DB reads or writes here — the cloud
mirror (`src/onboarding/seeding/lib/cloud-mirror.ts`) persists the seeded
ICP / accounts / deals separately, on the client, through the data-client.

## Invoke

From the seeding flow's wake step:

```json
POST { "accountNames": ["Northwind", "Apex", "Cobalt"], "icp": "Heads of RevOps at mid-market B2B companies that just opened a search" }
```

Response:

```json
{
  "ok": true,
  "accounts": [
    { "name": "Northwind", "signal": "opened a VP RevOps search", "heat": 88, "cold": false, "sourceUrl": "https://..." },
    { "name": "Cobalt", "signal": "quiet — nothing fresh yet", "heat": 12, "cold": true, "sourceUrl": "" }
  ],
  "reads": [
    { "kind": "sees", "title": "It sees what's happening", "body": "Northwind opened a VP RevOps search — you never typed that. It's your hottest account now." }
  ],
  "cost_usd": 0.04,
  "search_count": 3,
  "error": null
}
```

Accounts are ranked hottest-first. Capped at 12 companies per call.

## Hallucination guard

Every reported trigger must carry a real, working `https://` source URL.
A signal without one is dropped to the honest `quiet — nothing fresh yet`
state (cold, heat ≤ 14) rather than shown as a finding. The model is
instructed never to invent a trigger, a date, or a URL — an honest
"nothing fresh" is correct and expected for some companies. Any named
company the model skips entirely is filled in as quiet, so the returned
list always covers every name the operator gave.

## Reads

Three optional reads accompany the accounts — each one only appears when
the data supports it:

- **sees** — the hottest account's trigger, surfaced as something the
  operator never typed.
- **doesnt-fit** — a named company the model judged off-ICP (`fits=false`).
- **missed** — one off-list company the model is confident fits the ICP,
  suggested as worth watching.

## Cost

One Claude Sonnet 4.6 call per invocation with web search enabled (up to
`min(names, 10)` searches). Token cost + `$0.01` per web search land in
`cost_usd` / `search_count` on the response. No ledger table — this is a
one-time onboarding call per operator, not a recurring sweep.
