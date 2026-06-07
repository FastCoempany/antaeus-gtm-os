# Antaeus Design System — Layout & Grid

**Status:** DRAFT for founder review.
**Date:** 2026-06-07.
**Author:** Claude, working session with the founder (mrcoe7@gmail.com).
**Branch:** `claude/antaeus-gtmos-design-system`.
**Scope:** This is the fifth sibling document under the design system charter (`00-charter-2026-06-02.md`). It specifies the geometry every surface sits on: the page frame, the column grid, the reading measure, the vertical rhythm, the handful of multi-pane archetypes the rooms compose into, and how all of it behaves across the supported desktop range. The component library (`03`) gave us components and the spacing, radius, and elevation tokens; this spec gives us the page those components land on. It exists because the today-surface mockup already improvised layout decisions — a 1080px page, a 660px brief, particular band widths — and building the real rooms against improvised geometry would canonize accident as doctrine, which is the drift the system exists to prevent.

---

## 0. Why this exists

The component library answered *what a card is* and *what a section is*. It did not answer *where they go* — the width of the page, the columns work aligns to, how wide a line of prose is allowed to run, how the Wayfinder bar relates to the content beneath it, what happens when the operator's window is 1100px instead of 1600px. Those are page-level decisions, and until they are canon they get made fresh in every room build, by whoever is building, differently each time. That is exactly the un-composed accumulation the four-system language was built to avoid, one altitude up.

This spec resolves the geometry. It commits to a full-bleed Wayfinder bar over a centered content column with a fixed maximum width; a twelve-column grid the work aligns to; a reading measure prose never exceeds; a vertical rhythm drawn from the 8px spacing scale; three multi-pane archetypes the seven composition families draw from; and a supported desktop range with graceful single-column collapse below it. Layout geometry is orthogonal to density — density changes how much content a surface ships, never the geometry it ships into. The product is desktop-only (canon Part I, the desktop-first confirmation in ADR-001); this spec does not specify a mobile layout, because there is not one.

---

## Part I — What the layout system is

### 1.1 The page frame

Every surface is built on one frame. The **Wayfinder bar is full-bleed** — it spans the viewport edge to edge, sits at the top, and is sticky (`03` §4.3 puts it directly above content in the z-order). Beneath it, all work sits in a **centered content column** with a fixed maximum width and a minimum side gutter. The bar is the only element that touches the viewport edges; everything else lives in the column.

The content column maxes at **1200px** and centers in the viewport. Below 1200px of available width it shrinks to fit with a **40px minimum gutter** on each side. The 1200px cap is deliberate: it is wide enough for the densest multi-pane room (a focal object plus its rail, or a shaped object plus its controls) and narrow enough that the reading measure holds without the eye losing the start of the next line. A workspace that lets its content run the full width of a wide monitor is a workspace that has stopped composing.

The frame is constant across every family and every room. What changes inside it is which of the three archetypes (Part III) the family uses and how the column is subdivided — never the frame itself.

### 1.2 The grid

Inside the content column sits a **twelve-column grid** with **24px gutters**. Twelve is chosen because it divides cleanly into the subdivisions the rooms actually use — halves (6/6), thirds (4/8, 8/4), and the two-thirds focal split (8/4) that Spotlight and the Decision Benches lean on. A surface does not have to use all twelve; most use a subset and let the rest stay empty, because empty columns are how a dense product breathes.

The grid is for *alignment*, not for filling. The Brief occupies the leftmost six-to-seven columns and leaves the rest open; it is not stretched to twelve to look "complete." Offset Logic, the gauge, the anchored edge — every device the component library uses to carry meaning depends on the grid holding still underneath them so the eye trusts the alignment. A grid used as a packing constraint produces the equal-weight box grid the charter hard-rejects; a grid used as an alignment frame produces the composed, authored field the charter wants.

### 1.3 The reading measure

Running prose — the Brief, a card's context line, an authored Founding GTM section, any sentence the operator reads rather than scans — **never exceeds 66 characters per line** (roughly 620–680px at the body size). This is why the today-surface Brief is 660px and not the full column width. The measure is a hard cap, independent of how many columns are available: a surface with twelve columns of room still sets its prose at 66ch and leaves the rest open. Long lines are where reading turns into work, and the today surface's whole argument is that the system hands the operator a *read*, not a chore.

Labels, mono kickers, table cells, and the gauge are not prose and are not bound by the measure. The measure governs sentences the operator reads left to right; it does not govern data the operator scans.

---

## Part II — The grid in numbers

### 2.1 The supported range

The product is desktop-only. The layout system supports a viewport width range and behaves predictably across it:

- **Optimal: 1280–1600px.** The full layout, every archetype at its intended proportions. This is the range the rooms are designed against and the range the Sarah-day-90 fluency baseline (`00` §4.7) operates in.
- **Workable: 1024–1280px.** The frame holds, the content column shrinks toward its gutter minimum, and multi-pane archetypes (Part III) collapse to single column — the focal object stacks above its rail, the shaped object stacks above its controls. Nothing breaks; the surface just gets taller.
- **Below 1024px: unsupported.** The product does not ship a mobile or tablet layout (canon, ADR-001 desktop-only). Below 1024 the workspace shows a calm, plainly-worded notice that Antaeus is built for a desktop window, in the Trust Annex register — never a broken or half-reflowed room. This is a deliberate non-goal, not a gap.

Wide monitors past 1600px do not widen the content column past 1200px; the column stays capped and the extra space becomes margin. A surface never spreads to fill a wide monitor.

### 2.2 The vertical rhythm

Vertical spacing draws from the 8px scale in `03` §4.3 (`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 56`). The rhythm that matters most is the **band stack** — the canonical vertical order of a surface's regions. On the today surface that is the Wayfinder bar, then the Brief, then the week's-reads band, then the proposal slot (`04` §3.6), separated by consistent vertical gaps (a `32` between major regions, a hairline rule where the component library calls for one). Every family stacks its regions on the same rhythm so a surface scanned top to bottom feels like one composed page rather than a pile of sections at random distances.

Empty regions collapse; the rhythm closes over them (`04` §3.6 — no placeholder padding for absent bands). The vertical rhythm is what makes a surface with two regions and a surface with four regions both read as deliberate.

### 2.3 Density is orthogonal to geometry

Layout geometry does not change when the density state changes. *Show me how* and *Step back* (`02`) ship different *quantities* of content — more sentences, more visible affordances, more expanded sections — into the **same** frame, grid, measure, and rhythm. A card at *Show me how* and the same card at *Step back* occupy the same columns; the denser one simply has less inside it. This orthogonality is deliberate and mirrors the voice-density orthogonality (`02` §1.3): three axes — what it says (voice), how much it says (density), where it sits (layout) — that never have to re-learn each other. A future change to density tuning does not touch the grid, and a future change to the grid does not touch density.

---

## Part III — The three multi-pane archetypes

Every room composes from one of three layout archetypes inside the frame. Naming exactly three keeps room builds from inventing a fourth per room, which is how a layout system rots. Each composition family (canon Part II §4) maps to one of the three.

### 3.1 Single column

One column of content, left-aligned in the frame, prose at the reading measure, regions stacked on the vertical rhythm. This is the calmest archetype and the default. The today surface at rest (the Brief) uses it; the Threshold family (Welcome, Onboarding) uses it; the Trust Annex (Settings) uses it. Single column is for surfaces that are read top to bottom — a brief, an on-ramp, a calm utility.

### 3.2 Focal + rail

A two-thirds focal pane and a one-third rail (the 8/4 split). The focal pane carries one object at full depth — a Grounded card with its full Signal / Reason / Move grammar, its evidence, its gauge — and the rail carries the quiet remainder as a ranked list. The today surface's Spotlight read uses it; the Diagnosis Tables (Deal Workspace, Future Autopsy) use it (the deal under intervention focal, the recovery queue in the rail); the Live Instruments use it during a live call (the active segment focal, the worked-memory and next-step rails alongside). Focal + rail is for surfaces where the operator works one thing while keeping the rest in view.

### 3.3 Object + controls

A central shaped object with its controls supporting it — the object visually dominant, the builder controls arranged around or beneath it rather than the reverse. This is the Decision Bench archetype (canon Part II §4.4 — "the object being sharpened is visually central; builder controls support the object, not the other way around"). ICP Studio's ICP statement, Territory Architect's tiered map, PoC Framework's forged proof, Sourcing Workbench's prospect — each is the object, with the inputs that shape it kept subordinate. Object + controls is for surfaces where the operator *makes* something, and the made thing must out-weigh the making.

### 3.4 The families map to the archetypes

| Family | Archetype |
|---|---|
| Threshold (Welcome, Onboarding) | Single column |
| Command Chamber (Dashboard / today surface) | Single column at rest (Brief); Focal + rail when Spotlight; full-width timeline when Queue |
| Live Instrument (Signal Console, Discovery, Outbound, Cold Call, Call Planner, Advisor, Outdoors Events) | Focal + rail |
| Decision Bench (ICP, Territory, Sourcing, PoC) | Object + controls |
| Diagnosis Table (Deal Workspace, Future Autopsy) | Focal + rail |
| System Ledger (Readiness, Quota Workback, Founding GTM) | Single column, synthesis-weighted |
| Trust Annex (Settings) | Single column |

