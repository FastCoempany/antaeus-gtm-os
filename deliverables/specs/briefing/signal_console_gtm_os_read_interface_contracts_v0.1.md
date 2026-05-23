# Signal Console — GTM OS Read Interface Contracts

**Version:** 0.1
**Date:** 17 May 2026
**Status:** Draft for review
**Phase:** Design Phase 3 (Recipe Layer Spec v0.2 §5)

---

## 0. Purpose

Signal Console depends on the rest of the GTM OS for its understanding of the user. Without ICP Studio, every enrichment call is unanchored. Without Discovery Studio, every `recommended_moves` destination is a guess. Without Call Planner, the system can't recognize when an item contradicts an existing objection handler. Without Asset Builder, stale battlecard detection is impossible.

The Recipe Layer's Stage 3.0 (Context Hydration) pulls this state at the start of every pipeline run. This document specifies the **read interface contracts** each module must expose for that to work.

The discipline this document enforces:

1. **Each module is the system of record for its own state.** Signal Console reads, never writes. (Writes happen through `recommended_moves[].destination` routing, which is a separate, explicit, user-confirmed flow.)
2. **The interface is the contract, not the implementation.** Modules can evolve their internal data structures freely; the read interface stays stable.
3. **The contract surface is minimal.** Only what Signal Console actually needs. No leaking internal state. No "we might need this later" fields.
4. **Reads are synchronous, cheap, and side-effect-free.** They run at the start of every pipeline run; they cannot block, cannot fail destructively, and cannot mutate state.
5. **Schema is versioned.** When the contract itself changes (rare), `schema_version` increments. When the underlying data changes (constant), `last_modified_at` updates. Signal Console handles both.

---

## 1. Design principles

### 1.1 Read-only, period

Signal Console never writes through these interfaces. The write path is entirely separate: `recommended_moves[].destination` produces draft artifacts that the user reviews and explicitly saves to the destination module. The read interface contract has no `setState()` or `updateState()` methods. Modules expose `getState()` only.

### 1.2 Stable contracts, evolving modules

A module's contract represents the *minimum surface Signal Console needs*. A module's internal state can be much larger — fields, history, drafts, user preferences that have nothing to do with Signal Console. The contract returns only the subset Signal Console cares about, transformed into the contract shape.

When the module evolves its internal data, the contract shouldn't break. The module's responsibility is to keep the contract shape stable; the internal-to-contract transform absorbs changes.

When the contract itself needs to change (a new field Signal Console needs, or a deprecation), increment `schema_version`. Signal Console runs version-aware parsers and handles backward compatibility for one major version.

### 1.3 Staleness is named, not hidden

Every read returns a `last_modified_at` timestamp. The user changed their ICP yesterday? `last_modified_at` reflects it. The user hasn't touched ICP Studio in 6 months? `last_modified_at` is 6 months old.

Signal Console uses this in two ways:
- The Hydrated Context log records the timestamp; debugging is possible
- Patterns can include "your ICP was last updated 6 months ago — consider refreshing" prompts when the module's state is suspiciously stale relative to the pipeline run frequency

### 1.4 Degraded reads are first-class

If a module is unavailable, throws, or returns malformed state, Signal Console runs in **degraded mode** with that module's state absent. The pipeline doesn't fail; it logs the gap and surfaces a banner on the Briefing: "Discovery Studio state unavailable — relevance scoring may be less accurate."

This is non-negotiable. Pipeline reliability does not depend on every module being healthy. Any single module failure is a degradation, not an outage.

### 1.5 No side effects, no async, no blocking

`getState()` is a pure function that reads from a state store and returns a structured object. No network calls. No analytics events. No "user opened Signal Console" tracking. Synchronous return within milliseconds.

If a module's underlying storage is async (e.g., IndexedDB rather than localStorage), the module is responsible for maintaining a synchronous in-memory cache that the read interface returns from.

### 1.6 Single-user now, multi-user-aware later

Beta is single-operator. The contracts below take no `user_id` parameter. When the product goes multi-user, every contract grows a `user_id` parameter and modules namespace their state. The shape of the returned object stays the same.

This is the only forward-compatibility concession baked into the v0.1 contracts.

---

## 2. The interface convention

Every module exposes a single function:

```typescript
function getState(): ModuleStateContract
```

Returning:

```typescript
type ModuleStateContract = {
  schema_version: string         // e.g. "1.0"
  last_modified_at: string       // ISO-8601
  state: ModuleSpecificState     // see per-module sections
  health: "ok" | "degraded" | "uninitialized"
  health_reason?: string         // if not "ok"
}
```

Three health states:

- **ok** — module is configured and has state to return
- **degraded** — module has partial state (e.g., ICP defined but no scoring criteria yet); Signal Console proceeds with what's available
- **uninitialized** — module exists but the user hasn't set it up; Signal Console falls back to defaults and prompts the user

The implementation pattern is module-namespaced. Within `gtmos_app`:

```javascript
// In each module
window.gtmos.icpStudio.getState()
window.gtmos.discoveryStudio.getState()
window.gtmos.callPlanner.getState()
window.gtmos.outboundStudio.getState()
window.gtmos.assetBuilder.getState()
window.gtmos.activeDeals.getState()
window.gtmos.watchlistTriggers.getState()
window.gtmos.voiceDocument.getState()
window.gtmos.behavioralFeedback.getState()
```

