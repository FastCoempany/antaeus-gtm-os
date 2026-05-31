# Antaeus GTM OS — Canonical Context

**This file is the canon.** Any Claude session working on this repo starts here. Any human picking up where someone left off starts here.

Three layers of authority live together in this doc:

1. **The Mind** — what the product is, what each room knows, what must never be flattened. This is the highest authority. Preserve it.
2. **The Face** — the current visual direction. The face is being rebuilt. The face may be edited. The face may *not* rewrite the mind.
3. **The Behavior** — the psychology the product is engineered around. This is the spine that connects mind and face. Behavior drives how face is allowed to express mind.

Governing rule across all three: **rewrite the face, not the mind** — with one modern amendment: *face work may surface mind errors; when it does, fix the mind too, but run every mind change by the founder before committing it.* Preserve strategic substance by default. Never soften the product to make the face prettier.

If this document and an older doc disagree, this document wins. If something here disagrees with an artifact in `/deliverables/design-principle-strict-bible/`, the bible is the deeper authority — update this file.

---

## Authority order

When working on any room, obey in this order:

1. The mind of the room (below, in Part I) — never weakened
2. Behavioral doctrine (Part III) — the user should feel what these principles produce
3. Face direction (Part II) — how the room is allowed to look
4. The facial architecture rubric + composition families — how wireframes are judged
5. Per-room guardian specs in `08-room-guardian-specs/` (currently only Discovery Studio is fully specified)
6. Whatever triptych/taste-test artifact won for that room

If a lower authority conflicts with a higher one, the higher wins.

---

## How to use this document

**If you are a Claude session:** read this top to bottom before touching anything. The canon is long on purpose. Skimming will produce drift.

**Voice rule before you write anything.** Don't use a single noun to do the work of a sentence — no "wedge", "verdict", "the move", "decision-grade". Write the sentence out. Don't write manifesto fragments. Write like you'd say it out loud. The full rule lives in Part III §11; read it before generating any user-facing copy, audit prose, or PR description.

**If you are the founder:** this is your working contract. When you make a decision that changes doctrine (direction shift, room-mind correction, new principle), update the relevant Part here and commit it with a short rationale. Stale canon is worse than no canon.

**Rendered visibility:** the app is static HTML. To see what a room actually looks like, start the Python server and use the capture script — see Part V for the workflow. Never audit a room from DOM or CSS alone; my own early audits were wrong because of this.

---

# Part I — The Mind

## 1. What Antaeus Is

**One-line:** Antaeus turns the work a founder is doing on revenue into a clear picture of what's actually happening, so the first serious go-to-market hire can pick it up and run it without restating anything.

**Beta-era product sentence:** Antaeus helps founders and early operators see what is real, what is weak, what should happen next, and what a first serious hire would actually inherit.

**Orientation — where the intelligence lives:** the rooms (canon §4) are *what each room does*; the orchestration layer (Part II.5 §7) is *how the system behaves between rooms and over time*. The thesis driving the orchestration work: **the intelligence of a system is in the orchestration layer, not in the rooms.** That layer is additive — it sits beneath the shipped rooms and never redesigns them. Source + boundary: `deliverables/adr/adr-008-orchestration-doctrine-2026-05-29.md`.

### Antaeus is
- a founder-to-first-operator revenue operating system
- a pressure-and-truth system for commercial work
- a handoff machine that turns founder memory into durable operating context
- a ranked decision environment, not a storage environment
- object-based, not tab-based
- command-first, not nav-first
- behaviorally engineered, not behaviorally decorated

### Antaeus is not
- a CRM
- a sales engagement platform
- a generic AI copilot
- a dashboard bundle
- an enablement content library with some software attached
- a polished filing cabinet
- a prettier Salesforce
- a psychologically optimized engagement machine

### Buyer lock

**Primary buyer:** founder-led B2B team, or the first serious GTM operator entering a founder-built motion.

**Primary fear:** the first real hire will inherit confusion, not a system.

**Primary aspiration:** make the motion legible, pressure-tested, repeatable, and transferable before scale compounds the wrong things.

**Deprioritized buyers:** teams shopping for a full CRM replacement; broad sales orgs needing territory/forecasting/admin first; generic SMB volume-automation buyers.

### Emotional territory

The user should feel:
- *"this system sees what is actually happening"*
- *"this system is harder to fool than I am"*
- *"this system is forcing the motion to become real"*

The app should feel:
- severe
- calm under pressure
- high-consequence
- ranked
- intelligent
- unsentimental
- authored

The app must not feel:
- friendly-first
- hype
- AI magic theater
- generic productivity optimism
- motivational sales energy

---

## 2. Sacred product nouns

These are the objects the system is built around. They are protected. Every room operates on one or more of them. Rooms do not own them; the system does.

| Noun | What it is | Lives / moves |
|---|---|---|
| **ICP** | the one sharp definition of who the motion is for | defined in ICP Studio; filters every downstream room |
| **Account** | a named target organization with focus, tier, signals, heat | shaped in Territory Architect + Sourcing Workbench; ranked in Signal Console |
| **Signal** | a time-limited event implying commercial opportunity | captured into Signal Console; converted into Motion |
| **Motion** | a specific outbound move (email, call, LinkedIn touch) with route and intent | crafted in Outbound Studio / Cold Call Studio / LinkedIn Playbook |
| **Call** | a planned or live conversation attached to an account/deal | prepared in Call Planner; run in Discovery Studio |
| **Deal** | an opportunity with stage, value, pressure, and qualification truth | tracked in Deal Workspace; diagnosed in Future Autopsy |
| **Proof** | the evidence from a pilot — a claim, an owner who signs off, a metric, and a rule for when to stop. The buyer's boss can act on it without you in the room. | forged in PoC Framework |
| **Advisor deployment** | an ask routed through external leverage (investor, advisor, customer) | composed in Advisor Deploy |
| **Readiness** | the multi-dimension synthesis of whether the motion is hire-ready | calculated in Readiness Score |
| **Handoff artifact** | the exportable package a first hire would actually inherit | produced in Founding GTM / Handoff Kit |

**Rules for nouns:**
- A room may enrich a noun. A room may not redefine it.
- Nouns must carry context between rooms without the user restating anything.
- Every noun must expose, at any surface: current state, pressure on it, best next move, what changes downstream if that move happens, what the system will remember automatically.
- The `returnTo`, `returnLabel`, `focusObject`, `focusRoom`, `fromMode`, `fromSurface` URL params are the continuity plumbing. Do not break them.

---

## 3. Architectural truths

Five truths govern architecture decisions. These are harder than styling rules.

1. **Object-first, not tab-first.** The user operates on objects (accounts, deals, signals, calls, proofs). Pages and tabs are lenses onto objects, not destinations in themselves.
2. **Command-first, not nav-first.** The user lands in ranked pressure, not a hallway of modules. The primary decision a user makes on entry is "which ranked object do I act on," not "which module do I open."
3. **Intelligence is native system truth, not side analysis.** Signals, discovery notes, proof state, readiness, workspace health — these are not reports about the system. They *are* the system. Rooms read and write them as native state.
4. **The system steers toward handoff readiness.** Every upstream action implicitly compounds toward the handoff kit. A user in an early room should feel they are building something a hire will eventually inherit.
5. **Progress migrates forward through object state; it does not disappear into completion.** When a user finishes something, the app transforms the loop into the next meaningful open loop. It never shows "all done."

These are older than and harder than the face direction. A pretty face that violates any of these is off-brand.

## 4. Room Catalog

Every room is captured below with its mind locked. The format is the same for each:

- **Family** — the composition family (see Part II §2)
- **Purpose** — one sentence the room must earn
- **Strategic logic** — what it actually knows / does / forces
- **Primitives / frameworks** — the substance that lives in the room
- **Flows in** — where its input comes from
- **Flows out** — where its output lands
- **Must never be flattened** — the substance the face may not touch

Note on handoff: the full cross-room compounding matrix lives in the Phase-7 Preflight doc (`03-facial-architecture/antaeus-phase-7-preflight-behavioral-copy-burden-audit-and-disclosure-matrix-2026-04-02.md` §11). That matrix is binding.

---

### 4.1 Welcome — Threshold

- **Purpose:** move the user from setup into the first real operating move.
- **Strategic logic:** preserve activation truth and the Week-1 rhythm; give re-entry a calm on-ramp; show the user their own progress without gamifying it. Welcome is not a landing page; it is a disciplined threshold into real work.
- **Primitives:** first-ICP milestone, first live signal/account milestone, first deal milestone, first logged motion milestone, re-entry path into command.
- **Flows in:** `gtmos_activation_context` from Onboarding.
- **Flows out:** directional handoff into Dashboard, Call Planner, or the first ICP Studio session depending on activation state.
- **Must never be flattened:** the sense that the user is becoming operational, not completing a tutorial. Never show "all done"; always reveal the next open loop.

### 4.2 Dashboard — Command Chamber

