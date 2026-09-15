# shapshyftrs: landing page, built from the real brands

Version 2. Replaces the first brief completely. Read section 1 before anything else; it is the reason this document exists.

## 0. How to use this brief

Work the phases in section 14, in order. Commit at the end of each. Where the brief is silent, decide, write the decision in `ASSUMPTIONS.md`, and continue. Where the brief and your instincts disagree, the brief wins. Where section 2 and any other section disagree, section 2 wins.

One exception to "don't ask": if you reach a point where following this brief would require inventing something about a real product — a feature, a claim, a material, a spec — stop and log it as a gap instead. Inventing is the one failure this version exists to prevent.

## 1. What this is, and what went wrong the first time

shapshyftrs sells one thing: a clickable mockup of your idea, ${PRICE}, delivered in ${TURNAROUND}. This is its landing page. The page has to do one job — make a stranger believe we can build the thing in their head — and it does that job by showing work.

The work we show is our own. Five real products, built by us:

- **PUFF JUNCTION** — a physical accessory brand. Real CAD, real renders, real brand guide.
- **DARKEST SHADES** — an eyewear brand. Real emblem vectors, real guidelines, real product renders.
- **DIGS** — an apparel brand. Real tech packs, real garment photography, real style guide.
- **AESDR** — a software product with a shipped interface.
- **Antaeus GTM OS** — a software product with a shipped interface and a locked design system.

**The first version of this page failed, and it failed for a specific reason.** The first brief said the source repos were "reference, not material," forbade using any asset out of them, and required that everything on the page be drawn from scratch in SVG and CSS. What that produced was thirteen careful cartoons: a grinder that was a stack of rounded rectangles, a pair of sunglasses that was two ellipses, an interface that had the right words and none of the real surface. Meanwhile there were 4-megabyte studio renders, twelve CAD STEP files, a 15MB brand guideline PDF and 672 real asset files sitting in those folders, unopened.

This version inverts that rule. **The real assets are the authority.** You will open them, study them, measure them, and take them apart. What you build will be made of what you find.

### 1.1 The doctrine

This is the governing instruction. Everything else in this brief serves it.

> Use the real renders, photography, CAD views, product screens, interfaces, and other source materials as the visual and brand authority for the work.
>
> The final webpage should not simply reuse those assets as-is. Instead, recreate and reinterpret their branding, components, materials, forms, and visual language specifically for this mockup-builder website.
>
> Everything created must remain completely faithful to the source brands and products. Preserve what each original asset is actually communicating: its identity, function, value proposition, product characteristics, and visual intent. Do not invent features, capabilities, product details, or brand language that are not supported by the source material.
>
> At the same time, the webpage itself should feel like an entirely new creation built for shock, awe, surprise, and delight.
>
> Create new environments, scenes, compositions, interface moments, product snippets, and visual experiences from scratch for this site. These should take their cues directly from PUFF JUNCTION, DARKEST SHADES, DIGS, AESDR and the Antaeus app, while remaining unmistakably connected to each brand's existing identity.
>
> Think of the process this way: imagine dismantling Disney World and retaining all of its proprietary materials, architectural language, visual systems, textures, signage, objects and recognizable design DNA. You then use those same authentic materials to build an entirely different place — a small, highly concentrated teaser park whose purpose is not to recreate Disney World, but to advertise the capabilities of Disney's parent company as a builder of immersive physical theme-park mockups for other companies.
>
> That is the relationship this webpage has to the source brands.
>
> Do not merely place existing product assets into a new layout. Disassemble their visual worlds, understand the underlying materials and logic, and use those same authentic ingredients to construct something entirely new for this specific website.
>
> The result should feel simultaneously: completely new; unmistakably derived from the real source brands; faithful to the actual products and their value propositions; purpose-built for this mockup-builder experience; and visually surprising enough that the user encounters familiar brand material in forms they have never seen before.
>
> The source assets establish the truth. The webpage transforms that truth into a new experience.

### 1.2 What that means operationally

The doctrine has two halves that pull against each other, and both are real.

**Authentic material.** The gold in the DARKEST SHADES emblem is a seven-stop gradient with specific hex values. The PUFF JUNCTION grinder has a knurl with a real pitch and a cap with a real chamfer. The DIGS thermal has a waffle with a real cell size on a real fabric weight. Antaeus has a ground line under a mark with exact path data. Those are the bricks. You use the actual bricks.

**New construction.** Nobody has ever seen a wall of that gold. Nobody has seen that knurl at 400% running off the edge of a frame. Nobody has seen the Antaeus ground line as the horizon of a room. The compositions are new, and they are built for this page, and they should be startling.

The failure mode on the authentic side is a cartoon: something that looks like the product from memory. The failure mode on the new side is a catalog: the real assets laid out in a grid like a portfolio. This page is neither.

## 2. Hard rules

These override everything else in this brief and everything you would normally do.

1. **Open the assets.** Before you build anything for a source, you have completed its study (section 5) — the renders looked at, the CAD inspected, the brand PDFs extracted, the interface run or read. A frame built for a source whose study is not written is not acceptable work, however good it looks.
2. **The material law.** Source assets may be dismantled into materials and reused: a mark's vector paths, a gradient's stops, a pattern's geometry, a texture's grain, a lens's tint curve, a silhouette taken off a CAD view, a real line of copy. Source assets may **never** appear as a photograph of a product sitting in a layout. The test, per frame: *is this a picture of the thing, or is this built out of the thing?* If it reads as a product shot placed on the page, it fails, no matter how good the shot is. Section 4.3 sets the mechanics.
3. **Fidelity is measured, not remembered.** Every color is a hex sampled or quoted from a source file. Every proportion is measured off a render or a CAD view or a stated spec. Every material has a note in `SOURCES.md` saying which file it came from and what was measured. If you cannot cite it, you invented it, and inventing is rule 4.
4. **Never invent about a real product.** No feature, capability, spec, material, dimension, claim, tagline, or brand story that the source material does not support. Where the source is silent and a composition needs something, either cut the something or mark it in `ASSUMPTIONS.md` as invented and keep it visually neutral (an unlabeled surface, not a fake spec line). Product copy is verbatim from the source or it does not appear.
5. **New compositions only.** No frame reproduces a source layout, a source render's camera, or a source screen as it ships. Every frame is a scene that does not exist anywhere else. If a frame could be mistaken for a crop of an existing asset, recompose it.
6. **No social proof.** No testimonials, client logos, "trusted by", counters, badges, awards, press mentions. None exist and none may be implied. The five brands are shown as our work, not as endorsements.
7. **No Apple anything.** "Keynote" describes a style of composition, nothing more. No Apple typefaces, no device silhouettes with Apple cues, no Apple product names, no copy echoing Apple lines. Device frames, if any, are plain rounded rectangles with no brand cues.
8. **Real people stay out.** Several source folders are named after the contractors who made the work. Cite every asset by filename only. Never write a contractor's name in a file, a comment, a commit message or a caption. No faces, no names, no personal detail from any source, anywhere.
9. **Page copy is verbatim from section 8.** Do not rewrite it. If a line does not fit, cut words from the end; never paraphrase, never add. Log every cut in `ASSUMPTIONS.md`.
10. **Avoid the generic tells.** Inside the page chrome — not inside frames, which follow their source's real tokens:
    - no cream ground with a serif display and a terracotta accent
    - no tinted near-black standing in for black; the stage is `#000000`
    - no single bright acid or vermilion accent on the black; the chrome has no accent of its own
    - no broadsheet hairlines and newspaper columns
    - no identical rounded cards with the same grey shadow; no gradient washes as decoration
    - no tracked-out ALL-CAPS eyebrow labels above headings
    - no meta strings joined with middle dots; no labels built as "WORD — fragment"
    - no monospace for chrome labels (mono is correct inside Antaeus and AESDR frames, where it is their real token)
    - no "→" appended to links or buttons
    - no single word in a headline set in a different color or italic
    - no numbered markers except where the content is genuinely a sequence
11. **Don't ask. Decide, log, continue.** The single exception is rule 4: a gap in the source material is logged as a gap, never filled by invention.

## 3. Deliverables

- `dist/variant-a-keynote.html`, `dist/variant-b-wall.html`, `dist/variant-c-reel.html` — three complete single-file pages. CSS, JS and every generated asset inlined. Each opens from the filesystem with no build step and no network except the font `<link>`.
- `dist/frames/index.html` — a contact sheet showing every frame at once with its id and source, for review.
- `screens/` — PNGs of every variant at 1440×900 and 390×844, and of every frame's resting state at 1600px wide.
- `study/` — the source studies from phase 1, one file per source. This is the evidence base for rule 3. It stays in the repo; it is never published.
- `DESIGN.md` — the token plan, the material plan, and the review notes against rule 10.
- `SOURCES.md` — per source: what was opened, what was measured, and the file every token and material came from. Per frame: which source components and materials it is built from.
- `ASSUMPTIONS.md` — every decision made where the brief was silent, every copy cut, every gap in the source material, every substitution.
- `README.md` — how to build, preview, screenshot, deploy, and where the source paths are configured.

## 4. Stack and structure

Plain HTML, CSS and JavaScript. Python standard library for tooling. No frameworks, no bundler, no npm dependency in the page. Playwright is allowed for screenshots only.

```
shapshyftrs/
  build.py              # assembles variants and the contact sheet from parts
  screenshot.py         # captures screens/
  extract.py            # source extraction: PDF text, image sampling, STEP outlines
  config.json           # price, turnaround, contact, slogan, links, asset policy
  sources.local.json    # absolute paths to the five source repos (gitignored)
  tokens/               # one token file per source, plus the shared stage
  materials/            # reusable material recipes (see 4.4)
  frames/               # one self-contained HTML file per frame
  partials/             # page chrome shared by the three variants
  variants/             # the three page templates
  study/                # phase 1 source studies
  dist/                 # build output, the only published directory
  screens/              # captures
```

### 4.1 Source repos

Absolute paths live in `sources.local.json`, which is gitignored, because they point at private working repos. Keys:

| key | brand | what is in there |
|---|---|---|
| `puff-junction` | PUFF JUNCTION | product renders, CAD (STEP, SLDPRT), brand guide PDF, packaging, photography |
| `darkest-shades` | DARKEST SHADES | emblem vectors (SVG, EPS), brand guidelines, brand strategy, graphic elements, font pairs, moodboards, product renders |
| `digs` | DIGS | tech packs, garment photography, fabric closeups, style guide, DXF patterns |
| `aesdr` | AESDR | shipped interface, design tokens, components |
| `antaeus` | Antaeus GTM OS | shipped interface, design system specs, settled mockups, brand mark |

Read them. Do not write to them. Nothing in `dist/` may reference a path inside them.

**Out of scope, hard.** Some of these folders are shared vendor workspaces and contain other companies' brand work. Anything that is not one of the five brands above is out of scope and is never opened, cited, or drawn from. If you are unsure whether a file belongs to one of our five, it does not.

### 4.2 The asset policy

`config.asset_policy` has two settings. The default is `hybrid`.

**`hybrid` (default).** Source files may be dismantled and their materials carried into the build, subject to rule 2. What may cross:

- vector paths from a real mark or emblem, used as that mark
- exact colors, gradient stops, and color ramps quoted from source files
- pattern and knurl geometry, reconstructed to the real pitch and angle
- silhouettes and profiles traced off a CAD view or an orthographic render
- material statistics sampled from a render: base color, grain frequency, sheen falloff, shadow character
- texture plates generated from those statistics, at most 512×512, tiled, never a recognizable crop of a product
- real copy lines, verbatim

