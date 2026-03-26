# Phase 36 - Future Autopsy

Date: 2026-03-26

## Objective
Make Future Autopsy feel like a real pre-mortem control surface that tells the user when to run it, why it matters now, and what to do with the result immediately afterward.

## Why This Phase Exists
Future Autopsy already had strong methodology:

- fail-path narrative
- win-path narrative
- ranked countermeasures
- a kill-switch concept

But it still had a product-feel gap:

- the timing of use was still too implicit
- the page did not clearly show why the current deal needed an autopsy now
- the output could still feel like insight without an action lane
- value was strong if you already believed in the framework, weaker if you did not

Phase 36 closes that gap by making the module behave more like a deal-preservation operating surface than a clever thought exercise.

## Changes Implemented

### 1. Added a Timing Bridge
Updated [app/future-autopsy/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/future-autopsy/index.html) so the module now opens with a top bridge that explains:

- whether the user should run the autopsy now, this week, or as a periodic check
- why the timing is appropriate for the current deal stage
- the primary current failure pattern
- the one-session win the user should leave with

This makes the timing of use much more obvious.

### 2. Added Stage-Based Example Scenarios
The bridge now includes explicit example cases for:

- discovery
- PoC
- negotiation

The current stage is highlighted, so the user can see:

- when this module is the right move
- what kind of deal behavior should trigger an autopsy

This makes the value of the module easier to believe without requiring the user to infer it from the methodology alone.

### 3. Added Explicit Action Handoffs
Future Autopsy now computes a live action plan and routes the user into the next operating surface instead of leaving them with only a diagnosis.

Depending on stage and failure pattern, the module now points into:

- Deal Workspace
- Call Planner
- Discovery Studio
- PoC Framework

This makes the output more operational and less abstract.

### 4. Connected Countermeasures to Real Surfaces
The top proof-task list no longer defaults every task to a generic `Open Deal` action.

Each task now routes into the most appropriate next surface, for example:

- Call Planner for champion / EB / use-case forcing
- PoC Framework for proof-criteria tightening
- Discovery Studio for live risk-handling
- Deal Workspace for pipeline-truth edits

This closes more of the gap between autopsy insight and actual deal motion.

## Exit Criteria Read

### Met locally
- the module now tells the user when to run it
- stage-specific use cases are explicit
- the current deal gets a clearer timing signal and failure trigger
- output now routes into real next actions instead of dying inside the autopsy page

### Still requires live validation
- confirm the timing labels feel honest against real deals
- confirm the chosen next-module routes feel sensible in-browser
- confirm users actually understand the point of the module faster on entry
- confirm the task-level routing feels helpful rather than over-directive

## Files Changed
- [app/future-autopsy/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/future-autopsy/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-36-future-autopsy-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-36-future-autopsy-2026-03-26.md)

## Status
`local-patch`
