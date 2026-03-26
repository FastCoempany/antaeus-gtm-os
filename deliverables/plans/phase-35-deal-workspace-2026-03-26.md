# Phase 35 - Deal Workspace

Date: 2026-03-26

## Objective
Make Deal Workspace feel like the unquestioned pipeline truth by exposing qualification quality, recovery pressure, and clearer deal-creation defaults directly in the board.

## Why This Phase Exists
Deal Workspace already contained a lot of the right raw fields:

- stage
- value
- next step
- close date
- champion
- economic buyer
- use case
- pain
- decision process
- stakeholders

But the module still had a product-feel gap:

- too much rigor was hidden behind chips and expanded card sections
- stale-deal recovery was implicit, not operationalized
- new deal creation still allowed weak shell records too easily
- pipeline review required too much translation from the user

Phase 35 closes that gap without changing the underlying deal schema.

## Changes Implemented

### 1. Added a Pipeline-Truth Bridge
Updated [app/deal-workspace/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html) so the module now opens with a top bridge that explains:

- what one-session pipeline review should produce
- the current review target
- weighted pipeline truth
- whether recovery pressure exists right now

This makes the page feel more like a pipeline operating room than a generic deal list.

### 2. Added Visible Recovery Queue
The module now renders a recovery panel for deals that are unhealthy because of:

- no dated next step
- overdue next step
- no movement in 14+ days
- thin qualification at later stages

This turns stale recovery into an explicit queue instead of hiding it in filters only.

### 3. Added Qualification Scoring
Every deal now gets a visible qualification score and band:

- `Strong`
- `Workable`
- `Thin`

The score is based on real pipeline ingredients:

- champion
- economic buyer
- use case
- pain
- decision process
- dated next step
- threading depth

That makes it easier to see whether the stage label is actually earned.

### 4. Added Recovery Signals to Deal Cards
Deal cards now show recovery pressure directly when something is wrong.

Examples:

- `No dated next step`
- `Next step overdue`
- `No movement in 14+ days`
- `Qualification too thin for stage`

This helps the board feel actionable before the user even opens a deal.

### 5. Tightened New Deal Defaults
For new deals, the modal now seeds more useful defaults:

- stage-aware suggested next step
- stage-aware next-step date
- stage-aware close date

The modal also makes the required shape of a good deal more explicit.

This does not replace seller judgment, but it reduces the number of weak “name-only shell” deals.

## Exit Criteria Read

### Met locally
- the board now exposes review logic more clearly
- qualification is visible on cards instead of buried
- stale-deal recovery is surfaced as a real queue
- new-deal creation has stronger defaults

### Still requires live validation
- confirm qualification scoring feels honest against real deals
- confirm recovery items are useful rather than noisy
- confirm default next-step / close-date suggestions help more than they annoy
- confirm the board now feels usable for real founder or AE pipeline review

## Files Changed
- [app/deal-workspace/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-35-deal-workspace-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-35-deal-workspace-2026-03-26.md)

## Status
`local-patch`
