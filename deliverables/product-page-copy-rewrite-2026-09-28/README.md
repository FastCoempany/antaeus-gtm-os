# Product page copy rewrite: PR #314 map, corrected and applied

**Status (2026-10-02):** the founder approved the addendum (the JS-rendered copy, Pace bands and aria-labels the map had missed) and asked for the review findings to be fixed in the map. Both are done. There is now one build, made entirely from the corrected map at the repo root (`COPY_INVENTORY_AND_REWRITE_MAP.json`).

The first pass (2026-09-28) applied the map exactly as merged in PR #314 and reviewed it. That review is in `pr-314-review.md`; each confirmed finding now records what was done about it (`fix_status_2026_10_02` in `pr-314-review-findings.json`, and the table in the review).

## What is in this folder

| File | What it is |
|---|---|
| `antaeusproductpage-3.source.html` | The page as uploaded (`antaeusproductpage (3).html`), unchanged |
| `antaeus-product-page.copy-map-applied.html` | The page built from the corrected map. This is the one to ship |
| `copy-map-applied.diff` | Source → build, 161 hunks. `git apply --unidiff-zero` reproduces the build byte for byte |
| `apply-report.json` / `.csv` | One row per map entry: logical units, standalone leaves, raw edits, JS and attribute units, with status |
| `pr-314-review.md` / `pr-314-review-findings.json` | The review, now with a fix status per finding |
| `render-check/` | Chromium probes of the original and the build at five widths, the comparison, and the term scan |
| `screenshots/` | Before/after crops: hero, the Pace band at 390px, the two-up handoff figure at 390px, two product-viewer scenes |

## 1. What changed in the map

The map keeps its PR #314 shape and adds what the review asked for:

- **135 logical units revised.** 24 go back to their original text, 111 get new text (6 of those were "keep" before). Every revised unit carries `revision_2026_10_02` with its previous action and replacement and the findings it answers. Totals now: 175 rewrite, 158 keep.
- **`replacement_html`** on every rewritten unit that contains markup, so links, `<br />` and bold spans are no longer guesswork. Units 183-185 also carry `replacement_parts` keyed by element id (`pace-a`, `pace-as`, …).
- **Standalone leaves** rewritten with explicit matching rules (`standalone_leaf_rules`): exact, case-sensitive text-node equality outside rewrite units, applied after unit edits, and the same text inside the page JS. 18 leaves hit 26 places. `standalone_leaf_revision_2026_10_02` lists what was removed, changed and added.
- **`raw_edits`** (5) for changes a leaf can't express: the Briefing suggestion sentence, the "replied 2h ago" claim, "already watch" → "already track", the Cold Call step row (now the live step names), and the LinkedIn rung order.
- **`js_and_attribute_units`** (92: 50 changes, 42 recorded keeps). This is the approved addendum, corrected to match the fixed map: the product-viewer chips, captions and scenes, all 24 Pace `BENCH` strings (so picking a deal size no longer brings the old wording back), and the aria-labels.
- **Raw text nodes**: coverage recomputed by source span (486 of 633 sit inside a unit), and every node carries an explicit `decision`. Units 304-307 are labeled `closing` instead of `nav`.
- **Layout fix retired.** The first build needed a `.twoup` grid change because the renamed readiness states were longer. With the live names back, the page doesn't scroll sideways at any tested width, so the original CSS ships unchanged (`layout_fixes_note`).

### The principles behind the corrections

1. **Product mocks show what the app shows.** Readiness states (*You are the system, Building, Inheritable with guardrails, Hire-ready, Hire-ready, repeatable*), the Signal Console bands, *Pain & consequence*, *One thing to notice*, *5 of 7 parts ready*, *Who's hands-on*, *The one thing blocking*, *Your line*, and the Cold Call step names were all checked against `src/`. The surrounding prose explains them in plain words.
2. **Canon wins where COPY_STANDARD disagrees with it.** Future Autopsy keeps its name and "dies in 20 days"; "3 deals will slip"; setup asks for "the judgment only you have", not "entering information"; "their ask against your line".
3. **Say only what the product does.** No "buyer activity" (nothing measures it); the Briefing describes its four real 30-minute checks; delete and export name what they actually cover; a new hire gets the read-only handoff-kit link, not a seat in the workspace; Outbound needs an account and a named contact (it doesn't block generic messages); Pace flags the most optimistic assumption.

## 2. Render check (Chromium, page fonts served locally, reduced motion so every scene shows)

| Width | Sideways scroll | Clipped text (original → build) | Page errors |
|---|---|---|---|
| 1440 | none | 2 → 1 | 0 |
| 820 | none | 2 → 1 | 0 |
| 390 | none | 8 → 7 | 0 |
| 360 | none | 9 → 9 | 0 |
| 320 | none | 12 → 13 | 0 |

The clipped items are the one-line demo rows inside the product mocks, which ellipsize by design; the original clips the same rows. All four product-viewer scenes, the four craft tabs and the Pace picker (five options) were exercised at every width. Details: `render-check/original-vs-map-applied.md`.

Known and left alone: the hero headline still runs 2 → 5 lines at 1440 (the approved #16 sentence is much longer than "You built it. They can run it."), and several other headings gain a line. Shortening #16 would be a copy decision, not a fix.

## 3. Term scan

The scan covers visible text, aria/alt/title attributes and JS string literals, with whole-word matching. 39 hits remain, all deliberate: live labels (*Where your whole motion stands*, *You are the system*, *Inheritable*, *Act now — hot*, *going cold*, *Your line*), canon wording (*slip*, *Future Autopsy*, *dies*), and literal uses (*cold call*, *move a deal*, *a thin line*, `prefers-reduced-motion`). No *proof*, *earned*, *verdict*, *rep*, bare *evidence* or bare *gap* in the copy. Full list: `render-check/high-risk-terms-map-applied.json`.

## 4. Still open (not something the map can fix)

- **Dashboard "move" kicker:** the live Dashboard still says "The most valuable move on your board". The page now says "Highest-priority action"; canon sides with the page, so the app should change.
- **Product gaps behind the copy:** delete leaves share links, observations and captured meetings in place; the export leaves out signals, observations and captured meetings. The copy now names only what each actually covers.
- **Founder calls:** whether "room" and "motion" are user-facing words; the Pace / Quota Workback name; whether COPY_STANDARD should be amended where it conflicts with canon (the personification ban, "evidence" as a preferred noun, "slip", "autopsy", the hot/warm/cold rule); where the four PR #314 docs should live and whether COPY_STANDARD enters the canon authority order. COPY_STANDARD.md, CODEX_HANDOFF.md and COPY_AUDIT_AND_REWRITE.md are not edited.
- **Lint scores** (`issues_after`, `severity_after`) were not recomputed for revised units.

## Method notes

Units are located by exact source span (all 333 match). Plain units are escaped into their original element; markup units use `replacement_html`, and a fidelity check confirms the visible text equals `replacement` (for 183-185, with the " · " between the two ids dropped). Leaves are matched in original coordinates, then raw edits, then JS and attribute units, each with an expected occurrence count; the build reports zero problems. The JS was syntax-checked with `node --check` after the swaps. Build and audit scripts were run from a scratch directory and are not committed.
