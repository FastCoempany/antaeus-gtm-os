# Phase 6 — Purchase Path Wiring

## Objective
Make purchase real instead of implied.

## Current Truth Before This Phase
- Landing CTAs pointed to `#pricing` and `#buy`, not a real commerce flow.
- The FAQ claimed "immediate access" after payment, but the repo had no purchase entry page, no success page, no cancel page, and no contextual post-purchase auth messaging.
- The app had onboarding, welcome, and dashboard routing truth, but nothing explicit connected payment into that corridor.

## Repo-Side Changes Implemented

### 1. Added commerce configuration
- New file: [js/commerce-config.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/commerce-config.js)
- Defines:
  - plan name
  - price label
  - billing label
  - support email
  - checkout URL config point
  - success path
  - cancel path

### 2. Added commerce helper
- New file: [js/commerce.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/commerce.js)
- Provides:
  - `window.gtmCommerce.getMeta()`
  - `window.gtmCommerce.getCheckoutUrl()`
  - `window.gtmCommerce.hasCheckoutUrl()`
  - `window.gtmCommerce.setCheckoutUrl(url)`
- Supports a local override using `localStorage['gtmos_checkout_url']`

### 3. Added purchase entry page
- New file: [purchase/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/purchase/index.html)
- Purpose:
  - explain exactly what happens after payment
  - expose the live checkout button if configured
  - fail honestly if checkout is not configured yet
  - route buyers into account creation or sign-in

### 4. Added success and cancel states
- New file: [purchase/success/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/purchase/success/index.html)
- New file: [purchase/cancelled/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/purchase/cancelled/index.html)
- Purpose:
  - make the post-checkout corridor explicit
  - remove ambiguity after payment
  - provide direct create-account and sign-in paths

### 5. Patched landing page CTA behavior
- Updated [index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/index.html)
- Landing CTAs now rewrite to:
  - `/purchase/?entry=nav`
  - `/purchase/?entry=hero`
  - `/purchase/?entry=pricing`
  - `/purchase/?entry=final`

### 6. Patched signup and login for post-purchase context
- Updated [signup.html](c:/AppDev/v1AntaeusApp/Appv2_290126/signup.html)
- Updated [login.html](c:/AppDev/v1AntaeusApp/Appv2_290126/login.html)
- Added contextual callouts when `?source=checkout` is present
- This tells the buyer what to do next instead of dropping them into a generic auth form

## The New Purchase Corridor
1. Visitor clicks a CTA on the landing page
2. Visitor lands on `/purchase/`
3. If checkout is configured:
   - visitor continues to the live payment link
4. If payment succeeds:
   - visitor should land on `/purchase/success/`
5. Visitor creates an account or signs in using the same email from checkout
6. Existing route truth takes over:
   - onboarding incomplete → `/app/onboarding/`
   - onboarding complete + welcome unseen → `/app/welcome/`
   - otherwise → `/app/dashboard/`

## Remaining External Dependency
The repo-side path is built, but the actual payment link still must be configured.

You still need to provide a live Stripe Payment Link either by:
- setting `checkoutUrl` in [js/commerce-config.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/commerce-config.js), or
- running this in the browser once:

```js
localStorage.setItem('gtmos_checkout_url', 'https://buy.stripe.com/your-real-link');
```

## Required Stripe Dashboard Setup
The payment link must be configured so that:
- successful payment returns the buyer to:
  - `https://antaeus.app/purchase/success/`
- cancelled payment returns the buyer to:
  - `https://antaeus.app/purchase/cancelled/`

## What This Phase Solves
- removes fake `#buy` commerce behavior
- gives the user a real commercial bridge
- makes post-payment next steps explicit
- makes the app's purchase story believable

## What This Phase Does Not Yet Solve
- Stripe entitlement / seat enforcement
- webhook-based commercial state
- customer portal / billing management
- purchase verification server-side

## Exit Criteria Status
- user can move from landing to purchase page without ambiguity: **done**
- user can see success and cancel states without ambiguity: **done**
- user can move from purchase-success into signup/sign-in with context: **done**
- user can complete real live payment end to end: **blocked on external Stripe link**

## Next Practical Step
Configure the real Stripe Payment Link and test:
1. landing CTA
2. purchase page
3. payment
4. purchase-success
5. signup or sign-in
6. onboarding
7. welcome
8. dashboard
