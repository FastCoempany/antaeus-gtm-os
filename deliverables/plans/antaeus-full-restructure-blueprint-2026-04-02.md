# Antaeus Full Restructure Blueprint

Date: 2026-04-02

Status: canonical full-program blueprint for the architecture restructure

Purpose: define the exhaustive, phase-by-phase, subphase-by-subphase, and dependency-by-dependency production path for taking Antaeus from the approved prototype direction into the live app without architectural drift, module dilution, or broken connective tissue.

This file exists because the program already had:

- a strong research foundation
- locked architecture truth
- locked visual identity truth
- locked command-stack truth
- module-by-module phase documents

But it did **not** yet have one sufficiently explicit build blueprint tying all of those together at the washer-and-bolt level.

That is what this document is for.

---

## 0. Executive Diagnosis

### 0.1 What went wrong

The recent production drift happened for one concrete reason:

- production implementation resumed from the legacy Dashboard structure
- while the approved architecture direction was already living in versioned prototypes

That caused a mismatch:

- prototype truth said one thing
- production slice said another

Specifically:

- the approved command stack is now `Brief / Spotlight / Queue`
- but production Dashboard still carried older `Brief / Grid / Queue` assumptions
- the handoff path got ported before the command surface itself was fully ported

So the user confusion is valid.

### 0.2 What this means

The next live production work must not be driven by incremental intuition.

It must now be driven by:

1. locked prototype references
2. locked command-stack semantics
3. a strict migration order
4. explicit preservation rules
5. versioned checkpoints

### 0.3 Rebuttal to the worry that there is no plan

There **is** a solid plan foundation already. The foundation exists in:

- [antaeus-architecture-reset-production-program-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-architecture-reset-production-program-2026-04-01.md)
- [antaeus-command-stack-lock-memo-2026-04-02.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-command-stack-lock-memo-2026-04-02.md)
- [antaeus-information-architecture-reset-program-2026-03-31.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-information-architecture-reset-program-2026-03-31.md)
- [phase-25-dashboard-promise-delivery-2026-03-23.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-25-dashboard-promise-delivery-2026-03-23.md)
- [phase-35-deal-workspace-2026-03-26.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-35-deal-workspace-2026-03-26.md)
- [phase-36-future-autopsy-2026-03-26.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-36-future-autopsy-2026-03-26.md)
- [phase-46-cross-module-compounding-rules-2026-03-26.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-46-cross-module-compounding-rules-2026-03-26.md)

What was missing was not intent.

What was missing was a single blueprint that says:

- what freezes now
- what order work happens in
- what is allowed to touch production at each stage
- what each module becomes
- which connective tissue is required before the next phase can begin

This file is that missing layer.

---

## 1. Governing Truth

### 1.1 Command truth

Locked command stack:

1. `Brief`
2. `Spotlight`
3. `Queue`

`Grid` is not part of the locked command stack.

Authority:

- [antaeus-command-stack-lock-memo-2026-04-02.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-command-stack-lock-memo-2026-04-02.md)

### 1.2 Visual truth

Locked product direction:

- bright identity
- cleaner visual hierarchy
- reduced panel soup
- one dominant focus
- command-first visual posture
- no old dark-shell residue as the default front-door feel

Authority:

- [antaeus-visual-identity-lock-memo-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-visual-identity-lock-memo-2026-04-01.md)
- [antaeus-visual-system-spec-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-visual-system-spec-2026-04-01.md)

### 1.3 Architectural truth

The product architecture is:

1. Command
2. Sheet
3. Workspace
4. Graph

The modules are preserved deep rooms.
The hallway is what is being removed.

Authority:

- [antaeus-architecture-truth-memo-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-architecture-truth-memo-2026-04-01.md)

### 1.4 Approved prototype references

Approved command-surface reference:

- [antaeus-architecture-prototype-version-f-2026-04-02-0035.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-prototype-version-f-2026-04-02-0035.html)

Approved sheet-to-room refinement reference:

- [antaeus-architecture-prototype-version-g-2026-04-02-0056.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-prototype-version-g-2026-04-02-0056.html)

Version authority:

- [antaeus-architecture-prototype-version-ledger-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-prototype-version-ledger-2026-04-01.md)

---

## 2. Freeze Rules

### 2.1 Frozen now

The following are frozen until an explicit lock document changes them:

