# Antaeus Phase 7 Nav Re-architecture Implementation Spec

Date: 2026-04-03  
Status: canonical implementation spec for `Phase 7 - Nav Re-architecture`  
Parent blueprint: [antaeus-full-restructure-blueprint-2026-04-02.md](./antaeus-full-restructure-blueprint-2026-04-02.md)  
Required preflight: [antaeus-phase-7-preflight-behavioral-copy-burden-audit-and-disclosure-matrix-2026-04-02.md](./antaeus-phase-7-preflight-behavioral-copy-burden-audit-and-disclosure-matrix-2026-04-02.md)

## 1. Purpose

This document is the step-by-step, substep-by-substep, and dependency-by-dependency source of truth for executing Phase 7.

Phase 7 is the shell-level completion of the broader restructure.

Its job is to:
- finish replacing hallway navigation with command-first access
- make the shell obey the behavioral psychology work already locked
- reduce copy burden and destination competition
- keep the deep rooms fully intact
- protect the brain and soul of the product while the shell changes around them

This is not a room rewrite spec.
This is not a methodology rewrite spec.
This is not a GTM-framework rewrite spec.

It is a shell and disclosure re-architecture spec.

## 2. Research and Planning Backbone

The following files are part of the backbone supporting Phase 7:

- [antaeus-full-restructure-blueprint-2026-04-02.md](./antaeus-full-restructure-blueprint-2026-04-02.md)
- [antaeus-phase-7-preflight-behavioral-copy-burden-audit-and-disclosure-matrix-2026-04-02.md](./antaeus-phase-7-preflight-behavioral-copy-burden-audit-and-disclosure-matrix-2026-04-02.md)
- [antaeus-shell-redesign-spec-2026-03-31.md](./antaeus-shell-redesign-spec-2026-03-31.md)
- [antaeus-architecture-reset-production-program-2026-04-01.md](./antaeus-architecture-reset-production-program-2026-04-01.md)
- [phase-46-cross-module-compounding-rules-2026-03-26.md](./phase-46-cross-module-compounding-rules-2026-03-26.md)
- [antaeus-architecture-restructure-research-brief-2026-03-31.pdf](../research/architecture-reset/antaeus-architecture-restructure-research-brief-2026-03-31.pdf)
- [antaeus-architecture-restructure-research-brief-source-2026-03-31.md](../research/architecture-reset/antaeus-architecture-restructure-research-brief-source-2026-03-31.md)
- [antaeus-architecture-restructure-research-review-2026-03-31.md](../research/architecture-reset/antaeus-architecture-restructure-research-review-2026-03-31.md)

Important rule:
- the PDF and the supporting markdown research docs are part of the program backbone
- the markdown docs remain the execution-friendly working references because they are diffable and easier to cite
- when the PDF and markdown source are materially aligned, treat them as one research basis, not competing truths

## 3. Phase 7 Outcome

When Phase 7 is complete:

- command is unambiguously the front door
- the old left rail no longer behaves like the app’s primary organizing logic
- rooms are still fully reachable, but as secondary or contextual access
- shell hierarchy expresses behavioral psychology, not hallway democracy
- copy burden is reduced without deleting methodology
- deep rooms remain strategically serious and intact
- compounding logic and connective tissue remain fully protected

In practical product terms:

- the user opens into command
- the user is steered by pressure, continuity, and the next move
- room access feels available but not demanding
- utilities do not compete with command
- the shell feels like one operating system, not a room menu

## 4. Non-Negotiable Rules

The following rules are hard constraints for all Phase 7 work.

### 4.1 Allowed to Change

- shell hierarchy
- room rail visibility and emphasis
- grouping and labeling of room access
- utility placement
- shell copy burden
- disclosure timing
- command-first re-entry behavior
- contextual room access patterns
- whether the room inventory is always visible or summoned

### 4.2 Forbidden to Change

- GTM frameworks
- module substance
- methodology
- strategic seriousness
- product thesis
- compounding rules
- room-internal decision logic unless strictly required for continuity safety

### 4.3 Protected Named Assets

These must remain explicit and premium:

- `Signal Console`
- `Future Autopsy`

## 5. Phase 7 Work Model

Phase 7 must be executed in the following order:

1. preflight outputs
2. non-production shell proof
3. shared-shell infrastructure changes
4. production shell rollout in narrow slices
5. cross-room validation
6. final acceptance

This phase may not be executed as one large blind replacement.

## 6. Deliverables

Phase 7 produces the following artifacts:

