# Current evidence and unfinished work

Captured November 4, 2026, after the owner requested transfer to Claude Code. This document supersedes stale agent status prose, but actual source, logs and current tests remain authoritative. No saturation score has been assigned for the completed product. No READY recommendation is justified yet.

## What has been done

- Entire supplied ZIP extracted. All 17 original input files preserved. Team read original specifications/manifests and all current remediation docs. Full original PR diff was reviewed by responsibility; further adversarial review is welcome.
- Clean starting branch/head and baseline recorded in repository doc15. Baseline original PR: 146 changed files, 9,518 additions/9,377 deletions. The new completion diff is separate.
- Full immutable baseline source/build/transcript retained outside target repository. Baseline unit suite passed 315 files/3,722 tests; AE pretests passed 143 engine +106 validation +24 golden +100 invariants +5 landing assertions; frontend/Worker typecheck and builds passed. Baseline Playwright passed 284, skipped1 (live realtime credentials absent); Windows npm command itself required equivalent environment/Python shim. Baseline copy audit failed81 Tier1 and baseline outdoors Deno check failed wrong dedupe arity. See logs and doc15.
- Current local completion changes span roughly160 tracked files plus new tests/tooling/docs/artifacts. Exact list/hash evidence is in this bundle, not this approximate count.

## Substantive saved fixes to review and preserve if correct

### Outdoors event discovery

Agent report `audit-notes/backend-audit.md` is current. Actual handler tests exercise the deployed function through mocked DB/LLM transports, not a separately rewritten implementation.

- Restored actual completed_at schema field, correct three-argument dedupe helper, UI response envelope, CORS/client-header/method handling.
- Rejects GET, empty/malformed/unknown action instead of accidental all-workspace runs. Explicit run_one requires validated JWT and membership; explicit run_all requires service role. Commercial-profile workspace scope uses real schema rather than nonexistent workspace_members.status.
- Replaced generic upsert incompatible with partial unique index by scoped discovery-field refresh/insert and concurrent unique-conflict recovery. Preserves operator-owned name/status/notes/tags and source ownership; dedupes model batch.
- Cost/error/run ledger handling restored. Partial successful writes remain counted if a later write fails; real fail-after-first regression asserts response and ledger count1 with actual paid cost.
- Read exact schema, caller, cron and test evidence before accepting. No live Supabase/deployment or paid-model call was performed.

### Other generators and contracts

- Future Autopsy: deal edit age no longer called buyer inactivity; short nonempty fields not called absent; fewer than3 contacts not called exactly1; generated evidence story rendered again. Heuristic horizon/scoring/routes preserved.
- Founding GTM: open risk reviews no longer counted as historical losses; profile count not truncated to3 before reporting total; unknown stage does not invent a specific support recommendation; calculated defaults labeled accurately. Regression tests saved.
- Contrarian gates frontend/Deno mirror: distinct citations, exact supported quote, six substantive question fields, bounded confidence, valid routed recommended actions. No uncertainty penalty restored.
- Briefing opening-summary frontend/backend prompts retain calibrated uncertainty and source epistemic status. Prompt version compose-1.1. Related generators/voice revised.
- Onboarding: network/backend error no longer fabricates deterministic company signals. Explicit unavailable result retains names, no signals, no priority claim. Explicit demo helper labeled sample. Backend source URL checks/clamping/malformed-result handling, UI source links/ICP-sensitive memo key, removed ts-nocheck, handler/component tests.
- Call in a Favor and FollowPeek source generators now use explicit requests/evidence instead of hidden buyer-motive/trust claims. Activity demo stream, Cold Call, Call Planner, ICP targeting hypothesis, dashboard recommendation reasons, welcome fallbacks and Pilot planning-completeness copy improved. Dashboard OR-condition no longer falsely says both conditions hold. Scores/thresholds/keys/routes retained.
- Getting to Signed legacy seed scripts now request verification rather than fabricate SOC2 audits, legal permission, numerical ROI or delivery promises. Concession examples conditional on approval. Adapter preserves score math/enum but no longer equates score80 with fully rehearsed negotiation; recommends a missing opening line. Regression saved.
- All room capability maps and Discovery runtime/framework language extensively revised. Deprecated-example doctrine marked explicitly. Technical identifiers retained. Active skill recipe labels/bodies, schedule panel labels and navigation cleaned without changing IDs/routes.
- SettingsV4 explains the EXISTING partial export/delete scope, category lists, row caps and retained identity/data rather than falsely promising a complete export/delete. No destructive scope expansion. Root corrected corresponding misleading code comments.
- Root's latest edits: Territory account-capacity total now labeled capacity, not segment assignment; remaining slots no longer called unassigned accounts. Activity readLocalEvents now says outreach recorded rather than unexplained counted. These latest text edits are saved but not yet regenerated/tested as a final set.

