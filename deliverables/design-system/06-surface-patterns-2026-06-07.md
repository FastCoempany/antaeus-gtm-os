# Antaeus Design System — Surface Patterns

**Status:** DRAFT for founder review.
**Date:** 2026-06-07.
**Author:** Claude, working session with the founder (mrcoe7@gmail.com).
**Branch:** `claude/antaeus-gtmos-design-system`.
**Scope:** This is the sixth sibling document under the design system charter (`00-charter-2026-06-02.md`). It specifies how each of the seven composition families (canon Part II §4) fills its layout archetype (`05` Part III) — what regions it stacks, what carries weight, what recedes, where the one move lives, how its loop transforms, and how it treats health. The today-surface spec (`04`) wrote the first of these patterns in full, for the Command Chamber; this spec generalizes that work into a meta-pattern and writes the pattern for the other six families, so that every room build starts from a family surface pattern rather than improvising one. The layout spec (`05`) gave the geometry; this gives the composition inside it.

---

## 0. Why this exists

A composition family in the canon is a description of feel and law — the Decision Bench should make "the object being sharpened visually central," the Diagnosis Table should put "where the work is decaying" in the first-visible zone. Those are correct and binding, but they are not yet a *pattern a builder can build against*. They name the obligation without naming the regions, the weight order, the entry posture. The today-surface spec proved what the missing layer looks like: it took the Command Chamber's law (rank under pressure, one dominant move, three reads) and resolved it into a specific composition — the calm Brief as the resting body, the week's-reads band, the proposal slot, the read switch, the session arc. Every other family needs that same resolution before its rooms are built, or each room invents the family's pattern fresh and the family stops being a family.

This spec resolves the seven patterns. It commits to a meta-pattern every family declares — archetype, region stack, weight order, the one move, loop transformation, health treatment, entry posture — and then writes that declaration for each family. It does not re-specify the Command Chamber, which `04` already did in full; it points at `04` as the worked example the other six follow. The result is that a builder opening any room knows the family's surface pattern before they place a single component, and the canon's family laws finally have a buildable form.

---

## Part I — What a surface pattern is

A surface pattern is a family's standing answer to seven questions. Every family declares all seven; a family that cannot is a feel without a form.

- **Archetype** — which of the three layout archetypes the family fills (`05` §3): single column, focal + rail, or object + controls.
- **Region stack** — the named regions of the surface, top to bottom, on the vertical rhythm (`05` §2.2), with empty regions collapsing.
- **Weight order** — what dominates the eye and what recedes, which is where the family's *feel* (canon Part II §4) becomes geometry. Threshold's one commanding statement, the Decision Bench's central object, the Diagnosis Table's decay-first zone — these are weight decisions before they are anything else.
- **The one move** — where the single dominant move lives on the surface (canon Part III §3 rule 1). Every family has exactly one per surface; they differ in where it sits.
- **Loop transformation** — how the family migrates a completed loop forward instead of closing it (canon Part III §7). The Threshold never shows "setup complete"; the Diagnosis Table never shows "all healthy"; each transforms into the next open loop.
- **Health treatment** — which of the three health patterns the family carries (canon §10, frozen by the 2026-04-03 closeout): **Workspace health** (the `Compounding` / `Still weak` pulse, twelve rooms), **System health** (the score/coverage/fragility variant, Readiness and Quota Workback), or **neither** (six rooms, deliberately). A family does not get to invent a fourth; it declares which of the three it carries and why.
- **Entry posture** — what the operator sees in the first-visible zone, before any control set. This is canon Part III §3 rule 2 (object before controls) and rule 3 (state before explanation) made specific per family.

The rest of this spec is those seven questions answered, once per family.

---

## Part II — The seven patterns

### 2.1 Threshold — Welcome, Onboarding

