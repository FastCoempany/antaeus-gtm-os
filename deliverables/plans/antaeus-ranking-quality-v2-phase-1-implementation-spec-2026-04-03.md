# Antaeus Ranking Quality v2 Phase 1 Implementation Spec
Date: 2026-04-03
Status: Active
Phase: 1 of Ranking Quality v2

## Objective
Improve ranking quality inside the locked command stack by making the shared engine score pressure more intelligently and recover command state more stably.

## Files in scope

- `js/command-intelligence.js`
- `app/dashboard/index.html`

## Locked constraints

Do not change:

- `Brief / Spotlight / Queue`
- room-entry bridge
- pinned context
- graph reward behavior
- module methodology
- GTM frameworks
- sheet / room routing

## Phase 1 changes

### 1. Shared ranking engine
Add stronger ranking inputs in `js/command-intelligence.js`:

- deal size / amount pressure when present
- champion uncertainty
- next-step decay
- proof thinness / truth debt
- action readiness
- dependency warning pressure
- family-aware leverage pressure

### 2. Stability logic
Use the prior Dashboard snapshot to reduce thrash:

- previous Spotlight leader gets a bounded stability bonus
- recent top-ranked objects get a smaller continuity bonus
- the leader can still change when a new object clearly outranks it

### 3. Confidence output
Each ranked object should expose:

- `rankingConfidence`
- `rankingConfidenceLabel`

Initial labels:

- `stable lead`
- `supported`
- `mixed signal`

### 4. Dashboard consumption
Dashboard should:

- pass prior snapshot context into the engine
- persist spotlight and queue identity back into the snapshot
- surface the confidence label compactly in selected command object meta
- keep current routing, return logic, and sheet behavior unchanged

## Acceptance criteria

- command ranking feels more stable
- spotlight does not churn on near-ties
- queue order feels more defensible
- selected object explanation still fits compactly on the surface
- reload and return logic still work
- no room actions or command modes regress

## Test plan

1. Open `dashboard?mode=spotlight`
2. Confirm a believable spotlight winner
3. Confirm confidence label appears in selected-object meta
4. Switch to `queue`
5. Confirm ranked order feels coherent
6. Enter a room and return
7. Confirm selected object continuity still works
8. Reload Dashboard and confirm state recovery still behaves correctly
