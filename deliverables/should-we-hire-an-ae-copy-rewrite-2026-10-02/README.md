# "Should we hire the next AE?" page: copy rewrite

**What this is:** the uploaded `should-we-hire-an-ae.html` with its copy rewritten to the same standard as the product page: `COPY_STANDARD.md` (literal nouns and verbs, headlines that make sense alone, a literal FAQ, no claims beyond what the service does) plus canon voice rules §11/§13 (no *proof/prove*, no bare *evidence* or *gap*, no insider words like *underwrite*, *seat*, *motion*, *allocatable*, *horizon*, *supportable*).

| File | What it is |
|---|---|
| `should-we-hire-an-ae.source.html` | The page as uploaded, unchanged |
| `should-we-hire-an-ae.copy-rewrite.html` | The rewritten page. Only copy changed; markup, classes, CSS and the checkout script are untouched |
| `copy-rewrite.diff` | Source → rewrite |
| `rewrite-report.json` | All 101 swaps, by section, before and after. Each was an exact match that had to occur the expected number of times |
| `render-check/` | Chromium probes of both versions at 1440 / 820 / 390 / 360 / 320 |
| `screenshots/` | The rewrite's hero and sample sections at 1440 and 390 |

## The main changes

- **Hero.** "prove there's a sales system for them to inherit" → *check that your pipeline and sales process can support one*. The lede now names the inputs in plain words and says what the brief tells you.
- **Sample states.** *CONDITIONAL* → *YES, WITH CONDITIONS*; *THIN* → *SHORT*; the lane and metric labels are now literal (*Pipeline supply*, *Repeatable without the founder*, *Deals to win*, *Qualified pipeline the new AE can take over*).
- **Section labels.** Each one now says what the section is: *A COMMON HIRING MISTAKE*, *WHAT WE CHECK*, *THE MATH*, *WHAT WE ASK YOU FOR*. Slogan headlines became sentences: "Four things have to survive the math" → *Another AE is supported only if four things hold up in the numbers*; "A decision brief, not a dashboard" → *You get a written brief that answers one hiring question*.
- **Deliverable and price lists.** Section names now say what each part holds (*What changes the answer*, *What we couldn't confirm*). The list of "X analysis" items became plain items.
- **FAQ.** Each answer leads with the answer in plain words. The CRM answer drops "Not for the $149 version", which implied a second version the page doesn't offer.
- **Kept as-is:** the checkout-not-connected banner and notices, the privacy answer (it is already careful to state only what is true today), the fictional-sample disclaimers, the figures and the equations. The one exception is "incremental ARR", which is now *new ARR*.

## Checks

- The jargon scan of visible text, attributes and checkout notices went from 70 hits to 3. All three are deliberate: "revenue gap" (not bare), "the math" and the *THE MATH* label.
- Both page scripts still parse.
- Render: no sideways scroll, no clipped text and no page errors at any width, before or after.
- The headline is longer, so it runs one or two lines more: 1440 4→5, 820 2→3, 390 4→6, 360 5→6, 320 5→7. Shortening it is a copy decision, for example using "AE" instead of "account executive" now that it's spelled out elsewhere.

## Open

- There is no spec for the AE Hiring Brief service in this repo, so claims were checked against the page itself and its code comments only.
- The page still uses the old dark/gold app stylesheet tokens under a bright override. That's a face question, not copy, so it wasn't touched.
