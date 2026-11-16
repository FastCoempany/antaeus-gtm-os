# Rewrite Batch 01 — Shared Chrome + Core Semantic Surfaces

This batch fixes the highest-leverage language first: shared navigation/chrome plus Welcome, Dashboard, Readiness, ICP Studio, and Future Autopsy.

## Implementation principle

Do not treat each occurrence as an independent copy edit. If repeated text comes from a shared component, change the shared component once. If a sentence is generated dynamically, change the generator/template, not the sample output.

## Shared navigation

**Rename the Ground to `Workspace map` in all user-facing contexts.**

Use these room descriptions:
- **Welcome:** Today's recommended starting point
- **Dashboard:** Pipeline, account priorities, activity, and deal risk
- **Readiness Score:** Can another seller run the sales process?
- **ICP Studio:** Define the companies and buyers you sell to
- **Territory Architect:** Create and prioritize territory segments
- **Prospecting Desk:** Find accounts that match your ICP
- **Signal Console:** Monitor account signals and priority
- **Briefing:** Review changes in your accounts, deals, and market
- **Outdoors Events:** Find events where target buyers may be present
- **Outbound Studio:** Create and manage outbound messages
- **Cold Call Studio:** Prepare and run cold calls
- **LinkedIn Playbook:** Plan LinkedIn outreach
- **Discovery Studio:** Prepare and run discovery
- **Deal Workspace:** Review open deals, next steps, and risk
- **Pilot Desk:** Plan and evaluate pilots
- **Getting to Signed:** Manage legal, security, finance, and final approval
- **Call in a Favor:** Use your network to help move a deal
- **Future Autopsy:** Identify deals with high loss risk and why
- **Quota Workback:** Calculate activity and pipeline required to hit quota
- **Founding GTM:** Document the sales process for another seller
- **Settings:** Manage workspace data and account settings

## Exact approved replacements

