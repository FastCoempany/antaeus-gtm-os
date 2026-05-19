# Antaeus refacing-vs-shipped audit — bootstrap pass (Deal Workspace + Future Autopsy)

Date: 2026-05-01
Status: bootstrap (2 rooms of 20)
Author: Claude session, audited against the picked triptychs in
        `deliverables/prototypes/wireframes/`

---

## Why this exists

Phase 4 + Phase 5 migrated all 20 canon rooms (canon §4.1–4.20) onto
the new Preact + bright stack. Each rebuild claimed "all rooms refaced."

Refacing the way the founder defines it covers the **whole room**,
top to bottom — first-fold + every below-fold zone + every modal,
drawer, lens, sub-flow + every state (empty / sparse / active / risky /
loading / error / saved). The shape comes from the **founder-picked
triptych winner**, not a port of the legacy room's structural bones.

The session-log claim "all 17 in-scope Phase 4 rooms migrated" is true
*about migration to the new stack*. It does not assert that every
room's whole-room shape matches its picked triptych winner.

This audit closes that gap. It compares the picked triptych to the
shipped room across four axes:

1. **Mind preserved** — cross-room compounding rules + sacred-noun
   flow (canon §6) — must survive untouched
2. **Composition family** — does the shipped room read as the family
   it was assigned (canon §II §4)
3. **Picked triptych winner** — does the shipped room implement the
   founder's pick across every surface, every state
4. **Phase 7 nav doctrine** — command-first / room-rail-second /
   utilities-third, continuity params honored, no Dashboard in the
   room rail, no sidebar competing with the work

Verdicts:

- **match** — shipped room is a faithful build of the picked triptych
- **partial** — meaningful zones match, but at least one major surface
  drifted toward legacy bones or invented something off-pick
- **drift** — shipped room is closer to legacy than to the triptych
- **n/a** — no triptych in the archive (the rebuild had no winning
  reference; either the room is greenfield or its picked artifact
  lives somewhere else in the deliverables tree)

This is a bootstrap pass on 2 of 20 rooms. The format gets sanity-
checked here before the remaining ~18 are graded. The doc-only PR
that lands this audit also reconciles the canon's stale §1055
mentions of CFO Negotiation + Content Builder, drops a Negotiation
placeholder into canon §4 (rebuild owed; content from old CFO
Negotiation carried forward), and records the Phase 5 close in the
session log.

---

## Cross-cutting axes (apply to every room)

### Mind preservation

Canon §6 is the binding map. For each shipped room: do the sacred
nouns flow in/out unchanged? Have the continuity params survived?

For the 2 bootstrap rooms: **both pass.** Phase 4 PR descriptions
explicitly preserved the legacy `gtmos_*` mirror keys + the
canonical continuity params (`returnTo` / `returnLabel` /
`focusObject` / `focusRoom` / `fromMode` / `fromSurface`). Cross-
room handoff helpers ship in `lib/handoff.ts` per room. PR #43
closed every cloud-sync gap, so the mind is now cloud-canonical.

### Phase 7 nav doctrine

Acceptance memo
(`deliverables/plans/antaeus-phase-7-nav-re-architecture-acceptance-memo-2026-04-03.md`):
command first, room rail second, utilities third. Dashboard never
appears as a rail destination. Settings lives in utilities.
Continuity params carry across all room-entry links.

For the 2 bootstrap rooms: **both pass.** Each shipped room mounts
`<BackButton />` from `@/lib/back-button` (carries the params),
neither renders a competing sidebar, neither links Dashboard or
Settings as a room-rail destination. The new-stack rooms inherited
the doctrine cleanly because the rebuild stripped the legacy
`<aside class="app-sidebar">` along with the rest of the legacy
shell.

### Bright direction

Canon Part II §1 retired the dark exception 2026-04-27. Both
bootstrap rooms ship bright. **Pass on both.**

### Rubric

`deliverables/design-principle-strict-bible/05-facial-architecture-and-composition/`
defines the rubric (A1-A3 distinctiveness/emotion/beauty,
B1-B5 dominant-move/object/copy/plane/box, C1-C4 hallway/continuity/
pressure/disclosure, D1-D4 color/typography/container/surface,
E1-E3 module-brain/seriousness/methodology). Per-room rubric grades
are out of scope for this audit's text-based pass; they belong in a
founder-led visual review against rendered screenshots.

---

