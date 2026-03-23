# Phase 25 - Dashboard Promise Delivery

Date: 2026-03-23

## Objective
Make the dashboard the obvious home page after activation, even when the workspace is still sparse.

## Why This Phase Exists
The dashboard promise was stronger than the actual sparse-workspace experience. It could feel useful once the workspace had enough inputs, but it did not explain its own source logic well enough and it did not help the user understand when the page would become more valuable.

Phase 25 closes that gap by making the dashboard more explicit about:

- what data is feeding the command view
- what maturity stage the workspace is currently in
- what the user should do next to make the dashboard more believable
- how the shell should behave during week-one activation

## Changes Implemented

### 1. Dashboard Source Logic
Updated [app/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html) so the dashboard now renders a source-logic layer near the top of the page.

That layer now explains:

- whether ICP data exists
- whether signals exist
- whether deals exist
- whether motion exists
- which maturity stage the workspace is in
- what "this dashboard becomes useful when..." means in concrete terms

### 2. Maturity-Stage Empty States
The old dashboard empty state was too generic. The dashboard now computes maturity stages and adapts the empty-state message and next-step guidance for:

- setup
- targeting
- market
- operating

Each stage now has:

- a clearer title
- clearer guidance copy
- stage-specific next actions

### 3. Better Sparse-Workspace Guidance
The dashboard no longer assumes a mature workspace. It now explains what the user is missing instead of only telling them that the dashboard is empty.

This makes the dashboard more useful earlier, when the user has:

- no ICP yet
- no signals yet
- no deals yet
- no active motion yet

### 4. Week-One Nudge Deduplication
Updated [js/week-one-lifecycle.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/week-one-lifecycle.js) so the `Week 1` dashboard return nudge cannot duplicate in the sidebar when the async lifecycle path fires more than once.

### 5. Dashboard Boot Degrades More Honestly
The dashboard boot path now tolerates partial upstream failure better. If one synced dependency is unhealthy, the dashboard is allowed to fall back to the best available view instead of collapsing into a full fatal boot state.

This keeps the page closer to its promise as the command center for the workspace, even when one source is unhealthy.

## Exit Criteria Read

### Met locally
- dashboard now explains where its summary comes from
- sparse workspaces get stage-specific guidance
- the user gets clearer "what to do next" logic
- the duplicate `Week 1` sidebar nudge is guarded
- dashboard promise is closer to "morning operating room" behavior than generic empty state behavior

### Still requires live validation
- confirm the source-logic layer feels helpful rather than verbose
- confirm the stage logic maps cleanly to real sparse and mature workspaces
- confirm the week-one nudge no longer duplicates in live browser use
- confirm the dashboard remains the obvious home page after more real work accumulates

## Files Changed
- [app/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [js/week-one-lifecycle.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/week-one-lifecycle.js)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)

## Status
`local-patch`
