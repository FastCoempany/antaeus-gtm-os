# Antaeus Design System — Voice as Component

**Status:** DRAFT for founder review.
**Date:** 2026-06-04.
**Author:** Claude, working session with the founder (mrcoe7@gmail.com).
**Branch:** `claude/antaeus-gtmos-design-system`.
**Scope:** This is the first sibling document to the design system charter (`00-charter-2026-06-02.md`). It specifies how voice stops being a guideline writers have to remember and becomes a component the build enforces — strict everywhere, family-modulated by temperature, blocking at CI, with one voice across the density gradient.

---

## 0. Why this exists

The canon Part III §11 voice rule is the most operationally consequential single sentence in the entire behavioral canon. It says, in one sentence: stop reaching for a single noun to do the work of a sentence; when the urge to write "the wedge" or "the verdict" or "the move" hits, write the sentence out instead. The rule has been canonical since 2026-05-19. It has produced one structural success — the Briefing's `src/lib/voice/voice-document.ts` module validates every observation at synthesis time, which is what keeps Briefing patterns reading in one consistent voice across thousands of LLM-authored sentences. It has produced one persistent failure: every other operator-facing string in the system depends on human writers remembering to apply the rule, and human memory fails under deadline pressure.

This spec generalizes the Briefing's structural posture to every operator-facing string the system ships. Voice stops being a guideline. Voice becomes a property the build enforces. A pull request that ships a string failing the validator is the same shape of failure as a pull request that fails typecheck — caught at CI, blocked from merge, fixed before shipping.

The charter's §3.5 binds the design system to the commitment that every operator-facing string in every component passes the rule. This spec is the operational form of that commitment. After it lands, no future commit can ship a string that drifts from the voice without the build telling the author exactly which rule it broke and on which line.

The validator runs in two execution contexts. At build time, it validates the operator-facing strings every component ships, catching drift before the pull request reaches review. At synthesis time, it validates the strings the system itself writes — the Briefing's patterns, the heartbeat's observations, the Outdoors Events discovery surface's event-relevance reasons, any future LLM output the system synthesizes. Both contexts share the same canon. A string the LLM writes at synthesis time and a string a human writes in a button label answer to the same rules, because the rules are the voice and the voice is one voice regardless of who authored the string.

---

## Part I — What voice-as-component is

### 1.1 The shift from guideline to component

Voice today depends on three things in sequence. The author has to know the rule. The author has to remember the rule while writing under deadline. The reviewer has to catch the violations the author missed. That sequence has three steps and three failure modes, and voice drift gets through at every step. The Briefing's voice module proves a fourth path is available: replace human memory with structural validation, and the rule enforces itself.

The shift is from "writers apply a discipline" to "the system rejects strings that violate the discipline." A component that wants to ship a string declares the string. The validator examines it against the canonical rules. If the string passes, the component compiles. If the string fails, the build errors with a specific reason and a specific line. The author fixes the string or escalates. No string reaches production through a path the validator did not approve.

### 1.2 Strict everywhere

Voice validation applies to every operator-facing string the system ships. The definition of operator-facing is everything the operator could read in the running product: button labels, empty-state copy, error messages, page headers, microcopy under inputs, tooltip text, ARIA labels read by screen readers, authored prose in Briefing patterns and Founding GTM sections, system-authored observations from the heartbeat, status indicators, modal copy, confirmation language, and toast notifications. If an operator can read it inside the running product, it passes the validator.

What the validator does not cover: dev-facing strings (console messages, code comments, internal CSS class names, helper function identifiers), audit documents and pull request descriptions (canon §11 still applies to those, but as a human discipline rather than a build check), and runtime-interpolated values (account names, numbers, dates — the operator authored those, the system just renders them). The validator covers the template strings into which those values get interpolated.

The strict-everywhere posture is intentional. A validator that covers only the high-leverage prose (Briefing patterns, Founding GTM sections) leaves the surface area where voice actually drifts most easily — button labels and empty states — entirely to human memory. The places voice fails first are the small strings nobody designs, not the long ones somebody authored. Strict everywhere catches voice drift on Day 1, and the iterative tuning of the validator's rules over time is how the system continuously checks itself for drift the validator hasn't yet learned to catch.

