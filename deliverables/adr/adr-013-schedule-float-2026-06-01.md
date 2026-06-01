# ADR-013 — ScheduleFloat (reverse the schedule-fire surface)

**Status:** Approved by founder 2026-06-01
**Date:** 2026-06-01
**Builds on:** ADR-012 (Skill scheduling, Phase E)

---

## Context

Phase E (ADR-012) shipped `ScheduledFireToast` as the post-fire surface — a navy card bottom-left that appears WHEN a scheduled skill fires, persists until the operator clicks or dismisses it, and otherwise stays hidden. The toast was the visible payoff of the auto-navigate semantic E1-A.

Over the first week of live use, the founder reported a recurring failure mode: schedules are firing correctly (SQL + heartbeat logs confirm), but **the operator isn't seeing them**. The navy surface only exists in the brief window between fire and acknowledgement; if the operator dismisses it once or opens a different tab, the schedule effectively becomes invisible. The surface that was meant to be the proof of the system's pulse was hiding the pulse.

The founder's reframe (2026-06-01):

> "We need to reverse it in fact. The navy card should always-show. And upon clicking — that allows the person to adjust schedule. Maybe on-hovering over the navy card, there's a pop-up notification that explains what they can do. There should also be a settings wheel that gives the user the power to turn off notification or help tips etc."

Three variants drafted at `deliverables/mockups/schedule-float-variants-2026-06-01.html`. **Founder picked Variant B: Card with Live Feed**, with one amendment: **the card must be minimizable to a pill**.

## Decision

**Replace `ScheduledFireToast` with `ScheduleFloat`** — a persistent, always-visible schedule-control surface mounted bottom-left via `RoomChrome`. The surface has two states (expanded card / minimized pill), an inline settings panel, and absorbs the in-session fire surfacing the toast used to do.

Six locked design points:

1. **The surface is always-on.** Mounted on every room via `RoomChrome`. There is no "fire just happened" entry condition — the surface is there at all times. Fires render AS A STATE CHANGE of the surface (a "Just fired" row lights up + a fire dot appears on the minimized pill), not as a separate widget.

2. **Two render states, operator-controlled.**
   - **Expanded** (Variant B): 280px navy card bottom-left with a header (kicker + minimize button + settings gear), a "Just fired" section (only when an unviewed fire exists), and a "Queued" list of upcoming schedules (up to 4 visible with overflow indicator). Each row is clickable — Just-fired rows route to the skill's destination (consuming the fire); Queued rows open the schedule editor for that skill.
   - **Minimized**: ~140px navy pill bottom-left showing `N scheduled` + a fire dot (only when an unviewed fire exists). On hover, a settings wheel slides in at the right edge. Click the pill body to expand; click the settings wheel to open the inline settings panel.

3. **Inline settings panel.** Click the settings gear (expanded) or the hover-revealed wheel (minimized) → settings options reveal in-line on the current surface. **No separate modal.** Settings v1:
   - **Show in-session notifications** (toggle, default ON) — when OFF, the surface still shows queued schedules but doesn't light up the "Just fired" row on live fires. The fire is still consumed on next click/load.
   - **Show tooltip hints** (toggle, default ON) — the on-hover explainer tooltip that surfaces what the surface can do.
   - **Surface visibility** (toggle, default ON) — when OFF, hides `ScheduleFloat` entirely. The operator re-summons it via Ctrl+K → "show schedule float." Hiding is a deliberate dismissal, not the default.
   - **Snooze notifications** (none / 1h / 4h / today) — suppresses the "Just fired" row for the chosen window without dismissing pending fires from the ledger.

4. **Operator preferences are workspace-local + persisted.** Stored in `localStorage` under `gtmos_schedule_float_prefs_v1` (mode: `expanded` | `minimized` | `hidden`, plus the four settings toggles + snooze state). Per-workspace if/when multi-workspace lands; v1 is single-workspace.

5. **The card consumes the legacy toast's responsibilities.** `ScheduledFireToast` retires. `ScheduleFloat` takes over: arrival surfacing (the sessionStorage marker from auto-navigate), in-session polling (30s interval, document-visibility-aware), and the click-to-dispatch path. The auto-navigate handler in `src/skills/lib/auto-navigate.ts` stays — only the surface that consumes its output changes.