| Current | Replacement |
|---|---|
| TOUCH THE GROUND · SEE THE WHOLE MOTION · G | OPEN WORKSPACE MAP · G |
| THE GROUND — YOUR WHOLE MOTION | WORKSPACE MAP |
| Where do you want to stand? | Where do you want to go? |
| THE LIVE EDGE | RECENT ACTIVITY |
| THE MACHINE | AUTOMATED UPDATES |
| THE BUYERS | BUYER ACTIVITY |
| STILL QUIET · DAYFORCE · 33D | DAYFORCE · NO RECORDED RESPONSE FOR 33 DAYS |
| SHIFT · 12 ON THE WIRE TODAY | TODAY · 12 MESSAGES & CALLS RECORDED |
| the workspace is awake | workspace setup complete |
| YOU DID THE HARD WORK — HERE'S THE FIRST MORNING IT PAYS BACK | SETUP COMPLETE |
| The workspace is awake. It already found the first move that needs you. | Antaeus analyzed the active deals and watched accounts in this workspace. |
| START HERE · THE SYSTEM'S PICK | HIGHEST-PRIORITY ACTION |
| At the top because heat 62 and fresh signals. | Ranked first because Boeing has a priority score of 62 and recent account signals. |
| WHAT THE SYSTEM SAW WHILE YOU WERE AWAY | CHANGES SINCE YOUR LAST VISIT |
| the workspace is running — this is just the morning door into it. | Your accounts, active deals, and pipeline are available on the Dashboard. |
| where your motion stands · all day | current sales status |
| WHERE YOUR WHOLE MOTION STANDS | CURRENT SALES STATUS |
| You are the system | Founder-dependent |
| Building | Partially documented |
| Inheritable | Runnable with founder support |
| Hire-ready | Runnable independently |
| Repeatable | Documented and repeatable |
| You're Building. | Your sales process is partially documented. |
| WHAT GETS YOU TO THE NEXT STAGE | WHAT WOULD IMPROVE READINESS |
| See the whole thing → | Review readiness → |
| The most valuable move on your board | Highest-priority recommended action |
| stable lead | priority remains stable |
| not now — show me the next | Show next recommendation |
| WHERE EACH PART STANDS RIGHT NOW | CURRENT STATUS BY AREA |
| HOTTEST Boeing · 62 no hot accounts yet Hottest ↗ | ACCOUNT PRIORITY Boeing · score 62 Account priority ↗ |
| DYING Nordstrom · 21d your worst open deal Dying ↗ | DEAL RISK Nordstrom · no recorded activity for 21 days Deal risk ↗ |
| HANDOFF 0 / 7 a hire could inherit Handoff ↗ | SALES HANDOFF 0 / 7 sections ready Sales handoff ↗ |
| READINESS · COULD A HIRE RUN THIS YET? | READINESS · COULD ANOTHER SELLER RUN THIS PROCESS? |
| THE CLIMB — WHERE THE WORKSPACE HAS BEEN, AND WHERE IT GOES NEXT | READINESS PROGRESSION |
| It all lived in your head — nothing to inherit. | The sales process was not yet documented for another seller. |
| LEFT BEHIND | PREVIOUS STATE |
| Real activity is on the board, but a hire would still be improvising the motion. | Sales activity is recorded, but another seller would still need to improvise parts of the process. |
| YOU ARE HERE | CURRENT STATE |
| Inheritable with guardrails | Runnable with founder support |
| A hire could run it with you there to answer questions. | Another seller could run the process with you available to answer questions. |
| NEXT | NEXT STATE |
| The motion survives you taking two weeks off. | Another seller can run the documented process for two weeks without routine help from you. |
| LATER | LATER STATE |
| Hire-ready, repeatable | Documented and repeatable |
| Wins and losses both feed the machine; the handoff kit is written. | Win and loss patterns are documented, and the sales handoff documentation is complete. |
| THE SUMMIT | HIGHEST READINESS STATE |
| To reach Inheritable with guardrails | To become runnable with founder support |
| WHAT'S CARRYING THIS RIGHT NOW | CURRENT READINESS BY AREA |
| Deal motion | Deal management |
| Sharp enough to run. | ICP quality: highly specific |
| WHO YOU SELL TO — THE ONE DEFINITION EVERY ROOM FILTERS AGAINST | WHO YOU SELL TO · USED ACROSS THE WORKSPACE |
| TOO BROAD | TOO BROAD |
| FORMING | PARTIALLY DEFINED |
| WORKABLE | WELL DEFINED |
| SHARP | HIGHLY SPECIFIC |
| WHAT MAKES IT SHARP — 6 OF 8 | WHY THIS ICP IS SPECIFIC · 6 OF 8 CRITERIA |
| ITS BITE — HOW YOUR 29 WATCHED ACCOUNTS FIT | HOW YOUR 29 WATCHED ACCOUNTS MATCH |
| 0 sharp — act here now | 0 strong matches · review the ICP or add accounts |
| 11 loose — watch | 11 partial matches · monitor |
| 18 not your buyer | 18 do not match the ICP |
| SHARP MATCHES — WHERE IT BITES | STRONG ICP MATCHES |
| KEPT OUT — AND WHY (GOOD) | ACCOUNTS THAT DO NOT MATCH · AND WHY |
| SHARPEN THE PIECES | REFINE THE ICP |
| WHO'S RUNNING THE MOTION? | WHO IS RUNNING THE SALES PROCESS? |
| FOCUS RECOMMENDATION | RECOMMENDED FOCUS |
| PRE-MORTEM · WORST FIRST | DEAL RISK · HIGHEST RISK FIRST |
| 6 deals on the table · worst first | 6 deals reviewed · highest risk first |
| Nordstrom is headed to close-lost — inside the next 7 days if nothing changes. | Nordstrom has a high risk of being lost if buyer engagement does not improve. |
| now · quiet 21d | current · no recorded buyer activity for 21 days |
| inside 7d · close-lost | near-term risk · high |
| WHAT KILLS IT — THE EVIDENCE | WHY RISK IS HIGH · EVIDENCE |
| There was never a dated next step, so momentum decayed. | No dated next step is recorded. |
| Calendar ambiguity turned every follow-up into a maybe. | Follow-up timing is not tied to a confirmed buyer commitment. |
| The thread went stale and urgency died. | No recent buyer activity indicates that urgency may have declined. |
| Silence signaled low priority internally. | Twenty-one days without recorded buyer activity increases the risk that the opportunity is no longer a priority. |
| No real champion carried this inside. | No confirmed champion is recorded. |
| Without a champion, you got parked in committee. | Without a confirmed champion, there is no identified internal owner driving the purchase. |
| Economic buyer never entered the thread. | No economic buyer is recorded. |
| Budget authority stayed invisible until it was too late. | Budget authority has not been identified. |
| THE CUTS | RECOMMENDED CORRECTIVE ACTIONS |
| Check them off as you make them. Each carries the line to send. | Complete these actions as they happen. Open an action to view the suggested message. |
| No calendar anchor means no deal. | A dated next step gives both sides a concrete commitment. |
| Single-threaded deals die when your one contact gets busy. | A deal that depends on one contact is more vulnerable if that contact disengages. |
| No internal driver, no motion. | A confirmed champion gives the deal an internal owner. |
| Shared plan reduces ambiguity. | A mutual action plan gives the buyer and seller shared dates, owners, and next steps. |
| Unknown process causes slippage. | An undefined decision process makes timing and ownership harder to manage. |
| THE PATTERN | RISK SUMMARY |
| WHEN TO WALK AWAY | WHEN TO CONSIDER CLOSING THE DEAL |
| Not there yet - keep working it, and walk away only if the cuts above go nowhere. | Keep working the deal for now. Consider closing it only if the corrective actions do not produce buyer engagement. |
| Copy the brief | Copy risk summary |

