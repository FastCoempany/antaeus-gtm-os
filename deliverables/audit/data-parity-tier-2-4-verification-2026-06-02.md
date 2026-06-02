# Data parity — Tier 2-4 verification (2026-06-02)

**Date:** 2026-06-02
**Purpose:** Re-verify the 2026-05-29 recon's finding ("Tier 2-4 rooms are already cloud-resident, the ~70 PR estimate is inflated") four days later, after the Outdoors Events room landed and a session asked to "run D — data parity retrofit." Establish ground truth before any retrofit grind starts.
**Method:** programmatic spot-check via `ls`/`grep` of every data-owning room. Confirms what `cloud-persistence.ts` files exist, what realtime subscriptions are wired, and how many places in production code actually gate on the formal ADR-005 parity flags.

---

## Headline

**The recon was right. The substrate goal is met.** Every data-owning Tier 1-4 room is cloud-resident with realtime subscriptions wired. The formal ADR-005 flag-gated lifecycle is **unreferenced in production code** — the parity flags exist in `src/lib/data-parity-flags.ts` as an inventory only.

**Net: D ("data parity retrofit") has zero remaining technical work.** The canon's Checkpoint 3 row (~70 PRs pending) is doctrine-stale. This PR updates the canon to reflect the truth; no retrofit is needed.

---

## Per-room true state, 2026-06-02

### Cloud-resident data-owning rooms (15 of 15)

| Room | Cloud module | Realtime | Notes |
|---|---|---|---|
| signal-console | `lib/cloud-persistence.ts` | ✅ (4 subscribe calls) | Tier 1; retrofit complete (#142/#147/#149) |
| deal-workspace | `lib/persistence.ts` | ✅ (`RealtimeChannel` + 4 `data.*` calls) | Built cloud-native at Phase 4 / Room 1 |
| outbound-studio | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | Tier 1; cloud-resident |
| discovery-studio | `lib/persistence.ts` | ✅ (signal-effects pattern, `data.*` calls) | Built cloud-native at Phase 3 |
| poc-framework | `lib/cloud-persistence.ts` → `proofs` | ✅ (2 subscribe calls) | #39 Batch 1 |
| call-planner | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | #40 Batch 2 (motion) |
| cold-call-studio | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | #40 Batch 2 (motion) |
| linkedin-playbook | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | #40 Batch 2 (motion) |
| advisor-deploy | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | #39 Batch 1 + #91 |
| icp-studio | `lib/cloud-persistence.ts` → `icps` | ✅ (2 subscribe calls) | #39 Batch 1 |
| territory-architect | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | #41 Batch 3 |
| sourcing-workbench | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | #41 Batch 3 |
| future-autopsy | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | #41 Batch 3 |
| quota-workback | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | #42 Batch 4 |
| negotiation | `lib/cloud-persistence.ts` | ✅ (2 subscribe calls) | #63 |

### Synthesis / threshold / trust rooms — no own data (6)

`dashboard`, `founding-gtm`, `onboarding`, `settings`, `welcome` — read other rooms' snapshots or threshold-only state. None require retrofit.

### Verification commands (reproducible)

```bash
# Cloud module presence — 13 cold-call-style rooms
ls src/*/lib/cloud-persistence.ts | wc -l       # → 13

# Plus DW + Discovery (built cloud-native via lib/persistence.ts)
ls src/deal-workspace/lib/persistence.ts \
   src/discovery-studio/lib/persistence.ts      # → 2

# Realtime subscriptions wired
for f in src/*/lib/cloud-persistence.ts; do
    grep -c "subscribe(" "$f"
done                                            # → all ≥ 2

# Formal ADR-005 flag callers in production code
grep -rn "isRoomParityWriteEnabled\|isRoomParityReadEnabled" src/ \
   | grep -v ".test.\|data-parity-flags"        # → empty
```

---

## What the formal ADR-005 lifecycle would add — and why we're not grinding it

The 5-step lifecycle (audit → schema → dual-write → flip-read → drop-legacy) was designed for rooms STILL ON localStorage. None of the data-owning rooms fit that description today. Running the lifecycle anyway gives us:

1. **Formal flag plumbing** (`<room>_data_parity_write/read`). But the room already reads cloud-canonical, so flags would gate nothing meaningful. Pure ceremony.

2. **Step-5 cleanup** (drop the offline localStorage fallback). The fallback is a *resilience feature* — the room still renders on a cold cache or offline. Dropping it is a regression, not progress.

3. **Realtime subscriptions where missing.** Already present everywhere (15/15).

**Net technical work: zero.** This is exactly what the recon predicted.

---

## What changes in canon

Per Part IV §5 ("does this earn its place"): the Checkpoint 3 row in Part V §1 currently says "~70 PRs pending" — that's doctrine-stale and misleads future sessions. Updated to reflect:

- Substantive substrate goal **achieved** (15/15 rooms cloud-resident with realtime)
- Formal flag-gated lifecycle **deferred indefinitely** (zero callers; no value-add)
- `data_layer_parity_complete` master flag stays off only because the 2026-04-24 migration blob is still in `migrated_v1` table as a safety net; flipping it on would intentionally error any code path still reading the blob, and we have no production code paths that do. Founder can flip when ready (= never, harmlessly).

---

## Recommendation

**Do not start a Tier 2-4 retrofit PR series.** The premise is incorrect. The technical work is done.

The genuinely-open next moves (per canon Part V §1 + ADR-016 + the session log):

1. **A — Phase F (bounded self-modification)** — the largest unbuilt phase in the orchestration roadmap. Doctrine needed first; requires founder approval per Part IV §4 mind-correction protocol.
2. **B — Refacing-vs-shipped audit** — finish the audit of the ~18 remaining rooms (only Deal Workspace + Future Autopsy were audited on 2026-05-01). Pure audit work; produces docs, no code.
3. **C — Pre-beta hygiene** — partially in flight (cloud-data export, PR #244). Other items: data-stored-locally notice clarification, any auth hardening that surfaced during the Phase 5 push.

`A` is the biggest leverage; `B` is the most calendar-bounded; `C` is closest to merge.

---

*Supersedes/extends `deliverables/audit/data-parity-tier-2-4-recon-2026-05-29.md`. The 2026-05-29 recon's findings hold verbatim; this doc adds today's verification + the unused-flag finding.*
