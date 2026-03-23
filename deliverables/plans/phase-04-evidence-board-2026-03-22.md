# Phase 4 - Evidence Board

Date: 2026-03-22  
Companion to:
- [phase-01-promise-matrix-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-01-promise-matrix-2026-03-22.md)
- [phase-02-input-output-matrix-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-02-input-output-matrix-2026-03-22.md)
- [phase-03-9of10-rubric-definition-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-03-9of10-rubric-definition-2026-03-22.md)
- [antaeus-app-end-to-end-audit-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/audits/antaeus-app-end-to-end-audit-2026-03-22.md)

## Purpose
This board replaces memory, chat fragments, and "I know there was an issue somewhere" with one tracked operating record.

Every finding below is tied to:
- category
- why it matters
- proof
- owner
- target phase
- priority
- status

If a major problem is not on this board, it is not yet part of the program.

## How To Use This Board
1. When a new issue appears, add it here before trying to hold it in memory.
2. Every rebuild phase should pull from the relevant board items.
3. When an item is fixed, update the status and attach the proof.
4. If an item is strategic rather than patch-level, keep it here until a decision is made.

## Status Legend
- `open`: acknowledged and not yet addressed
- `local-patch`: code or content exists locally but is not yet safely deployed / verified
- `external-config`: blocked on dashboard/provider/account setup outside the repo
- `decision-needed`: founder/business decision required
- `validated`: fixed and verified
- `monitor`: not a blocker today, but important enough to keep visible

## Priority Legend
- `P0`: launch-blocking
- `P1`: high impact, should be handled in the near wave
- `P2`: important but not immediately launch-blocking
- `P3`: monitor / later refinement

## Git / Artifact Policy
Pushing to git is not mandatory for every scratch note, but for this program it should be treated as the default for:
- completed phase deliverables
- app changes you expect Cloudflare to deploy
- fixes you may need to revisit or roll back

Reason:
- local-only work is not durable evidence
- Cloudflare cannot deploy uncommitted changes
- this board itself fails if the underlying artifacts live only on one machine

Recommended rule:
- every completed program phase gets committed
- every meaningful patch batch gets committed
- experiments can remain local, but should not be confused with program progress

## Evidence Board

### A. Funnel Blockers
| ID | Finding | Why It Matters | Proof | Owner | Target Phase | Priority | Status |
|---|---|---|---|---|---|---|---|
| EB-F01 | Landing pricing CTA does not resolve to a real checkout flow. | Top-of-funnel is not truly end to end until a buyer can pay. | [index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/index.html) still uses `href="#buy"` / `id="buyBtn"` rather than a real checkout URL. | Growth Site & Conversion | Phase 6 | P0 | open |
| EB-F02 | Subscription management truth is missing. | Self-serve paid launch requires cancellation, renewal, billing-state, and customer-portal truth. | Repo has planning references, but no real portal / subscription-management flow wired in public product path. | Growth Site & Conversion | Phase 7 | P0 | open |
| EB-F03 | Signup can hit email send throttles. | Even when code works, project-level auth throttling can block account creation during launch/testing. | Live signup now surfaces `email rate limit exceeded`; this is a real Supabase Auth throttle, not the old JS crash. | Auth, Onboarding & Activation | Phase 8 | P1 | external-config |
| EB-F04 | Public proof layer is still weak. | Buyers will resist a system-level product if there is not enough visible proof of outcomes. | Audit flagged proof/testimonial readiness as weak; public site and legal/trust surfaces still carry more methodology than proof. | Growth Site & Conversion | Phase 10 | P1 | open |
| EB-F05 | Pricing / packaging truth is not fully aligned to current manual-input burden. | A product that still asks for high discipline may need different packaging or expectations than pure self-serve software. | Audit conclusion: current public price can work, but the product may need higher-value packaging if it remains manual-heavy. | Growth Site & Conversion | Phase 11 | P1 | decision-needed |
| EB-F06 | Commercial copy consistency still drifts between surfaces. | Mixed claims across landing, welcome, modules, and methodology creates expectation mismatch. | Phase 1 promise matrix versus current live copy shows some surfaces still stronger/weaker than the actual product. | Growth Site & Conversion | Phase 12 | P1 | open |

