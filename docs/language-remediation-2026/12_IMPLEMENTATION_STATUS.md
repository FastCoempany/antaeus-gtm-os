# Implementation Status Ledger

PR: #324  
Branch: `language-remediation-v1`

This ledger separates **language decision**, **source implementation**, and **validation**. A checked source item means the relevant source is changed in the PR; it does **not** mean the item is validated complete.

See `13_ADVERSARIAL_PHASE_AUDIT.md` for the adversarial review and course corrections.

## State definitions

- **Decision complete** — approved semantics/copy exist in the remediation docs.
- **Source implemented** — the highest correct source of truth is changed in PR #324.
- **Validated** — tests/typecheck and regenerated rendered output confirm the change.

No room or system is complete until required validation is finished.

---

# Decision status by phase

| Phase | Decision status | Source status | Validation status |
|---|---|---|---|
| 1 · Corpus + methodology | Complete | Complete for methodology/tooling | Partial |
| 2 · Shared semantic architecture | Complete | Substantial | Pending rendered validation |
| 3 · Highest-saturation rooms | Complete | Partial | Pending |
| 4 · Strategic/diagnostic rooms | Complete | Partial | Pending |
| 5 · Execution/utility rooms | Complete | Not started in current PR | Pending |
| 6 · Generated language/internal doctrine | Specification complete | Partial / mostly pending | Pending |
| 7 · Source tracing + implementation | — | **In progress** | — |
| 8 · Copy linter + CI | Specification complete | Tooling partial; CI gate not wired | Pending |
| 9 · Regenerate + re-score | — | Not started | Not started |

---

# Source implemented in PR #324

## Shared product language

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

## Core / highest-saturation rooms

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
- [x] Future Autopsy primary UI + cause labels
  - `src/future-autopsy/lib/causes.ts`
  - `src/future-autopsy/v4/FutureAutopsyV4.tsx`
- [ ] Future Autopsy document/narrative generator
  - `src/future-autopsy/lib/autopsy-data.ts`
  - **correction:** this file is not present in the PR changed-file list; the prior status ledger incorrectly marked it complete.
- [x] Briefing first-visit primer
  - `src/briefing/components/FirstVisitPrimer.tsx`
- [x] Briefing demo/sample market analyses
  - `src/briefing/lib/demo-patterns.ts`
- [x] Briefing conflicting-evidence rail
  - `src/briefing/components/ContrarianRail.tsx`
- [x] Briefing accounts-to-consider rail
  - `src/briefing/components/PeripheryRail.tsx`
- [x] Briefing saved monitoring rules
  - `src/briefing/components/WatchList.tsx`
- [ ] Briefing remaining live generators/templates and visible labels

## Strategy / monitoring

- [x] Signal Console attention model + UI
  - `src/signal-console/v4/lib/attention.ts`
  - `src/signal-console/v4/SignalConsoleV4.tsx`
- [x] Territory Architect UI + status/next-action engine
  - `src/territory-architect/v4/TerritoryArchitectV4.tsx`
  - `src/territory-architect/lib/field-read.ts`

## Deal advancement / handoff

- [x] Getting to Signed visible workstream model
  - `src/getting-to-signed/v4/GettingToSignedV4.tsx`
- [x] Getting to Signed internal model comments/doctrine in migrated model
  - `src/getting-to-signed/v4/lib/fronts.ts`
- [x] Pilot Desk visible surface
  - `src/pilot-desk/v4/PilotDeskV4.tsx`
- [x] Founding GTM reader + section taxonomy
  - `src/founding-gtm/v4/FoundingGtmV4.tsx`
  - `src/founding-gtm/lib/types.ts`
- [ ] Founding GTM synthesis-engine prose
  - `src/founding-gtm/lib/sections.ts` and related readers
- [x] Call in a Favor visible surface
  - `src/call-in-a-favor/v4/CallInAFavorV4.tsx`

## Tooling

- [x] Reproducible rendered-copy inventory builder
  - `tools/language-remediation/build-copy-inventory.js`
- [x] Copy-audit script exists
  - `tools/language-remediation/copy-audit.js`
- [x] npm commands exist
  - `copy:inventory`
  - `copy:audit`
- [ ] Copy audit wired into CI
- [ ] Copy-audit source scope confirmed to include every user-visible prompt/template source

---

# Source implementation still required

## Execution / utility rooms

- [ ] Prospecting Desk
- [ ] Outdoors Events
- [ ] Outbound Studio
- [ ] Cold Call Studio
- [ ] LinkedIn Playbook
- [ ] Discovery Studio
- [ ] Deal Workspace
- [ ] Quota Workback
- [ ] Settings

## Generator / synthesis cleanup

- [ ] Future Autopsy document/narrative generator
- [ ] Founding GTM synthesis engine
- [ ] Briefing live generation/templates

## Internal doctrine / prompts

- [ ] Repo-wide sweep for remaining deprecated language families outside already migrated files
- [ ] Rewrite user-visible prompt/style instructions that encourage aphoristic, metaphorical, or causally overstated output

---

# Validation before merge

- [ ] PR CI/typecheck/test pass
- [ ] `npm run build:transcript`
- [ ] `npm run copy:inventory`
- [ ] `npm run copy:audit`
- [ ] manually classify Tier-2 warnings
- [ ] regenerate the full preview walkthrough
- [ ] rerun the unchanged nine-dimension saturation test
- [ ] iterate until score is **<=20/100**
- [ ] confirm all acceptance criteria in `00_MASTER_PLAN_AND_METHODOLOGY.md`
- [ ] keep PR draft / unmerged until all above pass

## Baseline identity

Original analysis TXT:

- `antaeus-preview-walkthrough.txt`
- 1,100,002 bytes
- SHA-256 `e24b88af10def00e9f9c85b31c5d5f8fb198ca62c77170a47be2778ac9f35cfc`

## Current phase

**Phase 7 — source tracing and implementation: in progress.**

The immediate next work is Future Autopsy generator, Founding GTM synthesis, remaining Briefing generation, then Phase 5 execution/utility rooms. None should be promoted to validated until the rendered transcript is regenerated and checked.
