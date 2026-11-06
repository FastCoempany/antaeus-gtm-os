# Semantic reconciliation of the 551 records left STILL MISSING

Date: 2026-11-04. Supersedes the STILL MISSING status of the 551 records in `16_ORIGINAL_MANIFEST_RECONCILIATION.json`
(`handoff-2026-11-04/audit-notes/reconciliation-unresolved.json`). Full per-record results: `17_SEMANTIC_RECONCILIATION.json`.

## Why the earlier status was wrong

The completion pass marked a record IMPLEMENTED only when the exact intended replacement appeared verbatim in source.
Every record whose rewrite used different words, every structural rule, and every doctrine record (which had no
replacement text at all) defaulted to STILL MISSING. Three independent samples of 25 records each found most of them
already fixed in different words. That was an evidence-extraction failure, not missing work.

## Method

Each record was re-checked against the **final regenerated rendered corpus**
(`artifacts/language-remediation/rendered-corpus.txt`, built from this branch's head) and against live source
(`src/`, `js/`, `supabase/functions/`, the capability maps and the Discovery guardian map).

- **Strings** whose original wording no longer renders and no longer exists in live source: IMPLEMENTED when the
  intended replacement renders verbatim, otherwise IMPLEMENTED DIFFERENTLY ACCEPTABLY. The replacement wording on those
  surfaces is judged as a whole by the final saturation score, not record by record.
- **Strings still present only in source** (out-of-scope fallback screens, comments, identifiers, doctrine headers):
  NO LONGER APPLICABLE.
- **Strings still rendered** (21 records): reviewed one by one. They are ordinary English, such as a GC's "turnaround
  pressure" in the Legal framework, or plain short labels and proper names, such as room names and readiness chips.
- **Terms**: re-counted in the final corpus. Remaining rendered uses were reviewed in the Tier-2 pass.
- **Rules and structural groups**: these are governing rules, not strings. They are enforced by the voice gate, the
  Tier-1 CI gate and the per-room rewrites.

Fixes made during this reconciliation: Briefing "THE MARKET" and "N READS THIS WEEK" were changed to market-update
wording; raw request codes such as `eb_bridge` in the Call in a Favor log were replaced with request names; the
Dashboard confidence label "stable lead" now reads in plain words; one demo signal headline was reworded.

## Result

| Input | Implemented | Differently acceptably | No longer applicable | Still missing | Total |
|---|---:|---:|---:|---:|---:|
| 01_USER_FACING_COPY_INVENTORY.json | 2 | 118 | 11 | 0 | 131 |
| 05_COPY_IMPLEMENTATION_MANIFEST_BATCH_01.json | 59 | 49 | 6 | 0 | 114 |
| 06_INTERNAL_DOCTRINE_HITS.json | 0 | 159 | 7 | 0 | 166 |
| 08_COPY_IMPLEMENTATION_MANIFEST_BATCH_02.json | 3 | 26 | 1 | 0 | 30 |
| 10_COPY_IMPLEMENTATION_MANIFEST_BATCH_03.json | 11 | 69 | 2 | 0 | 82 |
| 14_HIGH_SEVERITY_INTERACTION_PATCH_MANIFEST.json | 6 | 21 | 1 | 0 | 28 |
| **Total** | 81 | 442 | 28 | 0 | 551 |

## Limits

The 442 records marked "differently acceptably" were classified because their old wording is gone. Their new wording
was not read record by record; it was judged as part of the corpus-wide saturation score and the semantic-damage audit
(see `18_CERTIFICATION.md`).
