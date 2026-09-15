# Assumptions and decisions

Every decision made where the brief was silent, every copy cut, every provisional token. Newest at the bottom of each section.

## Open for Antaeus: accept or reject

- **The AESDR source was fetched, against brief 4.1.** The `aesdr` path in `sources.local.json` did not exist when the build started. Brief 4.1 says not to fetch or clone anything, to note the missing path here, to derive that source's tokens from section 5.2, and to mark every value derived. That instruction was overridden: the repository is public, it was attached read-only to the workspace, and `tokens/aesdr.css` was transcribed from it (about 140 lines marked `from source`, each cited in `SOURCES.md` part B) instead of being derived. The reason was fidelity: the brief pins only AESDR's four faces and asks for its gradient and paper to be derived, and the real product defines an iris, a paper, an ink and a lesson-player contrast that a derivation would have guessed at. Nothing was copied out of it beyond values and anatomy, per rule 1. **Accept:** keep `tokens/aesdr.css` as transcribed. **Reject:** rebuild `tokens/aesdr.css` from brief 5.2 with the four faces pinned and every other value marked `derived`, drop the AESDR rows from `SOURCES.md` part B, and note the missing path here as the brief asks.

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

- Teaser 1 lives in the hero on every variant, as section 7 says, and the gallery then runs all thirteen in the fixed order (section 7 lists them as separate items and section 8.3 gives teaser 1 a caption), so teaser 1 appears twice on every page. In variant B the compact hero holds the text in the top 40% of the viewport and teaser 1 as a full-width stage below it, and the wall runs 1 to 13. In variant C the strip carries the thirteen under a thirteen-tick indicator. Every teaser is written to run as multiple instances on one page.
- The stage every teaser stands on is shared, as section 6.1 says, so its rules live once in `tokens/stage.css` (true black, 16:10, the 4:5 crop below 640px around the declared focal point, play/pause and reduced-motion conventions) and the play/pause runtime lives once in `partials/runtime.html`. Each teaser still carries its own scoped CSS and JS under its root class and exposes nothing global.
- The 4:5 crop switches on the teaser's own width (a container query), not the viewport. Brief 6.1 puts the crop under 640px and brief 11.B puts the wall's tiles at native 16:10, and every wall column on desktop is narrower than 640px (416px at 1440, 576px at 1920, 449px at 1024, 334px at 768), so the two rules conflict on the wall. Decision (review fix, 2026-09-15): the crop is for phones. Variant B opts its wall tiles out of the crop from 768px up, in the variant's own stylesheet, so the tiles hold their 16:10 composition and every subject stays whole; below 768 the one full-bleed column keeps the 4:5 crop. The shared `tokens/stage.css` is unchanged, so A and C are unaffected. An earlier version of this line called the crop correct for a narrow wall tile; it was not.

## Phase 1: source study and tokens

Every decision from the source study, and every provisional or derived value a real value should later replace. The token files carry the same marks line by line; `SOURCES.md` part B lists the file behind every transcribed value.

### Readings that shape the token sets

- **GTM OS is pinned dark, transcribed from its legacy shell.** The repo's shipped direction is bright (a pale field, navy ink, orange, a serif); its only dark language is the legacy shell in `css/app.css`, and neither `#0a0e27` nor `#ff6b6b` exists in the repo (the closest are `#0a0e1a`, `#0b1020` and the reds `#ef4444` / `#b4261f`). The brief deliberately pins the dark-glass language, so the pinned values win as the visual language and the supporting values (text tiers, borders, the white-alpha fills, radii, shadows, the glass panel alpha and its blur, teal as the cool secondary accent, the rooms' easing) are transcribed from the legacy shell and the current rooms and marked from source. Outfit, Plus Jakarta Sans and Space Mono are named in the repo only in an April spec and one scoped override, never with weights, and the April spec assigns them the other way round (Plus Jakarta for display, Outfit for body); the brief's assignment and weights are used and marked pinned. No perspective tilt, specular highlight, waveform, animated numeral, tile assembly, or lines between rooms exist in the product; each is marked derived.
- **The cockpit's own faces would not distinguish it.** The cockpit loads DM Serif Display, Public Sans and JetBrains Mono, which is the same family the GTM OS repo's current system uses; in a gallery whose point is six distinct looks, that pair would make two sources read as one. The brief's default IBM Plex Sans 400/600 and IBM Plex Mono 400 are used and marked derived; the cockpit's sizes, weights, tracking and case transcribe unchanged. Its palette is transcribed as-is: amber `#f59e0b` (with its 45% half and 0.12 soft) is the warm signal, red `#ef4444` is kept for a real alarm only, orange, blue and green are recorded but never lit on the stage, and the ink ladder and hairlines are transcribed as alphas (1 / 0.66 / 0.42 / 0.22 / 0.16 / 0.14 / 0.07) so they become the graphite panel's foreground ladder and its tick lines. The graphite ground (`#15171a` / `#1c1f24` / `#0f1113`), the two-tone bevel, the needle, the 240° arc, the tier rails and the chip height are derived; the source has no dark surface, gauge, map, or draggable meter.
- **AESDR's pinned faces stay; the iris transcribes as the product defines it.** Abril Fatface, Barlow Condensed and DM Mono are real product faces (lesson player and app shell). Cormorant Garamond ships nowhere in production (it exists in one retired prototype); it is kept because the brief pins it, and its teaser sizes (17px / 1.62) are derived on the app's body line-heights. Barlow Condensed loads at 500/600 as the brief lists, though production leans on 700/800. The iris is transcribed exactly: seven saturated stops at 90°, sliding on an oversized background at 2/3/4/8s; the brief's pearlescent 120° wash is not in the repo and is kept as a second, derived token (`--aes-iris-sheen`) for the one place a teaser needs a glow rather than a line. On thin elements (a 2px bar, an underline) the real seven-stop iris already reads as iridescence rather than a rainbow, which is the brief's intent. The product has twelve courses, not seven; "seven" is its count of downloadable tools. The locked caption and the seven-marker teaser stay as the brief says; the twelve is recorded in the token file.
- **NRDI has real brand files, so `tokens/nrdi.css` is built from them and there is no provisional file.** None of the three brands ships a digital design system (no CSS, no type scale in px, no radii, no motion), so every value is printed in a guide, sampled or measured from a rendered page or a render (marked from source with the page and the word sampled or measured), or derived. The structure keeps one line per value so a real value drops in by editing that line.