Signal Console's Context Hydration stage calls each in turn (or in parallel — they're side-effect-free), combines results into a `HydratedContext`, caches for the pipeline run.

---

## 3. Per-module contracts

### 3.1 ICP Studio

**Used by:** Stage 3.3 Enrich (user_relevance_score), Stage 3.4 Cluster (account-relevance check), Stage 3.5 Synthesize (why-it-matters context).

#### Contract

```typescript
type ICPStudioState = {
  schema_version: "1.0"
  last_modified_at: string
  health: "ok" | "degraded" | "uninitialized"
  health_reason?: string
  state: {
    icp_summary: string                          // 1-3 paragraphs, plain prose
    icp_criteria: ICPCriterion[]
    disqualifiers: string[]                      // hard-no signals
    target_company_size: { min: number; max: number }   // headcount band, optional
    target_revenue_band: { min_usd: number; max_usd: number }  // optional
    target_industries: string[]                  // optional
    target_geographies: string[]                 // optional
    decision_maker_titles: string[]              // who buys this
    influencer_titles: string[]                  // who shapes the decision
  }
}

type ICPCriterion = {
  criterion: string                              // human-readable description
  weight: number                                 // 0.0 to 1.0
  evidence_signals: string[]                     // observable signals that indicate this criterion
}
```

#### Example (populated)

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-14T09:32:00Z",
  "health": "ok",
  "state": {
    "icp_summary": "Series B-D B2B SaaS companies (50-500 employees) with a founder-led or recently-hired CRO who is rebuilding their sales motion. Engineering-led products that are moving from PLG to PLG+sales. Annual revenue $5M-$50M.",
    "icp_criteria": [
      {
        "criterion": "Has a CRO or VP Sales hired within last 12 months",
        "weight": 0.9,
        "evidence_signals": ["exec_move announcement", "leadership page diff", "podcast appearance announcing new role"]
      },
      {
        "criterion": "Recent funding round (Series B-D)",
        "weight": 0.7,
        "evidence_signals": ["Crunchbase News funding event", "TechCrunch funding coverage", "press release"]
      },
      {
        "criterion": "Engineering-led product moving toward enterprise",
        "weight": 0.8,
        "evidence_signals": ["new enterprise landing page", "Strategic AE role posted", "Enterprise tier added to pricing"]
      }
    ],
    "disqualifiers": [
      "Pre-Series A (too early)",
      "Already at 1000+ employees (too late)",
      "Hardware/physical-product company"
    ],
    "target_company_size": { "min": 50, "max": 500 },
    "target_revenue_band": { "min_usd": 5000000, "max_usd": 50000000 },
    "target_industries": ["B2B SaaS", "Developer Tools", "Vertical SaaS"],
    "target_geographies": ["North America", "EMEA"],
    "decision_maker_titles": ["CRO", "VP of Sales", "Founder/CEO", "Head of Revenue"],
    "influencer_titles": ["VP of Marketing", "Head of RevOps", "Director of Sales"]
  }
}
```

#### Degraded state

If the user has set `icp_summary` but no criteria yet:

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-10T14:00:00Z",
  "health": "degraded",
  "health_reason": "ICP summary set but no scoring criteria defined",
  "state": {
    "icp_summary": "Founder-led B2B SaaS at Series B-D",
    "icp_criteria": [],
    "disqualifiers": [],
    ...
  }
}
```

Signal Console handles this by:
- Using the `icp_summary` as freeform context in enrichment prompts
- Skipping criterion-by-criterion scoring
- Surfacing a Briefing footer prompt: "Add ICP scoring criteria for sharper relevance."

#### Uninitialized state

If the user has never opened ICP Studio:

```json
{
  "schema_version": "1.0",
  "last_modified_at": null,
  "health": "uninitialized",
  "health_reason": "ICP Studio not yet configured",
  "state": null
}
```

