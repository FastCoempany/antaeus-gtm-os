# Phase 33 - Call Planner / Discovery Agenda

Date: 2026-03-26

## Objective
Make Call Planner produce a credible discovery agenda that clearly improves the next call, exposes what is still thin, and hands cleanly into Discovery Studio and Deal Workspace.

## Why This Phase Exists
Call Planner already had the core ingredients:

- contact search
- persona-specific questions
- opener generation
- a why-now angle
- basic call outcome logging

But it still had three problems:

- it did not show the user what a good agenda actually is
- its gate logic was fake and hardcoded
- it did not make the downstream handoff into discovery execution and deal truth explicit

Phase 33 closes that gap by making the module behave like a real pre-call operating surface instead of a fast prompt generator.

## Changes Implemented

### 1. Added a Planner Bridge
Updated [app/discovery-agenda/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-agenda/index.html) so the module now opens with a bridge that explains:

- what the page is for
- what one-session win looks like
- what a good agenda means
- how the output should move into downstream modules

This makes Call Planner legible before the user even types a name.

### 2. Added Visible Agenda Quality
The module now computes an explicit agenda quality score and band:

- `Credible`
- `Workable`
- `Thin`

The score is based on real gate checks, not hardcoded placeholders:

- a real contact is selected
- persona is chosen
- account context is present
- a why-now angle exists
- a live deal is linked for advancement

This surfaces what is missing before the user walks into the call.

### 3. Replaced Fake Gate Persistence With Real State
Before Phase 33, the agenda save path wrote hardcoded gates like:

- `true`
- `true`
- `false`
- `false`

That was not believable.

The agenda now saves:

- real gate booleans
- gate details
- agenda score
- agenda band
- next move
- custom notes
- LinkedIn URL

That makes the saved discovery agenda more useful for downstream modules and future reloads.

### 4. Added Explicit Downstream Handoff
The agenda now renders a dedicated handoff block that makes the next step obvious:

- `Open Discovery Studio`
- `Open Linked Deal` or `Open Deal Workspace`

These actions persist the current agenda state before routing away, so the module now behaves like a handoff surface instead of a dead end.

### 5. Tightened Deal Context
If a deal is linked, the planner now surfaces that linkage in the visible context.

That matters because one of the biggest promise gaps in discovery planning is:

- can this call advance into pipeline truth
- or is it just another meeting artifact

Phase 33 makes that distinction much clearer.

## Exit Criteria Read

### Met locally
- the module now explains what good agenda quality means
- agenda gates are real instead of hardcoded
- the saved agenda carries more believable state
- the user can move directly into Discovery Studio or Deal Workspace with the agenda preserved

### Still requires live validation
- confirm the agenda-quality score feels honest against real workspaces
- confirm deal handoff via `/app/deal-workspace/?deal=...` feels natural in-browser
- confirm the planner still behaves sanely when there is:
  - no signal match
  - no linked deal
  - only custom notes

## Files Changed
- [app/discovery-agenda/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-agenda/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-33-call-planner-discovery-agenda-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-33-call-planner-discovery-agenda-2026-03-26.md)

## Status
`local-patch`
