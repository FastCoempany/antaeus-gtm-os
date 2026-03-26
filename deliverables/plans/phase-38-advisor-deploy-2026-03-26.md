# Phase 38 - Advisor Deploy

Date: 2026-03-26

## Objective
Make Advisor Deploy feel like a concrete deal-leverage system instead of a loose catalog of advisor ideas.

## Why This Phase Exists
Advisor Deploy already had a strong underlying concept:

- advisor registry
- deployment playbook
- ask builder
- impact tracking

But the module still had three material product-feel gaps:

- it did not clearly explain the advisor operating model
- it did not make "when to deploy" concrete enough on live deals
- deployments and outcomes were not feeding back into deal truth strongly enough

Phase 38 closes that gap.

## Changes Implemented

### 1. Added an Explicit Advisor Operating Model
Updated [app/advisor-deploy/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/advisor-deploy/index.html) so the dashboard now opens by defining:

- registry
- moment
- deployment
- outcome

It also explains:

- when advisor leverage belongs
- what a one-session win looks like
- why the feedback loop matters

This makes the module feel like an operating surface rather than an abstract strategy note.

### 2. Added Live "Where to Deploy Now" Recommendations
The dashboard now computes recommendations from live deal truth:

- deal stage
- visible deal pressure
- advisor connection coverage
- cooldown availability
- existing active deployments

Each recommended deal now shows:

- deployment state
- why that state exists
- recommended moment
- suggested advisor
- direct handoff into Ask Builder

This makes "when to deploy" visible and actionable.

### 3. Tightened the Deal x Advisor Matrix
The matrix now behaves more like a deployment planner:

- it surfaces deal pressure
- it shows the recommended moment per deal
- it keeps advisor coverage visible
- it gives a direct `Build ask` path

It also calls out deals with no advisor coverage as a concrete operating gap.

### 4. Rebuilt the Ask Builder Around Real Deal Objects
The builder no longer treats the selected deal as just a display string.

It now carries:

- deal id
- deal name
- stage
- value
- recommended moment
- recommended advisor

That lets the module:

- prefill from dashboard and matrix recommendations
- keep stage-aware context visible during the build
- log a real deal-linked deployment instead of a detached record

### 5. Connected Deployment Outcomes Back Into Deal Truth
Logged deployments now save richer data:

- deal id
- deal stage
- deal value
- moment id / name
- advisor id / name
- outcome state

Outcome updates now sync back into the linked deal record by writing:

- advisor history
- last advisor deployment
- last advisor moment
- next-step updates based on outcome

That means advisor leverage now changes the deal object instead of living only in the advisor module.

## Exit Criteria Read

### Met locally
- the advisor model is now explicit
- "when to deploy" is materially clearer on live deals
- Ask Builder is tied to real deal context
- logged deployments are connected to deal records
- outcome changes now rewrite next-step truth in the deal

### Still requires live validation
- confirm the recommended deployment logic feels honest across different stages
- confirm advisor cooldown plus recommendation ordering feels sensible in browser
- confirm the deal feedback loop helps rather than overwrites too aggressively
- confirm the module now feels concrete to a real user instead of strategically vague

## Files Changed
- [app/advisor-deploy/index.html](c:/AppDev/v1AntaeusApp/Appv2_290126/app/advisor-deploy/index.html)
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-38-advisor-deploy-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-38-advisor-deploy-2026-03-26.md)

## Status
`local-patch`