### 1.3 The validator is the canon

The validator is not a separate document referencing canon §11. The validator is the canon, in code, executed at build time. Updating the validator is updating the voice rule. The two cannot drift apart because they are the same artifact rendered at two altitudes — the validator is the operational form, canon §11 is the prose form, and any change to one routes through founder approval before landing in both. This is the structural property the Briefing demonstrated with `validateObservation()`: the code is the discipline.

---

## Part II — The validator

The validator carries three layers of rules — what it bans, what it requires structurally, and how it handles hedging — plus a failure mode that integrates with CI. The rules apply at different granularity depending on what kind of string is being validated, which §2.1 specifies first because every rule that follows references the string class it applies to.

### 2.1 The three string classes

Operator-facing strings fall into three classes by how the operator reads them in the running product. The validator's rules apply to each class with different granularity, so the spec specifies the classes once and then references them per rule.

**Labels and chips** are short surface strings the operator reads as a unit: button labels ("Save", "Add account"), status chips ("Ready now", "Compounding"), state indicators (the canon Part III §10 state vocabulary lives here in full), navigation labels, field labels under inputs, link text, and short headings that are nouns or verb phrases rather than full sentences. Labels permit imperative verbs without explicit subjects ("Save the deal") and noun phrases that name a state ("Ready now") because that is how operators read them aloud — the implicit subject is the operator or the object being labeled. Canon §10's state vocabulary ("Ready now", "Workable", "Thin", "Operating", "Compounding", "Still weak", "Handoff-ready", "Partial", "Needs intervention", "At risk") is canonical, and the validator recognizes those strings as pre-blessed labels.

**Body prose** is the operator-facing copy that carries narrative weight inside a component but does not author the system's voice: empty-state explanations, modal copy, tooltip text, error-message bodies, microcopy under inputs, confirmation language, toast notifications, and longer headings that form full sentences. Body prose requires subject and verb in every sentence and subject continuity across sentence series. It carries the full banned-vocabulary list. The speakability heuristic applies.

**Authored prose** is the long-form narrative the system generates or composes: Briefing patterns, Founding GTM section paragraphs, observation ledger entries, Future Autopsy narratives, kit summaries, Discovery Studio segment authoring, and the synthesized prose that carries the system's read of what is happening. Authored prose carries every rule the spec defines — banned vocabulary, structural requirements, hedging discipline, loop-transformation, speakability, and pacing-shape calibration against the family's exemplars.

The three classes are declared at the call site of the validator. A component calling `validateString` passes a class parameter; helpers wrapping common patterns infer the class from the call site, so a button helper declares its strings as labels, an empty-state helper declares its strings as body prose, and the Briefing's synthesizer declares its strings as authored prose.

### 2.2 What it bans (applies to all classes)

The banned-vocabulary list inherits and extends the canon §11 examples, plus the deep-clean sweep from 2026-05-19 (branch `claude/voice-deep-clean`), plus the marketing-language gates added during the Phase 5 static public-face arc. Bans apply universally across labels, body prose, and authored prose — no class is exempt from the banned list.

Bans include single-noun shorthand patterns the product invented to feel important: "wedge," "verdict," "the move," "decision-grade," "operating truth," "command intelligence," "field read," "loom read," "ingot read," "recovery cue," "output ingot," "required correction," "operator move," "do not use," "main risk," "replacement pressure." The "verdict" ban supersedes the earlier carve-out for structured Readiness verdicts — founder direction 2026-06-04: the word is banned everywhere, no exceptions, with operator-facing strings rephrased to use the sentence-shaped state name directly ("You're at Inheritable with guardrails") rather than a container noun. Canon §4.17, §4.19, and §6 use "verdict" extensively today and are queued for the post-density-gradient sweep alongside the production code rename (the `gtmos_readiness_last_verdict` localStorage key, `verdict_label` and `verdict_history` cloud columns, the `evaluateReadiness()` return shape, the `ReadinessAnchor` and `ReadinessDrawer` strings).

