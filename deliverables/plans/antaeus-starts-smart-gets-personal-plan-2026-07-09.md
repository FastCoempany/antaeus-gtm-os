# Starts smart, gets personal — the capture + priors plan

**Date:** 2026-07-09
**Status:** founder-directed (this doc records the corrections given 2026-07-09); bulk capture shipped same day
**Owner:** founder
**Companion to:** canon Part III (behavioral doctrine), the wire-to-production plan (2026-07-07)

---

## The problem this answers

Several surfaces promise deal insight that only materializes if the operator
feeds substantial historical, current, and daily data — the CRM failure mode
wearing our clothes. The insight ladder today:

| Tier | Surfaces | What feeds it | Time to value |
|---|---|---|---|
| 1 — judgment-fed | ICP, Territory, quota *plan*, Discovery cockpit, Cold Call plan, Pilot Desk, Getting to Signed | onboarding seeding + enrichment | minute one (by design) |
| 2 — behavior-fed | signal heat, "where you are with them," decay reads, quota *pace*, heartbeat observations | touches/calls logged + time passing | ~2–4 weeks, **if they log** |
| 3 — outcome-fed | Future Autopsy calibration, Founding GTM §§1/2/4/5/6, upper Readiness rungs, loss patterns | closed deals | 1–2+ quarters, gated on the customer's own sales cycle |

Two currencies buy insight today: **time** and **typing**. Two more sit on
the table: **the operator's past** (backfill) and **everyone's aggregate /
authored priors**. The direction: *the system starts smart and gets
personal* — useful in the first hour, personal within a month, yours-alone
by the quarter.

**Hard constraint (founder):** not a drop of the new design surfaces
changes, except where a change is required to deliver these upgrades.

---

## 1 · Bulk capture — SHIPPED 2026-07-09

The pace read measures logged touches; nobody hand-logs 90 sends a day, so
the honest read became a false accusation ("you're 60 short" when the work
happened). Fix: one line at the end of the day — type today's real number,
the pace math counts it. Per-account logging stays for touches that matter
(a reply, a booked meeting); the daily volume count no longer depends on it.

- `src/quota-workback/v4/lib/bulk-outreach.ts` — `gtmos_bulk_outreach_v1`,
  local-date keyed daily counts, replace-not-append, defensive reads,
  2,000/day sanity clamp. Device-local by design (a tally, not a record).
- Wired into `readActuals()` outreach; one small input on the pace strand
  ("Sent more than you logged? Type today's real number." → **Count it**).

## 2 · Priors before posteriors — SHIPPED for Founding GTM 2026-07-10

The app is already full of priors (quota benchmark bands, the autopsy cause
tables, stage-death stories, heat weights, the discovery frameworks) — they
are authored industry judgment, unlabeled, and they never step aside. The
work:

1. Tier 3 surfaces render the authored band-level pattern on day one,
   labeled in the blue system-intelligence role: *"Based on teams like
   yours. Your own record takes over as it builds."*
2. As real data accrues, the content swaps to the operator's own pattern —
   visibly ("built from your 3 wins, not the benchmark"). The swap is the
   "gets personal" beat.
3. Two eras: **now** = authored/industry numbers (same provenance as the
   onboarding "why we ask" citations); **later** = true anonymized
   cross-workspace aggregates, once enough real workspaces exist (the
   stage-based benchmarking already sanctioned in canon Part III §5).

Surface-level change is a content source + a label per section — no layout
changes.

**Shipped 2026-07-10 (Founding GTM):** `src/founding-gtm/lib/priors.ts` —
every part of the open book renders a band-aware authored pattern when
empty, led by a blue "NOT YOUR RECORD YET" source note ("Based on teams
selling $X deals to <band> buyers — your own pattern takes this page over
as the work lands"). Every number is drawn from the same
`benchmarkFor(acv)` the Quota room uses — one source of truth. The
operator's own authored read wins the moment a section has anything real
to say (the existing path). Sweep of the other Tier 3 surfaces found no
other data-starved insight promise: Future Autopsy's empty state is a
happy state, Readiness is gate-based, the believability read is already
prior-driven with named benchmarks.

## 3 · Backfill lane — QUEUED

A founder with 18 months of history in a spreadsheet/old CRM has no way to
hand it over; their Tier 3 clock starts at zero for no reason. A rough
import (closed deals: amount, stage reached, loss reason, dates) capitalizes
Future Autopsy calibration, Founding GTM §§5/6, and believability on day
one. The heavy-seeding doctrine already frames win/loss history as
"invited, not gated" — this is that invitation made real.

## 4 · Auto-capture — the staged path, as CORRECTED by the founder 2026-07-09

The premise ("a modern-day sales helper" / "the system sees what is
actually happening") ultimately requires capture the operator doesn't type.
Stages, cheapest first — each writes into tables the rooms already read, so
no surface redesign:

| Stage | What | Founder direction | Integration burden on the user |
|---|---|---|---|
| 1 · BCC address | auto-BCC outreach to a per-workspace Antaeus address; inbound-parse matches watched accounts and logs the touch | primary capture path for this phase | none — works from any email client; set auto-BCC once |
| 2 · Read email (Gmail/Outlook OAuth) | sent mail + replies auto-matched | **OPTIONAL in Settings only, with full click-by-click instructions in an expandable section. NOT relied on at this phase.** (Google restricted-scope verification + annual CASA assessment is the long pole; start the clock only when we choose to.) | one click for the user once WE are verified; Workspace admins can block it |
| 3 · Calendar | meetings held stop being self-reported | build the **walk-off-the-street** version: paste your calendar's secret iCal link (Google/Outlook/Apple all expose one) — ~5 clicks, no OAuth, no admin, no Workspace. Server-side poll + match. The one-click OAuth version waits. | copy-paste one URL |
| 4 · Calls | call outcomes without typing | **No dialer in the app, ever.** Settings carries a deep, thorough guidance section: how to run calls with your own tools (OpenPhone/Aircall/Zoom/Meet), what to bring back, and how the after-call capture in Cold Call / Discovery wants it. Integrations later, guidance now. | n/a this phase |

Settings placement rule (founder): capture connections live in Settings as
quiet, optional, honestly-explained sections — never as core reliance, never
as setup walls.

## Sequencing

1. ~~Bulk capture~~ — shipped 2026-07-09.
2. ~~Priors + labeling pass~~ — shipped for Founding GTM 2026-07-10.
3. Backfill lane (closed-deal import).
4. Stage 1 BCC capture (needs founder-side inbound-mail provider + DNS
   setup; build the edge function + Settings section together).
5. Stage 3 ICS calendar (edge function + poll + Settings paste field).
6. Stage 2 email OAuth — only when chosen; optional-in-Settings framing per
   above. Start Google verification well before we want it live.