### B. Trust Blockers
| ID | Finding | Why It Matters | Proof | Owner | Target Phase | Priority | Status |
|---|---|---|---|---|---|---|---|
| EB-T01 | Terms page was not publish-ready. | Cold buyers cannot trust the product if legal identity and usage rights look broken. | Phase 9 rewrote [terms.html](c:/AppDev/v1AntaeusApp/Appv2_290126/terms.html) into a publishable version with real product/storage/commercial truth. | Trust, Policy & Workspace Ops | Phase 9 | P0 | validated |
| EB-T02 | Privacy page was not publish-ready. | Privacy is a direct trust and procurement issue. | Phase 9 rewrote [privacy.html](c:/AppDev/v1AntaeusApp/Appv2_290126/privacy.html) into a publishable version with accurate data-flow/provider truth. | Trust, Policy & Workspace Ops | Phase 9 | P0 | validated |
| EB-T03 | Public-facing mojibake / encoding regressions existed across public and core app surfaces. | Encoding defects make the product feel careless and unsafe. | Phase 13 normalized [index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/index.html), [js/tour-guide.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/tour-guide.js), [js/guided-rail.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/guided-rail.js), [app/poc-framework/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html), and [methodology/sales-champion-framework.html](c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-champion-framework.html). Targeted mojibake scan now returns no matches on public/core app surfaces. | Trust, Policy & Workspace Ops | Phase 13 | P1 | validated |
| EB-T04 | Billing/support/refund truth is still not legible to a stranger. | Even with checkout fixed, users need to know what happens after payment. | Audit explicitly called out trust/legal/billing truth as weak. | Growth Site & Conversion | Phase 7 | P1 | open |

### C. Reliability / Bug Findings
| ID | Finding | Why It Matters | Proof | Owner | Target Phase | Priority | Status |
|---|---|---|---|---|---|---|---|
| EB-R01 | Discovery Studio can appear not to load. | This directly breaks one of the most important execution surfaces. | Phase 16 replaced swallowed boot catches in [app/discovery-studio/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-studio/index.html) with visible loading/error cards and a retry action. Manual browser verification is still required before closure. | Discovery, Deal & Proof Execution | Phase 34 / Phase 16 | P0 | local-patch |
| EB-R02 | Sidebar scroll position reset instead of respecting where the user clicked. | It breaks continuity in a long nav and makes the shell feel unstable. | Initial Phase 14 scroll persistence was not sufficient in real use. The current local patch in [js/nav.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js) now stores both raw scroll and an anchor module plus viewport offset, then reapplies restore across multiple boot passes. Manual browser verification is still required before closure. | Product Shell & Navigation | Phase 14 | P1 | local-patch |
| EB-R03 | PoC Framework can show duplicate progress/banner chrome. | Duplicate injected UI makes the product feel buggy and stacked. | Phase 15 hardened [js/guided-rail.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/guided-rail.js) so each render pass first removes any existing rail before inserting a new one. This addresses the stacked banner path reported on [app/poc-framework/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/poc-framework/index.html). Manual browser verification is still required before closure. | Discovery, Deal & Proof Execution | Phase 37 / Phase 15 | P1 | local-patch |
| EB-R04 | Shared chrome injection rules are uneven. | Repeated injection patterns can create duplicate or conflicting UI across modules. | Phase 15 added idempotency guards in [js/save-indicator.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/save-indicator.js), [js/guided-rail.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/guided-rail.js), and [js/module-tooltips.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/module-tooltips.js). Manual browser verification is still required before closure. | Product Shell & Navigation | Phase 15 | P1 | local-patch |
| EB-R05 | Silent failure paths required a classified full sweep. | Silent failure destroys trust and makes debugging impossible for real users. | Phase 16 now patches visible boot-state handling across the scanned boot-critical modules and replaces empty catches in shared helpers with explicit logging. The swallowed-catch scan over `app`, `js`, `auth`, public auth pages, methodology, purchase, and root surfaces now returns zero matches for empty catch handlers. Manual browser verification is still required before closure. | Product Shell & Navigation | Phase 16 | P0 | local-patch |
| EB-R09 | Persistence control state could leak between demo and real workspace flows, and durable docs could fail cloud sync on nullable defaults. | Durable workspace truth stops being believable if demo, no-auth, import, delete, and cache states can bleed into each other, or if import/delete fail because `sequences.data` rejects `null`. | Phase 17 hardened [demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html), [app/settings/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/settings/index.html), [js/data-manager.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/data-manager.js), and [js/supabase-config.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/supabase-config.js) so demo cleanup is deterministic, demo exit clears real control flags, import/delete normalize persistence state, and nullable durable docs serialize safely into the non-null `public.sequences.data` column. Manual matrix verification is still required before closure. | Trust, Policy & Workspace Ops | Phase 17 | P0 | local-patch |
| EB-R06 | Observability and diagnostics were too thin for launch conditions. | Without diagnostics, the product will fail in ways that are hard to reproduce. | Phase 18 adds local diagnostics state, global JS error capture, module boot telemetry, page-leave usage depth, and lifecycle instrumentation in [js/analytics.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/analytics.js), [js/module-boot-state.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/module-boot-state.js), [app/onboarding/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/onboarding/index.html), [app/welcome/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html), and [app/dashboard/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html). Live verification is still required before closure. | Product Shell & Navigation | Phase 18 | P1 | local-patch |
| EB-R07 | Data-flow nav badge logic is likely broken against the current nav implementation. | Surface-level progress signals may not actually appear where intended. | Phase 15 updated [js/data-flow.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/data-flow.js) to target the live `.nav-item` shell and resolve target modules from either `href` or `data-nav`. Manual browser verification is still required before closure. | Product Shell & Navigation | Phase 15 | P2 | local-patch |
| EB-R08 | Welcome and tour patches exist locally but may not be deployment-safe until committed and verified. | Local-only fixes do not count as app truth. | Recent welcome/tour patches were discussed and edited locally; git status shows many local-only artifacts and uncommitted changes. | Auth, Onboarding & Activation | Phase 22 / Phase 23 | P1 | local-patch |

