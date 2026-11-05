# Adversarial Phase Audit — 2026-10-29

PR: #324  
Branch: `language-remediation-v1`

This audit assumes prior completion claims may be wrong. It verifies language-remediation work against the actual source model, generator behavior, tests, PR changed files, and acceptance criteria rather than against progress notes.

## Completion vocabulary

Every work item uses three separate states:

- **Decision complete** — the desired semantics/copy are defined.
- **Source implemented** — the highest relevant source of truth is changed in the PR, including any generator/prompt that can recreate the language.
- **Validated** — relevant tests/typecheck/build pass and the regenerated rendered transcript confirms the intended language.

A work item is not complete until all required states are satisfied.

---

# Baseline corpus identity

The analysis transport file used for the original corpus pass is:

- filename: `antaeus-preview-walkthrough.txt`
- size: `1,100,002 bytes`
- SHA-256: `e24b88af10def00e9f9c85b31c5d5f8fb198ca62c77170a47be2778ac9f35cfc`

The text file is authoritative for the baseline language analysis, not implementation. The repo-owned reproducibility path remains:

1. source code;
2. `npm run build:transcript`;
3. `npm run copy:inventory`;
4. rendered-corpus audit;
5. unchanged nine-dimension saturation score.

---

# Cross-cutting adversarial findings

## 1. Directness had been confused with certainty

The shared voice layer and several Briefing prompts treated uncertainty as a voice defect. Examples included doctrine such as “voice-of-no-confidence,” hard hedge-density failure, and a conflict-analysis instruction equivalent to “no might/could; the data either says it or it does not.”

**Why this failed:** evidence can support a probability, association, or tentative interpretation without supporting a categorical conclusion. Removing uncertainty terms does not make the evidence stronger; it only makes the language sound more certain.

**Course correction implemented:**

- calibrated uncertainty such as `may`, `appears`, `suggests`, and `likely` is allowed when the evidence warrants it;
- indirect rhetorical throat-clearing remains disallowed;
- quality gates focus on evidence, confidence, citation validity, unsupported claims, and readability rather than banning uncertainty by count.

Affected source includes the shared voice layer, Briefing synthesis/conflict prompts, quality gate, production Deno mirrors, enrichment prompt, and post-publication critic.

## 2. Copy review exposed model-semantics defects

Several approved rewrite phrases were themselves too strong once the underlying calculation was inspected. The remediation therefore follows the model, not the earlier prose decision.

Examples:

- Deal Workspace does not predict a loss date; it calculates a deterministic risk score from inactivity, next-step, and close-date factors.
- Quota Workback “pace” is not an extrapolation of daily activity; its displayed projection is closed-won YTD plus stage-weighted open pipeline.
- Quota benchmarks are selected by ACV band, not “teams your size.”
- Quota input `days` is working days per month, not sales-cycle length.
- Prospecting Desk stores target criteria but does not run a live company search.
- Settings connection verification proves access/row-count reads, not complete synchronization.

**Course correction:** user-facing language now describes the actual calculation or capability instead of preserving an earlier copy choice that did not match source behavior.

## 3. Generators were a larger risk than static labels

Several rooms had relatively clean labels while their generators still recreated the deprecated dialect or invented evidence.

Examples found and corrected:

- Future Autopsy narrative generation used inevitability/causal language.
- Founding GTM synthesis converted small-sample association into “what wins/closes.”
- Outbound generated comparable-company proof, payback claims, buyer priorities, and attachments that were not supplied as inputs.
- Cold Call’s legacy `proof` step asserted “we’ve seen both,” cost escalation, and a benchmark without a proof source.
- LinkedIn scripts asserted generic operating patterns and fixed channel performance thresholds with no evidence source.
- Briefing synthesis and critic layers enforced declarative overcertainty.

**Rule going forward:** every user-visible generator, prompt, critic, mirror, and template is part of the language surface. Static TSX replacement alone is insufficient.

## 4. Stable internal keys are not the same as user-facing ontology

Internal enum/field keys such as Outbound `Temperature`, Cold Call thread id `proof`, LinkedIn compatibility keys such as `add_air_cover`, and route/component names may remain when renaming them would create migration risk and they do not teach output language.

The adversarial test is whether the identifier is rendered to the user or instructs a generator to reproduce the retired dialect. If not, compatibility can take precedence.

---

# Findings by phase

## Phase 1 — corpus + methodology

**Decision status: PASS**  
**Source status: PASS for methodology/tooling**  
**Validation status: PARTIAL**

What remains sound:

- rendered walkthrough = language-analysis corpus;
- repo source = implementation target;
- generated transcript is not edited directly;
- unchanged nine-dimension rubric and <=20/100 ceiling are preserved;
- baseline TXT fingerprint is recorded.

Remaining gap: the post-remediation transcript has not yet been regenerated and audited.

## Phase 2 — shared semantic architecture

