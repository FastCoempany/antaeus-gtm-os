# Backend completion audit

Baseline: f01d44ed3a98aa8927e23c308659d3030c8cacad; main f6416124732b5a5ebe9c8eb722a8b8557a0768b2.

## Confirmed regressions in outdoors-events-discovery

- `buildDedupeKey(event)` violates its three-argument helper signature. `deno check supabase/functions/outdoors-events-discovery/index.ts` fails TS2554 at line 298. A nonempty LLM result also throws at runtime.
- `finished_at` does not exist. Migration 20260601220000 defines `completed_at`; database.types.ts and UI loadLatestRun use completed_at. Ignored update errors leave ledger status/cost stale.
- `workspace_members.status` does not exist. Workspaces eligible for administrative run_all were commercial profiles with a nonempty product_category, not membership rows.
- run_one returned a bare RunResult; client triggerDiscovery requires `{ok,result}`. Successful runs therefore appeared unsuccessful.
- CORS omitted x-antaeus-client, sent globally by src/lib/supabase-client.ts, and advertised methods. OPTIONS did not authorize actual client headers.
- GET/invalid JSON/unknown action/empty bodies all fell through to a service-role run_all. README specifies on-demand only; no current cron exists.
- Upsert removed within-batch dedupe and targeted a partial unique index without its predicate, causing SQL conflict-target inference failure. Explicit status/notes preservation and source_kind were lost. Refresh must never modify operator status, notes, name, tags.
- Failed persistence could discard a completed LLM call's cost, and closeRun failures were swallowed by lack of result checks or could reject the handler unexpectedly.

## Additional high-risk existing defects encountered

- Function deploy guide uses --no-verify-jwt, but index validates neither caller identity nor workspace membership; service role writes bypass RLS. Enforce authenticated workspace membership for run_one and service role for explicit run_all.
- Onboarding enrichment silently invents deterministic company signals on backend/network failure. It must return an explicit unavailable result; sample generator can remain explicitly invoked and labeled.
- Onboarding backend emits private/personified ontology and suggests companies without requiring a source. Preserve heat/cold/reads/kind keys but replace display language and require source-backed recommendations.
- Briefing Compose gate still rejects might/perhaps after upstream uncertainty remediation. Align frontend and Deno mirror; preserve schema, length bound, refusal and anti-jargon checks.

## Approved evolution preserved

Read all six changed Supabase function diffs. Briefing enrichment schema/claim_type extraction, synthesis schema/parsers, critic action/legacy label compatibility, cost math, and voice calibration were inspected. Parser refactors preserve behavior. Dropping unsupported categorical certainty is approved. Contrarian evidence-integrity gaps delegated to generator_audit, which owns both frontend and contrarian-shared mirror.

## Validation planned

Execute real discovery handler in an isolated VM with mocked DB/LLM transports; test explicit action, auth, CORS, response shape, schema columns, dedupe, operator preservation, failures/cost, profile enumeration. Deno check for entrypoint. Test compose frontend/backend parity and onboarding unavailable behavior. No live paid LLM call or production write required.

## Completion implementation (2026-11-03)

Assigned backend work is complete and ready for root integration validation.

### Outdoors Events fixes

- Restored `completed_at` and correct three-argument dedupe helper call; Deno now checks the actual entrypoint without suppressions.
- Restored client response envelope, administrative response totals, profile-based workspace selection, CORS for actual browser headers, POST-only handling.
- Explicit recognized action required. Empty/malformed JSON, unknown action, and blank run_one workspace are rejected before DB/LLM work.
- Validated user JWT + workspace membership for run_one; explicit run_all requires the service-role credential. There is no cron migration to preserve; README confirms on-demand behavior.
- Restored preservation of operator-owned name/tags/status/notes, source_kind on new rows, within-batch dedupe. Replaced unsafe broad upsert with scoped refresh/insert and unique-conflict retry compatible with the existing partial index. No migrations/keys/thresholds changed.
- Ledger errors are now checked. Error responses retain paid-call cost, search count and partial writes. Failed budget lookup prevents another paid call. A second ledger failure cannot escape as an unhandled rejection.
- Existing discovery prompt language improvements remain intact. Existing throttle at $1 and pause at $3 remain intact; documentation now states these actual values and does not claim a nonexistent paused ledger row.

