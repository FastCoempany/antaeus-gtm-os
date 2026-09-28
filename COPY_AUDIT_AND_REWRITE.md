# Antaeus Copy Audit and Rewrite Map

## Scope

- Source: `antaeusproductpage (3).html`
- Raw visible text nodes audited: **633**
- Logical copy units audited: **333**
- Logical units rewritten: **193**
- Logical units retained: **140**
- Standalone leaf-string replacements: **22**

The earlier **89/100** was a qualitative page-level saturation judgment. The lint score below is a different, deliberately mechanical diagnostic used only to compare the same corpus before and after the proposed rewrite; it should not be read as a replacement for that judgment.

- Mechanical lint before: **27/100**
- Mechanical lint after proposed rewrite: **4/100**
- Editorial target after human review: **5-10/100** on the original qualitative scale.

## Editorial decisions

1. Keep a small set of actual feature names: **The Briefing, Pace, The Ground, The Live Edge, Discovery Studio, Future Autopsy**. Their surrounding descriptions become literal on first mention.
2. Remove generic private vocabulary as the default grammar: **motion, room, move, moved, shape, line, hot/cold, slip, die, in your head**.
3. Rename readiness states to observable conditions: **Founder-dependent → Partially documented → Usable with founder support → Hire-ready → Hire-ready and repeatable**.
4. Navigation names destinations rather than metaphors: **Product areas, Sales handoff, Activity monitoring, Revenue plan, Beta limitations**.
5. Product-demo microcopy names actual events and states rather than using marketing metaphors.
6. Recommendations use **evidence → interpretation → action** rather than adjacent facts that imply causality.

## Section summary

| Section | Units | Rewritten | Avg severity before | Avg severity after |
|---|---:|---:|---:|---:|
| nav | 18 | 7 | 0.44 | 0.06 |
| global | 5 | 1 | 0.00 | 0.00 |
| top | 10 | 6 | 1.00 | 0.10 |
| highlights | 41 | 29 | 0.71 | 0.17 |
| handoff | 13 | 9 | 1.38 | 0.38 |
| rooms | 3 | 2 | 1.33 | 0.33 |
| briefing | 21 | 12 | 0.62 | 0.05 |
| week | 10 | 10 | 1.20 | 0.10 |
| craft | 60 | 36 | 0.65 | 0.28 |
| pace | 12 | 6 | 0.33 | 0.17 |
| all-rooms | 19 | 12 | 0.58 | 0.16 |
| ground | 15 | 10 | 0.73 | 0.53 |
| trust | 8 | 7 | 0.12 | 0.12 |
| why | 17 | 7 | 0.35 | 0.06 |
| compare | 31 | 19 | 0.52 | 0.23 |
| values | 5 | 5 | 1.40 | 0.00 |
| faq | 22 | 10 | 0.95 | 0.36 |
| footer | 23 | 5 | 0.26 | 0.04 |

## Every proposed logical-unit change

The source line is included so implementation can be checked against the current HTML. Inline markup may need to be reconstructed around the replacement text.

### 003 · `nav` · source line 552 · `<a>`

**Issues:** private_ontology  
**Before:** The rooms  
**After:** Product areas

### 008 · `nav` · source line 565 · `<a>`

**Issues:** editorial clarity / consistency  
**Before:** Handoff  
**After:** Sales handoff

### 009 · `nav` · source line 566 · `<a>`

**Issues:** private_ontology  
**Before:** Rooms  
**After:** Product areas

### 010 · `nav` · source line 567 · `<a>`

**Issues:** personification, vague_reference, ellipsis_or_context_dependence  
**Before:** What it sees  
**After:** Activity monitoring

### 011 · `nav` · source line 568 · `<a>`

**Issues:** editorial clarity / consistency  
**Before:** Pace  
**After:** Revenue plan

### 016 · `top` · source line 585 · `<h1>`

**Issues:** aphoristic_cadence, ellipsis_or_context_dependence  
**Before:** You built it. They can run it.  
**After:** Turn the sales process you built into a system your first hire can use.

### 017 · `top` · source line 586 · `<p>`

**Issues:** personification  
**Before:** Private beta. Set up your workspace in an afternoon. After that it reads your whole way of selling back to you every morning.  
**After:** Private beta. Set up your workspace in an afternoon. Each morning, Antaeus reviews your accounts, deals, calls, and sales activity and tells you what needs attention.

### 018 · `top` · source line 590 · `<p>`

**Issues:** private_ontology, ellipsis_or_context_dependence  
**Before:** Where your whole motion stands  
**After:** How ready your sales process is to hand off

### 019 · `top` · source line 599 · `<p>`

**Issues:** private_ontology, punctuation_as_logic  
**Before:** The most valuable move on your board · #1 of 12  
**After:** Highest-priority action · #1 of 12

### 021 · `top` · source line 601 · `<p>`

**Issues:** private_ontology  
**Before:** They announced two plants this month — a few hundred production hires on a deadline, and no recruiting team to absorb it. Nobody has called them. Reaching out is the part of your motion furthest behind.  
**After:** Chomps announced two plants this month, creating several hundred production hires on a deadline, and appears to have limited recruiting capacity. Your workspace shows no outreach to Chomps. Antaeus ranks outreach as your least-completed sales activity.

### 023 · `top` · source line 603 · `<p>`

**Issues:** punctuation_as_logic  
**Before:** · clearly the top one · then: Warby Parker, Sweetgreen  
**After:** Ranked #1 · Next: Warby Parker, Sweetgreen

### 025 · `global` · source line 612 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Free while we're in beta. No card. Bring one afternoon and what's in your head.  
**After:** Free while we're in beta. No card. Spend one afternoon entering the sales knowledge only you know.

### 029 · `highlights` · source line 633 · `<h3>`

**Issues:** private_ontology, vague_reference, ellipsis_or_context_dependence  
**Before:** Every account you watch, sorted by what just moved.  
**After:** Every account you follow, ranked by recent activity and company changes.

### 030 · `highlights` · source line 634 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction  
**Before:** Act now, reach while they’re warm, emerging, going cold.  
**After:** See which accounts need action now, which have new signals, and which have had no recent activity.

### 031 · `highlights` · source line 637 · `<p>`

**Issues:** private_ontology, vague_reference  
**Before:** Act now — hot, and something just moved  
**After:** High priority · recent company change

### 032 · `highlights` · source line 649 · `<h3>`

**Issues:** vague_reference  
**Before:** One thing to do first, and why it came up first.  
**After:** Your highest-priority action, with the reason it ranks first.

### 033 · `highlights` · source line 650 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Not a list of fourteen. The single most valuable one, with its reason shown.  
**After:** Not a fourteen-item task list. Antaeus ranks one action first and shows the evidence behind the ranking.