Bans include marketing-deck language the visitor-face arc retired: "AI-powered," "world-class," "supercharge," "trusted by," "best-in-class," "next-generation," "revolutionary," "game-changing," "seamless," "powerful," "robust." These words are banned in operator-facing strings without exception. A legitimate technical-specification use of the same word in dev-facing strings (a code comment about "robust error handling", for example) is out of the validator's scope and unaffected — the validator only examines operator-facing surfaces per §1.2.

Bans include sycophantic copy the truth-loyalty test in charter §1.2 forbids: "Great work!," "You're doing amazing," "Way to go," "Awesome," "Crushing it," "On fire" — any phrase that rewards activity rather than truth.

Bans include manifesto-fragment patterns: sentences in series without subject continuity, aphoristic three-fragment paragraphs, decorative compound nouns of the form `<adjective>-<noun>` trying to feel like Special Industry Terms.

The banned list is maintained as `src/lib/voice/banned-vocabulary.ts`, a typed array of patterns. Adding to the list requires a pull request with founder approval — banning a word is a canon change, and canon changes route through the mind-correction protocol per charter §4.4.

### 2.3 What it requires structurally

Structural requirements apply to all three classes but with different granularity per class.

For labels and chips, the validator checks three things and nothing else. First, the banned-vocabulary check (universal — this catches completion-shaped labels like bare "Done", the sycophantic phrases banned in §2.2, and the single-noun shorthand the canon §11 rule retired). Second, a length cap: labels longer than six words are rejected because labels longer than six words are not labels but body prose the component has mislabeled. Third, a shape check that accepts any of these forms: an imperative verb ("Save", "Add account"), a canon §10 state name ("Ready now", "Compounding"), a noun-phrase field label identifying an input or property ("Account name", "ICP definition", "Email"), a count expression ("3 deals", "No deals yet"), a navigation label that names a canon room, or a token from the blessed-labels allowlist.

The blessed-labels allowlist captures common UI nouns the canon has approved for label use without per-instance re-litigation: "OK", "Yes", "No", "Cancel", "Next", "Previous", "More", "Less", "Back", "Close". The list lives in `src/lib/voice/blessed-labels.ts` and the spec lands with this initial set populated. Adding to the allowlist after the spec lands requires a pull request with founder approval — it is a canon change and routes through the mind-correction protocol per charter §4.4.

Labels do not undergo the subject-and-verb requirement, the subject-continuity check, the speakability heuristic, or the pacing-shape calibration. Those rules apply to body prose and authored prose, where voice carries narrative weight that label-length strings cannot.

For body prose and authored prose, every sentence must have a subject and a verb. Strings that are series of multiple sentences must show subject continuity across the sentences. The example canon §11 bans is "Signals are time-limited. Heat ranks them. Motion comes from the account ledger." — three subjects, no continuity. The validator rejects that shape.

The subject-continuity check ships as a Tier-2 warning rather than a hard error in the spec's first version, because reliable detection requires linguistic analysis the validator's first algorithm implements heuristically — it looks for repeated noun-phrase heads or pronoun resolution across adjacent sentences and warns when neither pattern holds. As the algorithm calibrates against real authored prose, the rule promotes to Tier-1 (hard error) once the false-positive rate drops below five percent on the existing corpus.

The speakability heuristic applies to body prose and authored prose. Labels are too short to fail it. The heuristic measures four dimensions. First, sentence length against the family's threshold (the per-family thresholds live in §3.3). Second, clause depth — strings with more than three levels of subordinate clauses fail, because nobody speaks that way. Third, word commonness, measured against a 5,000-word common-vocabulary corpus; strings where more than fifteen percent of content words fall outside the corpus get flagged. Fourth, connective density — strings with more than two semicolons or em-dashes per sentence are usually written-language rather than spoken-language. A string failing any one dimension surfaces a warning that names the specific dimension and the margin by which the string missed.

