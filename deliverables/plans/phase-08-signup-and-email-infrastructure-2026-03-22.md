# Phase 8 — Signup and Email Infrastructure

## Objective
Remove auth fragility and make the signup corridor production-safe.

## Current Truth Before This Phase
- Signup logic had been fixed previously so it no longer crashed on `reading 'user'`.
- The biggest external blocker was email delivery, which was previously throttled by Supabase's default mailer.
- Auth pages still surfaced too many raw provider messages and did not clearly tell the user what to do next.

## External Setup Completed
- Custom SMTP is now configured in Supabase Auth using Resend.
- Verified settings:
  - sender email: `hello@antaeus.app`
  - sender name: `Antaeus`
  - host: `smtp.resend.com`
  - port: `465`
  - username: `resend`
- Email sending rate limit is now `30 emails / hour`.
- Fresh signup test passed end to end.

## Repo-Side Changes Implemented

### 1. Added shared auth error normalization
- New file: [auth-ui.js](c:/AppDev/v1AntaeusApp/Appv2_290126/js/auth-ui.js)
- Handles normalized messaging for:
  - network failures
  - email send rate limits
  - duplicate-account attempts
  - invalid credentials
  - unconfirmed email
  - expired or invalid links
  - weak password errors

### 2. Hardened signup
- Updated [signup.html](c:/AppDev/v1AntaeusApp/Appv2_290126/signup.html)
- Improvements:
  - duplicate-account errors are cleaner
  - signup success copy now references the real sender
  - contextual checkout copy still works
  - error actions can point the user to the next correct path

### 3. Hardened login
- Updated [login.html](c:/AppDev/v1AntaeusApp/Appv2_290126/login.html)
- Improvements:
  - invalid credential errors are clearer
  - unconfirmed-email guidance is clearer
  - contextual checkout copy still works

### 4. Hardened forgot-password
- Updated [forgot-password.html](c:/AppDev/v1AntaeusApp/Appv2_290126/forgot-password.html)
- Improvements:
  - success state is phrased safely: "if the account exists"
  - sender identity is explicit
  - error messages are normalized

### 5. Hardened reset-password
- Updated [reset-password.html](c:/AppDev/v1AntaeusApp/Appv2_290126/reset-password.html)
- Improvements:
  - expired-link behavior is clearer
  - reset errors are normalized
  - old mojibake in auth copy is removed from this surface

### 6. Hardened auth callback
- Updated [auth/callback/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/auth/callback/index.html)
- Improvements:
  - callback copy is cleaner
  - callback failure states now normalize known auth link problems

## Confirmation Email Policy
- New users must confirm email before first durable access unless Supabase issues an immediate session.
- Signup success should clearly tell the user:
  - sender identity
  - what to click
  - what happens after confirmation
- Expired or invalid confirmation/reset links should route the user back into a clean retry path instead of raw provider errors.

## Duplicate Account Policy
- If the email already exists:
  - the user should be told plainly
  - the user should be sent toward sign-in or password reset
- The product should never surface a cryptic database/provider error for an already-registered email.

## Production-Safe Outcome
The auth corridor is now:
1. signup
2. confirmation email from `hello@antaeus.app`
3. auth callback
4. onboarding / welcome / dashboard routing truth

And the supporting flows are now:
- forgot password
- reset password
- duplicate account recovery
- invalid login recovery

## Exit Criteria Status
- signup failure modes are understandable: **done**
- confirmation delivery is production-safe: **done**
- duplicate-account handling is clean: **done**
- auth surfaces still need deeper tour/welcome integration later: **not part of this phase**

## Next Best Step
Move to **Phase 9 — Legal and Privacy Publish Pass**.