## Room 1: Deal Workspace (Diagnosis Table)

- **Picked artifact:** `antaeus-deal-workspace-variant-02-selected-2026-04-08.html`, sub-variant **B**
  (CSS line 626-627: `.variant-a, .variant-c { display: none; }`,
  only `.variant-b` renders)
- **Composition family:** Diagnosis Table (canon §II §4.5)
- **Shipped path:** `/deal-workspace/`
- **Source:** `src/deal-workspace/`

### Picked triptych — variant B structure (full room shape)

Top to bottom, left rail to right:

```
.spine                      (left rail: dot + rail glyph — the
                             "investigative spine" the variant uses
                             to mark the diagnosis is live)
.stage-grid (2-col,         (the operational split — left = the
   ~0.98fr / 1.02fr)         workspace, right = the target folio)
  .hero                     (h1 headline line + hero-actions)
  .signal-grid              (compact row of stat tiles — what's
                             under pressure right now)
  .target-folio
    .folio-dock (tabs       (folio-style tabbed access to specific
       incl. is-risk)        deals; risk tab is the recovery one)
    .micro-grid             (per-deal micro stats)
    .lane-grid              (per-stage lane summaries)
    .queue-row × N          (recovery rows with queue-badge)
.filter-shell               (filter state, recessive)
```

The headline line in B is *"Make the board confess where it is weak."*
The folio metaphor frames each deal as a folder pulled out and
opened — the operator works one folder at a time, not the whole
list at once.

### Shipped Deal Workspace — actual structure

```
.dw-shell
  .dw-topbar                (kicker · WAVE 1, h1 title, BackButton)
  .dw-bridge                (BridgeStats — workspace stat row)
  .dw-filter-bar            (4 filter chips: all / at-risk / stalled /
                             this-quarter)
  .dw-recovery              (RecoveryQueue — flat list of deals,
                             ranked by pressure)
  .dw-intervention          (InterventionRail — 9-field health
                             modal trigger surface)
  Modals (rendered conditionally):
    .dw-modal (DealHealthModal)
      .dw-form-section × 4  (champion/EB/use-case + pain/comp +
                             process/notes + forecast/momentum)
      .dw-stakeholders      (mini-editor)
    .dw-modal (LossReasonModal)
      .dw-loss-reasons      (list of reasons + free-text)
```

### Verdict: **partial / drift toward legacy**

What carried over from the triptych:
- ✅ Recovery-queue idea (the room exposes which deals are weakest)
- ✅ Filter chip surface (`.dw-filter-bar` ≈ `.filter-shell`)
- ✅ Bright field + the Diagnosis Table family treatment from canon Part II
- ✅ Phase 7 nav: BackButton, no sidebar, no Dashboard rail link
- ✅ Mind: deal mirror to localStorage, continuity params, snapshot
  publishing all wired

What did NOT carry from the triptych:
- ❌ **No spine left rail.** The investigative-spine glyph + rail
  that distinguishes B's first-fold is absent. Shipped room is a
  vertical stack with no left-side anchor.
- ❌ **No 2-col stage-grid.** The triptych's defining split (left =
  workspace / right = target folio) doesn't exist; shipped room
  flows top-to-bottom only.
- ❌ **No target-folio.** The folio metaphor — a single deal pulled
  out into a folder-shaped surface with tabbed access (incl. the
  risk tab) — is missing entirely. The shipped room's deal-detail
  surface is a plain modal (DealHealthModal) that overlays the
  whole room rather than docking into a folio.
- ❌ **No micro-grid + lane-grid pair.** The triptych's per-stage
  lane summaries above the queue rows are absent. The shipped
  recovery queue is a single flat list.
- ❌ **No hero zone with hero-actions.** The triptych's
  *"Make the board confess where it is weak"* h1 + hero-actions row
  is replaced by a plain topbar title.
- ❌ **Sheet rendering model mismatch.** Triptych B opens deal
  detail inline within the folio (right column). Shipped opens it
  as a full-screen modal, which competes for attention with the
  rest of the room rather than coexisting with it.

What was added that wasn't in the triptych:
- 🟡 9-field health form (champion / EB / use case / pain /
  competition / decision process / notes / forecast / momentum) —
  this is rich substance but lives in a modal, not a folio
- 🟡 LossReasonModal — substance addition, modal-shaped

### Drift summary