Loop-transformation rule applies to all three classes but the validator enforces it at different levels per class. For body prose and authored prose, strings that announce completion ("Done", "All done", "Complete", "Finished", "All caught up") are rejected unless paired with a forward-loop sentence in the same string. For labels, completion-shaped strings are banned outright via the banned-vocabulary list (bare "Done" as a button label is rejected) because a single-string label cannot pair itself with a forward-loop sentence within the string. Loop transformation on label surfaces is enforced at the component-render level rather than the validator level: the component contract requires that any completion-shaped event transforms the surface into the next operating state per canon Part III §3 rule 5 ("every save must visibly matter"). The validator catches the bare "Done" label as banned vocabulary; the component contract carries the loop-transformation at the render level. The Ovsiankina principle from canon §5 is what both layers enforce together — tension migrates forward and never closes, which is the behavioral substrate every component implements per charter §2.1.

### 2.4 How it hedges (applies primarily to authored prose)

Hedging rules apply primarily to authored prose, where confidence claims actually live, and selectively to body prose when a component renders a confidence-shaped statement. Labels do not carry confidence claims as a class, so the hedging rules pass over them.

Hedging rules govern how the system expresses uncertainty. Confidence claims must be paired with calibration. "The market is shifting toward X" without evidence fails; "the market may be shifting toward X — the last six pattern reads support it weakly" passes. False certainty fails the validator. False softness also fails: "Acme might be at risk" when the evidence shows it is at risk, by every dimension the system tracks, is sycophantic in the truth-loyalty sense even though it appears cautious.

The validator inherits the Briefing's existing structured-form hedging rules from `src/lib/voice/voice-document.ts` and extends them with the four behavioral properties in charter §2.1 — particularly calibrated-uncertainty-as-first-class-output. A component that surfaces a rank with no expressed confidence is rejected by the validator for failing the calibration requirement.

### 2.5 Failure mode — CI block, strictest

The validator runs in two places. First, in a new build script `npm run voice:check`, which the umbrella `npm run check` invokes alongside `typecheck` and `test`. A failed voice validation produces an error with the file path, the line number, the rejected string, and the specific rule it broke. The author sees this in their editor and in their pre-push hook.

Second, in CI as part of `.github/workflows/ci.yml`. Every pull request runs the voice check against every operator-facing string the diff touches. A failed check blocks the merge. The spec defines no override path, no warning-and-ship option, and no soft fallback — the strictest enforcement posture available, locked at founder direction during the design-system session that authored this spec.

Exception path: a string that needs to ship despite failing the validator (the rare legitimate case — e.g., a third-party API error message rendered verbatim where wrapping it would lose fidelity) requires an explicit annotation comment that names the rule waived and the reason. The annotation is logged to `deliverables/voice-waivers.log` and reviewed quarterly. A waiver is a canon decision, not a developer decision; adding one requires founder approval the same way banning a word does.

---

## Part III — Family-modulated temperature

### 3.1 One voice, seven temperatures

The Antaeus voice is one voice across the product — the peer operator with a decade of B2B sales scars speaking in plain English about what they see. That voice does not change between the Dashboard and the PoC Framework and the Trust Annex. What changes is the temperature: the pacing, the urgency, the weight of the sentences, calibrated to the job the room is doing.

A Threshold room (Welcome, Onboarding) speaks in the same voice as a Diagnosis Table room (Future Autopsy), but the Threshold voice is invitational and composed where the Diagnosis Table voice is severe and corrective. Both are the same peer operator. One is welcoming the operator in; the other is showing them a deal that is dying. The voice does not bifurcate; the temperature adjusts.

### 3.2 How the validator knows the family

Every component declares its composition family in its module export. The convention is a single export named `voiceFamily` typed as `CompositionFamily`, set at component registration. The validator reads this declaration when validating strings the component renders, and applies the temperature-modulated rules for that family.

```typescript
// src/discovery-studio/components/SegmentRail.tsx
export const voiceFamily: CompositionFamily = "live-instrument";
```

