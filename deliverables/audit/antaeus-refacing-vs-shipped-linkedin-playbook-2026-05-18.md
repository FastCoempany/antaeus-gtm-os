# LinkedIn Playbook refacing audit — Program 6 / PR 11

**Audited:** 2026-05-18
**Winner:** `antaeus-linkedin-playbook-radical-triptych-2026-04-19.html` — Variant 02 / Cue Booth (line 670+)
**Auditor:** Claude (Program 6 / PR 11)

> **Note on the winner pointer.** `deliverables/audit/antaeus-canonical-triptych-winners-2026-05-18.md` listed the winner file as `antaeus-linkedin-playbook-triptych-2026-04-19.html` and the variant name as "Cue Booth". That file's three variants are Signal Cinema / Influence Radar / Trust Loom — no Cue Booth. The actual picked-winner Cue Booth lives in the companion `radical-triptych` file at line 670+. Treating the radical-triptych Cue Booth as the binding winner for this audit; canon-winners pointer can be corrected separately.

---

## Mind preservation — PASS

Canon §4.10 (LinkedIn Playbook — Live Instrument) preserved end-to-end:

- ✅ 5-cue ladder (Watch → Comment → Connect → Give-first → Ask). Canon's 5 takes precedence over the wireframe's 4 — the wireframe drops Give-first as a visual conceit.
- ✅ Motion engine drives the booth read.
- ✅ Cross-room handoffs to Signal Console + Outbound Studio.
- ✅ Channel memory + per-account stats.
- ✅ Cue logging persistence.

No mind drift.

---

## Most of the drift was already cleaned

Two prior passes had already brought this room close to the wireframe:

- **2026-04-21 cross-room drift-mode sweep** (`7f03723`) replaced the rainbow cue-meter gradient with a semantic progress track and deleted the 12-dot decorative marquee strip at the top of the stage panel — drift-mode "Rainbow accent" + "Metaphor ornament" cured.
- **2026-05 Sarah-CRO audit** retired the duplicate H2 ("Enter only when the room gives a cue.") and the "Room law" philosophy block ("The inbox is not the opening scene…").

What remains is narrow.

---

## Structural drift — partial

### A. Things the shipped room evolved past the wireframe (KEEP)

| Wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| 4 cues (Watch / Comment / Connect / Ask) | 5 cues (canon §4.10 — Watch / Comment / Connect / Give-first / Ask) | Canon's 5-cue ladder is explicit; the wireframe dropped Give-first as a visual conceit |
| Static `<h2>` line on the stage | Motion-engine-driven personalized cue script | Phase 4 / Room 8 — the script personalizes with hottest-account context |
| Booth-read aside is a static read | Live booth-read with handoff CTAs | Cross-room handoff is canon §6 compounding — the aside terminates in actual sales-move CTAs (Check the signals / Compose outbound) |
| Rainbow cue-meter + 12-dot marquee | Removed (2026-04-21 sweep) | Drift-mode "Rainbow accent" + "Metaphor ornament" — already cured |
| "Room law" head paragraph + duplicate H2 | Retired (2026-05 audit) | Design-philosophy text, not operator surface |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Wireframe | Shipped | Severity |
|---|---|---|
| The booth-read aside includes a line telling the rep what to do if the cue misfires — "If they correct you, thank them and narrow" — alongside what to say first | The booth-read has the current cue + one-session goal + channel standard rules, but nothing about what to do when something goes sideways. The recovery principle from canon §4.8 ("every route keeps a recovery cable on the same board") is missing from the surface | 🟡 MED — the rep needs to know what to do when a cue misfires; without it the room reads as forward-only |

### Explicitly deferred

| Element | Why deferred |
|---|---|
| Wireframe's 4-cue rail vs canon's 5-cue | Canon wins; not drift |
| Rainbow cue-meter | Already retired in the 2026-04-21 sweep — keep retired |
| 12-dot marquee at the top of the stage | Already retired in the 2026-04-21 sweep — keep retired |

---

## Fix scope (this PR)

1. **`types.ts`** — extend the `Motion` interface with `readonly recovery: string` (the line that names what to do if the cue just misfired).
2. **`motion.ts`** — populate `recovery` in all 4 motion branches (credibility / warm_signal_account / convert_connection / add_air_cover). Each branch carries motion-specific copy that names the relevant account where useful.
3. **`CueBooth.tsx`** — render a new line in the booth-read aside between the current cue and the one-session goal, naming what to try if the cue misfires.
4. **`linkedin-playbook.css`** — orange left-rule + tinted background on `.lp-read__rule--recovery` so the rep can find the recovery line instantly.

> Note: code identifiers like `motion.recovery` and `.lp-read__rule--recovery` were named under the old voice and stay as-is per canon Part III §11. New UI copy follows the new voice; the line reads as plain sentences.

## Acceptance walk

- The booth-read aside shows a line explicitly telling the rep what to do if the cue misfires, alongside the existing current cue + one-session goal + channel standard rules.
- The recovery copy changes per motion branch (verified in unit tests).
- The 5-cue ladder still renders.
- The dark stage + 3-cell cue console still renders.
- Cross-room handoff CTAs (Check the signals / Compose outbound) still mount.
