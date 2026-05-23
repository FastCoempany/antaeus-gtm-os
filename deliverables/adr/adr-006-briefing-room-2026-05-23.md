# ADR-006 — Briefing room as separate room from Signal Console (substrate + surface split)

**Date:** 2026-05-23
**Status:** Approved (founder, 2026-05-23)
**Supersedes:** the Phase B scope from ADR-004 §"Phasing"

---

## Context

On 17 May 2026 the founder authored thirteen design documents specifying a substantially evolved Signal Console concept. The specs (now living at `deliverables/specs/briefing/`) committed to a **provocative posture** — the system surfaces what the user did not ask for (Coverage), challenges interpretations the user has committed to (Framing), and preserves enough state to defend every Pattern months later (Defensibility).

The architecture is a multi-stage LLM pipeline (Context Hydration → Ingest → Filter → Enrich → Periphery → Cluster → Synthesize [Draft/Critique/Revise/Gate] → Contrarian → Score → Surface → Briefing Compose), wrapping every synthesis in an immutable Audit Envelope, gated by a Voice Document, watched by an Evaluation Harness.

The user-facing surface is a weekly briefing document — classification banner, dated lead, two to three Patterns with attribute grids and six-question rows, a right rail showing Trigger fires + Deal-Watch alerts + Contrarian Briefing + Watch List + Periphery Candidates, and a footer showing pipeline health + cost telemetry.

