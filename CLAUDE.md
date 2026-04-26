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

**If you are the founder:** this is your working contract. When you make a decision that changes doctrine (direction shift, room-mind correction, new principle), update the relevant Part here and commit it with a short rationale. Stale canon is worse than no canon.

**Rendered visibility:** the app is static HTML. To see what a room actually looks like, start the Python server and use the capture script — see Part V for the workflow. Never audit a room from DOM or CSS alone; my own early audits were wrong because of this.

---

# Part I — The Mind

## 1. What Antaeus Is

**One-line:** The system that turns founder-led revenue motion into visible operating truth before the first serious go-to-market hire inherits it.

**Beta-era product sentence:** Antaeus helps founders and early operators see what is real, what is weak, what should happen next, and what a first serious hire would actually inherit.

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
| **ICP** | the wedge — one sharp definition of who the motion is for | defined in ICP Studio; filters every downstream room |
| **Account** | a named target organization with thesis, tier, signals, heat | shaped in Territory Architect + Sourcing Workbench; ranked in Signal Console |
| **Signal** | a time-limited event implying commercial opportunity | captured into Signal Console; converted into Motion |
| **Motion** | a specific outbound move (email, call, LinkedIn touch) with route and intent | crafted in Outbound Studio / Cold Call Studio / LinkedIn Playbook |
| **Call** | a planned or live conversation attached to an account/deal | prepared in Call Planner; run in Discovery Studio |
| **Deal** | an opportunity with stage, value, pressure, and qualification truth | tracked in Deal Workspace; diagnosed in Future Autopsy |
| **Proof** | a decision-grade evidence object built around claim/owner/metric/kill-rule | forged in PoC Framework |
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
- **Strategic logic:** the dashboard is where the hallway dies. It ranks pressure across all objects, exposes the reason a specific object is first, and offers one compressed act-or-inspect move. Three density modes (Brief / Spotlight / Queue) support different cognitive states; all three preserve ranking. Graph reward + workspace-health view belong here.
- **Primitives:** ranked object list, Brief narrative, Spotlight focus object, Queue triage flow, command intelligence ranking inputs (signal heat, deal pressure, staleness, value, downstream impact), graph reward, workspace health summary.
- **Flows in:** workspace health summaries from every deep room; system-health variant from Readiness + Quota Workback; signal heat from Signal Console; deal pressure from Deal Workspace.
- **Flows out:** one-click routing into whichever room owns the ranked object (with `focusObject`, `returnTo` preserved).
- **Must never be flattened:** Brief/Spotlight/Queue as distinct modes; the room-browsing rail does not belong center stage; command intelligence must stay reasoned, not decorative.

### 4.3 Onboarding — Threshold

- **Purpose:** produce real Brief items as a side effect of setup, so the user lands in a Dashboard that is already live.
- **Strategic logic:** activation is behavioral engineering, not a form. Each micro-commitment creates escalating psychological investment (Commitment + Consistency). The first ask must be genuinely low-friction. By the end, the Brief should contain 8–15 ranked items so the dashboard does not feel empty.
- **Primitives:** ICP definition, first 10 accounts, email connection, first quota target, first motion — each produces one or more Brief items.
- **Flows in:** new user context (industry, scale).
- **Flows out:** `gtmos_activation_context` + seeded items across ICP Studio, Territory, Signal Console, Dashboard.
- **Must never be flattened:** the principle that onboarding output *becomes* the Brief — not a separate "completion" screen.

### 4.4 ICP Studio — Decision Bench

- **Purpose:** sharpen one strategic wedge so downstream rooms have real targeting truth to inherit.
- **Strategic logic:** the ICP object is the thing being sharpened; it is the central authored surface, not a form output. "Thin means fewer assumptions, fewer personas, fewer use cases." The ICP is the filter that manifests as "ICP Match" scoring on every Account everywhere.
- **Primitives:** ICP statement, buying-group minimum, focus recommendation, owner/pain/trigger/proof-window inputs, match histogram.
- **Flows in:** Onboarding activation; founder conviction.
- **Flows out:** ICP match score reaches Territory Architect, Sourcing Workbench, Signal Console, Outbound Studio, Discovery Studio, Readiness, Handoff Kit.
- **Must never be flattened:** ICP sharpness as a strategic bet; never weaken it into a generic persona form.

