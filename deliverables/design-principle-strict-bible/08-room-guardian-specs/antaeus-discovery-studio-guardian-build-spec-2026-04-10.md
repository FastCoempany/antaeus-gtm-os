# Bulletproof Discovery Studio — Build Spec

## Audit changelog from v1

> **What was already strong:** Terminology glossary, phase structure, category-specific discovery requirements, branching depth mandate, QA checklist, quality-bar language, response-object schema.
>
> **What was missing or underspecified — now fixed in v2:**
>
> 1. **Company identification was incomplete.** The zip contains ~25 logos. v1 only named ~14. v2 adds the missing companies (CADDi, Harpin AI, Job&Talent, Newscatcher, Sybill, Shapr3D, Parable, Shoootin, Duckie) and re-sorts the category buckets accordingly. The framework map is now hard-locked to **8 product-category frameworks + 1 AI-native framework = 9 total**. Sales / Revenue Intelligence, Manufacturing / Supply Chain / Engineering, and Data / Intelligence Infrastructure are now standalone framework families, not optional folds.
> 2. **No conversation-state model.** The Vantive file tracks state (current node, expanded response, completed phases, timer). v1 never specifies that Codex must build a stateful conversation model, not just a script. Fixed.
> 3. **No tempo / compression logic.** The Vantive file has explicit time-pressure handling ("I've got 2 minutes"). v1 mentions "time-starved" once but doesn't mandate a compression track per framework. Fixed.
> 4. **No re-engagement / callback architecture.** v1 has post-call but no structured re-engagement logic for prospects who went dark, ghosted, or asked to reconnect later. Fixed.
> 5. **No hypothesis-driven opener pattern.** Every framework we've built together uses hypothesis-led openers (not open-ended "tell me about your pain"). v1's terminology section mentions "diagnostic question" but never mandates the hypothesis-first pattern. Fixed.
> 6. **No competitive-displacement track.** v1 says "we already have a vendor" is an objection but doesn't require a structured displacement discovery path (what they use, what's working, what's not, switching cost, contract timing). Fixed.
> 7. **No signal-capture layer.** The framework should tell the rep what to listen for — verbal and behavioral signals that indicate real pain, fake politeness, buying readiness, or stalling. v1 mentions this in the "additional instructions" appendix but not in the core spec. Now mandatory.
> 8. **No escalation / executive-sponsor track.** When discovery reveals the contact can't move this forward, there's no structured path for how to get above them without burning the relationship. Fixed.
> 9. **No discovery-to-demo bridge.** Most discovery calls end with a next step that is a demo or deeper technical session. The framework should specify what must be true before offering a demo, what the demo setup message should contain, and how to frame the demo as a continuation of discovery rather than a product tour. Fixed.
> 10. **No multi-call discovery arc.** Enterprise deals rarely close discovery in one call. v1 treats the framework as a single-call structure. v2 adds a multi-session discovery architecture with session-over-session progression logic. Fixed.
> 11. **No "they ask YOU questions" handling.** Prospects ask questions mid-discovery (pricing, timeline, competitors, references). v1 has no structured handling for inbound prospect questions. Fixed.
> 12. **No category-specific disqualification criteria.** v1 says "include disqualifiers" but doesn't specify what disqualifies in each category. Fixed.
> 13. **Weak enforcement language.** v1 says "must" but doesn't include failure-mode examples or anti-pattern callouts inline. v2 adds explicit anti-patterns next to each requirement so Codex knows what NOT to produce.
> 14. **Missing companies: Sybill and Harpin AI justify a Sales Intelligence / Revenue Workflow category. CADDi and Shapr3D justify a Manufacturing / Supply Chain / Engineering category. Newscatcher justifies a standalone Data / Intelligence Infrastructure category.** These were invisible in v1's 5-bucket scheme. v2 adds them as hard requirements, not optional extensions.

---

## Working product-category buckets (revised)

Based on full identification of all logos in the uploaded zip:

### Companies identified

| Company | Category |
|---------|----------|
| Harvey | Legal |
| Clearbrief | Legal |
| Filevine | Legal |
| Smokeball | Legal |
| Moonhub | Recruiting / Talent |
| HeyMilo | Recruiting / Talent |
| Great Place to Work | Recruiting / Talent |
| Job&Talent | Recruiting / Talent |
| Pendo | Product / UX / Enablement |
| Rally UXR | Product / UX / Enablement |
| Scribe | Product / UX / Enablement |
| Parable | Product / UX / Enablement |
| OpenGov | GovTech / Compliance |
| k-ID | GovTech / Compliance |
| Lorikeet | Customer Support / Operations |
| Duckie | Customer Support / Operations |
| Sybill | Sales / Revenue Intelligence |
| Harpin AI | Sales / Revenue Intelligence |
| Newscatcher | Data / Intelligence Infrastructure |
| CADDi | Manufacturing / Supply Chain |
| Shapr3D | Manufacturing / Supply Chain / Engineering |
| Shoootin | Vertical Workflow (Real Estate Tech) |

### Revised category buckets

1. **Legal / Legal Ops / Law Workflow** — Harvey, Clearbrief, Filevine, Smokeball
2. **Recruiting / Talent / HR / People Workflow** — Moonhub, HeyMilo, Great Place to Work, Job&Talent
3. **Product / UX / Enablement / Knowledge Workflow** — Pendo, Rally UXR, Scribe, Parable
4. **GovTech / Compliance / Public-Sector Operations / Trust & Safety** — OpenGov, k-ID
5. **Customer Support / Operations / Vertical Workflow Software** — Lorikeet, Duckie, Shoootin (dominant motion is operational workflow)
6. **Sales / Revenue Intelligence** — Sybill, Harpin AI, with external discovery logic anchored by Actively AI and Attention
7. **Manufacturing / Supply Chain / Engineering** — CADDi, Shapr3D, with external discovery logic anchored by Vantive and Craft
8. **Data / Intelligence Infrastructure** — Newscatcher
9. **AI-Native Buyer Discovery Framework** — standalone cross-category framework

If a company clearly spans multiple buckets, choose the dominant buying motion rather than forcing precision theater.

> **Hard lock on framework count:** Discovery Studio is now locked to **9 total frameworks**. Sales / Revenue Intelligence, Manufacturing / Supply Chain / Engineering, and Data / Intelligence Infrastructure are standalone frameworks. They may not be folded into Product / Enablement, Operations, or AI-Native.

> **Hard lock on operating mode:** Discovery Studio is now locked to **on-call primary** behavior. It is first a live-call operating surface, second a prep surface, and third a post-call surface. The rep must be able to move fluidly through the active framework while the conversation is happening.

> **What on-call primary means in practice:** The room must be glanceable, speakable, branchable, interruption-safe, recovery-friendly, resumable, and compression-ready. If a UI element helps explain the framework but slows down live call use, it is wrong.

> **Hard control references now locked:** Discovery Studio must now use the mirrored Lumana reference files as the concrete operating standard for live-call behavior:
> - `07-control-artifacts/lumana-discovery-command-center-reference-2026-04-10.html`
> - `07-control-artifacts/lumana-discovery-framework-reference-2026-04-10.html`
>
> Antaeus does not need to copy their visual palette, exact layout, or security-industry content.
> It must match or exceed their operational discipline under call pressure.
>
> **Hard room contract now locked:** Discovery Studio must now also inherit the explicit room-level operating contract in:
> - `08-room-guardian-specs/antaeus-discovery-studio-strict-room-contract-2026-04-10.md`
>
> That contract locks the vertical collapsible segment model, the global recovery rails, the fork/track model, the segment spine, and the room's handoff obligations. The live room may not diverge from it.

