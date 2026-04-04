# Antaeus Workspace Health Rollout Upstream Truth Slice Implementation Spec
Date: 2026-04-03
Status: Active
Owner: Codex / Antaeus product wave

## Purpose
Extend the compact `Workspace health` pattern into the upstream truth rooms without changing:

- GTM frameworks
- room methodologies
- room routing
- shell hierarchy
- downstream module logic

This slice is about making upstream truth visible where targeting and territory pressure are actually shaped.

## Rooms in scope
- `app/icp-studio/index.html`
- `app/territory-architect/index.html`

## Why these rooms
These rooms sit upstream of sourcing, signal work, outbound, and deal creation.

They should expose:
- what is getting sharper
- what is still too thin
- whether the room is producing real downstream operating value

without turning into analytics dashboards.

## Surface rules
Use the existing compact room-health pattern:

- kicker: `Workspace health`
- title: `See what is compounding and what is still weak.`
- 4 compact room-native metrics
- 2 short `Compounding` items
- 2 short `Still weak` items

Do not:
- add charts
- add new tabs
- add report-style prose
- duplicate Dashboard graph logic

## ICP Studio implementation
Placement:
- inside the first-fold wrapper
- below `#icpShellBand`
- above the operating board

Metrics:
- `Wedge posture`
- `Active fit`
- `Saved proofs`
- `Worked loops`

Compounding signals should be derived from:
- ICP quality tier / score
- active account count
- saved ICP analytics
- worked ICP analytics
- buyer / trigger / proof specificity

Weak-link signals should be derived from:
- low-quality or forming wedge state
- no active-account volume
- missing buyer / trigger / proof specificity
- top quality checks that still fail

## Territory Architect implementation
Placement:
- in the main app view
- below the shell band and tabs
- above the cockpit / territory / intelligence / manage views

Metrics:
- `Territory posture`
- `Active theses`
- `Live accounts`
- `Progression`

Compounding signals should be derived from:
- active theses
- active approaches
- active accounts
- signals and progressing dispositions
- thesis progression rate

Weak-link signals should be derived from:
- no saved ICP anchor
- no theses or no approaches
- thin account count
- poor progression rate
- no signals or stale battlefield evidence

## Acceptance criteria
- health surface appears near the top of both rooms
- burden stays compact and scannable
- `Compounding` / `Still weak` language matches the rest of the rollout
- room workflows remain unchanged
- health logic is fed by real room state, not placeholder text

## Follow-on decision
After this slice:
- run a short acceptance pass on both rooms
- then decide whether `Readiness` and `Quota Workback` should use the same compact room-health pattern or a distinct system-health variant
