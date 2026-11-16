# Implementation Order for Claude Code / Codex

## Rule

Do not independently rewrite copy. Implement the approved language artifacts in this folder. If an approved replacement conflicts with actual product behavior, stop that individual replacement, document the conflict, and preserve behavior. Do not invent a new phrase.

## Order

1. Shared workspace navigation (`Ground` → Workspace map)
2. Shared recent-activity chrome (`Live Edge`, `Machine`, buyer/activity labels)
3. Readiness state labels and presentation
4. Account-priority / Signal Console terminology
5. Shared generated-analysis templates
6. Welcome
7. Dashboard
8. Readiness
9. ICP Studio
10. Future Autopsy
11. Territory Architect
12. Briefing
13. Getting to Signed
14. Founding GTM
15. Pilot Desk
16. Call in a Favor
17. Prospecting / Outdoors Events
18. Outbound / Cold Call / LinkedIn / Discovery
19. Deal Workspace
20. Quota Workback
21. Settings
22. Internal capability-map / doctrine language
23. Prompt/template instructions
24. Copy linter + CI

## Source tracing

For each approved string:
- search the repo for the literal string;
- determine whether it is room-specific, shared, deterministic-generated, or AI-generated;
- update the highest correct source of truth;
- do not patch generated transcript files as the implementation.

## Shared-component rule

If one source component produces dozens of transcript occurrences, update the component once and verify all rendered occurrences change.

## Enum/state rule

If a renamed user-facing state is backed by a persisted enum, keep the stable internal enum key unless a data migration is explicitly required. Change the display label and explanatory text.

## Validation

After all implementation changes:

1. Run unit/integration tests.
2. Run `npm run copy:audit`.
3. Regenerate the full preview transcript.
4. Diff the regenerated transcript against the original.
5. Search the regenerated transcript for every Tier-1 term.
6. Review all Tier-2 warnings.
7. Return the regenerated transcript for a new 9-dimension saturation test.
8. Target: ≤20/100.