---

## Terminology to use consistently

Use this vocabulary throughout the build. Do not drift into vague phrasing. If Codex uses a synonym, it must map back to one of these terms.

### Structural terms

- **Framework**: the full discovery system for one product category — not a question list, not a script, not a playbook page
- **Node**: one stage or state in the framework. Every node has an ID, a phase assignment, an objective, scripted language, coaching rationale, and outbound response branches
- **Branch**: one prospect-response path out of a node
- **Fork**: a major branching point with materially different downstream logic. A fork is not cosmetic. If two branches lead to the same next node with the same language, that is not a fork — it is decoration
- **Track**: a sustained alternate path through the framework triggered by prospect disposition (engaged track, guarded track, hostile track, deflection track, compression track). Tracks are not single-node detours — they change the tone, question design, burden of proof, and close strategy for the remainder of the call
- **Recovery path**: the route used to regain control after resistance, confusion, or hostility
- **Dead-end path**: a path that intentionally exits the conversation or defers it (with specific re-engagement logic)
- **Dependency**: a condition (something learned, something the prospect said, something about their org) that changes what should be asked or said next
- **Progression rule**: the condition required to move to the next node. Not just "they answered" — what specifically must be true
- **Exit criterion**: the condition that ends the call, parks the deal, or routes to follow-up. Must include what to capture before exiting
- **Post-call motion**: what happens after the live conversation ends — artifacts, CRM fields, follow-up timing, re-engagement triggers
- **Conversation state**: the runtime data model that tracks which node the rep is in, which branches have been expanded, which phases are complete, what has been learned, and what time constraints exist

### Discovery terms

- **Discovery objective**: what must be learned at that stage — not "understand the pain" but "identify who owns the budget, what the approval path looks like, and whether this is funded or unfunded"
- **Hypothesis**: the specific, falsifiable belief the rep brings into the call about the prospect's situation, based on pre-call research. Discovery confirms, refines, or kills the hypothesis. The rep does NOT open with "tell me about your challenges" — the rep opens with "based on what I've seen, I believe your team is dealing with X, and the cost of that is Y. Am I wrong?"
- **Decision architecture**: buyer roles, approval logic, budget authority, procurement path, legal/security/compliance involvement, executive sponsor requirements, and committee dynamics
- **Pain topology**: not just the pain, but where it lives (which function, which workflow, which persona), who feels it (vs who owns it vs who can fix it), how often it occurs, what it breaks downstream, and what the blast radius looks like when it goes wrong
- **Current-state method**: how they solve it now — manually, with spreadsheets, with an incumbent tool, with an internal build, with a workaround, or by ignoring it
- **Trigger event**: the event that created urgency or attention — a failure, a leadership change, a regulatory deadline, a competitor move, a board mandate, a budget cycle, a hiring surge, a customer complaint pattern
- **Consequence map**: operational, financial, regulatory, reputational, career, or political cost of the current state — quantified where possible, estimated where not
- **Proof threshold**: what evidence the buyer would need to believe the solution is safe and real. Different buyers have different thresholds: a pilot, a benchmark, a case study, an architecture review, a reference call, a security audit, a legal review, a live test on their own data
- **Adoption surface**: who has to use it, change behavior, approve it, train on it, or defend it internally — and what their resistance pattern looks like
- **Switching cost**: what it takes to move off the current method — data migration, retraining, contract termination, political capital, sunk-cost psychology
- **Disqualifier**: a fact pattern that should stop the rep from continuing the same motion — wrong ICP, no budget authority, no urgency, active competitor lock-in with long contract, fundamental product misfit

### Conversation-control terms

- **Opener**: first line after connect — must earn permission to continue, not pitch
- **Permission bridge**: short move that earns the next 20–30 seconds without giving the prospect a reason to hang up
- **Hypothesis lead**: the opening hypothesis statement that demonstrates research and creates a reaction — agreement, correction, or pushback. All three are useful
- **Diagnostic question**: question asked to reveal how the business actually works — org structure, workflow, tooling, ownership
- **Depth question**: question that sharpens scope, frequency, owner, cost, or risk on a topic already surfaced
- **Challenge question**: respectful question that tests a weak or vague answer — "you said it's fine, but help me understand: when [specific scenario] happens, what does the team actually do?"
- **Reframe**: the line that changes the prospect's frame without arguing — repositions the problem, the comparison set, or the cost of inaction
- **Counter**: the exact response to a prospect statement — not a vague principle, the actual words
- **Counter-why**: why that counter works psychologically or commercially — what it does to the conversation dynamic
- **Signal**: a verbal or behavioral indicator from the prospect that reveals their real state — buying readiness, fake politeness, genuine skepticism, time pressure, internal politics, personal career risk. The framework must tell the rep what to listen for, not just what to say
- **Compression move**: a deliberate shortening of the framework when the prospect signals time pressure — what to skip, what to compress, what to prioritize, and how to secure a follow-up in 60 seconds
- **Multi-thread move**: language used to widen the stakeholder map — identifying other decision-makers, influencers, blockers, and downstream approvers without making the current contact feel bypassed
- **Escalation move**: language used to move above the current contact to an executive sponsor, done in a way that positions the current contact as the champion rather than the obstacle
- **Next-step lock**: language used to secure a real next action — not "let's stay in touch" but a specific date, time, attendees, and agenda
- **Inbound question handler**: structured responses for when the prospect asks YOU questions mid-discovery (pricing, timeline, competitors, references, "how does it work"). The framework must specify whether to answer directly, defer, trade for information, or bridge back to discovery — depending on what stage you're in and what you still need to learn

---

## Non-negotiables for a bulletproof discovery framework

Every framework must include all of the following. If any are missing, the build is incomplete.

### 0. Live-call usability

The framework is not complete unless it can be used fluidly during a real conversation.

Every framework and every Discovery Studio surface built from it must support:

- fast glanceability under live call pressure
- exact speakable language, not essay text
- one-click branch movement when the buyer changes direction
- visible interruption recovery if the buyer objects, deflects, or asks a question
- compression mode when the buyer says they only have a minute or two
- clear resumption state so the rep always knows where they are in the framework
- next-step locking while still in the flow of the call
- a visible call clock with urgency state
- phase tempo guidance with explicit jump rules when the rep is over pace
- a true essentials-only mode, not just a badge saying "compressed"
- always-reachable skip-ahead handlers for demo, pricing, send-info, wrong-person, and time-pressure moments
- always-reachable support intelligence for proof, deployment, security, and category anchors
- explicit hold-vs-deploy-now value tie-back discipline so the rep does not spray value before earning it

**Anti-pattern:** Do not build Discovery Studio as a beautiful framework viewer that becomes harder to use once the call starts. If the rep cannot drive the conversation from the screen in real time, the framework is operationally incomplete.

### 0A. On-call control laws now derived from the Lumana references

The Discovery Studio build must now reflect the following operating laws:

- The room must expose tempo, not hide it.
- The room must let the rep jump without losing narrative control.
- The room must let the rep recover from inbound buyer questions without leaving the main conversation engine.
- The room must preserve a distinction between:
  - support truth
  - learned truth
  - deploy-now truth
- The room must keep a support dossier reachable without letting that dossier become the primary canvas.
- The room must make compression mode a first-class path, not an afterthought.
- The room must allow the rep to resume after interruption with one glance.