### 4.5 Territory Architect — Decision Bench

- **Purpose:** turn the ICP into a tiered territory with theses, approaches, and a hard 300-account ceiling that forces strategic ownership.
- **Strategic logic:** the territory is a map of strategic bets, not a list. Theses encode "what pressure + which segment + why we're the right seller." Tiers are a resource-allocation commitment, not a ranking. The 300-cap and swap mechanic make each account feel consequential.
- **Primitives:** sales-cycle calibration, theses, approaches, tiers, thesis-to-account tagging, approach ledger.
- **Flows in:** ICP Studio.
- **Flows out:** tier + thesis into Sourcing Workbench, Signal Console.
- **Must never be flattened:** the strategic tier logic; the act of making a thesis. Never reduce to a contact list builder.

### 4.6 Sourcing Workbench — Decision Bench

- **Purpose:** turn theses into named, pushable prospects; prevent the territory from sitting as a blank ceiling.
- **Strategic logic:** a prospect-push engine tied to thesis. Query Cards make platform-specific search reproducible. Research on a prospect converts it into a qualified account. The room's north star is pushing clean prospects forward and *not* polishing them here.
- **Primitives:** query cards (per platform), prospect records, research modal (match/entry-point/approach), pipeline tabs, persona guidance.
- **Flows in:** Territory Architect (thesis, tier, approach vocabulary).
- **Flows out:** qualified accounts into Signal Console; push decisions carry thesis + approach context forward.
- **Must never be flattened:** the discipline that accounts must pass thesis match before they reach Signal Console.

### 4.7 Signal Console — Live Instrument (*named premium asset*)

- **Purpose:** convert signals into ranked motion; the live radar where account heat becomes real work.
- **Strategic logic:** signals are time-limited events. Heat = signal count × type weight × source credibility × recency decay. Research on a qualified account may justify motion; research without motion is collection theater. Account heat feeds Dashboard command ranking.
- **Primitives:** account list, signal records, heat score per account, morning brief, research posture ("motion ready" vs "research heavy"), workspace-health block (compounding vs still weak), enrich-all flow.
- **Flows in:** accounts from Sourcing Workbench + Territory Architect; ICP match score.
- **Flows out:** ranked accounts into Outbound Studio, Cold Call Studio, LinkedIn Playbook; heat + readiness into Dashboard; heat + motion state into Handoff Kit.
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

- **Purpose:** cast one decision-grade proof object so pilots stop becoming optimism theater.
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

### 4.17 Readiness Score — System Ledger

- **Purpose:** synthesize across all rooms whether the motion is hire-ready, and tell the user what is still fragile.
- **Strategic logic:** readiness is a multi-dimensional system view (Playbook, Signal Console, Pipeline, Deal Quality, Discovery Quality, Proof, Handoff). Score is earned, not gamified. The room exists to make fragility legible so the user can fix it before the hire arrives.
- **Primitives:** dimension scores, overall readiness score, verdict ("Hire-ready with guardrails" / "Partial" / "Thin"), posture per dimension, system-health variant (not Workspace health), unlock logic, bar chart across dimensions.
- **Flows in:** summaries from every deep room; `gtmos_readiness_snapshot`.
- **Flows out:** verdict + dimension breakdowns into Dashboard, Welcome, Handoff Kit.
- **Must never be flattened:** system truth, score credibility, handoff confidence. Never decorative scoring.

### 4.18 Quota Workback — System Ledger

- **Purpose:** turn a quota target into weekly execution pressure the user can feel.
- **Strategic logic:** quota math is execution pressure, not isolated planning. The workback tells the user how many meetings per day, motions per week, and deals per quarter they actually need — pinned against real pipeline state.
- **Primitives:** annual quota, ACV, win rate, cycle length, daily activity targets, pipeline coverage, system-health variant (fragility, coverage).
- **Flows in:** pipeline from Deal Workspace; motion from Outbound/Cold Call; onboarding targets.
- **Flows out:** targets into Dashboard; coverage truth into Readiness; execution pressure into Outbound + Cold Call.
- **Must never be flattened:** quota as execution pressure. Never disconnected planning math.

