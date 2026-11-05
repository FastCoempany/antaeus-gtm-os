# Language remediation — completion and certification

Date: 2026-11-05. Branch: `language-remediation-v1` (PR #324). Not merged, not deployed.
Scope directed by the owner: the default (v4) room screens, the demo books, the capability maps and the
Discovery content. The older fallback screens (`?ds=0`, `room_*_legacy`, `*_v4_off`) were left out of scope by owner
direction on 2026-11-04.

## 1. Saturation score (qualitative, recovered method — `14_RECOVERED_SATURATION_METHOD.md`)

The final regenerated rendered corpus (`artifacts/language-remediation/rendered-corpus.txt`, 21 rooms, 1,608 actions,
501 revealed states) was split by room into three slices of similar size. Each slice was scored on the nine dimensions
by an independent reviewer that had not written any of the copy. Each reviewer read 1,000–2,500 lines and cited
examples for every score. Slice scores were combined weighted by slice size.

| Dimension | Baseline | Target | Discovery | Group 2 | Group 3 | **Final** | Met |
|---|---:|---:|---:|---:|---:|---:|:--:|
| Semantic compression | 9.4 | ≤2.5 | 2.3 | 2.0 | 1.8 | **2.04** | yes |
| Private / branded ontology | 9.9 | ≤1.5 | 1.3 | 1.3 | 1.2 | **1.27** | yes |
| Metaphorical abstraction | 9.8 | ≤2.0 | 2.2 | 1.2 | 1.1 | **1.53** | yes |
| Declarative certainty | 9.3 | ≤3.0 | 1.4 | 1.7 | 1.8 | **1.62** | yes |
| Aphoristic cadence | 9.2 | ≤1.5 | 1.6 | 1.4 | 1.0 | **1.34** | yes |
| High-context dependence | 9.4 | ≤2.0 | 2.2 | 2.1 | 1.9 | **2.07** | **no (0.07 over)** |
| Paratactic compression | 9.1 | ≤2.0 | 1.8 | 2.0 | 1.8 | **1.86** | yes |
| Personification | 9.3 | ≤1.5 | 1.2 | 0.8 | 0.8 | **0.94** | yes |
| Elliptical syntax | 8.7 | ≤2.5 | 2.3 | 2.0 | 2.0 | **2.11** | yes |
| **Total (sum/9×10)** | **93** | **≤20, prefer 15–20** | 18 | 16 | 15 | **16** | **yes** |

Group 2 = Cold Call, Signal Console, Getting to Signed, Territory, LinkedIn, Prospecting Desk, Founding GTM, Quota
Workback, Readiness, Outdoors Events, capability maps. Group 3 = Deal Workspace, Briefing, Call in a Favor, Future
Autopsy, Dashboard, Outbound, Settings, Pilot Desk, ICP Studio, Welcome, navigation.

Groups 2 and 3 were re-scored after the judgment restorations (section 3). The Discovery slice was scored once; its
later changes were limited to jump-label wording. The re-score brief told reviewers that conditional sales advice
("deals like this often stall — do X now") is the intended voice and is not declarative certainty, as the rubric
already says.

**What keeps high-context dependence above target:**
- Numbers that disagree between rooms. LinkedIn shows an account at priority 93 while the Dashboard shows 62.
  Founding GTM shows 7 of 7 sections ready while the Dashboard shows 0 of 7.
- Short labels with no scale, such as "qualification score 42".

These are data-consistency issues more than wording, and are listed in section 6 for follow-up.

Representative remaining issues are in the reviewers' residual lists, worst first. They include:
- Discovery segment headers such as "§9 · NEXT-STEP LOCK · LEAVE WITH A REAL REVIEW."
- Status rows joined with dots.
- A few demo signal lines with editorial cadence ("screening volume IS the product").

The most material residuals were fixed after scoring: the Founding GTM win-rate bug, the Briefing feedback labels,
and the Getting to Signed status words. The score reflects the corpus before those fixes.

## 2. Gates and tests (local and CI)

| Check | Result |
|---|---|
| Typecheck (app + worker) | pass |
| Edge-function typecheck (Deno) | pass (CI) |
| Unit and component tests | 3,784 / 3,784 pass |
| End-to-end (Playwright, force-legacy build) | 284 pass, 1 skipped |
| Copy tool tests | pass |
| Walkthrough coverage validation | 21 rooms, 1,608 actions, 501 states, no runtime errors or failed controls |
| Tier-1 language gate (`copy:audit`) | pass, 0 failures |
| GitHub CI on the PR head | see the PR checks; the head before the final commits was fully green |

The local walkthrough builder failed once because the Briefing weather widget depends on a live weather service that
is unreliable in this container. A rerun passed. CI regenerates the walkthrough in its own job.

## 3. Semantic-damage audit

An independent audit compared about 360 changed user-facing strings, old against new, across 15 areas.

| Verdict | Count |
|---|---:|
| Preserved | ~225 |
| Improved (fixed a claim the code didn't support) | ~57 |
| Damaged | ~77 |

**Where the damage was.** The pass's "don't claim causation" rule had been applied so broadly that real judgment was
removed along with the overclaims:
- Future Autopsy read as a missing-fields checklist.
- Getting to Signed lost its negotiation trades.
- Founding GTM's prescriptions became hypotheses.
- Pilot Desk lost its champion and multi-threading guidance.
- The Dashboard lost its urgency lines.

**Restored in this pass (commits `8f3caa5`, `344ea53`, `c046d11`, `df40e4c`):**
- Future Autopsy pairs each recorded condition with the pattern it often leads to and what to do now, plus a
  conditional risk-window headline. The "conditions are not proof of cause" calibration stays, stated once.
- Getting to Signed's pushback replies offer concrete trades again, phrased as options to confirm with your team.
  The app still never asserts the seller's own certifications or reference counts.
- Pilot Desk's champion kit purpose, the multi-threading push and the participant selection rule are back.
- Founding GTM's prescriptions are back, with one caveat per section.
- The Dashboard's specific next actions and urgency lines are back.
- Cold Call's permission-first opener is back.
- The onboarding doorway frames the setup work as worth doing again, without statistics.
- Quota's false claim, "within 10% of benchmark", now states what the check actually tests: no assumption is more
  than 10% above benchmark.

**Left unchanged as owner-approved evolution:**
- The Briefing hedging and uncertainty gates. The audit flagged these as reversing the voice doctrine.
- The readiness level names, which come from the original manifest.
- The LinkedIn cue and recommendation changes.

These are flagged for the owner in section 6.

## 4. Manifest reconciliation

`17_SEMANTIC_RECONCILIATION.md`: of the 551 records left STILL MISSING, the final count is 81 implemented, 442
implemented differently but acceptably, 28 no longer applicable, and 0 still missing. The earlier STILL MISSING
status came from a literal-string check, not from missing work.

## 5. Defects fixed in this pass

- **Onboarding:**
  - Research placeholders were stored as real signals.
  - The landing step named a "closest to slipping" account with no deal data behind it.
  - Evidence notes named inputs the steps don't collect.
  - Failed account research had no retry.
- **Future Autopsy:** record age was labeled as buyer activity, and each risk sentence printed twice.
- **ICP Studio:** a fixed "top-20" claim, and a worked-account counter used as if it were a target.
- **Briefing:**
  - Past events showed as upcoming.
  - Internal build-stage, cron and Supabase text reached the screen.
  - Raw alert-type codes were shown.
- **Outdoors Events:** a paused run looked like success, and raw database errors were shown.
- **Dashboard:** "risk score 100/99", "weakest dimension" wording, and the explanation sentence's grammar.
- **LinkedIn:** renamed steps broke the history in both demo books.
- **Founding GTM:**
  - Raw segment keys, deal ids and loss codes reached the screen.
  - Win rate was read as a fraction, which showed 2200% and miscounted opportunities.
- **Call in a Favor:** raw request codes in the log, and an email line that read wrong.
- **Getting to Signed:** a bare "subs" chip and unexplained status words.
- **Stale tests:** four assertions updated to the current copy.
- **Capability maps:** corrected to match the shipped rooms. The Prospecting Desk map no longer claims a web search.
- **Discovery:** content made consistent across all ten frameworks, jump labels describe where they lead, and tags no
  longer say PROOF or PRESSURE.
- **Demo books:** both rewritten in plain language.

## 6. Open items for the owner

1. **Briefing voice — decided 2026-11-05.** The owner confirmed keeping the completion pass's Briefing changes: the hedge-word limit is a review flag, not a hard reject; calibrated uncertainty words are allowed; the "assert when multi-source" and "you, never we" prompt rules stay removed.
2. **Prospecting Desk canon.** `CLAUDE.md` §4.6 says the room runs its own cited web search; the shipped room does
   not. The map now matches the room. The canon needs your decision.
3. **Call Planner.** About 70 Discovery jump labels still read "Open Call Planner" or "Carry into Call Planner". The
   canon retired that room, but its route still works.
4. **Cross-room numbers.** Priority scores and handoff section counts disagree between rooms (LinkedIn against the
   Dashboard, Founding GTM against the Dashboard). This is a data-consistency issue found during scoring.
5. **Discovery segment headers.** The fixed segment names, such as "Next-step lock", are canon names. Renaming them is a
   mind change.
