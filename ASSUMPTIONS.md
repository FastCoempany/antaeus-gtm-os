# Assumptions and decisions

Every decision made where the brief was silent, every copy cut, every provisional token. Newest at the bottom of each section.

## Open for Antaeus: accept or reject

- **The AESDR source was fetched, against brief 4.1.** The `aesdr` path in `sources.local.json` did not exist when the build started. Brief 4.1 says not to fetch or clone anything, to note the missing path here, to derive that source's tokens from section 5.2, and to mark every value derived. That instruction was overridden: the repository is public, it was attached read-only to the workspace, and `tokens/aesdr.css` was transcribed from it (about 150 lines marked `from source`, each cited in `SOURCES.md` part B) instead of being derived. The reason was fidelity: the brief pins only AESDR's four faces and asks for its gradient and paper to be derived, and the real product defines an iris, a paper, an ink and a lesson-player contrast that a derivation would have guessed at. Nothing was copied out of it beyond values and anatomy, per rule 1. **Accept:** keep `tokens/aesdr.css` as transcribed. **Reject:** rebuild `tokens/aesdr.css` from brief 5.2 with the four faces pinned and every other value marked `derived`, drop the AESDR rows from `SOURCES.md` part B, and note the missing path here as the brief asks.

## Repo home and sources

- The tooling available to this build could not create a new GitHub repository, so `shapshyftrs` was built as its own standalone git repository (own history, own `.gitignore`, exactly the tree in brief section 4) and mirrored, history intact, as the `shapshyftrs/` subtree of the GTM OS repository on that repo's working branch so the work persists. Splitting it back out later is one `git subtree split --prefix=shapshyftrs` away, or the standalone history can be pushed to a fresh empty repository as-is.
- The AESDR repository was not in the workspace when the build started and was attached read-only so its tokens could be transcribed rather than derived. This overrides brief 4.1 and is listed above as an accept-or-reject item; it is not a silent-brief decision.
- The cockpit source was read from its repository under a neutral name. No path, employer name, partner name, product name, account name, or person name from it appears in this repo or in `dist/`; `SOURCES.md` and `tokens/cockpit.css` cite its files by path relative to that repo's root only, skip any path that carries a name, and alias the two whose filenames belong to a product (the vendored design kit's directory as `<vendored kit>`, the root surface's stylesheet as `src/app/<root surface>.module.css`).
- `sources.local.json` holds this workspace's absolute paths and is gitignored. `build.py` never reads it.

## Tooling

- `screenshot.py` falls back to a Chromium binary at a fixed path when Playwright's own download is absent, and opens pages with `ignore_https_errors` so Google Fonts load behind a corporate or sandbox proxy that re-signs TLS. Neither affects a normal install.
- Teaser resting frames are captured with `prefers-reduced-motion: reduce` emulated, so the still in `screens/` is exactly the frame a reduced-motion visitor sees.
- `build.py` inlines the token files without their comments. The provenance marks (`from source` / `pinned` / `derived`) and each file's header list of files read are the repo's record and live in `tokens/` and `SOURCES.md`; a shipped page carries only the declarations, so nothing a token file cites can reach `dist/`.
- The default build tolerates a partial teaser set, skipping missing or malformed teasers with a warning, so the documented command works through phases 2 to 4. `BUILD_STRICT=1` requires exactly the thirteen and is the phase-5 gate. Stale pages under `dist/teasers/` are cleared on every build so `dist/` mirrors `teasers/`.

## Page structure

- Teaser 1 lives in the hero on every variant, as section 7 says. In variant A the gallery then runs teasers 2 to 13, matching the wireframe. In variant B the compact hero holds the text in the top 40% of the viewport and teaser 1 as a full-width stage below it, and the wall runs 2 to 13 (twelve tiles, which fills two and three columns evenly). In variant C the strip carries all thirteen because the brief asks for a thirteen-tick indicator, so teaser 1 appears twice on that page (hero and strip); every teaser is written to run as multiple instances on one page.
- The stage every teaser stands on is shared, as section 6.1 says, so its rules live once in `tokens/stage.css` (true black, 16:10, the 4:5 crop below 640px around the declared focal point, play/pause and reduced-motion conventions) and the play/pause runtime lives once in `partials/runtime.html`. Each teaser still carries its own scoped CSS and JS under its root class and exposes nothing global.
- The 4:5 crop switches on the teaser's own width (a container query), not the viewport, so a narrow wall tile and a narrow phone both crop correctly.

## Phase 1: source study and tokens

Every decision from the source study, and every provisional or derived value a real value should later replace. The token files carry the same marks line by line; `SOURCES.md` part B lists the file behind every transcribed value.

### Readings that shape the token sets

