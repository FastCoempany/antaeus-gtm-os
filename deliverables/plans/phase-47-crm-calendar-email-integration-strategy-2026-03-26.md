# Phase 47 - CRM / Calendar / Email Integration Strategy

Date: 2026-03-26

## Objective
Decide the minimum viable external integration roadmap that increases system credibility without turning Antaeus into a CRM or a fragile sync layer.

## Why This Phase Exists
The app now has stronger modules, clearer handoffs, and better internal compounding.

But some truths are still self-asserted:

- was there a real meeting
- was there a real reply
- is the thread actually moving
- did the next step really get anchored

Integrations can improve that.

They can also damage the product if the order is wrong.

The main risk is not only engineering complexity. It is strategic drift:

- forcing Antaeus to depend on tools the user may not even have
- letting noisy external systems overwrite higher-quality internal judgment
- adding sync burden before the app has clean boundaries
- drifting toward CRM behavior instead of operating-system behavior

Phase 47 exists to stop that.

## Core Decision
Do not start with CRM.

Do not start with bidirectional anything.

Do not start with email sending or calendar writeback.

Start with:

1. read-only calendar ingest
2. read-only email metadata ingest

And stop there unless later evidence proves a downstream export bridge is necessary.

If any CRM bridge ever exists, it must stay:

- optional
- downstream
- export-first
- explicitly not the center of the product

## Product Boundary

### Antaeus is not a CRM
The product should not become:

- a generalized contact database
- a system-of-record replacement
- a stage-sync mirror
- a universal activity timeline
- an admin surface for pipeline hygiene

Its value is:

- sharper judgment
- better operating pressure
- better sequencing
- stronger handoffs
- clearer action truth

not administrative record-keeping for its own sake.

### Integrations should validate, not dominate
External systems should:

- verify
- enrich
- rank
- suggest

They should not silently decide:

- ICP truth
- deal truth
- proof truth
- advisor strategy
- readiness

### Manual confirmation still matters
Integrated data can strengthen trust without replacing user judgment.

Examples:

- a calendar event should not auto-advance a deal stage
- an email reply should not auto-create opportunity truth
- any external record mismatch should not silently win over the Antaeus record

## Integration Principles

### 1. Antaeus must stay valuable with no integrations
The product cannot require a CRM, inbox, or calendar to become useful.

That matters because the target user is often:

- founder-led
- pre-RevOps
- before the first serious sales hire
- operating with incomplete tooling

### 2. Read-only before write
The first job of integrations is to validate truth, not mutate other systems.

Read-only ingest is safer because it:

- proves value faster
- reduces failure modes
- preserves trust
- avoids destructive sync logic too early

### 3. Metadata before content
Where possible, start with:

- dates
- attendees
- reply timing
- thread freshness
- organizer
- participants

not full content scraping.

### 4. No forced toolchain
Antaeus cannot make early users feel behind because they do not already have a CRM or polished stack.

### 5. Downstream-only if CRM ever appears
If a CRM bridge is added later, it should primarily help Antaeus export useful synthesis outward, not import administrative gravity inward.

## Decision: What Starts First

### First Integration Layer: Calendar
Start here.

Why calendar goes first:

- it is the cleanest proof of real momentum
- it is lower privacy risk than email bodies
- it is more universal than CRM adoption
- it directly improves next-step credibility in the parts of the product that matter most

Providers:

- Google Calendar
- Microsoft 365 Calendar

Minimum viable ingest:

- event title
- start and end time
- attendee list
- organizer
- meeting link
- accepted / tentative / declined state where available

What it should improve:

- Deal Workspace next-step credibility
- Call Planner preparation context
- Discovery Studio live-call context
- Dashboard truth around what is actually scheduled
- Future Autopsy pressure when no real calendar anchor exists

What it should not do yet:

- create events
- edit events
- send invites
- auto-advance stages

### Second Integration Layer: Email
Email comes second, after calendar.

Why email is second:

- it is highly valuable for motion truth
- but it is more privacy-sensitive than calendar
- and it is easy to build badly by over-reading or over-summarizing too early

Providers:

- Gmail
- Outlook / Microsoft 365 Mail

Minimum viable ingest:

- thread id
- subject
- participants
- sent / received timestamps
- reply count
- most recent activity timestamp

Default rule:

- metadata only
- no full-body ingest by default

What it should improve:

- Outbound Studio touch credibility
- LinkedIn / email sequencing
- Cold Call follow-up timing
- Deal Workspace thread freshness and multithreading truth
- Advisor Deploy ask follow-through confirmation
- Dashboard motion truth

What it should not do yet:

- send email
- draft email in the user inbox
- auto-log every thread as high-quality motion
- summarize bodies by default

Later option:

- opt-in summarization for specific threads
- only after consent, explainability, and quality controls are explicit

### Third Layer: No CRM Product Expansion
This is the actual Phase 47 call:

- do not make CRM the next product layer

Why:

- it would pull Antaeus toward admin gravity
- it would blur the line between operating system and system of record
- it would reward sync completeness over operating usefulness
- it would increase burden for the exact user who may not have a stable CRM yet

What is still acceptable later:

- one-way export of summaries or handoff artifacts
- optional user-invoked lookup against an external CRM
- explicit context hydration when the user chooses it

What is not the direction:

- pipeline parity
- contact-record parity
- universal activity sync
- bidirectional stage / owner / field synchronization

## Recommended Sequence

### Stage 0 - No integration required
Current rule stays true:

- Antaeus works as a standalone operating system
- manual truth capture remains legitimate
- CSV / manual import remains acceptable

### Stage 1 - Calendar read-only ingest
This is the first integration worth building.

Success means:

- meetings appear as verifiable momentum
- next-step truth becomes more believable
- discovery surfaces know what meeting is about to happen

### Stage 2 - Email metadata ingest
This is the second integration worth building.

Success means:

- motion no longer depends entirely on manual logging
- stale threads are visible
- follow-up timing becomes more honest

### Stage 3 - Optional downstream export bridge only
Only if later evidence says customers truly need it.

Success means:

- Antaeus can export useful synthesis outward
- portability improves
- the product still does not become a CRM

## Module Impact Map

### Calendar primarily benefits

- [deal-workspace](c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html)
- [discovery-agenda](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-agenda/index.html)
- [discovery-studio](c:/AppDev/v1AntaeusApp/Appv2_290126/app/discovery-studio/index.html)
- [dashboard](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [future-autopsy](c:/AppDev/v1AntaeusApp/Appv2_290126/app/future-autopsy/index.html)

### Email primarily benefits

- [outbound-studio](c:/AppDev/v1AntaeusApp/Appv2_290126/app/outbound-studio/index.html)
- [linkedin-playbook](c:/AppDev/v1AntaeusApp/Appv2_290126/app/linkedin-playbook/index.html)
- [cold-call-studio](c:/AppDev/v1AntaeusApp/Appv2_290126/app/cold-call-studio/index.html)
- [deal-workspace](c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html)
- [dashboard](c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)

### Optional downstream export bridge would primarily benefit

- [deal-workspace](c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html)
- [advisor-deploy](c:/AppDev/v1AntaeusApp/Appv2_290126/app/advisor-deploy/index.html)
- [founding-gtm](c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html)

## What This Phase Explicitly Rejects

- no CRM-first build
- no CRM product expansion
- no bidirectional CRM sync as any near-term release
- no inbox-send feature before metadata truth exists
- no auto-created calendar events before read-only calendar trust exists
- no "connect everything" launch
- no hiding integration complexity behind magical language

## Decision Summary

If only one integration gets built first, it should be:

- calendar

If two integrations get built next, they should be:

1. calendar
2. email metadata

If a third layer ever gets built, it should be:

- an optional downstream export bridge only

## What This Phase Unlocks Next
Phase 47 gives the product a real integration sequence for:

- Phase 48 launch-agent boundary decisions
- Phase 49 team / advisor / seat model planning
- Phase 50 automation quality controls
- later runtime integration implementation without roadmap drift

Without this phase, later integration work would likely start in the wrong place.

## Exit Criteria Read

### Met locally
- the minimum viable integration roadmap is explicit
- integration order is sequenced
- read-only versus write rules are explicit
- calendar and email now have distinct roles
- CRM is now explicitly framed as not the product direction

### Still requires later implementation
- runtime calendar ingest
- runtime email metadata ingest
- optional downstream export bridge only if later demand proves it is worth building
- integration UI, auth, and settings surfaces

## Files Changed
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-47-crm-calendar-email-integration-strategy-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-47-crm-calendar-email-integration-strategy-2026-03-26.md)

## Status
`local-patch`