### D. Activation / Lifecycle Gaps
| ID | Finding | Why It Matters | Proof | Owner | Target Phase | Priority | Status |
|---|---|---|---|---|---|---|---|
| EB-A01 | Welcome corridor is real, but still not yet the complete first-session system. | The welcome layer needs to teach the landscape, route correctly, and remain revisitable. | Current [app/welcome/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html) exists and is directionally good, but the master plan still reserves Welcome 2.0 and Welcome-specific work. | Auth, Onboarding & Activation | Phase 22 / Phase 43 | P1 | open |
| EB-A02 | Tour is present but not self-serve effective. | New users still cannot learn the whole system well enough from the current tour. | Audit score for tour efficacy was `4/10`; [js/tour-guide.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/tour-guide.js) is helpful orientation, not a full activation engine. | Auth, Onboarding & Activation | Phase 23 | P1 | open |
| EB-A03 | Demo seed must remain synchronized with every demo-critical module. | If seed coverage lags the modules, the tour and explainer lose credibility. | Phase 2 makes demo-seed coverage a first-class rule; [demo-seed.html](c:/AppDev/v1AntaeusApp/Appv2_290126/demo-seed.html) is broad but not automatically future-proof. | Auth, Onboarding & Activation | Phase 21 | P1 | monitor |
| EB-A04 | First 7 days user lifecycle is not yet formalized. | Activation does not stop at welcome; retention begins immediately. | Master plan reserves a dedicated phase for the first-7-days lifecycle; no such operating layer is yet visible in the product. | Auth, Onboarding & Activation | Phase 24 | P2 | open |

