# Signal Console — Recipe Layer Specification

**Version:** 0.4 (Posture cash-out + Phase 6 gap closure)
**Date:** 17 May 2026
**Status:** Locked for evaluation harness integration
**Supersedes:** v0.3 (17 May 2026)
**Upstream commitments:** Design Posture v0.1 (foundational), Voice Document v0.1 (editorial), GTM OS Read Interface Contracts v0.1 (integration)

---

## 0. Purpose

Signal Console is the intelligence layer of the GTM OS, operating under the **provocative posture** committed to in Design Posture v0.1. This means the system does not only serve the user's stated preferences — it also tells them what they may be missing (coverage), where their stated assumptions may be wrong (framing), and how to defend the decisions they have made (defensibility). Each of these obligations is now reflected in concrete pipeline stages, data models, and surfaces.

The recipe layer is the pipeline that turns raw free-source external data, internal GTM OS state, and the user's stated assumptions into Briefing Patterns, Contrarian Patterns, Periphery Candidates, Watchlist Trigger fires, Deal-Watch alerts, and audit envelopes that preserve the reasoning behind every surfaced output.

v0.4 introduces three new pipeline elements that operationalize the Design Posture obligations, plus seven targeted fixes that close the gaps surfaced in the Phase 6 end-to-end walkthrough.

---

## 1. Design principles (locked, extended from v0.3)

All twelve principles from v0.3 §1 carry forward. Three additions reflect the Design Posture cash-out:

13. **The user's stated preferences are hypotheses under continuous evaluation, not fixed truths to be served.** This is the foundational epistemic commitment from Design Posture v0.1 §2. Every downstream stage that references user state (watchlist, ICP, competitive set, value proposition, pain themes) treats that state as testable rather than authoritative.

14. **Coverage, framing, and defensibility are first-class pipeline obligations, not features.** Periphery Detection, Contrarian Synthesis, and the Audit Envelope subsystem are not optional add-ons; they are structural commitments that ship as part of the recipe layer or the system has failed its posture.

15. **Provocative surfaces operate on different thresholds than responsive surfaces.** Periphery candidates and Contrarian Patterns fire less often than standard Patterns, with higher confidence each time. Precision dominates recall on the provocative side because the cost of being wrong on a provocative surface is higher than the cost of being wrong on a responsive one.

---

## 2. Architecture at a glance

```
                    ┌─────────────────────────────────────┐
                    │  GTM OS state + posture artifacts   │
                    │  • ICP Studio · Discovery · etc.    │
                    │  • Active Deals · Watchlist Triggers│
                    │  • Voice Document                   │
                    │  • Behavioral Feedback              │
                    │  • Corporate Ownership Map          │  ← NEW v0.4
                    └────────────────┬────────────────────┘
                                     │
                                     ▼
                  [0] CONTEXT HYDRATION
                                     │
   RAW SOURCES                       │
       │                             │
       ▼                             ▼
   [1] INGEST  ──► raw_items[]  ────────────────────────────┐
       │                                                     │
       ▼                                                     │
   [2] FILTER                                                │
       │                                                     │
       ▼                                                     │
   [3] ENRICH ──► enriched_items[]                           │
       │                                                     │
       ├──► [3b] PERIPHERY DETECTION  ────► periphery_     ──┼─┐
       │         (parallel, off-watchlist  candidates[]      │ │  ← NEW v0.4
       │         signal scoring)                             │ │
       │                                                     │ │
       ▼                                                     │ │
   [4] CLUSTER                                               │ │
       │                                                     │ │
       ▼                                                     │ │
   [5] SYNTHESIZE (multi-stage)                              │ │
       │  ├── 5a DRAFT                                       │ │
       │  ├── 5b CRITIQUE                                    │ │
       │  ├── 5c REVISE                                      │ │
       │  └── 5d QUALITY GATE                                │ │
       │                                                     │ │
       ├──► [5e] CONTRARIAN SYNTHESIS ────► contrarian_  ─── ┼─┼─┐ ← NEW v0.4
       │         (compares clusters       patterns[]         │ │ │
       │         against user assumptions)                   │ │ │
       │                                                     │ │ │
       ▼                                                     │ │ │
   [6] SCORE (recalibrated formula)  ◄── confidence v0.4     │ │ │
       │                                                     │ │ │
       ▼                                                     │ │ │
   [7] SURFACE                                               │ │ │
       │                                                     │ │ │
       ├──► [8] BRIEFING COMPOSE ────► briefing_lead         │ │ │  ← NEW v0.4
       │         (render-time meta-synthesis)                │ │ │
       │                                                     │ │ │
       ├── BRIEFING MAIN ──────────────────────────────────► │ │ │
       ├── CONTRARIAN BRIEFING ─────────► (from contr) ◄───  │ │ │
       ├── WATCH LIST + PERIPHERY ──────► (from periph) ◄─── │ │ │
       └── ARCHIVE                                           │ │ │
                                                             │ │ │
                              ┌──────────────────────────────┘ │ │
                              ▼                                │ │
              [TR] WATCHLIST TRIGGER FIRES                     │ │
                              ┌────────────────────────────────┘ │
                              ▼                                  │
              [DW] DEAL-WATCH ALERTS (severity computed v0.4)    │
                              ┌──────────────────────────────────┘
                              ▼
              [FB] BEHAVIORAL FEEDBACK LOOP

           ◊ AUDIT ENVELOPE ◊  (wraps everything above, ← NEW v0.4
             captures immutable state at every synthesis,
             surfacing, and user-action point)
```

LLM-invoking stages: 3 (enrich), 3b (periphery scoring — uses smaller LLM call per item only when needed), 5a/b/c (synthesize), 5e (contrarian synthesize), 8 (briefing compose). Audit envelope is cross-cutting infrastructure that wraps every LLM call and every user action.