What may not cross, ever: a render, a photograph, or a screenshot used as an image of a product. A crop of one. A background plate that is recognizably a source composition. If someone who knows the brand could point at your page and say "that's the render," it has failed rule 2.

**`rebuilt`.** Nothing but colors, geometry and copy crosses; every surface is constructed. Available if the material law proves too permissive in review. Switching to `rebuilt` must not break the build — frames read their materials through `materials/`, and material recipes declare which policy they need.

### 4.3 The three tests

Run these on every frame before it ships. Write the answers in `SOURCES.md`.

1. **The brick test.** Name the authentic materials this frame is built from, and the file each came from. Fewer than two, it is probably invented.
2. **The new test.** Does this composition exist anywhere in the source material? If yes, recompose.
3. **The truth test.** Does this frame claim anything about the product that the source does not support? If yes, cut the claim.

### 4.4 Materials

A material is a reusable recipe for a real surface — `materials/pj-concrete.css`, `materials/ds-mirror-lens.css`, `materials/digs-waffle.svg`, `materials/antaeus-graph-field.css`. Each declares, in a header comment: the source file it was measured from, the measurements taken, the asset policy it needs, and what it is not (the honest limits of the recreation). Frames compose materials; frames do not re-derive them.

This is the layer that carries the fidelity. Spend the time here.

### 4.5 Frame isolation

Each frame is a standalone HTML file that opens on its own, renders at any size from 320px up, and carries all of its own CSS and JS. No frame reaches outside itself except for a shared stage stylesheet and the materials it names. `build.py` inlines them into the variants.
## 5. The five source worlds

One subsection per source. Each names the ingredients that brand hands you, the rules that brand imposes on what you may build with them, and the frames it earns. The **studies in `study/` are the authority**; this section is the shortlist, not the record. Where this section and a study disagree, the study wins and this section gets corrected.

Order here is the order of the studies, not the order of the gallery. Section 6 sets the gallery.

---

### 5.1 Antaeus GTM OS

**What it is.** A revenue operating system for a founder who has been selling by memory. They pour what they know into it once; it reads the motion back to them every morning and makes the motion **inheritable** — a first GTM hire could walk in and run it without the founder restating anything. Bright, severe, unsentimental, high-consequence. It is not a CRM and must never be shown as one.

**The field.** A band of bright cool neutrals, never stark white — `#eef1f7` (the settled 2026-07 mockups) through `#f6f8fc` (auth, onboarding, marketing). White `#ffffff` is reserved for the raised surface. There is **no dark theme**; a dark Antaeus surface is wrong.

**The graph paper.** The canonical recipe, from the settled auth gate:

```css
background-image:
  radial-gradient(circle at 12% 0%, rgba(37,99,235,.05), transparent 32%),
  radial-gradient(circle at 88% 8%, rgba(230,112,30,.04), transparent 30%),
  linear-gradient(rgba(10,28,64,.08) 1px, transparent 1px),
  linear-gradient(90deg, rgba(10,28,64,.08) 1px, transparent 1px);
background-size: auto, auto, 34px 34px, 34px 34px;
/* plus a vignette that dissolves the grid at the edges */
radial-gradient(ellipse at center, transparent 30%, rgba(246,248,252,.82) 100%)
```

34px pitch, navy ink at 8%, two faint corner washes — blue top-left, orange top-right. This is the cheapest way to make a bright field read as *drafted* rather than *empty*, and it is the material most worth taking.

**Ink and hairlines.** Navy `#0a1c40` at four opacities: `1 / .66 / .42 / .22`. Hairlines `rgba(10,28,64,.07)` and `.14`; rules `.16`. Structure comes from hairlines and left-rules, not from boxes — the system calls this **de-carded**.

**Color, by role, never by hue.** Orange `#e6701e` is **the one dominant move, once per surface, never decorative**. Blue `#2563eb` is the system explaining itself. Green `#22c55e` is health *right now*; forest `#1b5e3f` is what has **held over time** — the two are not interchangeable and the distinction is the most characteristic decision in the system. Amber and red carry caution and real risk; the settled mockups run them deeper than the token file (`#b5790f` and `#c0392b` rather than `#f59e0b` and `#ef4444`) and the deeper pair is more on-brand. Take the mockup values.

**Type.** DM Serif Display carries the argument, at one weight only — 400, never faked bolder. A plain sans carries the work. JetBrains Mono, letterspaced `.16em` uppercase at 10.5px, recedes into kickers and meters and never sets body. Newsreader at 15–17px / 1.55–1.66 for the rooms you actually read. Display runs `clamp(40px, 6.4vw, 74px)` at line-height `.98`, tracking `-.02em`.

**The mark.** The Grounded-A: a drafted capital A standing on a ground line that runs past its feet. 48-unit viewBox, three paths, `fill:none`, **butt caps and mitered joins** — the flat terminals are most of what makes it read as drafted rather than friendly.

```
legs     M14 38L24 10l10 28
crossbar M18.2 28h11.6
ground   M2 38h44
```

Stroke steps *up* as it shrinks — 3.2 display, 3.6 at 32px, 4.0 at 24, 4.4 at 20, and **6.0 at 16px with the crossbar dropped entirely**, because three strokes do not survive a sixteen-pixel box. The ground line is the signature, not the bar.

**The Living Mark.** The logo is the mascot. **Grounded** — sitting on the line — means strong, healthy, inheritable. **Lifted** — `translate(1 -7) rotate(6 24 24)` at `opacity .42` — means at-risk, a motion that lives in one head. The ground line never moves; only the A lifts. It is a state machine drawn as a logo, and it is usable on any object.

**Icons.** 24px box, 22px live area, **2px keyline** (deliberately heavier than the ubiquitous 1.5px), butt caps, mitered joins, `currentColor`. Two signatures: the **edge-rule** (a glyph rests on a straight line — the Account glyph on `M3 20h18`) and the **rationed tick** (at most one accent stroke marking the active point, rationed exactly like orange).

**Compositions worth dismantling.** The orange-ruled block — `border-left: 3px solid orange; border-radius: 0 14px 14px 0` on white over the cool field. The **climb**, where the part of a vertical ladder you have already passed is drawn in forest and the part ahead is hollow. The **face-off** — `1fr 54px 1fr`, a red-top-ruled panel against a forest-top-ruled panel with a vertically-set gap label over a serif `vs`. The **open book** — two panes, zero gap, one hairline seam, the right page set in reading serif with left-ruled margin notes colored by the kind of thing they tell you. The **fused strands** — two columns welded by one quiet centre hairline, structure entirely from alignment. The **pulse timeline** — NOW / THIS WEEK / **GONE QUIET**, older zones receding through four depth steps, ribbons whose rules fade out to the right. The **Live Edge switch**, which makes *off* legible as a state rather than an absence: still, then fold, then a visibly dead hairline.

**Rules this brand imposes.**
- Bright only. No dark surface, no dark hero, no dark mode.
- Orange once per surface. Every color carries a role; a color without meaning is removed.
- The mark is navy or `currentColor`. **It never takes an accent** — orange is the move and the mark is not a move. Never rotated except by the lifted device, never on a photo, never in a container shape.
- No left nav rail: *"a rail is a hallway with the doors painted on it."*
- Banned vocabulary is real and enforced in code. Do not mine identifiers for words — legacy terms survive in enum keys precisely because no user ever sees them.
- No demo-seed company names ever reach `dist/`, fictional or not.

**What the renders actually show — read this before building an Antaeus frame.** The doctrine and the shipped surfaces differ, and the surfaces are the truth.

- **The orange budget is far smaller than "orange is the accent" implies.** Across sixteen settled surfaces, five carry **no orange at all** — Readiness, Settings, Briefing, and effectively Discovery and Cold Call. Where it appears it is one object: usually one button, sometimes only a 3px rule. A state room gets no move color, because it has no move. Build to that, not to the word "accent."
- **White is rare and deliberate.** The Dashboard has no white panel anywhere; the Founding GTM body prose sits directly on the field. Where white does appear it is about 5% brighter than the field, so a panel **settles rather than pops**. This restraint is most of why the surfaces read as composed rather than assembled.
- **One to three serif moments per surface, at clearly different sizes, each doing a specific job** — declaring a state, asking a question, titling a document. Never decorating a header. Sans and mono do everything else. Serif count is the tell.
- **The emptiness is load-bearing.** Room columns run 840–1120px inside 1440, leaving 150–270px of empty margin each side, and most rooms simply stop after 700px of content. Discovery leaves ~200px of nothing under its question on purpose, because a seller glancing at it mid-call has to find that question in a quarter-second.
- **Hairlines hold structure without fencing.** In the Quota room the two strands are joined by one faint vertical, every row carries a top hairline, and **those hairlines stop at the divider — they never cross it.** That single restraint is why two columns read as two parallel readings rather than one table with a line down the middle. It is the best detail in the set.
- **The ground overhang is a ratio, not a length.** Legs occupy 20 units; the ground runs 44. It extends 12 units past each foot — **2.2× the width of the letter**. The crossbar sits 64% of the way down the rise, low enough to read as a gauge marking rather than a typographic bar.
- **Off is a state, not an absence.** The Live Edge switch runs three visible beats: everything goes `grayscale(1) opacity .3` *in place* while the breathing dot stops, *then* the rail folds, *then* the hairline left behind is plainly dead. On is the mirror, with lines re-inking on per-child delays of `.05/.14/.23/.32/.41/.5s`. Almost nothing in software bothers to make off legible. Take it.

**Cautions.** The token file and the shipped rooms disagree, and the shipped rooms fall through to hard-coded fallbacks; three mockup palettes coexist; `--ds-forest` is declared twice and the second wins. **Build from the settled 2026-07 mockups, not from `tokens.css`.** Green-as-action is an open, unsettled founder question — build on orange-as-the-one-move and note it. The graph paper is doctrine but is nearly absent from the shipped rooms; using it is a revival, which is allowed and should be logged.

---

### 5.2 AESDR

**What it is.** AE + SDR. A self-paced, one-time-purchase interactive sales course for people in their first two years in those seats — twelve courses, thirty-six lessons, no video. Its own framing: *"the operating manual, not the motivation engine."* Cream and crimson, editorial, sharp-cornered, dry. It is currently invitation-gated.

**Four visual generations exist in that repo and only one is shipped.** Getting this wrong is the easiest way to build a wrong AESDR.

| Generation | Palette | Type | Status |
|---|---|---|---|
| Gen 0 — prototypes, marketing landing, ad creative | dark `#020617`, green `#10B981` | Abril Fatface + Cormorant Garamond + DM Mono | dead; the repo labels this stack "Current (WRONG)" |
| Gen 1 — the 27 numbered hero mockups + the dark editorial variant | dark `#020617`, green | Inter + JetBrains Mono — **both banned by name in current canon** | road not taken; the repo's own README says do not point design generators at these files |
| **Gen 2 — the product** | **cream / ink / crimson + reserved iris** | **Playfair + Source Serif 4 + Barlow Condensed + Space Mono + Caveat** | **shipped. Build from this.** |
| Gen 2b — the iframed lesson player | white/black + amber, cobalt, acid `#C8FF00` | Abril Fatface + Inter + DM Mono | shipped, deliberately off-canon, a sibling register |

**And the single most useful structural fact about this brand:** the three landing variants — editorial-split, broadsheet, dark-editorial — carry **identical class names** under different tokens. The broadsheet variant redefines crimson to black and runs with no accent at all. **The identity is the structure and the motifs; the palette is a skin that was swapped once and can be swapped again.** The canon says so outright. That is an unusually direct invitation to recompose, and it is the reason this brand is the easiest of the five to build something genuinely new from.

