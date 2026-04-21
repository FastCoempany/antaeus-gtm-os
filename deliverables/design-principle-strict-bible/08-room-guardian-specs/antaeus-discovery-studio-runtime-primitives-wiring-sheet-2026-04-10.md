# Antaeus Discovery Studio Runtime Primitives Wiring Sheet

Status: internal build memo  
Date: 2026-04-10

Purpose: define the smallest runtime objects Discovery Studio must actually run on so mockups and live build work from the same machine logic.

This memo is the literal wiring sheet for Discovery Studio face work.
If a visual object cannot be mapped to one of the primitives below, it should not exist.

## Room identity

Discovery Studio is a live discovery engine.
It is not:
- a framework browser
- a methodology document
- a note pad
- a script wallpaper page

The room exists to help the user:
- choose the right framework
- advance the live conversation node by node
- capture real signals and learned facts
- adapt to resistance, timing pressure, and stakeholder reality
- lock the next move and hand the truth into the next room

## Hard operating references now locked

Discovery Studio now inherits hard operating constraints from:

- `07-control-artifacts/lumana-discovery-command-center-reference-2026-04-10.html`
- `07-control-artifacts/lumana-discovery-framework-reference-2026-04-10.html`

These files do not dictate Antaeus visual style.
They do dictate live-call behavior standards.

Discovery Studio also now inherits a hard room-level contract from:

- `08-room-guardian-specs/antaeus-discovery-studio-strict-room-contract-2026-04-10.md`

That contract locks the vertical collapsible segment rail as the main room grammar.
This wiring sheet defines the runtime machine that must power that rail.

## Primary operating mode now locked

Discovery Studio is now locked to **on-call primary** use.

That means:
- the user must be able to run the framework while the call is happening
- the room must be glanceable under time pressure
- the room must help the rep speak, branch, recover, and lock the next move without losing the live conversation

Prep and post-call behavior still matter, but they are secondary modes.
The room may not optimize itself into a framework library, methodology viewer, or post-call writeup surface at the expense of live-call usability.

Every visible object must help the user do at least one of these things in real time:
- know where they are
- know what to say
- know what the buyer just revealed
- know how to branch
- know how to recover
- know how to lock the next move
- know whether time pressure now changes the correct move

The room must therefore behave as one vertical, collapsible, branch-driven call rail.
If a visual object cannot support that operating mode, it does not belong in the room.

## Locked framework registry

Discovery Studio now runs on 9 frameworks:

1. Legal / Legal Ops / Law Workflow
2. Recruiting / Talent / HR / People Workflow
3. Product / UX / Enablement / Knowledge Workflow
4. GovTech / Compliance / Public-Sector Operations / Trust and Safety
5. Customer Support / Operations / Vertical Workflow Software
6. Sales / Revenue Intelligence
7. Manufacturing / Supply Chain / Engineering
8. Data / Intelligence Infrastructure
9. AI-Native Buyer Discovery Framework

## Runtime primitives

