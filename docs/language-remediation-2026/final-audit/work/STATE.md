# Final audit — working state (resume from here)

Updated 2026-11-16T23:57Z. This folder is the durable copy of the audit's working files. The live copies are in the session scratchpad; if the scratchpad is gone, run `tools/…` per "Restore" below.

## Where things stand

- Task: finish and certify the language remediation against the owner's control packet (`ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/`). Scope and conflicts: `../../20_SCOPE_AND_CONFLICT_RECONCILIATION.md`. Draft PR #338 (do not merge, do not deploy).
- Owner instruction (2026-11-16): all agent work runs on **Fable 5.2 at max effort** — no other model. The Fable weekly allowance was hit three times on 2026-11-16 (19:37, ~22:09 restart, 22:33 UTC); it resets **2026-11-20 18:00 UTC**. Reviewers save as they go, so interrupted work resumes from the files in `audit/`.
- Stage in progress: **full-app audit** (34 areas; each area = one read-only reviewer, then one verifier). Saved so far:

| area | findings saved | dispositions | coverage rows | verification |
|---|---:|---:|---:|---|
| approved-evolution | 24 | 0 | 10 | - |
| backend-contracts | 22 | 0 | 6 | - |
| briefing-pipeline | 25 | 0 | 11 | - |
| briefing-ui | 50 | 0 | 6 | - |
| dashboard | 25 | 0 | 4 | - |
| deal-workspace | 34 | 0 | 5 | - |
| discovery-ui | 35 | 0 | 1 | - |
| future-autopsy | 21 | 0 | 3 | - |
| getting-to-signed | 66 | 0 | 8 | - |
| icp-studio | 18 | 0 | 2 | - |
| onboarding | 16 | 0 | 0 | - |
| outdoors-events | 28 | 0 | 6 | - |
| readiness | 14 | 0 | 1 | - |
| shared-chrome | 12 | 7 | 2 | - |
| terms-and-rules | 65 | 0 | 8 | - |
| welcome | 38 | 23 | 14 | 23 verdicts |

  Areas not listed have not started. `welcome` is the only complete audit. `audit-leads/` holds partial notes from reviewers that briefly ran on Opus before the owner said Fable only — unverified leads, never authoritative.
- Progress at this update: 16 areas have saved findings (619). Fully verified: welcome, backend-contracts, onboarding. Dashboard audit is complete and its verification is partly done (30 of 55). The container restarted a third time at 23:56 UTC on 2026-11-16 (cause unknown); reviewers resume from the saved files.
- Not started: adjudication, fixes, regenerated walkthroughs, nine-dimension scoring, semantic-damage review, record-level reconciliation (3,584 records + 60 prose obligations), final suite, CI, certification, A–K report.

## How the audit runs

- Script: `tools/antaeus-final-audit-part.js` (Workflow tool, `scriptPath`), `args: { keys: [...areas in priority order], verifyOnly: [...] }`. Two lanes per run; each area is audited then verified before its lane moves on. No `model` argument → reviewers inherit Fable/max.
- Keep concurrency low (two runs = four reviewers): the allowance, not parallelism, is the limit, and fewer reviewers means whole areas finish inside each window.
- Priority order used: dashboard, backend-contracts, readiness, outdoors-events, discovery-ui, approved-evolution, signal-console, briefing-pipeline, icp-studio, briefing-ui, territory-architect, shared-engines, prospecting-desk, demo-seeds, quota-workback, preview-tooling-and-maps, founding-gtm · and · welcome (verify only), onboarding, terms-and-rules, deal-workspace, shared-chrome, future-autopsy, outbound-studio, getting-to-signed, cold-call-studio, pilot-desk, linkedin-playbook, call-in-a-favor, discovery-content-a, settings, discovery-content-b, static-public, variant-pages.
- Reviewer brief: `AUDIT_BRIEF.md`. Validators: `tools/validate-audit.js`, `tools/validate-verify2.js`. Merge results: `tools/merge-audit.js` → adjudicated list; `tools/build-workorders.js` → one work order per repository partition.

## After the audit

1. Adjudicate (orchestrator): accept findings both verdicts support; decide every item marked OWNER DECISION (apply only the part that needs no product decision; list the rest for the owner); add `my-findings.md`.
2. Fix: `tools/antaeus-final-fix-part.js` — one fixer per partition in its own git worktree (outside the repo directory), then an independent diff reviewer; brief `FIX_BRIEF.md`. Merge branches, run typecheck / unit / builds / e2e, repair fallout.
3. Regenerate walkthroughs (enterprise default = certified corpus; plus SMB, previous and oldest screen versions, onboarding, public pages) with `tools/build-transcript-variant.js`, `tools/preview/walk-onboarding.js`, `tools/preview/walk-public-pages.js` (repo root `tools/preview/`).
4. Score with the nine-dimension rubric (`SCORING_BRIEF.md`; slice builder and validators in `tools/`): readers cover every line, three independent judges, orchestrator decides; ≤ 20 required on the certified corpus, extended corpus reported too.
5. Semantic-damage review; record-level reconciliation into the five statuses (`tools/language-remediation/reconcile-original.js` at repo root + `tools/candidates.js`); certification doc; PR description; final-head CI; A–K report.

