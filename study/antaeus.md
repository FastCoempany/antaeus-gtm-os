# ANTAEUS GTM OS — VISUAL LANGUAGE SOURCE REPORT

Built from: `CLAUDE.md` (508KB canon), `src/styles/tokens.css`, `src/components/*`, `src/icons/*`, `src/lib/{ground,edge,follow}/*`, `public/favicon.svg`, `deliverables/design-system/00–11`, and direct reads of the settled 2026-07 mockups in `deliverables/mockups/`.

**Privacy note:** the repo contains a fictional demo dataset (`js/demo-seed-data-{ent,smb}.js`) built around a made-up buyer company, **Luca Industries, Inc.** — fictional sellers, fictional contacts, real public companies used only as target-account placeholders. No real customer data exists in the repo. I have redacted all account/person names and dollar figures from quoted copy below (shown as `[Account]`, `[$X]`).

---

## 1. THE PRODUCT

### What it is, plainly

Antaeus is a **founder-to-first-operator revenue operating system**. A founder who has been selling by memory — who knows which deal is wobbly, who the champion is, why the last one died — pours that knowledge into the app once, and from then on the app reads the motion back to them every morning and, critically, makes the motion **inheritable**: a first GTM hire could walk in and run it without the founder restating anything.

Canon's own one-liner:

> "Antaeus turns the work a founder is doing on revenue into a clear picture of what's actually happening, so the first serious go-to-market hire can pick it up and run it without restating anything."

### The real value proposition

Two beats, from the design-system charter (`00-charter`):

1. **The daily verb** — "see where the motion really is today, take the next move with confidence, and understand more about the motion than they did yesterday."
2. **The mechanism** — "selective attention that the system can defend." The charter states the differentiator as a verb swap: *"A CRM's core verb is **store**… Antaeus's core verb is **select** — the system pays attention for the operator, defends its picks in plain language, and quietly hides what does not deserve attention today."*

Two binding tests every surface must pass:
- **Test 1 (selectivity):** does it pay attention *for* the operator and defend its picks, or does it hand them a filing cabinet?
- **Test 2 (truth-loyalty):** does it show what's actually happening, *including what the operator would rather not see*? "Most software is sycophantic by default… Antaeus is designed to do the opposite."

Emotional targets: *"this system sees what is actually happening" · "this system is harder to fool than I am."* The app must feel **severe, calm under pressure, high-consequence, ranked, intelligent, unsentimental, authored** — and must NOT feel friendly-first, hype, AI-magic-theater, or motivational.

### The core objects (canon §2, "sacred nouns")

Protected. Every room operates on one or more; a room may *enrich* a noun but never redefine it.

| Noun | What it is |
|---|---|
| **ICP** | the one sharp definition of who the motion is for |
| **Account** | a named target org with focus, tier, signals, heat |
| **Signal** | a time-limited event implying commercial opportunity |
| **Motion** | a specific outbound move (email/call/LinkedIn) with route + intent |
| **Call** | a planned or live conversation attached to an account/deal |
| **Deal** | an opportunity with stage, value, pressure, qualification truth |
| **Advisor deployment** | an ask routed through external leverage |
| **Readiness** | whether the motion is hire-ready |
| **Handoff artifact** | the package a first hire would actually inherit |

**"Proof" was retired as a sacred noun (2026-07-03)** — declared AI-language and eradicated app-wide. Say *the pilot / the pilot's results / the evidence*.

Every noun must expose, at any surface: current state, pressure on it, best next move, what changes downstream, what the system remembers automatically. Continuity params (`returnTo`, `returnLabel`, `focusObject`, `focusRoom`, `fromMode`, `fromSurface`) are the plumbing that carries them between rooms.

### The room model

**22 rooms**, each mapped to exactly one of **seven composition families**. Rooms are *summoned, not browsed* — there is no left nav rail (retired as "a hallway with the doors painted on it").