**Anti-pattern:** Do not treat these as optional "nice to have" controls. They are part of the framework standard itself.

### 1. Pre-call architecture

For each category framework, include:

- ICP definition with firmographic, technographic, and behavioral qualifiers
- Primary personas (the person most likely to take the call)
- Secondary personas (the person who gets pulled in)
- Internal champion patterns (what makes someone willing to sponsor this internally)
- Likely economic buyer patterns (who actually controls the budget)
- Likely blocker patterns (who kills deals in this category and why)
- Likely technical evaluator patterns (who runs the proof-of-concept or security review)
- Likely legal / procurement / security patterns specific to the category
- Probable triggers that create urgency (at least 5 per category, not generic)
- Probable reasons they're looking now vs. reasons they looked before and didn't buy
- Probable status quo alternatives (manual, incumbent software, internal build, ignoring it)
- Probable incumbent software and manual workarounds — named where possible
- Top 10 likely objections with pre-built counters
- Top 10 likely skepticism statements (distinct from objections — these are belief challenges, not logistical pushbacks)
- Top 10 likely brush-offs with recovery language
- Category-specific disqualifiers (not generic — what specifically disqualifies in THIS category)
- Credibility anchors relevant to the category (not company-specific — category-native proof points)
- Pre-call hypothesis template: a fill-in-the-blank structure for the hypothesis the rep should bring into the call

**Anti-pattern:** Do not produce a pre-call section that is just a list of personas with job titles. The pre-call must include behavioral and political intelligence — who gets blamed when the current state fails, who is privately threatened by the change, who benefits from the status quo.

### 2. Phase structure

Each framework must contain, at minimum:

| Phase | Purpose |
|-------|---------|
| `PREP` | Pre-call research, hypothesis formation, account intelligence |
| `OPEN` | First 10 seconds — earn permission to continue |
| `HYPOTHESIS LEAD` | Deliver the hypothesis — create a reaction |
| `DIAGNOSTIC DISCOVERY` | Understand how the business actually works today |
| `DEPTH / EXPANSION` | Sharpen pain, quantify cost, identify owners and blockers |
| `STAKEHOLDER MAPPING` | Multi-thread — identify decision architecture |
| `VALUE REFRAME` | Reposition the problem and the cost of inaction |
| `OBJECTION / RESISTANCE` | Handle live objections, skepticism, and brush-offs |
| `COMPETITIVE DISPLACEMENT` | If incumbent exists — structured displacement discovery |
| `NEXT STEP / CLOSE` | Secure a specific, calendared next action |
| `LOCK / CONFIRM` | Lock logistics — attendees, agenda, security/visitor process |
| `VOICEMAIL` | Under 30 seconds — curiosity, not a pitch |
| `POST-CALL` | Artifacts, CRM capture, follow-up timing, re-engagement triggers |
| `RE-ENGAGEMENT` | Callback logic for ghosted, delayed, or "call me later" prospects |

Codex may add phases but may not collapse this into a simplistic 3-step flow.

**Anti-pattern:** Do not produce a phase structure where DISCOVERY is one giant node with 20 questions. Break discovery into DIAGNOSTIC (how things work) and DEPTH (how bad it is, who cares, what it costs). These are different conversational modes.

### 3. Branching depth

Each framework must fork **at least 4 times** in a meaningful way. Not cosmetic forks. Real forks where the downstream language, questions, and close strategy materially change.

Minimum fork classes (must be present in every framework):

| Fork class | Disposition | What changes downstream |
|-----------|-------------|------------------------|
| **Engaged / curious** | Leaning in, asking questions, sharing details | Full discovery depth, ambitious close, multi-thread |
| **Guarded / vague / not forthcoming** | Short answers, non-committal, won't share details | Softer questions, more hypothesis-led, trade information to earn information, lower-commitment close |
| **Skeptical / combative / resistant** | Challenging claims, expressing doubt, testing credibility | Credibility-first, evidence-heavy, challenge-back with respect, earn-the-right-to-continue close |
| **Deflecting / timing / send-info / wrong-person** | Trying to exit without engaging | Compression, redirect, referral capture, nurture routing |
| **Time-pressured / compression** | "I have 2 minutes" / "make it quick" | Compressed hypothesis + one question + close in 60 seconds |

Each fork must produce different downstream nodes — not the same node with a softer adjective.

**Anti-pattern:** Do not produce branching where every path converges to the same CLOSE node with the same close language. If a prospect was combative for 5 minutes, the close must acknowledge that dynamic. If a prospect was engaged and sharing freely, the close should be more ambitious.

### 4. Response handling

Every meaningful branch must include:

| Field | What it is |
|-------|-----------|
| `label` | What the prospect actually says (in their words, in quotes) |
| `tone` | green / amber / red classification |
| `hint` | One-line coaching note for the rep on what this response means |
| `signal` | What this response reveals about the prospect's real state (buying readiness, political position, knowledge level, urgency) |
| `counter` | The exact words the rep says back — not a principle, the actual sentence |
| `counterWhy` | Why that counter works — what it does to the conversation dynamic |
| `whatToLearnNext` | What the rep should be trying to surface after delivering the counter |
| `fallbackIfStillBlocked` | What to say if the prospect resists the counter too — the second-level recovery |
| `next` | Which node ID comes next |

**Anti-pattern:** Do not produce response handling where every counter is a variation of "that's a great point, let me explain..." Counters must be specific to what was said, demonstrate that the rep heard the prospect, and create a reason to continue.

### 5. Question design

The frameworks must not be a pile of generic questions. For each discovery phase, include:

| Version | When to use it |
|---------|---------------|
| **Primary question** | Default — prospect is engaged and forthcoming |
| **Hypothesis-led version** | Lead with what you believe is true and ask them to confirm or correct |
| **Backup version** | If the primary wording doesn't land or gets a blank stare |
| **Direct version** | If the buyer is blunt and wants efficiency |
| **Softer version** | If the buyer is guarded and needs to feel safe |
| **Challenge version** | If the buyer gives a vague or self-protective answer |
| **Follow-up depth questions** | Sharpening questions that reveal owner, frequency, cost, consequence, urgency, dependencies, internal politics, and career risk |

**Anti-pattern:** Do not produce questions that are just "tell me about X" or "what are your biggest challenges with Y." Every question must be specific enough that the rep couldn't accidentally ask it to the wrong persona or the wrong industry.

### 6. Hidden buyer dynamics

Every category framework must explicitly pull for:

- Who owns the problem vs who feels the pain vs who can fix it
- Who can approve budget vs who can block motion vs who can accelerate it
- Whether this is mission-critical, operationally painful, or merely nice-to-have
- What happens if nothing changes — in 3 months, 6 months, 12 months
- Why the status quo remains in place despite the pain (inertia, politics, switching cost, lack of sponsorship, competing priorities)
- What prior attempts have been made and why they failed
- What proof would be required to move forward — and who defines "proof"
- What downstream function gets dragged in later (IT, security, legal, procurement, finance, executive committee)
- What implementation fear exists — and whether it's rational or inherited from a prior failed project
- What career risk the buyer feels in saying yes — and what career risk they feel in saying no
- Whether there's an internal champion who will carry this when the rep isn't in the room — and whether that champion has organizational credibility

**Anti-pattern:** Do not produce a framework that only discovers pain and ignores politics. Pain without political mapping produces great first calls and dead pipelines.

### 7. Resistance coverage

Every framework must explicitly cover these objections with full counter + counterWhy + fallback:

