# Antaeus Phase 7 Copy Burden Inventory

Date: 2026-04-03  
Status: required output for Phase 7 preflight step `7A.3`  
Parent docs:
- [antaeus-phase-7-preflight-behavioral-copy-burden-audit-and-disclosure-matrix-2026-04-02.md](./antaeus-phase-7-preflight-behavioral-copy-burden-audit-and-disclosure-matrix-2026-04-02.md)
- [antaeus-phase-7-nav-re-architecture-implementation-spec-2026-04-03.md](./antaeus-phase-7-nav-re-architecture-implementation-spec-2026-04-03.md)

## 1. Purpose

This inventory classifies the current copy burden across the surfaces most likely to be affected by Phase 7 shell/nav re-architecture.

Each copy block is assigned one of:
- `keep`
- `compress`
- `move to sheet`
- `move deeper into room`
- `move to methodology/help`
- `gate`
- `remove`

Important rule:
- these decisions are disclosure decisions, not substance decisions
- if strategically important meaning is moved, the destination layer must be named

## 2. Command Surfaces

## 2.1 Welcome

| Surface zone | Current burden | Decision | Why |
|---|---|---|---|
| `Welcome` page title and short subtitle | low | keep | Necessary orientation for first-session re-entry. |
| activation corridor summary | medium | compress | Useful, but should stay concise and not behave like a second hero. |
| primary card thesis and CTA explanation | medium | keep | This is the main “what now” driver on Welcome. |
| operating lanes intro copy | medium | compress | Good structure, but should stay one layer above execution, not become a mini-methodology lecture. |
| lane copy on immediate move / follow-through / keep honest | medium | keep | This is command-grade guidance. |
| queue card body copy | medium-high | compress | Some queue cards repeat rationale that can be shorter. |
| shell rail copy about when to use Welcome again | medium | compress | Good mental-model reinforcement, but likely one sentence too long. |
| `Week 1` lifecycle copy | medium | keep | High-value temporal framing tied to endowed progress. |
| methodology hub resource description | medium | move to methodology/help | The description belongs on the destination surface, not in a prominent Welcome block. |
| demo lane resource description | medium | gate | Useful, but not core to the command-first shell; can sit behind a lighter utility affordance. |
| settings/backup resource description | medium | compress | Utility trust text should stay visible but shorter. |
| error-state “Go straight to Spotlight” copy | low | keep | Behavioral recovery copy is correct and minimal. |

## 2.2 Dashboard Command Shell

| Surface zone | Current burden | Decision | Why |
|---|---|---|---|
| `Dashboard` title and subtitle | low | keep | Core command orientation. |
| command stack intro thesis (`The dashboard is now reading a real operating system.`) | medium | compress | Useful, but likely one sentence too long once Phase 7 shell is stronger. |
| mode explanations for `Brief / Spotlight / Queue` | medium | keep | These are command-mode definitions, not fluff. They should remain but stay concise. |
| `What changed since ...` block in Brief | medium | keep | Correct command-layer delta logic. |
| `Spotlight` explainer (`Put one object in the light`) | medium | keep | This is core to the command mental model. |
| `Queue` explainer (`Run the work in one ranked order`) | medium | keep | This is core to the command mental model. |
| `Why this object is in the light` / `Why this order` explanation zones | medium | keep | Explainable command surfaces are part of the new intelligence layer. |
| `Current posture` right-rail copy | medium-high | compress | Useful, but some lines restate nearby state and can be tighter. |
| `Trust + recovery` copy | medium | keep | Important trust signal. Keep concise. |
| `Week 1 / Next move` right-rail copy | medium | compress | Good re-entry copy, but should stay short enough not to compete with command. |
| graph reward trigger (`Hidden reward / See what compounded`) | low | keep | Correct tertiary affordance. |
| graph reward overlay copy | medium | keep | This is a reward/diagnostic layer, not shell clutter. |
| fallback/retry error-state copy | medium | keep | Behavioral recovery copy is necessary and currently aligned. |

## 2.3 Onboarding

| Surface zone | Current burden | Decision | Why |
|---|---|---|---|
| onboarding title and setup framing | medium | keep | Necessary for setup seriousness. |
| field helper copy | medium | compress | Keep only copy that reduces ambiguity; remove generic filler. |
| `Open Week One` / `Open Spotlight` links | low | keep | Critical re-entry affordances. |
| backup restore wording | low-medium | keep | Trust and resilience are necessary here. |
| any success/fallback copy that routes to Spotlight | low | keep | Aligns onboarding with command-first model. |

## 3. Sheet Layer

| Surface zone | Current burden | Decision | Why |
|---|---|---|---|
| sheet kicker / family label | low | keep | Helps orient the inspection layer. |
| why-now summary | medium | keep | This is the core reason the sheet exists. |
| evidence / gap rows | medium | keep | This is decision-support, not surplus. |
| next-room strip | low | keep | Mandatory continuity cue. |
| footer copy (`The sheet is the inspection layer...`) | medium | compress | The concept is right, but repeated users should not keep reading a paragraph. |
| duplicate room rationale if already obvious above | medium | remove | If the room reason already exists in the strip and CTA, duplication should be cut. |

## 4. Room Entry Bridge + Pinned Context

