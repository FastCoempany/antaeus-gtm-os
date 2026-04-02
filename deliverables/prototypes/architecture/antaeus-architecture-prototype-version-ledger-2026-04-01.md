# Antaeus Architecture Prototype Version Ledger

Date: 2026-04-01

Purpose: preserve prototype lineage so visual and structural decisions stop drifting through overwritten files.

---

## Version A

File:
- [antaeus-architecture-reset-prototype-baseline-approved-2026-04-01-2200.jsx](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-reset-prototype-baseline-approved-2026-04-01-2200.jsx)
- [antaeus-architecture-reset-prototype-baseline-approved-preview-2026-04-01-2200.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-reset-prototype-baseline-approved-preview-2026-04-01-2200.html)

Status:
- superseded approved baseline for visual direction
- not final architecture truth
- the point in the conversation where the user said the work was "getting somewhere"

Interpretation:
- this is the visual/compositional reference to preserve
- future command-layer prototypes must inherit this direction rather than replacing it casually

---

## Version B

File:
- [antaeus-command-layer-ground-truth-exploratory-2026-04-01-2248.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-command-layer-ground-truth-exploratory-2026-04-01-2248.html)

Status:
- exploratory proof artifact
- built to prove `Brief / Grid / Queue` mode semantics in isolation
- not approved as visual successor to Version A

Interpretation:
- useful for testing rigor around mode separation
- not allowed to silently become the new visual baseline

---

## Rule Going Forward

From this point on:

- no prototype overwrite should be treated as the new baseline by default
- every meaningful prototype iteration gets a timestamped artifact
- every artifact must be labeled:
  - `approved baseline`
  - `exploratory`
  - `candidate`
  - `superseded`

If a new artifact improves semantics but drifts visually from the current approved baseline, it must be treated as exploratory until explicitly promoted.

---

## Version C

File:
- [antaeus-architecture-reset-prototype-candidate-2026-04-01-2315.jsx](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-reset-prototype-candidate-2026-04-01-2315.jsx)
- [antaeus-architecture-reset-prototype-candidate-preview-2026-04-01-2315.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-reset-prototype-candidate-preview-2026-04-01-2315.html)

Status:
- approved baseline
- active working baseline
- promoted after user confirmed "the candidate is good"

Interpretation:
- this branch deliberately restores the approved Version A visual lineage
- it is now the reference branch that future candidates must inherit

---

## Version D

File:
- [antaeus-architecture-reset-prototype-candidate-2026-04-01-2335.jsx](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-reset-prototype-candidate-2026-04-01-2335.jsx)
- [antaeus-architecture-reset-prototype-candidate-preview-2026-04-01-2335.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-reset-prototype-candidate-preview-2026-04-01-2335.html)

Status:
- candidate
- branched from active baseline Version C
- refinement in progress
- focused on stronger mode separation without visual drift

Interpretation:
- this branch inherits the approved visual language by default
- Grid is being made more spatial here
- Queue is being made more explicitly sequential here
- any further rigor work should happen here first, before production Dashboard changes

---

## Version E

File:
- [antaeus-architecture-reset-prototype-candidate-2026-04-01-2355.jsx](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-reset-prototype-candidate-2026-04-01-2355.jsx)
- [antaeus-architecture-reset-prototype-candidate-preview-2026-04-01-2355.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-reset-prototype-candidate-preview-2026-04-01-2355.html)

Status:
- candidate
- branched from Version D
- corrects Grid back to an honest peer scan surface

Interpretation:
- if it says `Grid`, it should behave like a grid
- no featured slot that implies promotable behavior
- Queue remains the ordered mode

---

## Version F

File:
- [antaeus-architecture-prototype-version-f-2026-04-02-0035.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-prototype-version-f-2026-04-02-0035.html)

Status:
- approved command-surface reference
- standalone browser-loadable prototype
- absorbs the P2 spotlight-plus-selector style into a real command surface

Interpretation:
- tests `Brief`, `Spotlight`, and `Queue` as the command stack
- keeps `Sheet`, `Workspace`, and `Graph`
- intentionally does not pretend `Spotlight` is `Grid`
- this is now the locked command-surface reference for future sheet/workspace refinement

---

## Version G

File:
- [antaeus-architecture-prototype-version-g-2026-04-02-0056.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-prototype-version-g-2026-04-02-0056.html)

Status:
- candidate
- branched from approved Version F
- refinement pass limited to sheet and workspace bridge only

Interpretation:
- command stack remains frozen as `Brief / Spotlight / Queue`
- this branch only improves:
  - dense sheet clarity
  - transition from sheet into deep room
  - workspace entry continuity

---

## Exploratory Surface P1

File:
- [antaeus-promotable-stack-exploratory-2026-04-01-2359.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-promotable-stack-exploratory-2026-04-01-2359.html)

Status:
- exploratory
- side experiment only
- superseded by P2
- not part of the current baseline lineage

Interpretation:
- this is the user's "rendered into the light" idea run honestly
- it is a promotable spotlight + stack surface
- it must not be confused with `Grid`

---

## Exploratory Surface P2

File:
- [antaeus-promotable-stack-exploratory-p2-2026-04-02-0010.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-promotable-stack-exploratory-p2-2026-04-02-0010.html)

Status:
- exploratory
- active exploratory direction
- side experiment refinement
- leaner stack treatment

Interpretation:
- removes the stack description preview
- shrinks stack rows and typography
- pushes the right column closer to a selector rail than a mini-card column
- use this as the current stylistic reference for spotlight-plus-selector command explorations