Signal Console falls back to category-level defaults (drawn from the user's company type) and prompts the user to configure ICP Studio. The pipeline still runs.

---

### 3.2 Discovery Studio

**Used by:** Stage 3.3 Enrich (objection contradiction detection), Stage 3.5 Synthesize (`recommended_moves[].destination` routing to specific phases and questions).

#### Contract

```typescript
type DiscoveryStudioState = {
  schema_version: "1.0"
  last_modified_at: string
  health: "ok" | "degraded" | "uninitialized"
  health_reason?: string
  state: {
    active_framework_id: string                  // the framework currently in use
    active_framework_name: string                // human-readable
    active_framework_version: string             // user-versioned, e.g. "v3.1"
    phases: DiscoveryPhase[]
  }
}

type DiscoveryPhase = {
  phase_number: number                           // 1-indexed, ordered
  phase_name: string                             // e.g. "Pain Discovery"
  phase_purpose: string                          // 1-sentence what this phase does
  questions: DiscoveryQuestion[]
  objections_addressed: string[]                 // free-text objection summaries
  exit_criteria: string                          // when is the user ready to move to next phase
}

type DiscoveryQuestion = {
  question_id: string
  question_text: string
  intent: string                                 // what we're trying to learn
  follow_ups: string[]                           // common follow-up questions
  red_flags: string[]                            // answers that mean disqualify
}
```

#### Example (single phase shown)

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-12T16:00:00Z",
  "health": "ok",
  "state": {
    "active_framework_id": "fw_abc123",
    "active_framework_name": "B2B SaaS Discovery v3.1",
    "active_framework_version": "v3.1",
    "phases": [
      {
        "phase_number": 4,
        "phase_name": "Pricing & Procurement Discovery",
        "phase_purpose": "Surface budget process, procurement constraints, and pricing sensitivity before they become objections.",
        "questions": [
          {
            "question_id": "q_p4_001",
            "question_text": "Walk me through how your team typically evaluates pricing for tools like this.",
            "intent": "Understand procurement process and decision authority",
            "follow_ups": [
              "Who has final sign-off on the budget?",
              "What's the typical evaluation timeline once pricing is on the table?"
            ],
            "red_flags": [
              "We have no budget for this kind of thing",
              "Everything has to go through a procurement RFP process"
            ]
          },
          {
            "question_id": "q_p4_002",
            "question_text": "Are you evaluating any other tools in this space right now?",
            "intent": "Surface competitive set early",
            "follow_ups": [
              "What about [named competitor]?",
              "How are you thinking about the build-vs-buy decision?"
            ],
            "red_flags": []
          }
        ],
        "objections_addressed": [
          "We need to pilot with the cheaper option first",
          "Our procurement process requires three quotes"
        ],
        "exit_criteria": "Budget range identified, decision-maker confirmed, competitive set surfaced"
      }
    ]
  }
}
```

#### How Signal Console uses this

When synthesizing a Pattern that affects pricing strategy, the system searches the phases for the closest phase by name/purpose match (e.g., "Pricing & Procurement Discovery"). It generates a `recommended_moves[].destination = "Discovery Studio · Phase 4 · refresh existing"` and drafts a candidate question update.

If a Pattern reveals a new objection that no existing phase addresses, the destination becomes `"Discovery Studio · Phase {best-fit-N} · new question"` and the draft includes the proposed new question text.

#### Degraded state

User has Discovery Studio configured but no active framework:

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-04-30T11:00:00Z",
  "health": "degraded",
  "health_reason": "Discovery Studio has frameworks but none marked active",
  "state": {
    "active_framework_id": null,
    "active_framework_name": null,
    "active_framework_version": null,
    "phases": []
  }
}
```

Signal Console handles by routing recommended_moves to generic destinations ("Discovery Studio") rather than specific phases.

---

### 3.3 Call Planner

**Used by:** Stage 3.3 Enrich (flag items that contradict or strengthen existing objection handlers), Stage 3.5 Synthesize (route objection refresh recommendations), behavioral feedback (which handlers are used vs. dormant).

#### Contract

```typescript
type CallPlannerState = {
  schema_version: "1.0"
  last_modified_at: string
  health: "ok" | "degraded" | "uninitialized"
  state: {
    objection_bank: ObjectionEntry[]
    call_brief_templates: CallBriefTemplate[]    // for routing one-pagers
  }
}

type ObjectionEntry = {
  objection_id: string
  objection_text: string                         // the buyer's likely sentence, verbatim or near-verbatim
  category: string                               // e.g. "pricing", "competitor", "timing", "authority"
  handler_summary: string                        // 1-2 sentence response approach
  handler_full: string                           // the actual response language, longer
  evidence_links: string[]                       // URLs to back up claims in the handler
  last_refreshed_at: string                      // ISO-8601
  competitor_mentioned: string | null            // if objection names a specific competitor
}

type CallBriefTemplate = {
  template_id: string
  template_name: string                          // e.g. "Pre-call brief for first discovery"
  purpose: string
}
```

#### Example

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-15T08:00:00Z",
  "health": "ok",
  "state": {
    "objection_bank": [
      {
        "objection_id": "obj_001",
        "objection_text": "We're going to pilot Snowflake's new pay-as-you-go tier first to see if that's enough.",
        "category": "competitor",
        "handler_summary": "Reframe the comparison from cost to orchestration depth; surface integration complexity Snowflake doesn't address.",
        "handler_full": "That's a fair starting point — Snowflake's PAYG is genuinely lower-friction for storage. What we've seen with [similar customer] is that the orchestration layer becomes the rate-limiter within 90 days, and Snowflake doesn't have a clean answer for that. Worth understanding what your team's expectations are for [specific workflow] — that's where the cost-per-query math shifts.",
        "evidence_links": [
          "https://example.com/case-study-orchestration",
          "https://docs.example.com/snowflake-comparison"
        ],
        "last_refreshed_at": "2026-05-16T10:00:00Z",
        "competitor_mentioned": "Snowflake"
      },
      {
        "objection_id": "obj_002",
        "objection_text": "We need to get this through procurement, which requires three quotes.",
        "category": "procurement",
        "handler_summary": "Acknowledge the process, redirect to total cost of ownership over 12 months, offer to provide procurement documentation upfront.",
        "handler_full": "...",
        "evidence_links": [],
        "last_refreshed_at": "2026-03-02T14:00:00Z",
        "competitor_mentioned": null
      }
    ],
    "call_brief_templates": [
      {
        "template_id": "tpl_disco_first",
        "template_name": "Pre-call brief for first discovery",
        "purpose": "Combine signal data + ICP fit + likely objections for AE preparation"
      }
    ]
  }
}
```

#### How Signal Console uses this

- When enriching an item, the system checks if the item contradicts or strengthens any existing objection handler (e.g., a competitor announces a new feature that invalidates the current handler's framing).
- When synthesizing a Pattern that surfaces a new competitive objection, the recommended_move destination becomes `Call Planner · Objection Bank · new` or `... refresh existing · obj_001`.
- Behavioral feedback (which objection handlers the user uses vs. doesn't) feeds back into clustering — handlers tied to clusters the user acts on get prioritized in synthesis.

---

### 3.4 Outbound Studio

**Used by:** Stage 3.3 Enrich (matching items to active signal triggers), Stage 3.5 Synthesize (route new hook recommendations based on emerging pain language), Stage 3.7 Surface (Watchlist Triggers that fire based on outbound-relevant signals).

#### Contract

```typescript
type OutboundStudioState = {
  schema_version: "1.0"
  last_modified_at: string
  health: "ok" | "degraded" | "uninitialized"
  state: {
    hooks: OutboundHook[]
    signal_triggers: SignalTrigger[]             // event-driven outbound triggers configured by user
    active_sequences: ActiveSequence[]           // currently-running sequences
  }
}