**The field.** Cream `#FAF7F2` — warm off-white, never paper-white. White `#fff` for cards sitting on cream; the ~1.5% luminance step between them is the primary figure-ground device and it is deliberately very quiet. A third field, `rgba(0,0,0,.02)`, carries the FAQ cards and the terminal.

**Corners are zero.** `border-radius: 0` across the product, stated outright in the token file: *"AESDR is editorial — sharp corners."* The exceptions are circles (`50%`) and a handful of 2px mono badges. A rounded AESDR surface is wrong.

**Color.** Crimson `#8B1A1A` — CTAs, emphasis, authority. Ink `#1A1A1A`. Muted `#6B6B6B`. Light `#E8E4DF` for every border and divider. And a second red that is **not** crimson: `#C53030`, the editor's pen, used only for red ink — strikes, inserts, margin notes. Do not confuse them.

**The iris.** The one gradient that is a brand asset:

```css
--iris: linear-gradient(90deg,
  #FF006E 0%, #FF6B00 17%, #F59E0B 34%, #10B981 51%,
  #38BDF8 68%, #8B5CF6 85%, #FF006E 100%);
/* background-size: 300% 100%; animation: shimmer 4s linear infinite */
```

Its discipline is the whole trick. **Permitted:** the wordmark, the single primary CTA per surface, thin ambient lines of 1–2px, one iris-clipped payoff line, the deck numeral. **Forbidden:** whole headlines, any panel or card fill, more than one iris CTA on a surface, decorative swirls or halos, icons. It is rationed like a precious metal, and that ration is why it reads as a brand rather than as gradient-chic. There is a family, not a fixed asset — the gate runs a no-pink variant, the lesson player a more saturated one.

**Borders carry structure; shadows are rare.** 1px `#E8E4DF` default. The signature trick is the gradient border, done with a double background:

```css
border: 2px solid transparent;
background: linear-gradient(var(--cream), var(--cream)) padding-box,
            var(--iris) border-box;
```

And the crimson left-rule — `border-left: 3px solid #8B1A1A` on white — is the standard "the system is speaking to you" aside.

**Type.** Five stacks, five jobs. **Playfair Display italic 900 is the signature** — nearly every headline in the product is italic. Source Serif 4 for all body. Barlow Condensed uppercase at `.15em` for buttons and labels. Space Mono at 10px and `.25em` for eyebrows and taxonomy. Caveat for handwriting, and Caveat is a *voice*, not a decoration — it belongs to one of the two authored narrators and to margin annotations, nowhere else.

The cadence repeats on every section of every page: **tiny hyper-tracked mono eyebrow → enormous italic Playfair headline with exactly one iris word → a 60×2px iris divider → quiet Source Serif body → uppercase condensed button.** That four-beat stack is what makes ten different metaphor-worlds read as one product.

**Materials worth dismantling.** **Blur as redaction** — `filter: blur(5px)` with `user-select: none` over real content, a mono `[CLASSIFIED — HOVER TO PEEK]` overlay, resolving on hover; the content underneath is real, never lorem. **The terminal on cream** — an uncommon object the retirement of dark mode forced into existence: cream ground, 1px `#E8E4DF`, translucent dots, ink mono lines fading in one at a time, a crimson block cursor blinking at `0.8s step-end`, then an iris-clipped payoff. **Rotation as a system** — `-2deg` classified stamp, `-4deg` circular date stamp, `-3deg` cover stamp, `±0.25–0.35deg` on grid children so cards read as physically stacked, all resetting to `0deg` on hover. **The dog-ear peel** — a 28×28 corner drawn entirely as a hard-stop 225° gradient, growing to 52×52 on hover, on a card that peels around `transform-origin: left center` at `650ms cubic-bezier(.7,0,.2,1)`. **Aged card stock** — `#F4EADD` with a radial top shade, a 28px repeating vertical grain, a 1px red margin rule at `left: 48px`, ruled lines at `background-size: 100% 1.5em`, and a punched hole rendered as a 14px radial gradient with an inset shadow. **The manuscript margin rail** — body at `line-height: 2` with `padding-right: 220px` and a 200px right rail of Caveat notes in `#C53030` behind a 2px crimson border, strikes at `text-decoration-thickness: 2px`. **The ghost numeral** — Playfair 900 italic at 300px, `opacity .06`, bleeding off the corner of a panel. **The circled number** — `border: 3px solid #C53030; border-radius: 50% / 35%` so it reads as drawn by hand in red pen.

**Leponeus.** A photoreal 3D iridescent rabbit-tortoise hybrid: a domed tortoise shell in hexagonal scutes, four scaled legs, a rabbit head with two long upright ears, the whole creature in overlapping pearlescent fish-scale texture in pastel blue, lilac, rose and mint, one teal-black eye, and **a single crimson band** — the only saturated color on it. Eight poses, each a narrative state, and the artwork changes per state: a **crimson crack running the length of the shell** for `fall`, a **green sprout growing out of the shell** for `recovery`, a **crimson Playfair-italic "A" branded onto the shell** for `owner`, a head-on stare with the band reading as a visor for `verdict`.

**The shell glyph.** One quadratic dome, `M 6 50 Q 32 12 58 50 Z` at 1.6px round cap, which mutates into loss and growth without changing silhouette — a crimson lightning crack for `fall`, a taller dome with a stem and two crimson leaves for `recovery`. The Greek-key **meander** divider and the dotted-path arc are the same hand.

**Rules this brand imposes.**
- **Zero radius.** Editorial, sharp.
- Iris only where the reservation rules permit it. One per surface.
- Caveat is a voice. Never use it as a decorative script.
- One mascot per page, from the eight named sizes, and **no anthropomorphizing** — no waving, no thumbs, no smiling, no speech bubbles.
- **Seven registers are spent and may not be proposed again**: `classified`, `dossier`, `ledger`, `editorial`, `scouting`, `split`, and the decision card — *"plus any other stock register an LLM reaches for by default."* Read that clause as written; it is aimed squarely at this kind of work. The brand's own test: *"if a direction could be pitched to any other company unchanged, it isn't an AESDR direction."* The rule is prospective — shipped surfaces in those styles stay — but a *new* AESDR composition built as an editorial split or a classified dossier is building the thing its owner has explicitly retired. Derive from the primitives instead: the iris, Playfair italic, the Space Mono taxonomy, the Caveat margin voice, the zoom sequence, the mascot.
- **Leponeus must be present** in any new AESDR direction.
- The banned-vocabulary list is absolute and includes every piece of sales-motivation language. Copy that could be lifted onto a LinkedIn carousel is wrong by definition.

**One trade to know before you copy it.** The micro-label whisper layer — mono eyebrows at `muted` 70%, crimson at 50%, scroll cues at 30% — **fails WCAG AA on the live site**, measured: `#969594` on cream is 2.79, `#f59e9b` on cream is 1.91, the scroll cue is 1.48. The whisper *is* the brand, and the product made that trade knowingly. This page's own captions and chrome are held to AA per section 13; a whisper inside a frame is decorative and exempt. Do not let the exemption leak outward.

**Where the data-viz lives.** Exactly one place, and it never shipped: a three-column artifact dashboard with 4px crimson bar meters on `#E8E4DF` tracks, each carrying a one-line italic serif verdict, and the **"YOU SAID / THE DATA" stacked pair** — a white card with a mono label and an italic quote, then a pale-crimson card with a mono label and a bold crimson counter. Its sibling is a **transformation ledger**: a greyed column with ✗ circles and struck italic beside a lit column with ✓ circles, split by a vertical rule. Exploration, never shipped, and the only chart vocabulary the brand has.

**Cautions.** The favicon is off-brand legacy (a sky-blue square in a face that appears nowhere in the canon) and is not a mark. The retired dark palette survives in `design-canon/07-mockups/` and the variants — the repo's own README says do not point design generators at those files. The lesson player runs a deliberately separate design system (Abril Fatface, Inter, DM Mono, 2px black borders, acid `#C8FF00`) and is a sibling register, not the same system. Per-page sub-palettes proliferate — the canon names five colors and the product ships about twenty, each scoped to one metaphor. Personal names appear in the reveal artifacts and testimonials and must never cross into `dist/`.
---

### 5.3 DARKEST SHADES

**What it is.** A direct-to-consumer premium sunglasses line — nine frame models, designed in CAD and physically sampled, so real acetate prototypes exist. Acetate and metal. TAC lenses, ultra-dark polarized, 100% UVA/UVB. $100 direct, no middlemen. The hero attribute is the blackout lens itself: *"a signature blackout effect that makes a statement without saying a word."* Black, white, and a grey ladder. The founder's own colour instruction is the whole system in one line: *"I think I see 'just black'..... Like really lean into complete darkness. With white/empty space peeking."*

**The mark.** A ten-vertex angular polygon, all straight edges, aspect **1.9498 : 1**. Verified against the source at 99.78% pixel agreement:

```svg
<!-- viewBox="0 0 1000 513" -->
<path d="M0,0 L270,0 L544,65 L732,0 L1000,215 L1000,513 L732,513 L454,448 L269,513 L0,298 Z"/>
```

**The double-notch is the entire idea** — a downward fold at 54% of the width on the top edge, an upward fold at 45% on the bottom, deliberately offset from each other, which is what makes it read as a creased banner or a pair of shades seen edge-on. The left edge runs vertical for the top 58%, the right edge for the bottom 58%. It has near-180° rotational symmetry and is not actually symmetric. Build it as a reusable `clip-path`; it works as an identity mark, a photo mask, a hairline outline and a chained pattern unit, which is more work than any other single object in the five brands does.

**Clear space** is `X = the width of the mark` on all four sides — not its height. That is a very generous margin and it is stated in the guidelines.

**Lockups, measured.** Primary (mark + one-line wordmark) is `14.643 : 1`; the mark's height is `1.20 ×` the cap height and the gap is `0.28 ×` the mark width. Secondary (mark + stacked two-line wordmark) is `5.287 : 1`; the mark aligns top and bottom with the two-line block, the gap is `0.108 ×` the mark width, and the line pitch is `1.34 ×` cap height, both lines flush left.

**The studio language, in two values.** An infinite seamless backdrop at **`#D2D2D2`** — a mid grey, not white, and getting this right is half the look. The shadow is a broad soft pool starting at the contact line, spreading 5–10% *wider* than the object, bottoming out around `#C0` — only **8–10% darker than the backdrop** — and gone within about an eighth of the object's height. In three-quarter views it stretches into two long soft parallel streaks, one per temple. **Never a hard drop shadow.** One very large soft key upper-front, swinging left or right per shot, plus a broad ambient dome. No rim light. No colour grade. Long lens, object at 55–70% of frame width, camera slightly above the centreline looking gently down.

**The blackout lens — the hero material, and it is two elements.** A near-black fill at `#151515–#2A2A2A` that you genuinely cannot see through, plus **one broad soft sheen band**: a wide diagonal wipe lower-left to upper-right at roughly `#4A–#6A`, 25–35% of the lens width, very soft edges. Then one small hard specular dot near the top edge. That is the whole recipe. A faint 2–4px inner shadow rings the lens where it meets the groove, and the lens sits slightly proud of the frame front.

Other lenses, for when a composition needs them: graduated smoke ramps `#353535` at the top to `#878A8E` at the bottom — dark over light, the opposite of a classic gradient lens. **A silver mirror reflects the room, not a scene** — it renders as a smooth vertical `#C8 → #9A` gradient with one long pale streak and a 1px dark bezel line inside the frame. A reflected skyline in a mirrored lens is off-brand.

