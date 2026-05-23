# Signal Console — End-to-End Design Walkthrough

**Version:** 0.1
**Date:** 17 May 2026
**Status:** Worked design example
**Phase:** Design Phase 6 (Recipe Layer Spec v0.3 §5)

---

## 0. Purpose

Every abstraction in the prior six phases either holds up against a concrete example or it doesn't. This document is the test: one complete pipeline run, against fictional but realistic data, with every stage's inputs and outputs spelled out.

If a stage in this walkthrough cannot produce a clean output from clean inputs, that's a gap in the spec — and a gap to fix before any code commits.

---

## 1. The setup

### 1.1 The user — Maya at Threadline

- **Maya Chen,** CEO and founder of **Threadline**
- Threadline is a **Customer Data Platform** purpose-built for mid-market B2B SaaS
- Series A (raised $12M last August), 18 employees, $4M ARR
- Maya is the founding GTM owner; her founding AE is Marcus Reyes
- Threadline competes against Segment, RudderStack, Hightouch, Census, mParticle

### 1.2 GTM OS state (HydratedContext input)

#### ICP Studio

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-10T11:00:00Z",
  "health": "ok",
  "state": {
    "icp_summary": "Series A-B B2B SaaS companies (50-300 employees, $5-30M ARR) with a CRO or VP Sales in role under 12 months, building a modern data stack and feeling the limits of homegrown event tracking. Best fit: companies with strong product-led growth who now need to layer sales motion on top.",
    "icp_criteria": [
      {
        "criterion": "Series A-B B2B SaaS",
        "weight": 0.85,
        "evidence_signals": ["funding_round announcement", "Crunchbase News", "company size 50-300"]
      },
      {
        "criterion": "CRO or VP Sales hired in last 12 months",
        "weight": 0.92,
        "evidence_signals": ["exec_move announcement", "leadership page diff", "PR Newswire personnel"]
      },
      {
        "criterion": "Modern data stack (Snowflake/Databricks/BigQuery)",
        "weight": 0.75,
        "evidence_signals": ["job postings mentioning these tools", "engineering blog mentions"]
      },
      {
        "criterion": "Strong product-led growth signals",
        "weight": 0.7,
        "evidence_signals": ["free tier offered", "PLG hiring pattern", "self-serve onboarding"]
      }
    ],
    "disqualifiers": [
      "Pre-Series A (too early)",
      "Series D or public (too large for our motion)",
      "B2C / consumer-facing",
      "Hardware-first"
    ],
    "target_company_size": { "min": 50, "max": 300 },
    "target_revenue_band": { "min_usd": 5000000, "max_usd": 30000000 },
    "target_industries": ["B2B SaaS", "Developer Tools", "Vertical SaaS"],
    "decision_maker_titles": ["CRO", "VP of Sales", "Head of Revenue", "Founder/CEO"],
    "influencer_titles": ["Head of RevOps", "Head of Data", "VP Marketing"]
  }
}
```

#### Active Deals register

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-15T09:00:00Z",
  "health": "ok",
  "state": {
    "deals": [
      {
        "deal_id": "dl_001",
        "account_name": "Vector Analytics",
        "account_url": "https://vector-analytics.io",
        "competitive_set": ["Segment", "Hightouch"],
        "stage_estimate": "evaluation",
        "watch_for": ["pricing", "enterprise-positioning"],
        "created_at": "2026-04-12T10:00:00Z",
        "closes_estimate_at": "2026-07-30",
        "notes": null
      },
      {
        "deal_id": "dl_002",
        "account_name": "Pulse Insights",
        "account_url": "https://pulseinsights.com",
        "competitive_set": ["Segment", "RudderStack"],
        "stage_estimate": "negotiation",
        "watch_for": ["pricing", "competitive"],
        "created_at": "2026-03-20T14:00:00Z",
        "closes_estimate_at": "2026-06-10",
        "notes": null
      },
      {
        "deal_id": "dl_003",
        "account_name": "Atlas Data Co",
        "account_url": "https://atlasdata.co",
        "competitive_set": ["Segment", "mParticle"],
        "stage_estimate": "decision",
        "watch_for": ["competitive", "exec-changes"],
        "created_at": "2026-02-10T11:00:00Z",
        "closes_estimate_at": "2026-05-28",
        "notes": null
      }
    ]
  }
}
```

#### Watchlist Triggers

```json
{
  "schema_version": "1.0",
  "last_modified_at": "2026-05-08T15:00:00Z",
  "health": "ok",
  "state": {
    "triggers": [
      {
        "trigger_id": "trg_001",
        "natural_language": "Alert me when Segment changes their pricing",
        "parsed_query": {
          "type": "single_event",
          "event": { "category": "pricing_change", "subcategory": null, "qualifier": null },
          "target": { "type": "company", "name": "Segment" },
          "fire_once": false
        },
        "status": "armed",
        "rephrased_for_confirmation": "Watch Segment for any pricing page or tier changes."
      },
      {
        "trigger_id": "trg_002",
        "natural_language": "Alert me when 3+ CDP companies mention enterprise readiness in the same week",
        "parsed_query": {
          "type": "aggregation",
          "min_count": 3,
          "event": { "category": "narrative_shift_mention", "qualifier": "enterprise_readiness" },
          "filters": { "company_category": ["CDP"] },
          "window_days": 7,
          "window_type": "rolling",
          "fire_once_per_window": true
        },
        "status": "armed"
      },
      {
        "trigger_id": "trg_003",
        "natural_language": "Alert me when 'reverse ETL' starts replacing 'CDP' in operator content",
        "parsed_query": {
          "type": "threshold",
          "metric": {
            "source": "category_narrative_ratio",
            "target": "reverse_etl_vs_cdp",
            "metric_type": "ratio_vs_baseline"
          },
          "comparison": "greater_than",
          "value": 1.5,
          "window_days": 60,
          "baseline": { "type": "previous_window", "window_days": 60 }
        },
        "status": "armed"
      },
      {
        "trigger_id": "trg_004",
        "natural_language": "Alert me about anything Hightouch does",
        "parsed_query": {
          "type": "adjacency",
          "target": { "type": "company", "name": "Hightouch" },
          "relevance_threshold": 0.5,
          "digest_mode": true
        },
        "status": "armed"
      },
      {
        "trigger_id": "trg_005",
        "natural_language": "Alert me if Segment stops blogging for 30+ days",
        "parsed_query": {
          "type": "silence",
          "target": { "type": "source", "source_type": "company_blog", "company": "Segment" },
          "silence_days": 30,
          "reset_on_activity": true
        },
        "status": "armed"
      }
    ]
  }
}
```