type OutboundHook = {
  hook_id: string
  hook_text: string                              // the actual one-liner
  use_case: string                               // when to deploy
  target_persona: string                         // who responds to this
  performance_summary: {                         // optional, freeform
    open_rate?: number
    reply_rate?: number
    notes?: string
  } | null
  pain_tags: string[]                            // which pain themes this hook addresses
  last_refreshed_at: string
}

type SignalTrigger = {
  trigger_id: string
  trigger_description: string                    // e.g. "Trigger when target hires a new VP of RevOps"
  matching_signal_types: string[]                // e.g. "exec_move", "funding_round"
  outbound_action: string                        // what sequence/hook fires
}

type ActiveSequence = {
  sequence_id: string
  sequence_name: string
  target_persona: string
  steps_count: number
  hooks_used: string[]                           // hook_ids referenced in this sequence
}
```

#### Example

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-13T12:00:00Z",
  "health": "ok",
  "state": {
    "hooks": [
      {
        "hook_id": "hk_001",
        "hook_text": "Noticed [Company] just hired [Name] as VP of RevOps — usually means the data layer is about to get scrutinized. Worth 15 min on what's working and what isn't?",
        "use_case": "Trigger sequence on new VP RevOps hire at target",
        "target_persona": "VP RevOps, new in role <60 days",
        "performance_summary": {
          "open_rate": 0.42,
          "reply_rate": 0.08,
          "notes": "Best response when hire is between 14 and 45 days into role"
        },
        "pain_tags": ["revops-tooling-fragmentation", "data-quality"],
        "last_refreshed_at": "2026-04-22T09:00:00Z"
      }
    ],
    "signal_triggers": [
      {
        "trigger_id": "st_001",
        "trigger_description": "Trigger when target hires a new VP of RevOps",
        "matching_signal_types": ["exec_move"],
        "outbound_action": "Fire hk_001 sequence to new VP within 21 days of announcement"
      }
    ],
    "active_sequences": [
      {
        "sequence_id": "seq_001",
        "sequence_name": "New VP RevOps outreach v2",
        "target_persona": "VP RevOps, new in role",
        "steps_count": 5,
        "hooks_used": ["hk_001", "hk_003"]
      }
    ]
  }
}
```

#### How Signal Console uses this

- When an item with `exec_move` for a VP of RevOps at a target account is enriched, the system checks if any `signal_triggers` match. If yes, the Deal-Watch surface fires an alert: "Trigger st_001 matched — Bruce Felt joined Acme as VP RevOps. Sequence seq_001 ready to fire."
- When a new pain pattern emerges (e.g., "data residency concerns rising"), the system suggests drafting a new outbound hook addressing that pain. Routes to `Outbound Studio · Hook Library · new`.

---

### 3.5 Asset Builder

**Used by:** Stage 3.3 Enrich (cross-reference against existing battlecard tiles), Stage 3.5 Synthesize (flag stale battlecards, route refresh recommendations), Stage 3.7 Surface (Deal-Watch alerts route to specific battlecards).

#### Contract

```typescript
type AssetBuilderState = {
  schema_version: "1.0"
  last_modified_at: string
  health: "ok" | "degraded" | "uninitialized"
  state: {
    battlecard_tiles: BattlecardTile[]
    executive_pages: ExecutiveAsset[]
    customer_assets: CustomerAsset[]
  }
}

type BattlecardTile = {
  tile_id: string
  competitor: string                             // company name; matches enriched_items.entities.companies
  tile_title: string                             // e.g. "Snowflake — pricing posture"
  tile_summary: string                           // 1-2 sentence summary the AE reads
  tile_full: string                              // longer-form content
  evidence_links: string[]
  last_refreshed_at: string
  competitor_categories: string[]                // e.g. ["direct", "asymmetric"]
}

type ExecutiveAsset = {
  asset_id: string
  asset_title: string
  asset_type: "one_pager" | "board_slide" | "strategic_memo"
  audience: string                               // e.g. "board", "investor", "internal exec"
  topics: string[]
  last_refreshed_at: string
}

type CustomerAsset = {
  asset_id: string
  asset_title: string
  asset_type: "case_study" | "testimonial" | "logo_grid"
  customer_name: string
  industry: string
  use_case: string
  last_refreshed_at: string
}
```

