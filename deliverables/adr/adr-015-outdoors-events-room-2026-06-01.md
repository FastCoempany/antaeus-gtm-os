# ADR-015 — Outdoors Events room

**Status:** Approved by founder 2026-06-01
**Date:** 2026-06-01
**Resolves:** `deliverables/specs/conferences-networking-scoping-2026-05-29.md`

---

## Context

A "conferences / networking" room was queued in the 2026-05-28 session and a scoping doc was drafted on 2026-05-29 with three candidate interpretations. The doc had been waiting on founder pick.

On 2026-06-01 the founder picked, with five locked design points (verbatim):

> * should sit next to briefing and a bonus tab or chip of some kind on the world tab
> * standalone conferences room staged > **Stage:** First ship — minimum Conferences room — single table, list + edit + status. No cross-room handoff yet. Lets the founder use the room and confirm the shape is right before the room earns its cross-room integrations. After first use: add Sourcing Workbench handoff (push contacts to prospects). Later: Signal Console attribution + Deal Workspace sourced-from tag.
> * make it "Outdoors Events" not conferences
> * i dont care about tracking deals sourced from events or post event roi. this is strictly an information room for the user to see whats happening outside in their world where people are gathering and the like. Social and serius. Conferences and mixers and whatever else. Hell if their icp persona might be at a gun show — name it.
> * conference is not to be added as a sacred noun and its not to be banned either
> * live instrument

This ADR locks all five.

## Decision

**Outdoors Events is a new Live Instrument room** at `/outdoors-events/` for tracking offline gatherings where the operator's ICP persona might be present. **Strictly informational** — the operator names the events, tags them, decides whether to engage. No ROI tracking. No deal-attribution. Conferences, mixers, trade shows, meetups, informal hangs, gun shows — anything the operator wants to see on their radar.

Seven locked design points:

1. **The room name is "Outdoors Events" verbatim** — kept as the founder wrote it. URL `/outdoors-events/`. Kicker `OUTDOORS EVENTS`. Title can be conversational.

2. **Live Instrument family** (canon Part II §4.3). Top of the room is a working console (compose a new event, edit existing). The list of events sits below — operator switches status inline, edits inline, adds new inline. Action controls are real and proximal. No tabs, no report posture.

3. **First-ship scope = single table, list + edit + status.** No cross-room handoffs (yet). Operator authors events by hand. The room earns its cross-room integrations only after the founder uses it and confirms the shape. **Defer:**
   - **Phase 2 (post first-use):** Sourcing Workbench handoff — push event-tagged contacts into prospect rolls.
   - **Phase 3 (later):** Signal Console attribution + Deal Workspace sourced-from tag.

4. **"Outdoors Events" is NOT a sacred noun** (canon §2 unchanged). Events do not flow as sacred objects through other rooms. Per founder: "not to be added as a sacred noun and not to be banned either" — event references in copy elsewhere are fine; they're just not part of the protected noun set the system organizes around.

5. **Bonus chip on the Briefing's World view.** A small chip in the Briefing room (visible only when the World view is active) that routes to `/outdoors-events/`. The chip is navigation only — no data flow from Outdoors Events into the Briefing surface, no preview, no count badge. Per first-ship scope, the chip is the lightest possible cross-reference.

6. **The schema is minimum-viable.** A single `outdoors_events` table:
   - `name` (required) — what the operator calls it
   - `kind` (free text) — "conference", "mixer", "gun show", "meetup" — operator authors, no enum
   - `where_at` (free text) — city, venue, virtual, however the operator wants to identify the location
   - `start_date`, `end_date` (optional dates) — when, if known
   - `status` (enum, default "watching"): `watching` | `planning` | `attending` | `attended` | `passed` | `archived`
   - `tags` (text array) — persona / industry / whatever the operator wants to filter on
   - `notes` (free text)
   - `source_url` (optional) — link to the event page
   - Workspace-scoped RLS via the existing `is_workspace_member()` helper