The shipped Deal Workspace is closer to the **legacy
`/app/deal-workspace/` operational shape** (vertical sections,
overlay modal for detail) than to the picked **variant B triptych**
(spine + stage-grid + target-folio with inline detail). The mind
is intact, the family is right, the nav is correct — but the room's
operational shape didn't make the structural jump the triptych
called for.

### Refacing punch list (Deal Workspace)

1. Introduce `.dw-spine` left rail (dot + rail glyph), full-height
2. Switch to 2-col layout: `.dw-stage-grid` with workspace left,
   target folio right
3. Build `.dw-target-folio` with `.dw-folio-dock` tabs (incl. risk
   tab); deal detail lives here, not in a modal
4. Move the 9-field health form into the folio detail surface;
   retire `DealHealthModal` (or repurpose as "expand to fullscreen"
   action only)
5. Add `.dw-hero` zone with the headline h1 + hero-actions row
6. Add `.dw-micro-grid` per-stage stat tiles + `.dw-lane-grid`
   above the recovery queue
7. Tone-tinted `queue-badge` on each row to match the variant B
   visual rhythm

This is structural rework, not CSS. ~3-4 days of focused work,
likely shipped as Phase-6 / Wave 1 of a new "refacing-completion"
arc behind a feature flag.

---

## Room 2: Future Autopsy (Diagnosis Table, protected room)

- **Picked artifact:** `antaeus-future-autopsy-variant-01-selected-2026-04-09.html`
  (titled "Variant 01 · Forensic Light Table")
- **Stage-strip refinement:** `antaeus-future-autopsy-stage-strip-selected-revision-2026-04-09.html`
  — control-strip refinement layered onto variant 01
- **Composition family:** Diagnosis Table (canon §II §4.5)
- **Shipped path:** `/future-autopsy/`
- **Source:** `src/future-autopsy/`

### Picked triptych — Variant 01 "Forensic Light Table" structure

```
.topline                    (kicker — "Future Autopsy")
.concept
  .concept-meta
    .concept-id             (the variant label)
    .concept-name (h1)      ("The deal is pinned as evidence.")
  .concept-meaning          (1-line headline: "This room behaves like
                             a lit evidence surface, not a page. The
                             user must bring one failure pattern into
                             focus before a corrective route earns
                             legitimacy.")
  .light-grid (3-col)
    .pin-note               (header card: pinned case + summary line)
    .stack-zone             (vertical stack of 3 named sheets —
                             ALL VISIBLE AT ONCE on a single deal:)
      Sheet 1: "Paper process is widening."
        .sheet-row · .row-label "Risk" · .row-copy
      Sheet 2: "Proof looks alive, ownership does not."
        .sheet-row · .row-label "Proof" · .row-copy
      Sheet 3: "Process before control."
        .sheet-row · .row-label "Motion" · .row-copy
    .route-rack (aside)     (corrective route cards — vertical stack)
      .route-card × N
```

Sheet titles are **sentence-shaped concept lines**, not categorical
labels. All three sheets render simultaneously — the room is a
**lit table**, not a tabbed deck. The reader's eye walks the stack
top to bottom; each sheet adds another layer of evidence on the
same pinned case.

### Shipped Future Autopsy — actual structure

```
.fa-shell
  .fa-topbar                (kicker, h1 title, BackButton)
  .fa-pinned (PinnedCase)
    .fa-verdict (toggle: left_alone / corrected)
    .fa-sheet (ForensicSheets)
      tab buttons: pattern · proof · symptom
      single tab body shown at a time
    .fa-docket               (countermeasure docket — task
                              checkboxes + persistence)
    .fa-kill                 (kill-switch verdict panel)
  .fa-route-rack             (action plan CTAs)
  .fa-ledger (Ledger)        (pinned-case ledger — list of past
                              autopsies + horizon tags)
```

### Verdict: **partial / sheet model is the major drift**

What carried over from the triptych:
- ✅ Forensic Light Table concept (room-as-evidence-surface)
- ✅ Pinned case as the central object
- ✅ Route rack preserved as a separate aside (`.fa-route-rack`)
- ✅ Bright field, the Diagnosis Table family treatment, mind + nav correct

