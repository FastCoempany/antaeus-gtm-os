# ADR-011 — Birdseye Float (Phase D of the orchestration layer)

**Status:** Approved by founder 2026-05-31
**Date:** 2026-05-31
**Builds on:** ADR-004 (orchestration foundation), ADR-009 (workspace-scope observations), ADR-010 (Skills layer)

---

## Context

ADR-004 §Phasing called Phase D "birdseye strip + inter-room push — strip mounts on every room, wired to session + ledger." With Phase B observations live and Phase C skills shipping, the missing piece is a persistent surface that gives the operator the system's read of what to do next regardless of which room they're in.

A design-review artifact (`deliverables/mockups/phase-d-and-e-variants-2026-05-31.html`) framed three open dimensions — placement, visibility, semantics. The founder locked the picks on 2026-05-31.

## Decision

**Phase D ships as a floating collapsible icon on every room** that expands to a small drawer showing the system's single ranked "what to look at next" line. Five locked design points:

1. **Surface**: a floating element anchored to the bottom-right of the viewport. Mounts via `RoomChrome` (already on every room). Persistent across navigations; same position on every page. Renamed `BirdseyeFloat` (vs the original "birdseye strip" framing) because the locked design isn't a strip — it's a collapsed icon that expands to a drawer.

2. **Visibility model** (founder picks D1-C + D2-B): collapsed-by-default. Default state is a small eye icon with an optional count badge when there's a `NextMove` more urgent than the room the operator is currently in. Click expands to a ~280px-wide floating drawer. Click again (or click outside the drawer) collapses back to the icon.

3. **Content semantic** (founder pick D3-C): the drawer surfaces ONE ranked line — the highest-pressure `NextMove` across the workspace. A `NextMove` carries: label ("Cast a proof for Cascadia Health"), reason ("stalled 14 days, hot account, no proof on file yet"), and target URL with continuity params. No list, no "recent activity" trail, no multi-row digest. The system commits to one read.

4. **Ranker inputs** (v1): observations ledger (Phase B), Deal Workspace `recovery_rank`, Signal Console hottest account heat. Briefing Patterns slot in later (when B.X+ ships) via the existing cross-deduping infrastructure. Source priority is a stable composite score — higher pressure beats lower pressure regardless of source.

5. **Click handler**: the drawer's "Open →" button routes to the `NextMove.targetUrl`. URL is built with continuity params (`returnTo` / `returnLabel` / `focusObject` / `focusRoom` / `fromMode` / `fromSurface`) so the destination room handles the inbound the same way it handles any other cross-room handoff (existing HandoffStrip pattern).

### What this is NOT

- **Not a dashboard.** One line, not a digest. The Dashboard is still the canonical command surface; the Birdseye is the ambient "the system has something for you" signal.
- **Not a notification system.** No toasts, no badges-that-yell, no growls. The icon-with-count is the only ambient signal; it stays quiet unless the system genuinely has something pressing.
- **Not a new product surface.** Per ADR-008's additive boundary, the orchestration layer stays beneath the rooms. The float sits ON TOP of every room visually but doesn't change what the room knows or does.
- **Not real-time push.** The drawer reads observations + room state on open. No socket subscription; no live-updating ticker. The system runs at the heartbeat cadence (Phase A) and the operator sees what's accumulated since the last open.

## Alternatives considered (rejected)

**Top-of-room thin strip (D1-A)**. Always-visible single line under the wordmark. Rejected because it eats ~40px of every room's first fold; conflicts with rooms whose first fold is composition-locked per canon Part II.

**Bottom-of-room strip (D1-B)**. Lives above the HandoffStrip. Rejected because operators who don't scroll to the bottom of a room would miss it; loses the ambient-signal property.

**Observations-related-to-focused-object (D3-A)**. Surface observations whose `related_object_id` matches the room's current focus. Rejected because most rooms aren't "about" a single object; produces an empty signal often.

**Recent actions trail (D3-B)**. "Here's where you were just now." Rejected because the back-pill already shows return-context; trail is redundant with browser history.

**Always-visible thin strip (D2-A)**. Strip is never collapsed. Rejected because it makes every room carry it even when there's nothing pressing — drives operator habituation (banner blindness).

## Implementation plan (Phase D build)

Single branch, six waves, single PR.

| Wave | Scope |
|---|---|
| 1 | This ADR + canon updates (Part II.5 §7 Phase D reframe, Part V §6 session-log entry) |
| 2 | `NextMove` ranker (`src/birdseye/lib/`): pure function that takes observations + deal pressure + hot accounts → returns a single ranked `NextMove` candidate (or null) |
| 3 | `BirdseyeFloat` component (`src/birdseye/`): collapsed icon ↔ expanded drawer state machine; renders the ranked `NextMove` with reason + Open button |
| 4 | RoomChrome integration: mount the float once per app; persistent state across room navigations |
| 5 | Click handler routes via continuity params (reuses `src/lib/continuity.ts` helpers) |
| 6 | E2E smoke + final sweep |

CI gates: typecheck + vitest + Playwright + Vite build, all green before merge.

## Voice rule

The `NextMove` label + reason MUST pass `validateObservation()` from `src/lib/voice/voice-document.ts`. The same gate Phase B + Phase C use. Ranker outputs that fail the gate are dropped (logged); the drawer falls back to the next-highest candidate or "Nothing pressing right now" if none pass.

## Authority

This ADR + the `NextMove` ranker in `src/birdseye/lib/` + the `BirdseyeFloat` component. The ranker's source priority is the binding contract; adding a new source (e.g., Briefing Patterns when B.X+ ships) requires updating the ranker AND a new ADR amending this one.