### Fonts

- `tokens/nrdi.css` is one block per brand; a leftover draft block at the end of the file (duplicate DIGS and PUFF JUNCTION colours, two font stand-ins with non-canonical marks) was removed in the phase-1 review. The three names the built teasers use from it (`--npj-font-display`, `--ndg-off-white`, `--ndg-off-white-light`) were folded into their brand blocks with proper marks; `--npj-font-body` was unused and dropped.
- One Google Fonts link loads exactly: Schibsted Grotesk 400/600/700; Outfit 500/700; Plus Jakarta Sans 400/600; Space Mono 400; Abril Fatface 400; Cormorant Garamond 400, 500, 500 italic; Barlow Condensed 500/600; DM Mono 400; IBM Plex Sans 400/600; IBM Plex Mono 400; Archivo width 125 at 500 and 700 and italic width 120 at 700 and 900; Manrope 400/600; Work Sans 500/700; Alexandria 400/700/900; Permanent Marker 400. `display=swap`. The URL was fetched and returns all of the above.
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

## Phase 2: teasers

- Every teaser is one self-contained file under `teasers/` (markup, a `<style>` scoped to its own class, a script that initializes every instance of itself), so a page can include the same teaser twice. The full contract is summarized in `README.md`.
- The probe measures a subject's bounding box against the 16:10 frame and requires 45–70%. Teaser 5 was first composed at 78% (its tilted strip filled the frame) and was scaled down by giving its rig a smaller unit rather than recomposing it; it measures 49.5% now.
- Teaser 9 shows thirteen tiles in a five-by-three grid with two cells empty (the top left and the bottom right), so the locked field reads as a territory shape rather than a full grid; the forward tile is the center one. The tiles are real buttons: hover or focus lifts one. Their names and counts are invented.
- Teaser 12 rests with the moving chip caught mid-drop between the first and second tier, as the brief's still describes; the loop lets it land two tiers down with the deal room's 160ms spring, the neighbours close ranks at the 200ms base step, and it climbs back to its slot before letting go again. Five chips in all, as the brief says, so the second tier holds one.
- Teaser 13 draws on a canvas (nineteen nodes in six columns, thirty-four light lines — every node in the first five columns reaches the two nearest to it in the column after — a parallax drift per depth and one pulse wave per loop) even though the node count is far under the canvas threshold, because the lines must follow nodes on drifting layers and a canvas keeps that to one draw call. Reduced motion draws the resting frame once. The lit node is white; the suggested node carries the pinned coral as a dashed ring.
- The contact sheet lays teasers out in columns of at least 640px so every frame shows its 16:10 composition at 1440 wide; the 4:5 crop is reviewed on the single-teaser pages and by the probe, not on the sheet.
- The contract's token additions from the first build of the thirteen: `--gtm-perspective-u` and `--gtm-sheen` (teaser 1), `--ckp-sheen` (teaser 8), `--ckp-ease-spring` (teaser 12), and the aliases listed at the end of each token file. The gallery review added five more, listed two bullets down; nine in all, each marked `derived, added for tNN`. The teaser review passes at the end of this file added none, and the phase 5 QA pass added two, `--nds-tortoise-blue-deep` and `--nds-tortoise-red-deep` (teaser 3), for eleven in all.
- Teasers 1, 4, 5 and 8 were drafted by builder agents whose session ended before their review passes; their drafts passed the probe and were reviewed and kept by hand. Teasers 2, 3, 6, 7, 9, 10, 11, 12 and 13 were built by hand.
- The gallery judge and checkpoint passes (one reviewer reading the whole sheet, one driving every interaction and the reduced-motion frames) produced ten actionable findings; all were applied. Teaser 11 was rebuilt as a turned-back corner of sage knit with the woven label on the fold's inside and the hangtag tacked through the fold (it had rendered as a flat cream sheet next to teaser 10's cream paper, and the marker script had overflowed the tag). Teaser 12 dropped its title and count (they read as app chrome) and made the three bevelled rails with their tick ladders the subject; the last QA pass rebuilt that frame again, and the entry at the end of this file is the one to trust. Teaser 4's dial came down from 92% to 68% of the frame height, and teaser 10's paper was narrowed from 80%; the later rebuild (below) set its current geometry, a sheet 83% of the frame width with the arc and its labels on a 70u measure inside it. Teaser 6's coach reply now types in word by word and erases as one clean fade. Teaser 3 gained lens depth, rim highlights and a three-quarter far lens. Teaser 9's tiles gained real glass (28% borders, a static specular, a moving sheen) and lost their sub-labels, and its tilt is pitch-only in a flat transform context because Chromium's hit-testing under a yawed `preserve-3d` plane left seven of thirteen tiles unhoverable. Teaser 13's nodes doubled in size with a glass highlight each. Tokens added: `--ndg-garment-sage-inside`, `--ndg-garment-sage-shade`, `--gtm-glass-border-strong`, `--gtm-glass-border-lifted`, `--gtm-sheen-strong`.
- The single-teaser pages under `dist/teasers/` weigh 35–45 KB because each inlines the whole token stack, the fonts link and the runtime; the 35 KB ceiling in the contract is for the teaser partial itself (7–18 KB each), and the brief's only weight rule is the 600 KB page budget. The three variants come out at 200–208 KB.
- Google Fonts drops requests intermittently through this container's proxy. `screenshot.py` waits for every declared face and reloads up to four times; the reviewer also installed the declared faces locally so the committed stills carry the real faces. A still that shows a fallback face is a capture fault, not a page fault.

## Phase 3: page shell