### Tooling/CI saved changes

- AST-based copy audit classifies rendered/runtime/prompt/doctrine versus tests/comments/identifiers and exact reviewed uses. All hits retained; only Tier1 A–D fails. Tier2 remains manual review. Empty exact-context allowlist. Marked negative examples do not exempt adjacent doctrine. Five regression tests pass. Review the scanner critically; do not equate its pass with saturation or universal semantic review.
- Inventory adds occurrence/state evidence and supplemental hover/field/navigation captures while preserving comparable line-count metric; writes rendered-corpus.txt.
- Transcript builder outputs coverage.json, fails runtime/control/cap/empty omissions; validator requires21rooms, gate/map/onboarding context, full run and consistent metadata. Uses original demo-seed pathway, depth3, cap5000. This is finite control exploration, not exhaustive form/network-state testing.
- Cross-platform npm E2E runner and Node static server replace Windows-incompatible POSIX assignment/Python dependency.
- CI now includes Deno checks and copy-tool tests, and regenerates full tester corpus before language audit. Final CI has not run these changes remotely. Language job timeout45min; local full transcript around30min. Ensure CI head/time/resource behavior works. Default checkout depth1 means optional origin/main risk comparison may be absent; decide whether to fetch main for that advisory comparison.
- An untracked generated deno.lock exists. Check script uses --no-lock; deliberately decide whether to retain/pin or remove this unrelated check artifact before committing.

## Latest validation — do not confuse iterations with final certification

| Check | Actual saved evidence |
|---|---|
| Frontend + Worker typecheck | Passed current review iteration (`final-typecheck.log`); generator later typecheck also passed. Later source changes still require final run. |
| Deno entrypoints | Passed (`final-functions.log`, backend-final-deno*.log), including later heartbeat/generators check. Root added heartbeat/generators.ts to package script afterward. |
| Copy-tool tests | 5 passed (`final-copy-tests.log`). |
| Vite / Cloudflare | Passed (`final-build.log`, `final-cloudflare.log`) before subsequent source edits. |
| Full npm test iteration | **24 failed, 3,742 passed, 318 files** (`final-tests.log`). Most failures obsolete wording assertions, now largely updated; no final all-suite rerun yet. Preserve functional assertions. |
| Later generator-focused run | **2 failed, 1,186 passed, 98 files** (`generator-completion-tests.log`). See exact remaining failures below. |
| Backend/onboarding/Getting to Signed focused | **18 files, 193 tests passed** (`backend-final-tests.log`). Earlier12files119pass also retained. |
| Root skills fixes | 2files22tests passed (`skills-completion-tests.log`). |
| Transcript + coverage | Pass: **21 rooms, 1,610 actions, 501 distinct revealed states**, no page errors/failed controls/cap omissions. `final-transcript-validation.log`. |
| Inventory from that transcript | **5,160 occurrences / 2,668 unique strings**, `final-inventory.log`. Built before subsequent fixes; not final corpus. |
| Copy audit review iteration | Tier1 passed (`review-copy-audit.log`), but was run before the final Discovery/index pages finished. Later changes and complete corpus need rerun. Tier2 requires contextual review. |
| Final Playwright | Not run after completion modifications. Only baseline284passed/1skipped is established. |
| GitHub CI | Old remote head only: baseline language audit red, other primary checks green; Supabase Preview skipped. No final-head certification. |

Remaining known focused test failures at transfer:

