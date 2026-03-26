# Phase 29 - Sourcing Workbench

Date: 2026-03-25

## Objective
Turn Sourcing Workbench into a real working queue builder so sourced accounts leave the module with a visible quality standard and an obvious downstream handoff.

## Why This Phase Exists
Sourcing Workbench already had meaningful mechanics:

- query cards
- prospect capture
- research notes
- persona maps
- source intelligence

But the module still depended too much on user judgment in the wrong places:

- what makes an account good enough to keep
- what "ready" actually means
- when an account deserves a Territory slot
- how sourced accounts connect to Signal Console next

Phase 29 closes that gap by making the sourcing standard explicit and reducing the number of manual judgment calls required to move an account forward.

## Changes Implemented

### 1. Added a Sourcing Bridge Layer
Updated [app/sourcing-workbench/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/sourcing-workbench/index.html) so the module now opens with a bridge section above the workbench tabs.

That layer now explains:

- what Sourcing Workbench is for
- what object is being built
- what quality threshold matters
- what output should be used next

This makes the module feel less like a sourcing worksheet and more like an operating bridge from territory logic into live account work.

### 2. Added a Visible Sourcing Standard
The bridge and pipeline now make the sourcing threshold explicit:

- below `68` = still thin
- `68-81` = workable, but finish research first
- `82+` = ready for live account work

That standard now shows up in the module instead of living only in the user's head.

### 3. Added Prospect Quality Scoring
Each prospect now gets a derived quality read based on evidence already in the module, including:

- source quality
- thesis match
- named entry point
- chosen approach
- leverage type
- research note
- stale captured state

Pipeline cards now show:

- `0-100` quality
- a tier label
- a standard statement
- the next move that matters

This makes the queue easier to operate without guessing.

### 4. Reduced Manual Readiness Judgment
Saving research now automatically promotes a prospect to `ready` when the quality threshold is met.

That means the user no longer has to:

- research an account
- manually decide whether it counts as ready
- click one more stage button just to reflect the obvious outcome

The workbench now makes that judgment more consistently.

### 5. Tightened the Territory Push Flow
`Push to Territory` no longer asks for a raw tier prompt.

Instead, the module now:

- suggests the tier from the sourcing evidence
- explains the score and standard before push
- confirms that the next machine is Signal Console

That reduces last-step friction and keeps the handoff logic more coherent.

### 6. Connected the Workbench to Signal Console More Clearly
Once an account is pushed:

- the card now surfaces `Open Signal Console`
- the push confirmation can route directly into Signal Console
- the bridge itself makes it explicit that pushed accounts should get live temperature next

That makes the downstream flow more legible:

`Territory -> Sourcing -> Signal Console`

instead of:

`Territory -> Sourcing -> more manual interpretation`

## Exit Criteria Read

### Met locally
- the module now explains its own sourcing standard
- prospects show a visible quality threshold instead of only a stage label
- research can auto-promote accounts into `ready`
- pushing into Territory no longer depends on a raw manual tier prompt
- the Signal Console handoff is more explicit

### Still requires live validation
- confirm the quality scoring feels believable on real sourced accounts
- confirm the auto-ready threshold is not too loose or too strict
- confirm the auto-suggested Territory tier feels directionally right
- confirm the push-to-Signal handoff feels helpful instead of interruptive

## Files Changed
- [app/sourcing-workbench/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/sourcing-workbench/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)

## Status
`local-patch`
