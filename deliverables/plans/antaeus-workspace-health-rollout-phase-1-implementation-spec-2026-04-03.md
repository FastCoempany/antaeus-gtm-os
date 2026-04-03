# Antaeus Workspace Health Rollout Phase 1 Implementation Spec
Date: 2026-04-03
Status: Approved for implementation
Phase: 1

## Scope
Implement the first deep-room workspace-health slice in:

- `app/deal-workspace/index.html`
- `app/signal-console/index.html`
- shared styling in `css/app.css`

## Guardrails
Must not change:

- room methodology
- room primary workflows
- cross-room routing
- room-entry bridge behavior
- command architecture

Must do:

- use real room state only
- keep health surfaces compact
- make weak links legible
- make compounding legible

## Behavioral objective
The user should understand in under 5 seconds:

- what is healthy here
- what is still weak
- why the room matters now

without reading a paragraph-heavy explanation.

## Deal Workspace surface

Show:

- a compact `Workspace health` section
- board posture / recovery pressure / weighted truth / top threading metrics
- `What compounded`
- `Weak links still visible`

Data sources:

- active deals
- weighted pipeline
- recovery queue
- qualification
- threading
- dated next step truth

## Signal Console surface

Show:

- a compact `Workspace health` section
- heat posture / ready accounts / high-confidence signals / reply/deal linkage
- `What compounded`
- `Weak links still visible`

Data sources:

- heat metrics
- active/recent signals
- top account execution context
- next move

## UI rules

- one health section per room
- no nested card soup
- use a small metric row plus two compact narrative lists
- weak links must be concrete, not generic
- compounding must be concrete, not self-congratulatory

## Acceptance

- `Deal Workspace` health reads like pipeline truth, not a report
- `Signal Console` health reads like motion readiness, not a report
- no room workflow is displaced
- no strategic copy is diluted
