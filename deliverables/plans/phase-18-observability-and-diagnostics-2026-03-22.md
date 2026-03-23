# Phase 18 - Observability and Diagnostics

Date: 2026-03-22

## Objective
Replace anecdotal debugging with product-native telemetry so launch decisions can be based on operating truth instead of memory, console luck, or manually reproduced failures.

## Why This Phase Ran Now
Phases 13-17 hardened:
- encoding and copy integrity
- navigation stability
- shared chrome consistency
- visible error states
- persistence truth

At that point, the next risk was not just whether the app could fail, but whether it could fail without leaving enough evidence behind to understand what happened.

## Scope
This phase focused on five observability layers:

1. page-level error logging
2. module boot event logging
3. key diagnostic counters
4. signup / onboarding / welcome / dashboard lifecycle telemetry
5. usage-depth tracking beyond raw page views

## Files Changed
- [js/analytics.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/analytics.js)
- [js/module-boot-state.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/module-boot-state.js)
- [app/onboarding/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/onboarding/index.html)
- [app/welcome/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)
- [app/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)

## What Was Added

### 1. Local diagnostics state
[js/analytics.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/analytics.js) now maintains a dedicated diagnostics store at `gtmos_diagnostics_state` containing:
- cumulative counters
- recent failure records
- path-scoped payloads for debugging

This means the app can preserve operational context locally even when no remote diagnostics backend exists yet.

### 2. Global JavaScript failure capture
[js/analytics.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/analytics.js) now captures:
- `window.error`
- `window.unhandledrejection`

Each captured failure:
- increments diagnostic counters
- records a recent diagnostic event
- emits a structured analytics event

Duplicate error fingerprints are suppressed so one exploding script does not create worthless telemetry spam.

### 3. Module boot telemetry
[js/module-boot-state.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/module-boot-state.js) now emits:
- `module_boot_started`
- `module_boot_failed`
- `module_boot_succeeded`

This instrumentation rides on the boot-state helper already used across major modules, which means boot truth is now measurable instead of inferred.

### 4. Usage-depth tracking
[js/analytics.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/analytics.js) now captures:
- interaction count
- maximum scroll percentage
- page duration

On page leave, the app now classifies the session as:
- `light`
- `engaged`
- `deep`

This is materially better than treating a two-second bounce and a five-minute module session as the same kind of page view.

### 5. Onboarding lifecycle instrumentation
[app/onboarding/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/onboarding/index.html) now tracks:
- `onboarding_loaded`
- `onboarding_step`
- `onboarding_restore_backup_click`
- `onboarding_finish_submit`
- `onboarding_finish_success`
- `onboarding_finish_error`

This makes onboarding drop-off and failure points measurable without requiring manual reproduction.

### 6. Welcome lifecycle instrumentation
[app/welcome/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html) now tracks:
- `welcome_loaded`
- `welcome_exit_click`
- `welcome_load_error`

The welcome layer is now observable as an activation corridor rather than just a static first-session page.

### 7. Dashboard state instrumentation
[app/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html) now tracks:
- `dashboard_boot_failed`
- `dashboard_empty`
- `dashboard_brief_ready`
- `dashboard_monday_review_copy`
- `dashboard_data_action_click`

This covers the current command spine:
- failed startup
- empty workspace truth
- briefing readiness
- weekly review usage
- data/backup intent

### 8. Signup path continuity
Signup and login were already emitting core auth events from prior work:
- `signup_submit`
- `signup_success`
- `signup_confirmation_sent`
- `signup_error`
- `login_submit`
- `login_success`
- `login_error`

Phase 18 leaves those intact and connects the rest of the lifecycle around them.

## What This Phase Makes Possible
After this pass, you can answer operational questions like:
- Are modules failing at boot or just loading empty?
- Are users reaching onboarding completion but not welcome exit?
- Are users bouncing lightly or actually engaging deeply with modules?
- Is the dashboard briefing being reached, or are workspaces staying empty?
- Are auth and lifecycle problems sporadic or repeated?

## What This Phase Does Not Claim
- It does not add a full remote observability backend.
- It does not build a diagnostics UI in the product yet.
- It does not make every module equally instrumented beyond the shared boot helper.
- It does not replace later launch QA or funnel analysis.

This is a foundation layer, not the final observability system.

## Evidence Board Impact
- `EB-R06` moves from `open` to `local-patch`

Reason:
- the repo-side telemetry work is in place
- live verification is still required before it can be called validated

## Manual Verification
After deployment, verify:

1. Signup / login path
- create or log into an account
- confirm auth success/failure paths still behave normally

2. Onboarding
- move through onboarding steps
- confirm normal completion still works

3. Welcome
- load welcome
- exit into the app
- confirm no routing regression

4. Dashboard
- load an empty workspace and a populated workspace
- confirm both still render correctly
- use `Copy Monday Review`
- use a data action such as export

5. Failure capture
- if a known boot failure is induced in a module, confirm the product still shows visible failure truth and the console contains the underlying error

## Exit Read
Phase 18 now gives Antaeus a real telemetry baseline:
- lifecycle events exist across the key activation corridor
- module boot truth is measurable
- JS failures no longer disappear without a structured trace
- usage depth is now distinguishable from raw traffic

This does not finish observability forever, but it gets the app out of the "manual noticing" stage and into the "operating evidence" stage.
