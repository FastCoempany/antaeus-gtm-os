# Implementation Status Ledger

PR: #324  
Branch: `language-remediation-v1`

This ledger separates **language decision**, **source implementation**, and **validation**. A source item is not complete merely because copy was decided or a file was edited.

See `13_ADVERSARIAL_PHASE_AUDIT.md` for the adversarial review and course corrections.

## State definitions

- **Decision complete** — approved semantics/copy exist in the remediation docs or were explicitly resolved during adversarial implementation.
- **Source implemented** — the highest relevant source of truth is changed in PR #324, including generators/prompts when they can recreate the language.
- **Validated** — relevant tests/typecheck/build pass and regenerated rendered output confirms the intended language.

No room or system is complete until the required validation is finished.

---

# Phase ledger

| Phase | Decision | Source implementation | Validation |
|---|---|---|---|
| 1 · Corpus + methodology | Complete | Complete for methodology/tooling | Partial |
| 2 · Shared semantic architecture | Complete | Substantial | Pending rendered validation |
| 3 · Highest-saturation rooms | Complete | Substantial | Pending |
| 4 · Strategic / diagnostic rooms | Complete | Substantial | Pending |
| 5 · Execution / utility rooms | Complete | **Source implemented for primary rooms** | Pending |
| 6 · Generated language / internal doctrine | Specification complete | **Substantial after adversarial prompt/generator rewrite** | Pending |
| 7 · Source tracing + implementation | — | **In progress: residual sweep + blockers** | — |
| 8 · Copy linter + CI | Specification complete | Tooling exists; CI gate not yet wired | Pending |
| 9 · Regenerate + re-score | — | Not started | Not started |

---

# Source implemented in PR #324

## Shared product language and enforcement

- [x] Workspace map / former Ground user-facing language
  - `src/lib/ground/motion.ts`
  - `src/lib/ground/GroundLine.tsx`
- [x] Recent Activity / former Live Edge user-facing language
  - `src/lib/edge/LiveEdge.tsx`
- [x] Birdseye recommendation labels/reasons
  - `src/birdseye/lib/ranker.ts`
  - `src/birdseye/BirdseyeFloat.tsx`
- [x] Readiness labels, evidence/gap text, blockers, and tests
  - `src/lib/readiness/types.ts`
  - `src/lib/readiness/dimensions.ts`
  - `src/lib/readiness/dimensions.test.ts`
  - `src/lib/readiness/verdict.ts`
  - `src/lib/readiness/verdict.test.ts`
  - `src/dashboard/v4/ClimbDrawer.tsx`
- [x] Shared operator-help registry rewritten in literal room language
  - `src/lib/operator-help/registry.ts`
- [x] Shared voice doctrine/course correction
  - `src/lib/voice/voice-document.ts`
  - `src/lib/voice/validator.ts`
  - related tests
  - Deno mirror `supabase/functions/heartbeat/voice-document.ts`
  - calibrated uncertainty is allowed; indirect throat-clearing remains disallowed

## Core / highest-saturation rooms

- [x] Welcome
  - `src/welcome/v4/lib/landing.ts`
  - `src/welcome/v4/WelcomeV4.tsx`
- [x] Dashboard
  - `src/dashboard/v4/lib/cockpit.ts`
  - `src/dashboard/v4/DashboardV4.tsx`
- [x] ICP Studio + quality model/tests
  - `src/icp-studio/lib/quality.ts`
  - `src/icp-studio/lib/quality.test.ts`
  - `src/icp-studio/v4/IcpStudioV4.tsx`
- [x] Future Autopsy primary UI + causes + narrative generator/tests
  - `src/future-autopsy/lib/causes.ts`
  - `src/future-autopsy/lib/autopsy.ts`
  - `src/future-autopsy/lib/autopsy.test.ts`
  - `src/future-autopsy/v4/FutureAutopsyV4.tsx`
- [x] Briefing visible rails / primer / samples
  - `src/briefing/components/FirstVisitPrimer.tsx`
  - `src/briefing/components/ContrarianRail.tsx`
  - `src/briefing/components/PeripheryRail.tsx`
  - `src/briefing/components/WatchList.tsx`
  - `src/briefing/lib/demo-patterns.ts`
- [x] Briefing enrichment, synthesis, conflict analysis, quality rules, and production mirrors
  - `src/briefing/lib/llm/prompts.ts`
  - `src/briefing/lib/synthesis/contrarian.ts`
  - `src/briefing/lib/synthesis/prompts.ts`
  - `src/briefing/lib/synthesis/quality-gate.ts`
  - `src/briefing/lib/synthesis/voice-rules.ts`
  - related tests
  - `supabase/functions/briefing-pipeline/llm/_shared.ts`
  - `supabase/functions/briefing-pipeline/llm/contrarian-shared.ts`
  - `supabase/functions/briefing-pipeline/llm/synthesis-shared.ts`
  - `supabase/functions/briefing-pattern-critic/prompt.ts`

## Strategy / monitoring

- [x] Signal Console attention model + UI
  - `src/signal-console/v4/lib/attention.ts`
  - `src/signal-console/v4/SignalConsoleV4.tsx`
- [x] Territory Architect UI + status/next-action engine
  - `src/territory-architect/v4/TerritoryArchitectV4.tsx`
  - `src/territory-architect/lib/field-read.ts`

## Deal advancement / handoff

- [x] Getting to Signed
  - `src/getting-to-signed/v4/GettingToSignedV4.tsx`
  - `src/getting-to-signed/v4/lib/fronts.ts`