7. **Voice + posture:** the room reads like a peer maintaining a calendar of "things worth knowing are happening." Not a CRM screen. Not a logistics tracker. Not a marketing-ops surface. Plain sentences. No invented vocabulary.

### What this is NOT

- **Not deal attribution.** No "this deal came from this event" field. No ROI report. No conversion tracking. If the operator wants to remember that a deal originated at an event, they can add a note to the deal in Deal Workspace — out of scope here.
- **Not an event-discovery feed.** The system doesn't propose events. The operator authors them.
- **Not a registration tool.** No ticketing integration, no calendar export, no headcount tracking.
- **Not a Briefing competitor.** The Briefing surfaces what the SYSTEM saw; Outdoors Events surfaces what the OPERATOR is watching. Different streams of attention.

## Alternatives considered

**Option A — Add to the Briefing as a third view.** Rejected: the Briefing is the system's read of the world; Outdoors Events is the operator's curated calendar of attention. Different jobs, different posture. Folding them would muddy both.

**Option B — Just an Outdoor Events tag on existing Account rows.** Rejected: events are a thing of their own with a calendar, a status lifecycle, and operator-authored tags. They aren't a property of an account.

**Option C — Full conferences + ROI + attribution from day one.** Rejected by founder explicitly: "i dont care about tracking deals sourced from events or post event roi."

## Implementation notes

**Files added (single PR):**
- `deliverables/adr/adr-015-outdoors-events-room-2026-06-01.md` — this ADR
- `supabase/migrations/<ts>_outdoors_events.sql` — schema
- `src/outdoors-events/` — room scaffold (Briefing-style layout)
  - `main.tsx`, `index.html`
  - `OutdoorsEvents.tsx`
  - `state.ts`
  - `outdoors-events.css`
  - `components/Topbar.tsx`
  - `components/EventComposer.tsx` (top-of-room console)
  - `components/EventList.tsx` (status-grouped list)
  - `components/EventRow.tsx` (inline edit + status switcher)
  - `lib/types.ts`, `lib/persistence.ts`, `lib/persistence.test.ts`
- `src/briefing/components/OutdoorsEventsChip.tsx` — Briefing World-view chip
- `tests/e2e/smoke.spec.ts` — boot smoke test

**Files touched:**
- `vite.config.ts` — new entry
- `src/lib/palette/registry.ts` — palette registration
- `CLAUDE.md` §4 — new §4.22 + family list update + session log
- `src/briefing/Briefing.tsx` — mount the chip in World view

**Schema regen** — after migration applies, `database.types.ts` gets regen'd (or hand-extended for v1 if regen tooling isn't run on every PR; the auto-apply chain shipped in PR #196 means the migration runs on merge).

**Hook-free** per canon Phase 4 / Room 9 — module-level signals.

**Voice gate** — all operator-facing copy passes canon Part III §11.

## Risk + rollback

- **Risk:** the first-ship version has no cross-room data flow, so the room could feel inert if the operator doesn't author anything. Mitigated by including an empty-state that explains what the room is for ("authored events that matter to your motion — what you're watching, what you're going to").
- **Rollback:** the room's Vite entry can be removed in one PR; the migration stays applied (additive, no destructive change to existing tables); palette entry removed; Briefing chip unmounted. The cost of full removal is a few file deletions + a migration that stays in the DB doing nothing.

## Open

- **Phase 2 (Sourcing Workbench handoff).** Operator wants to push contacts they meet at an event into the prospect roll. Shape: an "Add prospects from this event" button on each event row → routes to Sourcing Workbench with continuity params + a `?from-event=<id>` so the prospect rows get tagged with the source event. Picks up after founder confirms the first-ship shape.
- **Phase 3 (Signal Console attribution + Deal Workspace sourced-from tag).** Once contacts route through Sourcing → Signal → eventually become Deals, an attribution chain could surface "this deal traces back to event X." Explicitly out of scope for v1.

---

*Resolves: `deliverables/specs/conferences-networking-scoping-2026-05-29.md`.*
