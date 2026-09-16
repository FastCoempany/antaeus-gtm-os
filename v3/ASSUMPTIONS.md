# What was decided, and why

Everything here is a place the real material ran out, or where using it exactly
was not possible. Each one names what was done instead. Nothing on the page is
invented silently; the things that are ours are listed in `SOURCES.md` too.

## Type

Four of the five brands specify a face with no web licence available here. In
each case the nearest available face is used and the substitution is written
into the mockup's own comment, so a reader of the source sees it at the point
it matters.

| Brand | Specified | Set in | Why this one |
|---|---|---|---|
| Puff Junction | Arnet | Archivo 900 italic | The guide's display is a heavy oblique grotesque; Archivo at 900 italic is the closest available weight and slant. |
| Darkest Shades | Owners Wide (display), Stolzl (body) | Archivo at `wdth 112–125`, Hanken Grotesk | Owners Wide is an expanded grotesque; Archivo's width axis reaches it. Stolzl is a geometric sans; Hanken Grotesk carries the same light weight. |
| DIGS | — | Archivo, JetBrains Mono | The pack is a working document, not a branded surface. |
| AESDR | its own stack | Playfair Display, Source Serif 4, Barlow Condensed, Space Mono | The product's own choices, all available. |
| Antaeus | its own trio | DM Serif Display, Public Sans, JetBrains Mono | The product's own trio, all available. |

## Where the material ran out

- **Puff Junction has no shop.** The price, the stock count and the four
  colourway dots are ours. Everything else on that page — the palette, the
  mark, the renders, the dimensions, the taglines — is the brand's.
- **Darkest Shades does not map a name to a frame.** The brand's naming
  language exists in the guide but is recorded as not yet assigned to the nine
  models. So the three photographed frames carry their recorded silhouette and
  colourway, and no name was invented for them.
- **AESDR records twelve courses and one of their margin notes names a
  person.** That note is dropped. The card keeps its title, call number and
  day tag. Nothing was written to replace it.
- **AESDR has a price, testimonials and course descriptions that the study
  did not record.** They are absent from the page rather than approximated.
  The page shows only surfaces the product records.
- **Antaeus's sample account is ours.** It is the shape of the product's own
  demo data. It is not anyone's pipeline, and no real account, deal or person
  appears.
- **DIGS is the exception.** Nothing about the garment is invented: the flats,
  the ISO stitch callouts, the graded spec, the colourways, the Pantone
  reference, the change-log entry and the out-of-tolerance flags are all the
  real document.

## Form

The page's composition follows a flagship product page — sticky local nav,
one hero, a sticky buy bar, a highlights rail, a band per piece of work, a
numbers section, a compare panel, questions, a close. That shape is borrowed
deliberately: it is a form that is known to carry a long scroll, and the
argument here is that the material can hold it. The material is entirely
these five brands'.

## Frames

Each band shows its mockup **whole**, at the mockup's own design width of
1400px, scaled down to the column. The scale is set by script on resize
because CSS will not divide one length by another; with script off the frames
fall back to the desktop ratio. The frame's height is measured from the mockup
at build time rather than typed into the page, so a mockup that grows a
section cannot end up sliced by a stale number.

The one exception is the hero, which deliberately shows only the top of the
first page and fades out, because it is a teaser above the fold rather than
the work itself.

On a phone a whole desktop page scaled into a 350px column is small. Every
band therefore carries a link to the page itself, which opens the same
document full size — the same bytes, checked by `accept.py` check 6.

## What is not here

No contractor's name, in any file, comment, commit message, caption or asset.
No employer, product, partner or person from the internal sales tool. No
invoice, bank detail, receipt or contract was opened for this work. The
repository is private; only `dist/` is ever published.
