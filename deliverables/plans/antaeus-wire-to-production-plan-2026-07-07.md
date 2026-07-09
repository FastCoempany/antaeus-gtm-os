# Antaeus — Wire-to-Production Plan for the 2026-07 Room Redesigns

**Status:** proposed · authored 2026-07-07
**Scope:** take the 22 settled room designs from the 2026-07 design arc (design-only mockups) and wire each to production — rebuilding each shipped room surface to match its settled mockup, composed on the design system, behind a per-room flag, preserving the mind per its capability map, with **≥3 thorough adversarial passes per room** before it ships.
**Companions:** the 22 room capability maps (`deliverables/room-capability-maps/` + Discovery Studio in `08-room-guardian-specs/`) are the binding mind contract each wired room must satisfy. This plan is *how* they get built and *how* each is adversarially verified.

---

## 0. The situation

The 2026-07 arc produced a settled visual + interaction design for every one of the 22 rooms (banked in `deliverables/mockups/` + the `_settled-rooms-backup/` mirror). Those are **design-only HTML mockups** — none is wired to production.

Meanwhile, every room already has a **shipped production surface** — the `*DS` surfaces flipped to default on 2026-06-17 (PR #271), flag-gated with a `room_<name>_legacy` kill-switch. Those DS surfaces are composed on the design system but predate the 2026-07 redesign; they do **not** carry the 2026-07 structure, language scrub, or new primitives (the climb, the open book, the face-off, the pace strands, the proximity spine, the get-there rail, the safe-deposit hierarchy, the live cockpit, etc.).

**This plan closes that gap: the 2026-07 settled mockup becomes the shipped surface for each room.**

What does **not** change: the engines, state, persistence, and cross-room wiring. Every redesign is **presentation + interaction, not a data rebuild** — the same discipline that made PR #271 safe. Cross-room reads (Dashboard aggregator, Briefing substrate, Readiness summaries) stay intact regardless of ship order because the data layer is untouched.

---

## 1. The unit of work: one room, one branch, one flag

- Each room ships as a new surface behind **`room_<name>_v4`**, previewable via a **`?v4=1`** hatch (mirrors `?ds=1` / `?today=1`), defaulting **off** until the room passes all three adversarial passes.
- On pass, flip `room_<name>_v4` to default; the current DS surface (`room_<name>_v3`) becomes the **kill-switch fallback** — a single Posthog toggle reverts one room with no redeploy, exactly as the v3 flip did.
- Engines/state/persistence are **reused unchanged**. A primitive the settled mockup needs that does **not** exist yet is built as **additive** (new signal/accessor/library component) — never a redesign of an existing engine.
- One room = one branch = one PR = the three pass artifacts attached.

---

## 2. The build recipe (per room)

Radiates per canon §6 — compose on the library, don't reinvent chrome.

1. **Read the contract.** The room's capability map + its settled mockup + canon §4.x. The capability map is the checklist; the mockup is the visual master.
2. **Map every surface to a primitive.** Apply the "does this hold its place" test (canon Part IV §5): every visual object in the mockup maps to a capability-map primitive → an engine signal/accessor. If it maps to nothing, it does not ship. If a primitive has no home in the mockup, that is a Pass-1 finding.
3. **Compose on the design system** (`src/components`). No bespoke chrome unless the mockup demands a net-new primitive; then the primitive is added to the library (spec 03 catalog) so it radiates.
4. **All operator-facing strings through `t()`** — the voice gate validates every one at CI.
5. **Preserve continuity params** — `returnTo` / `returnLabel` / `focusObject` / `focusRoom` / `fromMode` / `fromSurface` through the room's `lib/handoff.ts`.
6. **Wire the flag + `?v4=1` preview hatch.**
7. **Run the three adversarial passes** (§3). Fix every finding, re-verify.
8. **Flip to default; keep the prior surface as the kill-switch; bank the audit doc.**

---

## 3. The three adversarial passes

The floor is **three passes per room**, each run by a **fresh adversarial reviewer** — a separate subagent or session whose job is to *break the room*, not to confirm the author's work. This is the canon's own hard-won lesson: *a design system is validated by its first consumer, not by ever-more inspection in isolation*, and *verify from ground truth (the capability map, the DOM, git history), not from the author's memory*. The author never grades their own room.

Each pass produces an artifact banked at `deliverables/audit/wire-to-prod/<room>-pass-N.md` and attached to the PR. A pass has a **hard gate**; the room does not advance until the gate is green.

### Pass 1 — Mind & Capability Fidelity
**Adversary's premise:** *the redesign flattened something the mind depends on.*

- **Checklist:** the room's capability map, line by line. Every **primitive**, every **"must never be flattened"** item, every **flow-in** and **flow-out** is a row with a pass/fail.
- **Method:** a Playwright DOM probe counts semantic elements against the map (the Discovery-Studio contract-probe pattern — e.g. "10 segments present," "the coverage map renders," "the who's-missing prompt reachable"). Each flow is a wiring check: does the continuity param actually fire on the handoff? does the accessor actually read the source room's state? does the write actually land?
- **Gate:** 100% of primitives reachable in the wired room **or** explicitly deferred with a founder-approved reason. **Zero silent drops.** Any "must never be flattened" item that isn't reachable fails the pass outright.

### Pass 2 — Behavior, Composition & Voice
**Adversary's premise:** *the room violates a behavioral rule, a composition constraint, or the voice.*

- **The seven behavioral rules (Part III §3):** one dominant move · object before controls · state before explanation · reward truth not activity · every save visibly matters · no module feels isolated · escalation beats clutter.
- **Composition (Part II §5 hard-rejects):** ≤3 dominant planes in the first fold · one primary move · semantic (not decorative) color · low box count (no card-accumulation ordering) · shell supports not dominates · maps to exactly one family.
- **State coverage (Part II §6):** all six states treated honestly — `empty` / `sparse` / `active` / `loading` / `error` / `saved`.
- **Voice (§11 + §13):** the voice gate is green (every `t()` string validated); the **read-aloud test** on every label, button, empty state, error, tooltip — would a first-timer, or a VC skimming cold, understand it with zero decode? Zero banned vocabulary.
- **Structure fidelity:** the shipped structure matches the **picked mockup**, not the legacy first-fold (the recurring 2026-05 drift: rooms inheriting the old first-fold while claiming the new design).
- **Gate:** zero hard-rejects; all seven rules pass; zero banned vocab; the mockup's structure matched top-to-bottom.

### Pass 3 — Live-Runtime Adversarial
**Adversary's premise:** *I can make this room error, go blank, lose a save, or strand a handoff.*

- **Method:** drive the room headless with **real seeded data**, click **every** control and **every** state transition, and try to break it. Specifically:
  - **Cross-room round-trips:** navigate every handoff seam and confirm the destination room loads carrying the return context (the new-surface seam-walk pattern).
  - **Forced states:** force `empty` / `sparse` / `loading` / `error` and confirm each renders honestly (never a raw error string in the UI — the 2026-06-17 leak lesson).
  - **Save persistence:** mutate → reload → the change is still there. Where realtime applies, two-tab consistency.
  - **Dead controls:** every CTA routes or acts; no ghost buttons; no blank rails.
- **Watchers:** `pageerror` + `console.error` + network failures, across every interaction.
- **Gate:** zero pageerrors, zero blank rails, zero dead CTAs, every handoff round-trips, every save persists, every forced state renders honestly. The 2026-06-17 deep-audit bar (20/21 clean was a *finding*, not a pass) — here the bar is **all clean, every finding fixed and re-verified.**

### More than three where the room earns it
Three is the floor. The **protected + premium + most-specified** rooms get additional passes:
- **Discovery Studio** — the 19 primitives + the 3 compression modes + the rescue state + the 10-framework × 10-segment spine + outcome-driven handoff. Add a dedicated **primitive-by-primitive** pass and a **framework-coverage** pass (all 10 frameworks load their full spine, zero dangling jumps — the 2026-06-16 method).
- **Signal Console** (protected) — a **heat-formula fidelity** pass (the computed heat matches `signal count × type weight × source credibility × recency decay` exactly) + a **substrate** pass (the Briefing reads the same rows, read-only).
- **Future Autopsy** (protected) — a **dynamic-ledger** pass (no hardcoded case counts; the pinned set is live).

---

## 4. Rollout order — by operator journey, radiating per canon §6

Engines are untouched, so ordering is about **journey coherence and blast radius**, not data dependency. Waves ship in order; rooms within a wave can run in parallel branches.

| Wave | Rooms | Why here |
|---|---|---|
| **A · The spine** | Onboarding → Welcome → Dashboard | the first three surfaces the operator hits; the Dashboard is the design-system hub every room's health flows into |
| **B · The feeders** | Signal Console → Deal Workspace → Quota Workback → Readiness Score | the data + synthesis the Dashboard reads; protected + System-Ledger rooms |
| **C · Strategy** | ICP Studio → Territory Architect → Prospecting Desk | the shaping flow that seeds the motion |
| **D · Motion** | Outbound Studio → Cold Call Studio → LinkedIn Playbook | the live outreach instruments |
| **E · Deal-advance** | Pilot Desk → Getting to Signed → Call in a Favor | the high-pressure run to signature |
| **F · Diagnosis, synthesis & surfaces** | Future Autopsy → Founding GTM → Briefing → Outdoors Events → Settings | the intervention, the inheritance kit, the intelligence surfaces, the trust annex |
| **G · The premium live room** | Discovery Studio | last + the most passes — 19 primitives, most strictly specified |

---

## 5. Per-room dossier — the risks each adversarial pass must pre-load

Each row names the **net-new primitives** the settled mockup adds beyond the current DS surface, and the **top room-specific risks** — the exact things most likely to be flattened (Pass 1), rule-broken (Pass 2), or run-broken (Pass 3). The adversarial reviewer starts here.

| Room | Flag | Net-new to build | Top adversarial risks |
|---|---|---|---|
| **Onboarding** | `room_onboarding_v4` | the doorway honesty pitch · interview-style ICP push-back · name-only capture → enrichment · live-deal judgment cards · citable evidence margin | the ≥10-deal judgment floor silently softened back to a low-friction form; output not actually writing the live `gtmos_*` rooms; the evidence margin non-citable (assertion, not source) |
| **Welcome** | `room_welcome_v4` | day-one vs re-entry one-shape headline · "what the system saw" dividend read · the one overnight pick from Dashboard intelligence | reverting to an empty-workspace threshold; two competing moves; a gamified progress read; "all done" creeping back |
| **Dashboard** | `room_dashboard_v4` | (Brief/Spotlight/Queue exist) — the 2026-07 masthead + the ranking-reasoning surface | the ranking losing its shown reasoning (decorative scores); room-browsing creeping center-stage; the "this week's reads" raw-error leak (2026-06-17) |
| **Signal Console** *(protected)* | `room_signal_console_v4` | the Attention Router heat-band spine (act now / warm / emerging / cold) | **heat formula drift**; the Briefing substrate reads breaking; account-to-motion logic reduced to a badge list |
| **Deal Workspace** | `room_deal_workspace_v4` | Focus / Timeline / List toggle · pressure-first first-fold | the recovery queue buried under a Kanban; stage shown as truth without next-step backing; the 9-field health modal thinned |
| **Quota Workback** | `room_quota_workback_v4` | the pace projection · the fused-strands layout · the believability read | **the believability honesty buried** (the room's soul); the daily habit demoted below the funnel math; funnel jargon leaking back |
| **Readiness Score** | `room_readiness_v4` | the climb (the over-time ladder) · verdict-dominant drawer · ready/thin chips | **bars/scores/"/20" resurfacing**; "sanity-check"/"proof"/"dimension" leaking; duplicating the Dashboard's "what's weakest now" |
| **ICP Studio** | `room_icp_studio_v4` | the combo 1-flow shaping surface | ICP reduced to a persona form; ICP-Match not propagating to downstream rooms; worksheet energy |
| **Territory Architect** | `room_territory_architect_v4` | the axis-morphing floor · per-division charter (why-you/why-now) · 300-cap swap | **axis hardcoded to one carve**; why-you charter dropped; divisions on undetectable signals; reduced to a contact-list builder |
| **Prospecting Desk** | `room_prospecting_desk_v4` | the Funnel (Find → Confirm → Send) · describe-a-search → cited web research · the three-question confirm | **the confirm step skipped** (Signal Console's guard); claiming a vendor feed it doesn't have; who-to-target guidance lost; "pretend search" |
| **Pilot Desk** | `room_pilot_desk_v4` | the five movements · the circle · who's-missing prompt · adoption meter · Share kit · Mutual pilot plan | **adoption replaced by an outcome-number scorecard**; a wall of fields (feel-of-ease lost); foundry/"proof" vocabulary leaking; the multi-threading layer flattened |
| **Getting to Signed** | `room_getting_to_signed_v4` | the face-off · the positions ledger · the security coverage map · the plan-to-signed · committee engagement reads | **the coverage map degraded to a 150-line data-entry chore**; concessions without trades; the committee-warm discipline dropped; RFP tooling smuggled into the base room; procurement jargon leaking |
| **Call in a Favor** | `room_call_in_a_favor_v4` | the relay (you → your person → the buyer) · both notes · ready check · don't-over-ask guard · top-rail stuck-deal queue + coverage | the favor becoming a side log (not deal-linked); the trust discipline (ready check / don't-over-ask) dropped; "deploy/rolodex/spend-read" leaking |
| **Future Autopsy** *(protected)* | `room_future_autopsy_v4` | the countdown (decay line) | **hardcoded case count**; softening into "risk review"; a corrective route that doesn't actually reroute |
| **Founding GTM** | `room_founding_gtm_v4` | the open book (two-pane reader) · the seven authored sections · the "one thing to notice" reads · the ceremony moment | **reverting to a scoreboard / bullet-aggregator**; the cross-room "surprise" reads flattened to per-room bullets; the ceremony not firing on the upward verdict transition; "SURPRISE" label / retired vocab |
| **Briefing** | `room_briefing_v4` | (the vivid surface exists) — reconcile to the settled 2026-07-04 design | the Workspace/World toggle demoted from the organizing axis; the provocative obligations (Coverage/Framing/Defensibility) softened; audit-envelope immutability broken; becoming a feed/inbox |
| **Outdoors Events** | `room_outdoors_events_v4` | the proximity spine · the get-there icon rail (weather + flights/hotel/register/calendar) | **the get-there layer becoming a stored itinerary/tracker** (must stay outbound links + weather glance); deal-attribution creeping in; the discovery posture inverted (operator authoring instead of the system); relevance tiering flattened to labels |
| **Settings** | `room_settings_v4` | the safe-deposit hierarchy · the resolved single download · the account row | data-safety buried among preferences; the dual-export confusion returning; scope-kickers / DB jargon / retired nouns leaking; operating-room energy |
| **Discovery Studio** *(protected, premium)* | `room_discovery_v4` | the live cockpit (single focused column · jumpable spine · the live moment · tap-what-you-heard → your line · contextual drawer) | **any of the 19 primitives unreachable**; the compression rescue state degraded to a placebo; a decorative clock/tempo resurfacing; the handoff presuming a "push to the deal"; "Proof" not reworded to "Evidence"; dense chrome competing with the live node |

---

## 6. CI gates + evidence trail

Every room PR runs the standing gate (`typecheck` · `vitest` · `voice-gate` · `build`) **plus**:
- a **`@v4` Playwright smoke** — boots the new surface via `?v4=1`, asserts the universal wayfinder + zero pageerrors;
- the **three pass artifacts** (`deliverables/audit/wire-to-prod/<room>-pass-{1,2,3}.md`) — each with its checklist result, the DOM-probe output, and the state screenshots — committed alongside the room code.

The audit docs are durable (they survive scratchpad wipes and give the next session the trail from any wired room back to the evidence it shipped on).

---

## 7. Definition of done

**Per room:** all three passes green (protected/premium rooms: their extra passes too), `room_<name>_v4` flipped to default, the prior surface retained as the kill-switch, the audit docs banked.

**Overall:** all 22 rooms flipped to their 2026-07 design; the arc is live in production; the `v3` (DS) and legacy surfaces retire after a soak period (a Sentry-quiet window with the v4 default on), on founder sign-off.

---

## 8. What this plan is NOT

- **Not a data migration.** Engines, state, persistence, and cross-room wiring are untouched; this is presentation + interaction only.
- **Not a mind change.** The capability maps + canon §4.x are frozen contracts; if a wire-up surfaces a mind error, it stops and runs the Part IV §4 mind-correction protocol (founder sign-off) before proceeding — it does not fix the mind silently.
- **Not a big-bang cutover.** One room at a time, flag-gated, kill-switch behind each, radiating in waves.
- **Not self-graded.** Every adversarial pass is run by a fresh reviewer against ground truth, never by the room's author against their own memory.
