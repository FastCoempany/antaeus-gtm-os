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

## Structural drift — partial; the loft's distinctive visual signatures are owed

The Variant 03 wireframe says explicitly: *"This is the most radical option and the least document-like."* A full Switchboard Loft visual rebuild (cables, 3-col jack-grid, decorative connectors) would be 600+ lines. Scope this PR to the **most-distinctive structural pieces** that close the bootstrap-style drift without overscoping.

### A. Canon-aligned evolution (KEEP)

| Switchboard Loft wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| Display-only jacks with static example content | **Editable form inputs** (Switchboard fields) | Phase 4 / Room 6 — operator must type values, not just look at example jacks |
| Generated send line baked inline with jacks | **OutputPanel separated** as its own column | The generated line + Copy / Log touch / Save angle actions need their own breathing room; integrating them with the jack-grid would crowd both |

### B. Unforced drift (FIX in this PR)

| Switchboard Loft wireframe | Shipped | Severity |
|---|---|---|
| **3-col loft layout: switch-laws (left) + switch-center (work) + switch-reads (right)** | 2-col `ob-stage` (Switchboard + OutputPanel) — no laws column, no reads column | 🟡 MED — the laws + reads are the loft's interpretive frame. Without them the room reads as a form, not a switchboard. |
| **Switch-law cards** — left column carries 2 static doctrinal cards: "Input law" ("No send path without a named strain") + "Recovery law" ("Every route keeps a recovery cable on the same board") | Doctrine lives in the generator's behavior, not surfaced in the UI | 🟡 MED — canon §4.8 doctrine should be visible at the input surface |
| **Switch-read cards** — right column carries 2 dynamic interpretive cards: "Board read" (current rack legibility) + "Operator move" (next-step recommendation) | OutputPanel surfaces the generated line but not the meta-read | 🟡 MED — the operator needs a glanceable "what's connected / what's loose / what to fix first" board read; today they have to infer it |
| **Tone-colored jacks** — each input renders with a tone-colored micro-label kicker (orange account / blue buyer / green strain / orange proof / red objection) | Switchboard form fields render with a generic kicker; no tone differentiation | 🟢 LOW — visual signature; functional behavior unchanged |

### Explicitly deferred (in audit doc, not shipped this PR)

| Element | Why deferred |
|---|---|
| **Decorative cables** between jacks (CSS-positioned rotated lines) | Aesthetic flourish without functional value; 200+ lines of positioning math for diminishing return |
| **3-col jack-grid** inside the center column | Would conflict with shipped Switchboard's form-field semantics; jacks-as-display is a different data model than jacks-as-inputs |

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
     RIGHT: <SwitchReads /> — 2 derived interpretive cards
   ```
   Drops to single column at 1200px.

2. **`SwitchLaws.tsx` (new)** — 2 static cards:
   - "Input law": "No send path without a named strain."
   - "Recovery law": "Every route keeps a recovery cable on the same board."

3. **`SwitchReads.tsx` (new)** — 2 derived cards reading the live rack + generated output:
   - "Board read": classifies the rack as "Ready", "Tighten", or "Loose" by counting filled inputs.
   - "Operator move": names the first loose input ("Add an account first" / "Pick a persona" / etc.) or "Ship the line." when ready.

4. **Tone-colored kickers** on Switchboard fields — each field's label gets a tone class (`ob-jack__kicker--orange` / `--blue` / `--green`) so the inputs read as a wired switchboard.

### What this PR does NOT change

- Generator (`generate()`), persona banks, trigger map, asset matrix, CTA-by-temp — all stay.
- Persistence: `gtmos_outbound_touches`, `gtmos_angles`.
- HandoffStrip + TouchLog (stay below the loft).
- Topbar + RoomChrome.

---

## Acceptance — Sarah routing a send

1. Sarah opens `/outbound-studio/`. Eye lands on the **3-col loft**:
   - Left: 2 doctrinal cards ("No send path without a named strain.")
   - Center: Switchboard form (5 fields now styled as tone-colored jacks) + OutputPanel
   - Right: live "Board read" pill (Loose / Tighten / Ready) + "Operator move" copy
2. As she fills the rack, the right column's reads update live — "Board read: Tighten · Operator move: Add a persona" → eventually "Board read: Ready · Ship the line."
3. The room now reads as a routed signal board, not a generic form.
