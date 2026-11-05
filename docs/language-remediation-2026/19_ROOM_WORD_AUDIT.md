# 19 · The word "room" — audit and cleanup

**Date:** 2026-11-05
**Branch:** `claude/room-word-audit`
**Asked by the founder:** "Motion is acceptable but I don't see use for the word room. Where and how is the word room used in the new language state?"

## The short answer

Before this pass, the generic noun "room" showed up about **110 times** in text a user can read: help panels, hidden labels for screen readers, empty states, toasts, the cmd+K jump palette, Discovery Studio call guidance, demo and landing pages, and the instructions we give the Briefing model. In almost every case it was a stand-in for "page," "this part of the app," or the name of a specific area (Signal Console, Future Autopsy, and so on). It meant nothing a plain word couldn't say, so it has been rewritten.

What's left (about 45 strings) is the ordinary English idiom about people being present in a meeting: "get the budget owner in the room," "without you in the room," "a competitor is in the room." That's how a seller actually talks, and swapping it for "page" would make it wrong, so it stays.

None of the product names contain the word "room." Signal Console, Deal Workspace, Quota Workback, Discovery Studio and the rest are unchanged.

## How I found them

I parsed every string literal and every piece of JSX text in `src/`, `supabase/functions/` and `js/` with the TypeScript compiler and kept the ones that contain "room" or "rooms" as a whole word. Separately, I grepped the static HTML pages that get deployed (the allow-list in `tools/deploy/build-cloudflare-assets.js`), the skill recipes in `src/skills/recipes/`, and the Briefing prompt text. I left out code identifiers, CSS classes (`ant-room-chrome`, `bf-room-main`), import paths (`@/lib/room-chrome`), URL values (`fromMode=room`), object keys (`room:`, `room-route`), comments and tests.

## Where "room" was used, grouped by kind