| Surface zone | Current burden | Decision | Why |
|---|---|---|---|
| `Room entry` bridge label and return copy | low | keep | Core continuity structure. |
| bridge copy about re-entering through Spotlight / Week One | medium | keep | This is one of the most important shell-behavior corrections. |
| pinned object label and object name | low | keep | Essential continuity. |
| `Why this room` explanation | medium | keep | This is the behavioral handoff explanation, not excess prose. |
| family pill (`In Pipeline`, `In Intelligence`, etc.) | low | keep | High-value orientation in low burden form. |

## 5. Room Rail + Utility Shell

## 5.1 Room Rail

| Surface zone | Current burden | Decision | Why |
|---|---|---|---|
| `Command stack` primer title | low | keep | Required shell hierarchy signal. |
| primer copy (`Start in Spotlight...`) | low-medium | keep | Necessary behavioral framing; can remain short. |
| `Room rail` label | low | keep | Good secondary-access naming. |
| family section labels | medium | compress | Good grouping, but can likely be even tighter as shell gets smarter. |
| room link labels | low | keep | Reachability must remain intact. |
| room status dots / meta noise | medium | remove where redundant | Visual burden should carry only true state, not generic chrome. |

## 5.2 Utility / Footer

| Surface zone | Current burden | Decision | Why |
|---|---|---|---|
| synced workspace strip | medium | compress | Trust text should stay, but not dominate the rail. |
| `Tour the App` | medium | gate | Useful, but not primary once command-first structure is established. |
| `Back to Welcome Guide` | low-medium | keep | Correct secondary recovery path. |
| backup/export utility copy | medium | compress | Trust-critical, but should live as utility copy, not shell prose. |

## 6. Room First-Fold Inventory by Family

## 6.1 Intelligence Family

Surfaces:
- `Signal Console`
- `ICP Studio`
- `Territory Architect`
- `Sourcing Workbench`

Decision:
- keep room title, subtitle, bridge, pinned context, and one composed setup zone
- compress methodology and explanatory framing at the first fold
- move longer strategic explanation deeper into the room

Specific burden risks:
- legends and recommendation explanation in `Signal Console`
- wedge/thesis explanation in `ICP Studio` and `Territory Architect`
- push/research utility explanation in `Sourcing Workbench`

## 6.2 Motion Family

Surfaces:
- `Outbound Studio`
- `Cold Call Studio`
- `LinkedIn Playbook`

Decision:
- keep channel purpose and next move visible
- compress anti-spam / craft explanation at first fold
- gate reusable methodology and examples where possible

Specific burden risks:
- too much instructional tone before work begins
- repeated channel rationale visible every visit

## 6.3 Calls / Discovery Family

Surfaces:
- `Call Planner`
- `Discovery Studio`

Decision:
- keep call/deal continuity and next move
- move framework explanation deeper
- compress first-fold teaching copy

Specific burden risks:
- planner/search setup copy becoming too explanatory
- framework language visible before action starts

## 6.4 Pipeline Family

Surfaces:
- `Deal Workspace`
- `Future Autopsy`
- `PoC Framework`
- `Advisor Deploy`

Decision:
- keep severity and pressure visible
- keep room-entry and pinned context strong
- compress explanatory top matter that repeats the room thesis
- move doctrine deeper

Specific burden risks:
- `Future Autopsy` losing severity if over-compressed
- `Deal Workspace` carrying too many explanatory side summaries
- `PoC Framework` over-explaining proof logic before the builder
- `Advisor Deploy` sounding like advice instead of deployment consequence

## 6.5 System / Synthesis Family

Surfaces:
- `Quota Workback`
- `Readiness`
- `Founding GTM / Handoff Kit`
- `Settings`

Decision:
- keep trust, synthesis, and operating consequence visible
- compress board/score/utility explanation
- move doctrine deeper where it becomes reference material instead of shell prose

Specific burden risks:
- quota math explanation becoming too visible too early
- readiness score-story reading decorative instead of consequential
- settings trust copy competing with command copy

## 7. High-Priority Phase 7 Copy Cuts and Moves

These are the first likely shell/disclosure changes once Phase 7 begins:

1. compress Dashboard `Current posture` and `Week 1 / Next move` supporting copy
2. compress Welcome shell-rail explanation and resource-card descriptions
3. compress sheet footer explanation
4. compress room-rail meta noise and section verbosity
5. move non-critical methodology/resource descriptions out of primary shell surfaces
6. compress room first-fold explanatory paragraphs across families without touching strategic core

## 8. Protected Copy Categories

The following categories are not eligible for casual trimming:

- command-mode definitions
- why-now explanation inside the sheet
- room-entry bridge continuity text
- pinned-context rationale
- trust/recovery copy tied to backup/export/error recovery
- strategic severity language in `Future Autopsy`
- signal seriousness language in `Signal Console`
- pressure/compounding language tied to cross-module truth

## 9. Phase 7 Copy-Burden Gate

Phase 7 may proceed only if:

- each shell-level text block has a disclosure decision
- high-value strategic meaning is being moved intentionally, not deleted reactively
- room seriousness survives every proposed compression
- command surfaces keep only decision-driving copy
- no proposed cut is justified only by “it’s too much text”

If those conditions fail, the Phase 7 shell work is not ready.
