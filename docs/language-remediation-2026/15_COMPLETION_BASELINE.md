# Completion-pass baseline

Captured before source edits, 2026-10-30–31. Repository `FastCoempany/antaeus-gtm-os`; PR #324; branch `language-remediation-v1`; head `f01d44ed3a98aa8927e23c308659d3030c8cacad`; main `f6416124732b5a5ebe9c8eb722a8b8557a0768b2`. Worktree initially clean. The PR is draft and unmerged. Its complete 146-file diff includes 9,518 additions and 9,377 deletions.

The supplied ZIP was fully extracted into a separate original-working-set directory: all 17 files are available, including the exhaustive inventory and JSON manifests absent from the repository's prose-only working set. Original corpus: 5,627 occurrences / 2,780 unique strings; 169 doctrine records. Reviews use both source sets.

| Check | Baseline result |
|---|---|
| Install | `npm ci` succeeded; existing dependency audit reports 38 findings (2 low, 15 moderate, 21 high). No dependency upgrades attempted. |
| Typecheck | Pass (frontend and Worker TypeScript). |
| AE pretests | Pass: 143 engine, 106 validation, 24 golden cases, 100 invariants, 5 landing-sample checks. |
| Unit/component | Pass: 315 files, 3,722 tests. |
| Vite build | Pass; existing ineffective dynamic-import warning in quota captured-meetings. |
| Cloudflare/static build | Pass. |
| Playwright | 284 passed, 1 skipped. The npm script's POSIX variable assignment failed on Windows; equivalent PowerShell environment setup and the same build/tests passed with three workers. Python launcher shim used for the unchanged server command. |
| Copy inventory | Pass mechanically: committed transcript yielded 5,135 occurrences / 2,656 unique strings. Not acceptance evidence. |
| Copy audit | Fail: 81 Tier-1 hits, mixing visible/runtime/doctrine issues with fixtures/comments. |
| Baseline transcript regeneration | Full run from an immutable baseline-source snapshot and its normal static build: all 21 rooms generated, no reported page errors. Output is retained separately from implementation. Coverage still requires review. |
| Backend typecheck | `deno check` fails in outdoors-events-discovery: `buildDedupeKey(event)` passes one argument to a three-argument helper. Other five changed backend modules checked successfully. Frontend typecheck does not cover this entrypoint. |
| GitHub CI at baseline head | Typecheck, unit/component, Vite/static, E2E and Cloudflare build pass; Rendered language audit fails. Supabase Preview skipped because no Supabase branch is attached. |

The Windows machine uses Node 24.14.0/npm 11.9.0; GitHub uses Node 22. Final CI must independently verify the completed head. Baseline logs and source snapshot are retained in the completion workspace, outside the tracked repository.

Confirmed areas requiring repair include Outdoors discovery schema/response/deduplication/persistence contracts, Future Autopsy evidence interpretation, surviving runtime copy, active doctrine, and uncalibrated generator fallbacks. Approved readiness, outreach, briefing and epistemic-calibration evolution is retained. Neither passing tests nor old status documents establish completion.
