# Antaeus Product-Language Remediation — Master Plan, Methodology, and Source-of-Truth Rules

## Status

This directory is the repo-owned record of the 2026 Antaeus product-language remediation. It preserves the diagnosis, source methodology, rewrite decisions, implementation rules, generator rules, regression controls, and staged execution plan.

The full preview corpus scored **93/100 saturation** on the same rubric previously used against the Antaeus product page. The acceptance target is **20/100 or below** without flattening the product's intelligence, decisiveness, or visual identity.

## Why this work exists

The language problem is not a collection of isolated copy defects. A private semantic dialect has become part of the product's information architecture, navigation, state model, ranking language, diagnostic language, and internal product doctrine.

The recurring patterns are:

- private/branded ontology (`Ground`, `motion`, `heat`, `sharp`, `bite`, `Live Edge`, `thread`);
- metaphor carrying functional meaning;
- aphoristic cadence and compressed declaratives;
- personified system agency (`workspace is awake`, `what the system saw`);
- declarative certainty where the underlying output is inference or forecast;
- paratactic compression and punctuation standing in for logical relationships;
- high-context language that requires the user to learn Antaeus terminology before understanding the software;
- internal design doctrine that teaches future builders and coding models to reproduce the same dialect.

The product should preserve its point of view while removing the requirement that a user translate Antaeus into ordinary business English.

> **Governing rule: Antaeus may have a point of view. It may not require translation.**

---

# 1. Why the preview walkthrough is the primary language source

The language work is intentionally based on the generated preview walkthrough before source-code rewriting begins.

The preview-transcript system exists specifically to record the product as a visitor experiences it: every room, every word on screen, interaction states, hover text, and the room capability maps. The implementation lives in `tools/preview/build-transcript.js`; generated output lives under `preview-transcript/`.

The analysis copy used for this project was rendered to a plain-text walkthrough named `antaeus-preview-walkthrough.txt`. The text file is a transport format for the generated preview-transcript corpus; it is not an implementation source.

This corpus is the best language-analysis source because it captures:

- all visible room-at-rest copy;
- below-the-fold content;
- buttons, links, fields, headings, labels, helper text, and status text;
- content revealed by clicks, hovers, drawers, and other interaction states;
- repeated shared chrome exactly as the visitor experiences it;
- internal capability-map/doctrine sections that can regenerate the same dialect later.

Reviewing source code first would fragment the problem across shared components, local templates, constants, prompt generators, persisted states, and room-specific markup before the semantic decisions were settled.

## The walkthrough is authoritative for

- corpus-level language analysis;
- terminology extraction;
- saturation scoring;
- identifying repeated language families;
- finding interaction-state copy that source review can miss;
- defining user-facing replacements;
- identifying internal doctrine that will regenerate deprecated language;
- validating the rendered product after implementation.

## The walkthrough is not the implementation target

Never patch `preview-transcript/` or a text export as the fix.

After language decisions are approved, the repository determines the highest correct source of truth:

- shared component;
- room-local component;
- constants/configuration;
- persisted state label;
- deterministic text generator;
- AI prompt/template;
- internal product documentation.

The implementation principle is:

> **Use the walkthrough to decide what the language should mean and say. Use the repo to change the source that produces it.**

## Source-of-truth hierarchy

1. **Rendered walkthrough corpus** — what the user actually experiences.
2. **Approved migration/rewrite manifests** — what the language should become.
3. **Repository source** — where the approved decision is implemented.
4. **Regenerated walkthrough** — post-implementation validation surface.

Do not reverse this order by letting existing source wording dictate the new language.

---

# 2. Corpus work completed

The walkthrough was parsed into a rendered-language corpus.

Current extraction totals:

- **5,627 rendered user-facing occurrences**
- **2,780 unique rendered user-facing strings**

Coverage tables and internal capability maps were separated from the rendered-string inventory. Internal capability-map language was audited separately because it can regenerate the deprecated dialect even when customers do not see it directly.

A high-severity review identified **137 high-severity unique strings**. **121 have explicit replacement decisions**. The remaining cases are composite/generated/contextual outputs and are intentionally assigned to source-level generator/template remediation rather than blind sample-string replacement.

---

# 3. Saturation rubric and target

Use the same nine dimensions before and after implementation:

1. Semantic compression
2. Private / branded ontology
3. Metaphorical abstraction
4. Declarative certainty
5. Aphoristic cadence
6. High-context dependence
7. Paratactic compression
8. Personification / agency transfer
9. Elliptical / fragmentary syntax

Current corpus result: **93/100**.

Target: **15–20/100**, with **20/100 as the acceptance ceiling**.

