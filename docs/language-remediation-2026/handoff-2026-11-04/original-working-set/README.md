# Antaeus Language Remediation Workspace

Source: `antaeus-preview-walkthrough.txt`

## Corpus extracted

- Rendered user-facing occurrences: **5,627**
- Unique rendered user-facing strings: **2,780**
- Internal doctrine lines flagged for deprecated/private language: **169**

## Files

1. `01_USER_FACING_COPY_INVENTORY.json` — exhaustive rendered-string inventory with room/state, occurrence count, classifications, severity, and approved replacements where decided.
2. `02_LANGUAGE_MIGRATION_MAP.md` — system-wide vocabulary translation map.
3. `03_INTERNAL_LANGUAGE_DOCTRINE_REWRITE.md` — replacement doctrine so the old dialect does not regenerate.
4. `04_REWRITE_BATCH_01_SHARED_AND_CORE.md` — actual rewrite decisions for shared chrome, Welcome, Dashboard, Readiness, ICP Studio, and Future Autopsy.
5. `05_COPY_IMPLEMENTATION_MANIFEST_BATCH_01.json` — machine-readable implementation instructions for Claude Code/Codex.
6. `06_INTERNAL_DOCTRINE_HITS.json` — internal capability-map/doctrine lines that still encode the deprecated language system.

## Next rewrite batch

After Batch 01 language decisions are reviewed/accepted, continue in this order:

1. Territory Architect
2. Signal Console
3. Briefing
4. Getting to Signed
5. Founding GTM
6. Pilot Desk
7. Call in a Favor
8. Remaining execution rooms
9. AI-generated template/prompt audit
10. Regenerate transcript and rerun identical saturation test

The goal is **≤20/100 saturation** without flattening Antaeus's product intelligence or visual identity.


## Additional completed source-material work

7. `07_REWRITE_BATCH_02_STRATEGIC_AND_DIAGNOSTIC.md`
8. `08_COPY_IMPLEMENTATION_MANIFEST_BATCH_02.json`
9. `09_REWRITE_BATCH_03_EXECUTION_AND_UTILITY.md`
10. `10_COPY_IMPLEMENTATION_MANIFEST_BATCH_03.json`
11. `11_AI_PROMPT_AND_GENERATOR_REWRITE_SPEC.md`
12. `12_COPY_LINTER_AND_CI_SPEC.md`
13. `13_IMPLEMENTATION_ORDER_FOR_CODING_AGENT.md`

The source-material phase now covers all rooms at the system level. The exhaustive inventory remains the backstop for interaction-state strings not explicitly rewritten in the batch manifests.