**Acetate.** Gloss black sits at `#131313–#1B1B1B` but behaves like polished dark resin — near-mirror on the flat facets, so it mostly reads as *reflections of the grey room* rather than as black, with a hard thin near-white specular line at `#C8–#E8` along every chamfer and real sub-surface translucency lifting thin edges to `#3A–#50`. Satin black is `#202020–#262626` with a wide soft highlight topping out at `#6A–#80`. **Blue tortoise** is the richest and most under-used surface: a near-black ground at `#131313–#1A273A` with cobalt-periwinkle flecks at `#5B8CCF–#6495D0` in irregular organic blobs 3–8% of the frame width — not a repeating pattern — and it is *translucent*, so the rim glows from behind at `#93B5BF–#A7BEC6`. Build it as mottled noise on a `screen` pass with a strong edge-glow. Red tortoise is the same behaviour with oxblood flecks at `#4B1313–#501414`, hottest where the material is thinnest.

**Colour.** Black, white, `#545454`, and `#BF835E` — a terracotta held almost entirely in reserve, used nowhere in the executions. Using it extends the system rather than following it, which is allowed and should be logged. The one genuinely saturated thing in the entire brand is **`#0D12CC–#1F31C8`**, an almost-ultramarine electric blue, and it appears only as a temple-tip cap and a hinge tab. It is rationed exactly the way orange is rationed in Antaeus.

**Type.** Owners Wide for titles, all caps, tight tracking, leading around `0.95–1.0 ×` cap height so lines nearly touch. Stolzl for everything else. The practised rules: one giant caps headline per surface, ragged right, three to five words a line; a letterspaced micro-kicker above it at about an eighth the headline size at roughly `+0.12em`; body at about a sixth the headline size in narrow columns of two to four lines; a running head top-left with a hairline rule running from it to the right margin; the first two or three words of a body paragraph set bold as a lead-in; small labels set in 1px fully-rounded pill outlines.

**Layout.** The identity pages split at **26% / 74%** — a left white text column against a right `#F1F2F1` panel or full-bleed image, effectively a 3:9 on a twelve-column grid. Outer margin 26px on a 1920 page. Image-led pages abandon the split and go edge to edge with type overlaid. The mark is never centred in a campaign layout — it sits in a corner with a small caps kicker in the opposite one.

**Devices worth dismantling.** The **mark-as-mask** — a portrait clipped inside the angular polygon on black, the two notches slicing through the image. The **chevron chain** — solid white kites touching at single points, chained into a repeating zig-zag band; this is the one pattern that exists on real packaging. The **hairline lattice** — open polygons crossing at single points as a large faint white line drawing over black, with body copy sitting inside one of the cells. And the **campaign photographic register**, which is nothing like the product register: flash-lit, grainy, night-coded, tight crops through the forehead or chin, eyes never visible, crushed blacks, one bright specular star where the flash hits the lens.

**Rules this brand imposes.**
- Black is the brand. Anything more colourful than black, white, a grey ladder and one rationed accent is off-system.
- Never a hard shadow. Never a white product backdrop. Never a colour grade.
- A mirrored lens shows a soft environment wash, never a scene.
- The brand's own DON'T list: not pretentious, not over-explaining, not loud or flashy, never over-promising on privacy. Its own test: *would someone wearing these say this out loud, or would they whisper it?*
- The competitive map places the brand at **high-end × minimal**. Anything that reads busy or trend-chasing is aiming at the wrong corner of the brand's own map.

**The best unexploited idea in the archive, and it is the founder's own.** The catalogue brief asked for *"prismatic logo elements and patterns in shadows, lighting, background"* — the mark's angular geometry cast as shadow or projected as light across a product shot. It was quoted, deferred, and never built. The brand-photographic language for this product does not exist yet. That is an invitation.

**Cautions, and one of them matters a great deal.**
- **Three render files in that folder are a third-party eyewear company's advertising**, supplied to a 3D artist purely as lighting-and-finish references. They carry that company's wordmark on the temple and its own model names. They are **not Darkest Shades product and must never be used, cited, or drawn from.** If you see a temple wordmark that is not `DARKEST SHADES`, you are looking at someone else's brand.
- The folder is a shared vendor workspace holding several other companies' brand work. Only Darkest Shades is in scope.
- **The nine renders are completely unbranded** — they were made before the logo was approved. Real temple branding is the angular mark in engraved cross-hatch plus the stacked two-line wordmark, on the outer face near the hinge. A branded render means you add it.
- The **Eclipse emblem is an exploration, not the mark.** Its own files say it is a reconstruction from a low-resolution render, its contour is directionally right rather than authoritative, and its gold is an approximated screen colour rather than a specified ink. It does not replace the angular mark; the two coexist. The seven-stop gold ramp is still an excellent ingredient — just do not present Eclipse as the identity.
- **No font licences are on record.** Owners Wide and Stolzl are commercial retail faces. The wordmark itself may be a modified cut — the founder asked which face it was and never got an answer — so recreate it from the vector, never by re-typesetting.
- The render deck mislabels one model; the Values page duplicates a chip and repeats a body line. Do not propagate either.
- Five rejected mark directions and a set of pre-brand 3D sketches sit in the same folder. None of them are the brand.

---

### 5.4 DIGS

**What it is.** A founder-led menswear capsule. One style reached a real physical prototype — `AC-LST-001`, a relaxed-fit crewneck long-sleeve thermal tee — and three others stalled at sourcing. The identity is electric blue, black and ice. The founder's own positioning is sharper than the agency's: the mission is to *"redefine 'dope' as a symbol of positive change, empowerment, and quality of life,"* built on *"quiet effectiveness"* and *"discreet support… our impact is felt rather than seen."*

**Naming.** `digs`, always lowercase, is the wordmark and the product-facing name — it is what is embroidered on the back yoke and printed on the neck label. *"Dope is good"* is the ethos line the name comes from. Nothing in the archive states the mechanical relationship between them, so do not over-claim a derivation.

**Colour — three values, and that is the entire palette.** Black `#000000`. Blue **`#0042e5`**. Ice `#f0f5ff`. No greys, no tints, no gradients. The stated rule: *"Color is largely celebrated through photography and type."* Electric blue against pure black against a cold near-white is brutally simple and very hard to make look bad.

**The product palette is a different world and does not use the brand palette at all.** Off-white `#F8F0E8`, sand blue `#6176A3`, embroidery in Pantone 19-3943 Bellwether Blue which measures **`#24315A`** and reads `#3E4351` as actually sewn. The real prototype is sage-khaki, `#8C8C83`–`#A89F8A` under cool light and `#94824E`–`#CCB17D` under warm. Nothing in the archive reconciles the two palettes. Their only point of contact is that both are called blue. Keep them apart, deliberately.

**Type.** **Alexandria** — a geometric humanist sans, tall x-height, circular bowls, single-storey `g` with an open descender hook — carries everything, and it is a Google Fonts family, so it is free and exact. **The Old Falcons** is the script: a dry-marker graffiti hand with chisel-flat strokes, ragged skipping edges, wildly mixed case inside a single word, and a variable baseline. It carries all the emotional weight. The rule from the guide: *"No other typeface should be used for any communication."* And: *"Style may be left, right or centre-aligned, but never set to full justify."* Headlines run very tight — leading around `0.92–0.98 ×` the type size — and caps headlines fill the frame edge to edge, breaking words to fill the measure. The script appears for exactly one or two payoff words inside an otherwise-sans sentence.

**The wordmark.** Lowercase, tightly tracked so adjacent letters almost kiss. Full circular bowl on the `d` with a straight flat-cut ascender; single-storey `g` whose descender sweeps down and left into an open hook that does not close. And the signature quirk: **the `i` carries a detached, perfectly round dot set high, level with the `d`'s ascender top**, so in tight settings `digs` reads as `d!gs` — the brand book already exploits this on its cover tile. It is a free, ownable typographic event. Clear space is one lowercase-`s` width on all sides.

**The `DD` monogram.** A hand-drawn marker construction: two D forms, one mirrored, overlapped so the bowls intersect and leave a **lens-shaped void** at the centre, outer strokes sweeping to four sharp points, the whole thing reading as a bowtie. Ragged dry-marker edges with visible bleed and skip; nothing geometric. It reads at 12px and at three metres.

**The primary lockup, and the guide says to prefer it over the wordmark alone.** The `digs` wordmark with **"AcTuAlly DOPE" scrawled in marker straight across it** at roughly −8° to −10°, mixed case, the scrawl and the wordmark overlapping and interfering — one reads through the other, and that is the point. Two textures, two registers, a deliberate collision. It scales from a 25mm cap embroidery to a building.

**The thermal knit — the signature surface.** A **half-drop lattice of tiny raised yarn crossings with a dark pinhole at each cell centre**, roughly 1.2mm pitch, with the yarn families crossing at about ±45°. At arm's length it reads as a fine matte grain and only resolves into diamonds at macro distance. Two offset diagonal line families plus a shadowed dot grid gets you most of the way in canvas. The raised crossings catch a soft specular ridge highlight while the pinholes hold a small hard shadow — **high micro-contrast, low macro-contrast**, and a diffuse cotton sheen with no gloss. Measured range `#4C493E` in shade to `#ADA595` top-lit. **The reverse face is completely different** — smooth, flat, warmer and duller at `#5D523F`, like a fine jersey. The 2×2 rib at the neckband and cuffs is denser and slightly darker because the ribs self-shadow, pairs of raised wales at ~1.5–2mm pitch running perpendicular to the edge and following its curve.

**The wash — the most important finish in the brand, and it is what makes a garment look like a garment rather than a flat fill.** Two things are happening. The specified one is a potassium-permanganate snow wash, whose visual signature is **irregular pale speckle-clouds of variable grain size**, not a uniform fade. The one the founder actually wanted he named himself: a *"seam highlighter wash"* — **a lighter-value halo running along every seam, the neckband edge, the shoulder line, the cuff and the hem**, over broad soft tonal cloudiness across the panels. That maps directly onto a stroke-along-path lighten operation.

**Real construction, real numbers.** Set-in sleeve with a slight drop shoulder, straight body, straight hem, and a **horizontal back yoke seam** so the back is two panels while the front is one piece cut on the fold. 2-ply foldover rib at neckband and cuffs. Thermal knit, 100% cotton, **215gsm × 150cm**; rib 95/5 cotton-spandex at **380gsm × 120cm**. Finished neckband height **1 inch**, cuff height **2 inches**. Seam allowance 3/8 inch throughout, 1 inch turnback at the hem. Sizes S–XL with a full graded point-of-measure table. The DXF files are real Gerber AccuMark pattern exports — 28 blocks, seven pieces across four sizes, with the material A/B assignment matching the bill of materials exactly.

**The embroidery.** *"Satin stitch filled-in lettering"* with *"zigzag stitching around letter outlines,"* **2.5 × 1.58 inches at centre back yoke**, in Bellwether Blue. The satin stitches lie perpendicular to each letter stroke, giving a fine corded sheen across the stroke width, and the letter edges are slightly furry where stray navy fibres break the outline. The artwork sheet shows the wordmark wrapped in its **scalloped digitisation path** — that bumpy contour is a beautiful device on its own.

**The tech-pack layout system, worth taking wholesale.** Black-line technical flats on white with **soft grey diagonal drape strokes** suggesting fabric fall, and **red leader lines with arrowheads** running to caps callouts. Rib drawn as a hatch of fine parallels, hems as double dashed lines. Trims keyed with small coloured circular tokens. Dimensions as red arrow-ended measure lines. A pipe-separated style string as the sub-header. Nobody is using this as a compositional language.

