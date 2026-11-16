# Antaeus: full-app remediation and final audit control

Prepared 2026-11-16 to re-establish the existing task. This packet organizes the owner's requirements and original specification; it does not introduce a replacement rubric, a fresh remediation project, or new blanket word bans. It contains no implementation files or restoration patches. Do not overwrite newer work with the November 4 handoff snapshot.

## The assignment

Complete the existing Antaeus language remediation across the application and the systems that produce its language. Review the current implementation adversarially, fix genuine remaining defects, regenerate the tester experience, apply the original saturation methodology, and certify the actual final revision for the owner's merge decision. Do not merge.

Original repository: `FastCoempany/antaeus-gtm-os`. Original working branch: `language-remediation-v1`. Original PR: `#324`. Verify current repository/branch/PR state before acting; these references are not permission to overwrite subsequent work.

**Antaeus may have a point of view. It may not require translation.**

The task is larger than clearing a keyword list. It covers rendered language, interaction states, generators, prompts, seeds, fallbacks, active doctrine, and the correctness of the functions and data behind the claims. A low language score does not excuse a functional regression or incomplete coverage.

## Authority and evidence

1. The owner's explicit request, subsequent approvals, and recovered scoring method govern scope and acceptance. `01_OWNER_REQUIREMENTS.md` is a faithful summary of that request; the original conversation governs if the summary omits something.
2. Read the entire `original-working-set/` directory. The exhaustive inventory, batch manifests, contextual records, and doctrine list preserve the original diagnoses and intended semantic changes. Their coverage cannot be replaced by a newly invented checklist.
3. Read the entire **current** repository's `docs/language-remediation-2026/` and complete current diff against main. These contain evolved specifications, implementation, and audit evidence. Preserve explicitly approved product evolution. Current code shows what the product does; its mere presence does not prove it is correct or approved.
4. A linter, an inventory's automated classification, an agent's audit list, and a historical status note are evidence or review tools. None can silently override the owner's requirements or a specific remediation decision.
5. The reusable `LANGUAGE_CANON.md` is supplementary. It was created after the November 4 handoff and was not in that ZIP. Its optional generic scoring section does not make Antaeus's required scoring optional, and its general contextual flexibility does not cancel Antaeus-specific replacements.

Do not refer to documents by number alone: original-working-set and repository docs use different numbering. Cite the full path and the relevant rule or record.

## Why the lists differ

Different artifacts perform different jobs:

- The inventory records the original corpus, including strings that may be retained subject to context.
- Batch manifests specify particular rewrites and structural changes.
- The migration map defines what deprecated concepts should mean in explicit language.
- The interaction patch covers controls and hidden states missed by initial page-at-rest batches.
- The prompt specification prevents future generated language from restoring the old dialect.
- The Tier-1 list is a deliberately short automatic regression gate. Tier-2 findings require contextual review. Neither list is the full language specification.
- The saturation rubric judges the language system, including conceptual opacity that contains no listed token.

Different membership is not, by itself, a contradiction. An old “retain unless context requires change” classification is not a permanent exemption. A subsequent explicit rewrite or a demonstrated comprehension problem must still be addressed.

Inventories also quote rejected copy and old internal instructions. Those quotations are material to review, not automatically instructions to obey. In particular, `06_INTERNAL_DOCTRINE_HITS.json` contains an old Cold Call Studio passage beginning “Banned on the face” that includes `proof` and `the move`. It is a captured, surface-specific doctrine passage, not a newly adopted global ban. Preserve the distinction between a source quotation, its scope, and the governing remediation decision.

When there is a genuine conflict, record both exact sources, their scope, the relevant current behavior, the owner's applicable approval, and the resolution. Do not resolve it by choosing the shortest list, the newest agent-generated list, or whichever interpretation produces a passing score. Ask the owner only if the decision actually requires new product authority; continue independent work.

