# Antaeus final audit — shared brief for every reviewer

You are one reviewer in the final end-to-end audit of the Antaeus language remediation. Read this brief fully, then the documents it names, then do your assigned area. You are READ-ONLY in this stage: do not edit application source, tests, docs or the transcript. You may run read-only commands (grep, node/python scripts, `npx vitest run <file>`), and you write exactly one output file (path given in your assignment).

Repository: `/home/user/antaeus-gtm-os` (branch `claude/dazzling-brahmagupta-wecgwt`, which is `main` plus unmerged onboarding mockups and COPY_STANDARD §26).

## 1. The governing principle

**Antaeus may have a point of view. It may not require translation.**

A first-time user — a founder or seller who has never seen Antaeus — should understand what they see, what a state or number means, why a conclusion was reached, how certain it is, what to do next, and where to do it, without learning Antaeus vocabulary.

Preserve: product intelligence, operator judgment, specificity, decisiveness, legitimate sales terminology, visual/product identity, branded area names that carry an explicit functional description.

Remove: private ontology required for operation; metaphor doing the work of explanation; meaning lost through compression; unexplained branding; default aphorisms; personified system models; unsupported certainty; implicit logical relations; high-context references; fragments that impair understanding; unnecessary narration of the system's own analysis.

## 2. Authority — read these (in this order)

1. `ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/antaeus-audit-control/00_ANTAEUS_FINAL_AUDIT_CONTROL.md` — the control document. Read all of it.
2. `ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/antaeus-audit-control/01_OWNER_REQUIREMENTS.md` — owner requirements, approved evolution, stop conditions.
3. `ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/antaeus-audit-control/original-working-set/02_LANGUAGE_MIGRATION_MAP.md` — what each deprecated concept means in explicit language.
4. The original rewrite document(s) for your area (named in your assignment): `04_REWRITE_BATCH_01_SHARED_AND_CORE.md`, `07_REWRITE_BATCH_02_STRATEGIC_AND_DIAGNOSTIC.md`, `09_REWRITE_BATCH_03_EXECUTION_AND_UTILITY.md`, `15_HIGH_SEVERITY_INTERACTION_PATCH.md`, `11_AI_PROMPT_AND_GENERATOR_REWRITE_SPEC.md`, `03_INTERNAL_LANGUAGE_DOCTRINE_REWRITE.md` (all under `.../original-working-set/`). Read the exact-replacement rows AND the "Structural requirements" section for your area.
5. `COPY_STANDARD.md` (repo root) — the owner's governing language standard for visible strings. §26 holds the owner's 2026-11-09 rules.
6. Your area's slice of the original obligations (JSON path in your assignment), and your area's slice of the current rendered walkthrough (text path in your assignment).

Do not cite a document by number alone: the working set and `docs/language-remediation-2026/` number files differently. Cite full path plus rule or record id.

## 3. Why the lists differ — and what that means for you

- The inventory, batch manifests, migration map, interaction patch, prompt spec, the linter's Tier-1/Tier-2 lists and the saturation rubric do different jobs. Different membership is not a contradiction.
- Absence from the linter's Tier-1 list never excuses opaque language. Presence of a token never proves a use is wrong.
- **Do not invent blanket token bans or blanket contextual exemptions.** Judge each occurrence in its functional context: who reads it, where, what it has to tell them.
- A "retain unless context requires change" label in the old inventory is not a permanent exemption.
- "Not globally banned" is never a sufficient reason to keep an opaque occurrence.

### The disputed terms (apply exactly this)