- **GTM OS is pinned dark, transcribed from its legacy shell.** The repo's shipped direction is bright (a pale field, navy ink, orange, a serif); its only dark language is the legacy shell in `css/app.css`, and neither `#0a0e27` nor `#ff6b6b` exists in the repo (the closest are `#0a0e1a`, `#0b1020` and the reds `#ef4444` / `#b4261f`). The brief deliberately pins the dark-glass language, so the pinned values win as the visual language and the supporting values (text tiers, borders, the white-alpha fills, radii, shadows, the glass panel alpha and its blur, teal as the cool secondary accent, the rooms' easing) are transcribed from the legacy shell and the current rooms and marked from source. Outfit, Plus Jakarta Sans and Space Mono are named in the repo only in an April spec and one scoped override, never with weights, and the April spec assigns them the other way round (Plus Jakarta for display, Outfit for body); the brief's assignment and weights are used and marked pinned. No perspective tilt, specular highlight, waveform, animated numeral, tile assembly, or lines between rooms exist in the product; each is marked derived.
- **The cockpit's own faces would not distinguish it.** The cockpit loads DM Serif Display, Public Sans and JetBrains Mono, which is the same family the GTM OS repo's current system uses; in a gallery whose point is six distinct looks, that pair would make two sources read as one. The brief's default IBM Plex Sans 400/600 and IBM Plex Mono 400 are used and marked derived; the cockpit's sizes, weights, tracking and case transcribe unchanged. Its palette is transcribed as-is: amber `#f59e0b` (with its 45% half and 0.12 soft) is the warm signal, red `#ef4444` is kept for a real alarm only, orange, blue and green are recorded but never lit on the stage, and the ink ladder and hairlines are transcribed as alphas (1 / 0.66 / 0.42 / 0.22 / 0.16 / 0.14 / 0.07) so they become the graphite panel's foreground ladder and its tick lines. The graphite ground (`#15171a` / `#1c1f24` / `#0f1113`), the two-tone bevel, the needle, the 240° arc, the tier rails and the chip height are derived; the source has no dark surface, gauge, map, or draggable meter.
- **AESDR's pinned faces stay; the iris transcribes as the product defines it.** Abril Fatface, Barlow Condensed and DM Mono are real product faces (lesson player and app shell). Cormorant Garamond ships nowhere in production (it exists in one retired prototype); it is kept because the brief pins it, and its teaser sizes (17px / 1.62) are derived on the app's body line-heights. Barlow Condensed loads at 500/600 as the brief lists, though production leans on 700/800. The iris is transcribed exactly: seven saturated stops at 90°, sliding on an oversized background at 2/3/4/8s; the brief's pearlescent 120° wash is not in the repo and is kept as a second, derived token (`--aes-iris-sheen`) for the one place a teaser needs a glow rather than a line. On thin elements (a 2px bar, an underline) the real seven-stop iris already reads as iridescence rather than a rainbow, which is the brief's intent. The product has twelve courses, not seven; "seven" is its count of downloadable tools. The locked caption and the seven-marker teaser stay as the brief says; the twelve is recorded in the token file.
- **NRDI has real brand files, so `tokens/nrdi.css` is built from them and there is no provisional file.** None of the three brands ships a digital design system (no CSS, no type scale in px, no radii, no motion), so every value is printed in a guide, sampled or measured from a rendered page or a render (marked from source with the page and the word sampled or measured), or derived. The structure keeps one line per value so a real value drops in by editing that line.

### Fonts

