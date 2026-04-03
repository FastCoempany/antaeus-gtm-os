# Antaeus Phase 7 Connective Tissue Verification List

Date: 2026-04-03  
Status: required output for Phase 7 preflight step `7A.5`  
Parent docs:
- [phase-46-cross-module-compounding-rules-2026-03-26.md](./phase-46-cross-module-compounding-rules-2026-03-26.md)
- [antaeus-full-restructure-blueprint-2026-04-02.md](./antaeus-full-restructure-blueprint-2026-04-02.md)
- [antaeus-phase-7-nav-re-architecture-implementation-spec-2026-04-03.md](./antaeus-phase-7-nav-re-architecture-implementation-spec-2026-04-03.md)

## 1. Purpose

This is the no-break verification list for Phase 7.

Its job is to make sure shell/nav re-architecture does not sever:
- state continuity
- room-entry continuity
- return continuity
- cross-module compounding
- action-routing logic

## 2. Mandatory Continuity Parameters

The following parameters are protected and must continue to work across Phase 7:

- `returnTo`
- `returnLabel`
- `focusObject`
- `focusRoom`
- `fromMode`
- `fromSurface`
- stable `commandId`

Verification requirement:
- every major room-entry and room-return path must still preserve the correct subset of these values

## 3. Mandatory Continuity Surfaces

These surfaces are protected and must keep behaving coherently:

- `Welcome`
- `Dashboard`
- `Sheet`
- room-entry bridge
- pinned context strip
- room return path
- room rail as secondary access
- utility/recovery entry paths

## 4. Core Flow Verification

These flows must be verified before Phase 7 is accepted.

### 4.1 Command Entry

- `Welcome -> Spotlight`
- `Onboarding -> Spotlight`
- `Onboarding -> Week One`
- sidebar logo -> `Dashboard?mode=spotlight`
- sidebar dashboard link -> `Dashboard?mode=spotlight`

### 4.2 Sheet Entry

- `Spotlight -> Inspect -> Enter <room>`
- `Queue -> Inspect -> Enter <room>`
- selected object survives into room context

### 4.3 Direct Room Action Entry

- direct room actions from `Spotlight`
- direct room actions from `Queue`
- direct room actions preserve return context, not just direct URL jumps

### 4.4 Room Return

- `Back to Spotlight`
- `Back to Week One`
- `Back to <origin room>` where appropriate
- returned selection restoration by `commandId` or `focusObject`

### 4.5 Graph Reward

- reward trigger opens from Spotlight
- reward closes back to command cleanly
- reward does not become a replacement navigation surface

## 5. Shared State Verification

The following shared state must remain readable/writable after Phase 7:

- `gtmos_activation_context`
- `gtmos_call_handoff`
- `gtmos_readiness_snapshot`
- `gtmos_handoff_exported`
- `gtmos_demo_seed_meta`

Verification requirement:
- shell changes may not cause users to restate already-known state
- shell changes may not hide routes required to keep these objects useful

## 6. Cross-Module Compounding Verification

Each of the following relationships is protected.