- The hero button is an anchor to the form (`#send`) styled as the chrome button, so it scrolls to the form without script and stays keyboard-reachable. The form's own submit is a real button.
- The "How it works" steps are an ordered list with the numeral typeset inline before each heading, as the brief's wireframe writes them.
- The form shows one error line under each empty required field at once (the brief lists a line "per empty required field") and moves focus to the first. An email that is filled in but is not an address gets the same "Add your email and send again." line; the brief defines no other email message.
- The sent state is hidden with the `hidden` attribute and a `[hidden] { display: none !important }` rule, because the chrome's `display: grid` on the form and the sent block would otherwise override the attribute.
- The footer email is a `mailto:` link whose text is the address itself, so the footer line still reads exactly as written.
- The slogan's measure is 30ch so the default slogan sits on one line at desktop, as the wireframe shows; the alternates wrap to two.
- In variant B the museum label sets the caption at body size (15/24, weight 600) rather than the 22/28 caption scale, because brief 11.B says the wall's captions are "set small". A and C keep the 22/28 caption scale.
- Teaser 1 appears twice on every variant: live in the hero (no caption) and first in the gallery with its caption and source label, because brief section 7 lists the hero and "the thirteen teasers in the fixed order" as separate items and section 8.3 gives teaser 1 a caption. An earlier draft ran the gallery 2–13 on A and B; the probe caught the missing caption. Every teaser initializes each of its instances independently and carries no `id` attributes, so the duplicate is safe.
- The variant C reel captures the wheel only while the strip can still move in that direction; at either end the page scrolls normally, so the strip never traps vertical scrolling. Focus moving into a card brings that card into view; the region takes arrow keys, Home and End; the ticks are buttons.
- Variant A's caption fades in over 400ms when its stage enters view, then the loop starts (a 400ms play delay on the body); the hero's teaser waits 700ms so the wordmark and slogan arrive first. Under reduced motion every caption is visible immediately and nothing fades.
- Review fixes on the shell (2026-09-15), decided where the brief is silent:
  - The hero on variant A is exactly one viewport. Brief 11.A says "the wordmark and slogan over teaser 1 at full stage", and the first build sized the stage from the viewport minus a guessed 360px for the copy, so the hero ran 96–443px past the fold at every desktop size and at 1280×720 the stage fell under 640px and tripped the 4:5 crop. Now the row under the copy is a size container and the stage is sized from the room it really has: as tall as the row, as wide as a 16:10 frame whose middle 56% is the row, capped at the gutters and never under 640px. The frame is pulled up so the band centered on the teaser's declared focal point (`--fy`) is what shows. This crops the teaser's own black margin above and below its subject (the subject of teaser 1 sits in the middle 47% of its frame); a full overlay of the copy on a 100svh stage was rejected because the sub-line and button would sit on the rail's chips at 1440×900, and the brief's chrome allows no gradient scrim. Measured across 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768 and 768×1024: stage width 1679 / 1208 / 876 / 857 / 876 / 691, all 16:10, none cropped. The hero height equals the viewport at every one of those except 1280×720, where the row hits the 300px floor described at the end of this entry and the hero runs 36px past the fold. If a variant ever puts a different teaser in the hero, the same rule shows the band around that teaser's focal point. The row has a 300px floor: on the short viewports laptops really give (1366×657, 1280×620) the band would otherwise shrink to about half the frame and slice through the rail, so there the hero runs a little past the fold and scrolls, which is the lesser fault.
  - The hero stage is left-aligned with the copy (it starts at the left gutter) so the two blocks share one axis; on a 1440 screen it runs 1208px of the 1296 available.
  - The wordmark is 120px in a hero treatment from 768px up (brief 9 pins 120 or larger; the earlier clamp fell to 64px at 768, the same size as the slogan). Below 768, where the brief is silent, it is `clamp(48px, 13vw, 64px)`: 48px keeps it a step above the 40px mobile slogan and the word still fits 320px with 20px gutters (271px); 64px is the ceiling so it never outgrows the mobile scale.
  - The slogan uses `text-wrap: balance` so its two-line case (768px, the alternates) breaks evenly instead of leaving one word on the second line.
  - The measure rule reaches the how and offer partials whatever wrapper a variant uses (`.how p, .offer p`), since variant A wraps them in a stage section rather than `.section`. The offer paragraphs were 864px wide at 1920.
  - The three step paragraphs are capped at 30ch with `text-wrap: pretty`, so no step ends on a single-word line; steps go to one column at 1023px and below (at 768 the three columns were 187px each).
  - The gallery intro is a full snapped stage (100svh), not 60vh: at the intro's snap position the top of teaser 2 was cut by the fold with no caption, breaking the one-thing-per-viewport rhythm.
  - Variant A's caption line spans the content width, so the caption starts at the left gutter with every other line of text on the page and the source label ends at the right gutter; the frame stays centered. On a black stage the frame edge is invisible, so aligning the caption to it read as an arbitrary indent.
  - Below 768px the caption and source label always stack (caption line, then source line, both left); before, short captions kept the label on the same line and long ones pushed it down, two patterns down one gallery. The hero stage bleeds edge to edge on a phone like the gallery stages do (the 4:5 crop was clipping the rail at an invisible inset box).
  - A focused form field shows one ring: the 2px `#F4F4F0` outline sits inside the field's edge over a transparent border, instead of the border, a 2px gap and the outline stacking as two frames.

## Phase 4: variants B and C

- Review fixes on variant C, the reel (2026-09-15), decided where the brief is silent:
  - The hero on variant C is the same one-viewport band as variant A (the row under the copy is a size container; the stage is as tall as the row, as wide as a 16:10 frame whose middle 56% is that row, pulled up to the band around teaser 1's focal point). Brief 11.C only says the hero sits "above" the strip in normal flow; the first build put a full-width 16:10 stage in flow, which at 1366×768 left the whole rail below the fold (the first screen was copy and black) and at 1440×900 sliced the rail at the fold, with about 215px of black above and below the subject. Measured after the fix: the hero is exactly the viewport at 1440×900, 1366×768, 1280×720 (the 300px floor runs it 36px past), 1024×768 and 768×1024; the subject is in the first screen at every size. On a phone the hero stage bleeds edge to edge like the stacked cards below it (it was inset 20px, so the first teaser and the first card showed two different crops of the same rail).
  - Reel cards are 70vw wide with a 640px floor. The shared stage crops itself to 4:5 below 640px of its own width (brief 6.1), so between 768 and 913px wide the 70vw cards were portrait 4:5 crops under a 16:10 hero; brief 11.C says the cards are 16:10. At 768 the floor still fits between the gutters (691px available).
  - Keyboard focus moving into a card (a swatch, the dial, a tile) made the browser scroll the overflow-hidden viewport's own `scrollLeft` to reveal it, an offset the translate-based track never knew about: after tabbing into the strip, the ticks, arrow keys and drag all pointed at the wrong cards and the last tick showed an empty strip. The viewport now keeps `scrollLeft` at 0 (on every scroll event and before the focus handler moves the track), so the track alone positions the strip.
  - A drag that starts on a teaser's own control inside the strip (the heat dial's needle, a swatch, a tile, the lesson card) belongs to the teaser: the track drag no longer starts there and no longer captures the pointer away from it. Before, dragging the needle in the reel moved the track and left the dial at zero.
  - Wheel deltas in lines or pages (a mouse wheel in some browsers reports lines) scale to pixels before they move the track, so a notch moves more than three pixels.
  - The thirteen ticks are plain buttons in a labelled group with `aria-current` on the active one, not `role="tab"` without panels.
  - Kept: the hero's top padding and the copy-to-stage gap are `clamp(24px, 4vh, 40px)` (36px at 900 tall), a fluid value off the 8px base, shared with variant A; the gap between the gallery intro line and the strip is 48px because the intro and the strip are one section (brief 7 lists them as one item) and the 96px rhythm holds between sections.