### E. Module Promise Failures / Gaps
| ID | Finding | Why It Matters | Proof | Owner | Target Phase | Priority | Status |
|---|---|---|---|---|---|---|---|
| EB-M01 | Territory Architect promise is stronger than current visible output depth. | It risks feeling like strategic theater instead of a working territory engine. | Phase 1 score `6`; audit flagged it as broad but still too manual / not yet deep enough. | ICP, Signals & Territory Intelligence | Phase 28 | P1 | open |
| EB-M02 | Sourcing Workbench still depends too much on user discipline. | It should materially reduce sourcing ambiguity and labor. | Phase 1 score `6`; audit classified the sourcing layer as too manual. | ICP, Signals & Territory Intelligence | Phase 29 | P1 | open |
| EB-M03 | LinkedIn Playbook still reads too much like advice. | The module should produce more operational channel output, not just guidance. | Phase 1 score `6`; audit called Cold Call / LinkedIn mostly playbook + logging. | Outbound & Contact Execution | Phase 32 | P1 | open |
| EB-M04 | Discovery Studio is below promise threshold. | It promises structured buyer intelligence but currently has a reliability and surface-state problem. | Phase 1 score `4`; audit flagged visible load risk and silent failures. | Discovery, Deal & Proof Execution | Phase 34 | P0 | open |
| EB-M05 | PoC Framework needs stronger proof-operating depth. | This module should make proof real, not just annotate a pilot. | Phase 1 score `6`; audit flagged noisy chrome and incomplete proof-operating feel. | Discovery, Deal & Proof Execution | Phase 37 | P1 | open |
| EB-M06 | Advisor Deploy needs more concrete deployment output. | "Maybe use an advisor" is not enough; this module needs explicit move design. | Phase 1 score `6`; audit flagged it as not yet concrete enough. | Discovery, Deal & Proof Execution | Phase 38 | P2 | open |
| EB-M07 | Playbook / handoff can become disconnected if upstream modules stay sparse. | The supreme output is only as good as the evidence feeding it. | [app/founding-gtm/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html) pulls from many data sources; if upstream usage is weak, the handoff kit will feel thin. | Planning, Readiness & Handoff | Phase 40 | P1 | monitor |
| EB-M08 | Readiness is meaningful, but score reasoning must get more legible and actionable. | If the score feels arbitrary, it loses strategic authority. | Master plan Phase 41 already notes: expose score reasoning, connect gaps to actions. | Planning, Readiness & Handoff | Phase 41 | P2 | open |
| EB-M09 | Dashboard value is capped by upstream discipline. | The command surface can only be as good as the data fed into it. | Audit: dashboard is real but can degrade into stats without enough structured upstream input. | Planning, Readiness & Handoff | Phase 25 | P1 | monitor |
| EB-M10 | Launch Agent is strategically strong but still separate from the core app story. | It creates upside but also product-boundary ambiguity. | `antaeus-launch-agent` now works meaningfully, but remains separate from core app activation and pricing story. | Launch Agent | Phase 48 | P2 | open |

### F. Automation Opportunities
| ID | Finding | Why It Matters | Proof | Owner | Target Phase | Priority | Status |
|---|---|---|---|---|---|---|---|
| EB-AU01 | The product is still a high-discipline operator amplifier, not a low-discipline automation machine. | This affects retention, pricing, and self-serve viability. | Audit radio-dial scored many modules around `2-4/10` on automation value. | Product Shell & Navigation | Phase 45 | P1 | open |
| EB-AU02 | Cross-module compounding rules are not explicit enough in-product. | Users should feel the handshake, not infer it mentally. | Phase 2 defines the handshake map, but the product does not yet consistently teach or enforce it. | Product Shell & Navigation | Phase 46 | P1 | open |
| EB-AU03 | ICP scoring still asks for too much manual interpretation. | Better inference would make targeting feel more powerful. | Audit rated ICP Studio as strong but still manual-heavy on the automation dial. | ICP, Signals & Territory Intelligence | Phase 27 / Phase 45 | P2 | open |
| EB-AU04 | Outbound execution is methodologically complete but operationally fragmented. | This blocks the "system, not toolkit" feeling. | Audit conclusion: outbound is covered end to end methodologically, but not automated end to end operationally. | Outbound & Contact Execution | Phase 30 / Phase 45 | P1 | open |
| EB-AU05 | Cold call and LinkedIn surfaces need stronger automation or generated leverage. | Otherwise they remain smart logging/playbook layers, not force multipliers. | Audit rated Cold Call / LinkedIn around `2/10` on automation value. | Outbound & Contact Execution | Phase 31 / Phase 32 / Phase 45 | P2 | open |
| EB-AU06 | Discovery and deal/proof surfaces need stronger auto-fill from prior context. | The user should not re-enter the same strategic context across modules. | Phase 2 explicitly called for inference from prior modules; current experience still relies heavily on manual carryover. | Discovery, Deal & Proof Execution | Phase 33-38 / Phase 45 | P1 | open |

