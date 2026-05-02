# Post-beta polish backlog

Date: 2026-05-02
Status: open
Author: Claude session, established per ADR-003 §9 Q6

---

## Purpose

Items discovered during the ADR-003 arc that don't block beta launch
but are worth carrying forward. Created so they don't fall out of
scope after Phase 6 closes.

## Origin

Most items below are sourced from:
- The Phase 1 audit per-room punch lists (`deliverables/audit/antaeus-refacing-vs-shipped-full-2026-05-01.md`)
- The Phase 6 visual review rubric grades (`deliverables/visual-review/antaeus-phase-6-rubric-grades-2026-05-02.md`)
- ADR-003 §5.5 hygiene items deferred to follow-ups

---

## Per-room polish items

### Welcome
- Slim `wel-actions__list` to 1 primary + 3 ghost (currently too many equal-weight CTAs)
- Replace progress-bar in hero with the 4-anchor ladder (ICP / Signal / Deal / Motion) per AI-picked triptych

### Onboarding
- Completion screen: reduce 4 destination CTAs to 1 primary + 3 ghost per "one dominant move" rule

### Signal Console
- Hot-account cards: state-driven single primary CTA (currently 3 co-equal CTAs per card)
- Workspace-health pulse: confirm reads as a short pulse, not summary essay

### Outbound Studio
- Verify generated send-line is the visual hero of the output zone (not a small body of text)
- No-ask mode toggle: visibly change rendered output zone (not just remove CTA paragraph silently)

### Deal Workspace
- Replace `DealHealthModal` full-screen overlay with in-folio expand for the 9-field health form (the modal is a residual pattern; folio detail is the right home)

### Quota Workback
- Coverage-band responsive treatment at narrow viewports (currently truncates)

### LinkedIn Playbook
- Verify cue-rail visual hierarchy reads as a ladder (1 → 5), not 5 equal options

### PoC Framework
- Verify weakest-mold callout is a dominant visual signal, not a small chip

### Future Autopsy
- Wire the stage-strip refinement (`stage-strip-selected-revision` triptych) — control-strip across the top of the pinned-case panel for stage navigation on the same pinned deal

### Discovery Studio
- Spot-check 9 framework runtimes for support-dossier content completeness (canon line 989 says all 9 have authored content; worth confirming on render)

### Settings
- Verify 5-card layout doesn't read as cluttered (Trust Annex prefers low plane count)

---

## Pre-beta hygiene items deferred (per ADR-003 §5.5)

### Unsaved-changes guard wire-in (PR #59 shipped the library; rooms still owed)
- Founding GTM share-link composer
- Deal Workspace `DealHealthModal` save flow
- Call Planner witness-form draft
- Negotiation draft (rebase onto post-PR-#59 main)

### Auth failure user-facing errors
- Login failed (wrong password) — Trust Annex voice
- OAuth callback failed
- Session expired
- Network / Supabase unavailable

Auth pages currently surface inline errors but not in the calm
plainspoken Trust Annex voice the canon Part II §4.7 calls for.

### Export completeness
- Settings already has `exportBackup()` JSON ("Export All Data") ✅
- Deal Workspace CSV export — owed
- Readiness export (verdict + dimension scores + history) — owed
- Command Center export (Dashboard's ranked-objects snapshot) — owed

### Trust signals
- Settings already has CloudSync card replacing "data stored locally" ✅
- "Delete my data" action that wipes workspace cloud rows — owed (Settings already has `clearWorkspace` for local; cloud-side delete owed)

---

## Cross-room follow-ups

### Cloud sync for Negotiation
PR #57 shipped Negotiation with localStorage persistence. Mirror to
Supabase `studio_artifacts` row with `kind='negotiation'` per the
template established by other rooms in PR #41 (Territory + Sourcing +
Future Autopsy). Estimate: 1 session.

### `js/` orphan cleanup
Several `js/<room>-*.js` files now orphaned (only consumed by the
retired legacy `/app/<room>/` HTMLs). Some still consumed by auth +
commerce flows. Worth a focused PR that greps for actual `<script
src="/js/*.js">` references and deletes the unused.

### Static pages bright-restyle
Auth pages (login / signup / forgot / reset) currently use legacy
`/css/app.css`. Bright-direction restyle would bring them in line
with the rest of the system. Not blocking; pages function + read
correctly.

### `coming-soon.html` → real landing
Currently a single-line headline ("Your first go-to-market hire
just became more predictable.") on a dark gradient. Real marketing
landing is post-beta work.

### `marketing-landing-preview.html`
Currently a preview file. Decide pre-launch whether it becomes
the production landing or stays archived.

---

## Process improvements

### Stacked-PR squash-merge pitfall guardrail
PR #48 (Founding GTM) was orphaned because its base was another open
PR's head branch. Recovery via PR #49. The lesson is recorded in
ADR-003 §7.6, but tooling could enforce it: a CI check that fails
PRs whose base is not `main`. Estimate: half a session.

### Render-screenshot capture in CI
Phase 6's visual review was AI-graded text-based. A founder
render-pass against actual screenshots would be the highest-fidelity
final gate. Tooling exists in `tools/qa/capture-demo-room.js`;
running it for all 21 rooms across primary states is automatable.

---

## How to use this backlog

This is not a planning artifact — it's a catch-list. Items here
can be:
- Picked up individually as small focused PRs
- Bundled into a "post-beta polish" sprint
- Promoted to a new ADR if they grow scope-wise
- Closed without action if they become irrelevant

Per canon Part V §1, this file gets updated as items land or new
ones surface. Stale items >90 days should be reviewed for
relevance.

---

Ref: deliverables/adr/adr-003-refacing-completion-and-pre-beta-2026-05-01.md §9 Q6
Ref: deliverables/audit/antaeus-refacing-vs-shipped-full-2026-05-01.md
Ref: deliverables/visual-review/antaeus-phase-6-rubric-grades-2026-05-02.md