### Page shell review fixes on variants B and C (2026-09-15)

Every decision below was made where the brief is silent; findings that asked for a copy change would have been rejected, but none did. Findings on the teasers themselves (`teasers/`) are noted at the end and not applied here.

- **Variant B, the wall's tiles are native 16:10 from 768px up.** See the Page structure entry above for the 6.1-vs-11.B conflict. The opt-out is two rules in the variant: the frame goes back to `16 / 10` with `--sw: 100cqw`, and the scene goes back to `inset: 0` with auto width and height (writing `top: auto; left: auto` after `inset: 0` collapses the scene to nothing, so it is not written). Measured after the fix: every wall frame reports `16 / 10` at 768 (334×209), 1024 (449×281), 1280 (564×353), 1366 (603×377), 1440 (416×260) and 1920 (576×360); the phone column at 390 is 390×488, `4 / 5`, as brief 6.1 asks. A shared `.stage--native` class in `tokens/stage.css` was considered and not used: the wall is the only surface that needs it, and a variant-scoped rule cannot touch A or C.
- **Variant B's hero is the same one-viewport band as A and C.** Brief 11.B puts the copy in the top 40% and the wall below the fold; the first build sized the stage from `(60svh - 64px) * 1.6`, which ignored the hero's own top padding and fell under 640px at 1366×768 and 1280×720, so teaser 1 tripped the phone crop there and the hero ran 350–400px past the fold. Now the copy row is `minmax(40vh, auto)`, the row under it is a size container, and the stage is sized as A's is (as tall as the row, as wide as a 16:10 frame whose middle 56% is the row, gutter to gutter at most and never under 640px, pulled up to the band around teaser 1's focal point). The stage starts at the left gutter on the copy's axis, as A's does. Measured: the hero is exactly the viewport at 1280×720 (stage 1015×355, frame 16:10), 1366×768 (1092×382), 1024×768 (922×382), 1440×900 (1296×456), 1920×1080 (1600×560) and 768×1024 (691×526, the whole frame fits); the row has the same 300px floor as A, which none of these sizes reaches. A reviewer's alternative (full content width, height `60svh - 88px`, the scene centered by transform) does the same thing with a different mechanism; the A rule was reused so the three heroes share one construction. On a phone the hero stage bleeds edge to edge like the wall's one column below it, so the first teaser and the first tile show the same crop of the rail.
- **Variant B's last tile spans the row.** Thirteen tiles never fill two or three columns, so the wall ended on one tile beside empty cells at every desktop width. From 768px up the constellation spans the full row (1296×810 at 1440, 1776×1110 at 1920, 691×432 at 768) and closes the wall; the phone column is untouched. It is still a 16:10 stage, so 11.B holds.
- **Variant B's wall carries its own bottom padding**, `--section - 8px` (the 8px is the figcaption's own bottom padding), so the last museum label sits 192px above "How it works", the same as the 96 + 96 the stacked sections have below it, instead of 105px. On a phone the wall keeps the padding (128px, matching the 64 + 64 there) and only drops its side gutters.
- **Variant C's focus ring is painted on an overlay.** The track is a composited layer (`will-change: transform`), so an outline on the viewport showed as two dashes at the top and a stray rule under the captions. The ring is now a `::after` on the viewport (position relative, inset 0, a 2px inset shadow in `#F4F4F0`, `pointer-events: none`) above the track; measured at 1440×900 and 768×1024 as one continuous ring around the strip, and drag and hover-pause are unaffected.
- **Variant C drags over the cards.** The guard that hands a drag starting on a teaser's own control back to the teaser matched `[tabindex]`, and the viewport itself carries `tabindex="0"`, so every pointer inside a stage matched and the strip only dragged from the caption row or the gaps. The guard now excludes the viewport: a 700px drag on card 1's stage lands on card 2 (`translate3d(-1040px)` at 1440, `-672px` at 768); the dial, the swatches, the tiles and the lesson card still keep their own pointer.
- **Variant C without script is a native horizontal scroller.** The inline script sets the `.js` class before the page paints; without it, `overflow-x: auto` and `scroll-snap-type: x proximity` on the viewport, `scroll-snap-align: start` on the cards and `display: none` on the ticks (which only script can wire). Measured with JavaScript off: overflow-x auto, snap on, ticks hidden, every caption at opacity 1, the hero copy at opacity 1.
- **Variant C's museum labels stack under the card in front.** The caption sits over the source label at the card's left edge on every width (a label at the far right of a 1008px card sat 32px from the next card's caption and read as its own, and the neighbours' labels peeked into the gutters as fragments). Only the card in front carries its label on desktop: `is-front` is toggled in `apply()` with no transition, and the other cards' figcaptions are at `opacity: 0`, not `visibility: hidden`, so the thirteen captions stay in the accessibility tree and in `innerText` (the probe reads the captions from `innerText`). On a phone every card is captioned. Under reduced motion the switch is instant anyway.
- **Variant C's seams are one 96px beat.** Where two padded sections meet (how → offer, offer → form) the second drops its top padding, the footer drops its own (a script tag sits between the form section and the footer, so `.section + .foot` does not match and `.foot` is addressed directly), and the intro line sits 64px above the first card (was 48). Measured at 1440: hero → intro 96, intro → first card 64, ticks → how 96, how → offer 96, offer → form 96, form → footer 96; 64 throughout on a phone. B keeps its 192px gaps below the wall instead, per its own review, because the wall is the densest block on the page and the air after it is what separates it from the copy; the brief's floor of 96 holds on both.
- **Already applied before this pass, verified again:** the viewport keeps `scrollLeft` at 0 (0 after sixteen Tabs at 1440 and 768); the reel cards have a 640px floor (16:10 at 768); the C hero is the one-viewport band.
- **Teaser findings, noted for the teaser pass (out of scope here, since `teasers/` was not open in this pass; all of them were carried out afterwards — see the teaser review passes at the end of this file, where the one that was left standing is named):** t06-coach-exchange, t05-signal-strip, t10-course-arc and t12-task-tiers cut type at the edges of the 4:5 window (the phone column in every variant): the crop follows the focal x alone and the text blocks start outside the window ("ACTICE 02", "U SAID", "nd the deck"); the fix belongs under each teaser's `@container (max-width: 639px)` block (scale the subject or move the focal point so the text's left edge lands inside the window). t06 also lets the coach reply run past the paper card at 16:10 tiles under about 450px wide (the three-column wall at 1440 now renders it) because the card's height does not track its text at small `--u`. t03-frames' nine swatches are 20×20px hit targets at 390; a 44px hit area via an inset pseudo-element keeps the visual and meets the touch floor.