| Term | Treatment | Sources |
|---|---|---|
| rank / ranked / ranking | Allowed when it describes what the product does to the user's data AND the copy says what is ordered and by what ("Other open deals · ranked by risk"; "Ranked first because Boeing has a priority score of 62 and recent account signals"). Not allowed for anything the user is asked to do or owns ("Rank your top accounts", "your ranking"). Not allowed as an unexplained ranking label or an absolute value claim ("the most valuable move on your board"). Internal-architecture phrasing such as "the ranking engine" or "ranked object" is not plain language. | Original: `14_HIGH_SEVERITY_INTERACTION_PATCH_MANIFEST.json` records[14], records[20]; Batch 01 "Ranked first because…"; Batch 03 "OTHER OPEN DEALS · RANKED BY RISK". Owner 2026-11-09: "I dont like it used when its not talking about what the tech is/does. I don't like it in language associated with inputs/things the user is doing." COPY_STANDARD §26. |
| move / one move / next move | The private recommendation label ("the one move", "your move", "Recommended moves", "NEED A MOVE", "next move" as a noun for the recommendation) becomes the specific action or "recommended action" / "next step". Literal ordinary-English verb uses stay ("help move a deal forward", "Move to another segment", "when a contact moves roles"). | Migration map: `one move` → "highest-priority recommended action"; the same map's Call in a Favor description uses "help move a deal". |
| room | Do not make the user learn the app-as-a-place metaphor. Opaque functional uses become the area's name, "page", "workspace", or "the rest of the app". The meeting-presence idiom ("without you in the room", "get the budget owner in the room") and literal space ("room to add") are ordinary English and stay. | Batch 01 ("EVERY ROOM FILTERS AGAINST" → "USED ACROSS THE WORKSPACE"); interaction patch; owner 2026-11-05: "I don't see use for the word room"; `docs/language-remediation-2026/19_ROOM_WORD_AUDIT.md`. |
| proof | In the product's own voice, the pilot artifact and its results are "the pilot", "the pilot's results", "pilot evidence", "success criteria" — not "proof", and never "cast/forge a proof". An exact quotation of a buyer, "proof of concept" where that ordinary term is literally what is meant, and stable technical identifiers (`proof` thread id, `proofs` table) are not automatically wrong — review each; an unclear bare label still needs fixing. | Interaction manifest records[112]; owner 2026-07-03 (CLAUDE.md session log): "proof is out and no longer a sacred canon noun. Lose it." (scope: the product's name for the pilot object). |
| in your head | State the actual condition: the process is undocumented, decisions depend on the founder, or the information is unavailable to another seller. | Batch 01 manifest `exact_replacements[34]`: "It all lived in your head — nothing to inherit." → "The sales process was not yet documented for another seller." |
| motion | Never as a catch-all for the sales process/activity/pipeline. (Owner 2026-11-05: "Motion is acceptable" — said about ordinary use; a use that makes the reader guess which thing is meant still fails.) | Migration map `motion`; COPY_STANDARD §3. |

Other owner rules in force (COPY_STANDARD §26, 2026-11-09), each applied in context, not as a word list: name the thing instead of a casual stand-in noun ("the calls", "your read", "the work"); don't describe something by its absence; no judgment words aimed at the reader ("honest", "yet", "really", "actually" when they imply the reader's failing — a buyer question like "what actually happens when…" is not aimed at the reader); stakes come from buyers and deals, never from the app threatening/catching/naming the user; no sentences built as no-exception rules ("any X will…"); write to this reader about what will happen.

## 4. Decisions already made by the owner — do not reopen, do not "fix back"

- Readiness state names are COPY_STANDARD §17: Founder-dependent · Partially documented · Usable with founder support · Hire-ready · Hire-ready and repeatable (owner-directed 2026-11-05/06; engine ids unchanged). The original map's "Runnable with founder support / Runnable independently / Documented and repeatable" is superseded by that decision.
- Call Planner is retired; its routes redirect to Discovery Studio.
- Discovery segment titles are: Opening · How they work today · The problem and its cost · Why now · Who's involved · What they need to see · Current vendor · How they'll decide · Next step · After the call.
- "Quota Workback" is the area's name; "Pace" is not a name for it (plan/pace remain names of its two views).
- "Future Autopsy" stays as a feature name provided the surrounding copy says plainly that it reviews open deals for loss risk.
- Prospecting Desk runs its own cited web search (edge function `prospecting-research`).
- Numbers shown in more than one area come from the area that owns them.
- Briefing voice: calibrated uncertainty words are allowed; the hedge-word limit is a review flag, not a hard reject.

