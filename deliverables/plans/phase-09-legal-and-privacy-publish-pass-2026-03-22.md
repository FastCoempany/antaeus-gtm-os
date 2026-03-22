# Phase 09 - Legal and Privacy Publish Pass

Date: 2026-03-22

## Objective

Replace the draft-grade legal pages with publishable versions that match the real product, current auth stack, current storage model, current analytics setup, and current commercial truth.

## Repo surfaces updated

- [terms.html](c:/AppDev/v1AntaeusApp/Appv2_290126/terms.html)
- [privacy.html](c:/AppDev/v1AntaeusApp/Appv2_290126/privacy.html)

## What was wrong before

- Both pages still contained draft warnings.
- Both pages contained malformed placeholder HTML for company/contact details.
- `privacy.html` contained citation artifact garbage and placeholder contact fields.
- `terms.html` implied a more complete live billing posture than the current product actually supports.
- Both pages were outdated relative to the current mixed local-plus-cloud persistence model.

## What this pass fixed

### Terms

- Removed placeholder and broken entity/contact markup.
- Rewrote the page around real product truth:
  - Antaeus is workflow and decision-support software.
  - Users keep ownership of their own workspace content.
  - The app currently uses a mixed storage model.
  - Billing terms are governed by checkout when checkout is enabled.
  - No false claim that a full subscription-management system is already live.
- Normalized typography and removed mojibake from the public page.

### Privacy

- Removed placeholder and broken entity/contact markup.
- Removed citation artifact garbage.
- Rewrote the page around current system behavior:
  - Supabase-backed auth and durable workspace persistence
  - browser local storage and session storage
  - demo seed and demo mode behavior
  - GA4 / analytics / UTM attribution usage
  - Resend-backed auth email delivery from `hello@antaeus.app`
  - limited payment metadata only when checkout is enabled
- Normalized typography and removed mojibake from the public page.

## Product truth reflected in the rewrite

- Contact email: `hello@antaeus.app`
- Auth email delivery: Supabase Auth with custom SMTP through Resend
- Sender: `hello@antaeus.app`
- Durable workspace truth: mixed model, not browser-only anymore
- Browser-scoped truth still exists for some UI/demo/session values
- Analytics stack: GA4 support plus local attribution/event capture
- Billing: purchase path exists, but live billing behavior is only whatever is shown at checkout when checkout is enabled

## Remaining business or legal choices

These are no longer blocking publish, but they are still founder decisions:

- formal contracting entity name, if you want the public terms to name an LLC or corporation explicitly
- final refund policy once billing is live
- final renewal and cancellation language once Stripe or another billing system is configured
- whether Illinois and Cook County remain the final governing-law venue
- optional counsel review before broader paid launch

## Exit criteria met

- `terms.html` exists in deployment-ready form and is linkable from the landing page footer
- `privacy.html` exists in deployment-ready form and is linkable from the landing page footer
- no draft warnings remain
- no bracket placeholders remain
- no citation garbage remains
- no broken contact/entity HTML remains

## Verification commands

```powershell
rg -n "Draft warning|\\[|turn[0-9]+|antaeusapp@gmail.com|antaeusapp,|div antaeusapp" terms.html privacy.html
```

Expected result:

- no matches

## Recommended next phase

Phase 10 if you want to continue down the planned sequence, or Phase 13 if you want to start reliability and shell polish before going deeper into public/commercial exposure.
