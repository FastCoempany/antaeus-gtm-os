# ADR-008 — Orchestration Layer Doctrine + Additive Boundary

**Date:** 2026-05-29
**Status:** Approved
**Supersedes:** None
**Amends:** ADR-004 (records the source + thesis + boundary that ADR-004 implemented without attributing)
**Depends on:** ADR-004 (Orchestration Layer Foundation), ADR-005 (Data Layer Parity), ADR-006 (Briefing Room)

---

## Why this ADR exists

ADR-004 shipped the orchestration layer foundation (session model + heartbeat + observations ledger) on 2026-05-19. ADR-005 scoped the Phase 4.5 data-parity work that gates the first observable generator. ADR-006 scoped the Briefing room. All three are live or in flight.

What none of them recorded is **where the thinking came from and what it explicitly rules out.** The orchestration direction originated in a specific conversation: a review of Alex Krentsel's talk *"Principles for Autonomous System Design: OpenClaw Deep Dive"* (UC Berkeley, May 2026). The founder and a prior Claude session walked the talk, extracted what applied to Antaeus, and committed to a phased build. The *outputs* of that conversation landed in canon (Part II.5 §7) and ADR-004. The *rationale*, the *source*, and — critically — the *boundary of what we deliberately rejected* did not.

A future session reading canon today sees the orchestration phases without the framing that keeps them additive. That is a canon hole. This ADR closes it. The full source transcript + the conversation that derived this plan is preserved at `deliverables/openclaw/openclaw-inspiration-transcript-2026-05-22.md`.

---

## The thesis (locked)

> **The intelligence of a system is in the orchestration layer, not in the rooms.**

Antaeus's canon today is mostly *what each room does* — the mind, the primitives, the must-never-flatten (canon §4). The orchestration layer is a parallel concern: *how the system behaves between rooms and over time* — the heartbeat, the session, the observations ledger, the skill registry, inter-room push. Canon §3 already asserts the seed of this ("intelligence is native system truth, not side analysis"); the orchestration layer extends that truth from the rooms to the system as a whole.

This thesis is added to canon Part I §1 as a one-line orientation so every future session inherits it.

---

## The defining constraint: ADDITIVE, not a reframe

This is the most important decision in this ADR and the reason it exists as its own record.

The orchestration layer is **a new layer underneath the existing rooms. It does not redesign, reorganize, or replace anything already shipped.** The "what a system that has its own voice across time looks like" reframe is engine-side work that makes the existing rooms feel more alive — it is **not** a rethink of what is on top.

Concretely, this means every one of the following stays exactly as shipped, and a proposal to change any of them in the name of orchestration work is a **red flag to stop and escalate to the founder**:

- The 20 rooms, their minds, their primitives (canon §4 — all sacred)
- **The Briefing room specifically** — its Patterns, its posture, its look, its movement. The Briefing already produces observations the system wrote; it is OpenClaw-shaped at world-scope and is not to be re-touched as part of orchestration work. The founder confirmed this explicitly on 2026-05-29: *"I like where the briefing room is ... and don't want to change it."*
- The Dashboard as the ranking surface (canon §4.2)
- Bright field, serif headlines, kicker pattern (canon Part II)
- Voice rule (canon Part III §11)
- Continuity params + RoomChrome + cmd/Ctrl+K palette (canon §6)
- Sacred nouns + object-first / command-first architecture (canon §2, §3)
- Behavioral engineering principles (canon Part III)
- Supabase + RLS + workspace-scoped data

What the orchestration layer *adds* is small, well-scoped, additive UX, layered in over phases:
- A "what the system noticed this week" card where the Brief already lives (Phase B) — **one card, not a redesign**
- A skill picker folded into the existing Ctrl+K palette (Phase C)
- A quiet birdseye strip across the top of rooms (Phase D)
- Next-action tags + inline observation kickers (Phase D)
- Operator scheduling (Phase E)

Each is the visible tip of an engine-side change. None reorganizes a shipped surface.

---

## What we pass on entirely (the rejected list)

The OpenClaw architecture has pieces Antaeus deliberately does NOT adopt. Recording them so no future session re-proposes them as "OpenClaw alignment":