### Approved behavioral evolution — must be intact (report any regression as a FUNC finding)

Readiness recommendation/blocker selection · Future Autopsy generation that avoids false causation and forecast certainty · LinkedIn recommendations · Outbound Studio generator changes and the scoring change from `noAsk +3` to `nextQuestion +6` · Briefing reasoning/generation/calibration and gates that permit calibrated uncertainty · the related evidence / inference / forecast / recommendation distinctions.

## 5. How to audit your area

Trace each feature end to end:

**user task → route/navigation → component and every interaction state → text or generator → prompt/template/fallback → data inputs and scoring → API/backend → persistence → downstream handoffs → displayed result and explanation.**

Screen generations. Most areas ship three: the default (`src/<area>/v4/`), the previous design-system version (`src/<area>/ds/`, reachable with `?v4=0` or a `*_v4_off` flag), and the oldest (`src/<area>/components/` + the root component, reachable with `?v4=0&ds=0` or a `*_legacy` flag). ALL THREE are in scope: the owner asked for "fallbacks, and reachable legacy interfaces". Shared `lib/` code feeds all three.

States. For every surface look at: populated, empty, loading, validation, error, success, partial result; drawers, menus, modals, tooltips (`title`), `aria-label`, `placeholder`, `alt`; toasts/notifications; exports and downloaded files; copy-to-clipboard templates; cross-area handoff links and their labels.

Generation. Deterministic builders, AI prompts and their output schemas, fallbacks when AI/network is unavailable, examples, demo/sample content, legacy compatibility translators.

Function. Routes, ids, URL params (`returnTo`, `returnLabel`, `focusObject`, `focusRoom`, `fromMode`, `fromSurface`), localStorage keys and stored shapes, cloud tables/columns, API request/response contracts, scoring thresholds, recommendation selection, error handling, dedupe/upsert. Look for places where the language work changed behavior by accident: a display label stored where a stable key belongs, a renamed label that breaks stored history, copy that now claims something the code does not do, a number that no longer matches its formula.

For each visible or generated string that could trouble a first-time user, ask the nine questions (these are the scoring dimensions):

1. Semantic compression — does short wording hide business/system meaning the reader must unpack?
2. Private ontology — is Antaeus-only vocabulary required to operate an ordinary sales/software concept?
3. Metaphor — is a metaphor the primary explanation of a concrete business concept?
4. Declarative certainty — is a heuristic, ranking, inference or forecast presented as established fact?
5. Aphoristic cadence — does a dramatic mini-maxim stand where an explanation should be?
6. High-context dependence — is prior knowledge of Antaeus terms, states or unstated context needed?
7. Paratactic compression — do adjacent clauses, punctuation or fragments leave a needed logical relation implicit?
8. Personification — is the system described as thinking, waking, seeing, deciding, dying in a way that hides the computation or evidence?
9. Elliptical syntax — are subjects, verbs or connectives omitted so that explanatory prose must be reconstructed?

It is NOT a finding when: it is an ordinary sales term (account, contact, stage, value, close date, next step, forecast, momentum, champion, economic buyer, stakeholders, use case, pain, competition, decision process, notes, pipeline, quota, closed won/lost, pilot success criteria, legal/security/finance/business approval); a short, useful UI label; an explained branded name; a conversational line the seller says to a buyer (unless it carries private Antaeus ontology or unsupported certainty); occasional editorial personality that a newcomer still understands; a code identifier, key, route, CSS class, test fixture, comment or historical note.

### Guard against overcorrection

A proposed rewrite must be accurate to what the code does, keep the judgment and specificity of the original, be no longer than it needs to be, read naturally, and keep legitimate sales terminology. Do not propose generic, bland, childish or awkwardly literal copy. Do not propose renaming identifiers, storage keys, enum keys, routes or table columns. Do not propose weakening a test. Never propose editing `preview-transcript/` or anything under `artifacts/` — they are generated.

If the current wording is already the original approved replacement verbatim, it is implemented; do not propose a different wording unless a real comprehension or accuracy problem exists (say which).

## 6. Original obligations for your area

