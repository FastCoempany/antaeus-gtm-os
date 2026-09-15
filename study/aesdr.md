# AESDR — Visual Language Source Report

Repo: `/home/user/fastcoempany/aesdr` (Next.js 16 / React 19 / Supabase / Stripe, deployed to Vercel as `aesdr.com`). 98 routes, ~8,500 lines of CSS modules, a formal token file, a mascot canon, an 18-glyph icon system, and five "rendered surface" reference PNGs. This is an unusually well-documented brand for a product repo — the canon files are binding and enforced by ESLint + a `canon-check.mjs` grep script + a PR checklist.

---

## 1. THE PRODUCT

**AESDR = AE + SDR.** Account Executive and Sales Development Representative — the two front-line B2B SaaS sales roles. It is a **self-paced, one-time-purchase interactive sales course for people in their first two years in those seats.**

**What it actually is, from the code:**
- **12 courses / 36 lessons.** Each lesson is a standalone HTML app (`content/lessons/html/lesson-01/…lesson-12/`) mounted in `app/course/[lessonId]/page.tsx` as a **full-screen fixed-position iframe**. Lessons are 22–32 minutes and are interactive — checklists, drag-to-place schedule builders, a cold-call simulator, timeline accordions — explicitly *not* video.
- **A role fork.** On landing, a visitor picks AE or SDR. The choice is stored (anonymous → `sessionStorage`; member → Supabase `user_metadata.role`) and threads through the whole product: branched landing copy, branched terminal lines, role-conditional lesson content (`[data-role="ae"] .sdr-only { display: none }`), reordered curriculum, and a pre-highlighted pricing tier.
- **Accountability gates ("MVI standards").** The stated core principle: *"Nothing passes without proof of real engagement with another human being."* Gates require a 120+ character written answer, a character counter, and a post-submission **attestation checkbox** whose accountability clause renders in the iris shimmer so "the learner feels the gravity of clicking 'I did this.'"
- **Seven+ "substantial assets" you keep.** Standalone downloadable HTML tools in `tools/standalone-html/`: the AE/SDR Alignment Contract, the IDK Framework, the Time Reclaimed Calculator, the ROI & Commission Defense Tracker, the 72-Hour Strike Plan, the Manager Archetype Map, the CRM Survival Guide, the Async Cadence Template.
- **A finale ceremony.** Complete all 12 → `/reveal` → "Choose your keeper" → pick one of two personalized artifacts (**The Programme**, a theatre playbill; or **The Manuscript**, a redlined draft). The unchosen one is sealed and separately purchasable.
- **Pricing:** $249 SDR individual, $299 AE individual, Team = quoted. One-time, not a subscription, lifetime access, 14-day no-questions refund.
- **Three business arms:** the consumer course (`/`), `/enterprise` (a B2B subsidiary with its own canon and promoted-iris palette), and `/affiliates` (a workshop-first affiliate program with its own 62KB brand canon).
- **Currently invitation-gated.** `/coming-soon` is a full-screen "Invitation only." gate; access is by pasted invite code or waitlist email.

**Core objects/nouns the code operates on:** `lesson` (1–12) · `screen` (position within a lesson) · `gate` · `role` (`ae` | `sdr`) · `course_progress` (`is_completed`, `last_screen`) · `artifact` / "keeper" (`playbill` | `redline`) · `reveal_picks` · `artifact_unlocks` · `tier` · `affiliate` / `candidate` / `workshop` / `free_leads`. Two authored **voices** (Rowan, Michael) are treated as first-class design objects with their own type and color assignments.

**Value proposition in its own framing:** *"The operating manual, not the motivation engine."* It is positioned against motivational sales courses, live cohorts, employer LMS modules, and LinkedIn/community advice — the four "shapes" it names on its own comparison section.

---

## 2. SURFACES AND MATERIALS AT BUILD FIDELITY

### The field
One theme only. `:root { color-scheme: light; }` is set deliberately — there is no dark mode, and the comment says it exists to stop iOS/Android form controls and scrollbars from rendering dark.

