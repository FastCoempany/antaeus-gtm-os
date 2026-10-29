# Implementation Status Ledger

PR: #324  
Branch: `language-remediation-v1`

This file records the source-level implementation status separately from the approved rewrite decisions. It should be updated as each room/generator is migrated and validated.

## Implemented at source

### Shared product language
- [x] Workspace map / former Ground user-facing language
  - `src/lib/ground/motion.ts`
  - `src/lib/ground/GroundLine.tsx`
- [x] Recent Activity / former Live Edge user-facing language
  - `src/lib/edge/LiveEdge.tsx`
- [x] Birdseye recommendation labels/reasons
  - `src/birdseye/lib/ranker.ts`
  - `src/birdseye/BirdseyeFloat.tsx`
- [x] Readiness state labels, blockers, and drawer
  - `src/lib/readiness/types.ts`
  - `src/lib/readiness/verdict.ts`
  - `src/dashboard/v4/ClimbDrawer.tsx`

### Core / highest-saturation rooms
- [x] Welcome
  - `src/welcome/v4/lib/landing.ts`
  - `src/welcome/v4/WelcomeV4.tsx`
- [x] Dashboard
  - `src/dashboard/v4/lib/cockpit.ts`
  - `src/dashboard/v4/DashboardV4.tsx`
- [x] ICP Studio
  - `src/icp-studio/lib/quality.ts`
  - `src/icp-studio/v4/IcpStudioV4.tsx`
  - related copy tests updated
- [x] Future Autopsy primary UI and cause engine
  - `src/future-autopsy/lib/causes.ts`
  - `src/future-autopsy/v4/FutureAutopsyV4.tsx`
- [x] Future Autopsy document generator migrated to evidence/risk model
  - `src/future-autopsy/lib/autopsy-data.ts`
  - **validation required:** confirm output fields still match the stable `AutopsyDoc` contract before merge

### Strategy / monitoring
- [x] Signal Console attention model + UI
  - `src/signal-console/v4/lib/attention.ts`
  - `src/signal-console/v4/SignalConsoleV4.tsx`
- [x] Territory Architect UI + status/next-action engine
  - `src/territory-architect/v4/TerritoryArchitectV4.tsx`
  - `src/territory-architect/lib/field-read.ts`
- [x] Briefing first-visit primer
  - `src/briefing/components/FirstVisitPrimer.tsx`
  - related copy test updated
- [x] Briefing demo/sample market analyses
  - `src/briefing/lib/demo-patterns.ts`
- [x] Briefing conflicting-evidence rail
  - `src/briefing/components/ContrarianRail.tsx`
- [x] Briefing accounts-to-consider rail
  - `src/briefing/components/PeripheryRail.tsx`
- [x] Briefing saved monitoring rules
  - `src/briefing/components/WatchList.tsx`

### Deal advancement / handoff
- [x] Getting to Signed visible workstream model
  - `src/getting-to-signed/v4/GettingToSignedV4.tsx`
  - stable persisted field names retained
- [x] Getting to Signed internal model comments/doctrine
  - `src/getting-to-signed/v4/lib/fronts.ts`
- [x] Pilot Desk
  - `src/pilot-desk/v4/PilotDeskV4.tsx`
- [x] Founding GTM reader + section taxonomy
  - `src/founding-gtm/v4/FoundingGtmV4.tsx`
  - `src/founding-gtm/lib/types.ts`
- [x] Call in a Favor
  - `src/call-in-a-favor/v4/CallInAFavorV4.tsx`

### Tooling / regression control
- [x] Reproducible rendered-copy inventory builder
  - `tools/language-remediation/build-copy-inventory.js`
- [x] Copy regression audit
  - `tools/language-remediation/copy-audit.js`
- [x] npm scripts
  - `copy:inventory`
  - `copy:audit`

## Still requires source implementation or validation

### Generator / synthesis cleanup
- [ ] Founding GTM synthesis-engine prose (`src/founding-gtm/lib/sections.ts` and related readers)
  - remove causal wording such as language equivalent to “won the next meeting”
  - preserve observational/correlational framing
- [ ] Main Briefing live surface / remaining generator/template language
  - static rails and demo analyses are migrated; continue through live generation and remaining visible section labels
- [ ] Verify Future Autopsy `AutopsyDoc` field compatibility and update any dependent tests/readers

### Remaining execution / utility rooms
- [ ] Prospecting Desk
- [ ] Outdoors Events
- [ ] Outbound Studio
- [ ] Cold Call Studio
- [ ] LinkedIn Playbook
- [ ] Discovery Studio
- [ ] Deal Workspace
- [ ] Quota Workback
- [ ] Settings

### Internal doctrine / prompts
- [ ] Search remaining source/docs/prompts for deprecated language families:
  - Ground / motion / heat / sharp / bite / carve
  - Live Edge / machine / awake
  - thread / pressure / decay / dying
  - climb / summit / inheritable
  - front / face-off / your line
  - relay / backchannel
- [ ] Replace user-visible prompt/style instructions that encourage slogan-like or metaphorical generated copy

### Validation before merge
- [ ] CI/typecheck/test pass on PR #324
- [ ] Run `npm run build:transcript`
- [ ] Run `npm run copy:inventory`
- [ ] Run `npm run copy:audit`
- [ ] Review Tier-2 warnings manually
- [ ] Regenerate the full preview walkthrough
- [ ] Rerun the unchanged nine-dimension saturation test
- [ ] Iterate until score is **≤20/100**
- [ ] Keep PR draft / unmerged until all acceptance criteria pass

## Current phase

**Phase 7 — source tracing and implementation: in progress.**

The high-saturation shared language architecture and most high-saturation rooms have been migrated. The remaining work is concentrated in generator/synthesis prose, lower-saturation execution rooms, and final regression/validation.
