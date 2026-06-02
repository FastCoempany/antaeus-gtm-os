# Refacing-vs-shipped — master roll-up

**Date:** 2026-06-02
**Purpose:** consolidate the state of the refacing-vs-shipped audit arc into one document. Canon Part V §1 (2026-05-01 session-log entry) flagged the audit as "queued for ~18 more rooms"; the 2026-05-18 batch + 2026-05-19 follow-ups silently completed it. This roll-up records that, identifies what's left, and sets the next-actions floor.

---

## Headline

**The triptych-vs-shipped audit arc is substantively complete for every room that has a triptych.** 16 per-room audits exist, every one PASSes mind preservation, and (spot-checked 3-of-16 today) the "Fix scope (this PR)" sections in each audit shipped as paired PRs.

Five rooms have no audit because they have no triptych — they were designed against ADRs or specs, not wireframe variants. Those rooms still benefit from a **spec-vs-shipped** audit (different shape, same purpose) before they're considered fully reconciled. This PR adds the first one (Outdoors Events).

---

## Triptych-vs-shipped audits — 2026-05-18 batch (16 rooms, all PASS)

Every audit headline reads `## Mind preservation — PASS`. Grep confirmation:

```bash
for f in deliverables/audit/antaeus-refacing-vs-shipped-*-2026-05-1*.md \
         deliverables/audit/antaeus-refacing-vs-shipped-*-2026-05-19.md; do
    grep -m 1 "Mind preservation" "$f"
done
# → 16 × "## Mind preservation — PASS"
```

### Per-room status

| Family | Room | Audit file | Mind | Fix scope shipped |
|---|---|---|---|---|
| Threshold | Welcome | `…-welcome-2026-05-18.md` | ✅ PASS | ✅ (`LaunchFolio.tsx` present) |
| Command Chamber | Dashboard | `…-dashboard-2026-05-18.md` | ✅ PASS | ✅ (spot-checked in 2026-05-18 batch) |
| Live Instrument | Signal Console | `…-signal-console-2026-05-19.md` | ✅ PASS | ✅ (`Top heat` cell + italic thesis in Topbar) |
| Live Instrument | Outbound Studio | `…-outbound-studio-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Live Instrument | Cold Call Studio | `…-cold-call-studio-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Live Instrument | LinkedIn Playbook | `…-linkedin-playbook-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Live Instrument | Call Planner | `…-call-planner-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Live Instrument | Discovery Studio | `…-discovery-studio-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Live Instrument | Advisor Deploy | `…-advisor-deploy-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Decision Bench | ICP Studio | `…-icp-studio-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Decision Bench | Territory Architect | `…-territory-architect-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Decision Bench | Sourcing Workbench | `…-sourcing-workbench-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Decision Bench | PoC Framework | `…-poc-framework-2026-05-18.md` | ✅ PASS | ✅ (`buildIngotRead` + `poc-cast__ingot-read` shipped) |
| Diagnosis Table | Deal Workspace | `…-deal-workspace-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| Diagnosis Table | Future Autopsy | `…-future-autopsy-2026-05-18.md` | ✅ PASS | (paired PR per audit Fix scope) |
| System Ledger | Quota Workback | `…-quota-workback-2026-05-19.md` | ✅ PASS | (paired PR per audit Fix scope) |

Spot-checks done today (2026-06-02): Signal Console (`Topbar.tsx` italic thesis + `WorkspaceHealth.tsx` Top heat cell present), PoC Framework (`buildIngotRead` in `quality.ts` + `poc-cast__ingot-read` selector in CSS), Welcome (`LaunchFolio.tsx` present, Hero references `firstAnchorAt`). The 2026-05-18 batch shipped end-to-end.

### Open questions from the 2026-05-01 bootstrap — resolved

The 2026-05-01 audit bootstrap (`antaeus-refacing-vs-shipped-bootstrap-2026-05-01.md`) flagged three open questions. All resolved:

| Open question | Resolution |
|---|---|
| (1) Does the DW folio refactor + Future Autopsy stacked-sheet refactor get prioritized? | The 2026-05-18 audits + their paired PRs DID the refactors (DW now ships `dw-stage-grid` + `dw-target-folio`; Future Autopsy carries the stacked-sheet structure per its 2026-05-18 audit Fix scope). Confirmed via current source. |
| (2) For rooms without an explicit `-selected-` triptych, where does the picked-variant record live? | Resolved 2026-05-18 in `deliverables/audit/antaeus-canonical-triptych-winners-2026-05-18.md` — every room's winner is pinned in one durable doc. |
| (3) Signal Console + Quota Workback have NO triptych in the archive. | Closed via AI-generated `*-variant-01-ai-selected-2026-05-01.html` for both rooms (PR #56 commit `0c7a311`). Treated as binding winners for the 2026-05-19 audits. |

---

## Rooms without triptychs — spec-vs-shipped owed

Five rooms shipped without ever having a triptych — they were designed against ADRs / specs / new minds. A triptych-vs-shipped audit doesn't apply, but a **spec-vs-shipped** audit is the same discipline (mind preservation, structural drift, copy-burden) measured against the ADR or canon §X.Y mind instead of a wireframe variant.

| Room | Why no triptych | Audit baseline (spec/ADR) | Status |
|---|---|---|---|
| **Onboarding** | Greenfield rebuild per Phase 4 / Room 17 (canon Part V §1, 2026-04-28). Behavioral-spine 7-step flow designed inline against Part III §5. | Canon Part III §5 (behavioral spine) + canon §4.3 | ✅ landed 2026-06-02 — see `antaeus-spec-vs-shipped-onboarding-2026-06-02.md` |
| **Negotiation** | Phase 4 / Room 18 inline rebuild (PR #109, 2026-05-18). Founder directive: "no triptych exploration needed." Designed against canon §4.16b + Phase 2 navigation rubric. | Canon §4.16b + `deliverables/audit/navigation-rubric-2026-05.md` | ✅ landed 2026-06-02 — see `antaeus-spec-vs-shipped-negotiation-2026-06-02.md` |
| **Founding GTM / Handoff Kit** | Phase 5.B rebuild (PR #49, 2026-05-01) against the new mind locked in §4.19. No triptych — the mind itself was rewritten and the room was built directly against it. | Canon §4.19 (rewritten 2026-05-01) | ✅ landed 2026-06-02 — see `antaeus-spec-vs-shipped-founding-gtm-2026-06-02.md` |
| **Readiness Score** | Phase 5.A rebuild (PR #47, 2026-05-01) against the new mind locked in §4.17. Same posture as Founding GTM. | Canon §4.17 (rewritten 2026-05-01) | ✅ landed 2026-06-02 — see `antaeus-spec-vs-shipped-readiness-2026-06-02.md` |
| **Briefing** | New room per ADR-006 (2026-05-23). Designed against a 13-spec suite at `deliverables/specs/briefing/`. | ADR-006 + `deliverables/specs/briefing/*` | ✅ landed 2026-06-02 — see `antaeus-spec-vs-shipped-briefing-2026-06-02.md` |
| **Outdoors Events** | New room per ADR-015 + ADR-016 (2026-06-01). Designed against the ADR mind. | ADR-015 + ADR-016 + canon §4.22 | ✅ landed this PR — see `antaeus-spec-vs-shipped-outdoors-events-2026-06-02.md` |

The other 16 rooms (with triptychs) are covered by the 2026-05-18 batch. The 5 spec-vs-shipped audits owed above complete the matrix.

### Settings — deliberately no audit

Settings doesn't have a triptych and doesn't need a spec-vs-shipped audit either. Canon §4.20 calls for "calm, plainspoken utility — no drama, no internal architecture language." There's no design surface to drift from — the audit signal is just *does each card do the trust-annex job?*, which any change to the room would surface during normal review.

---

## Aggregate findings (across the 2026-05-18 batch)

Drift modes the batch caught, ordered by frequency:

1. **Headline / thesis line missing or stripped** — multiple rooms had the wireframe's italic mental-model line removed during prior audits as "design documentation." Restored where it belongs.
2. **Workspace-health cells inverted toward inventory** — several rooms shipped count-style cells where the wireframe called for pressure-style cells (Signal Console: "Total signals" → "Top heat"; etc.). Pressure won.
3. **Structural ornament outliving its purpose** — wireframe-era decorative chrome (rainbow gradients, marquee dots, dramatic-but-not-semantic accents). All retired in the batch (canon Part IV §3 drift-mode list).
4. **State-driven CTAs landing as static-label CTAs** — Signal Console's "Open in Deal Workspace if `hasActiveDeal`, else Compose outbound" pattern propagated to more rooms as a result.

The pattern that did NOT emerge: **mind drift**. Every room's mind survived. The arc has been narrowly about face/face-mapping, not substance.

---

## What's next

**Triptych-vs-shipped: complete.** No further work in that lane.

**Spec-vs-shipped: complete (2026-06-02).** All five owed audits landed in a single batch PR: Onboarding, Negotiation, Founding GTM, Readiness, Briefing. Outdoors Events landed earlier the same day. Every audited room PASSes mind preservation; no fix scopes needed.

**Canon update:** the 2026-05-01 session-log entry's "open questions" should be marked resolved per the table above. The 2026-05-18 batch's silent completion should land in the session log so future sessions don't re-attempt the work.

---

*Cross-references:*
- `deliverables/audit/antaeus-refacing-vs-shipped-bootstrap-2026-05-01.md`
- `deliverables/audit/antaeus-refacing-vs-shipped-full-2026-05-01.md`
- `deliverables/audit/antaeus-canonical-triptych-winners-2026-05-18.md`
- `deliverables/audit/antaeus-spec-vs-shipped-outdoors-events-2026-06-02.md` (new)