New findings are welcome. Add them to a traceable reconciliation/coverage ledger with source and evidence. Do not create a competing standard or use a new list to discard original obligations.

## The disputed terms: what the original files actually say

| Term or phrase | Required treatment | Original evidence |
|---|---|---|
| `rank` / `ranked` | Not globally banned. Describe what is ranked and the relevant criteria. Remove unexplained ranking slogans and unsupported absolute value claims. | `14_HIGH_SEVERITY_INTERACTION_PATCH_MANIFEST.json`, `records[14]`, approves “rank accounts using current evidence”; `records[20]` approves “rank the current recommendations.” |
| `move` / `one move` | Replace the private recommendation label with a specific action or “recommended action.” Literal ordinary-English uses are not automatically violations. | Migration map: `one move` → `highest-priority recommended action`. The same map's Call in a Favor description uses “help move a deal.” |
| `room` | Do not require users to learn the app-as-place metaphor to find a function. Replace opaque functional uses with workspace/task language. A global lexical prohibition is not stated. | Batch01 replaces “THE ONE DEFINITION EVERY ROOM FILTERS AGAINST” with “USED ACROSS THE WORKSPACE.” Interaction patch replaces “EVERY ROOM THAT HOLDS A PIECE” with related activity across the workspace. The specification itself still describes rooms and permits explained branded room names. |
| `proof` | Replace private artifact/metallurgy language such as “cast/forge a proof” with the actual pilot plan, results, evidence, or evaluation criterion. Do not treat ordinary “proof of concept,” an exact quotation, or a stable technical identifier as automatically forbidden. An unclear bare label still requires review. | Interaction manifest `records[112]` rewrites “Cast a proof … forge a proof” as opening Pilot Desk for pilot planning. This does not establish a ban on every occurrence of the token. |
| `in your head` | The specific readiness metaphor was explicitly slated for replacement. Related current prose should state the actual condition: undocumented process, founder-dependent decisions, or information unavailable to another seller. | Batch01 manifest `exact_replacements[34]`: “It all lived in your head — nothing to inherit.” → “The sales process was not yet documented for another seller.” |

JSON indices above are zero-based and refer to the original files bundled here. Verify the full record in context. These examples explain the existing rules; they are not an exhaustive new allowlist. “Not globally banned” is never sufficient justification for retaining an opaque occurrence.

A stricter owner instruction can add a future rule. Do not claim a blanket ban was present in the original packet when it was not.

The original Batch03 prose states the intended distinction directly: “The ban is not on natural speech. The ban is on private Antaeus ontology and rhetorical compression that obscures meaning.” This does not excuse a recurring private shorthand merely because its component words are ordinary English.

## Required reading and each file's role

