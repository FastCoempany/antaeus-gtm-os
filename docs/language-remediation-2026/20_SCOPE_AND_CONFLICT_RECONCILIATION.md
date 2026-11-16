# Scope and conflict reconciliation — final audit

Date: 2026-11-16. Written before any edit in the final audit pass, as the control document requires
(`ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/antaeus-audit-control/00_ANTAEUS_FINAL_AUDIT_CONTROL.md`,
"Before further edits, state the governing scope, map existing audits to the original obligations, and identify only
genuine document conflicts with exact citations").

File paths below are relative to the repository root. "Working set" means
`ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/antaeus-audit-control/original-working-set/`.

## 1. Governing scope

This pass finishes and certifies the existing language remediation. It is not a new project, a new rubric or a new
word list.

- **Principle.** "Antaeus may have a point of view. It may not require translation."
- **Authorities.** (A) The owner's request and later approvals (`01_OWNER_REQUIREMENTS.md` in the packet, plus the
  owner statements quoted in section 4). (B) The whole original working set: 17 files, 3,584 enumerated records.
  (C) The current repository: implementation, `docs/language-remediation-2026/`, tests, prompts, generators, tooling.
  None of these replaces another.
- **What is in scope.** Every route and shared surface; every interaction state; generators, prompts, templates,
  examples, both demo books, fallbacks and reachable older screen versions; active internal doctrine; and the scoring,
  recommendation selection, API contracts, schema, persistence, compatibility handling and error behavior behind the
  language.
- **What is preserved.** Owner-approved behavioral evolution: readiness recommendation and blocker selection; Future
  Autopsy generation that avoids false causation and forecast certainty; LinkedIn recommendations; Outbound generator
  changes and the `nextQuestion +6` scoring; Briefing reasoning, generation, calibration and gates that permit
  calibrated uncertainty.

## 2. State of the inputs (verified 2026-11-16)