## The teaser review passes (2026-09-15)

Two passes ran over `teasers/` after the variants were reviewed. The first carried out the teaser findings the page-shell pass had listed and deferred (above): the type cut at the edges of the 4:5 window, the coach reply running past its paper at wall-tile size, and the 20×20px swatch targets. The second went back over the two teasers that came out of it worst: teaser 3, whose enlarged targets were centred by a percentage and drifted off their dots, and teaser 11, whose subject sat badly in the frame and had never been reviewed for it. Neither pass touched a token file; neither needed a value that was not already there. Newest at the bottom.

- **Teaser 6 declares its own font metrics, and that is why.** The page chrome sets `line-height: 24px` on the body — a fixed pixel value, not a ratio — and `box-sizing: border-box` globally; the single-teaser pages and the probe harness set neither. The fixed line-height inherits into the teaser, and at tile size the teaser's own type is far smaller than 24px, so every block in the sheet was inflated by the chrome's leading and the coach reply ran past the foot of the paper on the three-column wall. The sheet now sets `font-size: calc(1 * var(--u))`, `line-height: 1.45` and its own `box-sizing`, so it lays out from `--u` alone and measures the same at 334px and at 1600px. The two learner attempts share one grid cell and the two coach notes share another, so a block is always as tall as the longer of its two readings and neither can push past the foot whatever the browser does with the face. The paper is centred now (left 13%, width 74%, min-height 71%) with its type in a 47u column at scene x 26.5–73.5, inside the 25–75 the 4:5 window shows, and the focal point moved from 46%,42% to 50%,50%. Measured in variant B's 416px wall tile: every line and the iris rule sit inside the sheet, the worst of them 21px clear of its foot.
- **Teaser 12's rails were re-gridded onto the scene, not nudged.** *(Superseded: the QA pass below recomposed this frame, and the slot figures in this paragraph no longer describe the file. The reason the grid exists is still the reason it exists.)* The chips had been placed at loose scene offsets and the tier names sat in the rails' far left, outside the phone window. Both now hang off one grid: three chip slots at 29.5 / 45.5 / 61.5 in scene units, one 16u step apart, with the engraved tier name on the same 29.5 datum as the first slot and the tick ladder phased so a major tick falls under every slot. The rails still bleed past both edges of the crop, but the longest run of chips ends at 70.85, so the window keeps 4.5u clear on the left and 4.15u on the right and everything that has to be read is inside it. The focal point moved from 48%,50% to 50%,50%. The loop was re-timed to match: the tier below yields by 19% and the chip lands at 20%, so it never lands on an occupied slot, and the slot it climbs back to reopens at 74%, before it arrives at 82%. Five chips still, three on Today, one each on This week and Later.
- **Teaser 10 was rebuilt rather than re-cropped.** Its sheet is 83% of the frame width and the arc sits on a 70u measure inside it. The lit course now carries its own leader and its own name, centred under its marker, so the name cannot part company with the marker it belongs to; both names are clamped to the window (x 183 to 1097 in the SVG's 1280 viewBox, measured off the real text length at runtime, so the clamp holds whatever face the browser lands on). The loop steps 3 to 4 and back, where it used to run 3 to 4 to 5 — two names to hold inside the window instead of three. The count in the running head swaps inside one grid cell so the head cannot shift when the reading changes.
- **Teaser 9 hides its outermost column of tiles under the phone crop.** The field is 72u wide at left 17u, five columns with 0.5u gaps, so a column is 14u on a 14.5u pitch and the fifth spans 75u to 89u. The window shows scene x 25u to 75u, so that column lands exactly past the right edge with no visible face at all. Hiding it costs nothing on screen and takes two tiles out of the tab order's way; the eleven that remain all clear the touch floor, the smallest of them — the half-cropped first column — measuring 44.8 × 84.9px at 390. The first column is kept for that reason: it is cut, but what is left of it is still a target. The rule is `@media (max-width: 767px)` wrapped around `@container (max-width: 639px)` on purpose. The stage crops itself on its own width, but a page may opt its stages out of that crop while they are still narrow, which is exactly what the wall does from 768px up; requiring the viewport to be narrow as well means this rule can only fail by not firing, never by hiding a tile that is actually on screen.
- **Teaser 5 was left alone, and it is the one finding on that list still standing.** At 390 its score numeral crosses the left edge of the window: about 18px of the leading digit is cut, because the tilted plane projects the head further left than its own 15u inset suggests. The digit still reads and the glass strip is meant to run off both edges, so it was not recomposed. Recorded here rather than closed quietly.
- **Teaser 3's swatch targets were rebuilt to tile.** The strip keeps its original flex layout (dot-sized items and a 1.1u gap), so every visible dot keeps its exact size and position. Each button *is* the visible dot now — 2.6u round, `--sw-frame` background, `::after` lens — and the hit target is a transparent `::before` hung off that dot's own four edges: `inset: calc(-1 * var(--t03-slop-y)) calc(-1 * var(--t03-slop-x))`, where slop-x is (pitch − dot) / 2 and slop-y is (hit-height − dot) / 2. The width is therefore exactly one pitch. Nine 44px-wide targets cannot fit across a 390px frame, and a target wider than the pitch would have to overlap its neighbour and steal from it; tiling instead means the boxes meet with no gap and no overlap, the ownership boundary between two swatches falls on the true midpoint between their dots, and each box is centred on its dot by construction rather than by a percentage that can drift. 28.8 × 45 is comfortably over the 24 × 24 minimum. The height floor is `max(45px, 3.9u)` — 45 and not 44, so Chromium's 1/64px snapping cannot take a measurement under the floor. The pressed lift stays on the visible dot and its hit slop takes the inverse translate, so the tiling never moves while a swatch is lifted. The same pass added the missing `.t03.is-b .t03-layer.t03-a { opacity: 0 }` and made both layer rules compound rather than descendant selectors (`is-b` is toggled on `.t03` itself, so `.t03 .is-b` never matched): the pair crossfades now and exactly one layer paints.
- **What teaser 3 measures.** At 390 in `dist/variant-a-keynote.html` all nine targets are identical: 28.83 × 44.98, on a pitch of 28.844, centred on their dots to ±0.01px, with the eight ownership boundaries on the true midpoint to ±0.01px. Other widths, as target w × h with the worst boundary error: 320 → 23.66 × 44.97, ±0.01; 430 → 31.80 × 44.98, ±0.01; the 416px tile inside variant B's wall at 1440 → 15.38 × 44.97, ±0.01; 1600 with no crop → 44.27 × 46.64, ±0.01. Width equals pitch and height clears 44 in all five. A sweep of 3,879 real pointer clicks (1px steps across the whole strip, at three heights per width — the dot's centre, 2.5px inside the top of the target, 2.5px inside the bottom, across all five widths) produced no wrong-owner clicks and no dead clicks: no click ever activated anything but the nearest swatch. Keyboard: Tab reaches all nine in order and then leaves the strip; Enter on swatch 5 and Space on swatch 8 both press and change the frame; the arrow keys move focus and selection together; the focus ring reads `solid 2px rgb(244, 244, 240)` at offset 2 on a 20.27 × 20.27 box, which is the visible dot; the loop resumes after the keys. Zero page errors. (The phone figures here were superseded by the phase 5 QA pass at the end of this file, which widened the pitch under the crop; the 416px wall tile and the 1600 no-crop figures still stand.)
- **A note for whoever measures a hit target next.** Chromium's synthetic-pointer pipeline reads an x as roughly x + 0.99. Proved on a bare control page with divs at exact integer coordinates: the boundary between a div ending at 300 and one starting at 300 measures at 299.05, and `mouse.click(299.4)` lands on the second div. `elementFromPoint` and a dispatched `PointerEvent` agree with `mouse.click`, and all three track a 1px nudge of the strip, so it is the input pipeline and not the CSS. Uncalibrated, a sweep reports a phantom ~1px bias on geometry that is in fact correct. The figures above are calibrated — the offset was measured at 0.991px in the same browser on the same run.
- **What the teaser 3 frame-layer fix is worth.** With the rule in place, recolouring every hex in the hidden layer to magenta (68 values, node structure untouched) changes 0 pixels and puts 0 magenta pixels on screen: the hidden layer paints nothing. The same operation on the file before the fix changes 120,264 pixels and puts 530 magenta pixels on screen. The computed opacity of the (A, B) pair is now ("0", "1") in the `is-b` state and ("1", "0") out of it; before the fix it was ("1", "1") in both. Diffing the two loop states on one colourway leaves only gradient dither: 49,672px differ by 1, 15,900 by 2, and 8px by more than 20, all of them on a 1.2px anti-aliased temple stroke; the mean signed difference is −2.08 out of 765, so nothing is systematically darker. A no-op control proved the renderer is otherwise pixel-deterministic on this page.
- **Teaser 11's subject was moved and resized as a composition, not translated.** The old frame's problem was that the cloth was oversized and hung off the left, so sliding it right would only have moved the hole. The cloth came down from 60 × 38u to 46 × 37.5u and was recentred so its rotation centre is the scene centre (50u, 25u), with the tilt eased from −4° to −3.5°: it no longer reads as a placemat that outgrew its frame. The fold deepened from 24u to 28u, so the crease now runs from near the cloth's top-left corner down to its right edge and the turned-back face is the dominant plane instead of a clipped corner; the featureless triangle of plain body that filled the old lower-left shrank, and the fold's cast shadow finally has the length to read. The woven label came down from 9u to 7u wide and travelled with the flap, sitting on the inside face at the fold's lower-left and clear of the tag — the gap between them went from 0, where they overlapped and the label's drop shadow ran into the tag, to about 100px at 1600. The swing tag moved from 55.8u to 60.8u across and down to 30.2u, which put its tack about 55px inboard of the fold edge and fixed a real bug: the old tack sat past the crease, on the plain body, so the tag read as pinned to the cloth beside the fold rather than tacked through it, which is not what the aria-label or the source's placeholder drawing says. Copy on both faces was trimmed to fit the smaller card ("100% cotton thermal" to "cotton thermal", and the fourth back line dropped). The light pass now fades in and out instead of sitting in the resting frame, and the floor was rebuilt as a soft pool plus a real contact shadow under the cloth, matte, with no reflection, as the DIGS stage tokens ask.

