# seeding-enrichment (ADR-019, slice 4 backend)

Researches recent company changes during onboarding. Given account names and
an ICP, it asks the model to search for a relevant reported change with a source
URL. It returns account-priority assessments and explanations. The legacy
`heat`, `cold`, `reads`, and `kind` keys remain for compatibility; they are not
customer-facing vocabulary or purchase-probability estimates.

## Deploy and configuration

```bash
supabase functions deploy seeding-enrichment --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

The function makes no database writes. The existing onboarding deployment
allows calls before workspace membership is established; this pass does not
change that access model. Paid-call rate limiting remains a deployment concern.
Account persistence is separate in `src/onboarding/seeding/lib/cloud-mirror.ts`.

## Request and response

```json
{"accountNames":["Northwind","Cobalt"],"icp":"Heads of RevOps at mid-market B2B companies"}
```

The response retains `ok`, `accounts`, `reads`, `cost_usd`, `search_count`, and
`error`. Each account has `name`, `signal`, `heat`, `cold`, and `sourceUrl`.
Results are ranked by the assessed recency and relevance of reported changes,
with at most 12 requested accounts per call. This is not verified buying intent.

Without a source-backed change, the account reports
`No recent source-backed change found`, with `cold=true` and a low score.
That means the search found no supporting evidence, not that no change occurred.
Sources are linked in the interface. A plausible URL alone cannot prove factual
accuracy; operators should verify the linked material before acting.

Optional explanations retain stable keys:

- `sees`: the highest-priority supplied account with supporting evidence.
- `doesnt-fit`: a recommendation to check a model-assessed ICP mismatch.
- `missed`: an additional account to assess, only when its recommendation has
  a source URL and the model assesses it as fitting the ICP.

The client reports an unavailable state if research fails, preserving account
names without inventing company events. The separately invoked deterministic
demo helper explicitly labels its sample signals and is never an automatic
network fallback. Users can continue setup without research results.

## Cost and verification

One model call per request with at most `min(names, 10)` web searches.
The response includes token/search cost and search count; there is no ledger.
The endpoint and Compose/Discovery contracts are covered by the Vitest tests
under `src/onboarding/seeding/lib/` and `src/outdoors-events/lib/`.
Run `deno check supabase/functions/seeding-enrichment/index.ts` to check the
actual runtime entrypoint; it has no file-wide typecheck suppression.
