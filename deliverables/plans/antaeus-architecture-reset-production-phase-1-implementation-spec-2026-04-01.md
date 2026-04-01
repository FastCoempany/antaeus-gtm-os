# Antaeus Architecture Reset Production Phase 1 Implementation Spec

Date: 2026-04-01

Status: canonical implementation spec for Production Phase 1

Purpose: translate the master production program into exact implementation work for the first real production slice: the command layer.

This document governs the first production build of:

- one real command center
- one urgency engine
- three render densities
- one calmer visual field
- one preserved bridge into the deep rooms

This phase does not ship the full architecture reset.
It ships the new front door.

---

## 1. Governing Inputs

This phase is subordinate to:

- [antaeus-architecture-reset-production-program-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-architecture-reset-production-program-2026-04-01.md)
- [antaeus-architecture-truth-memo-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-architecture-truth-memo-2026-04-01.md)
- [antaeus-visual-identity-lock-memo-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-visual-identity-lock-memo-2026-04-01.md)
- [antaeus-visual-system-spec-2026-04-01.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-visual-system-spec-2026-04-01.md)

Reference artifacts:

- [jsx-design-system-taste-test.jsx](/c:/AppDev/v1AntaeusApp/Appv2_290126/jsx-design-system-taste-test.jsx)
- [jsx-architecture-reset-prototype.jsx](/c:/AppDev/v1AntaeusApp/Appv2_290126/jsx-architecture-reset-prototype.jsx)

---

## 2. Phase Goal

Production Phase 1 replaces the current Dashboard / Welcome split with a real command-layer experience that answers:

1. what matters now
2. why it matters
3. what the dominant next move is
4. what the fallback move is
5. where to go deeper without reviving hallway logic

The key output is not a prettier dashboard.
It is a calmer ranked field of work.

---

## 3. In-Scope Files

Primary files:

- [app/dashboard/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [app/welcome/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)
- [css/app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)

Shared support likely required:

- [js/shell-chrome.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/shell-chrome.js)
- [js/gtmos-store.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/gtmos-store.js)
- [js/data-manager.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/data-manager.js)
- [js/module-boot-state.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/module-boot-state.js)

Out of scope for this phase:

- deep workspace migrations
- real sheet layer
- graph reward layer
- module-by-module deep-room rewrites

---

## 4. Production Outputs

This phase must ship these outputs.

### 4.1 Dashboard becomes the command center

Dashboard must become the real daily operating surface with:

- Brief
- Grid
- Queue

These are three densities of the same urgency engine, not three unrelated pages.

### 4.2 Welcome becomes activation command

Welcome must stop behaving like a decorated setup article.

Welcome must become:

- a first-week command surface
- a ranked activation sequence
- a reset path when the workspace still feels thin

### 4.3 Command surfaces become visually calmer

The phase must materially reduce:

- box count
- chip count
- panel nesting
- top-of-page clutter
- equal-weight visual planes

### 4.4 Deep rooms remain reachable

Dashboard and Welcome must both still route into the preserved modules:

- ICP Studio
- Signal Console
- Deal Workspace
- Future Autopsy
- other existing deep rooms where appropriate

---

## 5. Structural Rules

### 5.1 One urgency engine

Dashboard must compute one ranked field of work and then render it three ways.

The same underlying objects and priorities must drive:

- Brief
- Grid
- Queue

### 5.2 One dominant next move

Each important surface gets:

- one primary move
- one fallback move
- everything else quieter

### 5.3 No hallway behavior

The user should not have to answer:

- which module should I open
- which page matters first
- where does this context live

The command layer should answer that.

### 5.4 No panel soup

The implementation must prefer:

- spacing
- rules
- type hierarchy
- inline metrics

over:

- nested cards
- grids of equal-weight boxes
- pill clusters

### 5.5 No dead-empty states

Sparse workspaces still need ranked guidance.

Empty or thin states must still read like a command surface, not a placeholder.

---

## 6. Visual Rules for This Phase

### 6.1 Command pages use the new bright identity

Dashboard and Welcome should be the first real production surfaces born in the new visual language.

For this phase:

- main canvas bright
- shell content calmer
- display hierarchy stronger
- controls sharper
- primary action warmer
- secondary structure bluer

### 6.2 Top sections must be mostly typography, not structure

The top of Dashboard and Welcome should be driven by:

- headline
- support copy
- inline metrics
- one next move

not by:

- giant hero cards
- multiple statistic cards
- stacked badges

### 6.3 Rail must become quiet structure

The right rail should support the command field without competing with it.

The rail should feel like:

- context
- milestones
- recovery paths

not:

- another dashboard

---

## 7. Dashboard Implementation

### 7.1 Keep existing data logic

Preserve the current data and ranking logic where possible:

- stage assessment
- deal health
- quota coverage
- at-risk queue
- top moves
- hot signal suggestions
- advisor suggestions
- dashboard snapshot / delta memory

The implementation target is calmer rendering, not a wholesale rewrite of business logic.

### 7.2 Replace current composition

Remove the current command-layer composition pattern that still relies on:

- anchor-stage hero carding
- mini-card clusters
- separate lane panel grids
- duplicated queue sections

Replace it with:

- open command headline
- inline command metrics
- one mode strip with delta summary
- one main ranked field
- one quiet rail

### 7.3 Mode behavior

#### Brief

Should read like a ranked operating narrative.

Use:

- one open command header
- one ranked list of command items
- risk and next-move logic in one field

#### Grid

Should preserve the same items but render them as a denser map.

Use:

- fewer cards than the old grid view
- two-column field where practical
- reduced ornament

#### Queue

Should become the strictest execution mode.

Use:

- one stacked order of operations
- visible ranking
- visible rationale

### 7.4 Rail content

Dashboard rail should carry:

- current posture
- weekly honesty cues
- backup or sync warning only when relevant

It should not mirror the main field.

### 7.5 Phase-1 link behavior

Buttons should still route to existing deep rooms:

- Deal Workspace
- Future Autopsy
- Signal Console
- ICP Studio
- Advisor Deploy

No fake destinations.

---

## 8. Welcome Implementation

### 8.1 Keep welcome useful

Welcome is not disposable.

It remains:

- first-session activation surface
- thin-workspace recovery path
- orientation surface for the first real week

### 8.2 Replace current composition

Remove the current setup-article feel created by:

- oversized boxed hero
- stat-card cluster
- lane grid plus queue plus milestone stack all competing at once

Replace it with:

- one open activation header
- one ranked action list
- one quiet milestone rail

### 8.3 Primary job of Welcome

Welcome should reduce the first week to:

- one immediate move
- one next move
- one reason the sequence matters

### 8.4 Welcome queue

The activation queue should be explicit and ranked.

It should route into:

- ICP Studio
- Signal Console
- Deal Workspace
- Dashboard tour or dashboard proper
- Settings when recovery is the right move

### 8.5 Milestone rail

The rail should show:

- what anchors are live
- what is next
- how the workspace becomes believable

It should not compete visually with the action queue.

---

## 9. Shared Styling and Shell Work

### 9.1 Introduce command-page bright mode

Add a scoped command-page visual mode for Dashboard and Welcome.

This should override:

- fonts
- page background
- content background
- text colors
- button tones
- shell band appearance
- rail appearance

without accidentally re-theming the entire app yet.

### 9.2 Add lean command-layer classes

Shared CSS should include command-layer primitives for:

- open stage header
- inline metrics
- mode strip
- ranked list rows
- dense grid items
- quiet rail sections

### 9.3 Add shell variants

Shared shell helpers may expose variant classes so Dashboard and Welcome can use:

- open command band
- quiet command rail

without disrupting other pages that already depend on shell chrome.

---

## 10. Explicit Rejections in This Phase

Do not ship:

- new fake sheet modals
- graph UI in production
- multiple hero panels
- card grids pretending to be command logic
- a dark-shell clone with cleaner wording
- giant pill clouds
- four or more equal CTAs on the same surface

---

## 11. QA Checklist

### 11.1 Structural QA

- Dashboard opens into one command center
- Welcome opens into one activation command surface
- Brief / Grid / Queue all render from the same ranked logic
- existing deep rooms remain reachable

### 11.2 Visual QA

- top surfaces are calmer than before
- no screen exceeds three dominant visual planes
- chips are noticeably reduced
- the eye lands on one dominant fact or move first
- the surface no longer reads like sticky-note panel soup

### 11.3 Behavioral QA

- one primary move is visually obvious
- next move is clearer than in the old Dashboard / Welcome
- empty or sparse states still tell the user what to do now
- users do not need to choose among too many equally weighted options

### 11.4 Technical QA

- HTML still renders without runtime syntax issues
- existing analytics hooks still function
- persistence for dashboard mode still works
- boot-state and error-state behavior still works

---

## 12. Definition of Done

Production Phase 1 is complete only if:

1. Dashboard feels like the new front door to Antaeus
2. Welcome feels like an activation command surface, not setup ornament
3. the visual field is materially calmer than before
4. the ranked work is more legible than the current module-hallway flow
5. the user can move into deep rooms without losing clarity about why they are going there

---

## 13. Immediate Execution Order

The execution order for this phase is:

1. add the scoped bright command-page styling
2. add shell variants needed for open band and quiet rail
3. rebuild Dashboard composition around one ranked field
4. rebuild Welcome composition around one ranked activation queue
5. run code-side verification
6. run local browser validation

This is the exact sequence to implement now.
