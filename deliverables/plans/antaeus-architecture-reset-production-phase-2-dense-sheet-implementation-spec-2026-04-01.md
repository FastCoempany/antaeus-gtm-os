# Antaeus Architecture Reset Production Phase 2 Dense-Sheet Implementation Spec

Date: 2026-04-01

Status: canonical implementation spec for Production Phase 2

Purpose: define the first production dense inspection sheet that sits between the new command layer and the preserved deep rooms, without reintroducing panel soup or falling back into old hallway logic.

---

## 1. Scope

Phase 2 is a Dashboard-first production slice.

This phase does not yet rebuild every module workspace.

This phase adds:

- a real dense inspection sheet on Dashboard
- sheet entry from the same urgency objects used by `Brief`, `Grid`, and `Queue`
- a calmer bridge from command surface into preserved deep rooms
- shared styling for the first production sheet language

This phase does not add:

- a global app-wide sheet framework for every module
- a Graph production surface
- final sidebar replacement
- total workspace migration

---

## 2. Files In Scope

- [app/dashboard/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [css/app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)

Optional only if required during implementation:

- [js/shell-chrome.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/shell-chrome.js)

No other production surfaces are in scope for this phase unless implementation reveals a shared breakage.

---

## 3. What The Sheet Must Do

The sheet is the inspection layer between:

- `Command`
- `Workspace`

The sheet is not allowed to behave like:

- a generic modal
- a sparse marketing overlay
- a dashboard card expanded to a bigger card

It must feel denser than the command row it came from.

The sheet must answer five questions immediately:

1. what object or pressure is in focus
2. why it is surfacing now
3. what gaps are still unresolved
4. what compounds automatically if the user acts
5. which preserved deep room should be entered next

---

## 4. Objects And Sources

Phase 2 will source sheet content from the same production command objects already generated on Dashboard:

- primary command object
- risk queue cards
- next-move cards
- queue cards
- empty-state command objects

Sheet content should come from existing data already available in the dashboard render pass:

- stage context
- shell context
- deal vitals
- top causes
- move recommendations
- week-one context if relevant
- risk metadata

The implementation must not invent separate fake sheet data if real command data already exists.

---

## 5. Interaction Model

### 5.1 Entry

The sheet opens from command objects.

The first production entry pattern should be:

- a quiet `Inspect` action on command objects

Do not make every entire card a hover circus.
Do not add loud extra chips or badges just to expose the sheet.

### 5.2 Exit

The sheet closes by:

- explicit close button
- clicking backdrop
- `Escape`

### 5.3 Next Step

The sheet must always offer:

- one dominant `Go deeper` move into the preserved room
- one fallback move if applicable

The sheet is not the place for 5 equal actions.

---

## 6. Layout Rules

The sheet should open as a dense overlay inside the Dashboard context.

Allowed composition:

- backdrop
- one sheet panel
- one tight internal grid at most

Rejected composition:

- nested card stacks
- four mini-panels inside the sheet
- chip storms
- decorative metric clusters

The panel should read as:

- header
- narrative
- two-column dense body on desktop
- one-column stack on mobile

The dense body should generally contain:

- left: gaps, evidence, or object truth
- right: next move, downstream loop, deep room entry

---

## 7. Content Structure

Every sheet should support these fields:

- `family`
- `state`
- `title`
- `metricLabel`
- `metricValue`
- `summary`
- `whyNow`
- `gaps`
- `evidence`
- `downstream`
- `actions`

Not every sheet must use every field, but the structure must exist so later phases can reuse it.

### 7.1 Risk deal sheets

Risk sheets should emphasize:

- risk score
- stale days
- stage truth
- top causes
- missing gate fields
- next real room

### 7.2 Next-move sheets

Move sheets should emphasize:

- why the move surfaced
- what object it affects
- what system consequence follows if completed

### 7.3 Empty/setup sheets

Setup sheets should emphasize:

- which layer is still missing
- why the dashboard is compensating
- which deep room fills the missing truth

---

## 8. Visual Rules

The sheet must use the locked bright system.

It must feel:

- bright
- dense
- calm
- authoritative

It must not feel:

- dark-shell legacy
- warm-heavy legacy
- modal-kit generic
- enterprise admin clutter

Visual rules:

- brighter field than old shell
- strong typography first
- dividers before boxes
- subtle tinting for state
- minimal chip use
- one dominant action only

---

## 9. Engineering Approach

Phase 2 should be implemented with a lightweight in-page registry:

- build sheet payloads during dashboard render
- register them in a temporary sheet registry
- mount one sheet overlay node per render cycle
- reopen only if the selected registry key still exists

Why:

- avoids creating a parallel data system
- keeps sheet truth coupled to the command objects
- avoids a larger app-wide state rewrite in this phase

---

## 10. Acceptance Criteria

Phase 2 is complete only if all of the following are true:

- Dashboard exposes a real dense sheet from command objects
- the sheet is visibly denser than the command row
- the sheet uses the bright command-page system, not old shell styling
- the sheet contains one dominant `Go deeper` path into a preserved room
- the sheet closes cleanly by button, backdrop, and `Escape`
- there is no obvious panel soup inside the sheet
- `Brief`, `Grid`, and `Queue` still render correctly
- current command actions still work
- no syntax/runtime errors are introduced

---

## 11. Validation

Code validation required:

- dashboard inline script check
- CSS parse-safe review

Live validation required:

- open Dashboard
- switch `Brief / Grid / Queue`
- open at least one sheet from each mode
- close by button
- close by backdrop
- close by `Escape`
- use `Go deeper` from at least one sheet

---

## 12. After This Phase

Once Phase 2 is validated, the next implementation phase is:

- Phase 3 workspace bridge tightening

That later phase will start reducing dependence on the legacy left nav because the user will increasingly move:

- command -> sheet -> room

instead of:

- nav -> page -> nav -> page

