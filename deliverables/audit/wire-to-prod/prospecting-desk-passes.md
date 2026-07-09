# Prospecting Desk — wire-to-production passes (2026-07-09)

Settled design: the Funnel (canon §4.6, F1, 2026-07-04).
Surface: `src/sourcing-workbench/v4/ProspectingDeskV4.tsx` + scoped CSS.
Flag: default ON; kill-switch `room_prospecting_desk_v4_off`; hatches `?v4=0/1`.
Face name: **Prospecting Desk**; served path stays `/sourcing-workbench/`
until the full path-rename sweep (canon §4.6 note).

## What shipped

- **The Funnel, one flow top to bottom** — FIND (describe who you want →
  the search is kept; saved searches counted by how many companies were
  added from each; add-a-company composer with search attribution) →
  CONFIRM (the three plain questions in a working center panel) → SEND
  (per-account, one click, delivered — never a batch).
- **The honesty rule enforced** — the desk claims NO live web search it
  doesn't run. No fake "Antaeus searched the web" theater; the copy says
  the desk keeps the search and the operator adds what it turns up. When
  the discovery Edge Function lands (the Outdoors Events ADR-016 pattern),
  the Find stage upgrades to the cited live sweep the mind describes.
- **Confirm is a real, visible step** — the three questions map to the
  engine's own fields (targeting fit → `notes` · way in → `entryPoint` ·
  how we'll reach out → `approach`), which are exactly the fields the
  shipped quality engine already credits. The send button stays disabled
  until all three are answered; the footer names what's still missing.
- **Send actually delivers** — a new additive `src/signal-console/lib/
  inbound-queue.ts` (`gtmos_sc_inbound_v1`): the desk enqueues; Signal
  Console's boot drains the queue AFTER cloud persistence resolves,
  creating each account through its own canonical `buildManualAccount` +
  `saveAccount` path. This avoids the false-delivery trap: a direct
  `gtmos_sc_v4` append would be clobbered when SC's cloud boot replaces
  local state. Dedupe by name at both ends; 5 unit tests.
- Who-to-target guidance (focus-aware); set-aside-with-reason; ready rail
  + already-sent list with links into Signal Console; desk read from the
  shipped loom-read engine (§13-scrubbed at source); where-this-fits flow
  strip; GroundLine.

## Language scrub at engine source

`loom-read.ts` week-read + operator-move strings carried banned insider
vocabulary ("the bench", "names", "capture", "QueryStudio", "pushable") —
rewritten in funnel voice + declared through `t()`; loom-read + DS-adapter
tests re-pointed. Quality-engine strings (which say "leverage") are NOT
rendered by this surface — completion is computed from the three question
fields directly, so the engine stays untouched.

## Pass 1 — mind & capability fidelity

- Confirm as the guard on Signal Console: PASS (three questions gate the
  send; nothing crosses without them).
- Honesty of the search: PASS (no vendor-feed claim, no pretend search).
- Who-to-target guidance: PASS. Stage lifecycle + counts per stage: PASS.
- Send → Signal Console truly delivers: PASS (queue verified end-to-end:
  send wrote `{"queue":[{"name":"Vanta",...}]}`; SC drain wired in boot).
- Never a filing cabinet: PASS (the funnel moves; set-aside exits).

## Pass 2 — behavior / composition / voice

- One dominant move: the orange Send (disabled until confirmed). Voice
  gate green; banned-word scan clean (only the deleted preview harness's
  engine field names matched).

## Pass 3 — live runtime

Headless end-to-end: boot with 2 searches + 4 prospects → band "Working" +
counts; click Vanta → "quality 80 · 1 question left", send disabled;
answer Q3 → "quality 92 · confirmed", send enabled; send → toast, queue
row written, Vanta appears under "Already sent"; zero pageerrors. Harness
deleted after verify.

## Open items

- Fresh adversarial reviewer pass owed (next batch).
- Full `/sourcing-workbench/` → `/prospecting-desk/` path rename deferred
  (cross-room href sweep; face already renamed).
- The cited live web-research backend (run-on-demand + auto-watches) is a
  future Edge Function per the ADR-016 pattern — the Find stage is built
  to absorb it without restructuring.
