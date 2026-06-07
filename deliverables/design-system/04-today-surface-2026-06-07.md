# Antaeus Design System — The Today Surface

**Status:** DRAFT for founder review.
**Date:** 2026-06-07.
**Author:** Claude, working session with the founder (mrcoe7@gmail.com).
**Branch:** `claude/antaeus-gtmos-design-system`.
**Scope:** This is the fourth sibling document under the design system charter (`00-charter-2026-06-02.md`). It specifies what the operator lands on when they open the product: how that surface ranks the work, how its resting state behaves when the system has a read but the operator has not asked for one, and where the deferred questions the other three specs pointed here finally resolve. The today surface is, in canon terms, the Dashboard's mind (`canon §4.2`, the Command Chamber) written as a design-system spec. The voice spec (`01`) governs what it says, the density spec (`02`) governs how much, the component library (`03`) gives it the Wayfinder bar, the Pulse timeline, and the Grounded cards it is built from. This spec governs how those compose into a home.

---

## 0. Why this exists

Three specs defer to this one by name. The density spec (`02` §0) sends the hybrid case — a fluent operator opening a brand-new workspace — here. The density spec again (`02` §2.3) sends the second Phase F proposal surface here. The component library (`03` §4.8) says plainly that it gives the building material but "does not decide what the operator lands on when they open the product — the home surface, its ranking, its resting-state behavior, and how the agency boundary holds when the system has a read but the operator has not asked for it." That is this document.

It exists because the landing is the highest-stakes surface in the product and the easiest to get wrong in a way that contradicts the charter. Get it wrong toward emptiness and the operator lands in a neutral void that wastes the intelligence underneath. Get it wrong toward imposition and the system decides for the operator what to care about, which the charter's agency boundary forbids. The whole point of Antaeus is an engine that has been thinking while the operator was away; the today surface is where that thinking is offered without being forced. This spec resolves the line between offered and forced, and it does so in a way that satisfies both the charter's command-first doctrine and its agency boundary — which, examined closely, were never in conflict.

---

## Part I — What the today surface is

### 1.1 The landing question, resolved: the surface ranks, but never imposes

The operator opens the product and lands on **a calm brief** — a short read, three to five sentences, naming what is most pressured, what changed since last session, and the one move the system would make next. Not a grid, not a wall of ranked deals: a peer's summary of where things stand. The system's one read also sits in the Wayfinder bar's *pulling* cell, visible the moment the operator arrives. Behind the brief, the work *is* ranked — the system has ordered the whole pipeline by pressure — but that full ranked view (the Pulse timeline of `03` Part II) is the **Queue read**, one switch away, not the thing thrown at the operator on arrival. The landing is the quietest of the three reads, and the operator reaches for more density when they want it (Part III).

And nothing opens. No room auto-launches, no modal demands triage, no item forces itself into the center, and the operator is not met by their entire pipeline ranked and waiting. The operator can act on the system's pick, switch to the ranked Queue to triage, open one object in Spotlight, act on something else entirely, or sit and read the brief. The ranking exists — the system has done its thinking — but at rest it is **summarized in a brief, not spread across the surface as a demand**. The ranking is the system *surfacing its read*; it is not the system *acting on the operator's behalf*, and it is not the system filling the operator's first screen with everything at once. That distinction is the whole resolution.

This reconciles what looked like a tension. The charter's command-first doctrine (`canon Part I §3`, `Part III §6`) says the operator "lands in ranked pressure, not a hallway of modules." The founder's standing concern — that auto-landing on a ranked workspace does a disservice to the operator who wants to decide what they care about — sounds like the opposite. It is not. Command-first was never about imposition; it was about replacing the hallway of equal-weight doors with one ranked read. The disservice the founder named is **imposition** — the system deciding *for* the operator. The today surface ranks (command-first) and refuses to impose (agency-preserving). The operator lands in ranked pressure and remains free to ignore all of it.

### 1.2 The agency boundary at landing

The charter's §2.1 agency property is the spine of this spec: the system has agency over itself, the operator has agency over their work. At the moment of landing, that means:

- **The system may rank, read, and surface.** It orders the pipeline, names the one move it would make, accumulates observations while the operator is away, and shows all of it.
- **The system may not open, act, or insist.** It does not auto-navigate into a room, auto-send anything, auto-dismiss the operator's own focus, or escalate a surface to demand attention. The Wayfinder's *pulling* cell is an offer with a "skip" that sends nothing (`03` Part III).
- **Escalation is reserved for real, destructive risk** (`canon Part III §3` rule 7) — a deal about to close-lost, an unsaved edit about to be discarded — never for ordinary ranking. The today surface is calm by default; intensity is earned by consequence, not manufactured to drive engagement.

