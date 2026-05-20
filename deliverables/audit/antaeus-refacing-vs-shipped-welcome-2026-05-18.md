# Welcome refacing audit — Program 6 / PR 3

**Audited:** 2026-05-18
**Winner:** `antaeus-welcome-launch-folio-triptych-2026-04-08.html` — variant "Launch Folio · Commission Lock"
**Auditor:** Claude (Program 6 / PR 3)

---

## Mind preservation — PASS

The shipped Welcome preserves canon §4.1 (Threshold family) end-to-end:

- ✅ "Move the user from setup into the first real operating move" — Hero + MilestoneLadder + ActionStack all point at the next operating move.
- ✅ Activation context awareness (companyName / role / category / completed-anchor count).
- ✅ One dominant action per surface (ActionStack's first card is visually emphasized).
- ✅ "Never show 'all done'" — when every milestone is live, the surface still surfaces what's next (continuing motion via ActionStack).
- ✅ `gtmos_activation_context` consumed by the engine on boot.
- ✅ Bright field per canon Part II §1.

No mind drift.

---

## Structural drift — partial; some forced by canon evolution

### A. Things the shipped room evolved past the wireframe (KEEP — don't revert)

| Launch Folio wireframe | Shipped (post-evolution) | Why the evolution is right |
|---|---|---|
| Single central artifact (stacked leaves with mandate grid on front leaf) | Two side-by-side artifacts (MilestoneLadder + ActionStack) | **Phase 4 / Room 16 (PR #33)** + **first-90-seconds audit** picked the side-by-side composition for higher information density + clearer action affordance. The stacked-leaves was cinematic but slower to scan. |
| Static headline "Open the live mandate." | Engine-driven dynamic headline (varies per activation state) | The dynamic headline gives Sarah a state-aware first read. The wireframe's static headline was a hint about voice, not a hardcoded string. |
| "What is missing" cell as the single locked cell forcing mechanic | MilestoneLadder's "next" state highlights the next anchor + ActionStack's "now" state highlights the dominant move | **Phase 4** picked the explicit milestone + ranked action picker over the implicit "one locked cell" — better discoverability for first-time users. |
| 3-leaf stack (Layer 01 / Layer 02 / Active mandate) | Hero progress bar (`{completed} / {total} anchors live`) + MilestoneLadder rows with done/next/pending state | Same semantic content (which layers are live, which are pending), shipped more readably. |

### B. Where the shipped room is still drifting from the wireframe (FIX in this PR)

| Launch Folio wireframe | Shipped | Severity |
|---|---|---|
| **2×2 mandate grid** (Where you are / What's missing / What unlocks next / Return behavior) — the file-like 4-cell panel that makes the variant feel like opening a commissioned file | Absent. MilestoneLadder + ActionStack carry similar info but read as a product onboarding flow, not an authored file. | 🟡 MED — the variant is *named* after this lock mechanic; without it the "Commission Lock" choice doesn't come through. |
| **Stamp affordance** (e.g. "Week 1 / Day 4") on the front leaf giving the file temporal presence | Absent. No temporal anchor. | 🟢 LOW — small detail, but it's what the wireframe used to mark "this isn't a generic welcome screen." |
| **"Open the live mandate." voice** on cold-start hero | Engine fallback copy ("Welcome to the workspace. Let's set up the first anchor.") | 🟡 MED — the wireframe's voice reads as authored, not as product onboarding. Shifting the cold-start copy toward that voice matches canon §1 emotional territory ("severe, calm under pressure, authored"). |
| **`folio-grid cell-lock` visual** — one cell visually different from the other three, reading as the unresolved gap | Absent (because the entire mandate grid is absent) | Same as the 2×2 grid above |

---

## Cross-cutting drift signals (per 2026-05-01 bootstrap)

- **Modal-overlay pattern** → Welcome has no overlays. ✅ N/A.
- **Sentence-shaped headlines** → Engine-driven headlines ARE sentence-shaped per state. ✅ JUSTIFIED.

Neither cross-cutting drift pattern applies.

---

## Fix scope — this PR

Bucket B drift gets these specific fixes:

1. **`LaunchFolio.tsx`** — new component rendering the 2×2 mandate panel between Hero and the 2-col grid. Four cells:
   - **Where you are** — synthesized from activation state + done milestones
   - **What is missing** (visually locked) — derived from the next missing milestone
   - **What unlocks next** — derived from the ActionStack's "now" item (the dominant move's downstream effect)
   - **Return behavior** — the next operating room the system will surface once the lock unlocks (Dashboard once the brief has rankable data; Signal Console once an account is researched)

2. **Stamp affordance on Hero** — small "Week N / Day N" badge derived from the workspace's first-anchor date (falls back to "Week 1 / Day 1" on cold start). Gives the surface temporal presence per canon §1 ("severe, authored, high-consequence").

3. **Cold-start headline tightening** — engine's empty-state copy refreshed to lean into the "Open the live mandate" voice: "Open the workspace. Then the first move shows up."

4. **Walk test** — Playwright walk asserting LaunchFolio renders 4 cells with the locked-cell variant on `cell-lock`, the stamp appears on the Hero, and the cold-start headline carries the mandate voice.

### What this PR does NOT change

- MilestoneLadder + ActionStack components (Phase 4 work, well-tested, more functional than the wireframe's stacked-leaves visual — canon-aligned evolution)
- Engine signal contract (WorkspaceCounts, ActivationModel, NextAction shapes unchanged)
- Cross-room handoff via continuity params
- Hero subtitle + chips + progress bar (these are post-audit additions that work)

---

## Acceptance — Sarah's first arrival at Welcome

1. Sarah lands on `/welcome/` after finishing onboarding.
2. Eye lands on the **Hero**: serif title, subtitle, chips showing her workspace context, "Week 1 / Day 1" stamp in the corner.
3. Below the Hero: the **LaunchFolio panel** reads like a commissioned file with 4 cells. Eye lands on the visually-locked "What is missing" cell — names the next anchor she needs to land. The panel feels authored, not auto-generated.
4. Below the LaunchFolio: the existing **MilestoneLadder + ActionStack** carry the operational moves with their now/next/ready ranking.
5. The room reads like *opening a live mandate*, not "filling out a setup checklist."