### 036 · `highlights` · source line 655 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction, sales_idiom  
**Before:** Two plants announced, a few hundred hires, no recruiting bench. Running hot , and outreach is your weakest part.  
**After:** Two plants announced, several hundred hires planned, no apparent recruiting bench. Antaeus ranks Chomps highly because the account has a recent hiring trigger and outreach is your least-completed activity.

### 038 · `highlights` · source line 657 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** · then: Warby Parker, Sweetgreen  
**After:** Next: Warby Parker, Sweetgreen

### 039 · `highlights` · source line 663 · `<h3>`

**Issues:** private_ontology  
**Before:** The deals that will slip this week, and the smallest fix.  
**After:** Deals at risk this week, with the next corrective action for each.

### 040 · `highlights` · source line 664 · `<p>`

**Issues:** metaphorical_abstraction  
**Before:** Where a deal says it is matters less than what it is actually stuck on.  
**After:** Pipeline stage alone does not show deal risk. Antaeus also tracks unresolved blockers and buyer activity.

### 042 · `highlights` · source line 668 · `<h4>`

**Issues:** private_ontology  
**Before:** 3 will slip.  
**After:** 3 deals are at risk.

### 043 · `highlights` · source line 679 · `<h3>`

**Issues:** editorial clarity / consistency  
**Before:** A console you run the discovery call from, live.  
**After:** A live discovery-call console.

### 044 · `highlights` · source line 680 · `<p>`

**Issues:** private_ontology, personification, vague_reference  
**Before:** They say something. You tap what you heard. It hands you the next line.  
**After:** Select the buyer response you heard. Antaeus shows the recommended follow-up question.

### 045 · `highlights` · source line 683 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Pain & consequence · live  
**After:** Problem and business impact · live

### 047 · `highlights` · source line 685 · `<p>`

**Issues:** metaphorical_abstraction  
**Before:** Listen for whether this is really theirs to fix — and who flinches when you name the cost.  
**After:** Listen for whether the buyer owns the problem and who is accountable for its cost.

### 048 · `highlights` · source line 691 · `<p>`

**Issues:** private_ontology, ellipsis_or_context_dependence  
**Before:** Tap what you heard to get your next line  
**After:** Select the response to see the recommended follow-up

### 050 · `highlights` · source line 698 · `<h3>`

**Issues:** vague_reference  
**Before:** A pilot that gives their boss something to act on.  
**After:** A pilot plan the buyer's manager can use to make a decision.

### 051 · `highlights` · source line 699 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Walked through, one step at a time, with the people you need to pull in.  
**After:** Antaeus walks you through the pilot steps and identifies which stakeholders still need to participate.

### 052 · `highlights` · source line 702 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Who is hands-on  
**After:** Active pilot participants

### 055 · `highlights` · source line 718 · `<h3>`

**Issues:** ellipsis_or_context_dependence  
**Before:** Everything a first hire opens on day one.  
**After:** What a new hire gets on day one.

### 056 · `highlights` · source line 719 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Written like a document a sharp operator left for their replacement.  
**After:** A structured operating guide with the context and decisions behind your sales process.

### 058 · `highlights` · source line 735 · `<p>`

**Issues:** vague_reference  
**Before:** One thing to notice — every deal you won was mid-market , but your stated target is enterprise.  
**After:** Pattern: every deal you won was mid-market, while your stated target is enterprise.

### 059 · `highlights` · source line 743 · `<h3>`

**Issues:** ellipsis_or_context_dependence  
**Before:** One question, answered honestly: could someone else run this?  
**After:** Can a new hire execute your sales process without you?

### 060 · `highlights` · source line 744 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Five states, and what it takes to reach the next one.  
**After:** Five readiness states, with explicit requirements for each.

### 061 · `highlights` · source line 747 · `<p>`

**Issues:** ellipsis_or_context_dependence  
**Before:** Could a hire run this on Monday?  
**After:** Could a new hire execute this process on Monday?

### 062 · `highlights` · source line 749 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** Hire-ready, repeatable  
**After:** Hire-ready and repeatable

### 064 · `highlights` · source line 751 · `<div>`

**Issues:** private_ontology  
**Before:** Inheritable, with you there  
**After:** Usable with founder support

### 065 · `highlights` · source line 752 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** Building  
**After:** Partially documented

### 066 · `highlights` · source line 753 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** You are the system  
**After:** Founder-dependent

### 067 · `highlights` · source line 755 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Left “you are the system” behind 3 weeks ago  
**After:** Changed from Founder-dependent 3 weeks ago

### 068 · `handoff` · source line 915 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** The handoff  
**After:** Sales handoff

### 069 · `handoff` · source line 916 · `<h2>`

**Issues:** private_ontology, aphoristic_cadence, ellipsis_or_context_dependence  
**Before:** One motion. Two people who run it.  
**After:** One sales process, usable by both founder and first hire.

### 070 · `handoff` · source line 917 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction, vague_reference, grammar_error  
**Before:** Your motion is the whole way you win revenue — who you go after, how you reach them, what you say on the call, how a deal gets to signed. In a founder-led company all of that lives in one head. Antaeus is where it stops doing that. The accounts you watch, where every deal actually stands , the questions that won a second meeting, what the pilot showed — it all piles up as you work, inside the rooms you already work in. Nothing gets filed away for later. So when the first serious hire starts, they open the same workspace you've been living in and read it themselves. You don't sit next to them for a month explaining what you meant.  
**After:** Your sales process includes who you target, how you reach them, what you ask on calls, how you qualify opportunities, and how you advance a deal to signature. In a founder-led company, much of that knowledge is undocumented. Antaeus records it as you work: account priorities, actual deal status, discovery questions that worked, pilot results, and the reasoning behind decisions. When your first go-to-market hire starts, they use the same workspace and can read that context directly instead of relying on you to explain it from memory.

### 071 · `handoff` · source line 925 · `<p>`

**Issues:** private_ontology  
**Before:** The most valuable move on your board  
**After:** Highest-priority action

### 073 · `handoff` · source line 927 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction, sales_idiom  
**Before:** Two plants announced this month, a few hundred production hires, no recruiting bench. The account is running hot , and outreach is the part of your motion furthest behind.  
**After:** Two plants announced this month, several hundred production hires planned, no apparent recruiting bench. Antaeus ranks Chomps highly because the account has a recent hiring trigger and outreach is your least-completed activity.

### 075 · `handoff` · source line 936 · `<p>`

**Issues:** punctuation_as_logic  
**Before:** If a hire started Monday · 5 of 7 parts ready  
**After:** If a hire started Monday · 5 of 7 readiness areas complete

### 077 · `handoff` · source line 949 · `<p>`

**Issues:** metaphorical_abstraction, sales_idiom  
**Before:** Every deal you closed came through someone who already owned the number. The ones that stalled went in through a team that had to go ask.  
**After:** Every deal you closed involved a stakeholder directly accountable for the relevant business metric. Stalled deals entered through teams that needed approval from another decision-maker.

### 078 · `handoff` · source line 950 · `<p>`

