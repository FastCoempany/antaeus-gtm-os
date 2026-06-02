# Readiness Score spec-vs-shipped audit

**Audited:** 2026-06-02
**Baseline:** Canon §4.17 (Readiness Score — rewritten 2026-05-01 with Phase 5.A rebuild as gate)
**Auditor:** Claude (B-arc completion — spec-vs-shipped batch)

> **Note on baseline.** Readiness was rebuilt as a verdict-as-gates engine in Phase 5.A (PR #47, 2026-05-01) against the rewritten §4.17 mind. No triptych — the rebuild was designed against the new mind directly. This audit compares the shipped surface against that rewritten mind.

---

## Mind preservation — PASS

Canon §4.17 (rewritten 2026-05-01) preserved end-to-end:

- ✅ **Verdict-as-gates engine** — 5 verdicts (You-are-the-system / Building / Inheritable-with-guardrails / Hire-ready / Hire-ready-repeatable) each gated by **present-evidence checks**, not threshold scores. Implementation in `src/lib/readiness/verdict.ts:evaluateReadiness()` runs the gate ladder in order; first failing gate determines the verdict. Per-dimension helpers in `src/lib/readiness/dimensions.ts`; aggregation across cloud-mirrored rooms in `src/dashboard/lib/readiness-aggregator.ts`.
- ✅ **Maturity-not-pressure framing.** The verdict answers "could a real first-hire walk in tomorrow and run the motion?" — different shape of truth from the Dashboard's pressure rail and Future Autopsy's decay rail. The Readiness drawer's hero copy reads this directly.
- ✅ **Dimension scoring stays internal as the math** but is NOT the first-fold story. The drawer hero is verdict-driven; dimension bars appear lower in the drawer as gating evidence, not as the primary readout.
- ✅ **Dashboard topbar anchor** — `ReadinessAnchor.tsx` mounts on the Dashboard topbar; verdict label + chevron, single line, click opens drawer. Anchored prominently but never obnoxious per §4.17.
- ✅ **Single-fold drawer overlay** — `ReadinessDrawer.tsx` is an overlay, not a route. Closes via backdrop click + Escape + close button. No URL change.
- ✅ **"What would move the verdict next"** — every blocker has its peer-voice instruction (Phase 2.8 audit shipped 15 gate-blockers rewritten in behavior-shape). Verified: blockers like "Tighten ICP & targeting — it's the weakest dimension" appear in the drawer's blocker list, not "Dimension X below 14/20" internal math.
- ✅ **Ceremony hooks for upward transitions** — fires the §4.19 Founding GTM ceremony on first upward transition into Inheritable-with-guardrails. Implementation: drawer writes `gtmos_readiness_last_verdict`; Founding GTM subscribes.

No mind drift.

---

## Structural drift — minor

### A. Things shipped that drift from the spec (FIX in this PR)

None caught.

### B. Explicitly deferred

| Item | Why deferred | Trigger to unblock |
|---|---|---|
| Verdict-history sparkline in the drawer | The export buttons cover this need (history embedded in `Export verdict + history` JSON); a visual sparkline would be nice-to-have | Operator asks for verdict-over-time visualization |
| "Confidence" overlay on dimension bars | Some dimensions read off mirrors that may be stale; an explicit confidence indicator could clarify | Mirror-staleness becomes a real operator concern |
| Downward-transition silent-acknowledgment | Per §4.17, downward transitions are silent. No UI surfaces them. This is intentional. | Founder revises §4.17 |

---

## Voice — PASS

Drawer copy:

- Hero kicker: `READINESS` (mono, uppercase)
- Verdict: spelled out as a sentence-shape ("You are the system", "Building", "Inheritable with guardrails", etc.) not category-shaped jargon
- Subtitle: peer-voice explanation ("This means you could probably hand off the motion if a hire walked in tomorrow.")
- Gate blockers: behavior-shape verbs ("Tighten ICP & targeting", "Cast a proof", "Run a future autopsy") — these were rewritten in Phase 2.8 to drop the internal math vocab the original implementation carried
- Section labels: "What's blocking?" / "What would move the verdict next?" — these are operator questions, not labels

No banned vocab in the drawer. The dimension labels ("ICP & targeting", "Pipeline", "Proof", "Wins & losses", "Coverage") are domain words the operator already speaks, per Part III §11.

---

## Cross-room compounding — PASS

Per canon §4.17 + §6, Readiness reads from every cloud-mirrored room. Verified:

| Dimension | Reads from |
|---|---|
| ICP & targeting | ICP Studio + Signal Console |
| Pipeline | Deal Workspace |
| Proof | PoC Framework + Founding GTM section-readiness count (§4.19) |
| Wins & losses | Deal Workspace closed deals + Future Autopsy run history |
| Coverage | Quota Workback + Outbound + LinkedIn + Cold Call motion truth |
| Advisor activation (gate-only) | Advisor Deploy deployment outcomes |
| Handoff (gate-only) | Founding GTM section-readiness count |

The verdict aggregator reads cloud-synced snapshots; spot-checked in `src/lib/readiness/aggregator.ts`.

---

## Fix scope — none

Doc-only audit.

---

## Acceptance walk

1. Dashboard topbar shows the Readiness Anchor (verdict label + chevron).
2. Click anchor → drawer opens as overlay; URL doesn't change.
3. Drawer hero is verdict-led (sentence-shape), not dimension-score-led.
4. Drawer shows "What's blocking" with peer-voice blocker copy.
5. Drawer shows "What would move the verdict next" with concrete instructions.
6. Drawer footer offers two export buttons (snapshot + verdict + history).
7. Drawer closes via backdrop + Escape + close button.
8. Verdict upward transition into Inheritable-with-guardrails fires Founding GTM ceremony once.
9. Downward transitions are silent (no UI surface).

All hold against shipped state per spot-checks.