| Item | Finding |
|---|---|
| Control packet | Read from the copy the owner uploaded to `main` (commit `57bc294`). All 20 files match `SHA256SUMS.json`. |
| Working set | Byte-identical to `docs/language-remediation-2026/handoff-2026-11-04/original-working-set/`. |
| `01_OWNER_REQUIREMENTS.md`, `02_ORIGINAL_SCORING_METHOD.md` | Byte-identical to the 2026-11-04 handoff copies (and to `docs/language-remediation-2026/14_RECOVERED_SATURATION_METHOD.md`). |
| `LANGUAGE_CANON.md` | Named in the control document as supplementary. It is not in the packet or the repository, so it was not used. |
| PR #324 | Merged 2026-11-05 (head `98c85e0`). Not open. `language-remediation-v1` has no commits beyond the merged head. |
| Later work | `main` has 14 commits after the merge (PRs #325–#337 and the packet upload). All are preserved. |
| Working branch | `claude/dazzling-brahmagupta-wecgwt` = `main` + unmerged onboarding mockups + COPY_STANDARD §26. The completion work lands here, with a new pull request. Nothing is merged or deployed. |

## 3. What each list is for

| List | Job | What it cannot do |
|---|---|---|
| Working set `01_USER_FACING_COPY_INVENTORY.json` | The original corpus: 2,780 strings with diagnoses. The coverage backstop. | Its "retain unless context requires change" label is not a permanent exemption. |
| Batch manifests (`05_…`, `08_…`, `10_…`) and their prose (`04_…`, `07_…`, `09_…`) | Specific approved rewrites and structural rules. | They do not cover screens and states added later. |
| `02_LANGUAGE_MIGRATION_MAP.md` | What each deprecated concept means in explicit language. | It is semantic, "not a blind find/replace list" (its own words). |
| `14_…`/`15_…` interaction patch | Rewrites for controls and hidden states the room-at-rest batches missed. | — |
| `11_AI_PROMPT_AND_GENERATOR_REWRITE_SPEC.md`, `03_INTERNAL_LANGUAGE_DOCTRINE_REWRITE.md` | Keep generated language and internal doctrine from recreating the dialect. | — |
| `12_COPY_LINTER_AND_CI_SPEC.md` Tier 1 / Tier 2 | A short automatic regression gate plus review prompts. | Neither tier is the language specification. Absence from Tier 1 excuses nothing. |
| `02_ORIGINAL_SCORING_METHOD.md` | Judges the whole language system on nine dimensions. | Keyword counts are not the score. |
| `COPY_STANDARD.md` | The owner's standard for visible strings; §26 holds the 2026-11-09 rules. | It does not cancel a specific original rewrite unless the owner said so (section 4). |
| The assistant's 2026-11-16 token scan | A list of places to look (about 1,400 raw hits). | It is not a standard. See section 5. |

Different membership across these lists is not a contradiction. Section 4 lists the places where two sources prescribe
incompatible things for the same text.

## 4. Genuine conflicts, with the evidence and the resolution

### C1 — "rank"

- **Original specification (approves it, with a stated basis).**
  - Working set `04_REWRITE_BATCH_01_SHARED_AND_CORE.md`, exact replacements: "At the top because heat 62 and fresh
    signals." → "Ranked first because Boeing has a priority score of 62 and recent account signals." Same file,
    Welcome order, item 5: "`Why this is ranked first` with factual inputs."
  - Working set `09_REWRITE_BATCH_03_EXECUTION_AND_UTILITY.md`: "THE REST, RANKED" → "OTHER OPEN DEALS · RANKED BY
    RISK".
  - Working set `14_HIGH_SEVERITY_INTERACTION_PATCH_MANIFEST.json`, `records[14]`: "…rank accounts using current
    evidence."; `records[20]`: "…to rank the current recommendations."
  - Working set `03_INTERNAL_LANGUAGE_DOCTRINE_REWRITE.md`, epistemic standard: "Avoid converting a ranking or model
    output into an absolute claim."
  - `COPY_STANDARD.md` as it stands on `main`: "ranking" in the §2 list of literal nouns, "ranks" in the §9 list of
    literal verbs.
- **Owner, 2026-11-09 (this session).** First: "'Ranks' needs to be banned app wide. Give me some synonymns." Then,
  after being told the standard approves the word for what the software does: "i favor 'in order of risk'. I want to
  be careful after reading your conflict flag: I dont like it used when its not talking about what the tech is/does.
  I don't like it in language associated with inputs/things the user is doing." Then: "yes you nailed it. The way you
  understand the difference i want in how the rank word is applied."
- **What the assistant then wrote (the error).** COPY_STANDARD §26 on this branch said "Do not use 'rank,' 'ranks,'
  'ranked,' or 'ranking' in visible copy", and the standard's own "ranks/ranking" entries were removed. That was
  broader than the owner's second message, and it contradicted the original rewrites above.
- **Owner, 2026-11-16.** "Do not invent blanket token bans or blanket contextual exemptions. Review rank, move, room,
  proof, in-your-head language, and other remnants in their actual functional contexts." The control document: "Not
  globally banned. Describe what is ranked and the relevant criteria. Remove unexplained ranking slogans and
  unsupported absolute value claims." and "A stricter owner instruction can add a future rule."
- **Resolution.** The owner's 2026-11-09 refinement is the stricter rule in force, read as the owner stated it:
  1. Ordering language never describes something the user is asked to do or owns ("Rank your top accounts", "your
     ranking").
  2. Where the product describes its own ordering, the copy says what is ordered and by what.
  3. No unexplained ranking label, and no ranking presented as an absolute value claim.
  4. "In order of risk" is the owner's preferred phrasing where either wording works in new copy.
  Original rewrites that already meet 1–3 stay as written. COPY_STANDARD §26 was corrected on 2026-11-16 to say this,
  and its "ranks/ranking" vocabulary was restored to match `main`.
- **For the owner to confirm.** If the first message was the intent ("rank" out of visible copy entirely), that is a
  follow-up change to the strings listed under "rank" in `21_FINAL_AUDIT_LEDGER.md`.

### C2 — Readiness state names

- **Original.** Working set `02_LANGUAGE_MIGRATION_MAP.md`: `Inheritable with guardrails` → "Runnable with founder
  support"; `Hire-ready` → "Runnable independently"; `Hire-ready, repeatable` → "Documented and repeatable".
  Working set `05_COPY_IMPLEMENTATION_MANIFEST_BATCH_01.json`, `readiness_state_migration[2..4]`, same values.
- **`COPY_STANDARD.md` §17.** "Recommended labels: Founder-dependent · Partially documented · Usable with founder
  support · Hire-ready · Hire-ready and repeatable."
- **Owner, 2026-11-05.** "the langauge that is canon should be aligned with the guidlines that initiated this work".
  The alignment shipped on 2026-11-06 (CLAUDE.md session log, 2026-11-05 and 2026-11-06 rows).
- **Resolution.** The shipped names are the COPY_STANDARD §17 names. The original records for levels 3–5 are
  recorded as IMPLEMENTED DIFFERENTLY BUT ACCEPTABLY, by owner direction. Engine ids are unchanged.

### C3 — "proof"

- **Original.** No ban on the word. `14_HIGH_SEVERITY_INTERACTION_PATCH_MANIFEST.json` `records[112]` rewrites "Cast a
  proof … forge a proof" as opening Pilot Desk for pilot planning. `06_INTERNAL_DOCTRINE_HITS.json` quotes an old Cold
  Call passage ("Banned on the face: … proof …"): the control document classes that as a captured, surface-specific
  passage, not a global ban.
- **Repository canon.** `CLAUDE.md` Part III §13, by owner direction of 2026-07-03 ("proof is out and no longer a
  sacred canon noun. Lose it."): the product does not call a pilot or its results "proof" on any user-facing surface.
- **Owner, 2026-11-16.** Review "proof" in its functional context. The control document: do not treat ordinary "proof
  of concept", an exact quotation, or a stable technical identifier as automatically forbidden; an unclear bare label
  still requires review.
- **Resolution.** In the product's own voice, the pilot and its results are "the pilot", "the pilot's results",
  "pilot evidence" or "success criteria". A buyer's quoted words, "proof of concept" where that ordinary term is
  literally meant, and identifiers are judged one by one. No claim is made that the original packet banned the word.

### C4 — Older screen versions

- **Owner, 2026-11-04.** "dont worry about the older room screens." The 2026-11-05 certificate therefore excluded the
  fallback screens.
- **Owner, 2026-11-16.** Audit "fallbacks, and reachable legacy interfaces". The control document: the 21-room walk
  is "not permission to omit … a fallback interface".
- **Resolution.** The later instruction governs. All three screen generations of every area are in scope.

### Not conflicts (different scope or already consistent)

| Topic | Why it is not a conflict |
|---|---|
| "The Ground" / "The Live Edge" | The working set retires both names from the app ("Workspace map", "Recent activity"). `COPY_STANDARD.md` §4 allows them as proper names on marketing pages only with an immediate literal definition. The app follows the working set. |
| "Future Autopsy" | The migration map allows the name "with explicit functional subtitle"; `COPY_STANDARD.md` §4 and `CLAUDE.md` §4.14 say the same. |
| "motion" | The migration map: "Never use as a catch-all." The owner on 2026-11-05: "motion is acceptable". An ordinary use is acceptable; a use that makes the reader guess which thing is meant still fails the principle. |
| "room" | Batch 01 and the interaction patch replace the app-as-a-place uses. The owner on 2026-11-05: "i dont see use for the word room". The meeting-presence idiom ("without you in the room") is ordinary English and stays (`19_ROOM_WORD_AUDIT.md`). |
| "move" | The migration map replaces the private label ("one move" → "highest-priority recommended action") and itself uses the ordinary verb ("help move a deal"). |
| Linter lists vs. the specification | `tools/language-remediation/copy-audit.js` implements a narrower Tier 2 than working set `12_COPY_LINTER_AND_CI_SPEC.md`. That is an implementation gap, tracked as a finding, not a document conflict. |

## 5. The 2026-11-16 token scan, mapped to the original obligations

The scan grouped raw hits by word and described several words as banned. That framing is withdrawn. Each group below
is now handled under the original rule that governs it.

| Scan group | Governing original rule | Treatment in this pass |
|---|---|---|
| rank / ranked / ranking (~24 default-screen hits, more on static pages) | C1 above | Each use reviewed in context. Uses that state what is ordered and by what stay. |
| actually / really / honest (~27) | `COPY_STANDARD.md` §26, "Judgment words about the reader" (owner, 2026-11-09) | Applies only where the word implies a failing of the reader. Buyer questions and neutral uses stay. |
| "move" as a noun for the recommendation (~22) | Migration map `one move`; working set `03_…` CTA and epistemic standards | The private label becomes the specific action or "recommended action"/"next step". Ordinary verb uses stay. |
| "in your head" | Batch 01 manifest `exact_replacements[34]` | Rewritten to state the actual condition. |
| "the system noticed" and similar | Migration map `system saw` / `what the system saw`; prompt spec rule 8 and rule 12 | Rewritten to state the result. |
| leverage / cold / gap | Migration map (`pressure`, `thin`, `heat` family) and the comprehension principle; no token rule | Each use reviewed in context. |
| Older screen versions (~189 hits) | C4 above | In scope. |
| Unscanned served pages; narrower Tier 2 | Working set `12_COPY_LINTER_AND_CI_SPEC.md` | Tracked as tooling findings. |
| Discovery call scripts (~700) | Batch 03: "The ban is not on natural speech. The ban is on private Antaeus ontology and rhetorical compression that obscures meaning." | Spoken questions stay. Labels, tags and coaching notes addressed to the seller are reviewed. |

The record-level results are in `21_FINAL_AUDIT_LEDGER.md` and its JSON companions.
