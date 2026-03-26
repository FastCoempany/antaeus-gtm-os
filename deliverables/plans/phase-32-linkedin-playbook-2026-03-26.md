# Phase 32 - LinkedIn Playbook

Date: 2026-03-26

## Objective
Operationalize LinkedIn as a real GTM channel so the module tells the user when LinkedIn is the right move, what good looks like, and how channel actions compound into the rest of the system.

## Why This Phase Exists
LinkedIn Playbook already had useful material:

- connection request templates
- DM sequence guidance
- content rules
- InMail rules
- a basic activity log

But it still felt too much like reference material:

- it did not clearly explain when LinkedIn should be used
- it did not connect strongly enough to ICP, signals, or outbound context
- it did not define success thresholds clearly
- the activity log tracked actions without making the channel feel like a motion

Phase 32 closes that gap by giving the module a channel bridge, a recommended play, and richer motion logging.

## Changes Implemented

### 1. Added a Channel Bridge
Updated [app/linkedin-playbook/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/linkedin-playbook/index.html) so the module now renders a top-level bridge that explains:

- what LinkedIn is for right now
- what one-session win looks like
- what good enough looks like
- how the channel connects to:
  - ICP Studio
  - Signal Console
  - Outbound Studio

This turns the module into a channel decision surface instead of a page of templates.

### 2. Connected the Module to Live Workspace Context
The bridge now reads:

- the best saved ICP
- the hottest current signal account
- the latest outbound touch
- current LinkedIn activity stats

That lets the module answer:

- should LinkedIn be warming a live signal account
- should it convert an accepted connection
- should it act as air cover for outbound already in flight
- or is the right move simply to build name familiarity

### 3. Added a Recommended Play
The log tab now opens with a dedicated recommended play card that tells the user:

- the most useful LinkedIn motion right now
- which action to log or run first
- what one-session success looks like
- what the next move should be

It also includes a `Use Recommended Play` action so the module can prefill the current recommendation into the log flow.

### 4. Defined Success Thresholds
Phase 32 adds visible channel standards instead of forcing the user to guess them:

- roughly `35%+` connection acceptance is healthy
- roughly `15%+` DM reply is healthy after the channel has been warmed

These thresholds are now visible in both the bridge and the log view.

### 5. Made the Activity Log More Motion-Aware
Each logged LinkedIn action now stores richer context, including:

- motion key
- motion label
- why-now logic
- recommended next move

The activity table now exposes the play behind each action instead of showing only date, contact, and outcome.

That makes the channel meaningfully trackable rather than just countable.

## Exit Criteria Read

### Met locally
- the module now explains when LinkedIn is the right motion
- it is connected to saved ICP, signals, and outbound context
- the log now tracks channel plays rather than detached actions
- success thresholds are visible and legible

### Still requires live validation
- verify the recommended play feels credible against real accounts in the live workspace
- confirm the prefilled recommended play in the log tab is actually helpful, not noisy
- confirm the bridge still behaves sanely when the workspace has no ICP, no signals, or no outbound touches

## Files Changed
- [app/linkedin-playbook/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/linkedin-playbook/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-32-linkedin-playbook-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-32-linkedin-playbook-2026-03-26.md)

## Status
`local-patch`
