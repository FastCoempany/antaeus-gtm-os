# Antaeus Shell Implementation Wave 3

Date: 2026-03-31

## Goal
Move the Signals and Calls family closer to one shared shell system without breaking the bespoke interaction models that already work.

## Scope Shipped

### 1. LinkedIn Playbook
- added shared `app-header` treatment
- removed the page-local hero/title dependency in favor of a shared shell command band
- upgraded the top-of-page bridge to use `gtmShellChrome.renderCommandBand(...)`
- aligned header state with real channel context:
  - `Signal-linked`
  - `Motion-linked`
  - `Logging live`
  - `Needs context`

Files:
- [app/linkedin-playbook/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/linkedin-playbook/index.html)

### 2. Call Planner / Discovery Agenda
- replaced the bespoke bridge block with a shared shell command band
- mapped agenda quality into shell header state:
  - `Credible`
  - `Workable`
  - `Thin`
- promoted the Discovery Studio / Deal Workspace handoff into shell-level actions

Files:
- [app/discovery-agenda/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-agenda/index.html)

### 3. Discovery Studio
- replaced the bespoke discovery bridge with a shared shell command band
- added a shared page subtitle
- mapped live call / agenda / deal linkage into shell state:
  - `Deal-linked`
  - `Agenda-linked`
  - `Call context thin`

Files:
- [app/discovery-studio/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-studio/index.html)

### 4. Cold Call Studio
- kept the custom operator canvas and sticky top bar
- inserted a shared shell command band above the two-column call canvas
- connected shell summary to:
  - selected account
  - top signal
  - current mode
  - next move

Files:
- [app/cold-call-studio/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/cold-call-studio/index.html)

### 5. Signal Console
- kept the custom research console and sticky control bar
- inserted a shared shell command band below the top bar
- made the shell summarize:
  - hottest account
  - total live signals
  - accounts ready now
  - next move
- added a shell action to jump to the hottest account or open add-account flow

Files:
- [app/signal-console/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/signal-console/index.html)

## Verification
- stale bridge references removed for:
  - `liBridge`
  - `plannerBridge`
  - `bridgePanel`
- inline script syntax checks passed for the touched module pages

## What Wave 3 Did Not Do
- full visual unification of Signal Console or Cold Call Studio
- removal of all module-local typography/layout systems
- full Dashboard / Welcome body re-authoring
- family-wide context-rail adoption

## Net Result
The app shell now feels more like one operating system across:
- LinkedIn
- Call Planner
- Discovery Studio
- Cold Call Studio
- Signal Console

But the Signals and Calls family still contains two classes of shell maturity:
- `shared-header + shared-band`: LinkedIn, Call Planner, Discovery Studio
- `shared-band over custom canvas`: Cold Call Studio, Signal Console

## Recommended Next Move
Shell Wave 4 should do one of two things cleanly:
1. fully converge Dashboard and Welcome body architecture onto shell-native sections, then migrate the remaining Pipeline/System family
2. finish the custom-canvas convergence for Signal Console and Cold Call Studio so their local chrome no longer competes with the shared shell