### 4.19 Founding GTM / Handoff Kit — System Ledger

- **Purpose:** the exportable artifact the first hire actually inherits — a documented, scorable, handoff-ready system.
- **Strategic logic:** the whole app compounds here. Six sections: how the 1st hire fits, how we sell now, how we run discovery, how we close, how we win/loss, scorecard. The handoff is the north star — everything else is upstream to it. Loss patterns from Deal Workspace feed the win/loss section.
- **Primitives:** 5-section strategic playbook, 6-step deal methodology, scorecard, exportable brief.
- **Flows in:** every room. Especially: loss patterns from Deal Workspace; readiness from Readiness; motion memory from Outbound/Cold Call/LinkedIn; discovery truth from Discovery Studio.
- **Flows out:** export history + completeness into Dashboard, Readiness.
- **Must never be flattened:** handoff seriousness; exported system truth. Never weakened into a generic document template.

### 4.20 Settings — Trust Annex

- **Purpose:** keep the user safe, make trust and recovery real, without stealing attention from live operating rooms.
- **Strategic logic:** calm, plainspoken utility. Export all data, import, delete all, sync state, data-stored-locally notice, account controls. No drama, no internal architecture language, no fake product excitement.
- **Primitives:** backup/restore, role + onboarding state, category framing, browser-specific controls.
- **Flows in/out:** manages `gtmos_*` localStorage keys; bridges to Supabase auth.
- **Must never be flattened:** the trust signals. Never mixed with operating-room energy.

---

## 5. Named premium assets (protected)

These rooms carry named-asset protection: they may not be genericized, renamed, folded into other rooms, or casualized.

- **Signal Console**
- **Future Autopsy**
- **Discovery Studio** *(by virtue of the 2026-04-10 strict room contract and the five guardian specs)*

A face pass may tighten how these rooms look. A face pass may not reduce what they know.

---

## 6. Compounding rules (cross-room)

The full matrix lives in `03-facial-architecture/antaeus-phase-7-preflight-behavioral-copy-burden-audit-and-disclosure-matrix-2026-04-02.md` §11. Short form:

- **Onboarding** seeds ICP framing, Discovery framing, Quota framing, Settings, Welcome, Dashboard (`gtmos_activation_context`).
- **ICP Studio** feeds Territory, Sourcing, Signal Console, Outbound, Discovery, Readiness, Handoff (shared targeting defaults).
- **Territory** feeds Sourcing, Signal Console (tiers + theses).
- **Sourcing** feeds Signal Console, Territory (pushed prospect continuity).
- **Signal Console** feeds Outbound, LinkedIn, Dashboard, Readiness, Handoff (account heat + motion context).
- **Outbound / LinkedIn / Cold Call** feed Dashboard, Readiness, Handoff (shared motion truth).
- **Cold Call** also creates Deals on `meeting_booked` and feeds Deal Workspace directly.
- **Call Planner ↔ Discovery Studio** via `gtmos_call_handoff`.
- **Discovery Studio** feeds Deal Workspace, Handoff, Readiness.
- **Deal Workspace** feeds Future Autopsy, PoC, Advisor, Dashboard, Readiness, Handoff.
- **Future Autopsy** feeds Deal Workspace, Call Planner, Discovery Studio, PoC (reroute logic).
- **PoC Framework** feeds Deal Workspace, Dashboard, Handoff.
- **Advisor Deploy** feeds Deal Workspace, Dashboard, Handoff.
- **Quota Workback** feeds Dashboard, Outbound, Cold Call, Deal, Readiness.
- **Readiness** feeds Dashboard, Welcome, Handoff (`gtmos_readiness_snapshot`).
- **Handoff Kit** feeds Readiness, Dashboard, future launch readiness.

**Preserved continuity params (do not break):** `returnTo`, `returnLabel`, `focusObject`, `focusRoom`, `fromMode`, `fromSurface`, room-entry bridge, pinned context, stable command selection on return.