The next sibling spec (Surface patterns, `06`) specifies how each family fills its archetype — what regions it stacks, what carries weight, what recedes. This spec gives the geometry; `06` gives the per-family composition inside it.

---

## Part IV — The layout contract

### 4.1 What a surface declares

Every room declares three layout facts, and a room that cannot is improvising:

- **Archetype** — single column, focal + rail, or object + controls (§3). One of three, never a fourth.
- **Region stack** — the named regions top to bottom and their vertical rhythm, with empty regions collapsing.
- **Column subset** — which of the twelve columns each region occupies, with prose held to the reading measure regardless of columns available.

These compose with the component library's contract (`03` §4.2 — family, voice, density) and the today-surface-style surface specs. A surface declaring all three sits inside the frame predictably and aligns with every other surface in the product.

### 4.2 What this spec does not decide

It does not decide the per-family composition — which regions each family stacks and what each weights — that is the Surface patterns spec (`06`). It does not decide motion, including how a pane transitions when the operator switches reads or how a region collapses when it empties; that is the Motion spec. It does not re-decide the spacing, radius, elevation, or z-order tokens — those are `03` §4.3, referenced here and not duplicated. And it does not specify a sub-1024 layout, because the product is desktop-only by canon and that is a decision, not an omission.

---

## Part V — Migration, citations, signals

### 5.1 Migration of the existing rooms

The 22 rooms shipped at varying widths and ad-hoc layouts. Migration to the frame is mechanical and low-risk, and it rides along with each room's component-library migration (`03` §5.1) rather than as a separate pass: the room's content moves into the centered 1200px column under the full-bleed Wayfinder bar, its panes map to one of the three archetypes, and its prose gets capped at the reading measure. Most rooms already approximate single column or focal + rail; the retrofit is making the approximate exact. The Decision Benches need the most care, because the object-out-weighs-controls rule is the one most easily lost when a room is laid out by available space rather than by what the operator is making. The charter's mind-protection rule holds: relaying a room may not weaken what it knows, and the Dashboard is the first room to land on the frame because it is the first build.

### 5.2 Behavioral citations

- **Cognitive Load Theory and the reading measure** (`canon Part III §5`) — capping the line length and the content width reduces the extraneous load of long lines and wide scanning, which is most of what makes a dense surface feel calm rather than heavy.
- **Object before controls** (`canon Part III §3` rule 2) — the object + controls archetype is that rule rendered as geometry: the made thing dominates, the making recedes.
- **The hallway problem** (`canon Part III §6`) — a single full-bleed Wayfinder bar over one centered column is the architectural opposite of a hallway of equal-weight panes; the geometry itself refuses the hallway.
- **One dominant move per surface** (`canon Part III §3` rule 1) — focal + rail gives the dominant object the focal pane and the rest the rail, rendering the one-move hierarchy spatially.

### 5.3 Signals the spec is doing its job

1. **Every room sits on the same frame.** An audit finds the full-bleed bar, the centered 1200px column, the consistent gutter — no room running full-width, no room with an ad-hoc page width.
2. **Prose never runs long.** No sentence the operator reads exceeds the measure, regardless of how wide the room is.
3. **Three archetypes, not a dozen layouts.** Every room maps to single column, focal + rail, or object + controls; none invents a fourth.
4. **The grid aligns, it doesn't pack.** Columns are left empty where the work doesn't need them; the surface breathes rather than filling to the edges.
5. **It degrades, it doesn't break.** From 1600px to 1024px the rooms hold and collapse gracefully to single column; below 1024 the operator gets a calm desktop notice, never a broken room.
6. **Geometry is stable across density.** Switching *Show me how* and *Step back* changes content quantity and never the frame, grid, measure, or rhythm.

---

## Closing

The layout system is the page the whole product stands on. One frame — a full-bleed Wayfinder bar over a centered, capped, guttered column. One grid the work aligns to without packing into. One measure prose never crosses. One vertical rhythm every region stacks on. Three archetypes the seven families compose from, and no fourth. It is deliberately small, because a layout system is worth having only when it is the one geometry every room shares, not by offering a geometry for every room to choose differently. Geometry is the third orthogonal axis beside voice and density: what a surface says, how much it says, and where it sits — three axes that never have to re-learn each other.

It exists so the Dashboard build, and every build after it, makes its layout decisions *once, here*, rather than fresh and differently in every room. The next sibling — Surface patterns (`06`) — fills these archetypes per family. The geometry is now canon.