What did NOT carry from the triptych:
- ❌ **Sheets render as TABS, not a STACK.** Triptych shows all 3
  sheets simultaneously on one pinned case ("a lit evidence
  surface, not a page"). Shipped uses a 3-tab rack (pattern /
  proof / symptom) where the user clicks one tab at a time. This
  is the biggest single structural drift in the room — it changes
  the room from "walk the evidence" to "click between tabs," which
  is closer to a notepad than a forensic light table.
- ❌ **Sheet labels are categorical, not concept-shaped.** Triptych
  uses sentence-shaped sheet titles ("Paper process is widening.",
  "Proof looks alive, ownership does not.", "Process before
  control."). Shipped uses bare nouns ("pattern", "proof",
  "symptom"). The triptych's labels carry the diagnosis; the
  shipped labels are categories the diagnosis fits into.
- ❌ **No `.concept-meaning` headline line.** The triptych puts a
  1-line headline ("This room behaves like a lit evidence surface…")
  directly under the h1. Shipped has only the topbar title.
- ❌ **Stage-strip refinement appears to live elsewhere.** The
  refinement file is a control-strip pattern that should sit at the
  top of the pinned case for stage navigation; the shipped room's
  topbar handles other concerns (verdict toggle, ledger access)
  but the stage-strip per the refinement is not visible.

What was added (intentional substance, not drift):
- 🟢 Verdict toggle (left_alone / corrected) — canon §4.14 calls
  this out as a primitive
- 🟢 Countermeasure docket with task checkboxes — canon §4.14
  primitive ("countermeasure docket with task checkboxes")
- 🟢 Kill-switch panel — canon §4.14 primitive
- 🟢 Ledger of pinned cases — canon §4.14 primitive ("pinned-case
  ledger · N live cases")

These were locked into the room's mind during Phase 4, not invented
ad-hoc. They expand the room beyond the triptych without contradicting
it. The drift is only on the sheet-rendering model.

### Drift summary

Future Autopsy carries the triptych's **concept** (forensic light
table, pinned case central, route rack aside) but breaks the
triptych's **operating model** by switching from stacked-sheet to
tabbed-sheet. The result reads as a tabbed evidence panel rather
than a lit evidence surface. The other added surfaces (verdict
toggle, docket, kill, ledger) are spec-driven and shouldn't be
revisited.

### Refacing punch list (Future Autopsy)

1. **Restructure ForensicSheets from tabbed → stacked.** Three
   sheets render simultaneously on a single pinned case; remove the
   tab buttons; let the eye walk top to bottom.
2. **Rewrite sheet titles as sentences.** Migrate from
   "pattern / proof / symptom" to authored sentence lines per the
   triptych's tone (the actual lines should be generated from the
   same diagnosis math the room already runs — the engine has the
   inputs).