**Issues:** vague_reference  
**Before:** One thing to notice — every deal you won was mid-market , but the target you wrote down says enterprise.  
**After:** Pattern: every deal you won was mid-market, while your stated target is enterprise.

### 080 · `handoff` · source line 961 · `<button>`

**Issues:** ellipsis_or_context_dependence  
**Before:** What they read on day one  
**After:** What a new hire sees on day one

### 082 · `rooms` · source line 978 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Watching · 28 accounts  
**After:** Tracked accounts · 28

### 083 · `rooms` · source line 985 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction, vague_reference, punctuation_as_logic  
**Before:** Four need something today · three going cold  
**After:** Four need action today · three have had no recent activity

### 085 · `briefing` · source line 1012 · `<h2>`

**Issues:** personification, ellipsis_or_context_dependence  
**Before:** It keeps reading when you stop.  
**After:** Antaeus continues reviewing workspace activity when you're away.

### 086 · `briefing` · source line 1027 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Your work inside your own deals and accounts  
**After:** Updates from your deals and accounts

### 088 · `briefing` · source line 1035 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Liquid Death has gone quiet — their people team is three deep and mid-launch. Open the account →  
**After:** Liquid Death has had no recent buyer activity for 14 days; its people team is three people and mid-launch. Open the account →

### 090 · `briefing` · source line 1043 · `<p>`

**Issues:** private_ontology  
**Before:** No discovery calls logged this week — the rhythm is slipping . Pick up a call →  
**After:** No discovery calls logged this week — below your planned weekly activity. Review a call →

### 095 · `briefing` · source line 1074 · `<p>`

**Issues:** private_ontology, personification, vague_reference  
**Before:** Every half hour the system goes back over your workspace on its own and writes down what it noticed — a deal that has not moved in three weeks , an account you watched that has gone quiet, a pilot where half the people you enrolled never signed in. Not charts. Plain sentences, the way a colleague would say them to you. In the morning you get the short version and the one thing worth doing first , and the reason it came up first is right there next to it.  
**After:** Every 30 minutes, Antaeus reviews workspace data for changes and risks: deals without recent progress, accounts without recent engagement, and pilots with low participant adoption. It summarizes those findings in plain language. Each morning, it also ranks the highest-priority action and shows why it ranked first.

### 096 · `briefing` · source line 1079 · `<p>`

**Issues:** personification  
**Before:** Every 30 minutes the system re-reads your whole workspace on its own  
**After:** Every 30 minutes Antaeus reviews the latest workspace data

### 097 · `briefing` · source line 1080 · `<p>`

**Issues:** private_ontology  
**Before:** One ranked move with the plain reason it came up ahead of the other thirteen  
**After:** One ranked action with the evidence behind its priority

### 098 · `briefing` · source line 1081 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction  
**Before:** 22 rooms, one motion the work carries between them — you never restate anything  
**After:** 22 product areas share the same account and deal context; you enter information once

### 099 · `briefing` · source line 1091 · `<span>`

**Issues:** ellipsis_or_context_dependence  
**Before:** A spreadsheet and what you remember  
**After:** Spreadsheet + undocumented founder knowledge

### 100 · `briefing` · source line 1092 · `<span>`

**Issues:** editorial clarity / consistency  
**Before:** You are the system  
**After:** Founder-dependent

### 103 · `briefing` · source line 1110 · `<span>`

**Issues:** private_ontology  
**Before:** The same motion, six weeks in  
**After:** Six weeks later

### 104 · `briefing` · source line 1111 · `<span>`

**Issues:** ellipsis_or_context_dependence  
**Before:** Someone else could run it  
**After:** A new hire can execute the process

### 105 · `week` · source line 1125 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** However the week goes  
**After:** For different kinds of sales days

### 106 · `week` · source line 1126 · `<h2>`

**Issues:** private_ontology, aphoristic_cadence  
**Before:** The work changes shape. The system keeps up.  
**After:** Antaeus supports the same workflow whether you have one call or several deals at risk.

### 107 · `week` · source line 1127 · `<p>`

**Issues:** private_ontology  
**Before:** Some mornings you have an hour and one call. Some weeks you are three deals behind and cannot tell which one is worth saving. The rooms hold their shape either way.  
**After:** Some mornings you have an hour and one call. Other weeks, several deals need attention at once. The same tools and account context remain available in either case.

### 108 · `week` · source line 1133 · `<h3>`

**Issues:** private_ontology  
**Before:** Whatever shape your week takes.  
**After:** For common sales situations.

### 109 · `week` · source line 1139 · `<p>`

**Issues:** private_ontology  
**Before:** Monday, and it's all yours. Open one room and read the state of the whole motion in a sentence, then the single thing worth doing before lunch.  
**After:** Starting the week. Open any product area to see the current state of your accounts and deals, then the highest-priority action for the day.

### 110 · `week` · source line 1143 · `<p>`

**Issues:** private_ontology  
**Before:** A call you're walking into cold. The shape of it, the pushback you're likely to get, and a line ready for each one — read before you dial, not during.  
**After:** Preparing for a cold call. Review the call structure, likely objections, and recommended responses before you dial.

### 111 · `week` · source line 1147 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction, personification  
**Before:** The deal that went quiet. The system noticed before you did, says how long it's been, and names the smallest thing that would move it.  
**After:** A deal with no recent buyer activity. Antaeus shows how long activity has been stalled and recommends the smallest next action that could restore progress.

### 112 · `week` · source line 1151 · `<p>`

**Issues:** metaphorical_abstraction  
**Before:** What you learned on the call. Captured while you're still in it, then carried into the deal — so nobody has to ask you what happened later.  
**After:** What you learned on the call. Capture it during the call and attach it to the deal so the next person sees the same context.

### 113 · `week` · source line 1155 · `<p>`

**Issues:** personification  
**Before:** The week you're behind. It says so plainly — how far, which assumption was optimistic, and what it costs if you're wrong about it.  
**After:** A week behind plan. Antaeus shows the activity gap, which planning assumption is too optimistic, and the projected impact.

### 114 · `week` · source line 1159 · `<p>`

**Issues:** private_ontology  
**Before:** The day someone else takes it. They open the workspace and read it. You are in the room to answer questions, not to be the only copy.  
**After:** A new hire takes over. They can read the workflow, deal context, and documented reasoning in the workspace; you only need to answer exceptions and questions.

### 116 · `craft` · source line 1169 · `<h2>`

**Issues:** editorial clarity / consistency  
**Before:** The part most founders make up as they go.  
**After:** Standardize outreach instead of improvising it.

### 117 · `craft` · source line 1170 · `<p>`

**Issues:** private_ontology, vague_reference  
**Before:** Outreach that could have gone to anyone gets treated like it went to nobody. Antaeus will not let a line leave without the account, the person, and the thing that just happened to them attached to it. Same on the call: whatever the buyer says, there is a next line ready , and what you learn is captured while you are still in the room.  
**After:** Antaeus requires every outreach draft to reference a specific account, contact, and recent trigger. During a live call, it shows the next recommended question based on the buyer response you select, and it records the result with the deal.

