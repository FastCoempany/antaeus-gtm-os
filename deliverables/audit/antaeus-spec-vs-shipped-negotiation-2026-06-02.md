# Negotiation spec-vs-shipped audit

**Audited:** 2026-06-02
**Baseline:** Canon §4.16b (Negotiation — Live Instrument placeholder rebuilt under Phase 4 / Room 18 doctrine) + Phase 2 navigation rubric (`deliverables/audit/navigation-rubric-2026-05.md`) + Sarah Chen visitor persona
**Auditor:** Claude (B-arc completion — spec-vs-shipped batch)

> **Note on baseline.** Negotiation is a Phase 4 inline rebuild (PR #109, 2026-05-18). Founder directive at the time: "no triptych exploration needed." Designed against the canon §4.16b mind + the Phase 2 navigation rubric. This audit compares the shipped Preact room against those two sources.

---

## Mind preservation — PASS

Canon §4.16b (Negotiation) preserved end-to-end:

- ✅ **"Routed ask" framing**, mirroring Advisor Deploy. The room is structured as `(deal × counterparty × ask_moment × concession_ladder) → routed line`. The components map:
  - `RouteRack.tsx` — counterparty (6-option: CFO / Procurement / Legal / GC / VP Finance / InfoSec) × ask-moment (10 options: pricing_position / discount_request / terms_and_payment / contract_length / auto_renewal / indemnification / security_review / rampup_schedule / expansion_commitment / decision_deadline)
  - `PositionRack.tsx` — opening + walk-away
  - `ConcessionLadder.tsx` — explicit concession order
  - `PushbackSheet.tsx` — counterparty-specific pushback templates
  - `OutcomeRack.tsx` — rehearsal outcome capture
  - `HandoffStrip.tsx` — 4-CTA bottom band (Update the deal / Pre-mortem this deal / Carry to an advisor / Sharpen the proof)
- ✅ **Procurement + finance scripts carried forward** from the retired CFO Negotiation room (`legacy seed_scripts`); not lost in the rebuild. Plus three new counterparty scripts (VP Finance, GC, InfoSec) inferred from the Discovery Studio framework families per canon §4.16b's seed-content directive.
- ✅ **Concession-as-deliberate-move discipline.** ConcessionLadder enforces explicit ordering; no automatic concessions, no "auto-discount" calculator. Each rung is the operator's choice.
- ✅ **Cross-room compounding triangle** lit per canon §6: Deal Workspace ↔ Negotiation ↔ Advisor Deploy. The HandoffStrip surfaces all three legs. PoC Framework also routes in via "Sharpen the proof".

No mind drift.

---

## Phase 2 navigation rubric — PASS

All 8 continuity invariants from `deliverables/audit/continuity-params-2026-05.md` hold:

- ✅ Invariant 1 (returnTo present on cross-room destinations) — `lib/handoff.ts:hrefTo*` builders include returnTo
- ✅ Invariant 2 (returnLabel matches the source room's name) — present
- ✅ Invariant 3 (safeReturnTo guard before navigate) — handled by RoomChrome's BackButton
- ✅ Invariant 4 (focusObject set when a deal is in scope) — passed through every handoff
- ✅ Invariant 5 (focusRoom mirrors the focus's home room) — present
- ✅ Invariant 6 (fromMode + fromSurface attribution) — present
- ✅ Invariant 7 (continuity params read with safeReturnTo on inbound) — `main.tsx` reads through `readContinuity()`
- ✅ Invariant 8 (no placeholder-string focusObject) — verified per PR #109 Codex review

---

## Structural drift — minor, all in keep-or-defer bucket

### A. Things shipped that drift from the spec (FIX in this PR)

None caught.

### B. Explicitly deferred

| Item | Why deferred | Trigger to unblock |
|---|---|---|
| LLM-generated pushback variants | Templates cover the documented counterparty + ask-moment grid; LLM variants would expand but introduce a runtime cost surface | Operators report they're rephrasing the same templates repeatedly |
| Auto-link from Deal Workspace stage transition | Currently the HandoffStrip in DW + the Future Autopsy action-plan router both route into Negotiation; auto-firing on negotiation-stage entry could land as a Phase F observation generator | Phase F generator surface earns more concrete usage data |
| Negotiation rehearsal video / role-play interactive | Beyond scope; rooms are read+write not media | Founder explicit request |

---

## Voice — PASS

Canon Part III §11 applies. All operator-facing copy in `RouteRack`, `PositionRack`, `ConcessionLadder`, `PushbackSheet`, `OutcomeRack`, `HandoffStrip` reads as plain sentences. Counterparty labels are concrete roles (`CFO`, `Procurement`, `Legal`, `GC`, `VP Finance`, `InfoSec`) not invented industry-shorthand. Ask-moment labels read like a peer would describe them (`Pricing position`, `Discount request`, `Terms and payment`, etc.) — not jargon abstractions.

The pushback templates carried forward from the legacy CFO Negotiation room are seasoned operator voice — they were authored by Sarah Chen-shape commercial leaders, not generated.

---

## Fix scope — none

The shipped room matches its locked mind + nav rubric. Doc-only audit.

---

## Acceptance walk

1. `/negotiation/` renders with Topbar + RouteRack + PositionRack + ConcessionLadder + PushbackSheet + OutcomeRack + HandoffStrip.
2. RouteRack offers 6 counterparties × 10 ask-moments.
3. Switching counterparty refreshes PushbackSheet templates if no operator edits.
4. HandoffStrip surfaces 4 CTAs (DW / Future Autopsy / Advisor Deploy / PoC Framework).
5. `?deal=` URL inbound auto-selects a deal.
6. Counterparty + ask-moment context appears in the Topbar kicker.

All hold against shipped state per spot-checks.