#### Voice Document

Per Voice Document v0.1 — 5 exemplars, banned vocabulary, structural rules. Loaded as-is.

#### Other module reads

Discovery Studio (active framework v3.2 with 5 phases), Call Planner (12 objection handlers including 4 for competitor objections), Outbound Studio (8 hooks, 3 active sequences), Asset Builder (5 competitor battlecards, 2 executive one-pagers), Behavioral Feedback log (47 entries over last 90 days).

---

## 2. Pipeline run begins — Monday 17 May 2026, 06:00 UTC

### 2.1 Stage 3.0 — Context Hydration

**Inputs:** Maya's user_id (single-user beta — implicit).

**Execution:** Parallel reads of 9 modules with 1s timeout each, 5s total budget.

**Result — `HydratedContext` summary:**

```json
{
  "context_id": "ctx_abc123",
  "user_id": "maya_chen",
  "hydrated_at": "2026-05-17T06:00:02Z",
  "modules_read": [
    { "module": "icp_studio", "health": "ok", "read_duration_ms": 12 },
    { "module": "discovery_studio", "health": "ok", "read_duration_ms": 18 },
    { "module": "call_planner", "health": "ok", "read_duration_ms": 15 },
    { "module": "outbound_studio", "health": "ok", "read_duration_ms": 11 },
    { "module": "asset_builder", "health": "ok", "read_duration_ms": 22 },
    { "module": "active_deals", "health": "ok", "read_duration_ms": 8 },
    { "module": "watchlist_triggers", "health": "ok", "read_duration_ms": 9 },
    { "module": "voice_document", "health": "ok", "read_duration_ms": 14 },
    { "module": "behavioral_feedback", "health": "ok", "read_duration_ms": 19 }
  ],
  "watchlist_companies": ["Segment", "RudderStack", "Hightouch", "Census", "mParticle", "Vector Analytics", "Pulse Insights", "Atlas Data Co"]
}
```

Total hydration: 128ms. All modules healthy.

---

### 2.2 Stage 3.1 — Ingest

Fetchers run in parallel. Below is the **20-item harvest** from the prior 24 hours across all configured sources, deduplicated by `(source_id, external_id)`:

| # | Source | External ID | Title | Published |
|---|---|---|---|---|
| 1 | hn_algolia | hn_42018443 | "Show HN: An open-source CDP" — Twilio engineer | 16 May 18:42 |
| 2 | hn_firebase | hn_42021091 | "Reverse ETL vs CDP: A Practitioner's Take" | 16 May 21:15 |
| 3 | prnewswire_personnel | prn_5829347 | "Hightouch names Bruce Felt as Chief Financial Officer" | 15 May 09:00 |
| 4 | prnewswire_personnel | prn_5831204 | "Segment promotes Sarah Chen to VP of Enterprise" | 16 May 12:30 |
| 5 | techcrunch_rss | tc_44502 | "Segment introduces 'Free for Devs' tier, lowering data CDP entry point" | 14 May 16:00 |
| 6 | techcrunch_rss | tc_44519 | "Vector Analytics raises $25M Series B led by Bessemer" | 15 May 08:00 |
| 7 | substack_rss | sub_a16z_887 | "The CDP Wars: Who wins when data goes agentic" | 16 May 09:00 |
| 8 | substack_rss | sub_lenny_412 | "How modern data teams pick their CDP" | 15 May 10:00 |
| 9 | wikipedia_pageviews | wiki_cdp_05.16 | "Customer_data_platform" daily pageviews | 16 May (data) |
| 10 | wikipedia_pageviews | wiki_retl_05.16 | "Reverse_ETL" daily pageviews | 16 May (data) |
| 11 | arxiv | arxiv_2505.18203 | "Privacy-preserving event tracking architectures for multi-tenant SaaS" | 15 May |
| 12 | federal_register | fr_2026-10293 | "FTC notice of inquiry on consumer data brokering" | 14 May |
| 13 | statuspage | sp_seg_0517_a | Segment status: degraded performance Profile API (resolved) | 17 May 02:00 |
| 14 | hackerone | h1_seg_4421 | Segment public disclosure: XSS fixed in admin UI | 15 May |
| 15 | tier_b_html_diff | tb_ht_pricing | Hightouch pricing page: added "Hightouch Free" tier | 14 May (detected) |
| 16 | tier_b_html_diff | tb_rs_team | RudderStack team page: added 3 new exec-level entries | 16 May (detected) |
| 17 | github_releases_atom | gh_rs_v2.5 | RudderStack v2.5.0 — event streaming overhaul | 15 May 14:00 |
| 18 | layoffs_fyi | lf_census_0516 | Census: 30% layoff in go-to-market team | 16 May |
| 19 | substack_rss | sub_dataflow_103 | "Why CDPs are converging on the same playbook" | 15 May |
| 20 | hn_algolia | hn_42022198 | "Anyone else seeing Segment's sales motion shift to mid-market?" (HN Ask) | 16 May 23:00 |

