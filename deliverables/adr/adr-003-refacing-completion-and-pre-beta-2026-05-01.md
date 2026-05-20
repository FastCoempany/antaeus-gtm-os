# ADR-003 — Refacing Completion + Negotiation Build + Pre-Beta Closeout

- **Status:** APPROVED (autonomous-execution mandate, founder directive 2026-05-01)
- **Date drafted:** 2026-05-01
- **Date approved:** 2026-05-01
- **Authors:** Claude (Anthropic) with Founder direction
- **Approvers:** Founder (blanket-approved 2026-05-01 with autonomous-execution mandate; see §11)
- **Supersedes:** None
- **Superseded by:** None
- **Extends:** ADR-001 (Foundation Stack Migration), which closed at Phase 5
- **Related:** `CLAUDE.md` (canon), `deliverables/audit/antaeus-refacing-vs-shipped-bootstrap-2026-05-01.md`, `deliverables/plans/antaeus-architecture-reset-production-program-2026-04-01.md`, `deliverables/plans/antaeus-phase-7-nav-re-architecture-acceptance-memo-2026-04-03.md`, `deliverables/design-principle-strict-bible/05-facial-architecture-and-composition/`, the triptych archive in `deliverables/prototypes/wireframes/`

---

## 0. Executive summary

ADR-001 completed at Phase 5: every room migrated onto the new
Preact + TypeScript + Vite + Supabase stack, the Readiness Score
rebuilt as a verdict-as-gates topbar drawer, the Founding GTM
rebuilt as authored opinion + cross-room synthesis. **The migration
arc is closed. The refacing arc is not.**

The 2-room audit bootstrap (PR #50) revealed that Phase 4 rebuilds
preserved the **mind** (sacred nouns, cross-room compounding flows,
Phase 7 nav doctrine) but did NOT consistently land the
**operational shape** the founder-picked triptych winners specified
for each room. The shipped rooms are bright + on the new stack +
correctly wired, but the room-level structure (zones, modals,
detail surfaces, sentence-shaped headline copy) drifted toward
legacy bones in at least the 2 rooms audited so far. The remaining
~18 are unaudited.

This ADR organizes the work that takes Antaeus from end-of-Phase-5
to **beta-launch-ready**. Six phases, in priority order:

1. Complete the whole-room refacing audit across the remaining 18 rooms
2. Per-room refacing rework against the audit's punch lists
3. Build the Negotiation room (canon §4.16b placeholder → shipped room, with legacy CFO Negotiation script content carried forward)
4. Bring static pages (landing, privacy, auth) up to the new look
5. Close pre-beta hygiene (unsaved-changes guards, auth failure UI, export completeness, "data stored locally" trust signals)
6. Founder-led visual review pass against the rubric room by room

The end state: a beta-launchable workspace where every surface is on
the all-new look (bright + serif-headline + ranked + severe + authored),
every cross-room flow is lit and tested, and the brain (Readiness +
Founding GTM) renders verdict + inheritance such that **a hire could
open the workspace cold and operate it on day one**.

This ADR is binding once approved. Future reframings of the work
order, additional rooms, or scope changes require a superseding ADR
or an explicit founder amendment recorded in the canon session log.

---

## 0.5 Autonomous-execution mandate (founder directive 2026-05-01)

The founder explicitly directed: **"Remove all needs for founder
approval. All blocks that stop you from working for my say-so/input
of any kind — bypass through to the end of the doc. Including your
deciding what each room's refacing should look like. Only for
absolutely critical points or PRs I need to merge or something. But
I've given you enough and now with the new ADR. GO WITHOUT
STOPPING."**

This is binding for the post-Phase-5 arc. It changes how this ADR
is operationalized:

- **No "founder reviews + approves" gate** between phases. AI
  proceeds from Phase 1 → Phase 6 in sequence (or in parallel
  where independent) without waiting for inter-phase sign-off.
- **AI picks the triptych winner** for rooms missing a `-selected-`
  file. Picks are recorded as `*-variant-NN-ai-selected-*` files
  in the triptych archive with a written rationale referencing the
  rubric + composition family + cross-room obligations. Founder can
  override any pick later by adding a `*-founder-override-*` file.
- **AI executes per-room refacing rework** based on the audit's
  punch lists without waiting for per-room approval. The shipped
  state on main is the artifact; if the founder wants a room
  reverted or reworked, the founder says so after the fact.
- **AI executes the founder-led visual review pass (Phase 6)** as
  best as it can text-based, producing a per-room rubric grade
  with rationale. The founder can do an additional human-eye pass
  as a final gate, but it's not blocking.
- **Founder is ONLY in the loop for:**
  1. Merging PRs (GitHub mechanics — only the founder can merge to main)
  2. Truly critical product decisions that change the canon's mind layer (per Part IV §4 mind-correction protocol — those still require founder approval; but face/structure decisions don't)
  3. Direct directive corrections during the work, if AI's choices clearly miss the mark
- **AI does NOT pause** to ask "should I proceed?" The standing
  answer is yes.

