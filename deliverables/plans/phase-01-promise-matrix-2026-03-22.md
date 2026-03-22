# Phase 1 - Promise Matrix

Date: 2026-03-22  
Scope: every user-facing surface in the repo, plus the standalone launch-agent surfaces that already exist in-product-adjacent form.

## Purpose
This document defines the explicit promise of every surface so the product can be evaluated module by module instead of being hand-waved as "general GTM help."

Each surface below answers:
- what it promises in one sentence
- who it is for
- what input is required
- what output must exist within one session
- what failure to deliver looks like
- who should own the surface
- a baseline promise score out of 10

## Baseline Scoring Rubric
- `9-10`: promise is sharp, audience-specific, and the surface reliably delivers a meaningful result in one session
- `7-8`: promise is clear and useful, but delivery has friction, edge-case gaps, or polish issues
- `5-6`: promise is understandable, but output is incomplete, thin, or too dependent on user discipline
- `3-4`: promise is partially credible, but core delivery is unstable, confusing, or obviously unfinished
- `1-2`: promise is effectively broken, unclear, or not yet productized

## Owner Functions
| Owner | Mandate |
|---|---|
| Growth Site & Conversion | public site, pricing story, self-serve conversion path |
| Auth, Onboarding & Activation | account creation, routing, first-session activation |
| Product Shell & Navigation | app shell, nav behavior, module discoverability, cross-module guidance |
| ICP, Signals & Territory Intelligence | who to target, what to notice, where to hunt |
| Outbound & Contact Execution | outbound planning, contact sequencing, call and LinkedIn execution |
| Discovery, Deal & Proof Execution | discovery, deal motion, PoC, risk, advisor deployment |
| Planning, Readiness & Handoff | quota math, readiness, dashboard synthesis, playbook/handoff |
| Trust, Policy & Workspace Ops | settings, import/export, privacy, terms, workspace integrity |
| Methodology Content Engine | methodology pages and ungated content surfaces |
| Launch Agent | standalone scout / compose / map / qualify operating system |

## Promise Matrix

### Public / Acquisition Surfaces
| Surface | Promise | For | Required Input | One-Session Output Required | Failure To Deliver Looks Like | Owner | Score |
|---|---|---|---|---|---|---|---|
| `/` landing page ([index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/index.html)) | Turn a founder-led sales operator into a paying or trialing buyer by making Antaeus feel like a complete operating system, not a vague toolkit. | Founder-led sellers, founding AEs, early GTM operators, VC/platform adjacencies | Visitor attention; optional click on pricing/demo/login CTA | Visitor understands what Antaeus is, who it is for, what outcomes it claims, and has a credible next step to buy, demo, or sign in | Visitor leaves still unclear whether Antaeus is CRM, training, templates, or "GTM help"; buy CTA does not resolve to real checkout | Growth Site & Conversion | 6 |
| Sign in ([login.html](c:/AppDev/v1AntaeusApp/Appv2_290126/login.html)) | Get an existing user back into the correct workspace state with minimal friction. | Returning users | Email + password | Successful auth and routing to onboarding, welcome, or dashboard | User authenticates but routing is wrong, confusing, or blocked | Auth, Onboarding & Activation | 8 |
| Sign up ([signup.html](c:/AppDev/v1AntaeusApp/Appv2_290126/signup.html)) | Turn a new visitor into a real workspace owner with a valid Antaeus account. | New users evaluating or buying the product | Name, email, password, role | Account created and user either enters a live session or is cleanly told to confirm email | Signup crashes, unclear errors, or the user does not know what to do next | Auth, Onboarding & Activation | 7 |
| Forgot password ([forgot-password.html](c:/AppDev/v1AntaeusApp/Appv2_290126/forgot-password.html)) | Let a locked-out user recover access without support intervention. | Existing users who forgot credentials | Email address | Reset email initiated or a clear recovery message | User cannot tell whether reset worked or is stranded | Auth, Onboarding & Activation | 7 |
| Demo seed ([demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html)) | Seed believable demo data fast enough that a user can tour the app with real-looking motion instead of empty states. | Curious visitors, new users, guided-demo users | Click to seed; optional return target | Workspace populated with demo data and routed back into product | Demo mode feels empty, fake, or dead on arrival | Growth Site & Conversion | 8 |
| Terms ([terms.html](c:/AppDev/v1AntaeusApp/Appv2_290126/terms.html)) | Provide a credible legal baseline for using and buying the product. | Buyers, users, counterparties | Page load only | Reader can understand usage rights, disclaimers, billing frame, and governing entity | Draft placeholders, malformed markup, or broken legal identity erode trust | Trust, Policy & Workspace Ops | 3 |
| Privacy ([privacy.html](c:/AppDev/v1AntaeusApp/Appv2_290126/privacy.html)) | Explain what data is collected, how it is used, and what user rights exist in a trust-building way. | Buyers, users, privacy-conscious reviewers | Page load only | Reader can identify data practices, contact path, and baseline privacy posture | Draft artifacts, placeholder contact info, or malformed content undermine trust | Trust, Policy & Workspace Ops | 3 |

