# Product page copy rewrite: PR #314 map applied to `antaeusproductpage (3).html`

**Date:** 2026-09-28
**Inputs:** the four files PR #314 added at the repo root (`COPY_STANDARD.md`, `COPY_AUDIT_AND_REWRITE.md`, `COPY_INVENTORY_AND_REWRITE_MAP.json`, `CODEX_HANDOFF.md`) and the page they were written against (committed here as `antaeusproductpage-3.source.html`, because it was not in the repo).
**Review of the PR itself:** [`pr-314-review.md`](pr-314-review.md).

This follows `CODEX_HANDOFF.md`: apply the approved map, keep structure and hooks intact, report anything that could not be applied exactly, render at desktop and mobile widths, then validate the high-risk terms. No section was redesigned, and no approved copy was reworded or shortened.

---

## What is in this folder

| File | What it is |
|---|---|
| `antaeus-product-page.copy-map-applied.html` | **The approved map, applied exactly.** All 193 rewrites, all 22 standalone leaf strings (29 places), plus the fixes the map needs to work: the Pace picker's JS data for the default deal size, one CSS line, and five `<br>` placements. |
| `antaeus-product-page.copy-map-applied+proposed-addendum.html` | The build above **plus a proposed addendum** for visible copy the map never covered: the four product-viewer scenes, the other three Pace deal sizes, and aria-labels. **Not approved yet.** |
| `copy-map-applied.diff` | Unified diff, original → map-applied (zero context, 160 hunks). `git apply --unidiff-zero` on the source reproduces the build byte for byte. |
| `proposed-addendum.diff` | Unified diff, map-applied → proposed (24 hunks). Also verified to reproduce the build. |
| `apply-report.json` / `apply-report.csv` | Machine-readable report, one row per map entry: unit id, source line, status, original, replacement. The JSON also records the markup used for each rewrite, the verifier's result, leaf locations, the JS mirror, the CSS fix, and each addendum entry. |
| `proposed-addendum.json` | The 92 addendum entries in the same raw find-and-replace form: 54 changes and 38 strings checked and left as they are. Each entry says whether it is copied from an approved replacement (`map-exact`), adapted from one (`map-adapted`), or new. |
| `pr-314-review.md` / `pr-314-review-findings.json` | The review of the PR: 73 findings from four reviewers, each checked by a skeptic. 68 confirmed, 5 refuted. |
| `render-check/` | Before/after render probes at 1440, 820, 390, 360 and 320px, comparison notes, and the high-risk term scans. |
| `screenshots/` | Before/after crops of the hero, the two-up figure at 390px, the Pace section, and two product-viewer scenes (map-applied vs proposed). |

---

## 1. What was applied

| Map item | Count | Result |
|---|---:|---|
| Logical units, `action: rewrite` | 193 | **All applied.** 190 exactly. 3 (units 183–185) have one `" · "` separator dropped. See §2. |
| Logical units, `action: keep` | 140 | Untouched. |
| Standalone leaf replacements | 22 keys | Applied in **29 places**: 28 in the page, 1 in the page JavaScript (`The week to run` inside the handoff scene). Matching is exact, case-sensitive, and on the whole text node. Leaves inside a rewritten unit were skipped, as the handoff says. |
| "How a deal gets to signed" fix | 1 | Present in unit 70 ("how you advance a deal to signature"). |

**How the 89 rewrites with inline markup were rebuilt.** 104 rewrites were plain text and were applied by code. The other 89 had inline markup (`<b>`, `<em>`, `<a>`, `<span>`, `<br>`, `<i>`). An author agent rebuilt each one, and then an adversarial verifier re-checked it with real renders. A deterministic check then confirmed that the visible text of every rebuilt element equals the approved replacement exactly (`<br>` read as a space, tags stripped, entities decoded, whitespace collapsed). All 193 pass.

Emphasis follows the handoff rule. Bold moved onto the plain phrase that now carries the old meaning (for example `<b>Running hot</b>` → `<b>Antaeus ranks Chomps highly</b>`), and never stayed on a dropped metaphor. Every link keeps its `href` and wraps the matching words of the new text. Every child element with an id, class, style or data attribute is byte-identical.

**Structure check.** Parsed tag by tag, the map-applied page differs from the original only by four removed `<br>` tags. Every class, id, href, data attribute and aria attribute is unchanged. Every diff hunk falls on a rewrite unit, a leaf, the JS mirror, or the CSS fix; nothing else changed.

## 2. Entries that could not be applied exactly, and other implementation decisions