The rooms, laid out as the actual GTM motion (this is the real registry, `src/lib/ground/motion.ts`, with each room's shipped one-liner):

| Stage | Rooms |
|---|---|
| **Enter** | Welcome *(the morning landing)* · Onboarding *(seed the workspace)* · Dashboard *(the one move, ranked)* |
| **Strategy** | ICP Studio *(who you sell to)* · Territory Architect *(carve the market)* · Prospecting Desk *(find real accounts)* |
| **Find & watch** | Signal Console *(watch the heat)* · Briefing *(what the system saw)* · Outdoors Events *(where buyers gather)* |
| **Work the account** | Outbound Studio *(the send line)* · Cold Call Studio *(walk in ready)* · LinkedIn Playbook *(air cover)* · Discovery Studio *(run the live call)* |
| **Advance the deal** | Deal Workspace *(what will slip)* · Pilot Desk *(run a pilot)* · Getting to Signed *(run to signature)* · Call in a Favor *(mobilize your people)* |
| **Diagnose · hand off** | Future Autopsy *(why it will die)* · Quota Workback *(your daily number)* · Readiness Score *(inheritable yet?)* · Founding GTM *(the handoff kit)* · Settings *(keep it safe)* |

The seven families (each defines first-fold structure, allowed plane count, what's loud, what recedes):

1. **Threshold** (entry) — Welcome, Onboarding
2. **Command Chamber** (ranking) — Dashboard
3. **Live Instrument** (live execution) — Signal Console, Outbound, Cold Call, LinkedIn, Discovery, Call in a Favor, Getting to Signed, Outdoors Events
4. **Decision Bench** (strategic shaping) — ICP Studio, Territory Architect, Prospecting Desk, Pilot Desk
5. **Diagnosis Table** (intervention) — Deal Workspace, Future Autopsy
6. **System Ledger** (synthesis) — Readiness, Quota Workback, Founding GTM
7. **Trust Annex** (utility) — Settings, auth, legal

Three rooms are *protected* (may not be made generic, renamed, folded, or watered down): **Signal Console, Future Autopsy, Discovery Studio**.

Underneath the rooms sits an **orchestration layer** — session model, an observations ledger the system writes into in plain sentences, a 30-minute heartbeat Edge Function, a deterministic skills layer. Thesis: *"the intelligence of a system is in the orchestration layer, not in the rooms."*

---

## 2. SURFACES AND MATERIALS AT BUILD FIDELITY

### The field

Two values are in play, and this matters:

- **Token file (`src/styles/tokens.css`):** `--ds-field: #f5f7fb`
- **Every settled 2026-07 mockup:** `--field: #eef1f7` (a cooler, slightly darker grey-blue)
- **A second mockup lineage (2026-07-04 batch: Future Autopsy, Prospecting Desk, Territory):** `--field: #F6F8FC` (lighter)
- **Auth gate / onboarding / marketing:** `--field: #f6f8fc`

So the real palette is a *band* of bright cool neutrals from `#eef1f7` → `#f6f8fc`. Never stark white — white is reserved for the raised surface.

Surfaces:
```css
--ds-surface:      #ffffff;   /* raised paper */
--ds-surface-sub:  #fafbfd;   /* a half-step down */
--ds-surface-sunk: #eff2f7;   /* a recessed track, meter base */
--ds-surface-warm: #fbfaf5;   /* a cream band */
```

### The graph-paper undertexture

Canon Part II §1: *"subtle graph-paper undertexture (1px grid at ~32–34px with very low opacity)."* The exact recipe, from the settled auth gate (`auth-gate-earth-2026-07-13.html`) — this is the canonical implementation:

```css
.stage{
  background-image:
    radial-gradient(circle at 12% 0%, rgba(37,99,235,.05), transparent 32%),
    radial-gradient(circle at 88% 8%, rgba(230,112,30,.04), transparent 30%),
    linear-gradient(rgba(10,28,64,.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(10,28,64,.08) 1px, transparent 1px);
  background-size: auto, auto, 34px 34px, 34px 34px;
  background-position: 0 0, 0 0, center 0, center 0;
}
/* a vignette that dissolves the grid at the edges */
.stage::before{
  content:"";position:absolute;inset:0;pointer-events:none;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(246,248,252,.82) 100%);
}
```

Grid pitch varies 30–36px across the archive; **34px is the most-used and the one in the settled gate**. Grid ink is `rgba(10,28,64,.08)`. Historical wireframes used 32px at 0.42 opacity of a lighter ink.

### The radial washes

Two washes, always faint, always the two accent hues, always top-corner-anchored:
- **Blue** (system intelligence): `circle at 12% 0%, rgba(37,99,235,.05), transparent 32%`
- **Orange** (pressure): `circle at 88% 8%, rgba(230,112,30,.04), transparent 30%`

Onboarding uses `8% 0%` / `94% 2%` at the same alphas. ICP Studio v4 (the only shipped room that carries a wash) uses one big elliptical orange:
```css
radial-gradient(1000px 440px at 12% -6%, rgba(230,112,30,.10), transparent 58%)
```

### Hairlines vs borders vs cards — the de-carded approach

The single most important material rule: **structure is carried by composition and hairlines, not by boxes.** Card accumulation as the main ordering system is a hard reject. The de-carding move, repeated across every settled room, is: replace a card grid with (a) a mono section label, (b) a 1px hairline, (c) generous vertical rhythm.

Three weights of line, and they mean different things:

```css
--ds-hair:        rgba(10,28,64,0.07);   /* between rows in a list        */
--ds-hair-strong: rgba(10,28,64,0.14);   /* a real section seam            */
--ds-rule:        rgba(10,28,64,0.16);   /* a border that must be seen     */
```
Mockups run slightly heavier: `--hair: rgba(10,28,64,.09)`, `--hair-2: rgba(10,28,64,.15)`. The 2026-07-04 lineage uses solid hex lines instead: `--line:#e6eaf2; --line-2:#d5dce8; --line-3:#c2ccdd`.

A worked de-carded example — the Quota Workback fused strands, two parallel columns joined by one quiet centre hairline and nothing else:
```css
.strands{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--hair-2)}
.st2{padding:16px 26px 0 0}
.st2.real{padding:16px 0 0 26px;border-left:1px solid var(--hair)}
.st2 .line{display:flex;align-items:baseline;gap:10px;padding:11px 0;border-top:1px solid var(--hair)}
```

### Left-rules — the signature device

The left-rule is the product's most-used compositional weapon. Weights and meanings:

| Weight | Use |
|---|---|
| **2px** | a quiet aside inside a block — a *listen-for* line, a *why*; usually blue |
| **3px** | a real block: the one move (orange), a system explanation (blue), an alert (amber), an error (red), a recovery move |
| **4px** | the heaviest — a hero panel that IS the move (onboarding's sharpened-ICP card) |

The canonical orange-ruled block (Welcome's one move — note the **asymmetric radius**, square on the ruled edge):
```css
.move{
  padding:24px 26px;
  border:1px solid var(--hair);
  border-left:3px solid var(--orange);
  border-radius:0 14px 14px 0;
  background:var(--surface);
  max-width:660px;
}
```
That `border-radius: 0 14px 14px 0` — square where the rule is, rounded away from it — appears on nearly every ruled block in the product. It makes the rule read as a *rule*, not as a colored border.

Blue is the same construction for system-intelligence content:
```css
.listen{ padding-left:12px; border-left:2px solid var(--blue); }
.note.neutral{ border-left:3px solid var(--blue); }
.note.corrective{ border-left:3px solid var(--red); }
```

### The Grounded Card, its gauge, its anchored edge

From `src/components/components.css` — the card carries weight through **two** devices in the same state color:

```css
.ds-card {
  display:flex; gap:14px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-hair-strong);
  border-bottom: 3px solid var(--ds-ink-quiet);   /* THE ANCHORED EDGE  */
  border-radius: 8px;
  box-shadow: var(--ds-shadow-rest);
  padding: 16px 18px;
  transition: box-shadow 200ms cubic-bezier(.2,0,0,1);
}
.ds-card--edge-orange { border-bottom-color: var(--ds-orange); }
.ds-card--edge-red    { border-bottom-color: var(--ds-red); }
/* …blue / green / amber */

.ds-gauge {                                        /* THE GAUGE (left rule) */
  width: 3px; align-self: stretch;
  border-radius: 2px;
  background: var(--ds-ink-quiet);
  flex: none;
}
.ds-gauge--orange { background: var(--ds-orange); }
```

**The discipline:** *"anchored edges and gauges are reserved for cards whose state warrants weight. Grounding everything erases the meaning — if every card has a colored edge, the color stops being a signal."* A card at rest carries the quiet neutral `--ds-ink-quiet` on both.

The card's content grammar is **Signal · Reason · Move** — the three native primitives rendered directly.

### Offset — one item breaks rank

Exactly one item per zone breaks the grid. Three simultaneous moves:
```css
.ds-offset{ position:relative; padding-top:16px; padding-bottom:24px; }
.ds-offset__tag{                       /* 1. tag sits OUTSIDE, top-left */
  position:absolute; top:-2px; left:12px;
  font:600 10.5px/1 var(--ds-font-mono);
  letter-spacing:.16em; text-transform:uppercase;
  color: var(--ds-orange);
}
.ds-card--offset{                      /* 2. heavier shadow + orange edge */
  box-shadow: var(--ds-shadow-offset);
  border-color: var(--ds-rule);
  overflow: visible;
}
.ds-card--offset .ds-card__foot{       /* 3. action straddles the bottom border */
  transform: translateY(calc(50% + 12px));
  margin-top: 4px;
}
```

### Elevation

Three shadows, all navy-tinted, never black:
```css
--ds-shadow-rest:   0 1px 2px rgba(10,28,64,.04), 0 4px 14px rgba(10,28,64,.05);
--ds-shadow-lift:   0 2px 4px rgba(10,28,64,.05), 0 14px 36px rgba(10,28,64,.08);
--ds-shadow-offset: 0 4px 10px rgba(10,28,64,.06), 0 16px 36px rgba(10,28,64,.10);
```
Buttons additionally carry a colored *under-glow* in the mockups (the tell of a warm accent on a cool field):
```css
box-shadow: 0 8px 20px -12px rgba(230,112,30,.85);   /* orange button   */
box-shadow: 0 10px 24px -12px rgba(230,112,30,.90);  /* the hero move   */
```

### Radii

```css
--ds-radius-control: 4px;   /* inputs, buttons in the library      */
--ds-radius-card:    8px;
--ds-radius-frame:  12px;
--ds-radius-pill:   99px;
```
The settled mockups run softer in practice: 8–9px buttons, 10–14px panels, 20–22px chips/pills. The asymmetric `0 Npx Npx 0` on ruled blocks is a recurring signature.

---

## 3. MARKS AND GEOMETRY

### The Grounded-A — exact construction

The mark is a drafted capital A standing on a ground line that **extends past its feet**. Myth: Antaeus drew strength from contact with the earth.

**48-unit viewBox. Three paths:**

| Element | Path data | Note |
|---|---|---|
| Legs | `M14 38L24 10l10 28` | apex (24,10), feet at y=38 |
| Crossbar | `M18.2 28h11.6` | low, "like a gauge reading" |
| Ground | `M2 38h44` | the long overhang — ground, not underline |

Stroke: navy `#0A1C40` or `currentColor`. `fill="none"`, `stroke-linecap="butt"`, `stroke-linejoin="miter"`. **Flat terminals, mitered joins** — never round. This single choice is most of what makes it read as drafted rather than friendly.

The shipped `public/favicon.svg` verbatim:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"
     stroke="#0A1C40" stroke-width="3.6" stroke-linecap="butt" stroke-linejoin="miter">
  <path d="M14 38L24 10l10 28"/>
  <path d="M18.2 28h11.6"/>
  <path d="M2 38h44"/>
</svg>
```

### The stroke-weight ladder (W2 ratio)

Stroke steps **up** as the mark gets smaller so it keeps its blackness:

| Rendered size | Stroke (on 48 viewBox) | Crossbar |
|---|---|---|
| Display (≥40px) | 3.2 | yes |
| 32px | 3.6 | yes |
| 24px | 4.0 | yes |
| 20px (chrome) | 4.4 | yes |
| 16px (favicon) | **6.0** | **dropped** |

**The 16px rule:** three strokes don't survive a 16-pixel box. At 16 and below the mark is legs + ground only — *"the ground line is the signature, not the bar."*

Implemented as:
```ts
function strokeFor(size:number){
  if (size <= 16) return 6;
  if (size <= 20) return 4.4;
  if (size <= 24) return 4;
  if (size <= 32) return 3.6;
  return 3.2;
}
```

### The Living Mark — grounded ↔ lifted

The mascot is not a separate character; the logo *is* the mascot. One device, drawn straight from the myth:

- **Grounded** — the mark sits solid on the ground line. Means: strong, healthy, inheritable.
- **Lifted** — the same mark raised off the line, tilted and hollowed. Means: weak, at-risk, a motion that lives only in one head.

Shipped transform (`src/components/brand.tsx`):
```tsx
<g transform={lifted ? "translate(1 -7) rotate(6 24 24)" : undefined}
   opacity={lifted ? 0.42 : 1}
   style="transition: transform .5s cubic-bezier(.2,.7,.2,1), opacity .5s ease">
  {/* legs + crossbar */}
</g>
<path d="M2 38h44"/>   {/* the ground line never moves */}
```
The ground line stays put. Only the A lifts. This is usable product-wide: a deal *lifts* as it goes at-risk and *grounds* as it recovers.

**The landing** — from the settled auth gate, the mark descends one step per typed code digit and, on the right code, lands and grows a **root** into a forest stratum:
```css
.ground{ position:absolute; left:0; right:0; bottom:120px; height:3px; background:#1b5e3f; }
.earth { height:120px; background:linear-gradient(180deg, rgba(27,94,63,.08) 0%, rgba(27,94,63,.02) 100%); }
.strata i{ position:absolute; left:0; right:0; height:1px; background:rgba(27,94,63,.14); }
.rootline{ width:2.5px; height:0; background:#1b5e3f; transition:height .6s ease .25s; }
.rootline.on{ height:58px; }
```

### Lockups

- **L1 — serif** (landing, docs): mark + "Antaeus" in DM Serif Display 28px. *"The mark and the headline voice are the same voice."*
- **L2 — caps** (product chrome): mark + "ANTAEUS" in `font: 700 12px/1 Public Sans; letter-spacing: 0.22em`. Name hides below 720px; the mark alone is the affordance.

### Usage rules (hard)

- The mark is **navy or `currentColor` only. It never takes an accent color — orange is the move, and the mark is not a move.** (Forest is the one permitted depth accent.)
- Never rotates (except the lifted device), never skews, never gains a container shape, never sits on a photo.
- One mark per surface.

### The icon set's construction rules

46 glyphs: 11 sacred nouns · 17 operator verbs · 11 system/wayfinding · 7 status.

- **24px box, 22px live area** (1px optical margin), drawn on a construction grid; strokes snap to it.
- **2px keyline** — deliberately heavier than the ubiquitous 1.5px, reads instrument-like.
- **`stroke-linecap="butt"`, `stroke-linejoin="miter"`, `fill="none"`, `stroke="currentColor"`** — same hand as the brand mark.
- **The edge-rule** (signature 1): where natural, a glyph rests on or carries a straight rule, echoing the anchored edge and the gauge. The Account glyph rests on a baseline (`M3 20h18`); the Readiness glyph is three bars standing on a level line.
- **The rationed tick** (signature 2): at most one short accent stroke marks the glyph's active point, rationed exactly like orange in the UI. Most glyphs carry none. Implemented as `stroke="var(--ds-icon-accent, currentColor)"` on one sub-path, with the `<Icon>` wrapper owning the variable.
- Three sizes only: **16 / 20 / 24**. Never below 16, never arbitrary.
- **Semantic-only:** a glyph must name a sacred noun, an operator verb, or a real system/status meaning. No decoration, no filled/duotone variants, no spot illustration.

Real glyph source, showing both signatures:
```tsx
/* Account — rests on a baseline (the edge-rule) */
<path d="M5 20V6l7-3 7 3v14"/><path d="M3 20h18"/>
<path d="M9 11h2M13 11h2M9 15h2M13 15h2"/>

/* Signal — blue intelligence tick at the centre */
<path d="M4 12a8 8 0 0 1 16 0"/><path d="M8 12a4 4 0 0 1 8 0"/>
<circle cx="12" cy="12" r="1.6" fill="var(--ds-icon-accent, currentColor)" stroke="none"/>

/* Send — orange tick at the point of action */
<path d="M3 11l18-7-7 18-3.5-7.5z"/>
<path d="M10.5 13.5L14 10" stroke="var(--ds-icon-accent, currentColor)"/>

/* Readiness — three bars on a level line (the edge-rule again) */
<path d="M3 20h18"/><path d="M7 16v-3M12 16V8M17 16v-6"/>
```

A later travel/weather set (Outdoors Events, 2026-07-07) adds plane / bed / sun / cloud / rain / lanyard-badge / calendar / pin / ticket — **but was drawn with `stroke-linecap:round; stroke-linejoin:round` at 1.7px**, contradicting the set's own construction rule. Noted in §8.

---

## 4. THE DESIGN SYSTEM

### Color — every hex and its role

Quoted verbatim from `src/styles/tokens.css`:

```css
/* ── Color · the field and surfaces ─────────────────── */
--ds-field: #f5f7fb;
--ds-surface: #ffffff;
--ds-surface-sub: #fafbfd;
--ds-surface-sunk: #eff2f7;
--ds-surface-warm: #fbfaf5;

/* ── Color · ink at four opacities + hairlines ──────── */
--ds-ink: #0a1c40;
--ds-ink-700: #142949;
--ds-ink-soft: rgba(10, 28, 64, 0.66);
--ds-ink-faint: rgba(10, 28, 64, 0.42);
--ds-ink-quiet: rgba(10, 28, 64, 0.22);
--ds-on-ink: #ffffff;
--ds-scrim: rgba(10, 28, 64, 0.35);
--ds-hair: rgba(10, 28, 64, 0.07);
--ds-hair-strong: rgba(10, 28, 64, 0.14);
--ds-rule: rgba(10, 28, 64, 0.16);

/* ── Color · semantic accents, one meaning each ───────
   orange = the one dominant move · blue = system intelligence ·
   green = real health, this moment · forest = durable/compounding,
   over time · amber = caution · red = real risk.
   Referenced by role, never picked for hue. */
--ds-orange: #e6701e;
--ds-orange-strong: #d4661b;
--ds-orange-soft: rgba(230, 112, 30, 0.1);
--ds-orange-tint: rgba(230, 112, 30, 0.05);
--ds-blue: #2563eb;
--ds-blue-strong: #1d4ed8;
--ds-blue-soft: rgba(37, 99, 235, 0.08);
--ds-green: #22c55e;                    /* this moment (a derivative) */
--ds-green-soft: rgba(34, 197, 94, 0.1);
--ds-forest: #1b5e3f;                   /* over time (an integral)    */
--ds-forest-strong: #164c33;
--ds-forest-soft: rgba(27, 94, 63, 0.1);
--ds-amber: #f59e0b;
--ds-amber-soft: rgba(245, 158, 11, 0.12);
--ds-red: #ef4444;
--ds-red-soft: rgba(239, 68, 68, 0.07);
```

**The two greens — this is the most distinctive color decision in the system.** Canonized 2026-07-02:

- **Green `#22c55e`** is the *derivative* — health, live, ready **right now**.
- **Forest green `#1b5e3f`** is the *integral over time* — the durable, compounding, inheritable state the whole product steers toward: a Readiness verdict climbing, the Handoff Kit filling, a pilot result that still holds months later. *"Deliberately deep so it is never read as the health-green. Rationed like gold."* If it's not about something that has **held or matured over time**, it's the wrong green.

**Known token-file defect:** `--ds-forest` is declared **twice** in `tokens.css` — `#1b5e3f` in the semantic block, then `#1b5138` again 20 lines later in a "reserved warm-dark accent" block with `--ds-forest-strong: #15402b` and `--ds-on-forest: #ffffff`. **The second wins at runtime, so shipped forest is `#1b5138`, not the documented `#1b5e3f`.** Every mockup uses `#1b5e3f`. Pick `#1b5e3f`.

**Rationing rules:**
- Orange is the most powerful color — one primary move per surface, **once**, never decorative.
- Green must be genuine, never a default "looks positive" fill.
- Forest is rationed like gold.
- Amber is more common than red; red is the last-resort intervention color.
- **Every color carries a semantic role. If a color appears without carrying meaning, remove or recolor it.**

**The mockups' working palette drifts warmer/deeper than the tokens** — this is what the settled 2026-07 designs actually render:
```css
--amber:#b5790f;  --amber-soft:rgba(181,121,15,.10);   /* vs token #f59e0b  */
--red:#c0392b;    --red-soft:rgba(192,57,43,.06);      /* vs token #ef4444  */
--forest:#1b5e3f; --forest-soft:rgba(27,94,63,.09);
```
The 2026-07-04 lineage uses `--amber:#c98a1a; --red:#d1483a; --ink:#0e1b33`. Signal Console introduces an ember pair for heat: `--ember:#c86a2a; --ember-hot:#d0491f`. Briefing introduces a softened blue `#3e5cad` and a green-as-action `--go:#1a8f4e`.

### Typography

Three faces, three jobs:

```css
--ds-font-serif: "DM Serif Display", serif;   /* authority, emphasis, consequence */
--ds-font-sans:  "Public Sans", -apple-system, system-ui, sans-serif;  /* the work */
--ds-font-mono:  "JetBrains Mono", monospace; /* kickers, meters, codes — never body */
```

Plus one reading serif used in the document-like rooms (Founding GTM, Readiness, Welcome): **Newsreader** (`--read`), at 15–17px / 1.55–1.66 for the pages you actually read.

**The compression rule:** *"Authored serif headlines carry the argument. Sans carries the work. Mono recedes."*

Type discipline:
- One dominant headline per surface — never two competing serifs at similar weight.
- Max 3 sizes in the first visible zone.
- Mono must do semantic work (kicker, code, score) — never decoration.
- Giant display type must be *warranted*; never use it to fill space.

### The type scale

```css
--ds-type-display: clamp(30px, 4vw, 64px);  /* serif · the authored headline */
--ds-type-title:   20px;                    /* serif · card + section heads  */
--ds-type-body:    15px;                    /* sans · reading and controls   */
--ds-type-label:   13px;                    /* sans 600 · field labels       */
--ds-type-kicker:  10.5px;                  /* mono · letter-spaced caps     */
--ds-leading-body: 1.6;
--ds-tracking-kicker: 0.16em;
```

Real clamp values in shipped surfaces (these are bolder than the token):
| Surface | Value |
|---|---|
| Dashboard verdict masthead | `clamp(40px, 6.4vw, 74px)`, line-height `.98`, tracking `-.02em` |
| Dashboard one-move title | `clamp(26px, 3.4vw, 38px)`, line-height `1.05`, tracking `-.01em` |
| Auth-gate hero | `clamp(2.2rem, 4.6vw, 3.9rem)`, line-height `1.04`, tracking `-.02em` |
| Onboarding step heads | `clamp(1.8rem, 3.4vw, 3rem)`, line-height `1.04` |
| Readiness verdict | `36px` / `1.06` |
| Welcome statement | `42px` / `1.1` |
| Founding GTM part title | `32px` / `1.12` |
| Discovery live question | `31px` / `1.18` |

The mono kicker is the product's most-repeated micro-object — three tracking values in use:
```css
font:600 10.5px/1 var(--ds-font-mono); letter-spacing:.16em; text-transform:uppercase;  /* default */
letter-spacing:.20em;   /* the room wordmark, top-left, 12px 600 */
letter-spacing:.09em;   /* a quiet section label inside a room, 9.5px */
```

Display serif is always `font-weight: 400` — DM Serif Display has one weight and the system never fakes another.

### Spacing — 8px rhythm with half-steps

```css
--ds-space-1: 4px;   --ds-space-2: 8px;   --ds-space-3: 12px;  --ds-space-35: 14px;
--ds-space-4: 16px;  --ds-space-45: 18px; --ds-space-5: 20px;  --ds-space-55: 22px;
--ds-space-6: 24px;  --ds-space-7: 28px;  --ds-space-8: 32px;
--ds-space-10: 40px; --ds-space-12: 48px; --ds-space-14: 56px;
```
Rule: **32px between major regions**, hairline where a seam is called for. Empty regions **collapse** — the rhythm closes over them; no placeholder padding.

### Layout frame

```css
--ds-page-max:    1200px;   /* content column cap, always centered */
--ds-page-gutter:   40px;   /* minimum side gutter                 */
--ds-grid-gap:      24px;   /* 12-column gutters                   */
--ds-measure:       66ch;   /* prose never exceeds this            */
```
- The Wayfinder bar is the **only** full-bleed element. Everything else lives in the column.
- 12-column grid, 24px gutters, **for alignment not for filling** — most surfaces use a subset and leave the rest empty, "because empty columns are how a dense product breathes."
- Prose caps at **66ch** regardless of available columns.
- **Three archetypes only:** Single column · Focal + rail (8/4, `grid-template-columns: 2fr 1fr`) · Object + controls (2fr 1fr, object dominant). Both multi-pane archetypes collapse to single column below 1024px.
- Desktop-only. Optimal 1280–1600px; workable 1024–1280; **below 1024 the product shows a calm plain notice, never a half-reflowed room.**

Settled rooms run narrower than the 1200 cap, tuned per room: Welcome 840px · Quota / Settings 900px · Pilot Desk 920px · Getting to Signed 1000px · Discovery 1000px · Signal Console 1020px · Dashboard 1080px · Founding GTM 1120px.

### Motion

```css
--ds-motion-instant:     0ms;
--ds-motion-quick:     120ms;   /* state settle, hover            */
--ds-motion-base:      200ms;   /* read switch, region collapse   */
--ds-motion-considered:320ms;   /* first-load staging, drawer     */
--ds-ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ds-ease-exit:     cubic-bezier(0.4, 0, 1, 1);
--ds-stagger:          40ms;
```
(The mockups use a third, softer curve widely: `cubic-bezier(.22,.61,.36,1)`.)

**The closed motion vocabulary — a build performs only these six and invents neither a motion nor an off-scale duration:**

1. **First-load staging** — children arrive in stack order on the 40ms stagger, capped at 8 steps: `from{opacity:0;transform:translateY(8px)}`.
2. **The read switch** — switching modes cross-fades the focal read on 200ms; the furniture does not move.
3. **State-change confirmation** — `.ds-settle` transitions color/background/border on 120ms so a save visibly matters.
4. **Region collapse** — fades on the exit curve.
5. **The pulse** — *the single ambient loop in the product*: one 7px orange dot, `2s` infinite, scaling 1 → 0.72 and 1 → 0.4 opacity. **Exactly one dot per surface**, on the most-pressured object.
6. **Escalation** — a two-cycle flash, reserved for real destructive risk only. *"An escalation that fires on a non-destructive event is a bug."*

Doctrine: *motion is sparse, consequential, state-based. It guides attention; it does not entertain. Never for hover theater, microinteraction excess, or friendliness.* Under `prefers-reduced-motion` every duration token zeroes and the looping pulse is explicitly stopped; nothing is lost because motion is never load-bearing.

### Z-order

```css
--ds-z-content: 0; --ds-z-wayfinder: 100; --ds-z-drawer: 200;
--ds-z-modal: 300; --ds-z-toast: 400;
```
A component never sets an ad-hoc z-index; it declares its layer.

### Six interaction states, always

Every interactive renders: rest · hover · focus · active · disabled · selected.
```css
:focus-visible { outline: 3px solid var(--ds-orange-soft); outline-offset: 1px; }
.ds-btn:active:not(:disabled) { transform: translateY(1px); }   /* 1px depress */
.ds-btn:disabled { opacity:.45; cursor:not-allowed; }
```
A disabled control **carries its reason** (`disabledWhy`). Selected is a persistent orange on-state, visually distinct from hover.

### Five data states, always

Every card renders: ready · **loading** (holds the silhouette with a 1.2s shimmer, never a spinner) · **empty** (directional — why it matters + one move, dashed hairline, sunken surface) · **error** (honest + recoverable, red 3px left rule on `--ds-red-soft`) · **unsaved** (a quiet 11px amber marker, so a save is never ambiguous).

---

## 5. THE INTERFACE LANGUAGE — EIGHT SETTLED SURFACES IN DETAIL

### 5.1 Dashboard — the command + standing cockpit
`deliverables/mockups/dashboard-CHOSEN-complete-2026-07-04.html` · Command Chamber · single column, 1080px

Three bands, top to bottom, each separated by a `--hair-2` rule. Nothing is a card.

**Band 1 — the verdict masthead.** A 10.5px mono kicker (`Where your whole motion stands`), then a **five-segment gate ladder**: five equal-width cells, each a 4px rounded bar over a 9.5px mono label. Past stages are **forest** filled, the current stage **amber**, the next stage a **dashed blue** bar drawn with `repeating-linear-gradient(90deg, rgba(37,99,235,.35) 0 5px, transparent 5px 10px)`, the rest quiet navy at 10%. Then the headline in DM Serif at `clamp(40px, 6.4vw, 74px)`, line-height `.98`: **"You're *Building*."** — the state name italicized-but-not-italic (`font-style:normal; color:var(--amber)`). Beneath it a 2px-amber-ruled paragraph, max 52ch, headed by a tiny amber mono label `What gets you to the next stage`, and a blue mono link `See the whole thing →`.

**Band 2 — the one move.** Orange mono kicker with a quiet position counter (`The most valuable move on your board · #1 of 14`). Then a serif `clamp(26px,3.4vw,38px)` title and, pushed to the far right by `margin-left:auto`, the single orange button. Under it the reasoning paragraph at 66ch max, then a **forest** confidence line with a 7px forest dot, a blue `not now — show me the next` that cycles the board, and a ghost preview of the next two moves. Switching moves fades `#mbody` to opacity 0 for 150ms then swaps — the *read switch*.

**Band 3 — the standing row.** Five equal flex cells separated by 1px left hairlines (first cell has none). Each: 9px mono kicker → 18px semibold value → 11px quiet subline → a 9px mono door label (`Deal Workspace ↗`). Bad values go red, warning values amber. **Every cell is a door**; hovering turns both the value and the door label orange.

**What leads:** the whole-motion standing. **What recedes:** the room list — it doesn't exist; there is no nav. **The one dominant move:** one orange button, once.

**The readiness drawer** slides in from the right at `min(480px,95vw)` over a `rgba(10,28,64,.3)` scrim, `transform .26s cubic-bezier(.22,.61,.36,1)`, `box-shadow: -10px 0 44px rgba(10,28,64,.14)`. Inside: the verdict repeated at 34px serif, a 5-segment ladder, numbered blockers (`1` red = hard, `2` blue), then five "parts" rows each with a 96px mono label + colored dot + a plain sentence.

### 5.2 Discovery Studio — the live cockpit
`discovery-studio-live-cockpit-2026-07-07.html` · Live Instrument · single focused column, 1000px, `min-height:100vh` flex

Designed for a seller **glancing at the screen while talking on a live 30-minute call**. The shipped 3-column console was rejected as too dense.

Top to bottom:
- **Topbar:** room wordmark, an orange-outlined framework selector pill (`CX AI ▾`), a forest pre-flight line with a 7px dot (*"Ready to walk in — person · persona · why-now · deal all set"*), and right-aligned a 3-button compression segmented control (All / Essentials / **Emergency** — Emergency turns red when on).
- **The always-on call-state line:** one 10px-radius white strip with a hairline. Account name semibold, the why-now inline with the trigger in amber, then right-aligned a mono vitals run: `reading: guarded` (amber) · `4/7 truths` · `champion ✓` (forest) · `signer —` (amber) · `next-step: not set`.
- **The segment spine:** ten pill chips in a horizontal wrap between two hairlines. Done segments go forest-on-forest-soft; essential-but-unhit carry a 5px amber dot; the current one takes a **2px orange border on orange-soft** and goes semibold. Each carries a tiny mono ordinal.
- **The moment** (`flex:1`, the dominant zone): orange mono segment label → the persona-tuned question in **31px DM Serif** → a quiet lens line → a **blue 2px-left-ruled "Listen for"** line → `When they answer, tap what you heard` → a row of rounded 22px-radius response chips. Tapping one turns it red-on-red-soft and **rises** a forest-3px-left-ruled answer panel (`0 14px 14px 0` radius) carrying `Say this` and the exact next line at 19px semibold, plus a blue mono jump (`→ this opens Trigger & urgency next`).
- **The contextual bottom drawer:** `position:sticky; bottom:0`, full-bleed (`margin: 0 -34px`), with an upward shadow `0 -16px 34px -24px rgba(10,28,64,.32)`. Six tabs (They pushed back · If they ask you · Evidence · **Recover & skip** in red · Truth & signals · Next-step); the active tab takes the field color as its background and squares into the body below. A tab auto-flags with a 6px amber dot when the moment calls for it.

**What leads:** the live question. **What recedes:** the 19 primitives — all reachable, none competing. **One dominant move:** the orange `Lock the next step` button in the drawer foot.

### 5.3 Founding GTM — the open book
`founding-gtm-open-book-2026-07-07.html` · System Ledger · a bound two-pane reader, 1120px

`grid-template-columns: 290px 1fr; gap: 0` — the **gap is zero**, and the seam is a single 1px hairline (`border-right` on the left plate). That's what makes it read as a bound spread rather than a sidebar.

**Left plate (290px):** mono kicker `If a hire started Monday` → 27px serif `The handoff` → a Newsreader lede at 14.5px/1.55 → a stat line `4 of 7 parts ready to hand off` with the number in **forest** → a 6px **segment bar** of seven flex cells, 2px apart, each forest (ready) / amber (thin) / hairline (empty) → the seven-part contents list. Each contents row is `grid-template-columns: 16px 1fr 10px`: mono ordinal · title · an 8px status dot. The open row takes `rgba(230,112,30,.05)` and turns its title orange semibold.

**Right page:** mono section code (`§1 · Who we win`) → 32px serif part title → a pill badge (`Ready to hand off` forest-on-forest-soft / `Still thin — 3 more logged calls` amber / `Not written yet` grey) → **the body in Newsreader at 17px / 1.66, max 600px** — actual prose, not bullets → a mono evidence block indented behind a 2px hairline left rule → and the signature object: **the "one thing to notice" note**, a white panel with `border-radius: 0 12px 12px 0` and a 3px left rule that is **red when corrective, blue when neutral, forest when affirming**, carrying a 9px mono label, a 14.5px semibold head and a 13px body.

Section 7 renders as a five-column week grid with orange mono day names and 1px vertical rules between days.

Foot: `‹ back` / `next part ›` in blue mono, and one orange `Share read-only with a hire →`.

**What leads:** the prose. **What recedes:** the readiness count — deliberately demoted to a recessive segment bar, because the scoreboard trap is the named failure mode for this room.

### 5.4 Readiness Score — the climb
`readiness-score-climb-2026-07-07.html` · System Ledger · a `min(540px,100%)` right drawer, no route change

Opened from a topbar anchor that reads `Readiness · Building ›`.

**Hero:** a downward amber wash (`linear-gradient(180deg, rgba(181,121,15,.06), transparent)`), a mono kicker asking the room's one question — *"Readiness · could a hire run this yet?"* — then the state name at **36px DM Serif** and one Newsreader sentence of what a hire could/couldn't do today. A 30px circular ✕ at top-right.

**The climb ladder** — the room's whole idea. A continuous 2px vertical hairline at `left:8px`, five rungs hanging off it. Each rung: a 14px circular node, a 15px semibold name, a 12.5px read, a 9px mono time-stamp.
- **Passed rungs** are solid **forest** nodes, forest names, and their connector segment above is redrawn in forest — so the climbed part of the line is literally green. Stamped `Left behind · 3 weeks ago`.
- **The current rung** gets an amber ring with an amber core (`inset:3px` pseudo-element), a faint amber wash `rgba(181,121,15,.04)` and `border-radius: 0 12px 12px 0`. Stamped `You are here`.
- **Future rungs** are hollow, quiet, stamped `Next` / `Later` / `The summit`.

Below: an amber-3px-left-ruled panel `To reach Inheritable` with serif head and `→`-bulleted moves. Then the five parts of the motion **demoted to quiet pill chips** — forest bordered (`solid`) or amber bordered (`thin`). **No bars anywhere. No "/20". No number.**

Foot: a forest-bordered `Share read-only with a hire`, plus a ghost export.

### 5.5 Quota Workback — pace + fused strands
`quota-workback-pace-strands-2026-07-07.html` · System Ledger · single column, 900px

**The verdict:** a red mono kicker `Where today's pace lands you`, then a 34px serif sentence with the shortfall in red: *"At the rate you're working, you finish the year around [$X] — about [$Y] short."* Then one plain paragraph naming the single cause.

**The target track:** a 44px-tall white bar with a hairline and 10px radius. The projection fills from the left with `linear-gradient(90deg, rgba(192,57,43,.14), rgba(192,57,43,.06))` closed by a **2px red right border** (the projected landing). A **2px navy tick at 100%** overhangs 4px top and bottom — the target. Labels sit inside, mono 10.5px.

**The fused strands** — the room's signature. `grid-template-columns:1fr 1fr; gap:0`, joined by one quiet centre hairline, the two columns padded 26px away from it. Left = *What your number needs* (quiet mono label); right = *Where you actually are* (blue label). Each row: a **serif numeral at 21–22px in a fixed 66px min-width column**, then a 12.5px sans description, then (right column only) a pill pushed to the far right — red `5 short` / forest `on track`. Below each strand, separated by a hairline, a **judgment** block: an 18px serif question (`Is the plan real?` / `Do you have the pipeline?`), prose, and — on the right — a 9px mini-track with a red fill and a navy target tick.

Closing: an orange-3px-left-ruled `Back on pace` line, then a mono `Close the gap` label and one orange button among ghost buttons.

**The soul of the room is the honesty:** it names *the one optimistic assumption* and what it costs, in plain words.

### 5.6 Getting to Signed — the face-off + positions ledger
`getting-to-signed-faceoff-2026-07-07.html` · Live Instrument · 1000px

**Committee strip:** rounded 20px chips, each with a 7px dot — forest (warm) / amber (quiet N days) / blue (new) — the name semibold and the role in quiet 10.5px. A quiet chip takes an amber border and amber-soft fill. Right-aligned: `Papers ready: SOC 2 · subprocessor list · pen-test · DPA` with the list in forest.

**The face-off** — the striking object. `grid-template-columns: 1fr 54px 1fr`, `align-items:stretch`, no gap.
- Left panel: white, 12px radius, **3px red top border**, a 9px red mono label `Their side · Legal`, a 15px semibold position, a 12px explanation.
- Centre 54px column: a vertical 8px mono `the gap` set with `writing-mode: vertical-rl; transform: rotate(180deg)`, above an 18px serif `vs` in quiet ink.
- Right panel: identical construction with a **3px forest top border** and a forest label `Your line`.

Beneath: a plain why paragraph, then three option chips each carrying a tiny rounded keyword tag — `hold` (forest), `trade` (blue), `line` (red) — then one orange button and a blue mono link.

**The positions ledger:** a 4-column grid (`108px 1fr 130px 74px`) with a mono uppercase header under a hairline. Each row: a team tag with an 8px **square** dot (security violet `#7c5cff`, finance green `#1f9d6b`, business amber), the front title, the position pair `their ask → your line` colored red→forest with a quiet arrow, a status pill, and a drill affordance. **The open row lifts out of the ledger** — it takes the white surface, a 10px radius, `box-shadow: 0 10px 30px -18px rgba(10,28,64,.35)`, a transparent bottom border and 4px vertical margin, so the row becomes a panel in place.

The deepest moment is the **coverage map**: a field-colored 11px-radius block containing a 24px flexed bar split `flex:120 / flex:30` — forest "120 covered" against amber "30 open" — with the reading spelled out underneath in plain words.

### 5.7 Pilot Desk — the guided pilot
`pilot-desk-guided-2026-07-06.html` · Decision Bench · 920px

Three stacked material treatments, deliberately different from each other:

1. **The circle band** — a bordered 12px-radius panel holding *only names*: rounded 20px face chips, each with a 7px dot (forest = using it / amber = not started / quiet = n/a), the name semibold, the role in 11px regular. Header carries a forest-mono right-aligned read (`4 people in · aim 4–6 for this sale ✓`) and an italic sizing note.
2. **The who's-missing block — deliberately NOT in a box.** `border-left: 3px solid amber; padding-left: 17px;` sitting directly on the field. Rows separated by hairlines; each row is a bold question + a quiet why + a blue mono `find them` that opens a small inline white panel with a text input and an `ask the champion for an intro` link. This contrast — a bordered band above, an unboxed ruled block below — is the room's most instructive composition.
3. **The journey** — a vertical 2px hairline at `left:11px` with five movement nodes hanging off it. Done nodes are filled forest with white numerals; the **current node is filled orange with a 5px orange-soft halo ring** (`box-shadow: 0 0 0 5px var(--orange-soft)`). Only the current movement expands, into an **orange 3px left-ruled panel** carrying a 24px serif heading, a blue-2px-ruled why, an adoption read (mono micro-labels over 14px values, amber/forest), a source line in 9.5px mono, and **gated checklist steps** — a step you can't do yet renders at `opacity:.45` with a `border-style: dashed` checkbox and an inline mono lock hint.

The Share kit is a collapsible band whose asset rows are a two-column list of 1px-hairline rows; the one that matters right now takes an amber-soft background bled 8px past the column.

### 5.8 The Live Edge — the left wall as live presence
`src/lib/edge/edge.css` + `live-edge-switch-settled-2026-07-16.html` · mounted on 20 rooms

A **216px viewport-fixed left rail** that stops 26px short of the bottom so it never crosses the ground line. The room makes way via `body.has-live-edge { padding-left: 216px; transition: padding-left .38s cubic-bezier(.3,.9,.3,1) }`. Background is a single directional wash: `linear-gradient(90deg, rgba(10,28,64,.025), transparent 70%)` with a 1px right hairline. No panel, no card.

Three stacked zones:
- **Head:** a 9px mono `LIVE` kicker beside a 7px forest dot that **breathes** on a 3.2s ease-in-out opacity loop (0.9 ↔ 0.45).
- **The count:** a serif `1.7rem` numeral beside a mono goal, a 0.68rem read, and a 3px forest track.
- **The wire:** hairline-separated 0.71rem lines. Each carries a **7.5px mono tag** — quiet for *you*, **blue** for *the machine*, **orange** for *the buyers* — and an 8px mono age stamp. A big buyer moment takes `border-left: 3px solid orange` plus `linear-gradient(90deg, rgba(230,112,30,.06), transparent 80%)`. A newly arrived line flashes `rgba(230,112,30,.12)` → transparent over 1.6s.
- **The foot:** an 8.5px mono uppercase ledger line.

**The switch is the best-authored interaction in the repo.** No standing controls — the off affordance is `opacity:0` until you hover the rail. Turning it off happens in **three visible beats**: (1) **STILL** — every line goes `filter:grayscale(1); opacity:.3` *simultaneously*, the dot's animation stops and it turns quiet navy, all in place; (2) **FOLD** — the rail `translateX(-101%)`; (3) the leftover **14px hairline strip** is plainly dead. Turning it on is the mirror — it slides out grey and then **wakes**, lines re-inking one after another via per-child `transition-delay` at `.05 / .14 / .23 / .32 / .41 / .5s`. In the off state a **cursor-following whisper** appears anywhere on the hairline — a small white pill that tracks your mouse height.

### 5.9 The Ground — the app's one jump summon
`src/lib/ground/ground.css` + `GroundLine.tsx` · on all 22 rooms

The Ctrl+K palette is retired. Instead, **every room quietly stands on a near-invisible ground line at the foot of the viewport** — the brand mark's signature stroke, made into the product's navigation. *"The myth is the mechanism: Antaeus gets his strength back by touching the ground."*

- **The line:** a 26px-tall fixed hit area holding a 2.5px navy stroke at `opacity:.4`, sitting 9px off the bottom. On hover it grows to 3.5px at `opacity:.85`.
- **The Grip:** dead centre, a small raised white tab that **breaks the line** — `border-radius: 9px 9px 0 0`, no bottom border, `box-shadow: 0 -3px 10px rgba(10,28,64,.07)` — containing the Grounded-A beside three 2×8px grip bars. On hover the tab lifts (`padding-bottom: 4px → 8px`) and the grip bars warm to **orange**.
- **The map rises from beneath the room:** a full-width panel, `max-height:86vh`, `border-top: 2.5px solid navy`, `box-shadow: 0 -18px 50px -18px rgba(10,28,64,.35)`, animating `translateY(103%) → 0` over **450ms** on `cubic-bezier(.22,.61,.36,1)`, with `visibility` delayed on the way down so the 22 links leave the tab order when sunk.
- **Inside:** a mono kicker, a 21px serif title, a you-are-here line naming the system's suggested next room in orange, an underlined-only filter input, and a **6-column flow** — one column per motion stage, separated by 1px left hairlines, each headed by an 8.5px mono stage label. Room entries are 7px-radius blocks: name at 12px/600, description at 10px quiet. **You-are-here inverts to solid navy with white text.** The suggested-next takes a **dashed orange border** on `rgba(230,112,30,.05)` with orange text. Filtered-out rooms drop to `opacity:.22` rather than disappearing.

### 5.10 Follow the Object — the peek and the unfold
`src/lib/follow/follow.css` · on Deal Workspace, Signal Console, Dashboard

Any sacred-noun name anywhere carries `border-bottom: 1px dotted rgba(230,112,30,.55)` and turns orange on hover. Clicking opens a **340px fixed card anchored where you clicked** — 12px radius, `box-shadow: 0 20px 55px rgba(10,28,64,.18)`, popping in over 160ms — carrying exactly the five exposures canon §2 requires: where it stands · what's pulling · **the one move (the only orange)** · what changes downstream · what's remembered.

"See the whole thread" **unfolds the same card in place** to 560px over 300ms, revealing the object's six-stop life through the rooms, each stop with an inline GO. Rows are `96px` mono label + content, hairline-separated. **The thread never takes the room** — no veil, no page transition; the room stays live behind it. Esc folds, then closes.

---

## 6. THE PRODUCT'S OWN WORDS

### The voice rules

**§11 — write what you mean, not a word that points at it.**
> "Stop reaching for a single noun to do the work of a sentence. When the urge to write 'the wedge' or 'the verdict' or 'the move' hits, write the sentence out instead."

- Manifesto fragments are out. *"Sentences in series with no subject continuity read like a copywriter trying too hard."*
- **The test:** *"Read it out loud. If you can't imagine yourself saying it to the operator across the table, it isn't plain enough yet."*

**§13 — spoon-fed language.** §11 kills the abstraction; §13 sets the reading level.
> "A person who has never seen this app, and has never worked in software sales, should understand every word, on every surface, the instant their eyes land on it — with no other context on the screen."

*"Elementary, not dumbed-down. The severe, high-consequence feeling of the app comes from what the sentences say, not from hard words. Sharp thinking in plain words beats clever thinking in insider words."*

**Never narrate the machine to the user.** Banned outright: *"the state the verdict is reading," "what the system is computing," "the inputs the engine reads."* The user hears what is true, stated directly — never how the system arrived at it.

**One voice, eight registers** (`src/lib/voice/family-temperatures.ts`), differing only in temperature and a max-sentence-word cap:
| Family | Cap | Register |
|---|---|---|
| Live Instrument | **18** | *"Tense and immediate; the shortest sentences in the product, because the operator is mid-action."* |
| Threshold | 22 | *"Invitational and confidence-building; short, warm-but-not-friendly."* |
| Diagnosis Table | 24 | *"Severe and corrective; names the decay plainly and the smallest move that changes the trajectory."* |
| Trust Annex | 24 | *"Plainspoken utility; no drama, nothing that performs."* |
| Command Chamber | 26 | *"Calm, ranked, precise — a sharp operator telling you what they see and the one move they would make."* |
| Decision Bench | 26 | *"Deliberate and exacting."* |
| System Ledger | 30 | *"Settled and synthesizing; reconciles evidence into one state and what would move it next."* |
| Visitor | 30 | The brand register — can name the category and the enemy, still zero deck-speak. |

**The state vocabulary** (canonical, pre-blessed, use these not their softer cousins):
`Ready now · Workable · Thin · Operating · Needs intervention · At risk · Handoff-ready · Partial · Compounding · Still weak`

### The banned-vocabulary list (executable, `src/lib/voice/banned-vocabulary.ts`)

**Corporate vocab + inflections:** leverage · unlock · revolutionize · supercharge · magic/magical · transform/transformative · game-changing · paradigm shift · synergy/synergistic · best-in-class · world-class · cutting-edge · next-generation/next-gen · robust · seamless/seamlessly · holistic · innovative · empower/empowerment · ecosystem · streamline

**Product jargon** (things Antaeus itself invented and then killed): **wedge · verdict · the move · decision-grade · operating truth · command intelligence · field read · loom read · ingot read · recovery cue · output ingot · required correction · operator move · main risk · replacement pressure**

**Business metaphors:** spine · **earned / earns / earn** (hard-banned app-wide)

**Marketing vocab:** ai-powered · world-class · supercharge · trusted by · best-in-class · next-generation · revolutionary · game-changing · seamless · powerful · robust

**Sycophancy:** great work · you're doing amazing · way to go · awesome · crushing it · you're on fire

**Completion labels** (banned as standalone strings — a bare completion label cannot pair itself with a forward loop): done · all done · complete · completed · finished · all caught up · all set

**Hedge constructions:** "it's worth noting that" · "it could be argued that" · "there may be reasons to consider" · "some observers might suggest" · "while the evidence is mixed, one interpretation is" · "one could argue"

**Also killed by later founder direction:** *proof* / *proofs* (say "the pilot / the pilot's results / the evidence") · *cast* ("cast a proof") · *sanity-check* · *vitals* (hospital register) · *dimension* naked · *gap* naked · *evidence* naked · *live work* · *workbench* / *the bench* / *the gate* / *the loom* / *the rack* · *rep* (say **seller**) · "X-shaped"

The list is enforced in CI by a Vitest suite that walks all of `src/`, validates every string declared through `t()`, and enforces a hard ceiling of 10 active waivers.

### Fifteen verbatim lines of shipped UI / settled-mockup copy

*(account names and dollar figures redacted)*

1. `"You're Building."` — Dashboard verdict masthead
2. `"The most valuable move on your board · #1 of 14"` — the ranked-board kicker
3. `"not now — show me the next"` — the skip that cycles the board
4. `"Readiness · could a hire run this yet?"` — the Readiness drawer kicker
5. `"It all lived in your head — nothing to inherit."` — the first readiness rung
6. `"A hire could run it with you there to answer questions."` — the Inheritable rung
7. `"The motion survives you taking two weeks off."` — the Hire-ready rung
8. `"The climb — where the workspace has been, and where it goes next"`
9. `"At the rate you're working, you finish the year around [$X] — about [$Y] short."` — Quota pace verdict
10. `"Not because the number is wrong. Because you're doing 7 outreach a day and the number needs 12. Close that gap and the year adds up."`
11. `"This asks real work of you. Here's the deal."` — the Onboarding doorway headline
12. `"Do it once, and the system reads your motion back to you every morning — which deal is slipping, which move clears the most weight."`
13. `"Just the names. Don't research them, don't fill in fields. Paste who's on your mind and the system goes and finds the rest."` — Onboarding accounts step
14. `"The part no software can do for you — and the part that pays you back every morning."` — the deal-judgment step
15. `"Everything you build is saved — not trapped on this laptop."` — Settings hero
16. `"Don't fill the checklist by hand — most of it is already answered by papers you hold."` — Getting to Signed coverage map
17. `"A small group is right for this kind of sale, not a crowd — the desk sizes it to your deal."` — Pilot Desk circle
18. `"Are enough of the right people actually using the product day-to-day to give it a fair shot?"` — the adoption meter
19. `"A short write-up your champion can take to their boss and defend on their own — without you in the room."` — the pilot write-up
20. `"Nothing is pulling harder than the rest right now. Work the standing row below."` — the Dashboard's empty-move state
21. `"Couldn't reach the cloud just now — your work still saves on this device."` — an honest, recoverable error
22. `"The motion, written down — what a sharp operator would leave for their replacement."` — Founding GTM
23. `"Where people are gathering — found for you."` — Outdoors Events
24. `"Whatever they say, your next move."` — Discovery Studio masthead
25. `"the workspace is running — this is just the morning door into it."` — Welcome's operating line (the anti-"all done")

### The loop-transformation rule

The app never shows "all done." Every completion transforms into the next meaningful open loop. *"Deal won"* never becomes *"Congratulations"* — it becomes *"Handoff package 0% complete. Your first hire will need: account context, contact relationships, discovery notes, competitive intelligence."*

---

## 7. THE STRONGEST INGREDIENTS

Ranked by how much raw material they give you.

**1. The Grounded-A and its lifted twin.** Three paths, a stroke ladder, a mark that drops its crossbar at 16px because *"the ground line is the signature, not the bar."* And the grounded↔lifted device — a logo that doubles as a state machine, usable on any object: healthy sits on the line, at-risk floats above it, hollowed and tilted 6°. Endlessly reusable, and nobody else has it.

**2. The ground line as navigation.** A near-invisible 2.5px stroke at the foot of every screen, with a small raised tab breaking it, that raises a full-width map *from beneath the room* over 450ms. The idea that the brand mark's geometry becomes the app's one door is the single best structural move in the repo.

**3. The verdict masthead.** A five-segment gate ladder — forest (passed) / amber (here) / **dashed blue** (next) / quiet (future) — over a 74px serif state name with the state word colored amber. It compresses "where you are in a five-stage maturation" into one glance, and the dashed-bar-for-next trick is reusable anywhere a future state needs to read as *not yet real*.

**4. The climb ladder.** Time rendered as a vertical line where **the part you've climbed is drawn in forest** and the part ahead is hollow, with a stamp per rung (`Left behind · 3 weeks ago` / `You are here` / `The summit`). It makes a maturity state feel like an integral over time rather than a snapshot — which is exactly the two-greens doctrine made visible.

**5. The orange-ruled block with the asymmetric radius.** `border-left: 3px solid orange; border-radius: 0 14px 14px 0;` on white over the cool field, with a tiny orange mono kicker and a 25px serif title. This is the product's "here is the one move" object and it works at every scale. Same construction in blue = the system explaining itself; in red = corrective; in amber = caution.

**6. The face-off.** `1fr 54px 1fr` with a red-top-ruled panel, a vertically-set `the gap` label over a serif `vs`, and a forest-top-ruled panel. A two-sided opposition rendered as a composition rather than a table. Immediately adaptable to any "their position vs yours" moment.

**7. The open-book spread.** Zero gap, one hairline seam, a left contents plate with status dots and a segment bar, a right page set in **reading serif at 17px/1.66** with left-ruled margin notes that change color by the *kind* of thing they're telling you (red corrective / blue neutral / forest affirming). An interface that stops being an interface and becomes a document.

**8. The fused strands.** Two parallel columns welded by one quiet centre hairline, each row a serif numeral in a fixed-width column against a plain sans description, each strand closing in a serif judgment question. The de-carded answer to "compare plan vs reality" — no panels, no boxes, structure entirely from alignment.

**9. The Live Edge's three-beat switch.** STILL (grayscale + stop, in place) → FOLD → a visibly dead hairline, with the wake as the exact mirror using staggered per-line `transition-delay`. Almost nothing in software bothers to make *off* legible as a state rather than an absence. Steal this wholesale.

**10. The evidence margin.** A persistent 312px right column, blue mono header `Why we ask`, one plain paragraph, and — pinned to the bottom with `margin-top:auto` above a hairline — a real citable source link. A recessive column that turns every ask in a flow into something defensible.

**11. The Pulse timeline + Ribbon.** The page as a vertical time axis: `NOW` / `THIS WEEK` / **`GONE QUIET`** zones, each opened by a ribbon (mono label + a rule that *fades out to the right* via `linear-gradient(90deg, hair, transparent)` + a count suffix), older zones receding progressively through four depth steps (`opacity: 1 → .86 → .72 → .6`, gaps tightening), closed by a horizon strip of serif counts. Silence gets its own zone — *"absence is itself a signal."*

**12. The graph-paper field with the vignette.** Two faint radial washes (blue top-left, orange top-right) over a 34px navy grid at 8% alpha, with a `radial-gradient(ellipse at center, transparent 30%, field 100%)` overlay that dissolves the grid at the edges. It's the cheapest way to make a bright field read as *drafted* rather than *empty*.

Honorable mentions: the **rationed tick** on icons (one accent stroke at the active point, the whole color system encoded in a single sub-path); the **Offset** device (tag outside the card, action straddling the bottom border); the **coverage bar** (`flex:120 / flex:30` forest-vs-amber with the reading spelled out beneath); the **pushback chip → rising answer panel** in Discovery; the **earth stratum + root** on the auth gate.

---

## 8. CONTRADICTIONS AND CAUTIONS

**1. The token file and the shipped rooms disagree — and the shipped rooms are *not* using the tokens they appear to.**
This is the most important thing to know. The `v4` room CSS (the settled 2026-07 designs wired to production) references token names that **do not exist** in `tokens.css`:
- `--ds-ink-2`, `--ds-ink-3`, `--ds-ink-4` → tokens define `--ds-ink-soft/faint/quiet`
- `--ds-hair-2` → tokens define `--ds-hair-strong`
- `--ds-serif`, `--ds-sans`, `--ds-mono` → tokens define `--ds-font-serif/sans/mono`

So those all fall through to their hard-coded fallbacks. Meanwhile `--ds-field`, `--ds-amber`, `--ds-red`, `--ds-forest` **do** exist, so the token values win there over the mockup fallbacks. The result is a hybrid nobody designed: token field/amber/red/forest, mockup inks and hairlines, and no design-system typography at all.

**2. The sans typeface is, in practice, neither.** Canon and `tokens.css` say **Public Sans**. Every settled 2026-07 mockup uses **Inter**. The shipped room HTML loads **Public Sans only**, while the v4 CSS asks for `var(--ds-sans, "Inter", system-ui, sans-serif)` — and since `--ds-sans` is undefined and Inter isn't loaded, **the shipped v4 rooms actually render in `system-ui`.** Pick one deliberately. (The July-4 mockup lineage and the auth/onboarding surfaces *do* use Public Sans; the July-6/7 lineage uses Inter.)

**3. `--ds-forest` is declared twice in `tokens.css`.** `#1b5e3f` (semantic block) then `#1b5138` (reserved-accent block). The second wins. All mockups use `#1b5e3f`. Canon §3 also quotes `#1b5138` in one place and `#1b5e3f` in another.

**4. Amber and red are materially different between doctrine and design.** Tokens: amber `#f59e0b`, red `#ef4444` — bright, saturated, generic-alert colors. Settled mockups: amber `#b5790f` (a deep ochre), red `#c0392b` (a brick). The mockup values are far more on-brand for "severe, unsentimental." The July-4 lineage splits the difference (`#c98a1a` / `#d1483a`).

**5. Three mockup palettes coexist.** (a) *July 4*: field `#F6F8FC`, ink `#0e1b33`, **solid hex hairlines** `#e6eaf2/#d5dce8/#c2ccdd`, Public Sans. (b) *July 6–7*: field `#eef1f7`, ink `#0a1c40`, **rgba hairlines**, Inter. (c) *Auth/onboarding/marketing*: field `#f6f8fc`, Public Sans, graph paper + washes. They are close enough to look like one system and different enough to be a real fork.

**6. Green-as-action is an open, unresolved founder question.** Canon Part II §3 flags it explicitly: during the 2026-07-02 Briefing redesign the founder directed action links to be **green** with a gentle pulse, which would repurpose green from "health" toward "go/act" and **retire orange as the one move**. It shipped only in the Briefing (`--go: #1a8f4e`) and *"do not change the canon color roles for it until the founder decides."* If you build on orange-as-the-one-move, you're on the canon side of an unsettled call.

**7. The graph-paper undertexture and radial washes are doctrine but are essentially absent from the shipped operating rooms.** They live in the auth gate, the onboarding flow, marketing surfaces and historical wireframes. Of 22 shipped rooms, exactly one (ICP Studio v4) carries a wash; none carry the grid. If you want the drafted-field material, you're reviving it, not continuing it.

**8. The travel/weather icon set breaks the icon construction rule.** Spec 09 mandates `stroke-linecap="butt"` and `stroke-linejoin="miter"` at 2px as *the* proprietary tell. The 2026-07-07 Outdoors Events get-there icons ship `stroke-linecap:round; stroke-linejoin:round` at 1.7px — i.e. the generic line-icon look the spec exists to reject.

**9. Retired directions — do not revive.**
- **Dark mode / dark surfaces.** Originally System Ledger rooms were dark navy; the founder retired the exception on 2026-04-27 (*"i mainly dont want you to be using dark backgrounds"*), and 2026-06-16 added *"always lean bright."* The last dark surface (a navy schedule float) flipped in DS 1.9.0. **There is no dark theme.** The only permitted dark objects are the toast, the tooltip bubble, and a you-are-here inversion in the Ground map.
- **The left nav rail.** Dead. *"A rail is a hallway with the doors painted on it."*
- **The Ctrl+K command palette** as the jump mechanism — superseded by the Ground (2026-07-08). The palette registry's content migrates into the Ground's map.
- **The Wayfinder bar's three cells** — built, spec'd, and then partially superseded: the settled 2026-07 rooms each carry their own thin top line (room wordmark + a right-aligned mono state), not the spec'd Trail/Here/Pulling bar. Both exist in the codebase.
- **The Brief / Spotlight / Queue mode switcher** on the Dashboard — retired 2026-07-08, folded into the cockpit.
- **The hybrid "dark hero over bright work area"** Decision Bench variant — retired.
- **The stash floater**, the **birdseye corner float**, the **schedule toast** — all replaced.
- Two rejected mascot directions are archived: a figurative "Giant" (the A wearing a head) and a "Rooted" crest.

**10. Mid-migration reality.** Three generations of CSS coexist per room: legacy (`<room>.css`, the pre-2026-06 build), `ds/` (the June design-system pass), and `v4/` (the settled July designs, now the production default behind `room_<name>_v4_off` kill switches). Four rooms were renamed in canon before their code paths caught up — Sourcing Workbench → **Prospecting Desk**, PoC Framework → **Pilot Desk**, Negotiation → **Getting to Signed**, Advisor Deploy → **Call in a Favor**; the paths were renamed 2026-07-09 with redirect stubs. **Call Planner is retired** (2026-07-06) with its capabilities absorbed into Discovery Studio, but its directory and CSS still exist in `src/`.

**11. Legacy "proof" language survives in code.** Enum keys, column names, an icon named `Proof`, and a `proof` readiness dimension all persist by design (*"code enum keys may stay to avoid a data migration, but no user ever sees the word"*). If you mine identifiers for vocabulary you will resurrect banned words.

**12. The component library is real but under-consumed.** `src/components/` is a complete, tested, token-driven catalog (Card, Gauge, Button, Wayfinder, Pulse, Ribbon, Meter, Drawer, Modal, Table, Stamp, Progress, ReadinessReadout, HandoffStrip, RiskCard…) with a proof sheet at `/design-system/`. But the settled July rooms were built as bespoke room CSS from mockups rather than composed from it. The library is the *stated* material; the room CSS is the *shipped* material. They rhyme; they are not the same.

**13. Density is spec'd across four dimensions** (sentence count · affordance count · default-expanded sections · annotation density) with two states (`show_me_how` / `step_back`) and a DB column, but only two components actually read the signal. Treat it as an intent, not a built behavior.

**14. One deliberate doctrine tension worth knowing.** The charter demands severity and truth-loyalty; the Briefing room ships an animated sun with a rotating conic-gradient corona, drifting clouds, falling rain, and a scrolling market ticker. It's the one place the product lets itself be atmospheric. It was founder-locked, so it's canon — but it sits visibly outside the "unsentimental, no AI magic theater" register everything else holds.

---

### Where to start if you're rebuilding

The irreducible kit: the **bright cool field `#eef1f7`–`#f6f8fc`** with a **34px navy grid at 8%** and two faint corner washes; **navy `#0a1c40` at four opacities** (1 / .66 / .42 / .22); **orange `#e6701e` once per screen and nowhere else**; **blue `#2563eb` for the system explaining itself**; **forest `#1b5e3f` for anything that has held over time** and bright green `#22c55e` for anything true only right now; **DM Serif Display carrying the argument, a plain sans carrying the work, JetBrains Mono letterspaced at .16em receding into labels**; **hairlines instead of boxes**; **a 3px left rule instead of a card**; and **the Grounded-A standing on a line that runs past its feet** — dropping its crossbar when it gets small, and lifting off the line when something is going wrong.


---

ADDENDUM to the Antaeus report — written after viewing all 16 renders. Two parts: (A) the two ingredient recipes as literal paste-ready values, (B) section 5 rewritten from the images. All account names, person names and figures scrubbed.

═══════════════════════════════════════
PART A — THE TWO INGREDIENTS, LITERAL
═══════════════════════════════════════

### A1 · THE GROUNDED-A — exact geometry

48-unit viewBox, three paths, no fill:

```svg
<svg viewBox="0 0 48 48" fill="none"
     stroke="#0A1C40"
     stroke-width="3.6"
     stroke-linecap="butt"
     stroke-linejoin="miter">
  <path d="M14 38L24 10l10 28"/>   <!-- LEGS:     apex (24,10), feet at y=38 -->
  <path d="M18.2 28h11.6"/>        <!-- CROSSBAR: y=28, x 18.2→29.8 -->
  <path d="M2 38h44"/>             <!-- GROUND:   y=38, x 2→46 -->
</svg>
```

THE GROUND OVERHANG, stated exactly: legs occupy x = 14→34 (20 units wide). Ground runs x = 2→46 (44 units). The ground extends **12 units past each foot** — it is **2.2× the width of the letter** — and stops 2 units short of the viewBox each side so it never bleeds. That overhang is the entire mark. It is ground, not an underline.

CROSSBAR: width 11.6, at y=28 — **64% of the way down** the legs' 28-unit rise. Deliberately low so it reads as a gauge/level marking, not a typographic crossbar.

STROKE LADDER (weight steps UP as the mark shrinks, so it holds its blackness):

| Rendered size | stroke-width (on 48 viewBox) | Crossbar |
|---|---|---|
| Display ≥40px | 3.2 | yes |
| 32px | 3.6 | yes |
| 24px | 4.0 | yes |
| 20px (chrome) | 4.4 | yes |
| 16px (favicon) | 6.0 | DROPPED |

```ts
function strokeFor(size: number): number {
  if (size <= 16) return 6;
  if (size <= 20) return 4.4;
  if (size <= 24) return 4;
  if (size <= 32) return 3.6;
  return 3.2;
}
const dropBar = size <= 16;
```
The 16px rule: three strokes don't survive a 16-pixel box. At 16 and below the mark is legs + ground only — "the ground line is the signature, not the bar."

THE LIVING MARK (lifted state) — only the A moves, the ground never does:
```tsx
<g transform={lifted ? "translate(1 -7) rotate(6 24 24)" : undefined}
   opacity={lifted ? 0.42 : 1}
   style="transition: transform .5s cubic-bezier(.2,.7,.2,1), opacity .5s ease">
  <path d="M14 38L24 10l10 28"/>
  <path d="M18.2 28h11.6"/>
</g>
<path d="M2 38h44"/>
```
Exact values: translate(1 −7) · rotate 6° about (24,24) · opacity .42 · 500ms · cubic-bezier(.2,.7,.2,1).

Confirmed in the auth-gate render: at ~118px the lifted A reads as pale, hollow, tilted, floating above a solid forest ground line. You understand it is detached before any label says so.

USAGE (hard): navy or currentColor only — the mark never takes an accent, because orange is the move and the mark is not a move. Never rotates (except lifted), never skews, never gains a container, never sits on a photo. One per surface.

### A2 · THE GRAPH-PAPER FIELD — exact recipe

Confirmed visible and correct at 1440 in the auth-gate render. Paste-ready:

```css
:root{
  --field:  #f6f8fc;
  --ink:    #0a1c40;
  --ink-08: rgba(10,28,64,.08);   /* THE GRID INK */
}
html, body { background: var(--field); }

.stage{
  position: relative; min-height: 100vh; overflow: hidden;
  background-image:
    radial-gradient(circle at 12% 0%, rgba(37,99,235,.05), transparent 32%),  /* blue wash   */
    radial-gradient(circle at 88% 8%, rgba(230,112,30,.04), transparent 30%), /* orange wash */
    linear-gradient(var(--ink-08) 1px, transparent 1px),                      /* horizontals */
    linear-gradient(90deg, var(--ink-08) 1px, transparent 1px);               /* verticals   */
  background-size: auto, auto, 34px 34px, 34px 34px;
  background-position: 0 0, 0 0, center 0, center 0;
}

/* the vignette — dissolves the grid at the edges so it never boxes the page */
.stage::before{
  content:""; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(246,248,252,.82) 100%);
}
.stage > * { position: relative; z-index: 1; }
```

THE NUMBERS:
• Grid pitch **34px** both axes (archive ranges 30–36; 34 is the most-used and is the settled gate's value; historical wireframes used 32).
• Line weight **1px**.
• Line color **rgba(10,28,64,.08)** — the brand navy at 8%. Never grey.
• Grid origin **center 0** on both axes, so the grid is symmetric about the page centreline, not anchored left.
• Wash A (blue #2563eb): circle at **12% 0%**, alpha **.05**, stop **transparent 32%**.
• Wash B (orange #e6701e): circle at **88% 8%**, alpha **.04**, stop **transparent 30%**.
• Vignette: ellipse at center, **transparent 30% → rgba(246,248,252,.82) 100%** — field color at 82% over the outer 70%.

Variants: onboarding runs the washes alone, no grid, at 8% 0% / 94% 2%, same alphas. The one shipped room carrying a wash (ICP Studio) uses `radial-gradient(1000px 440px at 12% -6%, rgba(230,112,30,.10), transparent 58%)`.

CAUTION FROM THE RENDERS: the grid is visible on the auth gate and only there. The washes are faintly visible on onboarding. **All 14 operating-room renders show a completely flat field — no grid, no wash.** This is the single biggest available upgrade to the shipped look, and reviving it is a revival, not a continuation.

═══════════════════════════════════════
PART B — SECTION 5, FROM THE IMAGES
═══════════════════════════════════════

Standing note: unless stated, the field is FLAT — no texture visible at 1440. Room columns are 840–1120px centred in 1440, leaving 150–270px of empty margin each side. The emptiness is load-bearing.

### DASHBOARD — the command + standing cockpit
*1080px, content occupies the top ~730px then simply stops*

LEADS: the serif verdict, without contest. "You're Building." renders at ~74px across ~470px in the upper third with nothing competing. The state word takes deep ochre while the rest stays navy, so the eye lands on the STATE before the sentence. Largest object anywhere in the product.

THE ONE ORANGE: the "Compose the outbound →" button, hard right, level with the move's serif title — a solid orange rounded rect ~245×40px, the only saturated mass on the page. A second much smaller orange is the mono kicker above the move; it reads as a label, not a competing action.

FIELD: flat pale blue-grey. **There is not one white panel on this screen.** White appears only inside the orange button. The entire composition is ink on field.

HAIRLINES: two full-width horizontals divide three bands at ~14% alpha — you perceive the division a beat before you perceive the line. In the standing row, four 1px verticals separate five cells; the first cell has none, so the row starts flush with the column edge rather than being fenced.

SERIF vs SANS: serif appears exactly TWICE — the verdict and the move title. Gate labels, reasoning paragraph, confidence line, all five standing values: sans/mono. The 2-serif discipline is why those two moments carry.

DENSITY: very low. Five informational objects in 730px, 24–32px gaps between bands. The gate ladder spans the full column but is only 4px tall.

STEAL: the gate ladder renders as five short bars ABOVE their labels — forest (passed) / ochre (current) / **dashed blue** (next) / two neutral. The dashed-for-next makes "not yet real" legible without a word.

### DISCOVERY STUDIO — the live cockpit
*1000px, the most spacious surface in the product*

LEADS: the question, DM Serif 31px over two lines, upper-middle, with genuinely nothing around it. Everything above is 11–13px; everything below is a row of soft chips.

THE EMPTY SPACE IS THE DESIGN. Between the response chips (~y475) and the drawer (~y680) sits ~200px of nothing. On a screen a seller glances at WHILE TALKING, that emptiness is what makes the question findable in a quarter-second.

THE ONE ORANGE: no orange button above the fold. Orange appears three times, all small — the framework selector pill (orange outline on orange-tint), the current spine chip (white pill, 2px orange border), the segment code in orange mono. The room deliberately withholds the move until the call ends.

FIELD: flat. The call-state strip and the drawer are the only white — and the drawer's BODY takes the field color, so the drawer reads as a recess, not a raised object.

HAIRLINES: the segment spine is fenced above and below by two thin horizontals, the only structural lines in the upper half. Everything else is separated by space alone.

SERIF vs SANS: one serif object (the question). Call-state vitals in mono 11px ("reading: guarded · 4/7 truths · champion ✓ · signer —"); pushback chips sans 13.5px in soft ink. Hierarchy is literally serif → sans → mono, top to bottom.

DENSITY: low above the drawer, medium inside it. Response chips ~200×38px, 22px radius, pale outlines — they read SOFT, because tapping one is an input, not the move.

DETAIL: spine chips wrap to two rows; essential-but-unhit carry a 5px amber dot inside the pill; done ones go forest-on-forest-tint; the current one is the only chip with a 2px border.

### FOUNDING GTM — the open book
*1120px, a bound spread*

LEADS: the right page's prose. Newsreader 17px/1.66 across ~600px — at that size on this field it genuinely looks like a printed page. The 32px DM Serif part title leads by a hair, but the eye settles into the body, which is the point.

THE BINDING: grid-template-columns 290px 1fr, **gap: 0**. Because the gap is zero, one 1px vertical hairline is the only thing dividing plate from page, and it runs unbroken from the top of the plate past the last paragraph. That single unbroken vertical is what makes it read as a SPREAD rather than a sidebar.

THE ONE ORANGE: "Share read-only with a hire →", bottom right. The only other orange is the open contents row — a barely-there 5% orange tint with its title orange semibold. A selection cue, not an action.

FIELD: flat, and **the prose sits directly on the field, not on a white sheet.** White appears only inside the "one thing to notice" note. That is unusual and it is why the room reads as a document rather than a card.

HAIRLINES: one vertical (the binding), seven in the contents list, one under the topbar, one above the page nav. The evidence block hangs off a 2px vertical used as a quotation rule.

SERIF vs SANS: serif for plate title, part title, and the whole reading body. Sans for the contents list, the notice, the nav. **The notice deliberately switches OUT of reading serif into sans** — the system annotating the document in a different voice, and you can see the register change.

DENSITY: low; ~60% of the right pane is empty below the content.

DETAILS: the readiness bar is seven 6px blocks 2px apart — forest/forest/ochre/forest/ochre/forest/pale. Contents dots 8px. The notice is white + hairline + **3px red left rule**, square left, rounded right (red corrective / blue neutral / forest affirming).

### READINESS SCORE — the climb
*540px right drawer over a scrimmed page*

LEADS: the climb ladder, more than the verdict. "Building" (DM Serif 36px) is the nominal hero but the five-rung ladder owns the middle 400px — because one rung is tinted and the rest are not.

THE LADDER, precisely: a faint 2px vertical hairline behind five nodes. The PASSED rung has a solid forest 14px node AND its connector above is redrawn in forest — so the climbed part of the line is literally green. The CURRENT rung sits in a very pale amber wash with border-radius 0 12px 12px 0, node an amber ring with an amber core. The three FUTURE rungs are hollow grey rings, and their text steps down the ink ladder (.66 → .42 → .22) so they fade with distance. Each rung carries a 9px mono stamp: LEFT BEHIND · 3 WEEKS AGO / YOU ARE HERE / NEXT / LATER / THE SUMMIT.

THE ONE ORANGE: **there isn't one. This surface has zero orange.** Its accents are amber (where you are now) and forest (what you've banked). Correct and instructive — readiness is a STATE room, not a MOVE room, so the move color is absent by design.

FIELD: the drawer is white; the scrimmed page behind is flat muted blue-grey at ~28% navy. No texture either side.

HAIRLINES: one under the hero, one above the footer, plus the ladder's own faint vertical. The bottom chips are separated by nothing but space.

SERIF vs SANS: DM Serif for the verdict; **Newsreader** for the one-sentence read beneath it; DM Serif again at 17px for the "To reach Inheritable" head. Three serif moments in a 540px column is near the ceiling — it works because they're at three different sizes.

DENSITY: medium. The bottom chips ("Targeting — solid", "Discovery — thin") are small outlined pills, forest or amber, visibly the least important thing on screen. The scoreboard successfully demoted.

### QUOTA WORKBACK — pace + fused strands
*900px*

LEADS: **the red serif numerals.** The verdict runs two lines of DM Serif 34px with the two money figures set in the same serif but in brick red. A serif numeral in red on this cool field is the loudest object in the entire product.

THE ONE ORANGE: the "BACK ON PACE" band — white panel with a **3px orange left rule** and a small orange mono label in its left gutter. Notably the one move here is a RULE, not a button; the buttons sit below the fold.

FIELD: flat. Two white objects only — the pace track and the back-on-pace band.

THE TRACK: 44px-tall white bar, hairline, 10px radius. The projection fills from the left in a very pale pink wash closed by a **2px red vertical edge**; the remainder stays white; a 2px navy tick marks the target at the right end. The pale-pink-into-white split reads instantly as "this is how far you get."

THE STRANDS + THE ONE RESTRAINT THAT MAKES THEM WORK: two columns 1fr 1fr joined by a single faint vertical hairline, each padded 26px away from it. Every row carries a top hairline — **and those hairlines STOP at the divider. They do not cross.** That is why the columns read as two parallel readings rather than one table with a line down the middle. This is the best single detail to steal from the whole set.

SERIF vs SANS: numerals in DM Serif ~21px in a fixed 66px gutter; descriptions sans 12.5px beside them. Each strand closes on a DM Serif question at 18px ("Is the plan real?" / "Do you have the pipeline?") answered in sans. The room's rhythm is SERIF ASKS, SANS ANSWERS.

DENSITY: medium — densest of the System Ledger rooms, but every row is a numeral, a phrase and a pill.

DETAILS: right-column numerals red when behind, navy when on track. Status pills tiny mono uppercase on soft tints — "5 SHORT"/"BEHIND"/"LIGHT" in red-soft, "ON TRACK" in forest-soft.

### GETTING TO SIGNED — the face-off + positions ledger
*1000px, densest settled room*

LEADS: the two-panel face-off. Equal-height white panels each with a **3px TOP border** — red left, forest right — separated by a narrow 54px column carrying a vertical red mono "THE GAP" (writing-mode vertical-rl, rotate 180) above a small serif "vs". The opposition reads in under a second without reading a word.

THE ONE ORANGE: "Send the counter-position →", solid orange with a soft orange under-glow, alone under the face-off. (A SECOND orange button appears inside the expanded ledger row — a visible one-move violation; see cautions.)

FIELD: flat. Most white of any settled surface — two face-off panels, one expanded row, one sunken coverage block.

HAIRLINES: the ledger is four columns of hairline-separated rows with mono uppercase heads. **No verticals at all** — the columns are held by alignment alone.

THE LIFT: the open row genuinely detaches — becomes a white rounded panel with a soft drop shadow visibly floating above the flat rows below, its bottom border going transparent. The Offset device at row scale, and the best interaction in the render set.

SERIF vs SANS: almost no serif — only the tiny "vs". Face-off panel titles are sans semibold 15px. This is a WORKING room, so the authored voice steps back.

DENSITY: high but structured — committee chips, papers strip, face-off, option chips, button row, eight ledger rows. Nothing boxed except the two panels and the one open row.

THE DEEP MOMENT (the coverage map): a 24px bar on a field-colored sunken block, split flex:120 forest against flex:30 ochre, butted with NO gap and NO internal radius, each half labelled in white mono inside itself, with one plain sentence beneath spelling out which paper covers how many. A quantity rendered as a MEASURED OBJECT rather than a chart.

### PILOT DESK — the guided pilot
*920px, three materials stacked deliberately*

LEADS: the orange node on the journey. Everything above is calm; the current step's node is a filled orange circle with a 0 0 0 5px orange-soft halo that reads like a lit indicator.

THE THREE MATERIALS, in order — the room's real lesson:
1. A BORDERED WHITE BAND, 12px radius (the circle of people) — rounded face chips each with a forest/amber/grey dot.
2. An UNBOXED AMBER-RULED BLOCK sitting directly on the field — no border, no background, just a 3px amber left rule and 17px padding. The material change is immediately visible and makes the ask feel like an annotation rather than a module.
3. Another bordered white band (the share kit), then
4. THE JOURNEY: a faint vertical with filled forest ✓ nodes for done steps (titles greyed), the orange haloed node for now, and the current panel hanging off a 3px orange left rule.

THE ONE ORANGE: the current node + its left rule. No orange button above the fold.

SERIF vs SANS: one serif per screen — the current movement's heading at 24px DM Serif.

DENSITY: high, the highest of the settled rooms. But every dense part is rows and rules.

DETAILS: gated checklist steps render at 45% opacity with DASHED checkboxes and a grey mono lock hint trailing the label; the adoption read is mono micro-labels over ochre/forest values with a 9.5px grey provenance line beneath.

### WELCOME — the flow's landing
*840px, the clearest instance of the orange-ruled block*

LEADS: the 42px DM Serif statement over two lines, then immediately down to the orange-ruled move panel.

THE MOVE BLOCK: a white panel with a **full-height 3px orange left rule**, square left, rounded 14px right. Inside — small orange mono kicker, 25px DM Serif title, sans paragraph with the operative clause bold, orange button. The rule runs the panel's entire height: it is not a top accent, it is a MARKED MARGIN.

THE ONE ORANGE: the button. The rule and kicker share the color but are not actions.

FIELD: flat pale grey. The white move panel is the only raised object and the contrast against the field is ~5% — the panel SETTLES rather than pops.

SERIF vs SANS: DM Serif for statement and move title; **Newsreader for the sub-paragraph** — and the difference is visible, Newsreader noticeably lighter and more open. The operating line at the bottom sets its three numerals in DM Serif INLINE inside a sans sentence. Small, lovely move.

DENSITY: low. Six objects on the page.

### ONBOARDING — the seeding flow with the evidence margin
*full-height two-column frame, 1fr 312px*

LEADS: the headline at ~3rem DM Serif with −.02em tracking — the most typographically confident moment after the Dashboard verdict.

THE EVIDENCE MARGIN: a full-height WHITE column, 312px, separated by a single 1px vertical hairline running the entire viewport height. Blue mono "WHY WE ASK" at .62rem/.2em. Body one plain paragraph at .98rem in NEAR-FULL-STRENGTH ink — notably not faded, because it's meant to be read. A hairline near the bottom (pushed there by margin-top:auto) reserves the slot for the citable source link.

FIELD: **one of only two surfaces where texture is visible.** The two radial washes are faintly perceptible in the upper corners — cool top-left, barely-warm top-right. No grid here; washes only.

THE ONE ORANGE: the "Start →" button bottom-left, plus the single orange pip in the seven-pip step rail top-right, plus the orange mono kicker. Three small objects, all the same idea.

SERIF vs SANS: wordmark (ANTAEUS, DM Serif letterspaced .16em) and headline serif; body Public Sans — genuinely loaded here, so it reads slightly more neutral/geometric than the Inter-based rooms.

THE UNBOXED RULE VARIANT: the closing paragraph hangs off a 3px orange left rule with NO panel at all, rule directly on the field. Compare Welcome's panelled version — both ship, and the unboxed one reads as the operator's own margin note.

DENSITY: very low; ~60% of the working area empty.

### AUTH GATE — the Earth (the graph paper, live)

LEADS: "Antaeus is strongest on the ground." — centred DM Serif over two lines at clamp(2.2rem,4.6vw,3.9rem).

FIELD: **the graph paper is clearly present and clearly subordinate.** At 1440 you read a regular square grid ~42 columns across, pale navy, strongest through the upper-centre and dissolving toward every edge under the vignette. It reads as DRAFTING PAPER, not as a pattern. The two washes are the faintest cool and warm bloom in the top corners. This is the reference implementation of the field; nothing else shipped looks like this.

THE MARK, LIFTED: ~118px, pale grey, hollowed, slightly tilted, floating above a solid forest ground line, with a layered earth stratum (pale forest band + horizontal strata lines) filling the bottom of the page.

THE ONE ORANGE: the "Enter" button beside the code input — the only saturated object against an otherwise entirely navy/forest/grey composition.

DETAILS: six step pips in pale forest under the input; the kicker "ANTAEUS · PRIVATE BUILD" centred over the CODE BOX specifically, not over the input+button row.

### THE LIVE EDGE — the left wall
*216px viewport-fixed rail, on 20 rooms*

WHAT IT LOOKS LIKE: a 216px column on the far left with NO PANEL — one 1px right hairline and a directional wash (linear-gradient(90deg, rgba(10,28,64,.025), transparent 70%)) that is barely perceptible. Stops 26px short of the bottom so it never crosses the ground line.

Three zones: HEAD — a 7px forest dot breathing on a 3.2s opacity loop beside a 9px mono "THE LIVE EDGE". COUNT — a DM Serif numeral at 1.7rem beside a mono "/ 90 TODAY", a two-line .68rem read, a 3px forest track. WIRE — hairline-separated .71rem lines, each with a 7.5px mono tag (quiet=you, blue=the machine, orange=the buyers) and an 8px mono age. In the render the top line, a buyer moment, carries a **3px orange left rule plus a warm gradient fading right** and is visibly the only colored thing on the rail; machine lines render noticeably lighter. FOOT — two mono uppercase lines.

THE SWITCH (best-authored interaction in the repo): off happens in THREE VISIBLE BEATS — everything goes grayscale(1) opacity .3 IN PLACE while the dot stops breathing, THEN the rail folds translateX(−101%), THEN the 14px hairline left behind is plainly dead. On is the mirror: slides out grey then WAKES, lines re-inking on per-child delays of .05/.14/.23/.32/.41/.5s. In the off state a small white whisper pill FOLLOWS YOUR CURSOR'S HEIGHT anywhere along the hairline.

### THE GROUND — the one jump summon
*all 22 rooms*

AT REST: a 2.5px navy stroke at 40% opacity full-width, 9px off the bottom, inside a 26px hit area. In the Live Edge render it reads as a thin dark line across the foot of the room, easily mistaken for a page border until you notice the tab.

THE GRIP: dead centre, a small white raised tab BREAKING the line — radius 9px 9px 0 0, no bottom border, box-shadow 0 −3px 10px rgba(10,28,64,.07) — holding the Grounded-A beside three 2×8px grip bars. On hover the tab lifts (padding-bottom 4→8px), the stroke thickens to 3.5px at 85%, and the grip bars warm to ORANGE.

ON SUMMON: a full-width panel rises FROM BENEATH the room — max-height 86vh, border-top 2.5px solid navy, box-shadow 0 −18px 50px −18px rgba(10,28,64,.35), translateY(103%)→0 over 450ms on cubic-bezier(.22,.61,.36,1). Inside: mono kicker, 21px serif title, a you-are-here line naming the suggested room in orange, an underlined-only filter input, and a SIX-COLUMN FLOW — one per motion stage, separated by 1px left hairlines, each headed by an 8.5px mono stage label. You-are-here inverts to SOLID NAVY WITH WHITE TEXT; suggested-next takes a DASHED ORANGE border on 5% orange; filtered-out rooms drop to opacity .22 rather than disappearing.

### BRIEFING — the daily surface (the tonal outlier)
*1040px with two full-bleed bands*

LEADS: the "Your work" list — plain sentences at 15px with the subject bold, each preceded by a small rounded mono age badge on a pale ground, each followed by an action link on its own line.

THE ORANGE: **nowhere. Every action on this surface is GREEN (#1a8f4e)** — the links, the Yes button, the "Open" draft pills. A genuinely different color grammar from every other room, and an unresolved founder question.

THE ATMOSPHERE BAND: below the work list the page goes FULL-BLEED into a pale blue sky gradient with an animated sun (glowing yellow ball, rotating conic corona), over which sits "Good afternoon, {name}" in DM Serif, a mono clock, and a large temperature. Beneath it a full-bleed MARKET TICKER running a sentence off the right edge with a small "challenge" chip mid-run. Both bands deliberately break the 1040px column.

DENSITY: medium above, atmospheric below. The one place the product lets itself be warm.

### COLD CALL STUDIO — the game plan
*930px*

LEADS: the numbered step titles and the spoken lines beside them.

THE SAY-LINE (worth stealing): a tiny mono "YOU SAY" tag, a **2px FOREST left rule**, then the line the seller will actually speak at 15px. Forest is exactly right here — this is the prepared, durable thing.

THE BRANCH TABLE: two columns, mono uppercase heads ("IF THEY SAY" red, "YOU SAY — THE ANSWER'S READY" quiet grey), rows separated by hairlines only, **no vertical rules at all.** Buyer's line in red quoted text left; reply in navy right. More readable than a bordered table, and it reads as a SCRIPT, not data.

THE ONE ORANGE: the header's third cell — "YOUR ONE GOAL" — is the only tinted panel on the page, a pale warm orange wash. No orange button above the fold.

DETAIL: trigger phrases pulled from the record are underlined with a pale highlight — a quiet "this came from somewhere" tell.

### SETTINGS — the safe deposit
*900px*

**The purest de-carding in the product: ZERO panels.** Every control is a hairline-separated row — bold sans title + quiet description left, control right. Section heads DM Serif ~20px. Hero DM Serif over two lines preceded by a 7px forest dot and a forest mono kicker.

THE ONE ORANGE: **nowhere.** The primary action ("Download my workspace") is BLUE; the destructive action is a red-outlined white button behind a type-to-confirm input. The Trust Annex discipline made visible: this room has no MOVE, so it gets no move color.

DETAIL: the "Advanced — this device's offline copy" disclosure is a tiny grey mono line with a ▸, deliberately the least prominent thing on the page.

### OUTDOORS EVENTS — proximity + the get-there rail
*940px*

LEADS: the 26px DM Serif console headline and the one orange button beside it.

THE PROXIMITY SPINE: a 2px vertical rule down the far left running the full list — **orange at the top, blue in the middle, grey at the bottom** — with a small node at each ring boundary and a mono ring label in the ring's own color. Relevance rendered as literal distance. Subtle in the render but it works: you read "closest in" before you read the label.

ROW ANATOMY: mono date over city in a 64px gutter · event name 15px semibold · meta line with a blue source link · a why line · then right-aligned the weather glance (small line icon + temps in mono, sun icon ochre, cloud grey), four get-there icons in a quiet row, a mark pill (forest-outlined when Attending), a tiny ✕.

THE ICON INCONSISTENCY IS VISIBLE: the travel icons are lighter and rounder than the core set (1.7px, round caps/joins vs the spec's 2px butt/miter). Side by side with a core glyph they read as a different hand.

═══════════════════════════════════════
THREE CROSS-CUTTING READS FROM THE IMAGES
═══════════════════════════════════════

1. **The orange budget is smaller than the doctrine implies.** Across 16 surfaces, five have NO orange at all (Readiness, Settings, Briefing, and effectively Discovery and Cold Call). Where orange does appear it is one object, usually one button, occasionally only a 3px rule. The product is far quieter than "orange is the accent" suggests.

2. **White is rare and deliberate.** Several surfaces (Dashboard, Founding GTM's page body) have no white panel at all — ink sits directly on the field. Where white appears it is 4–5% brighter than the field, so panels settle rather than pop. This restraint is most of why the surfaces read as composed rather than assembled.

3. **Serif count is the tell.** Every surface holds to 1–3 serif moments at clearly different sizes, and the sans/mono do all remaining work. The rooms that feel most authored (Dashboard, Quota, Founding GTM) are the ones where a serif moment is doing a specific job — declaring a state, asking a question, titling a document — not decorating a header.