1. `src/pilot-desk/lib/quality.test.ts:318`: still expects "recorded" after text became planning sections complete / verify criteria with buyer. Review intent and update exact assertion, preserving distinction between completed inputs and buyer validation.
2. `src/future-autopsy/ds/lib/adapters.test.ts:63`: expects "next step" but current sentence has "next-step description". Preserve semantic assertion about missing/brief next-step evidence.

The generator agent was interrupted by usage limits while finalizing its report and demo audit. `generator-audit.md` still says no tests and lists already-fixed findings; that is stale. Read diffs plus above logs. Do not rerun its editing helpers indiscriminately.

## Manifest reconciliation is substantially incomplete

Repository doc16 JSON preserves **3,584 source records** (overlapping obligations across input sets), all17 source hashes, original content, status/rationale/evidence. Current summary has **551 unresolved STILL MISSING records**, which mean unresolved assessment as well as actual missing implementations; they are not551 proven product defects. Exact replacement presence is evidence extraction, not a sufficient semantic review.

Current unresolved counts: inventory131; Batch01 114; Batch02 30; Batch03 82; interaction28; contextual0; doctrine166. Batch record totals include structural rules, so counts differ from just exact-replacement counts. All16 contextual-generator records currently resolved with source evidence; verify quality.

2,437 original retain-unless-context inventory records are classified NO LONGER APPLICABLE to a rewrite obligation, not asserted missing or individually absent from runtime. Review that distinction and contextual exceptions before certification.

Scratch `reconcile-original.cjs`, `resolve-reconciliation.cjs`, `reconciliation-decisions.json`, `reconciliation-unresolved.json/.txt`, and doctrine candidate files are copied into audit-notes. Their original location is work/ with `antaeus` and `original-working-set` sibling directories. **Paths are assumed; several helpers mutate files.** Use as auditable evidence/tooling, not authority. Continue row-by-row semantic resolution with actual code/corpus evidence. Preserve approved supersessions over old Future Autopsy "closed lost" future claims.

The manifest agent most recently identified doctrine corrections (possibly saved only partially; inspect): Prospecting map still says repeated live company searches despite implementation only saving criteria; Readiness table old Building; ICP sharpness instruction; accidental `annual up-workstream` from replacing ordinary `annual up-front`. Search current maps, fix actual cases, and review all large replacement edits for awkward literalism or collateral semantic damage.

## Specific source/corpus issues still pending

These are review findings, not instructions to blindly replace text. Verify current files first.

1. **Enterprise demo seed `js/demo-seed-data-ent.js`: partially edited, broad audit unfinished.** Numerous event/signal relevance/motive claims remain, including "hiring machine", "screening by gut at scale", "warming the security-review front", event buyers "orbit this one", "retail half of the book gathers here", "exact people Luca sells to". Some ordinary retail terms such as floor labor are legitimate; do not blindly replace. Separate illustrative data from real factual assertions; do not invent research. Preserve IDs/contracts/data shape. Review all narratives, notes, sample outreach, territory and prospect fields, not just hits.
2. **SMB demo `js/demo-seed-data-smb.js`: no assigned completion review yet.** Read and remediate genuine generator/seed issues too.
3. **ICP buildFocus** `src/icp-studio/lib/builders.ts`: entered target2 currently can recommend ranked top20. Root asked agent to repair with an appropriately bounded or general ranked working-list instruction and regression; check whether saved (likely unfinished). Do not change explicit user target math.
4. **Briefing ShowYourWork** `src/briefing/components/ShowYourWork.tsx`: rendered fallback still says "No envelope on file for this Pattern. It was likely synthesized before B.6 landed; future runs will have one." Replace internal implementation framing with truthful missing-evidence explanation/action. No root fix saved yet.
5. **Outdoors search error UI**: clicking Find relevant events in unconfigured demo renders raw Supabase missing-env message, .env.local / Cloudflare instructions. Root traced through `src/outdoors-events/state.ts`, lib/discovery.ts and V4 discoveryError display, but no fix saved. Preserve diagnostics internally; display truthful user-level inability to search, retry/setup guidance appropriate to demo/auth context. Add regression for error display/behavior.
6. **Briefing upcoming events**: transcript calls September RecFest an upcoming event on November4. Investigate date filtering/seed and actual current selectors; don't fabricate dates. Outdoors all-event view may legitimately retain past records, but upcoming claim must match logic.
7. **Territory capacity label defect fixed in last root edit**; add a meaningful regression if warranted for accounts without focusId and regenerate. Do not change allocation math, which counts nonclosed accounts whether assigned or not.
8. Current first-review transcript retains "At the top because heat62 and fresh signals" from old build, even though generator source is now revised. Regenerate from latest build rather than hand-edit transcript.
9. In first corpus review, some source-visible short forms merit contextual review: confidence percentages vs support, highest-risk day metric, signal labels/multiple signals, Briefing evidence navigation/jargon, recommendation explanations. Do not claim the full qualitative language judgment has already been performed.

