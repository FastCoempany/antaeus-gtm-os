# Phase 49 - Team / Advisor / Seat Model

Date: 2026-03-26

## Objective
Define the seat types, permission model, sharing rules, and personal-versus-shared state model so Antaeus can become team-capable later without turning into a generic collaboration app.

## Why This Phase Exists
The product is now much more coherent as a single-user operating system.

But if more than one person touches the workspace, ambiguity appears quickly:

- who can change ICP truth
- who can move a deal stage
- who can delete or reset the workspace
- what belongs to the founder
- what belongs to the team
- what an advisor should see
- what should remain personal

Without a defined seat model, later collaboration work will drift into ad hoc permission logic.

Phase 49 exists to stop that.

## Core Decision
Antaeus should be designed as:

- one shared workspace
- with role-scoped participation
- plus a small personal overlay layer

It should **not** be designed as:

- many separate personal workspaces stitched together
- a generic team chat / collaboration surface
- a CRM-style record-ownership maze

The center of gravity should stay:

- shared operating truth

with:

- limited personal overlays
- limited destructive controls
- scoped advisor participation

## System Model

### Workspace-first, not user-first
The workspace is the main object.

That means the important GTM truth should primarily belong to the workspace:

- ICPs
- territory theses
- sourced accounts
- signal research
- deals
- discovery agendas
- discovery outputs
- proof plans
- advisor deployments
- quota plan
- readiness snapshot
- handoff kit

The user is not the main container.

The user is a participant in a shared operating system.

### Personal overlays should stay light
Personal state should exist, but only where it helps focus or workflow hygiene.

Examples:

- sidebar state
- tour state
- personal UI preferences
- draft-in-progress scratch state before save
- personal reminders or quick-capture text not yet promoted to workspace truth

This preserves collaboration without polluting shared truth with every individual working preference.

## Recommended Seat Types

### 1. Workspace Owner
This is usually the founder or primary account owner.

What this seat is for:

- creating the workspace
- deciding core strategic truth
- controlling destructive or account-level actions

Permissions:

- full module access
- full edit access
- invite / remove users
- manage workspace-level settings
- reset onboarding
- change product category
- export / import workspace
- delete workspace
- approve major handoff exports

Restrictions:

- none inside the workspace model

### 2. Core Operator
This is the first AE, GTM operator, or sales lead.

What this seat is for:

- doing real work inside the system
- updating execution state
- operating pipeline, discovery, proof, and motion

Permissions:

- create and edit ICPs
- work territory and sourcing
- run signal research
- create and log outbound motions
- use LinkedIn and call surfaces
- create and update discovery agendas
- run Discovery Studio
- create and edit deals
- use Future Autopsy
- create and edit PoC plans
- create advisor asks
- use quota workback
- export handoff kit drafts

Restrictions:

- cannot delete workspace
- cannot import / replace full workspace backup
- cannot reset onboarding for everyone
- cannot change seat model or account-level admin settings

Important note:
Core operators should be able to change real operating truth.

Antaeus should not cripple the first AE into read-only mode.

### 3. Workspace Admin
This is an operations admin or GTM operations lead.

What this seat is for:

- keeping the workspace healthy
- managing access
- supporting durability and structure

Permissions:

- invite / remove users
- manage workspace membership
- manage workspace-level settings
- export backup
- import backup
- manage product category and structural configuration
- view all modules

Restrictions:

- should not automatically own strategy just because they are admin
- destructive full delete should stay owner-only

Important note:
Admin is an operations control seat, not a founder strategy seat.

### 4. Advisor Guest
This is a scoped external participant, not a full core seat.

What this seat is for:

- supporting live deals
- receiving structured asks
- optionally reviewing limited context

Permissions:

- see only the deal / ask packet intentionally shared with them
- view advisor ask context
- view limited company / deal / proof summary relevant to the ask
- provide response / outcome back into the system if later implemented

Restrictions:

- no broad workspace browsing
- no access to global pipeline
- no access to all accounts
- no access to full settings
- no access to unrelated discovery or proof records

Important note:
Advisor access should be packet-based and scoped, not “here is a full seat.”

## Founder vs Admin vs Operator Clarification

### Founder
- strategy authority
- workspace owner authority
- can do everything

### Admin
- operational governance authority
- not automatic strategy authority
- should keep the workspace healthy

### Core Operator
- execution authority
- should not be blocked from doing real work
- should be trusted with live operating truth