**Devices worth dismantling.** The **scrawl-over-type** collision. The **scribble layer** — a chaotic field of marker doodles, strokes, crosses, triangles, hatch and tick marks, laid under and over clean type; cheap to generate procedurally and high payoff. **Torn black edges** peeking from behind a blue panel on an ice ground. The **all-over tag pattern** — the tagline repeated in blue as wallpaper. The **wordmark tile**, `digs` stacked and repeated edge to edge. The **four-sided marquee frame**, a caps phrase repeating along all four edges of a black frame, rotated 90° on the sides. The **moodboard register** — yellow sticky notes for labels, pink for construction paragraphs, green for hard rules, fat red-orange arrows, and a huge ragged red brush-marker redaction with white holes punched through where notes need to stay legible. Crude, urgent, genuinely striking.

**The real presentation register.** Ignore the brand book's street photography (see cautions). The honest one is the working documentation: garment on a **cream canvas size-40 dress form with a polished aluminium neck cap and a chrome stand, against a plain warm-white wall**, one-sided window light, real shadows, a vent register in shot. Macro fabric shots on a white desk under **hard raking sunlight** with a fibreglass tape in frame. Unstyled, specific, and a far fresher backdrop than stock street photography.

**Rules this brand imposes.**
- Three colours. No greys, no tints, no gradients in the identity.
- One typeface family, plus the script for one or two payoff words. Never full-justified.
- Keep the brand palette and the product palette apart.
- `digs` is always lowercase.

**Cautions, and the first two are serious.**
- **Every photograph in the brand book is stock placeholder.** Its own final page says so: *"PHOTOGRAPHY IN THIS DOC IS PLACEHOLDER ONLY UNTIL DIGS HAVE PRODUCED THEIR OWN ASSETS, AND MUST NOT BE USED EXTERNALLY OR COMMERCIALLY."* The photographic art direction is aspirational, not proprietary. Do not build from it.
- **Several garments in the archive belong to other brands** — a hoodie, a crewneck sent as a collar-height reference, and the fabric target itself are all other companies' product, sent as references. None are DIGS. Out of scope, like the Darkest Shades third-party ads.
- **Some images are AI-generated concepts with garbled hallucinated wordmarks**, including chest graphics, store renders carrying fabricated spec copy and a co-brand that does not exist. Directional references, never assets.
- **"Made to last," "Designed with care" and "100% cotton thermal" are not real DIGS copy.** The first two appear nowhere in the archive. The third is a fair paraphrase of the bill of materials but is not a tagline. All three shipped on a frame in the first version of this page. They are the exact failure rule 4 exists to prevent, and they are the reason section 8.9 requires every word inside a frame to be verbatim and cited.
- **Two typos are baked into the outlined artwork** — "boudaries" and "jorney". They are in the vector, not a text-layer slip. Decide deliberately; do not reproduce one by accident.
- **The Old Falcons is a demo cut.** Licence it or draw the letterforms.
- **The physical prototype failed its own spec** — no topstitching, off-measure in six points, and the wash effect absent. Every photograph of the real garment shows a garment that is wrong. Build to the spec, not to the sample.
- The fibre and country of origin reversed mid-development and the current pack still contradicts itself on one page. Take the current revision.
- Nothing was ever produced. No hangtag, no RN number, no barcode, no price. Whatever you build from this will be the most finished thing the brand has.
---

### 5.5 PUFF JUNCTION

**What it is.** A cannabis accessories brand making objects, not commodities. Its own words: *"we're in the business of creating cultural artifacts."* The hero product is a grinder — **an 85mm square block of dark faux-concrete, 57.2mm tall, split horizontally, with a Ø63 brushed-brass knurled knob sunk into the top face and standing 15.4mm proud.** Four chambers, M62×1.5 threads, magnet-coupled so twisting the exposed knob drives the grinding chamber inside the concrete. There are real production samples.

**Read this before anything else: there are two Puff Junctions in that archive, and they do not match.**

- **The paper brand** (Feb 2024) — a loud neon pop-art identity. Slime green, halftone comics, clouds, heavy italic type, hard-shadow buttons.
- **The object brand** (2024–25) — severe, monochrome, architectural. Dark faux-concrete, brushed brass, diamond knurl, a dissolving harlequin, a white studio sweep.

The founder flagged the gap himself in October 2024 and asked to move *"not completely, but subtly from a vibrant and somewhat playful neon feel to a subtler, more refined aesthetic."* **That reconciliation was never designed.** It is the single most interesting unbuilt thing across all five brands, and a frame that reconciles the two — one rationed slime element inside an otherwise monochrome object scene — is both faithful and genuinely new. The study argues the object brand is the real one and the paper brand is the accent system. Take that reading, and log it.

**The circle-in-square.** Ø63 on an 85mm face is **74% coverage** — a deliberately dominant circle in a square, standing 15.4mm proud, corners at R3 on the block. It is the most recognisable shape in the brand and it works from favicon to hero.

**The concrete.** Fully **achromatic** — R, G and B are equal in nearly every sample, so do not add a hue. Base albedo about **`#565656`**, sitting in a band from `#44` to `#60` depending on exposure. **Roughness around 0.85** — there is no specular highlight anywhere on it, only a broad soft luminance gradient, with Fresnel at grazing angles on the radiused corners as the only sheen. Three scales of texture, all needed:

1. Broad cloudy mottling, ±10–15 levels of grey, cells roughly 15–25mm on the object. This is what makes it read as *cast* rather than painted.
2. Fine dark aggregate speckle at `#35–#3A`, sparse, 0.3–0.8mm.
3. On the top face only, a faint directional troweled streak.

The **parting seam** between the halves is a 1–1.5px crisp dark line with the faintest chamfer either side — a machined joint, not a crack. And the founder was explicit when a factory offered something else: *"It has to be (faux) concrete. Not interested in marble."* The real material is a high-density resin or composite; the requirement was weight and touch, not cement.

**The brass, and this is the most useful single observation in the archive: it is two-faced.** On flat faces it reads as a pale warm near-neutral; on knurled and cylindrical surfaces it reads as saturated antique gold.

| surface | measured |
|---|---|
| flat top face (the logo plateau) | **`#D1CAC1`** |
| knurled band | **`#816437`** (`#7D5A2B` in the second render) |
| smooth flange | **`#795930`** |

Base albedo about `#B8934E`, **roughness 0.28–0.35** — satin, never mirror — with a **fine circumferential brush grain** on the cylinders and a **radial brush grain** on the flat top. **If you paint the top face gold you will get it wrong.** It washes out to pale champagne because it is mirroring a large bright source almost head-on, and it only *reads* as gold in context. Brushed, never polished — that is a stated brand rule.

**The knurl — the brand's true signature texture, and it is on every product.** A diamond cross-knurl, dimensioned on the drawing: **1.26mm pitch**, lands **1.65mm circumferential × 1.9mm axial**, full cell repeat 2.11 × 2.48mm. Diamonds are **point-up and slightly taller than wide** (1.15:1), grooves crossing at about 49° from horizontal — the same angle as the grinding teeth. Roughly 20 TPI: fine enough to read as texture at arm's length, coarse enough to individuate at 300mm. The crowns are **flat and brushed with a small radius, not sharp pyramids**; the grooves are V-shaped with rounded bottoms and go nearly black. The luminance swing is enormous — **`#0A0602` in the groove bottoms to `#E8DCB8` on the facet crowns, 230 levels across about a millimetre.** That extreme micro-contrast is what makes it look expensive. It tiles perfectly and reproduces trivially as a normal map.

**The dissolving harlequin.** A diagonal checkerboard — squares rotated 45°, meeting corner to corner, alternate cells filled, **no outlines, no gutters**. Cells run **13–14mm on point**, about three over the body height and six across the face: a big bold harlequin, not a fine argyle. It is **dense at one vertical corner and thins diagonally away with a ragged staircase front** — individual cells drop out entirely; **it is never an opacity fade.** It wraps the radiused corner onto the adjacent face and crosses the horizontal parting seam in perfect registration between two separately-cast halves. And the dark cells are **not black**: `#414141` against `#565656` concrete, roughly **25–35% darker than the adjacent surface**, matte, perfectly flush, catching the same light. Model it as a value shift on the same material, never as a fill.

Its provenance is documented and worth knowing: it is lifted from a limited-edition concrete-cube table lighter, and the reference file carries **hand-drawn annotation circles around exactly two things** — the edge where the harlequin runs, and the diamond plaque.

**The 0.2mm whisper deboss.** The wordmark is milled into the flat brass as a **three-step relief**: the `puff` letterforms stay at the original top surface at 0.0mm, the halo around them and the `JUNCTION` line are cut to 0.1mm, the outer field to 0.2mm. Technically a deboss, perceptually an emboss, and **astonishingly shallow** — in the hero renders it is barely legible, catching light on one edge only. If you rebuild this, the mark should be a *whisper*: one raking-light edge, almost invisible from the wrong angle. That restraint is the character of the whole piece, and it is the exact inverse of the paper brand.

**The logo.** The full lockup is **895 × 439** (2.039:1); `puff` alone is 895 × 408. Thirteen paths: one contour plus the four letters of `puff` and the eight of `JUNCTION`. Construction ratio, stem : gap : contour stroke ≈ **3.6 : 1.1 : 1**. The contour is a single merged silhouette offset down-and-left from the letterforms, stroked, with the background showing through the gap. `puff` is a very heavy geometric italic lowercase with a huge x-height and the two `f` crossbars merged into one bar; `JUNCTION` is a lighter uppercase at very wide tracking, optically matching its width. Clear space is the height of the `p`. **The official set contains exactly two colours — `#000000` and `#D6FD4A` — and there is no white logo.** The files named "Light" are the slime version.

**The paper palette, quoted from the guide.** SLIME `#D6FD4A` · DREAM `#A5E4FF` · FLAMINGO `#FF8FF1` · PINEAPPLE `#FEF200` · white · black. **There is no grey in the system at all** — which is a real tension with a product whose hero material is `#565656`. Text rules: on white or any colour, everything is black; on black, everything is any colour but black.

**Type.** **Arnet** for display — *"Bold, Black, and Super, all elegantly presented in italics."* **Italic only; there is no roman in the system.** A wide, heavy neo-grotesque with a large x-height and sheared terminals. **Work Sans** for body. The published hierarchy is specific: H1 96/92, H2 64/65, H3 48/48, H4 34/34, H5 28/28, H6 24/26, all Arnet Bold Italic uppercase; body 18/28 and 16/23 in Work Sans Medium, sentence case; buttons 16/20 Arnet Semibold uppercase; overline 10/12 Work Sans Semibold uppercase.

**The studio grammar, measured exactly.** A seamless infinity cove: **flat `#EDEDED` horizontally across the entire width**, holding to about 40% of the frame height, then falling smoothly — 50%→`#E4`, 60%→`#DC`, **70%→`#C8–#CD` at its darkest** — then **lifting again to `#D5–#DD` at the bottom** as the floor catches bounce. No colour cast, no vignette, no visible horizon. The contact shadow is broad, soft and feathered with no penumbra edge, bottoming out at `#BB–#CB`. One big soft key from upper front, slightly to one side; no hard specular anywhere on the concrete. The brass throws a faint gold bounce onto the concrete immediately around it. Long lens, three-quarter view at 35–45° elevation. **The object plus its shadow occupies 73% of the frame width with about 30% headroom above and 19% below, sitting slightly left of centre and low.** One object, one surface, nothing else in frame — no props, no context, no hands.