Components that do not declare a family fall back to inference from the file path — `src/discovery-studio/` infers `live-instrument` because canon Part II §4.3 names Discovery Studio in that family. The inference is a safety net, not a primary mechanism. Components should declare explicitly; declarations are checked at build time for consistency with the room's canonical family in canon Part II §4.

Shared components break the path-inference safety net. A component in `src/lib/components/`, `src/lib/ui/`, or any other cross-room location does not have a path-inferable family because the component serves multiple rooms. Shared components must declare `voiceFamily` explicitly — either one of the seven families if the component carries a consistent temperature across all the rooms that use it, or `polyglot` if it renders strings in multiple temperature contexts. A shared component with neither declaration fails the build at the first attempt to validate one of its strings.

If a component renders strings across multiple temperature contexts (a shared component used by both a Threshold room and a Diagnosis Table room), the validator accepts a `voiceFamily` of `polyglot` and applies the strictest applicable rules — the intersection of the families' constraints rather than the union. Polyglot components should be rare. The polyglot mechanism is a v1 escape hatch for shared components the spec cannot anticipate, not a default posture. Future iterations may tighten or remove the polyglot path once the migration audit produces data on whether polyglot is actually used in practice. For speakability thresholds, "strictest applicable" means the shortest cap wins — Diagnosis Table's 18-word ceiling beats Threshold's longer allowance when a component lives in both. For pacing-shape calibration, the polyglot validator surfaces a warning rather than enforcing a calibration check, because a single string cannot match two divergent exemplar shapes at once.

### 3.3 What the family declaration changes

The family declaration modulates two specific dimensions of the rule set. It does not modulate banned vocabulary, structural requirements, or the loop-transformation rule — those apply universally and the same way in every family. The voice is one voice across the seven; family modulation only operates on the dimensions where temperature actually lives.

The first modulated dimension is the speakability threshold. The four-dimension heuristic introduced in §2.3 (sentence length, clause depth, word commonness, connective density) carries different threshold values per family. A System Ledger room allows authored sentences up to 35 words because the family's exemplars run long and serif-weighted; a Command Chamber room caps sentences at 18 words because the family's exemplars are punchy and ranked; a Trust Annex room caps at 22 words with a higher bar on plain-language word frequency because the family's job is to read as obvious utility rather than as authored prose. The exact threshold values per family live in `src/lib/voice/family-thresholds.ts` and tune over time as the migration audit produces real data on what passes and what fails per family.

The second modulated dimension is pacing-shape calibration. The validator compares the candidate string's sentence-length variance, average clause depth, and connective density against the family's exemplar corpus, treating the exemplars as the calibration shape the string should approximate. A string that matches the family's pacing shape passes the calibration check; one that diverges surfaces a warning naming which dimension is off and by how much. Pacing calibration is a Tier-2 warning rather than a hard block — the family's exemplars are themselves authored and iterating, and the calibration check is most useful as a sanity prompt for the author rather than as a merge gate.

What remains constant across all seven families: the banned vocabulary list, the structural requirements (subject and verb, subject continuity in series, loop-transformation), and the hedging discipline. The voice itself is the constant; what the family declaration changes is the temperature it gets spoken at.

### 3.4 The seven temperatures with exemplars

Each exemplar below is a worked example of the voice in the family's temperature. Each family ships with at least five exemplars in `src/lib/voice/exemplars/<family>.ts`, used by the validator both as positive guidance (the IDE surfaces a contextual hint during string authoring) and as a calibration corpus (the validator compares a candidate string against the family's exemplars for shape rather than content). The single exemplar shown for each family below is illustrative — it shows the family's temperature in one example. The remaining four-plus exemplars per family are authored at implementation time and committed to the family file before the validator flips from `warn` to `enforce` for any room in that family. The exemplar corpus grows as new components ship and the family's voice gets sharper over time.

**Threshold (Welcome, Onboarding) — invitational, composed.** "You're about to define who you sell to. Every room downstream uses this definition; sharpen it now and the rest of the system gets sharper too."

**Command Chamber (Dashboard) — ranked, precise.** "The Acme deal hasn't moved in eighteen days. Sarah has been quiet since the demo. This is the one to look at first today."