| File | What it does |
|---|---|
| `01_OWNER_REQUIREMENTS.md` | Overall task, approved behavioral changes, functional audit, engineering/CI requirements, stop conditions, and A–K final report. |
| `02_ORIGINAL_SCORING_METHOD.md` | Recovered nine-dimension qualitative scoring, equal-weight calculation, original baseline and dimension targets. |
| `original-working-set/README.md` | Inventory of the original source materials and how the corpus was organized. Historical sequencing is not a new instruction to restart. |
| `original-working-set/01_USER_FACING_COPY_INVENTORY.json` | Exhaustive original 2,780 unique strings / 5,627 occurrences, with location/state information, diagnoses and suggested dispositions. The coverage backstop. |
| `original-working-set/02_LANGUAGE_MIGRATION_MAP.md` | Semantic translation of the private product vocabulary into explicit operating language, including navigation descriptions. |
| `original-working-set/03_INTERNAL_LANGUAGE_DOCTRINE_REWRITE.md` | Rules for active internal instructions so future code and generated copy do not recreate the dialect. |
| `original-working-set/04_REWRITE_BATCH_01_SHARED_AND_CORE.md` and `05_COPY_IMPLEMENTATION_MANIFEST_BATCH_01.json` | Prose rationale and machine-readable decisions for shared UI and core workflows. Read both. |
| `original-working-set/07_REWRITE_BATCH_02_STRATEGIC_AND_DIAGNOSTIC.md` and `08_COPY_IMPLEMENTATION_MANIFEST_BATCH_02.json` | Prose and machine-readable decisions for strategic and diagnostic workflows. |
| `original-working-set/09_REWRITE_BATCH_03_EXECUTION_AND_UTILITY.md` and `10_COPY_IMPLEMENTATION_MANIFEST_BATCH_03.json` | Prose and machine-readable decisions for execution and utility workflows. |
| `original-working-set/06_INTERNAL_DOCTRINE_HITS.json` | Original 169 flagged doctrine lines, with locations/context to reconcile. |
| `original-working-set/11_AI_PROMPT_AND_GENERATOR_REWRITE_SPEC.md` | Mandatory generated-language and epistemic standards; covers AI and deterministic output, not just static strings. |
| `original-working-set/12_COPY_LINTER_AND_CI_SPEC.md` | Regression-scanner requirements, Tier1/Tier2 distinction, contextual review and narrowly justified exceptions. Not the saturation rubric. |
| `original-working-set/13_IMPLEMENTATION_ORDER_FOR_CODING_AGENT.md` | Original implementation dependencies and source-first workflow. Inherit completed work rather than replay it. |
| `original-working-set/14_HIGH_SEVERITY_INTERACTION_PATCH_MANIFEST.json` and `15_HIGH_SEVERITY_INTERACTION_PATCH.md` | Machine-readable and explanatory decisions for hidden/interactive language missed by static views. |
| `original-working-set/16_REMAINING_CONTEXTUAL_GENERATOR_REVIEW.json` | Cases that need generator-level semantic review rather than blind string replacement. |

Also inspect the current repository's reconciliation JSON/MD, implementation status, adversarial findings, prompts, generators, preview tooling, package scripts, CI, migrations/types and callers. Verify their claims against source and execution.

The old handoff `04_CURRENT_STATE_AND_REMAINING_WORK.md`, audit notes, logs, and `16_ORIGINAL_MANIFEST_RECONCILIATION.*` snapshot describe **November 4**, when work was incomplete. The recorded 551 unresolved rows are a historical checkpoint, not a claim about today's app. Do not duplicate work already completed or assume those rows were subsequently resolved without evidence.

## Audit from requirements through runtime

Maintain one connected evidence ledger. Supplement original records with new findings and newly added surfaces; do not limit review to the old strings or only files changed by the latest agent.

For each relevant feature or task, trace:

**User task → route/navigation → component and interaction state → text or generator → prompt/template/fallback → data inputs and scoring → API/backend → persistence → downstream handoffs → displayed result and explanation.**

Review these layers:

1. **Foundation:** owner requirements, terminology, domain concepts, active doctrine, defaults and schemas.
2. **Generation:** deterministic builders, AI prompts, examples, both enterprise and SMB demo narratives, fallbacks, unavailable/error output, legacy compatibility paths and translations.
3. **Function:** routes and room IDs, URLs, localStorage and persisted state, columns/migrations, API request/response contracts, authentication/workspace scoping where implicated, dedupe/upsert behavior, scoring thresholds, recommendation selection, error handling and cross-workflow handoffs.
4. **Rendered experience:** every current user-facing route and shared surface, onboarding, seeded/unseeded views, drawers, menus, hover/accessibility text, forms, validation, empty/loading/error/success/partial states, exports and notifications.
5. **Verification:** regression tests for actual defects, complete engineering checks, regenerated tester corpus, qualitative scoring, semantic-damage review and CI on the final revision.

The historical walkthrough covered 21 rooms. That is a coverage reference, not permission to omit a currently accessible route, a locked onboarding path, Call Planner, a fallback interface, or a newer feature. Enumerate current routes and available variants from source. Mark each as executed, source-and-test reviewed, or not verified, with a reason. Distinguish actual click exploration from arbitrary form-input and network-failure coverage. Do not claim live AI, database or authenticated behavior was executed when it was only mocked or inspected.