| Objection | Category-specific requirement |
|-----------|------------------------------|
| "We already do this" | Must distinguish between "we have a tool" and "we've solved the problem" |
| "We have a vendor / internal tool / process" | Must trigger competitive-displacement track |
| "Send me something" | Must upgrade from dead-end to warm follow-up with scheduled callback |
| "Not the right person" | Must capture referral and position the current contact as internal sponsor |
| "Bad timing" | Must distinguish genuine bad timing from brush-off, and plant urgency seeds |
| "No budget" | Must distinguish unfunded vs. unbudgeted vs. "I don't control budget" |
| "This is low priority" | Must surface what IS high priority and whether this connects to it |
| "Sounds complicated" | Must de-risk implementation and reframe from project to outcome |
| "Security / legal / compliance will block this" | Must offer to engage those stakeholders directly and provide pre-built security artifacts |
| "AI can't be trusted" (where relevant) | Must distinguish between informed skepticism and reflexive fear |
| "We tried something like this before" | Must diagnose what was tried, why it failed, and how this is architecturally different |
| "We're too early / too small / too bespoke / too regulated" | Category-dependent — must have category-specific counter |
| "What does it cost?" | Must defer responsibly, anchor on cost-of-status-quo, and use pricing as a reason for the next meeting |
| "Who are your customers?" / "Do you have references?" | Must provide category-specific credibility without handing over the conversation |
| "How is this different from [competitor]?" | Must differentiate on architecture / outcome, not feature checklist |

**Anti-pattern:** Do not produce objection handling that is just reassurance ("I understand your concern, let me assure you..."). Every objection handler must include a reframe that changes what the prospect is evaluating.

### 8. Inbound prospect question handling

During discovery, prospects ask questions. The framework must include structured handling for:

| Prospect question | Framework response |
|-------------------|-------------------|
| "What does it cost?" | Depends on discovery stage. Early: trade for information. Late: range + reason for next meeting |
| "How long does implementation take?" | Answer honestly, then bridge to what determines timeline (their side, not yours) |
| "Who else uses this?" | Provide 2-3 category-relevant references, then bridge back to their situation |
| "How does it actually work?" | Give the 30-second architecture, then ask what part matters most to them (this reveals their real concern) |
| "Can you do X?" | Confirm or qualify, then ask why X matters — the feature question always hides a workflow question |
| "What makes you different?" | Differentiate on one architectural or outcome dimension, not a feature list, then ask what they're comparing against |

For each, specify: answer threshold (how much to say), bridge language (how to get back to discovery), and signal interpretation (what the question reveals about where they are in their process).

### 9. Signal-capture layer

Every framework must include a **signal dictionary** — a structured list of verbal and behavioral signals the rep should listen for, organized by what they indicate:

| Signal category | Examples | What it means |
|----------------|----------|---------------|
| **Buying readiness** | Asks about pricing, timeline, implementation, references; uses "we" and "when" instead of "I" and "if" | They're past discovery — accelerate toward close |
| **Fake politeness** | "That's interesting," no follow-up questions, short answers, no details shared | They're being polite, not interested — challenge gently or exit gracefully |
| **Real pain** | Specific stories, named people, quantified costs, emotional language, unsolicited detail | This is live — go deeper, quantify, map the blast radius |
| **Internal politics** | "I'd need to run this by..." / "My VP would never..." / "We tried this before and..." | There's a political obstacle — map the decision architecture now |
| **Stall** | "Let me think about it" / "Follow up next quarter" / no specific next step | They're not saying no but they're not moving — create urgency or park with re-engagement trigger |
| **Champion behavior** | Asks how to present this internally, requests shareable artifacts, names other stakeholders proactively | They want to move — arm them with ammunition |

### 10. Post-call operating layer

Every framework must include:

- What to send if they asked for info (not generic — category-specific artifact)
- What to send if they booked a meeting (confirmation + pre-read + agenda)
- What to send if they gave a referral (email to new contact referencing the referral)
- What to send if they hard-passed (short, dignified, one-email-only with trigger seeds)
- Callback / follow-up timing rules (specific to disposition — not "follow up in a week")
- What artifact should be generated after the call (one-pager, risk brief, ROI estimate, competitive comparison)
- What fields should be captured in CRM / notes (category-specific, not generic)
- What next-step language should have been secured live
- Re-engagement triggers — specific events or conditions that should trigger a callback (regulatory deadline, leadership change, competitor failure, contract expiry, budget cycle)

### 11. Multi-session discovery architecture

Enterprise discovery rarely closes in one call. Each framework must include:

| Session | Objective | Exit condition |
|---------|-----------|----------------|
| **Discovery 1** | Validate hypothesis, map pain topology, identify decision architecture, assess urgency | Must know: is this real, who cares, what's the current state, is there urgency |
| **Discovery 2 / Technical** | Deeper workflow mapping, proof-threshold identification, stakeholder expansion, competitive landscape | Must know: what proof they need, who else needs to be in the room, what the implementation path looks like |
| **Demo / Proof** | Not a product tour — a structured proof session that maps to the pain surfaced in discovery | Must know: does the product actually solve what they described, and do they believe it |
| **Business case / Close prep** | ROI construction, procurement path, timeline, contract structure | Must know: what the approval process looks like, what the decision criteria are, who signs |

The framework must specify what must be true before advancing from one session to the next, and what to do if the required information hasn't been gathered.

### 12. Discovery-to-demo bridge

When discovery ends with a demo as the next step, the framework must specify:

- What must be learned in discovery BEFORE offering a demo (minimum qualification criteria)
- How to frame the demo as "continuing the conversation with your data/workflow" rather than a product tour
- What the demo setup message should contain (agenda tied to their specific pain, attendee request, pre-read)
- What to do if they ask for a demo before discovery is complete (trade: "happy to show you — to make sure I show you the right thing, can I ask two more questions first?")

### 13. UI and data structure requirements

The output should not be just prose. It should be structured enough to support a working interactive HTML framework that matches the live-call capability of the mirrored Lumana references and the earlier Vantive-Lockheed benchmark.

**Conversation state model** (must be tracked at runtime):

```
{
  currentNode: string,          // which node the rep is on
  currentTrack: string,         // engaged | guarded | hostile | deflecting | compressed
  activePhase: number,          // which phase is live right now
  completedPhases: Set<number>, // which phases are done
  expandedResponse: string,     // which response is currently expanded
  timerRunning: boolean,        // call timer state
  timerStart: number,           // when the timer started
  elapsedSeconds: number,       // current call age
  phaseDeadlineState: string,   // on-pace | tight | over
  compressionMode: boolean,     // whether essentials-only mode is active
  essentialsOnly: boolean,      // whether noncritical nodes are hidden
  skipAheadContext: string,     // current recovery context, if any
  valueTiebackState: string,    // hold | deploy-now | null
  supportPanelOpen: boolean,    // whether the support dossier is visible
  learnedFacts: {               // what has been discovered so far
    painIdentified: boolean,
    painOwnerIdentified: boolean,
    budgetAuthorityIdentified: boolean,
    currentStateMethodIdentified: boolean,
    triggerEventIdentified: boolean,
    proofThresholdIdentified: boolean,
    competitorIdentified: boolean,
    nextStepLocked: boolean
  },
  callDisposition: string       // in-progress | meeting-booked | referral | nurture | disqualified | hard-pass
}
```

**Additional live-call control requirements now hard-locked:**

- Every framework must define phase tempo checkpoints and what to skip if the rep is behind.
- Every framework must define its essential-node set for compression mode.
- Every framework must define skip-ahead handlers for:
  - demo request
  - pricing question
  - send me info
  - wrong person
  - bad timing
