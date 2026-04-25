# Discovery Studio Missing Rails — Design Plan

Date: 2026-04-21
Status: draft for founder review
Authority: `08-room-guardian-specs/antaeus-discovery-studio-strict-room-contract-2026-04-10.md` + `antaeus-discovery-studio-runtime-primitives-wiring-sheet-2026-04-10.md`

## 1. Corrected reading of current state

The DOM probe from earlier this session read as "only 2 of 7 rails implemented" because it grep'd for class names containing `recover`/`support`/`next-step`/`learned`/`worked`. That was semantically right but surface-wrong. Reading the renderer, the real state is:

| Contract rail | Status | Where it lives today |
|---|---|---|
| Framework rail | ✅ implemented | `renderFrameworkRail()`, left column |
| Segment rail | ✅ implemented | `renderSegmentStrip()`, horizontal top |
| Recover-the-call rail | ✅ implemented (named `interrupts` in code) | `renderInterrupts()`, dock tab "Recover" |
| Learned-truth ledger | ❌ missing | no surface, no state field |
| Worked memory | ⚠️ partial | `checkedNodes` state exists; no retrieval surface |
| Next-step docket | ⚠️ partial | `renderRoutes()` exists but points to *rooms*, not a dated/owned next step |
| Support dossier | ❌ missing | no surface, no runtime data |

So the gap is **3 missing + 2 partial**, not "5 of 7 missing." That changes the scope.

## 2. Design decisions (for review)

### D1. Where the missing rails live

The current dock uses a **single-selection tab pattern** — Recover OR Context OR Routes, never simultaneous. Adding 4 more rails to that tab rack would balloon to 7 tabs, which is hallway behavior (§rubric C1).

**Proposal:** Keep the dock as the in-the-moment control surface (Recover / Context / Routes). Place the compounding/state rails as **persistent panels outside the dock**, in a ledger zone below the segment stack:

```
[Topbar]
[Segment strip]
[Shell]
  [Framework rail]    [Center: segment stack]              [Dock (3 tabs)]
                      ──────────────────────
                      [Next-step docket — sticky bottom]
                      [Ledger strip: Learned | Worked]
                      [Support dossier — summoned drawer]
```

- **Next-step docket** is sticky at the bottom of the center column — always visible, per contract: *"the room must visibly pull toward a real next step."*
- **Learned-truth + Worked memory** share a compact ledger strip between the segment stack and the docket. Two-column: Learned facts left, Worked moves right. Collapsible.
- **Support dossier** is a summoned drawer (icon-button in the topbar opens it). Not always visible because it's support intelligence, not primary control — and the contract explicitly says it *"must never become the main canvas."*

### D2. Data write points

For each rail, the *writes* must happen inline on existing user actions, not as separate capture UI:

- **Learned-truth ledger** — when a rep clicks a branch that has `branch.clear` copy ("You now know..."), that string writes into `learnedFacts[]` automatically. The rep doesn't type; the act of advancing the conversation records it.
- **Worked memory** — already writes on the `check` toggle. Just need a retrieval surface.
- **Next-step docket** — opens as a prompt when the rep reaches segment 9 (`next-step-lock`). Fields: date, owner, attendees, purpose, reason-from-learned-truth. Editable thereafter. Not required to fill; room prompts if empty.
- **Support dossier** — read-only; reads from `framework.support` runtime data. Needs to be added to framework runtime files (see §4).

### D3. State model additions

Per-framework state (extends `frameworkState`):

```js
{
  openSegment,       // existing
  openNodes,         // existing
  activeBranches,    // existing
  checkedNodes,      // existing
  selectedInterrupt, // existing
  learnedFacts: [{ fact, source: {segmentKey, nodeId, branchIndex}, status: "known"|"assumed", ts }],  // new
  nextStep: { date, owner, attendees, purpose, reason },  // new
  dossierOpen: false  // new — drawer visibility
}
```

No new top-level state keys. All new state fits inside `state.frameworks[frameworkId].*`.

## 3. Proposed implementation sequence

**Wave 1 — data + invisible-but-working (single session):**

1. Extend `ensureFrameworkState` with `learnedFacts`, `nextStep`, `dossierOpen`.
2. In `toggleBranch`, when the branch has a `clear` string, append to `learnedFacts` (dedupe by `{nodeId, branchIndex}`).
3. Add migration: read/write via existing `persist()`.
4. No visible change yet. Verify via DOM probe that state writes.

**Wave 2 — Next-step docket (single session):**

5. Add `renderNextStepDocket()` — sticky bottom card in center column.
6. Empty-state prompt: *"Lock the next move. What date, who, why does it follow from the truth earned?"*
7. Filled-state: 5 rows (date, owner, attendees, purpose, reason) with inline edit.
8. Visual: bordered card, orange primary-action edge when empty, navy when filled.
9. Verify: seed demo writes a valid next-step; empty state renders the prompt.

**Wave 3 — Learned + Worked ledger strip (single session):**

10. Add `renderLearnedLedger()` — two-column compact strip between segment stack and docket.
11. Left column: top-10 learned facts, newest first, source-linked (click → jumps to node).
12. Right column: worked moves grouped by segment, count + list of checked nodes.
13. Collapsible: default open on desktop, collapsed on narrow viewports.
14. Verify: seed demo shows both columns populated; clicking a learned fact jumps to its node.

**Wave 4 — Support dossier (requires runtime data, may split):**

15. Add `framework.support = { proofAnchors[], deploymentAnchors[], objectionLibrary[], inboundHandlers[] }` to each of the 9 framework runtime files. *This is the biggest piece; if the data isn't authored yet, we need your input per framework.*
16. Add `renderSupportDossier()` — drawer overlay summoned via topbar icon.
17. Structure: accordion with four sections (Proof / Deployment / Objections / Inbound Q).
18. Keyboard: Escape closes. Clicking outside closes.
19. Verify: drawer opens/closes; clicking an objection highlights the relevant recover-the-call interrupt if one maps.

## 4. What I need from you before I code

1. **Approve the D1 layout.** Specifically: are you OK with next-step and ledger living in the center column (not the dock) and support as a summoned drawer? I think it's the right call but you're the founder.
2. **Approve the implementation order (Waves 1–3 before Wave 4).** Wave 4 depends on authoring 9 frameworks' worth of support data, which is real content work, not just rendering. OK to defer?
3. **One mind question.** The contract says the room must *"visibly pull toward a real next step,"* but Wave 4 depends on support data that doesn't exist yet. Do we want a temporary "dossier coming" placeholder in the meantime, or just hide the topbar icon until the data is authored? I lean hide.
4. **Any rename wishes.** Code currently uses "interrupt" for what the contract calls "recover-the-call." Fine to leave or rename — low-stakes.

## 5. Rough time estimate

- Wave 1: 30–45 min (state + data writes, no UI)
- Wave 2: 60–90 min (docket UI + inline edit)
- Wave 3: 60–90 min (ledger strip)
- Wave 4: 4–6+ hours spread across multiple sessions because of content authoring per framework

So Waves 1–3 could ship in one long session or two short ones. Wave 4 is a separate project.

## 6. Risk notes

- The renderer is still HTML-string assembly + inline handlers; brittleness audit §P1. Adding 3 more render functions makes this worse. Worth considering a small render-helper abstraction (not a framework, just a `renderSection` helper) during Wave 1. Or leave it and address during the full brittleness cleanup later. I'd leave it — this plan is already big enough.
- The 9 framework runtime files vary in size (151–640 lines). Adding `support` data to each is a lot of prose. We should draft the first framework's support data as a template before fanning out.

---

Awaiting approval on §4 items before implementing Wave 1.