---

# Part II — The Face

## 1. Direction lock

Antaeus is no longer dark-first. The current direction — confirmed by the visual-identity-lock memo (2026-04-01), the visual-system-spec (2026-04-01), and the refaced rooms — is:

**bright · severe · composed · authored · dense but calm**

The interior reads as a premium operating instrument rendered on a bright, quiet field. Not a dark founder-admin shell. Not a generic SaaS pastel. Not a trend-chasing clean-design kit.

### The one exception: System Ledger rooms are dark

Not every room is bright. Evidence from the live refaced rooms shows a consistent pattern:

- **Readiness Score** — full dark navy
- **Quota Workback** — full dark navy
- **Founding GTM / Handoff Kit** — full dark navy
- **PoC Framework** — dark/light split stage (dark "forge" left, cream "cast" right)
- **ICP Studio** — dark hero band over bright work area

The pattern: **synthesis, judgment, and earned-truth surfaces are allowed to go dark. Live operating rooms, entry surfaces, and diagnosis tables stay bright.** Dark is where the system reconciles evidence and asks to be taken seriously. It is not a default; it is earned.

This aligns with the rubric's fail signal "dark-and-heavy founder admin energy" — that fail mode is about *default* darkness. System-ledger darkness is different; it's consequential, not decorative.

### What bright means here

The base field is a soft, bright neutral with a cool cast — `#F6F8FC` territory, not stark white. Restrained gradient air is allowed: radial washes of blue and orange behind the base, subtle graph-paper undertexture (1px grid at ~32–34px with very low opacity). Deep navy ink sits on top for authority. The bright field is quiet, not flat.

### What dark means here

When a room goes dark, it goes navy — `#0A1C40` territory — with light text, restrained orange accents for pressure, and green only for earned health/completion. Dark rooms must earn their weight: they are saying "the system is reconciling evidence and you should feel that." Dark is not ornamental.

---

## 2. Typography lock

- **Serif** — authority, emphasis, consequence. Authored serif headlines carry the thesis of the room. Large, confident, often `clamp(48px, 6vw, 108px)` for the dominant thesis line. Preferred: *DM Serif Display*.
- **Modern sans** — control surfaces and reading. Buttons, inputs, body copy, labels. Preferred: *Public Sans*, *Plus Jakarta Sans*, *Outfit* (for display-weight sans).
- **Mono** — kickers, meters, operational micro-labels only. Never body text. Letter-spaced uppercase for section codes. Preferred: *JetBrains Mono*, *IBM Plex Mono*.

**The compression rule:** authored serif headlines carry the thesis. Sans carries the work. Mono recedes.

**Type discipline:**
- One dominant thesis per surface — never two competing serifs at similar weight
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
- **Laws:** first-visible zone exposes pressure fast; risk and truth are legible before long explanation; corrective route is obvious; health language feels like operating truth, not analytics theater
- **Avoid:** abstract diagnosis without corrective motion; dramatic narrative copy at the top; boxed warning-board clutter

### 4.6 System Ledger (synthesis — dark)
- **Rooms:** Readiness Score, Quota Workback, Founding GTM / Handoff Kit
- **Feel:** earned, synthesizing, steady, authoritative, consequential
- **Laws:** the system should feel like it is reconciling evidence; one summary state dominates; secondary metrics support that state; compact system-health pattern is acceptable; **dark is permitted and recommended**
- **Avoid:** BI-dashboard composition; scoring-widget field; decorative metrics with no consequence

### 4.7 Trust Annex (utility)
- **Rooms:** Settings, auth, legal/privacy, purchase
- **Feel:** calm, trustworthy, plainspoken
- **Laws:** no drama; no internal architecture language; clear recovery moves; clear trust signals
- **Avoid:** overdesigned utility chrome; fake product excitement

### 4.8 Hybrid families (Decision Bench with dark hero)

ICP Studio and PoC Framework use a Decision Bench mind with a **dark hero band above a bright work area**. This is allowed. The dark hero carries the strategic thesis; the bright lower area is where the actual decision gets shaped. Do not invent new hybrid patterns without updating this doc.

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
- Makes the product feel more like a generic dashboard than a premium operating instrument
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