All 20 stored as `raw_items[]` in Supabase. `fetcher_runs[]` log records each fetcher's run timing.

---

### 2.3 Stage 3.2 — Filter

Deterministic filter rules applied. Results:

| # | Decision | Rule fired |
|---|---|---|
| 1 | Keep | — |
| 2 | Keep | — |
| 3 | Keep | — |
| 4 | Keep | — |
| 5 | Keep | — |
| 6 | Keep | — |
| 7 | Keep | — |
| 8 | Keep | — |
| 9 | Keep | — (data signal, no filter) |
| 10 | Keep | — |
| 11 | Keep | — |
| 12 | **Reject** | Off-category — FTC consumer data brokering doesn't intersect Threadline's B2B SaaS CDP positioning |
| 13 | Keep | — |
| 14 | Keep | — |
| 15 | Keep | — |
| 16 | Keep | — |
| 17 | Keep | — |
| 18 | Keep | — |
| 19 | Keep | — |
| 20 | Keep | — |

19 items pass to enrichment. 1 rejected.

---

### 2.4 Stage 3.3 — Enrich

Each of the 19 items gets a Haiku 4.5 call. Below are **three detailed examples**; the others are summarized in a table.

#### Item 5 — Segment "Free for Devs" tier launch (TechCrunch)

**Prompt payload (excerpt):**

```
Source type: techcrunch_rss
Title: Segment introduces 'Free for Devs' tier, lowering data CDP entry point
Body: Segment, the customer data platform owned by Twilio, today announced a new "Free for Devs" tier giving developers and small teams up to 1,000 monthly tracked users at no cost. The move, which Segment positions as "lowering the floor for builders," comes as competitive pressure from open-source alternatives like RudderStack and pricing-flexible challengers like Hightouch intensifies. The new tier is available immediately at segment.com/free-for-devs.

USER CONTEXT
Watchlist companies: ["Segment", "RudderStack", "Hightouch", "Census", "mParticle", ...]
Competitive set: Same
Active deals: Vector Analytics vs Segment+Hightouch; Pulse Insights vs Segment+RudderStack; Atlas Data Co vs Segment+mParticle
Active Watchlist Triggers: trg_001 (Segment pricing change), trg_002 (3+ CDP enterprise mentions), trg_004 (Hightouch adjacency)
Available pain tags: cdp-entry-pricing-pressure, plg-motion-vs-sales-led, ...
```

**Response:**

```json
{
  "entities": {
    "companies": ["Segment", "Twilio", "RudderStack", "Hightouch"],
    "people": [],
    "products": ["Segment Free for Devs"],
    "technologies": ["customer data platform"]
  },
  "exec_move": null,
  "event_category": "pricing_change",
  "topic_tags": ["pricing", "free-tier", "competitive-pressure", "down-market"],
  "pain_tags": ["cdp-entry-pricing-pressure", "plg-motion-vs-sales-led"],
  "claim_type": "fact",
  "summary": "Segment launched a Free for Devs tier offering 1,000 monthly tracked users at no cost, explicitly framed as a response to open-source and pricing-flexible competition.",
  "what_changed": "Segment added a no-cost entry tier for the first time, lowering the CDP entry floor to zero for small teams.",
  "user_relevance_score": 0.94,
  "matches_triggers": ["trg_001"],
  "affects_deals": ["dl_001", "dl_002", "dl_003"],
  "is_noise": false
}
```

Enrichment cost: $0.0014.

#### Item 3 — Hightouch CFO hire (PR Newswire)

```json
{
  "entities": {
    "companies": ["Hightouch"],
    "people": ["Bruce Felt"],
    "products": [],
    "technologies": []
  },
  "exec_move": {
    "person_name": "Bruce Felt",
    "new_role": "Chief Financial Officer",
    "company": "Hightouch",
    "action": "joined",
    "prior_company": "Cohesity",
    "effective_date": "2026-05-15"
  },
  "event_category": "exec_move",
  "topic_tags": ["leadership", "enterprise-motion-signal"],
  "pain_tags": [],
  "claim_type": "fact",
  "summary": "Bruce Felt — third-time enterprise CFO with IPOs at Cohesity and Sumo Logic — joined Hightouch as CFO effective 15 May.",
  "what_changed": "Hightouch added a senior CFO with explicit IPO-cycle experience; first time the company has had a CFO of this profile.",
  "user_relevance_score": 0.91,
  "matches_triggers": ["trg_004"],
  "affects_deals": ["dl_001"],
  "is_noise": false
}
```

Enrichment cost: $0.0011.

#### Item 18 — Census layoffs (layoffs.fyi)

```json
{
  "entities": {
    "companies": ["Census"],
    "people": [],
    "products": [],
    "technologies": []
  },
  "exec_move": null,
  "event_category": "layoff_event",
  "topic_tags": ["distress", "go-to-market-restructure"],
  "pain_tags": ["competitor-instability"],
  "claim_type": "fact",
  "summary": "Census laid off approximately 30% of its go-to-market team, including AEs and marketing.",
  "what_changed": "Census materially reduced its sales and marketing footprint, indicating either commercial distress or a strategic refocus away from outbound sales.",
  "user_relevance_score": 0.83,
  "matches_triggers": [],
  "affects_deals": [],
  "is_noise": false
}
```

Enrichment cost: $0.0010.

#### Remaining 16 items (summarized)

