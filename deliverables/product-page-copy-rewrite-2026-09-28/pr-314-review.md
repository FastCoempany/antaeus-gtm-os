# Review of PR #314, "antaeus app copy editor"

**PR:** [FastCoempany/antaeus-gtm-os#314](https://github.com/FastCoempany/antaeus-gtm-os/pull/314), merged 2026-09-28 as `3fb1ed7`. It added `COPY_STANDARD.md`, `COPY_AUDIT_AND_REWRITE.md`, `COPY_INVENTORY_AND_REWRITE_MAP.json` and `CODEX_HANDOFF.md` at the repo root.
**Reviewed:** 2026-09-28.
**How:** four reviewers each took one angle:
- canon conflicts,
- whether the map follows its own standard,
- whether the product code backs up the claims,
- data integrity and coverage.

A skeptic then tried to disprove each finding against the actual files. **73 findings, 68 confirmed, 5 refuted.** Findings that overlap between reviewers are merged below. The full list with file and line evidence is in [`pr-314-review-findings.json`](pr-314-review-findings.json).
**Applied result:** [`README.md`](README.md). **Fix status:** see the next section.

---

## The short version

The map is accurate and easy to implement. All 333 entries match their source line and text exactly, and I applied the whole map to the page (see the README). Most rewrites really are clearer.

It is **not ready to ship as written**, for three reasons:

1. **It renames things the app shows on screen**, on a page whose footer says the screens are the real product. The worst case is the five readiness states.
2. **Several of the new, more precise sentences claim things the code doesn't do.** Examples: "no buyer activity", what delete removes, a new hire's access to the workspace, and how outreach is gated.
3. **It misses about an eighth of the page's visible copy.** That copy is rendered by JavaScript, and some of it switches the old wording back on as soon as a visitor clicks something.

`COPY_STANDARD.md` also disagrees with canon (`CLAUDE.md`) in several places, and canon lists neither file as an authority. Several of the items below change what a room is or what the product says it does, so under canon Part IV §4 they are your call.

---

## Status after the 2026-10-02 fix pass

The founder approved the addendum and asked for these findings to be fixed in the map. Of the 68 confirmed findings, 56 are fixed in the map, 8 are fixed in the map but still need a decision or a product change outside it, and 4 are not map changes. The corrected map is `COPY_INVENTORY_AND_REWRITE_MAP.json` at the repo root; the build and what changed are in the [README](README.md). The sections below this one are the original review, unchanged.

| Finding | Status | What changed |
|---|---|---|
| The PR renames all five readiness states, which is a room-mind change canon never approved | fixed in the map | Mocks and the FAQ use the live state names again (You are the system, Building, Inheritable with guardrails, Hire-ready, Hire-ready, repeatable); the readiness leaves are gone. The FAQ glosses "inheritable with guardrails" in plain words. |
| Future Autopsy (a protected room) is rewritten as 'Deal risk analysis', the exact softening canon forbids | fixed in the map | "Future Autopsy" and "dies in 20 days" are back (#166, #167, #197, #200, JS scene). COPY_STANDARD still lists "autopsy"/"dies" as banned; that file is not edited. |
| The locked Signal Console attention bands and the heat concept are replaced with generic priority labels | fixed in the map | Band names and "heat" are back (#30, #31, #36, #73, #83). |
| The page still says its screens are real, but the PR relabels those screens so they no longer match the shipped app | fixed in the map; needs a decision outside it | Mocks match the app again, except the Dashboard "move" kickers (#19, #71), which keep the page wording because canon sides with the page there. Fix: drop "move" from the live Dashboard kicker. |
| COPY_STANDARD treats 'slip' as a metaphor, but canon §13 uses '3 deals will slip this week' as its example of a plain sentence | fixed in the map | "The deals that will slip this week" and "3 deals will slip." (#39, #42, leaf). |
| Setup copy turns the operator's judgment work into 'entering information', the data-entry framing §12 forbids | fixed in the map | Setup copy asks for "the judgment only you have" (#25, #232, #286, #289, #304); #273 keeps "An afternoon of real thinking". |
| COPY_STANDARD bans the words canon uses for its settled voice and pushes demo copy into the machine narration canon forbids | fixed in the map; needs a decision outside it | Mock copy states facts instead of "Antaeus ranks X because" (#21, #36, #73). COPY_STANDARD §9 is not edited. |
| The Briefing is redefined as workspace-only 'activity monitoring', dropping the World stream that the page's own demo shows | fixed in the map | Nav/footer say "Morning briefing"; #203 names both halves (your deals and accounts, and your market). |
| The 'line' rule overrides canon's own plain wording ('their ask → your line', 'the one thing blocking') and mislabels the Outbound ask | fixed in the map | "Your line", "The one thing blocking" and "tap what you heard to get your next line" are back; "The ask" leaf removed. |
| Call in a Favor is rewritten as 'Warm introduction' and 'Referral path', narrowing a ten-situation room to one situation | fixed in the map | "Calling in a favor" and "The relay" are back; #164 covers any stuck deal and both notes. |
| 'Active pilot participants' mixes up the circle (who's hands-on) with the adoption meter canon keeps separate, and turns the pilot into 'pilot planning' | fixed in the map | "Who's hands-on" (live label); #50 and #158 restored. |
| The handoff kit's settled 'One thing to notice' label becomes 'Pattern:', and its seven parts are mislabeled as 'readiness areas' | fixed in the map | "One thing to notice" and "5 of 7 parts ready" restored; #56 keeps the written-for-the-replacement idea. |
| The Live Edge is defined as a 'collapsible activity panel', the opposite of the locked rule that switching it off must read as off | fixed in the map | #220 says off leaves a thin line you can click and counting continues; tags match the shipped ones. |
| The Ground is described as a map of 22 'product areas', and the myth is mentioned without being explained | fixed in the map | #208/#212 lay the map out in the order of your sales process and explain the myth in one line. |
| Discovery Studio copy reintroduces 'notes afterward' and a 'call flow', both against the §4.12 mind | fixed in the map | "Not notes you write afterwards"; "offers a jump to where the conversation went". |
| Prospecting's confirm step (three plain questions the operator answers) becomes something Antaeus records | fixed in the map | #148 keeps the three questions the operator answers. |
| COPY_STANDARD lists 'evidence' as a preferred noun; §13 says it must never appear bare, and the PR adds seven bare uses | fixed in the map; needs a decision outside it | All seven bare uses are gone. COPY_STANDARD §2 still lists "evidence" as preferred. |
| The approved copy introduces a bare 'gap' and 'rep', and keeps 'capture' and the idiom 'recruiting bench' | fixed in the map | No bare "gap", "rep" or "recruiting bench"; capture appears only as the feature name "capture address". |
| The Pace rewrites bring back the funnel jargon §4.18 removed, and settle a room name canon left open | fixed in the map; needs a decision outside it | Pace text is plain again ("1 in 5 deals won", "your target in open deals"); one name, "Pace", in nav, kicker, footer and #171. Whether the room is called Pace or Quota Workback is still the founder's call (canon §4.18). |
| The 'room' and 'motion' rules diverge from shipped vocabulary; canon needs to settle these words | not a map change | Needs a canon decision on "room" and "motion" as user-facing words. The map keeps "product area" for now. |
| About 80 JS-rendered strings (product-viewer MOMENTS + Pace BENCH) are outside the map and restore the old wording on interaction | fixed in the map | The addendum is approved and folded into the map as js_and_attribute_units (50 changes, 42 recorded keeps). |
| Leaf 'The ask' → 'Buyer request' names the wrong person, and the kept 'Their ask' now clashes with 'Your position' | fixed in the map | Leaf removed; "Their ask" / "Your line" stay a pair. |
| #36 and #73 keep the §6 'Reject' example and the 'recruiting bench' idiom, contradicting #21 and the craft leaf | fixed in the map | One hedge everywhere ("appears to have limited recruiting capacity" / "small recruiting team" in the one-line mock). |
| Liquid Death is 'no champion activity' in one place and 'no buyer activity' in another, and it is labeled 'highest-risk' against the page's own ranking | fixed in the map | One fact everywhere: no champion update for 14 days; no superlative. |
| Approved replacements claim more than the page supports, or contradict nearby copy (§21) | fixed in the map | #17, #104, #109, #177, #244, #299 rewritten as recommended. |
| #70 includes the mandated fix, but it adds claims the source never made and blurs a specific fact | fixed in the map | #70 rewritten; the hire gets the handoff kit you share. |
| Grammar errors and ungrammatical constructions in approved replacements | fixed in the map | All listed units rewritten. |
| #90 turns 'Pick up a call' (make a call) into 'Review a call', which makes no sense when no calls are logged | fixed in the map | #90: "No discovery calls logged in the last 7 days. Plan a call →". |
| Nav labels point to the wrong destinations, and the same features carry 2-4 different names | fixed in the map | "Product tour" for #rooms, "Every product area" for #all-rooms, "Morning briefing", one Pace name, "Future Autopsy", "Running a pilot". |
| Kept demo labels still use metaphor, vague pronouns, or colliding terms (§13, §14) | fixed in the map; needs a decision outside it | "247 of 300 account slots used", "Likely cause · pushed too early", TOC item "What the first week looks like" (live title). "Compose it →" and the other TOC items stay as the mocks show them. |
| Kept LinkedIn rungs contradict the approved tabcap sequence and the 'Poppy accepted last week' note | fixed in the map | Rungs reordered to canon (watch → comment → connect → give → ask); Connect is done and Give is current, matching "Poppy accepted last week". |
| Approved replacements bring back §3 scrutiny terms | fixed in the map | #184, #164, #191, #279 rewritten. |
| Several rewrites flatten into empty SaaS prose or mechanical §3 substitutions (§23) | fixed in the map | #77, #106, #107, #113, #177, #299 and others rewritten in plain words. |
| Some replacements drop facts the original carried | fixed in the map | #30, #39, #95, #129, #130, #148, #158, #208, #224 restore the dropped facts. |
| Personification and a confusing 'flag/flag' sentence survive in the Briefing proposal and the hero (§9) | fixed in the map | The Briefing suggestion is a real proposal ("You opened Deal Workspace six times this week…"), labeled "Suggestion". |
| 'fourteen-item task list' (#33) conflicts with the '#1 of 12' ranking shown three times | fixed in the map | #33 drops "fourteen"; #19 says "#1 of 12 ranked actions". |
| Readiness 'areas' vs 'states', and three verbs for tracking accounts | fixed in the map | "handoff parts", "parts ready", and "track" for accounts everywhere except the live "Watching" mock label. |
| Prose fragments, pronouns without antecedents, and near-duplicate headlines | fixed in the map | #163, #231, #304 and others rewritten. |
| Comparison rows break voice and parallelism, the 'Beta limitations' label mislabels its section, and 'rep' is introduced | fixed in the map | #249, #258, #259, #266, #277, #323, #284, #226, #228 rewritten. |
| Renamed readiness states don't exist in the app, and "Partially documented" describes the wrong condition | fixed in the map | Same fix. "Partially documented" is gone everywhere. |
| "Quiet" was rewritten as "no buyer activity", but nothing in the product measures buyer activity | fixed in the map | "No buyer activity" is gone; copy says no logged update, no recorded progress, or no new company news. |
| The delete claim (#226, #301) promises more than delete does: share links, observations, and meetings survive | fixed in the map; needs a decision outside it | #226/#301 name only what delete removes. Product gap still open: share links, observations, captured meetings and profile rows survive a delete. |
| The page promises the hire a seat in the workspace; the only hire-facing feature is a read-only link to a snapshot of the handoff kit | fixed in the map | #70, #114, #227 promise the read-only handoff-kit link, not a workspace seat. |
| Briefing and hero copy describe a morning review job and pilot-adoption checks that don't exist | fixed in the map | #95 lists the four real 30-minute checks; #17 and #90 no longer describe a morning job or "Review a call". |
| The reasons given for ranking Chomps first aren't what the ranking engine uses | fixed in the map | Chomps copy states the news, high heat and that outreach is furthest behind; #23 keeps "stable lead". |
| Outbound doesn't require a recent trigger and doesn't block generic messages | fixed in the map | #117/#125: the draft needs an account and a named contact; no claim of blocking generic messages. |
| Pace: the benchmark numbers are right, but how the plan check works is misdescribed | fixed in the map | #170, #177, #186, #265 describe the most-optimistic-assumption check. |
| Future Autopsy: "recurring risk pattern" isn't computed, and "45 days early" is out of date | fixed in the map | "Recurring risk pattern" became "the most likely cause of loss"; "seen 4×" and "Written 45 days early" are gone ("Projected from today's deal data"). |
| Several label rewrites change what the on-screen element actually is | fixed in the map | #51, #52, #75, #148, #156 and the Cold Call steps (live names) fixed. |
| The two-up caption says a hire can run the process, but the ladder above it shows the "with you there" state | fixed in the map | #104: "A new hire could run it with you there to answer questions". |
| #109 promises the full picture in any product area; only the Dashboard shows it | fixed in the map | #109 points to the Dashboard. |
| Renamed mock labels no longer match what the app shows, even though the footer says the screens are real | fixed in the map; needs a decision outside it | Same as above. |
| Setup enrichment and auto-capture copy is slightly more precise than the code supports | fixed in the map | #286, #287, #295 match what the code does. |
| "Exports the entire workspace" leaves out signal history and system-written data | fixed in the map; needs a decision outside it | #225/#240/#301 name what the export contains. Product gap still open: the export leaves out signals, observations and captured meetings. |
| Kept or unmapped copy still claims features that don't exist (not changed by the map) | fixed in the map | "247 added", "replied 2h ago" removed, "seen 4×" removed, the Noticed line replaced, the Notion pilot line now describes a real check. |
| Claims checked against the code and found accurate (no change needed) | fixed in the map | No change needed; the #144 "offers a jump" precision note is applied. |
| About 11% of the page's visible copy is rendered by JavaScript and the map never saw it, so 10 rewritten passages will still show their old wording in the product viewer | fixed in the map | Same fix. |
| The Pace rewrite is undone the first time a reader uses the deal-size picker, and a literal apply would disable the picker entirely | fixed in the map | Units 183-185 carry replacement_parts per id, and all 24 BENCH strings are map entries that match them. |
| The standalone rule 'The ask' → 'Buyer request' turns the seller's ask into something the buyer supposedly requested | fixed in the map | Same fix. |
| The map renames labels that canon locks and the live app shows, so the page's 'real product' screens no longer match the product | fixed in the map | Every relabeled live label is restored on the mocks; the footnote now says the screens are "based on real product areas". |
| 36 raw nodes are marked as uncovered even though a logical unit contains them, 15 of them inside units being rewritten | fixed in the map | Raw-node coverage recomputed by source span; every raw node now carries an explicit decision. |
| Nearly half of the rewrites are plain text for units that contain markup, so link, <br> and span boundaries are left to guesswork | fixed in the map | Every markup unit that is rewritten now has replacement_html. |
| The standalone 'replace anywhere' rule leaves matching, casing and order undefined and contradicts the copy standard | fixed in the map | standalone_leaf_rules defines matching; whole-sentence changes moved to raw_edits. |
| The validation grep produces mostly noise, leaves out terms the map itself targets, and conflicts with the rule to preserve aria text | not a map change | The validation in this folder runs on extracted visible text, attributes and JS strings with whole-word matching; CODEX_HANDOFF.md itself is not edited. |
| The navigation rename gives two different destinations the same name, and gives one destination three names | fixed in the map | Same fix. |
| The 27/100 → 4/100 lint scores can only be rebuilt by reverse-engineering, and they cover only the logical units | not a map change | Lint scores are not recomputed; revised units say so in their revision record. |
| Smaller inventory problems: what counts as 'visible', section labels, and line numbers | fixed in the map | Units 304-307 and their raw nodes are labeled "closing". |
| The docs sit at repo root, cite a source file that is not in the repo, and claim authority that canon does not grant | not a map change | The source page is committed here; moving the root docs and their place in canon is a founder decision. |

---

## 1. Decisions only you can make

These are the places where the PR changes the mind of a room, or where following it means the page stops matching the shipped app.

**1.1 The readiness state names (high).**

- **What the PR does.** `COPY_STANDARD` §17 and the map rename the five states to Founder-dependent / Partially documented / Usable with founder support / Hire-ready / Hire-ready and repeatable. This happens in the hero ladder, the highlight card, the two-up figure and the FAQ: units 62, 64–67, 100 and 297, and the leaf keys at L592–596 and L1102–1106.
- **What the app shows.** The shipped app still renders the canon names:
  - `src/lib/readiness/types.ts:35-39` (the readiness labels),
  - `src/dashboard/v4/ClimbDrawer.tsx:22-47`,
  - `src/dashboard/v4/lib/cockpit.ts:22-28`. The hero ladder copies this one word for word.
- **Why it matters.** Canon §4.17 fixes these states. "Partially documented" also describes a different condition from "Building", which is gated on activity, not documentation.
- **Choose one:**
  - keep the app names on the mock screens and add a plain one-line explanation under each, or
  - approve a §4.17 change and rename the states in canon and the app together.

**1.2 Labels copied from the app were relabeled on "real" screens (medium).**

- **The contradiction.** The footer (unit 333) still says the screens are real product areas with sample data. But the map changes on-screen labels that exist word for word in shipped code:
  - Signal Console's four attention bands, "Act now / reach while warm / emerging / going cold" (`src/signal-console/v4/lib/attention.ts`): units 30, 31 and 83. Canon §4.7 is a protected room.
  - Discovery Studio's segment "Pain & consequence" (`DiscoveryStudioV4.tsx:81`): units 45 and 140.
  - Founding GTM's "One thing to notice" and "N of 7 parts ready" (`FoundingGtmV4.tsx:73, 150`): units 58, 78 and 75.
  - Getting to Signed's "Your line" (`GettingToSignedV4.tsx:236, 291`).
  - Cold Call's "Ask for the meeting".
  - Pilot Desk's circle, "who's hands-on": units 52 and 156.
  - The Dashboard's "Where your whole motion stands" and "The most valuable move on your board": units 18, 19 and 71.
- **Choose one per label:**
  - put the app's label back on the mock screen and keep the plain wording in the prose around it,
  - rename it in the app too, or
  - soften the footer to "based on real product areas".

**1.3 Future Autopsy is softened into "risk analysis" (high).**

- **The rewrites.** Unit 167 now opens "Deal risk analysis." Unit 197 becomes "Projects deal-loss risk before the deal is lost." That drops the written story of how the deal dies before it does.
- **Why it matters.** Future Autopsy is a protected room. Canon §4.14 says: "Never soften into 'risk review'."
- **What causes it.** `COPY_STANDARD` §4 only lets the name survive if the text around it says it "projects deal-loss risk", and the handoff's validation list treats "autopsy" and "dies" as terms to remove.
- **Separate claim problems.** "Recurring risk pattern" (167, 198) is not computed: the app shows the top cause for that one deal (`src/future-autopsy/lib/causes.ts`), and nothing counts it across deals. So "seen 4×" (kept, L1281 and L1419) is unsupported. "Written 45 days early" (kept, units 165 and 199) reflects the retired flat 45-day horizon.

**1.4 Which document wins (medium).**

`CODEX_HANDOFF.md` calls `COPY_STANDARD.md` the "authoritative writing rules", but canon's authority order doesn't list it, and the two disagree:

- **"evidence".** The standard lists it as a preferred noun; canon §13 says it must never appear bare. The map adds it bare 7 times: units 33, 97, 144, 257, 261, 284 and 293.
- **Personification.** The standard's ban on "sees / notices / awake / in your head" contradicts canon's settled voice. §1 "this system sees what is actually happening", and §4.1 Welcome ships "the workspace is awake" (`WelcomeV4.tsx:25`). The standard's preferred verbs also push the mock screens toward "Antaeus ranks X because …", which is the "narrating the machine" style canon §13 bans.
- **"slip".** The standard treats "slip" as a metaphor, but canon §13 uses "3 deals will slip this week" as its example of a plain sentence (units 39 and 42).
- **"line".** The standard's rule against "line" overrides canon §4.16b's own plain wording, "their ask → your line".
- **"room".** The standard maps "room" to "product area / module / workflow", while the shipped app says "room" to users (the Ground, `GroundLine.tsx:209`).

Decide whether `COPY_STANDARD` governs only the marketing page or the product as well. Then either update canon, or scope the standard below it.

**1.5 Smaller mind-level changes (medium).** Each of these narrows a room's canon definition:

- **Setup is recast as data entry.** "Entering the sales knowledge", "founder input" and "enter context" (units 25, 232, 273, 289, 304) replace canon §12's framing that setup is authorship and judgment, and that the work is worth it.
- **Call in a Favor becomes "Warm introduction" and "Referral path"** (units 164 and 162). The room's name is dropped, and a room with ten kinds of ask is reduced to introductions.
- **The Briefing is renamed "Activity monitoring"** (units 10 and 312), and its description is limited to workspace changes. Canon §4.21 gives it two streams, workspace and world, and the page's own ticker shows world items.
- **The Prospecting Desk confirm step becomes "Antaeus records…"** (unit 148). In the app they are three questions the operator answers (`ProspectingDeskV4.tsx:306-338`).
- **The Live Edge is defined as a "collapsible activity panel"** (unit 220). The locked design says turning it off must read as off, not hidden.
- **The Ground loses its one-line myth explanation** (unit 208), and the map is described as a flat list of 22 areas rather than laid out in the order of the sales process.
- **Discovery Studio gains "not only for notes afterward" and "call flow"** (units 192 and 144). Canon §4.12 says it is not a notepad and has no preset flow.

---

## 2. Claims the product does not back up (fix before shipping)

The map's rewrites are more specific than the old copy, and in these places more specific than the code supports. `COPY_STANDARD` §21 forbids that.

**2.1 "Quiet" became "no buyer activity" (high).**

- **Where.** The leaf strings and units 29, 30, 40, 83, 88 and 111.
- **What the product measures.**
  - For deals, days since the deal record was last updated (`src/deal-workspace/lib/recovery.ts`, `src/future-autopsy/lib/vitals.ts:234`). That is the seller's data entry, not buyer behavior.
  - For watched accounts, days with no new public signal (heartbeat `signal_decay`).
- **The fix.** Say what is logged: "no recorded progress in 14 days" or "no new company news in 14 days". This is the exact example §21 warns against.

**2.2 Delete removes less than the copy says (high).**

- **Where.** Units 226 and 301.
- **What delete actually does.** It clears 12 tables (`src/settings/lib/cloud-sync.ts`).
- **What it leaves in place:**
  - the observations ledger, which is never hard-deleted,
  - the handoff kit share snapshots, whose link keeps working,
  - captured meetings,
  - the workspace profile,
  - the Briefing, scheduling and proposal rows.
- **Before shipping,** either extend delete or change the wording.

**2.3 A new hire's access (medium).**

- **Where.** Units 227 ("give a new hire read-only access… view the workspace"), 70 and 114.
- **What exists.** There is no invite or member flow. The only thing a hire can receive is an anonymous read-only link to a snapshot of the handoff kit (`src/founding-gtm/lib/share.ts`).
- **Say that.**

**2.4 Briefing cadence (medium).**

- **Where.** Units 17 and 95: "Each morning, Antaeus reviews your accounts, deals, calls, and sales activity".
- **What runs.** A 30-minute heartbeat with four SQL checks (deal stuck in stage, account with no new signal, pilot past its readout date, fewer than one call a week). There is no morning job. The world briefing runs weekly, and the Dashboard ranks when you open it.

**2.5 Outbound gate (medium).**

- **Where.** Units 117 and 125: "requires every outreach draft to reference … a recent trigger" and "blocks generic messages".
- **What the gate checks.** Only that an account and a contact are named (`src/outbound-studio/state.ts:54-57`). The trigger defaults to "funding", and nothing detects generic messages.

**2.6 Pace mechanism (medium).**

- **Where.** Units 177, 186 and 265.
- **What's wrong.** The benchmark numbers are correct: all four deal sizes match `ACV_BENCHMARKS`. But sales-cycle length is not part of the daily-activity math (`src/quota-workback/lib/engine.ts:80-90`). The plan check flags the single most optimistic rate when it is more than 1.1× the benchmark, not "which assumption makes the plan unrealistic".

**2.7 Why Chomps ranks first (low).**

- **Where.** Units 21, 36 and 73.
- **What's wrong.** The engine ranks it on heat and recent signals, plus a boost when outreach is below target. It does not know "no outreach to Chomps", and it does not use trigger type.

**2.8 Smaller overclaims (low).**

- **Unit 104** says "A new hire can execute the process", but the same figure marks the "with you there" state as current.
- **Unit 109** says "Open any product area to see the current state…"; only the Dashboard shows that.
- **Unit 287** describes setup enrichment that returns more than it does.
- **Units 225 and 240** say export covers "everything", but it omits the `signals` table.
- **Kept copy the map never touched:**
  - "247 found" (there is no automated search),
  - "replied 2h ago" (Signal Console shows signal age),
  - "seen 4×",
  - the "Noticed" proposal, which is not one of the two kinds of proposal the product can make.

---

## 3. Errors inside the approved copy

**3.1 Leaf rewrites that change the meaning (medium).**

- **"The ask" → "Buyer request" (L1192) reverses who is asking.** It labels the seller's own request, "20 minutes next week".
- **"Your line" → "Your position"** now sits next to the untouched "Their ask".
- **"Show it is real" → "Confirm business impact"** doesn't match the app's step, "Show them it's worked before".

**3.2 "Review a call →" (unit 90, medium).** It appears on a card that says no calls were logged this week, so there is nothing to review. The original was "Pick up a call".

**3.3 Terms that collide (medium).**

- **"Pattern".** "Pattern:" (units 58 and 78) now labels both the handoff-kit callout and Future Autopsy's failure pattern.
- **"Readiness areas".** "5 of 7 readiness areas" (unit 75) mixes up the handoff kit's seven parts with Readiness, which has five.
- **The pilot circle.** "Active pilot participants" (units 52 and 156) labels a circle with empty slots, directly above the kept "5 of 7 using it".
- **The nav.** "Product areas" names two different sections: `#rooms` (units 3 and 9) and `#all-rooms` (unit 311).
- **Pace has four names:** Pace, Revenue plan, Revenue target plan, and Revenue plan and targets.

**3.4 The same fact told differently (low–medium).**

- **Chomps' recruiting capacity** is worded three ways: "appears to have limited recruiting capacity" (21), "no apparent recruiting bench" (36, 73) and "limited recruiting capacity" (the leaf).
- **Liquid Death** is "no champion activity" in one place and "no buyer activity" in another, and is called the "highest-risk open deal" although the page ranks Warby Parker first.

**3.5 Grammar and wording (low).**

- **Unit 176:** "Is your current pipeline and activity enough" (the compound subject needs "are").
- **Units 21 and 123:** plants "creating … hires".
- **Unit 171:** "benchmark assumptions".
- **Unit 114:** "answer exceptions".
- **Unit 111:** "activity has been stalled".
- **Unit 139:** "follow relevant posts".
- **Unit 215:** "replied after 12 days without a response" (who didn't respond?).
- **Unit 67:** "Changed from Founder-dependent" (changed to what?).
- **Unit 191:** "Run the discovery call from this workspace" (wrong referent).

**3.6 Filler and lost information (medium).**

- **Unit 107:** "The same tools and account context remain available in either case" says nothing, and it drops the real problem: you can't tell which deal to save first.
- **Unit 77:** pastes the §3 table verbatim ("relevant business metric").
- **Unit 30:** collapses four bands into three.
- **Unit 39:** drops "smallest".
- **Unit 95:** swaps the page's specifics for categories.
- **Unit 129:** drops why the question works.
- **Unit 70:** adds claims the source never made ("how you qualify opportunities", "the reasoning behind decisions").

**3.7 Words canon bans or restricts (low).** Unit 113 "activity gap" (bare "gap"). Unit 284 "multi-rep quotas" (canon retired "rep"). Units 112 and 216 "capture". Unit 184 "deal slippage".

**3.8 Pace jargon (medium).** The rewrites bring back funnel terms that canon §4.18 replaced with plain phrases:

- "pipeline coverage",
- "win-rate",
- "sales-cycle benchmark",
- "Ideal customer profile" (the original said "Who you sell to").

The Quota Workback / Pace naming is still an open decision in canon.

**3.9 Polish (low).**

- The LinkedIn step order contradicts both the tab caption and "Poppy accepted last week".
- The comparison rows mix grammatical forms and switch to "the user".
- "Beta limitations" labels a section that is half about AI use.
- "fourteen" sits next to "#1 of 12".
- There are fragments and loose pronouns in units 163, 231, 286 and 95.
- Units 231 and 304 share the same second sentence.

---

## 4. Defects in the PR's data and instructions

- **About 11–13% of visible copy was never audited (high).** The inventory read only static text nodes. It missed:
  - the product-viewer scenes, which the page's JavaScript writes into four empty containers,
  - the Pace picker's other three deal sizes,
  - 26 aria-labels, 6 alt texts, and the `<title>`.

  After the map is applied, clicking a viewer chip showed "Warby Parker dies in 20 days" again. Fixed in the proposed addendum.
- **The map would break the Pace picker if applied literally (medium).** Units 183–185 each give one flat string for a `<b id>` / `<span id>` pair that JS writes into. Putting the string in as one piece deletes the ids, and the picker silently stops working. Splitting it keeps the picker, but the JS table puts the old copy back the moment the reader changes deal size. The applied build splits the strings and updates the JS table.
- **No markup is given for 89 of the 193 rewrites (low).** Those units contain `<b>`, `<span>`, `<br>`, `<a>` or `<i>`, but the map has only a plain `replacement` string. The implementer has to guess where links, bold and line breaks go. Five of the 14 kept `<br>` breaks produced a lone word on a line or split "the Ground" (see the README).
- **Coverage flags are wrong (medium).** 36 raw text nodes are marked uncovered although they sit inside a logical unit, 15 of them inside units being rewritten. Another 119 nodes (about 1,670 characters) are outside every unit and have no keep-or-rewrite decision. Examples: "Noticed", "247 found", "pressure before clarity", and the handoff table of contents.
- **Standalone leaf rules are underspecified (low).** The handoff doesn't say whether a leaf match is exact or case-sensitive. Six of the keys also appear inside units, so the result depends on applying unit edits first.
- **The validation list doesn't work as a grep (low).** "line" hits `line-height`, "room" hits `#rooms`, "move" hits `btn--move`, and "hot" hits base64 image data. The list also omits terms the standard itself targets: quiet, run, carry, "owned the number", "had to go ask".
- **The lint score has no written formula (low).** The audit's "27/100 → 4/100" does reproduce: it is a text-length-weighted mean of the per-unit severity ÷ 4, giving 26.8 → 4.1. But neither the audit nor the standard states the formula. Severity is just the count of issue tags the audit assigned itself, and the score covers only the static units.
- **Labels and line numbers (low).** Units 304–307 are the closing call-to-action section, but they are labeled `nav`, which inflates the nav row. A couple of raw-node line numbers point one line early.
- **File placement (low).**
  - All four files landed at the repo root with no dates. Canon Part V §2 keeps audits under `deliverables/`, in dated files.
  - The page the map was written against wasn't in the repo; it is now at `antaeusproductpage-3.source.html`.
  - Canon also says not to leave contradictions standing (see §1.4).

## 5. Checked and dismissed

A skeptic refuted these, so they are not in the list above:

- **Warby Parker's day counts are consistent.** "20d" means time elapsed at proposal and "lost within 20 days" means time remaining; both can be true together.
- **"Standardize outreach" fits its section.** The section describes a standard process.
- **Sweetgreen as both an open deal and a referral source is not a contradiction.**
- **The "4/100" lint score is not fabricated.** It reproduces exactly; only the formula is undocumented.
- **"Antaeus uses language models to analyze workspace data…" (unit 299) is accurate enough.** The Briefing pipeline does exactly that.

## 6. What checked out

- **Alignment.** Every one of the 333 logical units matched its source line, tag, class and text exactly.
- **Counts.** 333 / 633 / 193 / 140 / 22, and every per-section figure in the audit, match the JSON.
- **The "how a deal gets to signed" fix** is present in unit 70.
- **Hard-banned words.** The approved copy has no proof, cast, earned, verdict, sanity-check, vitals or "dimension".
- **Code-backed facts that are correct:**
  - the Pace benchmark numbers,
  - the 30-minute heartbeat,
  - the 22 areas on the Ground,
  - the Live Edge count, tags and off switch,
  - Discovery Studio's 10 frameworks and 6 buyer lenses,
  - the cold-call "prepare before, log after" shape.

## 7. Suggested order of work

1. Settle §1: the state names, the on-screen labels, Future Autopsy, and which document wins. Record the answers in canon (Part IV §4).
2. Fix the §2 claims in the map. For delete and hire access, decide whether the product or the copy changes.
3. Correct the §3 errors in the map (`COPY_INVENTORY_AND_REWRITE_MAP.json`) and re-run the build. Each finding in `pr-314-review-findings.json` has a suggested replacement.
4. Approve or edit `proposed-addendum.json` so the JavaScript copy matches.
5. Decide on the readiness-label and demo-row truncation (README §3). Changing the wording or the design fixes it; shortening the approved copy isn't an option.
6. Move the four PR files under `deliverables/` with dates, and name `COPY_STANDARD`'s place in canon's authority order.