**Decision status: PASS**  
**Source status: SUBSTANTIAL**  
**Validation status: PENDING**

Implemented source now includes:

- Workspace map / Ground user-facing language;
- Recent Activity / Live Edge user-facing language;
- Readiness labels, evidence/gap copy, blockers, and tests;
- Birdseye explanations;
- shared operator-help registry;
- shared voice document and strict string validator;
- Deno voice mirror.

Adversarial finding: the shared voice layer itself was a root cause of forced certainty. It has been course-corrected, but regenerated-output validation is still required.

## Phase 3 — highest-saturation rooms

**Decision status: PASS**  
**Source status: SUBSTANTIAL**  
**Validation status: PENDING**

Implemented at source:

- Welcome;
- Dashboard;
- ICP Studio;
- Readiness shared surface;
- Future Autopsy UI, cause layer, and narrative generator;
- Briefing primer, samples, rails, enrichment, synthesis, conflict analysis, quality gates, production mirrors, and post-publication critic.

Adversarial findings already corrected:

- Future Autopsy generator was once falsely marked complete after a failed write. It was later actually migrated and contract compatibility checked.
- Briefing’s generator stack explicitly taught overcertainty and fragmentary “sharp operator” prose; that doctrine has been rewritten.
- Briefing post-publication critic read `label` while generated moves use `action`; this schema mismatch was fixed.

Remaining targeted check: verify Future Autopsy’s final UI renders the generator’s specific evidence sentence rather than a generic placeholder.

## Phase 4 — strategic / diagnostic rooms

**Decision status: PASS**  
**Source status: SUBSTANTIAL**  
**Validation status: PENDING**

Implemented source includes:

- Territory Architect;
- Signal Console;
- Getting to Signed;
- Pilot Desk;
- Call in a Favor;
- Founding GTM reader/taxonomy and synthesis engine.

Critical adversarial correction: Founding GTM previously converted observed frequencies, keyword overlap, and historical associations into causal rules such as what “wins,” “closes,” or should be taught. The synthesis now reports sample size, observed association, limitations, and a hypothesis/recommendation to test.

## Phase 5 — execution / utility rooms

**Decision status: PASS**  
**Primary source status: IMPLEMENTED**  
**Validation status: PENDING**

### Prospecting Desk

Finding: the old surface implied the room searched for companies; source behavior only stores target criteria and manually added companies.

Correction: Step 1 now saves target criteria and explicitly says the room does not run a live company search. Funnel/shipping/loose metaphors were removed from visible/generated status copy.

### Outdoors Events

Finding: the old surface used orbit/ring metaphors and implied buyer attendance.

Correction: direct/adjacent/indirect tiers now describe category/buyer-context relevance. The discovery prompt forbids claiming a buyer will attend without source support and requires real current event pages.

### Outbound Studio

Finding: trigger and generator layers invented buyer motives and evidence: board pressure, willingness to change, comparable-company outcomes, payback periods, attachments, and customer proof.

Correction: trigger descriptions now state observable events; generator uses only supplied account/contact/stage/trigger/live-signal/question inputs; tests explicitly reject fabricated proof/outcomes.

### Cold Call Studio

Finding: the legacy `proof` step manufactured proof and benchmark claims without an evidence source.

Correction: internal id retained for compatibility, visible step now asks how the buyer handles the issue today. Verified examples may be used only when real evidence exists. Outcome grouping was also corrected: voicemail/no-answer are not mislabeled “no follow-up.”

### LinkedIn Playbook

Finding: recommendation logic inferred “trust,” “warmth,” and “air cover,” and asserted fixed 35% acceptance / 15% reply thresholds with no source.

Correction: recommendations now depend on recorded facts—current prioritized signal, connection request, DM, recent outbound touch. Fixed thresholds were removed. Scripts/templates no longer assert generic patterns or fabricated benchmarks.

### Discovery Studio

Finding: the framework content was mostly usable, but the shell used private/dramatic ontology: truths, reading, lens, recover & skip, won the room, locked, can hang up.

Correction: wrapper language is now call status, captured facts, buyer role, suggested response, recovery prompts, post-call routing, and next-step completeness. Underlying framework content was deliberately preserved.

### Deal Workspace

Finding: UI and comments said deals “will slip this week,” but the engine computes a risk score rather than a loss-time forecast.

Correction: model, comments, tests, and UI now describe risk factors/bands. Score thresholds are unchanged.

### Quota Workback

Findings:

- year-end “pace” projection is closed-won YTD + stage-weighted pipeline, not activity-rate extrapolation;
- benchmark selected by ACV band, not team size;
- `days` input means working days/month, not deal-cycle length;
- quality labels sounded like holistic readiness despite measuring benchmark alignment.

Corrections: surface and model labels now state the formula, benchmark basis, and input meaning.

### Settings

Findings:

