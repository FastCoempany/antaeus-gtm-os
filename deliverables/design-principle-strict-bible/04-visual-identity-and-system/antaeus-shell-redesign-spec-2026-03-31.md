# Antaeus Shell Redesign Spec

Date: 2026-03-31

Status: implementation-grade shell control document

Purpose: define how the Antaeus application shell should be redesigned so every module inherits one coherent operating environment instead of feeling like separate dark pages inside the same repo.

Source anchors:

- [deliverables/plans/antaeus-ui-ux-design-thesis-and-system-rules-2026-03-31.md](/c:/AppDev/v1AntaeusApp/Appv2_290126/deliverables/plans/antaeus-ui-ux-design-thesis-and-system-rules-2026-03-31.md)
- [css/app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)
- [js/nav.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js)
- [app/welcome/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)
- [app/dashboard/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)

---

## 1. Shell Job

The shell is not decoration.

The shell has 5 jobs:

1. orient the user instantly
2. rank what matters now
3. preserve context while the user moves between modules
4. communicate state truth without drama
5. make the whole product feel like one operating system

If the shell is working, the user should feel:

- I know where I am
- I know what object I am working on
- I know what pressure exists
- I know the single best next move
- I can move without losing the thread

If the shell is failing, the user will feel:

- module drift
- card soup
- too many equal-weight actions
- not enough object continuity
- not enough operating consequence

---

## 2. Current Shell Diagnosis

### 2.1 What the current shell already gets right

- strong dark operating-room base
- stable left navigation groups
- recognizable typographic identity
- persistent footer actions
- clear app-level distinction from the public site
- improved welcome, dashboard, and module bridge work already in place

### 2.2 What the current shell still gets wrong

- too much page-specific styling doing shell work locally
- page headers are not yet structurally consistent
- the app shell does not yet impose one dominant action law
- nav is comprehensive, but not yet visually ranked by current pressure
- footer actions are useful, but not yet integrated into a stronger shell hierarchy
- many modules still feel like custom canvases inserted into the shell rather than shell-native surfaces
- state language is richer than before but still fragmented across modules
- right-rail/context behavior is inconsistent

### 2.3 Primary shell problem statement

The current product is logically more integrated than it looks.

The redesign must make the shell express the compounding system that already exists under the hood.

---

## 3. Shell Redesign Thesis

Antaeus Shell v2 should feel like:

- quiet authority
- ranked pressure
- calm density
- strategic seriousness
- object continuity

It should not feel like:

- a CRM sidebar with prettier colors
- a startup AI workspace
- a dashboard collection
- a document app
- a generic admin shell

The correct visual metaphor is:

- a command environment
- a disciplined operating room
- a system that keeps the user honest

The incorrect visual metaphor is:

- a playground
- a canvas toy
- a productivity hub

---

## 4. Shell Architecture

Shell v2 is composed of 5 persistent zones.

### 4.1 Zone A: Left Rail

Purpose:

- global movement
- family grouping
- current-pressure signaling
- access to shell-level actions

Structure:

1. product mark
2. workspace identity strip
3. nav families
4. shell actions
5. workspace/account footer

Behavior rules:

- rail is always present on authenticated desktop surfaces
- one active location
- at most one context-highlighted downstream location
- nav sections stay grouped by work type, not by marketing language
- current pressure can tint one or two rows, but should never create a Christmas tree of alerts

### 4.2 Zone B: Top Bar

Purpose:

- orient the current page
- state the operating object
- state the current page promise
- expose one primary move and one secondary move

The top bar replaces the current loose pattern of:

- page title only
- page title plus local ad hoc buttons
- page-local banner plus separate action row

Top bar structure:

1. page title
2. object subtitle or state sentence
3. one primary action
4. one secondary action
5. optional quality/state badge

### 4.3 Zone C: Command Band

Purpose:

- tell the user what matters now on this surface
- rank urgency
- avoid long explanatory intro blocks

This is not a hero.
This is a focused operating strip.

Contents:

- current pressure
- quality or confidence band
- why this matters now
- next move if the page needs one

### 4.4 Zone D: Work Canvas

Purpose:

- hold the actual module interaction
- be visually quiet enough that the object and action hierarchy remain legible

Rules:

- modules should feel embedded into the shell, not wrapped in unrelated panel language
- work canvas can be one-column or split, but should not invent a new shell per page

### 4.5 Zone E: Context Rail

Purpose:

- downstream consequence
- object-linked evidence
- helpful secondary context

This is where the app should show:

- what this output affects next
- current object truth
- linked records
- risks
- quick support actions

The context rail should not become:

- a dumping ground
- a second module
- a tutorial wall

---

## 5. Page Anatomy Rules

Every authenticated shell page should follow this anatomy:

1. left rail
2. top bar
3. command band
4. work canvas
5. optional context rail

Not every page needs every zone at full weight.

### 5.1 Dashboard anatomy