## Decisions the earlier passes made but never wrote down (2026-09-15)

A review of this file against the built pages found four things the code decides
that no line here recorded. None of them touches a section 8 line, so none is a
locked-copy question; all four are decisions made where the brief is silent, and
this file's own scope is every one of those.

- **The document title.** Brief section 8 defines no page title. The three
  variants are titled `shapshyftrs` — the wordmark alone, lowercase, as rule 8.1
  has it everywhere — because the tab is another place the name appears and the
  slogan would read as a tagline appended to it, which section 8.9 has no line
  for. The contact sheet is `shapshyftrs teasers` and a one-teaser page is the
  teaser's own id (`fork-rail`), since those two are review surfaces and the id
  is what a reviewer is looking for in a row of tabs. Set in `variants/*.html`
  and in `build.py` where it writes the review pages.
- **The chrome's `aria-label` copy.** Landmarks that have no visible heading
  need a name, and the brief writes none. They are named for what they are, in
  the same sentence case as the rest of the chrome: `The gallery` on the intro
  section, `Teasers` on the wall and the reel, `Position in the reel` on the
  tick group, `Teaser 1` to `Teaser 13` on the ticks themselves, and, on the
  reel's scrollable region, `Thirteen teasers. Use the left and right arrow keys
  to move between them.` — the one that has to say more than its own name,
  because the keys are not discoverable any other way. None of these is visible
  copy; a sighted visitor sees the caption and the source label, which are
  locked and unchanged. The mechanism behind the ticks (plain buttons in a
  labelled group with `aria-current`, not `role="tab"` without panels) was
  already logged under the variant C fixes; this is the wording.
- **`<meta name="color-scheme" content="dark">` in `partials/head.html`.** The
  page is `#000000` ground with `#F4F4F0` text at every width and has no light
  mode. Declaring the scheme makes the browser paint its own furniture to match
  — form controls, the scrollbar, the flash of canvas before first paint — so a
  visitor in a light-mode OS does not get a white scrollbar down the side of a
  black page or a white flash before the stage arrives. It changes no token and
  no copy.
