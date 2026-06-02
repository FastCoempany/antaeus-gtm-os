# ADR-016 — Outdoors Events as a discovery surface (Signal Console pattern)

**Status:** Approved by founder 2026-06-01
**Date:** 2026-06-01
**Supersedes:** ADR-015 §3 (first-ship scope: "operator authors events by hand") and §6 (schema as minimum-viable manual-tracker shape)
**Builds on:** ADR-006 (Briefing room pipeline pattern), ADR-015 (room mind)

---

## Context

ADR-015 (earlier on 2026-06-01) shipped Outdoors Events as a **manual tracker** — single table, operator authors events by hand, status lifecycle, no discovery. First-ship scope per the founder pick.

Within hours of shipping, the founder caught a miscommunication: that wasn't the intent.

> "we got this wrong. (i did). i didnt explain properly. The outdoors events page is supposed to mimic signal console in terms of what it does — it should find events out in the world relative to the product category, adjacent to it, indirect to it, etc — and autopopulate it there"

The room is supposed to be a **discovery surface**, not a manual tracker. Mirrors how Signal Console enriches accounts and how the Briefing pipeline surfaces market patterns: the system finds what's relevant to the operator's product category and populates the room; the operator marks, prioritizes, dismisses.

On 2026-06-01 the founder picked two locked design points to drive the reframe:

1. **Web-search-grounded LLM discovery** — pipeline mirrors the Briefing's `sources/` pattern. Real web search produces real source URLs; LLM enriches the results into typed event rows with relevance reasoning. No external events-API integration (the slice problem — each API covers part of the event world; web search is the most coverage for the least integration). No pure-LLM proposal (hallucination risk on dates/URLs is too high to ship as fact).
2. **Discovery only — no manual add.** The room is populated by the discovery pipeline. The operator can mark status (`watching` → `planning` → `attending` → `attended` → `passed` → `archived`) and dismiss, but cannot author events from scratch. If the discovery missed a private invite, that lives outside this room.

## Decision

**Outdoors Events is a Signal-Console-style discovery surface.** A pipeline reads the workspace's product category, runs web-search-grounded queries for offline gatherings in that space + adjacent + indirect, enriches results into typed event rows, scores by relevance tier, and upserts to `outdoors_events`. The operator's job in the room is to mark, prioritize, and dismiss — not to author.

Seven locked design points:

1. **Discovery cadence — on-demand only.** Founder direction 2026-06-02 (amendment, post-PR 2 ship): no weekly cron. The operator triggers discovery by clicking "Run discovery now" in the room when they want a fresh sweep, and not before. Cost stays bounded to operator-initiated runs; the room never burns budget while the operator is away. The cron migration that landed in PR 2 (`20260601230000_outdoors_events_discovery_schedule.sql`) was deleted in the cron-kill PR that locked this. If a scheduled fire is wanted later, a new migration adds it cleanly. The Edge Function's `run_all` action survives as a manual admin escape-hatch (curl-invokable) but is not wired to any scheduler.

2. **Relevance tiers** — operator-facing grouping axis (replaces ADR-015's status-as-primary grouping). The pipeline scores each event into one of three tiers:
   - **Direct** — gathering specifically about the operator's product category (e.g. RSA Conference for a security product).
   - **Adjacent** — gatherings of buyer personas the operator sells INTO (e.g. CISO summit for a security product). The persona's there even if the event isn't about your category.
   - **Indirect** — gatherings where the operator's ICP might show up despite the event not being category- or persona-direct (e.g. a regional CRO meetup; the founder's "gun show if the ICP persona is there" case).

3. **Status lifecycle stays.** The 6-state status (`watching` → `planning` → `attending` → `attended` → `passed` → `archived`) carries forward unchanged. Default for newly-discovered events is `watching`. The operator moves them through the lifecycle.

