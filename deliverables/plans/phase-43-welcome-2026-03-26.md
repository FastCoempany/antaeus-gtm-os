# Phase 43 - Welcome

Date: 2026-03-26

## Objective
Make welcome behave like a mature first-session corridor instead of a good-looking orientation page.

## Why This Phase Exists
Phase 22 made the welcome layer adaptive and operational, but it still had four gaps:

- it did not rank first actions strongly enough
- it did not clearly connect to the first-week lifecycle
- it did not reuse activation context from onboarding
- it still needed a stronger revisit/help state

Phase 43 closes those gaps so welcome becomes a real handoff surface between onboarding, week-one rhythm, and the rest of the app.

## Changes Implemented

### 1. Better First-Action Ranking
Updated [app/welcome/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html) so the action list no longer behaves like a generic queue.

It now:

- uses the active week-one lifecycle next move when one exists
- avoids duplicate recommendations
- marks the queue as `Now`, `Next`, and `Ready`
- explains why each action is next
- explains what each action unlocks downstream

This makes the first action feel justified instead of arbitrary.

### 2. Welcome Now Reuses Activation Context
Welcome now reads `gtmos_activation_context`, saved during Phase 42 onboarding work.

That lets the hero reflect:

- category
- buyer
- stage
- ACV band
- role context

This makes the page feel tuned to the user instead of generic.

### 3. Connected Welcome to the First-Week Lifecycle
Welcome now reads the shared week-one lifecycle engine and adds a dedicated `First-week operating rhythm` panel when the user is still inside days 1-7.

That panel shows:

- week/day context
- milestone count
- first-week guidance
- return rhythm
- the current primary next move

This turns welcome into a real bridge from signup into repeated usage, not just a ceremonial front door.

### 4. Stronger Revisit / Help State
When week-one state is not active, the right rail now becomes a more mature revisit guide.

It explains:

- when to reopen welcome
- why the sidebar return path exists
- how methodology, demo lane, and settings should be used without replacing real work

This makes the page useful after first entry instead of becoming dead weight.

### 5. Copy Hardening
The hero copy was tightened so the page now sounds more like an operating handoff and less like inspirational setup language.

It also now includes:

- activation chips
- a stronger workspace-focus summary
- a more honest sync / return-path message

## Exit Criteria Read

### Met locally
- welcome ranks actions more decisively
- welcome now reuses activation context from onboarding
- welcome explicitly connects into the first-week lifecycle
- welcome is more useful on revisit
- help/orientation surfaces are still present without replacing the real action path

### Still requires live validation
- verify the week-one panel appears only when it should
- verify the top action changes as the workspace matures
- verify the hero primary CTA follows the actual next move cleanly
- verify revisit behavior feels better after the user leaves and returns via the sidebar

## Files Changed
- [app/welcome/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-43-welcome-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-43-welcome-2026-03-26.md)

## Status
`local-patch`