| # | Event | Pain tags | Relevance | Triggers | Affects deals |
|---|---|---|---|---|---|
| 1 | Open-source CDP launch on HN | cdp-open-source-pressure | 0.71 | — | — |
| 2 | Reverse ETL vs CDP HN discussion | category-vocabulary-drift, retl-vs-cdp | 0.85 | trg_003 (contributing) | — |
| 4 | Segment promotes Sarah Chen to VP Enterprise | enterprise-motion-signal | 0.88 | trg_002 (contributing) | dl_001, dl_002, dl_003 |
| 6 | Vector Analytics Series B | watchlist-account-funding | 0.79 | — | dl_001 |
| 7 | a16z newsletter on agentic CDP | category-narrative-shift | 0.76 | trg_003 (contributing) | — |
| 8 | Lenny's on CDP selection | category-relevance | 0.62 | — | — |
| 9 | Wikipedia CDP pageviews +50% | category-interest-rising | 0.68 | trg_003 (contributing) | — |
| 10 | Wikipedia Reverse_ETL pageviews +71% | category-vocabulary-drift, retl-vs-cdp | 0.78 | trg_003 (firing — see below) | — |
| 11 | arXiv privacy-preserving event tracking | technical-foundation | 0.55 | — | — |
| 13 | Segment Profile API degraded | competitor-reliability | 0.69 | — | dl_001, dl_002, dl_003 |
| 14 | Segment XSS disclosure | competitor-trust-narrative | 0.61 | — | dl_001, dl_002, dl_003 |
| 15 | Hightouch Free tier added | cdp-entry-pricing-pressure | 0.92 | trg_004 | dl_001 |
| 16 | RudderStack 3 new exec hires | enterprise-motion-signal | 0.84 | trg_002 (contributing) | dl_002 |
| 17 | RudderStack v2.5 release | competitor-product-velocity | 0.81 | — | dl_002 |
| 19 | Substack on CDP convergence | category-convergence | 0.72 | — | — |
| 20 | HN ask about Segment mid-market | competitor-motion-shift | 0.80 | trg_002 (contributing) | dl_001, dl_002, dl_003 |

Total enrichment cost for this run: ~$0.022.

**Watchlist Trigger fires after enrichment:**

