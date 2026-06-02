# Outdoors Events spec-vs-shipped audit

**Audited:** 2026-06-02
**Specs:**
- ADR-015 (`deliverables/adr/adr-015-outdoors-events-room-2026-06-01.md`) — room mind + family + not-a-sacred-noun + Briefing chip
- ADR-016 (`deliverables/adr/adr-016-outdoors-events-discovery-surface-2026-06-01.md`) — supersedes ADR-015 §3 + §6 (manual-tracker first-ship retired in favor of discovery surface)
- Canon §4.22 (post-ADR-016 rewrite)
- Cron-kill amendment (PR #243, 2026-06-02) — on-demand-only doctrine

**Auditor:** Claude (Step B of the A/B/C/D arc)

> **Note on baseline.** Outdoors Events has no triptych — it was authored against ADR-015 first (manual radar), then re-minded against ADR-016 within 24 hours (discovery surface). This audit compares the shipped Preact room against the locked ADR-016 mind + canon §4.22, with the cron-kill amendment applied. Triptych-vs-shipped doesn't apply; this is spec-vs-shipped.

---

## Mind preservation — PASS

Canon §4.22 (post-ADR-016) preserved end-to-end:

- ✅ **Live Instrument family** — Topbar + DiscoveryConsole at top + EventList below + manual EventComposer demoted to ghost fallback at the bottom (`OutdoorsEvents.tsx`).
- ✅ **Discovery posture** — operator does NOT author from scratch as the primary path; system surfaces events via Edge Function; `EventComposer` is explicitly secondary with "+ Add one by hand" + copy admitting "Discovery does the finding. But if you already know about a gathering the system hasn't surfaced — a private invite, a local hang — add it here."
- ✅ **Relevance tier as primary grouping axis** — `EventList` groups by Direct / Adjacent / Indirect (`eventsByTier` computed in `state.ts`). Untiered events (legacy + manual) collect in a trailing "Added by hand" bucket. Empty tiers are skipped per ADR-016 §Decision 2.
- ✅ **Status lifecycle stays** — 6-state status (`watching → planning → attending → attended → passed → archived`) carried forward unchanged on `EventRow`. Newly-discovered events default to `watching` (Edge Function `index.ts:upsertEvents`).
- ✅ **Cost ceiling + degradation** — `WEEKLY_CEILING_USD = $2.00`, `THROTTLE_AT = $1.00` (drops to direct-tier-only with fewer searches), `PAUSE_AT = $3.00` (1.5× ceiling, writes a `paused` ledger row). Implementation matches ADR-016 §Decision 6 exactly.
- ✅ **Voice gate** — `passesVoiceLite` runs on every `relevance_reason` in `_shared.ts`. Events whose reason trips the banned-vocab gate are DROPPED, not re-rolled (ADR-016 §Decision 7).
- ✅ **Hallucination guard** — every event must carry an `https://` URL or it's dropped at parse time (`parseDiscoveredEvents`). System prompt forbids inventing events/dates/URLs.
- ✅ **Audit envelope chain** — `outdoors_events.run_id` FK to `outdoors_events_runs.id` answers "where did this event come from" deterministically.
- ✅ **Briefing cross-reference** — `OutdoorsEventsChip` on the Briefing's World view, navigation-only, no data flow (`src/briefing/components/OutdoorsEventsChip.tsx`).
- ✅ **Not a sacred noun** — events don't appear in canon §2 noun table; no protected-object rules apply.

No mind drift.

---

## Doctrine alignment with cron-kill amendment — PASS

PR #243 (2026-06-02) locked on-demand-only after the first successful production run. Shipped state matches:

- ✅ `supabase/migrations/20260601230000_outdoors_events_discovery_schedule.sql` **deleted**. No cron migration on disk.
- ✅ Edge Function `index.ts` accepts both `run_one` (button-invoked) and `run_all` (manual admin escape-hatch). `run_all` survives but isn't wired to a scheduler.
- ✅ README documents on-demand only + the `run_all` admin path.
- ✅ Canon §4.22 Discovery cadence reflects "on-demand only" (cost ceiling still applies as backstop).

---

## Structural drift — minor, all in keep-or-defer bucket

### A. Things the shipped room evolved past the original ADR-015 vision (KEEP)

| ADR-015 (first ship) | ADR-016 (current, shipped) | Why the evolution is right |
|---|---|---|
| Operator-authored manual tracker | Discovery surface with system-populated events | Founder reframe within hours of first ship; doctrine corrected to match real intent |
| Status as primary grouping axis | Relevance tier as primary axis, status secondary within each tier | ADR-016 §Decision 2 — tiers are the organizing question ("what's the system saying matters?"); status is the operator's annotation on top |
| Single `outdoors_events` table | `outdoors_events` + new `outdoors_events_runs` ledger | ADR-016 §Decision 4 — audit envelope chain requires a run ledger |

### B. Things shipped that drift from ADR-016 (FIX)

None caught in this audit. The room matches its locked mind end-to-end. Any drift between the ADR-015 first-ship and the ADR-016 reframe was closed in PR 1 (#239) + PR 2 (#240) + CORS hotfixes (#241, #242).

### C. Explicitly deferred (ADR-015 §Open, ADR-016 §Open)

| Item | Why deferred | Trigger to unblock |
|---|---|---|
| Sourcing Workbench handoff (Phase 2) | Operator hasn't used the room enough to confirm the shape | Founder confirms tier-grouped event flow is useful after a week of real runs |
| Signal Console attribution (Phase 3) | Same — earn it through use | Same |
| Deal Workspace `sourced-from` tag | Same — earn it through use | Same |
| Cron schedule | Locked off per PR #243 | A future founder amendment if weekly auto-runs become wanted |
| Audit envelope viewer in the room | Out of MVP scope; the ledger table carries the data | Operator asks to see "where did this event come from" interactively |

All five are correct deferrals — the operator hasn't used the discovery room enough to know what the natural next move should be.

---

## Voice — PASS

Canon Part III §11 (write what you mean, not a single noun pointing at it) applies. The room's user-facing copy:

- **Topbar headline:** "Where people are gathering, found for you." — plain, conversational, doesn't reach for a category-shaped noun.
- **Topbar sub:** "The system reads your product category and finds offline gatherings worth knowing about — direct to your space, adjacent to it, and indirect-but-buyer-relevant. Conferences, mixers, trade shows, meetups. You decide which ones matter." — sentences a peer would say.
- **DiscoveryConsole hint:** "Reads your product category and finds gatherings — direct, adjacent, and indirect — with real source links." — concrete.
- **DiscoveryConsole busy state:** "Searching the world…" — peer voice.
- **EventComposer (demoted):** "Discovery does the finding. But if you already know about a gathering the system hasn't surfaced — a private invite, a local hang — add it here." — natural speech.
- **Empty state:** "DISCOVERY HASN'T RUN YET" + "The system will find events worth knowing about." — directional, non-decorative.
- **Tier chips:** plain `Direct` / `Adjacent` / `Indirect`. No invented compound nouns.

The voice-lite gate at the Edge Function layer enforces the same discipline server-side on every `relevance_reason` the model generates.

---

## Fix scope — none for this PR

The shipped room matches its locked mind. This audit ships a doc, no code changes.

---

## Acceptance walk (re-verify when changes land here)

To re-verify this audit later, walk:

1. Topbar renders the headline + sub from §Voice above verbatim.
2. DiscoveryConsole is the top working surface; primary CTA is `Run discovery now`.
3. Below the console: EventList grouped by tier (Direct first, then Adjacent, then Indirect; empty tiers hidden).
4. Below the tier groups: untiered events (legacy + manual) collect in an "Added by hand" trailing group.
5. At the bottom: EventComposer in collapsed ghost-button mode, copy admits manual is fallback.
6. Pressing `Run discovery now` invokes the Edge Function; the busy state surfaces; on success new events appear in their tier; on failure the inline error surfaces the function's `result.error`.
7. The Briefing's World view shows the OutdoorsEventsChip; click navigates here.

All seven assertions hold against the shipped 2026-06-02 state.

---

*Audit owes for the other 4 spec-only rooms — Onboarding, Negotiation, Founding GTM, Readiness, Briefing — are tracked in the master roll-up at `antaeus-refacing-vs-shipped-rollup-2026-06-02.md`.*
