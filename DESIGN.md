# Design: the token plan

Phase 1 of the build (brief section 14). The page's own chrome, the four source token sets, one wireframe per variant, and the review of every chrome choice against rule 10. Values marked transcribed come from a real source file (`SOURCES.md` part B names the file for each); pinned values are the brief's; derived values are ours.

## 1. Chrome tokens

The chrome exists so six looks can share one room. It should be nearly invisible. Its tokens live in `tokens/chrome.css` and its rules in `partials/chrome-styles.html`.

### Color

| Token | Value | Status |
|---|---|---|
| ground | `#000000` | pinned |
| primary text | `#F4F4F0` | pinned |
| secondary text | `#8E8E89` | pinned |
| button | `#F4F4F0` fill, `#000000` text, no border | pinned |
| accent | none; color belongs to the teasers | pinned |
| focus ring | 2px `#F4F4F0`, offset 3px | pinned (brief 13) |
| form field border | 1px `#8E8E89`, `#F4F4F0` on focus | derived |

### Type

One family for the entire chrome: **Schibsted Grotesk** (Google Fonts), 400 body, 600 headings and captions, 700 wordmark. Not swapped: it is a grotesk with enough of its own character to sit beside six other type systems without echoing any of them, and it is not on the brief's banned list.

| Role | px / line-height | Weight | Tracking |
|---|---|---|---|
| body | 15 / 24 | 400 | 0 |
| sub-line, gallery intro, price line | 18 / 28 | 400 | 0 |
| captions (variants A and C) | 22 / 28 | 600 | -0.02em |
| captions (variant B, museum label) | 15 / 24 | 600 | 0 |
| section headings | 32 / 36 | 600 | -0.02em |
| slogan | 64 / 1.02 desktop, 40 / 1.05 mobile | 600 | -0.02em |
| wordmark | 28 in a header; 120 or larger in a hero treatment (variant A: `clamp(56px, 8.4vw, 120px)`) | 700 | -0.02em |
| step headings, form labels | 15 / 24 | 600 | 0 |
| source label | 15 / 24 | 400, secondary text | 0 |

The wordmark is always lowercase: `shapshyftrs`.

### Layout

- Measure: copy blocks no wider than 66 characters (`--chrome-measure: 66ch`). Left-aligned. Only the hero and single-teaser stages may center.
- Spacing on an 8px base (`--chrome-unit`). Section rhythm 96px desktop, 64px mobile (`--chrome-section`, `--chrome-section-m`). Side gutter `clamp(20px, 5vw, 72px)`.
- Radii: 0 across the chrome except the button (`--chrome-button-radius: 4px`). Teasers carry their own radii from their source tokens.
- No cards, no borders around sections, no dividers between them. Space and scale do the separating.
- Form: a single column, max 560px, labels above fields, one button.

### Principles

1. The stage is `#000000` and shared by all thirteen teasers; it is what makes six looks read as one gallery.
2. The chrome has no accent. Anything colored on the page is a teaser.
3. One orchestrated moment on load (wordmark, then slogan with its copy and button, then teaser 1) in under 1.2s. Nothing else in the chrome animates on scroll. Hover states on buttons and links only.
4. Copy is verbatim from brief section 8. Numbers appear only where the content is a sequence.
5. Every chrome choice is checked against rule 10 (section 4 below), and the shared stage against it too.

### The three free axes

| Axis | Decision | Why |
|---|---|---|
| Fixed or static header | **Static.** There is no header bar at all: the wordmark is the `h1` in the hero and appears nowhere else. | A fixed bar carrying a wordmark and a button is the thing every dark landing page has. The page has one job and one button; the button is repeated at the form, where the visitor already is. |
| Button radius, 4 or pill | **4px.** | The chrome's only soft corner should be small. A pill reads as consumer-app friendliness and would compete with the pills inside the GTM OS teasers, where they are a token. |
| Source label inside the frame or beneath it | **Beneath.** In A and C it shares the caption's line, quiet, right-aligned; in B it is the museum label's second line. | The stage is true black edge to edge; anything inside the frame becomes part of the composition and reads as a watermark. Beneath, in the chrome face, it stays quiet and the stage stays pure. The brief's 6.1 diagram sketches it inside the box, but section 9 makes it a free axis. |

