# shapshyftrs

Landing page mockups: three variants of one page, thirteen teasers. Plain HTML, CSS and JavaScript, assembled by two small Python scripts. No framework, no bundler, no npm.

## What is here

- `variants/` — the three page skeletons: `a-keynote.html`, `b-wall.html`, `c-reel.html`.
- `partials/` — the pieces every variant shares: the head (one Google Fonts link), the chrome styles, the hero, the gallery intro, how it works, the offer, the form, the footer, and the shared play/pause runtime.
- `teasers/` — the thirteen teasers, `t01-fork-rail.html` to `t13-constellation.html`, each self-contained (markup, scoped CSS, scoped JS) and included verbatim by the variants.
- `tokens/` — the page chrome tokens, the shared stage rules, and the four source token sets (GTM OS, AESDR, the cockpit, NRDI).
- `dist/` — the built pages. `variant-a-keynote.html`, `variant-b-wall.html` and `variant-c-reel.html` are single files that open from the filesystem; `teasers/index.html` is the contact sheet; `teasers/tNN-*.html` are one-teaser pages used for stills.
- `screens/` — screenshots of every variant at 1440×900 and 390×844, and every teaser's resting frame at 1600 wide.
- `build.py`, `screenshot.py` — the two scripts. `build.py` needs the standard library only; `screenshot.py` needs Playwright.
- `DESIGN.md`, `SOURCES.md`, `ASSUMPTIONS.md` — the token plan and rule-10 review, what was read from where, and every decision made where the brief was silent.
- `config.json` — the variables substituted at build time (price, turnaround, slogan, contact email, payment link, source links, label switches).

## Build

```
python3 build.py
```

Writes `dist/`. Standard library only. The build inlines the partials, the token files (with their provenance comments stripped) and the teasers into each variant, and substitutes `${PRICE}`, `${TURNAROUND}`, `${CONTACT_EMAIL}`, `${SLOGAN}`, `${PAY_HREF}` and `${CHROME_FONT}` from `config.json`. Missing or malformed teasers are skipped with a warning; `BUILD_STRICT=1 python3 build.py` requires all thirteen and is the release check. Stale pages under `dist/teasers/` are cleared on every build, so `dist/` always mirrors `teasers/`.

## Preview

```
cd dist && python3 -m http.server 8000
```

Then open `http://localhost:8000/variant-a-keynote.html`, `variant-b-wall.html`, `variant-c-reel.html`, or `teasers/index.html`. The files also open directly from the filesystem.

## Screenshots

```
pip install playwright && playwright install chromium
python3 screenshot.py
```

Writes `screens/`. `--variants` or `--teasers` limits the run; `--fold` captures the first fold only; `--live` captures teasers three seconds into their loop instead of at rest; `--only NAME` filters by filename. The script also reports console and page errors and exits non-zero if it saw any.

## How a page is assembled

A variant in `variants/` is an ordinary HTML file with a few build directives in comments. `build.py` expands them and writes one flat file per variant. The full list is in the `build.py` docstring; the ones you need to change a page:

| Directive | What it does |
|---|---|
| `<!-- @include partials/NAME.html -->` | inlines a partial; directives inside it are expanded too |
| `<!-- @tokens -->` | inlines every token file into one `<style>` block |
| `<!-- @teaser N -->` | inlines teaser number N — markup, scoped CSS, scoped JS |
| `<!-- @each-teaser from=A to=B --> … <!-- @end-each -->` | repeats the block between them for teasers A to B in gallery order |

Inside an `@each-teaser` block the per-teaser placeholders are available: `${TEASER_HTML}`, `${TEASER_ID}`, `${TEASER_NUM}` and `${TEASER_NUM2}` (zero-padded), `${TEASER_CAPTION}`, `${TEASER_SOURCE}`, `${TEASER_SOURCE_LABEL}` and `${TEASER_SOURCE_HTML}`, `${TEASER_LOOP}`, `${TEASER_INTERACTIVE}`, `${TEASER_FOCAL_X}` and `${TEASER_FOCAL_Y}`.

Captions and source labels are locked copy and live in `build.py` (`CAPTIONS` and `SOURCES`), not in the teasers or the variants — a teaser never carries its own caption. `config.json` supplies the rest:

