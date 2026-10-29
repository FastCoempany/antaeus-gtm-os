# Adversarial Phase Audit — 2026-10-29

PR: #324  
Branch: `language-remediation-v1`

This audit deliberately assumes that prior completion claims may be wrong. Its purpose is to verify the language-remediation work against the actual PR, the source methodology, and the acceptance criteria rather than against prior progress notes.

## Completion vocabulary

From this point forward, every work item uses three separate states:

- **Decision complete** — the desired user-facing semantics/copy are defined in the remediation docs.
- **Source implemented** — the highest correct source of truth is changed in the PR.
- **Validated** — the changed source has passed relevant tests/typecheck and the regenerated rendered transcript confirms the intended language.

A work item is **not complete** until all required states are satisfied.

---

# Baseline corpus identity

The analysis transport file used for the original corpus pass is:

- filename: `antaeus-preview-walkthrough.txt`
- size: `1,100,002 bytes`
- SHA-256: `e24b88af10def00e9f9c85b31c5d5f8fb198ca62c77170a47be2778ac9f35cfc`

The text file is a rendered transport of the preview-transcript system. It is authoritative for the baseline language analysis, not for implementation.

The repo-owned reproducibility path remains:

1. source code;
2. `npm run build:transcript`;
3. `npm run copy:inventory`;
4. rendered-corpus audit.

The checksum above exists so the exact original baseline can be distinguished from later regenerated transcripts.

---

# Findings by phase

## Phase 1 — corpus + methodology

**Decision status: PASS**  
**Implementation status: PASS for methodology/tooling source**  
**Validation status: PARTIAL**

What is sound:

- The rendered walkthrough is correctly treated as the language-analysis corpus.
- The repo is correctly treated as the implementation source.
- Generated transcript output is explicitly prohibited as an implementation target.
- The original analysis totals are recorded: 5,627 rendered occurrences / 2,780 unique strings.
- The unchanged nine-dimension rubric and <=20/100 acceptance ceiling are preserved.

Adversarial gaps:

- The exact external TXT snapshot was not fingerprinted in the repo. This audit adds the SHA-256 above.
- The new inventory builder has not yet been run against the regenerated post-remediation transcript, so reproducibility is designed but not yet demonstrated on the changed branch.

Verdict: methodology is sound; final validation remains pending.

## Phase 2 — shared semantic architecture

**Decision status: PASS**  
**Source implementation status: SUBSTANTIAL / NOT VALIDATED**

Present in PR:

- Workspace map / former Ground surface
- room functional descriptions
- Recent Activity / former Live Edge surface
- readiness labels/explanations
- Birdseye recommendation wording
- account-priority terminology in Signal Console

Adversarial observations:

- Stable internal identifiers such as `GroundLine`, `openGround`, routing params, and model fields may remain when changing them would create needless migration risk. This is consistent with the plan.
- User-facing language must still be checked in the regenerated transcript; source diffs alone cannot establish completion.
- `copy:audit` currently scans source comments and implementation identifiers as well as user-facing copy. Tier-2 warnings will therefore contain intentional stable internals and require manual classification.

Verdict: source migration is materially underway but not validated complete.

## Phase 3 — highest-saturation rooms

**Decision status: PASS**  
**Source implementation status: PARTIAL**

Implemented at source:

- Welcome
- Dashboard
- ICP Studio
- Readiness shared surface
- Future Autopsy primary UI + cause labels
- parts of Briefing

Critical correction discovered:

- The prior implementation ledger incorrectly marked `src/future-autopsy/lib/autopsy-data.ts` as migrated. That file is **not present in the PR changed-file list**. The earlier write did not land. Future Autopsy's document/narrative generator therefore remains pending.
- Briefing has several migrated rails and sample analyses, but the live generation path and all visible section labels have not been proven complete.

Verdict: Phase 3 is **not source-complete**. Future Autopsy generator and remaining Briefing generator/live copy must be completed and validated.

## Phase 4 — strategic / diagnostic rooms

**Decision status: PASS**  
**Source implementation status: PARTIAL**

Implemented at source:

- Territory Architect
- Signal Console
- Getting to Signed
- Pilot Desk
- Call in a Favor
- Founding GTM reader/taxonomy

Still incomplete:

- Founding GTM synthesis prose remains capable of reproducing causal overstatement unless its generator/readers are changed.
- The existence of plain labels in a room does not prove every interaction state is clean; the regenerated walkthrough remains the acceptance surface.

Verdict: substantial implementation, not complete.

