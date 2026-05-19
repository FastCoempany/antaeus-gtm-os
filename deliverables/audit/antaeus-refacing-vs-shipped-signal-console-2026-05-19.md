# Signal Console refacing audit — Program 6 / PR 16

**Audited:** 2026-05-19
**Winner:** `antaeus-signal-console-variant-01-ai-selected-2026-05-01.html` — Variant 01 (AI-selected)
**Auditor:** Claude (Program 6 / PR 16)

> **Note on the winner.** Signal Console has no founder-hand-picked triptych in the archive. The AI-generated Variant 01 was retrospectively elevated as the canonical pick (PR #56, commit `0c7a311`) to close the canon §5 named-asset gap. Treating that variant as the binding winner for this audit.

---

## Mind preservation — PASS

Canon §4.7 (Signal Console — Live Instrument, protected room) preserved end-to-end:

- ✅ Heat-ranked account grid (cards ordered by score).
- ✅ Per-account signal records (with AI flag, confidence, recency).
- ✅ Workspace-health line naming whether the room is set up to act on signals or still piling up research.
- ✅ Cross-room handoff (Deal Workspace / Outbound / Discovery Agenda).
- ✅ ICP match chip per card.
- ✅ Execution-context temperature ladder per card (ice_cold / cool / warm / hot).

No mind drift.

---

## Most of the refacing is already in

Phase 4 / Room 3 + the 2026-05 Sarah-CRO audit already brought this room close to the winner. The shipped Topbar carries the wireframe's H1 verbatim ("Where account heat becomes real work."). The grid + per-card heat badge + state-driven primary CTA + workspace-health chip all map directly. What remains is narrow.

---

## Structural drift — narrow

### A. Things the shipped room evolved past the wireframe (KEEP)

| Variant 01 wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| Static example cards (Northstar Health, Apex Fintech, Meridian Logistics) | **Live heat-ranked account grid** | Phase 4 / Room 3 — operator works the actual workspace |
| Single primary CTA per card | **State-driven primary CTA** (`Open in Deal Workspace` if `hasActiveDeal`, else `Compose outbound` with `?temperature=`) | Phase 4 / Room 3 — the dominant move follows the execution context |
| Card body: one signal blurb with execution-context tag | **Top-3 signal preview + expand + "+ N more"** | Phase 4 / Room 3 — operator scans more than one signal per account |
| Rationale callout below grid | Not surfaced (it's wireframe documentation) | Correct — wireframe annotation, not operator surface |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Variant 01 wireframe | Shipped | Severity |
|---|---|---|
| **Italic thesis line below the H1** — one-sentence mental model: "Signals are time-limited events. Heat ranks them. Motion comes from the account ledger — not from research piling up." | The 2026-05 audit removed the prior subtitle as "design documentation" and the line was never restored. The H1 stands alone with no mental-model anchor | 🟡 MED — the thesis is the operator's mental model, not design documentation; the wireframe's italic compression honors canon Part III §9 copy-burden discipline |
| **Posture row fourth cell is "Top heat" (94)** — the max heat score across the grid as a single-glance pressure read | The shipped WorkspaceHealth has a fourth cell labeled "Total signals" — inventory, not pressure | 🟡 MED — Top heat is what the operator actually needs to glance; total-signal inventory was a less-actionable number |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Rationale callout below grid | Wireframe annotation, not operator surface |
| Card pill border-left color tint by band | Already covered by the heat badge + per-card execution-context chip |

---

## Fix scope (this PR)

1. **`components/Topbar.tsx`** — restores a single-sentence italic thesis line under the H1. Compressed from the wireframe's four-sentence framing. Tight (60ch max) per the 2026-05 audit's copy-burden constraint — this is the operator's mental model, not subtitle filler.
2. **`components/WorkspaceHealth.tsx`** — swaps the fourth cell from "Total signals" (inventory) to "Top heat" (pressure). `snapshot.topHeat` is already computed by `buildSignalRoomHealthSnapshot` so this is a wiring fix, not a new derivation. Also relabels the third cell from "Ready (heat ≥75)" to the wireframe's tighter "Hot ≥ 75" framing.
3. **`signal-console.css`** — `.sc-topbar__thesis` styled as a 15px italic, ink-70, 60ch sentence between H1 and the workspace-health strip. Replaces the retired `.sc-topbar__sub` comment with the live selector.

## Acceptance walk

- The Topbar renders an italic thesis line below the H1 referencing "heat" and "ledger".
- The WorkspaceHealth panel surfaces 4 cells: verdict + Active accounts + Hot ≥ 75 + Top heat.
- The Top heat cell reads the snapshot's `topHeat` value (the max heat score across the workspace).
- All existing grid surfaces (cards, badges, ICP chip, signal previews, expand/collapse, CTAs) still render unchanged.
- Empty workspace state still hides the WorkspaceHealth panel.