| Key | Used for |
|---|---|
| `price`, `turnaround`, `slogan`, `contact_email` | `${PRICE}`, `${TURNAROUND}`, `${SLOGAN}`, `${CONTACT_EMAIL}` |
| `stripe_url` | `${PAY_HREF}`, the payment link on the sent state |
| `chrome_font` | `${CHROME_FONT}`, the chrome's one family |
| `source_links` | the href behind a source label, per source key |
| `show_source_names`, `show_brand_names` | switch a source label down to the brand name, or off entirely. The cockpit's label is fixed at "an internal sales cockpit" and no switch changes it |

Only those exact `${…}` keys are replaced, so JavaScript template literals inside a teaser survive untouched.

## Adding or changing a teaser

One teaser is one file, `teasers/tNN-<id>.html`, self-contained: markup, a `<style>`, a `<script>`. The build inlines it verbatim, and a page may include the same teaser **more than once** (teaser 1 runs twice on every variant), so it must expose nothing global and must initialise every instance of itself.

**The header line.** The first line is a comment `build.py` parses, and it must match the shape exactly or the teaser is skipped (or, under `BUILD_STRICT=1`, the build fails):

```
<!-- teaser id=fork-rail num=1 source=gtmos focal=61%,50% loop=9 interactive=no -->
```

| Field | Meaning |
|---|---|
| `id` | must be one of the thirteen keys in `build.py`'s `CAPTIONS`; it selects the locked caption |
| `num` | 1 to 13, its place in the fixed gallery order; the thirteen must number 1..13 with no gaps or repeats |
| `source` | one of `gtmos`, `aesdr`, `cockpit`, `nrdi-darkest-shades`, `nrdi-puff-junction`, `nrdi-digs`; it selects the locked source label and the token prefix you are allowed to use |
| `focal` | `x%,y%` — the point the 4:5 crop centres on below 640px of the teaser's own width. Repeat it as `style="--fx:0.61;--fy:0.50"` on the root |
| `loop` | loop length in seconds, 6 to 10 |
| `interactive` | `yes` or `no`; `yes` teasers use `role="group"` on the root and real controls inside, `no` teasers use `role="img"` and an `aria-label` that describes the loop |

**The root markup.** Three nested elements, then the subject:

```html
<div class="stage t01" data-teaser="fork-rail" style="--fx:0.61;--fy:0.50" role="img" aria-label="…">
  <div class="stage-frame"><div class="stage-scene">
    … the subject …
  </div></div>
</div>
```

`.stage` is the black container, `.stage-frame` is the visible window (16:10, or 4:5 under the crop) and `.stage-scene` is always the 16:10 composition. All three come from `tokens/stage.css`; never restyle them, never put another background on `.stage`, and put the subject inside `.stage-scene`.

**Everything is scoped to `.tNN`.** Every selector in the `<style>` starts with `.tNN`, every `@keyframes` name starts with `tNN-`, and the `<script>` is an IIFE that walks `document.querySelectorAll(".stage.tNN")` and guards each root with `root.dataset.ready`. No `id` attributes anywhere (two instances would collide); if an SVG needs a `url(#…)` reference, mint a unique id per instance in script, as teaser 10 does for its gradient.

**Units.** Inside `.stage-scene`, `var(--u)` is one percent of the scene's width — 16px at a 1600px-wide frame — on and off the crop. Size everything with it or with percentages of the scene: `font-size: calc(2.2 * var(--u))`, `border-width: calc(0.0625 * var(--u))` for a 1px hairline at 1600. Never use `px`, `rem`, `vw` or `cqw` for anything that should scale with the frame. An SVG with a `viewBox` filling the scene is the other correct way. If a teaser sets type of its own, it should also set its own `font-size` and `line-height` on the block it owns: the page chrome sets a fixed `line-height: 24px` on the body, and that inherits.

**The loop.** One loop, 6 to 10 seconds, one thing happens and it returns to the resting frame. The resting frame is the static DOM with every animation removed — what a reduced-motion visitor sees and what the still in `screens/` captures — so design it to be complete on its own. Prefer CSS animations: `tokens/stage.css` pauses them whenever the root lacks `.is-playing`, so the shared runtime's in-view, hover and reduced-motion logic just works and you should not add your own IntersectionObserver. Script-driven motion starts on the `teaser:play` event and stops on `teaser:pause`, both dispatched on the root, and must not run at all when `matchMedia("(prefers-reduced-motion: reduce)").matches` — draw the resting frame once instead. Animate `transform` and `opacity`; `stroke-dashoffset` and `offset-distance` are allowed for line drawing; never animate layout properties, `filter` or `box-shadow`. Interactions are pointer **and** keyboard, with a visible focus ring, and must never leave the teaser frozen.