**Live Instrument (Signal Console, Outbound Studio, Cold Call Studio, LinkedIn Playbook, Call Planner, Discovery Studio, Advisor Deploy, Outdoors Events) — live, tense, immediate.** "Three new signals on Acme in the last 48 hours. The hottest is a Series C announcement that landed yesterday morning. Worth a look before lunch."

**Decision Bench (ICP Studio, Territory Architect, Sourcing Workbench, PoC Framework) — deliberate, sharpened, exacting.** "Your stated ICP says VPs of Engineering. Your closed-won deals say CTOs. The pattern shows up in seven of your last nine wins. Worth deciding whether to update the definition, or whether the pattern is a one-quarter artifact."

**Diagnosis Table (Deal Workspace, Future Autopsy) — severe, investigative, corrective.** "This deal is dying. The decision-maker hasn't been in a meeting in three weeks. The last forecasted close date passed nine days ago. The forensic read says it died at the proof stage; the proof never anchored."

**System Ledger (Readiness Score, Quota Workback, Founding GTM / Handoff Kit) — earned, synthesizing, authoritative.** "You're at Inheritable-with-guardrails. A first hire could probably run this if you stayed close for two weeks. Three sections of the kit are still empty; closing two of them moves the verdict to Hire-ready."

**Trust Annex (Settings) — calm, plainspoken, trustworthy.** "Your data lives in two places — your browser and Antaeus's cloud. You can export everything as JSON whenever you want. Deleting the workspace removes both copies."

### 3.5 The Briefing's family placement — an open question

The Briefing room presents a gap the spec must acknowledge rather than silently paper over. Canon §4.21 names the Briefing as "a new composition family, closest neighbor is System Ledger" — explicitly an eighth family in the canon's room-level doctrine, even though canon Part II §4 still lists only seven families at the composition-family level. The Briefing already has a voice document (five exemplars, banned vocabulary, structural rules, hedging rules) that the heartbeat and the Recipe Layer validate against today.

The voice spec provisionally treats the Briefing's existing voice document as a System Ledger family contribution, because System Ledger is the closest neighbor the canon names. Briefing-authored strings validate against the System Ledger family thresholds and exemplars, and the Briefing's existing five exemplars seed `src/lib/voice/exemplars/system-ledger.ts` as the first members of that family's corpus.

The open question — whether the Briefing deserves a named eighth composition family with its own temperature in this spec, or whether System Ledger absorption is the right long-term answer — routes through the mind-correction protocol per charter §4.4. The spec does not have authority to add an eighth family; the canon does. Until the canon resolves the question, the provisional System Ledger treatment holds.

---

## Part IV — The component contract

### 4.1 What a component declares

A component renders operator-facing strings through one of three paths. The first path is a static literal string declared in the component's source — at the module top, inside the component body as a JSX text literal, or assigned to a const that the JSX renders. The second path is a string interpolated from props the parent component passes in. The third path is a string returned from a helper that composes runtime values into a template.

Every path passes the validator. Static literals validate at build time. Interpolated strings validate the template at build time — the literal portions between interpolation points are extracted and run through the validator. Helper-returned strings validate at the helper's call site against the template the helper carries.

The component contract is: declare `voiceFamily`, render strings through the registered string paths, and never construct a string by raw template concatenation that the validator cannot inspect. The validator catches the third pattern at lint time and rejects it before the component can ship.

### 4.2 Inheritance from src/lib/voice/voice-document.ts

The Briefing's existing voice module is canon. This spec extends it; it does not replace it. The module structure becomes:

```
src/lib/voice/
  voice-document.ts          # canonical rules (existing, extended)
  banned-vocabulary.ts       # the typed banned list
  structural-rules.ts        # subject + verb requirements, manifesto-fragment check
  hedging-rules.ts           # confidence-calibration pairings
  exemplars/
    threshold.ts
    command-chamber.ts
    live-instrument.ts
    decision-bench.ts
    diagnosis-table.ts
    system-ledger.ts
    trust-annex.ts
  validator.ts               # the validator that runs at build time
  validateObservation.ts     # the existing Briefing entry point (preserved)
  validateString.ts          # the new general entry point (this spec)
```