### Advisor
- contextual guest
- should receive only what is needed for the specific ask

## Sharing Rules

### Shared by default
These should be workspace-shared:

- onboarding activation context
- ICPs
- territory theses
- sourced prospects once saved
- signal research once saved
- outbound logs and motion history
- LinkedIn logs
- cold-call outcomes
- discovery agendas once saved
- discovery worked-move history once saved
- deals
- future autopsies
- proof plans
- advisor deployments
- quota plans
- readiness snapshots
- handoff exports and handoff section state

Why:

- these are operating truth
- the system should feel like one team workspace

### Personal until explicitly saved
These should remain personal until committed:

- in-progress scratch notes
- partially completed forms not yet saved
- temporary filters
- local panel state
- personal tour progress
- personal quick-capture before logging

Why:

- this avoids needless cross-user noise
- it keeps the shared workspace from becoming cluttered with half-thought state

### Scoped share only
These should not be globally visible by default if later implemented:

- advisor packet context
- sensitive ask drafts before send
- possible internal-only founder notes

These need explicit visibility rules rather than blind workspace sharing.

## Ownership Model

### Record authorship should exist
Even in a shared workspace, records should carry:

- created by
- last updated by
- updated at

Why:

- accountability
- review clarity
- later auditability

### Ownership should not become a hard gate on truth
The product should avoid classic CRM behavior where:

- only one owner can sensibly touch a record
- the team must fight ownership locks to do real work

The right model is:

- authored by someone
- shared with the workspace
- editable according to seat scope

## Destructive Controls

These should stay owner-only:

- delete workspace
- hard reset workspace
- change billing / subscription controls later

These can be owner or admin:

- import backup
- export backup
- invite / remove users
- product category changes

These should be operator-allowed:

- all normal execution edits
- save / update deals
- save / update agendas
- save / update proof
- log touches and calls

## Advisor Model

### Do not treat advisors like normal seats
Advisors should not get a standard app seat by default.

Instead, the product should be designed around:

- structured advisor packets
- scoped ask context
- limited-response loops

If full advisor seats ever exist later, they should be rare and intentional.

### Advisor default visibility
Default advisor visibility should be:

- one deal
- one ask
- supporting context only

not:

- global workspace visibility

## Teamability Direction

### What the future product should become
Antaeus should become:

- founder + operator capable
- with scoped admin support
- with packet-based advisor participation

### What it should not become
Antaeus should not become:

- a chat-heavy collaboration hub
- a permissions labyrinth
- a CRM clone with user-ownership theater

## Recommended Implementation Sequence Later

### Stage 1
Add authorship and last-updated metadata to shared records.

### Stage 2
Add workspace roles:

- owner
- operator
- admin

### Stage 3
Add role-gated settings and destructive-control gating.

### Stage 4
Add advisor packet sharing, not full advisor seats.

### Stage 5
Only if truly needed, consider expanded read or comment permissions for guests.

## Product Sentence
If this phase needs one internal sentence, it is:

Antaeus is a shared GTM operating workspace with light personal overlays and scoped advisor participation, not a pile of private user silos or a CRM-style ownership maze.

## Decision Summary

### Resolved
- seat types: defined
- founder / operator / admin / advisor boundaries: defined
- shared vs personal state: defined
- workspace sharing direction: defined

### Final call
Use a workspace-first model with:

- owner
- core operator
- workspace admin
- advisor guest

Keep operating truth shared.
Keep personal overlays light.
Keep advisor access scoped.

## What This Phase Unlocks Next
Phase 49 gives later work a real direction for:

- Phase 50 automation quality controls
- future seat implementation
- future advisor packet workflows
- future authorship / auditability logic

Without this phase, future collaboration work would likely become inconsistent and overcomplicated.

## Exit Criteria Read

### Met locally
- seat types are explicit
- founder vs operator vs admin vs advisor boundaries are explicit
- shared versus personal state is explicit
- teamability now has an intentional design direction

### Still requires later implementation
- authorship metadata
- role-aware UI / settings controls
- advisor packet sharing
- real invitation and membership flows

## Files Changed
- [deliverables/plans/phase-04-evidence-board-2026-03-22.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-04-evidence-board-2026-03-22.md)
- [deliverables/plans/phase-49-team-advisor-seat-model-2026-03-26.md](c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/phase-49-team-advisor-seat-model-2026-03-26.md)

## Status
`local-patch`
