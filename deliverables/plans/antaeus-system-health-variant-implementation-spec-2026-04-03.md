# Antaeus System Health Variant Implementation Spec
Date: 2026-04-03
Status: Active
Owner: Codex / Antaeus product wave

## Purpose
Add a distinct `System health` variant to the rooms that already operate on score, coverage, and execution math.

This is not the same pattern as the compact deep-room `Workspace health` block.

## Rooms in scope
- `app/readiness/index.html`
- `app/quota-workback/index.html`

## Why a distinct variant
These rooms already have native top-of-screen intelligence:

- `Readiness Score` already computes strongest dimension, weakest dimension, and unlock logic
- `Quota Workback` already computes coverage posture, benchmark fit, and activity pressure

Adding the same compact room-health pattern would be redundant and would make these rooms heavier instead of clearer.

## Variant rules
Use:

- kicker: `System health`
- room-specific title language
- 4 compact system-native metrics
- 2 short `Carrying the system` or `Holding`
- 2 short `Still fragile`

Do not:

- duplicate the full score explanation
- duplicate the full quota plan math
- restate the room’s entire methodology
- turn the section into another report block

## Readiness Score implementation
Placement:
- inside the first fold
- below `#scoreStory`

Metrics:
- `System posture`
- `Dimensions live`
- `Top drag`
- `Reference proof`

Compounding signals should be derived from:
- overall readiness score / verdict
- momentum dimension count
- strongest dimension
- wins and documented system proof

Fragility signals should be derived from:
- weakest dimension
- top unlock / top misses
- low momentum dimension count
- low referenceable proof

## Quota Workback implementation
Placement:
- inside the first fold
- below the coverage block

Metrics:
- `Plan posture`
- `Coverage`
- `Touches / week`
- `Pressure fit`

Compounding signals should be derived from:
- quality score / quality band
- coverage ratio
- benchmark-fit assumptions
- believable account pressure

Fragility signals should be derived from:
- low coverage ratio
- custom assumptions drifting from benchmark
- overly high daily pressure / active account load
- low quality score

## Acceptance criteria
- both sections appear in the first fold
- both feel system-native, not like cloned deep-room health
- burden stays compact
- no room math or score logic changes
- no routing or shell behavior changes
