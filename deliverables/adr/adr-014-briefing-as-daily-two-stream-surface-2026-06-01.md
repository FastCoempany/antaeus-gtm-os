# ADR-014 — Briefing as the daily two-stream surface

**Status:** Approved by founder 2026-06-01
**Date:** 2026-06-01
**Builds on:** ADR-006 (Briefing room), ADR-008 (orchestration doctrine), ADR-009 (workspace-scope observations)
**Resolves:** ADR-008 §"Two observation scopes — and an open question"

---

## Context

ADR-008 left a question explicitly open: do workspace-scope observations get their own surface (the Dashboard "this week's reads" card per ADR-009), or get folded into the Briefing's Watchlist Trigger grammar so there's one surface?

ADR-009 (2026-05-31) picked **two streams** at the data layer. Workspace observations are SQL-only, heartbeat-frequent, no LLM. World Patterns (Briefing) are Recipe-Layer-pipeline, weekly, LLM-heavy. They share the Voice Document but not infrastructure.

ADR-009 also committed the workspace stream's surface to be the **Dashboard "this week's reads" card** specifically. The Briefing room stayed world-only.

On 2026-06-01 the founder refined that:

> "they should be separate. But 'briefing' — if it doesnt mean internal as well as external then thats not a product people will care about. I want them to be separate but toggleable. Separate but both within reach of one another. I want to see my world and workspace brief every day."

Two product-level claims in that:

1. **The Briefing room's identity expands.** It's not "the weekly market read" — it's the daily check-in for what the system saw, internal AND external. The room name still fits ("briefing"), but the scope is broader than ADR-006 framed.
2. **Daily, not weekly.** The operator opens the room every day, sees both streams, navigates between them. The room's cadence-of-operator-attention becomes daily even if the underlying synthesis cadences differ.

This ADR resolves both: the streams stay separate (ADR-009 holds at the data layer); the Briefing room becomes the toggleable daily surface for both.

## Decision