### 123 · `craft` · source line 1189 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Lena — saw the two plants going up. That is a few hundred production hires on a deadline , and from the outside it looks like the people team absorbing all of it. Usually the screening is what gives first. Worth twenty minutes to compare notes on how you are staffing the openings?  
**After:** Lena — I saw Chomps announce two new plants. That creates several hundred production hires on a deadline, and from the outside it appears the people team will absorb most of the load. Screening is often the first bottleneck. Worth twenty minutes next week to compare how you are staffing the openings?

### 125 · `craft` · source line 1195 · `<p>`

**Issues:** private_ontology  
**Before:** Outbound. Pick the account, the person, and what just happened to them. The line comes out naming all three. There is no send path for a message that could have gone to anyone.  
**After:** Outbound. Select an account, contact, and recent trigger. Antaeus uses all three in the draft and blocks generic messages that could apply to any prospect.

### 126 · `craft` · source line 1199 · `<p>`

**Issues:** private_ontology, punctuation_as_logic, ellipsis_or_context_dependence  
**Before:** Before you dial · the shape of it  
**After:** Before you dial · call structure

### 129 · `craft` · source line 1206 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Small teams feel a bad hire hardest. Ask what one wrong store manager cost them last year — nobody argues with a number they said out loud.  
**After:** Small teams feel a bad hire hardest. Ask what one unsuccessful store-manager hire cost last year. Their answer gives you a concrete financial impact to discuss.

### 130 · `craft` · source line 1207 · `<p>`

**Issues:** punctuation_as_logic  
**Before:** Read before you dial · log what happened after · never during  
**After:** Review before you dial · log the outcome after the call

### 131 · `craft` · source line 1209 · `<p>`

**Issues:** private_ontology  
**Before:** Cold call. The shape of the call, and at every step the pushback a buyer actually gives, with a line ready for it. You read it before you dial and log what happened after — never while you're talking.  
**After:** Cold call. Review the call structure, likely buyer objections, and recommended responses before you dial. Log the outcome after the call, not while speaking.

### 132 · `craft` · source line 1213 · `<p>`

**Issues:** private_ontology, ellipsis_or_context_dependence  
**Before:** Gymshark · one move  
**After:** Gymshark · recommended LinkedIn action

### 139 · `craft` · source line 1223 · `<p>`

**Issues:** private_ontology, vague_reference  
**Before:** LinkedIn. One account, one move. Watch what they post, say something useful about it, connect once they know your name, give something before you ask. The inbox is never the opening.  
**After:** LinkedIn. For each account, Antaeus recommends the next relationship-building action: follow relevant posts, contribute something useful, connect after familiarity exists, and offer value before asking for time. Do not begin with a direct message.

### 140 · `craft` · source line 1227 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Pain & consequence · live  
**After:** Problem and business impact · live

### 142 · `craft` · source line 1229 · `<p>`

**Issues:** metaphorical_abstraction  
**Before:** Listen for whether this pain is really theirs to fix — and who flinches when you name the cost.  
**After:** Listen for whether the buyer owns the problem and who is accountable for its cost.

### 143 · `craft` · source line 1235 · `<p>`

**Issues:** sales_idiom  
**Before:** They hired around it. Ask what that cost and who signed it off — you have just found your economic buyer.  
**After:** They added recruiters instead of changing the underlying process. Ask what the added headcount cost and who approved the expense; that identifies the budget owner.

### 144 · `craft` · source line 1237 · `<p>`

**Issues:** private_ontology, personification  
**Before:** Discovery. A console you run the live call from. It shows the question, what to listen for, and the moment they answer you tap what you heard — it hands you the exact next line and jumps you to where the conversation went.  
**After:** Discovery. Use the console during the call. It shows the current question and what evidence to listen for. Select the buyer response you heard; Antaeus shows the recommended follow-up and moves to the relevant branch of the call flow.

### 145 · `craft` · source line 1243 · `<h3>`

**Issues:** editorial clarity / consistency  
**Before:** Everything between finding them and signing.  
**After:** Workflows from prospecting through signature.

### 146 · `craft` · source line 1247 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Describe who you are after  
**After:** Describe your target companies

### 148 · `craft` · source line 1250 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Finding them. Describe who you’re after in plain words and keep the search. Add the companies it turns up, and each one answers three questions — are they who we’re targeting, what’s our way in, how will we reach out — before it reaches the accounts you watch.  
**After:** Prospecting. Describe your target companies in plain language and save the search. Before a company is added to your tracked accounts, Antaeus records whether it fits your target, the likely reason to engage, and the intended outreach channel.

### 149 · `craft` · source line 1252 · `<p>`

**Issues:** ellipsis_or_context_dependence  
**Before:** How is this market cut?  
**After:** Segment the market by

### 151 · `craft` · source line 1256 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Carving the market. Cut it by geography, industry, size, named accounts, or a live trigger — and blend them. Every division says why you're the right team to win it.  
**After:** Market segmentation. Segment by geography, industry, company size, named accounts, recent trigger, or a combination. For each segment, document why your team is positioned to win.

### 152 · `craft` · source line 1258 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Too broad to hunt  
**After:** Target definition is too broad

### 154 · `craft` · source line 1260 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Sharper — growth consumer brands whose expansion news dates the hiring need .  
**After:** More specific — growth-stage consumer brands whose announced expansion creates a dated hiring need.

### 155 · `craft` · source line 1261 · `<p>`

**Issues:** private_ontology  
**Before:** Who you sell to. One sharp definition, pushed on until it's a target you can actually hunt. Every other room works against it from then on.  
**After:** Ideal customer profile. Refine the definition until it identifies a specific, searchable target. Antaeus uses that target definition across the rest of the workspace.

### 156 · `craft` · source line 1263 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Who is hands-on  
**After:** Active pilot participants

### 158 · `craft` · source line 1266 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Running the pilot. Walked through step by step: what it has to show, who needs to be hands-on, who's still missing, and a write-up the champion can defend without you.  
**After:** Pilot planning. Antaeus guides the pilot step by step: success criteria, participating stakeholders, missing stakeholders, and a summary the champion can share internally.

### 159 · `craft` · source line 1268 · `<p>`

**Issues:** vague_reference, ellipsis_or_context_dependence  
**Before:** The one thing blocking  
**After:** Current blocker

### 161 · `craft` · source line 1272 · `<p>`

**Issues:** private_ontology, vague_reference  
**Before:** The run to a signature. After they say yes, security, legal and finance can still kill it. It leads with the one front actually blocking, their ask against your line, and what you can trade.  
**After:** Contracting. After verbal approval, security, legal, and finance can still block signature. Antaeus shows the current blocking issue, the buyer's request, your position, and available trade-offs.