#### Example

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-09T15:00:00Z",
  "health": "ok",
  "state": {
    "battlecard_tiles": [
      {
        "tile_id": "bc_001",
        "competitor": "Snowflake",
        "tile_title": "Snowflake — pricing posture",
        "tile_summary": "Snowflake competes on raw storage cost; the orchestration layer remains a gap. Their PAYG tier (May 2026) opens a downmarket vector.",
        "tile_full": "Snowflake's pricing has historically been...",
        "evidence_links": [
          "https://snowflake.com/pricing",
          "https://example.com/comparison-doc"
        ],
        "last_refreshed_at": "2026-05-16T10:00:00Z",
        "competitor_categories": ["direct"]
      },
      {
        "tile_id": "bc_002",
        "competitor": "Linear",
        "tile_title": "Linear — product surface and roadmap",
        "tile_summary": "Linear is engineering-led and PLG-shaped. Currently no enterprise GTM motion.",
        "tile_full": "...",
        "evidence_links": [],
        "last_refreshed_at": "2026-02-14T09:00:00Z",
        "competitor_categories": ["asymmetric"]
      }
    ],
    "executive_pages": [
      {
        "asset_id": "ex_001",
        "asset_title": "Category narrative one-pager: agentic vs workflow",
        "asset_type": "one_pager",
        "audience": "internal exec",
        "topics": ["category-narrative", "positioning"],
        "last_refreshed_at": "2026-04-01T10:00:00Z"
      }
    ],
    "customer_assets": []
  }
}
```

#### How Signal Console uses this

- A new Pattern about Snowflake checks `battlecard_tiles[]` for `competitor === "Snowflake"` — finds `bc_001`. Compares `last_refreshed_at` against the Pattern's `first_seen_at`. If the Pattern post-dates the tile by >7 days, flag the tile as needing refresh.
- The Linear battlecard (`bc_002`) — last refreshed February — is flagged as stale if any Pattern about Linear emerges. The Pattern's recommended_moves include `Asset Builder · Battlecard · Linear · refresh existing`.
- Executive pages can be updated when category-narrative Patterns emerge (the agentic/workflow example).

---

### 3.6 Active Deals register

**Used by:** Stage 3.3 Enrich (cross-reference items against active deals; populate `affects_deals[]`), Stage 3.7 Surface (Deal-Watch alerts surface per deal).

#### Contract

```typescript
type ActiveDealsState = {
  schema_version: "1.0"
  last_modified_at: string
  health: "ok" | "degraded" | "uninitialized"
  state: {
    deals: ActiveDeal[]
  }
}

type ActiveDeal = {
  deal_id: string
  account_name: string                           // matches enriched_items.entities.companies
  account_url: string | null
  competitive_set: string[]                      // competitor names in this deal
  stage_estimate: "evaluation" | "negotiation" | "decision" | "closed_won" | "closed_lost"
  watch_for: string[]                            // freeform tags
  created_at: string
  closes_estimate_at: string | null
  notes: null                                    // explicitly null — anti-CRM
}
```

#### Example

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-17T07:00:00Z",
  "health": "ok",
  "state": {
    "deals": [
      {
        "deal_id": "dl_001",
        "account_name": "Acme Industries",
        "account_url": "https://acme-industries.com",
        "competitive_set": ["Snowflake", "Databricks"],
        "stage_estimate": "evaluation",
        "watch_for": ["pricing", "AI", "compliance"],
        "created_at": "2026-04-01T10:00:00Z",
        "closes_estimate_at": "2026-07-15",
        "notes": null
      },
      {
        "deal_id": "dl_002",
        "account_name": "Beta Corp",
        "account_url": null,
        "competitive_set": ["Linear"],
        "stage_estimate": "negotiation",
        "watch_for": ["competitive", "exec-changes"],
        "created_at": "2026-03-15T09:00:00Z",
        "closes_estimate_at": "2026-06-01",
        "notes": null
      }
    ]
  }
}
```

#### How Signal Console uses this

- Every enriched item's `entities.companies` is cross-referenced against `competitive_set[]` across all active deals. Matches populate `affects_deals[]` on the enriched item.
- Deal-Watch alerts surface per deal, with severity computed from item attributes × deal's `watch_for` tags × stage.
- Closed deals (`closed_won` / `closed_lost`) stay in the register for 30 days as reference data, then archive.

---

### 3.7 Watchlist Triggers

**Used by:** Stage 3.3 Enrich (`matches_triggers[]` population), Stage 3.7 Surface (Trigger fire surface).

#### Contract