**The Briefing room is the daily two-stream surface.** It carries:
- A **Workspace** view (the heartbeat-driven observations stream — ADR-009's existing ledger)
- A **World** view (the existing Recipe-Layer Patterns / Contrarian / Periphery surface)

Operators toggle between them. The room becomes the daily check-in for "what did the system see." The streams remain architecturally separate (different tables, different cadences, different cost profiles — per ADR-009) but they share one operator-facing surface.

Six locked design points:

1. **The Briefing room's mind expands.** Canon §4.21 said "the read of the world the operator is selling into." This ADR amends that to: "the daily check-in for what the system saw — both in the operator's own work (workspace stream) and in the market the operator sells into (world stream)." The room mind in §4.21 gets a corresponding update.

2. **Workspace view inside Briefing.** A new view inside the Briefing room renders observations from the `observations` ledger (the same data the Dashboard "this week's reads" card reads). Display posture mirrors World view: observation text as the headline, source generator as the section tag, dismissable inline.

3. **View toggle at the top of the room.** Two buttons (`Workspace` / `World`) below the topbar, above the lead. Default = `Workspace` (the daily-fresh stream gets first reach). Toggle state persists per device in `localStorage.gtmos_briefing_view_v1`.

4. **The Dashboard "this week's reads" card stays.** ADR-009's card is not retired. The operator now has TWO reach points to workspace observations: the Dashboard card (quick-glance during daily operations) and the Briefing room's Workspace view (deeper read alongside world context). Both surfaces read from the same ledger.

5. **Cadences stay split, per stream.**
   - **Workspace stream**: heartbeat (every 30 min) — already daily-fresh and faster.
   - **World stream**: weekly synthesis stays as is. The room is visible daily but the world Patterns refresh on Monday's cron tick.
   - **Why not daily world synthesis?** The Recipe Layer pipeline cost was designed around a weekly cycle. Daily synthesis multiplies LLM spend ~7x with no obvious payoff (operators don't need a new market read every day; they need access to it every day). Leaving the cadence question open for future revision if the operator's experience suggests daily world reads are worth the spend.

6. **Cross-stream affordances.**
   - The Briefing's WatchList component already lives below the patterns; it remains shared across both views (a trigger can fire for either stream).
   - The `DraftsTray` (PR #234) remains shared across both views — drafts originate from either stream's recommended moves.
   - The FirstVisitPrimer is updated to explain the dual-stream nature.

### What this is NOT

- **Not a re-merge of the streams.** ADR-009 still holds: workspace = SQL-only, world = full Recipe Layer. No new shared table, no new shared writer.
- **Not a Dashboard retirement.** The Dashboard card stays. Two reach points are a feature.
- **Not a daily Briefing pipeline.** World Patterns continue to synthesize weekly. The room is visible daily because the workspace stream is always fresh; the world side is "see what last Monday's cron produced." If the founder later directs daily world synthesis, that's a separate ADR + cost approval.
- **Not a multi-tab UI.** The toggle is a binary view-switch, not a tabbed multi-room. The two views live in the same room with the same chrome.

## Alternatives considered

**Option A — Keep the streams visually separate, no Briefing change.** Workspace stays only on the Dashboard card; the Briefing stays world-only. Rejected because the founder's product framing makes the Briefing a thinner product if it's external-only.

**Option B — Fold workspace observations into the Briefing's Watchlist Trigger grammar (the original ADR-008 alternative).** Rejected per ADR-009: cadence mismatch (weekly Briefing can't carry fresh decay reads) + cost (Recipe Layer is a sledgehammer for SQL-shape observations).

**Option C — Make the Briefing daily across the board (world synthesis daily too).** Rejected for now: ~7x LLM cost with no clear payoff. Re-openable as a separate decision after observing operator usage of the toggle.

## Implementation notes

- **Files added:**
  - `src/briefing/components/ViewToggle.tsx` + corresponding test — the Workspace / World switcher
  - `src/briefing/components/WorkspaceReads.tsx` + corresponding test — renders observations inside the Briefing room
  - `src/briefing/lib/view-state.ts` + corresponding test — localStorage-backed view preference

- **Files touched:**
  - `src/briefing/Briefing.tsx` — mounts the ViewToggle + conditionally renders WorkspaceReads vs the existing World stack
  - `src/briefing/components/FirstVisitPrimer.tsx` — copy updated to explain both views
  - `CLAUDE.md` §4.21 — mind update (daily two-stream surface)
  - `deliverables/adr/adr-008-orchestration-doctrine-2026-05-29.md` — §"Two observation scopes" marked resolved with pointer to this ADR

- **Voice gate.** Operator-facing copy in ViewToggle + WorkspaceReads + primer update all pass canon Part III §11. No invented nouns, no decorated abstractions.

- **Hook-free** per canon Phase 4 / Room 9. Module-level signals for view state.

## Risk + rollback

- **Risk:** the Workspace view inside the Briefing dilutes the World view's "magazine cover" energy. Mitigated by the explicit toggle — the World view is preserved unchanged when selected.
- **Rollback:** the toggle defaults to World (single line change) or the Workspace view component is unmounted (single line change). The Dashboard "this week's reads" card stays live throughout, so removing the toggle doesn't break the operator's ability to reach workspace observations.

## Open

- **Daily world synthesis** — left explicitly open per §Decision point 5. Revisit after operator experience with the toggle informs whether weekly is enough.
- **Default view choice** — initial default is Workspace (fresh stream first). If operators flip to World every visit, the default should flip. Re-evaluate after a month.
- **Per-observation Briefing-style synthesis** — should specially-high-signal workspace observations get promoted to a richer Recipe-Layer read? Deferred — premature until operators have lived with the surface.

---

*Resolves ADR-008 §"Two observation scopes — and an open question."*
