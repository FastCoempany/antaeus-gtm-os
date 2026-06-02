# Onboarding spec-vs-shipped audit

**Audited:** 2026-06-02
**Baseline:** Canon Part III §5 (behavioral spine — Implementation Intentions / Endowed Progress / Commitment & Consistency / Cognitive Load) + canon §4.3 (Onboarding — Threshold family)
**Auditor:** Claude (B-arc completion — spec-vs-shipped batch)

> **Note on baseline.** Onboarding is a greenfield rebuild (Phase 4 / Room 17, 2026-04-28). It has no triptych — the room was designed inline against the behavioral-spine doctrine. This audit compares the shipped Preact room against that doctrine.

---

## Mind preservation — PASS

Canon §4.3 (Onboarding) preserved end-to-end:

- ✅ **Activation as side-effect, not form.** Onboarding produces real Brief items rather than collecting form data into a void. `src/onboarding/lib/seed.ts:seedFromDraft()` writes activation context + product category + first ICP + first account + quota seed across the legacy localStorage stores; the founder's Dashboard lands populated after completion.
- ✅ **Behavioral spine — Endowed Progress.** Step 1 of 7 = 14% on arrival; the progress rail (`ProgressRail.tsx`) shows position in the ladder; each step advances the rail visibly.
- ✅ **Commitment + Consistency** — escalating micro-commitments per canon Part III §5. Step 1 is genuinely low-friction (intro + name), Step 5 (first ICP) is higher friction, by which point the operator has 4 cumulative commitments behind them. The first ask is NOT company name (which the Feb research showed cuts conversion 50%).
- ✅ **Implementation Intentions.** Each step has contextual next-action copy; the completion screen offers 4 specific destination CTAs (Dashboard / Signal Console / ICP Studio / Welcome) tied to the operator's role + state.
- ✅ **One dominant move per surface** per Part III §3 rule 1. Every step has a single "Next" primary action.

No mind drift.

---

## Structural drift — minor, all in keep-or-defer bucket

### A. Things shipped that drift from the spec (FIX in this PR)

None caught. The seven steps map cleanly to the behavioral-spine prescription:

| Step | Behavioral lever | Implementation |
|---|---|---|
| 1 Intro | Endowed Progress kicker | ProgressRail starts at 14% |
| 2 Company name | First low-friction commitment | Commitment + Consistency anchor |
| 3 Role | Personalization input | drives downstream copy in destination rooms |
| 4 Product category | Drives ICP framework + Discovery framework | Workspace-level state |
| 5 First ICP | First substantive content commitment | Seeds ICP Studio with a real row |
| 6 First account | Second content commitment | Seeds Signal Console |
| 7 Quota target | Third content commitment | Seeds Quota Workback |
| Completion | Variable Insight + 4-destination handoff | Brief items visible in the Dashboard |

### B. Explicitly deferred

| Item | Why deferred | Trigger to unblock |
|---|---|---|
| Cold-start narrative variant (no real workspace data) | The completion screen handles the cold case by showing the 4-destination CTAs; an explicit "your Brief will populate as you work" narrative could land later | Operators report confusion about the empty Dashboard post-onboarding |
| Re-entry threshold (the canon's "Welcome" room handles re-entry) | Welcome owns re-entry per canon §4.1; onboarding is one-shot | If we ship a multi-workspace product, re-onboarding per workspace becomes a thing |

---

## Voice — PASS

Canon Part III §11 applies. Step copy reads as plain sentences a peer would say:

- Step 5 ICP prompt: not "Define your wedge" — actual copy reads like *"Who's the one type of company you'd pick if you could only pick one?"*
- Completion: 4 destination CTAs are verb-shape sales moves (`Open Dashboard`, `Build first signal`, etc.), not category-shaped buttons.

No banned vocab in the operator-facing copy. The behavioral-spine references in code comments are internal architecture language and stay there (Part III §11 explicitly permits internal jargon in code paths).

---

## Fix scope — none

The shipped room matches its locked mind. Doc-only audit.

---

## Acceptance walk (re-verify when changes land)

1. `/onboarding/` renders the 7-step flow with ProgressRail visible.
2. Step 1 ProgressRail reads ~14%; each Next advances visibly.
3. First ask is intro + name, NOT company name.
4. Step 5 (ICP) accepts free-text + saves on Next.
5. Step 7 (quota) accepts a number + saves on Next.
6. Completion screen offers 4 destination CTAs.
7. Post-completion `/dashboard/` shows the seeded Brief items.

All seven hold against shipped state per spot-checks.