1. **Units 183–185 (Pace benchmark rows): separator dropped.** Each row is `<b id="pace-a">…</b><span id="pace-as">…</span>`, and the deal-size picker rewrites those ids from JS. The map gives one flat string per row, for example `20% win-rate benchmark · typical range 15–25%`. Putting that string in the `<p>` as one piece would delete the ids and quietly break the picker. So the text before `" · "` goes in the `<b>`, the text after goes in the `<span>`, and the `" · "` itself is dropped because the two are separate blocks. Every word is kept.
2. **Pace picker JS data (`BENCH.mid`) updated to match.** Without this, choosing another deal size and then "Deals around $60k" again puts back the old copy ("1 in 5 closes / in flight / slips"). The mid-size entry now holds the exact approved text from units 183–185. The other three deal sizes are not in the map; they are in the proposed addendum.
3. **One CSS line (the handoff allows a minimal layout fix when text length makes it necessary).** The approved readiness labels are longer ("Usable with founder support", "Hire-ready and repeatable"). They widened the grid of the "was / now" figure in the Briefing section, and the whole page scrolled sideways: **70px at 390px wide, 1px at 820px.** The fix changes `.twoup` from `1fr 1fr` to `minmax(0,1fr) minmax(0,1fr)` (and `1fr` to `minmax(0,1fr)` at ≤420px). To test it on its own, I applied it to the original copy. It changes nothing at 1440, 390 or 360px and moves the page by 1px at 320px. At 820px the figure is 15px shorter, and the "Inheritable" label, 4px too wide for its narrower column, now ends in an ellipsis. After it, no width scrolls sideways.
4. **Line breaks in headings (markup only, words unchanged).** 14 rewrites kept an original `<br />`. Renders at 1440–320px showed that five of those breaks made the new, longer headings worse. The adversarial verifiers dropped four and moved one:
   - Unit 16, the hero: dropped. With the break, "use." sat alone on the last line at 1440 and 820px.
   - Unit 106: dropped. With the break, "risk." sat alone at the common phone widths.
   - Unit 176: dropped. Without the break the heading is 3 lines instead of 4.
   - Unit 207: dropped. With the break, "the Ground" split across two lines at 340–375px.
   - Unit 246: moved to "Compare Antaeus with a CRM / and a spreadsheet". With the original placement, "with" sat alone on its own line at every width.
5. **Unit 23:** kept the scene's `&nbsp;·&nbsp;` spacing around the middle dot: "Ranked #1 · Next: …".
6. **Whitespace between block children.** Units 96–98, 172–174 and 183–185 put a space between `</b>` and `<span>`. Units 88 and 90 put a space before a block-level link. Both halves are `display:block`, so the space renders nothing (measured at 1440 and 390px). It keeps the text reading correctly as plain text and for screen readers.

## 3. Render check (Chromium, page fonts loaded locally, reduced motion so every scene is visible)

The original page, the map-applied page and the proposed page were each rendered at **1440, 820, 390, 360 and 320px**. Every interaction was also exercised: the four product-viewer scenes, the four craft tabs, all four Pace deal sizes, the handoff view switch, and the highlight carousel. Full numbers are in `render-check/`.

| Check | Original | Map applied | Proposed |
|---|---|---|---|
| Page or console errors | 0 | 0 | 0 |
| Sideways scroll (any width) | none | none (70px at 390 without the CSS fix) | none |
| Buttons, tabs and chips that overflow or wrap more | — | none | none |
| Page height at 1440 / 390px | 19,973 / 20,017 | 20,807 (+834) / 20,742 (+725) | same as map applied |
| Product-viewer overflow | 2px at ≤820px | 2px (already in the original) | 2px (already in the original) |

**Layout issues to decide on (reported, not fixed, because fixing them means shortening approved copy or changing the design):**

- **Readiness labels get cut off.** In the "now" figure's five-step ladder, 4 of the 5 new labels end in an ellipsis even at 1440px ("FOUNDER-DEPENDE…", "PARTIALLY DOCUM…", "USABLE WITH FOU…"). Before, only "YOU ARE THE SYST…" was cut. The hero ladder shows the same at 390px and below. Options: shorter labels, let these labels wrap onto two lines, or show only the current step and its neighbors.
- **Demo rows cut off with an ellipsis.** These are single-line rows by design, but the new text is longer:
  - At every width: "Warby Parker has had no recorded progress since the proposal." and "Liquid Death has had no recent buyer activity."
  - At 390px and below: "no champion activity", "this week without a corrective action", "no buyer activity for 14 days — highest-risk open deal", and "Two plants announced · limited recruiting capacity".
- **Headlines get much taller.** The hero goes from 2 lines to 5 at 1440px (6 at 320px) and the hero is 264px taller. 14 other section headings gain a line or two. "Antaeus continues reviewing workspace activity when you're away." leaves "reviewing" alone on a middle line at every width, because the heading is capped at 16 characters wide.
- **Smaller layout notes.** The buy bar's second line wraps at 600px, leaving "know." alone, and runs to 4 lines at 390px. The Chomps note in the ICP card (unit 154) wraps to 4 lines. The Live Edge demo lines are hidden at phone widths, but that was already true of the original.

