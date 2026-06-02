# ADR-017 — Phase F: bounded self-modification

**Status:** **APPROVED by founder 2026-06-02.** All six open questions resolved with the recommended picks ("approve recommended").
**Date drafted:** 2026-06-02
**Date approved:** 2026-06-02
**Builds on:** ADR-004 (orchestration layer foundation), ADR-008 (orchestration doctrine + additive boundary), ADR-009 (workspace-scope observations), ADR-010 (skills layer), ADR-011 (birdseye float), ADR-012 (skill scheduling)
**Doesn't supersede anything.** Phase F is the natural next phase per ADR-004 §Phasing.

## Approved picks (2026-06-02)

| # | Question | Locked answer |
|---|---|---|
| 1 | Doctrine approval — bounded = proposals operator must accept | **YES** — the right shape |
| 2 | Proposal surface | **(a) New "Suggestions" section in the Briefing room** |
| 3 | Cooldown after dismiss | **30 days** |
| 4 | Skill default refinement scope | **Per-workspace override** (not recipe-file edit; keeps recipe changes auditable via git) |
| 5 | Lane 2 v1 scope | **Parameterized variants of existing generators only**; full new-generator authoring deferred to Phase G |
| 6 | Settings toggle to disable proposals entirely | **YES** — on by default, operator can flip off |

Implementation begins immediately with **PR 1 — Schema** (this PR series).

---

## Context

The orchestration roadmap has shipped Phases A–E:

- **A (foundation):** session model, observations ledger, heartbeat skeleton — ADR-004
- **B (workspace observations):** four SQL generators writing reads to the ledger — ADR-009
- **C (skills):** deterministic markdown recipes the operator invokes — ADR-010
- **D (birdseye):** floating "what to look at next" surface on every room — ADR-011
- **E (scheduling):** operator schedules skills, system fires them on cadence — ADR-012

What's missing: the system has been accumulating signal about *how* the operator uses it — which skills they invoke, which rooms they enter first on Tuesday mornings, which observation kinds they dismiss vs. act on — and never proposing changes based on that signal. ADR-004 §Phasing named this as "Phase F (bounded self-modification) — system refines skill defaults and proposes observations from usage patterns."

This ADR is the doctrine for that phase. **Implementation is a separate arc** (likely 4 PRs); this ADR locks the constraints before any of it gets built.

## Decision

The system modifies its own behavior in **two narrow lanes**, both **gated by explicit operator acceptance**. Auto-application without operator consent is out of scope. The "bounded" qualifier is doing real work — it's the difference between a tool that refines itself with the operator and a tool that mutates underneath them.

### Lane 1 — Skill default refinement

When an operator invokes a skill repeatedly with the same parameter override, the system proposes updating the default.

**Example:** the operator runs `whats-at-risk` five times in two weeks, each time filtering to `stage=negotiation`. The system proposes:

> *I noticed you've filtered `whats-at-risk` to negotiation-stage deals every time you've run it for two weeks. Want me to make that the default?*
> [Accept] [Dismiss] [Snooze 30d]

- **Accept** → the skill's default flips. Future invocations land on negotiation-stage unless the operator overrides again.
- **Dismiss** → no change. Same proposal won't re-fire for 30 days.
- **Snooze 30d** → same as Dismiss but the operator opted in to remembering.

### Lane 2 — Observation proposal from usage patterns

When operator behavior shows a coherent pattern over time, the system proposes surfacing it as a recurring observation (= registers a new generator variant).

**Example:** the operator opens Deal Workspace before Discovery Studio on five of the last six Tuesday mornings. The system proposes:

> *Five of the last six Tuesdays you've opened Deal Workspace first. Want me to surface the top recovery-rank deal in your Tuesday brief?*
> [Accept] [Dismiss] [Snooze 30d]

- **Accept** → a parameterized variant of the `deal_decay` generator gets registered for this workspace, filtering to "fires on Monday night so it lands in the Tuesday brief."
- **Dismiss** → no change. 30-day cooldown.

### What the system NEVER modifies

The bounds are explicit:

- **Room minds** (canon §4.X) — those are founder-authored doctrine. The system never proposes changing what a room knows.
- **Sacred nouns** (canon §2) — protected. Never modified.
- **Operator-authored content** — deals, ICPs, proofs, accounts, signals, etc. The system doesn't change the operator's data; that's CRM behavior, banned per ADR-004 §"What this is NOT."
- **Other operators' workspaces** — workspace-scoped only. Cross-workspace inference is out.
- **Its own constraints** — the bounds in this ADR are not modifiable by the system. Only the founder, through a future ADR, can widen the scope.

### Proposal surface

One proposal at a time, never a queue. Each proposal carries:
- **What I noticed** — the concrete pattern in plain language (peer voice, canon Part III §11)
- **What would change** — exactly what the system would modify
- **What dismissing means** — silence, not a fight