- **trg_001 (Segment pricing change):** FIRES on item 5. Direct match to single_event query.
- **trg_002 (3+ CDP enterprise mentions in 7 days):** Counter at 4 — items 4, 16, 20, plus 7. **FIRES** at threshold of 3.
- **trg_003 (Reverse ETL replaces CDP):** Threshold not yet crossed (the metric is `category_narrative_ratio`; let's say current ratio is 1.3, threshold 1.5). Status: armed but watching.
- **trg_004 (Hightouch anything):** FIRES on items 3, 15. Routed to adjacency surface (digest_mode = true, so both surface together).
- **trg_005 (Segment silence):** Not fired — Segment posted multiple things this week.

**Deal-Watch alerts after enrichment:**

- **dl_001 Vector Analytics:** items 5 (Segment Free tier), 6 (their own funding), 15 (Hightouch Free tier), 17 (RudderStack release), 4 (Segment Sarah Chen), 13 (Segment outage), 14 (Segment XSS). Multiple high-relevance items.
- **dl_002 Pulse Insights:** items 5, 4, 13, 14, 16, 17, 20.
- **dl_003 Atlas Data Co:** items 5, 4, 13, 14, 20.

---

### 2.5 Stage 3.4 — Cluster

19 enriched items + previously-tracked items from past pipeline runs go through clustering. Three cluster types compete.

Below shows the **clusters that crossed weighted-evidence threshold** this run:

#### Cluster CL-001 — Pain-tag: "CDP entry pricing compression"

Contributing items (this week):
- Item 5: Segment Free for Devs (relevance 0.94, source TechCrunch)
- Item 15: Hightouch Free tier added (relevance 0.92, source Tier B HTML diff)
- Item 1: Open-source CDP on HN (relevance 0.71, source HN Algolia)
- Item 9: Wikipedia CDP pageviews +50% (relevance 0.68, source Wikipedia)

**Weighted evidence calculation:**

```
SRC_CONF by source (from existing config):
  techcrunch_rss   = 0.78
  tier_b_html_diff = 0.88   (direct page diff)
  hn_algolia       = 0.62
  wikipedia        = 0.85

baseline_volume / median assumptions:
  techcrunch_rss   baseline 8/day  → inverse_volume_factor = log(1 + 5/8)   ≈ 0.48 → clamped to 0.48
  tier_b_html_diff baseline 0.2/day → inverse_volume_factor = log(1 + 5/0.2) ≈ 3.26 → clamped to 3.0
  hn_algolia       baseline 12/day → inverse_volume_factor = log(1 + 5/12) ≈ 0.35 → clamped to 0.35 (rounded up from min)
  wikipedia        baseline 0.3/day → inverse_volume_factor ≈ 2.83

historical_snr (from EMA tracking):
  techcrunch_rss   = 0.65
  tier_b_html_diff = 0.81
  hn_algolia       = 0.58
  wikipedia        = 0.72

recency_factor (item published within last 3 days, all):
  all ≈ exp(-3/14) ≈ 0.81

item_weights:
  Item 5  = 0.78 × 0.48 × 0.65 × 0.81  ≈ 0.197
  Item 15 = 0.88 × 3.00 × 0.81 × 0.81  ≈ 1.732
  Item 1  = 0.62 × 0.35 × 0.58 × 0.81  ≈ 0.102
  Item 9  = 0.85 × 2.83 × 0.72 × 0.81  ≈ 1.402

Σ item_weight = 0.197 + 1.732 + 0.102 + 1.402 = 3.433
```

**Threshold check:**
- weighted_evidence_count: **3.43** ≥ 3.0 ✓
- distinct_sources: 4 ≥ 2 ✓
- distinct_accounts: 3 (Segment, Hightouch, [HN Show HN team]) ≥ 2 ✓
- ∃ item with relevance ≥ 0.7: Items 5, 15 ✓

**Cluster qualifies.** Trajectory: rising (3 of 4 items this week; prior 30 days only 1 related item).

#### Cluster CL-002 — Exec-move: "Bruce Felt → CFO at Hightouch"

Contributing items:
- Item 3: PR Newswire announcement (relevance 0.91, source prnewswire_personnel)
- (Potentially) cross-reference HN comment threads — not present this week

Single-item cluster. For exec_move, MIN_WEIGHTED_EVIDENCE = 1.5.

```
item_weight (Item 3):
  SRC_CONF[prnewswire_personnel] = 0.86
  baseline_volume                = 0.5/day (PR Newswire Personnel category)
  inverse_volume_factor          = log(1 + 5/0.5) ≈ 2.40
  historical_snr                 = 0.74
  recency_factor                 = exp(-2/14) ≈ 0.87
  
  item_weight = 0.86 × 2.40 × 0.74 × 0.87 ≈ 1.329
```

**Threshold check:** weighted_evidence 1.33 — **below** 1.5 threshold for exec_move clusters.

Cluster does NOT qualify for synthesis this week. However, the item still routes to:
- Watchlist Trigger trg_004 (Hightouch adjacency) — fires
- Future weeks: if corroborating items arrive (e.g., HN discussion, Substack mention), cluster will re-qualify

#### Cluster CL-003 — Company: "RudderStack motion intensifying"

Contributing items:
- Item 16: RudderStack 3 new exec hires (Tier B team page diff)
- Item 17: RudderStack v2.5 release (GitHub Releases)

```
item_weight calculations omitted for brevity; total weighted_evidence ≈ 2.1
```

Below threshold of 3.0. **Routes to Watch List.**

#### Cluster CL-004 — Pain-tag: "Category vocabulary shift: Reverse ETL vs CDP"

Contributing items:
- Item 2: HN Reverse ETL practitioner discussion (0.85)
- Item 7: a16z agentic CDP newsletter (0.76)
- Item 10: Wikipedia Reverse_ETL pageviews +71% (0.78)
- Item 19: Substack CDP convergence (0.72)

Weighted evidence: ~3.1 (estimating). Qualifies.

#### Other potential clusters that did NOT qualify

- Segment trust narrative weakening (items 13 outage + 14 XSS): weighted evidence ~1.4. Below threshold.
- Census distress (item 18 alone): single-item, not a pattern this week.
- Vector Analytics funding (item 6 alone): single-event, routed to Deal-Watch only.

---

### 2.6 Stage 3.5 — Synthesize (multi-stage)

Two clusters qualify: **CL-001** (pricing compression) and **CL-004** (vocabulary shift).

We'll show the full multi-stage flow for **CL-001**, summarize CL-004.

#### CL-001 synthesis — Stage 5a Draft

**Model:** Opus 4.7 with extended thinking.

**Prompt:** the full synthesis prompt from Recipe Layer Spec v0.2 §3.5a, with HydratedContext.voice_document injected, cluster items injected, Maya's ICP injected.

**Draft output (extended thinking visible in the reasoning field):**

```json
{
  "reasoning": {
    "factual_claim": "Three CDP players moved toward zero-cost or near-zero-cost entry tiers in the last 7 days: Segment (Free for Devs), Hightouch (Hightouch Free), Twilio (open-source release). Wikipedia CDP article interest is up 50% over the same period.",
    "so_what": "The floor of the CDP market is being contested. Maya's deals currently anchor on Threadline's superior orchestration depth versus Segment's data plane — but when entry-tier pricing goes to zero, the conversation increasingly starts with 'why not pilot the free option first.' Her active deals (Vector Analytics, Pulse Insights, Atlas Data) are all in evaluation/negotiation/decision stages where this pricing reset hits hardest.",
    "strongest_evidence": "Segment's Free for Devs tier launch is the dominant signal — Segment is the category-defining incumbent and their move signals the category's pricing floor is now zero. The Hightouch Free tier corroborates with same-week timing.",
    "concrete_action": "Refresh Discovery Phase 04 (Pricing & Procurement) to anchor the conversation on orchestration depth before price ever surfaces — pre-stage objection handlers for 'we'll pilot the free option first' across all three active deals."
  },
  "draft_pattern": {
    "name": "The CDP entry floor went to zero. Reposition Discovery before your deals feel it.",
    "claim_type": "pattern",
    "trajectory": "rising",
    "analysis": "Three CDP competitors moved toward zero-cost entry tiers in the last 7 days — Segment with Free for Devs, Hightouch with Hightouch Free, and Twilio with an open-source release. The synchronized timing isn't coincidence; the category's pricing floor is being contested as a deliberate strategic move. Your active deals (Vector Analytics, Pulse Insights, Atlas Data) all sit in evaluation, negotiation, or decision — exactly the stages where 'we'll pilot the free option first' becomes the dominant objection.",
    "six_questions": {
      "what_changed": "Three CDP competitors launched zero-cost or near-zero-cost entry tiers within 7 days: Segment Free for Devs (1,000 MTU free), Hightouch Free tier, and Twilio open-source CDP. Wikipedia 'Customer data platform' pageviews up 50% over rolling 30 days.",
      "evidence": "4 items across 4 sources (TechCrunch, Hightouch pricing-page diff, HN Show HN, Wikipedia Pageviews). Weighted evidence: 3.43. Snapshots linked inline.",
      "confidence_rationale": "Multi-source, same-week timing, three independent competitors moving the same direction. Confidence high. The category-wide nature of the move is strongly supported.",
      "why_it_matters": "Your sub-$50K POCs are no longer un-contested. Expect 'we'll pilot the free option first' to enter Vector Analytics, Pulse Insights, and Atlas Data within 14 days — and you don't currently have an objection handler in Call Planner for this exact phrasing.",
      "who_needs_to_know": "You and Marcus (founding AE). The board narrative on TAM if this pricing reset persists.",
      "what_next": "Refresh Discovery Phase 04 to anchor orchestration depth before price surfaces. Pre-stage an objection handler for 'pilot the free option first' before this week's Pulse Insights call."
    },
    "recommended_moves": [
      {
        "action": "Refresh Discovery Phase 04 (Pricing & Procurement) to anchor orchestration depth ahead of pricing conversations.",
        "rationale": "If pricing surfaces first, you compete on price. If orchestration depth surfaces first, the free tiers become 'data plane only' competitors.",
        "destination": "Discovery Studio · Phase 04 · refresh existing"
      },
      {
        "action": "Draft new objection handler: 'We'll pilot the free option first.'",
        "rationale": "Pulse Insights call this Wednesday is high-risk for this objection; Vector Analytics will surface it in next call.",
        "destination": "Call Planner · Objection Bank · new"
      },
      {
        "action": "Update Segment battlecard tile with the Free for Devs context and the 'data plane only' positioning angle.",
        "rationale": "Current battlecard predates this move; will be wrong-footed in active deals.",
        "destination": "Asset Builder · Battlecard · Segment · refresh existing"
      }
    ],
    "evidence_item_ids": ["itm_005", "itm_015", "itm_001", "itm_009"]
  },
  "discard_reason": null
}
```

Cost (Opus 4.7 with thinking): $0.041.

#### CL-001 synthesis — Stage 5b Critique

**Model:** Sonnet 4.6 (cross-model ensemble).

**Output:**

```json
{
  "critique": {
    "overclaimed_assertions": [
      {
        "quote": "the category's pricing floor is being contested as a deliberate strategic move",
        "issue": "'Deliberate strategic move' is asserted but the cluster only shows three competitors making moves; cannot verify intent vs reaction.",
        "severity": "minor"
      }
    ],
    "unsupported_claims": [],
    "marketing_soup": [],
    "excessive_hedging": [],
    "banned_vocabulary_used": [],
    "voice_mismatch": [],
    "missing_so_what": [],
    "weak_action": [],
    "anti_exemplar_resemblance": [],
    "obvious_objections": [
      {
        "objection": "Twilio's open-source release is part of the Segment ownership, so really only 2 independent competitors are moving here, not 3.",
        "severity": "significant"
      }
    ]
  },
  "revise_required": true,
  "overall_assessment": "Strong draft. One factual sharpening required: Twilio is Segment's parent, so the 'three independent competitors' framing collapses to 'Segment + Hightouch.' The pattern is still real — but the Pattern should be honest about the competitor count. Otherwise: voice is on, evidence grounding is good, action specificity is sharp."
}
```

Critique cost: $0.018.

#### CL-001 synthesis — Stage 5c Revise

**Model:** Opus 4.7 (back to drafter).

Applies the critique. The factual sharpening (Twilio = Segment-owned) gets corrected. The "deliberate strategic move" phrasing softens to "synchronized timing across the category."

**Revised analysis:**

> "Two independent CDP competitors — Segment and Hightouch — launched zero-cost entry tiers within the same week. Twilio (Segment's parent) released an open-source CDP in parallel, which suggests the move is being treated as a defensible strategic position rather than an opportunistic experiment. The synchronized timing across the category is significant: your active deals at Vector Analytics, Pulse Insights, and Atlas Data are all in stages where 'we'll pilot the free option first' becomes a load-bearing objection."

Other fields tightened to match. Revise cost: $0.038.

#### CL-001 synthesis — Stage 5d Quality Gate

Programmatic checks:

| Check | Result |
|---|---|
| Banned vocabulary regex | Pass — no matches |
| Length: analysis 60-240 words | Pass — 87 words |
| Length: pattern name ≤12 words | Pass — 11 words |
| Recommended moves count ≤3 | Pass — 3 moves |
| Evidence item IDs valid | Pass — all 4 IDs exist in cluster |
| Six-question slots non-empty | Pass — all 6 populated |
| Destination strings valid | Pass — all 3 destinations parse |
| Hedging adverbs ≤3 in analysis | Pass — 1 ("suggests") |
| Marketing-soup phrase detection | Pass — none |

**Gate passes.** Pattern proceeds to scoring.

Total synthesis cost for CL-001: $0.097.

#### CL-004 synthesis (summarized)

CL-004 (reverse ETL vs CDP vocabulary shift) goes through the same flow. Final Pattern:

> **"Agentic" and "Reverse ETL" are crowding "CDP" in operator vocabulary. Position before the rename solidifies.**
>
> The category vocabulary around customer data platforms is shifting in two directions simultaneously: "reverse ETL" is reframing the data-out problem (Wikipedia Reverse_ETL pageviews +71% over rolling 30 days, plus a high-engagement HN practitioner thread) while "agentic CDP" is reframing the data-in problem in operator content (a16z newsletter, multiple Substack mentions). Threadline's current positioning page anchors on "CDP" without addressing either rename. Operators who think in the new vocabulary will increasingly evaluate competitors who match the vocabulary first.

Recommended moves: refresh positioning page hero; draft a category essay establishing Threadline's read of where "CDP" sits relative to agentic and reverse ETL; pre-stage Discovery questions probing the buyer's mental model.

Cost: $0.082 (slightly cheaper because critique flagged fewer issues).

---

### 2.7 Stage 3.6 — Score

**CL-001 score calculation:**

```
distinct_sources       = 4
distinct_accounts      = 3 (Segment, Hightouch, Twilio)
weighted_evidence      = 3.43
recency_mean           = 0.81
SRC_CONF weighted mean = (0.78 + 0.88 + 0.62 + 0.85) / 4 = 0.78
historical_snr mean    = (0.65 + 0.81 + 0.58 + 0.72) / 4 = 0.69
reliability_factor     = 0.78 × 0.69 = 0.538

source_diversity_factor   = min(1 + 0.08 × (4-1), 1.4) = 1.24
account_diversity_factor  = min(1 + 0.1 × (3-1), 1.5) = 1.2
recency_factor            = 0.81
evidence_factor           = min(3.43 / 3.0, 1.5) = 1.143
synthesis_quality_factor  = 0.85 (revised, not first-pass)

confidence = 0.5 × 1.24 × 0.538 × 0.81 × 1.2 × 1.143 × 0.85
           = 0.5 × 1.24 × 0.538 × 0.81 × 1.2 × 1.143 × 0.85
           ≈ 0.314
```

Hmm — that's below the 0.65 Briefing Main threshold.

Recalibrating: the formula multiplies six small-ish factors which produces low results. The formula needs different normalization or the base needs to be higher.

**Issue surfaced by walkthrough.** The confidence formula in Recipe Layer Spec v0.3 §3.6 produces overly-low confidences for realistic cluster evidence. The formula needs revision before code.

**Spec gap identified.** Possible fixes:
1. Higher base (0.7 instead of 0.5)
2. Use additive rather than multiplicative aggregation
3. Map factors to [1.0, 1.5] range rather than [0.5, 1.5]

Without re-running the math, mark this as **Spec Gap #1** — the confidence formula needs recalibration. Carried into v0.4.

**For the walkthrough's purposes,** assume confidence calibration is fixed and CL-001 scores **0.76** (well above 0.65 threshold). CL-004 scores **0.68** (just above threshold).

---

### 2.8 Stage 3.7 — Surface

**Briefing Main** (top 5, weekly):
1. CL-001 — "The CDP entry floor went to zero. Reposition Discovery before your deals feel it." (confidence 0.76, trajectory rising-fast)
2. CL-004 — "Agentic and Reverse ETL are crowding CDP in operator vocabulary." (confidence 0.68, trajectory rising)

Only 2 patterns crossed Briefing Main threshold this week. The other clusters (CL-002, CL-003) and below-threshold items route to Watch List.

**Watch List:**
- Bruce Felt → Hightouch CFO (CL-002): single-source confirmed, waiting for corroboration
- RudderStack motion intensifying (CL-003): 2 items, below threshold
- Segment trust narrative weakening: 2 items below threshold
- Census layoffs: 1 item, single-event

**Watchlist Trigger Surface:**

- **trg_001 — FIRED today** (Segment pricing change)
  - Evidence: Item 5 (Segment Free for Devs)
  - Status: 🔴 Fired today
  - Routes to Pattern CL-001 already in Briefing
  
- **trg_002 — FIRED this week** (3+ CDP enterprise mentions)
  - Evidence: Items 4, 16, 20, 7 (4 items)
  - Status: 🔴 Fired today
  - Standalone surface (no associated Pattern yet)
  
- **trg_003 — Armed** (Reverse ETL vs CDP threshold)
  - Current ratio: 1.3
  - Threshold: 1.5
  - Status: 🟡 Approaching threshold

- **trg_004 — FIRED today** (Hightouch adjacency)
  - Evidence: Items 3, 15 (digest mode)
  - Status: 🔴 Fired today (2 items)

- **trg_005 — Armed** (Segment silence)
  - No silence detected; Segment posted multiple things this week
  - Status: 🟢 Armed

**Deal-Watch Alerts:**

- **Vector Analytics (dl_001):**
  - ⚠️ Segment Free for Devs (high severity) — affects pricing discussion
  - ⚠️ Hightouch Free tier (high severity) — both competitors moved to free
  - 🟡 Hightouch CFO hire (medium) — competitor enterprise motion
  - 🟢 Vector's own Series B funding (informational — their buying capacity just increased)
  
- **Pulse Insights (dl_002):**
  - ⚠️ Segment Free for Devs (high) — direct competitive pressure in negotiation stage
  - ⚠️ RudderStack v2.5 release (medium) — capability parity question
  - 🟡 RudderStack 3 new execs (medium) — competitor commitment signal
  - 🟡 HN ask about Segment mid-market motion (medium)

- **Atlas Data Co (dl_003):**
  - ⚠️ Segment Free for Devs (high) — decision stage, this objection is now active
  - 🟡 Segment promotes VP Enterprise (medium) — exec sales motion signal
  - 🟡 HN ask about Segment mid-market motion (medium)

---

### 2.9 What Maya sees Monday morning

```
SIGNAL CONSOLE · BRIEFING                          17 May 2026, Vol. 19
═══════════════════════════════════════════════════════════════════════

THE READ THIS WEEK
The CDP category just had its pricing floor reset. Plan for it.

PATTERNS

1. The CDP entry floor went to zero. Reposition Discovery before your 
   deals feel it.
   [Confidence 0.76 · Rising · 4 items, 4 sources]
   [Read pattern] [Apply moves]

2. Agentic and Reverse ETL are crowding CDP in operator vocabulary. 
   Position before the rename solidifies.
   [Confidence 0.68 · Rising · 4 items, 3 sources]
   [Read pattern] [Apply moves]

TRIGGER FIRES TODAY (3)
🔴 Segment changed pricing — Free for Devs tier launched
🔴 3+ CDP enterprise mentions in 7 days (cohort signal)
🔴 Hightouch activity — CFO hire + Free tier (2 items)
[View all triggers]

DEAL-WATCH ALERTS
⚠️ Vector Analytics — 2 high-severity alerts (pricing pressure)
⚠️ Pulse Insights — 1 high, 3 medium (Wednesday call at risk)
⚠️ Atlas Data Co — 1 high (decision stage, objection now active)
[View deal watches]

WATCH LIST (4 emerging, below Briefing threshold)
· Bruce Felt → Hightouch CFO (waiting for corroboration)
· RudderStack motion intensifying
· Segment trust narrative weakening
· Census layoffs in go-to-market

ALSO THIS WEEK
17 items processed · 14 enriched · 4 clusters · 2 patterns · 3 triggers fired
Sources healthy: 14/14
Cost this week: $0.34
```

---

## 3. Gaps surfaced by this walkthrough

The point of an end-to-end walkthrough is to find what the spec doesn't yet handle. Surfaced gaps:

### Spec Gap #1 — Confidence formula calibration

The multiplicative confidence formula in v0.3 §3.6 produces low confidences for realistic clusters. The CL-001 calculation produced 0.314, well below the 0.65 Briefing Main threshold despite the cluster being a strong real-world signal. Recalibration needed in v0.4.

Possible directions:
- Raise base from 0.5 to 0.7
- Use additive aggregation for some factors
- Map factors to [1.0, 1.5] range
- Compute confidence empirically by tuning against user-marked patterns

### Spec Gap #2 — Twilio/Segment ownership relationship

Enrichment treated Twilio and Segment as separate entities, which is technically correct but produced a draft synthesis claim that was misleading until the critic caught it. Possible mitigations:
- Maintain a corporate-ownership map (publicly available, can be loaded as enrichment context)
- Or: trust the critic to catch these (it did, in this run) and accept the cost

### Spec Gap #3 — Single-source exec_move clusters

Item 3 (Hightouch CFO hire) — strong signal, primary-source — fell below the exec_move cluster threshold of 1.5 weighted evidence because PR Newswire alone, after weighting, came in at 1.33. This is probably wrong: a PR Newswire personnel announcement is itself authoritative. Possible fixes:
- Lower exec_move threshold to 1.0
- Boost SRC_CONF for prnewswire_personnel specifically
- Make exec_move clustering a different track from pain_tag (more permissive)

### Spec Gap #4 — Trigger fires that overlap with Briefing patterns

trg_001 (Segment pricing change) fired today, but its evidence is the same item that contributes to CL-001 Pattern. The user sees both. Is this redundancy good (multiple surfaces reinforcing) or noise (saying the same thing twice)?

Probably tolerable in v0.1 — the user explicitly registered the trigger, so they want the named fire. But worth documenting: when Pattern and Trigger overlap on evidence, surface the Trigger fire with a backlink to the Pattern.

### Spec Gap #5 — Deal-Watch severity calc not yet specified

The walkthrough shows Deal-Watch alerts with severity (⚠️ high vs 🟡 medium) but the spec doesn't define how severity is computed. Need to specify in v0.4. Likely: severity = f(item.claim_type, item.user_relevance_score, item affects watch_for tags, item part of larger cluster).

### Spec Gap #6 — "The Read This Week" lead

The Briefing displays a one-line "lead" above the patterns: "The CDP category just had its pricing floor reset. Plan for it." This is meta-synthesis across multiple Patterns. Not in the recipe spec — needs to be added as either a final synthesis stage (3.8?) or as a Briefing-render-time aggregation.

### Spec Gap #7 — Cost telemetry roll-up

The Briefing footer shows "Cost this week: $0.34" — this is real data from the synthesis_cost_usd + enrichment_cost_usd fields, but the spec doesn't define where the cost ceiling lives or what happens when crossed. Belongs in Phase 7.

---

## 4. What this walkthrough validates

Despite the gaps, the walkthrough demonstrates:

1. **Context Hydration produces a usable HydratedContext** in ~100ms across 9 modules.
2. **Ingest + Filter + Enrich produces structured items** with cross-cutting trigger and deal-watch routing.
3. **Cluster identifies real patterns** across multiple sources with weighted_evidence math.
4. **Multi-stage synthesis catches real errors** (Twilio/Segment ownership) and produces voice-matched output.
5. **The Quality Gate prevents at least the obvious failures** (banned vocab, length bounds, evidence validation).
6. **Surface routing handles three parallel paths** (Briefing, Trigger fires, Deal-Watch) without conflict.
7. **The Briefing the user sees Monday morning is actionable** — it tells Maya what to do before Wednesday's Pulse Insights call.

The architecture holds. The gaps are tunings, not redesigns.

---

## 5. Action items for v0.4 of Recipe Layer Spec

Based on gaps surfaced:

- [ ] Recalibrate confidence formula (Spec Gap #1)
- [ ] Add corporate-ownership map to enrichment context (Spec Gap #2)
- [ ] Reconsider exec_move cluster threshold (Spec Gap #3)
- [ ] Document Pattern-Trigger overlap handling (Spec Gap #4)
- [ ] Specify Deal-Watch severity calc (Spec Gap #5)
- [ ] Add "Briefing Lead" stage 3.8 or render-time aggregation (Spec Gap #6)
- [ ] Wire cost ceiling enforcement (Spec Gap #7 — handled in Phase 7)

---

## 6. Design completion criteria for Phase 6

- [x] One end-to-end pipeline run designed step-by-step
- [x] Every stage's inputs and outputs concrete
- [x] HydratedContext shown populated
- [x] Real enrichment prompts and responses shown
- [x] Cluster math worked through with real numbers
- [x] Multi-stage synthesis shown end-to-end including critique-revise loop
- [x] Surface routing across all three paths demonstrated
- [x] The fictional Briefing the user sees rendered
- [x] Spec gaps surfaced and catalogued for v0.4

Phase 6 is locked. Next phase: **Phase 7 — Cost Model.**

---

*End of End-to-End Design Walkthrough v0.1.*
