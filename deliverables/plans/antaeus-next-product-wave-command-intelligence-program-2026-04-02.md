# Antaeus Next Product Wave: Command Intelligence Program

Date: 2026-04-02
Status: Proposed next product wave
Program type: Net-new capability on top of completed restructure

## 1. Recommendation

The next product wave should be:

`Command Intelligence + Workspace Health`

This is the right next wave because the restructure is now complete enough to support a real product advantage:

- the app now has a true front door
- command entry, room handoff, and return continuity are working
- rooms now share one family
- graph reward and pinned-context foundations already exist

So the next wave should stop changing shell behavior and start making the system smarter.

## 2. The Core Thesis

Antaeus should now get meaningfully better at two things:

1. deciding what belongs in `Brief`, `Spotlight`, and `Queue`
2. showing the user how their work is compounding across the system

That means the wave is not:

- another shell pass
- another room-face pass
- more aesthetic cleanup

It is:

- ranking intelligence
- explainability
- workspace health visibility
- stronger object memory

## 3. What This Wave Should Produce

By the end of this wave, the app should do four new things:

1. rank command objects with more believable logic
2. explain why an object is in the light or in the queue
3. reveal workspace compounding in a richer graph/health view
4. keep the carried object more alive inside rooms

## 4. User-Facing Outcomes

### 4.1 Dashboard feels smarter

The user should feel:

- `The app is not just reformatting data. It actually knows why this is the next thing.`

### 4.2 Spotlight feels earned

The user should feel:

- `I understand why this object got promoted.`

### 4.3 Queue feels trustworthy

The user should feel:

- `This order is defensible, not arbitrary.`

### 4.4 Graph reward feels meaningful

The user should feel:

- `I built a real operating system and the app can prove it.`

### 4.5 Rooms feel less lossy

The user should feel:

- `I am still on the same object, just deeper.`

## 5. Program Scope

### In scope

- dashboard ranking engine
- command-object scoring inputs
- spotlight and queue reasoning copy
- graph reward v2
- pinned-object v2
- workspace-health summaries

### Out of scope

- CRM integrations
- calendar/email integrations
- new modules
- role/seat model expansion
- advisor-team orchestration

## 6. Proposed Wave Structure

## Phase 1: Command Ranking Engine

Goal:

- stop relying on coarse ranking heuristics embedded in dashboard-only logic
- create a clearer command-object scoring model

Deliverables:

- new shared ranking helper module
- canonical command-object schema
- weighted scoring model
- reason list attached to each ranked object

Suggested new file:

- `js/command-intelligence.js`

Canonical command object fields:

- `id`
- `objectType`
- `title`
- `state`
- `riskScore`
- `staleDays`
- `heat`
- `qualityScore`
- `coverageImpact`
- `proofGapCount`
- `nextActionStrength`
- `roomHref`
- `sheetPayload`
- `score`
- `scoreReasons`

Scoring inputs:

- object staleness
- deal risk
- proof gaps
- lack of dated next step
- signal heat without motion
- ICP quality and downstream dependency
- quota/coverage pressure
- recency decay

Acceptance:

- every object in `Spotlight` and `Queue` has a real score
- every promoted object has at least 2-4 human-readable reasons
- rankings remain stable enough to trust but dynamic enough to respond

## Phase 2: Explainable Command Surfaces

Goal:

- make command logic legible without turning the UI into a report

Deliverables:

- compact `Why this is here` block in Spotlight
- compact `Why this order` evidence in Queue
- optional confidence / pressure tags
- tighter reason mapping in sheets

UI rules:

- no giant explanation panels
- reasons should be short and concrete
- explanation must justify promotion, not narrate the whole object

Examples:

- `47d stale + no dated next step + proof owner missing`
- `Heat 82 with no live motion`
- `Quota pressure makes this account more consequential this week`

Acceptance:

- user can tell why an object is highlighted in under 3 seconds
- explanation reduces doubt instead of adding more copy noise

## Phase 3: Graph Reward v2 / Workspace Health

Goal:

- turn the graph reward from a neat reveal into a meaningful health lens

Deliverables:

- richer graph node semantics
- density and thinness cues
- compounding summaries
- object-family health summaries
- optional highlight paths:
  - `ICP -> account -> signal -> motion`
  - `deal -> discovery -> proof -> advisor`

Important product rule:

- this remains a reward / reveal first
- it should not become the daily primary navigation surface

Graph v2 should answer:

- what is dense and alive
- what is thin and underbuilt
- which work is compounding
- where the system still breaks

Acceptance:

- graph tells a believable story of system maturity
- the user can identify at least one surprising compounding effect

## Phase 4: Pinned Context v2

Goal:

- make carried-object continuity stronger inside rooms

Deliverables:

- richer pinned-object strip
- optional room-local health cues
- short `why you are here` reasoning
- one downstream `after this` cue

Examples:

- `Pinned object: Vantive expansion`
- `Why here: no dated next step and proof still thin`
- `After this: return to Spotlight or move into PoC Framework`

Acceptance:

- rooms feel less like context resets
- users do not have to reconstruct why they entered the room

## Phase 5: Command Refresh and Return Logic

Goal:

- make returns from rooms feel smarter, not static

Deliverables:

- when returning to Dashboard, the originating object should still be selected when appropriate
- Spotlight and Queue should refresh ranking after key room actions
- stale selections should fall forward gracefully if the object was resolved

Acceptance:

- returning to Dashboard feels like continuation
- resolved objects do not awkwardly stay promoted if their pressure is gone

## 7. File-Level Starting Points

Primary files likely involved:

- `app/dashboard/index.html`
- `css/app.css`
- `js/shell-chrome.js`
- `js/deal-health.js`
- new `js/command-intelligence.js`

Secondary receiving-room touches:

- `app/deal-workspace/index.html`
- `app/future-autopsy/index.html`
- `app/signal-console/index.html`
- `app/poc-framework/index.html`

## 8. Implementation Order

Recommended execution order:

1. shared ranking engine
2. Dashboard consumes ranking engine
3. Spotlight / Queue explainability
4. graph reward v2
5. pinned context v2
6. return-refresh behavior

## 9. What To Build First

The first slice should be:

`Phase 1 + Phase 2 together`

Reason:

- if ranking is not upgraded first, graph v2 and pinned-context v2 are decorating a weaker underlying intelligence layer
- the highest-value move is making `Spotlight` and `Queue` more believable

## 10. Success Criteria For The Whole Wave

This wave is successful if:

- Spotlight feels smarter than it does today
- Queue order feels more defensible than it does today
- users can understand `why this / why now` quickly
- graph reward feels like a proof of compounding, not a novelty
- rooms retain object continuity more visibly

## 11. Recommendation On The Next Immediate Move

The next implementation step should be:

`Phase 1 spec + command-intelligence foundation`

Specifically:

1. define the shared command-object schema
2. define scoring weights and reason generation
3. extract ranking logic out of Dashboard-only inline heuristics
4. then wire Dashboard to consume it

That is the highest-value next product move.