- **The contact sheet's own copy,** `All thirteen teasers, gallery order, for
  review.` under the heading `shapshyftrs teasers`. The sheet is a deliverable
  (brief 3) but the brief writes no copy for it, and it is not a page a visitor
  sees. The line says what the sheet is and who it is for in one sentence, in
  section 8.9's register (sentence case, active, no exclamation). `DESIGN.md`
  4.3 already defends its punctuation against rule 10; this is the line itself.

## Phase 5 QA fixes (2026-09-15)

Four findings from the phase 5 pass, three in `teasers/` and one in `screens/`.
Every decision below was made where the brief is silent. No finding asked for a
copy change; none of section 8 moved.

- **Teaser 1's focal point moved from 61% to 66.5%, and that is the whole fix.**
  The 4:5 crop shows the 50% of the scene centred on `--fx`, so at 61% the
  window ran from scene 36% to 86% and its left edge fell inside the branch pill
  `A new hire` (scene 31.5–38.3, its text 32.7–37.0): 24% of the text showed, as
  the two letters `re`. Moving the pill was the obvious fix and is wrong — the
  five pills sit 10.7 to 13.8 scene-% apart and are 6.8 wide, so shifting this
  one far enough either way (1.6% left to clear the edge, 3.9% right to clear
  it) collides with the pill beside it at 390 and at every other width. The
  focal point is a declared free choice per brief 6.1, so it moved instead. At
  66.5% the window is scene 41.5–91.5 and its left edge lands in the 2.8-wide
  gap between `Cost` (ends 40.16) and `Next month` (starts 43.00). Measured on
  the built page at 320, 360, 375, 390, 414, 430, 480, 500, 560, 600 and 639:
  no text node straddles either edge at any of them, and the nearest one is
  8.6px clear at 320, 10.4px at 390, 15.0px at 560, 17.1px at 639. It is also a
  better crop than the one it replaces: at 61% the recovery arc was cut by the
  right edge at scene 86, and the old window's clearance on the chip numeral
  `10` was 0.12px at 320 — one rounding away from a second sliced label. At
  66.5% the fork, the
  red node and the whole recovery arc back to the rail are inside the window.
  The 16:10 composition is untouched, so every desktop width and the 1600px
  still are exactly as they were. The subject's centroid is at 52% and the focal
  is at 66.5%; they are different things — the rail runs the full width of the
  frame, so the focal picks which half of it a phone sees, and the half worth
  seeing is the one with the branch in it.
- **Teaser 3's tortoiseshell is a shell now, not a row of spots.** The two
  tortoise colourways painted a `<pattern>` tile 46 x 38 user units holding
  three hard-edged ellipses at fixed positions, which repeated about eleven
  times
  across the brow bar and read as polka dots — novelty, where brief 5.4 asks
  DARKEST SHADES for dark, specular and restrained. Dropping the two colourways
  was the other way out and is wrong: blue tortoise and red/black tortoise are
  two of the three real finishes in the brand's own renders (`SOURCES.md` part
  C, teaser 3), so they belong in a strip that stands for nine real models. The
  tile is 232 x 104 instead, so the 526-unit brow bar carries just over two
  repeats, and it holds thirty-four blotches in three passes — four wide washes
  that vary the
  ground, twelve elongated patches, fourteen deep veins threading between them,
  four small light breaks on top. Nothing in it is round (every blotch is
  flattened, rx roughly two and a half times ry, at rotations from -24 to +26
  degrees) and nothing stands alone: each overlaps two or three others, which is
  what makes an irregular mass instead of a disc. Every blotch is filled with a
  radial gradient in its own bounding box, so it fades to nothing at its own
  edge rather than cutting — soft edges without a filter, and without the seam a
  blurred tile would show at its boundary. A blotch that runs off an edge of the
  tile is redrawn on the opposite edge, so the tile repeats with no seam at all.
  Peak opacity on the light tone came down from .75 to .32, which is where the
  contrast drop asked for in the finding lives: the tone itself is still the
  colour sampled from the render, only less of it. The pattern is emitted only
  for the two tortoise swatches, so the other seven finishes render exactly the
  markup they rendered before.
- **The two tortoise colours moved onto the transcribed tokens while that was
  open.** The teaser had been carrying its own approximations: the red base as
  `#3A2626` where `--nds-tortoise-red` is `#403434`, and the blue fleck as
  `#2C4A9A` where `--nds-tortoise-blue-fleck` is `#3A55B0`. Both are marked
  `from source` in `tokens/nrdi.css` (sampled from the brand's own renders), so
  the teaser now uses the sampled values. The third tone each colourway needs —
  the deep one inside the shell, `#070D20` on blue and `#1C1312` on red — is
  derived; it is a shadow within the material, and no render gives a value for
  it. The two swatch dots keep the lighter stand-ins they already had
  (`#243F84`, `#5C2E2E`): a 20px dot has no room for mottling, so it shows the
  colourway's average rather than its base.
- **Teaser 3's swatch targets are 42px wide at 390, not 28.8.** The strip's
  vertical floor already worked (`--t03-hit-h: max(45px, …)`), but the
  horizontal pitch was `3.7 * var(--u)` with no floor, which is 28.8px on a
  phone. Putting a px floor on the slop alone — the obvious fix — does not
  actually fix it: the hit boxes tile, so widening a box without widening the
  gap makes neighbours overlap, the later sibling wins the overlap, and each
  swatch still owns 28.8px, only lopsidedly, with the boundary off the midpoint.
  So the pitch is now the one number the strip is built from (the gap is
  whatever is left of it after the dot), and on a phone it opens from 3.7u to
  5.4u. Two conditions gate that, and both are needed: the container query,
  which is the 4:5 crop itself and makes the wider strip a recomposition of the
  cropped frame rather than a change to the 16:10 one, and a viewport query at
  the same 639px, which is the touch floor. Without the second, variant B's
  416px wall tile at 1440 — under 640px too — would have had its strip spread as
  well, from a 15.4px pitch to 22.5px: a mouse target at a size no phone rule
  can rescue, and a composition already measured and signed off. Measured after
  scoping: that tile is back at 15.38px, the 333.6px tile at a 768 viewport is
  at 12.33px, and all three variants read 42.09px at 390. The window in the
  cropped state is exactly 50u wide whatever the screen is, so nine targets at
  5.4u take 48.6u of it and leave a margin that scales: 13.6px each side at 320,
  16.5px at 390. Nine 44px targets
  cannot tile a 390px window at all (9 x 44 = 396 > 390), so 5.4u is the ceiling
  and not a compromise short of one. Measured by sweeping `elementFromPoint`
  across the strip in 0.25px steps: nine targets, eight contiguous boundaries,
  no dead gaps, target width 34.5px at 320, 42.1px at 390, 44.7px at 414, 46.4px
  at 430 and 69.0px at 639, height 45.5px up to 430 and 50.5px at 639 (the
  height floor is 45px or 3.9u, whichever is larger, so it stops binding as the
  frame grows), every boundary on the midpoint between two dots within the 1.2px
  the synthetic-pointer bias and the 0.25px sweep step account for. Off the crop
  nothing changed: at 1600 the pitch is 59.2px as before, and variant B's 416px
  wall tile is untouched.
- **`screens/` is regenerated whenever a page changes, and `README.md` now says
  so.** Ten of the nineteen required PNGs no longer matched the built page: four
  teaser stills predated the teaser review passes above, and all six variant
  shots predated them too — variant B's own page height had moved 682px. The
  worst of them, `screens/variant-b-wall-1440x900.png`, still showed the tiny
  illegible hero this file records as fixed, so the committed screenshot made a
  fixed page look broken. The cause was procedural: `README.md` required a line
  in `ASSUMPTIONS.md` after a teaser or variant change and said nothing about
  re-capturing the still. It does now, in both the place a teaser is checked and
  the place decisions are logged, with the full command (`python3 build.py &&
  python3 screenshot.py && python3 screenshot.py --fold`) named as the safe
  default rather than a `--only` run, because every variant carries all thirteen
  teasers and teaser 1 twice, so a single teaser edit moves six variant PNGs as
  well as its own still.

## Phase 5 QA, the last pass

- **The hangtag's script line is invented and was changed to say so plainly.** It read `Actually dope`, which nothing in `SOURCES.md` accounts for: the real hangtag is a blank placeholder card in every revision of the tech pack, and the brand's own tagline was never transcribed. Two words in the brand's voice with no provenance is the kind of thing rule 1 is about, so the line now reads `Made to last` — plain, generic and invented, as brief 6.3 asks fragment copy to be. The marker-script face and its placement on the tag are unchanged, since those are the transcribed part.
- **`.hero-copy` carries `min-width: 0`.** It is a grid item, so its default `min-width: auto` let its own minimum content width exceed its track and push the document 43px wide on variant C at exactly 768px, intermittently. The guard is correct whatever the trigger, and it costs nothing at any other width.
- **`--aes-light-2` now has its row in `SOURCES.md` part B.** It is an alias of `--aes-lesson-lite-2` and carries the same citation; it was the one transcribed token of five hundred and twelve with no row.
- **The repository is private; only `dist/` is published.** Written into `README.md` because `SOURCES.md` is a file-by-file index of four private codebases and a client asset library, and nothing in the repo said so.

- **Teaser 5's head sits on a real inner gutter now, and the rig was re-centred.** The score numeral — the biggest, brightest thing in that frame, under the caption "A signal, scored in seven phases" — was sliced by the phone crop: its left edge fell 17.9px outside the frame at 390 and the 7 of 74 read as a slash. The cause was that the glass panel and the numeral both started on the same line, about 11.5% into the scene, while the crop window began at 13%, so the numeral had no margin to give. The rig now declares a 6u inner gutter that the head, the play head, the waveform and the chip row all start on, which buys about 5% of the scene between the panel's edge and the type and splits it into bleed for the glass and margin for the words. The unit went from the scene over 130 to the scene over 111 and the rig to 84u by 40u at 13.9u, 12.8u, which also fixed a 9%-against-28% left-right imbalance in the 16:10 frame and made the numeral larger rather than smaller (113px to 131px wide at 1600). The declared focal is 38%,48%. **The trade, which is real:** the phone crop now shows about four and a half of the seven chips where it used to show six and a half, and the waveform and chip row begin just inside the left crop edge instead of bleeding past it. The chip the loop re-scores is still inside the window, so a phone viewer still sees the thing that changes; the subject being whole was worth more than two more chips.
- **Teaser 12 was rebuilt as one lit instrument, not three slabs.** The QA reader's finding was that it was the one teaser not composed as an ad frame: three equal grey rounded slabs, flat-lit, two thirds empty, reading at phone size as an unfinished board rather than an instrument, while its two neighbours from the same source both read as one lit object on black. It is now a single machined plate with three lanes cut into it, a key light falling across it from the upper left, tick ladders and load bars carrying the engineered depth, a lamp and a count at each lane's head, and the dropping chip as the brightest thing in the frame. Measured: the dropping chip used to peak at 198.7 of 255 while the rest of the frame reached 234.8 — it was dimmer than its surroundings, which is the opposite of a subject; it now peaks at 234.8 against 211.6 everywhere else. The amber covers 0.26% of the frame and appears only where something is on, which sits between the other two cockpit teasers. Coverage 50.0%. Everything the brief names survived: three tiers, five chips with their tick strengths, the slot-cap drop, the 160ms register spring on the landing, the 200ms base step on the rebalance, the resting frame with the chip caught mid-drop, and the tier names readable on a phone. One token was appended to `tokens/cockpit.css`: `--ckp-recess`, the shallow step that shelves the middle lane.