```typescript
type WatchlistTriggersState = {
  schema_version: "1.0"
  last_modified_at: string
  health: "ok" | "degraded" | "uninitialized"
  state: {
    triggers: WatchlistTrigger[]
  }
}

type WatchlistTrigger = {
  trigger_id: string
  natural_language: string                       // user's original phrasing
  parsed_query: TriggerParsedQuery               // see Phase 4 spec for grammar
  status: "armed" | "fired_today" | "fired_this_week" | "dormant"
  created_at: string
  last_fired_at: string | null
  fire_count: number
  false_fire_count: number
  user_approved_fires: number
}

type TriggerParsedQuery = {
  type: "single_event" | "aggregation" | "threshold" | "adjacency" | "silence"
  // ... type-specific fields per Phase 4 spec
}
```

The full grammar of `TriggerParsedQuery` lives in the Phase 4 spec (Watchlist Trigger grammar). This contract returns whatever shape that spec defines.

#### How Signal Console uses this

- During enrichment, each item is tested against every active trigger's `parsed_query`. Matches populate `matches_triggers[]` on the item.
- Trigger fires route to the dedicated Watchlist Trigger surface, not the Briefing main.
- User feedback (useful fire / false fire) updates the trigger's counters and influences future parse refinement.

---

### 3.8 Voice Document

**Used by:** Stage 3.5 Synthesize (draft, critique, revise prompts all reference voice exemplars and rules).

#### Contract

```typescript
type VoiceDocumentState = {
  schema_version: "1.0"
  last_modified_at: string
  health: "ok" | "degraded" | "uninitialized"
  state: {
    version: string                              // user-versioned, e.g. "0.1"
    tone_profile: string                         // multi-paragraph prose
    voice_exemplars: VoiceExemplar[]
    anti_exemplars: VoiceAntiExemplar[]
    banned_vocabulary: BannedVocabulary
    preferred_replacements: PreferredReplacement[]
    structural_rules: StructuralRules
    hedging_rules: HedgingRules
  }
}

type VoiceExemplar = {
  exemplar_id: string
  title: string
  cluster_type: "pain_tag" | "company" | "exec_move" | "narrative_shift" | "trigger_fire"
  pattern_full_text: string                      // the full perfect Pattern
  annotation: string                             // why this is exemplary
  promoted_from_user_feedback: boolean           // true if promoted from "Acted on" Pattern
  promoted_at: string | null
}

type VoiceAntiExemplar = {
  anti_exemplar_id: string
  title: string
  bad_pattern_text: string
  annotation: string                             // why this fails
  failure_modes: string[]                        // e.g. ["marketing_soup", "hedging_overload"]
}

type BannedVocabulary = {
  hard_ban: string[]                             // never appears in output
  soft_ban: string[]                             // acceptable only in specific contexts
}

type PreferredReplacement = {
  instead_of: string
  use: string
}

type StructuralRules = {
  pattern_name: { max_words: number; style_notes: string[] }
  analysis: { min_words: number; max_words: number; max_sentences: number; forbidden_openings: string[]; forbidden_closings: string[] }
  six_questions: Record<string, { max_sentences: number; style_notes: string }>
  recommended_moves: { max_count: number; ordering: string }
  voice_cadence: string[]                        // rules of thumb
}

type HedgingRules = {
  assert_when: string[]
  hedge_when: string[]
  max_hedging_adverbs_per_analysis: number
  banned_hedge_constructions: string[]
  uncertainty_naming_pattern: string             // how to name uncertainty when warranted
}
```

#### How Signal Console uses this

- Every Stage 3.5 (Synthesize) call serializes the voice document into the prompt. The synthesis prompts in the Recipe Layer spec v0.2 (§3.5a draft, §3.5b critique) embed `voice_document.tone_profile`, `voice_document.voice_exemplars`, `voice_document.banned_vocabulary`, and `voice_document.structural_rules` directly.
- The Stage 3.5d Quality Gate uses `voice_document.banned_vocabulary` and `voice_document.structural_rules` for programmatic checks.
- The Stage 3.5b Critique pass uses `voice_document.anti_exemplars` to identify failure modes in the draft.

---

### 3.9 Behavioral Feedback log

**Used by:** Stage 3.4 Cluster (historical_snr per source), Stage 3.6 Score (synthesis_quality_factor), Stage 3.7 Surface (ordering, suppression of repeated patterns).

#### Contract

```typescript
type BehavioralFeedbackState = {
  schema_version: "1.0"
  last_modified_at: string
  health: "ok"
  state: {
    feedback_log: FeedbackEntry[]                // last 90 days
    aggregates: FeedbackAggregates
  }
}

type FeedbackEntry = {
  feedback_id: string
  surfaced_as: "briefing_main" | "watchlist_trigger" | "deal_watch"
  pattern_id: string | null
  trigger_id: string | null
  deal_id: string | null
  verdict: "used" | "met" | "noise" | "useful_fire" | "false_fire" | "helped" | "didnt_apply"
  given_at: string
  context: {                                     // freeform reasoning if user provided
    reason?: string
  } | null
}

type FeedbackAggregates = {
  historical_snr_by_source: Record<string, number>      // source_type → SNR (0.0-1.0)
  pain_tag_relevance_weights: Record<string, number>    // pain_tag → weight adjustment
  pattern_themes_promoted: string[]                     // recurring themes the user acts on
  pattern_themes_demoted: string[]                      // recurring themes the user marks noise
}
```

#### How Signal Console uses this

