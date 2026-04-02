# Antaeus Command Stack Lock Memo

Date: 2026-04-02

## Purpose

Lock the command-layer model before any further production migration.

This memo exists to stop drift between:
- exploratory prototype work
- approved command-surface behavior
- future Dashboard and Welcome implementation

## Approved Command Stack

The command stack is now:

1. `Brief`
2. `Spotlight`
3. `Queue`

`Grid` is not part of the locked command stack.

## Meaning Of Each Mode

### `Brief`

- role: reasoning
- job: explain why the pressure matters
- visual truth: narrative density
- user posture: orient, read, understand, decide

### `Spotlight`

- role: focused command surface
- job: render one object into the light while a lean selector stack chooses what gets promoted
- visual truth: one dominant object, one supporting selector rail
- user posture: focus, inspect, choose the right object to advance

### `Queue`

- role: ordered execution
- job: run the work in sequence without mode confusion
- visual truth: ranked lane plus selected detail
- user posture: execute, clear, move

## Rejected Alternatives

### `Grid`

Rejected as a locked command mode for now.

Reason:
- earlier versions made `Grid` either too flat to be distinct from `Brief`
- or too featured, which implied promotable behavior it did not actually support

### Fake Featured Grid

Rejected.

Reason:
- layout implied "click this to replace the hero tile"
- interaction did not support that implication
- layout must not suggest behavior the product does not actually do

### Promotable Stack As `Grid`

Rejected.

Reason:
- if it says `Grid`, it must behave like a grid
- the promotable spotlight pattern is a different surface and must be named honestly

## Locked Principles

1. One urgency engine drives all command modes.
2. Each mode must feel materially distinct.
3. `Spotlight` is allowed to be dramatic because it is honest about promotion behavior.
4. `Queue` must feel severe and operational, not decorative.
5. `Brief` must remain the narrative mode.
6. The selector stack in `Spotlight` must stay lean and subordinate to the spotlight object.
7. The dense sheet remains the inspection layer after command.
8. The workspace remains the deep-room layer after sheet.

## Approved Reference

Approved command-surface reference:

- [antaeus-architecture-prototype-version-f-2026-04-02-0035.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/prototypes/architecture/antaeus-architecture-prototype-version-f-2026-04-02-0035.html)

This file is now the command-layer reference for:
- naming
- mode behavior
- spotlight-selector hierarchy
- queue severity direction

## What Happens Next

Next prototype work may only target:

1. sheet refinement
2. workspace bridge refinement

No further command-mode renaming or structural experimentation should happen until those two passes are reviewed.

## Production Consequence

Dashboard and Welcome must not reintroduce:
- fake grid semantics
- mode blur
- legacy page-first command behavior

When production migration resumes, it must inherit:
- `Brief`
- `Spotlight`
- `Queue`

from the approved reference above.