| Kind | Count | Examples (before) | Where |
|---|---:|---|---|
| Hidden screen-reader label on the "go to another area" link strip | 11 | "Cross-room handoff", "Cross-room routes" | `src/*/components/HandoffStrip.tsx` (Deal Workspace, Discovery Studio, Founding GTM, Getting to Signed, Prospecting Desk, Outbound), `CallMemory.tsx`, `CueBooth.tsx`, `AnalyticsPanel.tsx`, `SecondaryStack.tsx`, `TerritoryArchitect.tsx` |
| App chrome: the help button, the jump palette, the wordmark | 9 | "What is this room for?", "Room help", "Jump to a room (press cmd+K)", "Filter rooms", "Room directory", "Try part of a room or skill name", default wordmark kicker "OPERATING ROOM" | `src/components/navigation.tsx`, `src/lib/palette/Palette.tsx`, `src/lib/room-chrome.tsx`, `src/lib/wordmark.tsx` |
| The help panel text (one entry per area plus the fallback) | 9 | "Each room handles a specific part of the sales workflow and can pass relevant information to other rooms." · "The room should not infer a cause…" · support email subject "(Room: Signal Console)" | `src/lib/operator-help/registry.ts` |
| "The room" doing something, where the subject is actually the named area | 12 | "The room starts ranking accounts by signal strength…" (Signal Console) · "The room pins a deal as evidence…" (Future Autopsy) · "this room can recommend a relevant contact" (Call in a Favor) · "The room is asking the right questions about the plan" (Quota Workback) · "The room should visibly punish this kind of language" (ICP Studio) | `AccountGrid.tsx`, `AccountGridDS.tsx`, `HeatBandBanner.tsx`, `PinnedCaseDS.tsx`, `CallInAFavorV4.tsx`, `SystemHealth.tsx`, `RunDocket.tsx`, `InterventionRail.tsx`, `TargetFolio.tsx` |
| "Other rooms" / "every room" / "downstream rooms", meaning the rest of the app | 20 | "The other rooms haven't sent anything for the dashboard to rank" · "so the other rooms can't tell which accounts fit" · "Each room saves to the cloud as you work" · "Real updates come from the rooms that feed it" · "the definition every other room in the app runs against" · "save a change in any room" | Dashboard, Founding GTM (7), Onboarding (2), Settings (3), Welcome (3), ICP Studio, Getting to Signed |
| "Room" meaning "where you go next" | 9 | "Log the call and choose the next room." · "Pick an intervention room." · "jump to a room and pick from there" · "continue the account plan in the appropriate outreach room" · "will appear when that room next loads" | Cold Call Studio, Deal Workspace, Getting to Signed, LinkedIn Playbook, Prospecting Desk, Welcome |
| Discovery Studio call guidance about after-the-call routing | 13 | "You still need the correct room and owner." · "The handoff may need a corrective room, not a continuation room." · "Which next room gives the team the strongest immediate leverage…" · "You still need the next room to preserve it." | `js/discovery-segment-runtime.js`, `-ai-native.js`, `-govtech.js`, `-customer-support.js`, `-global-contractor-management.js` |
| "Room" as a vague metaphor for the conversation or the meeting | 6 | "Switch the lens only when the room actually changes." · "Enter only when the room gives a cue." · "Carry the evidence into the decision room." · "can't move the room" · "carried into the room" · "never improvise the order in the room" | Discovery Studio (2), LinkedIn Playbook, Pilot Desk, Future Autopsy (2), Getting to Signed |
| Instructions to the Briefing model (which would make it write "room" back to the user) | 6 | "routed to a current Antaeus room" · "Do not route to retired or nonexistent rooms." · `"destination": "<room · object · action>"` | `src/briefing/lib/synthesis/prompts.ts`, `contrarian.ts`, and their mirrors in `supabase/functions/briefing-pipeline/llm/` |
| Design-system proof sheet (internal page, still rendered) | 3 | "The cross-room cards" · "A room ends without ending the work." · "This removes every room's local data." | `src/design-system/ProofSheet.tsx` |
| Static demo, landing and positioning pages | 9 | "every room, every read, every move the system makes" · "the room handed you the one question that unseats it" · "Every room sharpens the one before it." · "Cross-room truth." · "Each one wakes another room." · "the rooms are just where each step is shaped" | `demo-seed.html`, `preview.html`, `demo-b-space.html`, `demo-90.html`, `landing-c-inherit.html`, `landing-c-alive.html`, `seeding-flow.html`, `why-antaeus/index.html` |
| Odds and ends | 3 | Asset Builder "Room not in canon §4 yet" status · skill recipe "open the relevant room" · methodology module reason "what the other rooms already record" | `src/briefing/lib/adapters/asset-builder.ts`, `src/skills/recipes/triage-week-reads.md`, `js/methodology-bridge.js` |

## What it changed to

The rule I used: name the area when the sentence is about one area; say "page" when it means the screen you're on or the one you go to; say "the rest of the app" when it means everything else; and drop the word when the sentence works without it.

| Pattern | Before | After |
|---|---|---|
| Screen-reader label on link strips | "Cross-room handoff" | "Continue on another page" |
| Help and palette | "What is this room for?" · "Jump to a room…" · "Filter rooms" | "What is this page for?" · "Jump to a page…" · "Filter pages" |
| Wordmark default | "OPERATING ROOM" | "WORKSPACE" (every page passes its own name, so this only shows if one forgets) |
| The area as subject | "The room starts ranking accounts…" | "Signal Console starts ranking accounts…" |
| | "The room pins a deal as evidence, then shows … the smallest move that turns it around." | "Future Autopsy pins a deal as evidence, then shows … the smallest step that turns it around." |
| The rest of the app | "so the other rooms can't tell which accounts fit" | "so the rest of the app can't tell which accounts fit" |
| | "Each room saves to the cloud as you work." | "Everything you do in the app saves to the cloud as you work." |
| | "Real updates come from the rooms that feed it." | "Real updates come from the work you record elsewhere in the app." |
| Where you go next | "Log the call and choose the next room." | "Log the call and choose where to go next." |
| | "Pick an intervention room." | "Pick where the deal goes next." |
| | "continue the account plan in the appropriate outreach room" | "continue the account plan in Outbound Studio or Cold Call Studio" |
| Discovery after-the-call | "You still need the correct room and owner." | "You still need to pick where this goes next and who owns it." |
| | "The handoff may need a corrective room, not a continuation room." | "The next step may need to fix the deal, not just continue it." |
| | "You still need the next room to preserve it." | "You still need to save it to the deal." |
| Vague metaphor | "Switch the lens only when the room actually changes." | "Switch the lens only when the conversation actually changes." |
| | "Enter only when the room gives a cue." | "Reach out only when the account gives you a cue." |
| | "Carry the evidence into the decision room." | "Carry the evidence into the decision meeting." |
| | "A contact who likes you but can't move the room…" | "A contact who likes you but can't win over the rest of the buying group…" |
| Briefing model instructions | "routed to a current Antaeus room" · `<room · object · action>` | "routed to a current Antaeus product area by its name" · `<product area · object · action>` |
| Landing pages | "Every room sharpens the one before it." · "Cross-room truth." | "Each page builds on the one before it." · "Truth across the whole workspace." |

