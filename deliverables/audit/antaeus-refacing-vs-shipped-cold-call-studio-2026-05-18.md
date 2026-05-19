# Cold Call Studio refacing audit — Program 6 / PR 10

**Audited:** 2026-05-18
**Winner:** `antaeus-cold-call-studio-radical-triptych-2026-04-19.html` — Variant 02 / Talk Loom
**Auditor:** Claude (Program 6 / PR 10)

---

## Mind preservation — PASS

Canon §4.9 (Cold Call Studio — Live Instrument) preserved end-to-end:

- ✅ Six-thread spine (Prep → Opener → Pressure → Proof → Ask → Exit). Canon's 6 takes precedence over the wireframe's 5 — the wireframe's "five moves" framing is a visual conceit, not the underlying thread model.
- ✅ Buyer-might-say branches per thread + say-next capture panel.
- ✅ Outcome logging with the 7 canonical outcomes + `meeting_booked` writes a Deal.
- ✅ Loom score (44-92, never claims "ready").
- ✅ Call memory + cross-room handoff via continuity params.
- ✅ URL inbound + `?account=` auto-select.

No mind drift.

---

## Most of the drift was already cleaned

Two prior passes had already brought this room close to the wireframe:

- **2026-04-21 cross-room drift-mode sweep** (`75c2c21`) replaced the rainbow loom-needle with a neutral hairline — drift-mode "Rainbow accent" cured.
- **2026-05 Sarah-CRO audit** (commit referenced in TalkLoom.tsx line 114-119) retired `cc-loom__intro` and `cc-loom__law` ("Room law" block) — design-philosophy text the rep doesn't have time to read mid-call.

What remains is narrow.

---

## Structural drift — partial

### A. Things the shipped room evolved past the wireframe (KEEP)

| Wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| 5 threads, one quote per thread | 6 threads with full buyer-branches + say-next | Canon §4.9 is explicit on the 6-thread spine; wireframe's 5 was a visual hook |
| Static title cards | Live thread navigation + branch picker + capture panel | Phase 4 / Room 7 — the rep captures in-call, not just reads |
| Threads on rotated absolute positioning | Static responsive thread rows | "Metaphor ornament" drift-mode (CLAUDE.md Part IV §3); the rotations were decoration |
| Vertical loom-needle (gradient bar) | Removed (2026-04-21 sweep) | Drift-mode "Rainbow accent" — already cured |
| "Room law" head paragraph | Retired (2026-05 audit) | Design-philosophy text, not operator surface |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Wireframe | Shipped | Severity |
|---|---|---|
| Side aside pairs the diagnosis with the prescription — two lines: what's loose right now AND what to actually do about it | Only the diagnosis is surfaced; the prescription is absent | 🟡 MED — the rep needs the prescription, not just the diagnosis |
| Giant score number carries a one-line interpretive thesis beneath it ("Five moves are enough if each move knows what pressure it carries") | The score number is rendered large but stands alone with no line giving it meaning at a glance | 🟢 LOW — copy-level signature add |
| Color-coded indicator dot on each thread row (`.thread:before` 16px circle) | Thread rows already carry a 4px left-edge color border (`border-left: 4px solid var(--cc-thread-color)`) — the color anchor is present, just as a band instead of a dot | ⚪ NONE — already covered |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Rotated thread positioning (1deg tilts on each row) | Drift-mode "Metaphor ornament" — aesthetic flourish, no functional value |
| Pill-shaped threads (border-radius: 999px) | Aesthetic flourish; current rectangular rows give the capture sheet below room to breathe |
| Vertical loom-needle gradient | Already retired per the 2026-04-21 drift sweep — keep retired |

---

## Fix scope (this PR)

1. **`personalize.ts`** — add `requiredCorrectionCopy(hasAccount, threadId)` returning the prescription that pairs with `weakestThreadCopy`'s diagnosis. Thread-aware so the prescription is specific to where the rep is.
2. **`TalkLoom.tsx`** — render the prescription line as a second copy line in the diagnosis block (mirrors the wireframe's two-line pairing).
3. **`TalkLoom.tsx`** — render a one-line interpretive thesis under the score (`cc-loom__score-thesis`) so the giant number has weight at a glance without re-introducing the retired "Room law" paragraph.
4. **`cold-call-studio.css`** — style the score-thesis line + the new prescription line so the side aside reads as the wireframe's diagnostic + prescriptive surface.

> Note: code identifiers like `requiredCorrectionCopy` and `.cc-loom__score-thesis` were named under the old voice and stay as-is per canon Part III §11. New UI copy follows the new voice; the panel reads as plain sentences.

## Acceptance walk

- The side aside shows both the diagnosis and the prescription.
- The prescription text differs between no-account and account-set states.
- The prescription text differs between proof/ask threads (where the call is mid-pressure) and prep/opener threads (where it hasn't earned pressure yet).
- The giant score number carries a one-line thesis underneath it.
- Each thread row shows the color anchor (via the existing left-edge border) tinted with the thread's accent color.
- Existing live-thread navigation, branch picker, capture panel, outcome buttons, and persistence remain unchanged.