- command stack naming
- spotlight selector behavior
- queue as ordered execution mode
- visual identity direction
- object-first architecture
- graph as hidden reward, not primary navigation

### 2.2 Not allowed during migration

The following are prohibited:

- silent overwriting of approved prototype references
- introducing new command modes without versioned prototype review
- porting partial prototype semantics into production without the corresponding locked reference
- changing room depth while command/sheet/workspace bridges are still being stabilized

### 2.3 Versioning rule

Every exploratory architecture artifact must be:

- timestamped
- logged
- explicitly marked as:
  - exploratory
  - candidate
  - approved baseline
  - superseded

Production is not allowed to pull from unmarked or ambiguous prototype files.

---

## 3. Surface Map

### 3.1 Command surfaces

Production target:

- `Brief`
- `Spotlight`
- `Queue`

Current production source:

- [dashboard](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [welcome](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)

### 3.2 Inspection surface

Production target:

- dense sheet with named room handoff

Current source:

- [dashboard](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)

### 3.3 Workspace surfaces

Deep rooms currently in app:

- [signal-console](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/signal-console/index.html)
- [icp-studio](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/icp-studio/index.html)
- [territory-architect](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/territory-architect/index.html)
- [sourcing-workbench](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/sourcing-workbench/index.html)
- [outbound-studio](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/outbound-studio/index.html)
- [cold-call-studio](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/cold-call-studio/index.html)
- [linkedin-playbook](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/linkedin-playbook/index.html)
- [discovery-agenda](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-agenda/index.html)
- [discovery-studio](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-studio/index.html)
- [deal-workspace](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html)
- [future-autopsy](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/future-autopsy/index.html)
- [poc-framework](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html)
- [advisor-deploy](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/advisor-deploy/index.html)
- [quota-workback](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/quota-workback/index.html)
- [founding-gtm](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html)
- [readiness](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/readiness/index.html)
- [settings](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/settings/index.html)
- [onboarding](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/onboarding/index.html)

### 3.4 Hidden reward surface

Later target:

- graph reward layer

This remains post-core-migration work.

---

## 4. Object Model And Room Mapping

### 4.1 Locked core objects

- ICP
- account
- signal
- motion
- call
- deal
- proof
- advisor
- handoff

### 4.2 Room mapping by object family

#### ICP object

Primary rooms:

- ICP Studio
- Territory Architect

Secondary room:

- Sourcing Workbench

#### Account / signal object

Primary rooms:

- Signal Console
- Sourcing Workbench
- Outbound Studio

Secondary room:

- Territory Architect

#### Motion object

Primary rooms:

- Outbound Studio
- LinkedIn Playbook
- Cold Call Studio

#### Call / conversation object

Primary rooms:

- Call Planner
- Discovery Studio

#### Deal object

Primary rooms:

- Deal Workspace
- Future Autopsy
- PoC Framework
- Advisor Deploy

Secondary room:

- Discovery Studio

#### Proof object

Primary rooms:

- PoC Framework
- Readiness

#### Handoff object

Primary rooms:

- Founding GTM / Handoff Kit
- Readiness
- Quota Workback

---

## 5. Connective Tissue Inventory

This is the part that cannot break.

### 5.1 State objects that must stay coherent

- workspace summary
- activation context
- dashboard command snapshot
- call handoff state
- readiness snapshot
- handoff export state
- module-local records with linked ids

### 5.2 URL-level handoff state

Required for room entry:

- `returnTo`
- `returnLabel`
- `focusObject`
- `focusRoom`
- `fromMode`
- `fromSurface`

### 5.3 Shared chrome obligations

Shared shell must eventually support:

- room-entry bridge
- command-origin awareness
- back-path continuity
- object-in-focus continuity

### 5.4 Production connective-tissue rule

No room migration is considered complete unless:

1. it can be entered from command with context
2. it can be entered from sheet with context
3. it can route back to the originating command mode
4. it preserves object identity on arrival

---

## 6. Full Rollout Sequence

This is the mandatory order.

## Phase 0 - Program Freeze And Reconciliation

### 0.1 Freeze production scope

- stop broad production styling changes
- stop partial command-mode experiments in production
- freeze production to bug fixes and narrow handoff support only

### 0.2 Reconcile plan authority

- this blueprint becomes the top-level rollout file
- older program files remain authoritative inputs, not competing execution orders

### 0.3 Reconcile prototype authority

- Version F = approved command-surface reference
- Version G = approved handoff refinement reference

Acceptance:

- no active ambiguity about which prototype governs command
- no active ambiguity about which prototype governs sheet-to-room

## Phase 1 - Command Layer Production Port

Purpose:

- port the approved command surface into production cleanly
- do not rebuild deep rooms yet

### 1.1 Dashboard rewrite

Replace Dashboard command-area semantics so production matches approved command truth:

- remove `Grid` as a locked production mode
- production modes become:
  - `Brief`
  - `Spotlight`
  - `Queue`

Files:

- [dashboard](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)

### 1.2 Welcome alignment

Welcome becomes:

- activation-facing sibling of Dashboard
- not a competing control center

It must reinforce:

- first object creation
- first week motion
- return into Dashboard command stack

Files:

- [welcome](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)
- [app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)

### 1.3 Spotlight implementation

Production Spotlight must match prototype behavior:

- one object in the light
- lean selector stack
- stack rows stay compact
- click actually promotes

Subtasks:

1. shared object registry for command surface
2. selector rendering
3. promotion rendering
4. spotlight-specific inspect trigger

Acceptance:

- production command surface behavior matches Version F
- no legacy fake-grid semantics remain

## Phase 2 - Dense Sheet Lock In Production

Purpose:

- make production sheet match approved handoff behavior

### 2.1 Dense sheet content

Sheet must answer:

- why now
- explicit gaps
- evidence on the object
- what compounds next
- next room

### 2.2 Room naming

Primary CTA must be:

- `Enter <room>`

Not:

- `Go deeper`
- generic room open phrasing

### 2.3 Mode-aware return path

Sheet must preserve:

- originating command mode
- originating object

Acceptance:

- every command entry point can open a sheet
- every sheet knows which room it is sending the user into

## Phase 3 - Workspace Bridge Standardization

Purpose:

- make deep room entry feel like continuation, not a reset

### 3.1 Shared bridge for shell-band rooms

Rooms already using `gtmShellChrome` inherit:

- room-entry bridge
- back path
- command-origin labeling

### 3.2 Direct bridge for non-shell exceptions

Pages like Future Autopsy that do not use shell chrome get:

- explicit local bridge implementation

### 3.3 Back-path behavior

Back action must:

- return to the correct command mode
- preserve object focus when possible

Acceptance:

- command -> sheet -> room -> back behaves coherently in production

## Phase 4 - Deep Room Migration Wave 1

Purpose:

- migrate the highest-gravity rooms first

Wave 1 rooms:

- Dashboard
- Welcome
- Deal Workspace
- Future Autopsy
- Signal Console

### 4.1 Deal Workspace

Must become:

- the deep execution room for deal truth
- less generic board
- more object-anchored room

### 4.2 Future Autopsy

Must become:

- a sharper pressure-testing room
- clearly downstream of live deal pressure

### 4.3 Signal Console

Must become:

- the intelligence room for action-worthy signals
- not a general feed

Acceptance:

- these rooms read as preserved depth behind the command layer
- no room feels orphaned from the command path

## Phase 5 - Deep Room Migration Wave 2

Wave 2 rooms:

- ICP Studio
- Territory Architect
- Sourcing Workbench
- Outbound Studio
- LinkedIn Playbook
- Cold Call Studio
- Discovery Agenda
- Discovery Studio

Purpose:

- migrate targeting, sourcing, outbound, and call motion into the new object-first access model

Acceptance:

- all major targeting and motion rooms have room-entry continuity
- object context survives into these rooms without re-explanation

## Phase 6 - Deep Room Migration Wave 3

Wave 3 rooms:

- PoC Framework
- Advisor Deploy
- Quota Workback
- Readiness
- Founding GTM / Handoff Kit
- Settings

Purpose:

- align system-level and synthesis rooms to the new structure

Acceptance:

- proof and handoff surfaces no longer feel detached from earlier work

## Phase 7 - Nav Re-architecture

This answers the user’s correct assumption:

Yes, the left nav must change.

But not before command, sheet, and room entry are stable.

### 7.1 Nav demotion

Before full replacement:

- left nav is behaviorally demoted
- command layer is the real front door

### 7.2 Nav redesign

Later:

- replace flat hallway nav with object/family-aware shell structure
- keep utility access
- stop asking the user to choose from equal-weight rooms

Acceptance:

- nav no longer competes with command for first attention

## Phase 8 - Graph Reward

Purpose:

- add the hidden reward layer after the real operating surfaces are stable

Acceptance:

- graph remains rewarding and diagnostic
- graph is not reintroduced as daily navigation

---

## 7. Module-Level Migration Checklist

Each room must be migrated through the same subphases.

### Subphase A - Room Audit

For each module:

1. identify real object anchor
2. identify entry points from command
3. identify entry points from adjacent rooms
4. identify current context loss
5. identify preserved strategic depth that cannot be flattened

### Subphase B - Room Bridge

Add:

- room-entry bridge
- correct return path
- object title continuity
- room naming consistency

### Subphase C - Room Header Reduction

Replace:

- verbose shell/page-first header logic

With:

- short room header
- object pinned in rail or bridge
- minimal explanation in center canvas

### Subphase D - Room Interaction Tightening

For each room:

- reduce decorative panels
- reduce duplicate context blocks
- preserve high-value framework content
- preserve strategic seriousness

### Subphase E - Room QA

Verify:

- direct entry works
- sheet entry works
- back path works
- object context survives
- no deep logic was lost

---

## 8. Cross-Module Compounding Requirements

No room migration may break these compounding rules:

### 8.1 Dashboard compounding

Dashboard command rank must be influenced by:

- ICP truth
- live account / signal truth
- live deal truth
- motion proof

### 8.2 Room-to-room compounding

Examples:

- Signal Console should sharpen outbound context
- Deal Workspace should sharpen Future Autopsy
- Future Autopsy should sharpen Discovery / Call Planner / PoC
- Discovery / PoC / Advisor Deploy should strengthen Handoff Kit and Readiness

### 8.3 Handoff compounding

All meaningful work should strengthen:

- readiness
- handoff completeness
- command precision

Authority:

- [phase-46-cross-module-compounding-rules-2026-03-26.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-46-cross-module-compounding-rules-2026-03-26.md)

---

## 9. Implementation Discipline

### 9.1 Allowed production work per phase

Do not work ahead.

Meaning:

- do not redesign nav before command/sheet/workspace bridge are stable
- do not fully re-theme rooms ad hoc while command semantics are still moving
- do not pull exploratory surfaces into production before lock

### 9.2 Versioning discipline

Every significant prototype change must:

- be timestamped
- be recorded in the ledger
- be labeled
- identify whether it is safe for production pull

### 9.3 Production pull rule

Production may only pull from:

- approved reference
- approved refinement

Never from:

- exploratory artifact
- unlabeled artifact
- superseded artifact

---

## 10. Acceptance Gates

## Gate A - Command Stack Lock

Pass when:

- production Dashboard matches approved command naming and behavior
- no fake-grid semantics remain

## Gate B - Sheet Lock

Pass when:

- every sheet names its room
- every sheet carries handoff context
- no generic `Go deeper` phrasing remains for room entry

## Gate C - Workspace Bridge Lock

Pass when:

- at least Deal Workspace, Future Autopsy, and Signal Console show correct room-entry continuity
- back path returns to correct Dashboard mode

## Gate D - Wave 1 Room Lock

Pass when:

- Dashboard, Welcome, Deal Workspace, Future Autopsy, and Signal Console feel coherent as one operating path

## Gate E - Nav Demotion Lock

Pass when:

- left nav no longer feels like the app’s primary organizing logic

---

## 11. Immediate Next Working Order

This is the actual order from today:

1. stop broad production UI moves
2. use this blueprint as the top-level execution plan
3. finish a clean production port of the approved command stack into Dashboard and Welcome
4. keep the production sheet and room-entry bridge aligned to Version G
5. migrate Wave 1 deep rooms
6. only then move into broader room waves and nav replacement

---

## 12. Definition Of Done

The restructure is done only when:

- Dashboard and Welcome are truly command-first
- `Brief / Spotlight / Queue` are the real production command stack
- sheets are dense and decisive
- room entry always preserves context
- deep rooms keep their strategic depth
- cross-module compounding remains intact
- left nav no longer behaves like a hallway of equal-weight destinations
- graph remains hidden and rewarding
- no core surface feels like old-shell residue with new labels

Until those are all true, the restructure is not done.

