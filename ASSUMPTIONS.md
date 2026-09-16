# Assumptions

Every decision made where the brief was silent, every deviation from it, every
gap in the source material, and every substitution. Rule 11 says decide, log,
continue — this is the log.

---

## 1. Deviations from the brief, with reasons

**`live-edge` has no loop at rest.** BRIEF.md §6.1 requires a 6–10 second loop
per frame. Frame 12's whole subject is a switch, and §6.3 describes it as
"Loop: none at rest; the interaction is the loop." Only its breathing dot has a
duration (3.2 s, the product's own value). The acceptance check exempts it by
name rather than silently passing it.

**The AESDR mascot is present as its own glyph, not as the creature.** That
brand's canon requires Leponeus in every direction: *"No Leponeus, no
direction."* Leponeus is a photoreal 3D iridescent rabbit-tortoise that ships
as PNG renders. Placing one would break hard rule 2 (no source asset as a
picture of a product); drawing a fake photoreal creature would break hard rule
4 (never invent about a real product). Frames 4 and 10 instead carry the
brand's **own monoline abstraction of it** at 1.6 px round cap: the domed
shell with a hint of its scutes, four legs, the rabbit head with two long
upright ears, the single eye, and the one crimson band looped behind the ears
— which the study names as the only saturated colour on the creature. Frame
10 carries the `recovery` form, its green sprout growing from the shell.

An adversarial read of the first build was right about it: what shipped there
read as "a hill with two loose sticks and a leaf beside it". It had a dome, one
detached ear shape, and a sprout in the wrong colour, none of them touching,
and nothing about it said creature. A substitution that is logged and reasoned
is still a failure if the thing drawn is unreadable. Redrawn so the parts
connect and the animal reads.

Flagged for the founder: if the mascot must appear as the creature, it needs
either a licence to place the render or a commissioned drawing.

**Frame 4's ambient line runs at 2 px, not 1.** The iris reservation rule
permits "thin ambient lines, 1–2 px max". At 1 px and opacity .15 the line is
correct and nearly invisible; since it is the frame's subject it takes the 2 px
the rule allows rather than the opacity being pushed past it. The ration is not
broken.

**The PUFF JUNCTION lockup is re-typeset, and its contour is missing.** The
real mark is thirteen paths: a merged silhouette contour plus the twelve
letters, the contour offset down-and-left and stroked with the background
showing through the gap. Frame 1 sets the wordmark in the brand's own display
face and does not carry that contour. §4.2 permits taking vector paths from a
real mark and using them as that mark, which would have been the right answer,
but the source folder holds no vector art — the study measured the mark's
construction ratios off a PNG. Per-letter outlines would misdescribe a merged
silhouette, so nothing stands in for it. SOURCES.md row 1 says this rather than
claiming the mark is the real lockup, which is what it said before.

> **Corrected.** "The source folder holds no vector art" was wrong. It was
> true of the repository, which is all this version read, and false of the
> project: the real thirteen-path lockup is in the pre-release archive
> attached to the repository, in both weights. `v3/` uses it. The mistake was
> not the reading but the scope — the archives are where the material lives,
> and this version never opened them.

**Frame 7's cast shadow is darker than the brand's shadow rule.** Darkest
Shades measures its product shadow at never more than 8–10% below the backdrop,
never hard. The soft pass in frame 7 obeys that; the pass carrying the mark's
geometry measures 23% below the ground. That rule describes the contact shadow
under a product in a photograph, and here the shadow is not under the subject,
it is the subject — at 10% the frame is empty. Stated in the frame's own header
with the number, which the first build did not do: it claimed compliance it did
not have.

**Frame 2 strokes the Grounded-A's ground path in forest, not navy.** The
Antaeus mark rule is explicit — navy or `currentColor`, never an accent. The
shipped auth gate strokes exactly this path in forest `#1B5E3F` as the mark
lands, and the brief says the shipped surfaces are the truth. Taken as licence
for this one path, in the one frame whose whole subject is that landing.

**The graph-paper field is a revival.** `an-field` rebuilds the 34 px grid the
product's own canon describes. §5.1 permits reviving it and asks that the
revival be logged; this is that log.

**Frame 12 carries the source rail's construction, and sits close to its
composition.** The hairline right edge and the directional wash are taken
verbatim from the shipped implementation, which the material law allows. The
arrangement — rail left, four zones in the product's own order — is also the
source's. What is new is the scale (the rail is half the frame, where the
product's is a thin wall), the emptied room beside it, and the subject: no
source screen makes turning the thing off the event. Named here because it is
the closest any frame comes to reproducing a source screen, and a reader should
be able to weigh that rather than discover it.

**The visitor reads "teasers"; the build says "frames".** Section 8.2's copy is
locked and says "rebuilt here as teasers". Everything in the repo calls them
frames. This is deliberate and the brief says not to reconcile it. A blanket
rename during phase 0 walked into the locked line once; it was restored and an
acceptance check now guards it.

**The hero's short-viewport rule.** BRIEF.md §15 item 18 asks the variant-A
hero to fit at 900 px tall and at 700 px. A 64 px slogan, three lines of
sub-copy and a 300 px stage do not fit inside 700. Below 820 px of viewport
height the copy scale and the stage floor both come down. Measured after:
900→900, 760→760, 700→700, 660→660. On a phone the hero is taller than the
viewport and that is intended — the variant sets `min-height: 0` below 768 px
because one-frame-per-viewport is a desktop idea.

**The phone hero is not held to the fit rule.** The brief names 900 and 700 at
desktop. A phone hero that scrolls is normal and the layout is explicit about
it. The acceptance script checks the two the brief names.

---

## 2. Where the source was silent, or said two things

**Puff Junction has two brands and nobody reconciled them.** A neon pop-art
paper identity from February 2024 and a monochrome concrete-and-brass object
language from the year after. The founder asked in October 2024 to move
"not completely, but subtly from a vibrant and somewhat playful neon feel to a
subtler, more refined aesthetic" and it was never designed. Frame 11 builds
that reconciliation — the object world entirely monochrome with exactly one
slime element. **This is an interpretation, not a finding.** It follows the
founder's stated direction and the study's reading that the object brand is the
real one, but no artifact in the archive shows what the reconciled system looks
like.

**Three accounts of how the harlequin is applied.** The founder's brief says
etched, the source object it was lifted from is embossed relief, the delivered
renders show it flush. The frames build flush-darker, which is what the hero
renders actually show.

**Three heights for the grinder.** 57.2 mm (the manufacturer's assembled bill
of materials), 72.00 mm (the STEP bounding box, which carries construction
geometry), and 70 × 70 × 90 mm (the original brief, which were the *reference
object's* specs). Built to 57.2.

**Corner radius.** The drawings call R3 on the 85 mm block; the renders read
visibly larger. Built to R3, the spec.

**Darkest Shades has no colour-palette page.** The identity is achromatic and
the palette lives only as three moodboard swatches. `#BF835E` appears in none
of the executions; using it would extend the system rather than follow it, so
no frame spends it.

**The Darkest Shades renders are unbranded.** They were made in August 2024,
before the logo was approved in October. Frame 7 uses the mark as a cast
shadow, which is the founder's own unbuilt catalogue idea, rather than adding
branding to a render.

**The Eclipse emblem is an exploration, not the mark.** Its own files say it is
a reconstruction from a low-resolution render and that its gold is an
approximated screen colour rather than a specified foil. It is in the tokens as
a gradient ramp and is used in no frame as an identity.

**DIGS never produced anything.** No hangtag, no RN number, no barcode, no
price. The prototype failed its own spec — no topstitching, off-measure in six
points, the wash absent. Frame 8 draws to the **spec**, not to the sample, and
says so in its header.

**The DIGS naming.** `digs` is the wordmark and the product-facing name;
"dope is good" is the ethos line the name comes from. Nothing states the
mechanical relationship, so nothing claims one.

---

## 3. What was excluded, and why

- **Three renders in the Darkest Shades folder are a different eyewear
  company's advertising**, supplied to a 3D artist as lighting references. Not
  Darkest Shades product. Excluded by name in the brief and in the study.
- **That folder is a shared vendor workspace** holding several other companies'
  brand work. Only Darkest Shades was studied.
- **Several files in the Puff Junction folder are the contractors' own
  portfolio samples** — a hair dryer, a prosthesis, a carbon-fibre study, a
  radiator, belts, a candle rocker, a studio portfolio, and a supplier's
  commodity catalogue. None are Puff Junction.
- **Every photograph in the DIGS brand book is stock placeholder** its own
  final page marks as "MUST NOT BE USED EXTERNALLY OR COMMERCIALLY". The
  photographic art direction is aspirational, not proprietary, and no frame
  builds from it.
- **Several garments in the DIGS archive belong to other brands**, sent as
  references. Excluded.
- **AI-generated concepts with garbled hallucinated wordmarks** exist in both
  the Puff Junction and DIGS archives. Directional references, never assets.
- **The AESDR numbered mockups** use two fonts that brand's current canon bans
  by name, and the repo's own README says not to point design generators at
  them. Not used.
- **The internal sales cockpit** is out of scope entirely per the brief.

---

## 4. Copy

No line was cut. Every line in section 8 fits its layout at every checked
width.

**Three lines that shipped in the first version are not real DIGS copy.**
"Made to last", "Designed with care" and "100% cotton thermal" appear nowhere
in that archive. The third is a fair paraphrase of a bill of materials but is
not a tagline. They are the reason §8.9 now requires every word inside a frame
to be verbatim from the source and cited, or absent.

**Two typos are baked into the DIGS outlined artwork** — "boudaries" and
"jorney". They are in the vector, not a text-layer slip. No frame reproduces
either; neither line was needed.

---

## 5. Provisional, and what would settle it

- **DIGS is scoped in provisionally.** The doctrine names four sources; the
  correction before it named DIGS. It has the hardest data of any of them. If
  it comes out, frames 5 and 8 are cut and the reserve list in BRIEF.md §6.4
  covers the gap.
- **Font licences.** If web licences exist for Owners Wide, Stolzl, Arnet or
  The Old Falcons, the stand-ins in §2 of `DESIGN.md` come out.
- **The asset policy is `hybrid`** — the key was missing from `config.json`
  entirely until the phase-7 read caught it, so this section discussed a
  setting nothing could read. Nothing in `dist/` currently needs it —
  every surface is constructed, so `rebuilt` would build identically today. The
  setting is kept because the material law permits more than the build has
  spent.
- **`config.stripe_url` is empty**, so the payment link points at `#` and reads
  the same. The form's POST is a `TODO` comment, as the brief specifies for v1.

---

## 6. Provisional values

`config.contact_email` is `hello@shapshyftrs.com`. Confirm before publishing.