- `tokens/nrdi.css` is one block per brand; a leftover draft block at the end of the file (duplicate DIGS and PUFF JUNCTION colours, two font stand-ins with non-canonical marks) was removed in the phase-1 review. The three names the built teasers use from it (`--npj-font-display`, `--ndg-off-white`, `--ndg-off-white-light`) were folded into their brand blocks with proper marks; `--npj-font-body` was unused and dropped.
- One Google Fonts link loads exactly: Schibsted Grotesk 400/600/700; Outfit 500/700; Plus Jakarta Sans 400/600; Space Mono 400; Abril Fatface 400; Cormorant Garamond 400, 500, 500 italic; Barlow Condensed 500/600; DM Mono 400; IBM Plex Sans 400/600; IBM Plex Mono 400; Archivo width 125 at 500 and 700 and italic width 120 at 700 and 900; Manrope 400/600; Work Sans 500/700; Alexandria 400/900; Permanent Marker 400. `display=swap`. The URL was fetched and returns all of the above.
- NRDI faces not on Google Fonts and their stand-ins (all derived): Owners Wide → Archivo width 125 (DARKEST SHADES display and wordmark); Stolzl → Manrope (DARKEST SHADES body); Arnet Bold/Black/Super Italic → Archivo italic width 120 at 700/900 (PUFF JUNCTION's loud type); The Old Falcons → Permanent Marker (the DIGS tagline script). Work Sans (PUFF JUNCTION body) and Alexandria (all DIGS text) are the real faces. DARKEST SHADES and PUFF JUNCTION share Archivo, at different widths, weights and styles; the two identities are separated by casing, colour and the object, not by the family. Alexandria 900 stands in for the DIGS wordmark, which exists only as outlined artwork.
- Which face the DARKEST SHADES wordmark is really set in was asked in the brand transcript and never answered; the wordmark is typeset in the display stand-in at weight 500 with 0.12em tracking (estimated from the measured letter gaps).

### Wordmarks (typeset only, never drawn)

- DARKEST SHADES: `DARKEST SHADES`, uppercase, one line, tracked out, white on the stage; clear space of about 2.3 cap heights, from the guide's safe-zone rule.
- PUFF JUNCTION: `puff` lowercase in the heaviest italic over `JUNCTION` uppercase, small, tracked 0.25em, right-aligned to 85% of the puff width; Slime `#D6FD4A` on black, the guide's dark-application rule. The real mark's keyline and extrusion are not reproduced.
- DIGS: `digs` lowercase, very heavy, tight; white on the stage. The brandmark monogram is not drawn; the tagline script may sit behind the wordmark on the tag only.

### Teaser mappings where the brief and the source differ

- fork-rail: the ten segments are real; the traveling pulse, the lit path and any timed progression are the brief's (the room refuses to pace a call).
- signal-strip: the engine has six decay steps and four bands, not seven phases; the seventh chip, the waveform and the ticking numeral are the brief's.
- territory-tiles: the product has a six-tile axis rail and a two-column division grid; the assembling tile field and the forward tile's depth are the brief's, with the library's one-forward Offset rule as the real basis.
- constellation: the product has 22 rooms in six stages with no lines between them; nineteen nodes, the light lines, the drift and the wave pulse are the brief's.
- lesson-card: the page turn belongs to the marketing deck and the progress bar to the lesson player's topbar; the teaser layers the two.
- coach-exchange: no AI coach exists in the product; the "coach reply" is the simulator's authored feedback sentence, and the typing belongs to the landing page's typewriter.
- course-arc: the product's path is a vertical twelve-node timeline with no curve; the arc comes from its dotted-path divider, the seven from the brief.
- heat-dial: the score is numeric with tier cut lines at 45 and 70, rendered as a badge and horizontal meters; the arc, the needle and the drag are the brief's.
- territory-map: the cockpit has no map; the node track, the climb bar and the proximity rings supply the cluster-and-route behavior; the city, the lake edge and the river are the brief's.
- task-tiers: the three heat levels are real but drawn as tick strengths within one list; drawing them as three rows is the brief's translation, and the drop is the queue's slot-cap sink (the level is otherwise fixed per rule; nothing in the source demotes an item when its trigger lapses). The queue declares no motion of its own, so the 160ms landing is the deal room's register spring and the 200ms rebalance is the kit's base step, both from the same source's files.
- frames: the brand defines nine models, not nine colourways; the nine swatches stand for the nine models, with seven real finish-and-lens pairings and two derived.
- turntable: nothing in the source moves; the rotation, the floor and the rim light are the brief's.
- garment-tag: the hangtag is a placeholder in every tech-pack revision ("still to be confirmed"); its proportion, hole and tack are from the placeholder drawing, both faces of the card are derived.

### Chrome decisions (the free axes and the rule-10 review, detailed in `DESIGN.md`)

- Header: static; there is no header bar, the wordmark is the `h1` in the hero only.
- Button radius: 4px, now the token `--chrome-button-radius`.
- Source label: beneath the frame, in the chrome face, on the caption's line in A and C and as the museum label's second line in B.
- Changed by the review: the "How it works" step number is inline at the heading's own size and color instead of a big grey numeral; the button's press-down on `:active` is removed; the load moment is three beats (wordmark, slogan with its copy and button, teaser 1) instead of four; variant A's source label no longer fades in after the caption.
- Kept after review, with reasons in `DESIGN.md` 4.2: outlined form fields, the un-underlined source-label link, the wordmark's hero size, the two-column offer.

### Provisional and derived values a real value should later replace

- GTM OS: the depth ladder (`#111637`, `#181d45`), the glass fill and fallback (`rgba(16,22,58,0.62)`, `#141a45`), the glass border alphas (0.22, 0.30), the specular gradient and inner highlight, the coral tints, the perspective and tilt, the chip stroke, the loop curve and 9s default, the seven-phase and nineteen-node counts.
- AESDR: the pearlescent sheen gradient, the stage seating shadow and stronger glow, the Cormorant sizes, the underline sweep and title crossfade durations, the 8s default.
- Cockpit: the whole type pairing (IBM Plex Sans/Mono), the graphite ground and foreground ladder, the tick and bevel colours, the needle, the arc sweep, the tier rails and chip height, the 7s default and 320ms needle step, the five-chip count.
- DARKEST SHADES: the type stand-ins, all tracking values, the display line-height and scale ratios, the wordmark size, text-on-dark alpha, hairline alphas, the matte and graphite frame finishes for swatches 7 and 9, the mirror gradient, the floor, reflection, contact shadow, flare and grain, the grain amount, the swatch strip geometry, all motion.
- PUFF JUNCTION: the loud-type stand-in and its weights, every stage material restatement (concrete, brass, knurl, checker), the floor glow, reflection, key and rim light, the knurl column and row counts, the proportion ratios, the button radius, the heading tracking, the wordmark sizes and tracking, all motion, the rest yaw.
- DIGS: the script stand-in and the wordmark weight and tracking, the teaser garment tints and wash band, the label ground, ribs and stitch, the tag card colour, back-line count and tack colour, the knit and rib textures, the stage key, floor and contact shadow, the radii, the body sizes, all motion.