Do not change the rubric after implementation to make the result look better.

---

# 4. Product-language end state

A first-time user should be able to answer immediately:

- What am I looking at?
- What does this state or number mean?
- Why did Antaeus reach this conclusion?
- Is this an observed fact, a calculation, an inference, a forecast, or a recommendation?
- What should I do next?
- What happens if I take the suggested action?
- Where am I in the application?
- Where do I go to perform a specific sales task?

None of those answers should depend on learning private Antaeus vocabulary first.

The desired Antaeus voice is:

- **Specific** — names the account, deal, person, date, number, or action.
- **Explanatory** — shows why a conclusion follows.
- **Decisive** — recommends action when evidence supports it.
- **Plain** — uses standard sales language wherever it already exists.
- **Economical** — concise without deleting necessary logical connective tissue.
- **Evidence-led** — separates fact from inference and forecast.
- **Professional** — sounds like an experienced operator explaining what they see, not a brand copywriter producing memorable lines.

---

# 5. Language rules

## 5.1 Direct proposition first

Do not narrate the act of explaining before stating the information.

Bad: `What the system saw while you were away`

Better: `Changes since your last visit`

Bad: `The one thing that needs you first`

Better: `Highest-priority recommended action`

## 5.2 One term maps to one concrete concept

Do not use `motion` as a catch-all for activity, process, pipeline, methodology, or readiness. Use the specific noun.

## 5.3 Metaphor cannot carry functional meaning

A branded title may survive when a literal functional subtitle makes the behavior obvious. A metaphor may not be the only explanation of a state, feature, or action.

## 5.4 Separate terminology, interpretation, and brand voice

Do not force one slogan-like sentence to name an object, interpret evidence, and express brand character simultaneously.

## 5.5 Remove aphoristic cadence as a default pattern

Avoid balanced mini-maxims, compressed two-beat conclusions, slogan cadence, and dramatic terminal fragments.

## 5.6 Remove metadiscursive framing

Reduce `here's what`, `what the system saw`, `the one thing`, `this is where`, and similar framing when the proposition itself can be stated directly.

## 5.7 Personification is not the system model

Prefer `Antaeus analyzed...` over `the workspace woke up`; `recent changes` over `what the system saw`; `automated check` over `heartbeat`.

## 5.8 Label epistemic status

Analytical outputs must distinguish:

- observed fact;
- derived metric;
- assessment/inference;
- forecast;
- recommendation.

## 5.9 Evidence sits next to conclusions

A ranked action, risk state, readiness state, or account-priority state should expose the inputs that drove it.

## 5.10 Use standard sales terminology when it already exists

Preserve terms such as account, contact, opportunity, deal, stage, champion, economic buyer, stakeholder, pipeline, forecast, close date, next step, discovery, pilot, procurement, legal, security, activity, conversion, quota, territory, segment, ICP, signal, and outreach.

Do not rename known concepts merely to make them sound proprietary.

## 5.11 CTAs predict the action

Prefer `Open workspace map`, `Create segment`, `Review deal risk`, `Draft outbound`, `Update next step`.

Retire non-predictive CTAs such as `Touch the Ground`, `Carve it`, or `Make it real`.

## 5.12 Punctuation cannot replace logic

Middle dots may separate compact data. Em dashes, slashes, and fragments should not be required for the user to infer causality or scope.

## 5.13 Avoid underspecified references

Search aggressively for `it`, `this`, `that`, `one`, `the move`, `the read`, `the line`, `the thread`, `the work`, and `the motion`. Name the object when ambiguity exists.

## 5.14 Do not overstate causality

If the data only supports correlation, say `appeared in`, `was used on`, `was associated with`, or `occurred before`. Do not say a question `won` a meeting unless causality is actually established.

---

# 6. Shared semantic migrations

The detailed migration map in this directory is authoritative. Core examples:

- `Ground` → Workspace map / navigation
- `motion` → exact noun: sales process, activity, pipeline, outreach, deal process
- `heat` → account priority / signal strength
- `sharp` → ICP specificity / well-defined
- `bite` → match / matching accounts
- `carve` → create / define / segment
- `Live Edge` → recent activity / activity feed
- `one move` → highest-priority recommended action
- `workspace is awake` → setup complete / analysis ready
- `thread` → account/deal/communication history, depending on context
- `pressure` → risk / urgency / priority
- `dying` → high loss risk / likely to be lost
- `climb` → readiness progression
- `summit` → highest readiness state
- `inheritable` → runnable by another seller
- `handoff kit` → sales handoff documentation
- `front` → negotiation workstream
- `face-off` → current blocking issue
- `your line` → proposed negotiation position
- `relay` → introduction / forwarded request
- `air cover` → LinkedIn/supporting outreach