- **Archetype:** single column.
- **Region stack:** one commanding statement → the single dominant next move → a quiet progress ladder → recessive supporting context.
- **Weight order:** the commanding statement and the one move dominate; everything else is deliberately quiet. The Threshold is invitational and confidence-building, so the first-visible zone carries almost nothing but the invitation and the door through it.
- **The one move:** the dominant next move, directly under the statement, as the single orange primary on the surface. A Threshold with two competing primaries has failed its own family.
- **Loop transformation:** never "setup complete" or "all done." Onboarding output *becomes* the first Brief (`04` §3.5); each finished step reveals the next open loop, and the Threshold hands the operator into real work rather than congratulating them for finishing a tutorial.
- **Health treatment:** neither (canon §10 — Welcome and Onboarding intentionally carry no health pulse; the operator has nothing to be healthy about yet).
- **Entry posture:** the operator sees where they are in becoming operational and the one thing to do next — never a hero-plus-card-pile, never an orientation-copy avalanche (canon Part II §4.1 avoid-list).

### 2.2 Command Chamber — Dashboard / today surface

Written in full by the today-surface spec (`04`). In the meta-pattern's terms: archetype is single column at rest (the Brief), focal + rail when Spotlight, full-width timeline when Queue (`04` §3.2, `05` §3.4); the region stack is Brief → week's-reads band → proposal slot (`04` §3.6); weight goes to the Brief and its one move; the one move lives in the Brief and the Wayfinder *pulling* cell; the loop never shows "all done" (`04` §3.4); health is neither (canon §10 — the Dashboard ranks pressure rather than carrying a health pulse of its own); entry posture is the calm Brief, ranked-but-not-imposed (`04` §1.1). This spec adds nothing to `04`; it points at it as the worked example the other six families follow.

### 2.3 Live Instrument — Signal Console, Discovery Studio, Outbound, Cold Call, Call Planner, Advisor Deploy, Outdoors Events

- **Archetype:** focal + rail.
- **Region stack:** a working console at the top of the focal pane (the live controls, real and proximal) → the active object at depth in the focal pane → the supporting rails alongside (worked memory, next-step, the ranked remainder).
- **Weight order:** the console and the active object dominate; the rails are present but quiet. A Live Instrument's first-visible zone behaves like an instrument's working surface, not a report — the action controls are real and within reach, not an advisory card stack the operator has to read past (canon Part II §4.3 avoid-list).
- **The one move:** in the console, proximal to the active object — the send line in Outbound, the next-thread pull in Cold Call, the next-step lock in Discovery. The move is where the operator's hand already is.
- **Loop transformation:** a sent motion becomes "monitoring for engagement"; a completed call becomes the next-step lock and the routing into the next room (canon Part III §7). The instrument never goes idle; it transforms the just-finished action into the next live one.
- **Health treatment:** Workspace health (canon §10 — the `Compounding` / `Still weak` pulse, carried as a short read, not a summary essay; "health is a short pulse, not a summary essay," canon Part II §4.3).
- **Entry posture:** the operator sees the live object and the controls to act on it first — never a tutorial-like intro, never stacked advisory cards before the work (canon Part II §4.3 avoid-list).

### 2.4 Decision Bench — ICP Studio, Territory Architect, Sourcing Workbench, PoC Framework

