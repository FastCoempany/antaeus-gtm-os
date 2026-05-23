# Briefing Room — Build Phase Plan (B.0 → B.9)

**Version:** 0.1
**Date:** 2026-05-23
**Status:** Draft for review
**Authority:** Cashes out ADR-006 §"Implementation plan" into per-phase deliverables, schema decisions, sequencing, and gates.

---

## 0. Purpose

ADR-006 locked the seven foundational decisions for the Briefing room: name, substrate-vs-surface split (path C), scope (full Recipe Layer v0.4 to the extent path C does not force compromises), Phase B supersession, spec promotion, and pricing posture. The ADR also outlined ten implementation phases (B.0 → B.9) at a glance but did not commit to concrete deliverables, schema designs, or sequencing.

This document is that commitment. Each phase below names what gets built, what proves the phase done (the gate), how it sequences against the parallel Phase 4.5 / Tier 1 retrofit work for Deal Workspace + Outbound Studio, and the estimated PR size + dependencies.

This plan answers the seven open questions ADR-006 deferred:

1. **Pattern storage** — a new `briefing_patterns` table. The existing `observations` table (Phase A) stays for the lighter-weight observation shape from ADR-004; Patterns are a richer first-class noun with claim + six_questions + recommended_moves + attribute_grid + audit_envelope_id and deserve their own schema. Locked in B.0.
2. **Pipeline runtime** — Supabase Edge Function orchestrator, fired by pg_cron on a Monday 06:00 UTC weekly schedule (matches the spec's worked example). Per-stage invocations via internal `pg_net.http_post` callbacks to break a single pipeline run into discrete jobs that each stay under the function timeout. Pipeline state tracked in a `briefing_runs` table. Locked in B.0.
3. **LLM provider abstraction** — thin internal wrapper around the Anthropic SDK. The wrapper exists for cost tracking, `model_v` hash logging into audit envelopes, retries with exponential backoff, and future provider swap. NOT a full provider-agnostic interface — that is premature. Locked in B.2 (when the first LLM call lands).
4. **Voice document editing UI** — v1 is read-only inside the Briefing room (a "View voice document" surface accessible from Settings or via cmd+K). The voice document itself is markdown at `deliverables/specs/briefing/signal_console_voice_document_v0.1.md` — operator-edits land via PR. Operator-editable UI is post-v1 polish (B.9 stretch).
5. **Behavioral Feedback module shape** — new noun, new table `briefing_pattern_feedback` with `(pattern_id, user_id, mark, marked_at, note)`. One row per pattern per user. Mark values: `"used" | "met" | "noise"`. Aggregates roll up into the Pattern's weight on the next pipeline run. Locked in B.6.
6. **Briefing cadence default** — weekly, Monday 06:00 UTC. Configurable post-v1.
7. **Multi-user readiness** — single-user beta. `getState()` contracts take no `user_id` parameter (per Read Interface Contracts §1.6). When multi-user lands, every contract grows a parameter. Deferred until that's actually on the roadmap.

The plan also answers a question ADR-006 did not raise explicitly: what does the **adapter layer** look like that lets path C work? The per-room `getState()` adapters live in `src/briefing/lib/adapters/<room>.ts`. Each adapter exposes a single signature: `getState(): RoomStateContract`. Today the adapter reads from legacy localStorage shapes; when the consuming room hits its own Step 5 in the Phase 4.5 retrofit, that room's adapter swaps its read source to Supabase tables with zero Briefing-side code change. The adapter shape is the stable contract; the read source is the implementation detail.

---

## 1. Sequencing against the Phase 4.5 / Tier 1 retrofit

Briefing work and Tier 1 retrofit work run in parallel:

```
Briefing                                   Tier 1 retrofit (Phase 4.5)
─────────────────────────────────          ─────────────────────────────────
B.0  schema + skeleton room                 DW Step 1  audit
B.1  sources + ingest + filter              DW Step 2  schema
B.2  cluster + synthesis (Draft/Crit/Rev)   DW Step 3  dual-write
B.3  Triggers (parser + 5 matchers)         DW Step 4  flip-read
B.4  Periphery Detection                    DW Step 5  drop legacy
B.5  Contrarian Synthesis                   OB Step 1  audit
B.6  Audit Envelopes + show-your-work       OB Step 2  schema
B.7  Evaluation Harness                     OB Step 3  dual-write
B.8  Cost tracker + ceilings                OB Step 4  flip-read
B.9  Briefing Compose + face re-skin        OB Step 5  drop legacy
```

This is illustrative. Phases don't have to land in lockstep; what matters is that the **adapter layer** in B.0 builds against today's data (mostly localStorage shapes) and naturally flips to cloud reads as each Tier 1 (then Tier 2-4) room hits Step 5. Each room's Step 3 grows a `getState()` shim alongside its dual-write work; the Briefing adapter for that room then has a stable source to read from regardless of whether the room is mid-retrofit or fully cloud-native.

Phases B.1 — B.9 each ship behind a Posthog feature flag (`briefing_v1_*`). The flag gates the pipeline + the room render so rollback is instant. The default flag posture matches the Tier 1 retrofit pattern: off-by-default, founder enables for own user first, expands rollout once verified.

---

## 2. Phase-by-phase

### B.0 — Schema + skeleton room + HydratedContext adapter shells

**Goal.** Foundation lands. Nothing visible to the operator yet.

**Scope.**
- New Supabase migration adding 6 tables:
  - `briefing_runs` (pipeline run state: id, started_at, completed_at, status, stage_log, total_cost, workspace_id)
  - `raw_items` (Stage 3.1 output: id, source_id, external_id, title, body, published_date, fetched_at, run_id, workspace_id)
  - `enriched_items` (Stage 3.3 output: raw_item_id, entities, exec_move, event_category, topic_tags, pain_tags, claim_type, summary, what_changed, user_relevance_score, matches_triggers, affects_deals, is_noise, run_id, workspace_id)
  - `briefing_patterns` (Stage 5 output: id, run_id, pattern_type ['standard'|'contrarian'|'periphery'], cluster_id, title, body, attribute_grid, six_questions, recommended_moves, confidence, evidence_count, source_count, trajectory, surfaced_at, audit_envelope_id, workspace_id)
  - `briefing_audit_envelopes` (id, pattern_id, cluster_jsonb, hydrated_context_jsonb, draft_jsonb, critique_jsonb, revise_jsonb, gate_decisions_jsonb, total_cost, created_at, workspace_id)
  - `briefing_pattern_feedback` (pattern_id, user_id, mark, marked_at, note)
  - Plus extension to existing `signals` for the periphery scoring track if needed (decision deferred to B.4 schema review)
- New room scaffold at `src/briefing/` with main.tsx + Briefing.tsx + index.html + briefing.css. Empty briefing renders the topbar + notification strip + empty briefing card.
- New `src/briefing/lib/adapters/` directory with the nine adapter files (one per module from Read Interface Contracts v0.1):
  - `icp-studio.ts`, `discovery-studio.ts`, `call-planner.ts`, `outbound-studio.ts`, `asset-builder.ts`, `active-deals.ts`, `watchlist-triggers.ts`, `voice-document.ts`, `behavioral-feedback.ts`
- Each adapter exposes `getState(): RoomStateContract` matching the contract from the Read Interface spec. v1 reads from legacy localStorage shapes; cloud-flip happens per-room when that room hits Step 5.
- Adapter type definitions live in `src/briefing/lib/contracts.ts` — the binding interface.
- New Vite entry for `/briefing/` route.
- Posthog flag `briefing_v1_room` gates room render (returns blank page or redirect when off).

**Gate.**
- Migration applies cleanly to production via `supabase db push --linked`
- Schema regen produces stable types in `src/lib/database.types.ts` (via the regen-flip pattern from PR #141)
- `briefing-helpers.ts` (or extends `database-helpers.ts`) exposes `Row<"briefing_patterns">` etc.
- Room renders at `/briefing/` with empty briefing scaffold (no data yet)
- Adapter unit tests: each adapter returns a valid `RoomStateContract` shape (even if empty) given empty localStorage; defensive against malformed data

**Estimated PR size.** Large (multi-PR). At minimum 3 sub-PRs:
- B.0a Schema migration + types regen
- B.0b Room scaffold + Vite entry
- B.0c Nine adapter shells + contract types

**Dependencies.** None. B.0 builds against today's main; it doesn't need any Tier 1 progress beyond the Signal Console substrate already complete.

**Risk.** Adapter shape misjudgment. If a room's legacy localStorage shape can't cleanly map to the `RoomStateContract` we author, the adapter has to do meaningful translation. Mitigation: spot-check 3 rooms (Discovery, Call Planner, Outbound) during B.0 design and adjust contract before committing.

---

### B.1 — Sources + ingest + filter

**Goal.** A pipeline run produces an `enriched_items[]` table. Still nothing surfaces to the operator.

**Scope.**
- Source-fetcher infrastructure at `src/briefing/sources/` — one file per source, each exposing `fetch(window): Promise<RawItem[]>`. v1 source list (tier A free sources per Intelligence Coverage Audit):
  - `hn-algolia.ts` (HN search via Algolia)
  - `techcrunch-rss.ts` (RSS)
  - `pr-newswire-personnel.ts` (filtered for exec moves)
  - `wikipedia-pageviews.ts` (term-level pageview deltas)
  - `github-releases-atom.ts` (releases atom feed for watchlist companies)
  - `tier-b-html-diff.ts` (the page-diff source; uses a stored prior snapshot)
- Source registry at `src/briefing/sources/index.ts` listing active sources + cadence + auth requirements.
- Edge function `supabase/functions/briefing-pipeline/` orchestrating the run:
  - Stage 3.0 Context Hydration via the nine adapters (called via REST or directly if SSR-eligible)
  - Stage 3.1 Ingest — calls every source in parallel, deduplicates by `(source_id, external_id)`, writes to `raw_items`
  - Stage 3.2 Filter — deterministic filter rules per the Recipe Layer Spec §3.2
- Stage 3.3 Enrich is deferred to B.2 (it's the first LLM call). B.1 produces `raw_items` + filter decisions but doesn't enrich yet.
- pg_cron schedule entry `cron.schedule('antaeus-briefing-weekly', '0 6 * * 1', ...)` to fire the Edge Function every Monday at 06:00 UTC.

**Gate.**
- Founder triggers a manual Edge Function invocation; pipeline runs end-to-end through filter; `raw_items` table populates with ~10-30 rows
- Filter decisions logged with rule fired (or "none — keep") per row
- Pipeline state in `briefing_runs` reaches `status='filter_complete'`
- No LLM calls have happened yet

**Estimated PR size.** Medium-large. Probably 2 sub-PRs:
- B.1a Edge Function orchestrator + Stage 3.0 / 3.1 / 3.2 + pg_cron schedule
- B.1b Six source fetchers + the registry

**Dependencies.** B.0 must be merged (schema + adapters in place).

**Risk.** Source rate limits or auth requirements not anticipated. Mitigation: the `signal_console_source_verifier.py` script from the spec set lists known auth + rate-limit posture per source.

---

### B.2 — Cluster + standard synthesis (Draft / Critique / Revise / Gate)

**Goal.** First Pattern surfaces in the briefing surface end-to-end. The operator can read a synthesized weekly briefing.

**Scope.**
- Stage 3.3 Enrich — Haiku 4.5 call per item, per the Recipe Layer Spec §3.3. LLM provider wrapper introduced at `src/briefing/lib/llm/` with cost tracking + model_v hashing.
- Stage 3.4 Cluster — three cluster types (pain_tag, exec_move, narrative_shift) per spec §3.4. Weighted evidence calculation. Cluster persistence to a `briefing_clusters` table (decision: clusters get their own table for cross-run tracking — added to the B.0 schema list retroactively if not already there).
- Stage 5a/5b/5c/5d Synthesize — Draft (Opus 4.7 + extended thinking) → Critique (Sonnet 4.6) → Revise (Opus 4.7) → Quality Gate (deterministic checks per Voice Document v0.1 §6).
- Voice Document loaded at synthesis time from the markdown source.
- Patterns written to `briefing_patterns` table.
- Briefing room renders the Patterns. Two-Pattern layout per the product preview HTML.

**Gate.**
- Manual pipeline invocation produces ~1-3 standard Patterns
- Patterns render in the room with title + analysis paragraph + six-question block + recommended_moves block
- Pattern quality passes the gate (banned vocab, length bounds, evidence validation, structural compliance, hedging density)
- Total cost per pipeline run ≈ $0.20 — $0.30 (matches v0.2 Cost Model baseline minus the v0.4 additions)

**Estimated PR size.** Large. Probably 3 sub-PRs:
- B.2a LLM provider wrapper + Stage 3.3 Enrich
- B.2b Stage 3.4 Cluster + cluster persistence
- B.2c Stage 5 Synthesis (Draft/Crit/Revise/Gate) + Pattern rendering in the room

**Dependencies.** B.1 must be merged. Anthropic API key in Cloudflare Workers Builds env + Edge Function secrets.

**Risk.** Synthesis quality on first cut won't meet the voice document's bar. Mitigation: the Evaluation Harness (B.7) is downstream, but a manual eval pass on first 5-10 generated Patterns is mandatory before claiming B.2 done. If voice quality is off, iterate on prompts before moving to B.3.

---

### B.3 — Watchlist Triggers (parser + 5 type matchers + UI)

**Goal.** Operator can write a trigger in natural language, confirm the parse, and see it fire on the next pipeline run.

**Scope.**
- Trigger storage at `briefing_watchlist_triggers` table: id, natural_language, parsed_query (jsonb), rephrased_for_confirmation, status, workspace_id, created_at
- Trigger parser at `src/briefing/lib/triggers/parser.ts` — LLM-driven parse to one of 5 trigger types (Sonnet 4.6 with strict schema enforcement). Confidence-gated per Watchlist Trigger Grammar §1.1.
- Five matchers at `src/briefing/lib/triggers/matchers/` — one per type (single_event, aggregation, threshold, adjacency, silence).
- Matcher runner inside the pipeline orchestrator (Stage 3.3.5 — between Enrich and Cluster).
- Trigger fires recorded in a `briefing_trigger_fires` table; surfaced in the right-rail "Triggers fired today" section.
- New UI surface: "Watch List" tab in the topbar nav. Lists armed triggers, edit/disable controls. Add-trigger flow with NL input + structured parse preview + confirmation.

**Gate.**
- Operator can write "Alert me when Segment changes their pricing" → parses into `single_event` → confirmation flow → saved as armed
- Next pipeline run fires the trigger on a matching enriched item
- Trigger fire appears in the right rail of the briefing
- Validation suite passes 90%+ of the 30+ test inputs from Watchlist Trigger Grammar §6

**Estimated PR size.** Large. Probably 2-3 sub-PRs:
- B.3a Parser + 5 matchers + schema
- B.3b UI surface for armed triggers + add-trigger flow
- B.3c Validation suite + edge-case handling

**Dependencies.** B.2 must be merged (patterns surface so the briefing has body).

**Risk.** Parser confidence calibration. Mitigation: the validation suite from the spec is the bar; if 90%+ pass rate isn't hit before close, iterate the parser prompt.

---

### B.4 — Periphery Detection (Coverage obligation)

**Goal.** Periphery candidates appear in the right-rail "Periphery · consider watching" surface.

**Scope.**
- Stage 3.3b Periphery Detection runs in parallel with Stage 3.4 Cluster, per spec §3.3b.
- Scoring math at `src/briefing/lib/periphery/`:
  - Co-occurrence scoring (count of items where off-watchlist entity appears alongside watched entity)
  - Investor map scoring (uses Corporate Ownership Map from spec §3.0)
  - Vocabulary overlap scoring (pain-tag overlap)
  - Hiring overlap scoring (talent pool intersection)
  - Buyer-overlap scoring (case-study + customer-page joint mentions)
- Periphery candidates stored in `briefing_periphery_candidates` table with per-signal scores + total + parent run_id.
- Early-exit optimization per Cost Model v0.2 §7.4 (skip remaining signals if co-occurrence below threshold).
- Right-rail UI surface for periphery candidates with the three action buttons (Add to watchlist / Snooze / Dismiss).
- Add-to-watchlist action creates an entity in the watchlist (writes to a new `briefing_watchlist_entities` table) + records the periphery score history for that entity.

**Gate.**
- Pipeline run produces 0-5 periphery candidates with valid scoring
- Candidates render in the right rail with scores + reasoning
- Add/Snooze/Dismiss actions work and persist
- Cost per pipeline run ≈ baseline + ~$0.010 (matches Cost Model v0.2 §1.1)

**Estimated PR size.** Medium.

**Dependencies.** B.3 must be merged (the trigger/watchlist concept exists). Corporate Ownership Map static JSON resource needs to be authored — small one-time artifact, can live in `deliverables/specs/briefing/corporate-ownership-map.json`.

**Risk.** Periphery surface fires too often → operator dismisses + loses trust. Per Design Posture §5 ("precision over recall" for provocative surfaces), tune scoring threshold tight; expect 0-2 candidates per week, not 5+.

---

### B.5 — Contrarian Synthesis (Framing obligation)

**Goal.** First Contrarian Pattern surfaces when data refutes the operator's stated ICP, competitive set, or value prop.

**Scope.**
- Stage 5e Contrarian Synthesis at `src/briefing/lib/synthesis/contrarian.ts`. Sonnet 4.6 + extended thinking per spec §5e. One call per cluster being evaluated against user assumptions.
- Contrarian voice register added to the Voice Document (a second exemplar set + register notes). Voice Document v0.1 §7 already references this — voice doc needs an addendum authored.
- ContrarianPatterns stored in `briefing_patterns` table with `pattern_type='contrarian'` (same table as standard patterns per the schema decision in B.0).
- Contrarian Briefing right-rail surface — separate from the main briefing, cooler register, surfaces 0-2 Contrarian Patterns per run.
- Periodic ICP challenge (quarterly cadence per spec §3.2) — separate cron schedule fires once per quarter; compares operator's stated ICP against actual signal velocity; surfaces ICP-challenge Pattern when discrepancy exists.

**Gate.**
- Pipeline run produces 0-1 Contrarian Patterns per week (most weeks: zero, by design)
- Contrarian Patterns render in the right rail with the cooler voice register
- Voice document addendum exists at `deliverables/specs/briefing/signal_console_voice_document_v0.1.md` (or a sibling file with contrarian addendum)
- Manual test: deliberately mis-stated ICP triggers a Contrarian Pattern on the next run

**Estimated PR size.** Medium-large. Probably 2 sub-PRs:
- B.5a Contrarian synthesis stage + voice doc addendum
- B.5b Contrarian Briefing right-rail UI + periodic ICP challenge cron

**Dependencies.** B.4 merged. Voice document addendum authored.

**Risk.** Contrarian quality is harder to evaluate than standard quality. Mitigation: B.7 Evaluation Harness handles retroactive scoring (Patterns marked Noise that later prove correct count as wins); contrarian-specific eval test set authored as part of B.7.

---

### B.6 — Audit Envelopes + show-your-work UI (Defensibility obligation)

**Goal.** Every Pattern has a viewable audit envelope. The operator can expand any Pattern and see the cluster, the hydrated context, the draft / critique / revise chain, the quality gate decisions, and the total cost.

**Scope.**
- Audit envelope writes at every synthesis point (Draft, Critique, Revise, Gate). Each stage writes its model call (prompt, response, model_v hash, tokens in/out, cost) to the parent envelope's `*_jsonb` field.
- Audit envelope subsystem at `src/briefing/lib/audit/` — `recordSynthesisStage`, `recordSurfacing`, `recordUserAction` helpers.
- Show-your-work UI per the product preview HTML — collapsible panel inside each Pattern showing cluster (4 items), hydrated context (ICP version, voice document version, active deals snapshot, watchlist triggers), synthesis path (each stage with model + tokens + cost), quality gate decisions (banned vocab pass, length bounds pass, etc.), total cost.
- User-action recording — when operator clicks Apply Move, the action + the destination + the draft content gets appended to the audit envelope.
- Envelope retention policy per spec §5: 12 months hot in Postgres, 7 years cold (deferred — cold storage is post-v1).
- `briefing_pattern_feedback` table from B.0 gets wired into the audit envelope when operator marks Used/Met/Noise.

**Gate.**
- Every Pattern surfaces with an audit envelope id and a working show-your-work panel
- Cost telemetry in the briefing footer reads the run-level total from audit envelopes
- Manual decision review: pick a Pattern from a prior run, expand audit envelope, verify every decision is reconstructable
- Storage budget: envelopes average <100 KB per Pattern

**Estimated PR size.** Medium-large. Probably 2 sub-PRs:
- B.6a Envelope subsystem + writes at every stage + storage
- B.6b Show-your-work UI + behavioral feedback wire-in

**Dependencies.** B.5 merged.

**Risk.** Envelope storage growth at scale. Cost Model v0.2 §1.4 projects ~3-5 MB per user per week. Mitigation: compression optimization deferred per Cost Model v0.2 §7.2; revisit when user count exceeds 500.

---

### B.7 — Evaluation Harness

**Goal.** Synthesis quality regressions are caught before they ship. Production sampling fires weekly. Drift detection works.

**Scope.**
- Pre-merge harness gate per Evaluation Harness v0.2 §3 — runs against the 40-60 case standard synthesis test set when synthesis prompts change. Lives in `tests/harness/briefing/` with CI integration.
- Contrarian voice harness — 40-60 case contrarian test set per Harness v0.2 §4.
- Periphery candidate harness — in-cycle test set per Harness v0.2 §5.
- Production sampling — weekly job samples 5% of envelopes + 100% of Noise-marked + 100% of human-review-queue. Each sample replays through current prompts; scores against historical.
- Retroactive correctness scoring per Harness v0.2 §6 — Patterns marked Noise on first read that later prove correct (cluster persistence growth, similar-theme Used marks, deal action lookups) count as wins.
- Harness results dashboard (small read-only surface inside Briefing — "Quality" tab in Settings) showing the composite scores over time.
- Harness cost cap per user separate from production-pipeline ceiling, per Cost Model v0.2 §6.

**Gate.**
- CI gate active on every PR that touches synthesis prompts or the voice document
- First weekly production sampling run completes; results render in the quality dashboard
- Retroactive scoring identifies at least one historical Pattern correctly (synthetic test where a Pattern was marked Noise but later evidence accumulated)

**Estimated PR size.** Large. Probably 3 sub-PRs:
- B.7a Pre-merge harness gates (standard, contrarian, periphery)
- B.7b Production sampling job + harness-cost ceiling
- B.7c Retroactive correctness scoring + quality dashboard

**Dependencies.** B.6 merged (audit envelopes are the input to the harness). 8-12 weeks of production envelope history is needed before retroactive scoring is meaningful — B.7c can ship before that data exists, but its first useful output is ~Q3.

**Risk.** Harness cost balloons during prompt-edit-heavy weeks. Mitigation: harness-cost ceiling at $0.50/user/week (Tier 1) per Cost Model v0.2; downsample sampling rate to 50% when ceiling hits 80%.

---

### B.8 — Cost tracker + ceilings + degradation policy

**Goal.** Per-user cost is bounded. The operator sees their cost-this-week vs ceiling in the footer. Throttle and pause states are tested + operational.

**Scope.**
- CostTracker singleton at `src/briefing/lib/cost/tracker.ts` wrapping every LLM call. Tracks per-call cost, per-stage cost, per-pipeline-run cost, per-week cost.
- Cost ceiling enforcement per Cost Model v0.2 §6:
  - Tier 1: $3.00/week pipeline + $0.50/week harness
  - Tier 2: $7.00/week pipeline + $1.50/week harness
  - Tier 3: $20.00/week per seat pipeline + $5.00/week per seat harness
  - (Pricing tiers themselves stale per ADR-006; ceilings are still the engineering target)
- Degradation policy per Cost Model v0.1 §5.3 carried forward:
  - 80% of ceiling → warning surfaced in Briefing
  - 100% → throttle (Sonnet substitution for Opus where quality permits + relevance threshold tightening)
  - 150% → pause; pipeline runs skip until next week reset OR operator manually unpauses
- Cost telemetry in the footer of every Briefing — `Cost this week: $X.XX / $Y.YY` with progress bar.
- Override flow — operator can override a throttle/pause for one run (logged for friction tracking).

**Gate.**
- Synthetic test: drive a pipeline run that hits 80% → warning surfaces; 100% → throttle confirmed; 150% → pause confirmed
- Footer shows real cost telemetry for every run
- Override flow works end-to-end + logs the override

**Estimated PR size.** Medium.

**Dependencies.** B.7 merged (harness-cost ceiling shares infrastructure).

**Risk.** Ceiling too tight, breaks normal usage. Mitigation: monitor real usage over the first 4 weeks post-deploy; adjust ceilings if real Tier 1 baseline exceeds projections.

---

### B.9 — Briefing Compose + final surface polish + face re-skin

**Goal.** v1 ships. The Briefing room renders with the bright canon styling, the briefing-lead generation works, all surfaces are polished + accessible.

**Scope.**
- Stage 3.8 Briefing Compose per Recipe Layer Spec — runs once per Briefing assembly to generate the one-line lead at the top (Sonnet 4.6, ~250 tokens). Reads the surfaced Patterns + Triggers + Deal-Watch alerts; produces the "The Read This Week" lead.
- Face re-skin: the 17 May 2026 product preview HTML uses dark + gold + Fraunces. Canon Part II §1 says bright-only + DM Serif Display + canonical orange `#ff6b1c`. Re-skin every surface in the Briefing room to canon styling without disturbing the information architecture.
- Accessibility pass — keyboard nav, screen-reader labels on every interactive element, color-contrast verification on the bright canon palette.
- Performance pass — code-split the synthesis-display components so the initial Briefing render is fast even when audit envelopes are large.
- Empty-state, sparse-state, error-state coverage per canon Part II §6.
- Onboarding flow — first-time-user briefing surface explaining the room's job, the trigger concept, and the contrarian + periphery surfaces.

**Gate.**
- Briefing surface matches canon styling at every breakpoint
- Briefing Compose generates a sensible one-line lead given a populated run
- Accessibility audit passes (Lighthouse a11y score ≥ 95)
- Performance audit passes (LCP ≤ 2.5s, room interactive within 3s)
- Empty / sparse / error states all designed + tested
- Founder approval on the face per the canon §4.21 mind

**Estimated PR size.** Large. Probably 3 sub-PRs:
- B.9a Briefing Compose stage + lead rendering
- B.9b Face re-skin (CSS rewrite to canon styling)
- B.9c Accessibility + performance + state coverage + onboarding

**Dependencies.** B.8 merged. Founder direction on first-time-user onboarding shape.

**Risk.** Face re-skin reveals information-architecture gaps the dark-mode preview hid (contrast, density). Mitigation: render against the canon palette early (during B.0 even) so we catch density issues before B.9 face polish.

---

## 3. Cross-cutting concerns (not phases, but threaded through)

### 3.1 Posthog feature flags

| Flag | Phase | Default | Purpose |
|---|---|---|---|
| `briefing_v1_room` | B.0 | off | gates room render at `/briefing/` |
| `briefing_v1_pipeline` | B.1 | off | gates pipeline runs (Edge Function) |
| `briefing_v1_synthesis` | B.2 | off | gates LLM synthesis calls |
| `briefing_v1_triggers` | B.3 | off | gates trigger parsing + matching |
| `briefing_v1_periphery` | B.4 | off | gates periphery detection |
| `briefing_v1_contrarian` | B.5 | off | gates contrarian synthesis |
| `briefing_v1_audit` | B.6 | off | gates audit envelope writes |
| `briefing_v1_harness` | B.7 | off | gates harness scheduling |
| `briefing_v1_cost_ceilings` | B.8 | off | gates ceiling enforcement |
| `briefing_v1_compose` | B.9 | off | gates Briefing Compose stage |

Default-off for every flag during build; founder enables per-flag for own user as each phase ships.

### 3.2 Test discipline

Every phase adds vitest unit tests + at least one Playwright walk. The harness from B.7 adds its own test set, separate from the unit suite. Total test count grows by ~200-300 across the Briefing build.

### 3.3 Deliverables/specs/briefing/ updates as build progresses

As we hit schema decisions, prompt iterations, or material deviations from the v0.4 spec, those go back into `deliverables/specs/briefing/` as versioned amendments — not edits to v0.4 itself. Pattern: `signal_console_recipe_layer_spec_v0.5_amendment_<date>.md` when v0.4 needs a real change. Spec stays as authored; amendments preserve the iteration trail.

### 3.4 Voice document evolution

The voice document v0.1 is the canonical voice contract. As Patterns get marked Used / Met / Noise during real operator use, the voice doc's exemplars + anti-exemplars list evolves. v0.1 → v0.2 lands as a deliverables/specs/briefing/ versioned update + a session log entry. The model imitates the most-recent voice doc.

---

## 4. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Edge Function timeout on a full pipeline run | High | Medium | Per-stage invocations via internal pg_net callbacks; queue table tracks state |
| LLM cost runs hot on day 1 | Medium | High | B.8 cost ceilings ship at the same time as the first pipeline run hits real volume; throttle + pause states tested in synthetic before going live |
| Voice document quality drift between v0.1 exemplars and actual model output | High | Medium | B.7 Evaluation Harness pre-merge gate on every voice-affecting prompt edit |
| Cross-room getState() adapters can't cleanly read legacy localStorage | Medium | High | Spot-check 3 rooms (Discovery, Call Planner, Outbound) during B.0; adjust RoomStateContract shape if needed before committing |
| Operator-facing experience feels "uncanny" or condescending | Medium | High | Voice document is the load-bearing artifact; precision over recall on provocative surfaces (B.4 + B.5) tuned tight |
| Sources break or change format | High over time | Low per source | Each source fetcher catches + reports its own failures; pipeline runs in degraded mode with a banner |
| Anthropic API rate limits | Low at single-user scale | Medium | Retry-with-backoff in the LLM provider wrapper; queue patterns at scale |

---

## 5. Open sub-decisions deferred to specific phases

| Decision | Phase | Notes |
|---|---|---|
| Final schema column types for `briefing_patterns.body` (text vs jsonb structured) | B.0 | Lean toward jsonb structured so the six_questions etc. are queryable; spec doesn't lock |
| Cluster persistence strategy | B.2 | Clusters span runs; do we keep a row across runs with appended evidence, or write a new row per run? Tradeoff: continuity vs row-bloat |
| LLM provider — Anthropic exclusively or include OpenAI / Bedrock for redundancy? | B.2 | v1 exclusive Anthropic; redundancy is post-v1 |
| Voice document edit UI vs PR-only | B.9 stretch | If we ship Briefing v1 without operator UI, voice edits happen via deliverables/ PRs |
| Briefing cadence configurability | post-v1 | Weekly Monday 06:00 UTC default; configurable cadence is a knob to add when operators ask for it |
| Multi-user readiness — adapter user_id parameter retrofit | when multi-user lands | Read Interface Contracts §1.6 already commits to the shape |

---

## 6. What "v1 done" means

v1 of the Briefing room is done when:

- Every phase B.0 → B.9 has shipped + the per-phase flag is on for the founder's own user
- A weekly Monday 06:00 pipeline run completes successfully against real data
- The operator can read the briefing, mark Patterns Used / Met / Noise, click an Apply Move CTA to draft into a destination room, see the audit envelope for any Pattern
- Triggers can be armed in natural language + fire correctly
- Periphery candidates surface with valid scoring
- Contrarian Patterns surface when the data refutes operator assumptions
- Cost telemetry shows in the footer + ceilings enforce
- The harness runs pre-merge on every synthesis-prompt edit + samples production weekly

v1 is the floor; v2 (multi-user, full source coverage per Intelligence Coverage Audit, operator-editable voice doc, cross-account benchmarking, etc.) is post-v1 polish.

---

*End of Briefing Build Phase Plan v0.1.*

Ref: deliverables/adr/adr-006-briefing-room-2026-05-23.md (the seven locked decisions)
Ref: deliverables/specs/briefing/ (the 13-document spec set this plan cashes out)
Ref: CLAUDE.md §4.21 (the Briefing room mind)
Ref: deliverables/adr/adr-005-data-layer-parity-2026-05-20.md (the Phase 4.5 retrofit work this sequences against)