The line is testable: if a future change makes the surface *do* something on the operator's behalf at landing — open the top deal, start a triage flow, mark observations read — it has crossed the boundary and is out of bounds without founder sign-off through the mind-correction protocol.

### 1.3 It is the Dashboard

The today surface is not a new room. It is the mind of the existing Dashboard (`canon §4.2`), specified as a design-system surface so the rebuild has a contract. Everything canon already locks about the Dashboard holds: it ranks everything under pressure, explains why a specific object came up first, offers one compressed act-or-inspect move, and never reduces its reasoning to a decorative score. The three modes canon already names — Brief, Spotlight, Queue — are the today surface's three reads (Part III), and canon's own framing helps here: the Brief is the calm default landing, and the ranked Pulse-timeline view is the Queue. What this spec adds to canon §4.2 is the un-nav rendering (the Wayfinder bar as the orientation, the Brief as the resting body, the ranked Pulse timeline available as the Queue read) and the explicit resolution of the resting-state agency question canon left implicit — that the landing is the brief, not the full ranked surface.

### 1.4 What the today surface is not

The surface is sharp about its own edges, because the easiest way to ruin a home is to let it absorb jobs that belong elsewhere:

- **It is not the Briefing room.** The Briefing (`canon §4.21`) is the operator's daily sit-down — what the system saw across their workspace *and* the market, at length, with the audit trail behind each read. The today surface carries only a quick-glance band of the *workspace* reads (§3.3) as a secondary reach point. A glance on the way past here; the full read in the Briefing. The duplication is deliberate (ADR-014), and the two are cross-deduped so the same observation never shouts twice.
- **It is not where the work is done.** It ranks, summarizes, and routes; the actual work — sharpening an ICP, running a call, casting a proof — happens in the rooms it routes to. A today surface that tries to become the place you do everything is a dashboard-bundle, the charter's hard reject.
- **It is not a feed or a notification center.** It does not stream every event, badge unread counts, or compete for attention. It is a calm read that waits, not an inbox that accumulates.

---

## Part II — How it ranks

### 2.1 What ranks

The order is computed from the ranking inputs canon §4.2 already names, carried forward unchanged as the model: how hot the signals are on an account, how much pressure a deal is under, how long it has been stale, its dollar value, and what changes downstream if the operator acts. These are read from the state each room *publishes* — the health snapshots Signal Console, Deal Workspace, PoC, and Quota Workback already write, plus the orchestration layer's observations ledger (`canon Part II.5 §7`) — not recomputed on the surface and not reached for by querying each room live. The today surface is a reader and a ranker; it is not the owner of any noun (`canon Part I §3` truth 3), and it reads published state so a slow or unmigrated room degrades the surface gracefully rather than blocking it. Graceful means honest: when a source is stale or unavailable, the Brief says what it cannot see ("I can't read your deals right now — coverage below is from this morning") rather than ranking on partial data and presenting it as the whole picture. The charter's loyalty to the operator's interests, expressed through truth, holds even when the data is thin — a confidently wrong ranking is worse than an honest gap.

### 2.2 The ranking is explainable, never a bare score

Every ranked item can show *why it is here* and *why it is in this order* — the command-intelligence reasoning canon §4.2 protects ("the Dashboard's ranking must keep showing its reasoning — never reduced to decorative scores"). This is the same reasoning the Wayfinder bar opens inline (`03` §3.2): a plain-sentence read, an evidence ledger, and the alternatives the system also considered. A score may exist as the math; it is never the surface. The operator can always interrogate the rank, which is itself an agency affordance — a ranking you can question is one you can overrule.

### 2.3 The rank is stable

The order does not churn. A live data refresh that nudges the math must not reshuffle the surface under the operator's eyes; the previous focal item stays pinned unless something genuinely more pressured displaces it (the stability rule the Dashboard rebuild already carries, `canon Part V` Phase 4 / Room 2). Stability is an agency property too: a surface that reorders while you read it is making decisions you did not ask for.

