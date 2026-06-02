# Founding GTM / Handoff Kit spec-vs-shipped audit

**Audited:** 2026-06-02
**Baseline:** Canon §4.19 (Founding GTM / Handoff Kit — rewritten 2026-05-01 with Phase 5.B rebuild as gate)
**Auditor:** Claude (B-arc completion — spec-vs-shipped batch)

> **Note on baseline.** Founding GTM was rebuilt as a greenfield room in Phase 5.B (PR #49, 2026-05-01) against the rewritten §4.19 mind. No triptych — the rebuild was scoped against the new mind directly. This audit compares the shipped Preact room against that rewritten mind.

---

## Mind preservation — PASS

Canon §4.19 (rewritten 2026-05-01) preserved end-to-end:

- ✅ **Living onboarding surface, not export.** The room IS the inheritance vehicle; no "Download zip" button anywhere. Cloud sync makes the workspace itself durable. Components: `Topbar` (verdict + section-readiness count), `SectionFrame` (7 authored sections), `SharePanel` (read-mode share-link mechanic), `HandoffStrip` (cross-room routes), `CeremonyOverlay` (the §4.19 ceremony moment).
- ✅ **Seven authored sections** per §4.19, not bullet aggregation:
  1. Who hits, who misses, why (`section-1.ts` cross-references ICP × closed-won pattern)
  2. The rails that worked (`section-2.ts` reads `gtmos_outbound_touches` + cross-refs to converted meetings)
  3. The questions that earned the next meeting (`section-3.ts` reads Discovery Studio's `advancedCalls` + segment ledger)
  4. Where deals are won + where they leak (`section-4.ts` stage-by-stage conversion + advisor-deploy moments)
  5. The losses we paid for (`section-5.ts` Future Autopsy autopsies)
  6. Why we win (`section-6.ts` closed-won shared-traits read)
  7. Day-one operating rhythm (`section-7.ts` weekly cadence from quota + cycle length)
- ✅ **Surprise callouts** per §4.19 — every section has its `surprise` field rendered as a cross-room read no single room could surface alone (e.g. Section 1's "your stated ICP doesn't match your actual close pattern" callout).
- ✅ **Section-readiness publisher** feeds Readiness's `proof` dimension — see `lib/health-publisher.ts:publishHealth()` writing `gtmos_founding_gtm_health` that the Readiness aggregator reads. This is what makes "Hire-ready, repeatable" achievable (gate requires sections ≥ 5/7 ready).
- ✅ **Ceremony moment** subscriber fires on Readiness verdict upward transition into Inheritable-with-guardrails. `CeremonyOverlay.tsx` listens for the cross-tab event; animation + serif headline + one-time share-link CTA per §4.19's set-piece directive.

No mind drift.

---

## Structural drift — minor

### A. Things shipped that drift from the spec (FIX in this PR)

None caught.

### B. Explicitly deferred

| Item | Why deferred | Trigger to unblock |
|---|---|---|
| Section 4's "leaky stage callout with advisor-coverage gap" cross-reference | The shipped section has the leaky-stage logic but the advisor-gap callout is data-dependent (needs both Advisor Deploy + Deal Workspace data populated); empty workspaces show the section without the surprise | Operator has > 5 advisor deployments AND ≥ 3 closed-lost deals |
| Section 7's "what the founder tried that didn't stick" abandoned-habit callout | Requires tracking habits the founder configured + later disabled; no signal source today | Phase F observation generators surface enough habit data to feed this |
| Per-section "needs more data" inline copy | Empty sections currently show their `surprise` field; could add explicit "this section will populate after X" guidance | Operators ask why a section is empty |

---

## Cross-room compounding — PASS

Per canon §4.19, Founding GTM reads from every cloud-mirrored room. Verified via `lib/sources.ts` and the per-section authoring modules:

| Section | Cross-room reads (verified) |
|---|---|
| 1 | ICP Studio + Deal Workspace closed-deal evidence |
| 2 | Outbound Studio touches + LinkedIn actions + Cold Call log |
| 3 | Discovery Studio segment-jump data + `advancedCalls` |
| 4 | Advisor Deploy + Deal Workspace stage transitions |
| 5 | Future Autopsy autopsies |
| 6 | Closed-won Deal Workspace deals + their shared traits |
| 7 | Quota Workback inputs + Deal Workspace pipeline |

The section-readiness count drives the Readiness gate. Confirmed via spot-check on `lib/health-publisher.ts`.

---

## Voice — PASS

Sections read as authored opinion, not aggregation. Section 1's opening, for example, isn't "Here are your closed-won deals:" — it's a sentence like "When you closed Acme last quarter, the difference wasn't the demo — it was that Tasha had already lost a vendor pitch three months earlier." (Authored from the actual data, but in paragraph voice.)

No banned vocab. No invented compound nouns. The serif headline + plain-prose pattern matches Threshold + System Ledger composition families.

---

## Fix scope — none

Doc-only audit.

---

## Acceptance walk

1. `/founding-gtm/` renders Topbar + 7 SectionFrames + HandoffStrip + (when ceremony fires) CeremonyOverlay.
2. Topbar shows section-readiness count (e.g. "5 of 7 sections ready").
3. Each section, when ready, renders authored paragraph + a `surprise` cross-room callout.
4. SharePanel exposes the read-mode share-link mechanic (workspace access for external email).
5. Section-readiness count appears as input to the Readiness drawer (verified in canon §6 compounding).
6. Readiness verdict upward transition into Inheritable-with-guardrails triggers the ceremony overlay once.

All hold against shipped state per spot-checks.
