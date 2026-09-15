# Phase 7 — the adversarial read

BRIEF.md §14 phase 7: *"Hand the finished build to a reader whose instruction
is to refute it: to find the frame that is a cartoon, the color that was
eyeballed, the claim the source does not support, the composition that is a
crop of an existing asset, and the type that is sliced on a phone. Fix what is
real. Record what was refuted and what survived."*

This is that record. The reader built the project, rendered all twelve frames
and all three variants at 1600, 1440, 768 and 390 with the real faces loaded,
measured rendered pixels, and traced every hex and every string back to
`study/`. Its instruction was to refute, not to review.

## What it refuted, and what was done

### Five fatal

**Eleven invented strings, in two frames.** Frame 12 carried six lines of
interface copy that appear nowhere in any source, and `SOURCES.md` conceded
they were "generic operator motion" — but §8.9 has no generic exemption, and
"plausible-sounding invention" is the thing it names. Frame 10 carried four
more, three of them set in Caveat, which in that brand is a named narrator's
voice, and it struck through a real shipped clause to make room for one of
them. That is the first version's failure in better clothes.

*Fixed.* Frame 12's wire is rebuilt from the Live Edge's own line templates.
Frame 10 quotes a different zoom card whole and moves the pen off the body:
it underlines two clauses that already obey the brand's editorial law and
strikes the law's own banned-vocabulary list, so the page marks itself up
without asserting an edit the brand never made.

**The tech pack drew the wrong garment.** A cap sleeve on a drawing captioned
LONG SLEEVE TEE. A curved shirttail where the study says "straight body,
straight hem". A seam across a front the study twice confirms is one piece cut
on the fold. The frame's own header claimed it had drawn the opposite, and
`SOURCES.md` said nothing about the garment was invented. The numbers were
always verbatim; the drawing was not.

*Fixed.* Redrawn to the graded spec for the sample size at 6px per inch: 30"
body, half chest equal to half hem — which is what makes the hem straight — a
26" sleeve along the outer fold tapering from an 8" bicep to a 5" cuff, and a
crewneck at the graded 4.5" drop.

**A third-party brand shipped in `dist/`.** Gong, inside an otherwise verbatim
AESDR quote. §8.9 was satisfied and §4.1 was not.

*Fixed.* A different card by the same narrator, no third party. Gong is now in
the guard's banned list.

**The guard against rule 8 was the only breach of it.** `accept.py` listed ten
real contractor surnames in clear, and a scan found those tokens in exactly one
file in the tree: the check itself.

*Fixed.* The names are truncated hashes. Every word in `dist/` is hashed and
compared, so a name still cannot ship and reading the file tells you nothing
about who those people are. Verified the check still bites by hashing a planted
name.

**The gate never measured what its comment claimed.** The block was commented
"keyboard, focus ring, phone, hero fit" and checked three of the four. There
was no slice or overlap measurement anywhere in `accept.py`, which is how a
callout at 68% visible and a three-way overprint passed as "all clear".

*Fixed.* Check 17 measures both, at three viewports across all three variants,
clipping each text run against the stage and every ancestor that hides its
overflow — so a line a rail has scrolled away is ignored and a line cut through
its middle fails. It immediately caught two things this session had not.

### Eleven real

- **Percentage units on two axes**, in three frames. `background-size` resolves
  its first value against width and its second against height, so a cell given
  percentages on both renders at the element's aspect ratio. The knurl's
  49-degree diamond came out at 36 and the hero read as quilted upholstery; the
  knit read as damask; the knob read as braided rope. *Fixed — all three now
  measure exactly 0.870 w:h at 49.0°, and the knit is square.*
- **The mark was a shout.** A 0.2mm deboss the study calls "barely legible,
  catching light on one edge only" rendered as the highest-contrast object in
  the frame. *Fixed — the knurl reads straight through the letterform now.*
  `SOURCES.md` also called it "the real lockup"; it is re-typeset and missing
  the merged contour, the source holds no vector art to take the real paths
  from, and the row says so.
- **The cast mark was stretched 23%.** `preserveAspectRatio="none"` was
  discarding the 1.9494 its own viewBox carried. *Fixed — measures 1.9531
  against a measured spec of 1.9498.*
- **A banned colour grade on the acetate**, which was also what dragged the
  ground and desaturated the flecks; and three octaves of turbulence against a
  hard threshold shattered blobs meant to be 3–8% of the frame into specks
  around 1%. *Fixed — grade gone, one octave, and the plate now measures in
  range on ground, hue, blob width and backlit fleck.*