---

# Part III — The Behavior

The product is engineered around behavior. Every rule here exists because there is evidence — usually a replicated effect at d ≥ 0.5 — that says it works on real users. Behavioral doctrine is the spine connecting mind and face; this part is how we defend the user's attention, confidence, and follow-through.

The canonical source for this part is `03-research-backbone/antaeus-architecture-restructure-research-brief-source-2026-03-31.md` (the 40-source research synthesis) and `01-charter-and-laws/antaeus-ui-ux-design-thesis-and-system-rules-2026-03-31.md` (the seven behavioral rules).

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

Least resistance does NOT mean: fewer controls at all costs, oversimplifying serious work, hiding operating truth. It means: less friction to *meaningful* action, less drift into low-value behavior, less room for ambiguous wandering.

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

- **First 30 seconds (new user):** minimal steps, belief-system-first. Show the thesis briefly ("This is your strategic operating room"), drop into guided ICP definition with one field to complete first. The peak of the first session is when the user's first data appears in the Brief — the IKEA "I built this" moment.
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
- The first-fold thesis legible before reading?
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

## 1. Where the refacing pass stands (2026-04-21)

The refacing pass (arc: Apr 1 → ongoing) is partially complete. Screenshot-based re-audit — not DOM-based — produced the following status. DOM-based audits from earlier in this session were consistently too harsh; rendered output is stronger than CSS reading suggested.

### Substantially refaced (current visual language)

Bright-field operating rooms:
- **Welcome** — Threshold, strong refacing, week-one checklist working
- **Dashboard** — Command Chamber, command intelligence rail + Spotlight + ranked accounts
- **Signal Console** — Live Instrument, bright (not dark as the CSS vars suggested), `Meridian Logistics` spotlight + dense account grid
- **Outbound Studio** — Live Instrument, switchboard metaphor restrained, 3-column route board
- **Cold Call Studio** — Live Instrument, six-thread spine working, score + say-next capture panels below
- **LinkedIn Playbook** — Live Instrument, 5-cue ladder + dark center "stage" in a bright room
- **Call Planner (Discovery Agenda)** — Live Instrument, four-stop spine (Open / Reason now / Probe / Advance ask) clean
- **Discovery Studio** — Live Instrument / Diagnosis Table hybrid, 10-segment spine implemented, compression mode works
- **Territory Architect** — Decision Bench, "Let signal pull the territory into shape" mature execution
- **Sourcing Workbench** — Decision Bench, ticket-board metaphor, clean
- **ICP Studio** — Decision Bench with dark hero + bright work area split
- **Deal Workspace** — Diagnosis Table, intervention board + recovery queue working
- **Future Autopsy** — Diagnosis Table, forensic light-table, **positive example the others should borrow from**
- **Advisor Deploy** — Live Instrument, rolodex metaphor + ask-ready score + registry/loops ledger

Dark System Ledger rooms:
- **PoC Framework** — Decision Bench hybrid (dark forge / cream cast split)
- **Readiness Score** — System Ledger, full dark
- **Quota Workback** — System Ledger, full dark
- **Founding GTM / Handoff Kit** — System Ledger, full dark

Utility:
- **Settings** — Trust Annex, bright, functional cards

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

### Foundation migration (ADR-001 + ADR-002)

The repo is mid-migration from legacy static-HTML + localStorage + innerHTML onto **Preact + TypeScript + Vite + Supabase (extended) + Vitest/Playwright + Sentry + Posthog + GitHub Actions**. ADR-001 (`deliverables/adr/adr-001-foundation-stack-migration-2026-04-21.md`) defines the stack and 5-phase plan; ADR-002 (`deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md`) rescopes Phase 2 around the existing production Supabase project.

**Status as of 2026-04-25:**

