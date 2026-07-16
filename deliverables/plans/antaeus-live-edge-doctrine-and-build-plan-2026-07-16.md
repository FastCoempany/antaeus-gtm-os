# The Live Edge — doctrine + build plan

**Date:** 2026-07-16
**Status:** design LOCKED (founder) · **BUILT 2026-07-16** — all three stages shipped in one pass (`src/lib/edge/`, mounted on 20 v4 rooms + the Settings mirror + the demo stream)
**Settled design files:**
- `deliverables/mockups/left-margin-live-edge-2026-07-14.html` — the combined edge (the count + the tagged wire + the ledger foot)
- `deliverables/mockups/live-edge-switch-settled-2026-07-16.html` — the corrected toggle (no standing controls; off you can see)
- Both mirrored in `deliverables/mockups/_settled-rooms-backup/`.
**Exploration record:** `left-margin-studies-{,2-,3-,4-,5-}2026-07-14.html` (15 rejected ideas across four rounds; round 5's live-presence family — Shift / Other Side / Count — is the one that landed) + `live-edge-toggle-triptych-2026-07-14.html` (TG-1 Tuck / TG-2 Switch / TG-3 From the Ground; founder picked TG-2, then corrected it into the settled switch).

---

## 1. What it is

The left wall of every room becomes the app's live presence — proof that the workspace is
awake and that the operator's work is being counted. One margin, three layers, top to bottom:

1. **Your count** — today's number against the daily habit the Quota room derived
   ("15 / 90 today · messages & calls — logged or captured"), with a thin pace track.
   Every captured or logged action ticks it up in front of you.
2. **The live wire** — recent events as plain sentences, each tagged by who moved:
   **you** (a send captured, a call logged), **the machine** (the heartbeat noticed
   something, a meeting synced, a search ran), **the buyers** (a reply landed, a meeting
   was accepted). A big buyer moment gets the orange left-rule and holds its place longer
   before dimming — canon's escalation rule (Part III §3 rule 7) applied to a feed.
3. **The ledger foot** — the quiet standing reads: which watched account is still silent
   ("STILL QUIET · MERCURY SINCE TUE") and the shift total ("SHIFT · 147 ACTIONS SINCE 7 AM").

It is a **renderer over data the system already collects**, not a new system. Every line
maps to an existing row (Part IV §5's test): outbound touches, captured meetings,
observations, signals, deals. A line that can't name its source row doesn't render.

## 2. Doctrine

**Accumulator, not ticker.** Early-stage B2B does not move fast — a real day is roughly
5–15 meaningful events, clustered around work blocks, with hours of nothing between. The
edge is honest about that shape: events accumulate and their age stamps re-write in place
(JUST NOW → 1M → 28M → 3H); nothing scrolls to fake motion. A dead morning reads plainly:
*"Nothing yet today — last movement yesterday, 4:12 PM."* The edge earns trust by being
right, not busy.

**Three voices, one wall.** The tags (you / the machine / the buyers) are the point — the
operator sees their own effort, the system working on their behalf, and the market
answering, in one column. When the buyer voice is thin (it will be, early), it stays thin.
We never synthesize buyer motion.

**The toggle (the corrected switch, locked 2026-07-16):**
- **No standing controls.** Hover the edge → a quiet "turn off" appears in its head.
  There when you go looking, invisible otherwise.
- **Off is seen, not just done.** Three beats: the edge **stills in place** (the breathing
  dot stops and grays, the wire drains its color) → **folds** to the wall → the **hairline
  left behind is visibly dead** (no dot, no color). The state change happens before the
  retraction, so the click reads "off," never "hidden."
- **On is the mirror.** Click the hairline: the edge slides out still gray, then **wakes** —
  the dot breathes again and the lines re-ink one after another.
- **The whisper follows the cursor.** The off-state hairline answers a hover anywhere on
  the wall — "THE LIVE EDGE IS OFF — CLICK TO TURN ON" appears at the mouse's height.
- **Viewport-fixed.** The rail is fixed to the window, not the page. It spans the full
  height wherever the room is scrolled; it never scrolls away.
- **Settings mirror.** The durable switch lives in Settings → "How the app works for you"
  → "Show the live edge," with plain copy on flip: *"The live edge is off. The hairline
  stays on your rooms; click it any time to turn it back on."*
- **Edge off ≠ capture off.** Turning the edge off never stops the counting — capture
  lanes and the day's count keep running. You're hiding the wire, not stopping the work.
- **Default ON** for real workspaces.

**Voice.** Every line passes canon §11/§13 — sentences a peer would say, zero decode.
Machine lines say what happened, never how the machinery works.

**What it is NOT.** Not a notification system (no toasts, no badges elsewhere in the app).
Not analytics. Not a CRM activity log. Not engagement bait — no intermittent-reward
mechanics, no fake urgency (Part III Tier 3 ethics: variable *insights*, never variable
*rewards*). It never claims liveness it doesn't have.

## 3. Build plan (staged — each stage ships alone and is useful alone)

**Stage 1 · The Count (~1–2 days).** The pace strand only: today's number vs the daily
habit, the track, the ledger foot's shift total. Reads (all existing): logged touches
(`sequences` / `gtmos_outbound_touches`), the bulk-count entries (`gtmos_bulk_outreach_v1`),
BCC-captured sends (`sequences` rows the inbound-email function writes), held calendar
meetings (`captured_meetings` / `gtmos_captured_meetings_v1`), the Quota room's daily habit
as the goal number. New code: `src/lib/edge/` mounted the way `GroundLine` is — one organ,
every v4 room. Kill switch: a `live_edge_off` Posthog flag matching the v4 pattern;
`?edge=0/1` preview hatch.

**Stage 2 · The Shift (~2–3 days).** The tagged wire + still-quiet foot. No new table —
a read-side adapter that projects events from what already lands: `observations` (the
machine's reads), `sequences` (your sends), `captured_meetings` (meetings confirming),
Cold Call / Discovery logs (your calls), discovery-run ledgers (searches the machine ran).
Merge by timestamp, tag by source, re-stamp ages client-side, hold `big` buyer moments
longer before dimming. Still-quiet comes from Signal Console's watched accounts vs last
touch/signal date (the `signal_decay` read, rendered standing).

**Stage 3 · The Other Side (thin, honest, ~1 day + waiting on lanes).** The buyer voice
renders only what's real today: calendar accepts (PARTSTAT from the iCal lane), reply
outcomes the operator marks on touches, meetings booked from Cold Call. True inbound
replies have **no data source yet** — the BCC lane captures outbound only, and the
inbound-email read is deliberately off the queue. When that lane ever ships, the edge
picks it up with no redesign; until then the buyer voice stays small and never pretends.

**The demo lane.** "Launch interactive demo" boots with the edge ON and a scripted sample
stream — a reply landing, a meeting confirming, the heartbeat noticing — one event every
8–12 seconds for the first minute, gated hard on `sessionStorage.gtmos_env_mode === "demo"`
(the same gate as the demo Briefing Patterns; real workspaces never see scripted events).
The toggle is live in the demo so a viewer can feel both states.

**The toggle wiring.** Per-device display preference (the schedule-float prefs pattern)
plus the Settings mirror writing the same preference; the three-beat choreography and the
cursor-following whisper exactly per the settled mockup; reduced-motion collapses the
beats to instant state swaps with the same end states.

## 4. Order of work

1. Stage 1 (Count) + the toggle + the demo stream — one PR, the edge is alive and honest.
2. Stage 2 (Shift) — the wire; second PR.
3. Stage 3 (Other Side) — rides whenever its sources exist; never blocks 1–2.