| Primitive | What it is | Written by | Read by | Visible form |
|---|---|---|---|---|
| `frameworkRegistry` | The master list of 9 frameworks and their category metadata | static room config | framework chooser, guards, analytics | framework rail or selector |
| `activeFramework` | The current framework in force for the live deal or call | user selection, contextual auto-pick | node engine, objection library, question set | active framework mark |
| `callClock` | The live elapsed-call timer and urgency state | timer control, restore state | tempo bar, compression logic, phase guidance | clock + urgency mark |
| `phaseTempoPlan` | The expected pacing and jump rules by phase | static framework data | tempo bar, phase navigator, compression logic | phase timing strip |
| `activeNode` | The current live conversation step | response click, direct node jump, restore state | lead sheet, coaching surface, response rail | central active sheet |
| `activeTrack` | The current disposition path: engaged, guarded, skeptical, deflecting, compressed | response result, manual override | copy tone, branch options, close logic | track mark or mode label |
| `essentialNodeSet` | The nodes that survive compression mode for the current framework | static framework data | compression logic, node filter | essentials mode |
| `skipAheadHandlers` | Recovery routes for demo, pricing, send-info, wrong-person, and bad-timing moments | static framework data | quick rescue tray, node engine | skip-ahead tray |
| `responseSet` | The currently available prospect-response branches from the active node | node engine | response rail | clickable response choices |
| `expandedResponse` | The one response branch currently opened for detail | user click | coaching layer, counter language, next path | expanded branch detail |
| `learnedFacts` | The accumulated truth from the live conversation | branch resolution, fact capture | readiness logic, next-step lock, handoff payloads | earned facts dock |
| `signalLedger` | Live behavioral and verbal signals captured during the conversation | user capture, branch defaults | confidence logic, coaching, risk cues | signal shelf or ledger |
| `tiebackLedger` | The discovered truths that are being held or are now ready to deploy | branch resolution, user marking | value bridge, close logic, support cues | hold/deploy strip |
| `supportDossier` | The always-reachable proof, deployment, and category intelligence pack | static framework data | support drawer, objection recovery, next-step lock | dossier panel |
| `objectionLibrary` | Global objection handlers available from any node | static framework data | side drawer, quick help | objection drawer |
| `inboundQuestionHandlers` | Structured answers for buyer questions asked mid-discovery | static framework data | quick-answer drawer, bridge prompts | question handler strip |
| `compressionMode` | Time-pressure state that shortens the conversation path | manual toggle, branch trigger | node engine, next-step lock | compression toggle |
| `nextStepLock` | The specific next action being earned | user capture, node progression | handoff dock, close surface, CRM payload | next-step docket |
| `callDisposition` | Meeting booked, referral, nurture, disqualified, hard pass, in-progress | user selection, flow completion | post-call package, route rules | disposition selector |
| `postCallPackage` | The artifacts and follow-up state produced after the live conversation | disposition logic | export, handoff, summary surfaces | send/export dock |
| `handoffPayload` | The structured truth passed into neighboring rooms | post-call logic, live state | Deal Workspace, Call Planner, Future Autopsy | route actions |

## Primitive rules

- `activeFramework` may change the entire question system, objection set, and proof logic.
- `callClock` and `phaseTempoPlan` together must be able to tell the user when to compress or jump.
- `activeTrack` may change tone, burden of proof, and close behavior, but it may not rewrite the deal facts.
- `essentialNodeSet` must be defined by framework data, not improvised in the UI.
- `skipAheadHandlers` must preserve conversation control, not eject the user into documentation.
- `learnedFacts` are earned truth, not freeform notes.
- `signalLedger` stores interpreted cues, not decorative statuses.
- `tiebackLedger` stores deployed versus held truth, not slogan fragments.
- `supportDossier` must stay close enough for live use but quiet enough not to outrank the active sheet.
- `nextStepLock` is not complete unless it contains date, owner, and reason.
- `handoffPayload` is the only thing neighboring rooms should need from Discovery Studio.

## UI zone wiring

| Zone | Bound primitives | What the zone must do | What the zone must not become |
|---|---|---|---|
| Framework chooser | `frameworkRegistry`, `activeFramework` | Make the current framework obvious and switchable | a gallery of descriptive cards |
| Tempo bar | `callClock`, `phaseTempoPlan`, `compressionMode` | Make live pace and urgency legible | a decorative timer |
| Skip-ahead tray | `skipAheadHandlers`, `activeNode`, `activeTrack` | Recover control when the buyer jumps | a buried help menu |
| Lead sheet | `activeNode`, `activeTrack`, `expandedResponse` | Show the live script, objective, and counter path | a giant teaching paragraph |
| Response rail | `responseSet`, `expandedResponse` | Let the user move the conversation by choosing real prospect reactions | fake branching that all lands the same |
| Fact dock | `learnedFacts` | Show what has actually been learned and what is still missing | freeform note clutter |
| Signal ledger | `signalLedger` | Make real pain, fake politeness, politics, and urgency legible | heat meters or abstract chips |
| Tieback strip | `tiebackLedger` | Distinguish what truth is being held from what is ready to deploy | premature value spraying |
| Support dossier | `supportDossier`, `activeFramework` | Keep proof and deployment intelligence reachable during the call | the main canvas |
| Objection drawer | `objectionLibrary` | Offer fast recovery language from any point | a second main canvas |
| Inbound question strip | `inboundQuestionHandlers` | Handle pricing, timeline, competitor, and demo questions without losing control | a FAQ page |
| Next-step docket | `nextStepLock`, `callDisposition` | Force the room toward a real next move | a passive summary box |
| Handoff dock | `handoffPayload`, `postCallPackage` | Route the truth into the next room cleanly | export clutter or duplicate actions |

