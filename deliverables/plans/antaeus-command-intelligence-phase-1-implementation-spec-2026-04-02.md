# Antaeus Command Intelligence Phase 1 Implementation Spec

Date: 2026-04-02
Phase: Next product wave, Phase 1
Status: Ready for implementation

## Objective

Build the shared command-ranking foundation that will drive:

- `Brief`
- `Spotlight`
- `Queue`

from one explicit scoring model instead of Dashboard-only inline heuristics.

This phase does **not** redesign the UI again. It upgrades the intelligence layer under the locked command stack.

## What This Phase Must Achieve

By the end of Phase 1:

1. Dashboard command objects come from a shared ranking module.
2. Each command object has a real score.
3. Each command object has short reason strings that explain promotion.
4. Dashboard no longer owns the ranking logic inline.
5. Existing UI behavior remains intact:
   - no room links break
   - no sheet links break
   - no command modes break

## Out Of Scope

- graph reward v2
- pinned-object v2
- new modules
- visual redesign
- changing the locked `Brief / Spotlight / Queue` interaction model

## Primary Files

### New

- `js/command-intelligence.js`

### Existing

- `app/dashboard/index.html`
- `js/deal-health.js`

## Architectural Decision

The ranking engine will be introduced as a shared browser module on `window`, similar in spirit to other shared app helpers.

Suggested public API:

```js
window.gtmCommandIntelligence = {
  buildCommandObjects,
  rankCommandObjects,
  summarizeCommandContext
};
```

## Canonical Command Object Schema

Each ranked object should normalize into this shape:

```js
{
  id: string,
  objectType: 'deal' | 'signal' | 'icp' | 'motion' | 'system',
  title: string,
  copy: string,
  badge: string,
  badgeTone: string,
  metricLabel: string,
  metricValue: string,
  meta: string[],
  actions: Array<{ href: string, label: string, tone?: string, roomLabel?: string }>,
  sheetPayload: object | null,
  focusObject: string,
  focusRoom: string,
  score: number,
  scoreReasons: string[],
  commandFamily: string,
  stateKey: string,
  source: object
}
```

## Ranking Inputs

The initial scoring model should use the data already available in the app.

### Deal pressure inputs

- risk score
- stale days
- no dated next step
- no champion
- no process
- weak proof posture
- late-stage fragility

### Signal pressure inputs

- heat
- no live motion yet
- no linked deal
- no angle yet

### ICP pressure inputs

- missing or weak ICP when downstream modules are active
- quality score
- connection to sourcing / territory pressure

### System pressure inputs

- coverage gap
- quota pressure
- sync warnings
- activation incompleteness if still relevant

## Initial Weighting Model

This is the recommended Phase 1 starting model.

### Deal objects

- `riskScore * 0.45`
- `staleDays * 1.25`
- proof-gap bonus: `+18`
- no-dated-next-step bonus: `+14`
- no-champion bonus: `+12`
- no-process bonus: `+10`
- late-stage fragility bonus: `+8`

### Signal objects

- `heat * 0.7`
- no-live-motion bonus: `+18`
- no-linked-deal bonus: `+10`
- no-angle bonus: `+10`

### ICP objects

- missing ICP while deals/signals exist: `+26`
- weak quality band bonus: `+12`
- territory dependency bonus: `+8`

### System objects

- coverage pressure bonus: `+18`
- sync warning bonus: `+10`
- activation-stage gap bonus: `+12`

These weights are not sacred. They are the Phase 1 starting point.

## Reason Generation Rules

Every command object should emit 2-4 short reasons.

Good examples:

- `47d stale`
- `no dated next step`
- `proof owner missing`
- `heat 82 with no live motion`
- `coverage below target`

Bad examples:

- long paragraphs
- vague labels like `important`
- reasons that repeat the title

Suggested helper:

```js
function buildScoreReasons(object) => string[]
```

## Output Responsibilities

### `buildCommandObjects(context)`

Input:

- normalized dashboard context
- deals
- signal state
- ICP state
- quota state
- activation state

Output:

- raw command object candidates before sorting

### `rankCommandObjects(objects)`

Input:

- raw command object candidates

Output:

- sorted objects with:
  - `score`
  - `scoreReasons`
  - stable ordering

### `summarizeCommandContext(objects)`

Input:

- ranked objects

Output:

- top object
- queue list
- supporting aggregates for dashboard summary text if needed

## Dashboard Refactor Plan

Current problem:

- Dashboard currently builds command objects and ranking inline.
- This makes future ranking work brittle and encourages drift.

Phase 1 refactor order:

1. create `js/command-intelligence.js`
2. load it in [dashboard](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
3. move command-object assembly into shared functions
4. move ranking logic into shared functions
5. keep existing UI renderers:
   - `renderDashboardSpotlight(...)`
   - `renderDashboardQueueMode(...)`
   - `buildGenericCommandSheet(...)`
6. make those renderers consume ranked command objects instead of building intelligence themselves

## Stability Rules

Phase 1 must preserve:

- `Inspect` behavior
- room-entry URLs
- return-context params
- graph reward trigger
- pinned-object continuity
- command mode URL behavior

This phase is successful only if the UI looks the same or better while the ranking logic becomes more rigorous.

## Suggested Implementation Steps

1. Create `js/command-intelligence.js`
2. Add lightweight helpers:
   - `clampScore`
   - `pushReason`
   - `normalizeBadgeTone`
3. Implement candidate builders:
   - deals
   - signals
   - ICP
   - system pressure
4. Implement score calculation
5. Implement reason generation
6. Implement rank sorting with stable tie-breaks
7. Load the module in Dashboard
8. Swap Dashboard to consume ranked objects
9. Verify no UI or routing regressions

## Acceptance Criteria

Phase 1 is complete when:

1. `Dashboard` uses the shared command-intelligence module.
2. `Spotlight` and `Queue` render from ranked shared objects.
3. each promoted object has `scoreReasons`.
4. `Brief` can access the same ranked object list.
5. all current handoff behavior still works.
6. there are no new visual regressions.

## Test Plan

### Functional

- open `Brief`
- open `Spotlight`
- open `Queue`
- compare the top highlighted object across modes
- click `Inspect`
- enter a room
- return back

### Behavioral

- the top object should feel more defensible
- queue order should feel less arbitrary
- no object should appear promoted without at least 2 clear reasons

### Regression

- graph reward still opens
- direct room actions still carry return context
- onboarding still routes into Spotlight

## Recommended Immediate Next Move

Implement this spec directly:

1. create `js/command-intelligence.js`
2. wire Dashboard to consume it
3. stop only if the ranking output becomes visibly worse than the current heuristic ordering

That is the correct start to the next product wave.
