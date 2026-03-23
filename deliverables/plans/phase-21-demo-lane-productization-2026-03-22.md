# Phase 21 - Demo Lane Productization

Date: 2026-03-22

## Objective
Make demo mode a real self-serve acquisition tool instead of a hidden utility page.

## Why This Phase Exists
Phase 19 moved the landing page toward a demo-first CTA ladder. That made the demo lane part of the real funnel, not just a support tool for internal testing. The old `demo-seed.html` still behaved like a developer helper:

- utility copy instead of buyer-facing framing
- unclear sample-vs-real truth
- manual "Open Dashboard" step after seeding
- no clear next step into sign-in or purchase
- no shell-level demo conversion path

## Changes Implemented

### 1. Productized Demo Entry Surface
Updated [demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html) so the page now behaves like a guided demo entry lane:

- clearer demo framing
- explicit explanation of what is sample vs what is real
- two scenario narratives:
  - Mid-Market Demo
  - Enterprise Demo
- direct links to:
  - annual plan / purchase path
  - sign in to real workspace
  - methodology

### 2. Demo Auto-Launch
Manual scenario clicks now seed data and route directly into the dashboard instead of forcing the user to click a second "Open Dashboard" link.

### 3. Stronger Demo Metadata
The seed flow now writes richer demo metadata, including:

- scenario label
- demo lane entry source
- upgraded demo seed version
- demo workspace profile cache

### 4. Demo Lane Telemetry
Added demo-lane event capture for:

- demo lane loaded
- demo seed complete
- demo autoseed requested
- demo reset clicked

### 5. Demo Shell Productization
Updated [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js) so demo mode is clearer in the app shell:

- sidebar notice now explains that the user is in a sample workspace
- demo mode footer adds:
  - `See Annual Plan`
  - `Exit Demo`

## Exit Criteria Read

### Met locally
- demo feels more intentional than utility-grade
- sample-vs-real truth is explicit
- manual demo seed auto-launches into dashboard
- demo mode has a visible path toward purchase
- demo mode has a visible exit path

### Still requires live validation
- verify both Mid-Market and Enterprise seed paths on `antaeus.app`
- verify auto-launch works in live browser after deploy
- verify sidebar demo controls appear only in demo mode
- verify `Exit Demo` from nav returns the user to real workspace cleanly

## Files Changed
- [demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html)
- [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js)
- [phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)

## Status
`local-patch`