The 17 May specs use "Signal Console" as the brand name. The same name is already in use by the existing room at `/signal-console/`, which we just finished retrofitting through Phase 4.5 / Tier 1 / Step 5 (PR #149 merged 2026-05-23). That room manages accounts, signals, heat, and cross-room handoffs to Outbound / Cold Call / Call Planner / Deal Workspace.

## The decision

### 1. Naming

The new room is called **Briefing**. The existing room at `/signal-console/` keeps its name and its job.

### 2. Substrate + surface split (path C)

The existing Signal Console is the **data substrate** — it owns the `signal_console_accounts` + `signals` Postgres tables, the heat engine, the account-management UI, the cross-room handoff plumbing, the realtime subscriptions, and the enrichment-server integration.

The Briefing room is the **intelligence surface** — it reads from the substrate (via `data.signalConsoleAccounts.list()` + `data.signals.list()`) and from every other room's `getState()` contract, runs the Recipe Layer pipeline, and surfaces Patterns + Triggers + Deal-Watch + Contrarian + Periphery.

The two rooms share data; they do not share concerns. The substrate keeps writing through its own paths; the Briefing never writes to the substrate. Cross-room writes from the Briefing happen via the `recommended_moves[].destination` routing — the Briefing produces a draft, the operator reviews and saves to the destination room.

### 3. Path C for the cross-room read dependencies

The Briefing room hydrates context from nine modules (per `gtm_os_read_interface_contracts_v0.1.md`):

- ICP Studio
- Discovery Studio
- Call Planner
- Outbound Studio
- Asset Builder
- Active Deals (Deal Workspace)
- Watchlist Triggers (a new module to be built)
- Voice Document (a new module — operator-tunable, room-local)
- Behavioral Feedback (a new module — built into the Briefing)

Six of these (ICP, Discovery, Call Planner, Outbound, Asset Builder, Deal Workspace) are existing rooms that haven't completed their Phase 4.5 retrofit yet. **Path C is locked**: build the Briefing now against the legacy localStorage shapes those rooms still write to; the `getState()` contract sits behind an adapter layer that absorbs the legacy-vs-cloud format difference. As each consuming room hits its own Step 5, the adapter for that room flips from legacy shape to cloud shape with no Briefing-side code change.

### 4. Scope for v1

The full Recipe Layer v0.4 ships, **to the extent path C does not force compromises**. Specifically:

- Full Coverage / Framing / Defensibility obligations (Periphery + Contrarian + Audit Envelopes)
- All five Trigger types (single_event, aggregation, threshold, adjacency, silence)
- Voice Document with five exemplars + banned vocab + structural rules + hedging rules
- Evaluation Harness with pre-merge gates + production sampling (capped at the per-user harness ceiling)
- Sources per the Intelligence Coverage Audit, prioritizing the tier-A free sources first

What path C forces to hold:

- Any pipeline stage that depends on a `getState()` shape only achievable after another room's Step 5 (i.e. requires Supabase reads of data still living in localStorage) waits for that room. The adapter logs the gap and the pipeline runs in degraded mode with a banner on the Briefing: *"Discovery Studio state unavailable — relevance scoring may be less accurate."*

### 5. Phase B supersession

ADR-004 §"Phasing" defined Phase B as "register the signal-decay generator + ship the Dashboard 'this week's reads' card." That scope retires. The Briefing room absorbs Phase B entirely — the Patterns produced by the Recipe Layer pipeline ARE the observations Phase B was supposed to write into the orchestration layer's observations ledger, but at much higher quality, with audit envelopes attached, with a richer pipeline behind them. The signal-decay generator becomes one special case of the broader Trigger grammar (specifically `silence` and `threshold` triggers).

The `observations` table from Phase A (migration `20260519180000`) stays — Pattern objects either land there or in a parallel `briefing_patterns` table; the schema decision is the first sub-decision of the build plan and is not locked here.

### 6. Spec promotion

The 17 May spec set is promoted to canon-level deliverables at `deliverables/specs/briefing/`. The specs were preserved as authored; the only addition is `00-naming-note.md` documenting the Signal Console → Briefing rename. Where the specs say "Signal Console" they refer to the new Briefing room.

The specs are the binding contracts for the build. Any deviation from a spec requires either updating the spec or filing a new ADR that supersedes part of the spec.

### 7. Pricing

The cost model's pricing tier section is stale per founder direction and is ignored. The per-stage cost line items remain the engineering target.

## Alternatives considered

### Replace

Retire the existing Signal Console, repoint `/signal-console/` at the new room. Rejected because it throws away the account-management substrate we just retrofitted through five Step 0→5 PRs and forces a hard cutover. The two rooms have different jobs; collapsing them into one would either lose Briefing's intelligence surface or lose the substrate's account-management discipline.

### Coexist as siblings

Two parallel rooms at the same conceptual level. Rejected because it forces the operator to answer "where do I add a watched company" with "it depends," which is the kind of cognitive resistance Part III §2 of canon explicitly bans.

### Substrate + surface split (chosen)

The two rooms have different jobs at different altitudes — substrate (data + management) vs surface (intelligence + briefing). The split respects what each room does well and reuses the substrate work. The mental model is clean: *Signal Console is where I track accounts; Briefing is what the system tells me each week.*

## Consequences

### Positive

- The Phase 4.5 Tier 1 work on Signal Console keeps its value as the foundation of the Briefing room
- The Briefing can start construction immediately; it doesn't wait for the rest of the Tier 1 retrofit (DW + Outbound)
- Each room's `getState()` contract becomes a natural Step 3 deliverable for that room's eventual Phase 4.5 retrofit — once the contract exists, migrating the room to cloud is just shifting the read source under the contract
- Phase B's observable payoff happens at a much higher altitude than originally scoped
- The voice document gets a place in canon (Part III §11 is the closest analogue; the voice document expands it into a per-stage editorial contract)

### Negative

- Two rooms share the "Signal Console" concept in the founder's mental model from the 17 May design phase, and the renaming will produce some confusion until the canon update settles
- Path C means the Briefing's hydration adapter has to handle both legacy localStorage and cloud-native data for every consuming room, increasing adapter complexity
- The build is bigger than any single Phase 4.5 retrofit room — closer in scope to ADR-004's Phase A through Phase F combined, but reframed
- The full v0.4 scope means significant LLM cost from day one; the cost-ceiling enforcement from the cost model needs to ship in the first cut, not as polish

### Neutral

- Tier 1 retrofit work for Deal Workspace + Outbound Studio is **not paused** — they continue in parallel. Each retrofit's Step 3 grows a `getState()` shim alongside its dual-write work. The Briefing benefits as each room ships.
- Phase B's `gtmos_signal_room_health` cross-room key, kept alive as a Signal Console → Dashboard mirror in Step 5, can retire once the Briefing room is the operator's actual destination for "what's the read this week." The Dashboard's command-intelligence rail keeps its current job (ranked what-to-act-on across rooms) but no longer needs to act as a degraded version of the Briefing.

## Implementation plan (high level)

Detailed build phasing lives in `deliverables/specs/briefing/01-build-phase-plan.md` (to be authored after this ADR lands). At a glance:

| Phase | Scope | Gate |
|---|---|---|
| **B.0** | Schema + skeleton room + HydratedContext adapter shells for nine modules (legacy-shape adapters per Path C) | Schema lands; adapters compile; room renders an empty briefing |
| **B.1** | Sources (tier-A subset: HN Algolia, TechCrunch RSS, PR Newswire, Wikipedia pageviews, GitHub releases, Tier B HTML diff) + ingest + filter | One full pipeline run produces an `enriched_items[]` table |
| **B.2** | Clustering + standard synthesis (Draft → Critique → Revise → Gate) with the Voice Document | First Pattern surfaced in the briefing surface end-to-end |
| **B.3** | Watchlist Triggers (parser + 5 type matchers + UI for arming/listing triggers) | Operator can write a trigger and see it fire on the next run |
| **B.4** | Periphery Detection (parallel scoring track) | Periphery candidates appear in the right-rail surface |
| **B.5** | Contrarian Synthesis (parallel synthesis path against stated assumptions) | First Contrarian Pattern surfaces when data refutes ICP/competitive-set |
| **B.6** | Audit Envelopes wired across every synthesis + surfacing + user action; show-your-work UI | Every Pattern has a viewable audit envelope |
| **B.7** | Evaluation Harness (pre-merge gates + production sampling + retroactive scoring) | Harness CI runs on every prompt edit; production sampling fires weekly |
| **B.8** | Cost tracker + ceilings + degradation policy | Daily/weekly ceilings enforce; throttle/pause states tested |
| **B.9** | Briefing Compose + final surface polish + face re-skin to canon Part II §1 bright direction | The 17 May product-preview HTML's information architecture, rendered in bright/orange/DM-Serif canon styling |

Each phase is its own PR or PR series. Each lands behind a Posthog flag (`briefing_*`) so rollback is instant.

## Open questions deferred

These are real questions the build plan will need to answer, recorded here so they aren't lost:

1. **Pattern storage** — extend the existing `observations` table from Phase A or add a separate `briefing_patterns` table? Audit envelopes definitely get their own table (`briefing_audit_envelopes`).
2. **Pipeline runtime** — Supabase Edge Function on a pg_cron schedule (like the heartbeat) or a separate background-job service?
3. **LLM provider abstraction** — direct Anthropic SDK calls or wrap behind a provider-agnostic client? Cost ceilings + model_v hash tracking suggest a wrapper is worth the cost.
4. **Voice document editing UI** — where does the operator edit the voice document and the exemplars? A new room or a Settings-like surface inside Briefing?
5. **Behavioral Feedback module shape** — the spec references it but doesn't specify the storage. Looks like a new noun.
6. **Briefing cadence default** — weekly Monday 06:00 UTC per the spec example, or operator-configurable from the start?
7. **Multi-user readiness** — beta is single-user. `getState()` contracts currently take no `user_id` parameter (per the read-interface-contracts spec §1.6). When multi-user lands, every contract grows a parameter. Decision: defer until multi-user is on the roadmap.

---

## Refs

- `deliverables/specs/briefing/` — the 17 May 2026 spec set (13 files)
- `deliverables/adr/adr-004-orchestration-layer-foundation-2026-05-19.md` — Phase B scope this supersedes
- `deliverables/adr/adr-005-data-layer-parity-2026-05-20.md` — the Phase 4.5 retrofit each consuming room needs to close
- PR #149 — Signal Console Step 5 (substrate complete)
- CLAUDE.md §4.X — Briefing room mind (to be added in canon update)
- CLAUDE.md §4.7 — Signal Console mind (proposed rewrite pending founder approval)

## Founder approval block

- Date approved: 2026-05-23
- Conditions / amendments: pricing tiers in the cost model ignored per direction
- Signed: founder (mrcoe7@gmail.com)
