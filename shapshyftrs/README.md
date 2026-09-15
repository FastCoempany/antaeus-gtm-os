# shapshyftrs

The landing page. Three variants of one page, built from five real brands.

Plain HTML, CSS and JavaScript. Python standard library for tooling. No
framework, no bundler, no npm dependency in the page.

**The repository is private. Only `dist/` is ever published** — `study/` and
`SOURCES.md` index private codebases and name real asset files.

---

## Build

```sh
python3 build.py                 # assemble dist/
BUILD_STRICT=1 python3 build.py  # require all twelve frames; the phase-6 gate
```

Output:

```
dist/variant-a-keynote.html      one frame per viewport, snapped
dist/variant-b-wall.html         a dense wall, three columns at 1440
dist/variant-c-reel.html         a horizontal strip
dist/frames/index.html           the contact sheet, all twelve at once
dist/frames/tNN-<id>.html        one frame per page, for stills
```

Each page opens from the filesystem with no server and no build step. The only
network request is the font stylesheet.

## Preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1
# then open http://127.0.0.1:4173/dist/variant-a-keynote.html
```

## Screenshots

```sh
python3 screenshot.py --fetch-fonts   # once: cache the declared faces locally
python3 screenshot.py                 # capture screens/
python3 screenshot.py --variants      # variants only
python3 screenshot.py --frames        # frame stills only
python3 screenshot.py --live          # frames mid-loop instead of at rest
```

**Run `--fetch-fonts` first.** Without the cache, a blocked or slow font
request renders the page in a system fallback, and a screenshot taken that way
looks plausible and is wrong — the first version of this page shipped a full
set of stills set in Times because nothing checked. `screenshot.py` now refuses
to capture unless a declared face has actually loaded, and says so.

Re-capture `screens/` after any change to a frame, a material, a token or a
variant. The stills in the repo are only as true as the last run.

## Source extraction

```sh
python3 extract.py pdf-text  <file> [--pages 1-6]
python3 extract.py pdf-pages <file> <outdir> [--dpi 110]
python3 extract.py sample    <image> <x> <y> <w> <h>
python3 extract.py swatches  <image> [--grid 4x3]
python3 extract.py step-bbox <file.step>
python3 extract.py svg-paths <file.svg>
```

This is what makes "fidelity is measured, not remembered" enforceable. `sample`
returns a hex and a luminance spread; `step-bbox` returns real millimetres;
`pdf-pages` renders an image-only export so a brand guide with no text layer
can still be read.

Source paths live in `sources.local.json`, which is gitignored because it
points at private working repos. Copy the template and fill in the five keys:

```json
{
  "puff-junction":  "/path/to/…",
  "darkest-shades": "/path/to/…",
  "digs":           "/path/to/…",
  "aesdr":          "/path/to/…",
  "antaeus":        "/path/to/…"
}
```

`build.py` never reads it.

## Layout

```
build.py        assembles dist/ from the parts
extract.py      source extraction
screenshot.py   captures screens/
config.json     price, turnaround, contact, slogan, links, asset policy
tokens/         one file per source, plus the chrome and the shared stage
materials/      reusable recipes for real surfaces
frames/         one self-contained file per frame
partials/       the page chrome the three variants share
variants/       the three page templates
study/          the source studies — never published
dist/           build output — the only published directory
screens/        captures
```

## Adding or changing a frame

1. Read the source study first. A frame built for a source whose study you have
   not read is how the first version happened.
2. Compose existing materials. If you need a new surface, it goes in
   `materials/` with its source file, its measurements and its honest limits in
   the header — not inline in the frame.
3. Give the frame a header comment `build.py` can parse:
   `<!-- frame id=… num=… source=… focal=x%,y% loop=… interactive=yes|no -->`
4. Run the three tests from `BRIEF.md` §4.3 and write the answers into
   `SOURCES.md` §5 as you go.
5. Check the phone crop. Below 640 px the stage shows a band half the scene's
   width around the focal point; anything outside it is cut. Six of twelve
   frames needed a phone layout.
6. Rebuild, then re-run the checks and re-capture the stills:

   ```
   BUILD_STRICT=1 python3 build.py     # strict refuses to build a short set
   python3 accept.py                   # BRIEF.md §15, measured in a real browser
   python3 screenshot.py               # variants and every frame's resting state
   ```

   `accept.py` and `screenshot.py` both need the font cache, or they will judge
   the page in Times and Arial: `python3 screenshot.py --fetch-fonts` writes it
   once into `.fontcache/` (gitignored).

## Deploy

`dist/` is a static directory. Any static host serves it as-is.

## Reading order

`BRIEF.md` is the contract. `PHASE-7.md` is the adversarial read of the
finished build — what it refuted, what was done about it, and what it tried to
refute and could not. `study/` is the evidence. `SOURCES.md` says where
every value came from. `DESIGN.md` is the token and material plan with the
review against the brief's list of generic tells. `ASSUMPTIONS.md` is every
decision made where the brief was silent, every deviation, and every gap in the
source material.
