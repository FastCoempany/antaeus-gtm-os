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

The operator opens the product and lands on **their own work, laid out over time** — the Pulse timeline of their pipeline, most-pressured at the top, the quiet deals flagged, yesterday compressing beneath (`03` Part II). The surface is **ranked**: the system has ordered the work by pressure, and the single most-pressured item breaks rank as the Offset. The system's one read — the move it would make next — sits in the Wayfinder bar's *pulling* cell, visible the moment the operator arrives.

And nothing opens. No room auto-launches, no modal demands triage, no item forces itself into the center. The operator can act on the system's pick, act on something else entirely, or sit and read. The ranking is the system **surfacing its read**; it is not the system **acting on the operator's behalf**. That distinction is the whole resolution.

This reconciles what looked like a tension. The charter's command-first doctrine (`canon Part I §3`, `Part III §6`) says the operator "lands in ranked pressure, not a hallway of modules." The founder's standing concern — that auto-landing on a ranked workspace does a disservice to the operator who wants to decide what they care about — sounds like the opposite. It is not. Command-first was never about imposition; it was about replacing the hallway of equal-weight doors with one ranked read. The disservice the founder named is **imposition** — the system deciding *for* the operator. The today surface ranks (command-first) and refuses to impose (agency-preserving). The operator lands in ranked pressure and remains free to ignore all of it.

### 1.2 The agency boundary at landing

The charter's §2.1 agency property is the spine of this spec: the system has agency over itself, the operator has agency over their work. At the moment of landing, that means:

- **The system may rank, read, and surface.** It orders the pipeline, names the one move it would make, accumulates observations while the operator is away, and shows all of it.
- **The system may not open, act, or insist.** It does not auto-navigate into a room, auto-send anything, auto-dismiss the operator's own focus, or escalate a surface to demand attention. The Wayfinder's *pulling* cell is an offer with a "skip" that sends nothing (`03` Part III).
- **Escalation is reserved for real, destructive risk** (`canon Part III §3` rule 7) — a deal about to close-lost, an unsaved edit about to be discarded — never for ordinary ranking. The today surface is calm by default; intensity is earned by consequence, not manufactured to drive engagement.

The line is testable: if a future change makes the surface *do* something on the operator's behalf at landing — open the top deal, start a triage flow, mark observations read — it has crossed the boundary and is out of bounds without founder sign-off through the mind-correction protocol.

### 1.3 It is the Dashboard

The today surface is not a new room. It is the mind of the existing Dashboard (`canon §4.2`), specified as a design-system surface so the rebuild has a contract. Everything canon already locks about the Dashboard holds: it ranks everything under pressure, explains why a specific object came up first, offers one compressed act-or-inspect move, and never reduces its reasoning to a decorative score. The three density modes canon names — Brief, Spotlight, Queue — are the today surface's three reads (Part III). What this spec adds to canon §4.2 is the un-nav rendering (the Pulse timeline as the body, the Wayfinder bar as the orientation) and the explicit resolution of the resting-state agency question that canon left implicit.

---

## Part II — How it ranks

### 2.1 What ranks

The order is computed from the ranking inputs canon §4.2 already names, carried forward unchanged as the model: how hot the signals are on an account, how much pressure a deal is under, how long it has been stale, its dollar value, and what changes downstream if the operator acts. These are read from the rooms that own them — signal heat from Signal Console, deal pressure from Deal Workspace, proof state from PoC, coverage from Quota Workback — through the orchestration layer's accumulated state, not recomputed on the surface. The today surface is a reader and a ranker; it is not the owner of any noun (`canon Part I §3` truth 3).

### 2.2 The ranking is explainable, never a bare score

Every ranked item can show *why it is here* and *why it is in this order* — the command-intelligence reasoning canon §4.2 protects ("the Dashboard's ranking must keep showing its reasoning — never reduced to decorative scores"). This is the same reasoning the Wayfinder bar opens inline (`03` §3.2): a plain-sentence read, an evidence ledger, and the alternatives the system also considered. A score may exist as the math; it is never the surface. The operator can always interrogate the rank, which is itself an agency affordance — a ranking you can question is one you can overrule.

### 2.3 The rank is stable

The order does not churn. A live data refresh that nudges the math must not reshuffle the surface under the operator's eyes; the previous focal item stays pinned unless something genuinely more pressured displaces it (the stability rule the Dashboard rebuild already carries, `canon Part V` Phase 4 / Room 2). Stability is an agency property too: a surface that reorders while you read it is making decisions you did not ask for.

### 2.4 One thing breaks rank

Exactly one item — the single most-pressured — is the Offset (`03` §2.4): its tag outside the card, its action below it, the eye's guaranteed landing place. This is how the surface renders canon's "one dominant move" at the scale of the whole page without imposing it — the one move is *visible and singular*, and still optional.

---

## Part III — The resting state and the three reads

### 3.1 The resting state is neutral, not empty

When the operator has asked for nothing, the surface is not blank and not loud. It shows the pipeline over time, the one read in the bar, and the week's accumulated observations — and it waits. This is the charter's signal that the system has been thinking, offered at rest. The resting state draws on the component library's sparse and empty states (`03` §4.4): a brand-new workspace shows an empty state that names why the surface matters and the one move that fills it ("No pipeline yet — add your first account"); a workspace with two deals shows a real, sparse pipeline, not a half-broken grid. The resting state is never a void and never a demand.

