# Discovery Studio refacing audit — Program 6 / PR 4

**Audited:** 2026-05-18
**Winner chain:**
1. `antaeus-discovery-studio-lumana-reset-variant-02-segment-jump-2026-04-11.html` (initial pick)
2. `antaeus-discovery-studio-control-face-03c-01-ledger-spine-2026-04-10.html` (refinement)
3. `antaeus-discovery-studio-control-face-ledger-spine-canonical-2026-04-11.html` (canonical, used as baseline)

**Auditor:** Claude (Program 6 / PR 4)

---

## Mind preservation — PASS

Canon §4.12 (Discovery Studio — Live Instrument / Diagnosis Table hybrid) preserved end-to-end:

- ✅ All 21 runtime primitives present (`frameworkRegistry`, `activeFramework`, `callClock`, `phaseTempoPlan`, `activeNode`, `activeTrack`, `essentialNodeSet`, `skipAheadHandlers`, `responseSet`, `expandedResponse`, `learnedFacts`, `signalLedger`, `tiebackLedger`, `supportDossier`, `objectionLibrary`, `inboundQuestionHandlers`, `compressionMode`, `nextStepLock`, `callDisposition`, `postCallPackage`, `handoffPayload`).
- ✅ 9 frameworks × 10-segment spine (locked per canon).
- ✅ 7 required global rails: framework rail, segment rail, recover rail, learned-truth ledger, worked memory, next-step docket, support dossier.
- ✅ On-call control surfaces (CallClock, CompressionToggle, SkipAheadTray) per Wave 5 + the Lumana on-call control lock guardian spec.

No mind drift.

---

## Structural drift — substantial; Wave 5 + canon §4.12 evolution layered on top of the Ledger Spine baseline

The shipped Discovery Studio is the result of TWO layers of canonical work:

1. **Phase 3 / Discovery Studio rebuild** (PR #3-#7, 2026-04-25) which adopted the Ledger Spine layout as the baseline
2. **Wave 5 — on-call control surfaces** (Lumana on-call control lock guardian spec) which added required rails the Ledger Spine wireframe didn't anticipate

The two layers don't fully align. The Ledger Spine envisioned a single-column expandable-segment work surface; the Wave 5 + canon §4.12 work added 7 required global rails that don't fit in a single column.

### A. Things the shipped room evolved past the wireframe (KEEP — don't revert)

| Ledger Spine wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| No CallClock | CallClock in topbar | **Wave 5 / Lumana guardian spec** — required visible call clock |
| No CompressionToggle | Compression toggle (off / essentials / emergency) | **Wave 5** — required by canon §4.12 |
| No SkipAheadTray | SkipAheadTray in side dock | **Wave 5** — required by canon §4.12 |
| No WorkedMemory rail | WorkedMemory in side dock | **Canon §4.12** — one of the 7 required global rails |
| No LearnedTruthLedger as standalone surface | LearnedTruthLedger in side dock (with hold/deploy buttons) | **Canon §4.12** + **Wave 5** tieback ledger discipline |
| No RecoverRail as standalone surface | RecoverRail in side dock + interrupt banner | **Canon §4.12** — required global rail |
| No SupportDossier | SupportDossier in footer | **Canon §4.12** — required global rail (per-framework `supportDossier` primitive) |
| No HandoffStrip | HandoffStrip in footer | **Phase 2.5 Discovery flow audit** (PR #102) — required for cross-room navigation |
| No NextStepDocket | NextStepDocket in center column | **Canon §4.12** — required global rail |

These all stay. They each carry canonical authority that supersedes the Ledger Spine wireframe.

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Ledger Spine wireframe | Shipped | Severity |
|---|---|---|
| **Vertical framework rail** (206px wide, left side) — 9 frameworks stacked vertically with name + dot | **Horizontal framework rail** in topbar (pill buttons wrapping) | 🟡 MED — the vertical rail is what made Ledger Spine work: the rep can always scan the 9 frameworks in their peripheral vision. |
| **Expandable-segment model** — only ONE segment is open at a time; the rest compressed to dot + num + title only | **All segments inline** — SegmentRail shows every segment with all visible nodes + branches stacked vertically at once | 🔴 HIGH — this is what makes the Ledger Spine structurally different from a long form. The shipped surface reads as a long scrolling document; the wireframe wanted a focused work surface where the rep is in one segment at a time. |
| **Mast** at top (kicker + serif "Ledger spine." brand + active framework stamp) — clean, gallery-like top strip | **Topbar** with kicker + serif title (active framework label) + horizontal framework rail | 🟢 LOW — the mast treatment is cleaner; the shipped is denser but functional. |
| **3-col grid inside expanded segment** (Say now / Buyer might say / Command col with say-next + tool tabs facts/recover/leave) | **Inline nodes + branches** inside the SegmentRail; no segment-level work surface | 🟡 MED — the 3-col grid is data-shape-dependent (winner uses segment-level `say`+`replies`+`next`+tool data; shipped uses node-and-branches). Reorganizing the data shape is a multi-PR arc; this drift is documented for follow-up. |

---

## Cross-cutting drift signals (per 2026-05-01 bootstrap)

- **Modal-overlay pattern** → Discovery Studio has SupportDossier as a drawer overlay (Wave 4 added this). Per canon §4.12 the dossier IS a required rail; rendering it as a drawer is justified — it's a deep-reference surface, not core operating space. ✅ JUSTIFIED.
- **Sentence-shaped headlines** → The active framework label currently serves as the H1 — operational, not sentence-shaped. The Ledger Spine had "Open one segment. Run the call from there." as a sentence-shaped section title. 🟡 MED — could be improved.

---

## Fix scope — this PR

Bucket B drift gets these specific fixes, prioritized by severity:

1. **Vertical FrameworkRail (left, 206px wide)** — move from topbar pill row to a sticky left rail. Each framework button: dot + name, with active state highlighted. The Wave 5 control band (CallClock + CompressionToggle) moves to a top-of-main control strip so the vertical rail starts above the segments.

2. **Expandable-segment model** — single-segment-at-a-time. The shipped SegmentRail currently shows every segment with all nodes inline. New behavior:
   - Non-active segments: collapsed to `dot + num + segment-title` only (one row, clickable to expand).
   - Active segment: expanded with nodes + branches + node-level interactions, exactly as today. Only one segment is "expanded" at a time.
   - The signal driving this is the `activeNode.segmentKey` — already in state.

3. **Mast-style topbar refinement** — replace the dense topbar with a mast (kicker + serif "Ledger spine." title + active framework stamp on the right). The "Open one segment. Run the call from there." sentence becomes the section title above the segments.

### What this PR does NOT change

- The 7 required global rails (SegmentRail, FrameworkRail, RecoverRail, LearnedTruthLedger, WorkedMemory, NextStepDocket, SupportDossier) — all stay; only their visual organization shifts.
- The on-call control surfaces (CallClock, CompressionToggle, SkipAheadTray) — canon-required, stay.
- The data shape (node-and-branches vs the wireframe's segment-level say/replies/next) — too large for one PR. Documented as deferred.
- The interrupt banner pattern from RecoverRail.

### Deferred to follow-up PR (named explicitly)

- **3-col grid inside expanded segment** (Say now / Buyer might say / Command col with tool tabs) — requires either reshaping the framework data files OR building a synthesis layer that aggregates node-level data into segment-level say/replies/next. Either way, multi-PR scope.

---

## Acceptance — Sarah's mid-call walk after this PR

1. Sarah is mid-call. Eye lands on the **vertical FrameworkRail** on the left — 9 frameworks scannable in peripheral vision; the active one highlighted.
2. Mast at the top reads "Discovery Studio · Canonical Control Face" + the framework name in the stamp on the right.
3. Control band below the mast: CallClock running, CompressionToggle showing current mode.
4. Below: **section title** "Open one segment. Run the call from there."
5. Single-column segment stack — 10 segments visible at once, only the active one expanded. Sarah's eye lands on the expanded segment without competing for attention with the other 9.
6. Side dock on the right keeps the Wave 5 rails (SkipAheadTray, WorkedMemory) and the LearnedTruthLedger + RecoverRail.
7. Footer carries SupportDossier + HandoffStrip.
8. Cmd+K palette + back-pill work everywhere (Program 6 / PR 1).
