# Antaeus Anchor-Module Redesign Wave 4

Date: 2026-03-31

## Scope

Wave 4 focused on the proof-and-prep family:

- `app/discovery-agenda/index.html`
- `app/future-autopsy/index.html`
- `app/poc-framework/index.html`

## Design Goal

These surfaces should feel like decision boards, not bridge cards sitting on top of legacy forms.

The family job is:

- prepare the live meeting
- pressure-test the active deal
- build proof that survives the commercial motion after the pilot

## What Changed

### Call Planner / Discovery Agenda

- moved onto a shell-native meeting-prep board
- top layer now states:
  - current meeting context
  - one-session win
  - agenda quality
  - downstream handshake
- quality and handoff sections now use the shared shell language instead of local bridge cards

### Future Autopsy

- top layer now behaves like a pressure-testing board
- the module now answers timing first:
  - run now
  - run this week
  - periodic truth check
- the likely death pattern is surfaced before the deeper loss/win narrative
- stage examples now read as operating lanes instead of passive examples
- corrective moves now render as ranked next actions instead of a loose action row

### PoC Framework

- top layer now behaves like a proof operating board
- command band now states:
  - linked deal truth
  - proof standard
  - pressure point
  - one-session win
- the proof board now makes the commercial handshake explicit
- proof quality now renders as a shell-native proof-standard section instead of three standalone local cards

## Why This Wave Matters

This is the part of Antaeus that should make the product feel more serious than a generic revenue app.

- Call Planner should create a better meeting, not a better form
- Future Autopsy should convert fear into intervention, not just diagnosis
- PoC Framework should turn proof into commercial motion, not pilot theater

## Verification

- inline runtime syntax checks passed for:
  - `app/discovery-agenda/index.html`
  - `app/future-autopsy/index.html`
  - `app/poc-framework/index.html`

## Still Needed

- live browser validation on all 3 surfaces after deploy
- any remaining family-level spacing or copy polish after real use

## Outcome

Wave 4 gives Antaeus a coherent proof-and-prep family:

- meeting prep
- risk diagnosis
- proof construction

The modules now speak the same behavioral design language as the shell and the earlier anchor waves.