## Structural rules that cannot be expressed as literal replacement

### Welcome

Use this information order:

1. `Workspace ready` or equivalent factual setup state.
2. Number of active deals and watched accounts analyzed.
3. `Highest-priority action`.
4. The action itself.
5. `Why this is ranked first` with factual inputs.
6. `Changes since your last visit`.
7. Workspace totals.
8. `Open workspace map`.
9. `Recent activity`.

Do not use `awake`, `first morning`, `dividend`, `system's pick`, `morning door`, or `what the system saw`.

### Dashboard

Use:

1. `Current sales status`.
2. Readiness state in plain operating language.
3. `Highest-priority recommended action`.
4. Evidence supporting the ranking.
5. `Current status by area`:
   - Open deal risk
   - Account priority
   - Quota pace
   - Sales handoff readiness

Do not use `whole motion`, `most valuable move`, `hottest`, `dying`, `handoff` without an explicit noun, or readiness metaphors.

### Readiness

The dominant question is:

> Could another seller run this sales process?

Use these states:
- Founder-dependent
- Partially documented
- Runnable with founder support
- Runnable independently
- Documented and repeatable

For each state show:
- what another seller could do today;
- what still depends on the founder;
- what evidence is missing;
- what specific action moves readiness forward.

Do not use `climb`, `summit`, `survives you`, `inheritable`, or `machine`.

### ICP Studio

Keep the existing standard sales concepts and detailed ICP inputs.

Translate the quality system:
- Too broad
- Partially defined
- Well defined
- Highly specific

Replace `sharp`, `bite`, `where it bites`, and `sharpen`.

The account-match area should answer:
- how many watched accounts strongly match;
- how many partially match;
- how many do not match;
- why.

### Future Autopsy

If the room name remains `Future Autopsy`, add a literal subtitle:

> Identify deals with high loss risk and the specific factors driving that risk.

Every case must use the same information architecture:

1. **Observed facts**
2. **Risk level**
3. **Why risk is high**
4. **Recommended corrective actions**
5. **When to consider closing the opportunity**

Do not say a deal `dies`, is `dying`, or will definitely be lost unless a historical outcome is already known.

Do not infer internal buyer priority as fact. Phrase it as a risk assessment supported by observable inactivity.
