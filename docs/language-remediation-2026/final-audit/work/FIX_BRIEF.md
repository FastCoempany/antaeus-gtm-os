# Antaeus final audit — shared brief for every fixer

You are fixing verified findings from the final audit of the Antaeus language remediation, in ONE partition of the repository. Read this brief fully before editing.

Each fixer works in its OWN checkout of the repository (a git worktree on its own branch, path given in the assignment). Many fixers run at the same time, each in a different partition. The orchestrator merges every branch afterwards.

## 1. Hard rules

1. **Work only inside your checkout, and only in your partition.** Every path in your work order is relative to your checkout. Never read from or edit `/home/user/antaeus-gtm-os` (the orchestrator's checkout). Edit only files under the paths your assignment says you own. If a fix needs a change elsewhere, do not make it: record it under `needsElsewhere` in your result with the exact file, line and change.
2. **Git:** make ONE commit on your branch when you are done, adding only your partition's paths (the exact command is in your assignment). Never push. Never run `git stash`, `git checkout`, `git switch`, `git restore`, `git reset`, `git clean`, `git rebase`, `git merge`, or touch another branch or worktree.
3. **Never run** a repo-wide formatter, `npx tsc`, `npm test` (the whole suite), `npm run build`, `npm run build:cloudflare`, `npm run test:e2e`, `npm run build:transcript`, or a browser. The machine is shared; the orchestrator runs the type check, the full suite, the builds and the walkthrough after merging.
4. **Never edit generated output** (`preview-transcript/**`, `artifacts/**`, `dist/**`). Fix the source that produces the text.
5. **Never weaken a test.** When a test asserts old wording, change the expected text to the new wording with the same strictness. Do not delete assertions, loosen matchers, add `.skip`, or widen a regex to make a test pass. If a test fails because your change is wrong, fix the change.
6. **Never rename** identifiers, storage keys, enum keys, routes, URL parameters, table or column names, CSS classes, test ids, Posthog flag keys, or analytics event names. Display text changes; contracts do not. If a display label is currently stored where a stable key belongs, keep reading the old stored value (add a translator) — do not break saved data.
7. **Verify before you change.** Each work-order item was written by a reviewer and checked by two others, but source may differ from what they quoted (line numbers drift). Open the file. If the quoted text is not at that line, search your partition for it. If the problem no longer exists, mark the item `skipped` with the reason.
8. Do not add comments that describe this audit or the change ("fixed per audit", "was X"). Write the code as it should read. Keep the file's existing formatting and style.

## 2. The governing principle and where the rules are

**Antaeus may have a point of view. It may not require translation.** A first-time founder or seller should understand what they see, what a state or number means, why a conclusion was reached, how certain it is, what to do next, and where to do it — without learning Antaeus vocabulary.

Read before editing copy:
- `COPY_STANDARD.md` (repo root) — the governing language standard; §26 holds the owner's most recent rules.
- `/tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit/AUDIT_BRIEF.md` §3 (the disputed-terms table: rank, move, room, proof, in your head, motion) and §4 (owner decisions — do not reopen).
- The original rewrite document named in your assignment, when one is named. Where the original working set gives an exact replacement for a string and that replacement is still accurate, use it verbatim.

## 3. What a good fix looks like

- **Accurate.** The new text claims only what the code does and what the data supports. Read the code that produces the string. Never say "buyer activity" for a record-updated timestamp, "will" for a heuristic, "because" for a correlation.
- **Keeps the judgment.** The product's opinion, specificity and decisiveness stay. Do not replace a sharp, correct statement with a bland one. Do not hedge a statement that the data fully supports.
- **Plain and natural.** A seller would say it out loud. Not childish, not bureaucratic, not longer than needed. It still fits where it sits (button, chip, heading, table cell, tooltip). A string passed through `t()` with class `"label"` must be 6 words or fewer; the voice gate (`src/lib/voice`) runs in the unit tests.
- **Consistent.** One concept, one name. Match how the default (v4) screens and `COPY_STANDARD.md` already name it; grep before inventing a new term. The same fix applied to the same string in the older screen versions (`ds/`, `components/`) of your area.
- **Evidence beside the conclusion.** Where the product recommends or ranks, the text names what was compared and by what. Keep observation, inference, forecast and recommendation distinguishable.
- **Legitimate sales terms stay**: account, contact, stage, value, close date, next step, forecast, momentum, champion, economic buyer, stakeholders, use case, pain, competition, decision process, pipeline, quota, closed won/lost, pilot, success criteria.
- **Conversational lines a seller says to a buyer stay conversational.** Only private Antaeus vocabulary and unsupported certainty are removed from them.

Do not "improve" strings that are not in your work order and have no real comprehension problem. Do not restyle, refactor, reorder or reformat code you are not fixing.

## 4. Functional fixes

For every item whose category is `FUNC` or `CLAIM`: make the smallest correct change; keep stored data and callers working; add or extend a unit test that fails without the fix and passes with it (colocated `*.test.ts(x)`), unless the item says a test already covers it. For edge functions (Deno, under `supabase/functions/`), put pure logic where the existing vitest files for that function already import from, and extend those tests.

## 5. After the listed items — sweep your partition

When the work order is done, read through the remaining user-visible strings in your partition (all screen versions, tooltips, `aria-label`, `placeholder`, empty/loading/error/success states, generated text, prompts, exported text) for the same kinds of problem the work order fixed. Fix clear cases the same way and list each under `sweep` in your result. Leave borderline cases alone and list them under `leftForReview` with your reasoning.

## 6. Check your work

- Run the unit tests for your partition only, with one worker: the exact `npx vitest run … --maxWorkers=1` command is in your assignment. All must pass. If a test outside your partition would break because of your change (for example another area's test asserts a string your code produces), list it under `needsElsewhere` — do not edit it.
- Because you may not run the type checker, be careful with types: when you change a union, an exported constant, a function signature or a label map, find every user inside your partition (`grep`) and keep them consistent; list users outside your partition under `needsElsewhere`.
- For edge functions (Deno): `/opt/node22/bin/deno check --no-lock <file>` on TypeScript you changed there.
- `git diff --stat` and re-read your whole diff once, as a first-time user and as a code reviewer, before you commit.

## 7. Result file

Write one JSON file to the path in your assignment:

```json
{
  "partition": "<key>",
  "items": [
    { "id": "<work-order item id>", "result": "applied|applied-amended|skipped", "file": "path", "finalText": "the text or change now in source", "reason": "required for applied-amended and skipped" }
  ],
  "sweep": [ { "file": "path", "line": 0, "before": "…", "after": "…", "why": "…" } ],
  "leftForReview": [ { "file": "path", "line": 0, "text": "…", "why": "…" } ],
  "needsElsewhere": [ { "file": "path outside your partition", "line": 0, "change": "…", "why": "…" } ],
  "testsChanged": ["path — what changed"],
  "testsAdded": ["path — what it proves"],
  "checks": { "vitest": "command and result", "deno": "result or 'n/a'" },
  "commit": "hash of your commit, or 'none'",
  "notes": "anything the orchestrator must know (behavior you could not verify, decisions that need the owner)"
}
```

Every work-order item must appear in `items` exactly once.

## 8. One concept, one name — use these

These are the names the default screens and the original migration map already use. Use them; do not coin alternatives. (Identifiers keep their internal names.)

| Concept | Say | Not |
|---|---|---|
| the product's top suggestion | highest-priority action · recommended action · next step (when it is the user's own planned step) | the one move, your move, next move (as a noun), the system's pick |
| why something is ordered first | "Ranked first because …" / "… · ranked by risk" / "in order of risk" — always with what is ordered and by what | unexplained "top", "#1", "clear first choice", "the ranking engine", "ranked object" |
| account score | account priority · priority score (say what feeds it: signals, their type, source and age) | heat, hot/warm/cold, hottest |
| time-limited account event | signal (explained on first use) | trigger used as jargon without the event named |
| navigation overlay | workspace map | the Ground |
| the left activity rail | recent activity | Live Edge, the wire |
| cross-area history of an account or deal | related activity | the thread, the whole thread |
| the sales process | sales process · pipeline · outreach · deal process (the one that is meant) | motion, whole motion |
| a product area | its name (Deal Workspace, Signal Console …), "page", "workspace", "the rest of the app" | room (as the app-as-a-place metaphor) |
| readiness states | Founder-dependent · Partially documented · Usable with founder support · Hire-ready · Hire-ready and repeatable | You are the system, Building, Inheritable…, verdict, the climb |
| the five readiness areas | targeting · outreach · discovery · open deals · pilot evidence (named, never "dimension", never "/20") | dimension, proof & memory |
| pilot artifact and outcome | the pilot · pilot plan · pilot results · pilot evidence · success criteria | proof, cast/forge a proof, PoC (as the product's name for it), ingot, mold, heat ledger, kill rule, readout |
| handoff output | sales handoff · handoff document | handoff kit, the kit |
| contract areas | workstream (Legal · Security · Finance · Business approval); customer request → your proposed position; current blocking issue; walk-away position; signature plan | front, face-off, your line, the run to signed |
| network help | introduction request · your contact · has influence with this account | relay, carries weight, in your corner, deploy |
| LinkedIn's role | supporting LinkedIn outreach | air cover |
| monitoring | saved monitoring rule · scheduled check · matches / detects | standing order, heartbeat, fires |
| analysis output | analysis · assessment · summary · observation (the one it is) | read (as a noun), what the system saw |
| incomplete input | name what is missing ("Use case not recorded") | thin, weak, still weak, compounding |
| undocumented process | "not yet documented for another seller" · "depends on the founder" | lives in your head |
| software behavior | reviews, detects, compares, ranks, records, displays, recommends | sees, notices, knows, thinks, wakes, hands you, catches |
| onboarding | workspace setup · setup data · enrichment complete | seed, seeding, wake-up, awake |