- Every framework must define what support intelligence is always reachable during the call.
- Every framework must define what value should be held until later versus deployed immediately.

**Node schema:**

```
{
  id: string,
  phase: number,
  title: string,
  subtitle: string,
  objective: string,           // what must be learned at this node
  hypothesis: string,          // the hypothesis being tested (if applicable)
  script: string,              // exact language — with <em> for variable insertion points
  coaching: string,            // why this works, what to watch for, what NOT to do
  questions: {
    primary: string,
    hypothesisLed: string,
    backup: string,
    direct: string,
    softer: string,
    challenge: string,
    depthFollowUps: string[]
  },
  signals: string[],           // what to listen for at this node
  watchouts: string[],         // common mistakes reps make at this node
  dependencies: string[],      // conditions that change what happens here
  progressionRule: string,     // what must be true to advance
  responses: Response[]
}
```

**Response schema:**

```
{
  id: string,
  label: string,               // prospect's words in quotes
  tone: 'green' | 'amber' | 'red',
  hint: string,                // one-line coaching
  signal: string,              // what this response reveals
  counter: string,             // exact rep language
  counterWhy: string,          // why it works
  whatToLearnNext: string,     // discovery objective after counter
  fallbackIfStillBlocked: string, // second-level recovery language
  next: string                 // next node ID
}
```

**Objection library schema** (global, accessible from any node via sidebar):

```
{
  key: string,
  label: string,
  response: string,
  why: string,
  categorySpecificVariant: string  // how this objection plays differently in this category
}
```

---

## Category-specific discovery requirements

### 1. Legal / Legal Ops / Law Workflow

**Companies:** Harvey, Clearbrief, Filevine, Smokeball

**Discovery must pull for:**
- Matter volume and matter types (litigation, transactional, regulatory, IP, employment)
- Bottlenecks in drafting, review, research, document management, or litigation workflows
- Who bears turnaround pressure (partner, associate, paralegal, client)
- Risk tolerance for hallucination or error (zero-tolerance vs. draft-quality acceptable)
- Confidentiality / privilege concerns and data residency requirements
- Human review requirements and where the human-in-the-loop sits
- Proof threshold for adoption (pilot on non-sensitive matters? benchmark against current output?)
- Whether the buyer cares most about speed, consistency, headcount leverage, risk reduction, or client outcomes
- Incumbent systems: DMS (iManage, NetDocuments), CLM (Ironclad, Agiloft), matter management, legal research (Westlaw, Lexis), document review (Relativity), practice management (Clio, PracticePanther)
- Partner vs associate vs legal ops vs GC dynamics — who benefits, who feels threatened
- Billable-hour politics: does efficiency help or hurt revenue?
- Alternative fee arrangements and how they change the incentive structure

**Category-specific forks:**
- Law firm vs in-house legal department (completely different buying motions)
- High-volume commodity workflow vs bespoke/complex workflow
- AI skepticism ("hallucination risk is unacceptable") vs workflow urgency ("we need this yesterday")
- "Our lawyers won't use it" (adoption) vs "Show me the ROI" (business case)

**Category-specific disqualifiers:**
- Firm or department too small to justify the price point
- No workflow pain — current process is genuinely adequate
- Regulatory or ethical prohibition on AI-assisted legal work in their jurisdiction
- Active, long-term contract with a directly competitive incumbent
- Decision-maker is a senior partner who views technology as threatening to the apprenticeship model

### 2. Recruiting / Talent / HR / People Workflow

**Companies:** Moonhub, HeyMilo, Great Place to Work, Job&Talent

**Discovery must pull for:**
- Hiring volume, velocity, and role criticality
- Bottlenecks in sourcing, screening, scheduling, interviewing, evaluation, and closing
- Recruiter pain vs hiring-manager pain (these are different problems)
- TA stack fragmentation (ATS, CRM, sourcing tools, scheduling, assessment, HRIS)
- Evaluation consistency / interviewer quality / calibration gaps
- Time-to-fill pressure and offer-acceptance rates
- Candidate drop-off points and candidate-experience concerns
- DEI / fairness / bias / compliance concerns (EEOC, OFCCP, EU AI Act)
- Employer brand impact on hiring funnel
- Proof threshold for replacing or augmenting human judgment in hiring decisions
- Contingent / temp / hourly vs salaried workforce dynamics (relevant for Job&Talent type)
- Agency spend and whether internal TA can absorb volume

**Category-specific forks:**
- Founder-led / no-TA hiring vs mature TA organization
- Recruiter pain (sourcing, admin, coordination) vs hiring-manager pain (quality, speed, calibration)
- Sourcing bottleneck vs interview/evaluation bottleneck vs closing bottleneck
- AI interviewer / AI recruiter trust objections ("you can't automate human judgment")

**Category-specific disqualifiers:**
- Hiring volume too low to justify the investment
- ATS contract lock-in with 2+ years remaining
- Active hiring freeze with no timeline for resumption
- Cultural opposition to AI in hiring from CHRO or CEO level
- Regulatory environment that prohibits automated hiring decisions (NYC Local Law 144, EU AI Act high-risk classification)

### 3. Product / UX / Enablement / Knowledge Workflow

**Companies:** Pendo, Rally UXR, Scribe, Parable

**Discovery must pull for:**
- Where insight, documentation, or adoption breaks down today
- Whether the core pain is research/discovery, synthesis, onboarding, training, enablement, or product adoption measurement
- What gets lost between research → product → engineering → GTM → customer-facing teams
- Manual documentation burden and who bears it
- Feature adoption visibility and how product decisions get validated
- Stakeholder fragmentation across product, CS, enablement, RevOps, design, engineering
- Whether the buyer cares most about speed, consistency, visibility, adoption lift, or reducing tribal knowledge dependency
- How customer feedback reaches product teams today
- Whether self-serve adoption is a priority or whether they're sales-led
- Internal content sprawl and knowledge fragmentation

**Category-specific forks:**
- Product-led org vs sales-led org (changes the buying motion and the urgency)
- Research pain vs documentation/training pain vs adoption/analytics pain
- Fragmented tooling ("we have 6 tools that don't talk") vs low process maturity ("we don't do this at all")
- "We already have docs/wikis/knowledge bases" vs "Nobody uses what we create"

**Category-specific disqualifiers:**
- Organization too small — one PM who does everything and doesn't need tooling
- No measurable product-adoption or enablement KPI — they can't prove ROI even if the tool works
- Active, well-adopted incumbent that the team doesn't want to switch from
- No cross-functional stakeholder who cares — product team might want it but enablement and CS don't participate

### 4. GovTech / Compliance / Public-Sector Operations / Trust & Safety

**Companies:** OpenGov, k-ID

**Discovery must pull for:**
- Workflow complexity and regulatory burden
- Audit exposure and consequences of non-compliance
- Procurement and buying friction (RFP requirements, compliance certifications, FedRAMP/StateRAMP, sole-source thresholds)
- Data sensitivity and access controls (CJIS, FERPA, HIPAA, COPPA for k-ID)
- Stakeholder sprawl (elected officials, department heads, IT, legal, procurement, citizens/public)
- Reporting burden and manual data aggregation
- Consequences of non-compliance — fines, lawsuits, public embarrassment, loss of funding
- Public accountability and reputational pressure
- Manual and legacy-process drag (paper forms, spreadsheets, siloed databases)
- Integration and security fears with existing government IT infrastructure
- Budget cycle timing and fiscal year constraints
- Whether the champion is an administrator (operational pain) or an elected official (political pain)