### G. Top-of-Funnel / Launch Readiness Gaps
| ID | Finding | Why It Matters | Proof | Owner | Target Phase | Priority | Status |
|---|---|---|---|---|---|---|---|
| EB-L01 | Top-of-funnel is broad but not fully closed. | Visibility without conversion truth is not enough. | Audit identified missing real checkout, customer portal, and buyer-proof/trust completeness. | Growth Site & Conversion | Phase 19 / Phase 20 | P0 | open |
| EB-L02 | Methodology content is live, but the bridge into product can be stronger. | SEO pages should compound into product understanding, not remain detached thought pieces. | Methodology pages exist and are strong, but the product bridge is still mostly CTA-level. | Methodology Content Engine | Phase 20 | P2 | open |
| EB-L03 | Demo lane needs to be treated as a product lane, not just a seed page. | Demo is part of acquisition, activation, and the future explainer path. | Master plan has dedicated Demo Lane Productization phase; current `demo-seed.html` is functional but still a utility surface. | Growth Site & Conversion | Phase 21 | P1 | open |
| EB-L04 | Public launch gate should not be opened yet. | The current state is better suited to guided beta than broad self-serve. | Audit verdict: ready for guided beta/design partners, not ready for broad self-serve paid launch. | Growth Site & Conversion | Phase 52 | P0 | monitor |

### H. Program / Ops Findings
| ID | Finding | Why It Matters | Proof | Owner | Target Phase | Priority | Status |
|---|---|---|---|---|---|---|---|
| EB-P01 | Key findings and deliverables have been living in chat and local files instead of one board. | That causes drift, rework, and "I thought that was fixed" confusion. | This board did not exist before Phase 4. | Product Shell & Navigation | Phase 4 | P1 | validated |
| EB-P02 | Local-only changes have repeatedly been confused with deployed truth. | This creates false confidence and Cloudflare confusion. | Current `git status` shows many local modified/untracked files while `git push` previously returned `Everything up-to-date`. | Product Shell & Navigation | Phase 4 / Phase 5 | P1 | open |
| EB-P03 | Program artifacts are not consistently committed. | If a phase deliverable is not committed, it is not durable program evidence. | Current `git status` shows planning deliverables and app changes untracked or local-only. | Product Shell & Navigation | Phase 4 | P1 | open |
| EB-P04 | The end-to-end QA matrix is not yet formalized. | Without it, launch readiness will still depend on informal testing. | Master plan explicitly reserves Phase 51 for this; current QA exists in fragments. | Product Shell & Navigation | Phase 51 | P1 | open |

## Current High-Priority Queue
If the program had to work a short queue first, it should be:

1. `EB-F01` real purchase path  
2. `EB-T01` terms publish pass  
3. `EB-T02` privacy publish pass  
4. `EB-R01` Discovery Studio reliability  
5. `EB-R02` nav scroll stability  
6. `EB-R03` PoC duplicate banner / shared chrome cleanup  
7. `EB-R09` persistence control-state cleanup  
8. `EB-A02` tour rebuild  
9. `EB-L03` demo lane productization  
10. `EB-M07` handoff-kit integrity via upstream compounding  
11. `EB-P03` commit discipline for program artifacts

## What This Board Makes True
After Phase 4:
- no major issue has to live only in memory
- no major issue has to live only in chat
- every major problem now points to an owner and a downstream program phase
