# shapshyftrs

Landing page mockups: three variants of one page, thirteen teasers. Plain HTML, CSS and JavaScript, assembled by two small Python scripts. No framework, no bundler, no npm.

## What is here

- `variants/` — the three page skeletons: `a-keynote.html`, `b-wall.html`, `c-reel.html`.
- `partials/` — the pieces every variant shares: the head (one Google Fonts link), the chrome styles, the hero, the gallery intro, how it works, the offer, the form, the footer, and the shared play/pause runtime.
- `teasers/` — the thirteen teasers, `t01-fork-rail.html` to `t13-constellation.html`, each self-contained (markup, scoped CSS, scoped JS) and included verbatim by the variants.
- `tokens/` — the page chrome tokens, the shared stage rules, and the four source token sets (GTM OS, AESDR, the cockpit, NRDI).
- `dist/` — the built pages. `variant-a-keynote.html`, `variant-b-wall.html` and `variant-c-reel.html` are single files that open from the filesystem; `teasers/index.html` is the contact sheet; `teasers/tNN-*.html` are one-teaser pages used for stills.
- `screens/` — screenshots of every variant at 1440×900 and 390×844, and every teaser's resting frame at 1600 wide.
- `DESIGN.md`, `SOURCES.md`, `ASSUMPTIONS.md` — the token plan and rule-10 review, what was read from where, and every decision made where the brief was silent.
- `config.json` — the variables substituted at build time (price, turnaround, slogan, contact email, payment link, source links, label switches).

## Build

```
python3 build.py
```

Writes `dist/`. Standard library only. The build inlines the partials, the token files (with their provenance comments stripped) and the teasers into each variant, and substitutes `${PRICE}`, `${TURNAROUND}`, `${CONTACT_EMAIL}`, `${SLOGAN}`, `${PAY_HREF}` and `${CHROME_FONT}` from `config.json`. Missing or malformed teasers are skipped with a warning; `BUILD_STRICT=1 python3 build.py` requires all thirteen and is the release check.

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

## Deploy

Cloudflare Pages, static, publish directory `dist/`. There is no build step on the host: run `python3 build.py` locally, commit `dist/`, and point Pages at it. Set `price`, `turnaround`, `stripe_url` and `contact_email` in `config.json` and rebuild before anything goes public. The form is mocked in v1 and posts nowhere; the `TODO` in `partials/form.html` marks where the POST goes later.

## Sources

The reference repositories are read for token values, component anatomy and behavior only. Their locations live in `sources.local.json`, which is gitignored and never read by the build.