### Activation / App Entry Surfaces
| Surface | Promise | For | Required Input | One-Session Output Required | Failure To Deliver Looks Like | Owner | Score |
|---|---|---|---|---|---|---|---|
| Onboarding ([app/onboarding/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/onboarding/index.html)) | Turn a newly created account into a configured workspace with enough strategic context to start using the app seriously. | New users | Role, company context, goals, baseline GTM inputs | Persisted onboarding profile and a clear transition into welcome | User finishes onboarding but still has no usable workspace context or unclear next step | Auth, Onboarding & Activation | 7 |
| Welcome corridor ([app/welcome/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)) | Orient a new user to the landscape of the app and point them at the first few moves that make the workspace believable. | Onboarding-complete first-session users | Existing workspace state; click on a recommended next action | User understands the lay of the land, chooses a first move, and can return to the welcome guide later | Welcome is generic, redundant, or disconnected from the real workspace | Auth, Onboarding & Activation | 7 |
| Dashboard ([app/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)) | Synthesize the state of the workspace into the next most important GTM decisions and risks. | Active users running their revenue motion | Persisted workspace data across modules | User sees current coverage, weighted pipeline, active risk, and a believable short list of next moves | Dashboard looks like a stats wall without decision value or is wrong because underlying data is thin | Planning, Readiness & Handoff | 6 |
| Settings ([app/settings/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/settings/index.html)) | Give the user control over workspace durability, backup, import, reset, and configuration. | Any active user | Existing workspace state; optional import/export action | User can safely export, import, reset, or adjust workspace preferences | Critical workspace ops feel dangerous, inconsistent, or unclear | Trust, Policy & Workspace Ops | 7 |

