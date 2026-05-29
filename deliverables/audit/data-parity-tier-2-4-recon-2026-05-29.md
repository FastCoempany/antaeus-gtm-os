# Data parity — Tier 2-4 reconnaissance

**Date:** 2026-05-29
**Purpose:** Establish the TRUE cloud-vs-localStorage state of every Tier 2-4
candidate room BEFORE committing to retrofit PRs — because twice this
session the canon's "pending retrofit" framing turned out to be
largely-already-done (Tier 1, corrected in #208). This recon applies the
lesson canon Part V §1 now carries: *verify from git history + the flag
registry + live code, not the time-sensitive table.*
**Method:** per-room scan of `cloud-persistence.ts` presence, boot path,
target tables, localStorage role + git history of the cloud-sync rollout.

---

## Headline

**The canon Checkpoint 3 estimate ("14 rooms × 5 steps ≈ 70 PRs") is
dramatically inflated.** A "Cloud sync Batch 1-4" effort (#38–#42, plus
Negotiation #63) around **2026-05-01 — before ADR-005 even existed —**
already gave the data-owning Tier 2-4 rooms a `cloud-persistence.ts`
layer that boots cloud, syncs to **proper per-noun tables** (not generic
catch-alls), and treats localStorage as an explicit **offline fallback**,
not the source of truth.

In other words: the Tier 2-4 data rooms are **already substantially
cloud-resident.** They are not "still on localStorage." The genuine
remaining ADR-005 work is small and low-value (Step-5-style cleanup:
dropping the offline-fallback once cloud is trusted), and arguably should
not be done at all right now.

---

## Per-room true state

### Data-owning rooms — ALREADY cloud-resident (11)

Each has `lib/cloud-persistence.ts`, boots cloud in `main.tsx`, and uses
localStorage as an offline-fallback seed. Confirmed target tables on spot
-check: ICP Studio → `icps`; PoC Framework → `proofs` (proper per-noun
tables, exactly what ADR-005 wants).

| Room | Cloud layer | localStorage role | Cloud-sync origin |
|---|---|---|---|
| advisor-deploy | ✅ cloud-persistence.ts | offline fallback | #39 Batch 1 + #91 |
| icp-studio | ✅ → `icps` | offline fallback | #39 Batch 1 |
| poc-framework | ✅ → `proofs` | offline fallback | #39 Batch 1 |
| call-planner | ✅ | offline fallback | #40 Batch 2 (motion) |
| cold-call-studio | ✅ | offline fallback | #40 Batch 2 (motion) |
| linkedin-playbook | ✅ | offline fallback | #40 Batch 2 (motion) |
| territory-architect | ✅ | offline fallback | #41 Batch 3 |
| sourcing-workbench | ✅ | offline fallback | #41 Batch 3 |
| future-autopsy | ✅ | offline fallback | #41 Batch 3 |
| quota-workback | ✅ | offline fallback | #42 Batch 4 |
| negotiation | ✅ | offline fallback | #63 |

None reference ADR-005 parity flags in production code (verified) —
they're the **pre-ADR-005 informal-mirror pattern**, not the formal
flag-gated 5-step lifecycle Signal Console got (#142/#147/#149). But the
informal pattern already achieves the substantive goal: cloud-canonical
reads + writes to proper tables.

### Read / synthesis / threshold / trust rooms — little or no own data (6)

| Room | State | Why minimal |
|---|---|---|
| dashboard | reads other rooms' snapshots | owns no persistent data of its own; the 7 localStorage refs are reads of other rooms' keys + its own mode pref |
| discovery-studio | already cloud (Phase 3 Supabase persistence) | 0 localStorage files |
| founding-gtm | reads 10 cloud-mirrored keys + publishes health | synthesis room; minimal own state |
| onboarding | writes seed data across stores | threshold room; seeds other rooms then exits |
| settings | **deliberately local** | canon §4.20 + Phase 4 Room 15 note: Settings is a LOCAL trust annex; cloud-sync intentionally not migrated |
| welcome | reads counts | threshold room; no own data |

---

## What this means for Checkpoint 3

The ADR-005 §"Four resolutions" point (4) said the #43/#44 cloud-sync
gap-closers would be redone via "a fresh complete dual-write pass per
ADR-005 lifecycle." That resolution was made **before anyone verified how
complete the #38–#42/#63 cloud-sync already was.** Now that we have:

- The existing mirrors already use proper per-noun tables (icps, proofs,
  sequences, discovery_call_logs, studio_artifacts, pipeline_settings).
- They already boot cloud-canonical with localStorage as offline fallback.
- They already work in production (the 2026-05-01 cloud-sync shipped).

…a "fresh complete dual-write pass" would largely **re-implement what
exists.** The only genuinely-new ADR-005 deliverables for these rooms are:

1. **Formal flag plumbing** (`<room>_data_parity_write/read`) — but these
   rooms already read cloud-canonical, so the flags would gate nothing
   meaningful.
2. **Step-5 cleanup** — drop the localStorage offline-fallback. But the
   fallback is a *resilience feature* (room still renders offline / on a
   cold cache), not a liability. Dropping it is arguably a regression.
3. **Realtime subscriptions** where missing — the one genuinely-additive
   improvement, but only valuable for rooms a user opens on two devices
   at once, which is rare for most of these.

**Net: the remaining Tier 2-4 retrofit work is small, low-value, and not
urgent.** It is not ~70 PRs. The substrate goal (rooms cloud-resident so
generators can read real data) is **already met** for the data-owning
rooms.

---

## Recommendation

**Do not grind a 70-PR Tier 2-4 retrofit.** The premise ("14 rooms still
on localStorage") is inaccurate; the rooms are cloud-resident already.

Instead, one of:

1. **Re-scope Checkpoint 3** in canon from "~70 PRs greenfield retrofit"
   to "verify-and-trust the existing cloud-sync + optional realtime
   additions," which is a handful of PRs at most — and only if a concrete
   need (a generator that reads one of these rooms) actually arises.
2. **Spend the effort on higher-value work** — beta hygiene (the product
   isn't in beta) or the workspace-scope observation decision (which
   determines whether any of this substrate gets used by a generator at
   all).

The single most useful follow-up is a canon correction: update the
Checkpoint 3 row + the ADR-005 §resolution-(4) assumption to reflect that
the #38–#42/#63 cloud-sync already did the substrate work. That stops a
future session from grinding the redundant 70 PRs.

---

## Caveat on confidence

This recon is a structural scan (file presence, boot path, target tables,
git history) — not a per-room behavioral verification that each room's
cloud read/write round-trips correctly in production. If Checkpoint 3 is
re-scoped to "verify-and-trust," that per-room behavioral check (open the
room on a fresh browser, confirm it loads from cloud with no localStorage
seed) is the actual work — far lighter than a 5-step rebuild, and it's the
honest thing to confirm before deleting any offline fallback.
