# Phase 17 - Persistence QA Program

Date: 2026-03-22

## Objective
Make "durable workspace truth" something users can trust.

## Why This Phase Ran Now
Phases 13-16 hardened:
- encoding and copy integrity
- navigation stability
- shared chrome consistency
- visible error states and silent-failure handling

The next trust boundary was persistence. If save, reload, reset, demo mode, or import/export boundaries are ambiguous, the app still feels fake even when the modules boot correctly.

## Audit Scope
This pass focused on the highest-confidence persistence seams:
- demo seed cleanup behavior
- demo enter / exit behavior
- import / delete behavior while demo or auth-bypass state exists
- stale local override risk from `gtmos_noauth_*` and `gtmos_env_mode`
- bootstrap-cache invalidation around those transitions

Files reviewed:
- [demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html)
- [app/settings/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/settings/index.html)
- [js/data-manager.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/data-manager.js)
- [js/supabase-config.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/supabase-config.js)
- [js/app-auth-preflight.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/app-auth-preflight.js)

## Findings
### 1. Demo cleanup could not be trusted
`demo-seed.html` used `Object.keys(localStorage)` to count and clear demo data, but the app's demo storage model relies on patched `Storage` behavior and prefixed keys. That made cleanup and count reporting less trustworthy than intended.

There was also a broken redirect block inside `clearAll()` referencing `mode` and `status` values that do not exist in that function.

### 2. Demo exit was too weak
`app/settings/index.html` only removed `sessionStorage['gtmos_env_mode']` before redirecting out of demo. It did not:
- clear auth-bypass flags
- purge demo-prefixed local state
- clear workspace bootstrap cache

That created a real stale-state risk between demo and real workspace use.

### 3. Import and delete flows did not explicitly neutralize demo/no-auth control state
`js/data-manager.js` deliberately excluded:
- `gtmos_noauth_mode`
- `gtmos_noauth_email`
- `gtmos_env_mode`

from ordinary data cleanup. That was reasonable for generic export/import data handling, but it left a gap: real workspace operations could run while demo or no-auth flags were still lingering.

## Implemented Hardening
### A. Demo seed cleanup is now deterministic
Updated [demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html):
- `clearAll()` now uses the active storage implementation instead of `Object.keys(localStorage)`
- demo cleanup clears the demo namespace via the patched storage behavior already used by the app
- the broken autoseed redirect block was removed from `clearAll()`
- the count display now uses the same storage-aware counting logic

### B. Demo exit now clears demo state instead of only hiding it
Updated [app/settings/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/settings/index.html):
- entering demo now clears workspace bootstrap cache before redirect
- exiting demo now calls a real demo-cleanup path
- fallback cleanup explicitly removes:
  - `gtmos_env_mode`
  - `gtmos_noauth_mode`
  - `gtmos_noauth_email`
  - demo-prefixed no-auth keys
  - demo-prefixed `gtmos_` data
- bootstrap cache is cleared before redirecting back to the real app

### C. Import / delete now normalize control state first
Updated [js/data-manager.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/data-manager.js):
- added explicit control-state helpers for:
  - detecting demo mode
  - removing control-key variants
  - purging demo-prefixed namespace data
  - clearing bootstrap cache after state normalization
- import now exits demo mode, clears demo residue, and then restores real workspace truth
- delete now distinguishes between:
  - demo cleanup only
  - real durable workspace deletion
- data manager now exposes:
  - `isDemoWorkspaceActive()`
  - `clearDemoWorkspace()`

## What This Fixes
This pass closes the highest-confidence persistence trust gaps:
- demo cleanup is no longer based on brittle key enumeration
- exiting demo now actually exits demo
- importing a backup is no longer allowed to quietly inherit demo/no-auth state
- deleting demo state no longer risks masquerading as durable workspace reset
- bootstrap cache is explicitly invalidated around these transitions

## What This Phase Does Not Claim Yet
This is not the final persistence validation gate yet.

Still required after deploy:
- real-browser refresh matrix
- logout / login matrix
- export / import matrix with a known-good backup
- delete / reset matrix
- demo -> real -> demo switching matrix
- cross-device cloud/local precedence verification

## Manual Verification Matrix
Run these after deploy:

1. Demo enter / exit
- enter demo from Settings
- confirm demo data appears
- exit demo from Settings
- confirm real workspace returns with no demo residue

2. Export / import
- export a real backup
- mutate real workspace data
- import the backup
- confirm restored state survives reload

3. Delete / reset
- run delete-all in a real workspace
- confirm onboarding route returns
- confirm stale workspace summary does not survive

4. Demo isolation
- seed demo data
- leave demo
- confirm real workspace state is unchanged
- re-enter demo
- confirm demo can reseed cleanly

5. Re-login
- log out
- log back in
- confirm durable workspace truth wins over stale local assumptions

## Status
Repo-side persistence hardening for the highest-confidence risks is complete.

Current status against the evidence board:
- `local-patch`

Reason:
- code-side fixes are in
- full manual matrix validation still needs to be run in the live app

## Exit Read
Phase 17 is no longer just a checklist item. The dangerous seams are now explicitly handled in code, and the remaining work is honest QA rather than hidden cleanup debt.