- **Purpose:** show the user the one ranked object under the most pressure right now, with one dominant next move, without browsing.
- **Strategic logic:** the Dashboard is where the user stops being asked to choose between modules and starts being told which deal, signal, or proof to act on first. It ranks everything under pressure, explains why a specific object came up first, and offers one compressed act-or-inspect move. Three density modes (Brief / Spotlight / Queue) support different cognitive states; all three keep the ranking. Graph reward + workspace-health view belong here.
- **Primitives:** ranked object list, Brief narrative, Spotlight focus object, Queue triage flow, the ranking inputs the Dashboard uses to decide what comes first (how hot the signals are on an account, how much pressure a deal is under, how long it's been stale, dollar value, what changes downstream if you act), graph reward, workspace health summary.
- **Flows in:** workspace health summaries from every deep room; system-health variant from Readiness + Quota Workback; signal heat from Signal Console; deal pressure from Deal Workspace.
- **Flows out:** one-click routing into whichever room owns the ranked object (with `focusObject`, `returnTo` preserved).
- **Must never be flattened:** Brief/Spotlight/Queue as distinct modes; the room-browsing rail does not belong center stage; the Dashboard's ranking must keep showing its reasoning — never reduced to decorative scores.

### 4.3 Onboarding — Threshold

- **Purpose:** produce real Brief items as a side effect of setup, so the user lands in a Dashboard that is already live.
- **Strategic logic:** activation is behavioral engineering, not a form. Each micro-commitment creates escalating psychological investment (Commitment + Consistency). The first ask must be genuinely low-friction. By the end, the Brief should contain 8–15 ranked items so the dashboard does not feel empty.
- **Primitives:** ICP definition, first 10 accounts, email connection, first quota target, first motion — each produces one or more Brief items.
- **Flows in:** new user context (industry, scale).
- **Flows out:** `gtmos_activation_context` + seeded items across ICP Studio, Territory, Signal Console, Dashboard.
- **Must never be flattened:** the principle that onboarding output *becomes* the Brief — not a separate "completion" screen.

### 4.4 ICP Studio — Decision Bench

- **Purpose:** sharpen the one definition of who you sell to so every downstream room can work against a real target.
- **Strategic logic:** the ICP object is the thing being sharpened; it is the central authored surface, not a form output. "Thin means fewer assumptions, fewer personas, fewer use cases." The ICP is the filter that manifests as "ICP Match" scoring on every Account everywhere.
- **Primitives:** ICP statement, buying-group minimum, focus recommendation, owner/pain/trigger/proof-window inputs, match histogram.
- **Flows in:** Onboarding activation; founder conviction.
- **Flows out:** ICP match score reaches Territory Architect, Sourcing Workbench, Signal Console, Outbound Studio, Discovery Studio, Readiness, Handoff Kit.
- **Must never be flattened:** ICP sharpness as a strategic bet; never weaken it into a generic persona form.

### 4.5 Territory Architect — Decision Bench

- **Purpose:** turn the ICP into a tiered territory with focuses, approaches, and a hard 300-account ceiling that forces strategic ownership.
- **Strategic logic:** the territory is a map of focused groups of buyers, not a list. A focus names what pressure is on a specific group of buyers right now and why we're the right team to sell to them. Tiers are a resource-allocation commitment, not a ranking. The 300-cap and swap mechanic make each account feel consequential.
- **Primitives:** sales-cycle calibration, focuses, approaches, tiers, focus-to-account tagging, approach ledger.
- **Flows in:** ICP Studio.
- **Flows out:** tier + focus into Sourcing Workbench, Signal Console.
- **Must never be flattened:** the strategic tier logic; the act of naming a focus. Never reduce to a contact list builder.

### 4.6 Sourcing Workbench — Decision Bench

- **Purpose:** turn focuses into named, pushable prospects; prevent the territory from sitting as a blank ceiling.
- **Strategic logic:** a prospect-push engine tied to focus. Query Cards make platform-specific search reproducible. Research on a prospect converts it into a qualified account. The room is here to push clean prospects forward — not to keep polishing them in place.
- **Primitives:** query cards (per platform), prospect records, research modal (match/entry-point/approach), pipeline tabs, persona guidance.
- **Flows in:** Territory Architect (focus, tier, approach vocabulary).
- **Flows out:** qualified accounts into Signal Console; push decisions carry focus + approach context forward.
- **Must never be flattened:** the discipline that accounts must pass focus match before they reach Signal Console.

### 4.7 Signal Console — Live Instrument (*protected room*)

- **Purpose:** the room where the operator tracks the named accounts they're watching, the signals attached to each, and the next move on each. Accounts come in by hand or from enrichment, signals stack up against them, the operator decides what to act on. Cross-room handoffs route the act-on decision into Outbound, Call Planner, Cold Call, and the Deal Workspace.
- **Strategic logic:** signals are time-limited events. Heat = signal count × type weight × source credibility × recency decay. Research on a qualified account may justify motion; research without motion is collection theater. Account heat feeds Dashboard command ranking. Post-ADR-006: Signal Console is also the **data substrate** the Briefing room reads from — accounts + signals live in the `signal_console_accounts` + `signals` Postgres tables this room owns. Briefing reads; never writes back.
- **Primitives:** account list, signal records, heat score per account, morning brief, research posture ("motion ready" vs "research heavy"), workspace-health block (compounding vs still weak), enrich-all flow.
- **Flows in:** accounts from Sourcing Workbench + Territory Architect; ICP match score.
- **Flows out:** ranked accounts into Outbound Studio, Cold Call Studio, LinkedIn Playbook; heat + readiness into Dashboard; heat + motion state into Handoff Kit; accounts + signals into the Briefing room (read-only substrate per ADR-006).
- **Must never be flattened:** signal interpretation, account-to-motion logic, account priority meaning. Never reduce to a badge list or passive timeline.

### 4.8 Outbound Studio — Live Instrument

- **Purpose:** route one live outbound line — account × buyer × temperature × trigger × next-question — before it leaves.
- **Strategic logic:** "no send path without a named strain." Operator cannot route generic category language into a live channel. Every route keeps a recovery cable on the same board. Persona × temperature × trigger produces the exact line.
- **Primitives:** operator rack inputs (account, buyer, persona, temperature, trigger), route method sheet, no-ask mode toggle, generated send line, angle save, touch log.
- **Flows in:** account + heat from Signal Console; personas from ICP Studio; approaches from Territory Architect.
- **Flows out:** motion truth into Dashboard, LinkedIn Playbook, Readiness, Handoff Kit.
- **Must never be flattened:** motion craft and anti-spam seriousness. Never a template-spam generator.

### 4.9 Cold Call Studio — Live Instrument

- **Purpose:** narrow pressure thread-by-thread during a live cold call; turn script archives into one pulled thread at a time.
- **Strategic logic:** six named threads (Prep → Opener → Pressure → Proof → Ask → Exit) each with buyer-might-say branches and recommended next lines. A cold call is won by narrowing pressure, not widening explanation. The rep lives in one thread at a time.
- **Primitives:** thread spine, buyer-response branches, say-next capture panel, outcome logging (meeting_booked, callback_scheduled, referral, etc.), score read, call memory table.
- **Flows in:** signal account from Signal Console; ICP persona.
- **Flows out:** on `meeting_booked`, creates a Deal record; call outcomes into Dashboard, Deal Workspace, Readiness, Handoff.
- **Must never be flattened:** live-call consequence; never becomes a script library.

### 4.10 LinkedIn Playbook — Live Instrument

- **Purpose:** use LinkedIn as disciplined air cover — never the opening scene.
- **Strategic logic:** five cues (Watch public signal → Comment with one operating read → Connect after recognition → Give proof before asking → Ask only when earned). The inbox is not the opening scene. Public cue first, ask only when trust has compounded.
- **Primitives:** five-cue ladder, cue log form, cue-method templates (Connection, Public cue, Give-first, Ask), channel memory stats (touches, acceptance, reply rate).
- **Flows in:** account and persona from Signal Console / Outbound Studio.
- **Flows out:** motion truth into Dashboard, Signal Console, Readiness, Handoff.
- **Must never be flattened:** channel-specific discipline. Never flatten into generic outreach tips.

### 4.11 Call Planner — Live Instrument *(app path: `/app/discovery-agenda/`)*

- **Purpose:** prepare the exact shape of the next call so the rep arrives with conviction, not hope.
- **Strategic logic:** four-stop spine — Open / Reason now / Probe / Advance ask. The plan is not an agenda; it is the rep's pre-conviction. The plan must die in the call (get used), not die in the planner (go unused).
- **Primitives:** account + persona + deal witness column; four agenda strips; outcome capture + customize sub-form; handoff actions.
- **Flows in:** signal + account heat from Signal Console; deal state from Deal Workspace; ICP persona.
- **Flows out:** `gtmos_call_handoff` payload into Discovery Studio; advance-ask intent into Deal Workspace.
- **Must never be flattened:** agenda quality; the link to Discovery and Deal. Never reduce to a plain agenda form.

### 4.12 Discovery Studio — Diagnosis Table / Live Instrument hybrid *(named premium asset)*

*See also the five 2026-04-10 guardian specs in `08-room-guardian-specs/`. Those are binding.*

- **Purpose:** a live discovery operating console — the rep speaks, branches, recovers, locks the next move, and hands truth into the next room without restating.
- **Strategic logic:** one vertical, collapsible, branch-driven call rail. The rep lives in one open segment at a time; everything else stays compressed but jumpable. Discovery is not a framework gallery, not a methodology viewer, not a notepad. The room answers live pressure with control, not density.
- **Primitives (21 per the runtime wiring sheet):** `frameworkRegistry` (9 frameworks), `activeFramework`, `callClock`, `phaseTempoPlan`, `activeNode`, `activeTrack`, `essentialNodeSet`, `skipAheadHandlers`, `responseSet`, `expandedResponse`, `learnedFacts`, `signalLedger`, `tiebackLedger`, `supportDossier`, `objectionLibrary`, `inboundQuestionHandlers`, `compressionMode`, `nextStepLock`, `callDisposition`, `postCallPackage`, `handoffPayload`.
- **Fixed segment spine (10):** Opening frame → Current-state truth → Pain and consequence → Trigger and urgency → Stakeholder and ownership → Proof threshold → Current vendor and displacement → Decision architecture → Next-step lock → Post-call routing.
- **Nine frameworks (locked):** Legal; Recruiting/Talent; Product/UX/Enablement; GovTech/Compliance; Customer Support/Operations; Sales/Revenue Intelligence; Manufacturing/Supply Chain/Engineering; Data/Intelligence Infrastructure; AI-Native Buyer.
- **Required global rails (7):** framework rail, segment rail, recover-the-call rail, learned-truth ledger, worked memory, next-step docket, support dossier.
- **Flows in:** `gtmos_call_handoff` from Call Planner; deal state from Deal Workspace.
- **Flows out:** Deal Workspace (active framework, learned facts, stakeholder map, current-state method, trigger event, proof threshold, blockers, next-step lock); Call Planner (framework, segment context, hypothesis, open questions, objections, stakeholder map); Future Autopsy (failure-pattern clues, unresolved proof gaps, stalled-next-step evidence, disqualification indicators).
- **Must never be flattened:** any of the 21 primitives; the hard on-call control laws (visible call clock + tempo, compression mode that actually filters nodes, skip-ahead handlers, support dossier, tie-back discipline). *If a visual object cannot map to a primitive, it should not exist in the room.*

### 4.13 Deal Workspace — Diagnosis Table

- **Purpose:** surface the recovery queue — which deals are weakest, why, and what the next corrective move is.
- **Strategic logic:** the room is an intervention board, not a Kanban. First-fold should expose pressure fast — "which deals will close-lost if I do nothing this week, and what's the smallest corrective move." Stage is not truth unless next-step truth backs it up.
- **Primitives:** intervention board (dealGrid), 9-field deal-health modal (champion, EB, use case, pain, competition, process, notes, forecast, momentum), recovery queue panel, deal-health panel, loss-reason modal feeding Playbook loss patterns.
- **Flows in:** deals auto-created from Cold Call; deal state updates from Discovery Studio; proof state from PoC Framework; advisor effect from Advisor Deploy.
- **Flows out:** deal pressure into Future Autopsy, Dashboard, Readiness, Handoff Kit; loss patterns into Founding GTM.
- **Must never be flattened:** deal pressure, next-step quality, stage truth, qualification seriousness. Never a passive record page.

### 4.14 Future Autopsy — Diagnosis Table *(named premium asset)*

- **Purpose:** pre-mortem the deal before it dies; show the causal pattern and the corrective route.
- **Strategic logic:** "the deal is pinned as evidence." Forensic light-table posture. Six live pinned cases form a ledger; the analysis column shows causal pattern (e.g., *pressure before clarity*), intervention options (change the 3× deal truth / test the risk-fix lens / rebuild the agenda), and a command row (Run selected / Urgent autopsy deal / Copy brief).
- **Primitives:** pinned-case ledger, horizon tag (days out), causal-pattern narrative, intervention options, command row, route rack (back to Deal Workspace / Call Planner / Discovery Studio / PoC Framework).
- **Flows in:** deals with pressure/stage truth from Deal Workspace; unresolved gaps from Discovery Studio; proof state from PoC.
- **Flows out:** reroute logic into Deal Workspace, Call Planner, Discovery Studio, PoC Framework.
- **Must never be flattened:** failure-pattern diagnosis, consequential route correction, strategic severity. Never soften into "risk review." This is the positive example the other Diagnosis Table rooms should borrow from.

### 4.15 PoC Framework — Decision Bench

- **Purpose:** turn one pilot into a piece of evidence the buyer's boss can read and act on, so the pilot becomes something the deal can use instead of background noise.
- **Strategic logic:** "raw interest is not proof until it can be carried." The room forges four molds — Claim, Owner, Metric, Kill rule — plus linked deal and readout owner. The dark/light split stage visually encodes raw → refined.
- **Primitives:** linked deal, vendor, account, readout owner, success criteria (pass/fail), boundaries/kill rules, outcome state, duration toggle (7d/14d), proof pack (docs), heat ledger (claim heat / owner heat / kill heat), weakest-mold diagnosis.
- **Flows in:** deal from Deal Workspace.
- **Flows out:** proof object into Deal Workspace (risk), Future Autopsy (kill rule), Advisor Deploy (portable evidence); proof state into Handoff.
- **Must never be flattened:** proof design, proof-weakness visibility, proof-to-deal compounding. Never a checklist.

### 4.16 Advisor Deploy — Live Instrument

- **Purpose:** prepare one backchannel ask before spending external trust; route it, log it, watch it come back as deal movement.
- **Strategic logic:** "private influence desk." Deal × advisor × ask-moment produces the exact ask. Stamps record Send / Hold / Reroute. Every ask must return as deal update, advisor hold, or reroute. Trust is spent, not spent.
- **Primitives:** deal/advisor/ask-moment routing, proof blotter, rolodex of advisors, ask-sheet composer, outcome stamps, advisor registry (tier, expertise, companies, notes), deployment-loops ledger, desk-read impact grid.
- **Flows in:** deal from Deal Workspace; proof from PoC Framework.
- **Flows out:** advisor effect on deal pressure → Deal Workspace, Dashboard, Handoff.
- **Must never be flattened:** the deal-linked consequence; advisor use is not a side log.

### 4.16b Negotiation — Live Instrument *(placeholder, rebuild owed)*

- **Status:** **placeholder** in canon — no shipped room yet. Renamed from the legacy "CFO Negotiation" room that was retired during the architecture-reset (Apr 2026). Founder directive 2026-05-01: bring it back as **"Negotiation"** with the old CFO Negotiation content carried forward as the seed.
- **Purpose (intent):** prepare and rehearse the negotiation conversation before it happens — procurement, finance, pricing, terms — so the founder/operator walks in with rehearsed positions, not improvised concessions. Negotiation belongs in the Call/Deal/Proof family, post-evaluation and pre-close.
- **Strategic logic (intent):** negotiation is its own discipline; it is not just "a phase of Deal Workspace." The legacy CFO Negotiation room held tested scripts for procurement and finance conversations — that content is the seed. The rebuild should treat each negotiation as a ROUTED ASK (deal × counterparty × ask × concession ladder) the same way Advisor Deploy treats backchannel asks. The argument is that founders default to giving concessions to "be reasonable"; the room should make every concession a deliberate move, not a reflex.
- **Primitives (proposed, founder to confirm in rebuild):** counterparty role (CFO / Procurement / Legal / GC), deal link (carries pricing + stage), starting position, walk-away position, concession ladder, opening line, response-to-pushback templates, "we won't repeat this" log. Procurement scripts + finance scripts from the legacy room carried forward.
- **Flows in (intent):** deal from Deal Workspace (pricing, stage, decision architecture); proof from PoC Framework (what's been demonstrated); advisor from Advisor Deploy (whether a backchannel is preparing the ground).
- **Flows out (intent):** rehearsal outcomes + concession ledger into Deal Workspace; loss-pattern feedback into Future Autopsy (was the negotiation already lost before the meeting?); patterns into Founding GTM §6 ("Why we win").
- **Cross-room compounding (canon §6 update on rebuild):** Deal Workspace ↔ Negotiation ↔ Advisor Deploy form a triangle on the high-pressure phase of a deal. Each carries different leverage; the rebuild needs to make the triangle legible without forcing the operator to triage between them.
- **Must never be flattened:** negotiation as deliberate craft (not a form, not a pricing calculator); the script content carried forward from the legacy room (procurement + finance conversations); the concession-as-deliberate-move discipline.
- **Migration content owed:** the legacy `antaeus_studio_cfo_v2` localStorage shape held the procurement + finance script bodies. Those scripts are the seed content for the rebuild; nothing else from the old room is binding.

### 4.17 Readiness Score — System Ledger

- **Purpose:** answer one question — *could a real first-hire walk into this workspace tomorrow and run the motion?* — and give the operator a verdict, not a number.
- **Strategic logic:** readiness is a **maturity assessment**, not a pressure rail. The dashboard's command-intelligence rail already answers *"what should I act on today?"*; Future Autopsy answers *"what's decaying?"*; Readiness answers *"is the system inheritable yet?"* That is a different shape of truth — an integral over time, not a derivative. The room shows the verdict, the gating evidence behind it, and what would change the verdict next. Dimension scoring stays internal as the math but is not the first-fold story. Anchored on the dashboard topbar at all times so the verdict is **prominent but never obnoxious**.
- **Primitives:** verdict (5 levels — see below), gating evidence per verdict, *"what would move the verdict next"* unlocks, internal dimension scoring (5 dimensions × 20 = 100, kept for the math), single-fold drawer layout (overlay, not a route), topbar anchor, ceremony hooks for verdict transitions UP.
- **Verdicts (gate-based, not threshold-based):**
  1. **You are the system** — founder-led, no transferable surface yet. *Trigger:* any dimension at 0.
  2. **Building** — activity exists but the next hire would still be improvising. *Trigger:* at least 2 dimensions ≥ 8/20, no dimension at 16+.
  3. **Inheritable with guardrails** — the hire could run the motion if the founder is around for sanity-checks. *Trigger:* every dimension ≥ 10/20 AND at least one dimension ≥ 16/20 AND first proof exists.
  4. **Hire-ready** — the motion would survive the founder taking a 2-week vacation. *Trigger:* every dimension ≥ 14/20 AND closed-won deals exist AND Future Autopsy has been run AND PoC framework has at least one cast proof.
  5. **Hire-ready, repeatable** — multiple wins, multiple losses analyzed, advisor deployments lit, handoff kit composed. *Trigger:* all "Hire-ready" conditions PLUS win/loss balance ≥ 1 AND advisor deployments ≥ 1 AND handoff sections ≥ 5/7 ready.
- **Flows in:** summaries from every deep room (cloud-synced now via `data-client.ts`, not `gtmos_readiness_snapshot`); deal-health vitals; PoC outcomes; Future Autopsy run history; advisor deployment outcomes.
- **Flows out:** verdict + topbar anchor into Dashboard; verdict transition UP fires the **ceremony moment** in Founding GTM (set-piece, not toast — see §4.19); verdict + gating evidence into Welcome anchor stack.
- **Anchor placement:** Dashboard topbar carries a single Readiness Anchor — verdict label + tiny chevron, max 1 line. Click → opens the Readiness drawer (overlay, no route change).
- **Must never be flattened:** verdict as gate-based truth (not threshold-based); the singular question (*hire-ready or not*); the ceremony at verdict transitions UP. Never duplicate what the dashboard already says about *"what's weakest now."* Never become a 5-bar score breakdown as the primary surface — bars are decoration, the verdict is the value.

### 4.18 Quota Workback — System Ledger

- **Purpose:** turn a quota target into weekly execution pressure the user can feel.
- **Strategic logic:** quota math is execution pressure, not isolated planning. The workback tells the user how many meetings per day, motions per week, and deals per quarter they actually need — pinned against real pipeline state.
- **Primitives:** annual quota, ACV, win rate, cycle length, daily activity targets, pipeline coverage, system-health variant (fragility, coverage).
- **Flows in:** pipeline from Deal Workspace; motion from Outbound/Cold Call; onboarding targets.
- **Flows out:** targets into Dashboard; coverage truth into Readiness; execution pressure into Outbound + Cold Call.
- **Must never be flattened:** quota as execution pressure. Never disconnected planning math.

### 4.19 Founding GTM / Handoff Kit — System Ledger

- **Purpose:** be the **living onboarding surface** the first hire opens on day one — the room where the founder's tacit GTM memory becomes a transferable artifact. *Not* an export; the workspace itself is the durable artifact post cloud-sync. The kit's job is **authored opinion + cross-room synthesis**, not aggregation.
- **Strategic logic:** the export framing was vestigial — cloud sync makes the workspace itself the inheritance vehicle. What the kit does is what the workspace cannot: render the founder's hard-won GTM understanding as **prescriptive, surprising, specific** content the hire can read top-to-bottom on day one. Specificity comes from authored opinion (not bullet aggregation) and from cross-room reads that no single room could surface alone. The room is the culmination — UI/UX argument Rule F: getting the workspace ready to hand off should feel like the thing every other room is pointing toward, and this is where that finally happens.
- **Seven sections (replacing the legacy six):**
  1. **Who hits, who misses, why** — ICPs + closed-won pattern (which ICP × persona × trigger combos actually closed) vs closed-lost pattern. *Surprise:* call out when the operator's stated ICP doesn't match the actual close pattern.
  2. **The rails that worked** — the specific message template + persona + trigger of touches that converted to meetings, ranked by conversion rate. Channel breakdown for THIS workspace. *Surprise:* a "rails-not-yet-tried" callout — channels the operator's ICP-matched accounts haven't been touched on yet.
  3. **The questions that earned the next meeting** — the specific Discovery Studio segments + buyer-says branches that generated `advancedCalls`. *Surprise:* the questions the operator has stopped asking — segments their most recent calls SKIPPED.
  4. **Where deals are won + where they leak** — stage-by-stage conversion map + the moments advisors got deployed (which stage, which moment-type, what outcome). *Surprise:* the leaky stage callout with advisor coverage gap.
  5. **The losses we paid for** — actual deal autopsies from Future Autopsy: corrected verdicts, kill-switches that fired, tasks marked "we won't repeat this." 3-5 specific past deals as evidence. *Surprise:* cross-reference loss reasons with current open deals.
  6. **Why we win** — the wins as patterns, not anecdotes. The closed-won deals' shared traits, what made them winnable, the moves the founder used. The section the new hire prints out.
  7. **Day-one operating rhythm** — a prescriptive weekly cadence for the new hire (Monday: Dashboard top-3 risks; Tuesday: outbound day with N touches; Wednesday: discovery prep + calls; etc.) generated from the operator's actual quota math + cycle length. *Surprise:* the section that says "what the founder tried that didn't stick" — habits the founder attempted but abandoned.
- **Primitives:** seven authored sections (not aggregated bullet lists), per-section status (ready / partial / empty), per-section "surprise" callout (the cross-room read), workspace-scoped data (no exports, no markdown download), section-readiness count (e.g. *5/7 sections ready*), share-link mechanic (read-mode workspace access for an external email), ceremony hook for the *"kit became real"* moment.
- **The ceremony moment:** when Readiness verdict transitions UP from **Building → Inheritable with guardrails** for the first time in a workspace, fire a **set-piece moment** (not a toast). Scope: animated reveal in the Founding GTM room — the verdict change, the kit count moving (e.g. 2/7 → 4/7), a serif headline ("the kit just became real"), and a one-time CTA to share the workspace in read-mode. Only fires once per workspace per upward transition. Downward transitions are silent.
- **Flows in:** every cloud-synced room. Specifically: ICP Studio (Section 1 base) + Deal Workspace closed-deal evidence (Section 1 cross-ref + Section 4 + Section 5 + Section 6); Outbound Studio touches + LinkedIn actions + Cold Call log (Section 2); Discovery Studio segment-jump data (Section 3); Advisor Deploy deployments (Section 4); Future Autopsy autopsies (Section 5); Quota Workback inputs + Deal Workspace pipeline (Section 7).
- **Flows out:** section-readiness count into Dashboard + Readiness Anchor (drives the *5/7 ready* stat); section-readiness count drives the Readiness "Hire-ready, repeatable" gate (≥ 5/7).
- **Must never be flattened:** the authored-opinion frame; the cross-room "surprise" reads; the ceremony moment. Never an export of room data. Never a bullet-list aggregator (the legacy room was that — the rebuild explicitly is not). Never just a scoreboard — Section 7's prescriptive cadence is the operating rhythm, not metrics.

### 4.20 Settings — Trust Annex

- **Purpose:** keep the user safe, make trust and recovery real, without stealing attention from live operating rooms.
- **Strategic logic:** calm, plainspoken utility. Export all data, import, delete all, sync state, data-stored-locally notice, account controls. No drama, no internal architecture language, no fake product excitement.
- **Primitives:** backup/restore, role + onboarding state, category framing, browser-specific controls.
- **Flows in/out:** manages `gtmos_*` localStorage keys; bridges to Supabase auth.
- **Must never be flattened:** the trust signals. Never mixed with operating-room energy.

### 4.21 Briefing — Intelligence Surface *(named premium asset; new room per ADR-006)*

- **Family:** new composition family, closest neighbor is System Ledger (Part II §4.6). Face direction TBD; the 17 May 2026 product preview is dark + gold + Fraunces and gets re-skinned to canon Part II §1 (bright, navy, orange accent, DM Serif Display) during face work.
- **Purpose:** the room the operator opens once a week to read what the system has actually figured out — not "what to act on next" (that's the Dashboard's job) and not "which accounts are on the radar" (that's Signal Console's job), but *the read of the world the operator is selling into, written like a peer telling them what they see*.
- **Posture:** **provocative**, not responsive (per Design Posture v0.1). The Briefing serves the operator's stated preferences AND takes on three additional obligations the operator did not ask for: Coverage (surface entities the operator hasn't named but the data says they should be watching — Periphery), Framing (challenge interpretations the operator has committed to when the evidence contradicts them — Contrarian), Defensibility (preserve enough state at every Pattern's synthesis to let the operator reconstruct what the system said, on what basis, with what supporting evidence, months later — Audit Envelopes).
- **Strategic logic:** the operator's stated preferences are treated as *hypotheses under continuous evaluation*, not fixed truths to be served. The Watchlist is a hypothesis about who matters. The ICP is a hypothesis about who buys. The competitive set is a hypothesis about who is competing for the same dollars. Each is testable against the data the pipeline is processing. A responsive product accepts them as given; the Briefing tests them continuously and tells the operator when the evidence is not supporting the hypothesis.
- **Primitives (per Recipe Layer Spec v0.4):** Pattern (synthesized read with claim + evidence + confidence + audit envelope); ContrarianPattern (challenge to a stated assumption); Periphery Candidate (off-watchlist entity the data says should be on it); Watchlist Trigger (operator-issued standing order — five types: single_event / aggregation / threshold / adjacency / silence); Deal-Watch Alert (item that intersects an active deal); Audit Envelope (immutable JSON capture of cluster + hydrated context + LLM call chain + cost at every synthesis); Voice Document (banned vocab + 5 exemplars + structural rules + hedging rules driving every quality gate); Behavioral Feedback (operator-marked Used / Met / Noise that tunes weights).
- **Pipeline:** Context Hydration → Ingest → Filter → Enrich → Periphery Detection → Cluster → Synthesize (Draft → Critique → Revise → Quality Gate) → Contrarian Synthesis → Score → Surface → Briefing Compose. Wrapped end-to-end by the Audit Envelope subsystem. Watched by the Evaluation Harness (pre-merge gates + production sampling with retroactive scoring).
- **Substrate dependency:** the Briefing is the **intelligence surface** that reads from the existing Signal Console room as its **data substrate** — accounts, signals, heat all live in `signal_console_accounts` + `signals` Postgres tables owned by Signal Console. The Briefing never writes to those tables. The two rooms have different jobs at different altitudes (substrate = "where I track accounts"; surface = "what the system tells me each week").
- **Flows in:** every other room's `getState()` contract (ICP Studio, Discovery Studio, Call Planner, Outbound Studio, Asset Builder, Deal Workspace, Watchlist Triggers, Voice Document, Behavioral Feedback) + the Signal Console substrate's accounts/signals + external sources per the Intelligence Coverage Audit.
- **Flows out:** `recommended_moves[].destination` draft routing into Discovery Studio (Phase 04 refresh, etc.), Call Planner (objection handler new/refresh), Asset Builder (battlecard refresh, executive one-pager), Outbound Studio (objection-handler-driven hooks), Deal Workspace (deal-watch alerts). The Briefing never writes directly; it produces drafts the operator reviews and saves to the destination room.
- **Voice:** governed by `deliverables/specs/briefing/signal_console_voice_document_v0.1.md` (named "Signal Console" in-doc; refers to the Briefing room per ADR-006). The voice document is the editorial brain — banned vocabulary, 5 exemplars, structural rules, hedging rules. Every Pattern passes through synthesis, synthesis reads this document, the document is the ceiling the model imitates. Voice is "conversational gravity" — a sharp operator with a decade of B2B sales scars explaining what they see, declarative over hedged, specific over general, evidence-anchored over assertion-of-self. Aligned with canon Part III §11.
- **Cost discipline:** per-user weekly LLM ceiling + separate harness-cost ceiling. Degradation policy: warning at 80% of ceiling, throttle at 100% (Sonnet substitution + relevance threshold tightening), pause at 150%. Cost telemetry visible on the footer of every briefing.
- **Must never be flattened:** the provocative obligations (Coverage, Framing, Defensibility). The Voice Document's editorial discipline. The audit envelope's immutability. The Briefing as a *read of the world*, not a list of items or a dashboard. Never a feed; never an inbox; never a notification center.
- **Phase B supersession (RE-REVERSED by ADR-009 2026-05-31):** ADR-006 §"Phasing" originally retired Phase B's standalone scope and absorbed it into the Briefing's Recipe Layer. ADR-009 reverses that absorption — workspace-scope observations are now a distinct stream from world-scope Briefing Patterns. The two streams have different subjects (your own work vs the market), cadence (heartbeat vs weekly), cost (SQL vs full Recipe Layer), and surface (Dashboard card vs Briefing room). The Briefing's Voice Document remains canonical for both streams via the extracted `src/lib/voice/` module. The signal-decay concept lives in BOTH streams: as a `signal_decay` workspace observation (silence on a watched account, your own coverage gap) AND, when Briefing Patterns ship, as a silence Trigger (silence on a market entity, an external signal). Cross-deduping at the Dashboard card prevents double-reads when both fire on the same entity.
- **Authority:** Design Posture v0.1 + Voice Document v0.1 + Recipe Layer Spec v0.4 + GTM OS Read Interface Contracts v0.1 + Watchlist Trigger Grammar v0.1 + Intelligence Coverage Audit + Evaluation Harness v0.2 + End-to-End Walkthrough v0.1, all at `deliverables/specs/briefing/`. The build phase plan lives at `deliverables/specs/briefing/01-build-phase-plan.md` (to be authored after this canon update lands).

---

## 5. Protected rooms

These rooms get extra protection: they may not be made generic, renamed, folded into other rooms, or watered down.

- **Signal Console**
- **Future Autopsy**
- **Discovery Studio** *(by virtue of the 2026-04-10 strict room contract and the five guardian specs)*

A face pass may tighten how these rooms look. It may not reduce what they know.

---

## 6. Compounding rules (cross-room)

The full matrix lives in `03-facial-architecture/antaeus-phase-7-preflight-behavioral-copy-burden-audit-and-disclosure-matrix-2026-04-02.md` §11. Short form:

- **Onboarding** seeds ICP framing, Discovery framing, Quota framing, Settings, Welcome, Dashboard (`gtmos_activation_context`).
- **ICP Studio** feeds Territory, Sourcing, Signal Console, Outbound, Discovery, Readiness, Handoff (shared targeting defaults).
- **Territory** feeds Sourcing, Signal Console (tiers + focuses).
- **Sourcing** feeds Signal Console, Territory (pushed prospect continuity).
- **Signal Console** feeds Outbound, LinkedIn, Dashboard, Readiness, Handoff (account heat + motion context).
- **Outbound / LinkedIn / Cold Call** feed Dashboard, Readiness, Handoff (shared motion truth).
- **Cold Call** also creates Deals on `meeting_booked` and feeds Deal Workspace directly.
- **Call Planner ↔ Discovery Studio** via `gtmos_call_handoff`.
- **Discovery Studio** feeds Deal Workspace, Handoff, Readiness.
- **Deal Workspace** feeds Future Autopsy, PoC, Advisor, Dashboard, Readiness, Handoff.
- **Future Autopsy** feeds Deal Workspace, Call Planner, Discovery Studio, PoC (reroute logic).
- **PoC Framework** feeds Deal Workspace, Dashboard, Handoff, Negotiation (proof state into terms conversations).
- **Advisor Deploy** feeds Deal Workspace, Dashboard, Handoff, Negotiation (carry-to-advisor before pricing rehearsal).
- **Negotiation** feeds Deal Workspace (rehearsal outcomes + concession ledger), Future Autopsy (loss-pattern feedback), Advisor Deploy (backchannel air cover on terms), PoC Framework (proof state during rehearsal). The Deal Workspace ↔ Negotiation ↔ Advisor Deploy triangle is the high-pressure phase of a deal per canon §4.16b.
- **Quota Workback** feeds Dashboard, Outbound, Cold Call, Deal, Readiness.
- **Readiness** feeds Dashboard, Welcome, Handoff (`gtmos_readiness_snapshot`); verdict transitions trigger the Founding GTM ceremony moment.
- **Handoff Kit** feeds Readiness, Dashboard, future launch readiness.
- **Briefing** (per ADR-006, new room) reads from EVERY other room via `getState()` contracts (ICP, Discovery, Call Planner, Outbound, Asset Builder, Deal Workspace + the new Watchlist Triggers / Voice Document / Behavioral Feedback modules) plus the Signal Console substrate (`signal_console_accounts` + `signals` Postgres tables). Feeds `recommended_moves[].destination` drafts into Discovery Studio (Phase 04 refresh), Call Planner (objection handler new/refresh), Asset Builder (battlecard refresh, executive one-pager), Outbound Studio (hooks), Deal Workspace (deal-watch alerts). The Briefing never writes directly to any other room; it produces drafts the operator reviews and saves to the destination.

**Preserved continuity params (do not break):** `returnTo`, `returnLabel`, `focusObject`, `focusRoom`, `fromMode`, `fromSurface`, room-entry bridge, pinned context, stable command selection on return.

**Birdseye navigation** (Program 6 / PR 1): every room mounts the canonical `RoomChrome` (wordmark + back-pill + cmd+K palette trigger). The palette (`src/lib/palette/`) is the "summoned room access" affordance Part II §5 implies — registry of all 20 rooms with family grouping + keyword filter; cmd+K toggle from any surface; back-pill reads the same continuity params HandoffStrips write. Closes the regression where 18 of 20 destination rooms silently dropped the back-affordance Phase 2 wrote into URLs.

---

# Part II — The Face

## 1. Direction lock

Antaeus is no longer dark-first. The current direction — confirmed by the visual-identity-lock memo (2026-04-01), the visual-system-spec (2026-04-01), and the refaced rooms — is:

**bright · severe · composed · authored · dense but calm**

The interior reads as a tool the operator actually trusts, rendered on a bright, quiet field. Not a dark founder-admin shell. Not a generic SaaS pastel. Not a trend-chasing clean-design kit.

### Bright-only — the dark exception is retired (2026-04-27)

Originally this section recorded "the one exception: System Ledger rooms are dark," with PoC Framework, Quota Workback, ICP Studio, Readiness Score, and Founding GTM / Handoff Kit all going dark navy as their canonical surface. Founder directive on 2026-04-27 — *"i mainly dont want you to be using dark backgrounds"* — retired that exception. Every room migrated to the new stack ships bright by default.

Current state across the new-stack rooms:

- **All 17 migrated Phase 4 rooms** (Deal Workspace, Dashboard, Signal Console, Future Autopsy, PoC Framework, Outbound Studio, Cold Call Studio, LinkedIn Playbook, Call Planner, Advisor Deploy, ICP Studio, Territory Architect, Sourcing Workbench, Quota Workback, Settings, Welcome, Onboarding) — **bright field, navy ink**
- **PoC Framework** — bright forge with orange left-rule + cream cast (was a dark/light split; flipped post-Phase 4)
- **ICP Studio** — bright hero with orange left-rule (was dark hero + bright work area; flipped during the Room 11 PR)
- **Quota Workback** — bright System Ledger panel (built bright per the same directive)

Two legacy rooms still render dark navy on the old stack:

- **Readiness Score** — full dark navy (legacy, not yet migrated; **mind rewritten 2026-05-01, see §4.17**)
- **Founding GTM / Handoff Kit** — full dark navy (legacy, not yet migrated; **mind rewritten 2026-05-01, see §4.19**)

The mind-rethink the 2026-04-27 ADR-002 amendment paused for is now done (founder approval on 2026-05-01). The new minds for both rooms are locked in §4.17 and §4.19. They retain their dark legacy surface until the rebuild ships; that rebuild will land them on the bright doctrine + the new gating model.

The discipline that originally drove the dark exception — *"synthesis, judgment, and earned-truth surfaces feel different from live operating rooms"* — survives, but it's now expressed via composition + accent rules + serif weight, not luminosity. Quota Workback is the canonical worked example: bright base, deep navy serif headline, orange-ruled hero stat, green/red posture pill, no dark surfaces anywhere.

### What bright means here

The base field is a soft, bright neutral with a cool cast — `#F6F8FC` territory, not stark white. Restrained gradient air is allowed: radial washes of blue and orange behind the base, subtle graph-paper undertexture (1px grid at ~32–34px with very low opacity). Deep navy ink sits on top for authority. The bright field is quiet, not flat.

### Dark is for legacy only

The legacy `/app/<room>/` shell still has dark Readiness Score and Founding GTM pages and dark page chrome on a few unrefaced surfaces. When working in those legacy files, dark stays — touching the surface there is out of scope unless the founder authorizes a face pass. For everything that lives under `src/<room>/` on the new stack, bright is the rule with no exceptions.

---

## 2. Typography lock

- **Serif** — authority, emphasis, consequence. Authored serif headlines carry the argument of the room. Large, confident, often `clamp(48px, 6vw, 108px)` for the dominant headline line. Preferred: *DM Serif Display*.
- **Modern sans** — control surfaces and reading. Buttons, inputs, body copy, labels. Preferred: *Public Sans*, *Plus Jakarta Sans*, *Outfit* (for display-weight sans).
- **Mono** — kickers, meters, operational micro-labels only. Never body text. Letter-spaced uppercase for section codes. Preferred: *JetBrains Mono*, *IBM Plex Mono*.

**The compression rule:** authored serif headlines carry the argument. Sans carries the work. Mono recedes.

**Type discipline:**
- One dominant headline per surface — never two competing serifs at similar weight
- Max 3 sizes in the first visible zone
- Mono must do semantic work (kicker, code, score) — never decoration
- Giant display type must be *earned*; never use it to fill space

---

## 3. Color semantic roles

| Role | Meaning | Use |
|---|---|---|
| **Navy** | ink / authority / structural text | default body + display, deep UI |
| **Orange** | focus / pressure / primary action / urgency | the one dominant move; rationed, never decorative |
| **Blue** | system intelligence / information / secondary action | system-state, links, informational chips |
| **Green** | healthy / ready / live | real completion or earned health only |
| **Amber** | caution / needs sharpening | mid-weight warnings |
| **Red** | real risk / real failure / intervention needed | decaying deals, destructive actions |
| **Gold** | earned emphasis / premium / consequential states | reserved; not a default accent |

Every color carries a semantic role. If a color appears without carrying meaning, remove or recolor it.

**Rationing rules:**
- Orange is the most powerful color; use it on the one primary move per surface, and only once
- Green must be earned — never a default "looks positive" color
- Amber is more common than red; red is the last-resort intervention color
- Gold and blue should not compete as co-dominant accents

---

## 4. Composition families

Seven families cover the whole product. Every room maps to one primary family. Families define first-fold structure, hierarchy rhythm, allowed plane count, copy burden, color posture, what must feel loud, what must feel recessive.

No room invents its own family. If a new room doesn't map cleanly, update this doc first.

### 4.1 Threshold (entry)
- **Rooms:** Welcome, Onboarding
- **Feel:** invitational, bright, composed, transitional, confidence-building
- **Laws:** one commanding statement; one dominant next move; progress visible but not gamified; support context quiet and secondary; very low menu burden
- **Avoid:** hero + card pile; orientation copy avalanche; recovery surfaces competing in the center

### 4.2 Command Chamber (ranking)
- **Rooms:** Dashboard
- **Feel:** ranked, precise, calm under pressure, instrument-like
- **Laws:** one focal object or ranked order; command density is the star; support/trust surfaces pushed outward; room access secondary and summoned, not central; explanation compressed into tight reasons
- **Avoid:** dashboard vanity metrics; equal-weight boxes; room-browsing center stage

### 4.3 Live Instrument (live execution)
- **Rooms:** Signal Console, Outbound Studio, Cold Call Studio, LinkedIn Playbook, Call Planner, Discovery Studio, Advisor Deploy
- **Feel:** live, tense, immediate, operational
- **Laws:** top of page behaves like a working console, not a report; action controls are real and proximal; context visible but compressed; health is a short pulse, not a summary essay
- **Avoid:** tutorial-like intros; stacked advisory cards; live rooms looking like admin forms

### 4.4 Decision Bench (strategic shaping)
- **Rooms:** ICP Studio, Territory Architect, Sourcing Workbench, PoC Framework
- **Feel:** deliberate, sharpened, exacting, constructive
- **Laws:** the object being sharpened is visually central; the top should show what quality or truth is being improved; builder controls support the object, not the other way around; proof of downstream consequence stays visible
- **Avoid:** worksheet energy; equal-weight builder panels; "fill out the form" feeling

### 4.5 Diagnosis Table (intervention)
- **Rooms:** Deal Workspace, Future Autopsy
- **Feel:** severe, investigative, consequence-aware, corrective
- **Laws:** first-visible zone shows where the work is decaying fast; risk and what's actually happening are legible before any long explanation; the corrective route is obvious; health language reads like what an honest operator would say, not an analytics dashboard
- **Avoid:** abstract diagnosis without corrective motion; dramatic narrative copy at the top; boxed warning-board clutter

### 4.6 System Ledger (synthesis)
- **Rooms:** Readiness Score, Quota Workback, Founding GTM / Handoff Kit
- **Feel:** earned, synthesizing, steady, authoritative, consequential
- **Laws:** the system should feel like it is reconciling evidence; one summary state dominates; secondary metrics support that state; compact system-health pattern is acceptable. **Bright field per Part II §1** — the family used to allow dark, and Readiness + Founding GTM are still dark on legacy, but new-stack work (Quota Workback shipped 2026-04-27 is the canonical example) lives on a bright field. Synthesis weight comes from serif typography + accent rules, not luminosity.
- **Avoid:** BI-dashboard composition; scoring-widget field; decorative metrics with no consequence; reaching for a dark surface "to make it feel synthesizing" — bright with strong typography is the new bar.

### 4.7 Trust Annex (utility)
- **Rooms:** Settings, auth, legal/privacy, purchase
- **Feel:** calm, trustworthy, plainspoken
- **Laws:** no drama; no internal architecture language; clear recovery moves; clear trust signals
- **Avoid:** overdesigned utility chrome; fake product excitement

### 4.8 Hybrid families (retired 2026-04-27)

Originally this section sanctioned a Decision Bench variant with a **dark hero band above a bright work area** for ICP Studio + PoC Framework. The bright-only directive (Part II §1) retired the variant. Both rooms now ship pure-bright with an orange left-rule on the dominant panel, mirroring Sourcing Workbench's QueryStudio (orange-ruled) vs ProspectComposer (blue-ruled) Decision Bench convention.

If a future room needs a "headline above the work" feel, do it with composition (a wider serif hero, an orange-ruled callout, a cream-tinted band) rather than reaching for a dark surface. Don't invent new hybrid patterns without updating this doc.

---

## 5. Global face constraints

Across all families:

- **Max 3 dominant visual planes** in the first visible zone (hard reject above that)
- **One primary move per surface** (hard reject if two compete)
- **Chips must be semantic**, not decorative
- **Box count must stay low** — card accumulation as the main ordering system is a hard reject
- **Explanatory copy defers downward** whenever possible
- **The shell supports, does not dominate**
- **The mouse-first user must succeed** — command palette is a force multiplier, not a dependency

### Hard rejects

Any surface that does any of these fails:
- Revives flat hallway logic (rooms/menus compete with the work)
- Uses more than 3 dominant visual planes in the first fold
- Relies on card accumulation as the main ordering system
- Uses internal architecture language as visible product copy
- Uses green, blue, and orange as decorative candy rather than semantic roles
- Makes the product feel more like a generic dashboard than a tool the operator actually trusts
- Achieves calm by erasing pressure
- Achieves beauty by flattening module substance
- Rewrites the mind instead of the face

---

## 6. Motion and state

**Motion** is sparse, consequential, and state-based. It guides attention; it does not entertain. Use motion for first-load staging, focus shifts, state-change confirmation, ranked action emphasis, and important transition continuity. Never for hover theater, microinteraction excess, or friendliness.

**Every surface must treat** these states explicitly:

- `empty` — why the page matters + what unlocks it + one next action (sparse states should feel useful, directional, intelligent)
- `sparse` — most early use is sparse; sparse must feel real, not "missing"
- `active` / `strong` / `risky` — color and weight reserved for these
- `loading` / `error` — never blank; never swallowed; never cryptic
- `saved` / `unsaved` — never let the user wonder if it saved

---

# Part II.5 — Component + Data Architecture

**Authority:** This part is governed by `deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md` and, for Phase 2 specifically, by `deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md`. The ADRs are the deeper references; this section is the canonical summary for session-level operation.

## 1. The stack

Antaeus is being migrated from static HTML + localStorage + innerHTML string assembly to a proper component + reactive-data stack. Approved 2026-04-21.

| Layer | Tool |
|---|---|
| Component framework | Preact 10 + JSX |
| Language | TypeScript (strict mode) |
| Build tool | Vite 8 |
| Styling | Vanilla CSS + variables (unchanged from today) |
| Data persistence | Supabase Postgres (Phase 2) |
| Real-time | Supabase Realtime (Phase 2) |
| Auth | Supabase Auth (unchanged from today; extended) |
| Unit + component tests | Vitest 4 + @testing-library/preact |
| E2E tests | Playwright 1.59 |
| Error tracking | Sentry Browser SDK |
| Product analytics + feature flags | Posthog JS |
| CI/CD | GitHub Actions |
| Hosting | Cloudflare Pages (unchanged) |

## 2. Code conventions

- **New components** live under `src/` as `.tsx` files. Tests colocate as `<Name>.test.tsx`.
- **Canonical templates**: `src/_templates/Example.template.tsx` + `.test.tsx` show the expected shape. Copy these when adding a new component.
- **Strict TypeScript**: no `any`, no suppression comments, no implicit returns. Refactor until the compiler is satisfied.
- **Path alias**: `@/*` maps to `src/*`. Use it in imports.
- **Error reporting**: all caught errors that reach top-level state should go through `reportError(error, context)` from `src/lib/observability.ts`, not raw `console.error`.
- **Analytics events**: emit via `trackEvent(name, properties)`. Names use `snake_case`. Never trigger events in hot render paths; emit on user intent or material state transitions.
- **Feature flags**: during Phase 3+ rolling migration, every new-stack room lives behind a Posthog flag. Check via `isFeatureEnabled(flagKey)`.
- **Data access**: server data flows through `src/lib/data-client.ts` (Phase 2.2). Never call `@supabase/supabase-js` directly from a room — use `createDataClient()` and the per-noun accessors (`data.deals.list()`, `data.proofs.insert(…)`, etc.). RLS handles workspace scoping at the DB layer, so queries don't manually filter on `workspace_id`. Optimistic mutations use the `optimisticMutate()` helper. Realtime updates via `data.<noun>.subscribe(handler)`.
- **Schema types**: `src/lib/database.types.ts` is the canonical shape of the `public` schema. Regenerate after every migration via `supabase gen types typescript --linked > src/lib/database.types.ts` and commit alongside the migration. Hand-edits are a last resort (used once during Phase 2.2 bootstrap).

## 3. Commands

```bash
npm run dev           # Vite dev server with HMR, serves on 127.0.0.1:4173
npm run build         # Typecheck + Vite production build → dist/
npm run preview       # Serve built dist/
npm run typecheck     # Typecheck without emit (fast feedback)
npm run test          # Vitest run (single pass, CI-style)
npm run test:watch    # Vitest watch mode
npm run test:e2e      # Playwright E2E smoke tests
npm run test:e2e:headed  # Same, with visible browser
npm run build:cloudflare  # Legacy static-asset build; still used during migration
npm run deploy:cloudflare # Wrangler deploy (manual; CI handles main branch)
```

## 4. Migration state

The stack is live as foundation (Phase 1). No rooms have migrated yet. Existing static rooms under `app/<room>/index.html` continue to work unchanged during Phases 1–2. Room migration begins Phase 3 (Discovery Studio first), feature-flagged so rollback is instant.

**Never add a new room on the old stack.** If a new room is needed before its "turn" in the Phase 4 priority list, build it in Preact/TS on the new stack. The old stack is deprecated and in-place only because migration takes time.

## 5. CI gates

Every PR runs (via `.github/workflows/ci.yml`):
- `npm run typecheck`
- `npm test` (Vitest)
- `npm run test:e2e` (Playwright smoke)
- `npm run build` (Vite)

All four must pass to merge. Merges to `main` re-run the gate and deploy on success.

## 6. Commit-message convention

Any commit that touches `src/`, migrated rooms, workflow files, or architecture-level configuration should reference the ADR it serves in the commit body:

```
Ref: deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md §6 Phase 1.X
```

This gives a future session the trail from any commit back to its governing decision.

## 7. Orchestration layer (Phase A — ADR-004)

**Authority:** This section is governed by `deliverables/adr/adr-004-orchestration-layer-foundation-2026-05-19.md`. The ADR is the deeper reference; this section is the session-level summary.

The orchestration layer sits beneath the rooms. It is the layer that gives the system its own voice — that lets Antaeus accumulate observations across time, surface them to the operator, and feel like a workspace that has been thinking while the operator was away rather than a workspace that just stores what the operator typed in. The rooms remain the operator's authored surfaces. The orchestration layer is the system's read of what is happening across them.

Four components, landed in this order:

1. **Session model** (`src/lib/session/`) — workspace-scoped session object that carries the operator's current focused object across every room. Real-time synced via Supabase Realtime; cross-tab consistent. Replaces the URL-string limitations of continuity params with a structured shared context. Storage: `workspace_sessions` table (one row per workspace, UNIQUE constraint). Public API: `bootSession`, `setFocusedObject`, `clearFocus`, `pushRecentAction`. Signal layer: `session`, `isSessionLoaded`, `focusedObject` (computed).

2. **Observations ledger** (`src/lib/observations/` + `observations` table) — where the system writes its own observations of the workspace. Plain-English sentences a peer would say to a peer, NOT metrics, NOT charts. Append-with-dismissal model — observations are never hard-deleted. Workspace-scoped RLS for reads; service-role-only for writes (so the heartbeat is the sole author). Members can dismiss via the `dismiss_observation(obs_id, reason)` RPC.

3. **Heartbeat** (`supabase/functions/heartbeat/`) — Supabase Edge Function scheduled by pg_cron every 30 minutes. Wakes up, enumerates active workspaces (any session activity or observation in the last 7 days), runs the registered observation generators, writes candidates to the ledger via the dedupe-and-supersession writer. Phase A skeleton had an empty generator registry. Phase B (per ADR-009) populates the registry with four SQL-only generators: `deal_decay`, `signal_decay`, `proof_staleness`, `discovery_rhythm`. Every observation_text passes through `src/lib/voice/`'s `validateObservation()` before write — the structured-form Voice Document shared with Briefing synthesis.

4. **Skills layer** (Phase C, not Phase A) — deterministic markdown recipes that compose existing room engines. Operator-authored, no LLM at runtime, executed by a parser+dispatcher. See ADR-004 §Architecture.

### What this is NOT

A CRM. The system writes observations; it does not write metrics or reports. Five rules keep us out of CRM territory (ADR-004 §What the system writes is not what a CRM writes):

1. **Format is prose, not metric.** Sentences a peer would say.
2. **Sharp, not exhaustive.** One observation at a time, the one that's actually pulling.
3. **It feeds back into the system's behavior, not just into a report.** Observations change what the system recommends, not just what a dashboard shows.
4. **Names the why, not just the what.** Causal reads, not status counts.
5. **Has a destination — making the workspace inheritable.** What the first hire needs to know, not what an operator needs to feel informed.

### Phasing

- **Phase A (foundation, invisible to operator)** — session model, heartbeat skeleton, observations ledger, ADR-004, this canon update. Status as of 2026-05-19: shipped.
- **Phase B (workspace-scope observations + first observable surface)** — per ADR-009 (2026-05-31), Phase B un-retires from ADR-006's absorption clause and ships as a distinct stream from Briefing Patterns. Four heartbeat-driven SQL generators (`deal_decay`, `signal_decay`, `proof_staleness`, `discovery_rhythm`) write workspace-scope reads into the existing `observations` ledger. Dashboard gets a "this week's reads" card with a 14d/7d display-filter toggle. The Briefing's Voice Document is extracted into `src/lib/voice/` as a shared structured form that both generators and Briefing synthesis consume. Cross-deduping hook against active Briefing Patterns is wired but no-op until Patterns ship.
- **Phase C (skills layer)** — per ADR-010 (2026-05-31): bundled markdown recipes with YAML frontmatter at `src/skills/recipes/`, a three-action union (`route` / `compose-context-and-route` / `filter-and-route`), parser + dispatcher in `src/skills/`, Cmd+K palette extension that filters skills alongside rooms. Five starter skills cover the cross-room flows Phase 4 + Phase B enabled (`triage-week-reads`, `prep-next-call`, `whats-at-risk`, `cast-proof-for-hottest-deal`, `compose-this-weeks-outbound`). Skills are deterministic — no LLM at runtime per ADR-008's rejected list. Skills are pure navigation — the result IS the room the operator lands in, no skill-specific UI surface.
- **Phase D (birdseye float)** — per ADR-011 (2026-05-31): floating collapsible icon on every room (mounted via RoomChrome). Collapsed by default (icon with count badge when there's a more-urgent NextMove than the current room); expands to a ~280px floating drawer with ONE ranked "what to look at next" line. Reads observations ledger + Deal Workspace recovery_rank + Signal Console hottest account heat; routes via continuity params. NextMove labels + reasons pass `validateObservation()` from `src/lib/voice/voice-document.ts`. Briefing Patterns slot in as a fourth ranker source when B.X+ ships.
- **Phase E (skill scheduling)** — per ADR-012 (2026-05-31): server-side scheduling for Phase C skills. New `scheduled_skills` + `scheduled_skill_fires` Supabase tables (workspace-scoped RLS). Heartbeat reads due rows, fires the skill (writes a pending-fire ledger row), updates `next_fire_at`. On next app load, client reads the most-recent unviewed pending fire, dispatches the skill, marks viewed, shows a toast. **Auto-navigate on arrival** (founder pick E1-A). Three cadences in v1: daily / weekly / monthly. Per-workspace (not per-operator); single-operator multi-tenancy is deferred.
- **Phase F (bounded self-modification)** — system refines skill defaults and proposes observations from usage patterns.

### Voice rule applies to observations

Every `observation_text` a generator writes MUST pass canon Part III §11. No startup-jargon, no sales-shorthand, no us-vs-them framing, no single-noun abstractions. Generators that produce gummy copy will be retired by ID via the `source_generator` column without changing the ledger schema.

---

# Part III — The Behavior

The product is engineered around behavior. Every rule here exists because there is evidence — usually a replicated effect at d ≥ 0.5 — that says it works on real users. Behavioral doctrine is the spine connecting mind and face; this part is how we defend the user's attention, confidence, and follow-through.

The canonical source for this part is `03-research-backbone/antaeus-architecture-restructure-research-brief-source-2026-03-31.md` (the 40-source research synthesis) and `01-charter-and-laws/antaeus-ui-ux-design-and-system-rules-2026-03-31.md` (the seven behavioral rules).

## 1. The three resistances

Every design decision reduces one of three resistances. If a decision reduces none of them, it is probably decoration.

- **Cognitive resistance** — "what is this for / what do I do next / what object am I on / what changed because of what I just did"
- **Emotional resistance** — "judged by complexity / punished by blank states / lost in a dead end / unsure if the app is trustworthy"
- **Operational resistance** — "re-enter known context / carry context between modules manually / guess whether it saved / guess whether the output matters downstream"

A room that *looks* better but increases any resistance is worse than the version before.

## 2. Least-resistance doctrine

Antaeus is designed around the least path of resistance toward real work.

That means:
- the app always ranks the next move
- context carries automatically (see `focusObject`, `returnTo`, etc.)
- the user sees one dominant action at a time
- the app reduces branch decisions wherever possible
- every page either produces something or routes the user to the thing that will

Least resistance does NOT mean: fewer controls at all costs, oversimplifying serious work, or hiding what's actually happening in the motion. It means: less friction to *meaningful* action, less drift into low-value behavior, less room for ambiguous wandering.

## 3. The seven behavioral design rules

These are binding. Every room should pass all seven. Most room liabilities I find are failures of these, not of visual rules.

1. **One dominant move per screen** — one primary move, one secondary, everything else visually quieter. If everything looks clickable, nothing is ranked.
2. **Object before controls** — the user first sees what object is in focus, what condition it's in, what pressure exists. Only then should they see the control set.
3. **State before explanation** — show current state, confidence, pressure, next move before long copy. Good users scan before they read.
4. **Reward truth, not activity** — visual reward comes from sharper targeting / stronger signal / stronger qualification / better proof / real handoff readiness. Never from clicks, fields, or content volume.
5. **Every save must visibly matter** — after a save, the user should see at least one of: a score changed, a suggestion improved, a dashboard changed, a milestone moved, the handoff got stronger. If nothing visibly changes, the app feels fake.
6. **No module feels isolated** — every major screen shows where its input came from and what it affects next. Subtle is fine. Absent is not.
7. **Escalation beats clutter** — do not present all seriousness at once. Escalate visual intensity only when risk increases, the user is about to do something destructive, a deal is decaying, a handoff is dangerously thin, or a workflow is about to break trust.

## 4. The strongest behavioral levers (ranked)

From research, in order of effect size:

1. **Prefilled context** — the app already knows who the user is and what they were working on. No restate.
2. **Ranked next move** — the app tells the user what to do next, with a reason.
3. **Visible consequence** — what changes downstream if the user acts is visible before the action.
4. **Explicit progress** — compounding is shown (score deltas, ledgers updating, workspace health shifting).
5. **Save-state trust** — never any ambiguity about whether something saved.
6. **Contextual handoff** — when the user moves rooms, context moves with them.
7. **Restrained motion** — motion only where it clarifies state change.

Any feature you design should leverage as high on this list as possible.

## 5. Fourteen behavioral principles (ranked by evidence + applicability)

### Tier 1 — high confidence, high applicability

**Implementation Intentions** (Gollwitzer 1999; meta-analysis 94 studies, 8,000+ participants, d = 0.65)
→ *Every object surface presents a specific, contextual next action in if-then form.* Never "follow up on this deal" — always "Send the pricing proposal to Sarah Chen by Tuesday because her budget review is Wednesday." The specificity is what drives the effect.

**Goal Gradient Effect** (Hull 1932; Kivetz 2006)
→ *The Readiness Score is a goal gradient accelerator.* Milestones at 25%, 50%, 75%, 100% each unlock a micro-moment and reveal the next milestone. U-shaped motivation curve means don't let the user plateau in the middle — surface "what moves it" language.

**Commitment and Consistency** (Freedman & Fraser 1966; 4.5× compliance increase)
→ *Onboarding uses escalating micro-commitments.* Each step creates psychological investment. The first ask must be genuinely low-friction; asking for company name as the first field cuts conversion 50%.

**Cognitive Load Theory** (Sweller 1988)
→ *Reduce extraneous load at every decision.* Hick's Law quantifies this: ≤5 primary navigation items, ≤5 items in the first visible Dashboard zone. The Paradox of Choice effect is real when the domain is unfamiliar — that's our founder.

### Tier 2 — strong evidence, requires careful application

**Endowed Progress Effect** (Nunes & Dreze 2006; 82% higher completion, 34% vs 19%)
→ *Onboarding converts "not started" into "underway" immediately.* Importing contacts, connecting email, completing ICP each register as "3 of 8 steps complete." The 10–25% initial endowment is the research sweet spot.

**Loss Aversion + IKEA Effect** (Kahneman & Tversky 1979; 90% replication across 19 countries; Norton 2012, 63% premium on assembled items)
→ *Make cross-object data flow visible.* When a user logs a call, show it flows to the contact timeline, the deal activity log, the account summary, tomorrow's Brief. The user must see their work has tentacles across the system.

**Zeigarnik / Ovsiankina** — *critical nuance:* the 2025 meta-analysis (Ghibellini & Meier) **debunked the memory component of the Zeigarnik Effect**. What remains is the **Ovsiankina Effect — the motivational drive to resume interrupted tasks.**
→ *Don't rely on users remembering incomplete tasks. Surface incomplete states visibly and make resumption the path of least resistance.* "Celebrate briefly → reveal next opportunity immediately" is the post-win rule. Never "all done." Post-reward motivation drops sharply to baseline — the moment after completion is the highest churn risk.

### Tier 3 — powerful, ethical guardrails required

**Variable Ratio Reinforcement** (Skinner)
→ *We use variable **insights**, not variable **rewards**.* The ethical line: rewards that create addiction exploit users (infinite scroll, loot boxes); insights that surface genuine patterns serve users ("Your Tuesday emails get 3× higher open rates"). Antaeus uses pattern detection, cross-object correlations, anomaly alerts. Never intermittent notifications designed to maximize session time.

**Self-Determination Theory** (Deci & Ryan 2000 — autonomy/competence/relatedness)
→ *Avoid points, badges, leaderboards for core sales activities* (the overjustification effect undermines intrinsic motivation). Provide competence-affirming feedback: "Your outreach response rate improved from 8% to 12% this week." Relatedness via anonymous stage-based benchmarking ("Founders at your ARR typically have 23 active accounts") — with injunctive norms for outperformers ("You're ahead of most founders at your stage ✓") to prevent the Opower boomerang.

**Peak-End Rule** (Kahneman 1993; 2022 meta-analysis 174 samples)
→ *Every session has a designed peak and a designed end.* The peak is an insight delivery or achievement moment; the end is a progress summary + next-session trigger. Never end on error, timeout, or "nothing to show."

**Temporal Discounting**
→ *Visual aging on stale objects* (green → yellow → orange → red). Explicit temporal framing ("Win rate drops 40% after 30 days of inactivity") makes future cost present. But alarm fatigue is real — signal decay applies selectively to the 3–5 highest-impact items in the Brief.

## 6. The hallway problem

The core architectural problem the app is solving is **the hallway** — too many equal-weight doors, the user repeatedly deciding "where do I go now." Architecture work has been replacing the hallway with a **smarter front door**.

The sequence the product is trying to produce:

- old sequence: `module → page → local controls`
- new sequence: `command → object → lens → downstream loop`

Every room and every face pass must strengthen the new sequence. Anything that revives equal-weight destinations is hallway behavior and fails.

**What hallway behavior looks like in a refaced room:**
- multiple navigation strips before content (discovered during Discovery Studio audit: 4 strips = hallway)
- tabs at the top of a room as the primary organizing logic
- a sidebar rail that competes with the main work
- room browsing at the center of the command chamber

**What the front door looks like:**
- one ranked object with one dominant move
- room access as a secondary, summoned action
- the current object carries forward with continuity params
- the shell is stable background, not a decision layer

## 7. Loop transformation (never closure)

**Tension migrates forward through object state; it does not resolve at completion.** This is the Ovsiankina-based design principle, not the debunked Zeigarnik memory claim.

The chain every object follows:

- **Signal → Motion** — triaging doesn't close the loop, it transforms into "Motion created — first touchpoint draft ready for review"
- **Motion → Contact response** — sending doesn't close; transforms into "Sequence active — monitoring for engagement signals"
- **Response → Deal** — a positive response transforms into "Deal created — 2 of 8 deal qualification steps already complete"
- **Deal advancement** — moving stages transforms into the next stage's gap: "Proposal stage — 0 of 4 proof points documented"
- **Deal won → Handoff** — the highest-risk post-reward reset. Never "Congratulations, deal closed." Always "Deal won — Handoff package 0% complete. Your first hire will need: account context, contact relationships, discovery notes, competitive intelligence."

The ethical constraint: every downstream loop must represent **genuine value** the user would want to do anyway. Not artificial anxiety. The Readiness Score dropping because the user hasn't logged enough calls this week is punitive gamification — banned. "Document your discovery for the handoff" is genuinely useful — surfaced at the moment when motivation and context are highest.

## 8. Session design arc

The session is engineered end-to-end.

- **First 30 seconds (new user):** minimal steps, belief-system-first. Show the argument briefly ("This is your strategic operating room"), drop into guided ICP definition with one field to complete first. The peak of the first session is when the user's first data appears in the Brief — the IKEA "I built this" moment.
- **First 5 minutes (any session):** narrative Brief in 3–5 sentences + one variable-insight line ("Deals where you scheduled demos within 48 hours close 2.7× faster — you have 2 opportunities to test this today"). Within 30 seconds the user can switch to Grid or Queue. Every item uses implementation-intention if-then specificity.
- **Returning user (daily):** Brief opens as "what changed since last session" — new signals / state-changed deals / scheduled items now due. Variable insight every visit.
- **Session end:** designed closing card. "Today: 3 calls logged, 2 deals advanced, pipeline +$28K. Tomorrow: Acme demo prep, follow up with 2 stale accounts." This loads the next session's internal trigger. Peak-End Rule: never end on error, timeout, or "nothing to show."

## 9. Copy burden discipline

Copy is one of the highest-leverage places the face can fail. The rule from the Phase-7 Preflight (binding):

**Remove visibility burden before removing meaning. Do not delete substance; redistribute it to the correct layer.**

### Layer budget

- **Command layer:** one headline, one rationale sentence per zone, 0–3 reasons per selected object, no paragraph longer than 2 sentences in the core command area
- **Sheet layer:** one why-now, one continuity statement, 3–5 evidence/gap rows, one room-entry reason, one dominant CTA
- **Room first fold:** title + compact subtitle + bridge + pinned context + one composed setup zone. No more than one deeper explanatory cluster visible before the user starts working.
- **Methodology layer:** unconstrained, but disclosed progressively and intentionally

### What to remove vs. move

- **Remove** only if purely repetitive, decorative reassurance without operational value, or hallway-era onboarding remnants
- **Compress** if strategically right but too long, or redundant to what the UI already shows
- **Move to sheet** if explains why a selected object matters now, or justifies room entry
- **Move deeper into room** if it's methodology, process, framework nuance
- **Gate / progressively disclose** if it teaches rather than directs

**Never valid reasons to remove text:** "the screen feels busy," "modern apps are minimal," "we need fewer words." Text must earn removal by redundancy, not by volume alone.

## 10. State language lock

The product's state vocabulary is specific. Use these, not their softer cousins.

**Good states:** `Ready now`, `Workable`, `Thin`, `Operating`, `Needs intervention`, `At risk`, `Handoff-ready`, `Partial`, `Compounding`, `Still weak`.

**Bad states:** vague positivity, gamification pops, decorative achievement language, "Great work!" / "You're doing amazing" copy.

**Error language:** honest, calm, specific, recoverable when possible. Not dramatic, robotic, vague, or technical-by-default.

**Workspace health taxonomy (frozen by the 2026-04-03 closeout memo):**
- 12 rooms use **Workspace health** pattern (Signal Console, Deal Workspace, PoC, Discovery Studio, Advisor Deploy, Discovery Agenda / Call Planner, Future Autopsy, Outbound, Cold Call, Sourcing, ICP, Territory). Shared vocabulary: `Compounding` / `Still weak`.
- 2 rooms use **System health** variant (Readiness, Quota Workback). Room-native vocabulary, score/coverage/fragility framing.
- 6 rooms intentionally get **neither** (Dashboard, Welcome, Onboarding, Settings, Founding GTM, LinkedIn Playbook). Reasons are in the closeout memo.

Future rooms must justify their health treatment through product leverage, not coverage vanity.

---

## 11. Voice — write what you mean, not a word that points at it

This rule governs every sentence in the product, in canon, in audit docs, in PR descriptions, in wireframes, and in conversations with Claude sessions. It works alongside §10 (State language lock) — §10 gives you the verbs and state vocabulary; this gives you the sentence shape that carries them.

**The rule:** stop reaching for a single noun to do the work of a sentence. When the urge to write "the wedge" or "the verdict" or "the move" hits, write the sentence out instead.

- Bad: "That's the wedge."
- Better: "That's where Antaeus does something Apollo can't."
- Bad: "Cast a decision-grade proof."
- Better: "Make the pilot evidence clear enough that the buyer's boss can act on it without you in the room."

**Manifesto fragments are out.** Sentences in series with no subject continuity ("Signals are time-limited. Heat ranks them. Motion comes from the account ledger.") read like a copywriter trying too hard. Write normal sentences with subjects.

**Plainness target.** Write like you would say it out loud to the operator sitting next to you. If a sentence wouldn't sound natural spoken, it's not plain enough yet.

Worked example for an operator-facing summary panel:

- Before:
  > FIELD READ — Runnable · 71
  > MAIN RISK: Watch-ring accounts still look too comfortable.
  > REPLACEMENT PRESSURE: Three cleaner replacements should land this week.
  > OPERATOR MOVE: Promote only one account from watch ring.

- After:
  > You're at 71 out of 100.
  > Two of the accounts you're working are sitting idle — they should probably come off the list.
  > Three new ones need to land this week to replace them.
  > Today, promote one of the accounts on your watchlist.

No kickers, no labels, just sentences someone could say out loud.

**What stays.**

- Domain words the product genuinely operates on: account, deal, signal, contact, proof, advisor, call, focus, plus the room names themselves. These aren't invented startup-language; they're what the product is about. They stay — but in prose they need context. "Proof" bare doesn't anchor to anything; "the pilot results" or "what the pilot measured" does.
- Code identifiers for leaf concepts and styling hooks (helper function names, internal helper types, CSS class names): `computeHeat`, `topHeat`, `verdictLevel`, `computeFieldRead`, `.lp-read__rule--recovery`. These are programmatic, not user-facing. Renaming them is a giant refactor with no user payoff. New code follows the new voice in UI strings and comments, but existing identifiers stay.

**Central product objects are the exception.** When a code identifier IS the central object the operator works on — like the original `Thesis` interface, which was the same shape of thing as `Account`, `Deal`, `Signal`, `Proof` — keeping the code/UI vocabulary split creates ongoing translation tax for every future session and developer. In that case the rename DOES happen end-to-end: the interface, the state field, the storage key, the field name on every dependent object, and the tests, with a backward-compat shim on the persistence layer so existing user data still loads. That happened on 2026-05-19 for `Thesis` → `Focus`; the doctrine that drove it is: low-meaning identifiers stay (CSS classes, helper functions, leaf types), but central domain types follow the user-facing vocabulary.

**What needs to go.**

- Single-word abstractions the product invented to feel important: "wedge", "verdict", "pressure score", "decision-grade", "operating truth", "command intelligence", "field read", "loom read", "ingot read", "recovery cue", "output ingot", "required correction", "operator move", "do not use", "main risk", "replacement pressure".
- Every aphoristic three-sentence-fragment paragraph written in that style.
- Decorative compound nouns of the form `<adjective>-<noun>` when they're trying to feel like Special Industry Terms™ — "decision-grade proof", "execution-context temperature", "intervention board".

**The test for any sentence.** Read it out loud. If you can't imagine yourself saying it to the operator across the table, it isn't plain enough yet. Rewrite until it sounds like normal speech.

This rule was canonized on 2026-05-19 and applies retroactively across all canon prose, audit docs, UI copy, wireframes, and conversational responses. See the deep-clean sweep landing in branch `claude/voice-deep-clean` for the retroactive application.

---

# Part IV — Mind ↔ Face ↔ Behavior Integration

The three layers are not independent. Mind defines what a room knows; behavior defines how the user should feel using it; face defines how it looks. A room is only right when all three agree. This part is the working glue.

## 1. The design-a-room order (when building new)

Use this order, not a different one:

1. **Family first** — which composition family? If unclear, don't build yet; update Part II §4 first.
2. **Mind second** — what sacred nouns does the room operate on? What does it know? What flows in / out? What must never be flattened? Write it in Part I §4 format *before* designing.
3. **Behavior third** — which behavioral rules (Part III §3) does this room lean on? Which of the seven levers (Part III §4) are we pulling? What's the room's specific loop-transformation?
4. **Face last** — triptych exploration, taste-test against rubric, apply winner.

Doing these out of order produces rooms that look good and operate badly.

## 2. How to judge a room (the pass)

Run the room against these, in this order. Any failure anywhere is a failure of the whole.

### Mind pass
- Does the room still operate on its sacred noun(s)?
- Is the strategic substance intact against what Part I §4 locks?
- Are the handoff obligations preserved?
- Are `returnTo`, `focusObject`, etc. continuity params still working?

### Behavior pass
- Is there one dominant move? (Rule 1)
- Is the object shown before the controls? (Rule 2)
- Does the room show state before explanation? (Rule 3)
- Does reward come from truth, not activity? (Rule 4)
- Does every save visibly matter? (Rule 5)
- Is "flows in from / flows out to" visible on the surface somewhere? (Rule 6)
- Is escalation reserved for real risk? (Rule 7)
- Is the loop transformation visible (never "all done")?
- Are copy budgets honored per layer?

### Face pass
- Map to exactly one composition family?
- ≤ 3 dominant planes in the first zone?
- Colors carrying semantic roles only?
- Type hierarchy authored, not accidental?
- The first-fold headline legible before reading?
- Dark only if this is a System Ledger (or approved hybrid)?

### Rubric pass (from `05-facial-architecture-and-composition/antaeus-facial-architecture-rubric-2026-04-03.md`)
- Distinctiveness (A1), emotional territory (A2), beauty (A3)
- Dominant-move clarity (B1), object clarity (B2), copy burden (B3), plane count (B4), box count (B5)
- Hallway suppression (C1), continuity (C2), pressure legibility (C3), progressive disclosure (C4)
- Color / typography / container / surface discipline (D1–D4)
- Module-brain preservation (E1), strategic seriousness (E2), methodology placement (E3)

## 3. Drift modes to catch

These are the failure patterns that keep recurring. Scan for them first.

- **Hallway revival** — multiple nav strips, tab-as-primary-organizing-logic, menu competing with the work
- **Card soup** — structure carried by bordered containers instead of composition
- **Plane overrun** — more than 3 dominant planes in the first visible zone
- **Rainbow accent** — green/blue/orange/red used decoratively, not semantically (most often in gradient meters or legend bars)
- **Worksheet energy** — input grids dominating where the shaped object should be central (ICP / Territory / Sourcing risks)
- **Metaphor ornament** — distinctive metaphor (desk, loom, booth, foundry) becoming decorative instead of operational (rotations, stamps, staples, spotlights)
- **Designer-voice copy leak** — wireframe-comment text showing up in the UI ("Feels closest to a forensic worksheet…")
- **Doctrine in the first fold** — law cards, room laws, methodology sprayed where the work should live
- **Two primary moves competing** — doubled CTA rows, co-equal big actions, equal-weight destinations
- **Hardcoded state** — "6 live cases" hardcoded when the data might be 5 or 7
- **"All done" stopping point** — loop closure without loop transformation

## 4. The mind-correction protocol

Face work will sometimes surface a mind error. The old rule was "rewrite the face, not the mind." The amended rule is:

**Face work may surface mind errors. When it does, fix the mind too. But run every mind change by the founder before committing.**

How to do this cleanly:

1. Name the mind issue explicitly — "the room's mind says X but the face pass shows X breaks behavioral rule Y"
2. Propose the mind correction in writing (one paragraph)
3. Get founder confirmation (not implied — direct)
4. Update the relevant Part I §4 entry (and any downstream docs it invalidates)
5. Only then apply the face change

Do not "fix the mind" silently while claiming to be doing a face pass. Substance changes are founder-approved.

## 5. The "does this earn its place" test

Borrowed from the Discovery Studio runtime primitives sheet, generalized:

**If a visible UI object cannot map to a primitive (a sacred noun, a behavioral lever, or a compounding flow), it should not exist in the room.**

Apply this when auditing:
- A decorative meter → what primitive does it represent? If none, kill it.
- A colored chip → what semantic role? If none, kill it.
- An extra CTA → which move is it? If the same move is already primary, kill it.
- A section of explanatory copy → what layer does it belong in per the copy-burden discipline? If too early, move it or gate it.

This one test catches the majority of face liabilities.

---

# Part V — Current state and working canon

This part is time-sensitive. When reality diverges from what's written here, update this part — not the other parts.

## 1. Where the refacing pass stands (2026-04-28)

The refacing pass (arc: Apr 1 → ongoing) is partially complete. Screenshot-based re-audit — not DOM-based — produced the following status. DOM-based audits from earlier in this session were consistently too harsh; rendered output is stronger than CSS reading suggested.

### Substantially refaced (current visual language)

Phase 4 closed 2026-04-28: every room migrated to the new stack ships bright. Below is the live state, organized by composition family.

**Threshold (entry)**:
- **Welcome** — bright field, hero + 4-anchor milestone ladder + ranked next-action stack (PR #33)
- **Onboarding** — bright field, 7-step greenfield flow with progress rail; seeds real Brief items into the workspace on completion (PR #34)

**Command Chamber (ranking)**:
- **Dashboard** — bright field, command-intelligence rail + Spotlight + 3-mode signal (PR #11)

**Live Instruments (live execution)**:
- **Signal Console** — bright account grid, heat engine + execution-context temperature ladder (PR #13)
- **Outbound Studio** — bright switchboard, 5-input rack → send-line generator + touch log (PR #19)
- **Cold Call Studio** — bright live console, 6-thread spine + branch picker (PR #21)
- **LinkedIn Playbook** — bright cue rail with dark stage (a localized exception within an otherwise-bright room — the cinematic stage panel is allowed dark per Part II §4.6 of the prior canon revision; will be flipped if/when founder directs) + 5-cue ladder (PR #23)
- **Call Planner** — bright witness form + 4-strip agenda (PR #25)
- **Advisor Deploy** — bright desk-board, rolodex metaphor preserved (PR #26)

**Decision Benches (strategic shaping)**:
- **ICP Studio** — bright hero + work-area + analytics panel (PR #28; flipped from dark hero pre-merge)
- **Territory Architect** — bright Decision Bench, tier-tinted focus cards + 300-cap account grid (PR #29)
- **Sourcing Workbench** — bright query studio + 5-stage prospect kanban (PR #30)
- **PoC Framework** — bright forge with orange left-rule + cream cast (PR #17 shipped dark; flipped to bright in PR #35 / 2026-04-28)

**Diagnosis Tables (intervention)**:
- **Deal Workspace** — bright recovery board + filter chips + 9-field health modal (PR #8)
- **Future Autopsy** — bright forensic light-table, **positive example the others should borrow from** (PR #15)

**System Ledger (synthesis)**:
- **Quota Workback** — bright planning board, hero touches/day + coverage panel + system-health split (PR #31; built bright, no dark stage)
- **Readiness Score** — Phase 5.A shipped 2026-05-01 (PR #47). Verdict-as-gates engine + Anchor + Drawer overlay anchored on Dashboard topbar (no separate route — drawer overlays Dashboard). Cloud-synced verdict-history persistence to `readiness_snapshots`. Legacy `/app/readiness/` retired with redirect stub + `?readiness=1` auto-open hint.
- **Founding GTM / Handoff Kit** — Phase 5.B shipped 2026-05-01 (PR #49 — recovery PR after stacked-squash orphaned the original PR #48). Greenfield rebuild at `/founding-gtm/`. Seven authored sections with cross-room SURPRISE callouts; section-readiness publisher (`gtmos_founding_gtm_health`) feeds Readiness's `proof` dimension; ceremony moment subscriber fires the §4.19 set-piece on first upward transition into Inheritable-with-guardrails. Legacy `/app/founding-gtm/` retired with redirect stub.

**Trust Annex (utility)**:
- **Settings** — bright trust-annex, 4-card layout (export / category / demo / role) (PR #32)

**Discovery Studio** (Live Instrument / Diagnosis Table hybrid) — bright shell, 10-segment spine + 7 contract rails (PR #3, #4, #5, #6, #7).

### Recently closed (2026-04-21)

These items were in the priority list earlier in the session and are now complete. They remain visible here until the next session confirms nothing regressed.

- **Cross-room drift-mode sweep.** All four flagged drift-mode liabilities fixed, each verified before/after render, each committed separately:
  - `bb4a280` Future Autopsy — deleted `"Feels closest to a forensic worksheet..."` designer-voice leak; made `Pinned-case ledger · N live cases` count dynamic (was hardcoded "6"); updated the urgent-button tooltip to drop the "six-case autopsy universe" phrasing.
  - `999be95` Signal Console — removed the `Score = signal count × type weight × source credibility × recency decay` internal-language caption; collapsed numeric thresholds ("91-99 Hot") to color + state mapping; renamed "Score Legend" → "Heat"; incidentally cleaned up mojibake on the `×` signs.
  - `7f03723` LinkedIn Playbook — replaced the rainbow cue-meter gradient (red→orange→blue→green) with a semantic progress track (neutral base + green fill to score position); deleted the 12-dot decorative marquee strip at the top of the stage panel.
  - `75c2c21` Cold Call Studio — replaced the rainbow loom-needle (orange→blue→green→red vertical bar) with a 2px neutral hairline; per-thread color dots are now the unambiguous semantic carriers.

- **Discovery Studio — all 7 contract rails implemented.** The rails design plan lives at `deliverables/plans/antaeus-discovery-studio-missing-rails-plan-2026-04-21.md`. Four waves shipped in order:
  - `e9636c2` Wave 1 — extended `frameworkState` with `learnedFacts[]` and `nextStep{date,owner,attendees,purpose,reason}`; `toggleBranch` now records the branch's `clear` text into `learnedFacts` on open, with dedupe by `nodeId:branchIndex`. No UI change yet; verified via Playwright probe (3 clicks → 2 distinct facts + 1 dedupe skip on re-click).
  - `c7f9ed7` Wave 2 — next-step docket: sticky card under the segment stack, 5-field responsive grid (date / owner / attendees / purpose wide / reason wide), three state modes (`is-empty` orange border + "No lock yet", `is-partial` amber + "Missing: <fields>", `is-locked` green + "Locked"). Required subset for locked: date + owner + purpose. Updates status on blur via the `change` event (preserves focus mid-typing).
  - `463d209` Wave 3 — learned + worked ledger strip: two-column grid between segment stack and docket, reads `learnedFacts` (left) and `checkedNodes` resolved to node-text via `findNodeInFramework` (right), click any row to jump and open the source node. Ratio "N / essential total" on the worked column.
  - `c278590` Wave 4 — support dossier drawer: 520px right-side slide-in summoned via a topbar "Dossier" button that only renders when `hasDossierData(framework)` is true. Sections: proof & decision anchors (nested topic lists), objection library (trigger → reply), inbound question handlers (question → bridge). Close paths: dedicated button, Escape, backdrop click. Currently lights up only for `customer-support`; the other 8 frameworks need their runtime files populated.
  - Side effect: caught + fixed a load-order bug — `js/discovery-segment-runtime-customer-support.js` existed with rich pre-authored support data but was never included by `app/discovery-studio/index.html`. Added the script tag.

- **Support-dossier content authoring complete for all 9 frameworks.** Follow-on to Wave 4. Each framework runtime now exports `supportDossier` (3 topics × 3 items), `objectionLibrary` (4 trigger→reply pairs), `inboundQuestionHandlers` (3 question→bridge pairs), and `skipAheadHandlers` (3 trigger→reply pairs). Commits: `9a32eb5` sales-revenue, `58169e5` manufacturing + data-intelligence, `8e54682` legal + recruiting + product-ux + govtech + ai-native. Each framework's topic titles verified distinct via Playwright probe. Content follows the category-native vocabulary in the guardian build spec (e.g., legal anchors on Harvey/Clearbrief + partner/in-house dynamic + billable-hour politics; ai-native anchors on pilot purgatory + evaluation methodology + human-in-the-loop architecture). The drawer now lights up on every framework.

- **Future Autopsy brittleness: inline-handler cleanup** (`59aef90`). Removed all 8 inline `onclick`/`onkeydown` attributes in Future Autopsy, including one that effectively eval'd an arbitrary string from `docket.exitActionHref` into an onclick attribute. Replaced with `data-fa-action` / `data-fa-arg` pattern + delegated document-level listeners. Window-attached functions (runSelected, selectPinnedCase, setForensicSheet, setFutureAutopsyVerdict, copyAutopsy, autopsyOfDay, copyKill) are now called by name lookup instead of string interpolation into attributes. Verified interactions via Playwright: pinned-case select, Run selected, setForensicSheet('symptom'), setFutureAutopsyVerdict('corrected') all dispatch correctly. Addresses the **inline-handler** dimension of the 2026-04-16 brittleness audit P1 for Future Autopsy. The **string-assembly innerHTML** dimension (still present in Discovery Studio and Deal Workspace) remains — that's the bigger refactor and was explicitly deferred.

- **Unsaved-changes guard activated for ICP Studio + PoC Framework** (`2e18122`). `js/unsaved-guard.js` existed already but both rooms loaded it without calling `.watch()`, so the guard was inert. Added `unsavedGuard.watch('.builder-content')` at the tail of `bootIcpStudio()` and `unsavedGuard.watch('.fc')` at the tail of `bootPocFramework()`. Added missing `markClean()` call at end of `savePoC()`. Verified via Playwright: guard loaded, isDirty=false on load, isDirty=true after a simulated input event. Remaining rooms needing the same wiring: Founding GTM, Outbound Studio, Deal Workspace, CFO Negotiation, Discovery Agenda, Content Builder.

- **Label renames (Phase 5) verified already done.** During audit, grepped for "Command Center", "Live Discovery", "Content Builder", "Agent Lab" across HTML/JS/CSS. Zero matches. The architecture-reset / nav re-architecture work already renamed them. Phase 5 can be marked done.

### Orchestration layer (ADR-004) — Phase A shipped 2026-05-19

The system gets its own voice. Beneath the existing rooms, a new orchestration layer (session model + observations ledger + heartbeat Edge Function + skills layer in Phase C) lets Antaeus accumulate observations across time, surface them to the operator, and feel like a workspace that has been thinking while the operator was away. Canon Part II.5 §7 covers the doctrine; ADR-004 covers the full architecture + phasing.

Phase A landed 2026-05-19 — invisible to operators, all infrastructure in place:

- **Schema** — `workspace_sessions` + `observations` Supabase tables with RLS, indexes, Realtime publication, and a `dismiss_observation` RPC. Migrations `20260519180000` + `20260519180001`.
- **Session model** — `src/lib/session/` with types + signal layer + helpers. 39 unit tests. Real-time synced cross-tab via Supabase Realtime.
- **Observations infrastructure** — `src/lib/observations/` with types + reader (client-side, used by Dashboard/Founding GTM/birdseye strip) + writer (dedupe + supersession, called from the Edge Function). 19 unit tests.
- **Heartbeat skeleton** — `supabase/functions/heartbeat/` Deno Edge Function with empty generator registry. Active-workspace filter (7-day session-or-observation activity). Per-workspace + per-generator error isolation. Returns a structured HeartbeatReport.
- **pg_cron schedule** — `20260519180002_heartbeat_schedule.sql` enables `pg_cron` + `pg_net` extensions and includes the `cron.schedule('antaeus-heartbeat', '*/30 * * * *', ...)` call COMMENTED OUT. Founder uncomments + runs it in the Supabase SQL Editor after (a) deploying the function and (b) storing the service-role key in Supabase Vault via `vault.create_secret('<key>', 'antaeus_service_role_key', '...')`. The cron call hardcodes the function URL (not a secret) and reads the bearer token from `vault.decrypted_secrets`. (The original draft of this migration used `alter database postgres set app.*` + `current_setting('app.*')` — that pattern was retired on 2026-05-20 because Supabase's SQL-Editor `postgres` role lacks the superuser privilege required, error SQLSTATE 42501. See the 2026-05-20 session-log entry.)
- **Canon update** — Part II.5 §7 (this document) + ADR-004 (the deeper authority).
- **Test count delta** — 1763 → 1821 (+58 new tests across session + observations + types parsing).

**Phase A close:**
- Branch: `claude/orchestration-phase-a`
- typecheck clean, vitest 1821/1821, Playwright still 260/260 (no UI changes in Phase A).
- Next: Phase B was originally going to be "register the first generator (signal-decay detection) + ship the visible Dashboard 'this week's reads' card." Then Phase B kickoff surfaced that the generator has nothing to read — Phase 4 rooms still write to localStorage, not Supabase. Phase 4.5 (ADR-005) intercedes; Phase B unblocks when the Tier 1 retrofit trio (Signal Console + Deal Workspace + Outbound Studio) hits Step 5. See the Phase 4.5 callout below.

### Phase 4.5 — Data Layer Parity (ADR-005) — in progress

The orchestration layer (ADR-004) is live in production but the data the heartbeat needs to think about still lives in operators' browsers. Phase 4 (closed 2026-04-28) migrated 17 rooms onto Preact+TS but kept persistence in localStorage; the data-client + per-noun Supabase tables exist but rooms don't actually write through them. Phase 4.5 closes that gap before Phase B observable payoff lands.

Phase 4.5 doctrine + plan: `deliverables/adr/adr-005-data-layer-parity-2026-05-20.md`. APPROVED 2026-05-20.

Three implementation checkpoints:

| Checkpoint | Status | Date | Summary |
|---|---|---|---|
| **Checkpoint 1** Setup | ⏳ in flight | 2026-05-20 | PR #136 carries the foundation: `createDataClient({ mode })` abstraction + `demo-local` localStorage-backed accessor; per-PR ephemeral Supabase branch CI workflow + daily janitor cron; centralized data-parity flag registry (17 rooms × 2 + master `data_layer_parity_complete`); founder click-by-click setup doc at `docs/founder-data-parity-ci-setup.md`. Test count: 1821 → 1849. Graceful-degrade gate ensures the workflow no-ops cleanly until founder completes the external setup (`ci@antaeus.app` + `SUPABASE_CI_PAT` + `SUPABASE_PROJECT_REF` + Posthog flag). |
| **Checkpoint 2** Tier 1 retrofit | ✅ effectively complete | 2026-05-23 | **Corrected 2026-05-29** (this row read "⏳ pending" and was stale — see the correction note below the table). True state: **Signal Console** fully retrofitted Steps 3/4/5 on 2026-05-23 (#142 Step 3 dual-write, #147 Step 4 flip-read + realtime, #149 Step 5 drop-legacy). **Deal Workspace** built cloud-native as Phase 4 Room 1 (PR #8) — `data.deals` reads/writes + realtime + `mirrorToLegacyStorage`; only Step-5 mirror-drop remains, gated on cross-room consumers. **Outbound Studio** cloud-resident via `bootCloudPersistence`; only Step-5 mirror-drop remains. The legacy mirrors persist deliberately for not-yet-migrated cross-room consumers (Dashboard, Future Autopsy) — not incomplete retrofits. Phase B's substrate gate is therefore already met (the Briefing reads SC's cloud data live). |
| **Checkpoint 3** Tier 2-4 retrofit | ⏳ pending | — | Remaining 14 rooms × 5 steps each. ~70 PRs. Runs in parallel with Phase B + any subsequent generator work. When the last room hits Step 5, `data_layer_parity_complete` flips on and the migration blob is archived. |

**Checkpoint 2 stale-row correction (2026-05-29):** the Checkpoint 2 row above read "⏳ pending" through the 2026-05-29 session, which was stale — Signal Console had completed all 5 steps on 2026-05-23 (#142/#147/#149) and Deal Workspace + Outbound Studio were cloud-resident from earlier work. Trusting the stale row, the 2026-05-29 session produced redundant Tier 1 PRs: #202 (SC audit) + #204 (DW audit) re-audited finished rooms; #203 (SC schema: `gtm_config` + `signal_console_health_snapshot()` RPC) + #206 (DW schema: `deals.recovery_rank` + `deal_workspace_health_snapshot()` RPC) added net-new additive but **unwired** schema; #205 (OS audit) was accurate. The additive schema was left in place (reverting applied migrations is more risk than value; it's available if a future generator wants those cloud paths). The audit docs from #202 + #204 carry a correction banner. Root cause + full detail: `deliverables/adr/adr-008-orchestration-doctrine-2026-05-29.md` §"Correction note." **Lesson for future sessions: verify retrofit state from git history + the flag registry (`src/lib/data-parity-flags.ts`), not from this time-sensitive table alone.**

**Demo mode boundary (locked):** demo workspaces stay localStorage-only. The `createDataClient({ mode: "demo-local" })` shape mirrors the production NounAccessor but never hits the network. Generators only observe real workspaces.

**CI gate (locked):** per-PR ephemeral Supabase branches via `ci@antaeus.app` service account + `SUPABASE_CI_PAT`. Each retrofit PR provisions a `pr-<num>-run-<id>` branch, applies migrations, runs the `@realtime`-tagged Playwright suite against it, tears down on completion. Daily janitor cron at 03:00 UTC sweeps stranded branches.

**Migration blob deprecation timeline:** archived after every room hits Step 5; never hard-deleted (disk is cheap, audit trail is valuable).

**Parallel workstream:** session focus tracking (`setFocusedObject()` calls from rooms) can land per-room ahead of the full retrofit, lighting up the Phase A session model immediately for whichever rooms add the calls.

### Foundation migration (ADR-001 + ADR-002)

The repo is mid-migration from legacy static-HTML + localStorage + innerHTML onto **Preact + TypeScript + Vite + Supabase (extended) + Vitest/Playwright + Sentry + Posthog + GitHub Actions**. ADR-001 (`deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md`) defines the stack and 5-phase plan; ADR-002 (`deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md`) rescopes Phase 2 around the existing production Supabase project.

**Status as of 2026-04-25:**

| Phase | Status | Date | Summary |
|---|---|---|---|
| **Phase 1** Foundation | ✅ shipped | 2026-04-21 | Vite + TS + Preact build tooling; Vitest + Playwright + canonical templates; GitHub Actions CI; Sentry + Posthog wrappers (commits `00d723b`, `98bb3f6`, `de0539b`, `026c419`). |
| **Phase 2** Data architecture | ✅ shipped | 2026-04-24 | Workspaces + workspace_members + 4 missing noun tables + workspace_id retrofit + workspace-scoped RLS; typed `data-client.ts` with optimistic updates + realtime; localStorage→Supabase migration tool behind `data_migration_live` flag; CF Workers Builds branch-aware env vars. **Live migration completed same day** — 10 rows transformed cleanly, Errors 0, idempotency marker set. |
| **Phase 3** Discovery Studio rebuild | ✅ shipped | 2026-04-25 | First room migrated. Six waves, each its own PR + green CI: scaffold (PR #3), framework loading (PR #3), interactions (PR #4), Supabase persistence (PR #5), on-call control surfaces (PR #6), legacy flag-redirect (PR #7). Behind Posthog flag `room_discovery_v2`. |
| **Phase 4 / Room 1** Deal Workspace rebuild | ✅ shipped | 2026-04-25 | First room within ADR Phase 4. Six waves on a single branch + single PR (#8): scaffold + state, read-path persistence, modal interactions + write path, realtime + legacy mirror, filter chips + workspace-health snapshot, legacy flag-redirect. Behind Posthog flag `room_deal_workspace_v2`. |
| **Phase 4 / Room 2** Dashboard rebuild | ✅ shipped | 2026-04-26 | Second room within ADR Phase 4. Six waves on a single branch + single PR (#11): 3-mode signal scaffold (Brief / Spotlight / Queue), command-intelligence engine port (892 → ~1,400 lines of typed TS across engine-helpers / signal-profile / scoring / command-intelligence), Spotlight wired to engine via computed signals, Brief narrative builder + Queue triage list, snapshot aggregator reading `gtmos_deal_workspace_health` + legacy room snapshots with cross-tab sync, legacy flag-redirect. Behind Posthog flag `room_dashboard_v2`. |
| **Phase 4 / Room 3** Signal Console rebuild | ✅ shipped | 2026-04-26 | Third room within ADR Phase 4. Six waves on a single branch + single PR (#13): typed Account/Signal/HeatMetrics scaffold + state, heat engine port (faithful TypeScript port of legacy lines 1271-1333 with 6-step recency decay + AI/high-conf bonuses + 4-band Hot/Active/Watch/Low), account grid + click-to-expand cards with top-3 signal preview, persistence over `gtmos_sc_v4` + snapshot publishing to `gtmos_signal_room_health` (Dashboard's aggregator already consumes this), cross-room handoff helpers (`buildSignalRoomHref` + 4 destination builders) + execution-context temperature ladder (ice_cold / cool / warm / hot from deal stage + reply state) + workspace-health panel (motion-ready vs research-heavy posture), legacy flag-redirect. Behind Posthog flag `room_signal_console_v2`. Enrich-all flow (external API call) deferred to a follow-up — operators run it in the legacy room until the abstraction lands. |
| **Phase 4 / Room 4** Future Autopsy rebuild | ✅ shipped | 2026-04-27 | Fourth room within ADR Phase 4. Six waves on a single branch + single PR (#15): typed Vitals/Cause/AutopsyDoc/ActionPlan/TaskLog scaffold + state, deal-health subset port (faithful TypeScript port of legacy `js/deal-health.js` lines 126-331 — qualScore/computeRisk/computeVitals/topCauses over a 13-rule CAUSES table) reading from Phase 4 / Room 1's `gtmos_deal_workspaces` mirror, autopsy generator (CHAPTERS/WMAP/WTEXT/STAGE_LEADS/CAUSE_LEADS/STAGE_WIN_LEADS data verbatim + generateAutopsy pipeline + autopsyUniverseScore ranker), pinned-case UI (verdict toggle left/corrected + 3-tab forensic sheets pattern/proof/symptom + countermeasure docket with task checkboxes + kill-switch panel), cross-room handoff (buildFutureAutopsyRoomHref + 4 destinations) + buildActionPlan router + task-completion log persistence (gtmos_autopsy_log_v1) via @preact/signals effect, legacy flag-redirect. Behind Posthog flag `room_future_autopsy_v2`. Legacy `js/deal-health.js` not ported wholesale — only the subset Future Autopsy consumes; the file stays in place for legacy rooms still using it. |
| **Phase 4 / Room 5** PoC Framework rebuild | ✅ shipped | 2026-04-27 | Fifth room within ADR Phase 4. Six waves on a single branch + single PR (#17): typed Proof/ProofDraft/HeatLedger/MoldDiagnosis/ProofDocs scaffold + state, quality engine port (faithful TypeScript port of legacy `getPoCQuality` + `heatLabel/Color` + `deriveMolds` lines 137-180 — 3-dimension heat ledger / 5-step weakest-mold / score-band thresholds preserved verbatim), forge panel UI (form + duration toggle + heat ledger) + cast panel (quality readout + 5-mold grid + weakest-mold callout), 4 doc generators (scope/kickoff/readout/email markdown templates verbatim) + persistence over `gtmos_poc_data` (max 20, defensive parser) + freezeDraftIntoProof, cross-room handoff (`buildPocRoomHref` + 3 destinations) + URL `?deal=` inbound + bidirectional deal sync (loadDealsForLinking dropdown + syncProofIntoDeal writes `.poc` snapshot back into `gtmos_deal_workspaces[]`), legacy flag-redirect. Behind Posthog flag `room_poc_framework_v2`. Decision Bench hybrid: dark forge / cream cast split per Part II §4.8. |
| **Phase 4 / Room 6** Outbound Studio rebuild | ✅ shipped | 2026-04-27 | Sixth room within ADR Phase 4. Six waves on a single branch + single PR (#19): typed Persona/Temperature/TriggerKey/Channel/Asset/CtaKey/Touch/Angle/OperatorRack scaffold + state, data tables (TRIGGERS/PERSONA_DATA/CHANNEL_ORDER/ASSET_MATRIX/CTA_BY_TEMP verbatim from legacy lines 612-1010) + send-line generator (faithful port of legacy `generate()` lines 1124-1241, 5 temperatures × 4 personas, deterministic date substitution, computeQuality + motionBand), 5-input switchboard form (account autocomplete + persona/temperature/trigger selectors + next-question + no-ask toggle), output panel (4 chip readouts + 3 actions Copy/Log touch/Save angle) + persistence over `gtmos_outbound_touches` + `gtmos_angles` (legacy keys, defensive parsers, MAX_HISTORY 200/100), cross-room handoff (`buildOutboundRoomHref` + 3 destinations Signal Console / LinkedIn / Cold Call) + URL inbound (`readInboundRack` for `?account=&contact=&persona=&temp=&trigger=`) + scoped TouchLog (with inline outcome editor) + HandoffStrip, legacy flag-redirect. Behind Posthog flag `room_outbound_studio_v2`. PR #19 Codex review (1 P1 + 2 P2) addressed in follow-up `c78d0ae` — TouchLog cross-account fallthrough, OutputPanel un-awaited clipboard write, and saveAngleFromRack contract dedupe. |
| **Phase 4 / Room 7** Cold Call Studio rebuild | ✅ shipped | 2026-04-27 | Seventh room within ADR Phase 4. Six waves on a single branch + single PR (#21): typed Thread / Reply / ThreadId / Outcome / CallLogEntry / Draft / AccountSummary scaffold + state, thread spine + buyer-response data verbatim from legacy lines 97-127 (6 threads × 2-3 branches), personalize() + loomScore() + weakestThreadCopy() helpers ported faithfully (44-92 score formula, [account] / [pressure] / [company] substitutions), live thread navigation + branch picker UI + 3-col say-line/replies/say-next sheet, outcome capture + persistence over `gtmos_cold_call_log` (legacy `{calls: [...]}` envelope) + `gtmos_discovery_stats` (totalCalls + advancedCalls, advanced bumps only on meeting_booked), notes textarea + 7-button outcome row, cross-room handoff (`buildColdCallHref` + 3 destinations Signal Console / Call Planner / Deal Workspace) + URL `?account=` inbound + auto-select-hottest fallback + `createDealFromCall` writes to `gtmos_deal_workspaces` on meeting_booked, legacy flag-redirect. Behind Posthog flag `room_cold_call_v2`. PR #21 Codex review (1 P2) addressed in follow-up: account-loader.ts heat-zero fallthrough fix (presence-check `heat` instead of `||` falsy-test so explicit zero wins over stale `_heat`). |
| **Phase 4 / Room 8** LinkedIn Playbook rebuild | ✅ shipped | 2026-04-27 | Eighth room within ADR Phase 4. Six waves on a single branch + single PR (#23): typed Cue / CueIndex / ActionType / Outcome / Motion / MotionContext / ActionEntry / Draft / ChannelStats scaffold + state, cue ladder data verbatim from legacy line 110 (5 cues Watch → Comment → Connect → Give-first → Ask) + motion engine (`deriveMotion`, 4-branch port of legacy `getMotion`: credibility / warm_signal_account / convert_connection / add_air_cover with branch precedence + `cueIndex` bump rule + `(heat N)` parenthetical only when non-zero) + cueScript helpers + 4 method-sheet templates (verbatim from legacy lines 79-83), live cue rail with bulb halos + dark stage panel with personalized cue script + 3-cell cue console + booth-read aside (score meter `Math.max(28, Math.min(86, acceptRate + 40))` + 3 read-blocks) + 4 method-template cards with `[token]` em-highlighting + clipboard copy buttons (chained `.then/.catch` to avoid the PR #19 un-awaited-write pattern), cue logging + persistence over `gtmos_linkedin_log` (legacy `{actions: [...]}` envelope) + 5-stat activity board (Actions/Requests/Accept/DMs/Reply, accept% green + reply% gold) with per-row outcome `<select>` driving live recompute, cross-room handoff (`buildLinkedInRoomHref` + 2 destination builders Signal Console / Outbound Studio + `readInboundAccount`) + 3 inbound context loaders (`loadBestIcp` / `loadHottestAccount` / `loadLatestTouch` reading `gtmos_icp_analytics` / `gtmos_sc_v4` / `gtmos_outbound_touches`; loadHottestAccount uses the same `"heat" in o` presence check from PR #22's Codex P2 fix so explicit zero wins over stale `_heat`), legacy flag-redirect. Behind Posthog flag `room_linkedin_playbook_v2`. PR #23 Codex review (1 P1 + 1 P2) addressed in follow-up: (P1 systemic) the legacy flag-redirect IIFE pattern used since Phase 3 / Room 1 did a one-shot `typeof posthog === "undefined"` check and bailed early, but `js/analytics.js` injects the Posthog SDK script async via `loadPosthogSdk` — on cold loads `posthog` was undefined when the IIFE ran, so `onFeatureFlags` never registered and the cutover never fired (Rooms 1-7 only worked when their users had a warm cdn.jsdelivr.net cache). Fix: `analytics.js` now dispatches `gtmos:posthog-ready` after `script.onload` + `posthog.init`; the redirect IIFE in all 9 legacy room HTML files (Rooms 1-8 + Discovery) was rewritten as a `maybeRedirect` helper called both immediately (warm-cache fast path) and inside a `gtmos:posthog-ready` listener (cold-load path). (P2) `readInboundAccount` in Room 8's `lib/handoff.ts` was falling back to `?focusObject=` when `?account=` was missing, but `buildLinkedInRoomHref` defaults `focusObject` to the literal placeholder `"LinkedIn cue"` when no real account is supplied — a roundtrip through any cross-room handoff would have prefilled the cue ledger with the placeholder string. Fix: drop the focusObject fallback; only `?account=` drives the draft prefill. |
| **Phase 4 / Room 9** Call Planner rebuild | ✅ shipped | 2026-04-27 | Ninth room within ADR Phase 4. Six waves on a single branch + single PR (#25): typed PersonaKey (6) / Outcome (5) / SignalSummary / MatchedAccount / LinkedDeal / QualityGate (5 keys: person/persona/context/why_now/advancement) / QualityBand / AgendaQuality / Draft / AgendaSnapshot / CallHandoffPayload scaffold + state, persona question banks (6 personas × 3 questions verbatim) + 5-gate quality engine (person 20 + persona 10 + context 20 + why_now 25 + advancement 25 + heat≥85 bonus 5, capped 100, bands credible/workable/thin) + advance ask + agenda brief, witness form (contact / persona row / LinkedIn URL / custom notes / linked-deal `<select>`) + 4-strip agenda (signal-driven opener / reason-now / 3 numbered probes / advance ask) + quality block, persistence over `gtmos_discovery_agenda` + `gtmos_call_handoff` + `gtmos_discovery_stats` (advancedCalls only on advanced outcome per legacy line 1062-1064), cross-room handoff (3 destinations: Discovery Studio primary, Deal Workspace, Copy agenda brief) + `?account=` URL inbound + auto-fallback to first active deal, legacy flag-redirect using the post-PR-#24 event-listener pattern. Behind Posthog flag `room_call_planner_v2`. Naming asymmetry preserved: canonical room name is "Call Planner" per canon §4.11; new room served at `/call-planner/`; legacy path remains `/app/discovery-agenda/`. |
| **Phase 4 / Room 10** Advisor Deploy rebuild | ✅ shipped | 2026-04-27 | Tenth room within ADR Phase 4. Six waves on a single branch + single PR (#26): typed TierId (4) / MomentId (10) / Advisor / DeploymentOutcome (7 incl. hold/reroute) / Deployment / AdvisorDeal / DealAdvisorEntry / DeskState / AdvisorDraft / GeneratedAsk / SpendBand / SpendRead / CooldownStatus shapes + state, TIERS (4 tiers verbatim: t1 Board/Investor 90d / t2 Strategic Advisor 30d / t3 Angel/Portfolio 14d / t4 Customer Reference 30d) + MOMENTS (10 ask-moments verbatim) + cooldown engine (per-tier window, most-recent selection) + recommend (advisorsForDeal + recommendedMomentForDeal stage tree + recommendedAdvisor 3-tier preference) + ask-builder ([company]/[buyer] substitution + buyer fallback chain + customAsk override) + spend-read (30-92 score + 3-band classifier), live desk-board UI (hero with band-tinted spend-read score + 3-cell route bar + desktop with dark navy proof blotter + 4-tab rolodex with rotating accents + rotated cream ask sheet + 3 circular stamps + 4-cell desk-edge footer), persistence over `gtmos_advisor_registry` + `gtmos_advisor_deployments` (legacy envelope shapes, defensive parsers) + impact engine (4-cell stat grid + 5-rule readline list with red/orange/blue/green tones), cross-room handoff (deal mirror reads from `gtmos_deal_workspaces` + advisor-effect writes back into the same mirror updating advisorHistory + nextStep + nextStepDate per outcome → step rules verbatim from legacy + 3-CTA strip Deal Workspace / Future Autopsy / PoC Framework + `?deal=` URL inbound), legacy flag-redirect. Behind Posthog flag `room_advisor_deploy_v2`. PR #26 Codex review (2 P1 + 1 P2) addressed in follow-up: (P1) setDealId now clears customAsk on deal change so an edited ask doesn't leak across deals; (P1) sync-back's pending-outcome path now preserves existing nextStepDate (legacy parity); (P2) main.tsx URL inbound now resolves by deal id then by accountName so cross-room handoffs that pass account name in `?focusObject=` land on the right deal. |
| **Phase 4 / Room 11** ICP Studio rebuild | ✅ shipped | 2026-04-28 | Eleventh room. Six waves on a single branch + single PR (#28). Scaffold + RoleKey/IcpDraft/SavedIcp shapes; ICP build + 8-check 4-tier quality engine (faithful port of legacy lines 980-1325); 7-input live form + 4 build outputs + tier-tinted quality readout; persistence over `gtmos_icp_analytics` (envelope shape preserved, defensive parser, legacy `activeAccounts` fallback) + `saveDraftAsIcp` action; cross-room handoff (`buildIcpHref` + 4 destinations Territory / Sourcing / Signal / Outbound). Behind Posthog flag `room_icp_studio_v2`. Originally shipped with a dark hero per the §4.8 hybrid; founder directive 2026-04-27 flipped it to a bright cream-gradient hero with orange left-rule before merge, plus the canonical bright palette adoption (blue `#2563eb`, green `#22c55e`, amber `#f59e0b`, red `#ef4444`). |
| **Phase 4 / Room 12** Territory Architect rebuild | ✅ shipped | 2026-04-28 | Twelfth room. Six waves on a single branch + single PR (#29). Decision Bench, fully bright (no dark hero / no dark panels). Typed `TierId` (4) + `TIER_DEFAULTS` (30/90/120/60) + `ACCOUNT_CEILING=300` + Focus/Approach/TerritoryAccount/Disposition shapes; `allocation` computed (per-tier counts vs target deltas + total vs ceiling status); persistence over `gtmos_territory` + `gtmos_ta_focuses` + `gtmos_ta_approaches` + `gtmos_ta_accounts` (4 legacy keys, defensive parsers); 6-stat HeroBand + tier-tinted FocusStudio + ApproachLedger + 300-cap-aware AccountTable + HandoffStrip (3 destinations ICP / Sourcing / Signal). Behind Posthog flag `room_territory_architect_v2`. |
| **Phase 4 / Room 13** Sourcing Workbench rebuild | ✅ shipped | 2026-04-28 | Thirteenth room. Six waves + Codex P1+P1 follow-up on a single branch + single PR (#30). Decision Bench, bright. Typed Platform/LeverageKey/ProspectStage shapes; `getProspectQuality` engine (faithful port of legacy lines 1402-1460 — base 18 + leverage bonus + 6 field credits + 3-band classifier ≥80 ready / ≥55 researched / else captured); auto-promote on save; 5-stage Kanban (captured → researched → ready → pushed → dropped); persistence over `gtmos_sw_query_cards` + `gtmos_sw_prospects` (legacy keys) with defensive parsers. Codex flagged two real P1 bugs: (1) parseQueryCard rejected legacy rows whose query content lived under `filters{}` not in a top-level `query` field — fix derives query from filters with priority booleanString → personaTitles+industry → behavioralSignal; (2) parseProspect rejected legacy rows that used `name` instead of `accountName` — fix accepts `name` as fallback + folds `parked`/`rejected` legacy stages into `dropped`. Behind Posthog flag `room_sourcing_workbench_v2`. |
| **Phase 4 / Room 14** Quota Workback rebuild | ✅ shipped | 2026-04-28 | Fourteenth room. Six waves + Codex P1+P1+P2 follow-up on a single branch + single PR (#31). System Ledger, **bright not dark** per founder directive (overrides the §4.6 "dark permitted and recommended" wording in the prior canon). Typed PlanInputs/Benchmark/PlanMetrics/QualitySignal/CoverageSnapshot shapes; faithful port of legacy `calc()` from lines 498-585 (4 ACV bands small/mid/enterprise/strategic; per-rate computation chain monthly → deals → opps → meetings → touches → active accounts; 100-point quality formula `34 + max(0, 24 - |win - benchmark.winRate|) + …` verbatim); `computeCoverage` subset port of legacy `dh.computeCoverage` reading `gtmos_deal_workspaces` mirror with stage-probability weighting; persistence writes 3 legacy keys (`gtmos_qw_inputs` + `gtmos_outbound_seed` + `gtmos_quota_targets`). Codex flagged 3 real bugs: (P1) coverage never recomputed when quota/inputs changed — fix added `startCoverageRecompute` @preact/signals effect + cross-tab storage listener; (P1) `needed = quota - weighted` contradicted the panel comparing ratio against `benchmark.coverage` — fix: `targetMultiple` parameter + `needed = max(0, quota * multiple - weighted)`; (P2) `startPersistence` skipped first run leaving `gtmos_quota_targets` stale on cold load — fix: explicit synchronous initial write. Behind Posthog flag `room_quota_workback_v2`. |
| **Phase 4 / Room 15** Settings rebuild | ✅ shipped | 2026-04-28 | Fifteenth room. Six waves + Codex P1+P1 follow-up on a single branch + single PR (#32). Trust Annex, bright. Topbar with 3-stat anchor (keys captured / last backup / mode) + 4 cards (Backup-and-restore: Export/Import/Clear; Product category dropdown; Demo mode status + entry/exit; Role + onboarding links) + dismissable toast. `buildBackup`/`applyBackup` capture every `gtmos_*` key into structured JSON; `clearWorkspace` removes them. Codex flagged 2 real bugs: (P1) `loadDemoState` was reading `gtmos_demo_active` from localStorage (a key nothing writes) instead of the canonical `sessionStorage.gtmos_env_mode === "demo"` flag set by `js/demo-storage-bootstrap.js` — fix reads sessionStorage; (P1) `clearWorkspace` would delete every `gtmos_*` key including the `gtmos_demo__*` namespace used for sibling demo workspaces — fix excludes that prefix from `listGtmosKeys` (which then propagates through buildBackup + applyBackup + clearWorkspace), plus the new room loads `js/demo-storage-bootstrap.js` before `main.tsx` so reads/writes route through the demo namespace when env_mode=demo. Behind Posthog flag `room_settings_v2`. Note on scope: cloud-sync flows (Supabase) are not migrated; the Preact Settings room is a *local* trust annex. |
| **Phase 4 / Room 16** Welcome rebuild | ✅ shipped | 2026-04-28 | Sixteenth room. Six waves + Codex P1+P1 follow-up on a single branch + single PR (#33). Threshold, bright. `buildMilestones` (faithful 4-anchor ladder ICP → signal → deal → motion); `buildActivationModel` (3-tier headline empty/mid/complete); `buildActions` (priority-ordered next-action list, max 5); `loadCounts` reads counts from existing localStorage shapes (gtmos_icp_analytics / gtmos_deal_workspaces / gtmos_sc_v4 / gtmos_outbound_touches / gtmos_linkedin_log / gtmos_discovery_stats). Codex flagged 2 real bugs: ACTION_QUOTA + ACTION_BACKUP pointed at `/quota-workback/` and `/settings/` which didn't exist on main yet (PR #31 + PR #32 not merged at review time) — fix: legacy `/app/<room>/` paths so the flag-redirect handles cutover transparently. Behind Posthog flag `room_welcome_v2`. |
| **Phase 4 / Room 17** Onboarding rebuild | ✅ shipped | 2026-04-28 | Seventeenth + final room. **Greenfield rebuild, not a port** — the legacy onboarding shape was carried forward only for the persisted `gtmos_onboarding` envelope. Six waves + Codex P1+P1+P2 follow-up on a single branch + single PR (#34). Threshold, bright. Behavioral spine per Part III §5: Endowed Progress Effect (1/7 = 14% on arrival), Commitment + Consistency (escalating micro-commitments), Implementation Intentions (contextual next-action hints), one dominant move per surface. 7-step flow (intro → company → role → category → ICP → first account → quota) + completion screen with 4 destination CTAs. `seedFromDraft` writes activation context + product category + first ICP + first account + quota seed across the existing localStorage stores. Codex flagged 3 real bugs: (P1) onboarding only wrote `gtmos_onboarding_completed_at` but `js/workspace-guard.js` + `js/supabase-config.js` gate routes on `gtmos_onboarding.completed === true` — fix writes the canonical legacy `{completed, completedAt, answers}` shape; (P1) ICP + account writes replaced the entire payload on re-run — fix merges into the existing collection (accounts dedupe by case-insensitive name); (P2) `gtmos_product_category` was stored as a bare string but legacy readers use `JSON.parse` and fell back to `cxai` — fix `JSON.stringify` to match the legacy convention. Behind Posthog flag `room_onboarding_v2`. |
| **Phase 4 closeout doctrine** | ✅ shipped | 2026-04-28 | PoC Framework dark forge → bright flip (PR #35). The PoC rebuild (PR #17) shipped with a dark/light split per the §4.8 hybrid; founder directive retired the §4.8 exception, and the canon session log recorded the flip as the post-Phase-4 doctrine PR. Forge tokens flipped (`--poc-forge-bg` `#0a1c40` → `#ffffff`; text + raised + border tokens to navy-alpha equivalents); `.poc-forge` gains a 4px orange left-rule mirroring Sourcing Workbench's QueryStudio convention so the "severe forge" signature survives without a dark surface; per-room accent tokens aligned to the canonical bright palette (orange `#e6701e`, blue `#2563eb`, green `#22c55e`, amber `#f59e0b`, red `#ef4444`). Heat-bar track recolor `rgba(white,0.08)` → `rgba(navy,0.10)`. Token names preserved so existing rule selectors don't have to be retargeted. CLAUDE.md doctrine sections (§1, §4.6, §4.8) updated in the same PR cluster to retire the dark-hero / dark-permitted language. |
| **Phase 4** overall close | ✅ closed | 2026-04-28 | All 17 in-scope rooms migrated to the new stack + PoC bright flip + doctrine alignment. Readiness Score and Founding GTM stayed on legacy per ADR-002 with founder mind-rethink as the gate; the **mind-rethink completed 2026-05-01** with new minds locked in §4.17 + §4.19 (rebuild pending, queued for Phase 5). The Phase 4 deletion sweep ran on 2026-05-01 (PR #45) — replaced the 18 migrated rooms' legacy `/app/<room>/index.html` files with meta-refresh + JS redirect stubs, net 23,732-line deletion. Legacy `js/` files left untouched (some still consumed by readiness + founding-gtm + auth/commerce flows; future orphan-cleanup PR after the readiness/handoff rebuild lands). |
| **Phase 5** Static pages polish | ⏳ pending | — | Landing, privacy, auth pages — open-ended steady-state work per ADR-001 §6. Begins next. |

Each migrated room is feature-flag-gated; legacy `/app/<room>/` includes a `posthog.onFeatureFlags` redirect script so cutover is per-user and reversible by toggling the flag in Posthog. The `?demo=1` / `?qa=1` escape hatch keeps CI Playwright + demo-seed bootstrap on the legacy room.

**Phase 1 + Phase 2 founder external setup — all complete:**
- Sentry + Posthog projects exist; `VITE_SENTRY_DSN`, `VITE_SENTRY_ENV=production`, `VITE_POSTHOG_API_KEY` live in CF Workers Builds (Production + Preview tabs split per `docs/founder-phase-2-supabase-env-setup.md`).
- Supabase Pro tier active; persistent `preview` branch exists; both branch DB passwords rotated post-Phase-2.3.
- Branch protection on `main` remains pending a CI baseline (4 GitHub Actions checks all reliably green now after PR #8).

### Still owed work unrelated to migration

1. **Discovery Studio + Deal Workspace brittleness debt** in the legacy code — partially superseded by the Phase 3 migration (the old code gets replaced, not refactored). Future Autopsy inline-handler cleanup was already applied (`59aef90`) and carries forward.
2. **Onboarding audit.** Cannot capture via the demo-seed bootstrap (the script refuses to land there by design); still on the unrefaced list by line-delta. Will be addressed when Onboarding migrates in Phase 4.
3. **Deploy pipeline exercise.** The Cloudflare pipeline committed on 2026-04-20 (`5889bde`) has never been run end-to-end. The new `.github/workflows/deploy.yml` will exercise it once founder sets CI secrets + merges to main.

### Pre-beta shipping hygiene (mostly untouched)

The Feb 2026 `GTM-OS-EXHAUSTIVE-IMPROVEMENT-PLAN.md` had 9 phases of ship-hygiene. Most are not done. The critical ones to pick up before beta:

- **Phase 1 (ship-blockers):**
  - Unsaved-changes guard: `js/unsaved-guard.js` exists and is wired for **ICP Studio + PoC Framework** on the LEGACY stack as of 2026-04-21 (commit `2e18122`). The new-stack rebuilds (Phase 4 + Phase 5) ship without it; the auto-save effects in those rooms cover most of the same ground but explicit unsaved-guard wiring is still owed for: Founding GTM, Outbound Studio, Deal Workspace, Call Planner, the future Negotiation rebuild (canon §4.X). The flagged-but-retired rooms — CFO Negotiation, Content Builder — are no longer in canon §4 (CFO Negotiation is succeeded by §4.X Negotiation; Content Builder retired in the architecture-reset).
  - Auth failure user-facing errors: still owed
  - Auto-save on Founding GTM: shipped 2026-05-01 via Phase 5.B Wave 4 health-publisher effect
- **Phase 2 (data safety):** analytics SDK integration (Posthog or Plausible), "Export All Data" JSON, "Data stored locally" notice, "Delete my data"
- **Phase 3 (export completeness):** Deal Workspace CSV, Readiness export, Command Center export
- ~~**Phase 5 (label fixes):**~~ *Already done during architecture-reset / nav re-architecture. The flagged labels (Command Center, Live Discovery, Content Builder, Agent Lab) no longer exist in the current code. Verified via grep 2026-04-21.*

These don't block the refacing pass, but they do block beta.

## 2. Canonical doc locations

Canon order of authority (highest first):

1. **This file** (`CLAUDE.md`) — operating canon for sessions
2. `deliverables/design-principle-strict-bible/` — deeper authority for specific topics:
   - `01-charter-and-laws/` — UI/UX design rules + rebrand truth-lock
   - `02-brand-and-visual-system/` — visual identity lock + visual system spec
   - `03-research-backbone/` — architecture restructure research brief + review (40-source synthesis, behavioral evidence)
   - `03-facial-architecture/` — facial architecture rubric + taste-test program + Phase-7 preflight
   - `05-facial-architecture-and-composition/` — composition families
   - `06-preservation-guardrails/` — phase-7 module preservation signoff + compounding rules
   - `07-control-artifacts/` — Lumana reference HTMLs + taste tests
   - `08-room-guardian-specs/` — **only Discovery Studio is fully specified; the other rooms need their own guardian specs over time**
3. **`deliverables/adr/`** — architectural decision records, numbered and dated. Each ADR documents a single major architectural choice with rationale, alternatives considered, and implementation plan. ADRs supersede earlier ADRs explicitly; no ADR is ever silently overridden. First ADR: `adr-001-foundation-stack-migration-2026-04-21.md` (stack migration to Preact + TypeScript + Vite + Supabase (extended) + Vitest/Playwright + Sentry + Posthog + GitHub Actions CI). See `deliverables/adr/README.md` for the ADR process.
4. `deliverables/plans/` — implementation specs (active + historical)
5. `deliverables/prototypes/wireframes/` — the triptych archive

If a lower authority conflicts with this file, either the lower wins (and this file gets updated) or this file wins (and the lower gets archived). Do not leave contradictions.

**Stale canon to watch:** `PRODUCT_CONTEXT.md` at repo root describes the v22/v23 world pre-refacing. Treat it as archived background; do not update it; this file supersedes it. (Internal `Last updated: 2025-02-11` in that file is a typo for 2026.)

## 3. Branch convention

Current working branches:

- `main` — behind the refacing work; not the primary line
- `gtm-os-refacing-checkpoint` — the main refacing line
- `claude/generate-work-report-pnrJu` — Claude's working branch for this session
- `cloudflare/workers-autoconfig` — deploy config

Rule for ongoing work (unless the user says otherwise):

- Claude work lands on a feature branch under `claude/` or a descriptively-named branch
- Direct commits to the branch; user reviews in bulk, not per-commit
- Pull request is created only when the user explicitly asks
- Never push to `main` or `gtm-os-refacing-checkpoint` without explicit founder approval

## 4. Dev-server + screenshot workflow (critical)

**Never audit a room from DOM or CSS alone.** Visual render tells a different story. Use this workflow:

### Start the server

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

(Run via `run_in_background: true` from a Claude session, or leave running in a real terminal.)

### Capture a single room

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(node -e 'console.log(require("puppeteer").executablePath())')" \
  node tools/qa/capture-demo-room.js \
  --path /app/<room>/ \
  --scenario mm \
  --qa \
  --screenshot /tmp/room-shots/<room>.png
```

Flags:
- `--scenario mm` (mid-market demo data) or `--scenario ent` (enterprise)
- `--qa` suppresses tours/overlays
- `--path` is the room route; auto-appends `?demo=1`

### Environment notes

- Playwright's CDN is blocked in some environments; Puppeteer's works. The `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` env var shim in `tools/qa/capture-demo-room.js` (added 2026-04-21) points Playwright at Puppeteer's Chrome binary. No change on Windows/Mac default installs.
- If `playwright` or `puppeteer` are missing: `npm install` at repo root.
- If Chrome binary is missing: `npx puppeteer browsers install chrome` — Puppeteer's CDN is allowlisted where Playwright's is not.
- Server on `127.0.0.1:4173` is the default the capture script expects. Override with `--base-url`.

### Interactive deep pass

For audits that need more than a single-state screenshot (state transitions, interaction sequences, cross-room handoff), write a small Playwright script at repo root (so `require('./tools/qa/demo-room-bootstrap')` resolves). Template pattern:

```js
const playwright = require("playwright");
const bootstrap = require("./tools/qa/demo-room-bootstrap");

async function main() {
  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2400 } });
  try {
    await bootstrap.bootstrapDemoRoom(page, {
      baseUrl: "http://127.0.0.1:4173",
      roomPath: "/app/<room>/",
      scenario: "mm",
      qaMode: true
    });
    // ...interact, probe via page.evaluate, screenshot multiple states
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
```

Delete the temp script after the pass. Do not leave audit scripts in the repo.

### Probing the DOM for contract compliance

From within `page.evaluate(() => { ... })`, count semantic elements and check against the room's guardian spec. Example (Discovery Studio):

```js
const probe = {
  frameworkBtns: document.querySelectorAll('.dsj-framework-btn').length,
  segmentNodes: document.querySelectorAll('.dsj-node').length,
  essentialNodes: document.querySelectorAll('.dsj-node.is-essential').length,
  recoverRail: !!document.querySelector('[class*="recover"]'),
  supportDossier: !!document.querySelector('[class*="support"]')
  // ...check every contract item
};
```

Probe results can be checked directly against the guardian spec.

## 5. How to pick up this work in a future session

If you (or a future Claude session) are opening this cold:

1. **Read this file top to bottom.** Don't skim.
2. **Confirm current state** — Part V §1 is time-sensitive. Check git log for commits since the "Refacing pass stands" date above. If there are new commits, the state is stale; render a few rooms and update this section before doing other work.
3. **Start the server + render the room you're working on** before making any face change.
4. **Run the room against Part IV §2** (the mind / behavior / face / rubric pass) before doing anything.
5. **For substance changes (mind corrections), stop and ask the founder first.** Part IV §4 protocol. Never silently.
6. **Commit in small, clear pieces.** Stop hook in this repo flags uncommitted/untracked files.

## 6. Session log (current)

Add entries here when a session meaningfully shifts doctrine or state, so the next session sees what changed.

| Date | Session | What shifted |
|---|---|---|
| 2026-05-31 | ADR-012 + Phase E Skill scheduling shipped | **The system learns when to fire.** Phase C gave operators skills; Phase E lets them attach a cadence. Operator schedules a skill ("run `whats-at-risk` every Friday at 9am"); the heartbeat fires it server-side at the scheduled time and writes a pending-fire row; on the operator's next app load, they're auto-routed to the result room with a toast confirming which skill fired. **ADR-012 ships** as the canonical record. Six locked design points: (1) only Phase C skills are schedulable (deterministic, voice-gated); (2) three cadences in v1 — daily-at-time / weekly-on-day-at-time / monthly-on-date-at-time; (3) storage in new `scheduled_skills` + `scheduled_skill_fires` Supabase tables (workspace-scoped RLS); (4) trigger via heartbeat (every 30 min) reads due rows + writes pending-fire ledger; (5) auto-navigate on arrival — client reads pending fires on load, dispatches the skill, marks viewed, shows toast (founder pick E1-A); (6) per-workspace (not per-operator) scope; multi-operator deferred. **What this is NOT:** not a workflow engine (one skill, one cadence, one auto-navigate); not a notification system (toast confirms an action just taken, not a passive alert); not a cron exposure (operator picks "every Friday at 9am" from a form, never writes cron syntax); not arbitrary code execution (recipes still static, dispatcher still deterministic). **Founder framing:** locked from the design-review mockup at `deliverables/mockups/phase-d-and-e-variants-2026-05-31.html`. Founder pick E1-A makes scheduled skills active (auto-navigate on arrival) rather than passive (write-observation). **Next under rigid ordering:** Phase F (bounded self-modification per ADR-004 §Phasing) is queued but unscoped; the natural next move per founder direction. |
| 2026-05-31 | ADR-011 + Phase D Birdseye Float shipped | **The system gets a persistent presence.** Phase A gave it a heartbeat, Phase B gave it observations about the operator's work, Phase C gave the operator deterministic skills. Phase D gives the system a small persistent surface on every room: a floating eye icon that, on click, expands to a drawer showing ONE ranked "what to look at next" line. **ADR-011 ships** as the canonical record. Five locked design points: (1) surface — floating element anchored bottom-right, mounted via RoomChrome, renamed `BirdseyeFloat` from the canon's original "birdseye strip" framing because the locked design isn't a strip; (2) visibility — collapsed by default to the icon, expands on click; the count badge fires only when there's a more-urgent NextMove than the room the operator is currently in; (3) semantic — single line, not a digest; one `NextMove` with label + reason + target URL; (4) ranker inputs — observations ledger + Deal Workspace recovery_rank + Signal Console hottest account heat; Briefing Patterns slot in when B.X+ ships; (5) click handler routes via continuity params so destination rooms handle the inbound through the existing HandoffStrip pattern. **What this is NOT:** not a dashboard (one line, not a digest); not a notification system (no toasts, no growls); not a new product surface (additive to every room per ADR-008 boundary); not realtime push (heartbeat cadence, accumulated reads). **Founder framing:** locked on 2026-05-31 from the design-review mockup at `deliverables/mockups/phase-d-and-e-variants-2026-05-31.html`. The combination D1-C + D2-B + D3-C + E1-A picks were reconciled into "collapsible float with ever-present icon" for D and "auto-navigate on arrival" for E. **Voice rule:** NextMove labels + reasons pass `validateObservation()` — same gate as Phase B + Phase C. Ranker outputs that fail the gate are dropped, the drawer falls back to the next candidate or "Nothing pressing right now" if none pass. **Next under rigid ordering:** Phase E (operator scheduling per ADR-012). |
| 2026-05-31 | ADR-010 + Phase C Skills layer shipped | **The system gets a way to compose itself.** Phase A gave the system a heartbeat (ADR-004). Phase B gave it observations about the operator's work (ADR-009). Phase C gives the operator a way to invoke deterministic compositions of existing room engines — what ADR-004 §Phasing called the Skills layer. **ADR-010 ships** as the canonical record. The locked design: bundled markdown recipes with YAML frontmatter at `src/skills/recipes/`, a three-action union (`route` / `compose-context-and-route` / `filter-and-route`), parser + dispatcher in `src/skills/`, Cmd+K palette extension. **No LLM at runtime** per ADR-008's rejected list — recipes are static, dispatcher is deterministic JavaScript. **Skills are pure navigation** — the operator picks a skill from Cmd+K → lands in the right room with the right context. No skill-specific UI surface (preserves ADR-008's additive boundary). **Five starter skills** cover the cross-room flows Phase 4 + Phase B enabled: `triage-week-reads` (Dashboard WeekReadsCard with focus on undismissed observations), `prep-next-call` (Discovery Studio pre-loaded from latest Call Planner agenda), `whats-at-risk` (Deal Workspace intervention board filtered to top-5 stalled), `cast-proof-for-hottest-deal` (PoC Framework pre-filled with hottest open deal), `compose-this-weeks-outbound` (Outbound Studio pre-filled with hottest Signal Console account). **What's NOT in scope:** operator-authored skills (Phase F per canon), scheduled skills (Phase E), branching/conditional recipes (deliberately deferred — v1 action union is exhaustive for the cross-room compositions the system already supports via continuity params). **Voice rule applies to recipes:** every skill's description is validated against `src/lib/voice/voice-document.ts` at parse time; CI fails on a recipe that smuggles in banned vocab. **Test count delta:** ~2821 → projection ~2880+ (parser tests + dispatcher tests + per-skill tests + palette extension tests + E2E smoke). |
| 2026-05-31 | ADR-009 + Phase B workspace-scope observations shipped | **Resolved ADR-008's open question + built Phase B end-to-end.** Founder decision 2026-05-31: workspace-scope observations are a distinct stream from Briefing Patterns (the "YES" path from the ADR-008 §"Correction note" decision tree), with one shared-infrastructure constraint — the Briefing's Voice Document is extracted into `src/lib/voice/` so both streams write in the same voice. **ADR-009 ships** as the canonical record (`deliverables/adr/adr-009-workspace-scope-observations-2026-05-31.md`); ADR-006's Phase-B-absorption clause is now superseded; canon Part II.5 §7 Phasing block reframes Phase B; §4.21's "Phase B supersession" note re-reversed; the heartbeat skeleton description updated to name the four registered generators. **The build itself shipped in 10 waves on a single branch** (single PR): generator authoring tooling (`Generator` interface + registry + dedupe contract); structured Voice Document module (`src/lib/voice/`) — banned-vocab + structural-rules + hedging-rules as TypeScript so generators + future Briefing synthesis BOTH validate against the same canonical rules; four SQL-only heartbeat generators registered in `supabase/functions/heartbeat/`: `deal_decay` (stalled deal at same stage with no dated next step), `signal_decay` (watched account silent ≥ 14 days), `proof_staleness` (proof past readout date with `outcome_state = 'open'`), `discovery_rhythm` (fewer than one logged discovery session in past 7 days); Dashboard "this week's reads" card slotted into the existing 3-mode rail (Brief / Spotlight / Queue) with a subtle inline 14d/7d pill toggle that persists in `localStorage` (`gtmos_dashboard_decay_threshold`) — the toggle is a display filter, not a generator threshold (the deal_decay generator always fires at 7d with stable dedupe keys, supersession not append); cross-deduping hook against active Briefing Patterns (no-op until Patterns ship — the Dashboard card consults a `BriefingPatternIndex` reader that returns empty today, suppression logic exists, lights up when B.X lands); E2E smoke + voice-validator spot-check fixtures. **What this is NOT:** not a CRM, not a redesign of any shipped room (only Dashboard gets a new card slotted into existing structure), not a Briefing competitor (different subject + cadence + cost + surface; the Voice Document is what keeps them coherent). **Cost discipline:** workspace observations are SQL-only, no LLM, ~200 narrow queries per 30-min tick at 50 active workspaces × 4 generators. Negligible relative to Briefing's Recipe Layer budget. **Next under rigid ordering:** verify the Dashboard card end-to-end on antaeus.app (founder action); then either Phase C (Skills layer) per ADR-004 §Phasing, or the Tier 2-4 data-parity retrofit per ADR-005 — both unblock the next visible payoff. |
| 2026-05-29 | ADR-008 orchestration doctrine + additive boundary | **Closed a canon hole, not a code change.** The orchestration layer (ADR-004, Phase A shipped 2026-05-19) originated in a founder↔Claude review of Alex Krentsel's talk *"Principles for Autonomous System Design: OpenClaw Deep Dive"* (UC Berkeley, May 2026). The *outputs* of that conversation landed in canon Part II.5 §7 + ADR-004 (session model, heartbeat, observations ledger, the five-rule CRM-line defense). The *source*, the *thesis*, and — critically — the *rejected-list* never got recorded. A future session reading canon saw the orchestration phases without the framing that keeps them **additive**. ADR-008 closes that. **What it locks:** (1) the thesis — *"the intelligence of a system is in the orchestration layer, not in the rooms"* — added to canon Part I §1 as a one-line orientation; (2) the **additive boundary**: the orchestration layer sits BENEATH the shipped rooms and never redesigns them; a proposal to restructure any shipped surface in the name of orchestration work is a red-flag-stop-and-escalate; (3) the **Briefing room is explicitly out of scope** for orchestration changes — founder confirmed *"I like where the briefing room is ... and don't want to change it"* on 2026-05-29; (4) the **rejected list** (connectors layer / open-ended self-modification / "code quality is dead" / security-through-reasoning / runtime-LLM-in-skills) so no future session re-proposes them as "OpenClaw alignment." **Corrected a stale phase definition in the process:** ADR-004's original "Phase B" (standalone signal-decay generator + Dashboard "this week's reads" card) was already SUPERSEDED by ADR-006 — the Briefing absorbed it; signal-decay became a Trigger type; the Briefing's Recipe Layer Patterns ARE the world-scope observations. ADR-008's phase table records that accurately rather than re-asserting the retired plan. **Flagged one genuinely open question for the founder (NOT resolved unilaterally per Part IV §4):** the Phase A `observations` ledger was scaffolded for *workspace-scope* observations (the operator's own deals/signals/patterns), which is a distinct stream from the Briefing's *world-scope* Patterns. Open: build a separate workspace-scope observation stream (heartbeat generators → `observations` ledger), or point the Briefing's Watchlist Trigger grammar at the operator's own accounts and call it covered? Settle before any Phase C+ work assumes an answer. **Source transcript preserved** at `deliverables/openclaw/openclaw-inspiration-transcript-2026-05-22.md` with a provenance header. **Then, attempting to "continue Phase 4.5 Tier 1," caught + corrected a stale-canon mistake from earlier the same session:** the Part V §1 Checkpoint 2 row read "⏳ pending," but git history (#142/#147/#149) + the flag registry showed **Signal Console was fully retrofitted (all 5 steps) on 2026-05-23**, Deal Workspace was cloud-native since Phase 4 (PR #8), and Outbound Studio was already cloud-resident. So this session's earlier #202 (SC audit) + #204 (DW audit) were redundant re-audits of finished rooms, and #203 + #206 added net-new-but-unwired additive schema. Founder directive: "correct the records." This PR now also fixes the Checkpoint 2 row to ground truth, adds a stale-row correction note + a lesson ("verify retrofit state from git history + the flag registry, not this time-sensitive table alone"), corrects ADR-008's own phase table, and adds a §"Correction note" to ADR-008 cataloging each redundant PR. The additive schema from #203/#206 is left in place (reverting applied migrations is more risk than value; unwired but available). **Files:** ADR-008 (doctrine + phase table + correction note) + canon Part I §1 thesis line + Part V §1 Checkpoint 2 correction + ADR README table (backfilled 006/007) + correction banners on the two redundant audit docs + this entry. No code, no schema changes, no room changes. **Next (re-pointed off the corrected map):** Tier 1 is effectively done, so the genuine frontier is the workspace-scope-observations open question (founder decision, flagged in ADR-008) + Phase C (Skills) — the largest unbuilt orchestration layer. |
| 2026-05-23 | Briefing room scoped + ADR-006 + spec promotion | **The biggest doctrine shift since ADR-005.** Founder shared 13 spec documents (~9,000 lines) authored 17 May 2026 specifying a substantially evolved Signal Console concept: provocative posture (Coverage / Framing / Defensibility obligations beyond the responsive baseline); multi-stage LLM pipeline (Context Hydration → Ingest → Filter → Enrich → Periphery Detection → Cluster → Synthesize [Draft/Critique/Revise/Quality Gate] → Contrarian Synthesis → Score → Surface → Briefing Compose); five Trigger types with NL parser; Voice Document with 5 exemplars + banned vocab + structural rules + hedging rules; Evaluation Harness with pre-merge gates + production sampling + retroactive scoring; GTM OS Read Interface Contracts where every other room exposes `getState()`; Intelligence Coverage Audit; End-to-End Walkthrough proving the spec against worked-example data; Audit Envelopes wrapping every synthesis. **Founder direction on the four open questions (locked):** (1) the new room is named **Briefing**, not Signal Console v2 — the existing `/signal-console/` keeps its name and its job; (2) **path C** — substrate + surface split: existing Signal Console is the data substrate (accounts, signals, heat, cross-room handoffs we just retrofitted through Step 5 / PR #149), the Briefing is the intelligence surface that hydrates from substrate + every other room's `getState()` adapter (legacy localStorage shapes for non-retrofitted rooms; each adapter flips to cloud shape when its room hits Step 5 with zero Briefing-side code change); (3) full Recipe Layer v0.4 scope ships **to the extent path C does not force compromises** — anything that requires Supabase reads from a non-retrofitted room holds with a degraded-mode banner; (4) promote all 13 spec files to `deliverables/specs/briefing/` as canon-level artifacts now. **What this PR ships:** spec promotion (13 files preserved as authored + `00-naming-note.md` documenting the Signal Console → Briefing rename); **ADR-006** (`deliverables/adr/adr-006-briefing-room-2026-05-23.md`) recording the naming + path C + scope + Phase B supersession decisions; canon updates — new §4.21 Briefing room mind locking the provocative posture as canon, §6 compounding rules updated to record that Briefing reads from every room via `getState()` contracts and writes back via `recommended_moves[].destination` drafts only. **Phase B supersession:** ADR-004 §"Phasing" defined Phase B as register-signal-decay-generator + Dashboard "this week's reads" card. That scope retires. Briefing absorbs Phase B entirely; signal-decay becomes one special case of the broader Trigger grammar (silence + threshold triggers). Patterns produced by the Recipe Layer ARE the observations Phase A's `observations` table was scaffolded for, but at much higher quality with audit envelopes attached. **Voice critique landed:** founder called out the canon §4.7 Purpose line ("the live radar where account heat becomes real work / convert signals into ranked motion") as exactly the gummy-voice failure mode canon Part III §11 bans. Per Part IV §4 mind-correction protocol, the §4.7 rewrite is proposed but NOT committed without explicit founder ack — left for the next session. **Tier 1 retrofit work continues in parallel:** Deal Workspace + Outbound Studio Phase 4.5 work is NOT paused. Each room's Step 3 grows a `getState()` shim alongside dual-write. The Briefing benefits as each room ships. **Open questions deferred to the build phase plan:** Pattern storage (extend `observations` or new `briefing_patterns`?); pipeline runtime (Edge Function on pg_cron like the heartbeat, or separate background-job service?); LLM provider abstraction; voice document editing UI location; behavioral feedback module shape; briefing cadence default; multi-user readiness. **Next under rigid ordering:** merge this PR (spec promotion + ADR + canon update); author `deliverables/specs/briefing/01-build-phase-plan.md` (phases B.0 through B.9 per ADR-006); begin B.0 (schema + skeleton room + HydratedContext adapter shells). |
| 2026-05-20 | Phase 4.5 ADR-005 approved + Checkpoint 1 (Data Parity setup) shipped | **The long path between Phase A and Phase B is now scoped + foundationed.** Phase B kickoff conversation surfaced a gap Phase A papered over: the heartbeat is live in production but the data the heartbeat needs to think about still lives in operators' browsers. Phase 4 rebuilt 17 rooms onto Preact+TS, but kept persistence in localStorage; the data-client from Phase 2.2 + per-noun Supabase tables from Phase 2.1 exist but rooms don't actually write through them. The only Supabase rows for most nouns are the 2026-04-24 migration blob — a frozen jsonb snapshot drifting further from reality every day. Founder's call: **"i want you to take the long path that puts us in the best long run position. we are not in a rush. explain what that would imply."** Three options framed: (A) build first generator against the migration blob — fastest; (B) migrate Signal Console to native Supabase rows first — medium; (C) different first generator on data already in Supabase — sidestep. Founder picked B but with the long-path framing: not Signal Console only, but full retrofit of every Phase 4 room before Phase B observable payoff lands. **ADR-005 (Data Layer Parity / Phase 4.5) drafted, founder-approved 2026-05-20, merged to main as PR #135 (squash `0692b6b`).** What ADR-005 locks: the 5-step per-room retrofit lifecycle (audit → schema → dual-write → flip-read → drop-legacy), schema design principles (additive over redesign, FKs where references are real, defensive nullable columns), feature-flag model (`<room>_data_parity_write` + `_read` per room + master `data_layer_parity_complete`), room priority order (Tier 1 trio Signal Console → Deal Workspace → Outbound Studio is the Phase B gate; Tier 2-4 follow), per-PR ephemeral Supabase branch CI gate, demo mode boundary (demo workspaces stay localStorage-only; generators only observe real workspaces), migration blob deprecation timeline (archived not deleted), session focus tracking as parallel workstream (rooms can call `setFocusedObject()` ahead of full retrofit). Four resolutions locked at approval: (1) Tier 1 ordering approved as proposed; (2) schema-types regeneration machine-generated only via `supabase gen types typescript --linked`, Phase 2.2 hand-edit pattern retired; (3) service account `ci@antaeus.app` confirmed, PAT stored as `SUPABASE_CI_PAT`; (4) PRs #43 + #44 (2026-05-01 cloud-sync gap-closers) resolved to option (a) — fresh complete dual-write pass per ADR-005 lifecycle; legacy code retires during Step 5 of each affected room. **Checkpoint 1 (Data Parity setup) shipped on `claude/data-parity-checkpoint-1-setup` (PR #136 open).** Three commits: (a) `532f60a` foundation — `src/lib/data-client-demo-local.ts` localStorage-backed `NounAccessor` factory under `gtmos_demo__<table>` keys + no-op subscribe; `createDataClient({ mode })` accepting `auto` / `supabase` / `demo-local`, auto-detection via `sessionStorage.gtmos_env_mode === "demo"`; `src/lib/data-parity-flags.ts` centralized registry (17 rooms × 2 flags + master umbrella) with `isDataLayerParityComplete()` + `isRoomParityWriteEnabled(room)` + `isRoomParityReadEnabled(room)` helpers; `.github/workflows/data-parity-ci.yml` per-PR ephemeral Supabase branch workflow with path filter on schema + typed client surface + label `data-parity`; `.github/workflows/data-parity-branch-janitor.yml` daily cron at 03:00 UTC sweeping stranded `pr-<num>-run-<id>` branches with safety rules (only pattern-matched branches, only when linked PR closed or branch older than 24h); `docs/founder-data-parity-ci-setup.md` six-step click-by-click for `ci@antaeus.app` + PAT + GitHub secret + GitHub variable + Posthog flag + verification PR; `package.json` `test:realtime` script (`playwright test --grep @realtime --pass-with-no-tests`); 28 new unit tests across `data-client-demo-local.test.ts` (CRUD + filter / order / limit + storage namespace + demo mode detection) and `data-parity-flags.test.ts` (registry shape + flag uniqueness + helper defaults). Test count delta: 1821 → 1849. (b) `651602c` graceful-degrade gate — first CI run on PR #136 surfaced a chicken-and-egg: the data-parity workflow's path filter matched on this very PR (because it introduces the workflow file plus `data-client.ts`, `data-client-demo-local.ts`, `data-parity-flags.ts`), so the workflow tried to provision a Supabase branch but the founder setup (`SUPABASE_CI_PAT` secret) hasn't been completed yet, so the provision step failed. PR description called this out as expected behavior but surfacing a hard failure on the very PR that LANDS the workflow file isn't useful. Fix: added a second gate to the "Should run data-parity CI?" job that checks `[ -z "$SUPABASE_ACCESS_TOKEN" ]` (the secret read into an env var, checked for emptiness without ever logging the value) and emits a workflow-level warning + skips all downstream jobs cleanly when unset. Same gate applies to any retrofit PR opened before founder setup completes. (c) `4855bb3` janitor cleanup — removed an abandoned `<<'PY'` heredoc block left over from a draft alongside the real `python3 -c "..."` invocation in the janitor workflow. No behavior change. **What's NOT in this PR:** no room retrofit yet — Signal Console Step 1 (audit doc) is Checkpoint 2 / the next PR after PR #136 merges + founder completes setup. The Checkpoint 1 PR itself doesn't actually exercise the per-PR Supabase branch workflow end-to-end; that happens on the first retrofit PR. **What needs founder action before Checkpoint 2:** walk `docs/founder-data-parity-ci-setup.md` Steps 1-6 (~25 min) — create `ci@antaeus.app` Supabase account; generate PAT `antaeus-gtm-os-ci-202605`; add `SUPABASE_CI_PAT` to GitHub Actions secrets; add `SUPABASE_PROJECT_REF = wjdqmgxwulqxxxnyuzyl` to GitHub Actions variables; create `data_layer_parity_complete` Posthog flag (default off, 0% rollout); verify with a one-line test PR touching `supabase/migrations/` to confirm the workflow runs end-to-end. **Next under rigid ordering:** merge PR #136; founder completes setup; Checkpoint 2 begins with Signal Console Step 1 audit. |
| 2026-05-20 | Phase A of the orchestration layer (ADR-004) — live in production + Vault pivot | **The heartbeat is firing in production. The system now has a pulse.** Founder walked the 4-step production rollout I drafted at the end of the 2026-05-19 session: (1) apply the three migrations to main via `supabase db push --linked`; (2) deploy the Edge Function via `supabase functions deploy heartbeat --no-verify-jwt`; (3) configure the runtime config the cron will read; (4) uncomment + run the `cron.schedule(...)` call. Steps 1, 2, and 4 went cleanly. Step 3 surfaced the only real doctrine fix in the rollout: **the original migration documented an `alter database postgres set app.heartbeat_url = ...` / `app.service_role_key = ...` pattern paired with `current_setting('app.*')` in the cron body. That doesn't work on Supabase** — the `postgres` role exposed via the SQL Editor lacks the superuser privilege required to alter database-level parameters (error SQLSTATE `42501: permission denied to set parameter "app.heartbeat_url"`). Pivoted to Supabase Vault, which is the canonical pattern for a secret a pg_cron job needs to read at execution time: (a) `select vault.create_secret('<service-role-key>', 'antaeus_service_role_key', '...')` stores the bearer; (b) the cron body hardcodes the function URL (not a secret — the function is publicly invokable; authorization is what protects it) and reads the bearer via `(select decrypted_secret from vault.decrypted_secrets where name = 'antaeus_service_role_key')`. **End-to-end verification in production:** `vault.create_secret` returned uuid `e13c988f-3754-41f9-9eb6-c89026d7b74b`; `cron.schedule('antaeus-heartbeat', '*/30 * * * *', ...)` returned jobid `1`; `select * from cron.job where jobname = 'antaeus-heartbeat'` confirmed `active = true`; a manual `net.http_post(...)` to the heartbeat URL fired a request, and `net._http_response` recorded a row with `status_code = 200` and the Phase A skeleton report JSON in `content` (`{"ok":true,"workspaces":0,"generators":0,...}`). `workspaces:0` is expected — no workspace has had session activity in the last 7 days yet (the session model is brand new and no room writes to it yet); `generators:0` is the Phase A skeleton invariant. **Migration repair gotcha:** the schema rows had been applied directly via the SQL Editor in a prior session, so `supabase db push --linked` first reported "Remote database is up to date" (correctly — schema present) but the CLI migration tracker hadn't been told. Used `supabase migration repair --status applied 20260519180000` for each of the three migrations to sync the tracker; subsequent `db push --linked` then reported clean. **Doctrine fix committed** as `7af0974` on the Phase A branch (follow-up to the 2026-05-19 commits): updated the commented-out block in `supabase/migrations/20260519180002_heartbeat_schedule.sql` to show the Vault pattern + a hardcoded URL placeholder; updated `supabase/functions/heartbeat/README.md` Schedule (pg_cron) section to match; added an explainer block to both files spelling out why `alter database postgres set app.*` doesn't work on Supabase, the rotation pattern (`vault.update_secret(<uuid>, <new-key>)` — Vault is read at every fire so no re-scheduling required), and the actual verification queries (cron.job presence check + manual `net.http_post` trigger + `net._http_response` recent-rows inspection). The 2026-05-19 session-log row above stays as historical record of what we believed at the time; the canon-correct Part V §1 callout in this document was edited to point at the Vault pattern. **Security note carried forward to operator-facing TODO:** the service-role key was visible in screenshots shared during the production rollout. Founder should rotate the service-role key via Project Settings → API → Reset, then `vault.update_secret('e13c988f-3754-41f9-9eb6-c89026d7b74b', '<new-key>')` to update the Vault secret; the cron picks up the new value on its next fire automatically — no re-scheduling required. **Phase A status at end of session:** branch `claude/orchestration-phase-a` carries six commits (five from 2026-05-19 — schema / session / observations / heartbeat / canon — plus today's `7af0974` doctrine fix), ready to merge to main. Live infrastructure in production: `workspace_sessions` + `observations` tables with RLS exist; the heartbeat Edge Function is deployed; the cron is firing every 30 minutes; observations ledger writes are gated to the service role and ready for Phase B generators. **Next under rigid ordering:** rotate the service-role key; merge the Phase A branch to main; begin Phase B — register the signal-decay generator + ship the visible Dashboard "this week's reads" card (the first observable payoff for operators). |
| 2026-05-19 | Phase A of the orchestration layer (ADR-004) — invisible foundation shipped | **The system gets its own voice.** Phase A of the orchestration layer landed on `claude/orchestration-phase-a`. Five checkpoints, each its own commit: (1) Schema — `workspace_sessions` + `observations` Supabase tables with RLS, indexes, Realtime publication, `dismiss_observation` RPC + ADR-004 doctrine doc; (2) Session model — `src/lib/session/` with FocusedObjectType / RoomId / ActionVerb enums + parseSessionAction defensive parsers + bootSession/setFocusedObject/clearFocus/pushRecentAction/applyRealtimeUpdate helpers + signal layer (session/isSessionLoaded/focusedObject computed) + 39 unit tests; (3) Observations infrastructure — `src/lib/observations/` with reader (listObservations + listObservationsForObject + dismissObservation RPC wrapper) + writer (dedupe-scan → optional supersession → insert → backfill superseded_by) + runGenerator wrapper + 19 unit tests; (4) Heartbeat — `supabase/functions/heartbeat/` Deno Edge Function with empty REGISTERED_GENERATORS + active-workspace filter (7-day session-or-observation activity) + per-workspace/per-generator error isolation + structured HeartbeatReport response + pg_cron schedule migration `20260519180002` (commented out — founder uncomments after deploy + setting `app.heartbeat_url` + `app.service_role_key`); (5) Canon — new Part II.5 §7 documenting the orchestration layer + Part V §1 callout naming Phase A as shipped 2026-05-19. **Test count delta:** 1763 → 1821 (+58). **Visible UI change:** none — Phase A is invisible to operators by design. **Doctrine shift documented:** the "what the system writes is not what a CRM writes" five-rule defense in ADR-004 + canon Part II.5 §7. **Foundation set for Phase B:** the first generator (signal-decay detection) + the visible Dashboard "this week's reads" card. The infrastructure for the system to have a heartbeat, write its own observations, and surface them is now in place; subsequent phases ship the visible payoff. |
| 2026-05-18 | Phase 5 of 2026-05 navigation-intelligence roadmap — Static public face closed end-to-end | **All four Phase 5 sub-PRs shipped under rigid ordering.** PR #110 Phase 5.1 landing (`start.html` bright re-skin + Marcus Reed visitor persona artifact + visitor-face rubric extension with walks A/B/C + tests 4/5); PR #111 Phase 5.2 auth pages bright re-skin (login/signup/forgot/reset/callback + auth-chrome system + Sarah-returning copy refresh + Trust Annex compliance on forgot-password); PR #112 Phase 5.3 privacy + terms bright re-skin (legal substance preserved verbatim — 17 privacy + 19 terms sections; canon chrome sticky with backdrop blur); this PR Phase 5.4 `/why-antaeus/` (new positioning page — category boundary IS/IS-NOT panels with 7 items each verbatim from canon §1, 4-step loop rail naming the sacred nouns, buyer-lock 3-cell panel buyer/fear/aspiration). **Total Phase 5: 43 new Playwright tests (7 + 16 + 9 + 11), all green; 1688 vitest unchanged (static-page only PRs); typecheck clean throughout.** **What the arc delivered:** every public-facing surface (landing → auth → legal → positioning) now renders bright per canon Part II §1 (retired the last 5 dark holdouts: `start.html`, `privacy.html`, `terms.html`, `auth/callback/` which loaded /css/app.css, and the dark hero variant on `forgot-password.html`); same wordmark + back-pill chrome across every surface (visitor↔operator boundary visually continuous); copy reshaped against the right persona at each layer (Marcus Reed visitor for landing/privacy/why-antaeus; Sarah Chen returning for auth); progressive-disclosure path from landing → /why-antaeus/ for visitors who want more than the 90-second scan; Test 4 (category) + Test 5 (trust) hard-asserted in Playwright so no AI-powered / world-class / supercharge / trusted-by language can leak in. **Doctrine adjustments this arc:** the bright-only direction (canon Part II §1, locked 2026-04-27) now applies to **100% of public-facing surfaces** including legacy static HTML pages; dark exception is fully retired. The visitor persona doc (Marcus Reed) sits alongside Sarah Chen as a peer artifact — Sarah for in-product audits, Marcus for visitor-face audits; the two never compete. **Pre-beta hygiene reconciled:** every footer/chrome link in the public face routes back through `/start.html` as the canonical visitor entry, not `/` (which is the smart router). **Next under rigid ordering:** Gate down → beta. Phase 5 was the gate-down prerequisite per canon §7; with all 4 sub-PRs landed, the pre-beta gate (`coming-soon.html` + Cloudflare Worker `GATE_ENABLED=true`) is the only thing standing between the public and the product. Decision to disable the gate is the founder's. |
| 2026-05-18 | Phase 4 of 2026-05 navigation-intelligence roadmap — Negotiation room rebuild closed end-to-end | **The Negotiation room (canon §4.16b) graduated from placeholder to live, Phase-2-rubric-compliant Live Instrument.** Single branch, single PR. Locked decisions (founder, this session): (1) expand CounterpartyRole from 4 → 6 by adding VP Finance + InfoSec — AI-native B2B post-eval gates now routinely include security review and unit-economics interrogation, not just CFO + procurement + legal; (2) approved Claude's best-read for ten ask-moments — pricing_position / discount_request / terms_and_payment / contract_length / auto_renewal / indemnification / security_review / rampup_schedule / expansion_commitment / decision_deadline; (3) script content for the three new counterparties inferred from Discovery Studio framework families (Legal/GovTech for GC; AI-native + Data-Intelligence for InfoSec; Sales/Revenue-Intel + Manufacturing for VP Finance) rather than authored from scratch — three pushback templates per counterparty matching each role's actual pressure shape (VP Finance asks about CAC payback + gross-margin impact + unit economics; InfoSec asks about SOC 2 Type II + data residency + pen-test reports); (4) no triptych exploration — Phase 2 rubric is the design lock; (5) Phase 4 includes all sibling-room handoff additions. **What shipped in this PR:** (a) `src/negotiation/lib/types.ts` adds AskMoment type + ASK_MOMENT_LABEL + EMPTY_NEGOTIATION.askMoment default `pricing_position` + the two new CounterpartyRole values; (b) `src/negotiation/lib/seed-scripts.ts` adds SEED_PUSHBACKS_VP_FINANCE + SEED_PUSHBACKS_GC + SEED_PUSHBACKS_INFOSEC (3 templates each) + ASK_MOMENT_OPENINGS (10 authored opening-line suggestions) + recommendedPushbackId(counterparty, askMoment) lookup; (c) `src/negotiation/lib/handoff.ts` is the new canonical writer (replaces the inline buildNegotiationHref in cross-room.ts that violated Invariant 8) with buildNegotiationHref + hrefToDealWorkspace/FutureAutopsy/AdvisorDeploy/PocFramework — all Invariant-8 compliant (no placeholder strings for focusObject); 16 new tests covering all 8 invariants; (d) `src/negotiation/state.ts` adds setAskMoment that refreshes the opening-line suggestion only when the operator hasn't authored their own; (e) `src/negotiation/components/Topbar.tsx` gains the Phase 2-pattern contextual kicker tail (NEGOTIATION · {deal} · {counterparty} · {ask-moment} · {count} on file) matching Settings + Dashboard kickers; (f) `src/negotiation/components/RouteRack.tsx` expands counterparty button grid 4→6 + adds full-width AskMoment selector cell; (g) `src/negotiation/components/HandoffStrip.tsx` is the new bottom-of-room band with 4 verb-shape CTAs (Update the deal primary / Pre-mortem this deal / Carry to an advisor / Sharpen the proof) matching Phase 2.6 DW + Phase 2.5 Discovery patterns; (h) `src/negotiation/components/OutcomeRack.tsx` retires its inline handoff CTAs (now consolidated in HandoffStrip); (i) `src/negotiation/main.tsx` reads full continuity context via readContinuity() and falls back to focusObject name-match when `?deal=` is missing; (j) `src/negotiation/lib/cross-room.ts` slimmed to read-only (loadDealsForLinking + readInboundDealId). **Sibling-room handoff additions:** (k) Deal Workspace HandoffStrip gains a "Rehearse the negotiation" CTA — the previously-3-CTA strip is now 4; new hrefToNegotiation builder threading `?deal=` + account focus + 2 new tests; (l) Advisor Deploy SecondaryStack rolodex's handoff row gains "Rehearse the negotiation" + new hrefToNegotiation builder; (m) PoC Framework RouteRack gains "Rehearse the negotiation" ghost CTA + new hrefToNegotiation builder threading optional deal id; (n) Future Autopsy action-plan router gains negotiation as a 5th target — when stage is `negotiation` or `verbal-yes`, primary action becomes "Rehearse the negotiation" with context-aware reason copy ("Verbal-yes stage — terms are now the live conversation." vs "Negotiation stage — rehearse before pricing or terms land."). **Cross-room compounding lit:** the canon §4.16b triangle Deal Workspace ↔ Negotiation ↔ Advisor Deploy is now bidirectional and HandoffStrip-anchored on the Deal Workspace + Negotiation sides; PoC Framework ↔ Negotiation lets proof state carry into terms conversations; Future Autopsy → Negotiation routes losing late-stage deals to the rehearsal desk. **Tests:** 1688/1688 vitest (18 new — 16 handoff invariant tests + 2 cross-product DW handoff tests; the existing negotiation-bridge test got the new required `askMoment` field added to its sample fixture); 68/68 Playwright (7 new — counterparty count + ask-moment count + contextual kicker + 4-CTA HandoffStrip + DW→Negotiation seam threading + URL-inbound auto-select + counterparty-switch pushback refresh); typecheck clean both projects; Vite build green. **Open question for next session:** Phase 5 next under rigid ordering — static public face (landing + auth + privacy + category framing) → gate down → beta. ADR-001 §6 Phase 5 is in scope but the Phase-2 rubric applies (Sarah CRO persona + verb-shape CTAs + Invariant 8) so the static pages get their own walk before the gate drops. |
| 2026-05-18 | Phase 2 of 2026-05 navigation-intelligence roadmap closed end-to-end | **All ten Phase 2 sub-PRs shipped under rigid ordering.** PR #97 Phase 1 method lock (3 audit artifacts + canon §7); PR #98 Phase 2.1 Foundation new-account flow; PR #99 Phase 2.2 Tuesday-morning Dashboard; PR #100 Phase 2.3 Strategy flow (ICP → Territory → Sourcing → Signal); PR #101 Phase 2.4 Outbound flow (Signal → Outbound → LinkedIn → Cold Call → Call Planner); PR #102 Phase 2.5 Discovery flow + Discovery's first-ever HandoffStrip; PR #103 Phase 2.6 Recovery flow + Deal Workspace's first-ever HandoffStrip + localStorage fallback for dev/demo; PR #104 Phase 2.7 Synthesis flow + Quota Workback Invariant-8 sweep + new QW → Founding GTM card + Founding GTM's first-ever HandoffStrip; PR #105 Phase 2.8 Readiness slice (drawer hero drops totalScore + 15 gate-blockers rewritten in behavior-shape + Founding GTM topbar reads gtmos_readiness_last_verdict); PR #106 Phase 2.9 Trust flow Settings inbound continuity + back-pill + Invariant-3 safeReturnTo enforcement + contextual kicker tail; PR #107 Phase 2.10 integration walk closeout. **Total: 61 Playwright tests passing (35 new across the 10 PRs), 1627 vitest tests, typecheck clean both projects.** **What the arc delivered:** every room's outbound CTAs now route to the right destination room with full continuity wrap (returnTo + returnLabel + focusObject + focusRoom + fromMode + fromSurface); nav-action "Open X" labels retired in favor of verb-shape sales moves; ~12 placeholder-string Invariant-8 violations cleaned up (LinkedIn cue / Cold call prep / Quota pressure plan / ICP wedge — all retired in favor of empty=no-param); Dashboard / Discovery / Deal Workspace / Founding GTM all picked up a HandoffStrip where they had zero outbound affordance before; readiness-verdict gate-blocker copy moved from internal math vocab ("X below 14/20") to behavior-shape verbs ("Tighten ICP & targeting — it's the weakest dimension."). **Phase 2 closeout gate (the integration walk, PR #107) is the proof the seams hold across flow PR boundaries** — 7 scripted Sarah scenarios spanning first-90-seconds → Tuesday morning → strategy → recovery → synthesis → readiness → trust, all green. **Doctrine adjustments this arc:** none — the rubric + persona + continuity-param invariants locked in PR #97 held up across all 10 follow-on PRs without revision. **Next under rigid ordering:** Phase 3 (auth-UX standalone hardening, single PR), then Phase 4 (Negotiation room rebuild inheriting Phase 2.6 + Phase 3), then Phase 5 (static public face → gate down → beta). |
| 2026-05-01 | Phase 5 closed end-to-end + canon hygiene + refacing-vs-shipped audit bootstrap | **Phase 5 of ADR-001 is shipped.** Three PRs landed: PR #47 Phase 5.A Readiness Score rebuild (4 waves: pure verdict-as-gates engine library; Anchor + Drawer overlay components; Dashboard topbar wiring + cloud verdict-history persistence to `readiness_snapshots` with 5→3 column-enum mapping; legacy `/app/readiness/` redirect stub with `?readiness=1` auto-open hint); PR #48 Phase 5.B Founding GTM rebuild merged into the (now-deleted) PR #47 head branch — squash-merge of PR #47 to main collapsed PR #47's commits into one and orphaned PR #48's content; **PR #49 was the recovery** that cherry-picked the 5 Phase 5.B wave commits onto current main and re-merged. PR #48 shows "merged" in the GitHub UI but its code never landed; PR #49 is the durable record of Phase 5.B (5 waves: greenfield scaffold at `/founding-gtm/` with 7 section frames; cross-room readers `loadSectionsInput()` over 10 cloud-mirrored localStorage keys; seven section authoring engines each producing 1-3 paragraphs of authored prose + concrete evidence + ONE cross-room SURPRISE callout; section-readiness publisher to `gtmos_founding_gtm_health` feeding Readiness's proof dimension + ceremony moment subscriber listening for upward verdict transitions into Inheritable-with-guardrails; legacy room redirect stub). Cross-room compounding lit by Phase 5: Founding GTM publishes section count → Readiness aggregator's `proof` dimension reads it → §4.17 "Hire-ready, repeatable" gate (sections ≥ 5/7) becomes reachable; Readiness writes verdict transitions to cloud → Founding GTM ceremony subscriber fires the §4.19 set-piece on first upward Building → Inheritable transition. **Doctrine corrections this session (founder caught real misframings):** (1) "The mind" is **cross-room connective tissue**, not per-room substance — what each room does (or doesn't) for the others; canon §6 compounding rules ARE the mind. (2) The app's **brain** is Readiness Score + Founding GTM as the synthesis layer that reads the mind and produces verdict + inheritance. (3) **Refacing covers the entire room** top-to-bottom — first-fold AND below-fold AND every modal/drawer/lens AND every state — not just the first-fold or just the visual treatment. The **mind is preserved**; the **structure changes drastically** per the picked triptych winner. (4) Phase 4 PR descriptions emphasize "faithful TypeScript port of legacy js/..." which is correct for the engine logic + cross-room wiring (the mind layer), but the audit needs to verify the operational shape matched the picked triptych winner rather than inheriting legacy first-folds. **Canon hygiene this PR:** Part V §1 callouts updated — Readiness + Founding GTM now record the Phase 5 ship dates (PR #47 + #49) instead of "Mind rewritten 2026-05-01, rebuild pending." Pre-beta hygiene line 1055 reconciled — CFO Negotiation + Content Builder no longer in the active room list (CFO Negotiation succeeded by §4.16b Negotiation placeholder; Content Builder retired in architecture-reset); auto-save on Founding GTM marked shipped via Wave 4 health-publisher effect. **New canon §4.16b Negotiation (placeholder)** added between Advisor Deploy (§4.16) and Readiness Score (§4.17) — Live Instrument family, rebuild owed; renamed from legacy CFO Negotiation; procurement + finance scripts from the legacy `antaeus_studio_cfo_v2` localStorage shape carried forward as the seed content; thesis is "negotiation as deliberate craft, every concession a deliberate move not a reflex"; cross-room compounding triangle Deal Workspace ↔ Negotiation ↔ Advisor Deploy on the high-pressure phase of a deal. **Refacing-vs-shipped audit bootstrapped** — `deliverables/audit/antaeus-refacing-vs-shipped-bootstrap-2026-05-01.md` covers Deal Workspace + Future Autopsy (the 2 rooms with explicit `-selected-` triptych files). Findings: both rooms preserve mind + nav + bright direction but show meaningful operational drift from their picked triptychs. Deal Workspace shipped a vertical stack of sections + overlay modal where variant B called for spine + 2-col stage-grid + target-folio with inline tabbed detail; Future Autopsy shipped tabbed forensic sheets where variant 01 called for stacked sentence-titled sheets ("a lit evidence surface, not a page"). Punch lists in the audit deliverable name the structural rework needed per room. Cross-cutting findings: (a) modal-overlay pattern is the most common drift signal — both rooms reach for full-screen overlays where the triptych picked inline detail; (b) sentence-shaped thesis copy is missing from both rooms — triptychs had authored sentence-shaped headers, ships have category-shaped topbar titles; (c) mind + Phase 7 nav doctrine held strong in both rooms. Audit format proven on these 2 rooms; the remaining ~18 rooms are queued for follow-up audit passes. **Open questions for next session:** (1) does the Deal Workspace folio refactor + Future Autopsy stacked-sheet refactor get prioritized as Phase 6 / refacing-completion arc? (2) for rooms without an explicit `-selected-` triptych (Welcome, Dashboard, ICP Studio, etc.), where does the picked-variant record live — per-room plan files, or open and owing fresh triptych exploration? (3) Signal Console + Quota Workback have NO triptych in the archive — the rebuild proceeded without one; were these named-asset-ish rooms shipped against an implicit triptych somewhere or was their shape designed inline? |
| 2026-05-01 | Cloud-sync gap closer + connective-tissue PRs + Readiness + Handoff Kit mind-rethink | **Doctrine shift:** §4.17 Readiness Score and §4.19 Founding GTM / Handoff Kit rewritten end-to-end after founder approval per Part IV §4. **Readiness:** dropped multi-dimension score-as-primary in favor of a 5-level **gate-based verdict** (You-are-the-system / Building / Inheritable-with-guardrails / Hire-ready / Hire-ready-repeatable) — gates are present-evidence checks, not threshold scores. Reframed as a **maturity assessment** distinct from the dashboard's pressure rail (which answers "what to act on") and Future Autopsy (which answers "what's decaying"). Anchored on the dashboard topbar at all times (verdict label + chevron); click opens a single-fold drawer overlay, not a route. Dimension scoring stays internal as the math but is no longer the first-fold story. **Founding GTM:** dropped the export framing entirely (vestigial — cloud sync makes the workspace itself the inheritance vehicle). Reframed as the **living onboarding surface** the first hire opens on day one — authored opinion + cross-room synthesis, not aggregation. Replaced the legacy 6 sections with 7 authored sections each carrying a "surprise" callout that no single room could surface alone: (1) Who hits, who misses, why; (2) The rails that worked; (3) The questions that earned the next meeting; (4) Where deals are won + where they leak; (5) The losses we paid for; (6) Why we win; (7) Day-one operating rhythm. **Ceremony moment:** when Readiness verdict transitions UP from Building → Inheritable-with-guardrails for the first time in a workspace, fire a set-piece moment in the Founding GTM room (animated reveal, kit count moving, serif headline "the kit just became real," one-time share-link CTA). Once-per-workspace per upward transition; downward transitions silent. **Cross-room "surprise" reads** locked as primitives — closed-deal pattern × ICP mismatch (§1), rails-not-tried (§2), Discovery segment-skip (§3), leaky stage × advisor-coverage gap (§4), loss-reasons × open-deals cross-ref (§5), abandoned-habit callout (§7). **Part V §1** legacy callouts updated: Readiness + Founding GTM now read "**Mind rewritten 2026-05-01**, rebuild pending" instead of "out of migration scope." **Earlier in the same session:** four cloud-sync PRs landed/queued — PR #43 (cloud-sync gap closer A1+A2+A3+A4: Outbound angles + Advisor registry + Signal Console manual-add + Settings cloud-sync visibility card); PR #44 (B1+B2+B3: attribution audit + boot-result UX feedback toast + offline retry queue with online/visibilitychange/30s-interval auto-flush); PR #45 (Phase 4 deletion sweep — replaced 18 legacy `/app/<room>/index.html` files with meta-refresh + JS location.replace stubs, net 23,732-line deletion; root index.html and runtime hrefs in src/ + test fixtures updated to point at new `/<room>/` paths; first 3 e2e smoke tests rewired to expect new paths). Founder confirmed live verification on antaeus.app for the per-room cloud sync. Doc-only canon PR carries this entry. **Open question for next session:** scope the Readiness rebuild + Founding GTM rebuild as a Phase 5 sequence — likely after PR #43-#45 land on main. Static-pages polish (ADR-001 §6 Phase 5) can run in parallel since the readiness/handoff rebuild is room-level, not infra. |
| 2026-04-28 | Phase 4 closed: Rooms 11–17 shipped + PoC Framework bright flip + canon doctrine update | **Phase 4 of ADR-001 is complete.** Seven open PRs landed end-to-end in ~2 hours of founder review + per-PR CI cycles, then a deferred face-flip + canon-alignment PR cluster: (1) Room 11 ICP Studio (#28) — Decision Bench, originally shipped with a dark hero, founder directive flipped to bright cream-gradient hero with orange left-rule + canonical bright-palette adoption (blue `#2563eb` / green `#22c55e` / amber `#f59e0b` / red `#ef4444`); (2) Room 12 Territory Architect (#29) — Decision Bench, fully bright, 4-tier accounts + 300-cap allocation grid; (3) Room 13 Sourcing Workbench (#30) — Decision Bench, bright, 5-stage Kanban + faithful `getProspectQuality` port + Codex P1+P1 follow-up addressing legacy queryCard/prospect data-shape compatibility (filters{} → derived query, `name` → `accountName` fallback, parked/rejected → dropped fold-in); (4) Room 14 Quota Workback (#31) — System Ledger built **bright not dark** per founder directive (overrides §4.6 prior wording) + faithful `calc()` port + `computeCoverage` subset port + Codex P1+P1+P2 follow-up (coverage recompute effect + targetMultiple gap math + initial save before persist effect); (5) Room 15 Settings (#32) — Trust Annex, bright, 4-card layout + `buildBackup`/`applyBackup`/`clearWorkspace` over `gtmos_*` keys + Codex P1+P1 follow-up (canonical demo flag `sessionStorage.gtmos_env_mode` + `gtmos_demo__*` namespace exclusion in clearWorkspace + bootstrap script load); (6) Room 16 Welcome (#33) — Threshold, bright, 4-anchor milestone ladder + ranked next-action stack + Codex P1+P1 follow-up (legacy `/app/<room>/` paths for ACTION_QUOTA/ACTION_BACKUP since those rooms hadn't merged yet at review time); (7) Room 17 Onboarding (#34) — Threshold, **greenfield rebuild not a port**, behavioral-spine 7-step flow with Endowed Progress Effect + Implementation Intentions + dominant move per surface + Codex P1+P1+P2 follow-up (canonical `gtmos_onboarding.completed=true` shape so `js/workspace-guard.js` detects completion + ICP/account merge instead of overwrite + JSON-encoded category for legacy readers). All 7 PRs squash-merged in sequence; each subsequent PR rebased against the new main with Welcome's + Onboarding's entries layered into `vite.config.ts` + `tests/e2e/smoke.spec.ts`. **Then doctrine alignment landed:** PR #35 flipped PoC Framework's dark forge to bright (`--poc-forge-bg` `#0a1c40` → `#ffffff` + token cascade + 4px orange left-rule on `.poc-forge` + heat-bar track recolor + per-room accent tokens aligned to canonical bright palette). **CLAUDE.md updates this same PR cluster:** Part II §1 "the one exception" subsection retired, replaced with "Bright-only — the dark exception is retired" (records the founder directive 2026-04-27 + lists current room state + acknowledges Readiness + Founding GTM are still dark on legacy and out of migration scope per ADR-002); Part II §4.6 System Ledger family rewritten ("dark is permitted and recommended" → "Bright field per Part II §1 — synthesis weight comes from typography + accent rules, not luminosity"); Part II §4.8 "Hybrid families (Decision Bench with dark hero)" marked retired; Part V §1 state table — `Phase 4 / Rooms 11-19 ⏳ pending` row replaced with 7 ✅ shipped rows + Phase 4 closeout doctrine row + Phase 4 overall close marker; the "Substantially refaced" list reorganized by composition family with current visual state per room. Open question for next session: when to start the Phase 4 deletion sweep (legacy `/app/<room>/` + `js/<room>-*.js` for the 17 migrated rooms — only after confirming all founders/operators are on the new rooms). Phase 5 (static pages polish) is the next phase per ADR-001 §6. |
| 2026-04-27 | Phase 4 / Rooms 9 + 10: Call Planner + Advisor Deploy Preact rebuilds — closed end-to-end + PR #25/#26 Codex reviews addressed | **Two more rooms within ADR Phase 4 complete (tenth + eleventh room migrations overall).** **Room 9 (Call Planner, PR #25, merged 2026-04-27 20:23 UTC):** six waves on a single branch. Wave 1: scaffold (typed PersonaKey/Outcome/SignalSummary/MatchedAccount/LinkedDeal/QualityGate/AgendaQuality/Draft/AgendaSnapshot/CallHandoffPayload + 21 state tests). Wave 2: persona banks (6 personas × 3 questions verbatim from legacy lines 631-661 + `unquoteQuestion` regex) + 5-gate quality engine (person 20 + persona 10 + context 20 + why_now 25 + advancement 25 + heat≥85 bonus 5, capped 100, bands credible/workable/thin, nextMove first-unmet priority chain) + advance ask + brief generator (55 new tests). Wave 3: witness form (contact / persona button row / LinkedIn URL / custom notes / linked-deal `<select>`) + dossier readout + 4-strip agenda (signal-driven opener / reason-now / 3 numbered probes / advance ask) + quality block with band-tinted pill. Wave 4: persistence over `gtmos_discovery_agenda` (defensive parser) + `gtmos_call_handoff` (outcome enum normalize + empty-linkedDeal-to-null) + `gtmos_discovery_stats` (advancedCalls only on `advanced` outcome per legacy line 1062-1064) + autosave effect (26 new tests). Wave 5: cross-room handoff (`buildCallPlannerHref` with continuity params + 3 destination convenience builders + `readInboundAccount` account-only with no focusObject fallback per PR #23 P2 fix) + `lib/account-loader.ts` reads `gtmos_sc_v4` with `"heat" in o` presence check + `lib/deal-loader.ts` reads `gtmos_deal_workspaces` supporting both array + object-of-deals shapes (27 new tests). Wave 6: legacy flag-redirect using post-PR-#24 event-listener pattern. Behind Posthog flag `room_call_planner_v2`. Final at merge: 786/786 vitest, 13/13 Playwright. **Naming asymmetry preserved:** canonical room name is "Call Planner" per canon §4.11; new room served at `/call-planner/`; legacy path remains `/app/discovery-agenda/`. PR #25 Codex review surfaced 1 P1 (the cold-load redirect needed a `gtmos:posthog-ready` event that didn't exist when Codex reviewed PR #25, but PR #24 had merged before Room 9 itself merged — so the comment was already mooted by the time Room 9 landed; verified by direct grep of `js/analytics.js` line 262 which dispatches the event after `posthog.init()`). **Room 10 (Advisor Deploy, PR #26, merged 2026-04-27 22:30 UTC):** six waves on a single branch. Wave 1 (`eda6361`): scaffold — typed TierId (4) / MomentId (10) / Advisor / DeploymentOutcome (7 incl. hold/reroute) / Deployment / AdvisorDeal / DealAdvisorEntry / DeskState / AdvisorDraft / GeneratedAsk / SpendBand / SpendRead / CooldownStatus shapes + 19 state tests. Wave 2 (`209bba6`): TIERS map (4 tiers verbatim from legacy lines 4-9: t1 Board/Investor 90d / t2 Strategic Advisor 30d / t3 Angel/Portfolio 14d / t4 Customer Reference 30d) + MOMENTS array (10 ask-moments verbatim) + cooldown engine (per-tier window + most-recent selection from advisor's deployments) + recommend logic (advisorsForDeal substring match + recommendedMomentForDeal stage + EB/champion/decisionProcess gate tree + recommendedAdvisor 3-tier preference: exact-cool beats exact-cooling beats first-registered) + ask-builder ([company]/[buyer] substitution + buyer fallback chain economicBuyer→champion→primaryContact→buyer→placeholder + customAsk override + forwardable note assembly) + spend-read (30-92 score: +15 deal +15 advisor +14 exact match +8 nextStepDate +8 EB-or-champion +5 non-intro moment, capped 92, 3-band classifier ask_ready/narrow_first/not_ready). 60 new tests. Wave 3 (`47ba0f2`): live desk-board UI — hero with band-tinted spend-read score (green/orange/red) + 3-cell route bar (Deal / Carrier / Ask moment, Carrier annotates exact-match) + desktop layout (dark navy proof blotter + 4-tab rolodex with rotating accent colors + rotated cream ask sheet with envelope-flap pseudo-element + editable textarea + 3 circular outcome stamps + 4-cell desk-edge footer). Money formatter + STAGE_LABELS map ported verbatim. Wave 4 (`50be05e`): persistence over `gtmos_advisor_registry` + `gtmos_advisor_deployments` (legacy `{advisors: [...]}` + `{deployments: [...]}` envelope shapes preserved with defensive parsers normalizing tier/relationship/outcome/momentId enums) + impact engine (4-cell stat grid carriers/coverage/loops/rate + 5-rule readline list Registry-first-red/Coverage-gap-orange/Follow-through-blue/Compounding-green/Clean-desk-green) + state extensions saveAdvisorFromDraft / logDeployment / updateDeploymentOutcome + persistence side-effects + DeskBoard stamps wired + SecondaryStack rebuilt with form + advisor list + loops + impact. 28 new tests. Wave 5 (`b99d4df`): cross-room handoff — `lib/deal-loader.ts` reads `gtmos_deal_workspaces` (camelCase + snake_case + `name` fallback for accountName per legacy line 124) with advisorHistory parsing + outcome enum normalization; `lib/sync-back.ts` mirrors the deployment effect onto the matching deal (replace-by-id advisorHistory entry + lastAdvisor* summary fields + nextStep/nextStepDate per outcome → step rules verbatim from legacy lines 478-512); `lib/handoff.ts` builds continuity-param URLs with pre-existing returnTo preservation + 3 destination builders (Deal Workspace / Future Autopsy / PoC Framework) threading URL-encoded `?deal=` + readInboundDealId with `?focusObject=` fallback. main.tsx loads deals + URL inbound + auto-fallback to first active deal. SecondaryStack handoff strip wired. 27 new tests. Wave 6 (`22790b6`): legacy flag-redirect using post-PR-#24 event-listener pattern. Behind Posthog flag `room_advisor_deploy_v2`. Final at merge: 917/917 vitest, 14/14 Playwright. **Codex review follow-up (this session):** PR #26 surfaced 2 P1 + 1 P2 review comments, all real bugs addressed in a follow-up PR alongside this canon entry: (P1) `state.ts` `setDealId` only updated `desk.dealId` and left `desk.customAsk` untouched, so an edited ask referencing Deal A persisted after switching to Deal B and `logDeployment` would have frozen the wrong-account ask into the deployment + advisorHistory mirror. Fix: setDealId now also clears customAsk when the dealId actually changes (same-id no-ops preserve the operator's edits). (P1) `lib/sync-back.ts` `nextStepFor` for `pending` outcome assigned `nextStepDate: addDaysIso(now, 3)` unconditionally, overwriting any already-set deal deadline every time a pending deployment was logged — silently corrupting planned next-step dates. Legacy lines 500-501 only filled both nextStep + nextStepDate when each was empty (`deal.nextStep = deal.nextStep || ...; deal.nextStepDate = deal.nextStepDate || addDaysIso(3)`). Fix: nextStepFor now takes the current nextStepDate explicitly and falls through to the existing value when set, only filling the +3d default when null. (P2) `main.tsx` URL inbound resolution only matched by `deal.id` so handoffs that pass account name in `?focusObject=` (e.g. PoC Framework's advisor-deploy CTA) ignored the intended target and fell through to "first active deal." Fix: introduced `resolveInboundDeal` that tries id first, then case-insensitive accountName match, then falls back. 4 new regression tests across state.test.ts (setDealId customAsk clear + same-id preservation) + sync-back.test.ts (pending preserves existing nextStepDate). Final after follow-up: 921/921 vitest, 14/14 Playwright, typecheck clean, Vite build green. Cross-room compounding lit: Room 1 (Deal Workspace) → Room 10 via `gtmos_deal_workspaces` (deal options + auto-select); Room 10 → Room 1 via the same mirror (advisorHistory + nextStep + nextStepDate writes on every logged/updated deployment); Room 10 → Deal Workspace / Future Autopsy / PoC Framework via continuity params + `?deal=` threading. Next: Phase 4 / Room 11 — ICP Studio (per ADR-001 §6 priority list, Decision Bench family with hybrid dark hero + bright work-area split per Part II §4.8). Standing directive remains: continuous build through Phase 4. |
| 2026-04-27 | Phase 4 / Room 8: LinkedIn Playbook Preact rebuild — closed end-to-end + PR #23 Codex review addressed (incl. systemic Posthog flag-redirect P1 across all 9 legacy rooms) | **Eighth room within ADR Phase 4 complete (ninth room migration overall).** Six waves on a single branch (`claude/phase-4-room-8-linkedin-playbook`) with local CI gates between each, opened as PR #23, all checks green, squash-merged. Wave 1 (`2cc12a1`): scaffold — typed `Cue` / `CueIndex` (0..4) / `ActionType` (5 enums) / `Outcome` (4 enums) / `Motion` / `MotionContext` / `ActionEntry` / `Draft` / `ChannelStats` / `AccountCounts` shapes + `ACTION_TYPES` / `ACTION_LABELS` / `OUTCOMES` / `OUTCOME_LABELS` / `EMPTY_DRAFT` / `EMPTY_STATS` / `EMPTY_ACCOUNT_COUNTS` constants. Source signals: `actions` (mirrored to `gtmos_linkedin_log` in Wave 4), `activeCueIndex` (null = let motion engine pick; pinned int wins), `draft`, `bestIcp`, `hottestAccount`, `latestTouch`, `loaded`. Computed: `stats` (total / connections / accepted / dms / replies + Math.round-percentage `acceptRate` + `replyRate` + case-insensitive `byAccount` per actionType). Action surface: setActions / appendAction / setActiveCue / patchDraft / setDraftActionType / setBestIcp / setHottestAccount / setLatestTouch / resetDraft / resetSession + test seed helpers. Root layout (Topbar / CueBooth / CueLedger / MethodSheets) + Vite multi-page entry + Playwright smoke + 13 state tests. Wave 2 (`021b990`): cue ladder + motion engine + scripts — `lib/cues.ts` ports the legacy `cues()` array verbatim (5 cues × name/label/color/action/title/copy/console). `lib/motion.ts` ports `getMotion(c)` with all 4 branches in priority order (warm_signal_account → convert_connection → add_air_cover → credibility default), the cueIndex bump (0 → 1 → 2 once a content_engage exists for the hottest account), the strict heat-zero parenthetical omission, and case-insensitive byAccount lookup via `accountCountsFor`. `lib/scripts.ts` ports `cueScript(cue, m)` (connection_request → connect-line / dm + name contains "Ask" → calendar-ask / dm + give-first → benchmark line / content default + add_air_cover motion → queue/forecast line / content default + other motion → response-time/tooling line) plus `METHOD_TEMPLATES` (4 reference templates verbatim from legacy lines 79-83). 34 new tests. Wave 3 (`83d575f`): live cue rail + dark stage + booth-read + method sheets — TalkLoom-equivalent built. 5-cue rail (LEFT) clickable strip with bulb halos, accent rule via `--lp-cue-color` from each `Cue.color` token; dark stage panel (CENTER, allowed to go dark per Part II §4.6 because the cue itself feels live + cinematic) with personalized cue script + 3-cell cue console (Say first / If they engage / If silent); booth-read aside (RIGHT) with score meter (`Math.max(28, Math.min(86, acceptRate + 40))` per legacy) + 3 read-blocks (Current cue / One-session win / Channel standard). Method sheets render the 4 templates as cards with `[token]` em-highlighting via a `highlightTokens()` split-on-bracketed-tokens helper + clipboard copy buttons that chain `.then/.catch` (avoids the PR #19 P2 un-awaited-write pattern). Wave 4 (`e70f0d4`): cue logging + persistence + activity board — `lib/persistence.ts` over `gtmos_linkedin_log` (legacy `{actions: [...]}` envelope shape preserved per legacy line 103) with defensive parser dropping rows missing id/actionType, normalizing unknown outcome → null, motionKey → "credibility", temperature → "ice_cold". `state.ts` adds `logCue(now)` (legacy guard: account+contact both blank → null), `updateOutcome(id, outcome, now)` (port of legacy `updateLiOutcome`), `startActionsPersistence()` `@preact/signals` effect with first-run skip same pattern as Phase 4 / Rooms 3-7. CueLedger.tsx replaces the placeholder with the 5-stat grid (accept% gets the green accent, reply% the gold/orange) + per-row outcome `<select>` driving live updateOutcome. main.tsx boot order extended: setActions from disk → startActionsPersistence → render. 21 new tests. Wave 5 (`2e59439`): cross-room handoff + URL inbound + context loaders — `lib/handoff.ts` ports `buildLinkedInRoomHref({href, focusObject, roomLabel, account, extra})` with the canonical continuity params per CLAUDE.md §2 (returnTo / returnLabel / focusObject / focusRoom / fromMode / fromSurface) + `?account=` threading; convenience builders `hrefToSignalConsole` / `hrefToOutboundStudio`; `readInboundAccount(search)` originally fell back to `?focusObject=` (later corrected — see Codex follow-up below). `lib/context.ts` adds 3 pure inbound readers (`loadBestIcp` reads `gtmos_icp_analytics.icps[]` ranked by qualityScore; `loadHottestAccount` reads `gtmos_sc_v4.accounts[]` ranked by heat using the `"heat" in o` presence check from PR #22's Codex P2 fix so explicit zero wins over stale `_heat`; `loadLatestTouch` reads `gtmos_outbound_touches.touches[]` picking the most-recent createdAt with savedAt fallback). main.tsx seeds bestIcp / hottestAccount / latestTouch + honors URL inbound by patching draft.accountName. CueBooth gets the 2-CTA handoff strip in the booth-read aside (Open Signal ghost + Open Outbound primary orange). 26 new tests. Wave 6 (`ab0d331`): legacy flag-redirect — inline script in `app/linkedin-playbook/index.html` listens on `posthog.onFeatureFlags`, redirects to `/linkedin-playbook/` when `room_linkedin_playbook_v2` is ON; `?demo=1` / `?qa=1` escape hatch preserves CI smoke + demo-seed bootstrap. Final at merge: 657/657 vitest, 12/12 Playwright, all CI checks green. Cutover model: founder enables `room_linkedin_playbook_v2` for own user in Posthog → next visit to `/app/linkedin-playbook/` auto-redirects. Cross-room compounding lit: Room 3 (Signal Console) → Room 8 via `gtmos_sc_v4` (hottest account drives motion engine + score meter); Room 6 (Outbound Studio) → Room 8 via `gtmos_outbound_touches` (latest touch drives the `add_air_cover` motion branch); Room 8 → Signal Console / Outbound Studio via the canonical continuity params. **Codex review follow-up (this session):** PR #23 surfaced 1 P1 + 1 P2 review comment which we addressed in a follow-up PR alongside this canon entry: **(P1, systemic — affected Rooms 1-7 too)** the legacy flag-redirect IIFE pattern from Phase 3 / Room 1 onwards did a one-shot `typeof posthog === "undefined" \|\| !posthog.onFeatureFlags` check and bailed early when either was true, but `js/analytics.js` line 231 (`loadPosthogSdk`) injects the `posthog-js@1.212.0` SDK via `<script async>` + `script.onload`, meaning on cold loads `posthog` is undefined while the IIFE runs synchronously after the analytics.js `<script>` tag — the redirect callback never registered and users with the flag enabled stayed on the legacy room (the founder's `room_deal_workspace_v2` worked because of a warm cdn.jsdelivr.net cache, not because the pattern was correct). Fix landed in two parts: (a) `js/analytics.js` `script.onload` handler now dispatches a `gtmos:posthog-ready` `CustomEvent` on `window` after `posthog.init()` succeeds — single source of truth; (b) the redirect IIFE in all 9 legacy room HTML files (Rooms 1-8 + Discovery Studio Phase 3) was rewritten as a `maybeRedirect` helper called twice — once immediately (warm-cache fast path; a no-op if posthog isn't ready yet) and once inside a `window.addEventListener("gtmos:posthog-ready", maybeRedirect, { once: true })` (cold-load path). The `?demo=1` / `?qa=1` escape hatch + the no-op-when-flag-off behavior are preserved. The Python script that applied the change to all 9 files captured indentation per-file and verified each file's flag key + target path matched expectations. **(P2)** `readInboundAccount` in Room 8's `lib/handoff.ts` was falling back to `?focusObject=` when `?account=` was missing; this seemed mirror-symmetric with other rooms' inbound readers, but `buildLinkedInRoomHref` defaults `focusObject` to the literal placeholder `"LinkedIn cue"` when no real account is supplied (so destination rooms render a sensible focus label). On any roundtrip through a cross-room handoff that didn't carry an account, the LinkedIn ledger draft would have prefilled with the literal string "LinkedIn cue" and the operator submitting unchanged would have written it into `gtmos_linkedin_log`. Fix: dropped the focusObject fallback in `readInboundAccount`; only `?account=` drives the draft prefill now. The corresponding test in `handoff.test.ts` was inverted to assert "does NOT fall back to `?focusObject=`". Final after follow-up: 657/657 vitest, 12/12 Playwright, typecheck clean, Vite build green. Next: Phase 4 / Room 9 — Call Planner (per ADR-001 §6 priority list, Live Instrument family, 4-stop spine Open / Reason now / Probe / Advance ask, already feeds Discovery Studio via `gtmos_call_handoff` payload). Standing directive remains: continuous build through Phase 4. |
| 2026-04-27 | Phase 4 / Room 7: Cold Call Studio Preact rebuild — closed end-to-end + PR #21 Codex review addressed | **Seventh room within ADR Phase 4 complete (eighth room migration overall).** Six waves on a single branch (`claude/phase-4-room-7-cold-call-studio`) with local CI gates between each, opened as PR #21, all checks green, squash-merged as `57395ea`. Wave 1 (`4f83754`): scaffold — typed `Thread` / `Reply` / `ThreadId` (canonical 6-thread vocabulary prep / opener / pressure / proof / ask / exit per canon §4.9) / `Outcome` (7 enums + `logged` fallback) / `CallLogEntry` / `Draft` / `AccountSummary` / `CallStats` shapes + `OUTCOMES` / `OUTCOME_LABELS` / `EMPTY_DRAFT` / `EMPTY_STATS` constants. Source signals: `activeThread`, `activeReply`, `selectedAccountName`, `accountOptions`, `draft`, `callLog`, `companyName`, `loaded`. Computed projections: `selectedAccount` (case-insensitive name resolution), `callStats` (meetings/callbacks/referrals counter). Action surface: `setActiveThread` / `setActiveReply` / `setSelectedAccount` / `patchDraft` / `appendCallEntry` / `resetSession` + test seed helpers; the legacy rule "picking an account routes activeThread from prep → opener; clearing it routes back to prep" is encoded in `setSelectedAccount` directly. Root layout (Topbar / AccountRow / TalkLoom / CallMemory) + Vite multi-page entry + Playwright smoke + 10 state tests. Wave 2 (`2f221db`): thread spine + helpers — `lib/threads.ts` ports the legacy `THREADS` array verbatim (lines 97-127 of `app/cold-call-studio/index.html`): 6 threads, each with 2-3 `Reply` branches carrying `buyer` / `reply` / `next` (next is a ThreadId, "post", or null). Pure helpers `findThread(id)` (falls back to prep), `findReply(thread, replyId)`, `nextThreadFor(reply)` (resolves a reply.next to a Thread when it points at a ThreadId, returns null on "post"). `lib/personalize.ts` ports the legacy `personalize()` + `loomScore()` + `weakestThreadCopy()` helpers: personalize substitutes `[account]` / `[pressure]` / `[company]` with sensible defaults when context fields are empty/null/whitespace-only; loomScore returns 44-92 with the legacy boost rules verbatim (base 44 + 16 if account selected + 12 if heat>65 strict + 10 if threadId is proof or ask + 5 if hasReply, capped at 92); weakestThreadCopy returns the loom-read coach line. 27 new tests. Wave 3 (`a8e9e33`): live navigation + branch picker UI — TalkLoom replaces the Wave 1 placeholder with the live console: 6-thread rail (clickable rows with accent rule from `Thread.color` via `--cc-thread-color` CSS custom property), loom-read aside (score from loomScore + 3 read-blocks for current pull / weakest thread / session count), 3-col active sheet (cc-say + cc-replies + cc-capture). Click handlers wire setActiveThread / setActiveReply / "Pull next thread" navigation. personalize() runs at render time on every say-line and reply.reply with the selected account's name + topSignal piped in. Wave 4 (`3de7ad2`): outcome capture + persistence + call log — `lib/persistence.ts` over `gtmos_cold_call_log` (legacy `{calls: [...]}` envelope shape preserved per legacy line 199) + `gtmos_discovery_stats` (`{totalCalls, advancedCalls}`, advancedCalls increments only on meeting_booked) + `gtmos_playbook.company` reader for the [company] substitution. `logCall(outcome)` action freezes thread + reply + draft + account into a CallLogEntry and bumps the discovery stats inline. `startCallLogPersistence()` `@preact/signals` effect mirrors callLog writes to localStorage with first-run skip — same pattern as Phase 4 / Rooms 3-6. CallMemory.tsx renders the most-recent 8 calls (newest first) as a 4-col table with color-coded outcome pills (orange/green/red per outcome family). TalkLoom capture panel adds the notes textarea + 7-button outcome row + "Log this call" fallback. 21 new tests. Wave 5 (`dab2ffb`): cross-room handoff + URL inbound + Deal write — `lib/account-loader.ts` reads `gtmos_sc_v4` (Phase 4 / Room 3's Signal Console mirror), projects each row to AccountSummary {id, name, heat, topSignal} with a `_heat` legacy fallback, ranks by heat desc so the boot auto-select picks the hottest account first; topSignal pulls from signals[0].headline so the [pressure] token resolves to a real account-specific phrase. `lib/handoff.ts` ports the legacy `buildRoomHref` (lines 138-150) as `buildColdCallHref({href, focusObject, roomLabel, account, extra})` with the canonical continuity params per CLAUDE.md §2 (returnTo / returnLabel / focusObject / focusRoom / fromMode / fromSurface) plus an `?account=` pass-through for destination room auto-select; convenience builders hrefToSignalConsole / hrefToCallPlanner / hrefToDealWorkspace; `readInboundAccount(search)` reads `?account=` then falls back to `?focusObject=`; `createDealFromCall(accountName, now, storage)` is a faithful port of legacy lines 212-220 — appends a fresh Deal {id, accountName, value: 0, stage: 'prospect', nextStep: 'First meeting from cold call', timestamps} to `gtmos_deal_workspaces` (Phase 4 / Room 1's Deal Workspace mirror). logCall now calls createDealFromCall when outcome is meeting_booked AND an account is selected. AccountRow gets an "Open Signal" CTA; CallMemory header gets "Open Call Planner" + "Open Deal Workspace" CTAs. main.tsx boot: setCallLog → setCompanyName → seed accounts → resolve URL inbound → fall back to hottest → start persistence → render. 24 new tests. Wave 6 (`4f5e373`): legacy flag-redirect — inline script in `app/cold-call-studio/index.html` listens on `posthog.onFeatureFlags`, redirects to `/cold-call-studio/` when `room_cold_call_v2` is ON; `?demo=1` / `?qa=1` escape hatch preserves CI smoke + demo-seed bootstrap. Final at merge: 558/558 vitest, 11/11 Playwright, all CI checks green. Cutover model: founder enables `room_cold_call_v2` for own user in Posthog → next visit to `/app/cold-call-studio/` auto-redirects. Cross-room compounding lit: Room 3 (Signal Console) → Room 7 via `gtmos_sc_v4` (boot-time heat-ranked auto-select); Room 7 → Room 1 (Deal Workspace) via `gtmos_deal_workspaces` (Deal write on meeting_booked); Room 7 → any room via the canonical continuity params. **Codex review follow-up (this session):** PR #21 surfaced 1 P2 review comment which we addressed in a follow-up PR alongside this canon entry: (P2) `account-loader.ts:73` was using `asNumber(o["heat"]) || asNumber(o["_heat"])`, which treats a valid `heat: 0` as falsy and silently falls back to a stale legacy `_heat` in mixed-payload rows — mis-ranking accounts that legitimately have zero heat. Fix: `"heat" in o ? asNumber(o["heat"]) : asNumber(o["_heat"])` so the new payload always wins when present, including explicit zero. New regression test in `account-loader.test.ts` covers the explicit-zero+stale-legacy-`_heat` case. **Posthog flag setup landed during this session:** founder set up the `room_*_v2` feature flags for Rooms 1-7 + still-existing `data_migration_live`. Targeted-release pattern (email equals `mrcoe7@gmail.com`, rollout 100% within that condition) so only the founder gets the new rooms; everyone else stays on legacy until the founder verifies + widens. `room_deal_workspace_v2` confirmed working end-to-end (`/app/deal-workspace/` redirects to `/deal-workspace/` for the founder's session). Next: Phase 4 / Room 8 — LinkedIn Playbook (per ADR-001 §6 priority list, Live Instrument family, 5-cue ladder Watch → Comment → Connect → Give-first → Ask). Standing directive remains: continuous build through Phase 4. |
| 2026-04-27 | Phase 4 / Room 6: Outbound Studio Preact rebuild — closed end-to-end + PR #19 Codex review addressed | **Sixth room within ADR Phase 4 complete (seventh room migration overall).** Six waves shipped on a single branch (`claude/phase-4-room-6-outbound-studio`) with local CI gates between each, opened as PR #19, all 9 checks green, squash-merged as `02ef732`; 24 files changed, +3,290 lines. Wave 1 (`2dfd1d3`): scaffold — typed `Persona` / `Temperature` / `TriggerKey` / `Channel` / `Asset` / `CtaKey` / `Touch` / `TouchOutcome` / `Angle` / `OperatorRack` shapes + `EMPTY_RACK` / `PERSONA_LABELS` / `TEMPERATURE_LABELS` / `CHANNEL_LABELS` / `TOUCH_OUTCOMES` constants in `lib/types.ts`; signals (`rack`, `allTouches`, `allAngles`, `accountOptions`, `loaded`) + `touchesForRack` (case-insensitive filter) + `canGenerate` + `currentSendLine` computed projections in `state.ts`; root layout (Topbar / Switchboard / OutputPanel / TouchLog / HandoffStrip); Vite multi-page entry; Playwright smoke; 15 state tests. Wave 2 (`d0d2a45`): data tables + send-line generator — `lib/data.ts` ports `TRIGGERS` (10 trigger keys with label / meaning / angles), `PERSONA_DATA` (4 personas: csuite / vp / mgr / ic with priorities + tone), `CHANNEL_ORDER` (5 temperatures × 4 personas → channel preference list), `ASSET_MATRIX` (5 temperatures × 4 personas → asset enum), `CTA_BY_TEMP` (5 temperatures → CtaKey + label), `ASSET_LABELS` / `CTA_LABELS` verbatim from legacy lines 612-1010. `lib/generator.ts` (~285 lines) ports the legacy `generate()` function (lines 1124-1241) — 5 temperature branches × 4 persona variants per branch, deterministic Tuesday/Thursday-next-week date substitution via injected `now`, `computeQuality()` (account 14 + contact 14 + persona 16 + temp 16 + trigger 14 + signal headline 14 + nextQuestion 12, capped 0-100) + `motionBand` thresholds (ready ≥80 / workable ≥60 / thin). 16 generator tests + 15 data tests covering every branch + temperature/persona crosspath. Wave 3 (`1f1cf03`): switchboard form — `Switchboard.tsx` (~160 lines) renders the 5-input rack: account autocomplete (case-insensitive name/ticker prefix match against `accountOptions`, dropdown on focus, 8 results max), contact name input, 4-button persona selector, 5-button temperature selector, 10-option trigger select, optional next-question textarea with character counter, and "no-ask mode" toggle (omits the CTA paragraph from the generated line). All inputs bound through `patchRack` setters; selectors highlight active option in orange. Wave 4 (`02e68fc`): output panel + persistence — `OutputPanel.tsx` surfaces `currentSendLine.value` content + 4 chip readouts (Channel / Asset / CTA / Quality+motionBand) + 3 actions (Copy / Log touch / Save angle); buttons `disabled={!canGenerate.value}`. `lib/persistence.ts` ports `loadTouches` / `saveTouches` over `gtmos_outbound_touches` and `loadAngles` / `saveAngles` over `gtmos_angles` (legacy + still-active keys) with defensive parsers dropping malformed rows + normalizing invalid persona/temperature/trigger/channel enums + clamping persisted lists to MAX_HISTORY (200 touches, 100 angles). `logTouchFromRack` freezes the generator output into a Touch; `saveAngleFromRack` originally appended without dedupe (later corrected — see Codex follow-up). `startTouchPersistence` + `startAnglePersistence` `@preact/signals` effects mirror to localStorage with first-run skip — same pattern as Phase 4 / Rooms 3-5. 24 persistence tests. Wave 5 (`11eee62`): cross-room handoff + URL inbound + TouchLog + HandoffStrip — `lib/handoff.ts` ports `buildOutboundRoomHref({href, focusObject, roomLabel, extra})` with the canonical continuity params (`returnTo` / `returnLabel` / `focusObject` / `focusRoom` / `fromMode` / `fromSurface`) per CLAUDE.md §2; convenience builders `hrefToSignalConsole` / `hrefToLinkedInPlaybook` / `hrefToColdCallStudio` (all take a focus account); `readInboundRack(search)` reads `?account=` / `?contact=` / `?persona=` / `?temp=` / `?trigger=` URL params and returns a partial OperatorRack the boot patches into the rack signal — so a click from Signal Console arrives with the operator rack pre-filled. `TouchLog.tsx` renders touches scoped to the active rack account (most-recent 12) with inline outcome `<select>` driving `setTouchOutcome` (writes to `gtmos_outbound_touches` which Phase 4 / Rooms 3 + 4 already consume for execution-context temperature). `HandoffStrip.tsx` renders the 3 cross-room CTAs at the bottom of the room. Wave 6 (`73b20eb`): legacy flag-redirect — inline script in `app/outbound-studio/index.html` listens on `posthog.onFeatureFlags`, redirects to `/outbound-studio/` when `room_outbound_studio_v2` is ON; `?demo=1` / `?qa=1` escape hatch preserves CI smoke + demo-seed bootstrap. Wave 6 final state at merge: 472/472 vitest, 10/10 Playwright, 9/9 CI checks green. Cutover model: founder enables `room_outbound_studio_v2` for own user in Posthog → next visit to `/app/outbound-studio/` auto-redirects. Cross-room compounding lit: Room 6 writes `gtmos_outbound_touches` which Phase 4 / Room 3 (Signal Console) reads in `getAccountExecutionContext` to compute the warm/cool/hot temperature ladder per account; Room 6 also writes `gtmos_angles` which legacy Onboarding seed-data + future Founding GTM handoff exports already consume. **Codex review follow-up (`c78d0ae`, this recovery session, 2026-04-27):** PR #19 surfaced 1 P1 + 2 P2 review comments which the original session did not address before merge. All three are real bugs and were landed on the recovery branch: (P1) `TouchLog.tsx` was falling through to the global touch list when the rack had an account selected but that account had no touches yet — operator could see (and inadvertently mutate via the inline outcome select) touches belonging to other accounts. Fix: gate list+header on `rack.value.accountName.trim().length > 0` so an active rack scope always renders its own scoped list (with a scoped empty-state copy) and never the global list. (P2) `OutputPanel.tsx` was firing `void navigator.clipboard.writeText(content)` and immediately flashing "Copied." regardless of whether the underlying Promise rejected (denied permission / sandboxed iframe / no user gesture). Fix: chain `.then(success)/.catch(failure)` and surface a distinct copy-unavailable toast when the API itself is missing. (P2) `state.ts` `saveAngleFromRack` doc comment claimed "dedupes on company + trigger + persona by replacing existing matching entry" but the body always called `appendAngle()`. Fix: match the legacy `app/outbound-studio/index.html` `persistCurrentAngle` contract — dedupe on company + trigger + persona + temperature + email; on duplicate refuse to insert and return `{ saved: false, reason: "duplicate", existing }`; OutputPanel handler now flashes "Angle already saved." matching legacy UX. Return type changed from `Angle | null` to a `SaveAngleResult` discriminated union; only one caller needed updating. 4 new dedupe tests in `state.test.ts` cover cannot_generate / fresh-save / duplicate-refused / persona-trigger-temperature differentiation. Final after follow-up: 476/476 vitest, 10/10 Playwright, typecheck clean, Vite build green. Next: Phase 4 / Room 7 — Cold Call Studio (per ADR-001 §6 priority list). Standing directive remains: continuous build through Phase 4. Plan adjustment landed in this session: Readiness Score + Founding GTM dropped from migration order pending founder-led mind-rethink on what unique value each surfaces; Onboarding stays in the priority list but is a greenfield rebuild (legacy not migrated). Phase 4 close gate updated accordingly: 11 remaining rooms (Cold Call Studio, LinkedIn Playbook, Call Planner, Advisor Deploy, ICP Studio, Territory Architect, Sourcing Workbench, Quota Workback, Settings, Welcome, Onboarding); Readiness Score + Founding GTM stay on legacy until their mind is redefined. |
| 2026-04-27 | Phase 4 / Room 5: PoC Framework Preact rebuild — closed end-to-end | **Fifth room within ADR Phase 4 complete (sixth room migration overall).** Six waves shipped on a single branch (`claude/phase-4-room-5-poc-framework`) with local CI gates between each, opened as PR #17, all 9 checks green, squash-merged. Wave 1 (`68df5ea`): scaffold — typed `Proof` / `ProofDraft` / `QualityBand` / `Outcome` / `DurationDays` / `HeatLedger` / `MoldDiagnosis` / `ProofDocs` / `LinkedDealSummary` shapes + constants (OUTCOMES, DEFAULT_DURATION 7, MAX_PROOF_HISTORY 20); `allProofs` + `draft` + `linkedDeals` source signals + `linkedDeal` + `activeProof` (case-insensitive most-recent matching account+vendor) computed projections; root layout (Topbar + ForgePanel/CastPanel split); dark-forge / cream-cast hybrid CSS lock per Part II §4.8; 16 state tests. Wave 2 (`efb0b29`): quality engine — faithful TypeScript port of legacy `getPoCQuality` / `heatLabel` / `heatColor` / `deriveMolds` (lines 137-180). `computeQuality(draft, linkedDeal)` returns score + band (ready ≥80 / workable ≥60 / thin) + bandLabel + title + heat ledger + weakest mold; score formula verbatim (hasVendor +10, hasAccount +10, min(success,4)*10, min(boundary,3)*8, hasOwner +16, linkedDeal +10, stage poc/proposal +4); 3 heat dimensions (claim = success*28+account*16; owner = 100/72/18; kill = boundary*38) clamped 0-100; weakestMold gate (Account → Owner → Metric <3 → Kill <2 → Readout); deriveMolds returns 5-row grid (Claim/Baseline/Owner/Metric/Kill) with state classes (cast/hot/cold/red). 20 new tests. Wave 3 (`eb6a1b1`): forge panel UI — full editable form (account / vendor / readout owner / linked-deal dropdown / success criteria + kill rules textareas / 7-14 duration toggle / outcome select / Cast proof button) bound to draft via patchDraft; HeatLedger component (3-bar live readout). Cast panel surfaces quality readout + 5-mold grid + weakest-mold callout. Wave 4 (`6eb3d19`): docs + persistence — `generateDocs(draft, linkedDeal, {now})` produces 4 markdown templates (POC SCOPE / KICKOFF AGENDA / READOUT AGENDA / Proposal email) verbatim from legacy lines 216-292 with vendor/account/owner/dates/linked-deal substitutions; `loadProofs` / `saveProofs` over `gtmos_poc_data` (legacy + still-active key) with defensive parser dropping malformed proofs and normalizing invalid duration/band/outcome enums; `freezeDraftIntoProof(draft, linkedDeal, {now, id})` builds a Proof with quality + docs snapshot at save-time; `saveDraft()` dedupes on account+vendor pair (reuses existing id) + upserts; `startProofPersistence()` @preact/signals effect mirrors allProofs to localStorage with first-run skip. CastPanel docs rack: 4-tab selector (PoC scope / Kickoff agenda / Readout agenda / Proposal email) with active-tab orange underline + mono-font preformatted body + copy-to-clipboard button. 19 new tests. Wave 5 (`098523d`): cross-room handoff + deal sync — `buildPocRoomHref({href, focusObject, roomLabel, extra})` faithful port of legacy with continuity params (returnTo / returnLabel / focusObject / focusRoom / fromMode / fromSurface); convenience builders `hrefToDealWorkspace` (with optional deal id) / `hrefToFutureAutopsy` / `hrefToAdvisorDeploy`; `readInboundDealId(search)` for the `?deal=` URL inbound. `loadDealsForLinking(storage)` reads Phase 4 / Room 1's `gtmos_deal_workspaces` mirror, projects to LinkedDealSummary (camelCase + snake_case fallbacks). `syncProofIntoDeal(proof)` writes a `.poc` snapshot {status, score, band, readoutOwner, durationDays, successCriteria, boundaries, updatedAt} back into the matching deal row — faithful port of legacy `syncPocIntoDeal`. saveDraft now calls syncProofIntoDeal automatically. Boot honors `?deal=` URL via patchDraft. RouteRack component: 3 CTAs (Open in Deal Workspace primary orange; Pre-mortem in Future Autopsy ghost; Carry to Advisor Deploy ghost) with continuity params + disabled state when account is blank. 19 new tests. Wave 6 (`21ca373`): legacy flag-redirect — inline script in `app/poc-framework/index.html` listens on `posthog.onFeatureFlags`, redirects to `/poc-framework/` when `room_poc_framework_v2` is ON; `?demo=1` / `?qa=1` escape hatch preserves CI smoke + demo-seed bootstrap. Final: 418/418 vitest pass (74 new tests), 9/9 Playwright pass, 9/9 CI checks green. Cutover model: founder enables `room_poc_framework_v2` for own user in Posthog → next visit to `/app/poc-framework/` auto-redirects. Cross-room compounding lit: Room 1 writes `gtmos_deal_workspaces` mirror which Room 5 reads (linked-deal dropdown) and writes back into (proof `.poc` snapshot); Room 4 (Future Autopsy) consumes the same deal mirror so a saved proof's `.poc.score` surfaces in Future Autopsy's vitals on the linked deal — full proof → autopsy pipeline now lit on the new stack. Next: Phase 4 / Room 6 — Outbound Studio (per ADR-001 §6 priority list). |
| 2026-04-27 | Phase 4 / Room 4: Future Autopsy Preact rebuild — closed end-to-end | **Fourth room within ADR Phase 4 complete (fifth room migration overall).** Six waves shipped on a single branch (`claude/phase-4-room-4-future-autopsy`) with local CI gates between each, opened as PR #15, all 9 checks green, squash-merged. Wave 1 (`5174055`): scaffold — typed `Vitals` / `Cause` / `VerdictMode` / `ForensicSheetKey` / `Chapter` / `WinCondition` / `CountermeasureTask` / `AutopsyDoc` / `ActionPlan` / `TaskLog` shapes; CAUSE_IDS enum (14 failure-pattern IDs); state signals (`allVitals`, `selectedDealId`, `currentVerdictMode`, `currentForensicSheet`, `taskLog`) + `autopsyUniverse` / `selectedVitals` computed projections; root layout (Topbar / PinnedCase / Ledger); Vite multi-page entry; Playwright smoke; 14 state tests. Wave 2 (`1b4438b`): deal-health subset port — `loadDealsFromMirror()` reads Phase 4 / Room 1's `gtmos_deal_workspaces` mirror with defensive parser tolerant of camelCase + snake_case field names; `lib/vitals.ts` (~340 lines) faithful TypeScript port of legacy `js/deal-health.js` lines 126-331 — qualScore / computeRisk / computeVitals / supporting gate / assessGates / missingMap / stageAgeDays / threadingDepth / inferMomentum private helpers; computeRisk preserves the legacy formula verbatim (staleness ≤30, stage-stuck ≤20, next-step quality ≤15, qualification depth ≤20, high-value amplifier ≤10, late-stage fragility ≤10, overdue close-date ≤10, overdue next-step ≤8, single-threaded ≤8); `lib/causes.ts` ports the 13-rule CAUSES table + `topCauses(vitals, prefs, limit)` sorted by severity desc. 26 new tests. Wave 3 (`07e234b`): autopsy generator — CHAPTERS / WMAP / WTEXT / STAGE_LEADS / CAUSE_LEADS / STAGE_WIN_LEADS data verbatim from legacy lines 1728-1815; `generateAutopsy(vitals, options)` orchestrates topCauses → chapters → winConditionsFor (mirror win-conditions, padded to 5) → stageLead/winLead → chooseTasks (cause-severity sum + stage boost + value boost) → killSwitchFor; `autopsyUniverseScore` (2 × risk + min(stale, 60) + value/stage/qual amplifiers) + `rankAutopsyUniverse` for the ledger ranker; lose/win story strings composed from leads + tails + clipped to 700 chars; types extended with `loseStory` + `winStory` so Wave 4's PinnedCase can show the verdict-mode-specific narrative; `currentAutopsy` is now a computed signal that re-runs whenever selectedVitals changes. 13 new tests. Wave 4 (`e709016`): pinned-case UI — `VerdictToggle` (left-alone red / corrected green with surrounding chrome color flip on the sheet body); `ForensicSheets` (3-tab pattern/proof/symptom rack with verdict-mode-aware left-rule color); full `PinnedCase` panel (header summary + verdict + sheets + countermeasure docket + kill-switch). Wave 5 (`06b0e9c`): cross-room handoff + action plan + task log — `buildFutureAutopsyRoomHref` faithful port of legacy with the canonical continuity params; convenience builders `hrefToDealWorkspace` (with optional deal id) / `hrefToCallPlanner` / `hrefToPoC` / `hrefToDiscoveryStudio`; `buildActionPlan(doc)` picks primary/secondary/tertiary routes from top cause + stage; `loadTaskLog` / `saveTaskLog` / `toggleTask` over `gtmos_autopsy_log_v1` (the only persistent state Future Autopsy owns) with defensive parser; `RouteRack` component renders the 3 CTAs; docket rows now have task-toggle checkboxes that persist via the `@preact/signals` effect (`startTaskLogPersistence`) with first-run skip same pattern as Phase 4 / Room 3. 22 new tests. Wave 6 (`bfe70dd`): legacy flag-redirect — inline script in `app/future-autopsy/index.html` listens on `posthog.onFeatureFlags`, redirects to `/future-autopsy/` when `room_future_autopsy_v2` is ON; `?demo=1` / `?qa=1` escape hatch preserves CI smoke + demo-seed bootstrap. Final: 345/345 vitest pass (75 new tests across vitals / causes / autopsy / handoff / action-plan / task-log), 8/8 Playwright pass, 9/9 CI checks green. Cutover model: founder enables `room_future_autopsy_v2` for own user in Posthog → next visit to `/app/future-autopsy/` auto-redirects. Cross-room compounding lit: Phase 4 / Room 1 (Deal Workspace) writes `gtmos_deal_workspaces` mirror which Wave 2's `loadDealsFromMirror` reads to compute vitals — so the moment Room 1 publishes deals, Room 4's ledger and pinned-case autopsies populate without any additional setup. Note on legacy `js/deal-health.js`: not ported wholesale — only the subset Future Autopsy actually consumes (computeVitals / computeRisk / qualScore / topCauses) is in the typed `src/future-autopsy/lib/vitals.ts` + `causes.ts`; the legacy file stays in place for legacy rooms still using it (Deal Workspace before Phase 4 / Room 1 cutover, Readiness Score, etc.); will be deleted once those migrate. Next: Phase 4 / Room 5 — PoC Framework (per ADR-001 §6 priority list). |
| 2026-04-26 | Phase 4 / Room 3: Signal Console Preact rebuild — closed end-to-end | **Third room within ADR Phase 4 complete (fourth room migration overall).** Six waves shipped on a single branch (`claude/phase-4-room-3-signal-console`) with local CI gates between each, opened as PR #13, all checks green, squash-merged. Wave 1 (`4f9f103`): scaffold — typed `Account` + `Signal` + `HeatBand` + `HeatMetrics` shapes (legacy field aliases preserved: `cat`, `headline`, `published_date`, `fetched_at`, `ai`, `status` so existing rows from `gtmos_sc_v4` flow in without translation); `allAccounts` source signal + `selectedAccountId` + `searchQuery` view state + `visibleAccounts` (case-insensitive filter over name/ticker/industry) + `selectedAccount` computed projections; root layout (Topbar / GridControls / AccountGrid placeholder); Vite multi-page entry; Playwright smoke. Wave 2 (`cf19b2a`): heat engine — faithful TypeScript port of legacy lines 1271-1333 in `lib/heat.ts`. `recency()` (6-step decay 1.0/0.9/0.75/0.55/0.3/0.1 across ≤14d/≤30d/≤60d/≤90d/≤180d/>180d, falls back from `published_date` → `fetched_at` → `capturedAt`); `heat()` (excludes flagged signals, sums `(base + conf_bonus) * recency_decay` where base = AI ? 18 : 12 and conf_bonus = `confidence ≥ 0.9 ? 5 : 0`, clamped 0-99); `heatBand()` Hot ≥91 / Active ≥75 / Watch ≥50 / Low (cutoffs verbatim — Dashboard's snapshot aggregator binds to these labels); `heatCls()` h-hot/h-warm/h-med/h-cool (preserves legacy classnames so reused styles don't have to be retranslated); `heatMetrics()` returns full metric breakdown; `rankByHeat()` stable on ties so operator's manual additions don't reshuffle. Heat is computed (not stored) — source-of-truth = signals + their timestamps. 18 tests on the formula's individual cases. Wave 3 (`be57376`): account grid + cards — `HeatBadge` (numeric score + band label, color-coded via heat class), `AccountCard` (serif name + ticker kicker + heat badge in a click-to-toggle header; meta row with industry/HQ/employees/tier; top-3 signal preview with "+N more" overflow button; signal rows show headline + AI tag + recency-fresh % + confidence % + optional source link with dotted-underline hover; footer with signal/AI/high-conf/recent counts). Grid auto-sorts by heat (rankByHeat); auto-fill 360px+ columns. Wave 4 (`adad671`): persistence + snapshot publishing — `loadAccounts()` / `saveAccounts()` over `gtmos_sc_v4` (legacy + still-active key) with defensive parser dropping malformed accounts (missing id/name) and malformed signals; `buildSignalRoomHealthSnapshot()` returns `{capturedAt, accountCount, signalCount, readyCount (heat ≥ 75), top* (id/name/heat/band/signalCount/highConfidenceCount/recentCount), hot_accounts[]}` mirroring legacy `buildSignalConsoleHealthSnapshot` shape (lines 1397-1440); `publishHealthSnapshot()` writes to `gtmos_signal_room_health` — the key Phase 4 / Room 2's `signalSnapshotToMoveCards` aggregator already reads, so the Dashboard's command-intelligence rail picks up live signal-room data the moment Room 3 is enabled. `startExternalPublishing()` wires a `@preact/signals` effect that mirrors every `allAccounts` change to both keys, skipping the first run so the boot-time seed doesn't trigger a redundant write. Boot order: seed → publish snapshot once → start loop → render. 17 new persistence + snapshot tests. Wave 5 (`766f7e0`): cross-room handoff + workspace-health panel — `buildSignalRoomHref({href, focusObject, roomLabel, extra})` faithful port of legacy `buildSignalRoomHref` with the canonical continuity params (`returnTo` / `returnLabel` / `focusObject` / `focusRoom` / `fromMode` / `fromSurface`) per CLAUDE.md §2 ("the continuity plumbing — do not break them"). Convenience builders: `hrefToOutbound` (with optional temperature), `hrefToDealWorkspace`, `hrefToDiscoveryAgenda`, `hrefToColdCall`. `getAccountExecutionContext()` reads `gtmos_deal_workspaces` (Phase 4 / Room 1's mirror) + `gtmos_outbound_touches` and returns the 4-state temperature ladder: `ice_cold` → `cool` (touches sent) → `warm` (replied OR prospect-stage deal) → `hot` (post-prospect deal); closed deals (won/lost) ignored, name-match case-insensitive, malformed-storage falls back to ice_cold. AccountCard footer wires the dominant CTA (Open in Deal Workspace if `hasActiveDeal`, else Compose outbound with temperature) + two ghost CTAs (Plan call, Cold call). Card sub-row shows ticker + temperature chip (color-coded per state). `WorkspaceHealth` panel between topbar + grid controls: posture (motion-ready vs research-heavy from `topHeat ≥ 75`, computed per legacy §1562) + active accounts + total signals + ready count (heat ≥ 75) + top-of-room cell. 18 new handoff + execution-context tests. Wave 6 (`66eb565`): legacy flag-redirect — inline script in `app/signal-console/index.html` listens on `posthog.onFeatureFlags`, redirects to `/signal-console/` when `room_signal_console_v2` is ON; `?demo=1` / `?qa=1` escape hatch preserves CI smoke + demo-seed bootstrap. Final: 264/264 vitest pass (50 new tests across heat / state / persistence / snapshot / handoff / execution-context), 7/7 Playwright pass, 9/9 CI checks green. Cutover model: founder enables `room_signal_console_v2` for own user in Posthog → next visit to `/app/signal-console/` auto-redirects. Cross-room compounding lit: Room 1 (Deal Workspace) writes `gtmos_deal_workspaces` mirror which Room 3's `getAccountExecutionContext` reads for temperature; Room 2 (Dashboard) reads `gtmos_signal_room_health` which Room 3 publishes on every state change — so the Dashboard's rail starts consuming live signal data with no code change. Process discipline note: GitHub MCP server disconnected mid-PR-watch on PR #11 (Anthropic OAuth flow surfaced an unrelated Google Drive scope request — declined; founder verified + merged via the web UI). MCP reconnected on its own ~30 min later. Lesson: MCP outage doesn't block work — the local CI gate + the founder's web-UI merge path are sufficient. Deferred: enrich-all flow (legacy line 1764, external enrichment-API call) — not migration-critical for source-of-truth; will land in a follow-up once we have a stable service abstraction; until then operators run it in the legacy room. Next: Phase 4 / Room 4 — Future Autopsy (per ADR-001 §6 priority list). |
| 2026-04-26 | Phase 4 / Room 2: Dashboard Preact rebuild — closed end-to-end | **Second room within ADR Phase 4 complete (third room migration overall).** Six waves shipped on a single branch (`claude/phase-4-room-2-dashboard`), local CI gates between each, opened as PR #11, all checks green, squash-merged. Wave 1 (`9d9b7d2`): scaffold — 3-mode signal model (`commandMode` brief/spotlight/queue with URL `?mode=` → `gtmos_dashboard_command_mode` localStorage → DEFAULT resolution; key shared with legacy so user's mode preference carries through cutover) + `focusedCommandId` signal; topbar (kicker + serif thesis title + ModeSwitcher); placeholder mode views; Vite multi-page entry; Playwright smoke. Wave 2 (`84df350`): command-intelligence engine port — faithful TypeScript port of the 892-line `js/command-intelligence.js` across four files. `engine-helpers.ts` (~210 lines: tx/slug/clamp/pushReason/parseNumber/parseRisk/parseHeat/parseStaleDays/parseMoney/hasAction/countActions/normalizeTone/familyPriority/roomFamilyLabel/amountPressure + bag access helpers signalNumber/Bool/Text/readSignals/readHealthSummary/summary*/formatCauseLabel/testCardText). `signal-profile.ts` (~280 lines: `buildSignalProfile(card, family, input)` → SignalProfile with ~50 fields — raw card signals + boolean condition flags + health-summary projections from deal/signal/readiness/quota rooms + workspace shellContext counts; gapCount fallback synthesis matches legacy line-for-line). `scoring.ts` (~280 lines: 4 reason builders capped at 4 reasons each, 4 family-specific score formulas with cause-id heuristics — coverage_gap/no_nextstep/no_champion/champion_weak — preserved verbatim, `scoreRankingConfidence` 40-94 + `labelRankingConfidence` stable lead/supported/mixed signal). `command-intelligence.ts` (~360 lines: the 4 public functions formerly on `window.gtmCommandIntelligence` — `buildCommandObjects` with risk → "risk" family, move-card title sniff for `/advisor/` → advisor / `/outbound\|signal/` → opportunity / else move, fallback to `input.primary` when no risk/move, system-object trigger on dependencyWarnings, ICP-object trigger when shellContext has accounts/signals/deals but no icps, dedupe by lowercased title; `rankCommandObjects` with score / baseScore / familyPriority (risk 5 > advisor/opportunity 4 > move 3 > icp 2 > system 1) / alphabetical title; `summarizeCommandContext` returning ranked + spotlight + queue (top-N, default 6) + per-family slices; `explainCommandObject` returning "Why this is here" / "Why this order" + per-family rationale title + confidence-band lead-copy sentence). Plus `computeStabilityBonus` for re-rank smoothing — keeps the previous spotlight pinned (+6 score, capped at 8) so live data refreshes don't churn the surface. 15 new tests covering family-detection / dedupe / system-object / ICP-object / primary fallback / ranking monotonicity / family-priority tiebreak / summarizer slices + custom limit / explanation label switch / stability bonus. Wave 3 (`0d54a24`): Spotlight mode wired to engine — `engineInput` source signal (defaults to `EMPTY_ENGINE_INPUT`; Wave 5 wires the live aggregator), `commandSummary` computed (runs buildCommandObjects + summarizeCommandContext over engineInput), `spotlightObject` computed (focused id wins if in ranked set, else engine top, else null). `FocalObject` component: dominant card with family kicker + score + serif title + copy + explainCommandObject() "why" section + reason chips + one orange primary CTA + 0-2 ghost secondary CTAs. `QueueRail` component: recessive "next" rail; click row → setFocusedCommand → spotlight re-renders. `CommandReasons` shared subcomponent (mono uppercase chips, capped at 4). 4 new state tests for the computed signals (empty / derived / focus override / fallback when focus id unknown). Wave 4 (`b23ba42`): Brief + Queue modes — `buildBriefNarrative(summary)` produces a deterministic 2-5 sentence morning brief (sentence 1 names spotlight family + title, sentence 2 reports queue composition with pluralization, sentence 3 reports ranking confidence band, sentence 4 names runner-up) + insight line from spotlight's brief-mode explanation copy; empty input renders an empty-state narrative. `BriefView` composes the narrative into serif headline + plain-prose stack + orange-rule insight callout. `QueueView` is a counter-style ranked list with rank prefix + family kicker + score + "Why this order" + reason chips + ghost CTA per row. 5 new narrative tests. Wave 5 (`ee84526`): cross-room snapshot aggregator — `aggregateEngineInput()` reads `gtmos_deal_workspace_health` (Phase 4 / Room 1's snapshot) + `gtmos_signal_room_health` + `gtmos_readiness_snapshot` + `gtmos_quota_targets` and translates them into RawCommandCards. `dealSnapshotToRiskCards` turns top_pressure entries into deal-room risk cards with focusObject query param for cross-room handoff; `signalSnapshotToMoveCards` turns hot_accounts into outbound move cards with rankingSignals carrying heat / recentCount / highConfidenceCount / causeId. `bootSnapshotAggregator({onUpdate, intervalMs})` seeds engineInput synchronously, listens for storage events (cross-tab updates fire immediately), refreshes on a 10s interval (same-tab updates from sibling rooms still on the legacy stack), pauses the interval when document.hidden so a backgrounded tab doesn't burn CPU; returns a stop() handle for teardown. All parsing defensive — never throws. 10 new tests covering empty / malformed JSON / deal snapshot translation / signal snapshot translation / health-summary attachment + boot loop (immediate seed / storage-event re-read / unrelated-key filter / stop() unbinds). Cross-bundle communication during the transitional phase IS localStorage — Dashboard and Deal Workspace bundles don't share Preact signals across separate Vite outputs; once every publishing room migrates this layer can be replaced with Supabase realtime. Wave 6 (`49e11aa`): legacy flag-redirect — inline script in `app/dashboard/index.html` listens on `posthog.onFeatureFlags`, redirects to `/dashboard/` when `room_dashboard_v2` is ON; `?demo=1` / `?qa=1` escape hatch preserves CI smoke + demo-seed bootstrap. Final: 203/203 vitest pass (34 new tests across engine + state + narrative + aggregator), 6/6 Playwright pass, 9/9 CI checks green. Cutover model: founder enables `room_dashboard_v2` for own user in Posthog → next visit to `/app/dashboard/` auto-redirects. Process discipline note: GitHub MCP server disconnected mid-PR-watch, requiring manual re-auth (Anthropic OAuth flow surfaced an unrelated Google Drive scope request — declined; founder verified PR + merged via the GitHub web UI directly). Lesson: relying on the MCP for CI-watch creates a single point of failure; falling back to the GitHub UI is fine. Next: Phase 4 / Room 3 — Signal Console (per ADR-001 §6 priority list). |
| 2026-04-25 | Phase 4 / Room 1: Deal Workspace Preact rebuild — closed end-to-end | **First room within ADR Phase 4 complete (second room migration overall after the Phase 3 pilot).** Six waves shipped on a single branch (`claude/phase-4-deal-workspace`) with local CI gates between each, then opened as a single PR (#8) which landed all 9 CI checks green and was squash-merged. Following the directive "run phase 4 end to end without stopping until its complete end to end cleanly and absolutely completely" — after the Wave 1+2 E2E hotfix lesson from Phase 3, every wave was gated locally on typecheck + 100% vitest + 5/5 playwright + `build:cloudflare` before commit. Wave 1 (`dffc21a`): scaffold — `Deal` type + `StageId` + `LossReason` + `Stakeholder`; recovery ranking (staleness + next-step pressure + close-date pressure → critical/at-risk/healthy lane); state signals (`allDeals` + computed projections + modal state); root layout (Topbar / BridgeStats / RecoveryQueue / FilterBar / InterventionRail / modal overlay); Vite multi-page entry; Playwright smoke. Wave 2 (`3cd5a54`): read-path persistence — `deal-bridge.ts` (legacyDealToDeal / dbRowToDeal / blobToLegacyDealArray / rowsToDeals / dealToDbWrite — native rows win, falls back to Phase 2.3 migration blob); `persistence.ts` (`loadDeals` + `bootPersistence`); main.tsx kicks off async load after first paint. Wave 3 (`402cc82`): modal interactions — full editable 9-field health form (champion / EB / use case / pain / competition / decision process / notes / forecast / momentum) + core fields + stakeholders mini-editor; `saveDealEdit` does optimistic upsert + uuid-vs-legacy detection (update vs insert — first-save-of-blob-deal flow); `transitionedToLost(prev, next)` triggers LossReasonModal which writes `lossReason` + `lossNotes` back. Wave 4 (`32146d8`): realtime + legacy mirror — `data.deals.subscribe` wires `applyRealtimePayload` (INSERT/UPDATE → upsertDeal, DELETE → removeDeal); `mirrorToLegacyStorage` writes the canonical `Deal[]` back to `gtmos_deal_workspaces` so legacy Dashboard / Future Autopsy / Readiness readers stay consistent until they migrate (the mirror is removed once every legacy reader has migrated, well before the Phase 4 overall gate). Wave 5 (`24f7979`): filter chips + snapshot publishing — 4-chip FilterBar (all / at-risk / stalled / this-quarter) toggles `dealFilter` signal; `publishHealthSnapshot` writes derived view (active/won/lost counts + pipeline value + lane counts + top-5 ranked pressure deals with cause text) to `gtmos_deal_workspace_health` for Dashboard's command-intelligence rail and Readiness Score consumption; `publishExternalState` is a single helper that runs both legacy mirror + snapshot after every state mutation. Wave 6 (`4fdb873`): legacy flag-redirect — inline script in `app/deal-workspace/index.html` listens on `posthog.onFeatureFlags`, redirects to `/deal-workspace/` when `room_deal_workspace_v2` is ON; `?demo=1` / `?qa=1` escape hatch preserves CI smoke + demo-seed bootstrap. Final: 159/159 vitest pass (45 new tests across deal-bridge / persistence / state / legacy-mirror / health-snapshot / filters), 5/5 Playwright pass, 9/9 CI checks green. Cutover model: founder enables `room_deal_workspace_v2` for own user in Posthog → next visit to `/app/deal-workspace/` auto-redirects. Outstanding housekeeping (founder, none blocking): merge `claude/canon-phase-2-closeout` (canon updates from earlier in week, if any are still owed); close PR #1 (obsolete CF auto-config bot); delete redundant Phase-3/4 working branches. **Supabase branch DB password rotation now confirmed complete** (founder, this session). Branch protection on `main` ready to enable now that 4 CI checks run green reliably across PRs #3–#8. Next: Phase 4 / Room 2 — Dashboard (per ADR-001 §6 priority list). Phase 5 in ADR-001 is static-pages polish, not room migration. |
| 2026-04-25 | Phase 3 Discovery Studio Preact rebuild — closed end-to-end | **First room migration complete.** Six waves shipped over the day, each as its own PR + green CI before the next started: PR #3 (Waves 1+2) — scaffolding, signals state model for the 21 canonical primitives (`src/discovery-studio/state.ts`), 7 rail components, Vite multi-entry, framework runtime loader (`lib/load-frameworks.ts`) projecting `window.DISCOVERY_SEGMENT_RUNTIME` into typed `Framework[]`, branch picker with inline expand, 76/76 vitest. PR #4 (Wave 3) — interactions wired: branch click records signal-ledger entry + learned fact (idempotent), recover-the-call rail injects interrupt copy via `triggerInterrupt()`, learned-truth ledger jumps back to source nodes, worked-memory progress driven by `workedNodeIds` computed signal, 89/89 vitest. PR #5 (Wave 4) — Supabase persistence (`lib/persistence.ts`): schema-versioned `PersistedSessionState`, `loadDiscoverySession` / `saveDiscoverySession` (upsert by stored rowId), `startAutoSave` with debounced effect over @preact/signals, `unpackMigrationBlob` for Phase 2.3 passthrough rows, defensive parsing throughout (no exception ever blocks the live call), 105/105 vitest. PR #6 (Wave 5) — on-call control surfaces from the Lumana on-call control lock guardian spec: visible `CallClock` (idle/running/over-target states), three-state `CompressionToggle`, collapsible `SkipAheadTray`, tieback hold/deploy buttons on `LearnedTruthLedger` with NEW/HOLD/DEPLOYED status pills, per-segment minute hints in `SegmentRail`, 114/114 vitest. PR #7 (Wave 6, this commit) — flag-based cutover: legacy `app/discovery-studio/index.html` gets a small inline `<script>` after `analytics.js` that listens for `posthog.onFeatureFlags` and `window.location.replace('/discovery-studio/' + qs + hash)` when `room_discovery_v2` is on. Skip-redirect escape hatch on `?demo=1` / `?qa=1` query params so CI smoke tests + demo-seed bootstrap path still load the legacy. Process discipline note: Wave 1 + Wave 2 initially shipped with broken Playwright E2E (webServer served repo root, `/discovery-studio/` returned 404 because that dir only exists in `dist/` after `build:cloudflare`). Caught by founder, hotfix `1bf87e7` made `test:e2e` build first + `playwright.config.ts` webServer serves `dist/`. Lesson committed to memory: after every push, check CI status before declaring a wave done. From Wave 3 onward I monitored CI green via `mcp__github__pull_request_read get_check_runs` before suggesting the next wave. The new room is feature-flag-gated (`room_discovery_v2`) and reachable at `/discovery-studio/`; legacy room continues to render unchanged for users without the flag. Founder enables the flag per-user in Posthog → next visit to `/app/discovery-studio/` auto-redirects. Outstanding housekeeping (none blocking Phase 4): merge `claude/canon-phase-2-closeout` (canon updates from earlier in week); close PR #1 (obsolete CF auto-config bot); delete redundant `claude/phase-3-wave-1-discovery-studio` branch; rotate Supabase preview + main DB passwords (shared in screenshots during Phase 2.3 session). Next: Phase 4 — second room migration (per ADR-001 priority list, likely Deal Workspace). |
| 2026-04-21 | Initial canon draft | Established this document as the canon. Reconciled truth-lock memo: interior is bright, not dark (dark reserved for System Ledger rooms). Amended "rewrite the face, not the mind" to allow mind corrections with founder approval. Set up Linux rendering pipeline (Playwright + Puppeteer Chrome binary + Python static server). Screenshot-based re-audit of all 19 reachable rooms corrected multiple DOM-based audit errors. Discovery Studio contract probe identified 5 of 7 required global rails missing. |
| 2026-04-21 | Canon execution — sweep + Discovery Studio rails | No doctrine shifts. State shifts: (1) Cross-room drift-mode sweep complete for the four flagged candidates — Future Autopsy designer-voice leak + hardcoded case count removed, Signal Console scoring-formula caption removed, LinkedIn Playbook rainbow cue-meter + marquee dots replaced/deleted, Cold Call Studio rainbow loom-needle neutralized. (2) Discovery Studio reached contract completeness — all 7 global persistent rails now implemented across four commits (Waves 1–4). New state fields: `frameworkState.learnedFacts[]` and `frameworkState.nextStep{}` (auto-populated from branch `clear` text + user input respectively); new top-level `state.dossierOpen`. New render functions: `renderLedgerStrip()`, `renderNextStepDocket()`, `renderDossier()`. New event path: `[data-ledger-jump]` routes to `handleActionTarget("node:")` for click-to-jump. Drawer gates on `hasDossierData(framework)` so the "Dossier" topbar button appears only for frameworks whose runtime files have authored `supportDossier` / `objectionLibrary` / `inboundQuestionHandlers` — currently only `customer-support`. Caught and fixed: `js/discovery-segment-runtime-customer-support.js` was never loaded by `app/discovery-studio/index.html`; its script tag was missing. Added. Doctrine verification: the session respected Part IV §4 (mind-correction protocol) — no mind changes were made without founder approval; the load-order bug was a mechanical/build issue, not a mind change, so no approval gate was triggered. |
| 2026-04-24 | ADR-002 Phase 2 rescope — approved | Discovered during founder walkthrough of Phase 1 external setup that the production Supabase project (`antaeus-gtm-os`) already has 10 tables + 2 views deployed with RLS, 4 real auth users, and 5 SQL bootstrap files checked into the repo root. ADR-001's Phase 2 had assumed greenfield; reality is ~40–50% already done. ADR-002 approved: (a) adopt existing schema + extend it with `workspaces` + `workspace_members` + 4 missing noun tables + workspace_id retrofit on all existing tables + RLS migration to workspace-scoping; (b) use Supabase Branches for staging (persistent `preview` branch + optional per-PR branches in Phase 3+), supersedes ADR-001 §9 Q2. Phase 2 timeline drops from 3–4 weeks to ~2 weeks. Also in this session: removed redundant `.github/workflows/deploy.yml` + `.github/workflows/pr-preview.yml` because Cloudflare Workers Builds handles deploys natively via the Git integration on the `autumn-water-148a` Workers service; updated `docs/founder-phase-1-external-setup.md` to drop the retired CF-API-token/account-ID/project-name steps. Founder completed Phase 1 external setup items 1 (Sentry) + 2 (Posthog) during this session — VITE_SENTRY_DSN, VITE_SENTRY_ENV=production, VITE_POSTHOG_API_KEY now live in CF Workers Builds Variables and secrets. Remaining Phase 1 external setup item: branch protection on main (pending a first CI run). |
| 2026-04-24 | Phase 2 Subphase 2.1 repo-side shipped | No doctrine shifts. State shifts: scaffolded `supabase/` directory with CLI config + `.gitignore` + five migration files: `0001_workspaces_and_members.sql` (creates `workspaces` + `workspace_members` with full workspace-membership RLS), `0002_backfill_default_workspaces.sql` (idempotent DO block — one default workspace per existing auth user, 4 users currently), `0003_workspace_id_retrofit.sql` (adds `workspace_id` column + index to existing data tables via conditional DO loop, installs `current_user_default_workspace_id()` helper used as the column default), `0004_new_noun_tables.sql` (creates the four missing sacred-noun tables: `proofs`, `advisor_deployments`, `readiness_snapshots`, `handoff_artifacts` — all workspace-scoped from day one; `readiness_snapshots` is append-only by grant), `0005_workspace_scoped_rls.sql` (installs `is_workspace_member(uuid)` helper; drops legacy `*_select_own` / `*_insert_own` / `*_update_own` / `*_delete_own` policies on every existing table and replaces them with workspace-membership policies; special-cases `profiles` with self-or-teammate-select + self-only-write). Also wrote `supabase/README.md` documenting layout + 7-step founder handoff (install CLI → `supabase link` → create `preview` branch → `supabase db push --linked` → verify → merge to main → update canon session log). Legacy root-level SQL files (`supabase-*.sql`) preserved for now as historical reference; plan is to delete once 0005 is verified in production. Next: founder runs §Founder handoff from `supabase/README.md`, then Phase 2.2 (typed data client at `src/lib/data-client.ts`). |
| 2026-04-24 | Phase 2.4 hotfix — deploy pipeline was blocking /data-migration/ | No doctrine shifts. State shift: discovered when founder's `antaeus.app/data-migration/` returned 404 that the CF Workers Builds service runs `tools/deploy/build-cloudflare-assets.js`, which only copies a fixed legacy allow-list (`app/`, `auth/`, `css/`, `js/`, three top-level HTML files) and `rm -rf`s `dist/` first — so Vite's `dist/assets/` + `dist/data-migration/` output never shipped. Fix (`build-cloudflare-assets.js`): script now runs `npx vite build` FIRST (which handles its own dist cleanup via `emptyOutDir: true`), then layers the legacy static files on top WITHOUT wiping. Two-world dist/ coexistence until the Phase 4 overall gate retires the legacy static app. No path collisions because Vite emits to `/assets/` + named new-stack entry dirs (`/data-migration/`, future `/<room>/`) while legacy emits to `/app/` etc. Verified locally: `rm -rf dist && node tools/deploy/build-cloudflare-assets.js` produces `dist/data-migration/index.html` + `dist/app/welcome/index.html` both present. 44 vitest still pass. Next: founder triggers a fresh CF build (push or retry-deploy); verifies `/data-migration/` renders on preview URL before main. |
| 2026-04-24 | Phase 2.3 live migration completed | **Phase 2 is done end-to-end.** Founder ran the data-migration tool on `antaeus.app/data-migration/` against production Supabase and achieved a clean close: Errors 0, Completion marker Set, 10 rows transformed (8 skipped via idempotency from earlier partial attempts + 2 freshly inserted — pipeline_settings via upsert, studio_artifacts with schema-verified placeholders). Getting there required 9 hotfixes over ~2 hours, each uncovering a real gap: (1) `4765a6e` CF deploy pipeline wasn't including Vite output (fixed build-cloudflare-assets.js to run vite build + layer legacy static on top); (2) `3b9b6e1` Posthog flag evaluated async, page showed OFF on first paint (added onFeatureFlagsReady subscription); (3) `881d06b` migrator erroring on non-JSON localStorage values like `gtmos_handoff_exported` which was stored as a raw ISO timestamp string, not JSON-wrapped (changed to preserve raw strings in blob); (4) `c84dfca` new Supabase client used a different `storageKey` than the legacy app, so auth session wasn't shared and `auth.uid()` was null causing RLS to reject every insert with "[object Object]" (changed storageKey to `antaeus-auth-token` matching legacy, plus added `stringifyError` helper to unpack Supabase plain-object errors into readable messages, plus wrapped non-Error values in real Error instances before handing to Sentry); (5) `20f4e87` server-side RLS recursion — `is_workspace_member` + `current_user_default_workspace_id` were SECURITY INVOKER so their internal `workspace_members` queries triggered the self-referential select policy → 42P17 infinite recursion. Migration 0006 (`20260424180000_fix_rls_recursion_and_data_columns.sql`) flips both helpers to SECURITY DEFINER + rewrites the workspace_members policy to use the helper + adds missing `data jsonb` to `pipeline_settings` and `studio_artifacts`; (6) `c754a1c` NOT NULL constraints on label columns + missing user_id defaults on pipeline_settings/studio_artifacts — introduced PASSTHROUGH_CONFIGS per-table shape with `placeholderFields` and `requiresUserId` flags, injected `user_id` from currentUserId(); (7) `149c2fa` pipeline_settings had UNIQUE(user_id) so insert collided with founder's existing row (added `upsertOnConflict: "user_id"` routing to raw client upsert); also added per-table idempotency check via `data->>migration_version` lookup so retries skip already-migrated blob rows rather than duplicating; also covered studio_artifacts.studio NOT NULL; (8) `a77be0e` studio_artifacts also needed `artifact_type` placeholder; (9) `292dfb9` + `e00c427` schema query revealed `title` as another NOT NULL and `studio` carrying a CHECK constraint limiting to 10 enum values — picked `'discovery'` as the blob's studio (broadest + first Phase 4 room migration so blob naturally houses there). All 9 fixes tested (47/47 vitest), documented in commit messages as provenance. Sentry observability verified working in prod for the first time (captured the RLS recursion error live). 8 Phase-1-through-Phase-2.3 commits stable on the branch behind the hotfix layer. Next: Phase 3 — first room migration (Discovery Studio per ADR-002 §6 Phase 3). Outstanding housekeeping (founder, non-blocking): rotate both supabase branch db passwords, delete failed merge request, resolve branch conflicts on app/signal-console/index.html + app/welcome/index.html so PR #2 becomes mergeable to main. |
| 2026-04-24 | Phase 2 Subphase 2.4 shipped — branch-aware env vars + /data-migration/ route + ADR timing note | No doctrine shifts. State shifts: (1) Vite build output restructured. Added `flattenSrcPages()` plugin in `vite.config.ts` that, after build, walks `dist/src/` looking for HTML files and copies each to `dist/<dirname>/index.html`, then rms the empty `dist/src/` tree. Effect: the data-migration page now ships at `dist/data-migration/index.html` instead of `dist/src/migration/index.html`, so the production URL is `antaeus.app/data-migration/` (matching the source directory name, which was also renamed `src/migration/` → `src/data-migration/` via `git mv`). Assets at `/assets/` unchanged because HTML script/link tags already use absolute paths. (2) Added `VITE_APP_ENV` env var (`production` | `preview` | `development`) + a prominent target-environment banner on the migration page — shows the env tag + the Supabase host parsed from `VITE_SUPABASE_URL` before any destructive action, so the founder/user can see which environment their click will hit. Banner tone is production orange / preview blue / development neutral. `.env.example` + `src/vite-env.d.ts` both updated. (3) Wrote `docs/founder-phase-2-supabase-env-setup.md` — click-by-click walkthrough for splitting CF Workers Builds Variables into Production + Preview tabs. Matrix specifies which vars MUST differ (`VITE_APP_ENV`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_ENV`) and which can stay identical. Includes prerequisite step to recreate preview Supabase branch if founder deleted it during 2.3 housekeeping. Explicitly supersedes the §1.3 "Note on scoping" in `docs/founder-phase-1-external-setup.md`. (4) Added "Note on estimates" callout in ADR-002 §6 clarifying that "3–4 days" / "1–2 days" / "~2 weeks" are solo-engineer calendar baselines — Claude-assisted sessions ship each subphase in 15–90 wall-clock minutes. Kept the human-scale numbers because they communicate relative complexity better than raw wall-clock + future sessions shouldn't assume Claude-speed. Typecheck + 44 vitest + vite build all green. Next: founder walks `docs/founder-phase-2-supabase-env-setup.md` §§1–5 to set the Preview tab in CF Workers Builds, verifies the banner shows correct env under both `antaeus.app/data-migration/` and the preview URL; then Phase 2.1 housekeeping (rotate DB passwords, clean up failed merge request); then Phase 3 begins — first room migration (Discovery Studio per ADR-002 §6 Phase 3). |
| 2026-04-24 | Phase 2 Subphase 2.3 shipped — localStorage migration tool | No doctrine shifts. State shifts: (1) Explore-agent inventory of every localStorage key the legacy static app reads/writes (found via `grep -r localStorage`). 41 keys mapped to 13 target tables + 23 keys intentionally kept client-side (UI state, analytics config, auth tokens, demo modes, deliverables prototype keys). (2) Created `src/lib/data-migration.ts` with `runDataMigration(options)` exported. Two gates: Posthog feature flag `data_migration_live` (default off) + idempotency marker `gtmos_migrated_to_supabase_v1` (ISO timestamp written on successful non-dry run with zero errors; re-runs refuse unless `force: true`). Shape: each of 13 noun tables gets a **pass-through migrator** that reads all its assigned localStorage keys, packs them verbatim into `data.migrated_from_localstorage` jsonb, and inserts a single row. Lossless, shape-agnostic, deterministic — no field-guessing. `profiles` is intentionally excluded because the table already has one row per auth user; merging onboarding localStorage belongs in the Phase 4 Onboarding room migration. (3) Preact UI page at `src/migration/` (DataMigrationPage.tsx + main.tsx + index.html + migration.css) — bright Trust-Annex posture, serif display title + mono ledger for result table, Dry-run / Migrate-now / Force-re-run buttons gated on flag state. Wired into Vite as a second multi-page entry (output `dist/src/migration/`); prod route `/data-migration/` will be finalized in Phase 2.4. (4) 28 new unit tests (44 total, all pass): flag gate, idempotency marker, force bypass, dry-run marker-skip, parse-error handling, empty-storage silent-skip, blob shape + migration_version stamp, per-key parse errors with invalid JSON. Typecheck + vitest + vite build all green. Also updated `.env.example` Supabase section, `CLAUDE.md` Part II.5 §2 (new data-access + schema-types conventions in previous commit). Next: founder housekeeping (rotate DB passwords, clean up merge request) + toggle `data_migration_live` flag in Posthog for own account first + visit `/data-migration/` to run dry-run then live-run; then Phase 2.4 (CF Workers Builds branch-aware credentials). |
| 2026-04-24 | Phase 2 Subphase 2.2 shipped — typed data client | No doctrine shifts. State shifts: added `@supabase/supabase-js@^2.50.0` dependency; created four files under `src/lib/`: (a) `database.types.ts` — hand-authored TypeScript view of the `public` schema (16 tables + 3 functions + enum-like string unions + convenience aliases `Deal`/`Proof`/etc.). Shape matches Supabase's generator output so a later `supabase gen types typescript --linked > src/lib/database.types.ts` run overwrites it cleanly. (b) `supabase-client.ts` — memoized `getSupabaseClient()` factory with env-var gate (throws if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` missing) + test injection hooks `__setSupabaseClientForTests` / `__resetSupabaseClientForTests`. (c) `data-client.ts` — `createDataClient()` returning an object with 15 per-noun accessors (`deals`, `proofs`, `advisorDeployments`, etc.) each exposing `list(options) / get(id) / insert(row) / update(id, patch) / remove(id) / subscribe(handler)` + top-level helpers `currentUserId()` / `currentWorkspace()` + standalone `optimisticMutate(current, transform, serverCall)` helper that returns `{ optimistic, promise, rollback() }` for rooms wiring their own state holders. Workspace scoping is intentionally not done in client code — RLS (installed in Phase 2.1) gates at the DB layer, which is the only tamper-proof place. Errors flow through `reportError()`; inserts/updates/deletes emit `data_client_*` Posthog events. Realtime via `postgres_changes` channel with per-table filter; RLS gates delivery per workspace. (d) Two test files, 24 tests total, all pass: `data-client.test.ts` (accessor shape + list query builder + get/insert/update/remove + subscribe channel name + currentWorkspace query shape + optimisticMutate semantics including rollback + server-rejection propagation) and `supabase-client.test.ts` (env-var-missing error paths + memoization invariant). Also updated `.env.example` (Supabase section now references data-client, production URL noted), `CLAUDE.md` Part II.5 §2 (new code conventions for data access + schema types regeneration). Pattern note: `makeNounAccessor<T>` type-erases at the Supabase boundary (casts `sb.from(table)` through `never` to `any`) because Supabase's strict per-table generics fail to narrow when `T` is itself a generic parameter — the `NounAccessor<T>` interface preserves typing at the consumer-visible surface. This is the idiomatic workaround for generic wrappers over `@supabase/supabase-js`. Next: founder runs Phase 2.1 housekeeping (rotate DB passwords, clean up merge request); then Phase 2.3 (localStorage-to-Supabase migration tool behind Posthog flag `data_migration_live`, 3–4 days of work). |
| 2026-04-24 | Phase 2 Subphase 2.1 applied end-to-end | **Schema extension live in production.** Founder walked the `supabase/README.md` §Founder handoff, surfacing three real-world issues that are now documented for next time: (1) Supabase CLI migration filenames require `<14-digit-timestamp>_<name>.sql` format — short `000N_` prefixes are silently ignored and `supabase migration list` returns an empty LOCAL column; renamed all 5 files to `20260424170000`–`20260424170004` (commit `c16c005`). (2) PostgreSQL rejects subqueries in column DEFAULT expressions — `default (select auth.uid())` errored; fixed to `default auth.uid()` on the 4 new tables' `created_by` columns (commit `6b40472`). (3) Supabase Branches' merge-request "Update branch" step fails with "multiple primary keys for table deals" when the preview branch has *additively* diverged from main (our case — we only add schema, never modify main's) because the rebase re-applies main's schema snapshot on top of preview's existing tables. Documented fallback: bypass the merge-request UI and push directly to main via `supabase db push --db-url <main-pooler-url>`. All 5 migrations applied cleanly to main in the end. Verification on main: all 4 real auth users have `owned_workspaces = 1` and `memberships = 1` (migration 0002 backfilled correctly — `tanyala74@gmail.com` / `jimmybarnas7@gmail.com` / `antaeus.coe@gmail.com` / `mrcoe7@gmail.com` each own one workspace and are the sole `owner` member). `is_workspace_member()` + `current_user_default_workspace_id()` both exist. 12 tables have `_workspace` policies (11 × 4 CRUD + 1 × 2 append-only for `readiness_snapshots`). Also upgraded to Supabase Pro during session to enable Branches. Next: Phase 2.2 (typed data client at `src/lib/data-client.ts`). Housekeeping owed: rotate both branch db passwords (shared in screenshots during session); delete the failed merge request and orphaned preview branch state; update `supabase/README.md` §Troubleshooting with the three gotchas above. |
| 2026-04-21 | ADR-001 foundation stack migration — approved + Phase 1 shipped | **Major architectural commitment.** Founder approved ADR-001 adopting Preact + TypeScript + Vite + Supabase (extended for data, not just auth) + Vitest + Playwright Test runner + Sentry + Posthog + GitHub Actions CI/CD as the permanent foundation for Antaeus. Scale target set to ~2,500 concurrent users initially (not 100K). Desktop-only product confirmed — mobile CSS may be deleted during migration. SPA routing and SSR both deferred with documented assessments. Phase 1 (Foundation) shipped in a single session: `00d723b` build tooling (Vite + TS + Preact + Vitest), `98bb3f6` testing infrastructure (Playwright Test runner + canonical templates + three boot smoke tests that assert no pageerror on dashboard / discovery-studio / deal-workspace AND the four Discovery Studio contract rails are visible), `de0539b` GitHub Actions (ci.yml + deploy.yml + pr-preview.yml + `.github/README.md` documenting required secrets and branch-protection setup), `026c419` observability (@sentry/browser + posthog-js + wrappers at src/lib/observability.ts + typed `import.meta.env` + `.env.example`). Canon updated: new Part II.5 (Component + Data Architecture) summarizes the stack and conventions; Part V §1 reflects foundation-in-progress; §2 already references `deliverables/adr/`. No room migrated yet — Phase 2 (data architecture) begins next session. All existing static rooms continue to work unchanged. |

## 7. Navigation Intelligence audit method (Phase 2 of the 2026-05 roadmap)

**Authority:** Locked 2026-05-17 (founder). The repeatable test method for every Phase 2 audit PR in the navigation-intelligence arc.

The Sarah-the-CRO copy sweep (#83–#96) is closed. It audited **rooms**. The next arc audits **clicks** — the connective tissue between rooms, the seams where the next move either feels inevitable or arbitrary. The unit of measurement is the click-sequence, not the room.

### The three artifacts that govern this work

1. **Sarah Chen persona** — `deliverables/audit/sarah-persona-2026-05.md`. The specific person every PR is tested against. Series A, $94M ARR, AI-native global contractor management platform, head of sales + first AE, the three calibrated walks (first 90 seconds / Tuesday 8:47 AM week 4 / handoff Tuesday week 12).
2. **Navigation-audit rubric** — `deliverables/audit/navigation-rubric-2026-05.md`. The three tests (hand-reach / inevitability / seam) + the four cuts (decorative buttons / missing buttons / surviving designer-voice copy / structural drift). Defines finding tags `[STRUCTURAL]` / `[SEAM]` / `[COPY]` / `[CANON]`.
3. **Continuity-param invariants** — `deliverables/audit/continuity-params-2026-05.md`. The eight testable invariants every cross-room seam must hold. The six canonical params (`returnTo` / `returnLabel` / `focusObject` / `focusRoom` / `fromMode` / `fromSurface`) with their readers (`src/lib/continuity.ts`) and per-room writers (`src/<room>/lib/handoff.ts`).

### The phase plan that this anchors

```
Phase 0  ──  Gate up (coming-soon)
Phase 1  ──  Method lock  ← this section + the three artifacts above   ✅ closed (PR #97)
Phase 2  ──  Navigation Intelligence pass (10 sub-PRs, rigid sequence)  ✅ closed (PRs #98–#107)
              2.1   Foundation: new-account flow      (Onboarding → Welcome → Dashboard seams)  ✅
              2.2   Foundation: Tuesday-morning flow  (Dashboard structural rework)             ✅
              2.3   Strategy flow                     (ICP → Territory → Sourcing → Signal)    ✅
              2.4   Outbound flow                     (Signal → Outbound → LinkedIn → Cold Call → Call Planner)  ✅
              2.5   Discovery flow                    (Call Planner → Discovery Studio → Deal Workspace seams)   ✅
              2.6   Recovery flow                     (Deal Workspace → Future Autopsy → PoC → Advisor)          ✅
              2.7   Synthesis flow                    (Quota Workback → Founding GTM)                            ✅
              2.8   Readiness Score slice             (Anchor + Drawer + verdict-transition ceremony)            ✅
              2.9   Trust flow                        (Settings)                                                 ✅
              2.10  Integration walk                  (Playwright full-day Sarah simulation)                     ✅
Phase 3  ──  Auth-UX standalone hardening (single PR)  ✅ closed (PR #108)
Phase 4  ──  Negotiation room rebuild              ✅ closed (PR #109)
Phase 5  ──  Static public face                    ✅ closed (PRs #110, #111, #112, this PR)
              5.1 Landing                ✅ PR #110
              5.2 Auth pages            ✅ PR #111
              5.3 Privacy + Terms       ✅ PR #112
              5.4 /why-antaeus/         ✅ this PR
              ↓
              Gate down → beta          ← next under rigid ordering
```

**Rigid ordering** throughout. No parallel work. Phase 2 sub-PRs land in numeric order. Phase 3 ships only after Phase 2.10 closes. Phase 5 ships only after Phase 4 closes.

### Per-PR cadence

**Grouped by user journey** (not per-room, not per-seam). Each Phase 2 PR walks Sarah through one flow she experiences as a continuous sequence. The walkthrough doc is the PR description; code follows. Per-flow PR contents: per-room structural changes + per-seam continuity fixes + per-flow Playwright walk.

### Supersession protocol for already-audited rooms

Phase 2 PRs supersede prior copy audits (#83–#96) **to the extent structural change forces, while maintaining copy standards.** PR description names superseded copy-audit PRs in a `## Supersedes` section. Copy untouched by structural rework stays as-shipped from the copy audit. Copy that must change because a button moved / a section reshaped / a CTA repurposed gets new copy that passes the Sarah-CRO rubric on top of the new structure.

### What "done" looks like

The Phase 2 closeout gate is the integration walk (2.10): a Playwright test that scripts Sarah's full day end-to-end — first 90 seconds + Tuesday morning + one each of strategy/outbound/discovery/recovery/synthesis flows. The walk is the proof that the seams hold across flow PR boundaries.

### What this method explicitly is NOT

- Not "another copy audit." Copy is one of four finding types; the other three (structural, seam, canon) are typically larger.
- Not per-room. Rooms are the unit of code; flows are the unit of analysis.
- Not optional taste. Without the persona + rubric + invariants, the audits are subjective; with them, every finding is testable.

## 8. Closing: what we're aiming for

Antaeus is not trying to be friendlier, broader, or more generic. It is trying to be:

- more specific
- more severe
- more operational
- more aware of where the work is decaying
- more ready for the founder to hand off

The redesign succeeds when the user thinks:
- *"I know what this is."*
- *"I know why it matters."*
- *"I know what happens next."*
- *"This feels sharper than the tools I'm used to."*
- *"This system sees what is actually happening."*
- *"This is something my first hire could actually inherit."*

If a change moves the product away from that, revert it. If it moves toward it, ship it.