- **The sweep misquoted the study to match itself.** The header restated the
  measured ramp to agree with the CSS, dropping a sample. A header that edits
  the source to fit the code launders a defect into evidence. *Fixed — ramp and
  header corrected, and the six-level bow the key light put across the band the
  study measured dead flat is gone.*
- **The mascot did not read as an animal.** A dome, one detached ear shape and
  a sprout in the wrong colour, none of them touching. The substitution was
  logged and reasoned and still failed, because a glyph nobody can read is not
  a mascot. *Fixed — redrawn with the shell, four legs, two upright ears, the
  crimson band and a seated sprout.*
- **The knob argued with itself.** An ellipse crown is a cylinder seen from
  above, on a block drawn in straight elevation, while the frame claimed no
  perspective was invented. *Fixed — straight on, a cap is a line.* The
  circle-in-square cannot read in elevation either; `SOURCES.md` now says the
  74% is carried as a width ratio and what that costs.
- **The overlock seam was a chrome rod.** 0.69 of a knit cell wide against a
  spec of three or four — the same two-axis unit confusion — with a crest
  running near-black to near-white, which is a specular highlight, on a fabric
  whose own note reads "high micro-contrast, low macro-contrast". *Fixed — 3.2
  cells, compressed range, stitch chain carrying the detail.*
- **Sliced and colliding type**, in all three variants. *Fixed, and the wall bug
  underneath it too: it opts its tiles out of the 4:5 crop above 768px but could
  not opt them out of the frames' own phone layouts, which key off the same
  container width, so a composition built for a tall box was squeezed into a
  short wide one. The stage container is named now and the wall opts out of both
  in one move.*
- **Two tokens nothing read**, disagreeing with what the frame drew (1.18
  against 1.597). *Fixed — the frame reads them off the material.*
- **A centred headline** where the brand's lockup is caps, few words, ragged
  right. *Fixed.*

### Three logged rather than changed

Recorded in `ASSUMPTIONS.md` with reasons: frame 7's cast shadow runs at 23%
below the ground where the brand's contact-shadow rule says 8–10%, because here
the shadow is the subject and at 10% the frame is empty; frame 2 strokes the
Grounded-A's ground path in forest against an explicit "never an accent" rule,
because the shipped auth gate does exactly that; and frame 12 sits close to the
source rail's composition, named so a reader can weigh it rather than discover
it.

Also logged: `config.json` never carried the `asset_policy` key §17 specifies,
so `ASSUMPTIONS.md` had been discussing a setting nothing could read.

## What it tried to refute and could not

Listed because a read that only reports hits is not evidence of anything.

- **Every hex in `tokens/` and `materials/`.** 148 distinct values; 22 had no
  literal match in `study/` and all 22 resolved — tabulated without the `#`,
  single-byte shorthand, midpoints of cited ranges, or chrome tokens that are
  not brand colours. No colour in the token files was eyeballed.
- **Measured colour where it is declared.** The slime, the knurl band, the
  concrete, frame 7's ground and frame 2's forest all sample exactly. Frame 2's
  graph grid autocorrelates at exactly 34px.
- **Frame 6.** Cells square on point, individual cells dropping out rather than
  fading, the parting seam crossing in registration, the full concrete stack.
- **The tech pack's numbers.** Every value verbatim, including the style string
  and the date. The failure was the drawing, not the data.
- **The Darkest Shades tagline, the AESDR iris, frame 4's accent word, frame 3's
  sheen direction, the seven retired AESDR registers, Antaeus's no-dark-surface
  and one-orange-per-surface rules, and the mirrored-lens rule.** All hold.
- **Privacy.** Zero source paths, zero source filenames, zero out-of-scope
  brands in `dist/` beyond the one now fixed.
- **Mechanics.** No console or page errors, no id collisions, no horizontal
  scroll at any of five widths, loops in range, offscreen and hover pause both
  live, reduced motion stopping every animation while interactions still work,
  every interactive control keyboard-reachable with a visible ring, all three
  variants far under the size ceiling, copy verbatim against §8 line by line.
- **The stage crop mechanism**, which it called correct and well made. The
  standalone frame pages measure 100% visibility on all sixty text nodes at
  390px. The slicing that remained was in the variants, where a frame sits in a
  smaller box than its own page gives it.

## The standing lesson

Three of the five fatal findings were not defects in the build but defects in
what the build *said about itself*: a header claiming the opposite of what it
drew, a header restating the study to match the code, and a `SOURCES.md` row
asserting nothing was invented about a garment that was. The prose is where
this kind of work rots first, because nothing executes it. Anything written in
a header or a source row now has to be checkable against the study or against a
measurement, and several of them now carry the number.