- **Page field:** `--cream: #FAF7F2` — a warm off-white, not paper-white.
- **Card field:** `#fff` pure white, used for cards *sitting on* cream. The cream/white relationship is the primary figure-ground device (a `#fff` card on `#FAF7F2` is a ~1.5% luminance step — very quiet).
- **Third field:** `rgba(0,0,0,0.02)` — a nearly invisible tint used for the FAQ cards and the terminal block. Hovers to `rgba(0,0,0,0.04)`.
- Scrollbars are globally hidden (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`).

### Corners
**Radius is zero.** Across all of `app/` and `components/`, `border-radius` appears 23 times: 17 are `50%` (dots, timeline nodes, mascot-adjacent circles, warning circles), one is `999px` (the library "date due" stamp), three are `2px` (small mono badges), one is `4px`. The token file states it outright: `"none": { "value": "0", "description": "Default. AESDR is editorial — sharp corners." }`

### Borders vs shadows
**Borders carry all structure.** Shadows are rare, soft, and mostly reserved for things meant to feel like physical paper.

- Default card border: `1px solid var(--light)` (`#E8E4DF`).
- Emphasis border: `1.5px solid var(--light)` (price cards) or `2px solid var(--ink)` (the featured/comparison "this one" column).
- Iris border, the signature trick — a double-background so a gradient can be a border:
  ```css
  border: 2px solid transparent;
  background:
    linear-gradient(var(--cream), var(--cream)) padding-box,
    var(--iris) border-box;
  background-size: auto, 300% 100%;
  animation: shimmer 4s linear infinite;
  ```
- Crimson left-rule: `border-left: 3px solid #8B1A1A` on a white panel — the standard "system speaking to you" aside (welcome-back banner, first-run orientation, enterprise doorway band).
- Actual shadows, when used:
  - Deck card: `0 1px 2px rgba(26,26,26,0.04), 0 8px 24px rgba(26,26,26,0.06)`
  - Crimson-tinted hover lift: `0 8px 28px rgba(139,26,26,0.08)` + `translateY(-2px)`
  - Library index card: `0 1px 2px rgba(42,27,14,0.08), 0 12px 28px rgba(42,27,14,0.10)` → hover `0 2px 4px …, 0 18px 36px rgba(42,27,14,0.16)`
  - Document paper (tools): a three-stop stack `0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06), 0 24px 48px rgba(0,0,0,.04)`
  - Terminal block: `0 2px 20px rgba(0,0,0,0.04)`

### Blur / glass
Used three ways, all restrained:
1. **Sticky nav:** `background: rgba(250,247,242,0.95); backdrop-filter: blur(10px);` with a `1px solid var(--light)` bottom border.
2. **Floating chips** (skip-link, fork label): `rgba(250,247,242,0.85)` + `blur(6px)` + `1px solid var(--light)`.
3. **Blur as redaction** — the most distinctive use: FAQ answer bodies ship at `filter: blur(5px)` with `user-select: none`, a centered mono overlay reading `[CLASSIFIED — HOVER TO PEEK]`, and both resolve on hover/focus (`filter: blur(0)`, overlay `opacity: 0`, 0.3–0.4s).

### Gradients
Exactly one gradient is a brand asset (`--iris`, below). Everything else is either a mask or a vignette:
- **Ambient iris line:** 1px full-width, `opacity: .15`, `background-size: 300% 100%`, `animation: shimmer 4s linear infinite`.
- **Scroll progress:** 2px iris bar pinned to `top: 0`, width driven by scroll.
- **Marquee edge fade:** `mask-image: linear-gradient(90deg, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%)`.
- **Dog-ear peel** on deck cards — a 28×28 corner rendered purely as a 225° gradient with hard stops (`#fff 48%, var(--light) 49%, rgba(0,0,0,0.06) 52%, var(--cream) 56%`), growing to 52×52 on hover.
- **Half-panel hover shade:** `linear-gradient(135deg, transparent 60%, rgba(0,0,0,0.04) 100%)` faded in at 0.25s.
- **Stage/desk vignettes** on the reveal panels: `radial-gradient(ellipse at 50% 30%, transparent 30%, rgba(0,0,0,.35) 100%)` and a warm spotlight `radial-gradient(ellipse at center, rgba(255,220,180,.20) 0%, transparent 70%)`.

### Texture (only two places, both deliberate)
1. **The syllabus page** layers three backgrounds for aged card-catalog stock:
   ```css
   background-color: #F4EADD;
   background-image:
     radial-gradient(ellipse at top, rgba(58,42,28,0.08), transparent 60%),
     repeating-linear-gradient(90deg, rgba(58,42,28,0.02) 0 2px, transparent 2px 28px),
     linear-gradient(180deg, #EFE2CC 0%, #E6D4B6 100%);
   ```
   Individual index cards then get faint red rule lines via `background-image: linear-gradient(...)` at `background-size: 100% 1.5em; background-position: 0 64px;`, a 1px red margin rule at `left: 48px`, and a **punched hole** at top-center rendered as a 14px radial-gradient circle with an inset shadow.
2. **The standalone tools** render ruled paper: `repeating-linear-gradient(to bottom, transparent 0 31px, var(--ruled) 31px 32px)` at `opacity: 0.5`, plus a 1px vertical margin line at `left: 72px`.

### Rotation as material
Tilt is a system, not an accident. `-2deg` classified stamp, `-4deg` library date stamp, `-3deg` cover stamp, `-0.5deg` Caveat handwriting, `-1.5deg` margin annotations, and `nth-child(even) { rotate(-0.25deg) } / nth-child(3n) { rotate(0.35deg) }` on the catalog grid so the cards read as physically stacked. Hover resets to `rotate(0deg) translateY(-3px)`.

### Framing marks
- **Corner brackets:** four 20×20 L-shapes, `border-width: 1px`, `border-color: rgba(0,0,0,0.06)`, inset 20px from each corner of a cream panel.
- **Ghost numeral:** Playfair 900 italic at `300px` (hero) or `clamp(180px, 35vw, 400px)` (zoom cards), `opacity: .06` on cream / `rgba(255,255,255,.06)` on crimson, positioned `bottom: -40px; right: -20px` so it bleeds out of the panel.

---

## 3. MARKS AND GEOMETRY

### The wordmark
`AESDR.` — Playfair Display, **italic**, weight 700–900, with a **trailing period**. The canonical SVG (`public/brand/asset-wordmark.svg`, mirrored in `components/brand/BrandAssets.tsx`) is:
- viewBox `0 0 720 220` (widened from 600 because the period was clipping)
- `<text x="20" y="160" font-size="180" font-weight="700" letter-spacing="-2">AESDR.</text>`
- Three tones: **ink-on-cream** (`#1A1A1A`), **cream-on-ink** (`#FAF7F2` on a `#1A1A1A` plate), **iris** (gradient-filled text via `<linearGradient>` with `<animate>` on x1/x2 over 6s).
- **Lockup:** a `180 × 2` iris rule directly beneath the wordmark, then `THE OPERATING MANUAL` in Space Mono 11px, letter-spacing 1.6, `#6B6B6B`.

In React the wordmark is usually not SVG but live text: `font-family: var(--display); font-weight: 900; font-style: italic; letter-spacing: .05em;` with iris background-clip and a 3–4s shimmer. Hero-scale: `font-size: min(clamp(80px, 18vw, 220px), 26vh); line-height: 0.85;`.

### The mascot — "Leponeus"
A **photoreal 3D iridescent rabbit-tortoise hybrid**: a domed tortoise shell in hexagonal scutes, four scaled tortoise legs, and a rabbit head with two long upright ears — everything rendered in overlapping pearlescent fish-scale texture in pastel blue / lilac / rose / mint, with a single teal-black eye and **one crimson band** looped around the head behind the ears (the only saturated color on the creature). Rendered as square transparent PNGs, `public/mascot/leponeus-{pose}.png`.

Eight canonical poses, each a distinct narrative state:
| Pose | What the artwork does |
|---|---|
| `doctrine` | three-quarter profile, standing, calm — the default brand impression |
| `diagnosis` | the honest-mirror pose (paired with the Redline artifact) |
| `sprint` | motion |
| `fall` | collapsed flat, head down, **a crimson crack running the length of the shell** |
| `recovery` | up again with **a small green sprout growing out of the shell** |
| `rest` | — |
| `verdict` | head-on, direct stare, the crimson band reading as a visor across the eyes, red glow behind one ear |
| `owner` | a crimson Playfair-italic **"A" branded onto the shell** |

Rules, enforced in the component types: **max one mascot per page** (canon scarcity); sizes come from a named 8-tier scale, not arbitrary numbers — `inline 40 · compact 160 · card 200 · panel 240 · welcome 280 · landing 320 · completion 360 · banner 420`; and **no anthropomorphizing** — "no waving, no thumbs, no smiling, no speech bubbles. 8 expressions only." Pose is mapped to lesson (`utils/brand/lesson-poses.ts`) so the dashboard mascot acts as a mood ring on student state (`doctrine` at 0 complete → the current lesson's pose → `owner` at 12).

### The icon set — 18 glyphs
`components/brand/Icon.tsx`. Spec, quoted:
> 64×64 viewBox, 4px clear-zone, 1.6px round-cap monoline. Stroke uses `currentColor`. Crimson reserved for change/loss/money glyphs (fall, recovery sprout, warn, refund) — hardcoded regardless of currentColor. Solid fills only on `cursor` and `quill`.

```jsx
<g fill="none" stroke="currentColor" strokeWidth="1.6"
   strokeLinecap="round" strokeLinejoin="round">
```

Names: `shell · ear · mile · iteration · fall · recovery · weight · ledger · hourglass · signal · eye · lock · cursor · warn · refund · discord · team · quill`.

**The recurring geometric motif is the shell arc** — a single quadratic dome that appears in three glyphs:
- `shell`: `M 6 50 Q 32 12 58 50 Z` + an inner hex plate `M 28 22 L 32 18 L 36 22 L 36 28 L 32 32 L 28 28 Z` at 45% opacity + two 45%-opacity leg strokes + a 25%-opacity base curve `M 12 46 Q 32 50 52 46`
- `fall`: same dome, with a crimson lightning crack `M 28 50 L 24 36 L 34 38 L 26 22` stroked `#8B1A1A`
- `recovery`: taller dome `M 6 54 Q 32 18 58 54 Z` with a stem `M 32 24 Q 30 14 32 4` and two crimson filled leaves

Secondary motif: the **rabbit ear**, `M 24 60 Q 18 16 36 4 Q 32 32 36 60 Z` with a 40%-opacity inner curve. And the **mile arc**, `M 6 52 Q 32 22 58 52` with a filled 2px dot at the start and a 2-stroke arrowhead at the end — "every mile looks the same."

### Dividers — four named variants
`components/brand/Divider.tsx`, each signalling a different kind of break:
- `dotted-path` — `<path d="M 0 4 Q 240 0 480 4" stroke-width="1.2" stroke-dasharray="2 6" stroke-linecap="round">` on a 480×8 viewBox. "lessons-flow rhythm."
- `iris` — a 2px gradient span, `background-size: 200% 100%`, `animation: iris-flow 8s linear infinite`.
- `hair` — 1px `#E8E4DF`.
- `meander` — a **Greek-key zigzag**, 480×12, 1px: `M 0 6 L 6 6 L 6 2 L 12 2 L 12 10 L 18 10 L 18 2 L 24 2 L 24 10 L 30 10 L 30 2 L 36 2 L 36 10 L 42 10 L 42 2 L 48 2 L 48 10 L 54 10 L 54 6 L 480 6`. "chapter-end mark."

### Other canonical marks
- **Terminal dots:** three 8×8 circles, `rgba(239,68,68,.35–.5)` / `rgba(245,158,11,.35–.5)` / `rgba(16,185,129,.35–.5)`, 4–13px apart.
- **Warning circle:** 16×16 or 18×18, 1px circle border, a single `!` in Space Mono 9–11px 700, crimson at ~50% on cream or `rgba(255,255,255,.4)` on crimson.
- **Cursor:** a solid crimson block — `2px × 1.1em` inline, or `7px × 14px` in the terminal — `animation: blink 0.8s step-end infinite`.
- **Money engravings** (the gate): a hand-drawn money bag `M38 18 Q50 8 62 18 L58 28 Q70 34 76 52 Q84 76 68 92 Q50 104 32 92 Q16 76 24 52 Q30 34 42 28 Z` with a cream fill, 2.4px ink stroke, an orange 3.4px tie, and a currency-green (`#2E7D32`) Playfair `$`. Bills are cream rects with a 1.6px ink outline and a `stroke-dasharray: 2 1.6` inner frame.
- **Skyline mask** (the gate): an entire city skyline expressed as one SVG `mask-image` path on a 190×90 viewBox, tiled `repeat-x` at 420px/640px for parallax layers.

---

## 4. THE DESIGN SYSTEM

### Color — every real value and its role

**Active palette** (`app/globals.css`, binding per `AGENTS.md`):
```css
--crimson:     #8B1A1A;  /* primary accent: CTAs, emphasis, hero-left panel, Michael's voice */
--cream:       #FAF7F2;  /* default page background */
--ink:         #1A1A1A;  /* default body text, Rowan's display color */
--muted:       #6B6B6B;  /* secondary text, mono labels, fine print */
--light:       #E8E4DF;  /* dividers, borders, low-emphasis surfaces */
--form-border: #928C84;  /* form resting border — 3.12:1 on cream, passes WCAG 2.1.11 */
--iris: linear-gradient(90deg,
  #FF006E 0%, #FF6B00 17%, #F59E0B 34%, #10B981 51%,
  #38BDF8 68%, #8B5CF6 85%, #FF006E 100%);
```

Real-world usage counts across `app/` + `components/`: `#1A1A1A` 351 · `#8B1A1A` 331 · `#6B6B6B` 288 · `#fff` 237 · `#FAF7F2` 223 · `#E8E4DF` 174. Everything else is in the tens or fewer.

**Secondary / local values that actually ship:**
| Hex | Where | Role |
|---|---|---|
| `#2E7D32` | admin tower, gate `$`, checkmarks | the only true green — "done / start / money" |
| `#C53030` | tools, Redline artifact | "red ink" — editor's pen, distinct from crimson |
| `#B8943E` / `#D4B96A` | syllabus, reveal star node, tool highlights | gold — "the keeper / the reward" |
| `#A68B4E` | Playbill artifact | antique theatre gold |
| `#6E1414` | tower `.primary:hover` | crimson pressed |
| `#15803D` | Redline "accepted" stamp | pass green |
| `#928C84` / `#B5B0A8` | forms | current / deprecated field border |

**Local sub-palettes** (each page that earns a metaphor declares its own scoped tokens):
- Syllabus / card catalog: `--catalog-cream #F4EADD · --catalog-card #FFF8EC · --catalog-deep #3A2A1C · --catalog-ink #2A1B0E · --catalog-mute #7A6A58 · --catalog-rule #CBB58C · --gold #B8943E`
- Standalone tools ("The Redline / Luxury"): `--parchment #FFFDF8 · --page #FFFFFF · --text #2C2C2C · --text-muted #8B8178 · --red #C53030 · --ruled #F0EBE3 · --margin-line #E8D4D4 · --gold-hl rgba(184,148,62,0.2)`
- Playbill artifact: `#F4EFE4` paper, `#A68B4E` gold rules, `#D8D0C0` warm grey, `6px double #A68B4E` marquee border
- Lesson player (iframed, its own world): `--white #FFFFFF · --black #000000 · --mid #636060 · --lite #F2EEE9 · --lite2 #E5E1DC · --amber #D94F00 · --cobalt #0038FF · --green #00B85A · --coral #FF3200 · --acid #C8FF00` and a **more saturated iris** `#FF006E, #FF6B00, #FFD600, #00E5A0, #0099FF, #7B2FFF`
- The gate: a **no-pink iris** — `--gateIris: linear-gradient(90deg, #FF6B00 0%, #F59E0B 22%, #10B981 45%, #38BDF8 68%, #8B5CF6 86%, #FF6B00 100%)`

**Retired and forbidden** (still present as iris stops and terminal dots only): `#020617 · #0B0B0F · #0F172A · #1E293B` backgrounds and `#10B981 --theme · #EF4444 --coral · #38BDF8 --cobalt · #F59E0B --amber · #8B5CF6 --violet` as surface colors.

### Iris reservation rules (binding, `AFFILIATE_BRAND_CANON.md` §6.4)
**Permitted:** the brand wordmark · the *single* primary CTA per surface · AE/SDR role tokens · thin ambient lines (1–2px max) · one iris-text payoff line per surface · the deck numeral.
**Forbidden:** whole headlines (accent words only) · any panel or card background fill · more than one iris CTA on a surface · decorative swirls/blobs/halos · icons (the deck numeral is the sole exception).

### Type — five stacks, five roles
```css
--display: 'Playfair Display', Georgia, serif;   /* headlines, role labels, masthead */
--serif:   'Source Serif 4', Georgia, serif;     /* all body copy */
--cond:    'Barlow Condensed', sans-serif;       /* UI labels, buttons, eyebrows, Rowan's display voice */
--mono:    'Space Mono', monospace;              /* terminal, classified, taxonomic labels */
--hand:    'Caveat', cursive;                    /* Michael's voice / margin annotations ONLY */
```
Loaded from Google Fonts in `app/layout.tsx`: Playfair Display `ital,wght@0,400;0,700;0,900;1,400;1,700;1,900`, Source Serif 4 `0,400;0,600;1,400`, Space Mono `400;700`, Barlow Condensed `400;500;600;700;800`, Caveat `400;600`. Forbidden: JetBrains Mono, Inter (except inside the lesson-player scope), Roboto, Open Sans, Lora.

**The signature weight is Playfair Display italic 900.** Nearly every headline in the product is italic.

**Type scale (from `figma-tokens.json` + live CSS):**
| Role | Font / weight | Size | Tracking | Leading |
|---|---|---|---|---|
| Wordmark XL | Playfair i900 | `min(clamp(80px,18vw,220px), 26vh)` | .02em | 0.85 |
| Hero headline | Playfair i900 | `clamp(36px, 5vw, 64px)` | -0.02em | 1.05 |
| Enterprise hero | Playfair i900 | `clamp(40px, 6.5vw, 76px)` | -0.02em | 1.05 |
| H2 / section | Playfair i900 | `clamp(32px, 5vw, 56px)` | -0.01em | 1.1 |
| H3 | Playfair i700 | `clamp(20px, 2.2vw, 26px)` | — | 1.2 |
| Zoom card (Rowan) | Barlow Cond 900 upper | `clamp(36px, 7vw, 80px)` | .03em | 1.05 |
| Zoom card (Michael) | Caveat | `clamp(22px, 3.5vw, 42px)` | — | 1.4 |
| Deck numeral | Barlow Cond 900 | 64px, iris-clipped, opacity .6 | — | 1 |
| Card title | Barlow Cond 700–800 upper | 18–22px | .03em | 1.2 |
| Lede | Source Serif | `clamp(16px,1.4vw,19px)` | — | 1.6 |
| Body | Source Serif 400 | 15–17px | — | 1.6–1.7 |
| Button | Barlow Cond 700 upper | 13–14px | **.15em** | 1.2 |
| Mono eyebrow | Space Mono 400–700 upper | **10px** | **.25em** (range .2–.35em) | 1.4 |
| Mono footnote | Space Mono 400 upper | 8–9px | .1–.2em | 1.85 |
| Terminal body | Space Mono 400 | `clamp(13px,1.8vw,17px)` | — | 1.8 |
| Handwriting | Caveat 400 | 15–22px | — | 1.3–1.4 |

The cadence is unmistakable: **tiny hyper-tracked mono eyebrow → enormous italic Playfair headline → quiet Source Serif body → uppercase condensed button.** That four-beat stack repeats on every section of every page.

### Spacing scale
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64` px. Section padding in practice: `100px 8%` (landing sections), `clamp(56px, 9vw, 112px) 0` (enterprise), `120px 8%` (final CTA). Containers: `1180px` max (enterprise/syllabus), `1100px` (comparison grid), `1000px` (pricing), `900px` (zoom cards), `820px` (document paper), `70ch` body measure, `60ch` subhead, `14ch`/`22ch` headline.

### Border widths
`hairline 1px` (default) · `icon 1.5px` · `outline 1.5px` (outline button) · `feature 2px` (featured card) · `icon stroke 1.6px` (SVG glyphs) · `3px` crimson left-rule · `6px double` (playbill marquee).

### Motion and easing
```css
@keyframes shimmer { from { background-position: 0% 50%; } to { background-position: 300% 50%; } }
@keyframes iris    { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
@keyframes blink   { 0%,100% { opacity:1 } 50% { opacity:0 } }   /* 0.8s step-end */
@keyframes drop    { 0% { top:-100% } 50% { top:0 } 100% { top:100% } }  /* 1.5s ease-in-out */
@keyframes ghostPulse { 0%,100% { opacity:.15; transform:scale(1) } 50% { opacity:.35; transform:scale(1.3) } }
```
- Iris shimmer is **4s linear infinite** at `background-size: 300% 100%` (or 3s at 200% in older surfaces).
- Micro-interaction: `transition: transform 0.15s, box-shadow 0.3s;` + `transform: translateY(-1px)` on hover. That's the universal button hover.
- Card peel: `transition: transform 650ms cubic-bezier(.7,.0,.2,1), opacity 450ms ease;`
- Panel swap: `.45s cubic-bezier(.4,0,.2,1)`
- Layer crossfade: `0.4–0.6s ease`
- Screen entry: `.42s cubic-bezier(.22,1,.36,1)` with `translateY(16px)`
- Accordion: `max-height .45s cubic-bezier(.4,0,.2,1)`
- Error shake: `0.35s ease` translating ±6px
- **Dual reduced-motion:** both the OS `@media (prefers-reduced-motion: reduce)` and an in-product `[data-reduce-motion="true"]` attribute collapse all animation to `0.01ms`. There's also `[data-larger-text="true"] { font-size: 112.5% }` and a `[data-high-contrast="true"] { --iris: var(--crimson) }` escape hatch (because the iris dips to ~1.9:1 at the amber stop).

### Focus
```css
:focus-visible {
  outline: 2px solid var(--crimson);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(139, 26, 26, 0.18);
}
[data-surface="dark"] :focus-visible {
  outline-color: var(--cream);
  box-shadow: 0 0 0 4px rgba(250, 247, 242, 0.22);
}
```

### Opacity constants
`ghost numeral .06` (on cream) / `.07` (white on crimson) · `ambient iris line .15` · `corner bracket .06` · `classified stamp body .25`, border `.15` · `muted card .78` · `locked timeline row .2 + blur(2px)` · `up-next row .5`.

---

## 5. THE INTERFACE LANGUAGE

### Layout archetypes (five, and they repeat everywhere)

**A. The editorial split (the signature).** `display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh;` — **crimson left / cream right.** Left: white text, mono eyebrow, a bordered "warning box" (`1px solid rgba(255,255,255,.2)`, mono title with a circled `!`, serif body), and a 300px ghost `01` at `opacity .06` bleeding off the bottom-right. Right: cream, mono label, an italic Playfair headline with **one** iris-shimmered accent word, a muted serif paragraph capped at 480px, an iris CTA plus an outline CTA, and four 20×20 corner brackets. This exact block is duplicated in four files (`LandingSequence.module.css`, `ExperienceLanding.module.css`, `welcome.module.css`, `variants/variant-a-editorial-split.html`).

**B. Controls-left / live-document-right.** `grid-template-columns: 380px 1fr; height: calc(100vh - 57px); overflow: hidden;`. Left column is white with `border-right: 1px solid var(--ruled)` and underlined-only form fields (`border: none; border-bottom: 2px solid var(--ruled)`, focus swaps to `border-image: var(--iris) 1`). Right column is parchment, scrolls, and holds an 820px "sheet of paper" with ruled lines, a margin rule, and a shadow stack. This is every standalone tool.

**C. The vertical journey timeline** (`/dashboard`). A 1px rail at `left: 15px` that turns crimson as you complete; 16px circular nodes at `left: 8px` (completed = filled crimson with a cream `✓`; current = 2px ink ring with `box-shadow: 0 0 12px rgba(139,26,26,0.2)`; future = 1px `#E8E4DF`). Content at `padding-left: 48px`: mono `Lesson N` with an inline 14px canon icon, an italic Playfair 22px title, and a two-part **teaser** — a muted italic lead plus an iris-shimmered kicker. Locked rows render `???` at `opacity: .2` and `filter: blur(2px)`. The finale node is a **gold star** — `linear-gradient(135deg, #B8943E, #D4B96A)` with `box-shadow: 0 0 16px rgba(184,148,62,0.35)`.

**D. The card-catalog grid** (`/syllabus`). `repeat(3, 1fr)` at `32px 28px` gaps on aged stock; each card is an index card with a punched hole, a red margin rule, a Dewey call number in mono, a gold condensed lesson number, a Playfair title, a **Caveat question in crimson**, a rotated circular "date due" stamp, and a Caveat margin annotation. Two lesson titles are deliberately typed in mock-sarcastic case (`tHe SaLeS pLaYbOoK`).

**E. The KPI row** (`/enterprise`). `repeat(3, 1fr)`, each stat a `padding-top: 24px` block with an **iris gradient top-border** (the padding-box/border-box trick), a `clamp(40px, 5.5vw, 64px)` iris-clipped Playfair italic number, and a Barlow Condensed uppercase caption capped at 28ch. Every stat is a link to its cited source; the citation renders as a superscript that must explicitly opt out of the parent's `-webkit-text-fill-color: transparent` or it disappears.

### The named screens

- **`/` Landing — a five-movement scroll sequence.** ① a typed "confession" overlay (`clamp(22px,3.5vw,38px)` Playfair italic, a blinking crimson cursor, dissolving out via `opacity + blur(12px) + scale(1.04)`); ② **the fork** — full-viewport 50/50 split, cream SDR left / crimson AE right, with a 2px iris divider running the full height (`shimmerY`), grid columns animating to `0 1fr` when one side is chosen, a 300px ghost numeral per half, and a hover-revealed underlined "Pick SDR →"; ③ **the terminal** — a 680px cream box with `1px solid var(--light)`, a title bar with three translucent dots and a filename, mono `>` prompt lines that fade in one at a time, then a rule and an **iris-clipped 800-weight payoff line**, then a muted serif whisper; ④ **the zoom section** — `height: 700vh` of scroll space driving a `position: fixed` viewport through 8 alternating cards (Rowan in giant uppercase Barlow Condensed; Michael in Caveat crimson), each with a ghost word behind it, a 2px iris progress bar at the top and 6px marker dots on the right rail that scale 1.5× and go crimson when active; ⑤ **a full-bleed crimson CTA overlay** with the wordmark at `clamp(64px,16vw,200px)`. Below the fold: a 16:9 video, the deck stack, "What this is *not*" (4 white cards), the four-shape comparison (one 2px-ink column + three 78%-opacity muted columns), testimonials, a validation marquee, pricing, the classified FAQ, a final CTA, a content-warning band, and a mono footer.
- **`/coming-soon` — the gate.** A pure-CSS 14.4-second loop on a cream field: a parallax skyline drawn as an SVG mask with a colored light sweeping across it, six syllabus words ghosting in at `opacity .075` one every 1.4s, and after every third word a **money detonation** — an iris ring expanding to 9×, an engraved money bag popping, and ~34 bills and bags flying along *precomputed deterministic* trajectories (`--mx/--my/--tx/--ty/--rr/--sc` custom properties) while the word "money" flashes three times in iris Playfair. Foreground: a wordmark with an iris underline, `Invitation only.` at `clamp(48px,8.5vw,104px)` / `line-height: .95`, a mono `HAVE A KEY?` label with a plain GET form, Leponeus standing at the bottom as a doorman, and a waitlist form. Renders complete without JS; reduced-motion gets a still gate.
- **`/dashboard`** — mascot + state headline ("It starts now." / "N down. N to go." / "You made it."), then a stack of state banners (welcome-back, just-closed, first-run) each a white panel with a 3px crimson left rule, then the resume CTA (white panel, crimson mono eyebrow, italic title, solid crimson button), then the 12-node timeline.
- **`/syllabus`** — the card catalog, with a sticky cream topbar, an iris hairline under it, a mascot, a kicker with rules extending left and right of it (`::before/::after { flex: 1; height: 1px }`), "The *Syllabus.*" at `clamp(44px,7vw,96px)`, and a `RESERVE` CTA panel whose label sits in a notch cut into the top border.
- **`/reveal`** — the ceremony. Mascot in `verdict`, a mono fanfare eyebrow, the student's name in iris at `clamp(40px,6vw,72px)`, a two-tab bar (`I · The Programme` / `II · The Manuscript`) separated by a 1px rule with a **gold dot** floating at its midpoint, and a 3D card stage (`perspective: 1200`) where the inactive artifact sits behind at `translate(10px,10px) scale(.97) opacity .35 brightness(.7) saturate(.5)` and swaps by sliding ±110%. Behind the Programme: a photographic stage with a warm spotlight and floating 3px sparks. Behind the Manuscript: a desk with a vignette.
- **`/artifacts/playbill`** — theatre. An ink marquee with a `6px double #A68B4E` bottom border, gold mono eyebrow, iris-clipped name, gold rules; then a sticky three-tab Act bar on `#F4EFE4` with Playfair italic tabs that go crimson with a 3px crimson underline when active; then Act panels with Roman numerals and per-category percentages.
- **`/artifacts/redline`** — manuscript. A centered cover with a `3px solid #C53030` stamp rotated -3deg, then folio tabs, then the real payload: body text at `line-height: 2` with `padding-right: 220px` and a **200px right margin rail** holding Caveat notes in `#C53030` behind a `2px solid #C53030` left border; struck text uses `text-decoration: line-through; text-decoration-color: #C53030; text-decoration-thickness: 2px;` and inserts render crimson with a 2px crimson underline. Score boxes float in the margin. An "accepted manuscript" block closes it in `2px solid #15803D` with a notch-mounted green stamp.
- **The lesson player** (iframed, its own design system) — a `grid-template-columns: 1fr 200px; grid-template-rows: 52px 1fr 60px` app shell with **2px solid black** borders on the topbar, sidebar and bottom nav; a 2px iris progress fill in the topbar; a sidebar where the active item gets an amber tag and a 3px amber bar at `left: -20px`; a cover screen split amber/white; content screens with a 4px iris top stripe and a 200px ghost numeral; a black "lie box" with an iris-gradient tab in the corner; a checklist whose completed items flip to **acid `#C8FF00`**; a click-to-place schedule builder where correct slots go acid and wrong ones go coral and shake; and a cold-call simulator with a 28px dot stepper.
- **`/not-found`** — mascot in `fall`, mono `404 · Off the path` in crimson, "This page doesn't exist.", and *"Every mile looks the same. This one isn't here."*
- **`/error`** — mascot in `recovery` (deliberately not `fall` — "error pages should signal recovery, not defeat"), eyebrow `Error · The turtle stopped`.
- **`/mobile` gate** — cream, iris `Desktop Required`, "This course is built for desktop."
- **`/admin/tower`** — the founder ops surface. Same fonts, but a flat dense table register: 13px Barlow Condensed uppercase buttons at `.14em`, `#8B1A1A` primary / `#2E7D32` start / ghost outline, mono status chips with 1px `#E8E4DF` borders, and a `towerPulse` opacity animation for `aria-busy`.

### Empty / loading / error patterns
There is no spinner vocabulary. The patterns that exist:
- **Blur-as-lock:** future lessons blur to 2px at 20% opacity and read `???` with the line "You haven't earned this yet."
- **Pending:** `aria-busy="true"` triggers `animation: towerPulse 1.1s ease-in-out infinite` (opacity to .4); disabled = `opacity: .55; cursor: progress`.
- **Errors are a mono line in crimson** at 12px, plain-spoken — *"That address didn't read — check it and try again."* / *"Our side hiccupped saving it — nothing wrong with your address."*
- **Empty artifact state** is authored, not generic: "The curtain has not risen."

---

## 6. THE PRODUCT'S OWN WORDS

**Positioning:** *"The operating manual, not the motivation engine. We do not perform expertise; we install it. If a piece of copy could be lifted onto a LinkedIn carousel without anyone noticing, it is wrong."*

Verbatim UI and marketing copy:

1. > **Invitation only.**
   > AESDR is a sales curriculum built by operators, for SDRs and AEs in their first two years — *the part of the job nobody trains you on.*
   > `HAVE A KEY?` — (the gate)

2. > **Stop Surviving. Start *Owning* It.** — (the welcome hero; "Owning" carries the iris)

3. > Become the same you, just way, way better. — (the landing tagline)

4. > So here's the scenario. / You're an **AE**. Or an **SDR**. — (the opening typed lines)

5. > `> scanning your pipeline...`
   > `> found: 22 open opportunities. 17 in "discovery" for 45+ days.`
   > `> forecast accuracy last quarter: 34%. what you told your VP: 85%.`
   > `> diagnosis: professional optimist with a commission plan.` — (the AE terminal)

6. > This program will change your life a few times throughout your journey in the 12 courses. Afterward, it's highly unlikely that you'll ever make the same money again.
   > *Keep scrolling. The picture gets worse before it gets better.* — (terminal payoff + whisper)

7. > Every month or quarter, they reset your number to **zero.** And every month or quarter, you act surprised. You don't have a pipeline problem. You have a denial problem. — (zoom card, Rowan)

8. > My manager asked for a pipeline update. I sent a screenshot of an empty spreadsheet and wrote "minimalist aesthetic." He did not laugh. HR laughed. But like, in a concerned way. — (zoom card, Michael)

9. > Your onboarding was a **crime scene.** A week of shadowing. A Gong playlist. A prayer. That is not training. — (zoom card, Rowan)

10. > **Not** — *A skip button for the grind.* We can show you how the job actually works. We can't do the job for you — you still have to make the calls, run the demos, and eat the no's. — ("What this is not")

11. > Content Warning — This course contains uncomfortable truths about your pipeline, your apartment, your bar tab, your commission check, and your relationship status.

12. > **Choose your keeper.** These are two different readings of the same story you just lived through — pick the one you want to take home with you. — (`/reveal`)

13. > Twelve courses filed under one Dewey call number — check each one out as the work demands it and return it when you're a different AE or SDR on the other side. / `Dewey 658.85 · AESDR/SAL · Non-Fiction` — (`/syllabus`)

14. > Nope — no guru routines and no motivational performance built into the format; this is sober, fun, practical training built by people who carried bags. — (FAQ, blurred until hover)

**Banned vocabulary, zero tolerance:** "crush it," "game-changer," "unlock your potential," "mindset," "rise and grind," "thought leader," "lead with value," "trusted advisor," "synergy," "leverage" (as a verb), "empower," "rockstar/ninja," and hype emoji (🚀💪🔥) anywhere bearing the mark.

**Required signature moves:** the verdict construction (*"X is not [what it pretends to be]. It is [what it actually is]."*) · the named number (never "many," always "$8,200" or "47 dials") · the honest disqualification (every offer surface names who should *not* buy) · *"we do not teach you X, we teach you to be the person who X"* · and "the cream-and-crimson visual fingerprint — if you can't tell at thumbnail size that an asset is AESDR, it's wrong."

---

## 7. THE STRONGEST INGREDIENTS

1. **The iris gradient as a rationed, animated, text-clipped accent.** Seven stops, `background-size: 300% 100%`, `shimmer 4s linear infinite`, `-webkit-background-clip: text`. Never a fill, never a whole headline — one accent word, one CTA, one 1px line. The discipline is what makes it read as a brand rather than as 2015 gradient-chic. Its variants (the no-pink `--gateIris`, the saturated lesson-player iris) prove it's a *family*, not a fixed asset.

2. **The crimson/cream 50-50 split with a live iris seam.** Two full-height panels, a 2px animated gradient divider running the whole height, grid-columns animating to `0 1fr` on choice, a 300px ghost numeral bleeding off each corner. It's a decision device, an identity device, and a composition all at once.

3. **Blur as redaction.** `filter: blur(5px)` + `user-select: none` on real content, with a mono `[CLASSIFIED — HOVER TO PEEK]` overlay, resolving on hover. Content *is* the material — nothing is faked or lorem'd.

4. **The rotated stamp system.** Mono uppercase, crimson at 25% text / 15% border, 1px, `rotate(-2deg)`. Plus its siblings: the circular library date stamp (`border-radius: 999px`, `rotate(-4deg)`, with a Caveat date line inside), the `3px solid #C53030` cover stamp at `-3deg`, and the notch-mounted `RESERVE` / accepted-manuscript labels that sit *in* a border.

5. **The terminal-on-cream.** The retirement of the dark palette forced a genuinely uncommon object: a terminal that is cream, `1px solid #E8E4DF`, `rgba(0,0,0,0.02)`, with translucent dots, ink mono lines fading in sequentially, a crimson block cursor blinking at 0.8s step-end, and then an iris-clipped 800-weight payoff line above a muted italic serif whisper. Ink-on-cream mono is the whole trick.

6. **The two-voices diptych.** Left column Rowan — uppercase Barlow Condensed 900, ink, numbered `01/02/03` in tiny mono, each with a small italic serif subtext. Right column Michael — Source Serif in crimson, confessional, specific. A vertical iris rule between them. Closes with a centered italic Playfair line where the second half takes the iris. It's a layout, a color assignment, *and* a type assignment doing one argument.

7. **The manuscript margin rail.** Body at `line-height: 2` with `padding-right: 220px`; a 200px absolute right rail of **Caveat handwriting in crimson** behind a 2px crimson left border; struck text with a 2px crimson strike; inserts in crimson with a crimson underline; score boxes floating in the same gutter. On mobile the rail goes `position: static` and stacks. Nothing else in software looks like this.

8. **The physical index card.** `#FFF8EC` on `#F4EADD`, a punched 14px radial-gradient hole at top-center, a 1px red margin rule at `left: 48px`, faint ruled lines via background-size `100% 1.5em`, a Caveat question in crimson, a Caveat annotation in the corner, and `nth-child` micro-rotations of ±0.25–0.35deg that reset to 0 on hover with a 3px lift.

9. **The dog-ear peel.** A 28×28 corner rendered entirely as a hard-stop 225° gradient that grows to 52×52 on hover, on a card that peels away via `rotateY(-155deg) rotateZ(-4deg)` around `transform-origin: left center` at `650ms cubic-bezier(.7,.0,.2,1)`, over a stack of three depth cards offset `4px/0.6deg` each.

10. **Leponeus as a state machine.** An iridescent rabbit-tortoise whose narrative state is encoded in the artwork: a crimson crack in the shell for `fall`, a green sprout for `recovery`, a branded crimson "A" for `owner`, a head-on stare for `verdict`. Combined with the scarcity rule (one per page) and the named size tiers, it behaves like a status indicator rendered at hero scale.

11. **The monoline shell glyph.** `M 6 50 Q 32 12 58 50 Z` at 1.6px round-cap — one quadratic arc that serves as the product's abstract mark, and which mutates into loss (crimson crack) and growth (green sprout) without changing silhouette. The Greek-key meander divider and the dotted-path arc are the same hand.

12. **The four-beat section stack.** Mono eyebrow at 10px/.25em → giant Playfair italic 900 headline with exactly one iris word → 60×2px iris divider → muted Source Serif body → uppercase Barlow Condensed CTA at .15em. It's the rhythm that makes ten visually different metaphor-worlds (library, theatre, terminal, manuscript, gate, ops table) still read as one product.

13. *(bonus)* **The circled number.** `border: 3px solid #C53030; border-radius: 50% / 35%;` around a 58px Playfair figure — an ellipse, not a circle, so it reads as drawn by hand in red pen. Swaps to gold when the number becomes good news.

---

## 8. CONTRADICTIONS AND CAUTIONS

1. **The favicon is off-brand.** `public/favicon-32x32.png` is a `#209CEE` sky-blue square with white "AESDR" set in **Do Hyeon** (per `public/about.txt`, generated by favicon.io). Blue appears nowhere in the palette and Do Hyeon appears nowhere in the font canon. `site.webmanifest` also carries `theme_color: #ffffff`, not cream. This is legacy and should not be treated as a mark.

2. **The retired dark palette is *mostly* gone but survives in live code.** `AGENTS.md` retires `#020617 / #0F172A / #1E293B / #10B981 / #EF4444 / #38BDF8 / #F59E0B / #8B5CF6` and `globals.css` deleted the legacy tokens on 2026-05-23. But `components/TeaseGate.tsx` still renders a full-screen `linear-gradient(180deg, #040714 0%, #09101d 42%, #040610 100%)` overlay with iris-hued radial glows. And `design-canon/07-mockups/` (27 hero mockups) plus `variants/variant-c-dark-editorial.html` are all rendered in the retired palette — the README explicitly warns: *"Do not point design generators at these files as visual canon."*

3. **Every iris CTA glows green on hover.** `box-shadow: 0 0 30px rgba(16, 185, 129, 0.3)` — that's `#10B981`, a *retired* token, surviving as a hover glow on five buttons. Almost certainly vestigial.

4. **The editorial split hero exists in four forked copies.** `components/LandingSequence.module.css`, `app/(affiliate-experience)/_landing/ExperienceLanding.module.css`, `app/welcome/welcome.module.css`, and `variants/variant-a-editorial-split.html` all carry near-identical `.hero/.heroLeft/.heroRight/.btnIris/.btnOutline` blocks. The affiliate-experience copy is a byte-level fork. If you rebuild from one, know the others drift.

5. **The lesson player runs a completely separate design system.** Inside `content/lessons/html/`, the tokens are `--display: 'Abril Fatface'`, `--serif: 'Inter'`, `--mono: 'DM Mono'`, on pure `#FFFFFF`/`#000000` with 2px black borders and a *more saturated* iris. `AGENTS.md` bans Inter "outside of `MVI-STANDARDS.md`'s course-gate scope," and `MVI-STANDARDS.md` mandates it. So the product's actual interior is off-canon by design. Treat these as two sibling registers, not one system.

6. **Per-page sub-palettes proliferate.** Syllabus (`#F4EADD`/`#B8943E`/`#3A2A1C`), tools (`#FFFDF8`/`#C53030`/`#8B8178`), Playbill (`#F4EFE4`/`#A68B4E`/`#D8D0C0`), Redline (`#C53030`/`#15803D`), lesson player (amber/cobalt/acid). None of these are in `globals.css`, `AGENTS.md`, or `figma-tokens.json`. The canon says five colors; the product ships ~twenty. The saving grace is that each extra set is scoped to one metaphor.

7. **Two reds that are easy to confuse.** `--crimson #8B1A1A` (brand) and `#C53030` ("red ink" in the tools and the Redline artifact) are used side by side in the same files. They are not interchangeable: crimson is authority, `#C53030` is the editor's pen.

8. **Deprecated form-border still present.** `--form-border: #928C84` replaced `#B5B0A8` for WCAG 2.1.11 (2.0:1 → 3.12:1), but `#B5B0A8` still appears 27 times. Use `#928C84`.

9. **`/turtle.png` (3.3 MB) is still in `public/`** alongside the 8 mascot PNGs, and `design-canon/` explicitly warns it "predates the 8-pose canon."

10. **The design-canon folder is a dated snapshot and says so.** `design-canon/README.md` (snapped 2026-04-29): *"Reference only — do not edit, import, or route to anything in this folder… may have drifted."* `state0511-design-system.md` references a companion `aesdr-design-system` branch and an `aesdr-design-system/brand/synthesis.jsx` canvas holding 18 icons + **5 spot illustrations** — the icons and mascot were ported into `components/brand/`, but **the 5 spots were never ported.** They exist only as a reference to "Long Mile" in a 404 caption. There is no spot-illustration system in this repo.

11. **A newer mockup-direction canon bans styles this product already ships.** `AGENTS.md` (2026-07-14) forbids *proposing* `classified`, `dossier`, `ledger`, `editorial`, `split`, and "decision card" registers ever again — and adds "Leponeus is always present: every mockup and every direction includes the mascot somewhere in frame. No Leponeus, no direction." The rule is explicitly prospective — shipped surfaces in those styles stay — but if you are reinterpreting this world, the founder considers those metaphors spent. The instruction is to derive new directions *from AESDR's own primitives*: the iris, Playfair italic, Space Mono taxonomy, the Caveat margin voice, the zoom sequence, the mascot.

12. **One route is genuinely mid-migration.** `app/admin/tower/director` is being rewritten under a separate "clickomate" doctrine (plain speech, every noun resolves to its object, details folded one click beneath the row). Its CSS mixes the tower's flat table register with green/crimson callouts and is the least settled surface in the repo.

13. **Personal-name content exists.** The `/reveal` artifacts, testimonials, affiliate candidate records, and the two artifact reference PNGs render real personal names. I have not reproduced any of them; cite only by filename (`public/reveal/playbill.png`, `public/reveal/manuscript.png`, `design-canon/08-production-content/A09-testimonials.md`). No customer or deal data was encountered.


---

REVISED AESDR REPORT — adds §0 (shipped vs exploration), the live-production capture findings, and literal pasteable token values. Supersedes my first handback; everything there still holds, this adds to it.

## What the "live capture" actually is

`www.aesdr.com-20260416T150431.html/.json` is a **Lighthouse audit report**, not a page save. It is still the most valuable artifact in the repo, because it embeds a real production screenshot, the real DOM paths and node labels, the real computed colors, and the network manifest. I extracted the screenshot to `LIVE-final-screenshot.jpg` + 8 filmstrip frames in the shots folder and mined the DOM. Scores: Performance 80, Accessibility 96, Best Practices 92, SEO 63. 41 requests, 485 KB total. `<meta name="robots" content="noindex, nofollow">` was live — the site was invite-gated, which is the whole SEO 63.

---

# 0. SHIPPED vs EXPLORATION — what is real

Four visual generations. Only one is shipped.

| Gen | Where | Palette | Type stack | Status |
|---|---|---|---|---|
| **Gen 0** | `deliverables/prototypes/`, `marketing/landing-pages/aesdr-landing-page.html`, `marketing/ad-creative/` | dark `#020617`/`#0B0F19`, `--theme #10B981`, `--coral #EF4444`, `--cobalt #38BDF8` | **Abril Fatface + Cormorant Garamond + DM Mono** | dead. `MVI-STANDARDS.md` labels this stack "Current (WRONG)" |
| **Gen 1** | `public/mockups/01-…`→`27-…` (27 numbered heroes) + `variant-c-dark-editorial.html` | dark `#020617`, green `--theme` | **Inter + JetBrains Mono + Barlow Condensed** — Inter and JetBrains are both *explicitly banned fonts* in current canon | **road not taken.** `design-canon/README.md`: *"Do not point design generators at these files as visual canon."* |
| **Gen 2 — SHIPPED** | `app/`, `components/`, `app/globals.css`, `variants/variant-a-editorial-split.html`, `public/mockups/artifact-*` `reveal-*` `tool-*` `fork-*` `syllabus/` | **cream `#FAF7F2` / ink `#1A1A1A` / crimson `#8B1A1A`** + reserved iris | **Playfair Display + Source Serif 4 + Barlow Condensed + Space Mono + Caveat** | **this is the product** |
| **Gen 2b — SHIPPED, separate world** | `content/lessons/html/lesson-01…12/` (the iframed course player) | white/black + `--amber #D94F00`, `--cobalt #0038FF`, `--acid #C8FF00`, saturated iris | **Abril Fatface + Inter + DM Mono**, sanctioned by `MVI-STANDARDS.md` | shipped, deliberately off the main canon |

**Two more genuine alternates, both rejected:**
- `variants/variant-b-broadsheet.html` — **monochrome newspaper.** Identical class names, but `--cream:#FFFFFF; --ink:#0A0A0A; --crimson:#1A1A1A;` — crimson redefined to black. No accent color at all.
- `variants/variant-c-dark-editorial.html` — `--cream:#0B1120; --ink:#F8FAFC; --crimson:#10B981;` — dark with green as accent. Flagged reference-only.

**The most useful structural fact:** variant-a / -b / -c carry *identical class names* (`hero-left`, `hero-right`, `deck-card`, `faq-blur`, `faq-stamp`, `ghost`, `confession`, `cursor`) under different tokens. The identity is the **structure and motifs**; the palette is a skin that was swapped once and can be swapped again. The canon says so: *"The motifs (dossier, classified, terminal, two-voices, deck-stack, warning-box) are real and canonical, but the palette-rendering of those motifs in this folder is not."*

## What production actually served (LIVE, 2026-04-16)

The live DOM shows `LandingSequence-module__…__hero → heroLeft / heroRight` — **the editorial split was the base layer**, with confession/terminal/fork overlays above it. Page height **11,745px** on a 412px viewport.

| Top px | Element | Real copy |
|---|---|---|
| 0 | nav | `AESDR` · `SIGN IN` · `GET ACCESS` |
| 67 | `heroLeft` (crimson) | `AESDR · 12 LESSONS · A BETTER YOU` |
| 233 | `warnTitle` | `!` `CONTENT WARNING` |
| 434 | `btnIris` | `CONTINUE →` |
| 435 | `termOutput` | "This course will change your life a few times throughout. Afterward, you'll nev…" |
| 561 | `heroRight` (cream) | `THE UNFILTERED SAAS SALES SURVIVAL GUIDE` |
| 709 | `heroAccent` | `Owning` — the one iris word |
| 988/1043 | CTAs | `GET ACCESS` · `SYLLABUS PEEK` |
| 1153 | `ambientLine` | the 1px iris hairline |
| 1153→7280 | — | the 700vh zoom scroll-space |
| 7280 | `DeckStack.cardNum` ×12 | `01`…`12` |
| 8842 | `untamedStamp` | `UNTAMED` |
| 9565/10217 | `priceCta` | `BUY FOR ME` · `BUY FOR US` |
| 10413 | `faqSection` | `!` `QUESTIONS` / `Frequently Asked` / `Q01` |
| 10991 | `faqScrollCue` | `SCROLL →` |
| 11729 | footer | `AESDR © 2026 · TERMS · PRIVACY · REFUNDS · ABOUT · CONTACT` |

**In the repo now but not live in April:** `SYLLABUS PEEK` removed; footer grew 5→8 links; a sneak-peek `<video>`, a "What this is *not*" 4-card block, a four-shape comparison grid, testimonials and a validation marquee were added; the terminal payoff was rewritten.

**Live-then, dead-now:** production loaded `ceramic-bunny-mask-cutout.png` (57 KB via Next/Image). The April mascot was a **ceramic rabbit mask with X eyes worn over a second terracotta human face, held up by hands in a knit sweater** — anonymous, two-faced, unsettling. The 788 KB source is still in `public/`. Leponeus replaced it in the 2026-05-11 design-system port. The rabbit lineage carried; the horror did not.

---

# 4′. LITERAL PASTEABLE VALUES

## `app/globals.css` `:root` — verbatim
```css
:root {
  color-scheme: light;
  --crimson: #8B1A1A;
  --cream: #FAF7F2;
  --ink: #1A1A1A;
  --muted: #6B6B6B;
  --light: #E8E4DF;
  --form-border: #928C84;   /* 3.12:1 on cream, 3.33:1 on white */
  --iris: linear-gradient(90deg, #FF006E 0%, #FF6B00 17%, #F59E0B 34%, #10B981 51%, #38BDF8 68%, #8B5CF6 85%, #FF006E 100%);
  --display: 'Playfair Display', Georgia, serif;
  --serif: 'Source Serif 4', Georgia, serif;
  --cond: 'Barlow Condensed', sans-serif;
  --mono: 'Space Mono', monospace;
  --hand: 'Caveat', cursive;
  --background: var(--cream);
  --foreground: var(--ink);
}
```
Usage counts across `app/`+`components/`: `#1A1A1A` 351 · `#8B1A1A` 331 · `#6B6B6B` 288 · `#fff` 237 · `#FAF7F2` 223 · `#E8E4DF` 174. Everything else is in the tens.

## Secondary hexes that actually ship
```
#2E7D32  green  — the only true green: done/start/money   (hover #245F28)
#C53030  red    — "red ink", the editor's pen (tools + Redline)
#B8943E  gold   — the keeper/reward     #D4B96A  gold-lt (star gradient)
#A68B4E  gold   — antique theatre gold (Playbill)
#6E1414  crimson pressed                #15803D  "accepted" pass green
#B5B0A8  DEPRECATED form border (2.0:1) — superseded by #928C84
```

## Local sub-palettes
```css
/* syllabus — card catalog */
--catalog-cream:#F4EADD; --catalog-card:#FFF8EC; --catalog-deep:#3A2A1C;
--catalog-ink:#2A1B0E;   --catalog-mute:#7A6A58; --catalog-rule:#CBB58C;
--catalog-stamp:#8B1A1A; --gold:#B8943E;

/* standalone tools — "The Redline (Luxury)" */
--parchment:#FFFDF8; --page:#FFFFFF; --text:#2C2C2C; --text-muted:#8B8178;
--red:#C53030; --crimson:#8B1A1A; --ruled:#F0EBE3; --margin-line:#E8D4D4;
--gold-hl:rgba(184,148,62,0.2); --gold-hl-flash:rgba(184,148,62,0.5); --gold-solid:#B8943E;

/* playbill artifact */  paper #F4EFE4 · gold #A68B4E · warm-grey #D8D0C0
                         marquee: border-bottom: 6px double #A68B4E;

/* lesson player (iframed) */
--white:#FFFFFF; --black:#000000; --mid:#636060; --lite:#F2EEE9; --lite2:#E5E1DC;
--amber:#D94F00; --cobalt:#0038FF; --cob-lt:rgba(0,56,255,0.07);
--green:#00B85A;  --grn-lt:rgba(0,184,90,0.09);
--coral:#FF3200;  --cor-lt:rgba(255,50,0,0.07); --acid:#C8FF00;
--line:rgba(0,0,0,0.08); --line2:rgba(0,0,0,0.15);
--iris: linear-gradient(90deg,#FF006E 0%,#FF6B00 17%,#FFD600 34%,#00E5A0 51%,#0099FF 68%,#7B2FFF 85%,#FF006E 100%);
--display:'Abril Fatface',Georgia,serif; --serif:'Inter',-apple-system,sans-serif;
--cond:'Inter',-apple-system,sans-serif; --mono:'DM Mono',monospace;

/* the gate — a "no-pink" iris */
--gateIris: linear-gradient(90deg,#FF6B00 0%,#F59E0B 22%,#10B981 45%,#38BDF8 68%,#8B5CF6 86%,#FF6B00 100%);
```

## Retired & forbidden (survive only as iris stops + terminal dots)
`#020617  #0B0B0F  #0F172A  #1E293B` · `#10B981 --theme  #EF4444 --coral  #38BDF8 --cobalt  #F59E0B --amber  #8B5CF6 --violet`

## Fonts — the exact production `<link>`
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600;700;800&family=Caveat:wght@400;600&display=swap" />
```
Signature weight: **Playfair Display italic 900.** Banned: JetBrains Mono, Inter (outside the lesson-player scope), Roboto, Open Sans, Lora.

## Type scale — pasteable
```css
/* wordmark XL   */ font-family:var(--display);font-weight:900;font-style:italic;
                    font-size:min(clamp(80px,18vw,220px),26vh);line-height:.85;letter-spacing:.02em;
/* hero          */ font-size:clamp(36px,5vw,64px);line-height:1.05;letter-spacing:-.02em;
/* ent. hero     */ font-size:clamp(40px,6.5vw,76px);line-height:1.05;letter-spacing:-.02em;max-width:14ch;
/* H2            */ font-size:clamp(32px,5vw,56px);line-height:1.1;letter-spacing:-.01em;font-weight:900;font-style:italic;
/* H3            */ font-size:clamp(20px,2.2vw,26px);line-height:1.2;font-weight:700;font-style:italic;
/* zoom Rowan    */ font-family:var(--cond);font-weight:900;text-transform:uppercase;
                    font-size:clamp(36px,7vw,80px);letter-spacing:.03em;line-height:1.05;color:var(--ink);
/* zoom Michael  */ font-family:var(--hand);font-size:clamp(22px,3.5vw,42px);line-height:1.4;color:var(--crimson);
/* deck numeral  */ font-family:var(--cond);font-weight:900;font-size:64px;line-height:1;
                    background:var(--iris);-webkit-background-clip:text;
                    -webkit-text-fill-color:transparent;opacity:.6;
/* card title    */ font-family:var(--cond);font-weight:700;text-transform:uppercase;
                    font-size:22px;letter-spacing:.03em;line-height:1.2;
/* lede          */ font-family:var(--serif);font-size:clamp(16px,1.4vw,19px);line-height:1.6;max-width:70ch;
/* body          */ font-family:var(--serif);font-size:16px;line-height:1.65;max-width:70ch;
/* button        */ font-family:var(--cond);font-weight:700;text-transform:uppercase;
                    font-size:14px;letter-spacing:.15em;line-height:1.2;
/* mono eyebrow  */ font-family:var(--mono);font-size:10px;letter-spacing:.25em;
                    text-transform:uppercase;color:var(--muted);line-height:1.4;
   /* tracking variants in use: .2em section · .28em card · .3em kicker · .32em banner · .35em fanfare */
/* mono footnote */ font-family:var(--mono);font-size:9px;letter-spacing:.1em;
                    text-transform:uppercase;line-height:1.85;
/* terminal body */ font-family:var(--mono);font-size:clamp(13px,1.8vw,17px);line-height:1.8;
/* handwriting   */ font-family:var(--hand);font-size:15–22px;line-height:1.3–1.4;color:var(--crimson);
```

## Spacing / measure / grids
```
scale:      4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64
sections:   100px 8% (landing) · clamp(56px,9vw,112px) 0 (enterprise)
            120px 8% (final CTA) · clamp(4rem,8vw,8rem) 0 (FAQ)
containers: 1180 (enterprise/syllabus) · 1100 (compare) · 1080 (video) · 1000 (pricing)
            900 (zoom) · 880 (narrow) · 820 (paper)
measures:   70ch body · 60ch subhead · 56ch lede · 28ch KPI caption
            22ch wide headline · 14ch hero headline · 480px hero paragraph
grids:      1fr 1fr (editorial split) · 380px 1fr (tool builder)
            repeat(2,1fr) gap 20px max 820px (not-cards)
            repeat(auto-fit,minmax(240px,1fr)) gap 16px (compare)
            repeat(3,1fr) gap 32px 28px (catalog)
            1fr 200px / 52px 1fr 60px (lesson player app grid)
```

## Radii — literal
```
23 declarations total in app/ + components/:
  17 × border-radius: 50%    (dots, timeline nodes, warning circles)
   1 × border-radius: 999px  (library date stamp)
   3 × border-radius: 2px    (small mono badges)
   1 × border-radius: 4px
   1 × border-radius: 0
```
Token file: `"none": { "value": "0", "description": "Default. AESDR is editorial — sharp corners." }`

## Border widths — literal
```css
border: 1px solid #E8E4DF;      /* default card */
border: 1.5px solid #E8E4DF;    /* emphasis card */
border: 2px solid #1A1A1A;      /* featured / "this one" column */
border: 1.5px solid #1A1A1A;    /* outline button */
stroke-width: 1.6;              /* icon monoline */
border-left: 3px solid #8B1A1A; /* system aside */
border-bottom: 6px double #A68B4E; /* playbill marquee */
```

## Shadows — every one in use
```css
0 1px 2px rgba(26,26,26,0.04), 0 8px 24px rgba(26,26,26,0.06)                       /* deck card */
0 8px 28px rgba(139,26,26,0.08)                                                      /* crimson hover lift */
0 8px 32px rgba(139,26,26,0.08)                                                      /* price card lift */
0 1px 2px rgba(42,27,14,0.08), 0 12px 28px rgba(42,27,14,0.10)                       /* library card */
0 2px 4px rgba(42,27,14,0.10), 0 18px 36px rgba(42,27,14,0.16)                       /* library hover */
0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.04) /* document paper */
0 2px 20px rgba(0,0,0,0.04)                                                          /* terminal block */
0 16px 48px rgba(0,0,0,.25), 0 4px 12px rgba(0,0,0,.12)                              /* reveal front */
0 8px 32px rgba(0,0,0,.15)                                                           /* reveal behind */
inset 0 2px 4px rgba(0,0,0,.3)                                                       /* button press */
inset 0 1px 2px rgba(0,0,0,0.4)                                                      /* punched hole */
0 0 12px rgba(139,26,26,0.2)                                                         /* current node */
0 0 16px rgba(184,148,62,0.35)                                                       /* gold star node */
0 0 30px rgba(16,185,129,0.3)                                                        /* iris CTA hover — VESTIGIAL, retired green */
```

## The iris border trick (verbatim)
```css
border: 2px solid transparent;
background:
  linear-gradient(var(--cream), var(--cream)) padding-box,
  var(--iris) border-box;
background-size: auto, 300% 100%;
animation: shimmer 4s linear infinite;
```

## Motion — every keyframe + easing
```css
@keyframes shimmer    { from{background-position:0% 50%}   to{background-position:300% 50%} }
@keyframes iris       { from{background-position:0% 50%}   to{background-position:200% 50%} }
@keyframes shimmerY   { 0%{background-position:0 0}      100%{background-position:0 300%} }
@keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes drop       { 0%{top:-100%} 50%{top:0} 100%{top:100%} }
@keyframes ghostPulse { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.35;transform:scale(1.3)} }
@keyframes towerPulse { 50%{opacity:.4} }
@keyframes shake      { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
@keyframes up         { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes float      { 0%,100%{opacity:0;transform:translateY(0)} 50%{opacity:.8;transform:translateY(-20px)} }

animation: shimmer 4s linear infinite;      /* iris @ background-size: 300% 100% */
animation: iris    3s linear infinite;      /* older surfaces @ 200% 100% */
animation: blink   0.8s step-end infinite;  /* cursor */
animation: float   3.5s ease-in-out infinite;

transition: transform 0.15s, box-shadow 0.3s;  → transform: translateY(-1px);   /* THE button hover */
transition: transform 650ms cubic-bezier(.7,.0,.2,1), opacity 450ms ease;        /* deck peel */
transition: .45s cubic-bezier(.4,0,.2,1);                                        /* reveal panel swap */
transition: max-height .45s cubic-bezier(.4,0,.2,1);                             /* accordion */
animation:  .42s cubic-bezier(.22,1,.36,1) both;                                 /* lesson screen entry */
transition: filter 0.4s ease;                                                    /* redaction reveal */
transition: grid-template-columns 0.8s ease;                                     /* fork collapse */
transition: width 0.1s linear;                                                   /* scroll progress */
transition: background .12s ease, color .12s ease, transform .05s ease;           /* tower buttons */
```
Deck peel, literal:
```js
peeled:  transform:"translateX(-8%) rotateY(-155deg) rotateZ(-4deg)", opacity:0
active:  transform:"translate(0,0) rotateY(0deg) rotateZ(0deg)", opacity:1
depth n: transform:`translate(${n*4}px, ${n*4}px) rotate(${n*0.6}deg)`,
         opacity: Math.max(0.35, 1 - n*0.22)      // only n <= 3 render
perspective: 1400px;  transform-origin: left center;
```

## Focus + a11y — verbatim
```css
:focus-visible { outline:2px solid var(--crimson); outline-offset:2px;
                 box-shadow:0 0 0 4px rgba(139,26,26,0.18); }
[data-surface="dark"] :focus-visible { outline-color:var(--cream);
                 box-shadow:0 0 0 4px rgba(250,247,242,0.22); }
.half:focus-visible { outline:3px solid currentColor; outline-offset:-6px; }
@media (prefers-reduced-motion: reduce){*,*::before,*::after{
  animation-duration:.01ms!important;animation-iteration-count:1!important;
  transition-duration:.01ms!important;scroll-behavior:auto!important}}
[data-reduce-motion="true"] * { /* same payload, in-product toggle */ }
[data-larger-text="true"] { font-size:112.5%; }
@media (prefers-contrast: more){:root{--iris:var(--crimson)}}
@media (forced-colors: active){:root{--iris:var(--crimson)}}
[data-high-contrast="true"]{--iris:var(--crimson)}
```

## Opacity constants
```
ghost numeral cream .06 · ghost on crimson .07(white) · ambient iris line .15
corner bracket .06 · stamp body .25 · stamp border .15 · muted compare column .78
locked row .2 + blur(2px) · up-next row .5 · deck numeral .6
```

## Framing marks — pasteable
```css
.corner   { position:absolute;width:20px;height:20px;
            border-color:rgba(0,0,0,0.06);border-style:solid;border-width:0; }
.cornerTL { top:20px;left:20px;border-top-width:1px;border-left-width:1px }
.cornerTR { top:20px;right:20px;border-top-width:1px;border-right-width:1px }
.cornerBL { bottom:20px;left:20px;border-bottom-width:1px;border-left-width:1px }
.cornerBR { bottom:20px;right:20px;border-bottom-width:1px;border-right-width:1px }
/* on crimson: rgba(255,255,255,0.20) */

.ghostNum { position:absolute;bottom:-40px;right:-20px;font-family:var(--display);
            font-size:300px;font-weight:900;line-height:1;letter-spacing:-.02em;
            user-select:none;pointer-events:none }
/* cream: rgba(0,0,0,0.06) · crimson: rgba(255,255,255,0.06)
   zoom-card variant: clamp(180px,35vw,400px) @ rgba(0,0,0,0.03), centered */

.ambientLine { position:absolute;bottom:0;left:0;width:100%;height:1px;
               background:var(--iris);background-size:300% 100%;
               animation:shimmer 4s linear infinite;opacity:.15;z-index:50 }

.faqStamp { font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.15em;
            text-transform:uppercase;color:rgba(139,26,26,0.25);
            border:1px solid rgba(139,26,26,0.15);padding:3px 10px;transform:rotate(-2deg) }

.cursor     { width:2px;height:1.1em;background:#8B1A1A;animation:blink .8s step-end infinite }
.termCursor { width:7px;height:14px;background:#8B1A1A;animation:blink .8s step-end infinite }
```

## Rotation system — literal
```
-2deg  classified stamp, UNTAMED stamp
-3deg  redline cover stamp, manuscript image
-4deg  library date-due stamp
-1deg  playbill image
-0.5deg Caveat question       -1.5deg Caveat margin annotation
nth-child(even) -0.25deg · nth-child(3n) +0.35deg · :hover → rotate(0) translateY(-3px)
```

## Texture — pasteable
```css
/* syllabus field */
background-color:#F4EADD;
background-image:
  radial-gradient(ellipse at top, rgba(58,42,28,0.08), transparent 60%),
  repeating-linear-gradient(90deg, rgba(58,42,28,0.02) 0 2px, transparent 2px 28px),
  linear-gradient(180deg,#EFE2CC 0%,#E6D4B6 100%);

/* index-card rule lines */
background-image: linear-gradient(transparent 0, transparent calc(1.5em - 1px),
  rgba(139,26,26,0.10) calc(1.5em - 1px), rgba(139,26,26,0.10) 1.5em, transparent 1.5em);
background-size:100% 1.5em; background-position:0 64px;

/* punched hole */
width:14px;height:14px;border-radius:50%;
background:radial-gradient(circle at 40% 40%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.6) 100%);
box-shadow:inset 0 1px 2px rgba(0,0,0,0.4);

/* tool ruled paper */
background:repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, #F0EBE3 31px, #F0EBE3 32px);
opacity:.5;

/* deck dog-ear peel — 28×28 → 52×52 on hover */
background:linear-gradient(225deg,#fff 0%,#fff 48%,#E8E4DF 49%,rgba(0,0,0,0.06) 52%,#FAF7F2 56%,#FAF7F2 100%);

/* marquee edge fade */
mask-image:linear-gradient(90deg,transparent 0,#000 80px,#000 calc(100% - 80px),transparent 100%);
```

## Blur / glass — the only three uses
```css
/* sticky nav */     background:rgba(250,247,242,0.95); backdrop-filter:blur(10px);
                     border-bottom:1px solid #E8E4DF;
/* floating chips */ background:rgba(250,247,242,0.85); backdrop-filter:blur(6px);
                     border:1px solid #E8E4DF;
/* REDACTION */      .faqBlur{filter:blur(5px);user-select:none;transition:filter .4s ease}
                     .faqItem:hover .faqBlur{filter:blur(0)}
```

## Icon paths — verbatim (the shell-arc motif family)
```svg
<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
<!-- shell -->
<path d="M 6 50 Q 32 12 58 50 Z"/>
<path d="M 28 22 L 32 18 L 36 22 L 36 28 L 32 32 L 28 28 Z" stroke-opacity=".45"/>
<path d="M 18 48 V 38 M 46 48 V 38" stroke-opacity=".45"/>
<path d="M 12 46 Q 32 50 52 46" stroke-opacity=".25"/>
<!-- fall = same dome + crimson crack -->
<path d="M 6 50 Q 32 14 58 50 Z"/><path d="M 28 50 L 24 36 L 34 38 L 26 22" stroke="#8B1A1A"/>
<!-- recovery = taller dome + crimson sprout -->
<path d="M 6 54 Q 32 18 58 54 Z"/><path d="M 32 24 Q 30 14 32 4"/>
<path d="M 32 18 q -8 -2 -10 -10 q 8 4 10 8" fill="#8B1A1A" stroke="#8B1A1A"/>
<path d="M 32 10 q 8 -2 10 -10 q -8 4 -10 8" fill="#8B1A1A" stroke="#8B1A1A"/>
<!-- ear -->
<path d="M 24 60 Q 18 16 36 4 Q 32 32 36 60 Z"/><path d="M 30 56 Q 24 22 32 12" stroke-opacity=".4"/>
<!-- mile -->
<path d="M 6 52 Q 32 22 58 52"/><circle cx="6" cy="52" r="2" fill="currentColor" stroke="none"/>
<line x1="32" y1="34" x2="32" y2="40" stroke-opacity=".5"/><path d="M 58 52 l -6 -3 m 6 3 l -3 -6"/>
<!-- cursor + quill: the only two filled glyphs -->
<path d="M 14 8 L 52 36 L 34 40 L 44 58 L 38 62 L 28 44 L 16 50 Z" fill="currentColor"/>
<path d="M 8 56 L 50 14 Q 60 4 56 22 L 18 60 Z" fill="currentColor"/>
</g>
<!-- meander divider, 480×12, 1px -->
<path d="M 0 6 L 6 6 L 6 2 L 12 2 L 12 10 L 18 10 L 18 2 L 24 2 L 24 10 L 30 10 L 30 2 L 36 2
         L 36 10 L 42 10 L 42 2 L 48 2 L 48 10 L 54 10 L 54 6 L 480 6" fill="none" stroke="#1A1A1A"/>
<!-- dotted-path divider, 480×8 -->
<path d="M 0 4 Q 240 0 480 4" stroke="#1A1A1A" stroke-width="1.2" stroke-dasharray="2 6" fill="none"/>
<!-- terminal dots -->
<circle cx="5" cy="5" r="4" fill="#EF4444" fill-opacity="0.5"/>
<circle cx="18" cy="5" r="4" fill="#F59E0B" fill-opacity="0.5"/>
<circle cx="31" cy="5" r="4" fill="#10B981" fill-opacity="0.5"/>
```

## Wordmark SVG — verbatim
```svg
<svg viewBox="0 0 600 220" role="img" aria-label="AESDR — The Operating Manual">
  <rect width="600" height="220" fill="#FAF7F2"/>
  <text x="40" y="160" font-family="'Playfair Display', Georgia, serif"
        font-weight="700" font-size="180" fill="#1A1A1A" letter-spacing="-2">AESDR.</text>
  <defs><linearGradient id="wmIris" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#FF006E"/><stop offset="17%" stop-color="#FF6B00"/>
    <stop offset="34%" stop-color="#F59E0B"/><stop offset="51%" stop-color="#10B981"/>
    <stop offset="68%" stop-color="#38BDF8"/><stop offset="85%" stop-color="#8B5CF6"/>
    <stop offset="100%" stop-color="#FF006E"/></linearGradient></defs>
  <rect x="40" y="186" width="180" height="2" fill="url(#wmIris)"/>
  <text x="40" y="208" font-family="'Space Mono', monospace" font-size="11"
        fill="#6B6B6B" letter-spacing="1.6">THE OPERATING MANUAL</text>
</svg>
```
React version uses viewBox `0 0 720 220` (widened so the period stops clipping) with `<animate attributeName="x1" from="-720" to="0" dur="6s" repeatCount="indefinite"/>`.

## Mascot API — verbatim
```ts
export type Pose = "doctrine"|"diagnosis"|"sprint"|"fall"|"recovery"|"rest"|"verdict"|"owner";
export const MASCOT_SIZE = {
  inline:40, compact:160, card:200, panel:240,
  welcome:280, landing:320, completion:360, banner:420,
} as const;
```
Canon: max one per page · only the eight named sizes · *"No anthropomorphizing — no waving, no thumbs, no smiling, no speech bubbles. 8 expressions only."* Poses that read as states: `fall` = crimson crack down the shell; `recovery` = green sprout out of the shell; `owner` = crimson Playfair "A" branded on the shell; `verdict` = head-on stare, crimson band as a visor.

## The WebGL ceramic seal — real constants
`app/admin/tower/CeramicSendButton.tsx`, the one 3D surface: *"a mother-of-pearl plinth, a kiln-emerald cap, and the word raised out of the cap's own glaze (bump-mapped height field). Live WebGL, no libraries."*
```js
const IRIS = ["#FF006E","#FF6B00","#F59E0B","#10B981","#38BDF8","#8B5CF6","#FF006E"];
const B=0.05, R=1.0, H=0.26, CR=0.62, CH=0.24, DOME=0.028;  // bevel, radius, height, cap r, cap h, dome
const M = 96;                                                // segments around
```
```glsl
vec3 irid = vec3(sin(ph), sin(ph + 2.094), sin(ph + 4.188)) * 0.5 + 0.5;   // 3 sines 120° apart
body = vec3(0.935, 0.920, 0.900) + (irid - 0.5) * 0.17;
N   = normalize(Ng + vec3(-gx, 0.0, -gy) * 7.5);
vec3 L1 = normalize(vec3(-0.45, 0.9, 0.42));
vec3 L2 = normalize(vec3( 0.75, 0.25, 0.55));
vec3 env = mix(vec3(0.80,0.77,0.72), vec3(1.02,1.01,0.99), pow(envv, 1.6));
float s3 = pow(max(dot(reflect(-normalize(vec3(-0.1,0.95,-0.2)), N), V), 0.0), 420.0) * 0.9;
col += vec3(1.0, 0.985, 0.96) * ((s1 + s3) * calm + s2) * (0.55 + 0.45 * vAO);
col  = pow(col, vec3(0.92));
```
The mascot's material, expressed as math.

---

# 8′. NEW / SHARPENED CAUTIONS

**A. The whisper layer fails WCAG AA — measured on production.** Accessibility scored 96 but `color-contrast` scored **0**. The exact flattened values, which are also the true rendered greys:
| Element | Computed fg on bg | Ratio |
|---|---|---|
| `warnTitle` (mono on crimson, white@50%) | `#c58d8d` on `#8b1a1a` | **3.34** |
| `monoLabel`, footer links (muted@70%) | `#969594` on `#faf7f2` | **2.79** |
| `faqLabel` (crimson@50%) | `#f59e9b` on `#faf7f2` | **1.91** |
| `faqScrollCue` (muted@30%) | `#cfcdc9` on `#faf7f2` | **1.48** |
| footer copyright (ink@50%) | `#b3b1af` on `#faf7f2` | **2.00** |
The micro-label whisper *is* the brand. Rebuild knowing it's a trade the product already made.

**B. The numbered mockups use two banned fonts.** `01-…`→`27-…` are Inter + JetBrains Mono. `AGENTS.md` bans both by name. Treat that whole set as Gen-1 exploration only.

**C. Two abandoned mascots still in `public/`.** `turtle.png` (3.3 MB) and `ceramic-bunny-mask-cutout.png` (788 KB) — the latter was still being served in April 2026.

**D. The favicon is off-brand.** `#209CEE` sky blue, white "AESDR", set in **Do Hyeon** (per `public/about.txt`). `site.webmanifest` carries `"theme_color":"#ffffff"` with empty `name`/`short_name`.

**E. The 5 spot illustrations were never ported.** `state0511-design-system.md` names an `aesdr-design-system` branch holding 18 icons + **5 spots**; the icons and mascot landed in `components/brand/`, the spots did not. They survive only as a reference to "Long Mile" in a 404 caption. There is no spot-illustration system here.

**F. A 2026-07-14 canon bans styles the product already ships.** Never *propose* again: `classified` / `dossier` / `ledger` / `editorial` / `scouting` / `split` / `decision card` — "plus any other stock register an LLM reaches for by default." Prospective only; shipped work stays. The stated alternative: *"Derive new directions from AESDR's own world… the iris accent, Playfair display, Space Mono taxonomy, the Caveat margin-note voice, the agent personae (scout / dossier / warden), the landing zoom-sequence, the mascot. If a direction could be pitched to any other company unchanged, it isn't an AESDR direction."* Plus: *"Leponeus is always present… No Leponeus, no direction."*

**G. Data-viz lives in exactly one place.** `public/mockups/artifact-variant-b-dashboard.html` — three columns (Diagnostic / Playbook / Mirror) with 4px crimson bar meters on `#E8E4DF` tracks, each carrying a one-line italic serif verdict; a pale-crimson `VERDICT` callout with a crimson left rule; and the **"YOU SAID / THE DATA" stacked pair** (white card with mono label + italic quote, then a pale-crimson card with mono label + bold crimson counter). `05-outcome-proof.html` holds the other form: a **transformation ledger** — `WEEK 1 YOU` greyed with ✗ circles and struck italic beside `WEEK 12 YOU` lit with ✓ circles, split by a vertical rule. Both are Gen-1/Gen-2 exploration, never shipped — but they are the only real chart vocabulary the brand has.

**H. Privacy.** The `/reveal` artifacts, the artifact-dashboard and alignment-contract mockups, the testimonials file and affiliate candidate records render real or placeholder personal names. I reproduced none. Cite by filename only: `public/reveal/playbill.png`, `public/reveal/manuscript.png`, `public/mockups/reveal-page.html`, `public/mockups/artifact-variant-b-dashboard.html`, `public/mockups/tool-1-alignment-contract.html`, `design-canon/08-production-content/A09-testimonials.md`. No customer data or deal values encountered.