These are semantic migrations, not blind global search-and-replace rules.

---

# 7. Readiness state migration

User-facing readiness should describe operating independence directly:

- `You are the system` → **Founder-dependent**
- `Building` → **Partially documented**
- `Inheritable with guardrails` → **Runnable with founder support**
- `Hire-ready` → **Runnable independently**
- `Hire-ready, repeatable` → **Documented and repeatable**

Persisted internal enum keys may remain stable when changing them would require unnecessary data migration. User-facing labels and explanations are the primary target.

---

# 8. Analytical output schema

Generated or deterministic analysis should use this conceptual schema:

1. **Object** — account, deal, person, plan, segment, etc.
2. **Observation** — directly true in stored/retrieved data.
3. **Evidence** — dates, counts, events, fields, calculations.
4. **Assessment** — Antaeus interpretation.
5. **Forecast** — only when predicting future state.
6. **Recommended action** — specific next action.
7. **Expected effect** — optional, stated as intent rather than guarantee.

Example:

Bad: `Nordstrom is dying. The thread went stale and urgency died.`

Better:

**Deal risk: High**

No buyer activity has been recorded for 21 days, no dated next step is set, and no economic buyer is identified.

**Recommended action:** Get a dated next meeting with the buyer and confirm who owns final approval.

---

# 9. Room-by-room remediation program

## Gate

Already comparatively literal. Preserve the sample-data and confidentiality explanation. Minimal changes.

## Onboarding

Rewrite away from `heavy-seeding`, `wake-up`, `seed→alive`, `hard floor`, and `the thing no one else does`. Explain why the data is needed and which judgment only the user can supply.

## Welcome

Replace awake/morning/dividend/system-pick language with: setup state; accounts/deals analyzed; highest-priority action; why it ranks first; changes since last visit; workspace totals; workspace map; recent activity.

## Dashboard

Use current sales status; plain readiness state; highest-priority recommended action + evidence; and status by area: deal risk, account priority, quota pace, handoff readiness.

## Readiness

Dominant question: `Could another seller run this sales process?` Show what another seller can do today, what still depends on the founder, missing evidence, and the action that moves readiness forward.

## ICP Studio

Keep standard ICP inputs. Translate `sharp`, `bite`, and related quality language into specificity/match language.

## Territory Architect

Use `create territory segment`, not `carve division`. Criteria: geography, industry, company size/stage, named accounts, buying signals, combined criteria.

## Prospecting Desk

Keep standard qualification language. Explain when an account is ready to move into monitoring/outbound.

## Signal Console

Retire temperature as the primary information architecture. Use account priority, supporting signals/activity, and signal age.

## Briefing

Organize around changes in work, market patterns, conflicting evidence, accounts to consider, and saved monitoring rules. Every analysis exposes observation/evidence/interpretation/action.

## Outdoors Events

Use event, location, date, relevant buyer, target account, reason it matters, and preparation. Avoid unnecessary metaphor.

## Outbound Studio

Keep target account, contact, signal/reason for outreach, message, CTA, subject, save/log language literal.

## Cold Call Studio

Use reason for call, opening, questions, objection, response, goal, notes, next step. Natural speech is fine; private ontology is not.

## LinkedIn Playbook

Retire `air cover`; use LinkedIn/supporting outreach.

## Discovery Studio

Preserve standard sales concepts. Avoid compressed framework labels where literal description is clearer.

## Deal Workspace

Use standard deal fields. Rewrite the interpretive layer into risk + evidence + corrective action. Avoid `decay`, `dying`, and deterministic close-loss phrasing.

## Pilot Desk

Use success criteria, approver, end date, participants, engagement, adoption, results summary, next decision.

## Getting to Signed

Use four workstreams: Legal, Security, Finance, Business approval. For each: customer request, proposed position, gap, status, owner, next action, due date. Retire `front`, `face-off`, `fight`, `your line`, and `run-to-signed`.

## Call in a Favor

The room name may remain. Replace relay/backchannel/spend-trust doctrine with network assistance: who can help, what is being asked, forwardable note, recent request history, outcome.

## Future Autopsy

If the title remains, pair it with a literal subtitle. Use observed facts → risk level → why risk is high → corrective actions → when to consider closing the opportunity. Retire death/decay language as state logic.

## Quota Workback

Preserve the strong literal math. Consider later rename to Quota Plan or Activity & Pipeline Plan. Label projections and assumptions explicitly.

## Founding GTM

Treat as sales handoff documentation. Replace causal overstatement with observational patterns. Sections should cover target/disqualification, outreach patterns, discovery patterns, deal progression/stall patterns, loss patterns, win patterns, and first-week cadence.