- left rail
- top bar with "today's command view"
- command band with stage, source truth, and next move
- work canvas with prioritized system outputs
- light context rail for rhythm and system status

### 5.2 Builder module anatomy

Applies to:

- ICP
- Territory
- Sourcing
- Outbound
- Call Planner
- PoC

Structure:

- top bar states object
- command band states quality/pressure
- work canvas is the builder
- context rail explains downstream impact

### 5.3 Review module anatomy

Applies to:

- Dashboard
- Readiness
- Playbook
- Future Autopsy

Structure:

- top bar states verdict
- command band states why the verdict matters now
- work canvas shows ranked findings
- context rail shows next actions and linked objects

### 5.4 Settings anatomy

Settings is not a generic preferences page.

It should feel like:

- trust
- control
- system boundaries

So its command band should answer:

- what level of truth am I controlling here
- what changes for this workspace
- what changes only for this browser

---

## 6. Navigation Redesign Rules

### 6.1 Navigation must stay grouped by work type

Keep families:

- Home
- Intelligence
- Territory
- Outbound
- Calls
- Pipeline
- System

Do not reorganize nav around:

- features
- AI capabilities
- templates
- arbitrary product marketing

### 6.2 One active row, one contextual row

The shell should support:

- one active page
- one contextual recommendation

It should not support:

- five glowing candidates
- many equal-weight badges

### 6.3 Nav row anatomy

Each row should contain:

- icon
- label
- low-key state mark
- optional pressure or completeness signal

The row should not contain:

- explanatory paragraphs
- multiple badges
- verbose subcopy

### 6.4 Nav state language

Allowed shell nav states:

- active
- context next
- live
- thin
- blocked

These should be visual states, not raw text appended to each row.

### 6.5 Footer action law

Footer actions should be reduced to shell-level actions only.

Correct examples:

- Tour
- Welcome Guide
- Annual Plan
- Settings
- Sign out

Incorrect examples:

- module-specific shortcuts
- temporary debug actions
- actions that belong in a page top bar

### 6.6 Demo mode shell rule

Demo mode should be unmistakable but not loud.

Required changes in demo mode:

- workspace identity swaps to sample truth
- one clear sample-workspace notice
- exit action remains visible
- no fake danger styling unless there is real risk

---

## 7. Top Bar Rules

### 7.1 Every page gets one sentence of operating truth

This sentence should answer:

- what this page is for right now

Examples:

- "Define the wedge the rest of the system should operate from."
- "Turn account evidence into the next believable motion."
- "Pressure-test this deal before time does."

### 7.2 Button law

Top bar may contain:

- one primary action
- one secondary action
- one tertiary text-level action if absolutely necessary

No page should open with 5 equal-weight buttons in the title row.

### 7.3 Quality and pressure visibility

If a page has a quality, confidence, readiness, or pressure state, the top bar or command band must expose it immediately.

Users should not have to scroll to understand:

- whether the object is strong
- whether the page output is thin
- whether action is urgent

---

## 8. Command Band Rules

The command band is the core shell innovation.

It should replace bloated intro cards and module-local framing sprawl.

### 8.1 Command band content priority

In order:

1. pressure or quality
2. what changed or what is true now
3. what the user should do next
4. why that move matters downstream

### 8.2 Command band variants

Allowed variants:

- pressure
- quality
- activation
- handoff
- trust

### 8.3 Command band copy rules

Copy should be:

- short
- severe
- clear
- action-linked

Copy should not be:

- motivational
- product-marketing language
- explanatory filler

---

## 9. Context Rail Rules

The context rail should standardize what is currently fragmented across pages.

### 9.1 Correct use cases

- linked object summary
- what this affects next
- proof or evidence source
- risk stack
- quick action set

### 9.2 Incorrect use cases

- long education copy
- duplicated content from the main canvas
- secondary workflows that should be a separate page

### 9.3 Rail component order

1. object card
2. quality or pressure card
3. downstream impact card
4. quick links

At most 4 stacked cards visible above the fold.

---

## 10. Visual System Rules For The Shell

### 10.1 Background

The shell should stay dark.

But it should move from flat dark to controlled atmosphere:

- deep charcoal base
- slight tonal transitions
- subtle radial lighting where hierarchy needs emphasis
- restrained gold, blue, and teal accents

No neon AI gradients.
No purple default bias.
No flat black void.

### 10.2 Typography

Serif remains the authority layer.
Sans remains the operating layer.

Use:

- serif for page titles, critical verdicts, and stage-defining moments
- sans for navigation, controls, data, and utility copy

Typography rule:

- one serif emphasis per view region
- everything else operationally clean

### 10.3 Border and container rule

The current shell overuses soft card framing in some modules.

Shell v2 should move toward:

- fewer but more meaningful containers
- stronger hierarchy by spacing and type
- less dependency on bordered cards for every section

### 10.4 Accent hierarchy

Reserved emphasis colors:

- gold = primary intent / active truth / important direction
- teal = live / healthy / compounding
- blue = system context / informational truth
- amber = caution / thin / workable but weak
- red = risk / urgent pressure / failure

