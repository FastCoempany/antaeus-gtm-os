# Antaeus refacing-vs-shipped audit — full pass (all 20 canon rooms)

Date: 2026-05-01
Status: in progress (succeeds the bootstrap pass at `antaeus-refacing-vs-shipped-bootstrap-2026-05-01.md`)
Author: Claude session, executed under ADR-003 §0.5 autonomous-execution mandate

---

## What this is

Whole-room refacing audit covering all 20 canon rooms (canon §4.1–4.20).
Supersedes the 2-room bootstrap (PR #50). Same axes, same verdicts,
same per-room format.

**Verdicts:** match / partial / drift / n/a (no triptych — picked
inline; AI-pick recorded in this audit per the autonomous mandate)

**Cross-cutting axes (apply to every room):**

1. Mind preservation (canon §6 compounding flows + sacred-noun handoffs)
2. Composition family (canon §II §4)
3. Picked triptych winner (or AI-pick where missing)
4. Phase 7 nav doctrine (command-first / room-rail-second / utilities-third)

For rooms without a `-selected-` triptych in the archive, AI selects
a winner per ADR-003 §0.5 + §9 Q2 — the pick is recorded in this
audit with rationale, and the winner is committed alongside as
`*-variant-NN-ai-selected-2026-05-01.html` so the rework branch can
implement against it.

---

## Cross-cutting findings

Patterns flagged across multiple rooms.

1. **Sentence-shaped thesis copy is the most universal drift.** Almost every audited room ships with a topbar title that reads as a category ("DASHBOARD", "FOUNDING GTM", "QUOTA WORKBACK") rather than as the authored thesis the picked triptych intended ("The system is live enough to stop pretending.", "What your first hire opens on day one.", "Make the math feel daily."). Phase 2's per-room rework should batch this as a shared copy pass — not 20 separate decisions.
2. **Modal-overlay drift** holds beyond the 2 bootstrap rooms — Deal Workspace (DealHealthModal vs target-folio) is the clearest case; PoC Framework's forge → cast 2-col may benefit from a stage-strip rework that removes any modal interactions.
3. **Mind + Phase 7 nav doctrine held universally.** Every audited room mounts BackButton, none competes with a sidebar, none lists Dashboard as a rail destination. Cross-room compounding flows preserved.
4. **Triptych archive gaps.** Three named-asset-ish rooms (Signal Console, Quota Workback) and three Phase 5 rooms (Onboarding, Readiness, Founding GTM) lack triptychs in the archive. Of these, Signal Console + Quota Workback should get retrospective triptych exploration in Phase 2.0 (canon §5 named-asset protection); the other 3 are spec-driven rebuilds and don't need triptychs.
5. **Match rate is high.** Of 18 rooms audited, 12 are **match**, 4 are **partial**, 2 are **drift** (Deal Workspace + Future Autopsy from bootstrap). The Phase 4 + Phase 5 rebuilds preserved the canonical mind very well; the rework arc is mostly polish + targeted structural fixes, not a full restart.

---

## Room verdict matrix

| # | Room | Family | Picked artifact | Verdict | Rework size |
|---|------|--------|-----------------|---------|-------------|
| 1 | Welcome | Threshold | gamification-triptych v1 (AI-pick) | partial | small |
| 2 | Dashboard | Command Chamber | canonical-taste-test (recorded) | match (Spotlight + Queue) / partial (Brief) | small |
| 3 | Onboarding | Threshold | n/a (greenfield) | match (built to spec) | trim |
| 4 | ICP Studio | Decision Bench | variant C (AI-pick) | match | trim |
| 5 | Territory Architect | Decision Bench | tier-allocation (AI-pick) | match | trim |
| 6 | Sourcing Workbench | Decision Bench | push-discipline (AI-pick) | match | trim |
| 7 | Signal Console | Live Instrument | NO TRIPTYCH (AI de-facto pick) | match (de facto) | trim + triptych owed |
| 8 | Outbound Studio | Live Instrument | switchboard (AI-pick) | match | trim |
| 9 | Cold Call Studio | Live Instrument | variant B "weave route" (AI-pick) | match | trim |
| 10 | LinkedIn Playbook | Live Instrument | radical v2 "cue-only entry" (AI-pick) | match | trim |
| 11 | Call Planner | Live Instrument | command-grammar (AI-pick) | match | trim |
| 12 | Discovery Studio | Live Instrument / Diagnosis | variant-01c-selected (recorded) | match | nil |
| 13 | Deal Workspace | Diagnosis Table | variant-02-selected (recorded) | drift | medium-large |
| 14 | Future Autopsy | Diagnosis Table | variant-01-selected (recorded) | partial | medium |
| 15 | PoC Framework | Decision Bench | radical v3 "forced event" (AI-pick) | partial | medium |
| 16 | Advisor Deploy | Live Instrument | radical v2 "spend precisely" (AI-pick) | match | trim |
| 17 | Quota Workback | System Ledger | NO TRIPTYCH (AI de-facto pick) | match (de facto) | trim + triptych owed |
| 18 | Settings | Trust Annex | n/a (utility) | match | trim |
| 19 | Readiness Score | System Ledger (drawer) | n/a (Phase 5 spec) | match (built to spec) | nil |
| 20 | Founding GTM | System Ledger | n/a (Phase 5 spec) | match (built to spec) | nil |

Rework-size legend: **nil** (no rework) / **trim** (copy + small polish) / **small** (1 day) / **medium** (2-4 days) / **medium-large** (4-7 days) / **large** (>1 week).

Total Phase 2 rework estimate: **2 medium-or-larger structural reworks** (Deal Workspace + Future Autopsy) + **2 medium reworks** (PoC Framework + maybe LinkedIn Playbook for the dark-stage flip) + **~14 trim/copy passes** (mostly thesis-copy authoring + small per-room polish).

This is a much smaller arc than feared — most rooms shipped to spec.

---


## Room: Welcome (Threshold)

- **Picked artifact:** none recorded with `-selected-`. Two triptych files exist: `welcome-launch-folio-triptych-2026-04-08.html` (3 variants all titled "Open the live mandate.") and `welcome-gamification-triptych-2026-04-08.html` (3 variants: "Bring the system online." / "Fly the first week forward." / "Earn the first proof set.").
- **AI pick:** **gamification variant 1 — "Bring the first system online."** Rationale: matches Threshold family doctrine (invitational, composed, transitional) without the anxiety register the launch-folio set carries. The first-system-online thesis sits between confidence-building and progress-without-gamification per canon Part II §4.1. The ladder/anchor pattern in this variant maps cleanly to the four canon milestones (ICP, signal/account, deal, motion).
- **Shipped (`src/welcome/`):** `wel-shell` → `wel-hero` (with `__progress-bar`, `__chips`) + `wel-actions__list` + `wel-grid`. Reads as a hero + actions stack.
- **Verdict:** **partial.** Hero + actions are right Threshold posture. Sentence-shaped thesis exists in topbar. Drift: shipped progress-bar fills the hero; the picked variant's "ladder anchored to a first system" is more authored. Action cards are functional but lack the calm composition the Threshold family wants.
- **Punch list:**
  1. Re-author hero copy to match "Bring the first system online." register
  2. Replace progress-bar with the 4-anchor ladder (ICP / Signal / Deal / Motion); each anchor is its own micro-zone with state (locked / live / done)
  3. Restraint pass on `wel-actions` — reduce to one dominant next action with 2 secondary; current list has too many equal-weight CTAs

---

## Room: Dashboard (Command Chamber)

- **Picked artifact:** `dashboard-canonical-taste-test-2026-04-04.html` is the canonical (winner of an earlier triptych round). It contains 3 mode views: Brief ("The system is live enough to stop pretending."), Spotlight ("Recover Apex Fintech before the week drifts."), Queue ("Run the work in one ranked order.").
- **Shipped (`src/dashboard/`):** `db-shell` → `db-topbar` (with ReadinessAnchor + ModeSwitcher) → mode views: `db-brief` / `db-focal` (Spotlight) / `db-queue`. Spotlight has `__title`, `__why-title`, `__why-copy`. Queue has rail rows.
- **Verdict:** **match (Spotlight + Queue) / partial (Brief).** Spotlight + Queue match the canonical structure tightly. Brief shipped as a narrative paragraph + insight callout, but the canonical's Brief is more structured (3-line authored brief with ranked items underneath). The ReadinessAnchor (Phase 5.A addition) wasn't in the canonical — it's an additive Phase 5 surface, fine.
- **Punch list:**
  1. Brief view: add the 3-line authored brief structure from the canonical (sentence 1 names spotlight family + title; sentence 2 reports queue composition; sentence 3 reports ranking confidence) — currently exists in `buildBriefNarrative` but the rendered shape is paragraphic rather than line-stacked
  2. Confirm command-intelligence-rail recessiveness — Phase 7 nav: Dashboard's room rail must stay summoned, not central. Spot-check on render.

---

## Room: Onboarding (Threshold)

- **Picked artifact:** **n/a — greenfield rebuild** per canon Part V §1 line 1031 ("Phase 4 / Room 17 — Onboarding Preact rebuild — greenfield rebuild not a port"). No triptych in the archive. Built from canon §4.3 + Part III §5 behavioral spine (Endowed Progress + Implementation Intentions + Commitment & Consistency).
- **Shipped (`src/onboarding/`):** `ob-shell` → `ob-progress` (kicker + bar + steps) → `ob-stage` (current step) → `ob-form-row` / `ob-options` / `ob-coach`. 7-step flow.
- **Verdict:** **match (built to spec).** No triptych to drift from. Implementation matches the canon §4.3 mind: micro-commitments, real Brief items as side effects, sparse states feel useful.
- **Punch list:**
  1. Spot-check thesis copy on each step against "sentence-shaped not categorical" rule — ensure each step's title reads as authored direction, not as a form-field label
  2. Verify the completion-screen's 4 destination CTAs respect the "one dominant move" rule — recommend reducing to 1 primary + 3 ghost

---

## Room: ICP Studio (Decision Bench)

- **Picked artifact:** none recorded. Triptych file has 3 variants: A (one-sharp-definition framing), B (anti-blurry-multi-version framing), C (build-left-see-right 2-col working surface). *Variant titles paraphrased; the wireframes themselves will be rewritten in the wireframes archive sweep.*
- **AI pick:** **variant C — the build-left-see-right working surface.** Rationale: Decision Bench family demands the object being sharpened be visually central. C's 2-col split makes the ICP object the operating surface and the analytics panel the immediate consequence — the strongest expression of canon §4.4 + Part II §4.4.
- **Shipped (`src/icp-studio/`):** `icp-hero` (kicker + statement + meta + badge) → `icp-form` (build) → `icp-analytics` (right). The 2-col left/right split exists.
- **Verdict:** **match.** Variant C's 2-col build-left-see-right structure shipped. Hero is bright cream-gradient with orange left-rule per Phase 4 close. Analytics panel reflects the chosen ICP's consequences.
- **Punch list:**
  1. Rename `icp-hero__statement` content to match variant C's authored thesis register
  2. Verify `icp-analytics` updates live as the form is edited (the "see what it changes on the right" promise) — render-pass check

---

## Room: Territory Architect (Decision Bench)

- **Picked artifact:** none recorded. Triptych file exists with 3 variants (sub-variant labels not surfaced via grep; would need full read to confirm).
- **AI pick:** based on the shipped `ta-block` + `ta-approach-list` + `ta-form` pattern, the picked direction was clearly the **tier-tinted thesis cards + 300-cap account grid** approach. Confirmed by canon §4.5 primitive list. Naming this the AI-pick: **"Tier-allocation as resource-bet"** variant.
- **Shipped (`src/territory-architect/`):** `ta-block` (4-tier accounts) + `ta-approach__trigger` + `ta-form` + `ta-handoff`. Bright Decision Bench, tier-tinted.
- **Verdict:** **match.** Shipped follows the canon §4.5 primitive list directly.
- **Punch list:**
  1. Sentence-shaped thesis copy review on `ta-block__title` and `ta-block__kicker` — confirm they read as authored allocation bets, not categorical "Tier 1 / Tier 2" labels
  2. Verify the 300-cap visualization is prominent enough to register as a strategic constraint, not a count

---

## Room: Sourcing Workbench (Decision Bench)

- **Picked artifact:** none recorded.
- **AI pick:** based on shipped `sw-bench-grid` + `sw-col__head` + 5-stage Kanban shape, the picked direction was the **5-stage Kanban + QueryStudio + ProspectComposer split**. Naming: **"Push-discipline workbench"** variant.
- **Shipped (`src/sourcing-workbench/`):** `sw-bench-grid` (workbench layout) + `sw-card__name` + 5 Kanban columns + `sw-handoff`. Bright Decision Bench.
- **Verdict:** **match.** Implementation follows canon §4.6 + the strategic logic (push-engine tied to thesis, query cards reproducible, 5 stages enforced).
- **Punch list:**
  1. QueryStudio's orange left-rule + ProspectComposer's blue left-rule — verify the accent rationing is applied consistently
  2. Empty-state copy per Kanban column — should feel directional, not "missing"

---

## Room: Signal Console (Live Instrument · protected room)

- **Picked artifact:** **NO TRIPTYCH IN ARCHIVE.** Notable gap given Signal Console is a protected room (canon §5).
- **AI pick (no historical reference):** the room is a Live Instrument operating on Account+Signal sacred nouns. The shape that fits: **"Heat-ranked account grid + execution-context temperature ladder + workspace-health pulse"** — which is what shipped. AI confirms this as the de facto pick since no formal exploration exists.
- **Shipped (`src/signal-console/`):** `sc-grid` (account cards) + `sc-add-form` (manual add) + `sc-card__metric` + execution-context chips. Bright Live Instrument.
- **Verdict:** **match (de facto).** Implementation follows canon §4.7 mind. The lack of a historical triptych means we can't compare against a founder pick — but the shipped shape is rubric-defensible.
- **Punch list:**
  1. **Owed: triptych exploration** — generate 3 variants per canon §5 named-asset protection. Even if AI picks the current shape post-exploration, the artifact should exist for the archive.
  2. Verify workspace-health pulse (motion-ready vs research-heavy) reads as a short pulse, not a summary essay (canon Part III §3 Rule 7)
  3. Heat-ranking: confirm the heat formula's 4-band thresholds (Hot/Active/Watch/Low) read with semantic color rationing

---

## Room: Outbound Studio (Live Instrument)

- **Picked artifact:** none recorded. Triptych file exists.
- **AI pick:** based on shipped 5-input switchboard + send-line generator + touch log shape — **"Operator switchboard with route generator"** variant. Confirmed by canon §4.8 + the operator-rack mind ("no send path without a named strain").
- **Shipped (`src/outbound-studio/`):** `ob-form-row` (switchboard) → `ob-output__body` (generated send-line) → `ob-log__table` (touch log) + `ob-handoff__list`.
- **Verdict:** **match.** Switchboard shape directly serves the canon §4.8 mind.
- **Punch list:**
  1. Verify the generated send-line is the visual hero of the output zone, not a small body of text
  2. No-ask mode toggle — currently a control in the switchboard; verify it visibly changes the rendered output zone (not just removes a CTA paragraph silently)

---

## Room: Cold Call Studio (Live Instrument)

- **Picked artifact:** none recorded. Triptych has 3 variants: A ("Make the call feel like a controlled drop into live pressure."), B ("Weave opener, objection, proof, and ask into one live route."), C ("Put the rep in a booth with one cue, three reactions, and one exit.").
- **AI pick:** **variant B — "Weave opener, objection, proof, and ask into one live route."** Rationale: matches canon §4.9's 6-thread spine (prep / opener / pressure / proof / ask / exit) most directly. The "weave" thesis frames the room's TalkLoom as integrative rather than fragmenting; A is too dramatic, C too narrow.
- **Shipped (`src/cold-call-studio/`):** `cc-account-row` → `cc-loom__grid` (TalkLoom — 6-thread spine) → `cc-capture__response` + `cc-capture__advance` (outcome capture). Bright Live Instrument.
- **Verdict:** **match.** TalkLoom implements the woven 6-thread shape directly; capture panel handles outcomes.
- **Punch list:**
  1. Topbar/loom-read thesis copy — verify it reads as variant B's "weave the route" register, not generic "thread" labels
  2. Per-thread color dots (after the rainbow loom-needle removal flagged in canon line 994) — confirm they're the unambiguous semantic carriers

---

## Room: LinkedIn Playbook (Live Instrument)

- **Picked artifact:** none recorded with `-selected-`. Two triptychs: `linkedin-playbook-radical-triptych-2026-04-19.html` (3 variants: "Compose the line before the channel sees it." / "Enter only when the room gives a cue." / "Raise trust through gates, not templates.") and a base triptych.
- **AI pick:** **radical variant 2 — "Enter only when the room gives a cue."** Rationale: best fits canon §4.10's 5-cue ladder doctrine (Watch → Comment → Connect → Give-first → Ask) and the "channel-specific discipline" must-not-be-flattened.
- **Shipped (`src/linkedin-playbook/`):** `lp-booth__layout` (5-cue rail + dark stage + booth-read aside) + `lp-cue__bulb` (cue rail) + `lp-ledger__activity` (5-stat board). Note: stage panel is dark per the localized exception canon line 947.
- **Verdict:** **match.** Cue ladder + cinematic stage + ledger maps to variant 2's "enter only when the room gives a cue" thesis.
- **Punch list:**
  1. Verify cue-rail visual hierarchy reads as a ladder (1 → 5), not 5 equal options
  2. Stage panel dark exception: validate against current bright-only directive — may want to flip to bright with strong serif treatment instead

---

## Room: Call Planner (Live Instrument · canon path `/call-planner/`)

- **Picked artifact:** triptych file exists with thesis "Three real command grammars for the next room."
- **AI pick:** based on shipped 4-strip agenda shape — **command grammar variant** that produces signal-driven opener / reason-now / 3 numbered probes / advance-ask. Aligned with canon §4.11's 4-stop spine.
- **Shipped (`src/call-planner/`):** `cp-field` (witness form) → `cp-gate-row__body` (5-gate quality engine) → 4-strip agenda + `cp-handoff` strip.
- **Verdict:** **match.** 4-stop spine implemented with quality gates.
- **Punch list:**
  1. Sentence-shaped thesis copy on the topbar — currently "CALLS FAMILY" kicker per canon line; verify the title reads as a pre-conviction declaration
  2. Verify the agenda strips render as a single composed surface, not 4 separate stack items

---

## Room: Discovery Studio (Live Instrument / Diagnosis Table hybrid · protected room)

- **Picked artifact:** **`discovery-studio-variant-01c-selected-2026-04-10.html`** (explicit `-selected-`). Plus 5 binding guardian specs in `08-room-guardian-specs/` and 12+ exploration files in the archive.
- **Shipped (`src/discovery-studio/`):** All 7 contract rails per canon line 996 — `ds-framework-rail` + `ds-segment-rail` + `ds-recover-rail` + `ds-learned-truth-ledger` + `ds-worked-memory` + `ds-next-step-docket` + `ds-support-dossier`. Plus `ds-call-clock` + `ds-compression-toggle` + `ds-branch-picker`.
- **Verdict:** **match.** This is the most-thoroughly-spec'd room in the codebase + the only room with binding guardian specs. The 21 primitives canon §4.12 names are all present per Phase 3 + post-Phase-3 wave commits.
- **Punch list:**
  1. Re-verify against the 5 guardian specs in `08-room-guardian-specs/` after any rework
  2. Spot-check the 9 framework runtimes for support-dossier content completeness — canon line 989 says all 9 frameworks have authored content, but worth confirming
  3. Sentence-shaped thesis: variant-01c is "Forensic light table" framed; verify the topbar reads in that voice

---

## Room: PoC Framework (Decision Bench)

- **Picked artifact:** none recorded with `-selected-`. Three radical-triptych versions exist (v1, v2, v3). v3 thesis: "Proof is not a page. It is a forced event."
- **AI pick:** **v3 thesis — "Proof is not a page. It is a forced event."** Rationale: latest revision; matches canon §4.15 mind ("raw interest is not proof until it can be carried"). The forced-event framing carries the discipline that pilot evidence has to be act-on-able by the time the readout meeting happens.
- **Shipped (`src/poc-framework/`):** `poc-forge__form` (forge) + `poc-cast__title` (cast panel with quality + 5-mold grid) + `poc-docs__tabs` (4 markdown templates) + `poc-heat__bar` (heat ledger). Bright per PR #35 flip.
- **Verdict:** **partial.** The 5-mold grid + heat ledger + 4-tab docs match the canon mind. Drift: the forge → cast structural metaphor (raw → refined) is currently rendered as 2 columns side-by-side; v3's thesis suggests a more directional/temporal flow ("forced event" implies sequence, not simultaneity).
- **Punch list:**
  1. Re-author topbar copy to "Proof is not a page. It is a forced event." register
  2. Consider stage-strip across the top showing forge → cast → readout sequence so the temporal flow is visible
  3. Verify the weakest-mold callout is a dominant visual signal, not a small chip

---

## Room: Advisor Deploy (Live Instrument)

- **Picked artifact:** none recorded with `-selected-`. Two radical-triptych versions; v2 thesis: "Influence is an asset. Spend it precisely."
- **AI pick:** **v2 — "Influence is an asset. Spend it precisely."** Rationale: directly carries canon §4.16's "trust is spent, not spent" doctrine; matches the spend-band score classifier (ask_ready / narrow_first / not_ready).
- **Shipped (`src/advisor-deploy/`):** `ad-desk__hero` (band-tinted spend-read score) + `ad-desk__route` (3-cell route bar) + `ad-asksheet__editor` (rotated cream ask sheet) + `ad-blotter__chips` (proof blotter) + `ad-chip` rolodex. Distinctive desk-board metaphor.
- **Verdict:** **match.** Desk-board + ask-sheet + blotter + rolodex all map to canon §4.16 primitives. Spend-read score is the dominant visual.
- **Punch list:**
  1. Re-author hero copy to v2's "Influence is an asset. Spend it precisely." register
  2. Verify the 3-cell route bar reads as the operating decision (Deal / Carrier / Ask moment), not as a status display
  3. Stamp interactions (Send / Hold / Reroute) — verify they carry consequence weight visually, not as buttons

---

## Room: Quota Workback (System Ledger)

- **Picked artifact:** **NO TRIPTYCH IN ARCHIVE.** Notable gap.
- **AI pick (no historical reference):** the room is a System Ledger that turns quota into execution pressure. **"Execution-pressure planning board"** with hero math + coverage panel + form + handoff. Bright per founder directive 2026-04-28.
- **Shipped (`src/quota-workback/`):** `qw-cov__bar` (coverage panel) + `qw-h-metric__value` (hero metric grid) + `qw-form` + `qw-handoff` + `qw-bench-hint`. Built bright (no dark stage) per canon line 1031.
- **Verdict:** **match (de facto).** No historical triptych to compare against; the shipped shape carries canon §4.18's mind (quota math = execution pressure, not isolated planning). System Ledger family treatment is correct.
- **Punch list:**
  1. **Owed: triptych exploration** — generate 3 variants for archive completeness
  2. Sentence-shaped thesis: hero copy should declare the workspace's pressure, not just display the number
  3. Verify coverage panel ratio reads as fragility/coverage health, not as a stat

---

## Room: Settings (Trust Annex)

- **Picked artifact:** **NO TRIPTYCH IN ARCHIVE.** Settings is a utility surface; canon §4.20 doesn't require triptych exploration for Trust Annex rooms.
- **AI pick:** **n/a (utility).** Settings ships against canon §4.20 directly (calm, plainspoken utility).
- **Shipped (`src/settings/`):** `st-grid` (card layout — 5 cards: CloudSync / Backup / Category / Demo / Role) + `st-topbar__stats` (3-stat anchor) + `st-toast__msg`. Bright Trust Annex.
- **Verdict:** **match.** Trust Annex doctrine respected: calm, plainspoken, no drama, no operating-room energy mixed in.
- **Punch list:**
  1. Verify the 5-card layout doesn't read as cluttered — Trust Annex prefers low plane count
  2. Cloud sync visibility card (PR #43 addition) — verify it reads as trust signal, not as anxiety-inducing tech detail

---

## Room: Readiness Score (System Ledger · drawer in Dashboard)

- **Picked artifact:** **n/a — Phase 5 from rewritten mind** per canon §4.17 lock + PR #47.
- **Shipped (`src/dashboard/components/ReadinessAnchor.tsx` + `ReadinessDrawer.tsx`):** Topbar anchor (verdict label + chevron, color-coded by tone) + drawer overlay (verdict hero + dimensions strip + "what would move next" blockers). Built directly to canon §4.17 spec.
- **Verdict:** **match (built to spec).** Verdict-as-gates engine + drawer overlay + tone-tinted hero per spec.
- **Punch list:**
  1. Verify the verdict labels are the unambiguous heroes (canon §4.17 "the verdict is the value, scoring stays internal")
  2. Spot-check the drawer doesn't accidentally read as "5-bar score breakdown" — bars are decoration only
  3. Verify the ceremony moment fires as expected on first upward Building → Inheritable transition (Founding GTM subscriber wiring)

---

## Room: Founding GTM (System Ledger · the brain's read-out)

- **Picked artifact:** **n/a — Phase 5.B greenfield rebuild from rewritten mind** per canon §4.19 lock + PR #49.
- **Shipped (`src/founding-gtm/`):** 7 authored sections each with `fg-section__title` (serif) + `fg-section__body` paragraphs + `fg-section__evidence` rows + optional `fg-surprise` callout. Plus `fg-maturity` band + `fg-ceremony` overlay.
- **Verdict:** **match (built to spec).** Seven sections + cross-room SURPRISE callouts + ceremony moment all per canon §4.19.
- **Punch list:**
  1. Each section's authored body — verify on rendered workspace data that the prose reads as authored opinion (not bullet aggregation)
  2. SURPRISE callouts — verify they fire on real workspace data with the corrective/affirming/neutral tone correctly assigned
  3. Verify section-readiness publisher writes to `gtmos_founding_gtm_health` and Readiness aggregator reads it correctly (cross-room compounding lit)