### Core App Modules
| Surface | Promise | For | Required Input | One-Session Output Required | Failure To Deliver Looks Like | Owner | Score |
|---|---|---|---|---|---|---|---|
| Signal Console ([app/signal-console/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/signal-console/index.html)) | Turn raw account/company signals into prioritized pursuit-worthy intelligence. | Founders, AEs, SDRs, portfolio helpers | Accounts, signal criteria, research actions | Prioritized signals tied to accounts with enough context to act | User sees noise, shallow enrichment, or no durable signal history | ICP, Signals & Territory Intelligence | 8 |
| ICP Studio ([app/icp-studio/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/icp-studio/index.html)) | Force the user to define who is actually worth selling to and why. | Founders and early GTM builders | ICP hypotheses, scoring factors, market assumptions | Structured ICP definitions with scored accounts or criteria | User leaves with generic persona language, not a usable ICP system | ICP, Signals & Territory Intelligence | 8 |
| Territory Architect ([app/territory-architect/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/territory-architect/index.html)) | Convert a market into a prioritized territory plan instead of an unbounded TAM story. | SDRs, AEs, founders | Segmentation choices, territory logic, target cohorts | A narrowed territory structure with explicit priority logic | Output is still just a list, not a territory strategy | ICP, Signals & Territory Intelligence | 6 |
| Sourcing Workbench ([app/sourcing-workbench/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/sourcing-workbench/index.html)) | Help the user turn target definitions into actual sourced accounts and contacts to work. | SDRs, founders, outbound operators | ICP/territory assumptions, source selections, manual sourcing input | A sourced working list of accounts/contacts with enough detail to use downstream | Workbench does not materially reduce sourcing ambiguity or manual labor | ICP, Signals & Territory Intelligence | 6 |
| Outbound Studio ([app/outbound-studio/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/outbound-studio/index.html)) | Build outbound motion that reflects ICP, signal state, and buyer temperature instead of generic sequencing. | Founders, AEs, SDRs | ICP, signals, message choices, motion assumptions | Outbound plan or messaging that can be used immediately on real accounts | User still has to invent the motion from scratch | Outbound & Contact Execution | 7 |
| LinkedIn Playbook ([app/linkedin-playbook/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/linkedin-playbook/index.html)) | Turn LinkedIn from a vague channel into a repeatable outbound and credibility motion. | Founders, AEs, outbound operators | Target persona, message angle, LinkedIn outreach assumptions | LinkedIn-specific plays or drafts that are usable in-session | Module reads like advice instead of producing a usable plan | Outbound & Contact Execution | 6 |
| Cold Call Studio ([app/cold-call-studio/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/cold-call-studio/index.html)) | Give the user a state-machine-driven cold call path they can use on real calls, then log the outcome. | SDRs, founders, AEs | Target account/persona, opener context, objection handling, call notes | Concrete call flow plus captured call log / next-step intelligence | Module feels like static script advice or the user cannot leave with a call-ready structure | Outbound & Contact Execution | 7 |
| Discovery Studio ([app/discovery-studio/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-studio/index.html)) | Turn a vague discovery conversation into structured buyer intelligence before the pitch. | AEs, founders, discovery-heavy sellers | Deal/account context, hypotheses, discovery framework choices | Discovery plan or framework the user can run immediately | Load fails silently, or user ends with no operational discovery structure | Discovery, Deal & Proof Execution | 4 |
| Call Planner / Discovery Agenda ([app/discovery-agenda/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-agenda/index.html)) | Convert an upcoming meeting into a concrete agenda, talk track, and objective set. | AEs, founders, CSM-like sellers | Upcoming call context, stakeholders, objectives | A usable pre-call agenda and plan | Agenda remains generic or disconnected from the deal/account | Discovery, Deal & Proof Execution | 7 |
| Deal Workspace ([app/deal-workspace/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html)) | Make one live deal legible enough to manage risk, next steps, proof, and stakeholders explicitly. | AEs, founders | Deal details, stage, notes, next steps, stakeholders | A specific deal becomes inspectable and next-step-driven | Deal remains a notes dump without risk logic or action discipline | Discovery, Deal & Proof Execution | 7 |
| PoC Framework ([app/poc-framework/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html)) | Help the user scope and run a proof-of-concept that proves value instead of stalling in vague pilot-land. | AEs, founders, solution sellers | Use case, success criteria, stakeholder alignment, timeline | Concrete PoC plan with success conditions and ownership | Module duplicates chrome, feels noisy, or does not produce a believable proof plan | Discovery, Deal & Proof Execution | 6 |
| Future Autopsy ([app/future-autopsy/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/future-autopsy/index.html)) | Force the user to imagine why a deal will die before it dies, so risk gets managed early. | AEs, founders | Deal/account context, assumptions, risks | Named kill factors and pre-mortem risk actions | Autopsy reads like generic caution instead of changing deal behavior | Discovery, Deal & Proof Execution | 7 |
| Advisor Deploy ([app/advisor-deploy/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/advisor-deploy/index.html)) | Show exactly when and how to deploy an advisor for credibility, access, or proof in a live motion. | Founders, AEs, portfolio operators | Advisor roster, target account/deal, deployment moment | Advisor deployment plan with explicit target and action | User leaves with "maybe ask an advisor" instead of a real deployment move | Discovery, Deal & Proof Execution | 6 |
| Readiness Score ([app/readiness/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/readiness/index.html)) | Tell the user whether their founder-led sales motion is actually ready to scale or hire against. | Founders, investors, platform teams | Existing workspace data across ICP, outreach, discovery, deals, playbook | A believable readiness score with reasons and improvement targets | Score feels arbitrary, shallow, or unsupported by the workspace | Planning, Readiness & Handoff | 7 |
| Quota Workback ([app/quota-workback/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/quota-workback/index.html)) | Turn a revenue goal into a concrete activity and conversion model. | Founders, sales leaders, first operators | Revenue target, ACV assumptions, conversion assumptions | A quota math model with activity and pipeline implications | User still cannot tell what volume is required to hit target | Planning, Readiness & Handoff | 7 |
| Playbook / Founding GTM ([app/founding-gtm/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html)) | Auto-assemble the operating playbook a founder or first hire should actually run from. | Founders, first AEs, investors reviewing GTM maturity | Durable workspace data across modules; optional notes | A coherent playbook/handoff artifact within one session | Playbook is thin, disconnected, or not safe to hand to another operator | Planning, Readiness & Handoff | 7 |

