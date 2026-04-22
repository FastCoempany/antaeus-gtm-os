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

<!-- END_OF_DRAFT -->