This holds for mid-session arrivals as well. When something genuinely more pressured lands while the operator is reading — a deal slips, a hot signal arrives — the surface does not jump or re-rank under them. It surfaces a quiet "new" marker the operator can pull in when they choose, and the next time the surface is opened fresh the new item takes its earned place. Realtime keeps the data current; it never moves the floor under the operator's feet. The one exception is the same one as everywhere (`§1.2`): real, destructive risk may escalate, because a deal about to close-lost is worth interrupting for.

### 2.4 One thing breaks rank

Within the ranked reads (Spotlight and Queue), exactly one item — the single most-pressured — is the Offset (`03` §2.4): its tag outside the card, its action below it, the eye's guaranteed landing place inside the list. And at rest, before the operator has opened any ranked read at all, that same one move is what the Brief names and what sits in the Wayfinder *pulling* cell. This is how the surface renders canon's "one dominant move" without imposing it — the one move is *visible and singular* at every level of density, and still optional at all of them.

---

## Part III — The resting state, the reads, and the session

### 3.1 The resting state is the calm Brief

When the operator has asked for nothing, the surface is not blank, not loud, and not their whole pipeline spread out and ranked. It is the **Brief** — a short narrative of what is most pressured, what changed since last session, and the one move — with the system's pick also in the Wayfinder bar and the week's accumulated observations in a quiet band below. And it waits. This is the charter's signal that the system has been thinking, offered as a peer's summary rather than a demand. The ranked pipeline is *behind* the brief, one switch to the Queue read away (§3.2), not the thing the operator is met by. The resting state draws on the component library's sparse and empty states (`03` §4.4): a brand-new workspace shows an empty state that names why the surface matters and the one move that fills it ("No pipeline yet — add your first account"); a two-deal workspace shows a brief that honestly says there are two deals and which one needs attention, not a half-broken grid. The resting state is never a void, never a demand, and never a wall.

### 3.2 The three reads — Brief, Spotlight, Queue

The surface offers three lenses onto the same ranked work, rendered with the Segmented control (`03` §4.1). The **Brief is the default landing for everyone** — the calm read the operator arrives on. Spotlight and Queue are reads they switch to when they want more, and the choice persists once made.

- **Brief** is the narrative read and the resting default — three-to-five sentences naming what is most pressured, what changed since last session, and the one move, written in the today-surface's family voice. It is where the operator lands, fluent or new alike; the system summarizes rather than spreads. The density gradient tunes *how much* the Brief says (a longer walked-through Brief in *Show me how*, a tighter one in *Step back*), but it does not change that the landing is the Brief.
- **Spotlight** is the single-focal-object read — one Grounded card at full depth (Signal / Reason / Move, the evidence, the alternatives), the rest as a quiet queue rail. The operator switches to Spotlight to work one thing deeply.
- **Queue** is the triage read — the full ranked pipeline as the Pulse timeline (`03` Part II), compact, one line of reasoning per row, built for an operator clearing a morning. Queue is the densest read and the one a fluent operator may *choose* to make their default once they have decided they want to be met by the ranked list. That is the operator electing density, not the system imposing it — the agency line holds because the wall is opt-in, never the arrival.

All three keep the ranking and its reasoning; they differ only in how much of the surface ships at once, which is the density gradient's quantity-not-personality axis (`02` §1.3) applied at the scale of the whole surface. The operator's chosen read persists per the continuity and memory property; the surface opens where they left it — but the *system* default, the one a fresh workspace and a fresh operator meet, is always the calm Brief.

### 3.3 Where the week's reads land

The orchestration layer's workspace observations (`canon Part II.5 §7`, ADR-009 — the heartbeat's deal-decay, signal-decay, proof-staleness, discovery-rhythm reads) surface on the today surface as a distinct, quiet band — the "this week's reads" the Phase B work already ships. They are observations, not commands: a peer's notes on what moved and what went quiet, dismissable, never a task list. They sit on the surface below the Brief, a quiet band rather than the headline, because they are a different altitude — what the system noticed over the week, versus what is most pressured right now that the Brief leads with.

The band is the *glance*, not the *read*. The full daily check-in — workspace and world, at length, with the audit trail — lives in the Briefing room (`canon §4.21`, §1.4 above). This band carries only the workspace-scope observations, surfaced where the operator already is so they catch a decaying deal without a detour, and a row that wants the deeper context routes to the Briefing rather than expanding here. Per ADR-014 the two surfaces are cross-deduped, so an observation the Briefing is already carrying does not also shout from this band.

### 3.4 The Brief's content contract