| Phase | Status | Date | Summary |
|---|---|---|---|
| **Phase 1** Foundation | ✅ shipped | 2026-04-21 | Vite + TS + Preact build tooling; Vitest + Playwright + canonical templates; GitHub Actions CI; Sentry + Posthog wrappers (commits `00d723b`, `98bb3f6`, `de0539b`, `026c419`). |
| **Phase 2** Data architecture | ✅ shipped | 2026-04-24 | Workspaces + workspace_members + 4 missing noun tables + workspace_id retrofit + workspace-scoped RLS; typed `data-client.ts` with optimistic updates + realtime; localStorage→Supabase migration tool behind `data_migration_live` flag; CF Workers Builds branch-aware env vars. **Live migration completed same day** — 10 rows transformed cleanly, Errors 0, idempotency marker set. |
| **Phase 3** Discovery Studio rebuild | ✅ shipped | 2026-04-25 | First room migrated. Six waves, each its own PR + green CI: scaffold (PR #3), framework loading (PR #3), interactions (PR #4), Supabase persistence (PR #5), on-call control surfaces (PR #6), legacy flag-redirect (PR #7). Behind Posthog flag `room_discovery_v2`. |
| **Phase 4 / Room 1** Deal Workspace rebuild | ✅ shipped | 2026-04-25 | First room within ADR Phase 4. Six waves on a single branch + single PR (#8): scaffold + state, read-path persistence, modal interactions + write path, realtime + legacy mirror, filter chips + workspace-health snapshot, legacy flag-redirect. Behind Posthog flag `room_deal_workspace_v2`. |
| **Phase 4 / Rooms 2–19** | ⏳ pending | — | Remaining room migrations in priority order per ADR-001 §6 — Dashboard, Signal Console, Future Autopsy, PoC Framework, Outbound Studio, Cold Call Studio, LinkedIn Playbook, Advisor Deploy, Call Planner, Territory Architect, Sourcing Workbench, ICP Studio, Readiness Score, Quota Workback, Founding GTM, Welcome, Onboarding, Settings. Phase 4 overall gate: all 19 rooms stable + legacy `/app/<room>/` + `js/<room>-*.js` deleted. |
| **Phase 5** Static pages polish | ⏳ pending | — | Landing, privacy, auth pages — open-ended steady-state work per ADR-001 §6. Begins after Phase 4 closes. |

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
  - Unsaved-changes guard: `js/unsaved-guard.js` exists and is wired for **ICP Studio + PoC Framework** as of 2026-04-21 (commit `2e18122`). Still needs to be activated in Founding GTM, Outbound Studio, Deal Workspace, CFO Negotiation, Discovery Agenda, Content Builder. Each room needs the script tag + `unsavedGuard.watch(<container>)` in its boot + `unsavedGuard.markClean()` in its save handler.
  - Auth failure user-facing errors: still owed
  - Auto-save on Founding GTM: still owed
- **Phase 2 (data safety):** analytics SDK integration (Posthog or Plausible), "Export All Data" JSON, "Data stored locally" notice, "Delete my data"
- **Phase 3 (export completeness):** Deal Workspace CSV, Readiness export, Command Center export
- ~~**Phase 5 (label fixes):**~~ *Already done during architecture-reset / nav re-architecture. The flagged labels (Command Center, Live Discovery, Content Builder, Agent Lab) no longer exist in the current code. Verified via grep 2026-04-21.*

These don't block the refacing pass, but they do block beta.

## 2. Canonical doc locations

Canon order of authority (highest first):

1. **This file** (`CLAUDE.md`) — operating canon for sessions
2. `deliverables/design-principle-strict-bible/` — deeper authority for specific topics:
   - `01-charter-and-laws/` — UI/UX design thesis + rebrand truth-lock
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

## 7. Closing: the bar

Antaeus is not trying to be friendlier, broader, or more generic. It is trying to be:

- more specific
- more severe
- more operational
- more pressure-aware
- more transfer-ready

The redesign succeeds when the user thinks:
- *"I know what this is."*
- *"I know why it matters."*
- *"I know what happens next."*
- *"This feels sharper than the tools I'm used to."*
- *"This system sees what is actually happening."*
- *"This is something my first hire could actually inherit."*

If a change moves the product away from that bar, revert it. If it moves toward it, ship it.