### Briefing Compose completion

- The final opening-summary stage had retained the old anti-uncertainty gate. Frontend and deployed mirror now permit calibrated might/may/suggests while keeping indirect-framing, private-jargon, length, refusal and output-schema checks.
- Prompt preserves source confidence and epistemic status and forbids invented buyer intent/causation. Prompt version incremented to compose-1.1.
- Tests check frontend/deployed prompt construction parity and gate behavior.
- Other changed enrichment/synthesis/critic/heartbeat module diffs were audited: approved uncertainty evolution and output schemas remain. Generator agent separately owns Contrarian gate improvements and mirror.

### Onboarding completion

- Real enrichment backend now uses explicit factual/assessment language; it never equates source silence with no activity or company events with buying intent. Stable heat/cold/reads/kind keys retained.
- Backend now requires a source URL for additional-account suggestions, forwards that source to the interface, dedupes repeated account records and rejects null request bodies/malformed entries safely.
- Removed file-wide ts-nocheck from the deployed enrichment entrypoint. Deno check passes.
- Network/backend failure no longer silently produces fabricated deterministic company events. The explicit unavailable result retains account names, provides no signals/sources, and allows setup to continue. Explicit demo helper remains available and labels every sample as a demo.
- WakeStep renders account research, priority assessment explanation and source links. No priority number appears for failed research. ICP is part of the memoization key, preventing stale fit/relevance results when the operator changes ICP for the same account list.

### Tests executed

- `npx vitest run src/outdoors-events/lib src/onboarding/seeding/lib src/onboarding/seeding/components/WakeStep.test.tsx src/briefing/lib/compose/lead.test.ts`: PASS, 12 files / 119 tests (2026-11-03). Log: work/backend-final-tests.log.
- Discovery regression test file has 18 tests executing the actual Deno handler with mocked DB and LLM transports: method/CORS, malformed body, unknown action, auth/membership, successful client response, actual schema field, duplicate results, workspace scoping, operator fields, concurrent insert, paid-cost failure, ledger error, partial writes, failed spend lookup, budget pause, administrative profile enumeration.
- Onboarding deployed-handler tests cover source-backed output, duplicate/malformed model entries, source-less suggestion rejection and source forwarding; component tests cover failure continuation and changed-ICP requery.
- Deno check PASS for outdoors discovery index, seeding enrichment index, Compose mirror, Briefing enrichment _shared, synthesis-shared, contrarian-shared, critic prompt, heartbeat voice-document. Log: work/backend-final-deno.log.
- `git diff --check` for assigned paths: PASS.
- Root must run final full suite/CI after integrating all agents. Latest typecheck result is in work/backend-final-typecheck.log.

### Assigned files

1. supabase/functions/outdoors-events-discovery/index.ts
2. supabase/functions/outdoors-events-discovery/README.md
3. src/outdoors-events/lib/discovery-function.test.ts (new)
4. supabase/functions/briefing-pipeline/llm/compose-shared.ts
5. src/briefing/lib/compose/lead.ts
6. src/briefing/lib/compose/lead.test.ts
7. supabase/functions/seeding-enrichment/index.ts
8. supabase/functions/seeding-enrichment/README.md
9. src/onboarding/seeding/lib/enrichment.ts
10. src/onboarding/seeding/lib/enrichment.test.ts
11. src/onboarding/seeding/lib/enrichment-function.test.ts (new)
12. src/onboarding/seeding/components/WakeStep.tsx
13. src/onboarding/seeding/components/WakeStep.test.tsx (new)

### Residual limits for final certification

- Tests execute real handler logic and use schema/caller evidence, but no live Supabase instance, migrations, authenticated browser, paid model request, or production deployment was exercised by this agent. URL presence does not prove factual source support; prompts require it and UI links allow review.
- Existing month-level dedupe definition is preserved; it may conflate similarly named same-city events in a month. Existing concurrent paid-run budget checks are not a transactional reservation/strict cap. These were not introduced by remediation.
- Onboarding enrichment retains its existing pre-workspace, no-JWT-verification deployment/access model and no cost ledger. Abuse/rate limits remain a deployment concern; this pass does not expand its authentication scope.
- Outdoors discovery and onboarding are not in the existing automatic deployment matrix; root should note the deployment requirement after merge. This pass neither deploys nor merges.
- Deno generated an untracked deno.lock during checks; root owns whether to retain it for reproducible CI.