## Settings

Use as a benchmark for plain language. Explain storage, export, restore, automatic activity capture, and preferences directly.

---

# 10. Internal doctrine remediation

User-facing copy will regress if internal architecture documentation continues using the old dialect.

Translate internal concepts such as:

- Command Chamber → Dashboard ranking system
- Decision Bench → decision-support workflow
- System Ledger → readiness/quota synthesis
- Live Instrument → execution workflow
- heavy-seeding → comprehensive onboarding
- seeding flow → onboarding data collection
- wake-up → enrichment completion
- one move → highest-priority recommended action
- Ground → workspace navigation
- heat → account-priority score / signal strength
- climb → readiness progression
- face-off → current blocking issue
- fronts → negotiation workstreams
- relay → forwarded introduction / network request

Internal codenames may exist, but they must never be treated as a source of user-facing copy.

---

# 11. AI and deterministic generator remediation

Static UI changes are insufficient.

Search prompt/template instructions for language that encourages:

- vivid/punchy/provocative/editorial copy;
- command voice;
- `no hedging` without epistemic distinction;
- `one move`;
- sharp/heat/motion/pressure/alive/awake/thread/ground/machine/climb/front/relay language;
- slogan-like or aphoristic output.

Replace them with the generated-language standard in this directory. The generator should prefer consistency and semantic precision over stylistic novelty.

---

# 12. Automated regression control

Implement `npm run copy:audit` as specified in this directory.

Tier-1 terms should fail CI unless explicitly allowlisted. Tier-2 terms should warn with file/line/context and require review.

The audit should cover static UI, shared components, deterministic generators, prompt templates, and regenerated preview output.

PRs changing customer-facing copy should include a copy-impact checklist.

---

# 13. Implementation sequence

## Phase 1 — source methodology and corpus inventory

Completed.

- establish the walkthrough as the language-analysis source;
- separate rendered copy from transcript scaffolding/internal doctrine;
- extract 5,627 rendered occurrences / 2,780 unique strings;
- score the corpus;
- establish the migration map.

## Phase 2 — shared semantic architecture

Language decisions completed; repo implementation next.

- Ground/navigation;
- Live Edge/recent activity;
- readiness states;
- heat/account priority;
- shared recommendation language;
- `motion` catch-all removal.

## Phase 3 — highest-saturation rooms

Language decisions completed.

- Welcome;
- Dashboard;
- Readiness;
- Briefing;
- Future Autopsy;
- ICP Studio.

## Phase 4 — medium/high-saturation strategic and diagnostic rooms

Language decisions completed.

- Territory Architect;
- Signal Console;
- Getting to Signed;
- Founding GTM;
- Pilot Desk;
- Call in a Favor.

## Phase 5 — execution and utility rooms

Language decisions completed.

- Prospecting;
- Events;
- Outbound;
- Cold Call;
- LinkedIn;
- Discovery;
- Deal Workspace;
- Quota;
- Settings.

## Phase 6 — generated-language and internal-doctrine migration

Specifications completed; implementation pending.

## Phase 7 — source tracing and implementation

Next.

For each approved decision:

1. search the repo for the rendered string or semantic concept;
2. identify the highest correct source of truth;
3. change shared components once rather than patching repeated output;
4. change generators/templates rather than hardcoding sample text;
5. preserve stable enum keys when display-label migration is sufficient;
6. test behavior after each source-level change.

## Phase 8 — copy linter and CI

Implement after the new source language is in place.

## Phase 9 — regenerate walkthrough and re-audit

Regenerate the same preview walkthrough after implementation.

Use the regenerated artifact—not source-code inspection—as the final language QA corpus.

Run the identical nine-dimension saturation test. Target ≤20/100. Repeat until the target is met.

---

# 14. Acceptance criteria

The migration is not complete until:

1. A new user can navigate the entire app without learning a branded Antaeus term.
2. Every analytical conclusion exposes its basis.
3. Facts, calculations, inferences, forecasts, and recommendations are distinguishable.
4. Standard sales concepts use standard sales terminology.
5. CTAs predict the action that will occur.
6. Metaphors are optional flavor, never required interpretation.
7. No room depends on aphoristic copy to explain its purpose.
8. No system state exists primarily because it `sounds Antaeus`.
9. Shared navigation uses ordinary nouns.
10. Generated text follows the same language standard as static UI.
11. Internal product doctrine no longer teaches future builders to recreate the old dialect.
12. CI prevents regression.
13. A first-time user can accurately paraphrase major states without assistance.
14. The regenerated corpus scores **20/100 or below** on the unchanged rubric.