- `historical_snr_by_source` feeds the cluster weighting math in Stage 3.4.
- `pain_tag_relevance_weights` adjusts which pain tags get priority in clustering.
- `pattern_themes_promoted` and `pattern_themes_demoted` inform ordering on the Briefing.
- The full feedback log is also exposed to the evaluation harness (Phase 5) for tracking quality over time.

---

## 4. The HydratedContext object — what Stage 3.0 produces

Combining all module reads:

```typescript
type HydratedContext = {
  context_id: string
  user_id: string                                // future-proofing for multi-user
  hydrated_at: string                            // ISO-8601 of when this hydration ran
  modules_read: ModuleReadResult[]               // one per module attempted
  
  // Convenience accessors — flattened from the per-module reads above
  icp: ICPStudioState["state"] | null
  discovery: DiscoveryStudioState["state"] | null
  call_planner: CallPlannerState["state"] | null
  outbound: OutboundStudioState["state"] | null
  asset_builder: AssetBuilderState["state"] | null
  active_deals: ActiveDealsState["state"] | null
  watchlist_triggers: WatchlistTriggersState["state"] | null
  voice_document: VoiceDocumentState["state"] | null
  behavioral_feedback: BehavioralFeedbackState["state"] | null
  
  // Derived for convenience in downstream prompts
  watchlist_companies: string[]                  // union of competitive_sets across active_deals + target_industries from ICP
  pain_lib: PainTag[]                            // from a separate global registry, included for prompt convenience
}

type ModuleReadResult = {
  module: "icp_studio" | "discovery_studio" | "call_planner" | "outbound_studio" | "asset_builder" | "active_deals" | "watchlist_triggers" | "voice_document" | "behavioral_feedback"
  read_at: string
  health: "ok" | "degraded" | "uninitialized" | "error"
  schema_version: string
  last_modified_at: string | null
  read_duration_ms: number
  error_message: string | null
}
```

### 4.1 Hydration logic

Pseudocode:

```python
def hydrate_context(user_id: str = "default") -> HydratedContext:
    context = HydratedContext(
        context_id=generate_id(),
        user_id=user_id,
        hydrated_at=now_iso(),
        modules_read=[]
    )
    
    for module_name, getter in MODULE_GETTERS.items():
        result = ModuleReadResult(module=module_name, read_at=now_iso())
        t0 = perf_counter()
        try:
            module_state = getter()
            result.health = module_state["health"]
            result.schema_version = module_state["schema_version"]
            result.last_modified_at = module_state["last_modified_at"]
            
            if module_state["health"] in ("ok", "degraded"):
                setattr(context, module_name, module_state["state"])
            else:  # uninitialized
                setattr(context, module_name, None)
                
        except Exception as e:
            result.health = "error"
            result.error_message = str(e)
            setattr(context, module_name, None)
        
        result.read_duration_ms = int((perf_counter() - t0) * 1000)
        context.modules_read.append(result)
    
    # Derive convenience fields
    context.watchlist_companies = derive_watchlist(
        active_deals=context.active_deals,
        icp=context.icp
    )
    context.pain_lib = load_global_pain_lib()
    
    return context
```

### 4.2 Performance

Total hydration should complete in <100ms with localStorage-backed modules, <500ms in the worst case. If hydration takes >2 seconds, that's a bug — log and investigate.

### 4.3 Caching

The `HydratedContext` is cached for the duration of a single pipeline run (typically 5-30 minutes). Subsequent stages reference the cached object; they do not re-hydrate mid-run.

If the user changes a module's state mid-pipeline-run (rare but possible), the change is picked up on the next pipeline run.

### 4.4 Logging

Every hydration writes a `HydratedContextLog` entry for debugging. The log includes:
- context_id
- modules_read (full ModuleReadResult array)
- total_duration_ms
- any degraded/error states

Logs retained for 30 days. Useful when investigating "the Briefing was weird this week" complaints.

---

## 5. Failure mode handling

### 5.1 Single module fails

| Module fails | Pipeline behavior |
|---|---|
| ICP Studio | Enrichment relevance scoring falls back to category-level defaults. Briefing shows banner: "ICP not configured — relevance scoring degraded." |
| Discovery Studio | Recommended_moves route to generic destinations ("Discovery Studio") instead of specific phases. Banner: "Discovery framework unavailable." |
| Call Planner | Objection-contradiction detection skipped. Banner: "Call Planner state unavailable." |
| Outbound Studio | Signal-trigger matching skipped. Banner: "Outbound triggers unavailable." |
| Asset Builder | Stale-battlecard flagging skipped. Banner: "Asset state unavailable." |
| Active Deals | Deal-Watch surface empty for this run. No banner needed if user has no active deals. |
| Watchlist Triggers | Trigger surface empty. No banner if user has no triggers. |
| Voice Document | **Pipeline halts.** Synthesis cannot proceed without voice document. Hard failure. |
| Behavioral Feedback | Use defaults for all weights. No banner needed. |

The Voice Document is the only hard-required module. All others degrade gracefully.

### 5.2 Schema version mismatch

If a module returns `schema_version` that Signal Console doesn't recognize:

- **Forward compatibility:** If schema_version is one major version higher than expected, attempt to read known fields only; log unknowns; warn user via banner.
- **Backward compatibility:** If schema_version is one major version lower than expected, use a versioned parser; log the lag; surface a "module needs upgrade" prompt.
- **Multiple major versions off:** Treat as unavailable; degraded mode.