**Tokens are append-only.** Use only your source's prefix — `--gtm-`, `--aes-`, `--ckp-`, `--nds-`, `--npj-`, `--ndg-` — and never the chrome tokens or the chrome font. If you need a value the token file lacks, **append** a new `:root { … }` block at the end of that file with the variable marked `/* derived, added for tNN */`. Never rewrite or reorder a token file: its line order is the record `SOURCES.md` part B indexes, and other work may be appending to it at the same time. Log the addition in `ASSUMPTIONS.md`.

**Copy inside the frame.** Plain, generic and invented — invented companies, invented people, no real figures. Nothing about the cockpit's employer, partners or industry anywhere, including comments. No caption, source label or title inside the frame: the variant renders those outside it, in the chrome face.

**Size.** Aim under 25 KB per teaser file, hard cap 35 KB; generate repetitive nodes in script rather than shipping them as markup. The teasers in the repo run 7 to 17 KB.

## Checking a teaser

```
BUILD_STRICT=1 python3 build.py                     # header, id, source and 1..13 numbering
python3 screenshot.py --teasers --only t03          # resting frame at 1600, exits non-zero on any error
python3 screenshot.py --teasers --only t03 --live   # the same three seconds into the loop
```

`screenshot.py` fails the run on any console error or page error, which is the no-errors check. Then read the built page by eye at both sizes — `dist/teasers/tNN-<id>.html` at 1600 wide for the 16:10 composition and at 390 for the 4:5 crop, and `dist/teasers/index.html` for the teaser beside the other twelve. What to look for: the subject covers 45–70% of the frame; nothing essential is cut by the crop; the resting frame is complete on its own; every beat of the loop is visible; the controls work with pointer and keyboard; and the teaser still reads as itself at the wall's 416px tile.

The coverage figures quoted in `ASSUMPTIONS.md` were measured with a scratch probe that is not part of this repo. To measure the same thing, open a one-teaser page and paste this into the console:

```js
(() => {
  const st = document.querySelector('.stage'), F = st.querySelector('.stage-frame').getBoundingClientRect();
  let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
  const walk = e => { for (const c of e.children) {
    const s = getComputedStyle(c), r = c.getBoundingClientRect(), t = c.tagName.toLowerCase();
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
    const leaf = !c.children.length || t === 'svg' || t === 'canvas';
    if ((leaf || s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none' || s.borderTopWidth !== '0px') && r.width > 2 && r.height > 2) {
      x1 = Math.min(x1, Math.max(r.left, F.left)); y1 = Math.min(y1, Math.max(r.top, F.top));
      x2 = Math.max(x2, Math.min(r.right, F.right)); y2 = Math.max(y2, Math.min(r.bottom, F.bottom));
    }
    if (t !== 'svg' && t !== 'canvas') walk(c);
  } };
  walk(st.querySelector('.stage-scene'));
  return ((x2 - x1) * (y2 - y1) / (F.width * F.height) * 100).toFixed(1) + '% of the frame';
})()
```

One caveat if you ever measure a hit target with a scripted pointer: Chromium's synthetic-pointer pipeline reads an x as roughly x + 0.99, so an uncalibrated sweep reports a phantom ~1px bias on geometry that is correct. `ASSUMPTIONS.md` has the details under the teaser review passes.

## Where decisions go

`ASSUMPTIONS.md` is the log: every decision made where the brief was silent, every copy cut, every provisional token, newest at the bottom of each section. Anything changed in `teasers/`, `variants/`, `partials/` or `tokens/` should leave a line there saying what changed and why, with the measurement behind it. `DESIGN.md` holds the token plan and the rule-10 review; `SOURCES.md` maps every transcribed token to the file it came from and every teaser to the real component it is modelled on.

## Deploy

Cloudflare Pages, static, publish directory `dist/`. There is no build step on the host: run `python3 build.py` locally, commit `dist/`, and point Pages at it. Set `price`, `turnaround`, `stripe_url` and `contact_email` in `config.json` and rebuild before anything goes public. The form is mocked in v1 and posts nowhere; the `TODO` in `partials/form.html` marks where the POST goes later.

## Sources

The reference repositories are read for token values, component anatomy and behavior only. Their locations live in `sources.local.json`, which is gitignored and never read by the build.