| Source | Must still influence | Verification target |
|---|---|---|
| Onboarding | Welcome, Dashboard, Settings, ICP framing, Discovery framing, Quota framing | activation context still shapes shell and next moves |
| ICP Studio | Territory, Sourcing, Signal Console, Outbound, Discovery, Readiness, Handoff | saved ICP still becomes default targeting context |
| Territory Architect | Sourcing, Signal Console | territory tiering still shapes sourcing and account priority |
| Sourcing Workbench | Signal Console, Territory | pushed prospects still arrive with continuity and next action |
| Signal Console | Outbound, LinkedIn, Dashboard, Readiness, Handoff | signal heat still affects command urgency and motion context |
| Outbound Studio | Dashboard, LinkedIn, Signal Console, Readiness, Handoff | saved angles and touches still become shared motion truth |
| LinkedIn Playbook | Dashboard, Handoff | LinkedIn actions still count as real motion |
| Cold Call Studio | Dashboard, Deal Workspace, Handoff, Readiness | logged outcomes still push pressure back upstream |
| Call Planner | Discovery Studio, Deal Workspace | `gtmos_call_handoff` still carries agenda/deal continuity |
| Discovery Studio | Deal Workspace, Handoff, Readiness | worked discovery still sharpens deal truth |
| Deal Workspace | Future Autopsy, PoC, Advisor, Dashboard, Readiness, Handoff | deal pressure still controls downstream execution modules |
| Future Autopsy | Deal Workspace, Call Planner, Discovery Studio, PoC | failure diagnosis still routes to exact corrective room |
| PoC Framework | Deal Workspace, Dashboard, Handoff | proof state still syncs back upstream |
| Advisor Deploy | Deal Workspace, Dashboard, Handoff | advisor use still updates deal pressure/history |
| Quota Workback | Dashboard, Outbound, Cold Call, Deal, Readiness | quota math still becomes execution pressure |
| Readiness | Dashboard, Welcome, Handoff | readiness snapshot still acts as reusable system truth |
| Handoff Kit | Readiness, Dashboard, future launch readiness | export completeness still affects readiness credibility |

## 7. Suggestion / Next-Move Verification

The shell and command surfaces must still respect the core suggestion rules from Phase 46:

- no ICP exists -> push ICP first
- ICP exists but no live account/signal -> suggest Signal Console or Sourcing
- live account exists but no deal -> suggest Deal Workspace or Outbound depending on motion state
- deal exists with no next step -> suggest Deal Workspace or Call Planner depending on stage
- agenda exists with linked deal -> suggest Discovery Studio
- discovery exists but deal is thin -> suggest Deal Workspace qualification or Future Autopsy
- deal enters PoC -> suggest PoC Framework
- advisor fit exists under pressure -> suggest Advisor Deploy
- readiness high but handoff missing -> suggest Founding GTM export

Verification requirement:
- Phase 7 shell changes may not make these routes harder to reach or less legible

## 8. Room-Entry Bridge Verification

For each major receiving room, confirm:

- room-entry bridge still appears where supported
- bridge copy still reflects return path
- `Open Spotlight` and `Week One` still exist where appropriate
- bridge does not become visually weaker than the new shell hierarchy requires

Target rooms:

- `Deal Workspace`
- `Future Autopsy`
- `Signal Console`
- `Outbound Studio`
- `Call Planner`
- `Discovery Studio`
- `PoC Framework`
- `Advisor Deploy`

## 9. Pinned Context Verification

For each major receiving room, confirm:

- `Pinned object` still shows
- object label still matches the carried object
- `Why this room` still reflects the real continuation reason
- family pill still orients the user within the system

## 10. Selection and Return Verification

Dashboard must continue to restore context in this order:

1. returned `commandId`
2. returned `focusObject`
3. saved local selection
4. first valid ranked object

Verification requirement:
- Phase 7 shell changes may not break this logic
- changing the shell must not reset users into generic default command state unnecessarily

## 11. Utility and Trust Verification

The following trust paths must remain intact:

- backup/export
- settings access
- recovery/error paths
- auth/session re-entry

Verification requirement:
- utilities may move
- utilities may not become hard to find when the user needs them

## 12. Phase 7 No-Break Gate

Phase 7 may not be accepted if any of the following occur:

- users lose the ability to return to the correct originating command mode
- room-entry context becomes generic or disappears
- the shell hides routes that compounding logic depends on
- command re-entry starts dropping users into stale or contextless states
- room seriousness is weakened because continuity scaffolding was removed

## 13. Verification Outcome Standard

Phase 7 is connective-tissue safe only if:

- shell hierarchy changes are obvious
- compounding logic still operates invisibly and correctly underneath
- every major command-to-room-to-command path still feels like one operating path
- no GTM logic becomes page-local or detached as a side effect of shell changes

This verification list is binding for Phase 7 execution.
