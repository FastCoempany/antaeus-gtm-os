# Original manifest reconciliation

Status: in progress. The JSON companion preserves every source record and records explicit evidence, permitted status, and rationale. Unresolved rows are retained as STILL MISSING; they must not be represented as completed remediation.

Original corpus: 5,627 rendered occurrences, 2,780 unique strings, 169 flagged doctrine lines. SHA-256 fingerprints for all 17 original working-set files are in the JSON.

| Input | Records | Implemented | Different acceptable | Approved evolution | Not applicable | Still missing |
|---|---:|---:|---:|---:|---:|---:|
| 01_USER_FACING_COPY_INVENTORY.json | 2780 | 91 | 97 | 24 | 2437 | 131 |
| 05_COPY_IMPLEMENTATION_MANIFEST_BATCH_01.json | 192 | 57 | 11 | 10 | 0 | 114 |
| 08_COPY_IMPLEMENTATION_MANIFEST_BATCH_02.json | 157 | 78 | 37 | 12 | 0 | 30 |
| 10_COPY_IMPLEMENTATION_MANIFEST_BATCH_03.json | 133 | 51 | 0 | 0 | 0 | 82 |
| 14_HIGH_SEVERITY_INTERACTION_PATCH_MANIFEST.json | 137 | 41 | 54 | 14 | 0 | 28 |
| 16_REMAINING_CONTEXTUAL_GENERATOR_REVIEW.json | 16 | 0 | 16 | 0 | 0 | 0 |
| 06_INTERNAL_DOCTRINE_HITS.json | 169 | 0 | 3 | 0 | 0 | 166 |

The inventories overlap deliberately; counts are records, not distinct remediation defects. Retain-unless-context records are classified NO LONGER APPLICABLE to a rewrite obligation, without claiming that each dynamic sample still appears verbatim. Exact source matches establish implementation locations; final tester-corpus coverage remains a separate validation.