There is a second, moodier treatment on black with far more saturated brass and near-mirror bevels, including **exploded and sectioned technical views rendered in the same lighting** — an excellent and underused device.

**And a third register worth taking:** the marker concept sketches. Black fineliner line, cool-grey markers for the body, **warm tan marker for the brass**, hatched ellipse ground shadows, hand-lettered caps annotations, photographed on white paper with the paper edge and a stray pen in frame. Warm, authored, and completely unlike anything else in the five brands.

**Copy that actually exists.** `THE BEST IS YET TO COME` · `LET THE GOOD TIMES ROLL` · `THE INTERSECTION WHERE HIGH ART MEETS HIGH TIMES.` · `All the stuff for all the puff.` · `Take a trip` · `Add to Stash` · `I ♥ PJ's` · `CAUTION! FRAGILE HANDLE WITH CARE` · `PUFF PASS`. The founder's own positioning language is sharper than the guide's: *"sophisticated minimalism with edge"*, *"monochrome with strategic color splashes"*, and the line that should govern any new PJ frame — *"We want to put forth a status of art but without veering into the realm of playfulness or kitsch."*

**Rules this brand imposes.**
- Brushed, never polished. Achromatic concrete — never tint it.
- The mark is a whisper on the object and a shout on paper. Do not swap them.
- Two colours only in the logo, and there is no white one.
- **Slime is the ration.** In the object world it appears nowhere; in the paper world it is everything. One slime element inside an otherwise monochrome scene is the most obvious unexploited move in the brand — and it is the reconciliation the founder asked for.
- No health, efficacy or performance claim appears anywhere in the archive. None may appear in a frame.

**Cautions.**
- **A large amount of the artwork is AI-generated with garbled type** — nonsense words baked into renders, side-wraps, pouch concepts and every lighter render. They are placeholders, not copy, and they introduce orange and cyan, which are not in the palette. Never reproduce them.
- **Several files in that folder are the contractors' own portfolio samples** and will mislead anyone scanning by filename: a hair dryer, a prosthesis, a carbon-fibre study, a radiator, belts, a candle rocker, a studio portfolio, and a Chinese supplier's commodity catalogue. None are Puff Junction. Out of scope.
- **Three accounts of how the graphic is applied disagree** — the brief says etched, the source object is embossed relief, the renders show it flush. Take flush-darker; that is what the hero renders show.
- The drawings call R3 on the block; the renders read visibly larger. Spec says R3.
- Three different heights appear in the archive. Use **57.2mm** — the assembled figure from the manufacturer's own bill of materials.
- The five `Rhino_*` files are not five products; they are surface iterations of one pouch body. `Rhino_Loose` is the chosen one, and it is the **slimmest and tightest-necked of the five** — the brand's preferred silhouette is the least inflated one.
- The first machined sample was brushed nickel, not brass. Early CAD shows a purely cylindrical grinder before the concrete cube existed. Neither is the brand.
- **Arnet is licensed commercial** — three weights at €85 each. Work Sans is on Google Fonts and is free.
- Nothing shipped. The website stalled at an interactive prototype; the grinder reached production samples and paused; the lighter never left CAD. Treat the archive as a rich unfinished kit of parts.
## 6. The frames

### 6.1 What a frame is

A frame is one composition on a 16:10 stage, built from authentic materials, that exists nowhere in the source. It is not a screenshot, not a product shot, and not a whole screen. It is one idea, at one scale, lit once.

The first version shipped thirteen and several were thin. **Twelve here, and depth is the point** — a frame that cannot survive the brick test is not replaced with a lighter one, it is built properly or cut. Better eleven real frames than twelve with a cartoon in the set.

Laws, per frame:

- **One subject.** If you can't say what the frame is in four words, it has two subjects.
- **Built from at least two named materials**, each citing a source file in `SOURCES.md`.
- **A declared focal point** as `x%,y%`. The phone crop is a band around it and nothing important falls outside that band.
- **A 6–10 second loop** whose easing is a property of the material — metal turns at constant velocity, fabric settles with deceleration, an interface state snaps.
- **A resting state** that works alone, for `prefers-reduced-motion` and for `screens/`.
- **No word that the source doesn't say.** Section 8.9.

### 6.2 The set

Order is the gallery order. Frame 1 lives in the hero.

| # | id | source | the composition | interactive |
|---|---|---|---|---|
| 1 | `knurl-wall` | PUFF JUNCTION | the diamond knurl at architectural scale | no |
| 2 | `ground-line` | Antaeus | the mark grounded, then lifted, over a horizon | no |
| 3 | `blackout` | DARKEST SHADES | the lens as the entire field | no |
| 4 | `iris-seam` | AESDR | one gradient line crossing a cream field | yes |
| 5 | `waffle` | DIGS | the knit at wall scale, a seam running through it | no |
| 6 | `harlequin` | PUFF JUNCTION | the checkerboard dissolving across an elevation | no |
| 7 | `prismatic` | DARKEST SHADES | the mark cast as a shadow, travelling | no |
| 8 | `tech-pack` | DIGS | a technical drawing calling itself out | yes |
| 9 | `tortoise` | DARKEST SHADES | acetate lit from behind | yes |
| 10 | `margin` | AESDR | a page annotating itself in handwriting | no |
| 11 | `reconciliation` | PUFF JUNCTION | monochrome, and one green thing | no |
| 12 | `live-edge` | Antaeus | a wire being switched off, in three beats | yes |

### 6.3 The frames in detail

**1 · `knurl-wall` — PUFF JUNCTION.** The diamond cross-knurl at roughly 400%, running edge to edge with no object around it: a field of brass diamonds, point-up, 1.15:1, grooves crossing at 49°, flat brushed crowns with a small radius, V-grooves with rounded bottoms. The whole frame is the 230-level swing from `#0A0602` in the groove bottoms to `#E8DCB8` on the crowns. A single soft raking light travels slowly across the field, and as it passes the centre it catches the **0.2mm whisper deboss** — the `puff` lockup surfacing for a moment out of the metal and going back under. Materials: knurl geometry (measured, 1.26mm pitch scaled up), two-value brass, the deboss's three terraces. *New because:* the knurl has never been the subject; it has only ever been a band on a knob. Loop 9s, constant velocity — metal doesn't ease. Focal `50%,50%`.

**2 · `ground-line` — Antaeus.** The bright cool field with the real graph paper on it: 34px navy grid at 8%, the blue wash at `12% 0%`, the orange at `88% 8%`, the vignette dissolving the grid at the edges. Across the lower third, a ground line. The Grounded-A stands on it at architectural scale, exact path data, stroke from the ladder. Then it **lifts** — `translate(1 -7) rotate(6 24 24)`, opacity to `.42`, 500ms on `cubic-bezier(.2,.7,.2,1)` — floats, and settles back. The ground line never moves. Materials: the verified 48-viewBox paths, the stroke ladder, the lift transform, the field recipe. *New because:* the auth gate does this at 118px as a login affordance; here it is a horizon and the mark is a building. Loop 8s. Focal `50%,58%`.

**3 · `blackout` — DARKEST SHADES.** A field of `#151515` that fills the frame and that you genuinely cannot see through. One broad soft sheen band wipes across it, lower-left to upper-right, at `#4A–#6A`, 30% of the width, very soft edges. One small hard specular dot near the top. Set into the lower band, small, in Owners Wide caps: **`See Everything. Reveal Nothing.`** Materials: the two-element lens recipe, the tagline verbatim. *New because:* the lens stops being a component of a product and becomes the surface. Loop 10s — the sheen crosses once, slowly. Focal `50%,50%`.

**4 · `iris-seam` — AESDR.** Cream `#FAF7F2`, nothing on it but a single 1px iris hairline running the full width at `opacity .15`, shimmering at `4s linear` on `background-size: 300% 100%`. As the gradient's bright stop passes a point on the line, a word in **Playfair Display italic 900** ignites above it, holds, and goes out — one word at a time, four or five in the loop, all real copy. **Leponeus sits at `inline` scale at the right edge, in `doctrine`, watching.** Hovering holds the current word lit and pauses the line. Materials: the exact seven-stop iris, the shimmer timing, Playfair italic 900, the mascot at a named size. *New because:* the iris is always an accent on something; here the ration is the composition. Loop 8s. Interactive: hover holds. Focal `50%,46%`.

**5 · `waffle` — DIGS.** The thermal knit at wall scale: the half-drop lattice of raised crossings with a dark pinhole at each cell centre, yarn families at ±45°, built as two offset diagonal line families plus a shadowed dot grid. High micro-contrast, low macro-contrast, no gloss. A single **overlock seam** runs diagonally across the frame as a raised ridge three or four cells wide, seam allowance pressed to one side, bright crest and soft shadow on the far side — and along it, the **seam-highlighter wash**: a pale halo bleeding out from the ridge into broad tonal cloudiness. The light shifts slowly from raking to flat, and the whole plane travels from `#4C493E` to `#ADA595` as it does. Materials: measured knit geometry and colour range, the overlock ridge, the wash. *New because:* the fabric becomes architecture and the wash becomes weather. Loop 10s, decelerating — fabric settles. Focal `44%,50%`.

**6 · `harlequin` — PUFF JUNCTION.** The dissolving checkerboard taken off the block and laid flat as an elevation. Cells at the real pitch — 13–14mm on point scaled to the frame — squares rotated 45°, corner to corner, no outlines, no gutters. Dense at the left edge, thinning diagonally with a **ragged staircase front**. The dark cells are `#414141` on `#565656` concrete: a value shift on the same material, matte, flush, catching the same light, over the full concrete texture stack — cloudy mottling, aggregate speckle, the faint troweled streak. The staircase advances and retreats; **cells drop out and return individually**, never fading. Materials: harlequin geometry and pitch, the achromatic concrete recipe. *New because:* on the product this is a corner detail at 13mm; here it is the whole wall and you can watch it eat. Loop 9s. Focal `38%,50%`.

**7 · `prismatic` — DARKEST SHADES.** The founder's unbuilt catalogue idea, built. The `#D2D2D2` seamless sweep, nothing on it, and the **angular mark cast as a hard-edged shadow** travelling slowly across the surface — the verified ten-vertex polygon, its two offset notches slicing the light as it passes. The shadow obeys the brand's own shadow discipline everywhere it isn't the subject: soft, wide, never more than 8–10% darker than the ground. Materials: the verified path, the studio grey, the shadow rule. *New because:* it was quoted, scoped, deferred, and never made. Loop 10s, constant. Focal `50%,54%`.

**8 · `tech-pack` — DIGS.** A technical flat that draws itself. Black-line construction on white with soft grey diagonal drape strokes, the pipe-separated style string as a sub-header, and **red leader lines with arrowheads extending one at a time** to caps callouts carrying real point-of-measure values — neckband height 1″, cuff height 2″, half chest at 1″ below underarm, seam allowance 3/8″. Rib drawn as a hatch of fine parallels, hems as double dashed lines, trims keyed with small coloured circular tokens. Hovering a callout holds it and dims the others. Materials: the real graded spec, the real layout system, the real style code. *New because:* a tech pack is a static document; this one is annotating itself. Loop 9s, snapping — a drawn line arrives, it doesn't ease. Interactive: hover isolates. Focal `50%,50%`.

