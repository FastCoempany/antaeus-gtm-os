# Phase 19 - Landing Page Conversion System

Date: 2026-03-22

## Objective
Upgrade the landing page from a strong narrative surface into a more decisive conversion system.

## Constraint
Billing is still intentionally deferred. That means this phase could not honestly close the full commercial loop yet. The correct goal here was:
- clarify the buyer
- reduce CTA ambiguity
- make demo the strongest immediate action
- keep purchase honest instead of fake-live
- make the "what happens after purchase" corridor legible

## Files Changed
- [index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/index.html)
- [js/commerce-config.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/commerce-config.js)

## What Changed

### 1. Primary buyer is now more explicit
The hero no longer speaks as broadly about "founder-led sales" in the abstract.

It now frames the buyer more concretely:
- founder-led B2B team
- before or just after the first serious sales hire
- founder or first GTM operator
- motion still living in people's heads

That makes the page easier to self-qualify against.

### 2. CTA ladder is now cleaner
Before this pass:
- hero CTA pushed straight toward price
- demo existed, but not as the strongest primary action

After this pass:
- primary hero CTA = demo workspace
- secondary hero CTA = annual plan
- methodology remains available as a lower-friction proof path
- nav CTA now explicitly says `See Annual Plan`

This better matches the current truth:
- demo is live and useful
- purchase path exists
- billing is not yet fully activated

### 3. Pricing section now reassures instead of only listing features
The pricing surface now does more than list modules.

It now answers:
- who the plan is for
- what happens after purchase
- what first-session success should look like

This reduces the "buy now, then what?" ambiguity that was still present.

### 4. Post-purchase path is now explicit on the landing page
The page now tells the buyer:
- purchase flow
- success page
- create account or sign in
- onboarding
- welcome guide
- real workspace

That matters because the product has a real activation corridor now, and the landing page should stop acting like payment alone is the whole story.

### 5. FAQ objections were tightened
The FAQ now does a better job handling real launch objections:
- who this is actually for
- CRM confusion
- before vs after first AE hire
- demo vs free trial
- what happens after payment
- single-user vs multi-seat truth

The answers are less generic and more operational.

### 6. Support contact truth was normalized
[js/commerce-config.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/commerce-config.js) now uses:
- `hello@antaeus.app`

That keeps purchase-facing surfaces aligned with the updated public contact.

## Why This Is Better
Before this phase, the landing page was persuasive but still made the visitor do too much interpretation:
- who exactly is this for?
- should I click demo or buy?
- what happens after purchase?
- is this really for before the first AE, or after?

After this phase, the page is more decisive:
- buyer is clearer
- action ladder is clearer
- purchase corridor is clearer
- demo is elevated appropriately

## What This Phase Does Not Claim
- It does not make billing operationally live.
- It does not add customer portal / renewal / cancellation management.
- It does not complete the full top-of-funnel system by itself.
- It does not replace the need for stronger public proof.

That work still lives in later phases.

## Evidence Board Impact
- `EB-L01` moves from `open` to `local-patch`

Reason:
- repo-side landing conversion work is in
- full top-of-funnel closure still depends on billing activation and live validation

## Manual Verification
After deploy, verify:

1. Hero
- primary CTA goes to demo
- secondary CTA goes to annual plan

2. Nav
- `Explore Demo` goes to demo
- `See Annual Plan` goes to purchase flow

3. Pricing
- price button goes to purchase flow
- reassurance cards render correctly

4. Final CTA
- demo button goes to demo
- annual plan link goes to purchase flow

5. FAQ
- all questions open/close
- updated copy reads cleanly on desktop and mobile

## Exit Read
Phase 19 does not finish commerce, but it does make the landing page more honest and more useful:
- the buyer can understand whether the product is for them
- the strongest action is now aligned with current product truth
- the purchase corridor is explicit instead of implied
- pricing and FAQ now answer more of the real objections without forcing the visitor to guess
