# Conferences / networking — scoping doc

**Status: founder review pending**
**2026-05-29**

The founder referenced "conferences/networking tab" as queued work
during the 2026-05-28 session ("Queued outside Briefing: ... Conferences
/ networking tab (founder mentioned earlier, not specced)"). Per the
2026-05-29 session directive ("Run them all in the order you see
fit. To completion"), this doc proposes three candidate interpretations
and asks the founder to pick before any code or canon §4 work begins.

Per canon Part IV §4 ("The mind-correction protocol"), substantive
mind changes — and adding a new room IS a mind change — need explicit
founder approval. This doc is the proposal, not the commitment.

---

## 1. What was said + the gap

In the 2026-05-28 closeout, the founder mentioned "conferences/networking
tab" alongside Phase 4.5 retrofits and the retroactive critic as
queued work. No spec was written and no canon §4.X exists for it.

Three things the spec does NOT say:
- Whether it's a standalone room or a tab inside an existing room
- Which existing room family it sits closest to (Sourcing Workbench
  for the prospect-channel angle? Signal Console for the events-as-
  signals angle? Outbound for the outreach-from-events angle?)
- Whether the unit of value is the event itself (conference as object)
  or the contacts met there (people as objects, conference as tag)

This doc names three candidate shapes and recommends one. Founder
picks; coding follows.

---

## 2. Three candidate interpretations

### Option A — Standalone Conferences room

A new top-level room in canon §4 sitting alongside Sourcing Workbench
+ Signal Console. Family: Live Instrument (since the operator
attends events live, the room is the working surface during + after).

Sacred noun: **Conference**. Fields:
- name, dates (start + end), location (city or virtual)
- status: considering | committed | attended | passed
- cost_usd (registration + travel)
- contacts_met[]: list of contact handles (linked to existing accounts
  in Signal Console where applicable, or freeform names)
- outcomes: { deals_sourced: int, deals_closed: int, dollars: numeric }
- notes
- post-event ROI verdict computed: dollars / cost_usd

**Strategic logic:** turn the founder's "do I go to this conference"
intuition into a tracked, learnable surface. Past ROI informs future
decisions. The room is the conference-decision system.

**Cross-room compounding:**
- Sourcing Workbench reads `contacts_met[]` as a prospect source
  (alongside QueryStudio's algorithmic sourcing)
- Signal Console can tag accounts with `met_at: conference_id` to
  surface conference-attribution alongside other heat sources
- Deal Workspace optionally links a deal to a `sourced_at:
  conference_id` for ROI attribution

**Size:** medium room. ~5 PRs to ship (schema + state + UI + cross-
room handoffs + tests). Substantial commitment.

### Option B — Sub-tab inside Sourcing Workbench

A second tab in Sourcing Workbench alongside its current "QueryStudio
+ Pipeline" view. The new tab is "Events" with a list of upcoming
conferences and a "Push these to prospects" handoff that creates
prospect rows for contacts met.

**Strategic logic:** conferences are one of many prospect channels;
Sourcing Workbench is the prospect-channel hub. A "Events" tab
generalizes the room's "fish where the fish are" framing.

**Cross-room compounding:** narrower than Option A — only Sourcing
Workbench is affected. No Signal Console attribution; no Deal Workspace
sourced-from tag.

**Size:** small. ~2 PRs (schema delta + tab UI).

### Option C — New source type for the Briefing pipeline

Conferences as **a fetcher source** alongside HN Algolia + TechCrunch RSS
etc. The fetcher ingests speaker lists + sponsor rosters + attendee
counts of conferences in the operator's watchlist industries; the
Briefing pipeline clusters them into Patterns ("3 of your watched
companies are speaking at SaaStock — they're investing in the EU
expansion narrative your earlier read missed").

**Strategic logic:** events are signals like any other. The Briefing
already surfaces what other rooms can't surface alone; conferences are
just a missing data source.

**Cross-room compounding:** zero direct — feeds the Briefing only.
No new room, no new tab, no sacred noun added to canon §2.

**Size:** small-to-medium. ~3 PRs (new fetcher + corpus + tests).

---

## 3. Recommendation: Option A, but staged

Option A is the highest-leverage interpretation for the founder-buyer
(canon §1 — founder-led B2B teams who travel a meaningful amount).
The ROI feedback loop is genuinely missing from the current product
surface; nothing in §4 helps the founder decide which event to attend
next.

**Stage:**
1. **First ship: minimum Conferences room** — single table, list +
   edit + status. No cross-room handoff yet. Lets the founder use
   the room and confirm the shape is right before the room earns its
   cross-room integrations.
2. **After first use:** add Sourcing Workbench handoff (push contacts
   to prospects).
3. **Later:** Signal Console attribution + Deal Workspace sourced-from
   tag.

Why staged: a new room added to canon §4 is a meaningful commitment;
shipping the minimum first lets the founder use it and decide whether
the cross-room work is worth doing without sinking the time upfront.

Option B is the cheap fallback if the founder doesn't want a new room
in the catalog. Option C is interesting but tangential to "tab" — it
adds nothing visible to the operator outside the Briefing's existing
surface.

---

## 4. Open questions for the founder

Before any code lands:

1. **Which option?** A staged, B narrow, C invisible-to-room, or
   something else?
2. **For Option A:** is "Conferences" the right name, or "Events"
   broader? (Conferences implies multi-day industry events;
   "Events" includes single-evening networking nights, meetups,
   roadshows.)
3. **For Option A:** is the post-event ROI computation worth the
   complexity, or should v1 just track presence and let the founder
   eyeball ROI from the deal-sourced count?
4. **Sacred-noun question:** if Option A ships, does Conference get
   added to canon §2 as a new sacred noun, or does it inherit from
   an existing one (Account? Signal? Contact)?
5. **Family question:** if Option A ships, is Live Instrument the
   right family, or is Decision Bench (strategic shaping — "which
   events to commit to") closer to the operator's actual flow?

---

## 5. What this PR does NOT do

- Add a §4.X entry to canon for the Conferences room
- Write any code
- Add any schema migrations
- Open follow-up PRs (those wait on the founder's option pick)

This doc is the proposal. Reply with which option (or which mix) and
the open-questions answers, and the implementation PRs follow.
