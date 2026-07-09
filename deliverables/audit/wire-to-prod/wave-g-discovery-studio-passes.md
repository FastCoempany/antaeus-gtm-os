# Wave G — Discovery Studio, the live cockpit (2026-07-09)

The protected + premium room, wired last with the most passes. Flag
default ON; kill-switch `room_discovery_v4_off`; `?v4=0/1` hatches.
Settled design: `discovery-studio-live-cockpit-2026-07-07.html`;
binding contract: the capability map at
`deliverables/design-principle-strict-bible/08-room-guardian-specs/antaeus-discovery-studio-capability-map-2026-07-07.html`.

## What shipped — the cockpit

One focused column for a seller ON a live call:
- **Top bar**: framework selector (all 10, rarely switched mid-call),
  the pre-flight "ready to walk in" check (the absorbed Call Planner
  pre-flight), the 3-mode compression toggle.
- **The always-on call-state line**: account · the disposition read
  ("reading: guarded" — `activeTrack`) · truths captured · champion /
  signer chips (tap → name them; captured as learned truths so they
  survive into the handoff) · next-step locked/not.
- **The jumpable spine**: the 10 segments horizontal; done/on/essential
  states; click jumps. Essentials filters it; **Emergency is the rescue
  state** — the spine collapses to the segment you're in and the drawer
  is forced to Recover & skip (verified live: 10 → 1 segments, Recover
  hoisted with 5 recover moves).
- **The live moment**: §-label + cue, the node's question dominant, the
  PERSONA LENS (the absorbed Call Planner question bank — 6 lenses × 3
  probes, cycle ↻), the LISTEN-FOR line (the node's note), and
  tap-what-you-heard → **Say this** (the branch's move) + its jump
  actions. Tapping records the signal + captures the clear as a learned
  truth + holds it in the tieback ledger; a red-toned answer auto-
  surfaces the pushback drawer with a flag.
- **The contextual drawer** (6 tabs): They pushed back (objection
  library) · If they ask you (inbound handlers) · Evidence (the support
  dossier) · Recover & skip (interrupts with their jump-actions + the 5
  skip-ahead moments) · **Truth & signals** (the three reads kept
  deliberately apart: facts with use-it-now, the signal ledger, the
  holding-vs-used tieback view) · Next-step (the lock docket — date /
  owner / purpose / attendees, flowing live to the state line).
- **Post-call routing (§10)**: outcome-driven — the disposition decides
  the route (advanced/won → the deal; stalled/lost → the pre-mortem).
  Never a presumed "push to the deal."
- **No clock, no tempo, anywhere.** GroundLine mounted.

## Capability check-off (live, from the production bundle)

10 frameworks load · 10 segments · tap→line→truth verified ("1 truths"
after first tap) · spine jump verified · Emergency rescue verified ·
Truth & signals 3 groups verified · next-step lock → state line
verified · post-call disposition → route verified · zero pageerrors ·
face scan clean ("Proof threshold" is rendered as **Evidence** — the
§4.12 rename; no "/20", no "spine" on the face).

## Engines

State (the 19 primitives), recordBranchInteraction, hold/deploy,
jumpToInterruptTarget, compression, next-step lock, persistence, and
the handoff builders are the shipped ones unchanged. The persona lens
imports the retired Call Planner's QUESTION_BANK directly (the §4.11
salvage made concrete).

## Wave F review fixes (same commit)

All actionable findings from the Wave F fresh-reviewer pass landed:
(HIGH) Future Autopsy's scene now always follows the selected deal —
the universe-index divergence that could mix two deals' evidence/cuts
is gone; raw cause ids (`no_eb`) no longer render — cause labels do;
the four "proof" strings in the autopsy engine's stories reworded; the
fixed 45-day horizon softened to "inside the next N days" instead of a
false per-deal projection; the cause join reads "a; b; c." (HIGH)
Settings "Put a copy back" now ACCEPTS the file "Download my workspace"
produces — a cloud export restores through row-by-row upserts (new
`restoreCloudExport`, idempotent, per-table defensive); local backups
still restore as before. (MED) "Clear this device" got its confirm
back; the Outdoors weather glance no longer misses today/tomorrow
(calendar-date math, noon-anchored .ics); the Briefing ticker skips
rendering under 3 titles. (LOW) Founding GTM's §5 "kill switch" prose
reworded; the page counter derives from the open part.

## Deferred (noted, not silent)

- Settings density/suggestion save-failure toasts (LOW #10).
- Outdoors per-row busy state (LOW #14); register falls back to the
  source URL when no event page is known (LOW #13b).
- FA horizon still a single pref under the softened copy — a real
  per-deal projection is engine work for a future pass.