**9 · `tortoise` — DARKEST SHADES.** Blue tortoise acetate at macro, and lit from behind. A near-black ground at `#131313–#1A273A` with cobalt-periwinkle flecks at `#5B8CCF–#6495D0` as irregular organic blobs — never a repeating pattern — and the whole plate **translucent**, so a light source behind it makes the flecks glow and pushes the edges to `#93B5BF–#A7BEC6`. The backlight drifts; where it sits, the material opens up. Dragging moves the light. Materials: the measured fleck palette, the translucency behaviour, the edge-glow range. *New because:* the deck never goes macro on this surface, and it is the richest material the brand owns. Loop 10s. Interactive: drag the light. Focal `50%,50%`.

**10 · `margin` — AESDR.** A page annotating itself. Body text at `line-height: 2` with `padding-right: 220px`, and a 200px right rail behind a **2px `#C53030` left border** where **Caveat handwriting in red ink** arrives line by line — real annotations, in the voice that owns that face. In the body, strikes land at `text-decoration-thickness: 2px` in `#C53030` and inserts arrive crimson with a crimson underline. **Leponeus at `inline` scale in `diagnosis`**, bottom right. Materials: Caveat as a voice, the two-reds distinction, the strike and insert treatment, the mascot. *New because:* the rail exists as a component of a shipped artifact; here the annotation is the event and you watch it happen. Loop 10s. Focal `62%,50%`.

**11 · `reconciliation` — PUFF JUNCTION.** The frame that does the thing the brand asked for and never got. The white sweep, measured exactly: flat `#EDEDED` across the width, holding to 40% height, falling to `#C8–#CD` at 70%, lifting to `#D5–#DD` at the floor. One soft key from upper front. A concrete-and-brass composition in it — achromatic `#565656`, two-value brass, the circle-in-square at 74% coverage, the contact shadow broad and feathered at `#BB–#CB`. Entirely monochrome. And **exactly one element in slime `#D6FD4A`**, small, rationed, arriving late in the loop and holding. Materials: the concrete recipe, the two-value brass, the slime hex, the measured sweep. *New because:* the founder wrote the brief for this in October 2024 — *"subtly from a vibrant and somewhat playful neon feel to a subtler, more refined aesthetic"* — and nobody built it. It is also the clearest argument the page can make about what we do. Loop 10s. Focal `50%,52%`.

**12 · `live-edge` — Antaeus.** A wire being switched off, and the switch is the subject. A slim rail carries a breathing forest dot on a 3.2s loop, a serif count, and a short stack of hairline-separated lines, one of them holding a 3px orange left rule. Click and it goes off in **three visible beats**: everything goes `grayscale(1) opacity .3` **in place** while the dot stops breathing, *then* the rail folds `translateX(-101%)`, *then* the hairline left behind is plainly dead. Click again and it is the exact mirror — slides out grey, then wakes, lines re-inking on staggered delays of `.05/.14/.23/.32/.41/.5s`. Materials: the three-beat choreography, the rail construction, the forest and orange roles. *New because:* almost nothing in software makes *off* legible as a state rather than an absence, and putting that on a page that sells mockups is the single best demonstration of craft in the set. Loop: none at rest; the interaction is the loop. Interactive: click. Focal `22%,50%`.

### 6.4 Held in reserve

Built only if a frame above fails and is cut — not added to make thirteen.

- **The climb** (Antaeus) — a vertical ladder where the part already passed is drawn in forest and the part ahead is hollow, each rung stamped. A maturity state as an integral over time.
- **The coverage bar** (Antaeus) — `flex:120` forest butted against `flex:30` ochre with no gap and no internal radius, a quantity rendered as a measured object rather than a chart.
- **The gathered pouch** (PUFF JUNCTION) — the `Rhino_Loose` silhouette, slimmest of the five iterations, with its 185mm concealed brass scoop.
- **The scalloped digitisation path** (DIGS) — the wordmark wrapped in its embroidery stitch boundary, that bumpy contour drawing itself.

### 6.5 Balance check

Three PUFF JUNCTION, three DARKEST SHADES, two DIGS, two AESDR, two Antaeus. Four interactive. Four built primarily from a physical material, four from a graphic system, four from an interface. Two frames — `prismatic` and `reconciliation` — build something a founder explicitly asked for and never received, which is the most honest thing this page can show a stranger about what we do.
## 7. Page structure

Content order is identical across all three variants:

1. Hero: wordmark, slogan, sub-line, button, and frame 1 live.
2. Gallery intro line, then the frames in the fixed order.
3. How it works: three steps. This is a genuine sequence, so numbering is allowed here.
4. The offer.
5. The form.
6. Footer.

Default wireframe (variant A; B and C restage the gallery only):

```
+-----------------------------------------------+
| shapshyftrs                                   |
| See it before you build it.                   |
| sub-line                                      |
| [ Send us the idea ]                          |
|                                               |
|   ############ frame 1, full stage #########  |
+-----------------------------------------------+
| Everything below is ours. Built by us,        |
| rebuilt here as teasers.                      |
+-----------------------------------------------+
|   ############ frame 2 ####################   |
|   caption                        source label |
+-----------------------------------------------+
|   … the rest of the set …                      |
+-----------------------------------------------+
| How it works                                  |
| 1 Tell us the idea.   2 We build it.          |
| 3 You get a link.                             |
+-----------------------------------------------+
| What you get        What it isn't             |
| price line                                    |
+-----------------------------------------------+
| Send us the idea                              |
| [form]                                        |
+-----------------------------------------------+
| shapshyftrs, 2026. email                      |
+-----------------------------------------------+
```
## 8. Copy (locked)

Unchanged from the first version except 8.3 and 8.8. `${PRICE}`, `${TURNAROUND}` and `${CONTACT_EMAIL}` are substituted by `build.py` from `config.json`.

### 8.1 Hero

- Wordmark: `shapshyftrs` (lowercase, always, everywhere)
- Slogan (default): `See it before you build it.`
- Slogan alternates, selected by `config.slogan`: `Tell us the idea. See it by Friday.` / `We make ideas visible.`
- Sub-line: `You have an idea for an app, a tool, a product page. We turn it into a mockup you can click through. ${PRICE}, one round of changes, delivered as a link in ${TURNAROUND}.`
- Button: `Send us the idea` (scrolls to the form)

### 8.2 Gallery intro

`Everything below is ours. Built by us, rebuilt here as teasers.`

This line is now literally true in a way it was not before, and it is the page's whole argument. Do not change it.

**On the two words.** The visitor reads "teasers"; the build calls them frames. That is deliberate — "teaser" is what the thing is to someone who has never seen it, "frame" is what it is to whoever has to build it. Do not reconcile them by editing this line.

### 8.3 Captions

| # | id | caption |
|---|---|---|
| 1 | knurl-wall | Brass, at four hundred percent. |
| 2 | ground-line | A mark that stands on a line. |
| 3 | blackout | A lens you cannot see through. |
| 4 | iris-seam | One line, seven colours. |
| 5 | waffle | A knit, and the seam through it. |
| 6 | harlequin | A pattern eating a wall. |
| 7 | prismatic | A logo, cast as a shadow. |
| 8 | tech-pack | A drawing that calls itself out. |
| 9 | tortoise | Acetate, lit from behind. |
| 10 | margin | A page marking itself up. |
| 11 | reconciliation | Monochrome, and one green thing. |
| 12 | live-edge | A wire switching off. |

Caption rules, for anything not in the table: a short declarative sentence, sentence case, ending in a period. It names what the frame is, never what it means. No adjectives of quality — nothing is "beautiful", "premium", "crafted". No verbs of persuasion. If a caption could appear under a different frame, it is too vague.

### 8.4 How it works

Heading: `How it works`

1. `Tell us the idea.` `Three sentences, who uses it, the screens you want to see.`
2. `We build it.` `Three to five screens, one flow, fake data, in your colors if you have them.`
3. `You get a link.` `Click through it, send it to whoever needs to see it. One round of changes included.`

### 8.5 The offer

Heading: `What you get`
`Three to five screens. One flow. Fake data. A link you can share. One round of changes.`

Heading: `What it isn't`
`It isn't software. No accounts, no database, no real users. It's the thing you show your boss, your co-founder, or the developer you're about to pay.`

Price line: `${PRICE}, paid up front. Delivered in ${TURNAROUND}.`

### 8.6 The form

Heading: `Send us the idea`

| Label | Placeholder | Type | Required |
|---|---|---|---|
| Your name | | text | yes |
| Email | | email | yes |
| The idea | Three sentences is plenty. | textarea | yes |
| Who uses it | The person, not the market. | text | yes |
| The screens you want to see | Up to three. | textarea | yes |
| Anything else | Colors, links, a sketch. Optional. | textarea | no |

Button: `Send the idea`
Sent state (mocked): `Sent. Next: pay ${PRICE} here and we start.` followed by a link reading `Pay ${PRICE}` to `config.stripe_url`.
Error state, per empty required field: `Add your name and send again.` / `Add your email and send again.` / `Add the idea and send again.` / `Add who uses it and send again.` / `Add the screens and send again.`

### 8.7 Footer

`shapshyftrs, 2026. ${CONTACT_EMAIL}`

### 8.8 Source labels

- Antaeus frames: `Antaeus GTM OS` (linked when `config.source_links.antaeus` is set)
- AESDR frames: `AESDR` (linked when `config.source_links.aesdr` is set)
- `PUFF JUNCTION` / `DARKEST SHADES` / `DIGS` when `config.show_brand_names` is true; otherwise omitted
- If `config.show_source_names` is false, all labels are omitted.

A source label is the brand's name and nothing else. No descriptor, no year, no category, no "a brand we built".

### 8.9 Product copy inside frames

Separate from page copy and governed by rule 4. Any words that appear inside a frame as part of a product — a label on a package, a line in an interface, a tag on a garment — are **verbatim from the source material**, cited in `SOURCES.md`, or they do not appear. Lorem is not allowed; neither is plausible-sounding invention. Where a real product surface carries text you cannot source, leave the surface blank and log it.

### 8.10 Copy rules for anything not covered above

Sentence case. Active voice. No exclamation marks. No "→". No "we're excited", "we'd love to", "let's". No rhetorical questions. A button says what happens when it is pressed, and the confirmation uses the same verb.
## 9. Page chrome

The page's own design system exists so that five brand worlds can share one room without fighting. It should be nearly invisible. Everything striking on this page belongs to a frame.

Pinned:

- Ground `#000000`. Primary text `#F4F4F0`. Secondary text `#8E8E89`. **No page accent** — color belongs to the frames. Button: `#F4F4F0` fill, `#000000` text, no border.
- Type: one family for the entire chrome, used by none of the five sources. Default Schibsted Grotesk (Google Fonts): 400 body, 600 headings and captions, 700 wordmark. If you swap it, write one line in `DESIGN.md` saying why. It may not be Inter, Roboto, Helvetica, Arial, Space Grotesk, or any face in the five source sets.
- Scale, px / line-height: body 15/24; sub-line 18/28; captions 22/28; section headings 32/36; slogan 64/1.02 desktop and 40/1.05 mobile; wordmark 28 in a header, 120 or larger if a variant gives it a hero treatment. Tracking: display -0.02em, body 0.
- Measure: copy blocks no wider than 66 characters. Left-aligned. Only the hero and single-frame stages may center.
- Spacing on an 8px base. Section rhythm at least 96px desktop, 64px mobile.
- Radii: 0 across the chrome except the button. Frames carry their own radii from their source tokens.
- No cards, no borders around sections, no dividers between them. Space and scale do the separating.

Free axes, choose and log: fixed or static header; button radius (4 or pill); whether the source label sits inside the frame or beneath it.

Chrome motion: one orchestrated moment on load (wordmark, then slogan, then frame 1 starts; under 1.2s total). Nothing else in the chrome animates on scroll. No fade-and-slide-up on sections. Hover states on buttons and links only.

