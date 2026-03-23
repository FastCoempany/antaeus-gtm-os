# Phase 23 - Tour Guide 2.0 Spec and Rebuild

## Objective
Make the tour actually sell the product to a new user.

## Why This Phase Exists
The original tour was useful orientation, but it was still a static tooltip list tied mostly to nav locations. That was not enough to carry a new user through the product without human help.

Phase 23 upgrades the tour into a more deliberate activation surface:
- founder versus operator paths
- a `show me the next thing that matters` lane
- persisted pause and resume
- demo-aware launch logic
- global availability anywhere the app shell exists

## Changes Implemented
1. Rebuilt [js/tour-guide.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/tour-guide.js) as a stateful tour runtime instead of a fixed static step list.
2. Added branching by persona:
   - `Founder path`
   - `First AE / operator path`
   - `Show me the next thing that matters`
3. Added pause and resume with persisted user-scoped state.
4. Kept the demo lane central:
   - if the tour is launched outside demo mode, it now routes through seeded demo data first
   - branch choice persists through that redirect
5. Added adaptive next-step logic based on saved ICP, signal, deal, and motion state.
6. Updated [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js) so the tour runtime is loaded globally in the app shell instead of only on a few pages.
7. Added richer tour UI styles in [css/app.css](c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css) for the chooser, chips, and branch actions.

## Exit Criteria
### Met Locally
- the tour is no longer only a static tooltip chain
- the runtime supports pause and resume
- branch paths exist by persona
- a real `next thing that matters` lane exists
- the tour is loadable everywhere the nav shell exists

### Still Requires Live Validation
- branch selection feels clear in the browser
- resume state survives real navigation patterns cleanly
- demo redirect plus return path feels intentional
- the tour meaningfully helps a new user understand why the app exists

## Files Changed
- [js/tour-guide.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/tour-guide.js)
- [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js)
- [css/app.css](c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)

## Status
`local-patch`
