# Antaeus Shell Implementation Wave 5

## Scope
- finish the custom-canvas convergence pass for the remaining shell holdouts:
  - `Signal Console`
  - `Cold Call Studio`

## Objective
- make the shared shell header the only page-level header
- downgrade local top bars into utility strips
- remove duplicate mode/bridge chrome inside the Cold Call canvas
- keep each module's custom workflow intact without letting it compete with the shell

## Files
- [signal-console](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/signal-console/index.html)
- [cold-call-studio](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/cold-call-studio/index.html)

## What Changed

### Signal Console
- added a shared shell-native `app-header`
- removed the local top-bar branding and divider
- kept search, stats, credits, and actions as a utility strip below the shell header
- added measured sticky-offset logic so the utility strip sits below the shared header instead of competing with it

### Cold Call Studio
- added a shared shell-native `app-header`
- removed the local top-bar branding and divider
- kept account context, phase dots, and timer as the custom utility strip
- added measured sticky-offset logic so the utility strip sits below the shared header
- removed extra `renderModeBridge()` injections from the main canvas so the shared shell band is now the single top-level mode bridge

## Result
- both custom canvases now read as shell-first surfaces
- the shared header owns page identity
- the module-local strips now behave like workflow utilities, not second headers
- Cold Call Studio no longer duplicates its mode framing inside the body

## Boundary
- this wave is implemented in code
- live browser validation is still required before calling it validated

## Recommended Validation
1. Open `Signal Console` and confirm:
   - the new shared header appears
   - the local bar no longer brands the module
   - search and actions still work
2. Open `Cold Call Studio` and confirm:
   - the new shared header appears
   - the local bar shows only context, timer, and phase dots
   - there is only one top-level mode bridge
   - pre-call, voicemail, post-call, and standard response paths still render correctly
