# Cold Call Studio refacing audit — Program 6 / PR 10

**Audited:** 2026-05-18
**Winner:** `antaeus-cold-call-studio-radical-triptych-2026-04-19.html` — Variant 02 / Talk Loom
**Auditor:** Claude (Program 6 / PR 10)

---

## Mind preservation — PASS

Canon §4.9 (Cold Call Studio — Live Instrument) preserved end-to-end:

- ✅ Six-thread spine (Prep → Opener → Pressure → Proof → Ask → Exit). Canon's 6 takes precedence over the wireframe's 5 hook — the wireframe's "five moves" framing is a Variant 02 visual conceit, not the underlying thread model.
- ✅ Buyer-might-say branches per thread + say-next capture panel.
- ✅ Outcome logging with the 7 canonical outcomes + `meeting_booked` writes a Deal.
- ✅ Loom score (44-92, never claims "ready").
- ✅ Call memory + cross-room handoff via continuity params.
- ✅ URL inbound + `?account=` auto-select.

No mind drift.

---

## Most of the drift was already cleaned

Two prior passes had already brought this room close to the Variant 02 winner:

- **2026-04-21 cross-room drift-mode sweep** (`75c2c21`) replaced the rainbow loom-needle with a neutral hairline — drift-mode "Rainbow accent" cured.
- **2026-05 Sarah-CRO audit** (commit referenced in TalkLoom.tsx line 114-119) retired `cc-loom__intro` and `cc-loom__law` ("Room law" block) — design-philosophy text the rep doesn't have time to read mid-call.

What remains is narrow.

---

## Structural drift — partial

### A. Canon-aligned evolution (KEEP)

| Talk Loom wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| 5 threads, single-quote per thread | **6 threads with full buyer-branches + say-next** | Canon §4.9 explicit on 6-thread spine; wireframe's 5 is a visual hook |
| Static title cards | **Live thread navigation + branch picker + capture panel** | Phase 4 / Room 7 — operators must capture in-call, not just read |
| Threads on rotated absolute positioning | **Static responsive thread rows** | "Metaphor ornament" drift-mode (CLAUDE.md Part IV §3) — the rotations are decoration |
| Vertical loom-needle (gradient bar) | Removed (2026-04-21 sweep) | Drift-mode "Rainbow accent" — already cured |
| "Room law" head paragraph | Retired (2026-05 audit) | Design-philosophy text, not operator surface |

### B. Unforced drift (FIX in this PR)

| Talk Loom wireframe | Shipped | Severity |
|---|---|---|
| **Side aside pairs diagnosis with prescription** — two operator-lines: "Weakest thread" (what's loose) + "Required correction" (the actual move) | Only the "Weakest thread" diagnosis is surfaced; the prescription is absent | 🟡 MED — the rep needs the prescription, not just the diagnosis |
| **Giant score number carries an interpretive thesis line** — "Five moves are enough if each move knows what pressure it carries" sits beneath the number | The score number is rendered large but stands alone; no thesis line gives the number its meaning at-a-glance | 🟢 LOW — copy-level signature add |
| **Color-coded indicator dot on each thread row** (the `.thread:before` 16px circle in the wireframe) | Thread rows already carry a 4px left-edge color border (`border-left: 4px solid var(--cc-thread-color)`) — the color anchor is present, just as a band instead of a dot | ⚪ NONE — already covered |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Rotated thread positioning (1deg tilts on each row) | Drift-mode "Metaphor ornament" — aesthetic flourish, no functional value |
| Pill-shaped threads (border-radius: 999px) | Aesthetic flourish; current rectangular rows give the capture sheet below room to breathe |
| Vertical loom-needle gradient | Already retired per 2026-04-21 drift sweep — keep retired |

---

## Fix scope (this PR)

1. **`personalize.ts`** — add `requiredCorrectionCopy(hasAccount, threadId)` returning the prescription paired with `weakestThreadCopy`'s diagnosis. Thread-aware so the prescription is specific.
2. **`TalkLoom.tsx`** — render the required-correction line as the second copy line in the "Weakest thread" block (mirrors the wireframe's `<div class="operator-line"><small>Required correction</small><strong>…</strong></div>` pairing).
3. **`TalkLoom.tsx`** — render a thesis line under the score (`cc-loom__score-thesis`) so the giant number has interpretive weight without re-introducing the retired "Room law" paragraph.
4. **`cold-call-studio.css`** — style the score-thesis line + required-correction line so the side aside reads as the wireframe's diagnostic + prescriptive surface.

## Acceptance walk

- Side aside shows BOTH "Weakest thread" diagnosis AND "Required correction" prescription.
- The required-correction prescription text differs between no-account and account-set states.
- The required-correction prescription text differs between proof/ask threads (where the call is mid-pressure) and prep/opener threads (where the call hasn't earned the pressure yet).
- The giant score number carries a one-line thesis underneath it.
- Each thread row shows a color-anchor dot tinted with the thread's accent color.
- Existing live-thread navigation, branch picker, capture panel, outcome buttons, and persistence remain unchanged.