### 162 · `craft` · source line 1274 · `<p>`

**Issues:** private_ontology  
**Before:** The relay  
**After:** Referral path

### 163 · `craft` · source line 1276 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** One Chicago operator to another. All he has to do is change a couple of lines and hit send .  
**After:** One Chicago operator to another. The draft is nearly complete; Rafael only needs to personalize it and send.

### 164 · `craft` · source line 1277 · `<p>`

**Issues:** private_ontology, vague_reference  
**Before:** Calling in a favor. Your investors, advisors and happy customers, matched to the deal they can actually move. It writes both notes — yours to them, and the one they forward.  
**After:** Warm introduction. Antaeus matches investors, advisors, and customers to deals where they have a relevant connection, then drafts your request and the message they can forward.

### 166 · `craft` · source line 1280 · `<h4>`

**Issues:** private_ontology  
**Before:** Warby Parker dies in 20 days.  
**After:** Warby Parker is projected to be lost within 20 days.

### 167 · `craft` · source line 1282 · `<p>`

**Issues:** private_ontology, aphoristic_cadence  
**Before:** The autopsy, early. It writes the story of how the deal dies before it does, names the pattern, and routes you to the room where the fix happens.  
**After:** Deal risk analysis. Antaeus projects how the deal is likely to fail, identifies the recurring risk pattern, and links to the workflow where you can address it.

### 168 · `craft` · source line 1284 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Projected landing  
**After:** Projected revenue

### 171 · `craft` · source line 1287 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Your number, backwards. The annual figure worked down to what you do daily — plus whether the plan is even real, and which assumption in it is the optimistic one.  
**After:** Revenue target plan. Antaeus converts the annual target into required daily activity, checks the plan against benchmark assumptions, and identifies the assumption creating the largest risk.

### 172 · `craft` · source line 1293 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** 10 frameworks discovery question sets tuned to what you actually sell  
**After:** 10 discovery frameworks tuned to what you sell

### 173 · `craft` · source line 1294 · `<p>`

**Issues:** private_ontology  
**Before:** 6 buyer lenses the questions change depending on who is in the room  
**After:** 6 buyer-role views that change the questions by stakeholder

### 174 · `craft` · source line 1295 · `<p>`

**Issues:** private_ontology  
**Before:** Every branch answered whatever they say back, there is a next line and somewhere to go  
**After:** Recommended follow-up for each buyer response

### 176 · `pace` · source line 1366 · `<h2>`

**Issues:** editorial clarity / consistency  
**Before:** Do you have enough going to hit the number?  
**After:** Is your current pipeline and activity enough to hit the revenue target?

### 177 · `pace` · source line 1367 · `<p>`

**Issues:** personification, vague_reference  
**Before:** Give it your number and Antaeus works backwards to the only thing you control — what you do every working day . Then it does the part most planning tools skip: it tells you whether the plan is realistic for deals your size, names the one assumption that's optimistic , and says what it costs you if that assumption is wrong.  
**After:** Enter your revenue target. Antaeus converts it into required daily activity using your deal size, win-rate, and sales-cycle assumptions. It compares those assumptions with benchmarks for similar deal sizes, identifies which assumption makes the plan unrealistic, and shows the projected impact if that assumption is wrong.

### 183 · `pace` · source line 1382 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** 1 in 5 closes how often deals this size are won — the band is 15 to 25%  
**After:** 20% win-rate benchmark · typical range 15–25%

### 184 · `pace` · source line 1383 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction  
**Before:** 3.5× in flight enough going at once that a couple of slips do not sink the quarter  
**After:** 3.5× pipeline coverage · enough active pipeline to absorb normal deal slippage

### 185 · `pace` · source line 1384 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** 90 days how long one usually takes to close — the range is 60 to 120 days  
**After:** 90-day sales-cycle benchmark · typical range 60–120 days

### 186 · `pace` · source line 1386 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** These are the benchmark reads for that deal size. Antaeus checks your plan against them and says plainly when it's a stretch.  
**After:** These are benchmark ranges for the selected deal size. Antaeus compares your planning assumptions with them and flags assumptions outside the typical range.

### 187 · `all-rooms` · source line 1395 · `<p>`

**Issues:** ellipsis_or_context_dependence  
**Before:** All of it  
**After:** Product coverage

### 188 · `all-rooms` · source line 1396 · `<h2>`

**Issues:** private_ontology  
**Before:** Twenty-two rooms. Here are three.  
**After:** Twenty-two product areas. Here are three.

### 189 · `all-rooms` · source line 1397 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** They are not tabs. Work done in one shows up in the next without you retyping it — the account you added this morning is the account the call is about this afternoon. We are not going to lay the whole thing out on a marketing page. You will see it when you are inside.  
**After:** These are connected workflows, not separate tabs. Data entered in one workflow is available in the others, so an account added during prospecting is the same account used in call preparation later that day. This page shows three; the full workspace contains twenty-two.

### 191 · `all-rooms` · source line 1404 · `<h3>`

**Issues:** editorial clarity / consistency  
**Before:** You run the call from it, while you are on the call.  
**After:** Run the discovery call from this workspace.

### 192 · `all-rooms` · source line 1405 · `<p>`

**Issues:** private_ontology  
**Before:** Ten frameworks, six buyer lenses, and a next line ready for whatever they say back. Not notes you write afterwards.  
**After:** Ten discovery frameworks, six buyer-role views, and recommended follow-up questions based on the response you select. Use it during the call, not only for notes afterward.

### 195 · `all-rooms` · source line 1409 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** They hired around it. Ask what that cost and who signed it off.  
**After:** They added recruiters instead of changing the process. Ask what the added headcount cost and who approved it.

### 197 · `all-rooms` · source line 1415 · `<h3>`

**Issues:** private_ontology, ellipsis_or_context_dependence  
**Before:** It writes how the deal dies before it does.  
**After:** Projects deal-loss risk before the deal is lost.

### 198 · `all-rooms` · source line 1416 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** The pattern, the days you have left, and the smallest thing that would change the ending.  
**After:** Shows the recurring risk pattern, estimated time remaining, and the smallest corrective action.

### 200 · `all-rooms` · source line 1419 · `<h4>`

**Issues:** private_ontology  
**Before:** Warby Parker dies in 20 days.  
**After:** Warby Parker is projected to be lost within 20 days.

### 202 · `all-rooms` · source line 1426 · `<h3>`

**Issues:** personification, ellipsis_or_context_dependence  
**Before:** What the system saw while you were out.  
**After:** Workspace changes detected while you were away.

### 203 · `all-rooms` · source line 1427 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Written the way a colleague would say it, every morning, whether or not you opened anything yesterday.  
**After:** A plain-language summary of account, deal, and pilot changes, generated each morning whether or not you used Antaeus the previous day.

### 205 · `all-rooms` · source line 1436 · `<p>`