## Final bounded follow-up (2026-11-04)

All assigned source edits are frozen pending root integration validation.

- Onboarding diagnosis now states what is recorded, distinguishes signers from economic buyers, and describes possible delay rather than certain loss. Branch order, tones, stages and thresholds are unchanged. Green indicates recorded contacts with no additional flag from these checks, not proven deal health. Updated existing tests retain tone/branch assertions and verify these epistemic limits.
- Onboarding evidence notes now describe actual input use. Removed unsupported aggregate sales statistics, research speed claims and unrelated citations. Deal note lists all captured fields but correctly says the initial assessment only checks stage/champion/signer/obstacle. Source-link validation remains available where a note actually cites a source. Tests check assessment/calculation limits and forbid unsourced percentages.
- Heartbeat signal-decay prose distinguishes missing recorded signals from company inactivity. Discovery-call windows exclude future timestamps; all thresholds/observation IDs remain. Browser generator owner mirrored the source change. heartbeat/index.ts hits were internal comments/identifiers/error logging or schema forwarding, not authored customer prose.
- Discovery partial persistence is recorded incrementally through the callback after each successful refresh/insert. Fail-after-first test asserts one event in both failed response and ledger, retaining paid cost. Event refresh and unique-conflict retry filter by BOTH workspace_id and dedupe_key; ledger completion updates by the newly inserted run's ID.
- Approved additional ownership: Getting to Signed legacy seed-scripts and DS adapters. Eighteen role responses and ten openings now ask about verified capabilities, requirements and authorized options instead of fabricating audit reports, data residency dates, payback estimates or legal terms. Seed concession percentages/asks and IDs remain, with approval explicitly required. Internal seed-history wording no longer instructs preserving risky claims verbatim.
- Getting to Signed preparation score/thresholds/band identifiers remain identical. Display labels now describe field completion rather than claiming rehearsal happened. Found an actual recommendation defect: score 80 can be reached without an opening line. That case now asks for the missing opening line before rehearsal. Added regression confirms score 80 and legacy rehearsed identifier are preserved while the recommendation reflects the missing field.

Additional changed files beyond the earlier 13-file list:
- src/onboarding/seeding/lib/diagnose.ts
- src/onboarding/seeding/lib/evidence.ts
- src/onboarding/seeding/lib/logic.test.ts
- src/onboarding/seeding/lib/evidence.test.ts
- supabase/functions/heartbeat/generators.ts
- src/getting-to-signed/lib/seed-scripts.ts
- src/getting-to-signed/ds/lib/adapters.ts
- src/getting-to-signed/ds/lib/adapters.test.ts
- src/getting-to-signed/ds/ds-components.test.tsx

Latest validation:
- PASS: `npx vitest run src/outdoors-events/lib src/onboarding/seeding/lib src/onboarding/seeding/components/WakeStep.test.tsx src/briefing/lib/compose/lead.test.ts src/lib/observations/generators/discovery-rhythm.test.ts src/lib/observations/generators/signal-decay.test.ts src/getting-to-signed` — 18 files / 193 tests. Log work/backend-final-tests.log (10:50:36 local 2026-11-04).
- PASS: `deno check supabase/functions/outdoors-events-discovery/index.ts supabase/functions/seeding-enrichment/index.ts supabase/functions/briefing-pipeline/llm/compose-shared.ts supabase/functions/heartbeat/generators.ts`. Log work/backend-final-deno-late.log.
- PASS: git diff --check on all assigned paths. No new typecheck suppression. Root owns final whole-repository typecheck/build/E2E/CI after integration.
- Full suite/corpus regeneration should follow these late changes; previously generated artifacts do not certify the current revision.

Residual validation boundary: onboarding parseResult relies on the repaired deployed function for score/source validation. The backend clamps scores, rejects source-less suggested companies and supplies source URLs; source existence still does not prove factual support. Explicit unavailable fallback rows have cold=true, so cloud-mirror.ts skips their signal persistence. No live model/Supabase deployment was exercised. These limits are not a claim that live generated results are independently verified.