Root read complete unique rendered text for Welcome, Dashboard, Readiness, ICP, Territory, Prospecting, Signal Console, Briefing, Outdoors in the first review iteration. Remaining rooms and Discovery were not fully qualitatively reviewed by root before handoff. Team reviewed source extensively, but **the final complete regenerated corpus remains to be inspected and scored**.

## Efficient continuation sequence

1. Verify worktree/status, snapshot preservation, original user authorization and both input sets. Review completion diff + new files before editing; document problems with Codex's work rather than assuming it is correct.
2. Parallelize (a) exhaustive reconciliation/doctrine, (b) generator/demo/fallback completion, (c) functional/source regression review. Keep file ownership clear. Root handles integration, corpus, tests/CI/docs.
3. Finish specific pending source defects and tests; inspect broad edits for semantic damage. Refresh the stale generator report.
4. Run full typecheck/test suite. Useful commands: `npm.cmd run typecheck`, `npm.cmd run typecheck:functions`, `npm.cmd test`, `npm.cmd run copy:test`, `npm.cmd run build`, `npm.cmd run build:cloudflare`.
5. With source frozen, run `npm.cmd run build:transcript`, then `npm.cmd run copy:validate`, `npm.cmd run copy:inventory`, `npm.cmd run copy:audit`. Full transcript takes roughly30minutes locally. **Do not run build or E2E concurrently with transcript: both overwrite dist.** Unit tests can run independently. Ensure no TRANSCRIPT_ONLY/cap shortcuts for acceptance.
6. Inspect full corpus, capability maps, hover/field/navigation supplement and source/test backstop for unseeded/form/error states. Score nine dimensions qualitatively using original method; fix/regenerate if >20; then adversarial semantic-damage pass. Do not use linter frequency as score.
7. `npm.cmd run test:e2e -- --workers=3` locally (uses portable runner); CI default workers as configured. This rebuilds static assets with legacy E2E mode, so regenerate acceptance corpus only from normal static build. The live realtime test is skipped without Supabase credentials; document honestly.
8. Update docs, add certificate with evidence and limitations; commit/push named branch; update PR description; inspect/fix GitHub CI on final head. Do not merge or deploy. Preserve approved behavior. Finish A–K report only with actual readiness evidence.

## Known validation/product limits to report accurately

- No live database migration execution, authenticated production browser, paid AI call or production deployment exercised. Mocked real-handler tests + schema/caller evidence establish local contracts, not live service health.
- Existing month-level event dedupe can conflate similar same-city events; concurrent budget checks are not transactional reservations. Preserve intentional semantics unless an actual regression is demonstrated.
- Onboarding's existing pre-workspace no-JWT-verification deployment and no cost ledger remain; not expanded by this pass. Source URL presence does not establish factual source support.
- Outdoors and onboarding functions are not in the existing automated deploy matrix; after-merge deployment is required separately. Do not deploy during completion.
- Settings export/delete intentionally remain partial with existing limits; UI now explains this. Avoid broadening destructive scope to satisfy words.
- Baseline dependency install reports38 existing vulnerabilities (2low/15moderate/21high); no dependency upgrade scope undertaken. Existing quota dynamic-import build warning.
- User intent is autonomous completion, not repeated confirmation. Ask only for truly missing external input; do not create new approval gates for authorized commits/push/PR metadata. Never fake missing evidence to meet a stop condition.