**Issues:** private_ontology  
**Before:** The other nineteen do the rest of it — who you go after and how you carve the market , finding real companies and confirming them, the line you send and the call you walk into, the pilot, the run through security and legal to a signature, your number worked back to a daily habit, and the handoff itself.  
**After:** The other nineteen cover market segmentation, account discovery and qualification, outreach, call preparation, pilots, security and legal, revenue planning, and the handoff to your first hire.

### 207 · `ground` · source line 1446 · `<h2>`

**Issues:** private_ontology, metaphorical_abstraction  
**Before:** Touch the ground. The map comes up.  
**After:** Open the Ground to see the workspace map.

### 208 · `ground` · source line 1447 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction  
**Before:** There is no menu bar down the side of the screen. Every room stands on a quiet line at the foot of the page — press it, or press G, and the whole motion rises up as a map with you-are-here lit and the system's suggestion glowing. It's the myth the product is named after: Antaeus was unbeatable while he was touching the earth.  
**After:** Antaeus does not use a permanent left-side navigation bar. A thin control at the bottom of every product area opens the workspace map; press the control or G to see all twenty-two areas, your current location, and Antaeus's recommended next area. The control is called the Ground, after the Antaeus myth.

### 209 · `ground` · source line 1455 · `<p>`

**Issues:** private_ontology  
**Before:** The ground · your whole motion  
**After:** The Ground · workspace map

### 210 · `ground` · source line 1467 · `<p>`

**Issues:** private_ontology  
**Before:** Twenty-two of them. Press the line and they come up.  
**After:** Twenty-two product areas. Open the Ground to view them.

### 212 · `ground` · source line 1471 · `<p>`

**Issues:** private_ontology  
**Before:** One line, every room. Press it and the map of your whole motion rises from beneath the page, with you-are-here lit and the system's suggestion glowing. Summoned, then gone — it never sits there taking up the screen.  
**After:** The Ground is the navigation map for all twenty-two product areas. Open it from the bottom of any page or press G to see your current location and Antaeus's recommended next area. Close it when you're done; it does not remain on screen.

### 215 · `ground` · source line 1483 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Gymshark — Poppy replied after 12 quiet days. 28m  
**After:** Gymshark — Poppy replied after 12 days without a response. 28m

### 216 · `ground` · source line 1484 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Captured your send to Lena at Chomps — counted.  
**After:** Email to Lena at Chomps captured and counted.

### 217 · `ground` · source line 1485 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Calendar — Thursday with Notion confirmed.  
**After:** Calendar · Thursday meeting with Notion confirmed.

### 218 · `ground` · source line 1486 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Still no dated next step on Warby Parker .  
**After:** Warby Parker still has no dated next step.

### 220 · `ground` · source line 1492 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction  
**Before:** A hairline down the left margin carrying today's count against your daily number, and a running list of what moved — tagged by whether it was you, the system, or the buyer. Switch it off and it folds to the wall in three beats you can see.  
**After:** The Live Edge is a collapsible activity panel on the left side of the workspace. It shows today's message-and-call count against your daily target and a chronological list of recent actions, labeled by actor: you, Antaeus, or the buyer. Turn it off to collapse the panel.

### 222 · `trust` · source line 1502 · `<h2>`

**Issues:** ellipsis_or_context_dependence  
**Before:** It's yours, and you can take it.  
**After:** You own the workspace data and can export it.

### 223 · `trust` · source line 1505 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Saved as you work. Your workspace lives in the cloud, not trapped on one laptop. Close the lid mid-sentence and open it somewhere else.  
**After:** Saved automatically. Your workspace is stored in the cloud and syncs across devices. Close one device mid-edit and continue from another.

### 224 · `trust` · source line 1506 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Nothing sold, nothing shared. Your accounts, deals and calls are your commercial position. They are not a dataset we resell or train a public model on.  
**After:** Your data is not sold or used to train public models. Your accounts, deals, and calls are not a dataset Antaeus resells.

### 225 · `trust` · source line 1507 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Take a full copy, any time. One button downloads everything in your workspace as a plain file. No ticket, no export queue, no waiting on us.  
**After:** Export a full copy at any time. One button downloads everything in your workspace as a plain file. No support ticket or export queue is required.

### 226 · `trust` · source line 1508 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Delete it and mean it. Type the words and it's gone — the accounts, the deals, the pilot results, all of it. Not archived somewhere we can still read.  
**After:** Delete the workspace. Type the confirmation phrase and Antaeus deletes the accounts, deals, pilot results, and other workspace data instead of archiving them for continued access.

### 227 · `trust` · source line 1509 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Read-only for a hire. Share the workspace with someone who is starting Monday without handing them your logins or the ability to change anything.  
**After:** Give a new hire read-only access. They can view the workspace without receiving your login credentials or permission to change data.

### 228 · `trust` · source line 1510 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** An offline copy too. If you want a version that never leaves the machine you're on, the app will hand you one. It's tucked away, because most people never need it.  
**After:** Create an offline copy. If you need a copy stored only on the current device, Antaeus can create one. The option is secondary because most users will not need it.

### 231 · `why` · source line 1614 · `<h3>`

**Issues:** metaphorical_abstraction  
**Before:** Set it up once. It pays you back every morning.  
**After:** Set it up once. Get a prioritized briefing every morning.

### 232 · `why` · source line 1615 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** The setup asks for the thinking only you have — who you really sell to, who you're chasing, where each deal is genuinely stuck. Nothing you'd have to look up. Everything a tool can find, it finds.  
**After:** Setup asks for information only you know: your actual target customer, the accounts you are pursuing, and the current blocker in each deal. Antaeus looks up public company information itself, so you only enter context it cannot retrieve.

### 238 · `why` · source line 1625 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Yours to take  
**After:** Exportable

### 240 · `why` · source line 1627 · `<p>`

**Issues:** vague_reference  
**Before:** One button, one file, everything in it. If you leave, you leave with the thing you built — not with a support ticket.  
**After:** One button exports the entire workspace to a single file. If you leave, you keep a complete copy without opening a support ticket.

### 242 · `why` · source line 1631 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Built for the handoff  
**After:** For the first sales hire

### 243 · `why` · source line 1632 · `<h3>`

**Issues:** aphoristic_cadence  
**Before:** The point is the day you stop being the only one who knows.  
**After:** Designed for the point when the founder is no longer the only person who understands the sales process.

### 244 · `why` · source line 1633 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction  
**Before:** Every other tool is built to report on the motion. This one is built so the motion survives leaving your head.  
**After:** Most sales tools record activity for reporting. Antaeus also documents the reasoning, account context, and sales process a new hire needs to execute the work without relying on undocumented founder knowledge.

### 246 · `compare` · source line 1643 · `<h2>`

**Issues:** aphoristic_cadence  
**Before:** Keep looking. Then come back.  
**After:** Compare Antaeus with a CRM and a spreadsheet.