## 2. The four source token sets

Headline values only; every value, with its mark, is in the token file named. Each file opens with the list of source files read.

### 2.1 GTM OS, dark glass (`tokens/gtmos.css`, prefix `--gtm-`)

The repo's shipped direction is bright (a pale field, navy ink, orange) and its only dark language is a legacy shell in one stylesheet. The brief pins dark glass, so the pinned values win as the visual language and the supporting values are transcribed from the legacy shell and the current rooms.

| Group | Values | Status |
|---|---|---|
| base | `#0a0e27` | pinned |
| depth ladder | raised `#111637`, elevated `#181d45` (mirroring the legacy ladder's steps `#0a0e1a → #0f172a → #1e293b` on the pinned hue) | derived; the legacy ladder transcribed |
| text tiers | `#ffffff`, `#e2e8f0`, `#94a3b8`, `#64748b` | transcribed |
| accent | coral `#ff6b6b`; soft `rgba(255,107,107,0.14)`, glow `rgba(255,107,107,0.45)` at 24px | pinned; tints derived |
| cool secondary | teal `#2dd4bf` (light `#5eead4`, dark `#14b8a6`) | transcribed |
| borders | rest `rgba(255,255,255,0.1)`, hairline 0.08, fills 0.03 and 0.06 | transcribed |
| glass borders | `rgba(255,255,255,0.22)` rest, 0.30 on the one forward element | derived (brief 6.3 asks 20–30%) |
| glass | source panel `rgba(15,23,42,0.78)`; stage fill `rgba(16,22,58,0.62)`, fallback `#141a45`; blur 14px (16px strong) | transcribed; fill derived; blur transcribed |
| specular | source strips `linear-gradient(145deg, .05 → .02 white)`; stage specular `135deg, .10 → .02 → transparent at 60%`; inner highlight `inset 0 1px 0 rgba(255,255,255,0.18)` | transcribed; derived |
| depth | perspective 1200px, rotateX 8°, rotateY -6° | derived (no tilt exists in the product) |
| radii | 6 / 10 / 16 / 22 / full (legacy); pills 20px, cards 13px, tiles 10px, chips 6px, account chips 12px (current rooms) | transcribed |
| devices | 3px left rule, 3px bottom edge, 4px bar on a 0.06 track, 40×5px heat bar, 7px dot | transcribed |
| type | Outfit 500/700 (display), Plus Jakarta Sans 400/600 (UI), Space Mono 400 (data) | pinned (the repo names the faces, never the weights) |
| sizes | display 24/1.25/-0.01em; body 15/1.6; label 13; kickers 10.5 at 0.16em and 9.5 at 0.08em, uppercase; chips 11 and 12.5; numeral 11 | transcribed |
| motion | standard `cubic-bezier(0.2,0,0,1)`, settle `cubic-bezier(0.22,0.61,0.36,1)`, 120/200/320/450ms, 40ms stagger | transcribed |
| loop | material curve `cubic-bezier(0.55,0,0.15,1)` (glass, the slowest), default 9s | derived |
| counts | ten rail segments (real); six decay steps and a 99 ceiling (real); seven phases and nineteen nodes (the brief's; the product has 22 rooms in six stages) | transcribed / pinned |

### 2.2 AESDR, editorial (`tokens/aesdr.css`, prefix `--aes-`)

| Group | Values | Status |
|---|---|---|
| paper and ink | cream `#FAF7F2`, ink `#1A1A1A`, crimson `#8B1A1A`, muted `#6B6B6B`, light `#E8E4DF`, card `#ffffff` | transcribed |
| lesson palette | white / black, mid `#636060`, `#F2EEE9`, `#E5E1DC`, lines at 0.08 and 0.15; amber `#D94F00`, cobalt `#0038FF`, coral `#FF3200`, green `#00B85A` | transcribed |
| the iris | `linear-gradient(90deg, #FF006E 0%, #FF6B00 17%, #F59E0B 34%, #10B981 51%, #38BDF8 68%, #8B5CF6 85%, #FF006E 100%)`, 200%/300% background, linear slide at 2/3/4/8s, high-contrast fallback crimson | transcribed |
| the iris as sheen | `120deg` through `#F4B8CF`, `#E7C99B`, `#A9DCD8`, `#B9B4E8`, `#F0D9A3`, for a glow only | derived (the brief's pearlescent direction; not in the repo) |
| rules | 1px `#E8E4DF` hairline; 2px iris rule; 1px ambient iris at 0.15; 3px crimson left rule; 2px black lesson rules; 4px iris stripe | transcribed |
| radii | 0 ("sharp corners"), 999 for dots, 4px on deck shadow cards | transcribed |
| surface | shadows `0 1px 2px .04, 0 8px 24px .06`; dog-ear 28→52px, 225° gradient; progress track 80×2px `#E5E1DC`; nodes 16px, 2px border, glow `0 0 12px rgba(139,26,26,.2)` | transcribed |
| stage seating | `0 30px 60px rgba(0,0,0,0.6)`; a stronger glow `0 0 24px rgba(139,26,26,.35)` | derived |
| type | Abril Fatface 400 (display), Cormorant Garamond 400/500/500i (body), Barlow Condensed 500/600 (labels), DM Mono 400 (numbers) | pinned |
| sizes | display `clamp(22px, 3.2vw, 46px)`/1.05/-0.01em; H2 48/1.1; titles 22/1.2/.01em; lede 18/1.65; body 16/1.6/0; labels 14/1.2/.15em uppercase; eyebrows 10/1.4/.25em; footnotes 9/1.85/.1em; counters 12/.2em; progress labels 9/.16em | transcribed |
| Cormorant sizes | 17px / 1.62 | derived (no production basis for the face) |
| motion | peel 650ms `cubic-bezier(.7,0,.2,1)` with a 450ms fade; screen rise 420ms `cubic-bezier(.22,1,.36,1)`; progress 800ms `cubic-bezier(.4,0,.2,1)`; typing 32ms + 18ms jitter; dissolve 600ms / blur 12px / scale 1.04; cursor 2px crimson at 0.8s; node 0.3s, line 0.5s | transcribed |
| loop | material curve = the deck's `cubic-bezier(.7,0,.2,1)` (paper turns, it does not glide), default 8s; underline sweep 650ms; title crossfade 400ms | transcribed curve; durations derived |
| counts | twelve courses (real); seven markers (the brief's); three simulator stages (real) | transcribed / pinned |

### 2.3 The cockpit, instrument (`tokens/cockpit.css`, prefix `--ckp-`)

The source is bright by its own rule. What carries across is the real palette (the amber as the warm signal, red only for a real alarm), the ink ladder and hairlines as alphas, the tick and rule geometry, the sizes, and the snappy motion. The graphite ground and the gauge geometry are derived.

| Group | Values | Status |
|---|---|---|
| ink ladder | 1 / 0.66 / 0.42 / 0.22; rule 0.16; hairlines 0.14 and 0.07; rings 0.30 and 0.28 | transcribed (as alphas) |
| graphite | ground `#15171a`, panel `#1c1f24`, sunk `#0f1113`; foreground `#e9ebee`; the ladder re-applied as white alphas | derived |
| warm signal | amber `#f59e0b`; half `rgba(245,158,11,0.45)`; soft 0.12; halo 0.16; ember `#b6791a`, deep `#8a5a00` | transcribed |
| alarm | red `#ef4444`; glow `rgba(220,38,38,0.5)` | transcribed |
| ticks and rules | 4×11px tick, 1px radius, 7px lead; 3px gauge rule, 2px radius; 8px burn bar, 4px radius; 6px meter; 5px zone; 5px nodes, 8px current with 2px border; 32px board nodes; 2px connectors; 1.5px dotted halo at 7px; 7px lamp with 3px halo | transcribed |
| bevel and ticks on the stage | minor 0.22 white, major 0.42; bevel 1px `rgba(255,255,255,0.1)` over 1px `rgba(0,0,0,0.5)`; needle 2px; arc 240° | derived |
| radii | 4 / 8 / 12 / 99; chips 3px, stamps 4px, folds 7px, lane 10px | transcribed |
| spacing | 4, 8, 12, 16, 20, 24, 32, 40, 48; wings 180px and 200px; lane 380px | transcribed |
| type | IBM Plex Sans 400/600, IBM Plex Mono 400 | derived (see `ASSUMPTIONS.md`) |
| sizes | body 15/1.6; label 13/600; kickers 10.5 at 0.16em, 10 at 0.14em, 11 at 0.08em, 9 at 0.16em and 0.2em, uppercase; digits 14/700 tabular with 8.5px units; numeral `clamp(34px, 5vw, 60px)`; reason 12.5; whisper 10.5/1.35 | transcribed |
| the score | 0–100, cut lines at 45 and 70, confidence factors 0.85 and 0.7; three heat levels; queue cap 6; slot cap 2 | transcribed |
| motion | 120/200/320ms; standard `cubic-bezier(0.2,0,0,1)`; burn 0.4s; throb `1s steps(2,end)`; spring 160ms from -4px; breathe 2.4s; ring pulse 1.9s ease-out to 1.45 | transcribed |
| loop | material curve = the standard ease (the snappiest), default 7s; needle step 320ms | transcribed curve; durations derived |

### 2.4 NRDI, three identities (`tokens/nrdi.css`, prefixes `--nds-`, `--npj-`, `--ndg-`)

Real brand files exist for all three, so there is no provisional file. None ships a digital design system; values are either printed in a guide, sampled or measured from a rendered page or render, or derived. Where a brand left something undefined, the derived line sits alone so a real value drops in by editing that one line.

**DARKEST SHADES**

| Group | Values | Status |
|---|---|---|
| palette | black `#000000`, white `#FFFFFF`; gold `#C9AA78` and its brushed gradient (the file itself calls the gold approximate) | transcribed |
| surfaces in use | ground `#060606`, phone `#0E0E0E`, studio `#424149`, paper `#F1F2F1`, plate `#D2D2D2`, greige `#BEB2A2`, graphite `#545454`, copper `#BF835E` | transcribed (sampled) |
| text on dark | white; `rgba(255,255,255,0.62)` for kickers and body | transcribed / derived |
| materials | gloss acetate `#0A0A0A` lit to `#2A2A2A`; blue tortoise `#101C3C` with `#3A55B0` flecks; red tortoise `#403434` with `#8A1E1E`; steel `#555555`; lenses blackout `#373737`, smoke `#232428→#5E626B`, mirror `#808185`, cyan `#83B8C6`, amber `#D5BB46`, pale `#9FB3BF` | transcribed (sampled) |
| nine swatches | nine models: seven real frame-and-lens pairings, two derived (matte black `#141414`; graphite `#545454`) | transcribed / derived |
| the silhouette | model 08: front 154, lens 56×44, bridge 20 with a 10mm keyhole, temple 153×13, front 4mm thick; view 35° yaw, 10° pitch | transcribed |
| stage | key from upper-left (real); floor `#0A0A0A`, reflection 0.18 fading over 40%, contact shadow 0.6 at 24px, lens flare 0.35 at 30° blurred 12px, brow streak 0.6 at 2px, grain 3.5% | transcribed / derived |
| radii | 0 (the outline button); 999 (pills); 1px outlines | transcribed |
| type | Owners Wide → Archivo width 125, 700 headlines, 500 wordmark; Stolzl → Manrope 400/600; uppercase display and wordmark | derived faces; casing transcribed |
| wordmark | `DARKEST SHADES`, uppercase, 0.12em tracking, 0.3em word space, clear space 2.34 cap heights | derived tracking; clear space transcribed |
| motion | loop linear (constant), 8s; the light sweep `cubic-bezier(0.4,0,0.2,1)` over 2.4s; recolor 240ms | derived |

**PUFF JUNCTION**

| Group | Values | Status |
|---|---|---|
| palette | Slime `#D6FD4A`, Dream `#A5E4FF`, Flamingo `#FF8FF1`, Pineapple `#FEF200`, white, black; on black the ink is Slime | transcribed |
| materials | studio concrete `#656565` / `#595959` / `#464646`, brass `#CDBFAB` highlight, `#8C6E34` mid, knurl `#64461E`–`#493015` (sampled); stage restatement concrete `#5E5E5E` / `#4E4E4E` / `#3A3A3A`, seam `#1A1A1A`, brass `#B08D57`, brushed `#E3CFA0`, specular `#F6EDD8`, knurl `#9A7434` / `#5A3E1B`, rim `#7A5A2A` | transcribed / derived |
| the object | block 85×85, halves 20.9 tall, R3 corners; cap 22 tall, flange Ø62.75, drum Ø55×10, 2mm chamfer, top Ø50.83; knurl 2.11×2.48; view 30° yaw, 20° pitch | transcribed |
| stage | key above and slightly in front (real); floor glow 0.08 over 0.9 widths, reflection 0.22 fading by 0.5, key light 0.10, rim `rgba(255,236,190,0.55)` at 1px | transcribed / derived |
| the guide's controls | button outline 2px, hard shadow `5px 4px 0 #000`, radius 4px; panel radius 12px, 1px keyline; halftone pitch 9px; texture rotated -13° | transcribed (measured) / derived |
| type | Arnet (italics only) → Archivo italic width 120, 900 and 700; Work Sans 500/700 (real); the guide's hierarchy H1 96/92 … body 18/28, caption 13/16, overline 10/12, headings uppercase | derived face / transcribed |
| wordmark | `puff` lowercase heavy italic at 22px, -0.02em; `JUNCTION` uppercase 8px, 0.25em, 3px below, right-aligned to 85% of the puff width; Slime | casing and geometry transcribed; sizes derived |
| motion | loop linear (constant), 8s, one full rotation; rest at 30° yaw | derived |

**DIGS**

| Group | Values | Status |
|---|---|---|
| palette | black `#000000`, blue `#0042e5`, light blue `#f0f5ff`, white | transcribed |
| garment | off white `#f8f0e8`, sand blue `#6077a4`, the sample's sage `#c9bc86`, embroidery navy `#24315a` (sampled); teaser garment off white with `#fdf7f0` lit and `#e4dbd2` shade, wash band 0.12 at 6px | transcribed / derived |
| the label | 3×2.25in (4:3), white, black wordmark at 40% width, two tiny lines, size word, a stitch inside the edge; rib texture 2px pitch `#ffffff` / `#f0f0ee` on `#fbfbfa`, stitch `#d9d9d6` inset 6% | transcribed / derived |
| the tag | 1:1.6 portrait, hole at 8% from the top, square corners, on a tack; card `#f0f5ff`, five back lines, black tack | transcribed / derived |
| garment construction | neckband 1in, cuff 2in, embroidery 2.5×1.58in, body 215gsm, rib 380gsm | transcribed |
| textures | knit honeycomb 3px pitch, lit cells +6%, shadow -8%; rib 4px pitch, +10% | derived |
| stage | key from upper-left at 0.18, floor `#0A0A0A`, no reflection (matte), contact shadow 0.45 at 24px | derived |
| radii | 0 | derived (nothing rounded is defined) |
| type | Alexandria 400 (real, all text, tracking 0); wordmark Alexandria 900 at -0.05em, lowercase; The Old Falcons → Permanent Marker 400, rotated -4°, 1.5× the wordmark width, rising 4° | transcribed / derived |
| motion | loop linear (constant), 8s; tag turn `cubic-bezier(0.45,0,0.2,1)` over 2.8s with a 3° settle | derived |

### 2.5 One easing per material (brief 10)

| Material | Curve | Character | Default loop |
|---|---|---|---|
| glass (GTM OS) | `cubic-bezier(0.55, 0, 0.15, 1)` | the slowest: a long ease in, a long ease out | 9s |
| paper (AESDR) | `cubic-bezier(0.7, 0, 0.2, 1)` (the deck's own) | a page turns: it commits, then lands | 8s |
| instrument (cockpit) | `cubic-bezier(0.2, 0, 0, 1)` (the product's standard ease) | the snappiest: state changes, then holds | 7s |
| product (NRDI) | `linear` | constant: a turntable, a light pass | 8s |

## 3. Wireframes

Content order is identical across all three (brief section 7). Teaser 1 lives in the hero on every variant. The gallery carries all thirteen in the fixed order on every variant (brief section 7 lists the hero and the thirteen as separate items), so teaser 1 appears twice on every page: once live in the hero without a caption, once in the gallery with its caption and source label.

### A. Keynote

One teaser per viewport on a full-bleed stage; `scroll-snap-type: y proximity`; the caption fades in (400ms), then the loop starts. Below 768px: snap off, everything stacked.

```
+------------------------------------------------------------------+  viewport 1
|  shapshyftrs                                       (wordmark, 120) |
|  See it before you build it.                        (slogan, 64)   |
|  You have an idea for an app, a tool, a product page. We turn     |
|  it into a mockup you can click through. $75, one round of        |
|  changes, delivered as a link in five days.          (sub, 18/28)  |
|  [ Send us the idea ]                                              |
|                                                                    |
|   #################### teaser 1, full stage ####################   |
|   #################### (16:10, plays after 700ms) ##############   |
+------------------------------------------------------------------+  viewport 2
|                                                                    |
|  Everything below is ours. Built by us, rebuilt here as teasers.   |
|                                                                    |
+------------------------------------------------------------------+  viewport 3
|                                                                    |
|   ###################### teaser 2 (16:10) ######################   |
|   ##############################################################   |
|   A lesson, typeset.                                AESDR, aesdr.com|
|                                                                    |
+------------------------------------------------------------------+  viewports 4–14
|   … teasers 3 to 13, one per snapped stage, caption left, source   |
|     label right on the same line, beneath the frame …             |
+------------------------------------------------------------------+  viewport 15
|  How it works                                                      |
|  1 Tell us the idea.     2 We build it.        3 You get a link.   |
|    Three sentences, …      Three to five …       Click through …   |
+------------------------------------------------------------------+  viewport 16
|  What you get                     What it isn't                    |
|  Three to five screens. One …     It isn't software. No …          |
|  $75, paid up front. Delivered in five days.                       |
+------------------------------------------------------------------+
|  Send us the idea                                                  |
|  Your name  [__________]                                           |
|  Email      [__________]                                           |
|  The idea   [__________]  …  [ Send the idea ]                     |
+------------------------------------------------------------------+
|  shapshyftrs, 2026. hello@shapshyftrs.com                          |
+------------------------------------------------------------------+
```

### B. Wall

Dense. Compact hero in the top 40% of the viewport, teaser 1 full width beneath it; the wall starts below the fold. Two columns, three at 1440px and up, one on a phone; native 16:10 tiles; gaps 24px; museum labels beneath each (caption line, then source label, both small, both in the chrome face). Loops play only in view.

```
+------------------------------------------------------------------+
|  shapshyftrs                                        (wordmark, 28) |
|  See it before you build it.                        (slogan, 64)   |
|  You have an idea for an app, a tool, a product page. …  (18/28)   |
|  [ Send us the idea ]                                              |
|                                                    -- 40% of vh -- |
|   #################### teaser 1, full width ####################   |
+------------------------------------------------------------------+
|  Everything below is ours. Built by us, rebuilt here as teasers.   |
+------------------------------------------------------------------+
|  ############ 2 ############  24px  ############ 3 ############    |
|  ############################      ############################    |
|  A lesson, typeset.                Nine frames.                    |
|  AESDR, aesdr.com                  NRDI, DARKEST SHADES            |
|                                                                    |
|  ############ 4 ############        ############ 5 ############    |
|  ############################      ############################    |
|  Lead heat on one dial.            A signal, scored in seven …     |
|  an internal sales cockpit         GTM OS, antaeus.app             |
|                                                                    |
|  … 6 and 7, 8 and 9, 10 and 11, 12 and 13 (three across at 1440)  |
+------------------------------------------------------------------+
|  How it works                                                      |
|  1 Tell us the idea.     2 We build it.        3 You get a link.   |
+------------------------------------------------------------------+
|  What you get                     What it isn't                    |
|  $75, paid up front. Delivered in five days.                       |
+------------------------------------------------------------------+
|  Send us the idea   [form]                                         |
+------------------------------------------------------------------+
|  shapshyftrs, 2026. hello@shapshyftrs.com                          |
+------------------------------------------------------------------+
```

### C. Reel

Hero above in normal flow; a horizontal strip of thirteen 16:10 cards, 70vw wide, 32px gaps, snapping to cards; the strip moves sideways on wheel and drag by translating the track and native vertical scroll stays intact everywhere else; a thin indicator with thirteen ticks beneath; "How it works", the offer and the form below in normal flow. Below 768px the strip becomes a vertical stack.

```
+------------------------------------------------------------------+
|  shapshyftrs                                       (wordmark, 120) |
|  See it before you build it.                                       |
|  You have an idea for an app, a tool, a product page. …            |
|  [ Send us the idea ]                                              |
|   #################### teaser 1, full width ####################   |
+------------------------------------------------------------------+
|  Everything below is ours. Built by us, rebuilt here as teasers.   |
+------------------------------------------------------------------+
|   ########## 1 (70vw) ##########  32px  ########## 2 ######### ##  |
|   ##############################        ###################### ##  |
|   A call that branches.  GTM OS, …      A lesson, typeset.  AES…   |
|                                                                    |
|   ‾‾  ‾‾  ‾‾  ‾‾  ‾‾  ‾‾  ‾‾  ‾‾  ‾‾  ‾‾  ‾‾  ‾‾  ‾‾   (13 ticks)  |
+------------------------------------------------------------------+
|  How it works                                                      |
|  1 Tell us the idea.     2 We build it.        3 You get a link.   |
+------------------------------------------------------------------+
|  What you get                     What it isn't                    |
|  $75, paid up front. Delivered in five days.                       |
+------------------------------------------------------------------+
|  Send us the idea   [form]                                         |
+------------------------------------------------------------------+
|  shapshyftrs, 2026. hello@shapshyftrs.com                          |
+------------------------------------------------------------------+
```

## 4. The rule-10 review

The question for every chrome choice: would I have made this for any dark landing page? Where the answer was yes, the choice changed. The review ran over `tokens/chrome.css`, `partials/chrome-styles.html`, `tokens/stage.css`, and the three variant skeletons.

### 4.1 Choices that changed

| Choice as first made | Would I have made it for any dark landing page? | What changed and why |
|---|---|---|
| "How it works" set the step number as a big grey numeral (22px, secondary text) beside each heading. | Yes. The oversized grey step number in a three-column grid is the default "3 easy steps" block. | The numeral is now inline at the heading's own size, weight and color (`1 Tell us the idea.`), exactly as the brief's wireframe writes it. The number stays because the content is a sequence; it stops being a decoration. `partials/chrome-styles.html`, `.step-n`. |
| The button pressed down 1px on `:active`. | Yes. Press theater is a reflex, not a decision. | Removed. Brief 9 allows hover states on buttons and links only. `partials/chrome-styles.html`. |
| The hero staggered four beats on load: wordmark, slogan, then sub-line and button as a fourth beat. | Yes. Cascading every hero element in is the standard dark-landing entrance. | The load moment is the brief's three beats and no more: wordmark, then slogan (the sub-line and button arrive on the slogan's beat), then teaser 1. All three variants. |
| Variant A faded the source label in 200ms after the caption. | Yes. A trailing fade on the secondary line is the "stagger everything" habit. | The source label no longer animates; only the caption arrives (400ms), then the loop starts, as brief 11.A says. `variants/a-keynote.html`. |
| The button radius was a literal `4px` in the stylesheet. | Not a tell, but it was an undocumented choice. | It is now a chrome token (`--chrome-button-radius: 4px`) and a logged free axis (section 1). |

### 4.2 Choices reviewed and kept, with the reason

- Form fields as 1px `#8E8E89` outlines on black with no fill and 0 radius. A bordered field on black is the plain honest field; the alternatives (a tinted near-black fill, a bottom rule only) are both on the tell list.
- Source label as a link without an underline until hover. It is a whisper; an underline would make it louder than the caption. The hover underline keeps it honest as a link.
- Links elsewhere underlined at 1px, 2px on hover. Underlines are the plain form of a link, and hover on links is allowed.
- The wordmark's hero treatment in A and C at up to 120px. The brief names this size for a hero treatment; the wordmark is the page's only display object.
- Two columns for "What you get / What it isn't". The brief's wireframe sets them side by side; they collapse to one column on a phone.
- The scroll-snap (A), the horizontal track (C), and the three-tick-wide reel indicator. All specified by brief 11 and 10.
- Inverted `::selection`. Functional, invisible until used.

### 4.3 Rule 10, bullet by bullet, against the chrome and the shared stage

| Rule 10 bullet | Chrome | Shared stage (`tokens/stage.css`) |
|---|---|---|
| no cream ground with a serif display and a terracotta accent | Ground `#000000`, one grotesk, no accent. | Stage `#000000`; the cream, serif and gradient that exist belong to the AESDR teasers, on their own tokens. |
| no tinted near-black standing in for black | `--chrome-ground: #000000`; nothing in the chrome uses `#0B0B0B` or `#111`. | `.stage { background: #000000 }`, not tinted; the graphite `#15171a` and navy `#0a0e27` are teaser panels sitting on the black, never the stage. |
| no single bright acid or vermilion accent; the page has no accent of its own | No accent token exists; the button is `#F4F4F0` on `#000000`; the focus ring is `#F4F4F0`. | The stage carries no color; coral, amber and Slime are teaser tokens. |
| no broadsheet hairlines and newspaper columns | No borders around sections, no dividers; the only rules are form-field outlines. | The stage draws no border or rule; the crop is a clip, not a frame. |
| no identical rounded cards with the same grey shadow, no gradient washes | Radii 0 except the button; no cards, no shadows, no gradients anywhere in the chrome. | The stage has no radius, shadow or wash; teasers light their own subject with one source from their own tokens. |
| no tracked-out ALL-CAPS eyebrow labels above headings | Every heading is sentence case with nothing above it. | Not applicable; captions are set by the variant in the chrome face, sentence case. |
| no meta strings joined with middle dots, no "WORD — fragment" labels | Captions and source labels are plain sentences and plain names separated by a comma, as brief 8.8 writes them. The contact sheet uses commas and full stops. | Not applicable. |
| no monospace for small labels in the chrome | One family, Schibsted Grotesk, for everything in the chrome; mono appears only inside the GTM OS, AESDR and cockpit teasers where it is their token. | Not applicable. |
| no "→" on links or buttons | `Send us the idea`, `Send the idea`, `Pay $75`; nothing appended. | Not applicable. |
| no single word in a headline set in a different color or italic | The slogan and headings are one weight, one color, upright. | Not applicable. |
| no numbered markers except where the content is a sequence | Numbers appear on the three steps (a sequence) and the reel's thirteen ticks (a sequence, allowed by brief 11.C); nowhere else. | Not applicable. |

Beyond the bullets, the stage was checked against brief 6.1: true black edge to edge, 16:10 native, the 4:5 crop below 640px of the teaser's own width around the declared focal point, loops paused off-screen and on hover, resting frames under reduced motion. It passes.