Your assignment names a JSON slice. Its `judge` array holds original records the automatic check could not settle (`auto` = `NEEDS_JUDGMENT` or `ORIGINAL_STILL_RENDERED`). For EVERY record in `judge`, return a disposition with one of exactly these statuses:

- `IMPLEMENTED` — the specified replacement (or the specified rule) is what the app does now.
- `IMPLEMENTED DIFFERENTLY BUT ACCEPTABLY` — different words/structure, same semantic intent, and the current text passes the principle. Quote the current text.
- `SUPERSEDED BY APPROVED PRODUCT EVOLUTION` — an owner-approved change (section 4) replaced the surface or the decision. Name the approval.
- `STILL MISSING` — the obligation is not met today. Also file a finding with a proposed fix.
- `NO LONGER APPLICABLE` — the string/surface no longer exists and nothing equivalent renders, or the record was a retained ordinary string that is gone.

Evidence is mandatory: the current text and where it is (file:line, or walkthrough state). "Contextual use" with no evidence is not a disposition. `verbatim` records are already matched automatically — spot-check a few and report any that are wrong. `watch` records are retained strings that carried flags; confirm each still reads plainly or file a finding.

## 7. Output — one JSON file

Write your result to the path in your assignment, then validate it:
`node /tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit/validate-audit.js <your file>`
Fix anything it reports. Shape:

```json
{
  "area": "<your area key>",
  "coverage": [
    { "surface": "Deal Workspace default screen", "generation": "v4|ds|legacy|shared|backend|static|seed|doctrine|tooling", "how": "executed-in-walkthrough|source-and-test-reviewed|not-verified", "files": ["src/..."], "note": "what you actually looked at; what you could not verify and why" }
  ],
  "findings": [
    {
      "id": "<AREA>-001",
      "category": "LANG-A|LANG-B|LANG-C|LANG-D|FUNC|CLAIM|A11Y|TOOLING",
      "severity": 1,
      "file": "src/…/File.tsx",
      "line": 123,
      "generation": "v4|ds|legacy|shared|backend|static|seed|doctrine|tooling",
      "state": "which screen/state/trigger shows or produces it",
      "current": "the exact current text or a precise description of the current behavior",
      "problem": "which of the nine dimensions or which rule it fails, and why a first-time user would have to translate it or would be misled; or what is functionally wrong and how to observe it",
      "governing": "full path + rule/record id that governs (original record id such as B2-X-009, a migration-map row, COPY_STANDARD §, owner statement); say 'comprehension principle' when no specific record applies",
      "proposed": "the exact replacement text (for copy) or the precise code change (for function). Must be accurate to the code.",
      "testsAffected": ["tests that assert the current text/behavior, if you found any"],
      "confidence": "high|medium|low"
    }
  ],
  "dispositions": [
    { "recordId": "B2-X-009", "status": "one of the five statuses", "currentText": "what renders/exists now", "where": "file:line or walkthrough state", "note": "one or two sentences of reasoning; for SUPERSEDED name the approval" }
  ],
  "retained": [
    { "file": "src/…", "line": 45, "text": "…", "term": "rank|move|room|proof|…", "why": "why this occurrence is understandable in context and which rule covers it" }
  ],
  "gaps": ["paths or states you could not verify, each with the reason"]
}
```

Severity: 3 = a first-time user is blocked or misled, or data/behavior is wrong; 2 = requires translation or is noticeably unclear; 1 = minor.
Categories: LANG-A static rendered text · LANG-B text built at runtime by deterministic code · LANG-C AI prompt/template that would regenerate the old dialect or unsupported claims · LANG-D active internal doctrine that instructs writers/models toward the old dialect · FUNC functional defect or regression · CLAIM copy that asserts something the code does not do · A11Y accessible-name problem · TOOLING linter/walkthrough/CI gap.

Be exhaustive within your area and honest about limits. Do not claim a path was executed when you only read it. Line numbers must be real: open the file and check. Quote current text exactly.

Your final message back should be 5–10 lines: counts by category and severity, the three most important findings, and anything that needs an owner decision.
