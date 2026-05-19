# Call Planner refacing audit — Program 6 / PR 8

**Audited:** 2026-05-18
**Winner:** `antaeus-call-planner-triptych-2026-04-09.html` — Variant 01 / Pressure Script
**Auditor:** Claude (Program 6 / PR 8)

---

## Mind preservation — PASS

Canon §4.11 (Call Planner — Live Instrument) preserved end-to-end:

- ✅ 4-stop spine (Open / Reason now / Probe / Advance ask).
- ✅ Quality engine (5-gate breakdown).
- ✅ Cross-room handoff via `gtmos_call_handoff` payload (Discovery Studio + Deal Workspace).
- ✅ Outcome capture writes `gtmos_discovery_stats`.
- ✅ Persona-aware question banks.
- ✅ Live agenda recomputes off draft + matchedAccount + linkedDeal.

No mind drift.

---

## Structural drift — partial; targeted unforced drift

### A. Things the shipped room evolved past the wireframe (KEEP)

| Pressure Script wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| Display-only state | **Editable form** (Witness contact name + persona buttons + LinkedIn URL + custom notes + deal-link `<select>`) | Phase 4 / Room 9 — room must accept input, not just display |
| No explicit Quality block | **Quality component** with 5-gate breakdown + band-tinted pill + nextMove copy | Phase 4 / Room 9 — quality engine port; the V01 had only an implicit credibility chip |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Pressure Script wireframe | Shipped | Severity |
|---|---|---|
| **2-col layout: witness+cues (left) + handoff routes (right)** — "one person on the left, one pressure sequence down the middle, and the handoff routes on the right" | **`cp-stage` is 2-col Witness + AgendaSpine; Handoff is a full-width band BELOW** — the handoff routes don't sit alongside the agenda; the reader has to scroll to find them | 🟡 MED — what makes this variant work is having the routes visible while the rep reads the agenda. Right now they're below the fold. |
| **Scripted-quote lines** in each cue body — V01 carries an `<em>scripted line</em>` per cue ("You own the workflow after the rep leaves the call. Where does the handoff break most often?") that reads as an *actual line the rep would speak* | **`cp-strip__copy`** is a generic descriptive sentence; **`cp-strip__note`** is editorial commentary about the cue. Neither reads as a line the rep would actually say. | 🟡 MED — the scripted-quote treatment is what makes Pressure Script feel like a script the rep is running, not a meeting agenda they're reading. |
| **Credibility chip in the witness dossier** — V01 has a `<span>credible</span><strong>86</strong>` chip pulling the quality band + score | Witness has no inline chip; the quality score lives in a separate Quality block | 🟢 LOW — quality score is reachable, just not co-located with the contact info |

---

## Cross-cutting drift signals (per 2026-05-01 bootstrap)

- **Modal-overlay pattern** → Call Planner has no modals. ✅ N/A.
- **Sentence-shaped thesis headers** → AgendaSpine title is sentence-shaped ("Run the call in this order."). ✅ JUSTIFIED.

---

## Fix scope — this PR

Bucket B drift gets these specific fixes:

1. **2-col `cp-board` layout** — restructure `CallPlanner.tsx`:
   ```
   cp-board (2-col grid, left wide + right 320px sticky):
     LEFT col:
       Witness (dossier + form inputs + credibility chip)
       AgendaSpine (4 strips with scripted-quote treatment)
       Quality (5-gate breakdown)
     RIGHT col (sticky):
       Handoff (3 route cards: Discovery / Deal Workspace / Copy brief
                + outcome buttons)
   ```
   Drops to single column at 1100px.

2. **Scripted-quote treatment** in each AgendaSpine strip — each strip gains a `<em class="cp-strip__quote">` line below the `__copy`. The quote is the *actual line the rep would speak* (e.g., "You own the workflow after the rep leaves the call. Where does the handoff break most often?"). Derived per-strip:
   - **Open** — quoted opener line (already partially shipped; surface as `<em>` quote)
   - **Reason now** — single-sentence "why this meeting, why now" quote
   - **Probe** — first persona question framed as a spoken line
   - **Advance ask** — the advance ask line in spoken voice

3. **Credibility chip** in Witness — small inline chip showing the quality band + score (e.g., "Credible · 86"). Matches the V01 dossier's at-a-glance read without duplicating the Quality block — the chip is a one-second summary, Quality is the breakdown.

### What this PR does NOT change

- Quality engine, persona banks, advance-ask helper, brief generator — all stay.
- Persistence (`gtmos_call_handoff`, `gtmos_discovery_stats`, `gtmos_discovery_agenda`).
- Outcome capture buttons (they move to the right column with Handoff, but the click handlers stay).
- Cross-room continuity params via `buildCallPlannerHref` / `hrefToDiscoveryStudio` / `hrefToDealWorkspace`.

---

## Acceptance — Sarah prepping a call

1. Sarah opens `/call-planner/` with an account in URL inbound. Witness on the left shows the contact + a "Credible · 86" chip pulled from the live quality score.
2. Below the dossier: 4 agenda strips (Open / Reason now / Probe / Advance ask) — each strip carries an italic scripted line in addition to its title + copy + note.
3. Below the spine: 5-gate Quality breakdown.
4. Right column (sticky on desktop): the 3 Handoff routes (Discovery Studio / Deal Workspace / Copy brief) + outcome buttons. Sarah sees the destination buttons WHILE she scans the agenda — no scrolling.
5. Click "Open Discovery" → persists call-handoff payload, routes with continuity params.