1. **The connectors layer** (WhatsApp / Discord / iMessage / Gmail as access surfaces). Antaeus IS the surface; it is not accessed through other surfaces. OpenClaw is a supervisory layer over your whole digital life; Antaeus is a focused operating room for one job.
2. **Open-ended self-modification of the architecture.** OpenClaw can rewrite its own code + rearrange itself. That is dangerous for a productized multi-tenant workspace — the operator must never open Antaeus to find their rooms rearranged. Bounded self-tuning of skill defaults + observation proposals (Phase F) is the *only* self-modification permitted, and it touches operator-level config, never the room architecture.
3. **"Code quality is dead."** True for a personal hobbyist harness; false for a product shipping to non-developers. Strict TypeScript, tests, CI gates stay.
4. **Security-through-reasoning.** OpenClaw bets that a smart-enough model manages its own security. Antaeus has RLS at the DB layer — the correct shape for a multi-tenant workspace. We do not replace enforced security with reasoned security.
5. **Runtime LLM in skills.** OpenClaw skills are instruction text an LLM reads at runtime. Antaeus skills (Phase C) are markdown recipes that compose existing *deterministic* room engines — no LLM at runtime (Option 1, locked in the source conversation). The handful of skills that genuinely need generation (e.g. an email body) can opt into an LLM later (Option 2 hybrid), but the default is deterministic. Option 3 (every skill is LLM instruction text) is explicitly rejected — that is CRM-with-AI territory.

---

## The phase sequence (dependency-locked)

The dependency order below is the *source-conversation* sequence (ADR-004 §Phasing) **as amended by ADR-006**. ADR-006 changed the meaning of "Phase B," so the table records what's actually true today, not the original ADR-004 wording.