Do not invent module-specific rainbow accents.

---

## 11. State System Rules

The shell must standardize state language.

### 11.1 Global state vocabulary

Use these families:

- live
- ready now
- workable
- thin
- blocked
- stale
- risk
- handoff-ready

Avoid constantly inventing new labels page by page.

### 11.2 Save and sync truth

The shell should always make these distinctions legible:

- saved locally
- synced to workspace
- sample/demo only
- failed to sync

This belongs in shell-consistent treatment, not ad hoc module copy.

### 11.3 Empty state law

Empty states must:

- explain what this page becomes useful for
- state what is missing
- route to the next real action

Empty states must not:

- apologize
- over-explain
- strand the user with no object or no path

### 11.4 Error state law

Shell error treatment should use one structure:

1. what failed
2. what still works
3. what to do now

Never allow a blank dark module with no visible truth.

---

## 12. Behavioral Stimulus Rules

The redesign should influence behavior through structure, not tricks.

### 12.1 What should drive behavior

- ranked next action
- visible consequences
- obvious defaults
- prefilled context
- state truth
- completion benefit

### 12.2 What should not drive behavior

- decorative pulse everywhere
- warning saturation
- random glowing buttons
- fake urgency

### 12.3 When motion is allowed

Motion should be reserved for:

- one primary action in critical activation contexts
- save confirmation
- quality or state transition
- tour or guided orientation

Motion should be subtle and consequential.

---

## 13. Responsive Shell Rules

### 13.1 Product stance

Antaeus is desktop-first.

The shell redesign should support:

- strong desktop
- narrow desktop
- tablet-ish browser widths

It does not need to pretend the full operating system is mobile-first.

### 13.2 Responsive rule

At smaller widths:

- left rail may collapse
- context rail may stack below main canvas
- top bar actions may collapse into a tighter row

But:

- hierarchy must survive
- dominant action must remain obvious
- the page cannot turn into stacked card soup

### 13.3 Public vs authenticated stance

Public pages can support mobile more fully.
Authenticated deep-work surfaces can be explicitly desktop-biased if needed.

The shell spec should not sacrifice operating seriousness for fake mobile completeness.

---

## 14. Shell Component Primitives

Shell v2 should be built from a small set of reusable primitives.

### 14.1 Required primitives

- shell page frame
- shell top bar
- command band
- object summary card
- quality band
- pressure strip
- downstream impact block
- quick action row
- state badge set
- sync/save truth chip
- rail section

### 14.2 Banned primitives

- arbitrary one-off hero panels
- module-specific top bars that ignore shell law
- uncontrolled badge collections
- decorative empty cards with no operating value

---

## 15. Shell Rollout Order

Do not redesign every page at once.

### Wave 1: shell foundation

- [css/app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)
- [js/nav.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js)
- shared page-header pattern
- shared command-band pattern
- shared context-rail pattern

### Wave 2: anchor surfaces

- [app/welcome/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/welcome/index.html)
- [app/dashboard/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/dashboard/index.html)
- [app/icp-studio/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/icp-studio/index.html)
- [app/deal-workspace/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/deal-workspace/index.html)
- [app/founding-gtm/index.html](/c:/AppDev/v1AntaeusApp/Appv2_290126/app/founding-gtm/index.html)

### Wave 3: family rollout

- targeting family
- motion family
- execution family
- system family

### Wave 4: shell QA and tightening

- state consistency pass
- responsive pass
- contrast and spacing pass
- action hierarchy pass

---

## 16. Acceptance Criteria

The shell redesign is successful when:

- the shell feels like one operating system across modules
- every page exposes one dominant move
- current pressure or quality is visible above the fold
- object continuity is legible without hunting
- nav movement preserves context and feels calmer
- context rail usage becomes consistent
- empty and error states stop feeling ad hoc
- the product feels less like a collection of module pages and more like a serious operating environment

The shell redesign is not successful if:

- pages are prettier but no clearer
- the shell becomes more decorative than instructive
- the app starts feeling more like a CRM
- module pages still invent their own local shell logic

---

## 17. Non-Negotiable Shell Constraints

- Antaeus must not look like a CRM.
- The shell must remain dark and serious.
- The redesign must reduce friction, not remove seriousness.
- The shell must make handoff feel like the final gravity of the system.
- The shell must preserve the current product's compounding logic and make it more visible.
- The shell must standardize behavior before it multiplies aesthetics.

---

## 18. Best Immediate Next Move

Translate this spec into a shell implementation wave document that covers:

1. shared token changes in [css/app.css](/c:/AppDev/v1AntaeusApp/Appv2_290126/css/app.css)
2. nav rewrite plan in [js/nav.js](/c:/AppDev/v1AntaeusApp/Appv2_290126/js/nav.js)
3. shared page-top pattern
4. command-band component
5. context-rail component
6. anchor-surface implementation order

That next document should be executable enough to start patching the shell, not just describing it.