### Methodology Content Surfaces
| Surface | Promise | For | Required Input | One-Session Output Required | Failure To Deliver Looks Like | Owner | Score |
|---|---|---|---|---|---|---|---|
| Methodology index ([methodology/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/index.html)) | Turn a search visitor into a reader who understands that Antaeus has a coherent founder-led sales methodology. | Search visitors, operators, investors | Page load and article selection | Reader can choose a relevant framework page and understand the content cluster | Index feels thin, disconnected, or not obviously tied to the product | Methodology Content Engine | 7 |
| When to hire first salesperson ([when-to-hire-first-sales-person-startup.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/when-to-hire-first-sales-person-startup.html)) | Give founders a practical way to decide whether a first sales hire is actually safe. | Founders | Read-only | Reader leaves with a readiness lens tied to ICP, discovery, outreach, deals, and playbook | Article is fluffy or not operational enough to change the decision | Methodology Content Engine | 8 |
| Founder-led sales process ([founder-led-sales-process.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/founder-led-sales-process.html)) | Show founders how to build a repeatable system before they hire into chaos. | Founders | Read-only | Reader leaves with a concrete process frame | Article reads like generic founder-sales content | Methodology Content Engine | 8 |
| Enterprise discovery framework ([enterprise-discovery-call-framework.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/enterprise-discovery-call-framework.html)) | Teach discovery as structured intelligence collection instead of rapport theater. | AEs, founders | Read-only | Reader leaves with a concrete discovery frame | Article stays conceptual and does not improve discovery execution | Methodology Content Engine | 8 |
| Cold call script state machine ([cold-call-script-b2b-saas.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/cold-call-script-b2b-saas.html)) | Reframe cold calling as stage transitions, not a perfect monologue. | SDRs, founders, AEs | Read-only | Reader leaves with a usable call model | Article is clever but not call-usable | Methodology Content Engine | 8 |
| First AE playbook ([first-ae-playbook.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/first-ae-playbook.html)) | Define what a first rep must inherit so the founder is not outsourcing chaos. | Founders | Read-only | Reader leaves with a concrete inheritance checklist | Article does not clarify what transfer-ready GTM actually means | Methodology Content Engine | 8 |
| Sales handoff kit ([sales-handoff-kit.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-handoff-kit.html)) | Make the handoff asset feel concrete and necessary, not optional. | Founders, first hires | Read-only | Reader leaves with a tangible notion of the handoff kit | Article does not make the handoff asset more usable or credible | Methodology Content Engine | 8 |
| Sales kill-switch framework ([sales-kill-switch-framework.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-kill-switch-framework.html)) | Help operators close zombie deals cleanly and protect the forecast. | Founders, AEs | Read-only | Reader leaves with a concrete kill-switch frame | Article reads like generic deal-hygiene advice | Methodology Content Engine | 8 |
| Sales champion framework ([sales-champion-framework.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-champion-framework.html)) | Help the reader distinguish a real champion from a polite contact. | Founders, AEs | Read-only | Reader leaves with a champion-evaluation rubric | Article does not sharpen real deal judgment | Methodology Content Engine | 8 |
| Portfolio GTM assessment ([portfolio-gtm-assessment.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/portfolio-gtm-assessment.html)) | Give investors and platform teams a better way to assess sales readiness across a portfolio. | VC/platform teams | Read-only | Reader leaves with an assessment lens | Article fails to connect operator detail to portfolio evaluation | Methodology Content Engine | 8 |
| VC platform sales tools ([vc-platform-sales-tools.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/vc-platform-sales-tools.html)) | Explain what platform teams actually need instead of more dashboard theater. | VC/platform teams | Read-only | Reader leaves with a sharper view of the platform value proposition | Article does not improve investor-platform positioning | Methodology Content Engine | 8 |

