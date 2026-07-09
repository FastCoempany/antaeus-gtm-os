# Territory Architect — wire-to-production passes (2026-07-09)

Settled design: the axis-morphing floor (canon §4.5, 2026-07-03).
Surface: `src/territory-architect/v4/TerritoryArchitectV4.tsx` + scoped CSS.
Flag: default ON; kill-switch `room_territory_architect_v4_off`; hatches `?v4=0/1`.

## What shipped

- **Axis rail (6)** — geo / vertical / segment / named / trigger / blend. The
  carve axis is a variable: switching it morphs the room's register line, the
  carve form's field label + placeholder, and filters the divisions shown.
- **Charter rule enforced by the form, not by copy** — why-you required on
  every axis; why-now required ONLY on trigger carves (the `Carve it` button
  stays disabled until the axis's required set is filled). Structural carves
  show why-now as optional. Missing charters on existing divisions render an
  honest amber "not written yet" state; a trigger division missing why-now is
  called out ("a trigger division lives on this").
- **300-cap spine** — the shipped `allocation` computed drives a stacked bar
  (per-tier counts vs targets, over-target in red, remaining "open").
- **Field read** — the shipped `computeFieldRead` engine unchanged (band +
  main risk + operator move as one quiet strip).
- **Account drawer** — per-division accounts with disposition + retier via the
  shipped `setAccountDisposition` / `retierAccount`; disposition options carry
  plain labels (Working it / Paused / Won / Lost / Reroute), never raw enums.
- **Approaches ledger** + Fill-from-Prospecting handoff (continuity params).
- **GroundLine** mounted.

## Engine change (additive only)

`CarveAxis` type + optional `axis?` on `Focus`/`FocusDraft` (types.ts),
parser passthrough (persistence.ts), save-path carry (state.ts). Legacy rows
without an axis read as `"segment"` — no migration, no behavior change for
existing data. All 69 territory tests green.

## Pass 1 — mind & capability fidelity

- Axis malleability: PASS (6 axes, register morphs, form adapts) — the §4.5
  must-never-flatten "never hardcode one carve."
- Why-you charter on every division: PASS (required field + honest missing
  state).
- Why-now conditional on axis: PASS (required for trigger, optional otherwise
  — "the form adapts its ask so the operator never reads the rule").
- 300-cap + tier allocation: PASS (shipped engine, live re-read on retier).
- Tiers as resource-allocation: PASS (counts vs targets, over flagged).
- Field read / territory health: PASS (engine unchanged).
- Never a contact-list builder: PASS (no contact fields anywhere).

## Pass 2 — behavior / composition / voice

- One dominant move (Carve it, orange) per surface; drawer has none competing.
- Object before controls: the axis + spine + field read precede the form.
- Voice gate green (all prose `t(..., body)`); banned-word scan clean;
  disposition enums never shown raw.
- ≤3 dominant planes first fold (rail / spine+read / carve).

## Pass 3 — live runtime

Headless boot with 3 seeded divisions (geo/trigger/legacy-no-axis), 3
accounts, 1 approach: axis switching filters correctly (legacy row lands on
segment), trigger carve shows 2 required markers + disabled save, drawer
opens with 2 rows + plain labels + retier/disposition selects wired, ground
line present, **zero pageerrors**. Harness deleted after verify.

## Open items

- Fresh adversarial reviewer pass owed (batched with Wave B/C review).