**Category-specific forks:**
- Public-sector buyer (government entity) vs adjacent commercial compliance buyer (private company dealing with public-sector regulations)
- Compliance-driven pain ("we'll get fined/audited") vs workflow-driven pain ("this takes too long")
- Frontline user pain (the person doing the work) vs administrator pain (the person reporting on the work)
- "Too much red tape to buy anything" (procurement friction) vs "We need this yesterday" (urgent operational need)

**Category-specific disqualifiers:**
- No budget allocation and outside the budget cycle window with no emergency procurement path
- Requires certifications (FedRAMP, StateRAMP, SOC 2 Type II) the vendor doesn't have
- Active RFP process already underway with another vendor shortlisted
- Political leadership change imminent — new administration may have different priorities
- Data residency or sovereignty requirements that can't be met

### 5. Customer Support / Operations / Vertical Workflow Software

**Companies:** Lorikeet, Duckie, Shoootin

**Discovery must pull for:**
- Ticket or workflow volume and growth trajectory
- Repeatability vs exception-heavy work
- Handle time / resolution time / first-contact resolution / escalation patterns
- Staffing pain, training burden, and agent ramp time
- Knowledge fragmentation (where does the institutional knowledge live?)
- Accuracy and QA concerns — what happens when it's wrong
- How much of the work is rules-based (automatable) vs judgment-based (assist-able)
- Who owns the process vs who lives in the queue
- Integration burden with current systems (CRM, ticketing, knowledge base, internal tools)
- Customer experience sensitivity — how much does the buyer care about CX vs efficiency
- Seasonal or cyclical volume patterns
- Whether the pain is inbound support, internal operations, or vertical-specific workflow (e.g., real estate scheduling for Shoootin)

**Category-specific forks:**
- Support leader (owns CSAT, NPS, resolution time) vs operations leader (owns cost, throughput, headcount)
- Efficiency pain ("it costs too much / takes too long") vs quality pain ("the answers are wrong / inconsistent")
- High-volume repetitive work (automatable) vs high-stakes exception work (needs human judgment)
- "We need automation" vs "We can't break the customer experience"

**Category-specific disqualifiers:**
- Volume too low to justify the investment (under ~500 tickets/month for support automation)
- No measurable KPI ownership — nobody is accountable for handle time, resolution, or CSAT
- Active, working incumbent with high satisfaction and low switching motivation
- Workflow is too unstructured or exception-heavy for the product category to handle
- Integration requirements that are technically infeasible with current product

---

### 6. Sales / Revenue Intelligence

**Primary corpus companies:** Sybill, Harpin AI  
**External discovery-logic anchors:** Actively AI, Attention

This framework exists because sales-intelligence AI is not just enablement wallpaper. It changes how revenue teams decide where to spend time, how managers inspect pipeline, how reps capture and use signal, and how forecast credibility is earned.

**Discovery must pull for:**
- Whether the pain is account prioritization, pipeline inspection, call intelligence, follow-up execution, CRM hygiene, forecast credibility, or rep coaching
- Who owns the problem: founder, VP Sales, RevOps, frontline manager, enablement, or revenue systems
- Whether the team lacks signal, lacks discipline, lacks coverage, or lacks conversion
- What data sources already exist: CRM, email, calendar, call transcripts, product usage, enrichment, intent, or news
- Whether the current pain shows up as missed follow-up, stale opportunities, poor multi-threading, weak forecast calls, bad qualification, or coaching blindness
- Whether reps see the tool as help, surveillance, admin burden, or another dashboard they will ignore
- Whether managers need inspection rigor, rep guidance, or both
- Whether the buyer wants intelligence, workflow automation, or full execution substitution
- Current-state method: manager intuition, Salesforce reports, Gong, Clari, Outreach, Salesloft, Apollo, 6sense, manual notes, spreadsheets
- Proof threshold: lift in meeting quality, opportunity conversion, follow-up speed, forecast accuracy, CRM completeness, rep ramp speed, or deal progression quality
- Switching cost: stack overlap, rep retraining, CRM process change, manager habit change, trust in AI-generated recommendations
- Political risk: RevOps may own systems, sales leadership may own urgency, reps may resist if the system feels punitive

**Category-specific forks:**
- Founder-led GTM motion vs scaled RevOps-led motion
- Prioritization / territory focus pain vs conversation / follow-up execution pain
- Rep-facing productivity buyer vs manager-facing inspection buyer
- "We already have Gong / Clari / Outreach" vs "Our reps will never use this" vs "Show me revenue lift"

**Category-specific disqualifiers:**
- No reliable system of record or CRM discipline to anchor the intelligence layer
- Sales motion is too small, too founder-led, or too low-volume to show measurable lift
- Buyer cannot name the primary metric the system is supposed to improve
- Existing stack already solves the exact problem with high adoption and low pain
- Prospect actually needs outbound execution labor or a full CRM replacement, not an intelligence layer

---

### 7. Manufacturing / Supply Chain / Engineering

**Primary corpus companies:** CADDi, Shapr3D  
**External discovery-logic anchors:** Vantive, Craft

This framework must explicitly separate proactive resilience modeling from reactive supplier monitoring. Vantive-style buying motion is about simulation, planning, and operational consequence. Craft-style buying motion is about supplier intelligence, monitoring, and risk visibility. The framework has to know which one it is dealing with.

**Discovery must pull for:**
- Whether the live pain is supplier risk monitoring, disruption forecasting, scenario planning, procurement diligence, engineering handoff, or production resilience
- Whether they need N-tier visibility, supplier mapping, scenario modeling, or daily intelligence alerts
- How fragmented the current data is across ERP, procurement systems, spreadsheets, PLM, supplier portals, and email
- What operational consequence matters most: line-down risk, missed OTIF, working-capital distortion, revenue loss, regulatory exposure, ESG exposure, or cybersecurity supplier risk
- Whether the current process is proactive planning or reactive firefighting
- How supplier health is reviewed today: periodic audits, spreadsheets, point risk tools, consultants, manual escalation, or no real system
- Who owns the problem: procurement, supply chain risk, operations, manufacturing, finance, resilience office, or program leadership
- Whether the buyer is optimizing production continuity, supplier due diligence, sourcing decisions, or executive risk visibility
- Proof threshold: accuracy of supplier data, freshness of monitoring, credibility of simulations, usable scenario outputs, executive trust in the model
- Switching cost: supplier onboarding, integration burden, data normalization, trust in risk scoring, and change to planning cadence
- Whether the organization is defense/government-linked, industrial/manufacturing-heavy, or broad procurement-led
- What trigger event created urgency: a recent disruption, board pressure, geopolitical instability, cyber incident, ESG mandate, revenue miss, or sourcing failure

**Category-specific forks:**
- Proactive scenario-planning buyer vs reactive monitoring / intelligence buyer
- Manufacturing / operations owner vs procurement / supplier-risk owner
- Resilience / production-continuity pain vs diligence / compliance / cyber-risk pain
- Enterprise program buyer vs plant, region, or business-unit emergency buyer

**Category-specific disqualifiers:**
- Supplier network is too simple or too low-risk to justify a dedicated intelligence layer
- No access to enough supplier or operational data to create a credible system
- No executive owner for resilience, supplier risk, or procurement transformation
- Prospect only wants a cosmetic dashboard, not a act-on-able operating layer
- No live trigger, no material downside, and no willingness to change the current review process