---

## 3. Pipeline stages

### 3.0 Context Hydration (updated v0.4)

Unchanged from v0.3 except for one addition: HydratedContext now includes the **Corporate Ownership Map** as an additional context artifact. The map is a static JSON resource maintained quarterly, mapping known parent-subsidiary relationships among public and prominent private companies.

The map is needed because of Spec Gap #2 from Phase 6: the Twilio/Segment ownership relationship caused the draft synthesis to treat them as three independent competitors when they are functionally two (Twilio owns Segment; the open-source CDP release was a defensible-positioning move by the same corporate entity). The critic caught it in walkthrough, but catching it at the enrichment stage is structurally better.

**CorporateOwnershipMap schema:**

```json
{
  "schema_version": "1.0",
  "last_updated": "2026-05-17",
  "source": "manual_curation_quarterly",
  "relationships": [
    {
      "parent": "Twilio",
      "child": "Segment",
      "relationship_type": "owns",
      "since": "2020-11-01"
    },
    {
      "parent": "Salesforce",
      "child": "Slack",
      "relationship_type": "owns",
      "since": "2021-07-01"
    },
    {
      "parent": "Microsoft",
      "child": "LinkedIn",
      "relationship_type": "owns",
      "since": "2016-12-08"
    }
  ]
}
```

The map is loaded once per pipeline run alongside other HydratedContext elements. Enrichment, clustering, and synthesis all reference it. Curation is quarterly — public corporate ownership rarely changes monthly, so quarterly is the right cadence.

---

### 3.1 Ingest

Unchanged from v0.3.

---

### 3.2 Filter

Unchanged from v0.3.

---

### 3.3 Enrich (updated v0.4)

The enrichment prompt is extended to use the Corporate Ownership Map. When extracting entities, the prompt is now instructed to identify parent-subsidiary relationships from the map and surface them in the output. This prevents the downstream synthesis from treating subsidiary moves as independent corporate actions.

**Enrichment prompt addition (v0.4):**

```
CORPORATE OWNERSHIP MAP (loaded from HydratedContext)
=====================================================
{map_relationships_as_serialized_list}

ADDITIONAL EXTRACTION RULE
==========================
When the item mentions a company that appears as either parent or child in the
ownership map, surface the relationship in your output's entities.companies
field by appending the parent in parentheses, e.g., "Segment (Twilio-owned)".
This prevents downstream synthesis from treating subsidiary moves as
independent corporate actions.
```

The rest of the enrichment prompt (entity extraction, exec_move, claim_type, pain_tags, relevance scoring, trigger matching, deal affecting) is unchanged from v0.3.

---

### 3.3b Periphery Detection (NEW v0.4)

**Posture mapping:** the obligation to coverage. (Design Posture v0.1 §3.1)

**Purpose:** Surface entities, themes, and signals that the user has not named but that the data suggests they should be watching. This stage operates in parallel with Stage 3.3 Enrich but uses inverted logic — it specifically looks at off-watchlist entities through different signals than user-relevance scoring.

**Input:** `filtered_items[]` from Stage 3.2 + HydratedContext.
**Output:** `periphery_candidates[]`.

**Logic:**

For each item with at least one entity in `entities.companies` that is NOT in the user's watchlist or competitive set, compute a `periphery_relevance_score` from five signals:

```
periphery_relevance_score = weighted_sum:
  0.25 × co_occurrence_score          # appears alongside watched entities
  0.20 × investor_overlap_score        # shares investors with watched entities
  0.20 × vocabulary_overlap_score      # uses operator vocabulary from user's category
  0.20 × buyer_overlap_score           # customers in user's ICP buyer profile
  0.15 × hiring_overlap_score          # hires from same talent pool as competitors
```

Each sub-score is in [0, 1]. Total score is in [0, 1].

**Sub-score computation:**

- **co_occurrence_score** = (count of items where entity X co-occurs with any watched entity in last 90 days) / (total items mentioning entity X in last 90 days). Higher ratio means tighter co-occurrence.
- **investor_overlap_score** = 1.0 if entity shares lead investor with any competitor; 0.7 if shares any common investor; 0.4 if shares same accelerator; 0 otherwise. (Requires investor map; v0.4 uses Crunchbase free tier + public press releases; long-term build out via curated map similar to ownership map.)
- **vocabulary_overlap_score** = Jaccard similarity of entity's marketing-page pain_tags vs user's pain_lib. Computed at item-time using the enrichment LLM's extracted pain_tags for items mentioning the entity.
- **buyer_overlap_score** = 1.0 if entity's case-study customers (extracted from their /customers page via Tier B fetch) overlap with user's ICP attributes by >50%; lower otherwise.
- **hiring_overlap_score** = 1.0 if entity hires execs from companies in user's competitive_set within last 12 months; lower otherwise.

Items with `periphery_relevance_score >= 0.55` qualify as periphery candidates. The threshold is deliberately higher than the standard `user_relevance_score >= 0.4` for surfacing — provocative surfaces require higher precision.

**PeripheryCandidate schema:**

```json
{
  "candidate_id": "pc_xxxxx",
  "entity_name": "Cube Cloud",
  "entity_type": "company",
  "first_seen_at": "ISO-8601",
  "last_seen_at": "ISO-8601",
  "appearance_count_30d": 17,
  "periphery_relevance_score": 0.78,
  "score_breakdown": {
    "co_occurrence_score": 0.85,
    "investor_overlap_score": 1.0,
    "vocabulary_overlap_score": 0.72,
    "buyer_overlap_score": 0.6,
    "hiring_overlap_score": 0.4
  },
  "reasoning_summary": "Co-occurs with Snowflake in 14 of 17 items. Shares lead investor (Sequoia) with Hightouch. Uses 'reverse ETL' vocabulary from user's pain_lib. Appears in case studies of Vector Analytics, which is in user's ICP buyer profile.",
  "supporting_item_ids": ["itm_xxx", "itm_yyy"],
  "user_action": "pending | added_to_watchlist | dismissed | snoozed",
  "user_action_at": "ISO-8601 | null"
}
```