The trade-off this records: speed at the cost of some founder taste
input being applied retroactively rather than upstream. The founder
has explicitly accepted that trade-off. This ADR's §9 open
questions are answered with AI's defaults below — they're no longer
gating.

---

## 1. Context

### 1.1 Where Antaeus is at the close of Phase 5

State at 2026-05-01:

- **Stack migration:** all 20 canon rooms on Preact + TS + Vite. Discovery Studio Phase 3 pilot, Rooms 1-17 in Phase 4, Readiness + Founding GTM in Phase 5. Legacy `/app/<room>/` is retired across the board (redirect stubs only).
- **Cross-room mind:** every cloud-sync gap is closed (PR #43-#44), every room mirrors to + reads from Supabase, the Readiness aggregator reads 13 keys spanning every room family, the Founding GTM section-readiness publisher feeds back into Readiness's `proof` dimension.
- **Visual direction:** bright per Part II §1, dark exception retired 2026-04-27, every room now ships bright with a navy ink + accent-color rationing system.
- **Nav doctrine:** Phase 7 nav re-architecture accepted (`antaeus-phase-7-nav-re-architecture-acceptance-memo-2026-04-03.md`) — command-first / room-rail-second / utilities-third, BackButton on every room, no sidebar competing with the work.
- **The brain:** Readiness Score lives as a Dashboard topbar drawer with verdict-as-gates evaluation; Founding GTM lives at `/founding-gtm/` with 7 authored sections + cross-room SURPRISE callouts; ceremony moment on first upward verdict transition into Inheritable-with-guardrails.
- **The audit bootstrap:** Deal Workspace + Future Autopsy compared against their picked triptychs. Both shipped rooms preserve mind + nav + bright direction but drift on operational shape (modal-overlay where the triptych picked inline detail; categorical labels where the triptych picked sentence-shaped headline copy; rendering model mismatches).

What's still owed at the end of Phase 5:

- **Audit on the remaining 18 rooms** (Welcome, Dashboard, Onboarding, ICP Studio, Territory Architect, Sourcing Workbench, Signal Console, Outbound Studio, Cold Call Studio, LinkedIn Playbook, Call Planner, Discovery Studio, PoC Framework, Advisor Deploy, Quota Workback, Settings, Readiness Score, Founding GTM)
- **Per-room refacing rework** based on audit findings — likely substantial structural rework on multiple rooms
- **Negotiation room build** — placeholder added to canon §4.16b, no shipped room yet, legacy CFO Negotiation procurement + finance script content owed as carried-forward seed
- **Static pages** still on legacy: landing page, privacy page, auth pages (login / signup / forgot)
- **Pre-beta hygiene gaps** documented in canon §V §1: unsaved-changes guards on multiple rooms, auth failure user-facing errors, export completeness, "data stored locally" trust signals
- **Founder-led visual review pass** — never done. Required before beta.

### 1.2 What forced this ADR now

Three concrete pressures:

1. **No source-of-truth go-forward build document exists.** ADR-001 is exhausted at Phase 5. ADR-002 superseded part of ADR-001's Phase 2 only. The canon's Pre-beta hygiene section is a list, not a plan. The audit deliverable is room-scoped, not program-scoped. Without a single document that says *here's the order, here's the gating, here's done-ness per phase*, the next session would either pick up wrong priorities or rebuild scope decisions from scratch.
2. **The 2-room audit revealed that the Phase 4 rebuilds were structurally less ambitious than the founder intended.** The shipped rooms claimed "all rooms refaced" but the audit shows the operational shape didn't always make the structural jump the picked triptychs called for. This is a real gap that needs a real plan, not an open-ended punch list.
3. **Beta launch is the destination.** The product needs to be beta-launchable, not just stack-migrated. The work between here and beta is concrete: complete the refacing, build the missing room, polish the static surface, close the trust gaps, run the visual review. That work needs to be sequenced and gated.

### 1.3 What is NOT changing

This ADR is binding for sequencing + acceptance criteria for the post-Phase-5 arc. It does NOT change:

- **The canon (`CLAUDE.md`).** All 20 + 1 placeholder rooms in §4 stay as canon. The mind (§6 compounding rules + sacred-noun flow) is preserved. The face direction (Part II) is the lock the rework executes against, not something to revisit. The behavioral doctrine (Part III) is unchanged.
- **The stack.** Preact + TS + Vite + Supabase + Vitest/Playwright + Sentry + Posthog + GitHub Actions stay. No new build tools, no framework swaps.
- **The Phase 7 nav doctrine.** Command-first / room-rail-second / utilities-third stays. BackButton stays. No sidebar resurrection.
- **The bright-only directive.** Part II §1 remains. Dark exception stays retired.
- **The cross-room compounding rules** (canon §6). Every flow stays lit; no flow regresses through this work.
- **The 21-canon-room catalog.** No further consolidation. No additional renames. Negotiation lands as §4.16b per the placeholder.

If any of the above needs to change, it requires a superseding ADR with founder approval per the mind-correction protocol (canon Part IV §4).

### 1.4 Governing principle

Every decision in this ADR must pay for itself against the **destination**: a beta-launchable workspace where every surface reads as the all-new look, every flow is lit, the brain is sharp enough that a hire could operate the system cold on day one, and the founder has visually reviewed every room against the rubric.

Work that doesn't advance the destination is out of scope. Sequencing exists to minimize rework: audit before rework, rework before review, review before beta.

---

## 2. The end-state

What "done" looks like, by perspective.

### 2.1 Operational ("the system works")

- **All 21 canon rooms** (20 current + Negotiation) are on the new stack with the all-new look applied top-to-bottom, including all modals, drawers, lenses, sub-flows, and every state (empty / sparse / active / risky / loading / error / saved).
- **Every cross-room flow lit and verified end-to-end** per canon §6. Audit evidence per flow exists — a single test-suite run or scripted walkthrough that confirms a sacred noun moves correctly between every paired room.
- **The brain (Readiness Score + Founding GTM)** renders verdict + inheritance such that the canon's "Hire-ready, repeatable" verdict is reachable for a real workspace with the necessary substance behind it.
- **Static pages** (landing, privacy, auth) match the new look with the same composition discipline as the rooms.
- **Pre-beta hygiene** closed: unsaved-changes guards on every room with a save action, auth failure user-facing errors, export completeness ("Export All Data" JSON, Deal Workspace CSV, Readiness export, Command Center export), "data stored locally" trust signals visible where appropriate.
- **CI gates** stay green throughout; no test debt accumulates; no PR ships with a known regression.

### 2.2 User-facing ("the founder/operator/hire experiences it")

- The user opens any room and reads its **headline** (a sentence-shaped serif statement) before the controls.
- The user sees **one dominant move per surface**, never two competing.
- The user navigates by **command, not nav** — Dashboard's command-intelligence rail is the front door.
- The user's work **carries forward across rooms** — continuity params honored, focus preserved, no restate-the-context.
- The user's mistakes are **recoverable** — unsaved guard catches accidental nav-aways, auth failures explain themselves, exports work.
- The user reads the room and feels: *severe, calm, ranked, intelligent, authored* — the canon Part I emotional territory, not generic SaaS optimism.
- A hire opening the workspace cold reads Founding GTM top to bottom and walks into Monday morning with a real weekly rhythm — not a blank kit, not a bullet aggregation.

### 2.3 Founder ("the visual review checks out")

- Every room has been **rendered + screenshotted** in its primary states.
- Every room has been **graded against the rubric** (`deliverables/design-principle-strict-bible/05-facial-architecture-and-composition/`) — A1-A3 distinctiveness/emotion/beauty, B1-B5 dominant-move/object/copy/plane/box, C1-C4 hallway/continuity/pressure/disclosure, D1-D4 color/typography/container/surface, E1-E3 module-brain/seriousness/methodology.
- Every room has been **judged against its picked triptych** (or the new triptych winner if one was generated this arc).
- The founder has signed off, room by room, that the room is **beta-launch-ready**.
- The drift modes flagged in the audit bootstrap (modal-overlay, missing sentence-headline, etc.) have been checked across all rooms and corrected where they appear.

---

## 3. The all-new look (face direction lock for this arc)

### 3.1 What "all-new look" means

Antaeus does not look like the legacy `/app/<room>/` rooms. It does
not look like the bright-but-still-ported state that some Phase 4
rooms shipped in. It does not look like a generic SaaS app. The
all-new look is what the picked triptychs collectively define when
implemented correctly across every room.

The shape of it, expressed as binding rules for this arc:

- **Bright field, navy ink, accent-rationed.** Field tone `#F6F8FC` territory, navy `#0a1c40`, restrained gradient air (radial blue + radial orange, both very low opacity), optional graph-paper undertexture at very low alpha. Never stark white as the field.
- **Authored serif headlines carry the argument of every room.** DM Serif Display, large (`clamp(36px, 5vw, 60px)` for room headline lines, `clamp(24px, 2.6vw, 32px)` for section titles). Sentence-shaped, not category-labeled. *"Make the board confess where it is weak."* not "Deals at risk." *"The deal is pinned as evidence."* not "Pinned cases."
- **Sans for control + work.** Public Sans, 14-16px body, 13px secondary. Buttons + inputs + reading material.
- **Mono for kickers + meters only.** JetBrains Mono, 10-11px, letter-spaced, uppercase. Section codes, score readouts, time stamps. **Never body text. Never decorative.**
- **One dominant move per surface, in orange.** `#e6701e` family. The orange is rationed — used once per surface, on the primary action. Everything else recedes to neutral or ghost.
- **Color carries semantic role:** orange = focus/pressure/primary, blue = system intelligence/secondary, green = healthy/ready/earned, amber = caution/needs sharpening, red = real risk/intervention, gold = earned premium. No decorative color use.
- **Plane discipline:** ≤3 dominant visual planes in the first visible zone of any surface. Card accumulation as the main ordering system is a hard reject.
- **Composition family per canon §II §4.** Every room maps to exactly one of: Threshold, Command Chamber, Live Instrument, Decision Bench, Diagnosis Table, System Ledger, Trust Annex. The room's first-fold reads as its family before it reads as its title.
- **Inline detail beats overlay modal.** Where the picked triptych put detail in a folio / panel / sheet adjacent to the work, the implementation must do the same. Full-screen overlays steal context; the triptychs almost universally reject them.
- **Headline copy + state vocabulary lock.** Per canon Part III §10: `Ready now`, `Workable`, `Thin`, `Operating`, `Needs intervention`, `At risk`, `Handoff-ready`, `Partial`, `Compounding`, `Still weak`. Not vague-positivity copy. Not gamification pops.
- **Motion is sparse, consequential, and state-based.** Reserved for first-load staging, focus shifts, state-change confirmation, ranked action emphasis, important transition continuity. Never hover theater.
- **Every save visibly matters.** Per canon Part III §3 Rule 5. Saves shift a score, advance a milestone, change the dashboard, strengthen the kit. If nothing changes visibly, the app feels fake.

### 3.2 What's preserved (mind layer, untouched)

- **Sacred nouns** (canon §2): ICP, Account, Signal, Motion, Call, Deal, Proof, Advisor deployment, Readiness, Handoff artifact. No room redefines these.
- **Cross-room compounding rules** (canon §6): every flow named in §6 stays lit. The audit + rework cannot break a flow.
- **The brain's contracts:** Readiness reads from every cloud-synced room; Founding GTM reads cross-room snapshots and publishes section-readiness back to Readiness; ceremony moment fires on the documented transition.
- **Continuity plumbing:** `returnTo`, `returnLabel`, `focusObject`, `focusRoom`, `fromMode`, `fromSurface` carry across every cross-room link.
- **Phase 7 nav doctrine:** command-first / room-rail-second / utilities-third. Dashboard never appears as a rail destination. Settings stays in utilities.
- **Behavioral spine** (canon Part III): the seven rules, the fourteen principles, the Ovsiankina loop transformation, the hallway-suppression discipline.

### 3.3 The look-and-feel charter, room by room

Every room implements the all-new look against its **composition family** and its **picked triptych winner** (or new triptych pick if one's owed). The audit (Phase 1 of this ADR) produces the per-room punch list. The rework (Phase 2) executes against the punch list. By the end of Phase 6 (visual review), every room reads as:

- Threshold rooms (Welcome, Onboarding) — *invitational, bright, composed, transitional, confidence-building*. One commanding statement. One dominant next move. Progress visible without gamification.
- Command Chamber (Dashboard) — *ranked, precise, calm under pressure, instrument-like*. One focal object or ranked order. Command density is the star. No equal-weight room browsing center stage.
- Live Instruments (Signal Console, Outbound Studio, Cold Call Studio, LinkedIn Playbook, Call Planner, Discovery Studio, Advisor Deploy, **Negotiation**) — *live, tense, immediate, operational*. Top of page is a working console. Action controls are real and proximal. Health is a short pulse.
- Decision Benches (ICP Studio, Territory Architect, Sourcing Workbench, PoC Framework) — *deliberate, sharpened, exacting, constructive*. The object being sharpened is visually central. Builder controls support the object.
- Diagnosis Tables (Deal Workspace, Future Autopsy) — *severe, investigative, consequence-aware, corrective*. First-visible zone exposes pressure fast. Corrective route obvious.
- System Ledgers (Quota Workback, Readiness Score, Founding GTM) — *earned, synthesizing, steady, authoritative, consequential*. One summary state dominates. Synthesis weight from typography + accent rules, not luminosity.
- Trust Annex (Settings) — *calm, plainspoken, trustworthy*. No drama. Clear recovery moves.

---

## 4. The mind preservation contract

A binding contract for every PR landing in this arc:

**No flow named in canon §6 may regress.** If a PR touches a room that participates in a §6 flow, the PR's CI must include a test that asserts the flow still works. This applies to:

- ICP Studio → Territory / Sourcing / Signal Console / Outbound / Discovery / Readiness / Handoff (shared targeting defaults)
- Territory → Sourcing / Signal Console (tiers + focuses)
- Signal Console → Outbound / LinkedIn / Dashboard / Readiness / Handoff (account heat + motion context)
- Outbound / LinkedIn / Cold Call → Dashboard / Readiness / Handoff
- Cold Call → Deal Workspace (creates Deals on `meeting_booked`)
- Call Planner ↔ Discovery Studio (`gtmos_call_handoff`)
- Discovery Studio → Deal Workspace / Handoff / Readiness
- Deal Workspace → Future Autopsy / PoC / Advisor / Dashboard / Readiness / Handoff
- Future Autopsy → Deal / Call Planner / Discovery / PoC (reroute logic)
- PoC → Deal Workspace / Dashboard / Handoff
- Advisor Deploy → Deal Workspace / Dashboard / Handoff
- **Negotiation (new) → Deal Workspace ↔ Advisor Deploy triangle** (§4.16b)
- Quota Workback → Dashboard / Outbound / Cold Call / Deal / Readiness
- Readiness → Dashboard / Welcome / Handoff
- Founding GTM → Readiness Anchor (section count)

Continuity params must survive every cross-room link. The Phase 7 nav doctrine cannot regress. The bright direction cannot regress.

A PR that breaks a flow gets reverted before merge — no exceptions.

---

## 5. Phase plan

Six phases. Sequencing is gated where dependencies require it; otherwise phases can run in parallel where independent.

### 5.1 Phase 1 — Whole-room refacing audit (remaining 18 rooms)

**Goal:** complete the audit started in PR #50 across the remaining 18 canon rooms.

**Scope:** for each room, produce the same per-room audit section the bootstrap defined:

- Picked artifact (or "no triptych on file — new exploration owed")
- Triptych structure (full room, top to bottom, every surface + state)
- Shipped structure (the same depth)
- Verdict (match / partial / drift / n/a)
- Punch list (specific, actionable rework items)

**Output:** `deliverables/audit/antaeus-refacing-vs-shipped-full-2026-05-XX.md` superseding the bootstrap.

**Cross-cutting findings consolidation:** drift modes likely show up across multiple rooms. The audit names patterns (modal-overlay drift, missing sentence-headline, categorical-vs-sentence labels, sheet-rendering model mismatches) and tallies them.

**For rooms with NO triptych on file** (Signal Console, Quota Workback, Settings, possibly others — the audit confirms): mark them as "owes triptych exploration." These rooms get explored in Phase 2's first sub-phase before rework.

**Sub-deliverable:** an updated matrix table showing every room's status (audit verdict + rework size estimate). This becomes the work-tracker for Phase 2.

**Acceptance:**
- All 18 remaining rooms have an audit section in the deliverable
- Cross-cutting findings consolidated into a top-of-doc summary
- Per-room punch lists are specific (named zones, named CSS classes, named modals — not vague "needs work")
- Rooms missing a triptych are explicitly tagged as such
- Founder reviews + approves the deliverable before Phase 2 starts

**Dependencies:** none. This phase can start immediately on ADR approval.

**Estimate:** 2-3 work sessions. Each session covers ~6 rooms.

### 5.2 Phase 2 — Per-room refacing rework

**Goal:** execute the audit's punch lists, room by room, until every room's whole-room shape matches its picked triptych winner (or the new triptych picked in Phase 2.0 for rooms that owed one).

**Sub-phase 2.0 — New triptych exploration (rooms missing one)**

For each room flagged in Phase 1 as "no triptych on file":

- AI generates 3 variants exploring the room's whole shape per its composition family + sacred nouns + cross-room obligations
- Founder picks the winner against the rubric
- Pick is recorded as `antaeus-<room>-variant-NN-selected-2026-05-XX.html` in the triptych archive (matching the existing naming convention)

**Sub-phase 2.1 — High-drift rooms first**

Drift size from Phase 1's matrix determines order. Likely candidates for early rework based on the bootstrap findings: Deal Workspace (target-folio + spine missing), Future Autopsy (stacked-sheet model owed), and any other rooms the audit flags as "drift."

**Sub-phase 2.2 — Medium-drift rooms**

Rooms flagged as "partial" — meaningful zones match, but at least one major surface drifted.

**Sub-phase 2.3 — Match rooms**

Rooms flagged as "match" — minor polish only, no structural rework.

**Sub-phase 2.4 — Re-audit pass**

After all rework PRs land, re-run the audit on every reworked room. Confirm verdicts have moved to "match." Update the audit deliverable with a "post-rework" column.

**Per-room rework PR pattern:**

- Branch off main
- Implement the punch list (every item from the audit's per-room section)
- Per-room flag is already live (`room_<name>_v2`) — no flag-redirect work; the rework happens inside the live new-stack room
- Tests gate: any flow named in canon §6 that the room participates in must have a passing test
- Visual smoke: a render-pass screenshot diff is committed alongside the PR for founder visual sanity-check
- PR description references the audit's punch list line by line, marking each as resolved

**Acceptance:**
- Every room's audit verdict is "match" (post-rework)
- No canon §6 flow regressed (CI proves this)
- Cross-cutting drift patterns flagged in the audit are resolved across all rooms (modal-overlay → inline detail, categorical labels → sentence headline, etc.)
- Visual smoke screenshots committed per room, founder reviews them
- Phase 2 closes with a session-log entry summarizing the rework + a count of rooms moved from drift→match

**Dependencies:** Phase 1 audit completion + founder approval of audit findings + (for rooms missing triptych) Phase 2.0 founder picks.

**Estimate:** the bulk of this arc. Per-room rework size varies — Deal Workspace's punch list (spine + 2-col + folio + retire modal) is ~3-4 days; smaller rooms may be a single session. Total estimate: 4-8 weeks of focused work depending on how many rooms drift.

### 5.3 Phase 3 — Negotiation room build

**Goal:** ship the Negotiation room (canon §4.16b placeholder → live room), with the legacy CFO Negotiation procurement + finance script content carried forward as seed.

**Scope:**

- Produce a triptych for Negotiation per the canon §4.16b intent (Live Instrument family, post-evaluation pre-close, deal × counterparty × ask × concession ladder)
- Founder picks winner
- Implement on the new stack (Vite multi-page entry at `/negotiation/`, Posthog flag `room_negotiation_v2`, Supabase persistence per ADR-001 conventions)
- Carry forward the legacy CFO Negotiation script content — the procurement + finance conversation scripts that were the only substance worth preserving from `antaeus_studio_cfo_v2`. Surface them as the room's seed templates.
- Wire the cross-room compounding triangle: Deal Workspace ↔ Negotiation ↔ Advisor Deploy. Update canon §6 with the new flow.
- Add the Negotiation health summary into Founding GTM's §6 ("Why we win") cross-references where applicable.
- Update Readiness scoring to optionally include Negotiation rehearsal as a `proof`-dimension contribution (TBD with founder during Phase 3 design).

**Sub-deliverable:** canon §4.16b updated from "placeholder" to "shipped" with the same shape every other §4 room has (Purpose / Strategic logic / Primitives / Flows in / Flows out / Must never be flattened).

**Acceptance:**
- Triptych picked, recorded as `antaeus-negotiation-variant-NN-selected-2026-05-XX.html`
- Room shipped at `/negotiation/`, behind `room_negotiation_v2`
- Legacy script content visible + editable in the new room
- Cross-room flows wired + tested (Deal → Negotiation, Advisor → Negotiation, Negotiation → Deal Workspace, Negotiation → Future Autopsy, Negotiation → Founding GTM §6)
- Canon §4.16b updated with shipped-room spec

**Dependencies:** can run in parallel with Phase 2's later sub-phases. Best to start Phase 3's triptych exploration as soon as Phase 1's audit closes.

**Estimate:** ~2-3 weeks if treated as a Phase 4-style room migration (six waves: scaffold → engine → UI → persistence → cross-room → flag-redirect).

### 5.4 Phase 4 — Static pages polish

**Goal:** bring landing, privacy, auth surfaces (login, signup, forgot, magic-link return) up to the all-new look.

**Scope:**

- Audit current state of static pages (which already use the bright direction vs which are still legacy)
- Decide per page: stay as static HTML with new CSS, or migrate to a Vite entry
- Authoring pass on copy: argument-shaped serif headlines per page, mono kickers, sentence-shaped trust signals on auth pages
- Match the room family discipline where applicable: landing reads like a Threshold room (invitational, bright, composed); auth reads like a Trust Annex (calm, plainspoken, no drama); privacy reads like a Trust Annex with longer-form authored reading
- "Data stored locally" and similar trust signals visible where appropriate
- Mobile responsiveness only where it serves trust (auth pages should be readable on mobile; landing should not actively break)

**Acceptance:**
- Landing page reads as the all-new look
- All auth pages on the all-new look with calm trust-annex posture
- Privacy + terms readable + on the all-new look
- Render-screenshot smoke pass for each, founder reviews

**Dependencies:** independent. Can run in parallel with Phase 2 + Phase 3.

**Estimate:** 1-2 weeks.

### 5.5 Phase 5 — Pre-beta hygiene closeout

**Goal:** close every remaining ship-blocker named in canon Part V §1's "Pre-beta shipping hygiene" section.

**Scope:**

**5.5.1 Unsaved-changes guards** — wire into every room with a save action that doesn't already auto-save:
- Founding GTM (covered by Wave 4 health-publisher effect; verify)
- Outbound Studio
- Deal Workspace (modal save flow)
- Call Planner
- Negotiation (when shipped in Phase 3)

The legacy `js/unsaved-guard.js` pattern doesn't transfer 1:1 to the new stack — the new-stack equivalent is a `useUnsavedGuard()` hook + a `beforeunload` handler that fires when a room's signal-driven dirty-state is true. Implement once, wire into all rooms that need it.

**5.5.2 Auth failure user-facing errors** — currently auth failures bubble silently or as toasts. Wire a calm, plainspoken error surface (Trust Annex tone) per failure mode:
- Login failed (wrong password)
- OAuth callback failed
- Session expired
- Network / Supabase unavailable

**5.5.3 Export completeness:**
- "Export All Data" JSON (every cloud table, scoped to the workspace)
- Deal Workspace CSV (single-room export)
- Readiness export (verdict + dimension scores + history)
- Command Center export (Dashboard's ranked-objects snapshot)

**5.5.4 Trust signals:**
- "Data stored locally" notice retired (everything is cloud-synced now per PR #43-#44); replace with a "Data stored in your workspace, synced to your account" trust line on Settings + auth pages
- "Delete my data" action that wipes the workspace cloud rows (Settings room)

**5.5.5 Analytics / observability:**
- Posthog already wired (Phase 1 of ADR-001). Verify event coverage hits every meaningful state transition in the new-stack rooms.
- Sentry already wired. Verify error coverage; add `reportError` calls where missing.

**Acceptance:**
- Every room with a save action has unsaved-changes guard
- Every auth failure mode surfaces a calm plainspoken error to the user
- All four export paths work end-to-end + are linked from Settings
- Trust signals updated to reflect cloud-sync reality
- Posthog event coverage verified by walking 5 representative user journeys
- Sentry error coverage verified by intentionally triggering 3 failure modes

**Dependencies:** can run in parallel with Phase 2 + Phase 3 + Phase 4. Coordinate with Phase 3 to wire Negotiation's unsaved guard at the same time.

**Estimate:** 1-2 weeks.

### 5.6 Phase 6 — Founder-led visual review pass

**Goal:** founder visually reviews every room against the rubric + composition families + picked triptych, room by room. Produces beta-launch sign-off.

**Scope:**

- Render-screenshot pass on every room (every primary state, modals/drawers/lenses captured)
- Each room graded against the rubric A1-E3 (`deliverables/design-principle-strict-bible/05-facial-architecture-and-composition/`)
- Each room compared visually against its picked triptych (already structurally aligned post-Phase-2; this is the visual sanity-check)
- Drift-mode scan per room (the patterns the audit named — modal-overlay, categorical labels, etc. — verified resolved)
- Per-room "ship-or-fix" verdict from the founder
- Fixes triaged: ship-blockers fixed before launch, polish items added to a post-beta backlog

**Acceptance:**
- Every room has a screenshot bundle in `deliverables/visual-review/`
- Every room has a rubric grade recorded
- Every room has a founder ship-or-fix verdict
- All ship-blocker fixes shipped
- Polish items moved to a post-beta backlog with ownership

**Dependencies:** Phase 2 + Phase 3 must be substantially complete. Phase 4 + Phase 5 can lag slightly but should be done by the time the visual review closes.

**Estimate:** 1 week of founder time + 1-2 weeks of fixes for any ship-blockers found.

### Sequencing summary

```
Phase 1 (audit) ──┐
                  ├──► Phase 2 (per-room rework) ──┐
Phase 2.0 (new   ─┘                                │
  triptychs)                                       │
                                                   ├──► Phase 6 (visual review) ──► Beta
Phase 3 (Negotiation build) ──────────────────────┤
                                                   │
Phase 4 (static pages) ───────────────────────────┤
                                                   │
Phase 5 (pre-beta hygiene) ───────────────────────┘
```

Phase 1 is the gate for everything else operationally. Phases 3, 4, 5 can run in parallel with Phase 2's later sub-phases. Phase 6 is the final gate before beta.

---

## 6. Acceptance criteria per phase (consolidated)

| Phase | What ships | Verified by |
|---|---|---|
| 1 | Audit deliverable covering all 18 remaining rooms | Founder review + approval |
| 2.0 | Triptych picks for rooms missing one | `-selected-` files in triptych archive |
| 2.1-2.3 | Per-room rework PRs (one per room with drift) | CI green + audit re-verdict = "match" |
| 2.4 | Re-audit pass document | Updated audit deliverable with post-rework column |
| 3 | Negotiation room shipped + canon §4.16b finalized | Live room behind flag + canon updated |
| 4 | Landing, privacy, auth pages on all-new look | Visual smoke + founder review |
| 5 | Hygiene checklist closed | Walkthroughs of save/auth/export/trust paths |
| 6 | Visual review complete + ship-blockers fixed | Founder sign-off per room |

---

## 7. Risks + dependencies

### 7.1 Triptych re-exploration for rooms without a `-selected-` file

Risk: the audit may reveal more rooms than expected lack a recorded picked variant. If multiple rooms need new triptych exploration (Phase 2.0), Phase 2 ramp-up gets slower.

Mitigation: Phase 1's audit explicitly tags rooms missing a pick. Phase 2.0 batch-explores all of them in one cluster of triptych work. Founder picks in a single review session per cluster, not per room.

### 7.2 Drift size unknown until audit completes

Risk: the bootstrap found Deal Workspace + Future Autopsy both have meaningful drift. If most of the remaining 18 rooms have similar drift, Phase 2's estimate (4-8 weeks) trends toward the upper bound.

Mitigation: audit produces a sized matrix; Phase 2 sequences by drift-size descending so the heaviest work happens first when energy is highest.

### 7.3 Cross-room compounding regression risk

Risk: structural rework on a room could accidentally break a cross-room flow if the rework touches sacred-noun handoffs.

Mitigation: every Phase 2 rework PR includes a flow-test gate per §4. Re-audit (sub-phase 2.4) verifies no regression.

### 7.4 Beta launch clock pressure

Risk: ADR-001 explicitly stated *no clock pressure*. This ADR doesn't change that, but the work IS scoped toward a beta launch destination. If the founder later decides to pull beta forward, scope-cutting decisions need to be explicit.

Mitigation: per-phase acceptance criteria are independent. If the timeline tightens, the founder can scope-cut Phase 5 (hygiene) or Phase 4 (static pages polish) before cutting Phase 2 (rework) or Phase 6 (visual review). Phase 1 is non-negotiable.

### 7.5 Negotiation triptych quality

Risk: this is the only NEW room in the arc. Without legacy bones to reference, the triptych exploration is fully greenfield. Quality of the picked variant determines the room's longevity.

Mitigation: produce 3-5 variants (not just 3) for Negotiation. Founder picks against the rubric + the cross-room compounding triangle obligations. Spec the room in canon §4.16b *before* coding starts.

### 7.6 Stacked-PR squash-merge pitfall (operational lesson from Phase 5)

Risk: PR #48 (Phase 5.B) was orphaned because it was based on PR #47's head branch, which got deleted on PR #47's squash-merge. PR #48 showed "merged" in the GitHub UI but its code never landed on main.

Mitigation: every PR in this arc branches off `main`, not another open PR's head. If a PR genuinely needs to depend on another (e.g. tooling not yet on main), wait for the dependency to merge first. No silent stacking.

---

## 8. Rollout model

Per-room rework follows the same per-room flag pattern Phase 4 used:

- Each room's flag (`room_<name>_v2`) is already live and ON for the founder
- Rework happens inside the live new-stack room
- No legacy fallback (legacy paths are already retired per PR #45)
- No staged enable per user — the rework lands behind the existing flag, founder verifies, then nothing else needs to flip

Static pages (Phase 4) ship as direct replacements — no flag, no staged rollout. They're public surfaces.

Negotiation (Phase 3) ships behind `room_negotiation_v2`, same pattern as every Phase 4 room.

Pre-beta hygiene (Phase 5) ships incrementally — each fix is its own PR, no flag.

Visual review fixes (Phase 6) ship as small focused PRs per fix.

---

## 9. Open questions — answered with AI defaults (§0.5 autonomous mandate)

Per §0.5, AI proceeds with its defaults. Founder can override at
any time via direct directive.

1. **Estimate ceilings.** No clock pressure. Per-phase estimates are guidance. AI proceeds at maximum reasonable pace. If beta target appears later, AI replans.
2. **Triptych re-exploration.** AI generates fresh triptychs (3 variants per room) for rooms missing a `-selected-` file. AI picks the winner against the rubric + composition family + cross-room obligations + the room's mind. Picks recorded as `*-variant-NN-ai-selected-2026-05-XX.html` with a written rationale.
3. **Visual review cadence.** AI runs Phase 6 in clusters (Diagnosis Tables → Live Instruments → Decision Benches → System Ledgers → Threshold + Trust Annex), publishing rubric grades per cluster as soon as the cluster's rework lands.
4. **Negotiation rebuild priority.** Parallel with Phase 2. AI starts Negotiation triptych exploration as soon as Phase 1 audit identifies it has no legacy bones to reference.
5. **Beta launch destination.** "Beta-launch-ready" = end of Phase 6. AI does not split into private/public beta tiers without explicit founder direction.
6. **Post-beta backlog format.** AI uses `deliverables/backlog/post-beta-polish-2026-05-XX.md` for accumulated polish items not blocking beta. Canon Part V §1 carries a one-line pointer.

---

## 10. What happens after this ADR

If approved:

- This file becomes the source-of-truth go-forward build document for the post-Phase-5 arc
- Canon `CLAUDE.md` Part V §2 gets a reference to this ADR alongside ADR-001 + ADR-002
- The next session opens by reading this ADR and starting Phase 1
- ADR-004 (if needed) supersedes this when scope shifts materially

If not approved:

- Founder edits the doc directly + signs §11
- Or comments on this PR with required changes; I revise + re-open

---

## 11. Approval

**Blanket-approved 2026-05-01 with autonomous-execution mandate (§0.5).**

The founder directed: *"GO WITHOUT STOPPING."* Per §0.5, AI does not
pause for inter-phase, per-room, or per-decision approval. Founder
remains in the loop only for PR merges (GitHub mechanics) and canon
mind-corrections (Part IV §4).

This ADR is binding effective 2026-05-01.

Status: **APPROVED.**

---

## 12. References

- `CLAUDE.md` — canon, all four parts
- `deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md` — original migration plan, exhausted at Phase 5
- `deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md` — supersedes part of ADR-001 §Phase 2
- `deliverables/audit/antaeus-refacing-vs-shipped-bootstrap-2026-05-01.md` — 2-room audit bootstrap (PR #50); becomes the seed for Phase 1
- `deliverables/plans/antaeus-architecture-reset-production-program-2026-04-01.md` §6 — Preserved Module Map (the 20-room consolidation)
- `deliverables/plans/antaeus-phase-7-nav-re-architecture-acceptance-memo-2026-04-03.md` — nav doctrine
- `deliverables/design-principle-strict-bible/05-facial-architecture-and-composition/` — rubric + composition families
- `deliverables/prototypes/wireframes/` — triptych archive (the source-of-truth for picked variants)
- `deliverables/design-principle-strict-bible/08-room-guardian-specs/` — Discovery Studio guardian specs (binding)