| Phase | What | Status |
|---|---|---|
| **A — Foundation** | Session model + heartbeat skeleton + observations ledger + ADR-004 | ✅ shipped 2026-05-19 (live in prod 2026-05-20) |
| **Phase 4.5 — Data parity** | Tier 1 rooms (Signal Console + Deal Workspace + Outbound Studio) write through Supabase so any generator has real data to read | ✅ effectively complete for Tier 1 — see the correction note below. **Signal Console** fully retrofitted Steps 3/4/5 on 2026-05-23 (#142/#147/#149). **Deal Workspace** built cloud-native in Phase 4 (PR #8): `data.deals` reads/writes + realtime + legacy mirror; only Step-5 mirror-drop remains, gated on cross-room consumers. **Outbound Studio** cloud-resident via `bootCloudPersistence`; only Step-5 mirror-drop remains. Tier 2-4 rooms (Checkpoint 3) are the remaining parity work. |
| **B — First observable signal** | **Superseded by ADR-006.** Original ADR-004 Phase B = standalone signal-decay generator + a "this week's reads" Dashboard card. ADR-006 §"Phase B supersession" retired that: the Briefing absorbs it. Signal-decay became one Trigger type in the Briefing's grammar (silence + threshold triggers against signal recency); the Briefing's Recipe Layer Patterns ARE the world-scope observations, at higher quality with audit envelopes. The Briefing build (ADR-006, canon §4.21) is effectively complete as of the 2026-05-29 session. | ✅ via Briefing |
| **C — Skills layer** | Markdown recipes composing existing engines (no runtime LLM); skill picker in Ctrl+K; 5 starter skills (pre-call brief, weekly pipeline review, post-loss debrief, outbound batch, weekend deal sweep) | queued — the largest untouched orchestration layer |
| **D — Birdseye strip + inter-room push** | Quiet strip on every room wired to session + observations + notification queue; inline observation kickers; next-action tags | queued |
| **E — Cron + operator scheduling** | Operator schedules reminders ("ping me Friday about Meridian"); skills auto-run on schedule | queued |
| **F — Bounded self-modification** | System refines skill defaults from usage; proposes observations from patterns. Operator-config scope only (never architecture). | queued, speculative tail |

A likely reorder noted in the source conversation: **D before C** (ship the empty strip as the surface first, then the skills that fill it). Left to the session that reaches that boundary; either order is dependency-valid.

### Correction note — the redundant 2026-05-29 Tier 1 PRs

The 2026-05-29 session opened against a **stale canon row** (Part V §1 Checkpoint 2 read "⏳ pending") and produced a run of Phase 4.5 Tier 1 PRs as if the retrofit were greenfield:

- **#202** Signal Console Step 1 audit — redundant; SC was fully retrofitted on 2026-05-23 (#149).
- **#203** Signal Console Step 2 schema (`workspaces.gtm_config` + `signal_console_health_snapshot()` RPC) — net-new, additive, **non-conflicting but unwired**. Nothing reads them yet. Left in place (reverting applied additive migrations is more risk than value); available if a future generator wants a cloud path for the SC health snapshot / enrichment-base-url override.
- **#204** Deal Workspace Step 1 audit — redundant; DW was cloud-native since Phase 4 (PR #8).
- **#205** Outbound Studio Step 1 audit — **accurate**; correctly found OS at "end state minus legacy-mirror."
- **#206** Deal Workspace Step 2 schema (`deals.recovery_rank` + `deal_workspace_health_snapshot()` RPC) — same as #203: net-new, additive, unwired, left in place.

Root cause: the session trusted the stale Checkpoint 2 row instead of checking git history (#142/#147/#149) + the flag registry first. The fix is this correction + the CLAUDE.md Part V §1 update landing in the same PR. The audit docs from #202 + #204 carry a correction banner pointing here. No code was reverted — the additive schema is harmless and the audit docs are now flagged.

### Two observation scopes — and an open question *(RESOLVED 2026-06-01 — see ADR-009 + ADR-014)*

The Briefing (ADR-006) writes **world-scope** observations — what's happening in the market the operator sells into (competitors, funding, hiring, narrative shifts). It owns the `briefing_patterns` table + the Recipe Layer pipeline.

The Phase A `observations` ledger was scaffolded for **workspace-scope** observations — facts about the operator's *own* deals, signals, and patterns ("5 deals stuck in evaluation, all missing decision-maker confirmation, same as the two Q2 losses"). ADR-006 noted the Briefing's Patterns are "the observations Phase A's `observations` table was scaffolded for" — true for world-scope, but workspace-scope observations are a distinct stream that the Briefing's world-facing pipeline does not directly produce.

**Open question (originally framed here):** is there still a separate workspace-scope observation stream worth building (heartbeat generators writing to the `observations` ledger about the operator's own pipeline), or does the Briefing's Watchlist Trigger grammar — pointed at the operator's own accounts/deals via the substrate — cover enough of it that a separate stream is redundant?

**Resolution (2026-06-01):** Two streams stay separate at the data layer (per **ADR-009** 2026-05-31 — workspace stream is SQL-only via heartbeat generators writing to `observations`; world stream is Recipe Layer Patterns writing to `briefing_patterns`). One operator-facing surface carries both views (per **ADR-014** 2026-06-01) — the Briefing room now houses a Workspace / World toggle defaulting to Workspace. The Dashboard "this week's reads" card stays as a secondary reach point for workspace observations. Different cadences (workspace heartbeat-continuous, world weekly) preserved. Both streams share `src/lib/voice/` for voice consistency.

---

## Relationship to the CRM line

ADR-004 §"What the system writes is not what a CRM writes" carries the five rules that keep observations out of CRM territory (prose not metric; sharp not exhaustive; feeds behavior not just a report; names the why; has an inheritance destination). Those rules are binding on every generator written in Phase B+. This ADR does not restate them; it points at them as the quality bar for all orchestration-authored copy, alongside canon Part III §11 (voice).

---

## Consequences

**Positive:**
- The WHY survives. Future sessions inherit the source, the thesis, and the boundary instead of re-deriving them or drifting.
- The additive boundary is explicit. "Don't redesign shipped rooms" is now a written rule, not an implicit understanding.
- The rejected list prevents re-litigation of connectors / self-modification / runtime-LLM-skills.

**Negative / risks:**
- The phase sequence is long (months across many sessions). Mitigation: each phase ships independently; we can stop or reorder at any boundary.
- The additive constraint could be read as "never improve a shipped room." It is not — face/mind work on rooms continues under the existing canon Part IV protocols. The constraint is specifically that *orchestration work* doesn't restructure shipped rooms; it adds a layer beneath them.

---

## Founder approvals captured

- 2026-05-19: Phase A approved + built (ADR-004).
- 2026-05-29: Additive framing confirmed. Briefing room explicitly out of scope for orchestration changes. "Sounds right" to ADR-008 capturing the rationale + boundary.