## Phase 5 — execution / utility rooms

**Decision status: PASS**  
**Source implementation status: NOT STARTED in PR #324 at time of this audit**

The following rooms are not present in the current PR changed-file list:

- Prospecting Desk
- Outdoors Events
- Outbound Studio
- Cold Call Studio
- LinkedIn Playbook
- Discovery Studio
- Deal Workspace
- Quota Workback
- Settings

Any prior language implying these had already been source-migrated was incorrect.

Verdict: approved rewrite decisions exist; source implementation remains to do.

## Phase 6 — generated language + internal doctrine

**Specification status: PASS**  
**Source implementation status: PARTIAL / MOSTLY PENDING**

What exists:

- generated-language rules
- epistemic output schema
- internal-doctrine rewrite rules
- source-level comment cleanup in some migrated modules

What remains:

- Future Autopsy narrative generator
- Founding GTM synthesis engine
- remaining Briefing live generators/templates
- repo-wide search of prompts/templates/internal product doctrine outside already changed files

Verdict: specification is complete; implementation is not.

## Phase 7 — source tracing + implementation

**Status: IN PROGRESS**

Course correction:

- Do not use broad progress language such as "the phase is complete" when only the copy decisions are complete.
- Every source item must be checked against the PR changed-file list.
- Generator changes require contract compatibility review before being marked source-implemented.
- Stable internal enum/field names should remain unless the language itself is user-facing or teaches future generators to reproduce the deprecated dialect.

## Phase 8 — copy linter + CI

**Tooling status: PARTIAL**  
**CI gate status: NOT IMPLEMENTED**

What exists:

- `tools/language-remediation/copy-audit.js`
- `tools/language-remediation/build-copy-inventory.js`
- npm scripts `copy:audit` and `copy:inventory`

Adversarial gaps:

1. `copy:audit` is **not wired into CI**.
2. Current targets are `src/` and `preview-transcript/`; this may miss prompt/template sources outside `src/`.
3. Tier-1 search is simple substring matching and can flag comments/internal documentation as failures; that is useful for doctrine cleanup but noisy as a user-facing-copy gate.
4. Tier-2 warnings do not fail CI, so manual review is mandatory.
5. The checked-in `preview-transcript/` is stale until `build:transcript` is rerun; a copy audit before regeneration is not final evidence.
6. No current PR status checks have posted for the head commit at the time of this audit.

Required course correction:

- expand/confirm scan roots for all user-visible prompt/template sources;
- add a CI job after source migration stabilizes;
- regenerate the transcript before treating audit output as acceptance evidence;
- preserve a small explicit allowlist for stable internal identifiers only when justified.

## Phase 9 — regenerated transcript + saturation re-score

**Status: NOT STARTED**

This phase remains the actual acceptance gate. No implementation phase is complete until the rendered product is regenerated and re-scored using the unchanged rubric.

---

# Adversarial quality gates for every migrated room

A room can be promoted from `source implemented` to `validated` only when all of the following are true:

1. Its actual source file(s) are present in the PR.
2. Standard business/sales concepts are not renamed merely for brand voice.
3. Functional meaning does not depend on metaphor.
4. Metadiscursive framing is removed when a direct proposition works.
5. Aphoristic cadence does not carry explanatory meaning.
6. Facts, calculations, assessments, forecasts, and recommendations are distinguishable where applicable.
7. Analytical claims expose supporting evidence.
8. Correlation is not rewritten as causation.
9. CTAs predict the resulting action.
10. Stable internal IDs/enums are not gratuitously migrated.
11. Relevant tests/typecheck pass.
12. The regenerated preview transcript reflects the intended language in room-at-rest and interaction states.
13. No Tier-1 deprecated user-facing language remains.
14. Tier-2 warnings are manually classified.

---

# Immediate remediation order after this audit

1. Correct the implementation ledger and PR status language.
2. Finish Future Autopsy narrative generator at the stable `AutopsyDoc` contract.
3. Finish Founding GTM synthesis prose.
4. Finish Briefing live generators/templates and visible labels.
5. Implement Phase 5 execution/utility rooms.
6. Run repo-wide internal-doctrine/prompt sweep.
7. Harden `copy:audit` scope and wire it into CI.
8. Run tests/typecheck/CI.
9. Regenerate preview transcript and copy inventory.
10. Run copy audit and manually review Tier-2 warnings.
11. Rerun the exact nine-dimension saturation test.
12. Iterate until <=20/100; keep PR draft until then.