The Brief is not free narrative; it has a fixed shape, so it stays a peer's summary and never drifts into a wall of text or a vanity readout. It composes, in order:

- **The pressure read** — one or two sentences naming what is most pressured right now and *why*, the top of the rank rendered as prose rather than a row.
- **What changed** — one sentence on what moved since the operator was last here: a new signal, a deal that advanced or slipped, a proof gone stale.
- **The one move** — the single dominant next action, specific and contextual in implementation-intention shape ("Send the revised proposal to the CFO before Friday"), the same move the Wayfinder *pulling* cell carries.
- **Optionally, one variable-insight line** — a genuine pattern the system detected ("deals where you booked the demo within 48 hours close 2.7× faster — you have two open to test it on"), per the variable-*insights*-not-variable-*rewards* rule (`canon Part III §5`). At most one, only when there is a real pattern, never manufactured to fill the surface.

**Voice.** The Brief speaks in the Command Chamber family temperature (`01` Part III) — calm, ranked, precise, a sharp operator telling you what they see. Every sentence, including the pluralized and the zero case, passes the validator.

**Acting from the Brief.** The Brief is not read-only. The one move is actionable from the brief itself — an orange primary that takes the move or jumps to its object, the same affordance the Wayfinder *pulling* cell offers — so the operator acts without first navigating. The Brief and the *pulling* cell carry the same move at two altitudes: the cell is the always-persistent thread that travels across rooms; the Brief is the resting-surface narrative that gives that move its context and its alternatives. They are not redundant; they are the move named once for continuity and once for understanding.