Three locations are candidates (founder picks one in this ADR's resolution):

- **(a) New "Suggestions" section in the Briefing room** — proposals live where the operator already goes for system reads. One section between Patterns and the lead.
- **(b) Settings card** — proposals as a Trust Annex item. Calmer; less likely to interrupt.
- **(c) Birdseye float** — proposals as the float's "next" line when there's nothing more urgent. Most ambient; least guaranteed to be seen.

### Bounded by acceptance, bounded by frequency

A dismissed proposal of the same shape doesn't re-fire for 30 days. The operator can disable proposals entirely via a Settings toggle. The system never escalates from "dismissed once" to "asking again next week" without an explicit operator action.

## Alternatives considered

### Alternative A — Unbounded self-modification

Auto-applies changes when the detection signal crosses a confidence threshold. Operator sees a notification after the fact.

**Rejected:** the operator loses control of their workspace. The whole point of the "bounded" qualifier is to keep the operator's hand on the wheel. ADR-008 §"What this is NOT" — *the system's value is noticing things the operator hasn't noticed*, not changing the workspace without them.

### Alternative B — Logging only, no proposals

Observe usage patterns and accumulate signal but never propose changes.

**Rejected:** gives up the value of accumulated signal. The operator's time is the constrained resource; if the system can save them a few clicks per week by proposing a default flip, that's leverage.

### Alternative C — Modification only via explicit operator request

The operator types `/refine` or asks "what should I change?" and the system proposes. Otherwise silent.

**Rejected:** the operator doesn't know what to ask about. The system's value here is *noticing things the operator hasn't noticed*. Requiring the operator to ask first inverts that.

### Alternative D — Server-authored new generators (full Lane 2)

Proposals can register arbitrary new generators (not just parameterized variants of existing ones). The proposal payload includes the generator's logic.

**Rejected for v1.** Authoring new generator logic server-side is a much bigger lift — it needs a generator authoring DSL, voice gates on the SQL, an evaluation harness. v1 of Lane 2 ships with **parameterized variants of existing generators only** (e.g. "fire the `deal_decay` generator on Monday night, not the standard cadence"). Full new-generator authoring is Phase G or later.

## Implementation plan (sketch — separate from this doctrine)

If the founder approves the doctrine, implementation lands in roughly this order:

**PR 1 — Schema**
- New `proposed_modifications` table (workspace-scoped, RLS read for members, service-role write)
- Columns: `id`, `workspace_id`, `kind` (`skill_default | observation_generator`), `title`, `what_noticed`, `what_changes`, `proposed_at`, `viewed_at`, `decision` (`accepted | dismissed | snoozed | null`), `decided_at`, `payload` jsonb, `cooldown_until`
- Voice gate on every text column at write time (same module as ADR-009)

**PR 2 — Detection generators (Edge Function)**
- New Deno function or extension to the heartbeat
- Two initial generators:
  - `skill_default_refinement` — reads `scheduled_skill_fires` (or skill-invocation audit if we add one) for repeat-pattern detection
  - `observation_proposal` — reads `workspace_sessions` recent-focus history for room-access patterns
- Both write candidates to `proposed_modifications`; dedupe via cooldown + `payload` hash
- Cost-bounded same as ADR-016: weekly ceiling per workspace

**PR 3 — Proposal surface UI**
- Founder-picked location from §"Proposal surface" above
- Accept / Dismiss / Snooze buttons
- One-at-a-time rendering; queue invisible to operator

**PR 4 — Apply logic + cooldown**
- Skill update path (writes to per-workspace override, not the recipe file itself — keeps recipe-file changes ship-via-git)
- Observation generator registration path
- Cooldown enforcement: dismissed/snoozed entries gate re-fire

Implementation cost estimate: ~3-4 weeks of careful work. The schema + detection are the heaviest pieces; UI is small.

## Open questions for founder approval

These are the picks I need from you before implementation starts:

1. **Doctrine approval — yes/no?** Is "bounded self-modification = proposals operator must accept" the right shape? Or is the bound too tight (would you actually want auto-apply for some lane)? Or too loose (should NO modification happen without you, even with consent)?

2. **Proposal surface — (a) Briefing Suggestions section / (b) Settings card / (c) Birdseye float / (d) other?** Each has a different visibility-vs-intrusion trade. Recommend **(a)** — proposals belong where the operator already goes for system reads.

3. **Cooldown after dismiss — 30 days suggested. Shorter (7d) / longer (90d) / different shape?**

4. **Skill default refinement scope — per-workspace override vs. recipe-file edit?** Recommend **per-workspace override** — keeps recipe-file changes auditable via git, and protects other workspaces from one operator's pattern.

5. **Lane 2 v1 scope — parameterized variants of existing generators only?** Recommend **yes** for v1. Full new-generator authoring is a bigger lift and can wait for Phase G.

6. **Settings toggle to disable proposals entirely — confirm yes?** I'd say yes by default; some operators will want this off.

## Risk + reversibility

- **Reversible:** every applied modification is logged in `proposed_modifications` with the `accepted` decision + payload. A future Settings action can roll back any individual change. Mass rollback (revert everything) is a database delete on `proposed_modifications` + a reset on the per-workspace overrides.
- **Bounded by acceptance:** a hostile or buggy detection generator can't silently change anything — every modification requires an explicit operator click.
- **Bounded by cost:** the detection generators run on the same cost-ceiling pattern as ADR-016 (weekly cap per workspace, throttle at 80%, pause at 150%).

## What this is NOT (echoing ADR-008's discipline)

- **Not auto-apply.** Operator must accept.
- **Not CRM behavior.** System doesn't change operator data, only its own behavior layer.
- **Not a notification system.** Proposals appear in a designated surface; no toasts, no growls, no push.
- **Not arbitrary code execution.** Lane 2 v1 is parameterized variants only; no generator-authoring DSL.
- **Not cross-workspace.** Each workspace's proposals are inferred from that workspace's history only.

## Recommendation

Approve the doctrine. Implementation arc can ship over the following month at the same per-PR discipline the orchestration phases have used (typecheck + tests + Playwright + per-PR Supabase branch CI for schema changes).

If you want a tighter scope — Lane 1 only, Lane 2 deferred — that's a clean v1 that still delivers the most-leveraged behavior (skill default refinement) without the additional design surface of generator proposals.

---

*Per canon Part IV §4: this ADR is **DRAFT** until founder explicitly approves. No implementation begins before that approval. The session log will record the approval decision when it lands.*