### 3.2 The three reads — Brief, Spotlight, Queue

The surface offers three lenses onto the same ranked work, rendered with the Segmented control (`03` §4.1) and mapped to the density gradient (`02`):

- **Brief** is the narrative read — three-to-five sentences naming what is most pressured, what changed since last session, and the one move, written in the today-surface's family voice. Brief is the natural default for *Show me how*; it walks the operator through what the system sees.
- **Spotlight** is the single-focal-object read — one Grounded card at full depth (Signal / Reason / Move, the evidence, the alternatives), the rest as a quiet queue rail. Spotlight is the fluent operator's read: one thing, deep, act or move on.
- **Queue** is the triage read — the ranked list, compact, one line of reasoning per row, built for an operator clearing a morning. Queue is the densest read and the natural pairing with *Step back*.

All three keep the ranking and its reasoning; they differ only in how much of the surface ships at once, which is exactly the density gradient's quantity-not-personality axis (`02` §1.3). The operator's chosen read persists per the continuity and memory property; the surface opens where they left it.

### 3.3 Where the week's reads land

The orchestration layer's workspace observations (`canon Part II.5 §7`, ADR-009 — the heartbeat's deal-decay, signal-decay, proof-staleness, discovery-rhythm reads) surface on the today surface as a distinct, quiet band — the "this week's reads" the Phase B work already ships. They are observations, not commands: a peer's notes on what moved and what went quiet, dismissable, never a task list. They sit alongside the ranked pipeline, not above it, because they are a different altitude — what the system noticed over the week, versus what is most pressured right now.

---

## Part IV — Resolving the deferred questions

This spec was named as the home for three deferrals. It resolves them.

### 4.1 The hybrid case — a fluent operator in a brand-new workspace

The density spec (`02` §0) routed charter signal #3 here: the operator who is fluent (their density is *Step back*) but whose workspace is brand new, so the surface is sparse. Density alone cannot serve them — a dense rendering of almost no data is just an empty grid. The today surface serves them with **workspace-context affordances** that are orthogonal to density: prefilled breadcrumbs that carry what little context exists, workspace-specific microcopy that names what the surface *will* show once it fills ("Your pipeline will rank here — add your first account to start it"), and the empty/sparse states from `03` §4.4 that stay directional rather than apologetic. The fluent operator in a new workspace gets a dense *frame* with honest sparse *contents* and a clear first move — not a beginner's walkthrough they do not need, and not a dense surface lying about having data.

### 4.2 The second Phase F proposal surface

The density spec (`02` §2.3) said Phase F proposals render "in the Briefing Suggestions section per canon §4.21, plus the surface the today-surface spec will eventually decide." This is that decision: the second surface is a **quiet proposal slot on the today surface**, beneath the ranked pipeline, rendered with the ProposalCard (`03` §4.1, the accept / dismiss / snooze surface). It is where a milestone-triggered proposal — density change, skill-default refinement, recurring-focus observation — meets the operator on the home surface rather than only inside the Briefing. It obeys every Phase F constraint already locked (`canon Part II.5 §7`): one proposal at a time, the operator always accepts or dismisses, the workspace-level Phase F toggle silences it, and the cooldowns hold. It never escalates, never stacks, never interrupts — it waits in its slot like everything else the system offers at rest.

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

1. **The operator lands in their work, not an interface.** Within seconds they are looking at their ranked pipeline and the one read, not a menu, a void, or a wall of equal-weight modules.
2. **Nothing was decided for them.** An audit of the landing finds no auto-opened room, no forced triage, no surface that escalated without real risk. The operator could have ignored every system read and operated entirely on their own focus.
3. **The rank is legible and stable.** Any item can answer "why here / why this order," and the surface does not reshuffle while the operator reads it.
4. **The three reads are one surface.** Brief, Spotlight, and Queue carry the same ranking and reasoning; switching changes quantity, never substance, and the choice persists.
5. **The sparse and new-workspace cases feel real.** A two-deal pipeline and a brand-new workspace both land as honest starts with a clear first move, not as broken or empty dashboards.
6. **The deferred questions stay resolved.** The hybrid case, the Phase F slot, and the migration order behave as Part IV specifies; no downstream spec has to re-open them.

---

## Closing

The today surface is where the engine meets the operator each morning. It ranks, because an engine that has been thinking owes the operator its read. It refuses to impose, because the operator's work is the operator's to direct — the charter's agency boundary is not a constraint on the intelligence but the shape of how the intelligence is offered. Command-first and agency-preserving were never opposed; the today surface is the proof, the surface that lands you in ranked pressure and leaves every decision yours.

It is the Dashboard's mind, rendered in the un-nav language: the Pulse timeline as the body, the Wayfinder bar as the orientation, the Grounded cards as the work, one item breaking rank, three reads onto the same order, the week's quiet observations alongside, a single proposal waiting in its slot. Nothing opens until the operator opens it. The deferred questions the other specs sent here are answered, and the next move is to build it — Dashboard first, mockups before code, against this spec and the component library it stands on.

Visual building material: `deliverables/mockups/component-library-un-nav-full-2026-06-07.html` (the Wayfinder bar, Pulse timeline, and resting canvas it composes from). A dedicated today-surface mockup — the three reads, the resting state, the sparse and new-workspace cases — is the next artifact owed, before any Dashboard code.