## Interaction contracts

- Choosing a framework sets `activeFramework` and loads its opening node family.
- Starting a call starts `callClock` and activates the current phase pacing rules from `phaseTempoPlan`.
- Entering compression mode filters the visible node space by `essentialNodeSet`.
- Clicking a skip-ahead rescue writes the active `skipAheadHandlers` context, preserves the current learned truth, and moves the node engine to the correct recovery point.
- Clicking a response branch updates `expandedResponse`, may change `activeTrack`, may add `learnedFacts`, and advances `activeNode`.
- Capturing a signal writes to `signalLedger` and may strengthen or weaken downstream close confidence.
- Turning on compression writes `compressionMode` and swaps the node path to the shorter burden-of-proof route.
- Marking a tie-back updates `tiebackLedger` as hold or deploy-now.
- Selecting a disposition writes `callDisposition` and determines which `postCallPackage` is available.
- Locking a next step writes `nextStepLock` and enriches `handoffPayload`.
- Moving to a neighboring room must carry `handoffPayload`, not force the user to restate the room's truth.

## Handoff contract

| Destination room | Discovery Studio must send |
|---|---|
| Deal Workspace | active framework, learned facts, stakeholder map, current-state method, trigger event, proof threshold, blockers, next-step lock |
| Call Planner | active framework, active node context, top hypothesis, top open questions, likely objections, target stakeholder map |
| Future Autopsy | failure pattern clues, unresolved proof gaps, stalled next-step evidence, disqualification or drift indicators |

## Mockup contract

Every Discovery Studio mockup must make six things instantly legible:

1. What framework am I in?
2. What node am I on?
3. What can the prospect say next?
4. What have I already learned?
5. What signal quality am I hearing?
6. What move am I earning from here?

If a mockup cannot answer those six questions without explanatory chrome, it fails.

It must also answer four call-pressure questions instantly:

1. How much time pressure am I under?
2. What do I skip if the buyer just jumped the sequence?
3. What truth should I hold versus deploy now?
4. Where is the support proof if the buyer challenges me right now?

Every Discovery Studio mockup must also pass the live-call test:

- Can the rep use it while actively talking?
- Can the rep recover from an interruption in one glance?
- Can the rep handle an objection or inbound question without leaving the main conversation surface?
- Can the rep switch into compression mode fast enough for a two-minute buyer?
- Can the rep feel pace pressure without reading an essay about pace?
- Can the rep resume cleanly after the buyer drags them sideways?

## Live-build contract

- Build the room around `activeNode`, not around a static framework description.
- Build branch clicks as the primary engine of movement.
- Build tempo and compression as real runtime behavior, not display-only ornament.
- Keep `learnedFacts` and `signalLedger` visible, compact, and earned.
- Keep `skipAheadHandlers` and `supportDossier` reachable from the live surface.
- Keep `tiebackLedger` honest so value only appears when the room has earned it.
- Make `nextStepLock` feel like the goal state of the room.
- Keep handoff actions adjacent to the truth they are exporting.
- Do not create any meter, chip, accent, or icon unless it maps to one of the primitives above.
- Keep the primary controls reachable with minimal cursor travel during a live call.
- Prioritize readable, speakable language over explanatory density above the fold.
- Treat interruption recovery as a first-class interaction, not an edge case.

## Anti-patterns now banned

- Framework cards that just summarize categories
- Long methodology prose above the fold
- Decorative signal chips without state consequence
- Note-taking UI that outranks the live conversation engine
- Static sidebars repeating the same truth already shown in the lead sheet
- Export buttons that do not map to a distinct `postCallPackage`
- Any layout that looks interesting in a mockup but slows down live call navigation

## Build order from this memo

1. Mock Discovery Studio around these primitives only.
2. Validate that every visible object maps to a primitive.
3. Build live room state and interaction wiring from the same map.
4. Only after runtime wiring is sound, tune semiotics and visual originality.