6. **Hover tooltip is opt-out, not opt-in.** When `showTooltipHints` is ON (default), hovering the pill or the card header surfaces a brief explainer ("Schedule view. Click to expand, gear to manage."). Operators who've internalized the surface turn the tooltip off via settings; they keep the surface.

### What this is NOT

- **Not a notification center.** There's no inbox, no history, no "all fires this week" view. The surface shows what's queued + what just fired. Past fires that the operator has acted on are gone from the surface (still in the `scheduled_skill_fires` ledger for audit).
- **Not a sidebar.** 140-280px max width; bottom-left anchored; never expands to dominate the room. Stays a chrome-level affordance like the Birdseye eye it visually rhymes with (which sits bottom-right).
- **Not a multi-schedule editor.** Clicking a Queued row still opens the existing `ScheduleModal` (single-schedule editor). A "Manage all schedules" deeper UI is deferred.
- **Not a replacement for the Cmd+K palette.** Operators still discover + schedule skills via Ctrl+K. `ScheduleFloat` is the persistent visibility of what's been scheduled; the palette remains the authoring surface.

## Alternatives considered

**Variant A: Persistent Pill** — pure-pill, no expanded card. Rejected: ambient surface needs to carry list-of-schedules ambient info, not just a count. Pill alone would punt that to a modal-click path.

**Variant C: Birdseye Twin** — clock-icon mirror of the Birdseye eye, collapsed by default. Rejected: collapsed-by-default reintroduces the "operator misses fires" failure that prompted this reversal in the first place. Variant B's always-visible card is the explicit fix.

**Keep `ScheduledFireToast` + add a separate pill** — two surfaces (toast for fires, pill for ambient schedules). Rejected: doubles the bottom-left chrome footprint + creates two competing affordances for the same operator intent.

## Implementation notes

- **Files added:**
  - `src/skills/ScheduleFloat.tsx` — replaces `ScheduledFireToast.tsx`
  - `src/skills/schedule-float.css` — replaces `scheduled-fire-toast.css`
  - `src/skills/lib/float-prefs.ts` — localStorage preferences accessor
  - `src/skills/lib/float-prefs.test.ts` — prefs round-trip tests
  - `src/skills/ScheduleFloat.test.tsx` — component smoke tests

- **Files retired:**
  - `src/skills/ScheduledFireToast.tsx` — deleted
  - `src/skills/scheduled-fire-toast.css` — deleted

- **Files touched:**
  - `src/lib/room-chrome.tsx` — swap `<ScheduledFireToast />` → `<ScheduleFloat />`
  - `src/skills/ScheduleModal.tsx` — header comment update (mount point changed)

- **Hook-free** per canon Phase 4 / Room 9 note. Module-level signals hold expanded/minimized state + settings panel open/closed + the bootstrapped pending fire + list of schedules.

- **Auto-navigate semantic preserved.** The component continues to consume the arrival-marker (sessionStorage), the pending-fire-on-load path, and the 30s in-session poll. The change is the *render surface*, not the *trigger model*.

- **Voice gate.** All operator-facing copy passes canon Part III §11. No "wedge", no "command intelligence", no decorated nouns. The surface uses sentence-shaped labels ("3 schedules queued", "Just fired", "Show in-session notifications").

## Risk + rollback

- **Risk:** the always-visible surface adds bottom-left chrome footprint that could compete with the Birdseye Float (bottom-right). Mitigated: ScheduleFloat anchors bottom-left (18px from edges, z-index 997); Birdseye anchors bottom-right (z-index 998); they're spatially disjoint and visually rhyme.
- **Rollback:** the "Surface visibility" toggle in settings hides the whole component; a per-workspace operator can opt out entirely. A code-level kill switch (delete the `<ScheduleFloat />` line in `room-chrome.tsx`) is a one-line revert.

## Open

- **Multi-schedule manager UI**: when N > 4 queued schedules become normal, the overflow indicator needs to route somewhere. Deferred until at least one operator runs into that ceiling.
- **Per-skill notification preferences**: "tell me when this skill fires but not when that one fires." Deferred — premature until operators have lived with the unified toggle.

---

*Source: `deliverables/mockups/schedule-float-variants-2026-06-01.html` (variant pick) + founder amendment 2026-06-01.*