## Decisions already taken (do not reopen without the owner)

- "rank": contextual rule (COPY_STANDARD §26 as corrected 2026-11-16). Readiness names: COPY_STANDARD §17. "proof": product voice says pilot / results / evidence; identifiers stay. Older screen versions are in scope. The 17 design-variant pages: classify as design records, scan them, report as a residual risk for the owner (un-deploy or rewrite before the gate comes down) — pending the variant-pages audit.
- Machine: 4 CPUs; the Workflow tool runs two agents per run. The container has restarted twice mid-run; keep a monitor heartbeat while background work runs.

## Restore (only if the scratchpad was wiped)

Scratch root: `/tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit` (the scripts hard-code it). Copy `audit/`, `audit-leads/`, the three briefs and `tools/*` back there; rebuild the obligations slices with `node tools/language-remediation/reconcile-original.js --out <scratch>/ledger/auto-pre.json` then `node <scratch>/build-slices.js`; regenerate the SMB and previous-version walkthroughs with `run-variants.sh` if reviewers need them (about 30 minutes each, no model usage).

---

## Update 2026-11-20 18:35 UTC — supersedes the status table and "how the audit runs" above

**Allowance.** The weekly allowance reset at 18:00 UTC on 2026-11-20 (next reset 2026-11-27 18:00 UTC). Session usage reading at the reset: cost 2542.23 (cache-read 5,462M tokens). Compare later readings against this to see what the remaining stages cost.

**Why the first week ran out.** Measured from the reviewer transcripts: every reviewer started with a 272K-token context (the 534 KB CLAUDE.md plus about 50 unused tool definitions), grew to about 780K by rewriting its whole findings file at every save, and re-read all of it on each of 100–200 steps. One reviewer pass cost 50–110M cache-read tokens. Four passes per area (audit, verify, fix, review) across 34 areas could not fit in a week.

**What changes (same model, same effort, less waste).**
1. Workers run as the `lean-worker` agent type (`agents/lean-worker.md` here; installed at `~/.claude/agents/`): six tools, no CLAUDE.md in context (`omitClaudeMd`). The brief and a short canon excerpt for the area carry the rules a worker needs. The type is only picked up when the session's worker process starts.
2. Results are appended one short record at a time (`rec.js`), never by rewriting a file.
3. Workers send many tool calls per message (reads together, edits together, tests once).
4. Remaining areas are audited and fixed in one pass by one worker per repository partition, each in its own git worktree outside the repo, then checked by an independent reviewer who reads the diff. Verified findings from the first week go to the workers as work orders; unverified ones go as leads to check before changing anything.
5. Read-only stages (scoring readers and judges, reconciliation) return structured results; scripts assemble them.

**Audit state on disk (also in `audit/` here).**
- Verified in full: welcome (38 findings), backend-contracts (36), onboarding (72), dashboard (55 + 6 missed), deal-workspace (64 + 6 missed), readiness (44 + 2 missed).
- Audited, verification partial: outdoors-events (46 findings, 18 verified), terms-and-rules (105 findings, 71 verified; 114 dispositions).
- Partial audits (unverified): approved-evolution 24, briefing-pipeline 25, briefing-ui 50, discovery-ui 35, future-autopsy 21, getting-to-signed 66, icp-studio 18, shared-chrome 12.
- Not started: signal-console, territory-architect, prospecting-desk, quota-workback, founding-gtm, shared-engines, demo-seeds, preview-tooling-and-maps, outbound-studio, cold-call-studio, linkedin-playbook, pilot-desk, call-in-a-favor, settings, static-public, discovery-content-a, discovery-content-b. variant-pages: no agent pass; the 17 pages are owner-designated design records (CLAUDE.md session log 2026-11-09) — confirm by script that they are unlinked and noindexed, and report as a residual risk.

**Order of work from here.** (1) build work orders and per-partition inputs; (2) fix + review per partition, most-used areas and verified defects first; (3) merge, full engineering suite, repair fallout; (4) regenerate every walkthrough; (5) score with the nine-dimension rubric (readers per slice, three judges); (6) semantic-damage review of changed lines; (7) record-level reconciliation of the 3,584 original records and 60 prose obligations; (8) docs, certification, PR description, final-head CI, A–K report. Do not merge or deploy.

**Guardrails for functional fixes.** Fix contained defects with a unit test that fails without the fix. Do not change edge-function authorization or CORS, deploy workflows, database migrations, RLS or cron schedules in this PR: record them as found, with the recommended fix, for the owner.
