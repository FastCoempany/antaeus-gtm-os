# Antaeus Full-Product Design QA And Polish Pass

Date: 2026-03-31

Status: repo-side audit complete, high-value polish patch applied

Purpose: close the redesign program with one explicit pass that separates:

- finished redesign work
- immediately patchable polish defects
- remaining design-system debt that is real but not launch-breaking

---

## 1. Scope

This pass reviewed:

- app shell and redesigned interior surfaces
- auth and trust corridor
- purchase corridor
- methodology family
- public perimeter convergence surfaces

The pass focused on:

- typography consistency
- CTA language consistency
- residual legacy chrome
- public-edge family coherence
- obvious encoding/copy residue

---

## 2. What The Pass Confirmed

The redesign is materially coherent across the product interior.

Confirmed as already behaving like one family:

- shell and left rail
- dashboard and welcome
- core operating surfaces
- trust corridor
- purchase corridor structure
- public/demo convergence direction

The remaining problems were not broad structural failures. They were concentrated in the methodology/public family and a smaller layer of source-level legacy residue inside some modules.

---

## 3. Issues Found

### P1: Methodology family still carried the older public skin

Findings:

- methodology still declared `Instrument Sans` as its active sans family
- methodology nav/footer/article CTAs still used older language such as:
  - `Get Started`
  - `Explore Demo`
  - `Methodology Index`
  - `See pricing and modules`

Why it mattered:

- the app interior, auth corridor, purchase corridor, demo lane, and public edge had already converged on a newer public family
- methodology was still reading like a parallel site instead of the same product perimeter

### P2: Purchase corridor carried older demo CTA wording

Findings:

- purchase entry still used `Explore Demo`
- cancelled purchase path still used `Explore Demo`

Why it mattered:

- the public edge had already standardized around `Explore Demo Lane`
- the older wording weakened the sense that the perimeter is one deliberate system

### P2: Purchase flow copy still had one avoidable formatting residue

Finding:

- purchase flow copy still used smart-quote phrasing in a way that read like imported copy instead of normalized product text

Why it mattered:

- small issue, but this pass exists to remove those last “stitched together” signals

### P2: Local bridge residue still exists in source across several modules

Findings:

- several modules still contain older bridge-specific classes or strings in source:
  - `dw-bridge`
  - `cp-bridge`
  - `ds-bridge`
  - `poc-bridge`
  - `fa-bridge`
  - `ta-bridge`
  - `sw-bridge`
  - `settings-bridge`
  - related “bridge” runtime strings

Why it matters:

- this is real design-system debt
- but most of it is no longer visually dominant after the shell and anchor-module waves
- it is primarily cleanup debt now, not a launch-blocking user-visible fracture

---

## 4. What Was Fixed In This Pass

### Fixed now

- methodology sans family aligned to `Public Sans`
- methodology hub and article CTA language aligned to:
  - `Explore Demo Lane`
  - `See Annual Plan`
  - `Methodology`
- methodology article inline “Where this shows up” purchase CTA aligned to `See Annual Plan`
- purchase nav demo CTA aligned to `Explore Demo Lane`
- purchase cancelled demo CTA aligned to `Explore Demo Lane`
- purchase flow wording normalized from imported smart-quote phrasing to plain product copy

Files changed:

- [css/methodology.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/methodology.css)
- [js/methodology-bridge.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/methodology-bridge.js)
- [methodology/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/index.html)
- [methodology/when-to-hire-first-sales-person-startup.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/when-to-hire-first-sales-person-startup.html)
- [methodology/founder-led-sales-process.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/founder-led-sales-process.html)
- [methodology/enterprise-discovery-call-framework.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/enterprise-discovery-call-framework.html)
- [methodology/cold-call-script-b2b-saas.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/cold-call-script-b2b-saas.html)
- [methodology/first-ae-playbook.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/first-ae-playbook.html)
- [methodology/sales-handoff-kit.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-handoff-kit.html)
- [methodology/sales-kill-switch-framework.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-kill-switch-framework.html)
- [methodology/sales-champion-framework.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/sales-champion-framework.html)
- [methodology/portfolio-gtm-assessment.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/portfolio-gtm-assessment.html)
- [methodology/vc-platform-sales-tools.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/methodology/vc-platform-sales-tools.html)
- [purchase/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/purchase/index.html)
- [purchase/cancelled/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/purchase/cancelled/index.html)

Verification:

- `node --check js/methodology-bridge.js`
- targeted grep confirmed the old public-family wording is no longer the active surface wording in methodology or purchase

---

## 5. What Remains

### Remaining P2 cleanup

- module source files still contain older bridge-specific class names and helper blocks
- those should eventually be converged or removed so the codebase reflects the shipped design system more honestly

### Remaining validation work

- one last live browser sweep should still confirm:
  - methodology hub
  - 2 to 3 methodology articles
  - purchase
  - purchase cancelled

### Remaining optional polish

- source-level naming cleanup so older bridge terminology stops appearing in runtime strings and CSS even where it is no longer visually dominant

---

## 6. Verdict

The final full-product design QA and polish pass did **not** uncover a new structural redesign problem.

It found:

- one meaningful public-family inconsistency cluster
- a small purchase wording inconsistency
- a remaining layer of source-level bridge debt

The meaningful public-family inconsistency cluster is now patched.

Practical result:

- the redesign is visually and behaviorally coherent enough to treat as complete in product terms
- what remains is cleanup debt and final live confirmation, not another major redesign wave