### Standalone Launch-Agent Surfaces
| Surface | Promise | For | Required Input | One-Session Output Required | Failure To Deliver Looks Like | Owner | Score |
|---|---|---|---|---|---|---|---|
| Launch Agent dashboard ([antaeus-launch-agent/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/antaeus-launch-agent/dashboard/index.html)) | Keep the entire warm-outreach motion in one local operating room. | Founder/operator running Phase 12-style outreach | Local data store, keys, persona/focus choices | Visible prospect universe, queue, engagement state, and reports that can be reviewed in one place | Dashboard shows mode activity but not a trustworthy operating picture | Launch Agent | 7 |
| Scout mode ([antaeus-launch-agent/modes/scout.js](c:/AppDev/v1AntaeusApp/Appv2_290126/antaeus-launch-agent/modes/scout.js)) | Build or refresh a targetable prospect universe from live or mock research. | Founder/operator | Persona, focus, limit, source pack | New or updated prospects with heat, signals, and track | Scout falls back silently, returns junk, or cannot convert browsing into prospects | Launch Agent | 7 |
| Composer mode ([antaeus-launch-agent/modes/composer.js](c:/AppDev/v1AntaeusApp/Appv2_290126/antaeus-launch-agent/modes/composer.js)) | Turn prospect context into persona-aware outreach drafts worth reviewing. | Founder/operator | Prospect records, messaging matrix, optional URLs/assets | Draft messages queued for manual review | Output is generic, off-persona, or not safe to send after review | Launch Agent | 6 |
| Network Mapper mode ([antaeus-launch-agent/modes/network-mapper.js](c:/AppDev/v1AntaeusApp/Appv2_290126/antaeus-launch-agent/modes/network-mapper.js)) | Surface warm paths, validation-network overlap, and advisor deployment opportunities. | Founder/operator | Prospect universe plus validation network data | Warm-path recommendations attached to prospects | Output stays theoretical and does not produce concrete routes | Launch Agent | 6 |
| Qualifier mode ([antaeus-launch-agent/modes/qualifier.js](c:/AppDev/v1AntaeusApp/Appv2_290126/antaeus-launch-agent/modes/qualifier.js)) | Classify a reply and suggest the right next touch instead of leaving follow-up to vague instinct. | Founder/operator | Reply text, existing prospect state | A reply classification and explicit next-touch recommendation | The user still does not know whether the reply is positive, neutral, soft-no, or route-worthy | Launch Agent | 6 |

## Module Owner List

### Growth Site & Conversion
- `/` landing page
- `demo-seed.html`

### Auth, Onboarding & Activation
- `login.html`
- `signup.html`
- `forgot-password.html`
- `app/onboarding/`
- `app/welcome/`

### Product Shell & Navigation
- app shell behavior that spans the whole product

### ICP, Signals & Territory Intelligence
- `app/signal-console/`
- `app/icp-studio/`
- `app/territory-architect/`
- `app/sourcing-workbench/`

### Outbound & Contact Execution
- `app/outbound-studio/`
- `app/linkedin-playbook/`
- `app/cold-call-studio/`

### Discovery, Deal & Proof Execution
- `app/discovery-studio/`
- `app/discovery-agenda/`
- `app/deal-workspace/`
- `app/poc-framework/`
- `app/future-autopsy/`
- `app/advisor-deploy/`

### Planning, Readiness & Handoff
- `app/dashboard/`
- `app/readiness/`
- `app/quota-workback/`
- `app/founding-gtm/`

### Trust, Policy & Workspace Ops
- `app/settings/`
- `terms.html`
- `privacy.html`

### Methodology Content Engine
- `/methodology/`
- the 10 methodology article pages

### Launch Agent
- launch-agent dashboard
- Scout
- Composer
- Network Mapper
- Qualifier

## Baseline Read

### Strongest current promises
- Signal Console
- ICP Studio
- demo seed
- methodology content pages
- login/auth routing

### Weakest current promises
- Terms
- Privacy
- Discovery Studio
- several territory / sourcing / LinkedIn surfaces that still lean too heavily on user discipline

### Highest-risk promise gaps
- landing page promise is stronger than the current self-serve purchase path
- welcome corridor is real, but still not yet the complete activation system the product needs
- Discovery Studio is promising structured discovery, but current silent-failure behavior makes that promise fragile
- legal/trust surfaces are not yet good enough to support premium self-serve trust
- some modules still require the user to supply too much structure manually before the module feels magical

### Surfaces still at risk of reading as "general GTM help"
- none in sentence form after this pass
- several are still at risk in lived experience, though:
  - Territory Architect
  - Sourcing Workbench
  - LinkedIn Playbook
  - Advisor Deploy
  - Network Mapper
- these are not promise-definition problems anymore; they are delivery-depth problems

## Exit-Criteria Check
- Every module has a one-sentence promise: yes
- No module remains "general GTM help": yes on paper; several still need product-depth work to make the promise fully credible in use