`validateObservation` remains the Briefing's specific entry point so the heartbeat and the Recipe Layer keep validating against the same module without code change. `validateString` is the new general-purpose entry point that every component uses. Both share the same underlying rules.

The spec's coverage spans both build-time component strings and synthesis-time LLM outputs. Component strings — labels, body prose, authored prose declared at the component's call site — validate through `validateString` at build time. LLM-authored synthesis outputs — the Briefing's patterns, the heartbeat's observations, the Outdoors Events discovery surface's event-relevance reasons, any future synthesis-time string the system writes — validate through `validateObservation` and its synthesis-time siblings. Both code paths share the underlying rules in `voice-document.ts`, so a string authored by the LLM at synthesis time and a string authored by a human in a button label answer to the same canon.

### 4.3 Voice and the density gradient

Density adjusts how much of the voice a surface ships at a time, and the voice itself stays constant across the gradient. A Threshold room serving a day-one operator and a Threshold room serving Sarah-day-90 — the fluent-operator baseline pinned in charter §4.7 — use the same voice, in the Threshold temperature, but the day-one surface uses more sentences to walk the operator through what Sarah would have understood from one sentence. The personality is the same; the pacing decompresses.

The validator does not know about the density gradient. The same validator applies to both density levels. The density-gradient spec, when it lands as the next sibling document, decides how many sentences a given surface ships at; the voice spec decides what those sentences sound like. They are orthogonal axes, deliberately, so the validator does not have to re-learn rules whenever the gradient adjusts.

---

## Part V — Migration, citations, signals

### 5.1 Migration of the 22 existing rooms

Per charter §4.3, existing rooms get a single audit pass before any redesign. Voice-as-component changes the calculus on that pass: a room's strings can be audited mechanically the moment the validator ships. The migration plan is:

1. Land the validator with a flag `voice_validator_enforce_mode` carrying two values: `warn` (the default in main — the validator runs against every operator-facing string, surfaces violations in CI logs, and produces per-room audit reports, but does not block any merge) and `enforce` (the eventual state where any violation blocks the merge). The validator runs in both modes; only the failure behavior differs. New components opt into `enforce` from day one via a per-component declaration. Existing rooms stay on `warn` until their audit clears.
2. Run the validator against every existing room's strings, surfacing a report at `deliverables/voice-audit-<room>-2026-06-XX.md` per room.
3. Triage the report: hard violations (banned vocabulary, missing subject-verb in body or authored prose, loop-transformation breaches) get queued for fix; soft violations (speakability warnings, hedging gaps, pacing-shape divergences) get reviewed family-by-family.
4. Fix the hard violations first, room by room, smallest backlog first. Each room's fix is its own pull request with its own commit message citing the audit doc.
5. Flip the flag to `enforce` for a room once its hard-violation queue clears, and flip globally once every room has cleared.

The flag's existence is intentional. Strict enforcement on day one against the existing 22 rooms would block all current development; the flag lets the new spec ship while the existing surface area is brought up to standard at the design system's pace, per the charter's commitment to not redesign rooms in a forced sprint.

### 5.2 Behavioral citations

Per charter §3.3, every component spec maps its behavioral mechanism to at least one principle from canon Part III §5 and reproduces the principle's research citation. Voice-as-component implements four principles directly.

**Cognitive Load Theory (Tier 1, Sweller 1988).** Plain prose reduces extraneous cognitive load. Single-noun shorthand and compound jargon increase it by forcing the operator to translate the system's invented vocabulary into the domain language they already speak. The validator enforces the cognitive-load discipline by rejecting strings that fail the speakability heuristic.

**Self-Determination Theory (Tier 3, Deci & Ryan 2000).** The overjustification effect warns that extrinsic rewards — points, badges, leaderboards, generic affirmations like "Great work!" — undermine intrinsic motivation. The validator bans sycophantic copy because the canon's truth-loyalty posture in charter §1.2 Test 2 requires competence-affirming feedback only, never flattery.