4. **Schema additions** (ADR-015's table extended, not replaced):
   - `relevance_tier` (enum `direct` | `adjacent` | `indirect`) — required
   - `relevance_reason` (free text) — the LLM-authored sentence explaining why this event showed up for this category. Voice-validated.
   - `discovered_at` (timestamp) — when the discovery pipeline first surfaced this event
   - `source_kind` (text) — `discovery_run` | `seed` | (future: `manual` if we ever re-open authoring)
   - `dedupe_key` (text) — workspace-scoped slug from name + start_date + city, prevents the same event surfacing twice across runs
   - **`created_by` becomes nullable** — system rows have NULL; existing rows are preserved via the column being added nullable.
   - **New table `outdoors_events_runs`** — ledger of each discovery cycle (run_id, started_at, completed_at, status, workspace_id, total_cost, event_count, error_summary). Mirrors `briefing_runs`.

5. **Audit envelopes.** Each discovered event carries an audit-envelope reference (the cluster of search hits that produced it, the LLM call chain, the voice-gate decision). Lighter than Briefing envelopes — events are simpler objects than Patterns — but the chain is preserved so "where did this come from" is always answerable.

6. **Cost ceiling.** Per-workspace weekly LLM ceiling, separate from the Briefing's. Degradation: warning at 80%, throttle at 100% (drop adjacent + indirect tiers, keep direct), pause at 150%. Footer telemetry on the room same as the Briefing.

7. **Voice gate** applies to every operator-facing string the pipeline writes: `name` (if reformatted), `relevance_reason`, `notes`. The `src/lib/voice/` validator (canon Part III §11) is the ceiling. Events whose relevance_reason fails the gate are dropped, not re-rolled.

### What this is NOT

- **Not deal attribution.** ADR-015's posture holds: no ROI tracking, no "this deal came from this event" field. The pipeline finds events; what the operator does with them lives in their head + other rooms.
- **Not an event-registration tool.** No ticketing, no calendar export, no headcount tracking.
- **Not a manual authoring surface.** ADR-015's EventComposer retires when PR 2 ships. PR 1 (this PR) demotes it to a deprecated-but-functional fallback with a banner.
- **Not real-time.** Weekly cadence by default, on-demand refresh via button. No webhooks, no streaming.

## Alternatives considered

**Option A — Manual tracker (ADR-015's first ship).** Already shipped. Founder caught the miscommunication: that wasn't the intent. Superseded by this ADR.

**Option B — Events-API integration (Eventbrite / Luma / Meetup).** Rejected by founder: each API covers a slice of the event world; missing the big industry cons + the long tail. Web-search-grounded LLM gives the most coverage for the least integration overhead.

**Option C — Pure LLM proposal (no web grounding).** Rejected by founder: hallucination risk on dates and URLs is too high to ship as fact. The operator can't trust a "DEF CON 2026" entry if the model invented the date.

## Implementation plan

**PR 1 — Doctrine + schema + UI reframe (this PR).**
- ADR-016 (this file)
- Canon §4.22 rewrite — Outdoors Events as a discovery surface
- Schema migration: extend `outdoors_events` with the new columns + add `outdoors_events_runs` table
- `database.types.ts` + `data-client.ts` accessor for the new ledger table
- UI: banner explaining the reframe ("Discovery wiring in next PR — this is what's coming"); manual composer demoted (smaller, secondary affordance, deprecation note inline); event rows render `relevance_tier` chip + `relevance_reason` if present (legacy rows show nothing for these fields; they're nullable)
- Tests adjusted

**PR 2 — Discovery Edge Function + UI flip.**
- `supabase/functions/outdoors-events-discovery/` — pipeline:
  1. Read `workspace_profile.product_category` + adjacencies
  2. Generate query plan (LLM-driven: direct / adjacent / indirect search angles)
  3. Web-search dispatch (Anthropic web_search tool from the Edge Function)
  4. Enrich results into typed event rows (LLM call per result cluster)
  5. Score relevance tier
  6. Voice-validate
  7. Upsert with `dedupe_key`
- "Run discovery now" button in the room → invokes the function (operator-initiated, only path that actually runs discovery)
- UI flip: composer retires, primary grouping is relevance tier (Direct / Adjacent / Indirect), secondary is status within each tier
- Cost telemetry footer
- Audit envelope viewer (light version)

## Risk + rollback

- **Risk:** PR 1 leaves the room in an in-between state — discovery doctrine locked but pipeline not built. Mitigated by keeping the manual composer functional (deprecated but usable) until PR 2 lands. Operator can still add events by hand during the gap.
- **Rollback:** the manual composer stays alive through PR 1, so reverting PR 2 brings the room back to a usable state. The schema additions are additive (nullable columns + a new table) so no data is lost on rollback.

## Open

- **Cron, if ever** — locked off post-PR 2. Adding it later means a fresh migration; no doctrine work needed if the founder asks for it.
- **Cross-room handoffs** — ADR-015 deferred Phase 2 (Sourcing Workbench handoff) + Phase 3 (Signal Console attribution + Deal Workspace sourced-from tag). Those phases survive this reframe — they unblock once the operator has used the discovery-driven room and confirmed the shape.

---

*Supersedes ADR-015 §3 + §6. ADR-015 §1 (name), §2 (Live Instrument family), §4 (not a sacred noun), and §5 (Briefing chip) all stand.*
