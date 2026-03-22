# Phase 15 - Shared Chrome Audit

Date: 2026-03-22

## Objective

Make the app shell feel singular and intentional by enforcing idempotent shared chrome behavior across modules:
- one guided rail at a time
- one save chip at a time
- one tooltip trigger at a time
- nav badges that actually bind to the live shell

## Current Truth Before This Phase

- Shared injectors were individually useful, but they were not all defensive against repeated boot paths.
- The most visible user-facing failure was a stacked progress/banner state on the PoC Framework page.
- The evidence board also already called out a dead nav badge selector:
  - [js/data-flow.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/data-flow.js) was still targeting `a.sidebar-link`
  - [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js) renders `.nav-item`

## Repo Surface Updated

- [js/guided-rail.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/guided-rail.js)
- [js/save-indicator.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/save-indicator.js)
- [js/module-tooltips.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/module-tooltips.js)
- [js/data-flow.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/data-flow.js)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)

## What This Phase Implemented

### 1. Guided rail idempotency

- Added a hard `removeExistingRail()` path in [js/guided-rail.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/guided-rail.js)
- Every rail render now removes any prior `#guidedRail` before inserting a new one
- This directly addresses the stacked top-banner path reported on PoC Framework

### 2. Save indicator idempotency

- [js/save-indicator.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/save-indicator.js) now marks chips with `data-save-indicator="true"`
- `mount()` now reuses an existing chip instead of blindly appending another
- `mountAfter()` now reuses a sibling or parent-level existing chip if one is already present
- unsaved-guard monkey-patching is now guarded so repeated mounts do not keep wrapping the same function

### 3. Module tooltip idempotency

- [js/module-tooltips.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/module-tooltips.js) now exits early if the page title already contains a tooltip trigger
- This prevents repeated `?` tooltip button injection on re-run paths

### 4. Data-flow nav badge repair

- [js/data-flow.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/data-flow.js) now targets the live shell:
  - `a.nav-item[href*=...]`
  - or `a.nav-item[data-nav=...]`
- Badge placement now prefers:
  - before `.nav-dot`
  - otherwise after `.nav-label`
- This fixes the mismatch between the old badge script and the current navigation renderer

## Shared Chrome Rules Established

1. Shared chrome must be idempotent.
   - Re-running boot logic must not duplicate visible UI.

2. Shared chrome must bind to the live shell contract.
   - If the shell renders `.nav-item`, supporting scripts cannot keep targeting dead selectors.

3. Shared chrome must degrade cleanly.
   - If a target anchor does not exist, the script should no-op rather than create malformed UI.

4. Shared chrome must not silently multiply event bindings.
   - Wrapping the same event source multiple times is not acceptable shell behavior.

## Verification

### Parse checks

```powershell
node --check js/save-indicator.js
node --check js/guided-rail.js
node --check js/module-tooltips.js
node --check js/data-flow.js
```

Expected result:

- all four files parse cleanly

### Selector sanity check

```powershell
rg -n "sidebar-link|data-flow-badge|guidedRail|data-save-indicator|module-tooltip-trigger" js -S
```

Expected result:

- `data-flow.js` no longer uses `sidebar-link`
- the idempotency markers are present

## Manual Browser Verification Recommended

1. Open `/app/poc-framework/`.
2. Confirm only one top progress/banner rail appears.
3. Refresh the page and confirm it still remains a single rail.
4. Save a PoC and confirm only one save chip appears near the page title.
5. Open a module with tooltips and confirm only one `?` tooltip trigger is present.
6. Trigger a data-flow badge path, then confirm the badge appears on the current nav shell rather than failing silently.

## Exit Criteria Status

- shared chrome duplication risk: **materially reduced**
- PoC stacked banner path: **patched in repo**
- nav badge mismatch: **patched in repo**
- browser verification: **still required before closure**

## Evidence Board Status

- `EB-R03` moved from `open` to `local-patch`
- `EB-R04` moved from `open` to `local-patch`
- `EB-R07` moved from `open` to `local-patch`

## Next Best Step

Move to **Phase 16 - Error State and Silent Failure Audit**.
