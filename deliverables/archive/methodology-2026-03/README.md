# Methodology library (archived 2026-11-09)

Ten SEO articles plus an index page, written in March 2026 as a free "public thinking" library that sent readers into the demo and the workspace. They were never in the deploy list, so antaeus.app never served them, and the founder dropped them on 2026-11-09. They are kept here in case they come back.

## What's here

| File | What it is |
|---|---|
| `methodology/index.html` | The library's index page |
| `methodology/*.html` | The 10 articles |
| `methodology.css` | Their stylesheet. It was `css/methodology.css`, and the pages still link to `/css/methodology.css` |
| `methodology-bridge.js` | Their page script. It was `js/methodology-bridge.js`, and the pages still link to `/js/methodology-bridge.js` |

The 10 articles:
- When to hire your first salesperson
- Founder-led sales process
- Enterprise discovery call framework
- Cold call script for B2B SaaS
- First AE playbook
- Sales handoff kit
- Sales kill switch framework
- Sales champion framework
- Portfolio GTM assessment
- VC platform sales tools

## If they come back

Several problems have to be fixed first:

- **Old visual style.** The pages use the retired dark navy-and-gold look. The public pages are now bright (CLAUDE.md Part II §1).
- **Old wording.** The copy predates the language remediation: "proof", "rep", "module", "thin", "operating context", "route belief", and "One of 19 modules. $299 per year." It needs a rewrite to `COPY_STANDARD.md`.
- **Encoding.** The files are saved in Latin-1 but declare UTF-8, so the "·" separator shows as a broken "�" character. Re-save them as UTF-8.
- **Navigation.** The links point to `/purchase/` ("See Annual Plan") and the old "Explore Demo Lane" label.
- **Deploying them.** Move the pages and both support files back to their old paths, add `methodology` to the deploy list in `tools/deploy/build-cloudflare-assets.js`, add the pages to the copy audit's `TARGETS`, and put their URLs back in `sitemap.xml`. Neither `sitemap.xml` nor `robots.txt` is deployed today either.
