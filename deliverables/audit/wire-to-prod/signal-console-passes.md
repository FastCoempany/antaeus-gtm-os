# Signal Console — wire-to-production adversarial passes

**Room:** Signal Console (Wave B / 1) · **PROTECTED** · surface `src/signal-console/v4/` · flipped to default in `src/signal-console/main.tsx` (kill-switch `room_signal_console_v4_off`, preview `?v4=1`).
**Settled design:** `deliverables/mockups/signal-console-attention-router-2026-07-04.html` · **Capability map:** `deliverables/room-capability-maps/signal-console-capability-map-2026-07-07.html`
**Reviewer:** author verification + fresh adversarial subagent (running). Date 2026-07-08.

## Result: GO (author verification); fresh-reviewer (protected room) in flight

Net-new build. The heat engine (`heat`/`recency`/`rankByHeat`), account+signal CRUD, `buildManualAccount`, enrichment (`runEnrichAll`), execution-context (temperature), and handoff builders are **reused unchanged** — this surface is the band classifier + presentation.

### Pass 1 — Mind & Capability Fidelity (author)
- The whole watched field at once, grouped by **where attention should go**: `buildAttentionField` classifies each account into act now / reach while warm / emerging / going cold from **heat × freshness** (reusing `heat()`), ranks within each band by heat, and reads the shape / posture / health. A brand-new watch (no signals) lands in **Emerging**, never Going cold — as the mockup promises.
- Account-to-motion preserved: each chip's action rack routes via the shipped handoff builders (Compose/Research/Plan call/Cold call/Open deal) with continuity params. Add-account (composer → `buildManualAccount` + `upsertAccount`), add-signal (`addSignalToAccount`), stop-watching (`removeAccount`), enrich-all, search — all wired to the real engines. Not a badge list.

### Pass 2 — Behavior, Composition & Voice (author)
- Faithful port of the mockup (posture pill, shape strip, band-colored chips, expand-in-place). Every string through `t()`; zero banned words (scan clean). ≤3 planes; the one dominant move per chip (the orange Compose/Research).

### Pass 3 — Live-Runtime Adversarial (author)
- Boots clean (0 pageerrors) with a seeded field; classification verified across all four bands + the empty-workspace state ("No accounts watched yet…"). Defensive date parsing in `freshestDays`; heat computed, never stored. 7/7 attention tests, typecheck clean.

## Ship state
Flipped to default with `room_signal_console_v4_off` kill-switch. Protected-room reviewer running; any confirmed findings get a follow-up fix commit.