- **Archetype:** object + controls.
- **Region stack:** what quality or truth is being sharpened (at the top, as the surface's argument) → the shaped object, visually central → the builder controls, subordinate → the downstream-consequence read, kept in view.
- **Weight order:** the shaped object dominates; the controls support it, never the reverse (canon Part II §4.4 — "builder controls support the object, not the other way around"). This is the family most easily ruined by laying it out by available space, which turns it into a worksheet of equal-weight input panels (the §4.4 avoid-list).
- **The one move:** advance the object — sharpen the ICP, name the focus, push the prospect, forge the proof — as the single primary, with the made thing growing more real as the move lands.
- **Loop transformation:** a sharpened object reveals its next gap, not a "saved" state — "ICP sharpened; now its match score reaches Territory, Sourcing, Signal" (canon Part III §7). Every save shows the object got stronger and what it now affects downstream (canon Part III §3 rule 5, rule 6).
- **Health treatment:** Workspace health (canon §10 — the four Decision Benches all carry the `Compounding` / `Still weak` pulse on the object's quality).
- **Entry posture:** the operator sees the object and what quality is being improved first — never a fill-out-the-form worksheet, never equal-weight builder panels (canon Part II §4.4 avoid-list).

### 2.5 Diagnosis Table — Deal Workspace, Future Autopsy

- **Archetype:** focal + rail.
- **Region stack:** the decay-first zone (where work is decaying fast, in the first-visible zone) → the object under intervention, focal, with its risk and what's-actually-happening legible → the corrective route, obvious → the recovery queue in the rail.
- **Weight order:** risk and decay dominate; the corrective move is the second-loudest thing; explanation recedes below both (canon Part II §4.5 — "risk and what's actually happening are legible before any long explanation"). Future Autopsy is the canon's positive example here (canon §4.14) and the pattern the other Diagnosis Table room borrows from.
- **The one move:** the corrective move on the most-decayed object — the smallest intervention that changes the trajectory — as the single primary in the focal pane.
- **Loop transformation:** a corrected deal reveals its next weakest qualification gap, not a "healthy" stamp; a run autopsy reveals the reroute (canon Part III §7). The table never says "all deals healthy"; it transforms each correction into the next exposure.
- **Health treatment:** Workspace health (canon §10 — both carry the `Compounding` / `Still weak` pulse, expressed as honest operator language, not an analytics dashboard, canon Part II §4.5 avoid-list).
- **Entry posture:** the operator sees where the work is decaying and the corrective route first — never abstract diagnosis without corrective motion, never a boxed warning-board (canon Part II §4.5 avoid-list).

### 2.6 System Ledger — Readiness Score, Quota Workback, Founding GTM / Handoff Kit

- **Archetype:** single column, synthesis-weighted.
- **Region stack:** one summary state, dominant → the gating evidence behind it → the secondary metrics that support the state → what would move it next.
- **Weight order:** the one summary state dominates the surface; everything else supports it. The family should feel like the system reconciling evidence into a settled read — Readiness's gate-based state, Quota Workback's coverage truth, the handoff kit's section-readiness (canon Part II §4.6). Synthesis weight comes from serif typography and accent rules, on the bright field, never from a dark surface (canon Part II §1, §4.6).
- **The one move:** what would move the summary state next — the single unlock — as the primary; for the handoff kit, the next section to fill.
- **Loop transformation:** a reached state reveals the next gate, not a finish line — Readiness transitioning up fires the Founding GTM set-piece (canon §4.17, §4.19), and the kit at 5/7 names the two sections still open. The ledger is the family most about a destination, and it still never shows the destination as done.
- **Health treatment:** System health (canon §10 — Readiness and Quota Workback carry the score/coverage/fragility variant; Founding GTM carries neither, per the §10 taxonomy, because its section-readiness count *is* its read).
- **Entry posture:** the operator sees the one synthesized state first — never a BI-dashboard of co-equal metrics, never a scoring-widget field (canon Part II §4.6 avoid-list).

### 2.7 Trust Annex — Settings

- **Archetype:** single column.
- **Region stack:** the trust and recovery surfaces (backup, export, restore, delete, sync state) → account and role controls → the data-stored notice → category framing.
- **Weight order:** the trust signals and recovery moves carry the weight; nothing else competes. The family is calm, plainspoken utility — no drama, no internal-architecture language, no fake product excitement (canon Part II §4.7, §4.20).
- **The one move:** the most consequential recovery move the operator came for (export, restore, or the deliberate-friction destructive action), as the clearest action on the surface, with destructive moves escalated only at the moment of consequence (canon Part III §3 rule 7).
- **Loop transformation:** Settings is the one family where loop transformation is muted — a completed backup says "backed up just now," and that is allowed to be a quiet terminal state, because manufacturing a forward loop on a utility surface would be the fake product excitement the family forbids.
- **Health treatment:** neither (canon §10 — Settings intentionally carries no health pulse; it is not an operating room).
- **Entry posture:** the operator sees their safety and recovery options first, in plain language — never overdesigned utility chrome, never internal architecture language as visible copy (canon Part II §4.7 avoid-list).

---

## Part III — What every pattern shares

Across all seven families, four obligations hold regardless of pattern, because they are charter-level, not family-level:

- **The Wayfinder bar is the same on every surface** (`03` Part III) — full-bleed, trail / here / pulling, the one move in the *pulling* cell mirroring the family's one move. The bar does not change by family; only its *here* and *pulling* contents change by room.
- **One dominant move per surface** (canon Part III §3 rule 1) — every family places exactly one, differing only in where. Two competing primaries fail any family.
- **State before explanation, object before controls** (canon Part III §3 rules 2–3) — every family's entry posture leads with the object and its state, and defers explanatory copy downward per the copy-burden discipline (canon Part III §9).
- **Loop transformation, never closure** (canon Part III §7) — every family except the Trust Annex migrates completion forward; the Trust Annex is the single, deliberate exception, and only for genuinely terminal utility actions.

These four are why the seven patterns are variations of one product rather than seven different products.

---

## Part IV — The contract and what it does not decide

A room declares its **family surface pattern** alongside its layout declaration (`05` §4.1) and its component contract (`03` §4.2). The three compose: the family pattern says what regions and what weight, the layout archetype says the geometry, the component contract says what each region is built from. A room that declares all three is fully specified at the surface level.

This spec does not write the full room spec for each room — the today-surface spec is the depth a room's *primary* surface gets, and each family's first room build produces that depth (the way `04` did for the Dashboard). This spec gives the pattern every such build starts from. It does not decide motion — how a read switches, how a region collapses, how a state transition animates — that is the Motion spec (`08`). It does not decide the words — that is the voice spec (`01`) and the lexicon (`07`). And it does not re-decide the family laws or health taxonomy themselves, which are canon (Part II §4, §10); it resolves them into buildable patterns and defers any change to them through the mind-correction protocol.

---

## Part V — Migration, citations, signals

### 5.1 Migration of the existing rooms

Each of the 22 rooms already belongs to a family (canon §4). Migration is making the room match its family's pattern — the region stack, the weight order, the entry posture — as part of its component-library and layout retrofit (`03` §5.1, `05` §5.1). Most rooms already approximate their family's feel; the retrofit makes the approximate exact and catches the rooms that drifted (a Decision Bench laid out as a worksheet, a Live Instrument fronting advisory cards instead of controls). The Command Chamber is first because it is the first build and `04` already specifies it in full. The charter's mind-protection rule holds throughout: matching the pattern may not weaken what the room knows.

### 5.2 Behavioral citations

- **Object before controls / state before explanation** (`canon Part III §3` rules 2–3) — every entry posture is these rules made specific per family.
- **One dominant move** (rule 1) — Part III's shared obligation; the families differ only in where the move sits.
- **Loop transformation** (`canon Part III §7`) — every family except the Trust Annex migrates completion forward, which is most of what makes the product feel like it is building toward something.
- **Escalation beats clutter** (rule 7) — the Diagnosis Table's decay-first weight and the Trust Annex's escalated destructive actions are this rule rendered as composition.

### 5.3 Signals the spec is doing its job

1. **Every room reads as its family.** A stranger shown a room can place its family from the first-visible zone — a Decision Bench leads with the object, a Diagnosis Table leads with decay, a Threshold leads with the invitation.
2. **No family invents a second pattern.** Two rooms in the same family compose the same way; neither improvises a different region stack.
3. **The one move is always findable and singular.** Every surface has exactly one dominant move, where its family says it lives.
4. **Health is one of the three.** Every room carries Workspace health, System health, or neither, per the canon taxonomy — none invents a fourth treatment.
5. **No family closes a loop it should transform.** Only the Trust Annex shows a terminal state, and only for true utility actions; every other surface migrates completion forward.

---

## Closing

The canon's seven families were a set of feelings with binding laws but no buildable form. This spec is the form: each family's archetype, region stack, weight order, one move, loop transformation, health treatment, and entry posture, resolved once so that every room build starts from a pattern rather than inventing one. The today-surface spec proved what a resolved family looks like; this spec resolves the other six to the same standard and points the Command Chamber at `04`.

A family is a promise that two rooms which do different work still feel like one product. These patterns are how that promise is kept in geometry — the same Wayfinder bar, the same one-move discipline, the same object-before-controls posture, the same forward-migrating loop, varied only where the family's job genuinely differs. With the layout (`05`) giving the page and these patterns giving the composition on it, the rooms have everything they need above the level of motion, words, and icons — which are the remaining siblings.