For a retained flagged occurrence, record file/line, rendered context or runtime path, actual meaning, governing rule, and why it is understandable. For a corrected occurrence, record the source fix and the resulting state/output. For a deprecated fixture/identifier/historical quote, classify it explicitly rather than erasing it to game the scan.

Resolve every original remediation obligation into the five approved statuses: IMPLEMENTED; IMPLEMENTED DIFFERENTLY BUT ACCEPTABLY; SUPERSEDED BY APPROVED PRODUCT EVOLUTION; STILL MISSING; NO LONGER APPLICABLE. An agent's unresolved assessment is not automatically a product defect; it is still unfinished certification work. A generic “contextual use” label without evidence is not resolution.

Preserve the owner's approved readiness, Future Autopsy, LinkedIn, Outbound and Briefing evolution, including `nextQuestion +6` and calibrated uncertainty. Repair accidental regressions. Do not restore inaccurate old copy or old behavior simply because a historical replacement or scope note predates the approval.

## Final score and certification

Use `02_ORIGINAL_SCORING_METHOD.md` without alteration. Score all nine dimensions independently from0.0 to10.0 across the complete regenerated corpus. Overall score is `round(sum / 9 * 10)`. Original reported baseline93; acceptance <=20; preferred15–20; do not target0 or manipulate the rubric to pass.

For each dimension give the score, representative examples, reasoning, and comparison to the original failure pattern. State corpus coverage and limits. A keyword count, linter pass, or average from a few screenshots is not this evaluation. Neither language score nor test success substitutes for functional certification.

If >20, repair the source, regenerate and reevaluate. Once <=20, actively test for overcorrection, generic wording, lost judgment, repetition, awkward literalism, misleading simplifications and recommendation/logic mismatches. Fix those without reintroducing opacity.

Run the full applicable suite and CI on the final revision. Update the certification document and PR description, commit/push the authorized completion work, and report A–K as required by the owner. Do not merge. Report READY only when the original stop conditions are all supported by actual evidence.

## Paste this into Claude Code

```text
Re-anchor this task to the attached Antaeus audit-control packet and my
existing full-app completion request. Read 00_ANTAEUS_FINAL_AUDIT_CONTROL.md,
01_OWNER_REQUIREMENTS.md, 02_ORIGINAL_SCORING_METHOD.md, all17 original
working-set files, and the current repository's complete remediation docs.

Preserve our current work. Do not restore the old handoff source snapshot.
Before further edits, state the governing scope, map existing audits to
the original obligations, and identify only genuine document conflicts
with exact citations. Different lists serve different purposes; do not
choose a convenient list or silently invent a replacement standard.

Complete the end-to-end audit from active doctrine and generators through
rendered interactions, backend/data contracts, persistence and handoffs.
Review the whole current app, not just default screens or recent edits.
Use the original inventories as a coverage backstop and extend coverage
for current routes and states. Record evidence for every disposition.

Review rank/move/room/proof/in-your-head occurrences in their actual
contexts. Enforce the specific original rewrites and the governing
comprehension rule. Absence from Tier1 is not permission to retain opaque
copy; presence of a token is not proof that every use is prohibited.
Do not rename safe contracts or weaken assertions to game an audit.

Preserve my approved behavioral evolution and repair real regressions.
Fix source, regenerate the complete tester corpus, apply the recovered
nine-dimension equal-weight rubric, and perform the semantic-damage pass.
Finish full engineering validation, final-head CI, certification docs,
and the authorized commit/push/PR update. Do not merge. State validation
limits honestly. Give the required A–K final report with a score supported
by the complete reviewed corpus. Continue until the existing stop
conditions are met; do not stop at a new audit list or a green linter.
```