- [x] Pilot Desk
  - `src/pilot-desk/v4/PilotDeskV4.tsx`
- [x] Call in a Favor
  - `src/call-in-a-favor/v4/CallInAFavorV4.tsx`
- [x] Founding GTM reader/taxonomy + synthesis engine + tests
  - `src/founding-gtm/v4/FoundingGtmV4.tsx`
  - `src/founding-gtm/lib/types.ts`
  - `src/founding-gtm/lib/sections.ts`
  - `src/founding-gtm/lib/sections.test.ts`
  - causal claims were replaced with sample/frequency/association + hypothesis language

## Execution / utility rooms

- [x] Prospecting Desk
  - `src/prospecting-desk/lib/loom-read.ts`
  - `src/prospecting-desk/lib/loom-read.test.ts`
  - `src/prospecting-desk/v4/ProspectingDeskV4.tsx`
  - explicitly does not claim a live company-search capability
- [x] Outdoors Events
  - `supabase/functions/outdoors-events-discovery/index.ts`
  - `src/outdoors-events/v4/OutdoorsEventsV4.tsx`
- [x] Outbound Studio
  - `src/outbound-studio/lib/data.ts`
  - `src/outbound-studio/lib/generator.ts`
  - `src/outbound-studio/lib/generator.test.ts`
  - `src/outbound-studio/v4/OutboundStudioV4.tsx`
  - generator no longer invents proof, comparable-company outcomes, payback, buyer motives, or attachments
- [x] Cold Call Studio
  - `src/cold-call-studio/lib/threads.ts`
  - `src/cold-call-studio/lib/threads.test.ts`
  - `src/cold-call-studio/v4/ColdCallStudioV4.tsx`
  - legacy internal `proof` id retained; visible step now checks the buyer's current approach instead of manufacturing proof
- [x] LinkedIn Playbook
  - `src/linkedin-playbook/lib/motion.ts`
  - `src/linkedin-playbook/lib/motion.test.ts`
  - `src/linkedin-playbook/lib/scripts.ts`
  - `src/linkedin-playbook/lib/scripts.test.ts`
  - `src/linkedin-playbook/lib/cues.ts`
  - `src/linkedin-playbook/v4/LinkedInPlaybookV4.tsx`
  - unsupported acceptance/reply thresholds and trust/warmth claims removed
- [x] Discovery Studio wrapper
  - `src/discovery-studio/v4/DiscoveryStudioV4.tsx`
  - actual discovery-framework content preserved; private wrapper ontology removed
- [x] Deal Workspace
  - `src/deal-workspace/lib/recovery.ts`
  - `src/deal-workspace/v4/lib/views.ts`
  - `src/deal-workspace/v4/lib/views.test.ts`
  - `src/deal-workspace/v4/DealWorkspaceV4.tsx`
  - risk score is no longer presented as a prediction of when a deal will be lost
- [x] Quota Workback
  - `src/quota-workback/lib/engine.ts`
  - `src/quota-workback/lib/engine.test.ts`
  - `src/quota-workback/v4/lib/pace.ts`
  - `src/quota-workback/v4/QuotaWorkbackV4.tsx`
  - projection is explicitly closed-won YTD + stage-weighted open pipeline; ACV-band benchmark is named; working-days field corrected
- [x] Settings visible surface
  - `src/settings/v4/SettingsV4.tsx`
  - cloud connection is no longer mislabeled as complete synchronization
  - export/delete controls now describe their current scope instead of claiming “everything”
  - **validation blocker:** export/delete scope is incomplete relative to the full workspace-scoped data model; see adversarial audit

## Tooling

- [x] Reproducible rendered-copy inventory builder
  - `tools/language-remediation/build-copy-inventory.js`
- [x] Copy-audit script exists
  - `tools/language-remediation/copy-audit.js`
- [x] npm commands exist
  - `copy:inventory`
  - `copy:audit`
- [ ] Copy audit wired into CI
- [ ] Copy-audit source scope confirmed to include every user-visible prompt/template source, including Supabase/edge generation sources

---

# Source implementation still required / adversarial follow-up

- [ ] Repo-wide residual sweep for deprecated user-visible language outside the primary migrated rooms
- [ ] Confirm Future Autopsy UI renders the specific evidence sentence from the generator rather than a generic placeholder
- [ ] Resolve or explicitly accept Settings export/delete scope mismatch before calling data controls validated
- [ ] Confirm no production prompt/template mirror remains on the old anti-uncertainty doctrine
- [ ] Review legacy/demo/mockup sources only where they feed the live rendered product; archived artifacts are not implementation targets by default
- [ ] Harden copy-audit scan roots and allowlist policy
- [ ] Wire copy audit into CI

---

# Validation before merge

- [ ] PR CI/typecheck/test pass on the current head
- [ ] inspect every failing/pending workflow rather than treating aggregate green as sufficient
- [ ] `npm run build:transcript`
- [ ] `npm run copy:inventory`
- [ ] `npm run copy:audit`
- [ ] manually classify Tier-2 warnings
- [ ] regenerate the full preview walkthrough
- [ ] verify room-at-rest and interaction-state copy for all primary rooms
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

**Phase 7 — residual source tracing + adversarial validation preparation.**

Primary room implementation is now broad enough that the next work is validation-led: current-head CI, residual source/doctrine sweep, linter scope/CI integration, rendered transcript regeneration, and unchanged saturation re-score. No source-implemented item is promoted to validated until those gates pass.
