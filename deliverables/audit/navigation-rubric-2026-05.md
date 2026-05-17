# Navigation Intelligence audit rubric

**Authority:** Locked 2026-05-17. The repeatable test every Phase 2 PR runs.

This document is the method. Every Phase 2 PR contains a walkthrough doc as its description; that walkthrough is structured by the three tests below and answers the four cuts.

The rubric replaces the room-level copy audit (the Sarah-the-CRO sweep #83–#96) as the unit of measurement. Copy audits asked *"does the wording read clean for Sarah?"* This rubric asks *"does the next click land where Sarah's hand was already reaching?"* The unit of analysis is the click-sequence, not the room.

---

## The three tests

Run all three for every surface in the walked flow. A finding is anything that fails any of the three.

### Test 1 — The hand-reach test

**Question:** What action did Sarah just take to land on this surface? Given that action, what is the move her hand is *already reaching for* before she scans the page?

**Method:**
1. Name the action that brought her here (a verb + an object, e.g. *"she just clicked Save on a new ICP"*).
2. Predict the next move her hand wants to make. State it as a verb + object (e.g. *"build the territory using this ICP as the wedge"*).
3. Open the surface. Is the dominant CTA that move? Is it visually the most weighted thing on the surface? Is it positioned where her cursor was last (the predictable visual lane)?
4. If yes → pass. If no → finding.

**What counts as a fail:** Dominant CTA is something else (the move's CTA exists but is secondary). Dominant CTA is the predicted move but visually weak. Dominant CTA is the predicted move but positioned across the viewport from where her cursor came from. No clear dominant CTA at all.

### Test 2 — The inevitability test

**Question:** Cover everything below the topbar. Read just the topbar kicker + serif title + sub + dominant CTA. Does the next move feel **inevitable**, or **arbitrary**?

- **Inevitable** = sentence-shaped, specific, references the focused object, makes the next move obviously the only sensible move.
- **Arbitrary** = generic, decorative, asks Sarah to decide where to go next.

**Method:**
1. Read the topbar narrative aloud.
2. Ask: would a CRO walking past Sarah's screen know what room this is, what state it's in, and what's about to happen next — from those four lines alone?
3. If yes → pass. If no → finding.

**What counts as a fail:** Topbar describes the room ("WORKSPACE", "ANCHORS") instead of describing what's *happening* on this surface right now. Title is canon-doc voice instead of operator voice. Sub is general framing instead of specific-to-this-state. Dominant CTA is a navigation action ("Open X") instead of a sales move ("Update the deal").

### Test 3 — The seam test

**Question:** When Sarah clicks the dominant CTA, what happens at the destination?

**Method:**
1. Click the CTA. Observe what loads.
2. Check four invariants:
   - **(a) Focused object loaded.** If she clicked into a deal, the deal is open. If she clicked into an account's outbound, the account is pre-selected. She does not re-pick.
   - **(b) Right mode/lens.** Dashboard opens in the right mode for the move (e.g. Spotlight if she clicked "see most urgent"; Queue if she clicked "triage"). Discovery Studio opens at the right segment. Deal Workspace opens at the right deal.
   - **(c) Continuity breadcrumb present.** `returnTo`, `returnLabel`, `focusObject`, `focusRoom`, `fromMode`, `fromSurface` propagate. The destination's back-button (if present) goes to the source, not the global hub.
   - **(d) Zero re-entry.** Nothing she just typed has to be re-typed. Nothing she just selected has to be re-selected.
3. All four invariants hold → pass. Any one fails → finding.

**What counts as a fail:** Destination loads at the default state (not focused on what she clicked into). Continuity params dropped — back button goes to Dashboard root instead of the source room. Form fields are blank when she'd already typed something equivalent upstream. Account name, deal id, persona — none of it carries.

---

## The four cuts (measured per room within the walked flow)

For every room a Phase 2 flow PR touches, measure these four cuts.

### Cut 1 — Buttons that shouldn't exist
Decorative CTAs. Unranked secondary actions that have no clear move. Tertiary navigation that revives the hallway. Action chips that look clickable but do nothing useful. **Remove.**

### Cut 2 — Buttons that should exist but don't
Sarah reaches for X — X isn't there. Common cases:
- The handoff-forward CTA into the next inevitable room (e.g. ICP saved → no "Build territory" CTA appears).
- The mid-task save-and-continue affordance.
- The escape hatch when the current path is wrong (rare but needs to exist).
- The shortcut to the previous focused object (recently-touched deals, accounts, ICPs).

**Add.**

### Cut 3 — Copy that survived the Sarah-CRO sweep but doesn't survive a Tuesday-morning read
The copy audits (#83–#96) caught the worst offenders. The Tuesday-morning read is harder — phrases that *technically* read clean to a canon-fluent operator but read as overwrought, AI-trying-too-hard, or canon-doc voice to a CRO scanning at 8:47 AM with coffee in one hand. Examples that survived #83–#96 and need re-examination:

- *"the system compounds off this"* — internal canon vocabulary leaking
- *"earns legitimacy"* — designer-doc
- *"downstream rooms"* — internal architecture word
- *"workspace lights up"* — friendly-first
- *"the kit just became real"* — keep this one (intentional canon §4.19 signature, but flag for re-examination)
- *"pinned as evidence"* — canon-doc voice
- *"least path of resistance"* — internal doctrine vocabulary

**Cut deeper than the copy audits did, including in places that already passed.**

### Cut 4 — Layout that doesn't match the picked triptych structural intent
For rooms that have a `-selected-` triptych on file (Deal Workspace + Future Autopsy confirmed via the 2026-05-01 bootstrap audit; others to be discovered as the flow PRs surface them):

- Check the picked variant's structural intent against the shipped first-fold.
- Common drift: modal overlay where inline detail was picked; vertical stack where 2-col was picked; tabbed sheets where stacked sentence-titled sheets were picked.
- For rooms without an explicit triptych, the structural intent is the room's canon §4 family + the room's mind paragraph. Hold the shipped layout against those.

**Restructure where needed.** Posture-level findings get rebuilt, not relabeled.

---

## What counts as a "structural finding" vs a "copy finding"

A Phase 2 PR ships both kinds. Tag each finding so the diff is reviewable:

| Tag | Definition | Example |
|---|---|---|
| `[STRUCTURAL]` | Layout change, button moved, button added, button removed, mode switched, overlay → inline, etc. | Add a "Build the territory" primary CTA to the ICP save success state. |
| `[SEAM]` | Continuity-param wiring, focus-object passthrough, destination-mode preselection. | When clicking a Deal Workspace deal from the Brief, land at that deal's edit modal opened (not the default grid). |
| `[COPY]` | Words only — kicker, title, sub, CTA label, placeholder, help text. | Replace `Open Deal Workspace` with `Update the deal` on the Advisor handoff strip. |
| `[CANON]` | Doc update required (CLAUDE.md, ADR, room spec). | Note in canon §4.X that the room's posture changed. |

A typical Phase 2 flow PR ships ~5–15 `[STRUCTURAL]`, ~3–8 `[SEAM]`, ~5–10 `[COPY]`, and 0–2 `[CANON]` findings.

---

## How to walk a flow (the per-PR method)

### Step 1 — Write the walkthrough doc first

Open the Phase 1 Sarah persona doc. Pick the flow you're auditing (e.g. *"Tuesday-morning flow"*, which lands in Dashboard, fans into Deal Workspace at the urgent deal, then into Future Autopsy, then into PoC/Advisor, then back to Dashboard).

Write Sarah's narrative through the flow. Be specific:
- What's she trying to accomplish?
- What's her starting state (signed in, has workspace, has deals, etc.)?
- What's the first surface she lands on?
- Click by click — what does her hand reach for, what does she see, what does she click?
- What does each destination land with (focused object, mode, breadcrumb)?

This narrative is the PR description. Code follows.

### Step 2 — Walk the flow live

Boot the dev server. Walk the actual click sequence as Sarah. Use the demo seed (`/demo-seed.html?demo=1&autoseed=mm`) so you have real data. Take screenshots at every step. Run the three tests at every step. Record findings.

### Step 3 — Tag every finding

`[STRUCTURAL]` / `[SEAM]` / `[COPY]` / `[CANON]`. Cluster by room.

### Step 4 — Make the changes

Per-room structural rework first. Then seam fixes. Then copy adjustments forced by the structural changes. Then canon updates.

### Step 5 — Re-walk

Walk the flow again with the changes applied. Run the three tests again. Anything that still fails goes back to step 4. Loop until all tests pass.

### Step 6 — Playwright walk

Write a Playwright test that scripts the click sequence end-to-end. Assertions: dominant CTA text, destination URL with continuity params, focused-object state in the destination DOM. This becomes the regression suite for the flow.

### Step 7 — Ship the PR

PR description = the walkthrough doc + findings list + Playwright walk reference. CI gates: typecheck + vitest + Vite build + Playwright smoke + the new Playwright walk.

---

## Supersession protocol

Per founder direction: Phase 2 PRs supersede prior copy audits to the extent structural change forces, while maintaining copy standards.

When a Phase 2 PR touches a room that was copy-audited in PR #83–#96:

- **The PR description names the superseded copy-audit PR** in its `## Supersedes` section.
- **Copy that wasn't touched by the structural rework stays as shipped from the copy audit.** No rewriting for rewriting's sake.
- **Copy that has to change because a button moved / a section reshaped / a CTA repurposed gets new copy that passes the Sarah-CRO rubric on top of the new structure.**
- **Canon session log records the supersession** so a future Claude session sees the path.

---

## What "done" looks like for a Phase 2 flow PR

- [ ] Walkthrough doc as PR description
- [ ] All findings tagged `[STRUCTURAL]` / `[SEAM]` / `[COPY]` / `[CANON]`
- [ ] All `[STRUCTURAL]` findings landed
- [ ] All `[SEAM]` findings landed (continuity params propagating, focused objects loaded)
- [ ] All `[COPY]` findings landed (passing Sarah-CRO rubric on the new structure)
- [ ] All `[CANON]` updates committed alongside
- [ ] Playwright walk script committed under `tests/e2e/`
- [ ] All three tests pass on re-walk
- [ ] Typecheck + vitest + Vite build + Playwright (smoke + new walk) green
- [ ] `## Supersedes` section names any prior copy-audit PRs whose copy was touched
- [ ] Canon session log entry drafted

---

## Living document

This rubric is the method. If a Phase 2 PR proves the rubric misses a class of finding — update the rubric before shipping the next PR. The rubric is what makes the audit measurable; a rubric that doesn't catch real problems is a rubric we revise.
