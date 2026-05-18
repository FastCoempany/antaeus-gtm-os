# LinkedIn Playbook refacing audit — Program 6 / PR 11

**Audited:** 2026-05-18
**Winner:** `antaeus-linkedin-playbook-radical-triptych-2026-04-19.html` — Variant 02 / Cue Booth (line 670+)
**Auditor:** Claude (Program 6 / PR 11)

> **Note on the winner pointer.** `deliverables/audit/antaeus-canonical-triptych-winners-2026-05-18.md` listed the winner file as `antaeus-linkedin-playbook-triptych-2026-04-19.html` and the variant name as "Cue Booth". That file's three variants are Signal Cinema / Influence Radar / Trust Loom — no Cue Booth. **The actual picked-winner Cue Booth lives in the companion `radical-triptych` file at line 670+**. Treating the radical-triptych Cue Booth as the binding winner for this audit; canon-winners pointer can be corrected separately.

---

## Mind preservation — PASS

Canon §4.10 (LinkedIn Playbook — Live Instrument) preserved end-to-end:

- ✅ 5-cue ladder (Watch → Comment → Connect → Give-first → Ask). Canon's 5 takes precedence over the wireframe's 4 — the wireframe's 4-cue list (Watch/Comment/Connect/Ask) is a Variant 02 visual conceit that drops the give-first cue.
- ✅ Motion engine drives the booth read.
- ✅ Cross-room handoffs to Signal Console + Outbound Studio.
- ✅ Channel memory + per-account stats.
- ✅ Cue logging persistence.

No mind drift.

---

## Most of the drift was already cleaned

Two prior passes had already brought this room close to the Variant 02 winner:

- **2026-04-21 cross-room drift-mode sweep** (`7f03723`) replaced the rainbow cue-meter gradient with a semantic progress track and deleted the 12-dot decorative marquee strip at the top of the stage panel — drift-mode "Rainbow accent" + "Metaphor ornament" cured.
- **2026-05 Sarah-CRO audit** retired the duplicate H2 ("Enter only when the room gives a cue.") and the "Room law" philosophy block ("The inbox is not the opening scene…").

What remains is narrow.

---

## Structural drift — partial

### A. Canon-aligned evolution (KEEP)

| Cue Booth wireframe | Shipped (post-evolution) | Justifying evolution |
|---|---|---|
| 4 cues (Watch / Comment / Connect / Ask) | **5 cues (canon §4.10 — Watch / Comment / Connect / Give-first / Ask)** | Canon's 5-cue ladder is explicit; wireframe dropped Give-first as a visual conceit |
| Static `<h2>` line on the stage | **Motion-engine-driven personalized cue script** | Phase 4 / Room 8 — script personalizes with hottest-account context |
| Booth-read aside is a static read | **Live booth-read with handoff CTAs** | Cross-room handoff is canon §6 compounding — the booth-read aside terminates in actual sales-move CTAs (Check the signals / Compose outbound) |
| Rainbow cue-meter + 12-dot marquee | Removed (2026-04-21 sweep) | Drift-mode "Rainbow accent" + "Metaphor ornament" — already cured |
| "Room law" head paragraph + duplicate H2 | Retired (2026-05 audit) | Design-philosophy text, not operator surface |

### B. Unforced drift (FIX in this PR)

| Cue Booth wireframe | Shipped | Severity |
|---|---|---|
| **Booth-read aside surfaces a `Recovery cue` rule** ("If they correct you, thank them and narrow.") alongside Current cue | The booth-read has Current cue + One-session win + Channel standard rules but no Recovery rule. The recovery semantics (canon §4.8 "Every route keeps a recovery cable on the same board") are absent from the surface | 🟡 MED — the rep needs to know what to do when a cue misfires; without it the room reads as forward-only |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Wireframe's 4-cue rail vs canon's 5-cue | Canon wins; not drift |
| Rainbow cue-meter | Already retired in 2026-04-21 sweep — keep retired |
| 12-dot marquee at top of stage | Already retired in 2026-04-21 sweep — keep retired |

---

## Fix scope (this PR)

1. **`types.ts`** — extend the `Motion` interface with `readonly recovery: string` (the cue to fall back on when something just misfired).
2. **`motion.ts`** — populate `recovery` in all 4 motion branches (credibility / warm_signal_account / convert_connection / add_air_cover). Each branch carries motion-specific recovery copy that names the relevant account where useful.
3. **`CueBooth.tsx`** — render a new `Recovery cue` rule between Current cue and One-session win in the booth-read aside.
4. **`linkedin-playbook.css`** — orange left-rule + tinted background on `.lp-read__rule--recovery` so the rep can find it instantly when a cue misfires.

## Acceptance walk

- Booth-read aside shows a `RECOVERY CUE` rule alongside the existing Current cue / One-session win / Channel standard rules.
- The recovery copy changes per motion branch (verified in unit tests).
- The 5-cue ladder still renders.
- The dark stage + 3-cell cue console still renders.
- Cross-room handoff CTAs (Check the signals / Compose outbound) still mount.