---

### 8. Data / Intelligence Infrastructure

**Primary company:** Newscatcher

This framework is not a workflow-app framework. It is a fuel-line framework. The buyer is deciding whether to trust an external, real-time intelligence input layer that feeds risk systems, AI products, compliance monitors, market-intelligence workflows, or supply-chain oversight.

**Discovery must pull for:**
- What downstream system the data powers: AI agents, search, monitoring, risk, compliance, market intelligence, supplier intelligence, or internal analytics
- Whether the pain is lack of freshness, lack of coverage, lack of structure, lack of citation-grade reliability, or inability to build and maintain the ingestion layer internally
- Whether they need real-time news, broad web monitoring, entity tracking, market signals, or external-fact retrieval for models
- What the internal alternative is: custom crawler, search stack, scraping vendors, analyst labor, legacy feeds, or stale static datasets
- Who owns the decision: product, data engineering, AI platform, CTO office, risk, compliance, or intelligence team
- What data quality really means in context: recall, precision, latency, source breadth, language coverage, schema stability, entity resolution, or reproducibility
- Whether the buyer wants a raw API, enriched intelligence layer, alerting infrastructure, or retriever input for LLM systems
- What false positives and false negatives cost them operationally
- Whether licensing, data rights, or governance are gating concerns
- Proof threshold: API uptime, retrieval accuracy, historical archive quality, source diversity, monitoring relevance, and implementation speed
- Whether the business case is replacing analyst time, improving product quality, reducing hallucination, shortening response time, or widening coverage

**Category-specific forks:**
- AI-platform / retrieval buyer vs risk / compliance monitoring buyer vs market-intelligence buyer
- Developer / infrastructure evaluator vs business owner who only cares about downstream outcomes
- Freshness / recall pain vs governance / licensing pain
- Build-internal bias vs buy-external-layer urgency

**Category-specific disqualifiers:**
- No meaningful dependence on external real-time data
- Freshness and coverage requirements are too low to justify dedicated infrastructure
- Prospect wants a finished end-user workflow app, not an API-first intelligence layer
- No internal product, data, or engineering path to operationalize the feed
- Required source rights, geography coverage, or reliability guarantees are outside product scope

---

### 9. AI-Native Buyer Discovery Framework

This framework is required even if one or more of the above products are AI-native. It addresses the **AI itself as a buying category** — the trust, governance, accuracy, and adoption burden that exists regardless of what workflow the AI plugs into.

**This must be a separate, fully instantiated framework — not a cosmetic add-on or a section of the other frameworks.**

It must explicitly cover:

- Trust and credibility threshold — what would make them believe AI output is reliable enough
- Tolerance for model error — what error rate is acceptable, and in which workflows
- Human-in-the-loop requirements — where humans must stay, where humans can step back
- Where deterministic behavior is mandatory (compliance, legal, safety) vs where probabilistic is acceptable
- Governance and evaluation expectations — who owns AI quality, how do they measure it
- Data sources and data-boundary concerns — what data can the AI see, what can it not
- Security, privacy, compliance, and data retention concerns
- Explainability expectations — does the buyer need to understand WHY the AI produced an output
- Rollout scope: pilot vs limited production vs enterprise standard — and what determines progression
- Integration vs overlay expectations — does this need to plug into their stack or sit alongside it
- Workflow displacement risk — who loses their job or their relevance, and how does that affect adoption
- Stakeholder politics: end users (will they use it?), IT (will they approve it?), security (will they allow it?), legal (will they sign off?), leadership (will they fund it?)
- Proof requirements: benchmark, pilot, live test, references, evaluation methodology, red-team exercise
- "AI theater" skepticism — prospects who've been burned by AI demos that don't work in production
- Product taxonomy: is this a copilot, agent, assistant, recommender, generator, triage layer, QA layer, or orchestration layer — and does the buyer understand the difference

**Mandatory AI-specific forks:**

| Fork | What it reveals | What changes downstream |
|------|----------------|------------------------|
| "We already use AI" | They have context — discover what they use, what works, what doesn't | Competitive displacement track |
| "We are experimenting but not deploying broadly" | Pilot purgatory — discover what's blocking rollout | Adoption-readiness discovery |
| "Legal/security will never allow this" | Governance blocker — discover whether it's real or assumed | Security/compliance track with offer to engage those stakeholders directly |
| "Accuracy matters too much here" | High-stakes workflow — discover what error rate is acceptable | Proof-threshold track with benchmark/evaluation methodology |
| "Our data is too messy / too sensitive" | Data-readiness concern — discover what data exists, where it lives, what state it's in | Data-readiness assessment track |
| "How do you evaluate model quality?" | Sophisticated buyer — they want methodology, not marketing | Evaluation-methodology track |
| "What happens when it is wrong?" | Error-consequence concern — discover what the blast radius of a wrong answer is | Error-handling and fallback-design track |
| "Show me where the human stays in control" | Control concern — discover what decisions they're comfortable delegating | Human-in-the-loop architecture track |

---

## Codex prompt — final version to use