3. **Add `.fa-headline. — a one-line concept-meaning under the h1.**
   This is the room's authored declaration of what it does. Pulls
   directly from the triptych's `.concept-meaning` paragraph or a
   shorter rewrite.
4. **Wire the stage-strip refinement.** The control-strip from the
   refinement file sits across the top of the pinned-case panel —
   navigate stage-by-stage on the same pinned deal.
5. **Keep:** verdict toggle, docket, kill panel, ledger, route
   rack, all primitives canon §4.14 calls out.

This is a smaller refactor than Deal Workspace — most of the work
is the sheet-rendering switch + sheet-title authoring engine.
~1-2 days.

---

## Format check

The audit format above (per room: picked artifact, triptych
structure, shipped structure, verdict, drift summary, punch list)
is what the remaining ~18 rooms will use. The format makes drift
tractable: a punch list per room, not a vague "needs work" tag.

If the format feels too thin or too dense, this is the moment to
adjust before the audit scales.

---

## Plan for the remaining ~18 rooms

| Room | Picked artifact source | Audit complexity |
|------|------------------------|------------------|
| Welcome | gamification + launch-folio (3 triptychs, no `-selected-`) | medium — multiple variants, founder pick may live in a per-room plan |
| Dashboard | canonical taste-test ×2 + systems-triptych ×2 + softcut-canonical | medium — multiple rounds; canonical is the picked starting point |
| Onboarding | NO TRIPTYCH (greenfield rebuild — canon line 1031) | n/a — built from rewritten mind |
| ICP Studio | triptych 2026-04-17 (no `-selected-`) | low — single triptych |
| Territory Architect | triptych 2026-04-17 | low |
| Sourcing Workbench | triptych 2026-04-17 | low |
| Signal Console | NO TRIPTYCH found | flag — protected room, missing artifact is a question |
| Outbound Studio | triptych 2026-04-18 | low |
| Cold Call Studio | radical-triptych 2026-04-19 | low |
| LinkedIn Playbook | radical-triptych + base 2026-04-19 | low |
| Call Planner | triptych 2026-04-09 | low |
| Discovery Studio | 12+ exploration files + variant-01c-selected | high — most-explored room, 5 guardian specs in `08-room-guardian-specs/` |
| PoC Framework | radical-triptych v1+v2+v3 | medium — multiple revisions |
| Advisor Deploy | radical-triptych v1+v2 | medium |
| Quota Workback | NO TRIPTYCH found | flag — System Ledger family, missing artifact |
| Settings | NO TRIPTYCH found | n/a — utility surface |
| Readiness Score | NO TRIPTYCH (Phase 5.A from rewritten mind) | n/a |
| Founding GTM | NO TRIPTYCH (Phase 5.B from rewritten mind) | n/a |

For rooms WITHOUT a `-selected-` filename, the next move is:
- check `deliverables/plans/` for a per-room implementation memo
  that names the picked variant
- if no memo exists, the picked variant is open and triptych
  exploration owes a refresh + founder pick before refacing can
  proceed

For rooms with NO triptych at all (Signal Console, Quota Workback):
- these are notable gaps. Signal Console is a protected room;
  shipping it without a triptych pass means whatever shape it
  carries is either inherited from legacy or designed in-line during
  the rebuild without exploration
- Quota Workback is also worth flagging — System Ledger family

The full punch list across all rooms is the next audit deliverable.
This bootstrap is the sanity-check on the format.

---

## What this audit does NOT do

- **Render-comparison.** The pass is text-based (HTML structure +
  TSX structure compared by class name + composition zone). A
  founder-led visual review against rendered screenshots is the
  next stage — much shorter loop with the punch list as a guide.
- **Sub-flow audit.** Modals are surfaced where they exist; tracing
  every state (empty / loading / error / saved) per surface is a
  separate pass, owed but heavier.
- **Per-room rubric grade.** Rubric scoring (A/B/C/D/E groups in
  `deliverables/design-principle-strict-bible/05-facial-architecture-and-composition/`)
  belongs in the visual review.

---

## Cross-cutting findings (from these 2 rooms)

- **Modal-overlay pattern is the most common drift signal.** Both
  rooms reach for a full-screen overlay modal where the picked
  triptych used an inline detail surface (target-folio in Deal
  Workspace, stacked sheets in Future Autopsy). The overlay pattern
  is a legacy reflex; the triptychs explicitly wanted detail and
  context to coexist. Remaining rooms likely show similar drift.
- **Sentence-shaped headline copy is missing.** Both triptychs had
  authored sentence-shaped headers (variant B's *"Make the board
  confess where it is weak."* / variant 01's *"The deal is pinned
  as evidence."*). Both shipped rooms use category-shaped topbar
  titles instead. The brand-voice register is thinner in the ship
  than in the triptych.
- **Mind + nav held strong.** No cross-room flow regressed; the
  Phase 7 nav doctrine is honored in both rooms. The audit gap
  is operational shape, not connective tissue.

---

## Doctrine reminder for the remaining audit pass

Refacing covers the **whole room**:

- first-fold composition AND every below-fold zone
- every modal, drawer, lens, sub-flow
- every state: empty / sparse / active / risky / loading / error /
  saved
- every interactive surface: form fields, list rows, action buttons
- every navigation + handoff CTA
- the room's collapse/expand behavior, density modes, response to
  scope changes

The mind (cross-room compounding) is preserved. The structure is
not. A rebuild that nailed the migration but inherited the legacy
operational shape is a partial refacing, not a complete one — the
audit grades for that explicitly.

---

## Ref

- canon `CLAUDE.md` §4 (Room Catalog), §6 (compounding rules), Part II §4 (composition families)
- `deliverables/plans/antaeus-information-architecture-reset-program-2026-03-31.md`
- `deliverables/plans/antaeus-architecture-reset-production-program-2026-04-01.md` §6 Preserved Module Map
- `deliverables/plans/antaeus-phase-7-nav-re-architecture-acceptance-memo-2026-04-03.md`
- `deliverables/design-principle-strict-bible/05-facial-architecture-and-composition/`
- `deliverables/prototypes/wireframes/` (triptych archive)