1. this implementation spec
2. a copy burden inventory
3. a shell/nav prototype or proof surface
4. shared shell infrastructure patches
5. production rollout patches
6. a Phase 7 acceptance memo or closeout summary

## 7. Execution Sequence

## 7A. Preflight Completion

This stage is complete only when the preflight is treated as binding.

### Step 7A.1 - Lock governing chain

The team must explicitly treat the following chain as authoritative:

1. research brief PDF and source markdown
2. restructure blueprint
3. Phase 7 preflight
4. this implementation spec

### Step 7A.2 - Freeze forbidden edits

Before any shell code changes:

- no room methodology rewrites
- no strategic copy deletions without classification
- no compounding-path rewrites
- no renaming of protected assets into generic labels

### Step 7A.3 - Produce copy burden inventory

Inventory these surface classes:

- `welcome`
- `dashboard`
- `sheet`
- room-entry bridge
- pinned context strip
- room rail
- utility / trust / recovery areas
- first fold of each deep room family

For each text block, tag:

- keep
- compress
- move to sheet
- move deeper into room
- move to methodology/help
- gate
- remove

### Step 7A.4 - Produce module preservation matrix signoff

For each module family, explicitly record:

- protected strategic core
- acceptable disclosure changes
- forbidden reductions

### Step 7A.5 - Produce connective tissue verification list

Confirm that each of the following remains protected:

- `returnTo`
- `returnLabel`
- `focusObject`
- `focusRoom`
- `fromMode`
- `fromSurface`
- room-entry bridge
- pinned context
- return selection continuity
- compounding state flows from Phase 46

Acceptance for 7A:
- Phase 7 does not proceed until 7A.1 through 7A.5 exist and are explicit

## 7B. Shell/Nav Proof Surface

This stage happens before production shell replacement.

### Step 7B.1 - Build proof artifact

Create a browser-loadable shell proof that demonstrates:

- command as primary
- room rail as secondary
- utilities as tertiary
- reduced room competition
- copy burden reduced according to the preflight

### Step 7B.2 - Test shell behaviors

The proof must answer:

- how the user re-enters command
- how the user reaches rooms
- how the user reaches settings/recovery/help
- how room families are grouped
- whether the room inventory is persistent, collapsible, or summoned

### Step 7B.3 - Validate psychology fit

The proof must clearly satisfy:

- lower cognitive load
- one dominant next move
- reduced hallway democracy
- preserved room seriousness
- visible unresolved pressure

Acceptance for 7B:
- the shell proof reads as the behavioral completion of the restructure
- it does not read like “sidebar but nicer”

## 7C. Shared Shell Infrastructure

This stage changes shared shell code, not room substance.

Primary files in scope:

- [js/nav.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js)
- [js/shell-chrome.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/shell-chrome.js)
- [css/app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)

### Step 7C.1 - Define shell hierarchy in code

The shell must formally distinguish:

- command entry
- room access
- utility access

This distinction must be structural, not just visual.

### Step 7C.2 - Rebuild room rail role

The room rail must become:

- secondary
- quieter
- grouped by family or context
- possibly collapsible or summoned

The room rail must stop behaving like:

- the first place the user is supposed to browse

### Step 7C.3 - Separate utility access

Utilities must not compete with rooms or command.

Utilities include:

- settings
- backup/export
- support/help
- account/workspace/system actions

### Step 7C.4 - Normalize shell re-entry

Re-entry paths must favor:

- `Spotlight`
- `Week One`
- command surfaces

over:

- default room-browsing behavior

Acceptance for 7C:
- the shell hierarchy exists in code
- room access no longer competes equally with command
- utility is visibly separate

## 7D. Production Slice 1: Command Surfaces

Primary pages:

- [app/welcome/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)
- [app/dashboard/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)

### Step 7D.1 - Align entry shell to proof

The production command surfaces must inherit the approved shell structure from 7B.

### Step 7D.2 - Reduce room competition on command pages

On command surfaces:

- room rail should be less visually and behaviorally demanding than command
- command should remain the obvious first action

### Step 7D.3 - Reduce command-page copy burden

Only keep visible text that helps:

- re-entry
- selection
- trust
- next move

Move or compress the rest according to the preflight.

Acceptance for 7D:
- opening Welcome or Dashboard feels like entering command, not entering a module list

## 7E. Production Slice 2: Room-Side Shell Convergence

Apply the new shell hierarchy across already migrated room families without rewriting their substance.

Target room families:

- intelligence
- territory / sourcing
- motion
- calls / discovery
- pipeline
- synthesis / system

### Step 7E.1 - Apply new shell access behavior

Rooms must inherit the updated shell hierarchy without losing:

- bridge
- pinned context
- return behavior
- seriousness

### Step 7E.2 - Reduce shell-level explanatory burden

Room first folds should keep:

- object continuity
- room purpose
- next serious move

They should shed:

- duplicated shell explanations
- hallway-era orientation copy

Acceptance for 7E:
- all rooms feel like secondary destinations reached from one operating system

## 7F. Production Slice 3: Copy Burden and Disclosure Migration

This is the text redistribution stage, not a visual cleanup stage.

### Step 7F.1 - Command copy compression

Reduce command text to:

- what changed
- what matters now
- what to do next

### Step 7F.2 - Sheet copy tightening

Reduce sheet text to:

- why now
- what is missing
- why this room
- what compounds

### Step 7F.3 - Room first-fold compression

Ensure room first fold only carries:

- continuity
- room purpose
- setup cues
- immediate seriousness

### Step 7F.4 - Methodology relocation

Move deeper explanation into:

- deeper room sections
- summoned methodology/help surfaces
- contextual guidance

Acceptance for 7F:
- copy burden is lower
- methodology is still fully present where it belongs

## 7G. QA and Acceptance

This stage is required before Phase 7 is considered complete.

### Step 7G.1 - Core path QA

Verify:

- `Welcome -> Spotlight`
- `Spotlight -> Inspect -> Enter room -> Back`
- direct room exits from command surfaces
- onboarding re-entry
- return continuity
- pinned context continuity

### Step 7G.2 - Shell hierarchy QA

Verify:

- command always reads as primary
- room rail reads as secondary
- utilities read as tertiary
- no room family disappears or becomes hard to reach

### Step 7G.3 - Substance preservation QA

Verify:

- no GTM framework was weakened
- no methodology was deleted instead of relocated
- no compounding rule was broken
- no protected room lost its seriousness

### Step 7G.4 - Behavioral QA

Verify the shell now better expresses:

- lower menu burden
- stronger command re-entry
- clearer unresolved pressure
- fewer equal-weight destination choices
- less path resistance

Acceptance for 7G:
- the shell is behaviorally right
- the room brains remain intact

## 8. Files Likely In Scope

Shared shell files:

- [js/nav.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js)
- [js/shell-chrome.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/shell-chrome.js)
- [css/app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)

Primary entry surfaces:

- [app/welcome/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)
- [app/dashboard/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [app/onboarding/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/onboarding/index.html)

Room families affected only at shell/disclosure level:

- all authenticated deep-room surfaces already migrated into the shared room family

## 9. Files Explicitly Out of Scope for Substantive Rewrite

These files may receive shell-entry or disclosure adjustments, but their strategic core may not be rewritten under Phase 7:

- [app/signal-console/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/signal-console/index.html)
- [app/future-autopsy/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/future-autopsy/index.html)
- [app/discovery-studio/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-studio/index.html)
- [app/discovery-agenda/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-agenda/index.html)
- [app/deal-workspace/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html)
- [app/poc-framework/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html)
- [app/advisor-deploy/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/advisor-deploy/index.html)
- [app/icp-studio/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/icp-studio/index.html)
- [app/territory-architect/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/territory-architect/index.html)
- [app/sourcing-workbench/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/sourcing-workbench/index.html)
- [app/outbound-studio/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/outbound-studio/index.html)
- [app/cold-call-studio/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/cold-call-studio/index.html)
- [app/linkedin-playbook/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/linkedin-playbook/index.html)
- [app/quota-workback/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/quota-workback/index.html)
- [app/readiness/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/readiness/index.html)
- [app/founding-gtm/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html)

## 10. Phase 7 Definition of Done

Phase 7 is complete only if:

1. command is clearly the primary organizing logic of the app
2. room rail no longer behaves like a hallway of equal-weight destinations
3. utilities are structurally separated from command and room access
4. copy burden is reduced according to the preflight
5. methodology remains intact, only redistributed
6. deep rooms remain strategically serious
7. compounding logic and connective tissue remain intact
8. the shell feels behaviorally aligned with the research backbone

## 11. Immediate Next Move

The next correct move after writing this spec is not broad production patching.

It is:

1. execute `7A.3` through `7A.5`
2. then build the `7B` proof surface
3. then review that proof before any wide production shell replacement

That keeps Phase 7 disciplined and protects the product’s core.