### 5.3 Partial reads

Modules can return `health = "degraded"` when some fields are present and others aren't. Signal Console uses what's available. The specific fallback per partial state is module-specific (documented in §3 above).

### 5.4 Module-level rate limits

Not applicable — these are local function calls, not network calls.

### 5.5 Stale state

A module returning `last_modified_at` older than 6 months triggers a soft prompt in the Briefing: "Your [module] hasn't been updated in 6+ months. Consider reviewing."

This is informational, not blocking.

---

## 6. Open questions

Things this contract doesn't yet resolve:

1. **Pain library — global or per-user?** The contract currently treats PAIN_LIB as a global registry, loaded separately in Stage 3.0. If pain libraries become per-user (different operators in different categories have different pain vocabularies), it needs its own contract.

2. **Cross-module references.** A Call Planner objection_entry might say "see battlecard bc_001." Should the contract make cross-references first-class (e.g., reference fields with type `BattlecardTileRef`), or stay loose (just match on competitor name strings)? Loose is simpler; strict is safer. Probably stay loose for v0.1; reconsider in v0.2.

3. **Discovery Studio framework history.** When the user has multiple Discovery frameworks (e.g., v3.0 and v3.1), the contract returns only the active one. Should historical frameworks be available for retrospective analysis ("how would v3.0 have handled this signal")? Out of scope for v0.1.

4. **Asset Builder draft state.** When a Pattern's recommended_move generates a draft Battlecard refresh, the draft lives somewhere in Asset Builder before user approval. Should the contract return drafts as well as published assets? Probably yes — Signal Console should know it has a pending draft and not generate duplicates. Add `drafts[]` field in v0.2.

5. **Performance under N>1000 entries.** ICP studio with 50 criteria is fine. Asset Builder with 10,000 battlecard tiles is not (Signal Console probably doesn't need all of them in context every run). At some scale, the contract should return filtered subsets ("battlecards relevant to user's watchlist") rather than full state. v0.2 concern.

6. **Trigger query language stability.** §3.7's `TriggerParsedQuery` shape depends on the Phase 4 spec. Until Phase 4 is locked, this is a placeholder shape.

7. **Behavioral feedback retention.** 90 days hardcoded. Probably right for tuning but might want longer for "user-level voice fingerprint" learning. v0.2 question.

8. **Module read order.** Should reads be parallel or serial? Parallel is faster but harder to debug; serial is slower but provides clear logs. Probably parallel with a coordinated timeout (e.g., 1s max per module, total 5s budget). Define in v0.2.

9. **Versioning of the HydratedContext itself.** As Signal Console's needs evolve, the HydratedContext shape changes. Does it get its own schema_version? Yes — start at "1.0" in v0.1.

---

## 7. What this contract enables

With this contract in place, the following become real instead of aspirational:

1. **Stage 3.0 Context Hydration** is implementable end-to-end.
2. **Stage 3.3 Enrich** can reference real ICP, watchlist, active deals, and triggers in the prompt.
3. **Stage 3.5 Synthesize** can reference real Discovery framework structure for routing recommended_moves.
4. **Stage 3.5b Critique** can reference real anti-exemplars.
5. **Stage 3.5d Quality Gate** can run real banned-vocabulary and structural checks.
6. **Stage 3.7 Surface** can route Deal-Watch alerts to real Active Deals.
7. **Behavioral feedback** can feed back into scoring and clustering via the contract.

Until this contract is implemented, every reference to "the user's ICP" or "the user's voice document" in the Recipe Layer spec is a placeholder.

---

## 8. Implementation order

When Antaeus is ready to implement these contracts in the GTM OS app, the suggested order:

1. **Voice Document.** It's a hard requirement for synthesis. Without it, the pipeline cannot complete. Implement first.
2. **ICP Studio.** Unblocks enrichment relevance scoring. Highest impact on Pattern quality.
3. **Active Deals register.** Small surface, unblocks Deal-Watch entirely.
4. **Asset Builder.** Unblocks stale-battlecard detection and Pattern routing.
5. **Discovery Studio.** Enables phase-specific recommended_moves routing.
6. **Call Planner.** Enables objection-contradiction detection.
7. **Outbound Studio.** Enables signal-triggered outreach loops.
8. **Watchlist Triggers.** Depends on Phase 4 grammar; implement after Phase 4 is locked.
9. **Behavioral Feedback.** Implement last; it's the closing-the-loop module and earns its value only after the rest are running.

---

## 9. Design completion criteria for this phase

- [ ] Every module's contract shape is reviewed and approved
- [ ] Example states for each module are reviewed against realistic data
- [ ] Failure-mode handling per module is approved
- [ ] HydratedContext shape is reviewed
- [ ] Open questions in §6 are answered or explicitly deferred
- [ ] Implementation order in §8 is approved
- [ ] Cross-references to other phases (Phase 1 voice document, Phase 4 trigger grammar) are reconciled

Once these are checked, Phase 3 is complete. Phase 4 (Watchlist Trigger grammar) is the natural next step — it locks the `TriggerParsedQuery` shape that this contract leaves placeholder.

---

*End of GTM OS Read Interface Contracts v0.1.*
