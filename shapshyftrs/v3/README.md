# shapshyftrs

A one-page site for a service: send us three sentences about a thing you want
to build, and five days later you get a real page for it, in a browser, for
$75.

The page argues that by showing five pages it has already made. They are real
pages, built from five real brands' own material — the renders, the
photographs, the vector marks, the measured dimensions, the palettes and the
words. Each one is embedded live, and each one opens full size.

## How it is built

The page is one self-contained HTML file. Every image is inlined, so `dist/`
has no dependencies and nothing to break.

```
mockups/*.html     one complete document per piece of work
page.html          the marketing page, with directives where material goes
config.json        price, days, email, and the order the work appears in
assets/            the images the mockups inline
lib/measure.py     measures each mockup so the page can frame it whole
lib/lexicon.json   every proper noun the pages are allowed to say
build.py           resolves directives, writes dist/, sweeps dist/
accept.py          drives the built page and measures it
walk.py            renders a page at a width and shoots it in viewport steps
preview.py         renders one mockup and shoots it
```

Build, then check:

```
python3 build.py
python3 accept.py
```

`build.py` writes `dist/index.html` and a standalone `dist/work/<slug>.html`
per mockup, from the same bytes. It then removes anything in `dist/` it did
not just write, because `dist/` is the only thing published and a file that
outlives its build goes out to real visitors.

## The directives

`page.html` and the mockups carry a few `{{…}}` directives. An unresolved one
fails the build.

| Directive | What it does |
|---|---|
| `{{ASSET:name}}` | inlines `assets/name` as a data URI |
| `{{SVG:name}}` | inlines `assets/name.svg` |
| `{{MOCKUP:slug}}` | the whole built mockup, escaped into a `srcdoc` |
| `{{MOCKUP_H:slug}}` | the mockup's measured height, so the frame shows it whole |
| `{{MOCKUP_META:slug.field}}` | one header field: `brand`, `kind`, `title`, `line`, `built` |
| `{{PRICE}}` `{{DAYS}}` `{{EMAIL}}` `{{SLOGAN}}` | from `config.json` |

Each mockup declares those fields in a header comment at the top of its file.
`MOCKUP_META` refuses a field that is longer than a label or contains markup,
because a meta field is a label and never a document — the first build of this
page wired one to the wrong key and printed five source files into its own
body while reporting success.

## The acceptance pass

`accept.py` drives a real browser at 1440, at 390, and with motion reduced,
and reports the number it measured for each of 23 checks. A pass is evidence;
a failure names what was wrong. It exits 1, so it is usable as a gate.

It covers what would actually ship (no person's name, no out-of-scope brand,
no source path, no proper noun that has not been looked at, no dangling
reference, nothing stale in `dist/`, no unresolved directive, page weight, and
that the embedded and standalone copies of each mockup are byte-identical),
then the page itself (no errors, no source printed
into the body, every frame carrying a rendered document, nothing sliced by its
frame or scaled wrong, no sliced or overprinted type, one dominant move per
surface, the chrome arriving and leaving on cue, every anchor resolving, every
image described), then the phone, then reduced motion.

Thirteen of the twenty-three have been run against a planted defect of the
kind they exist to catch, and caught it: a contractor's name, an out-of-scope
brand and a source path (1), an invented surname (1b), a deleted work page (2), a document printed into the
body (8), a blanked frame (9), a frame too short for its mockup (10), a wrong
scale (11), a clipped headline (12 and 19), a second competing primary (13),
chrome that never arrives (14), a reveal that never fires (21), and an
animation that outranks the reduced-motion rule (22). The other ten are
readings rather than judgements — a byte comparison, a file list, a weight, a
count of unresolved directives — and report the number they read.

## Two things to know before changing anything

**Fonts.** The checks measure fit and overflow, so a page judged in fallback
type is not the page. The shared cache at `../.fontcache` answers Google Fonts
locally; `../fetchfonts.py` adds faces to it.

**Names.** No contractor's name goes into any file, comment, commit message,
caption or shipped asset, and assets are cited by filename only — the folder
paths in the source archives carry people's names. `accept.py` check 1 holds
that line on every build, against hashed names so the guard is not itself the
place they are written. A hashed list can only catch a name it knows, and it
missed an invented one once, so check 1b banks every capitalised word the
pages put in front of a reader in `lib/lexicon.json` and fails on a new one.
Adding a proper noun is a deliberate edit, and the review is the point.

`SOURCES.md` says what is real on each page and what is ours.
`ASSUMPTIONS.md` says where the material ran out and what was done instead.