**The quiet day.** When nothing is genuinely pressured — a calm week, a pipeline the operator has cleared — the Brief does not say "all done" or "nothing to do" (`canon Part III §7`'s banned closure). It transforms the loop: it names what is quietly compounding ("nothing's on fire — three pilots are running clean") and surfaces the next building move toward an inheritable workspace ("your handoff kit is at four of seven; the discovery section is the next to fill"). The today surface never shows an empty victory screen. It always reveals the next open loop, because the moment after completion is the highest-churn moment (`canon Part III §5`, the Ovsiankina nuance), and a home that goes blank on a good day teaches the operator there is nothing here when there is nothing wrong.

**The crowded day.** The mirror case — a morning where several deals are all at real risk — does not make the Brief longer or louder. It still leads with the single most-pressured item and the one move; the rest is exactly what the Queue read is for. A Brief that tried to name every fire would be the wall the landing exists to avoid. One move, even on the worst day; the count of what's at risk can sit in a single clause ("three deals need attention — Acme first"), but the Brief still resolves to one.

**When the top item has no clean move.** Sometimes the most-pressured object is genuinely *wait* — a proposal is out and the next move is the buyer's. When the top of the rank has no action the operator can take right now, the Brief says so plainly ("Acme's gone quiet, but the move is theirs — nothing to push today") and the *one move* becomes the next item the operator actually can act on. The Brief never invents a move to look busy, and never leaves the operator holding a pressure with no handle.

**Acting transforms the Brief.** When the operator takes the one move, the Brief does not flip to "done." It transforms (`canon Part III §7`), recomposing to the next-most-pressured read and its move. The home stays one open loop ahead of the operator rather than emptying like a checklist — the same loop-transformation discipline the rest of the product follows, applied to the surface the operator returns to most.

### 3.5 The session arc

The today surface is the home the operator returns to, so it is engineered across sessions, not only within one (`canon Part III §8`).

- **The first session ever.** After onboarding, the operator's own data appears in the Brief — onboarding output *becomes* the Brief (`canon §4.3`), not a separate completion screen. The peak of that first session is the operator watching their ICP, their first account, and their first signal show up as a real read rather than a form they filled. The first Brief is necessarily sparse and says so plainly, leading with the one move that grows it.
- **Returning, daily.** The Brief opens as *what changed since last session* — new signals, state-changed deals, items now due — so the returning operator is oriented in seconds without re-reading what they already knew. "Since last session" is bounded by the operator's own last active session, not a fixed calendar window.
- **Same-day re-entry.** When the operator comes back hours later, the Brief does not re-narrate the morning; it updates to what changed since they stepped away, and the surface opens on the read they left, per the continuity and memory property.
- **The designed close.** A session has a designed end, not a fade-out (`canon Part III §8`, the Peak-End rule). When the operator winds down, the surface offers a closing read — what they moved today and what is queued for tomorrow ("today: two deals advanced, one pilot written up; tomorrow: the Acme CFO call needs prep") — which loads the next session's internal trigger. The surface never ends on an error, a blank, or "nothing to show."

### 3.6 The resting surface, top to bottom

For the builder, the resting surface has a fixed vertical order, and naming it keeps every room that mounts it consistent. Beneath the Wayfinder bar: the **Brief** first (the headline read and the one move), then the **week's-reads band** (§3.3) when there are observations, then the **Phase F proposal slot** (§4.2) when a proposal is waiting — and nothing else. Empty bands collapse rather than render as placeholders; the surface is never padded with frames for things that are not there, because a row that says "no proposals" is noise, and the charter's low box-count rule holds here as everywhere.

Switching reads acts on the Brief's position only. The Segmented control swaps **the read** in place — Spotlight or Queue takes the Brief's slot — while the week's-reads band and the proposal slot persist below, because they are surface furniture, not part of the read. Switching never reorders the surface or moves the lower bands.

The Wayfinder bar has a special case at the home. Its *here* cell reads the today surface itself ("Pipeline — Tuesday morning"), and its *trail* is empty, because the home is the root the trail builds out from rather than a place the operator arrived at from somewhere else. Its *pulling* cell carries the same one move the Brief leads with — the move named once for the persistent thread and once, with its context, in the Brief.

---

## Part IV — Resolving the deferred questions

This spec was named as the home for three deferrals. It resolves them.

### 4.1 The hybrid case — a fluent operator in a brand-new workspace

The density spec (`02` §0) routed charter signal #3 here: the operator who is fluent (their density is *Step back*) but whose workspace is brand new, so the surface is sparse. Density alone cannot serve them — a dense rendering of almost no data is just an empty grid. The today surface serves them with **workspace-context affordances** that are orthogonal to density: prefilled breadcrumbs that carry what little context exists, workspace-specific microcopy that names what the surface *will* show once it fills ("Your pipeline will rank here — add your first account to start it"), and the empty/sparse states from `03` §4.4 that stay directional rather than apologetic. The fluent operator in a new workspace gets a dense *frame* with honest sparse *contents* and a clear first move — not a beginner's walkthrough they do not need, and not a dense surface lying about having data.

### 4.2 The second Phase F proposal surface

The density spec (`02` §2.3) said Phase F proposals render "in the Briefing Suggestions section per canon §4.21, plus the surface the today-surface spec will eventually decide." This is that decision: the second surface is a **quiet proposal slot on the today surface**, in its own band below the Brief and the week's reads, rendered with the ProposalCard (`03` §4.1, the accept / dismiss / snooze surface). It is where a milestone-triggered proposal — density change, skill-default refinement, recurring-focus observation — meets the operator on the home surface rather than only inside the Briefing. It obeys every Phase F constraint already locked (`canon Part II.5 §7`): one proposal at a time, the operator always accepts or dismisses, the workspace-level Phase F toggle silences it, and the cooldowns hold. It never escalates, never stacks, never interrupts — it waits in its slot like everything else the system offers at rest.

### 4.3 The 22-room migration order

The component library (`03` §5.1) deferred the migration order to "the today-surface spec and the founder." The today surface sets the principle; the founder sets the schedule. The principle: **migrate in dependency order, command surface first.** The Dashboard is the today surface and the place the Wayfinder bar, the Pulse timeline, and the Grounded ranking all converge, so it is the first room and the proof that the whole system holds against shipping code. After it, the rooms it ranks from — Signal Console, Deal Workspace — because the today surface reads their state, so migrating them strengthens the surface immediately. Then the rooms those hand off to, outward along the compounding matrix (`canon §6`). The Decision Benches, which shape an object rather than rank a timeline, migrate as a cluster since they share a composed-bench layout rather than the Pulse surface. The exact sequence is the founder's, but no room migrates before the surface that ranks from it has a stable contract.

---

## Part V — Migration, citations, signals

### 5.1 The Dashboard is the migration of the today surface

There is no separate "today surface" room to build — building it *is* rebuilding the Dashboard against this spec plus the component library. The migration is the four-system decomposition `03` §5.1 describes, applied to the Dashboard first: the rail comes out and the Wayfinder bar mounts; the ranked objects become Grounded cards on a Pulse timeline; the Brief / Spotlight / Queue modes become the Segmented reads; the resting state, the proposal slot, and the week's-reads band land per Parts III–IV. The charter's mind-protection rule holds — the Dashboard's mind (rank under pressure, explain the order, one dominant move, never a decorative score) may not be weakened, and any mind error the rebuild surfaces routes to the founder before it is fixed.

### 5.2 Behavioral citations

The today surface is engineered against the strongest levers in the canon (`canon Part III §4`):

- **Ranked next move** (lever 2) and **prefilled context** (lever 1) — the surface tells the operator what to act on with a reason, and carries their context without a restate, which is most of what makes a landing feel like the system was thinking while they were away.
- **Implementation intentions** (Gollwitzer 1999, d = 0.65) — the one move is always specific and contextual ("Send the revised proposal to the CFO before Friday"), never "follow up."
- **Peak-End and session design** (`canon Part III §8`) — the returning operator's surface opens as "what changed since last session," and the resting state is a designed calm, never an error or a void.
- **The Ovsiankina resume drive, not the debunked Zeigarnik memory claim** (`canon Part III §7`) — the surface surfaces open loops and makes resumption the path of least resistance, rather than relying on the operator to remember.
- **Self-Determination Theory** (`canon Part III §5`) — the ranking you can interrogate and overrule serves autonomy; the system informs competence ("your response rate improved") without points or leaderboards. This is the behavioral root of the no-imposition rule.

### 5.3 Signals the spec is doing its job

The today surface is working if:

1. **The operator lands in their work, not an interface.** Within seconds they are reading the calm Brief and the one move, not a menu, a void, a wall of equal-weight modules, or their entire ranked pipeline spread out and waiting.
2. **Nothing was decided for them.** An audit of the landing finds no auto-opened room, no forced triage, no surface that escalated without real risk. The operator could have ignored every system read and operated entirely on their own focus.
3. **The rank is legible and stable.** Any item can answer "why here / why this order," and the surface does not reshuffle while the operator reads it.
4. **The three reads are one surface.** Brief, Spotlight, and Queue carry the same ranking and reasoning; switching changes quantity, never substance, and the choice persists.
5. **The sparse and new-workspace cases feel real.** A two-deal pipeline and a brand-new workspace both land as honest starts with a clear first move, not as broken or empty dashboards.
6. **The deferred questions stay resolved.** The hybrid case, the Phase F slot, and the migration order behave as Part IV specifies; no downstream spec has to re-open them.
7. **It is never "all done."** A cleared pipeline or a quiet week transforms into the next building loop rather than an empty victory screen; every session opens as what-changed and closes with a designed read; a good day with nothing pressing still gives the operator something true and forward, never a blank.
8. **It stays in its lane.** The surface ranks, summarizes, and routes — it does not become the Briefing (it carries a glance, not the sit-down), does not become the place work is done (it routes to the rooms), and does not become a feed (it waits, it does not stream). A scope-creep change that pulls another room's job onto the home is visible and nameable.
9. **It is honest when it can't see.** When a source is stale or down, the Brief names the gap rather than ranking confidently on partial data — an honest "I can't read your deals right now" over a wrong order presented as complete.

---

## Closing

The today surface is where the engine meets the operator each morning. It ranks, because an engine that has been thinking owes the operator its read. It refuses to impose, because the operator's work is the operator's to direct — the charter's agency boundary is not a constraint on the intelligence but the shape of how the intelligence is offered. Command-first and agency-preserving were never opposed; the today surface is the proof, the surface that hands you the system's read as a calm brief and leaves every decision — including whether to look at the whole ranked list at all — yours.

It is the Dashboard's mind, rendered in the un-nav language: the Wayfinder bar as the orientation, the calm Brief as the resting body, the ranked Pulse timeline waiting as the Queue read for when the operator wants it, the Grounded cards as the work, one item breaking rank, the week's quiet observations alongside, a single proposal waiting in its slot. Nothing opens until the operator opens it, and the operator is never met by their whole pipeline at once. The deferred questions the other specs sent here are answered, and the next move is to build it — Dashboard first, mockups before code, against this spec and the component library it stands on.

Visual building material: `deliverables/mockups/component-library-un-nav-full-2026-06-07.html` (the Wayfinder bar, the Brief, the Grounded cards, and the Pulse timeline it composes from). A dedicated today-surface mockup is the next artifact owed before any Dashboard code: the calm Brief as the resting landing, the switch to Spotlight and Queue, the quiet-day Brief that never says "all done," the first-session and returning-daily Briefs, the designed session close, and the sparse and brand-new-workspace cases. Mockups before code.