- connection verification was mislabeled “everything’s in sync”;
- export was called a full workspace copy although selected tables can fail and many workspace-scoped tables are outside the export list;
- delete was called “everything” although identity records and several workspace-scoped tables are not deleted.

Correction: visible copy now states the current scope precisely.

**Open product-integrity blocker:** `exportCloudWorkspace` and `deleteCloudWorkspace` are not comprehensive relative to the full `DataClient` surface, and export/delete scopes are not identical. Do not mark Settings data controls validated until this is either expanded intentionally or explicitly accepted as a scoped control.

## Phase 6 — generated language + internal doctrine

**Specification status: PASS**  
**Source status: SUBSTANTIAL**  
**Validation status: PENDING**

Completed adversarial implementation includes:

- shared uncertainty doctrine;
- Future Autopsy narrative generator;
- Founding GTM synthesis;
- Briefing enrichment/synthesis/conflict/critic layers and Deno mirrors;
- Outbound generator;
- Cold Call response data;
- LinkedIn recommendation/scripts/cues;
- Outdoors discovery prompt.

Remaining requirement: repo-wide residual prompt/template/doctrine sweep, especially outside `src/` and in independently deployed edge functions.

## Phase 7 — source tracing + implementation

**Status: IN PROGRESS — now validation-led**

Primary room coverage is broad. Remaining work is no longer “implement Batch 03”; it is:

- residual source/doctrine sweep;
- targeted semantic blockers;
- tests/typecheck/CI;
- linter scope/CI integration;
- regenerated transcript and unchanged re-score.

## Phase 8 — copy linter + CI

**Tooling status: PARTIAL**  
**CI gate status: NOT IMPLEMENTED**

Existing:

- `tools/language-remediation/copy-audit.js`;
- `tools/language-remediation/build-copy-inventory.js`;
- npm scripts `copy:audit` and `copy:inventory`.

Adversarial gaps:

1. `copy:audit` is not yet wired into CI.
2. Current scan roots must be confirmed/expanded to include user-visible prompt/template sources outside `src/`, including relevant Supabase edge-function source.
3. Simple substring matching can flag comments/internal identifiers; explicit allowlisting/manual classification is required.
4. Tier-2 warnings remain manual-review items.
5. Checked-in rendered transcript is stale until regeneration.
6. Green ordinary CI alone will not constitute language validation.

## Phase 9 — regenerated transcript + saturation re-score

**Status: NOT STARTED**

This remains the final acceptance gate. No source-implemented phase is promoted to validated until the rendered product is regenerated and re-scored using the unchanged rubric.

---

# Adversarial quality gates for every migrated room

A room can be promoted from `source implemented` to `validated` only when all applicable items are true:

1. Actual source file(s) are present in the PR.
2. Generator/prompt sources that can recreate the language are also migrated.
3. Standard business/sales concepts are not renamed merely for brand voice.
4. Functional meaning does not depend on metaphor.
5. Metadiscursive framing is removed where a direct proposition works.
6. Aphoristic cadence does not carry explanatory meaning.
7. Facts, calculations, assessments, forecasts, and recommendations are distinguishable.
8. Model labels match what the underlying calculation actually computes.
9. Analytical claims expose supporting evidence or limitations.
10. Correlation is not rewritten as causation.
11. Uncertainty is calibrated rather than prohibited.
12. CTAs predict the resulting action.
13. Stable internal IDs/enums are not gratuitously migrated.
14. Relevant tests/typecheck/build pass.
15. Production mirrors match browser/tested source where duplication is intentional.
16. Regenerated preview transcript reflects intended room-at-rest and interaction-state language.
17. No Tier-1 deprecated user-facing language remains.
18. Tier-2 warnings are manually classified.

---

# Current validation blockers

1. **Ordinary CI has not yet been verified on the current PR head.**
2. **Copy audit is not wired into CI.**
3. **Rendered transcript has not been regenerated.**
4. **Nine-dimension saturation re-score has not been rerun.**
5. **Settings export/delete scope is not comprehensive relative to the workspace-scoped data model.**
6. **Future Autopsy evidence-row rendering needs a final specific-evidence check.**
7. **Residual prompt/template/doctrine sweep remains.**

---

# Immediate remediation order after this audit

1. Keep the implementation ledger truthful under the three-state model.
2. Inspect current PR-head CI, tests, typecheck, and workflow logs.
3. Fix failures revealed by CI without restoring deprecated language merely to satisfy stale tests.
4. Run the residual prompt/template/doctrine sweep.
5. Resolve targeted blockers: Future Autopsy evidence rendering and Settings data-control scope decision.
6. Expand/confirm `copy:audit` scan roots and wire the gate into CI.
7. Run `build:transcript`, `copy:inventory`, and `copy:audit`.
8. Manually classify Tier-2 warnings.
9. Rerun the exact nine-dimension saturation test.
10. Iterate until <=20/100; keep PR draft until all acceptance gates pass.
