# ADR-009 — Workspace-scope observations as a distinct stream

**Status:** Approved by founder 2026-05-31
**Date:** 2026-05-31
**Supersedes (partially):** ADR-006 §"Phasing" Phase-B-absorption clause

---

## Context

Phase A of the orchestration layer (ADR-004, shipped 2026-05-19) scaffolded an `observations` ledger and a heartbeat Edge Function with an empty generator registry. The original ADR-004 Phase B was scoped as **"register signal-decay generator + ship the Dashboard 'this week's reads' card."** The infrastructure was built for *workspace-scope* observations — the system's own read of the operator's deals, signals, proofs, motions.

ADR-006 (Briefing room, 2026-05-23) then absorbed that Phase B scope. The Briefing's Recipe Layer would produce Patterns (a higher-quality kind of read, with audit envelopes); signal-decay would become one special case of the broader Trigger grammar; the Patterns surface would replace the planned Dashboard card. The Phase A `observations` table sat scaffolded but unused.

ADR-008 (2026-05-29) flagged this as an open question: **build a separate workspace-scope observation stream (heartbeat generators → `observations` ledger), or point the Briefing's Watchlist Trigger grammar at the operator's own accounts and call it covered?**

On 2026-05-31 the founder picked **YES** to the separate stream, with one shared-infrastructure constraint.

## Decision

**Workspace-scope observations are a distinct stream from Briefing Patterns.** ADR-006's Phase-B-absorption clause is itself superseded by this ADR. Phase B un-retires under its original ADR-004 framing, with these locked design points:

1. **Two streams, two surfaces.**
   - *Workspace stream*: subject = the operator's own objects (your deal, your signal coverage, your proof state). Driver = the operator's actions or inaction. Surface = Dashboard "this week's reads" card. Cadence = heartbeat (every 30 minutes). Cost profile = deterministic SQL — no LLM, no critic, no audit envelope.
   - *World stream (Briefing)*: subject = market entities. Driver = external events. Surface = Briefing room. Cadence = weekly. Cost profile = full Recipe Layer pipeline.

2. **Shared Voice Document.** The Briefing's Voice Document (`deliverables/specs/briefing/signal_console_voice_document_v0.1.md`) is the canonical voice for *both* streams. To make this enforceable at the code layer, the structured rules (banned vocab, hedging rules, structural rules) are extracted into `src/lib/voice/` as a TypeScript module. The .md remains canonical for humans; the structured form is what the code reads + validates against. Both Briefing synthesis and observation generators flow through the same validator.

3. **Heartbeat generators write to the existing Phase A `observations` ledger.** No new ledger table. Generators are registered in `supabase/functions/heartbeat/`'s registry; each generator is a SQL-only function that returns observation candidates; the existing writer (Phase A) dedupes + supersedes by `(workspace_id, source_generator, related_object_id)`.

4. **Four initial generators**, all SQL-only:
   - **`deal_decay`** — deal stalled ≥ 7 days at the same stage with no dated next step. Most directly addresses the operator's own work.
   - **`signal_decay`** — watched account with no signals in ≥ 14 days. ADR-004's original first-generator pick.
   - **`proof_staleness`** — proof past its readout date (`created_at + duration_days < now`) with `outcome_state = 'open'`.
   - **`discovery_rhythm`** — fewer than one logged discovery session in the past 7 days. Coarse signal until Quota Workback retrofits to cloud and enables operator-cadence-aware thresholds.

5. **Dashboard card with 14/7 display filter.** The deal_decay generator always fires at the more-sensitive 7-day threshold (stable dedupe keys mean supersession, not append). The Dashboard card filters to "show ≥ 14d" by default; a subtle inline pill toggle (14d / 7d) flips the filter. The toggle is a display preference persisted in `localStorage` (`gtmos_dashboard_decay_threshold`), not workspace-level config — cheaper, no schema, instant response on toggle.

6. **Cross-deduping infrastructure for the Briefing**. The Dashboard card's reader consults an active-Briefing-Patterns index when filtering observations. If an active Pattern names the same entity AND the same generator class would shadow it, the workspace observation is suppressed in favor of the Briefing's richer read. Today this index is empty (Patterns aren't shipping yet); the hook lights up when Briefing B.X lands.

## What this is NOT

- **Not a CRM.** The five ADR-004 rules still apply: format is prose, sharp not exhaustive, feeds back into system behavior, names the why, has the handoff as a destination.
- **Not a redesign of any shipped room.** Per ADR-008's additive boundary, the orchestration layer sits beneath the rooms. Dashboard gets one new card; no existing surface changes shape.
- **Not a Briefing competitor.** Different subject, different cadence, different cost. The two surfaces complement; the Voice Document keeps them coherent.

## Alternatives considered

**Point Briefing's Watchlist Trigger grammar at the operator's own accounts.** The "NO" path from ADR-008. Rejected because: (a) Watchlist Triggers were designed for entities the operator *named on a watchlist*, not entities the operator *owns* — conflating those bends the model; (b) cadence mismatch — Briefing is weekly, workspace truth wants faster; (c) cost overkill — forcing "your deal is stalled" through the Recipe Layer's critic + revise burns LLM budget for what's deterministic SQL; (d) surface mismatch — workspace observations want to feed the Dashboard rail, not `/briefing/`; (e) substrate gap — Briefing reading the operator's own deals depends on Tier 2–4 retrofit being further along, but workspace observations can run against the cloud-resident `deals` + `signals` tables right now.

**Hybrid: heartbeat generators that write to Briefing Patterns directly.** Rejected because Patterns are designed for the provocative posture (Coverage, Framing, Defensibility) which doesn't fit workspace-scope "your deal is stalled" — that doesn't need a critic step.

## Implementation plan (Phase B build)

Single branch, 10 waves, single PR.

| Wave | Scope |
|---|---|
| 1 | This ADR + canon updates (Part II.5 §7 reframe, Part V §1, ADR-008 §"Correction note" resolution) |
| 2 | Generator authoring tooling: `Generator` interface, registry pattern, dedupe contract |
| 3 | Voice Document structured form (`src/lib/voice/`) — shared with Briefing |
| 4 | `deal_decay` generator |
| 5 | `signal_decay` generator |
| 6 | `proof_staleness` generator |
| 7 | `discovery_rhythm` generator |
| 8 | Dashboard "this week's reads" card + 14/7 toggle + dismiss |
| 9 | Cross-deduping infrastructure (no-op until Briefing Patterns ship) |
| 10 | E2E smoke + voice spot-check fixtures |

CI gates: typecheck + vitest + Playwright + Vite build, all green before merge.

## Voice rule

Every observation_text MUST pass `validateObservation()` from `src/lib/voice/`. Generators that produce gummy copy are retired by ID via the `source_generator` column without changing the ledger schema. This is the canon Part III §11 voice doctrine enforced at the code layer.

## Cost discipline

Workspace-scope observations are SQL only — no LLM. Per-tick cost is approximately the round-trip time of N small Postgres queries (one per active generator per active workspace). At a 30-minute cadence with four generators and (say) 50 active workspaces, that's 200 queries per tick, all narrow `select … where workspace_id = ?`. Negligible relative to the Briefing's Recipe Layer budget.

## Authority

This ADR + the structured Voice Document at `src/lib/voice/voice-document.ts` + the generator registry in `supabase/functions/heartbeat/`. The Briefing's Recipe Layer Spec v0.4 stays canonical for Briefing-side concerns; this ADR resolves the open question ADR-008 §"Correction note" recorded without changing any other Briefing doctrine.
