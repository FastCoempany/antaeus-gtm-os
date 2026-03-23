# Phase 24 - First 7 Days User Lifecycle

## Objective
Define the first week after signup.

## Why This Phase Exists
Welcome and tour now make the first session more credible, but activation still needs continuity after that first hit of clarity.

Phase 24 turns week one into an in-product operating rhythm:
- dashboard becomes the home for first-week guidance
- the shell reminds the user to come back to dashboard while activation is still fragile
- first-value milestones are explicit instead of implied
- backup is treated as a week-one behavior, not a buried settings action

## Changes Implemented
1. Added [js/week-one-lifecycle.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/week-one-lifecycle.js) as a shared lifecycle engine.
2. The lifecycle engine now computes:
   - onboarding-based day number
   - first-week active/inactive state
   - role label
   - workspace milestone completion
   - next recommended action
   - return-to-dashboard rhythm copy
3. Updated [app/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html) to render a dedicated week-one panel above the rest of the dashboard.
4. Updated [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js) to load the lifecycle engine globally and show a non-dashboard `Week 1 · Return to Dashboard` nudge during the first week.
5. The implementation is deliberately in-product only. No fake email automation was added.

## Exit Criteria
### Met Locally
- first-week guidance exists beyond the welcome page
- dashboard has a visible week-one operating panel
- the shell can remind the user to return to dashboard on non-dashboard pages
- first-value milestones are explicit
- backup is now part of the week-one lifecycle

### Still Requires Live Validation
- the dashboard panel feels helpful instead of repetitive
- the shell nudge appears only when it should
- the lifecycle turns off cleanly after the first week
- real users actually follow the dashboard-return rhythm

## Files Changed
- [js/week-one-lifecycle.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/week-one-lifecycle.js)
- [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js)
- [app/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)

## Status
`local-patch`