**Peak-End Rule (Tier 3, Kahneman 1993; 2022 meta-analysis 174 samples).** Every session has a designed peak and a designed end. The loop-transformation rules in §2.3 enforce that endings are never "all done" — they always transform into the next meaningful loop, which is what makes peak-end pairings work in the Antaeus context.

**Implementation Intentions (Tier 1, Gollwitzer 1999, d = 0.65 across 94 studies and 8,000+ participants).** If-then sentences make next moves specific and contextual. The validator's structural requirement for subject + verb, combined with the exemplars' if-then patterns, enforces implementation-intention shape on every next-action surface.

The spec is graded against charter Test 2 (truth-loyalty) directly — voice is the design discipline that makes truth-loyalty operational. It supports Test 1 (selectivity-defensible) indirectly: a system that selects without defensible voice still leaves the operator wondering why the picks are what they are, even when the picks themselves are right.

### 5.3 Signals the spec is doing its job

Four signals together tell us voice-as-component is working.

**The build catches voice drift before it ships.** A pull request that introduces a banned word, a manifesto fragment, or a sycophantic phrase is rejected at CI with a specific reason and a specific line. The author fixes it before merge. The signal is that voice waivers logged to `deliverables/voice-waivers.log` stay rare and well-reasoned, and that no operator-facing string in main has been added without passing the validator since the spec landed.

**The temperature reads through across families.** A new user opening Welcome and a fluent operator opening Future Autopsy both hear the same Antaeus voice — peer-operator, plain English, evidence-anchored — at different temperatures. Family-specific exemplars are added when new components ship, rather than rotting from the original seven. Reviewers cite specific exemplars in PR comments when calibrating a borderline string.

**The migration completes.** The 22-room audit produces a triaged queue; the queue gets worked through at a sustainable cadence; the flag flips to `enforce` per room and then globally; the system reaches a state where every operator-facing string in production passed the validator at the moment it was written. The signal is the flag being globally on in production, with the audit report at `deliverables/voice-audit-final-202X-XX-XX.md` showing zero hard violations remaining.

**Subsequent specs inherit voice-as-component cleanly.** The density-gradient spec, the component library, the today-surface spec, and every later sibling document declare `voiceFamily` and route their strings through the validator without renegotiating the rules. The signal is that no later spec proposes a parallel voice-validation mechanism, and no component spec asks for an exception from the validator's contract. The voice-as-component spec becomes the floor the rest of the design system inherits from, rather than the floor every spec tries to relitigate.

---

## Closing

This spec is the first sibling document under the design system charter. It generalizes the Briefing's structural-validation precedent to every operator-facing string the system ships. After it lands, voice stops being a guideline writers have to remember and becomes a property the build enforces — caught at CI, blocked from merge, fixed before shipping, family-modulated by temperature, one voice across the density gradient.

The next sibling document is the density-gradient spec. The validator does not depend on it, and the density-gradient spec does not depend on the validator beyond the commitment that voice stays constant across density levels. They can be developed in parallel; in practice the density-gradient spec lands after voice-as-component because the component library that both eventually serve needs voice settled first.

---

*Citations: design system charter (`00-charter-2026-06-02.md`) — §0 (scope), §1.2 (Test 2 truth-loyalty), §2.1 (calibrated-uncertainty property), §3.5 (voice rule binding), §3.6 (rubric ladder), §4.3 (existing-rooms migration), §4.4 (mind-correction protocol for canon changes). Behavioral canon `CLAUDE.md` Part III §5 (Cognitive Load Theory, Self-Determination Theory, Peak-End Rule, Implementation Intentions), §11 (voice rule), Part II §4 (composition families). Existing precedent: `src/lib/voice/voice-document.ts` (Briefing structured form), ADR-009 (workspace-scope observations + voice extraction), ADR-006 (Briefing room scope including Voice Document v0.1), the 2026-05-19 deep-clean sweep on branch `claude/voice-deep-clean`.*