### 247 · `compare` · source line 1644 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** Most founders have already tried the other two. Here is the honest difference, without pretending either one is useless.  
**After:** A CRM and a spreadsheet solve different problems. This comparison shows what each is designed to do.

### 249 · `compare` · source line 1655 · `<div>`

**Issues:** vague_reference  
**Before:** Telling you what to do next, and why that one  
**After:** Rank the next sales action and show why it ranks first

### 251 · `compare` · source line 1657 · `<div>`

**Issues:** ellipsis_or_context_dependence  
**Before:** Whatever you decided it was for  
**After:** Flexible manual tracking

### 253 · `compare` · source line 1660 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** A founder selling, and the first hire who takes over  
**After:** Founder-led sales teams preparing for the first go-to-market hire

### 255 · `compare` · source line 1662 · `<div>`

**Issues:** ellipsis_or_context_dependence  
**Before:** You, this quarter  
**After:** An individual founder or small team needing lightweight tracking

### 257 · `compare` · source line 1665 · `<div>`

**Issues:** ellipsis_or_context_dependence  
**Before:** One ranked thing to do, with its reason shown  
**After:** Highest-priority action, with the evidence behind the ranking

### 258 · `compare` · source line 1666 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** A list of everything, sorted how you last sorted it  
**After:** Full activity list using the user's last sort

### 259 · `compare` · source line 1667 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** Whatever you typed last  
**After:** Last-entered data

### 260 · `compare` · source line 1669 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** Runs the live call  
**After:** Provides live call guidance

### 261 · `compare` · source line 1670 · `<div>`

**Issues:** private_ontology, vague_reference  
**Before:** Yes — question, what to listen for, the next line  
**After:** Yes — current question, evidence to listen for, and recommended follow-up

### 264 · `compare` · source line 1674 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** Says when the plan isn't real  
**After:** Flags unrealistic planning assumptions

### 265 · `compare` · source line 1675 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** Yes — names the optimistic assumption and its cost  
**After:** Yes — identifies the assumption outside the benchmark range and shows its projected impact

### 266 · `compare` · source line 1676 · `<div>`

**Issues:** ellipsis_or_context_dependence  
**Before:** No — it reports the forecast you entered  
**After:** No — reports the forecast entered by the user

### 268 · `compare` · source line 1679 · `<div>`

**Issues:** ellipsis_or_context_dependence  
**Before:** A hire can inherit it  
**After:** Supports handoff to a new hire

### 269 · `compare` · source line 1680 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** Yes — seven parts written as prose they read on day one  
**After:** Yes — seven documented areas a new hire can read on day one

### 271 · `compare` · source line 1682 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** No — the reasoning was never written down  
**After:** No — reasoning remains undocumented unless you write it separately

### 273 · `compare` · source line 1685 · `<div>`

**Issues:** editorial clarity / consistency  
**Before:** An afternoon of real thinking  
**After:** About one afternoon of founder input

### 276 · `compare` · source line 1689 · `<p>`

**Issues:** private_ontology  
**Before:** If you have a twelve-person sales team and a forecasting problem, buy a CRM. This is for the stretch before that, when the motion is still one person's and the first hire starts in six weeks.  
**After:** If you already have a twelve-person sales team and mainly need forecasting and reporting, use a CRM. Antaeus is designed for founder-led sales before that point, when the process still depends heavily on the founder and the first sales hire is approaching.

### 277 · `values` · source line 1698 · `<h2>`

**Issues:** ellipsis_or_context_dependence  
**Before:** Where we're honest with you.  
**After:** Current beta limitations.

### 278 · `values` · source line 1701 · `<h3>`

**Issues:** personification, ellipsis_or_context_dependence  
**Before:** It is beta, and it reads like beta.  
**After:** The product is still in beta.

### 279 · `values` · source line 1702 · `<p>`

**Issues:** private_ontology, vague_reference  
**Before:** Some rooms are deeper than others. When something is thin, the app says so in plain words rather than showing you a confident empty state. You will find rough edges; we would rather you find them than not be told.  
**After:** Some product areas are more complete than others. When data or functionality is limited, the interface states that directly instead of presenting a confident result. Expect rough edges while the beta is active.

### 280 · `values` · source line 1705 · `<h3>`

**Issues:** editorial clarity / consistency  
**Before:** Models are under the hood, not on the label.  
**After:** Antaeus uses language models for analysis and drafting.

### 281 · `values` · source line 1706 · `<p>`

**Issues:** private_ontology, personification  
**Before:** Antaeus uses language models to read your workspace and draft what it hands you. It is not the pitch. Every line the system writes goes through the same voice rules the rest of the product does, and you can see what it based a read on.  
**After:** Antaeus uses language models to analyze workspace data and draft text. Model branding is not part of the product pitch. Generated text follows the same writing rules as the rest of Antaeus, and the interface shows the source data behind each analysis.

### 284 · `faq` · source line 1719 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** No. A CRM stores what already happened so somebody can report on it. Antaeus ranks what should happen next and shows the reason it came up first. It also has none of the things a CRM is really bought for — territories, quotas across a team, admin roles, forecasting rollups. If those are your problem, this is not your tool.  
**After:** No. A CRM primarily stores activity and pipeline data for reporting. Antaeus ranks next actions and shows the evidence behind each ranking. It does not include team territories, multi-rep quotas, admin-role management, or forecast rollups. If those are your primary needs, use a CRM.

### 286 · `faq` · source line 1723 · `<p>`

**Issues:** metaphorical_abstraction  
**Before:** An afternoon. It asks for three things only you know: who you really sell to , the companies you're chasing , and where each live deal genuinely stands — who your champion is, who signs, what it's stuck on. Ten live deals is the floor where the picture gets useful; fewer is allowed and the app tells you plainly that it stays thin.  
**After:** About one afternoon. Setup asks for three categories of founder context: your actual target customer, the companies you are pursuing, and the current status of each active deal — including the champion, signer, and unresolved blocker. Antaeus is most useful with at least ten active deals; with fewer, the interface indicates that the analysis is based on limited data.

### 287 · `faq` · source line 1723 · `<p>`

**Issues:** vague_reference  
**Before:** Everything the app can look up — what a company does, how big it is, what just happened to them — it looks up itself. You are never typing something a tool could have found.  
**After:** Antaeus looks up public company information such as company description, size, and recent events. You enter the private sales context the system cannot retrieve.

### 289 · `faq` · source line 1727 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction, vague_reference  
**Before:** Because the part that matters cannot be imported. Why a deal is stuck, what made a win winnable, who actually decides — that lives in your head and nowhere else. We could hide that behind a friendly three-field form and give you something shallow, or ask for it once and give you a system that reads your motion back to you every morning afterwards. We chose the second and we say so up front instead of apologising for it.  
**After:** Because the most important deal context is not available from external systems: why a deal is blocked, why a previous win succeeded, and who actually makes the decision. Antaeus asks you to enter that context once during setup, then uses it in later account, deal, and action recommendations. We prefer asking for the information explicitly rather than producing shallow recommendations from incomplete data.