## 10. Motion and interaction

- Loops: per frame, 6–10s, ease-in-out or one custom cubic-bezier chosen per material — a metal turn is constant-velocity, a fabric settle decelerates, an interface state snaps. Motion is a property of the material, not a decoration on top of it.
- Offscreen frames pause (IntersectionObserver, threshold 0.25). On-screen, they play. Hover pauses. `prefers-reduced-motion: reduce` swaps every loop for its resting frame; interactions still work, with instant state changes.
- Interactive frames: pointer and keyboard both, visible focus, state change instant or under 300ms, never blocking the loop from resuming. Hit targets tile at the control's own pitch — overlapping boxes silently steal each other's clicks.
- Scroll behavior is per variant (section 11). No scroll hijacking beyond CSS scroll-snap in variant A and the horizontal track in variant C.
- Frame budget: 60fps on a 2020 laptop. Animate transforms and opacity only. `will-change` only on the element that is moving. Reach for canvas or WebGL when a material genuinely needs it — a real mirrored lens, a real turned metal surface — and say so in the material's header.
- Weight: each variant under 900KB excluding fonts. The limit is higher than the first version because real materials cost more than cartoons; it is still a limit. Generated texture plates are at most 512×512 and inlined as WebP or as a `<canvas>` recipe, whichever is smaller.
- Fonts through one `<link>` per variant, only the listed weights, `display=swap`.

### 10.1 Typefaces

Real typeface names come from each source's study. **No source repo contains font files**, so a real licensed face can only be used if it is also served by Google Fonts or is already licensed for web use.

The rule: name the real face in the token set. If it cannot be served, pick the nearest available face on metrics — x-height, width, contrast, terminal treatment, not vibe — and record the pair in a substitution table in `DESIGN.md`: real face, stand-in, what is lost. Never substitute silently, and never let a stand-in change a lockup's proportions; if the real face is wider, set the stand-in tighter to match the measured lockup width.

## 11. The three variants

Shared: every line of copy, every frame, the chrome tokens, the form. Different: how the gallery is staged and how the page moves. Build A first; B and C reuse everything.

### A. Keynote

One frame per viewport, full-bleed stage. Vertical `scroll-snap-type: y proximity` (not mandatory). Each section: the caption fades in first (400ms), then the loop starts. The hero is the wordmark and slogan over frame 1 at full stage. "How it works" and the offer each get their own snapped stage with the same restraint. Below 768px: snap off, everything stacked.

### B. Wall

Dense. Two columns on desktop, three at 1440px and up, one on mobile. Frames at native 16:10. Captions set small and left underneath like a museum label: caption line, then source label on the next line, both in the chrome face. A continuous black wall with gaps no larger than 24px. Compact hero: wordmark, slogan, sub-line, button in the top 40% of the viewport; the wall starts below the fold. Loops play only for frames in view.

### C. Reel

A horizontal strip. Hero above; "How it works", the offer and the form below, all in normal vertical flow. The strip scrolls sideways on wheel and drag by translating the track; native vertical scroll stays intact everywhere else. Each frame is a 16:10 card with its caption beneath, 70vw wide on desktop, 32px gaps, snapping to cards. A thin position indicator under the strip with one tick per frame (a sequence, so allowed). Below 768px the strip becomes a vertical stack.

## 12. Form and payment (mocked in v1)

- Real markup, real client-side validation, mocked submission: on a valid submit, replace the form with the sent state and the payment link from section 8.6.
- Leave a `TODO` comment where the POST goes later (a Cloudflare Worker or Supabase; out of scope now).
- Payment: `config.stripe_url`. If empty, the link points to `#` and reads the same.
- No spam-protection widgets in v1.

## 13. Floors

- Responsive from 320px to 1920px. Check at 390, 768, 1440.
- **Nothing in a frame is sliced by the mobile crop.** Every frame declares a focal point; the phone crop is a band around it. Type inside a frame is either fully inside that band or outside the frame's content entirely. Measure it — a text node whose ink is under about 97% visible inside the frame box is sliced, and sliced type is the single most common way a composition dies on a phone.
- Keyboard: every interactive element reachable; visible focus ring in `#F4F4F0`.
- Contrast: chrome text on black meets AA; captions meet AA. Decorative text inside a frame is exempt; captions are not decorative.
- Reduced motion honored everywhere, including the load sequence.
- Semantic HTML: one `h1` (the wordmark), sections with headings where the copy has them, every form label bound to its input.
- No console errors. No network requests other than fonts. No `id` collisions and no global leaks across frames — every frame is instantiable twice on one page (the contact sheet does exactly that).
## 14. Build order

Seven phases. Commit at the end of each with the phase in the message. Do not start a phase before the one before it is committed.

**Phase 0 — scaffold.** The tree in section 4. `build.py` with the include, token, material and frame directives. `extract.py` (PDF text, image color sampling, STEP outline extraction). `screenshot.py`, with a font guard that fails loudly rather than silently rendering in Times. `config.json`, `sources.local.json` template, `.gitignore`. A blank page that builds and opens.

**Phase 1 — the studies.** The phase the first version skipped. For each of the five sources, open the material and write `study/<source>.md`:

- what the products actually are, and what the brand actually claims, in its own words
- every color, quoted with the file it came from
- the real typefaces and their roles
- the marks and their construction, with real path data or real proportions
- every material and finish, described at the fidelity of section 4.4
- the render, photography or interface language: ground, light direction, shadow character, camera, crop, grade
- the eight to twelve strongest ingredients for new composition
- the contradictions, the work-in-progress, and the things the source does not say

`extract.py` earns its keep here: pull text out of the brand PDFs, sample real hex values off the renders rather than eyeballing them, pull silhouettes out of the CAD. Look at every render with your own eyes; a study written from filenames is not a study. Output `tokens/` and the first half of `SOURCES.md`.

**Phase 2 — the materials.** Build `materials/`. Each recipe is verified against its source: render it, capture it, put it beside the source file at the same size, and iterate until the difference is in the composition and not in the material. Write what is still wrong in the recipe's header. A material that has not been compared side by side is not done.

This phase is where the page either becomes real or becomes another set of cartoons. It is worth more time than it looks like it needs.

**Phase 3 — the frames.** Build the set from section 6, in order, each as a standalone file. Run the three tests (4.3) on each and write the answers into `SOURCES.md` as you go, not afterwards. Build the contact sheet. Then review the whole set together, at size, on a black wall: anything that reads as drawn-from-memory next to the others goes back to phase 2.

**Phase 4 — variant A.** Page shell, chrome tokens, all copy from section 8, the form, the footer. The full keynote staging.

**Phase 5 — variants B and C.** Reuse everything; restage the gallery only.

**Phase 6 — QA.** Section 15, every line, with measurements. The reduced-motion pass, the 390px pass, the keyboard pass, the double-instance pass. Capture `screens/`. Finish `ASSUMPTIONS.md` and `README.md`.

**Phase 7 — the adversarial read.** Hand the finished build to a reader whose instruction is to refute it: to find the frame that is a cartoon, the color that was eyeballed, the claim the source does not support, the composition that is a crop of an existing asset, and the type that is sliced on a phone. Fix what is real. Record what was refuted and what survived.

## 15. Acceptance checklist

The build is done when every line is true and each has a measurement or a file reference behind it.

**Fidelity**
1. Every source has a study in `study/`, written before its first frame was built.
2. Every color in `tokens/` cites the file it came from. No color was eyeballed.
3. Every material in `materials/` has a side-by-side comparison note and an honest statement of its limits.
4. Every frame passes the brick test: at least two named authentic materials, each with a source file.
5. Every frame passes the new test: the composition exists nowhere in the source material.
6. Every frame passes the truth test: no claim, spec, feature or line of product copy that the source does not support.
7. No contractor's name appears anywhere in the repo. No out-of-scope brand appears anywhere.
8. Nothing in `dist/` is a photograph, render or screenshot of a product placed in a layout.

**Page**
9. All three variants build from one command, open from the filesystem, and carry identical copy.
10. Copy is verbatim from section 8; every cut is logged.
11. Chrome passes rule 10's list, reviewed line by line in `DESIGN.md`.
12. The gallery runs the full set, in order, on all three variants, with a caption and a source label on every frame.

**Behavior**
13. Every frame loops between 6 and 10 seconds, pauses offscreen, pauses on hover, and resumes.
14. `prefers-reduced-motion: reduce` gives every frame a resting state and keeps every interaction working.
15. Every interactive frame works by pointer and by keyboard, with a visible focus ring and hit targets that do not overlap.
16. Every frame renders twice on one page with no id collision, no global leak and no console error.

**Floors**
17. At 390px, no frame has sliced type; every focal subject is inside the crop band.
18. At 1440px, no variant scrolls horizontally, and variant A's hero fits the viewport at 900px tall and at 700px tall.
19. Each variant is under 900KB excluding fonts.
20. `screens/` was captured from the final build, with real fonts, not a fallback face.

## 16. Decisions already made

- The page still sells the mockup service. The offer, the price, the form and section 8's copy are unchanged from the first version.
- The internal sales cockpit is out of scope entirely. It is not a source, it is not a frame, and it is not mentioned.
- The repository stays private. Only `dist/` is ever published — `study/` and `SOURCES.md` index private codebases by path and name real asset files.
- `${PRICE}` is `$75`, `${TURNAROUND}` is `3 days`, both from `config.json`.
- The stage is `#000000` and the chrome has no accent of its own.
- The first version's thirteen teasers are superseded. Reuse nothing from them except the build tooling, the stage stylesheet and the section 8 copy. A frame that survives from v1 must be rebuilt against its source study and re-pass the three tests, or it goes.

### 16.1 Two things flagged rather than decided

**DIGS is in scope, provisionally.** The doctrine names "PUFF JUNCTION, DARKEST SHADES, AESDR and the Antaeus app." The instruction before it named "pj, digs, darkest shades." DIGS is scoped in here as a fifth source because it has the hardest data of any of them — a real graded spec, real Gerber pattern files, measured fabric colour — and because it was named in the correction. If it should come out, frames 5 and 8 are cut and the reserve list covers the gap. Ask once, early; do not hold the build for it.

**Typefaces are a licensing question, not a design one.** Across the five sources: Antaeus and AESDR run entirely on Google Fonts and are free and exact. DIGS's Alexandria is on Google Fonts; **The Old Falcons is a demo cut**. Darkest Shades's **Owners Wide and Stolzl are commercial retail faces with no licence on record**, and its wordmark may be a modified cut that should be recreated from the vector rather than typeset at all. Puff Junction's **Arnet is licensed at €85 per weight, three weights, €255** — and it is italic-only by system. Section 10.1 sets the rule: name the real face, substitute on metrics, record every substitution with what is lost. If web licences exist for any of these, say so and the stand-ins come out.

## 17. Variables (`config.json`)

```json
{
  "price": "$75",
  "turnaround": "3 days",
  "contact_email": "",
  "slogan": "See it before you build it.",
  "stripe_url": "",
  "asset_policy": "hybrid",
  "chrome_font": "Schibsted Grotesk",
  "show_source_names": true,
  "show_brand_names": true,
  "source_links": { "antaeus": "", "aesdr": "" }
}
```

`build.py` substitutes `${PRICE}`, `${TURNAROUND}`, `${CONTACT_EMAIL}`, `${SLOGAN}`, `${PAY_HREF}`, `${CHROME_FONT}` everywhere, including inside frames. An empty value renders as an empty string and never as the literal token.