```text
You are building a bulletproof, production-grade discovery framework system.

Before writing anything, hard-lock your operating standard to these mirrored control references:
- `07-control-artifacts/lumana-discovery-command-center-reference-2026-04-10.html`
- `07-control-artifacts/lumana-discovery-framework-reference-2026-04-10.html`

Those Lumana references are not just taste boards.
They are live-call behavior locks.
The earlier Vantive/Lockheed benchmark still matters for branching depth, but Discovery Studio must now also inherit the Lumana standard for:
- emergency essentials mode
- skip-ahead handlers
- explicit phase tempo cues
- support dossier behavior during the live call
- hold-versus-deploy-now value discipline

Your quality bar is the attached `cold-call-framework-vantive-lockheed (1).html` file. Study it before writing anything. That file is not a loose script — it is a 1,700-line interactive discovery operating system with:
- 8 phased stages (PREP → GATEKEEPER → OPENER → HOOK → ENGAGE → VALUE DROP → CLOSE → LOCK → POST-CALL)
- a hostile-track fork with its own multi-stage path
- a voicemail module
- a post-call module with follow-up email templates and CRM capture logic
- 12+ objection handlers in a global sidebar library, each with full counter + counterWhy
- 5-6 prospect responses per node, each with tone classification, coaching hint, exact counter language, and downstream navigation
- a compression path for time-pressured prospects ("I have 2 minutes")
- a visible emergency toggle that collapses the room to essentials
- skip-ahead handlers for demo, pricing, and send-info interruptions
- phase tempo cues with explicit jump logic when time gets tight
- a support dossier that keeps proof, deployment, and account intelligence reachable during the live call
- value tie-back discipline that distinguishes what to hold from what to deploy now
- a gatekeeper module with 5 response branches
- a real-time call timer with color-coded urgency states
- coaching rationale embedded at every node explaining WHY each counter works
- a conversation-state model tracking current node, expanded responses, completed phases, and timer state
- enough structure to render as an interactive, clickable HTML application — not just a document

Your build must match or exceed that depth for each of the nine frameworks below. Anything shallower is a failed deliverable.

## Your task

Build nine separate, fully instantiated discovery frameworks:

1. Legal / Legal Ops / Law Workflow
2. Recruiting / Talent / HR / People Workflow
3. Product / UX / Enablement / Knowledge Workflow
4. GovTech / Compliance / Public-Sector Operations / Trust & Safety
5. Customer Support / Operations / Vertical Workflow Software
6. Sales / Revenue Intelligence
7. Manufacturing / Supply Chain / Engineering
8. Data / Intelligence Infrastructure
9. AI-Native Buyer Discovery Framework (cross-category — about AI as a buying decision)

Each framework must be a standalone discovery operating system, not a section of a shared document.

## Mandatory phase structure (minimum — you may add phases)

PREP → OPEN → HYPOTHESIS LEAD → DIAGNOSTIC DISCOVERY → DEPTH / EXPANSION → STAKEHOLDER MAPPING → VALUE REFRAME → OBJECTION / RESISTANCE → COMPETITIVE DISPLACEMENT (if incumbent exists) → NEXT STEP / CLOSE → LOCK / CONFIRM → VOICEMAIL → POST-CALL → RE-ENGAGEMENT

## Mandatory branching depth

Each framework must fork at least 4 times with materially different downstream logic.

Required fork classes (all must be present in every framework):
- Engaged / curious — full discovery depth, ambitious close
- Guarded / vague / not forthcoming — softer questions, hypothesis-led, lower-commitment close
- Skeptical / combative / resistant — credibility-first, evidence-heavy, earn-the-right close
- Deflecting / timing / send-info / wrong-person — compression, redirect, referral capture, nurture
- Time-pressured / compression — compressed hypothesis + one question + close in 60 seconds

Each fork must change what is asked, what is said, what counts as success, and what the close sounds like. If two forks produce the same downstream language, they are not real forks.

## Mandatory per-node content

Every node must include:
- id, phase, title, subtitle
- objective: what must be learned (specific, not "understand pain")
- hypothesis: the falsifiable belief being tested
- script: exact language with <em> tags for variable insertion
- coaching: why this works, what to watch for, what NOT to do
- questions: primary, hypothesis-led, backup, direct, softer, challenge, and depth follow-ups
- signals: what to listen for — buying readiness, fake politeness, real pain, internal politics, stalling
- watchouts: common rep mistakes at this node
- dependencies: conditions that change what happens here
- progressionRule: what must be true to advance
- responses[]: array of response objects

## Mandatory per-response content

Every response must include:
- id, label (prospect's actual words in quotes), tone (green/amber/red)
- hint: one-line coaching
- signal: what this response reveals about the prospect's real state
- counter: exact rep language — the actual sentence, not a principle
- counterWhy: why it works psychologically and commercially
- whatToLearnNext: discovery objective after the counter
- fallbackIfStillBlocked: second-level recovery language
- next: next node ID

## Mandatory pre-call architecture (per framework)

- ICP with firmographic, technographic, and behavioral qualifiers
- Primary and secondary personas with behavioral and political intelligence
- Champion patterns, economic buyer patterns, blocker patterns, technical evaluator patterns
- At least 5 category-specific trigger events
- Status quo alternatives (manual, incumbent, internal build, ignoring it)
- Named incumbent tools and manual workarounds
- Top 10 objections with full counters
- Top 10 skepticism statements (distinct from objections)
- Top 10 brush-offs with recovery language
- Category-specific disqualifiers
- Pre-call hypothesis template

## Mandatory global libraries (per framework)

- Objection library: accessible from any node via sidebar. Each objection: label, full response, why it works, category-specific variant
- Inbound question handlers: pricing, timeline, competitors, references, "how does it work," "can you do X"
- Signal dictionary: buying readiness, fake politeness, real pain, politics, stall, champion behavior

## Mandatory post-call layer (per framework)

- Artifact templates for: info request, meeting booked, referral captured, hard pass
- CRM capture fields (category-specific)
- Follow-up timing rules by disposition
- Re-engagement triggers (events that should trigger a callback)

## Mandatory multi-session arc

- What must be learned in Discovery 1 before scheduling Discovery 2
- What must be learned before offering a demo
- Demo setup message template tied to discovered pain
- What a strong next step actually sounds like (exact language)

## Category-specific requirements

[Include the full category-specific sections from this document — Legal, Recruiting, Product/UX/Enablement, GovTech/Compliance, Customer Support/Operations, Sales/Revenue Intelligence, Manufacturing/Supply Chain/Engineering, Data/Intelligence Infrastructure, and AI-Native — with all discovery targets, forks, and disqualifiers.]

## Anti-patterns — do NOT produce any of the following

- A question list disguised as a framework
- Generic questions that could apply to any industry ("tell me about your challenges")
- Fake branching where every path converges to the same close language
- Objection handling that is just reassurance ("I understand your concern...")
- A pre-call section that is just personas with job titles and no behavioral/political intelligence
- A single DISCOVERY node with 20 questions instead of phased diagnostic → depth progression
- Blog-style advice, MEDDICC cliché cosplay, or enablement wallpaper
- Counters that all start with "that's a great point"
- Response branches where the counter doesn't reference what the prospect actually said
- Post-call sections that say "follow up" without specifying what to send, when, and why

## Quality enforcement

For each framework, after building it, include:

1. **"Where this framework breaks if the rep is weak"** — surface the 5 most likely failure modes
2. **"Signals that this is real pain vs fake politeness"** — how to tell the difference in this category
3. **"What a strong next step actually sounds like"** — exact language for 3 scenarios: meeting booked, demo scheduled, referral captured
4. **"What disqualifies in this category"** — 5 specific disqualification patterns with exit language

## Output format

Each framework must be structured as a JavaScript data object (like the STAGES and OBJECTIONS objects in the reference file) so it can be directly rendered in an interactive HTML application. Include the full data model, not pseudocode.

## Final instruction

Do not stop after outlining. Fully instantiate every node, every branch, every counter, every follow-up, every signal, every watchout, every post-call action, and every CRM field. If the output is shorter than the reference file (1,700 lines) per framework, it is almost certainly too shallow.

Bias toward depth, realism, branch integrity, and operational specificity over brevity.
```

---

## QA checklist for the finished build

Use this to judge whether Codex actually did the work.

| # | Check | Pass/Fail |
|---|-------|-----------|
| 1 | Does each framework feel category-native, or could the same script be pasted anywhere? | |
| 2 | Does each framework include at least 4 real forks with different downstream logic? | |
| 3 | Do guarded, hostile, vague, and engaged prospects produce different close language? | |
| 4 | Are implementation, security, proof, and adoption concerns surfaced early enough? | |
| 5 | Does the framework expose buyer politics and decision architecture? | |
| 6 | Does it include exact language — actual sentences, not "ask about pain"? | |
| 7 | Does each objection handler include a reframe, not just reassurance? | |
| 8 | Does each framework know how to move toward a next step, not just ask good questions? | |
| 9 | Does it know how to exit cleanly when there is no motion? | |
| 10 | Could the output be rendered as interactive HTML without major rewriting? | |
| 11 | Does the pre-call section include political intelligence, not just personas? | |
| 12 | Are questions hypothesis-led, not open-ended? | |
| 13 | Does the signal dictionary distinguish real pain from fake politeness? | |
| 14 | Is there a compression track for time-pressured prospects? | |
| 15 | Does the post-call layer include re-engagement triggers, not just "follow up"? | |
| 16 | Is the AI-native framework a real standalone system, not a cosmetic appendix? | |
| 17 | Does each framework include multi-session progression logic? | |
| 18 | Does each framework handle inbound prospect questions (pricing, timeline, competitors)? | |
| 19 | Is each framework at least 1,500 lines of structured data when fully instantiated? | |
| 20 | Would a senior enterprise AE with 10 years of experience recognize this as operationally useful? | |

If the answer to any of those is no, the build is not done.