### 291 · `faq` · source line 1731 · `<p>`

**Issues:** vague_reference  
**Before:** The opposite. It is aimed at the stretch when the founder is still the one selling and the first serious go-to-market hire hasn't started yet or just did. If you already have a sales org, you have different problems and better-suited tools.  
**After:** No. Antaeus is designed for the period when the founder is still selling and the first serious go-to-market hire has not started yet or has just started. An established sales organization has different needs and better-suited tools.

### 293 · `faq` · source line 1735 · `<p>`

**Issues:** personification, vague_reference  
**Before:** Most of them are a prettier database or a chat box bolted to one. The test to apply: open it on a Monday and see whether it tells you the single thing to do first and why that one and not the other thirteen . If it shows you a list and lets you choose, it is a database. Antaeus ranks, shows its reasoning, and lets you disagree with it.  
**After:** Many alternatives are databases with chat interfaces. A useful test is whether the product ranks one next action and explains the evidence for that ranking, or only shows a list for you to sort yourself. Antaeus ranks actions, exposes the reasoning, and lets you disagree with the recommendation.

### 295 · `faq` · source line 1739 · `<p>`

**Issues:** private_ontology  
**Before:** No. It writes the line with you and you send it from wherever you already send mail. It can count what you sent — point it at your calendar and meetings get logged without you typing them twice. It never dials, and it will never take an action toward a buyer on its own.  
**After:** No. Antaeus drafts outreach and call language, but you send messages through your existing email tools. It can record sent outreach and calendar meetings without duplicate data entry. It does not place calls or contact buyers autonomously.

### 297 · `faq` · source line 1743 · `<p>`

**Issues:** private_ontology  
**Before:** It is one question answered honestly: could a person who starts Monday run this motion without you sitting next to them. Antaeus answers it with a state, not a score — from you are the system , through building and inheritable with you there to answer questions , up to hire-ready , and then hire-ready and repeatable once you have won and lost enough to see the pattern. Each state has conditions you can read, and the app says what it would take to reach the next one.  
**After:** Ready to hand off means a new hire can execute the sales process without constant founder guidance. Antaeus reports one of five readiness states: Founder-dependent, Partially documented, Usable with founder support, Hire-ready, and Hire-ready and repeatable. Each state has explicit conditions, and Antaeus shows which requirements remain before the workspace reaches the next state.

### 299 · `faq` · source line 1747 · `<p>`

**Issues:** private_ontology, metaphorical_abstraction, personification  
**Before:** Yes, under the hood — to read your workspace, notice what moved, and draft what it hands you. It is not what we are selling. You are not buying a model; you are buying a system that ranks your revenue work and survives leaving your head. If the interesting part of a tool is which model it runs, it usually has nothing else.  
**After:** Yes. Antaeus uses language models to analyze workspace data, detect changes, and draft text. The product value is the workflow and ranking system, not a particular model. The system documents enough of your sales process that another person can use the workspace without relying on undocumented founder knowledge.

### 301 · `faq` · source line 1751 · `<p>`

**Issues:** editorial clarity / consistency  
**Before:** It stays yours. Download the whole workspace as one file whenever you want, put a copy back, or delete everything behind a type-the-words confirmation. We do not sell it and we do not train public models on your accounts and deals.  
**After:** It stays yours. You can export the full workspace as one file, restore a copy, or delete the workspace after a typed confirmation. Antaeus does not sell your workspace data or use your accounts and deals to train public models.

### 304 · `nav` · source line 1765 · `<h2>`

**Issues:** aphoristic_cadence  
**Before:** Do the hard part once. It plays back every morning.  
**After:** Document the sales process once. Get a prioritized briefing every morning.

### 305 · `nav` · source line 1766 · `<p>`

**Issues:** private_ontology, personification  
**Before:** One afternoon, and the workspace is awake. Tomorrow it hands you the first move.  
**After:** Setup takes about one afternoon. The next morning, Antaeus ranks your highest-priority action and shows why.

### 311 · `footer` · source line 1790 · `<li>`

**Issues:** private_ontology  
**Before:** Every room  
**After:** Every product area

### 312 · `footer` · source line 1791 · `<li>`

**Issues:** personification, vague_reference, ellipsis_or_context_dependence  
**Before:** What it sees  
**After:** Activity monitoring

### 313 · `footer` · source line 1792 · `<li>`

**Issues:** editorial clarity / consistency  
**Before:** Pace and your number  
**After:** Revenue plan and targets

### 323 · `footer` · source line 1810 · `<li>`

**Issues:** ellipsis_or_context_dependence  
**Before:** Where we're honest  
**After:** Beta limitations

### 333 · `footer` · source line 1836 · `<p>`

**Issues:** private_ontology  
**Before:** Antaeus is in private beta; what you see here is the product as it stands today, not a roadmap. Screens throughout this page are real rooms from the app shown with sample data. Benchmark figures in Pace are typical reads for the deal size selected, not a promise about your motion. Photography via Unsplash.  
**After:** Antaeus is in private beta; what you see here is the product as it stands today, not a roadmap. Screens throughout this page show real product areas with sample data. Benchmark figures in Pace are typical ranges for the selected deal size, not a promise about your results. Photography via Unsplash.

## Standalone leaf-string changes

These strings are not safely contained by one of the logical-unit replacements and should be updated wherever they appear in visible UI.

- `You are the system` → `Founder-dependent`
- `Building` → `Partially documented`
- `Inheritable` → `Usable with founder support`
- `Repeatable` → `Hire-ready and repeatable`
- `champion went quiet` → `no champion activity`
- `3 will slip` → `3 deals are at risk`
- `this week if nothing changes` → `this week without a corrective action`
- `quiet 14 days — your worst open deal` → `no buyer activity for 14 days — highest-risk open deal`
- `The week to run` → `Weekly operating plan`
- `after I mark a deal quiet — want me to just take you there?` → `after I flag a deal with no recent activity — open that account automatically?`
- `Every deal you have won rode a dated expansion event. None of the cold ones landed.` → `Every deal you have won followed a dated expansion event. None of the deals without a dated trigger closed.`
- `Two plants announced · no recruiting bench` → `Two plants announced · limited recruiting capacity`
- `Find the pain` → `Identify the problem`
- `Show it is real` → `Confirm business impact`
- `Ask for the meeting` → `Request the meeting`
- `The ask` → `Buyer request`
- `Your line` → `Your position`
- `has not moved since the proposal.` → `has had no recorded progress since the proposal.`
- `went quiet.` → `has had no recent buyer activity.`
- `A revenue operating system built for the handoff` → `A revenue operating system for founder-led sales and the first go-to-market hire`
- `A record of what happened, for whoever asks` → `Activity and pipeline records for reporting`
- `Fast, free, and only in your head` → `Flexible manual tracking that depends on what you document`