Screenshots: `screenshots/hero-desktop-before-after.png`, `screenshots/twoup-390-before-after.png`, `screenshots/pace-390-before-after.png`.

## 4. High-risk term validation (the handoff's list)

The list is `motion, room, rooms, move, moved, shape, line, hot, warm, cold, slip, dies, autopsy, in your head, you are the system, inheritable, awake`. The scan matched whole words against:

- the visible text,
- the aria-label, alt, title and placeholder attributes,
- the text inside the page's JS strings, and
- the rendered text of every interactive state.

A plain grep of the source is mostly noise: `line-height`, `#rooms`, `btn--move`, and base64 image data. So the scan does not use one.

| | Original | Map applied | Proposed |
|---|---:|---:|---:|
| Hits in source copy, attributes and JS strings | 119 | 17 | 7 |
| Hits in the rendered text of all states | 121 | 14 | 7 |

**Every instance left in the map-applied build:**

| Where | Text | Classification |
|---|---|---|
| L1143, L1179, L1209 | "Preparing for a cold call" / "Cold call" | **Literal.** It is the actual activity and the Cold Call Studio name. Intentional exception. |
| L1277 | "Warm introduction." | **Literal** sales term, approved in unit 164. Intentional exception. (The review suggests renaming it for other reasons.) |
| L1414 | "Future Autopsy" | **Approved feature name.** |
| L1848 (JS) | `prefers-reduced-motion` | **Code**, not copy. |
| L989, L997, L1001 | aria-labels "Open a room", "Previous room", "Next room" | **Outside the map** (attributes were never audited). Fixed in the proposed addendum. |
| L2082–L2113 (JS, 8 hits) | product-viewer scenes: "the cold ones", "the exact next line", "how a deal dies", "the room where the fix happens", "Warby Parker dies in 20 days", "a second name in the room", "no single room could have told you" | **Outside the map** (JS-rendered copy was never audited). Fixed in the proposed addendum. |

In the proposed build only the first four rows remain: literal, a proper name, and code.

A wider scan also covered terms the handoff's list leaves out (`quiet`, `hands you`, `sees`, `notices`, `knows`, `flinches`, `owned the number`, `go ask`, `bench`, `carry`, `run`, and canon's never-bare words). It went from 71 hits in the original to 32 in the map-applied page and 18 in the proposed page. Most of what is left was **introduced by the approved map**: 7 bare uses of "evidence" (canon §13 says never bare), "activity gap", "multi-rep", and "recruiting bench" twice. These are listed in `render-check/extra-scrutiny-terms-proposed.json` and discussed in the review.

## 5. Copy the map never covered (the proposed addendum)

The inventory only read static text nodes. The page's JavaScript writes about 11–13% of its visible copy by word count, and none of it was audited:

- **The product viewer** ("Take a closer look"): four chips, four captions and four scenes. This includes the Future Autopsy scene ("Warby Parker dies in 20 days, and here is how") and the handoff scene. Several of these strings repeat static text that the map rewrote, so clicking a chip used to bring the old wording straight back.
- **The Pace picker's other three deal sizes:** "1 in 4 closes", "3× in flight", "a single deal going quiet can be the whole quarter", and the others.
- **Attributes:** 26 aria-labels, 6 alt texts, and the `<title>`.

`proposed-addendum.json` covers all of it. An adversarial verifier checked every entry against the approved map, the copy standard, the canon voice rules, the product code (the Pace numbers come from `src/quota-workback/lib/types.ts`) and rendered line widths. Entries copied or adapted from approved replacements are marked `map-exact` and `map-adapted`. The 11 marked `new` are the only fully new copy: 6 in the viewer scenes, 2 Pace sentences, and 3 aria-labels. **It is a proposal: approve it (or edit `proposed-addendum.json`) before shipping the proposed build.**

## 6. Before you ship either build

The map-applied build does what the approved map says. The review found things the approved map gets wrong: on-screen labels that no longer match the shipped app, claims the code does not support, and conflicts with canon. The three biggest are the renamed readiness states, "no buyer activity", and the delete and hire-access claims. See [`pr-314-review.md`](pr-314-review.md); its first section lists the decisions that are yours to make.

## Method notes

- **Rendering.** Playwright Chromium at five widths. Google Fonts (DM Serif Display, Public Sans, JetBrains Mono) were served from a local cache so line breaks are measured with the real fonts.
- **Agents.** A 22-agent workflow did the work in five parts: author, verify, review, refute, and addendum. Every inline-markup edit had an independent adversarial verifier, and every review finding had a skeptic try to refute it.
- **Scripts.** No audit scripts are committed (canon Part V §4). The report files record the method.
