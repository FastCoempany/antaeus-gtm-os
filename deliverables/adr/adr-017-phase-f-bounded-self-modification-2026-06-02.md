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

## What actually shipped (2026-06-02)

Implementation arc closed in a single session as PRs #248 → #251. Diverges from the §"Implementation plan" sketch above only in detail. The shape recorded here is the durable one; future sessions should rely on this section rather than the planning sketch.

**Schema (PR #248 + PR #251).** Three tables ship the doctrine:

| Table | Migration | Purpose |
|---|---|---|
| `proposed_modifications` | `20260602230000_phase_f_proposed_modifications.sql` | Where detection generators write proposals and where the operator's decision is recorded. RLS: members SELECT + UPDATE; INSERT + DELETE service-role only. |
| `workspace_skill_overrides` | `20260602240000_phase_f_apply_side_effects.sql` | Lane 1 side effect. UNIQUE on `(workspace_id, skill_id)`, so accepting a second proposal for the same skill replaces the prior override. RLS: members can SELECT + INSERT + UPDATE + DELETE their own workspace's rows (operator-owned). |
| `active_observation_variants` | `20260602240000_phase_f_apply_side_effects.sql` | Lane 2 side effect. UNIQUE on `(workspace_id, base_generator_id, variant_name)`. Same RLS posture as overrides. |

Both side-effect tables FK back to `proposed_modifications.id` (set null on delete) so the audit chain — "this override exists because the operator accepted proposal X on date Y" — is preserved.

Plus `workspace_profile.phase_f_proposals_enabled` boolean column (default `true`, nullable for backward-compat) per §Approved pick 6.

**Detection generators (PR #249).** Two SQL-only generators wired into the heartbeat:
- `skill_default_refinement` reads `scheduled_skills` + counts successful fires per skill from `scheduled_skill_fires` over the last 30 days. ≥5 fires threshold → proposal candidate.
- `recurring_focus` reads `workspace_sessions.recent_actions` focus events over the last 14 days. ≥5 per-room threshold → proposal candidate mapped to a base generator via room (`signal-console → signal_decay`, `poc-framework → proof_staleness`, `discovery-studio → discovery_rhythm`, else `deal_decay`).

Both generators check `phase_f_proposals_enabled` before doing any work; if false they return `[]` immediately.

**Voice gate on every proposal write.** Generators produce a `ProposalCandidate` with `title`, `what_noticed`, `what_changes` — all three pass through `src/lib/voice/voice-document.ts:validateObservation` at write time. Failed candidates are dropped, logged, not re-rolled.

**Cooldown dedupe.** `payload.dedupe_hash` is a stable hash of the proposal shape (computed by `stableHash` which is order-independent across param-key reordering). The writer blocks new writes when a pending OR accepted OR within-cooldown row with the same hash exists. 30-day cooldown per ADR-017 §Approved pick 3 — set at decide time on dismiss/snooze; null on accept.

**Briefing Suggestions UI (PR #250).** `SuggestionsSection.tsx` mounts between `ViewToggle` and view-specific content; visible on both Workspace and World views. One proposal at a time, un-viewed first then most-recent. Three buttons: *Yes, make that change* (accepted) / *Ask me again in a month* (snoozed) / *Not now* (dismissed). First render marks the proposal viewed via fire-and-forget. Optimistic accept/dismiss with re-fetch on failure + inline error.

**Settings toggle (PR #250).** `PhaseFCard` between Category and Demo. Reads/writes `workspace_profile.phase_f_proposals_enabled`. Peer-voice copy: *"The system will sometimes notice a pattern in how you work … and suggest a small change. You always accept or dismiss."*

**Apply logic (PR #251).** `applyAcceptedProposal(id)` in `src/briefing/lib/phase-f-apply.ts` branches on `kind`:
- `skill_default` → list existing override by skill_id; if present, update with new params + accepted_proposal_id; else insert
- `observation_generator` → same shape, indexed by `(base_generator_id, variant_name)`

Wired into `decidePendingProposal`: on accept success, fires apply. Failure surfaces an inline error to the operator but does NOT roll back the decision (the row stays `accepted`; retry path is open).

**Skills dispatcher integration (PR #251).** `dispatchSkill` calls `applyWorkspaceOverride(skill, url)` after the recipe-resolved URL is built. Override params from `workspace_skill_overrides` are appended via `URL.searchParams.set` — any matching recipe param is overwritten. Defensive: load/parse failures fall through to the un-overridden URL.

**Heartbeat variant runner (PR #254).** `runPhaseFVariantsForWorkspace` reads `active_observation_variants` for the workspace, invokes the matching base generator from `PHASE_B_GENERATORS`, voice-gates each candidate, writes with `source_generator = ${base_generator_id}:${variant_name}`. Per-variant errors captured in the lap outcome; failing variant doesn't abort the lap. Base generators + voice validator are **injected** rather than imported to keep vitest typecheck clean under `moduleResolution: bundler`.

**Toggle scope (clarification).** The `phase_f_proposals_enabled` toggle disables NEW proposals from being detected. It does NOT disable already-applied side effects:
- Skill overrides keep being honored by the dispatcher (the dispatcher reads `workspace_skill_overrides` unconditionally).
- Observation variants keep firing in the heartbeat (the runner reads `active_observation_variants` unconditionally).

This matches the doctrine: *"existing suggestions stay where they are — they just won't grow."* The operator removes an unwanted side effect by deleting the row, not by flipping the toggle.

**Lane 2 deferral.** The variant runner invokes base generators **as-is**, without plumbing the variant's `filter` payload through the base generator's SQL. The variant's value is the distinct attribution track (the operator sees observations tagged `${base}:${variant}` in addition to base observations). Plumbing `filter` through the four Phase B generators' SQL queries is a future Phase G feature; if the operator decides the duplicate observations are noise, they can delete the variant row.



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
