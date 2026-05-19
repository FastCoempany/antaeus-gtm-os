# Outbound Studio refacing audit — Program 6 / PR 9

**Audited:** 2026-05-18
**Winner:** `antaeus-outbound-studio-triptych-2026-04-18.html` — Variant 03 / Switchboard Loft
**Auditor:** Claude (Program 6 / PR 9)

---

## Mind preservation — PASS

Canon §4.8 (Outbound Studio — Live Instrument) preserved end-to-end:

- ✅ "No send path without a named strain" — the input law that drives the generator.
- ✅ Five-input rack (account / contact / persona / temperature / trigger).
- ✅ No-ask mode toggle.
- ✅ Send-line generator (5 temperatures × 4 personas, deterministic substitution).
- ✅ Touch log + angle save (legacy keys `gtmos_outbound_touches`, `gtmos_angles`).
- ✅ Cross-room handoff via continuity params.
- ✅ URL inbound prefills the rack from Signal Console / LinkedIn / Cold Call handoffs.

No mind drift.

---

## Structural drift — partial; the loft's distinctive visual treatment is owed

The Variant 03 wireframe says explicitly: *"This is the most radical option and the least document-like."* A full visual rebuild of the loft (cables, 3-col jack-grid, decorative connectors) would be 600+ lines. Scope this PR to the most-distinctive structural pieces that close the bootstrap-style drift without overscoping.

### A. Things the shipped room evolved past the wireframe (KEEP)

| Wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| Display-only jacks with static example content | Editable form inputs (Switchboard fields) | Phase 4 / Room 6 — the operator types values; they don't look at example jacks |
| Generated send line baked inline with jacks | OutputPanel separated as its own column | The generated line + Copy / Log touch / Save angle actions need their own breathing room; integrating them with the jack-grid would crowd both |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Wireframe | Shipped | Severity |
|---|---|---|
| 3-col loft layout: doctrinal cards (left) + work area (center) + live reads (right) | 2-col `ob-stage` (Switchboard + OutputPanel) — no doctrinal column, no live-reads column | 🟡 MED — the left and right columns are what tell the operator what's going on; without them the room reads as a form, not a switchboard |
| Two static doctrinal cards in the left column: "No send path without a named strain" + "Every route keeps a recovery cable on the same board" | Doctrine lives in the generator's behavior, not surfaced in the UI | 🟡 MED — canon §4.8 doctrine should be visible at the input surface |
| Two live cards in the right column: one names whether the rack is loose / tightening / ready, and one names what to do next based on which input is still loose | OutputPanel surfaces the generated line but not the live read of the rack | 🟡 MED — the operator needs a glanceable read of what's connected and what to fix first; today they have to infer it from the form state |
| Tone-colored jack micro-labels (orange account / blue buyer / green strain / orange proof / red objection) | Switchboard fields render with a generic kicker; no tone differentiation | 🟢 LOW — small visual detail; functional behavior unchanged |

### Explicitly deferred (in audit doc, not shipped this PR)

| Element | Why deferred |
|---|---|
| Decorative cables between jacks (CSS-positioned rotated lines) | Aesthetic flourish without functional value; 200+ lines of positioning math for diminishing return |
| 3-col jack-grid inside the center column | Would conflict with the shipped Switchboard's form-field semantics; jacks-as-display is a different data model than jacks-as-inputs |

---

## Cross-cutting drift signals (per 2026-05-01 bootstrap)

- **Modal-overlay pattern** → Outbound Studio has no modals. ✅ N/A.
- **Sentence-shaped thesis headers** → Switchboard kicker reads "Pick the angle." ✅ JUSTIFIED.

---

## Fix scope — this PR

1. **3-col `ob-loft` layout** in OutboundStudio.tsx:
   ```
   ob-loft (grid: 200px | 1fr | 200px):
     LEFT:  <SwitchLaws /> — 2 doctrinal cards
     CENTER: <Switchboard /> + <OutputPanel />
     RIGHT: <SwitchReads /> — 2 live-read cards
   ```
   Drops to single column at 1200px.

2. **`SwitchLaws.tsx` (new)** — 2 static cards:
   - "No send path without a named strain."
   - "Every route keeps a recovery cable on the same board."

3. **`SwitchReads.tsx` (new)** — 2 live cards reading the rack + the generated output:
   - One classifies the rack as "Ready", "Tightening", or "Loose" by counting filled inputs.
   - One names what to do next — which input is still loose, or "Ship the line." when ready.

4. **Tone-colored kickers** on Switchboard fields — each label gets a tone class (`ob-jack__kicker--orange` / `--blue` / `--green`) so the inputs read as a wired switchboard.

> Note: code identifiers like `SwitchReads.tsx`, `SwitchLaws.tsx`, `.ob-jack__kicker--*` were named under the old voice and stay as-is per canon Part III §11. New UI copy follows the new voice; the cards read as plain sentences.

### What this PR does NOT change

- Generator (`generate()`), persona banks, trigger map, asset matrix, CTA-by-temp — all stay.
- Persistence: `gtmos_outbound_touches`, `gtmos_angles`.
- HandoffStrip + TouchLog (stay below the loft).
- Topbar + RoomChrome.

---

## Acceptance walk — Sarah routing a send

1. Sarah opens `/outbound-studio/`. Her eye lands on the 3-col loft:
   - Left: 2 doctrinal cards.
   - Center: Switchboard form (5 fields now styled as tone-colored jacks) + OutputPanel.
   - Right: live pill naming whether the rack is loose / tightening / ready + line naming what to do next.
2. As she fills the rack, the right column updates live — "Tightening · Add a persona" → eventually "Ready · Ship the line."
3. The room now reads as a wired switchboard — laws on one side, work in the middle, live read on the other — not a generic form with a button.