**Surfacing rules:**

- Periphery candidates surface to the **Periphery Watch** sub-surface of the Watch List primary surface.
- Display order: by `periphery_relevance_score` descending.
- Each candidate displays the `reasoning_summary` and the top-3 supporting items.
- User actions: Add to Watchlist (one-click; triggers add to watchlist and removes from periphery), Dismiss (suppresses permanently unless score grows materially), Snooze (resurfaces in 30 days if score persists).

**Cost:** Periphery Detection is mostly deterministic computation over enriched items. The vocabulary_overlap_score requires the enrichment LLM to have extracted pain_tags from the original items, which is already happening, so no additional LLM cost there. The buyer_overlap_score may require Tier B fetches of competitor /customers pages, which is a one-time fetch per competitor per quarter. Net cost addition: roughly $0.001-0.003 per item for items that reach periphery scoring (~30% of filtered items). Total weekly addition: ~$0.005-0.010 per user.

**Failure modes:**

- Investor map stale → reduced sensitivity to investor_overlap signal; not pipeline-blocking.
- Vocabulary too narrow (user's pain_lib has few entries) → low vocabulary_overlap scores systemically; pipeline produces fewer candidates; surfaces a prompt: "Add to your pain library for better periphery detection."
- Periphery becomes noisy (too many candidates surfaced) → threshold tunable; user behavioral feedback (added vs dismissed) feeds into score weights over time.

---

### 3.4 Cluster (updated v0.4)

Cluster logic is largely unchanged from v0.3. Two specific fixes for Spec Gap #3:

**exec_move cluster threshold lowered from 1.5 to 1.0.** Reasoning from Phase 6: a PR Newswire Personnel Announcement is a primary-source corporate disclosure; a single such item should be sufficient evidence of an exec event, not require additional corroboration. The walkthrough's Item 3 (Bruce Felt CFO at Hightouch) computed weighted_evidence of 1.33 — below the v0.3 threshold of 1.5 — but is clearly real signal. Lowering the threshold to 1.0 fixes this without compromising standards, because the weighted-evidence math already accounts for source reliability.

**Additional gate for exec_move clusters:** single-source exec_move clusters qualify only if the source has `SRC_CONF >= 0.7`. This prevents low-reliability sources (rumor sites, unverified blog posts) from triggering exec_move clusters on their own.

**Updated cluster qualification rules:**

```
For pain_tag and company clusters (unchanged from v0.3):
  Σ item_weight[i] >= 3.0
  distinct_sources >= 2
  distinct_accounts >= 2
  ∃ item with user_relevance_score >= 0.7

For exec_move clusters (v0.4):
  Σ item_weight[i] >= 1.0
  AND (
    distinct_sources >= 2
    OR
    (distinct_sources == 1 AND SRC_CONF[primary_source] >= 0.7)
  )
```

---

### 3.5 Synthesize (multi-stage)

Stages 5a-5d unchanged from v0.3.

---

### 3.5e Contrarian Synthesis (NEW v0.4)

**Posture mapping:** the obligation to framing. (Design Posture v0.1 §3.2)

**Purpose:** Surface patterns whose evidence contradicts or complicates the user's stated assumptions. Operates as a parallel synthesis path comparing surfaced clusters against the user's ICP criteria, competitive set ordering, value proposition framing, and prioritized pain themes.

**Input:** `clusters[]` (above threshold, post-Stage 3.4) + HydratedContext (with explicit user assumptions extracted) + Voice Document (with contrarian voice register).
**Output:** `contrarian_patterns[]`.

**Logic:**

For each cluster, the Contrarian Synthesis pass asks: does this cluster's evidence contradict or complicate any of the user's stated assumptions? If yes, generate a Contrarian Pattern. If no, skip.

**Extracted user assumptions:**

From HydratedContext, the following user-stated assumptions are extracted and made explicit in the Contrarian Synthesis prompt:

- ICP criteria (with weights) — testable claims about who the buyer is
- Competitive set ordering (primary / secondary / asymmetric) — testable claims about who is competing
- Value proposition framing (from positioning page if accessible; from ICP Studio's icp_summary otherwise) — testable claims about why buyers choose
- Pain themes prioritized (top-weighted pain_tags from PAIN_LIB) — testable claims about what buyers care about

**Contrarian Synthesis prompt (v0.4):**

```
You are evaluating whether a cluster of evidence contradicts or complicates the
user's stated assumptions. The user is a B2B SaaS GTM operator. Their stated
assumptions are below. The cluster's evidence is below. Your job is to assess
whether the evidence challenges any assumption — and if so, generate a
Contrarian Pattern that surfaces the contradiction.

USER STATED ASSUMPTIONS (extracted from GTM OS state)
=====================================================
ICP criteria:
{icp_criteria_serialized}

Competitive set ordering:
{competitive_set_serialized}

Value proposition framing:
{value_prop_serialized}

Prioritized pain themes:
{prioritized_pain_themes_serialized}

CLUSTER UNDER EVALUATION
========================
Cluster anchor: {anchor}
Cluster type: {cluster_type}
Items: {items_summarized}

CONTRARIAN VOICE REGISTER (from Voice Document)
===============================================
{contrarian_voice_exemplars}

Cooler, more clinical than the standard register. Analyst presenting findings
the analyst suspects the audience will resist. Frame as "your stated assumption
is X; the evidence suggests Y."

TASK
====
Step 1: For each user assumption above, ask: does this cluster's evidence
support, contradict, or complicate that assumption?

Step 2: If at least one assumption is materially contradicted or complicated by
the evidence, generate a Contrarian Pattern. Otherwise, return null (do not
force a Contrarian Pattern when the evidence is consistent with the user's
assumptions).

Step 3: If generating a Contrarian Pattern, structure as:

{
  "should_emit": true | false,
  "skip_reason": "string (if should_emit false)",
  "contrarian_pattern": {
    "name": "string (1 sentence, declarative, frames the challenge)",
    "challenged_assumption": "string (which user assumption is being challenged)",
    "challenged_field": "icp_criterion | competitive_set | value_prop | pain_theme",
    "evidence_against_assumption": "string (2-3 sentences, the evidence's actual claim)",
    "what_this_means": "string (1-2 sentences, the so-what)",
    "suggested_reconsideration": "string (1 sentence, what the user might revisit)",
    "evidence_item_ids": ["itm_xxx"],
    "confidence_in_contradiction": 0.0-1.0
  }
}

VOICE RULES
===========
- Use the contrarian voice register
- Banned vocabulary: same as standard voice document
- Be specific: name the assumption verbatim; cite specific evidence
- Avoid sneering or condescension. The user's assumption was a reasonable
  guess; the evidence simply suggests it needs updating.
- If confidence_in_contradiction < 0.7, do not emit.
```

**Contrarian Synthesis runs only on clusters that already passed the standard quality gate.** This means it operates on validated clusters, not raw possibilities. The contrarian path does not multiply low-quality clusters; it provides an alternative reading of high-quality ones.

**Model selection:** Sonnet 4.6 with extended thinking. Reasoning model is appropriate because the contrarian path requires reasoning about user assumptions vs evidence. Cheaper than Opus draft because the input is smaller (single cluster, not multi-cluster synthesis).

**ContrarianPattern schema:**

```json
{
  "contrarian_pattern_id": "cpat_xxxxx",
  "cluster_id": "cls_xxxxx",
  "name": "Your ICP weights CRO-required at 0.92. Evidence suggests pre-CRO companies are buying CDP infrastructure faster.",
  "challenged_assumption": "Series A-B B2B SaaS with CRO under 12 months in role",
  "challenged_field": "icp_criterion",
  "evidence_against_assumption": "string",
  "what_this_means": "string",
  "suggested_reconsideration": "string",
  "evidence_item_ids": ["itm_xxx"],
  "confidence_in_contradiction": 0.78,
  "voice_register": "contrarian",
  "synthesis_path": { /* same shape as Pattern.synthesis_path */ },
  "surface_state": "draft | active | acknowledged | dismissed_with_reason"
}
```

**Surfacing rules:**

- ContrarianPatterns surface to the **Contrarian Briefing** sibling tab, NOT to the standard Briefing Main.
- Cadence: monthly digest rather than weekly. Contrarian evidence accumulates slowly; weekly cadence would surface noise.
- User actions: Acknowledge (user has considered and accepted the challenge — feeds back to ICP refinement), Dismiss with reason (user explicitly rejects the challenge — feeds back to calibrate confidence_in_contradiction threshold).

**Frequency expectations:** Most months will surface 0-2 ContrarianPatterns. Months with major category shifts will surface 3-5. The system should not feel like it is constantly challenging the user; quiet months mean the user's assumptions are aligned with the data, and that is fine.

**Cost:** Each ContrarianPattern synthesis costs ~$0.025-0.040 with Sonnet 4.6 + extended thinking. With ~2 emitted per month against ~5 clusters evaluated, monthly cost is ~$0.10-0.20 per user. Annualized: ~$1.50-2.40 per user. Modest.

**Failure modes:**

- Contrarian path fires too often → confidence_in_contradiction threshold raised; voice register tuned to be more conservative
- Contrarian path fires too rarely → assumption extraction may be incomplete; review whether HydratedContext is surfacing all user assumptions
- Contrarian voice drifts into sneering or condescension → caught by evaluation harness with separate test set for contrarian register
- User dismisses 3+ in a row with the same reason → meta-prompt: "we've been challenging X repeatedly; want us to stop?" — gives user explicit control without removing the obligation

---

### 3.6 Score (recalibrated v0.4 — closes Spec Gap #1)

The v0.3 confidence formula produced overly-low confidences for realistic clusters (CL-001 in walkthrough computed to 0.314, well below the 0.65 Briefing Main threshold despite being a strong signal). The root cause: multiplying six small factors together compresses all outputs toward zero.

**v0.4 recalibrated formula:**

```python
# Quality multipliers (sub-1, multiplicative — degrade confidence when low)
reliability_mult  = weighted_mean(SRC_CONF[source] × historical_snr[source])
recency_mult      = mean(exp(-Δdays / 14) for item in cluster)
synthesis_mult    = 1.0 if zero critique blockers else 0.85

quality_score = reliability_mult × recency_mult × synthesis_mult

# Diversity / evidence bonuses (additive, capped — add confidence above quality floor)
source_div_bonus  = min(0.08 × max(0, distinct_sources - 1), 0.30)
account_div_bonus = min(0.10 × max(0, distinct_accounts - 1), 0.35)
evidence_bonus    = min(0.10 × max(0, weighted_evidence_count - 3.0), 0.20)

# Composite
base = 0.55
confidence = (base × quality_score) + source_div_bonus + account_div_bonus + evidence_bonus
confidence = clamp(confidence, 0.0, 1.0)
```

**Worked example — CL-001 from Phase 6 walkthrough:**

```
reliability_mult  = 0.548
recency_mult      = 0.81
synthesis_mult    = 0.85 (revised)
quality_score     = 0.548 × 0.81 × 0.85 = 0.377

source_div_bonus  = 0.08 × 3 = 0.24
account_div_bonus = 0.10 × 2 = 0.20
evidence_bonus    = 0.10 × (3.43 - 3.0) = 0.043

confidence = 0.55 × 0.377 + 0.24 + 0.20 + 0.043
           = 0.208 + 0.483
           = 0.691
```

Above the 0.65 Briefing Main threshold. Matches the Phase 6 walkthrough's intended outcome.

**Worked example — CL-004 (vocabulary shift):**

```
reliability_mult  = 0.519 (mix of Wikipedia, a16z Substack, HN, indep Substack)
recency_mult      = 0.81
synthesis_mult    = 1.0 (no revisions needed)
quality_score     = 0.519 × 0.81 × 1.0 = 0.420

source_div_bonus  = 0.08 × 3 = 0.24
account_div_bonus = 0.10 × 2 = 0.20
evidence_bonus    = 0.10 × (3.1 - 3.0) = 0.010

confidence = 0.55 × 0.420 + 0.24 + 0.20 + 0.010
           = 0.231 + 0.450
           = 0.681
```

Also above threshold. Matches walkthrough.

**Updated thresholds:**

```
if confidence >= 0.65 AND weighted_evidence_count >= 3.0:
    → BRIEFING MAIN
elif confidence >= 0.40 AND weighted_evidence_count >= 2.0:
    → WATCH LIST
else:
    → ARCHIVE
```

Watch List threshold dropped from 0.45 to 0.40 to accommodate the new formula's distribution (which produces slightly lower midrange values than v0.3 would have for borderline clusters).

**Trajectory strength** (separate from confidence) unchanged from v0.3 — magnitude of cluster slope used for ranking within a surface.

---

### 3.7 Surface (updated v0.4 — closes Spec Gaps #4 and #5)

**Surface paths now include:**

1. Briefing Main (top 5 standard Patterns)
2. Contrarian Briefing (monthly digest of ContrarianPatterns) — NEW v0.4
3. Watch List (below-threshold Patterns + emerging) + Periphery sub-surface — UPDATED v0.4
4. Watchlist Trigger fires (event-based)
5. Deal-Watch alerts (per-deal)
6. Archive

**Spec Gap #4 — Pattern-Trigger overlap handling (resolved):**

When a Watchlist Trigger fire shares evidence with a Pattern, surface both with cross-links rather than deduplicating:

```python
def handle_pattern_trigger_overlap(pattern, trigger_fire):
    overlap = (
        len(set(pattern.evidence_item_ids) & set(trigger_fire.evidence_item_ids)) /
        max(len(set(trigger_fire.evidence_item_ids)), 1)
    )
    
    if overlap >= 0.5:
        # Substantial overlap — link them
        trigger_fire.related_pattern_id = pattern.pattern_id
        pattern.triggered_triggers.append(trigger_fire.trigger_id)
        
        # Both surface; trigger fire gets "Related Pattern" link, 
        # Pattern gets "Triggered: trg_NNN" badge
    
    # User explicitly registered the trigger; we do not hide either surface
```

**Spec Gap #5 — Deal-Watch severity calc (specified):**

```python
def compute_deal_watch_severity(item, deal):
    claim_type_factor = {
        "fact": 1.0,
        "inference": 0.7,
        "pattern": 0.85,
        "recommendation": 0.6,
        "hypothesis": 0.4,
        "unverified": 0.3
    }[item.claim_type]
    
    relevance_factor = item.user_relevance_score  # 0.0 to 1.0
    
    stage_factor = {
        "decision": 1.0,
        "negotiation": 0.85,
        "evaluation": 0.7,
        "closed_won": 0.0,    # no alert needed
        "closed_lost": 0.0
    }[deal.stage_estimate]
    
    trajectory_factor = {
        "rising_fast": 1.0,
        "rising": 0.85,
        "flat": 0.6,
        "falling": 0.5
    }.get(item.trajectory or "flat", 0.6)
    
    # watch_for tag intersection
    watch_for_factor = (
        1.0 if set(item.topic_tags) & set(deal.watch_for)
        else 0.6
    )
    
    # Weighted sum (sums to 1.0 if all factors maxed)
    severity = (
        0.25 × claim_type_factor +
        0.25 × relevance_factor +
        0.20 × stage_factor +
        0.15 × trajectory_factor +
        0.15 × watch_for_factor
    )
    
    return severity   # 0.0 to 1.0
```

**Severity bands:**

| Band | Score range | UI marker |
|---|---|---|
| High | ≥ 0.75 | ⚠️ |
| Medium | 0.50 - 0.74 | 🟡 |
| Informational | 0.30 - 0.49 | 🟢 |
| Below threshold | < 0.30 | not surfaced |

**Pattern expiration (unchanged from v0.3):** fresh → active → fading → archived, with re-elevation on ≥20% new weighted evidence.

---

### 3.8 Briefing Compose (NEW v0.4 — closes Spec Gap #6)

**Purpose:** Generate the one-line "The Read This Week" lead that appears above the Patterns in the Briefing. The lead is meta-synthesis across all surfaced Patterns — what does the week's intelligence add up to?

**Input:** Top-N surfaced Patterns (Briefing Main) + Voice Document.
**Output:** A single 1-2 sentence "lead" + an optional subhead.

**Prompt:**

```
You are writing the lead for a weekly Briefing. The user reads this single
sentence before reading any Patterns. It must capture what is most important
across all Patterns this week in 1-2 sentences. Match the Voice Document.

PATTERNS THIS WEEK (in order of surfaced rank)
==============================================
{pattern_summaries}

VOICE DOCUMENT EXCERPTS
=======================
{voice_exemplars}

OUTPUT
======
{
  "lead": "string (1-2 sentences, captures the dominant theme across Patterns)",
  "subhead": "string (optional, 1 sentence, secondary theme or call to action)"
}

RULES
=====
- Lead must reference what is happening this week, not generic observations
- If patterns share a theme, name it; if they don't, name the most consequential
- Match the same voice register as standard Patterns
- No banned vocabulary (see Voice Document)
- Maximum 35 words across lead + subhead combined
```

**Model selection:** Sonnet 4.6 (cheaper than Opus, this is meta-synthesis, not first-pass synthesis).

**Cost:** ~$0.005-0.010 per Briefing. Trivial.

**Surfacing:** lead and subhead appear at the top of every Briefing, above the Pattern list. The render template for the editorial variants (per the triptych) handles the lead consistently.

**Edge case:** if only 1 Pattern surfaces, the lead is just that Pattern's name in a slightly different framing. If 0 Patterns surface, the lead becomes "A quiet week. Watch List has emerging signals; Triggers fired N times."

---

## 4. Data model (updated v0.4)

### 4.1 New objects in v0.4

**PeripheryCandidate** — see Stage 3.3b schema above.

**ContrarianPattern** — see Stage 3.5e schema above.

**AuditEnvelope** — see cross-cutting Audit subsystem below.

**CorporateOwnershipMap** — see Stage 3.0 schema above.

### 4.2 Updated objects in v0.4

**Pattern:** adds `triggered_triggers[]` field for tracking which Watchlist Triggers fire on this Pattern's evidence (Spec Gap #4).

**WatchlistTrigger fire event:** adds `related_pattern_id` field (Spec Gap #4).

**DealWatchAlert:** schema fully specified, including `severity_score`, `severity_band`, `severity_breakdown` (the per-factor scores).

### 4.3 Storage backend (extended v0.4)

Adding to the v0.3 hybrid local + Supabase backend:

| Object class | Storage | Notes |
|---|---|---|
| CorporateOwnershipMap | Static JSON file, loaded into memory on pipeline run | Quarterly curation |
| PeripheryCandidate | Supabase (`signal_console_periphery`) | Per-user; behavioral feedback drives weight evolution |
| ContrarianPattern | Supabase (`signal_console_contrarian_patterns`) | Long-lived; user actions tracked |
| AuditEnvelope | Supabase (`signal_console_audit_envelopes`) — **append-only, immutable** | Per-Pattern, per-fire, per-action |

The audit envelope storage is the largest single addition to v0.4's storage footprint. Estimated per-user storage: ~5-15 MB/year (mostly serialized JSON of synthesis paths). At 1000 users, ~10-15 GB total — well within Supabase paid tier limits.

---

## 5. Audit Envelope subsystem (NEW v0.4, cross-cutting)

**Posture mapping:** the obligation to defensibility. (Design Posture v0.1 §3.3)

**Purpose:** Preserve immutable state at every Pattern's synthesis, every surfacing decision, and every user action — so the user can reconstruct what the system said and why, even months later.

**Coverage:**

The audit envelope wraps these events:

1. Every Pattern synthesis (draft, critique, every revision, gate decisions, final)
2. Every ContrarianPattern synthesis (same shape)
3. Every PeripheryCandidate scoring (sub-score breakdown, supporting items)
4. Every Watchlist Trigger fire (matching items, parsed query at fire time)
5. Every Deal-Watch Alert surfacing (severity breakdown, contributing items)
6. Every user action: Apply Move clicks (Pattern → destination → drafted content → user-saved content), feedback marks, trigger acknowledgments, periphery candidate decisions

**AuditEnvelope schema:**

```json
{
  "envelope_id": "ae_xxxxx",
  "envelope_type": "pattern_synthesis | contrarian_synthesis | periphery_scoring | trigger_fire | deal_watch_alert | user_action",
  "subject_id": "string (pat_xxx | cpat_xxx | pc_xxx | trigger_fire_xxx | dwalert_xxx | action_xxx)",
  "created_at": "ISO-8601",
  "immutable": true,
  
  // Context snapshot (preserved as it was at envelope-creation time)
  "context_snapshot": {
    "hydrated_context_id": "ctx_xxx",
    "hydrated_context_full": { /* complete HydratedContext at synthesis time */ },
    "voice_document_version": "string",
    "voice_document_hash": "string"
  },
  
  // Pipeline state (preserved verbatim)
  "pipeline_state": {
    "cluster_id": "cls_xxx",
    "cluster_full": { /* complete cluster at synthesis time */ },
    "items_full": [ /* complete enriched items in cluster */ ]
  },
  
  // LLM call records (verbatim)
  "llm_calls": [
    {
      "stage": "draft | critique | revise | contrarian_draft | briefing_compose",
      "model": "string (e.g., claude-opus-4-7)",
      "model_version_hash": "string",
      "prompt_template_id": "string",
      "prompt_template_hash": "string",
      "full_prompt": "string (verbatim)",
      "full_response": "string (verbatim)",
      "tokens_in": int,
      "tokens_out": int,
      "cost_usd": float,
      "ran_at": "ISO-8601",
      "duration_ms": int
    }
  ],
  
  // Gate decisions
  "quality_gate_decisions": [
    { "check": "banned_vocabulary", "passed": bool, "details": "string" },
    { "check": "length_bounds", "passed": bool, "details": "string" },
    { "check": "evidence_validation", "passed": bool, "details": "string" }
  ],
  
  // Final output (verbatim)
  "final_output": { /* the final Pattern/ContrarianPattern/etc. */ }
}
```

**For user actions, the envelope captures:**

```json
{
  "envelope_id": "ae_xxxxx",
  "envelope_type": "user_action",
  "subject_id": "action_xxxxx",
  "created_at": "ISO-8601",
  "user_action": {
    "action_type": "apply_move | feedback_used | feedback_noise | trigger_ack | periphery_add | periphery_dismiss",
    "source_object_id": "string (Pattern, Trigger, PeripheryCandidate, etc.)",
    "source_object_envelope_id": "string (the audit envelope of what the user acted on)",
    "destination_module": "string (e.g., Discovery Studio · Phase 04)",
    "drafted_content": "string (what got proposed)",
    "user_saved_content": "string (what user actually saved — may differ from drafted)",
    "user_notes": "string | null"
  }
}
```

**Append-only and immutable:**

Audit envelopes are never updated after creation. If a user reverses an action (un-applies a move), a new audit envelope is created for the reversal; the original action's envelope is preserved as-was. Retention is 7 years (long enough for any plausible audit need) with full retrievability for the first 12 months and archived storage for older envelopes.

**Show-your-work mode (UI affordance):**

Any Pattern, ContrarianPattern, or PeripheryCandidate has a "Show your work" toggle that expands the full audit envelope. The expanded view displays:

- The cluster as it was at synthesis (all items, all metadata)
- The HydratedContext snapshot (the user's state at that moment, not the current state)
- Every LLM call: prompt + response, verbatim, with model version and cost
- Every quality gate decision and what triggered it
- The final output (which is what the user sees by default when not in show-your-work mode)

This serves two functions: user trust (users who can see how the sausage is made trust the sausage more) and retrospective analysis (when a Pattern turns out to have been wrong, the audit trail tells you which stage failed).

**Cost:** Audit envelope storage is bounded — most envelopes are <100KB. At ~50 envelopes per user per week (synthesis + surfacing + user actions), total weekly storage is ~5MB per user. Annualized: ~250 MB per user. At 1000 users: 250 GB. At Supabase paid tier ($25/mo starting tier, scales to ~$0.10/GB beyond), the storage cost at 1000 users is ~$25-50/month — trivial relative to LLM costs.

**Retrieval:**

Query interface for audit envelopes:

```
GET /api/audit/envelopes?subject_id=pat_xxx
GET /api/audit/envelopes?envelope_type=user_action&date_range=2026-05-01:2026-05-17
GET /api/audit/envelopes/{envelope_id}/full   # returns complete envelope with all LLM calls verbatim
```

Used by:
- Show-your-work UI mode
- Evaluation harness (samples production envelopes for retrospective scoring)
- User-facing "Why did the system surface this?" explanations
- Periodic audit reports for users who want them

---

## 6. Cost ceiling enforcement (NEW v0.4 — closes Spec Gap #7)

Per Cost Model v0.1 §5, cost ceilings are tier-specific (Tier 1: $2/week, $0.50/day; Tier 2: $5/week, $1.50/day; Tier 3: $15/week per seat, $4/day per seat). v0.4 wires enforcement into the pipeline.

**Cost tracker (cross-cutting):**

Every LLM-invoking stage wraps its calls through a CostTracker singleton that:

1. Maintains rolling daily and weekly cost totals per user
2. Before each call, checks `daily_so_far + estimated_call_cost` against the user's daily ceiling
3. Returns one of four states: `ok`, `warning` (>80% of ceiling), `throttle` (≥100%), `pause` (≥150%)

**Behavior per state:**

| State | Pipeline behavior |
|---|---|
| ok | Normal operation |
| warning | Banner in Briefing: "Approaching weekly cost ceiling — pipeline will degrade if usage continues." |
| throttle | Synthesis switches to Sonnet 4.6 for drafts (was Opus 4.7). Critic pass skipped on clusters below 70th-percentile confidence. Enrichment skips items below `user_relevance_score >= 0.6` threshold. |
| pause | Pipeline halts. New runs queued. Banner: "Weekly cost ceiling reached. Pipeline resumes on Monday." |

**Override:** user can manually disable the ceiling for a billing period (one-click "burn the budget"); the system records the override in audit envelopes for that period.

**Per-stage cost telemetry:**

Every audit envelope records `cost_usd` per LLM call. Daily aggregates feed the user's CostTelemetry record (per Cost Model §10) which drives the footer telemetry display.

---

## 7. Failure modes (updated v0.4)

All v0.3 failure modes carry forward. v0.4 additions:

### Periphery Detection failures

| Failure | Cause | Mitigation |
|---|---|---|
| Too many periphery candidates surfaced | Threshold too loose; co-occurrence too easy to satisfy | Threshold tunable; behavioral feedback (added vs dismissed) shifts weights over time |
| Too few periphery candidates | Vocabulary too narrow; pain_lib sparse | Prompt user to extend pain_lib; surface a "no periphery candidates this week" notice |
| Periphery candidate is actually irrelevant | Co-occurrence is coincidental | User dismissal feeds back; persistent false candidates get downweighted |
| Investor map stale | Quarterly maintenance lag | investor_overlap signal weight reduced if map age >180 days |

### Contrarian Synthesis failures

| Failure | Cause | Mitigation |
|---|---|---|
| Contrarian fires too often | Confidence threshold too low; over-eager interpretation | Threshold tunable; user dismissals with reason inform calibration |
| Contrarian fires too rarely | Assumption extraction incomplete; or user's assumptions actually well-calibrated to data | Check HydratedContext extraction; a quiet contrarian surface may simply mean user's model is sound |
| Contrarian voice drifts toward sneering | Critique pass for contrarian register not strict enough | Separate test set in evaluation harness for contrarian voice; calibrate against anti-exemplars |
| User dismisses 3+ in a row with same reason | Pattern of resistance to particular type of challenge | Meta-prompt: "we've been challenging X repeatedly; want us to stop?" gives user explicit control |

### Audit Envelope failures

| Failure | Cause | Mitigation |
|---|---|---|
| Envelope storage approaches limit | High-activity user generates 10× expected envelopes | Soft cap with warning; archived storage tier for old envelopes |
| Envelope retrieval slow | Large envelopes (>1MB) due to long synthesis paths | Pagination of LLM call records in retrieval API |
| Envelope schema drift | Pipeline evolution adds new fields | Backward-compatible parsers; envelopes versioned with `schema_version` field |
| User wants to delete audit history | Privacy concern | Per-user "purge audit history" with 30-day grace period; explicit warning that this destroys retrospective defensibility |

### Cost ceiling failures

| Failure | Cause | Mitigation |
|---|---|---|
| User hits ceiling early in week | Heavy single-day usage | Daily ceiling at 25% of weekly ceiling prevents week-budget burn |
| Throttled state degrades quality noticeably | Sonnet-instead-of-Opus produces worse drafts | Evaluation harness tracks throttled-mode quality vs full-mode; user notified of degradation |
| User overrides ceiling repeatedly | Power user paying for it | Suggest tier upgrade; track override frequency |

---

## 8. Integration with GTM OS modules (extended v0.4)

All v0.3 read/write integrations unchanged. v0.4 additions:

**New read source:**

The Corporate Ownership Map (§3.0) is a static resource loaded with HydratedContext. It is not a GTM OS module; it is product infrastructure. Quarterly curation responsibility sits with the Antaeus team, not the user.

**New write destinations:**

- ContrarianPattern actions ("Acknowledge" or "Dismiss with reason") write back to ICP Studio when the dismissal reason confirms the user's stated ICP is right (boost confidence in that criterion) or to ICP Studio when the user acknowledges that the contrarian challenge is valid (lower confidence in the challenged criterion, prompting the user to revise).
- PeripheryCandidate "Add to Watchlist" writes to the user's watchlist via Active Deals register's competitive_set field or via a separate watchlist namespace (depending on the user's existing watchlist organization).

---

## 9. Resolved decisions (extended v0.4)

All 14 v0.3 resolutions carry forward. v0.4 resolutions:

| # | Question | Resolution |
|---|---|---|
| 15 | Confidence formula calibration (Phase 6 Spec Gap #1) | Recalibrated per §3.6: quality multipliers + additive bonuses, base 0.55 |
| 16 | Corporate ownership context (Spec Gap #2) | Static map loaded with HydratedContext; quarterly curation |
| 17 | exec_move cluster threshold (Spec Gap #3) | Lowered to 1.0 with single-source SRC_CONF ≥ 0.7 gate |
| 18 | Pattern-Trigger overlap (Spec Gap #4) | Cross-link both surfaces with overlap-detection rule at surface time |
| 19 | Deal-Watch severity formula (Spec Gap #5) | Specified per §3.7 with 5-factor weighted sum |
| 20 | Briefing Lead (Spec Gap #6) | New Stage 3.8 — Briefing Compose with Sonnet 4.6 meta-synthesis |
| 21 | Cost ceiling enforcement (Spec Gap #7) | CostTracker singleton wraps LLM calls; four states (ok / warning / throttle / pause) |
| 22 | Periphery scoring weight evolution | EMA 0.95 decay on per-signal weights, retrained from user accept/dismiss behavior |
| 23 | Contrarian Pattern cadence | Monthly digest rather than weekly to avoid noise |
| 24 | Audit envelope retention | 7 years; first 12 months at full retrieval speed, archived thereafter |
| 25 | Audit envelope user privacy | Per-user "purge audit history" available with 30-day grace and explicit warning |

---

## 10. What we are not building (unchanged from v0.3)

All v0.3 exclusions carry forward. No additions.

---

## 11. Design completion criteria for v0.4

- [x] All seven Phase 6 spec gaps closed
- [x] Design Posture v0.1 obligations cashed out in concrete pipeline stages
- [x] Periphery Detection fully specified with scoring math
- [x] Contrarian Synthesis fully specified with prompt
- [x] Audit Envelope subsystem fully specified with retention and retrieval
- [x] Briefing Compose stage 3.8 specified
- [x] Confidence formula recalibrated against walkthrough numbers
- [x] Deal-Watch severity formula specified
- [x] Cost ceiling enforcement wired through pipeline
- [x] Corporate Ownership Map specified and integrated
- [x] All new failure modes catalogued
- [x] All new resolutions documented

v0.4 is locked. Next phase work: evaluation harness addendum (Phase 5 v0.2) to handle contrarian voice register testing, retroactive correctness scoring, and periphery candidate evaluation.

---

## 12. Summary of changes from v0.3

| Area | v0.3 | v0.4 |
|---|---|---|
| Pipeline stages | 8 | 9 (added 3.3b Periphery, 3.5e Contrarian, 3.8 Briefing Compose; folded into existing diagram) |
| Surface paths | 5 | 7 (added Contrarian Briefing, Periphery sub-surface) |
| Data model objects | 11 | 15 (added PeripheryCandidate, ContrarianPattern, AuditEnvelope, CorporateOwnershipMap) |
| Confidence formula | Multiplicative, base 0.5 | Quality-multiplied + diversity-additive, base 0.55 |
| exec_move threshold | 1.5 | 1.0 (with SRC_CONF gate for single-source) |
| Open questions | 0 (all resolved in v0.3) | 0 (all resolved in v0.4) |
| Failure modes | 25 | 38 (added 13 across new subsystems) |
| Cost addition vs v0.3 baseline | — | +~25% (periphery +5%, contrarian +10%, audit storage +5%, briefing compose +trivial) |

The v0.4 product still hits 90%+ gross margin at Tier 1 pricing. The cost addition is structural — it's the price of the provocative posture — and the user-facing value proposition (coverage, framing, defensibility) earns the cost.

---

*End of Recipe Layer Spec v0.4.*
*Locks before Evaluation Harness v0.2.*
