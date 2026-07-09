# Onboarding — wire-to-production adversarial passes

**Room:** Onboarding (Wave A / 1) · surface `src/onboarding/seeding/` · flipped to production default in `src/onboarding/main.tsx` (kill-switch `room_onboarding_seeding_off`).
**Settled design:** `deliverables/mockups/onboarding-seeding-flow-2026-07-07.html` · **Capability map:** `deliverables/room-capability-maps/onboarding-capability-map-2026-07-07.html`
**Reviewer:** fresh adversarial subagent (did not build the room) + author verification. Date 2026-07-07.

## Result: GO (after fixes)

The seeding flow was substantially built + tested before this wire-up. The adversarial pass returned **NO-GO** with 2 blocking + 4 fast-follow findings; all real findings were fixed and re-verified. Final: **41/41 seeding tests green, typecheck clean, voice gate green, boots clean, renders faithful to the mockup.**

### Pass 1 — Mind & Capability Fidelity
- Verified present: all 7 arc steps (door→icp→accounts→wake→deals→quota→landing); `DEAL_FLOOR = 10` real; champion/who-signs/where-stuck captured + written; the citable evidence margin cites real external sources; the landing WRITES every mapped living-room shape (`gtmos_icp_analytics`, `gtmos_sc_v4` + `gtmos_signal_room_health`, `gtmos_deal_workspaces`, `gtmos_qw_inputs` + `gtmos_outbound_seed`, `gtmos_activation_context` + `gtmos_onboarding`) + cloud mirror — output *becomes* the live rooms.
- **FIXED [P2 flow-in]** — the activation write hardcoded `company: null`, clobbering company/role/category from signup (capability-map §5 flow-in). Now merges + preserves them (`seed-writer.ts`; regression test added).
- Flagged to founder (design, not silently changed per Part IV §4): the settled 7-step seeding flow collects no explicit *product category* step, so a fresh signup with no category falls to the downstream `cxai` default. Preserving incoming category is now correct; whether to add a category capture to the locked flow is a founder call.

### Pass 2 — Behavior, Composition & Voice
- **FIXED [P1 §13]** — `LandingStep.tsx` shipped the hard-banned word **"proof"** on the landing screen ("ask for your proof…"). Reworded to "ask about your pilots…".
- Systemic note (flagged, not globally fixed): the voice gate's `BANNED_PRODUCT_JARGON` does **not** include the §13 foundry/proof list (`proof`, `cast`, `mold`, `forge`, `ingot`, `readout`, `kill`, `vitals`, `sanity-check`, `deploy`, `rolodex`, naked `dimension`), so it can't catch §13 leaks. Tightening it would fail CI on the still-shipped DS surfaces (which predate the §13 scrub); deferred until the DS surfaces retire. Each v4 surface is scanned for §13 cleanliness at build time instead.
- Seven behavioral rules pass (one dominant move per step, object-before-controls, state-before-explanation, honest "N of 10" + "under ten it stays thin", no "all done"); every operator string through `t()`.

### Pass 3 — Live-Runtime Adversarial
- **FIXED [P2 data-integrity]** — `writeSeedingDraft` was not idempotent; a re-run (exposed via Settings "re-run onboarding") appended duplicate deals + a duplicate ICP. Now dedupes deals on a stable content signature (account+value+stage) and the ICP by statement (regression test added).
- **FIXED [P3 floor bypass]** — the deal step could be advanced with **zero** deals (the "heavy middle" fully skippable). Now requires ≥1 deal; the advance control is disabled + relabeled at n=0.
- **FIXED [P3 revisit bug]** — the accounts textarea re-seeded from the draft on every empty render, so it couldn't be cleared after advancing. Now a one-time seed guard; the operator owns the box after mount.
- No stranding / no data loss: landing persist is guarded + synchronous; cloud mirror is fire-and-forget with catch; junk account entries rejected before advance; back-nav + draft-resume verified.

## Ship state
Boots clean (0 pageerrors), renders faithful to the settled mockup (honest doorway + orange-ruled compact + 7-pip rail + persistent blue evidence margin). Flipped to default with `room_onboarding_seeding_off` kill-switch (one Posthog toggle reverts to the DS surface, no redeploy).