While rewriting I also dropped a few words the copy standard already flags when they were in the same sentence: "smallest move" became "smallest step," "sharpen first" became "work on first," "strongest immediate leverage" became "most immediate help," and "weekly pressure number" became "weekly number." The voice gate caught two new labels that ran past six words; both were shortened.

## What remains, and why

**Kept on purpose: about 45 strings, all the meeting-presence idiom or literal space.**

- **"In the room" about people at a meeting** (about 40). Examples: "Get IT in the room before going further." · "the wrong person is in the room" · "Contracts often come back with questions nobody can answer when the budget owner was never in the room." · "a pilot the buyer's boss could act on without you in the room" · "The wins repeat without you in the room." · "a competitor is in the room." This is how sellers talk about who is part of a buying conversation. It has nothing to do with the app's areas, and replacing it would change the meaning. Files: `js/discovery-frameworks.js`, the `js/discovery-segment-runtime-*.js` files, `src/lib/readiness/verdict.ts`, `src/future-autopsy/lib/autopsy-data.ts`, `src/pilot-desk/v4/PilotDeskV4.tsx`, `start.html`, the `landing-*` and `demo-*` pages, `seeding-flow*.html`.
- **Room as space** (2). "Room to add" on the Territory Architect account counter (there's space under the 300-account cap) and "is there still room for a more specific response?" in the GovTech discovery questions.
- **A physical room** (2). The demo Outdoors Events descriptions: "People-leadership buyers and the HR-tech vendor field in one room." That's a real event venue.

**Not changed in this pass, flagged for follow-up:**

- **The preview transcript** (`preview-transcript/`, built by `tools/preview/build-transcript.js`). It's the invite-only walkthrough served at `/preview/transcript/<CODE>/`, and it uses "room" about 360 times. Most of that comes from the generator's own headings ("What the room is for and how it works," "room 8 of 21," "Room type") plus the capability maps it embeds. The transcript is generated output, so it should be fixed in the generator and rebuilt, not edited by hand. Rebuilding drives the whole demo in a browser and rewrites every page, so it should be its own change.
- **The capability maps** in `deliverables/room-capability-maps/` (about 100 uses). These are internal doctrine documents, not product copy. They only reach a reader through the preview transcript, so they belong to the same follow-up.
- **Code and internal names.** `RoomChrome`, `room-chrome.css`, the `fromMode=room` URL value, `DestinationRoom` types, the `room:` keys in the Discovery runtime and the heartbeat's `filter.room`. None of these reach the screen. Renaming them would be a large refactor with nothing visible to show for it (canon Part III §11).
- **The `methodology/` pages.** These aren't in the deploy allow-list, so they don't ship. I fixed the one shared string in `js/methodology-bridge.js` because that file does ship.

## Checks

- `npx tsc --noEmit -p .`: clean.
- `npx vitest run`: all green after shortening the two labels the voice gate flagged.
- `npm run copy:audit`: passes Tier 1. Tier-2 review warnings went from 482 to 480, and category B went from 387 to 385.
- `npm run test:e2e` (full Playwright suite, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`): 274 passed, 1 skipped. This includes the new-surface boot smoke and the seam walk.
