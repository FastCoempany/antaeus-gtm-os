# Signal Console — Watchlist Trigger Grammar

**Version:** 0.1
**Date:** 17 May 2026
**Status:** Draft for review
**Phase:** Design Phase 4 (Recipe Layer Spec v0.2 §5)
**Locks:** `TriggerParsedQuery` shape referenced by GTM OS Read Interface Contracts §3.7

---

## 0. Purpose

Watchlist Triggers are how the user issues **standing orders** to Signal Console. Instead of waiting for the system to surface what *it* thinks is important, the user pre-registers what *they* care about, and the system watches the pipeline continuously, firing when the user's hypothesis is satisfied or their condition is met.

A trigger is a single, declarative statement:

- "Alert me when Snowflake adds a free tier."
- "Alert me if 3+ Director-of-RevOps hires happen at Series B AI companies in 30 days."
- "Alert me if Stripe stops publishing blog posts for 30+ days."

This document specifies:

1. The five trigger types the grammar supports
2. The structured `TriggerParsedQuery` shape for each
3. The natural-language → structured-query parser, including its prompt
4. The matching algorithm per trigger type
5. Lifecycle states and transitions
6. A validation set of 30+ realistic user inputs and their expected parses
7. Edge cases and failure modes

Phase 4 is complete when this grammar handles 90%+ of the validation set cleanly, with the remaining 10% surfacing well-understood failure modes (ambiguity, subjective qualifiers, etc.) that the parser handles by asking for clarification.

---

## 1. Design principles

### 1.1 Confidence over interpretation

If the parser is uncertain what the user meant, it asks. It does **not** commit to a low-confidence interpretation and let the user discover the error when the trigger fires wrong (or doesn't fire when it should).

Threshold: `parse_confidence < 0.7` → return clarifying questions instead of a parsed query.

### 1.2 Natural input, structured execution

The user always types natural language. The system always stores a structured query. The natural-language version is kept for human-readable display ("Watch Snowflake for free or no-commitment pricing tiers"); the structured version is what the matching algorithm uses. This separation matters because the user's natural phrasing might be ambiguous to humans but the structured form must be unambiguous to the system.

### 1.3 Show the parse before saving

Every trigger creation flow ends with a confirmation step. The system shows the user: *"Here's what I'll watch for: [rephrased version]. Save?"* The user approves, edits, or rejects.

This is non-negotiable. Triggers that the user wrote one way and the system interpreted another way are a category of failure that destroys trust quickly. Confirmation costs one click; bad triggers cost a quarter.

### 1.4 Triggers compose, not nest

The grammar does not support arbitrary boolean algebra ("alert me when (A AND B) OR (C AND NOT D)"). Triggers are atomic: one type, one target, one condition. Users compose them at the UI level by creating multiple triggers.

This is a deliberate constraint. Nested boolean queries are powerful but unmaintainable; users forget their own logic three months later. Atomic triggers are scrutable.

### 1.5 Failure to parse is acceptable, even useful

Some user inputs cannot be parsed into the grammar — they're too subjective ("alert me when something interesting happens"), too compound ("alert me when X AND Y AND Z and also W"), or too vague. When the parser fails, it says so plainly and offers what it could parse. The user reformulates.

This is better than the alternative: parse-anything-into-something, then surface noise the user didn't ask for.

### 1.6 Structured form is editable

After parsing, the user can edit the structured form directly. Power users will. The structured form is not a black box — it's a saved object with named fields the user can adjust without re-typing natural language.

### 1.7 The five types are exhaustive (for now)

The grammar supports five trigger types. Any user intent that doesn't fit one of these types either (a) gets rejected with a clarifying question, or (b) becomes a feature request for v0.2.

The five types were chosen because together they cover the standing-orders shapes a B2B GTM operator naturally writes. If a real user input consistently doesn't fit, the grammar expands. Until then, five is the surface.

---

## 2. The five trigger types

### 2.1 single_event

**Definition:** Alert when a specific event happens at a specific target.

**Use cases:**
- "Alert me when [competitor] adds [feature/tier/integration]"
- "Alert me when [target company] hires a [role]"
- "Alert me when [account] gets acquired"
- "Alert me when [our category] gets covered in [publication]"

**Shape:**

```typescript
type SingleEventQuery = {
  type: "single_event"
  event: {
    category: EventCategory
    subcategory?: string                         // optional refinement
    qualifier?: string                           // freeform qualifier (e.g., "free_or_no_commitment")
  }
  target: TriggerTarget
  fire_once: boolean                             // default false — fires on every matching event
  cooldown_days?: number                         // optional debounce (e.g., don't fire same event within N days)
}

type EventCategory = 
  | "exec_move"
  | "pricing_change"
  | "product_launch"
  | "funding_round"
  | "m_a_event"
  | "regulatory_action"
  | "security_incident"
  | "partnership_announcement"
  | "integration_added"
  | "integration_removed"
  | "leadership_departure"
  | "layoff_event"
  | "geographic_expansion"
  | "vertical_expansion"
  | "narrative_shift_mention"
  | "press_coverage"
  | "patent_filing"
  | "trust_certification_change"
  | "any"

type TriggerTarget =
  | { type: "company"; name: string; aliases?: string[] }
  | { type: "companies"; names: string[]; logic: "any" | "all" }
  | { type: "category"; category_descriptor: string }
  | { type: "any" }
```

**Matching algorithm:**

For each `enriched_item`:
1. Check if item's extracted event matches `query.event.category` (and `subcategory` if specified).
2. Check if item's `entities.companies` matches `query.target` (single, list, or category match).
3. If `qualifier` is set, check if the item's metadata satisfies the qualifier (e.g., "free_or_no_commitment" requires extracted pricing data showing $0 minimum).
4. If all match: fire.
5. If `fire_once = true`, mark trigger as fired; do not fire again.
6. If `cooldown_days` is set, suppress fires within the cooldown window.

**Evaluation cadence:** Per enriched item (during Stage 3.3).

---

### 2.2 aggregation

**Definition:** Alert when N events of a type happen within a timeframe, optionally filtered by company/category attributes.

**Use cases:**
- "Alert me when 3+ VP Sales hires happen at AI startups in 30 days" (cohort emergence)
- "Alert me when 5+ exec departures happen from a single company in 60 days" (instability)
- "Alert me when 4+ competitors add a free tier in any 30-day window" (category shift)

**Shape:**

```typescript
type AggregationQuery = {
  type: "aggregation"
  event: {
    category: EventCategory
    subcategory?: string
    qualifier?: string
  }
  min_count: number
  window_days: number
  window_type: "rolling" | "calendar"            // rolling = any N-day span; calendar = current N-day calendar period
  filters: AggregationFilters
  target?: TriggerTarget                         // optional — if absent, aggregates across all sources
  fire_once_per_window?: boolean                 // default true — don't re-fire if already fired this window
}

type AggregationFilters = {
  role_pattern?: string                          // regex or normalized role pattern (e.g., "director|vp|head.*revops")
  company_funding_stage?: ("seed" | "series_a" | "series_b" | "series_c" | "series_d" | "public")[]
  company_category?: string[]                    // e.g., ["AI", "data infrastructure"]
  company_size?: { min_employees?: number; max_employees?: number }
  company_geography?: string[]
  exclude_companies?: string[]                   // for "any except these"
}
```

**Matching algorithm:**

1. Maintain a rolling counter per trigger.
2. For each new enriched item that satisfies `event` + `target` + `filters`: add to the counter with timestamp.
3. Prune counter entries older than `window_days`.
4. If `counter.length >= min_count`: fire.
5. If `fire_once_per_window`, suppress further fires until the window rolls over.

**Evaluation cadence:** Per enriched item (incrementally) + per pipeline run (window pruning + threshold check).

**Edge case — role pattern normalization:**

Role strings come in many variants: "Director of RevOps", "VP, Revenue Operations", "Head of Revenue Operations", "Director - RevOps". The parser normalizes to a regex that matches all common variants. The matching algorithm normalizes incoming item role strings the same way before comparison.

---

### 2.3 threshold

**Definition:** Alert when a tracked metric crosses a threshold, optionally compared to a baseline.

**Use cases:**
- "Alert me when 'agentic workflow' Wikipedia pageviews grow 50% over rolling 60 days"
- "Alert me when 'workflow automation' search interest drops 30% from prior quarter"
- "Alert me when [competitor]'s GitHub stars grow 20% in 30 days" (momentum signal)

**Shape:**

```typescript
type ThresholdQuery = {
  type: "threshold"
  metric: ThresholdMetric
  comparison: "greater_than" | "greater_than_or_equal" | "less_than" | "less_than_or_equal" | "crosses_above" | "crosses_below"
  value: number
  window_days: number
  baseline: ThresholdBaseline
  fire_once?: boolean                            // default false — fires every time threshold crosses
}

type ThresholdMetric = {
  source: "wikipedia_pageviews" | "hn_algolia_count" | "github_stars" | "substack_mention_count" | "techcrunch_mention_count" | "competitor_pricing_diff_count" | "category_narrative_ratio"
  target: string                                 // metric-specific target (article name, search query, repo name, etc.)
  metric_type: "raw_count" | "growth_rate" | "growth_pct" | "ratio_vs_baseline" | "percentile"
}

type ThresholdBaseline = 
  | { type: "previous_window"; window_days: number }
  | { type: "same_period_last_year" }
  | { type: "all_time_average" }
  | { type: "fixed_value"; value: number }
  | { type: "rolling_baseline"; window_days: number }
```

**Matching algorithm:**

1. Once per pipeline run (or daily for fast-moving metrics):
2. Fetch current metric value over `window_days`.
3. Fetch baseline metric value per `baseline` spec.
4. Compute comparison (current vs baseline) per `metric_type`.
5. Check against `value` per `comparison`.
6. If condition met: fire.
7. If `fire_once`, mark fired; do not re-evaluate until reset.
8. If not `fire_once`, fire on every evaluation where condition is met (but with daily debounce to avoid spam).

**Evaluation cadence:** Daily or per pipeline run (whichever is sooner). NOT per enriched item.

**Hard cases:**

- **"50% growth"** — over what baseline? Default: previous 60-day window. The parser asks if unspecified.
- **"Significant change"** — too vague. Parser rejects, asks for quantification.
- **Comparing across sources** (e.g., "agentic" mentions across both Substack and HN) — handle as separate triggers OR as a composite metric (`metric_type: "ratio_vs_baseline"` with combined source). Probably separate triggers in v0.1; composite in v0.2.

---

### 2.4 adjacency

**Definition:** Alert about anything related to a specific target — broad coverage, lower-threshold relevance.

**Use cases:**
- "Alert me about anything happening with Lumana — partnerships, hiring, M&A, anything."
- "Alert me about Notion at the enterprise tier."
- "Alert me about anything Stripe does in payments orchestration."

**Shape:**

```typescript
type AdjacencyQuery = {
  type: "adjacency"
  target: TriggerTarget
  scope?: AdjacencyScope                         // optional narrowing
  relevance_threshold: number                    // 0.0-1.0, default 0.6
  exclude_event_categories?: EventCategory[]     // e.g., exclude "press_coverage" if user only wants substantive moves
  digest_mode?: boolean                          // if true, batches matches into a daily digest instead of individual fires
}

type AdjacencyScope = {
  context?: string                               // freeform context (e.g., "in payments orchestration")
  topics?: string[]                              // narrow to these topics
  categories?: EventCategory[]                   // narrow to these categories
}
```

**Matching algorithm:**

For each `enriched_item`:
1. Check if item's `entities.companies` includes the target (or any company in `target.names` for list targets).
2. Check if item's `user_relevance_score >= relevance_threshold`.
3. If `scope` is set, check item satisfies the scope (e.g., topic_tags include the scope topics).
4. If `exclude_event_categories` includes the item's event category, skip.
5. If all checks pass: queue for fire.
6. If `digest_mode`, batch fires into a daily summary; otherwise fire individually.

**Evaluation cadence:** Per enriched item.

**Volume concern:** A "watch everything about Stripe" trigger could fire 10+ times a day. Default `digest_mode = true` for adjacency triggers; user opts into per-event firing if they want it.

---

### 2.5 silence

**Definition:** Alert when an expected source goes quiet for longer than a threshold.

**Use cases:**
- "Alert me if Stripe stops publishing blog posts for 30+ days."
- "Alert me if our category stops appearing in HN for 14+ days."
- "Alert me if no exec moves happen in our target cohort for 60+ days." (negative-space signal of cohort dormancy)

**Shape:**

```typescript
type SilenceQuery = {
  type: "silence"
  target: SilenceTarget
  silence_days: number
  comparison_baseline?: SilenceBaseline          // optional — sometimes "30 days quiet" is normal, sometimes abnormal
  reset_on_activity: boolean                     // default true — once it fires, reset only when activity resumes
}

type SilenceTarget = 
  | { type: "source"; source_type: string; company?: string }       // e.g., company blog, status page
  | { type: "event_category"; category: EventCategory; filters?: AggregationFilters }
  | { type: "topic"; topic: string; sources?: string[] }             // e.g., "agentic" in operator content

type SilenceBaseline = 
  | { type: "historical_average_gap"; lookback_days: number }
  | { type: "fixed_expectation"; expected_frequency_days: number }
```

**Matching algorithm:**

1. Once per pipeline run (daily evaluation):
2. For each silence trigger, query the recent activity log for the target.
3. Compute `days_since_last_match`.
4. If `days_since_last_match >= silence_days`: fire.
5. If `reset_on_activity`, do not re-fire until activity resumes and then goes silent again.

**Evaluation cadence:** Daily.

**Edge case — baselines:** "30 days of silence" means different things for different targets. A company that posts weekly going silent for 30 days is anomalous. A company that posts quarterly is on schedule. The optional `comparison_baseline` lets the parser handle this:
- "Stripe normally posts every 3-5 days" → 30-day silence is abnormal
- "Anthropic posts every 4-6 weeks" → 30-day silence is normal

The parser asks the user if the silence threshold is appropriate given the target's historical cadence (it can compute historical_average_gap automatically from prior data).

---

## 3. The TriggerParsedQuery top-level shape

Unifying all five types:

```typescript
type TriggerParsedQuery = SingleEventQuery | AggregationQuery | ThresholdQuery | AdjacencyQuery | SilenceQuery

// Full WatchlistTrigger as seen by the system:
type WatchlistTrigger = {
  trigger_id: string
  user_id: string
  natural_language: string                       // user's original phrasing
  parsed_query: TriggerParsedQuery
  parse_confidence: number                       // 0.0-1.0
  rephrased_for_confirmation: string             // human-readable echo of what we'll watch for
  status: "armed" | "fired_today" | "fired_this_week" | "dormant" | "disabled"
  created_at: string
  last_fired_at: string | null
  fire_history: FireEvent[]                      // last N fires for audit
  fire_count: number
  false_fire_count: number
  user_approved_fires: number
  notes?: string                                 // optional user-added note on why this trigger exists
}

type FireEvent = {
  fired_at: string
  evidence_item_ids: string[]                    // items that satisfied the trigger
  user_verdict?: "useful_fire" | "false_fire" | null
}
```

---

## 4. The parser

### 4.1 Approach

The parser is a single LLM call. Input: user's natural language. Output: structured query + confidence + rephrasing + ambiguities.

The parser uses a structured-output prompt that constrains the model to return one of the five trigger types. If the model can't fit the input into any of the five, it returns a parse failure with reasons.

### 4.2 The parser prompt

```
You are parsing a user's natural-language Watchlist Trigger into a structured query for a competitive intelligence system. The system supports exactly FIVE trigger types — no others.

THE FIVE TYPES
==============

1. single_event
   Alert when a specific event happens at a specific target.
   Example: "Alert me when Snowflake adds a free tier"
   Example: "Alert me when Lumana is acquired"
   Example: "Alert me when our category gets covered in Stratechery"

2. aggregation
   Alert when N events of a type happen within a timeframe, optionally filtered.
   Example: "Alert me when 3+ VP Sales hires happen at Series B AI companies in 30 days"
   Example: "Alert me when 5+ exec departures happen from a single company in 60 days"

3. threshold
   Alert when a tracked metric crosses a threshold against a baseline.
   Example: "Alert me when 'agentic workflow' Wikipedia pageviews grow 50% over rolling 60 days"
   Example: "Alert me when our category appears in HN frontpage 10+ times in a week"

4. adjacency
   Alert about anything related to a specific target — broad coverage.
   Example: "Alert me about anything happening with Lumana"
   Example: "Alert me about Notion at the enterprise tier"

5. silence
   Alert when an expected source goes quiet for longer than a threshold.
   Example: "Alert me if Stripe stops publishing blog posts for 30+ days"
   Example: "Alert me if no exec moves happen in our target cohort for 60+ days"

YOUR TASK
=========

Parse the user's input into ONE of these types. If it fits more than one type, choose the closest match and note the ambiguity. If it fits none, return a parse failure.

USER INPUT
==========
{user_input}

USER CONTEXT (for resolving references)
=======================================
Watchlist companies: {watchlist_companies}
Competitors: {competitor_set}
Active deals' competitive sets: {active_deal_competitors}
ICP categories: {icp_categories}
Active triggers already created: {active_triggers_summary}

PARSE RULES
===========

1. Identify the trigger type. If unsure, default to the more specific type (single_event over adjacency; aggregation over single_event when count specified).

2. Extract the target. If user mentions a company name, check it against watchlist + competitors. If it's a typo or near-miss, suggest correction in ambiguities[]. If the target isn't in any known list, accept it but flag in notes.

3. Identify the event category from the predefined list. If the user describes an event that doesn't map cleanly to any category, use category "any" and note the ambiguity.

4. Extract quantifiers (N, window, threshold). If the user says "soon" or "recently" without specifics, ask for clarification.

5. Default values when user is silent:
   - aggregation window_days: 30
   - threshold baseline: previous_window with window_days = same as primary window
   - adjacency relevance_threshold: 0.6
   - adjacency digest_mode: true (to avoid noise)
   - silence reset_on_activity: true

6. Confidence calibration:
   - 0.95+ when every parameter is unambiguous and all entities resolved
   - 0.80-0.94 when minor ambiguities exist but interpretation is high-confidence
   - 0.60-0.79 when significant ambiguity exists but a best-guess interpretation is possible
   - Below 0.70: return ambiguities[] and ask for clarification instead of committing

7. Be willing to reject. Vague inputs ("alert me about important things") should return parse_confidence ~0.3 with clarifying questions, NOT a low-confidence committed parse.

8. Compound inputs ("alert me when X AND Y") cannot be parsed as a single trigger. Either suggest splitting into two triggers, or return a parse failure with the explanation.

9. Generate rephrased_for_confirmation in plain English, echoing what the system will actually watch for. The user should be able to read this and verify the parse is correct.

OUTPUT FORMAT
=============

Return ONLY a JSON object in this exact shape (no preamble, no markdown fences):

{
  "parse_succeeded": true | false,
  "parse_failure_reason": "string" | null,
  "trigger_type": "single_event" | "aggregation" | "threshold" | "adjacency" | "silence" | null,
  "parsed_query": { /* type-specific schema, omitted here for brevity — see system spec */ } | null,
  "parse_confidence": 0.0-1.0,
  "ambiguities": [
    {
      "field": "string (what's ambiguous)",
      "question": "string (clarifying question for the user)",
      "suggested_clarification": "string (system's best guess at what they meant)"
    }
  ],
  "rephrased_for_confirmation": "string (plain English of what we'll watch for)",
  "suggested_split": ["string"] | null,           // if input is compound, suggested splits
  "notes": "string (any flags or warnings for the user)" | null
}
```

### 4.3 Parser confidence model

| Confidence | System behavior |
|---|---|
| 0.95+ | Parsed cleanly. Show rephrasing. User clicks confirm. |
| 0.80-0.94 | Parsed with minor ambiguity. Show rephrasing AND list ambiguities. User confirms after reviewing. |
| 0.70-0.79 | Parsed with significant ambiguity. Show best-guess parse but require user to address each ambiguity before saving. |
| < 0.70 | Do NOT commit a parse. Return ambiguities[] only. User answers clarifying questions; re-parse. |

### 4.4 The confirmation flow

After parse, the UI shows:

```
You said:
"Alert me when Snowflake adds a free tier"

I'll watch for:
"Snowflake's pricing announcements for any new tier that's free or no-commitment."

Trigger type: single_event
Target: Snowflake
Event: pricing_change → tier_added (qualifier: free or no minimum commitment)
Fire mode: every match (no debounce)

[Confirm] [Edit structured form] [Re-phrase]
```

User confirms → trigger saved as armed.
User edits → opens structured form editor.
User re-phrases → re-runs parser on new input.

### 4.5 Re-parsing and revision

Saved triggers can be re-parsed if the user edits the natural language. The structured form can also be edited directly without re-parsing.

When a trigger has fired false-positively N times (default 3), the system surfaces a prompt: *"This trigger has fired 3 times that you marked as false. Want to refine it?"* — opens the re-parse flow with the false-fire context.

---

## 5. Compound triggers (the constraint)

The grammar does NOT support compound queries within a single trigger. Users wanting compound logic create multiple triggers.

**Example user input:**
> "Alert me when (Snowflake adds a free tier) AND (we have an active Snowflake deal)"

**Parser response:**
> "I can watch for the first part — Snowflake adding a free tier — as one trigger. The second part — checking against your active deals — happens automatically: any single_event trigger involving Snowflake will surface in the Deal-Watch alert if you have an active Snowflake deal. You don't need a compound trigger for that. Should I create the single_event trigger?"

**Example user input:**
> "Alert me when (any AI company raises Series B) OR (any AI company has an exec departure)"

**Parser response:**
> "I'll need to split this into two triggers — the grammar handles atomic conditions, not boolean combinations. Suggested:
> 1. *aggregation*: 1+ Series B funding events in the AI category, rolling 30-day window
> 2. *aggregation*: 1+ exec departures in the AI category, rolling 30-day window
> 
> Both will fire independently when their conditions are met. Create both?"

This is a deliberate constraint. Power users initially miss boolean composition; six months in, they're glad triggers are atomic because the system is debuggable.

---

## 6. Matching algorithms (consolidated)

### 6.1 Where matching happens in the pipeline

- **single_event:** Stage 3.3 Enrich — match runs against each enriched item as it's processed.
- **aggregation:** Stage 3.3 Enrich (incremental counter update) + Stage 3.7 Surface (threshold check).
- **threshold:** Stage 3.7 Surface, once per pipeline run.
- **adjacency:** Stage 3.3 Enrich.
- **silence:** Stage 3.7 Surface, daily.

### 6.2 Pseudocode for each type

#### single_event

```python
def match_single_event(item: EnrichedItem, trigger: SingleEventTrigger) -> bool:
    if trigger.fire_once and trigger.last_fired_at is not None:
        return False
    
    if trigger.cooldown_days and trigger.last_fired_at:
        days_since = days_between(trigger.last_fired_at, now())
        if days_since < trigger.cooldown_days:
            return False
    
    # Event match
    if trigger.event.category != "any":
        item_category = derive_event_category(item)
        if item_category != trigger.event.category:
            return False
        if trigger.event.subcategory and item.event_subcategory != trigger.event.subcategory:
            return False
    
    # Target match
    if not target_matches(item.entities.companies, trigger.target):
        return False
    
    # Qualifier match (freeform)
    if trigger.event.qualifier:
        if not qualifier_satisfied(item, trigger.event.qualifier):
            return False
    
    return True
```

#### aggregation

```python
class AggregationState:
    def __init__(self, trigger: AggregationTrigger):
        self.trigger = trigger
        self.matching_items: list[(EnrichedItem, datetime)] = []  # rolling window
    
    def update(self, item: EnrichedItem) -> bool:
        if not event_matches(item, self.trigger.event):
            return False
        if not target_matches(item, self.trigger.target) if self.trigger.target else True:
            return False
        if not filters_match(item, self.trigger.filters):
            return False
        
        self.matching_items.append((item, now()))
        self.prune_window()
        
        if len(self.matching_items) >= self.trigger.min_count:
            if self.trigger.fire_once_per_window and self.fired_this_window():
                return False
            return True  # Fire
        return False
    
    def prune_window(self):
        cutoff = now() - timedelta(days=self.trigger.window_days)
        self.matching_items = [(i, t) for i, t in self.matching_items if t > cutoff]
```

#### threshold

```python
def evaluate_threshold(trigger: ThresholdTrigger) -> bool:
    current = fetch_metric(
        source=trigger.metric.source,
        target=trigger.metric.target,
        window_days=trigger.window_days,
        end_date=now()
    )
    baseline = compute_baseline(trigger.baseline, trigger.metric, end_date=now() - timedelta(days=trigger.window_days))
    
    if trigger.metric.metric_type == "growth_pct":
        observed_value = (current - baseline) / baseline if baseline else 0
    elif trigger.metric.metric_type == "ratio_vs_baseline":
        observed_value = current / baseline if baseline else 0
    elif trigger.metric.metric_type == "raw_count":
        observed_value = current
    # ... etc
    
    return compare(observed_value, trigger.comparison, trigger.value)
```

#### adjacency

```python
def match_adjacency(item: EnrichedItem, trigger: AdjacencyTrigger) -> bool:
    if not target_matches(item.entities.companies, trigger.target):
        return False
    
    if item.user_relevance_score < trigger.relevance_threshold:
        return False
    
    if trigger.exclude_event_categories:
        item_category = derive_event_category(item)
        if item_category in trigger.exclude_event_categories:
            return False
    
    if trigger.scope:
        if trigger.scope.topics and not any(t in item.topic_tags for t in trigger.scope.topics):
            return False
        if trigger.scope.categories:
            item_cat = derive_event_category(item)
            if item_cat not in trigger.scope.categories:
                return False
    
    return True
```

#### silence

```python
def evaluate_silence(trigger: SilenceTrigger) -> bool:
    last_activity_at = fetch_last_activity(trigger.target)
    
    if not last_activity_at:
        # No prior activity at all — different kind of signal, depends on use case
        return trigger.silence_days > 0  # Probably fires; configurable
    
    days_since = (now() - last_activity_at).days
    
    if days_since < trigger.silence_days:
        return False
    
    if trigger.comparison_baseline:
        baseline_gap = compute_historical_average_gap(trigger.target, trigger.comparison_baseline)
        # Only fire if silence is meaningfully longer than baseline
        if days_since < baseline_gap * 1.5:
            return False
    
    if trigger.reset_on_activity and trigger.last_fired_at:
        # Don't refire if we already fired since last activity
        if trigger.last_fired_at > last_activity_at:
            return False
    
    return True
```

---

## 7. Lifecycle states

### 7.1 States

| State | Definition | Visible in UI as |
|---|---|---|
| armed | Active, monitoring, no recent match | 🟢 Armed |
| fired_today | Matched evidence in last 24h | 🔴 Fired today |
| fired_this_week | Matched within last 7d, not today | 🟡 Fired this week |
| dormant | Armed but no matches in 30+ days | ⚪ Dormant |
| disabled | User turned off, kept for record | ⚫ Disabled |

### 7.2 Transitions

```
Created → armed
armed → fired_today (on first match)
fired_today → fired_this_week (after 24h, no new match)
fired_this_week → armed (after 7d, no new match)
armed → dormant (after 30d, no matches)
dormant → armed (on new match)
[any] → disabled (user action)
disabled → armed (user re-enables)
[any] → deleted (user action, soft delete with 30d retention)
```

### 7.3 User actions

- **Disable:** stops matching against new items; trigger is preserved for re-enabling
- **Re-enable:** resumes matching from the moment of re-enable; doesn't backfill
- **Delete:** soft delete, retained 30 days for restoration; then hard-deleted
- **Edit (natural language):** re-parses; if new parse changes structured form, user confirms
- **Edit (structured form):** updates structured fields directly; no re-parse needed
- **Mark fire as useful_fire:** updates `user_approved_fires` counter; influences future precision
- **Mark fire as false_fire:** updates `false_fire_count`; at 3+ false fires, system prompts refinement
- **Pin to dashboard:** trigger surface always shows this trigger first (UI affordance, not core grammar)

---

## 8. Validation set — 32 realistic user inputs and their expected parses

These are the inputs the grammar must handle cleanly. Each is a real-shaped statement a B2B GTM operator might type. The grammar passes Phase 4 if it handles 28+ of these (≥87.5%) correctly.

### 8.1 single_event parses (10)

| # | User input | Parse confidence | Notes |
|---|---|---|---|
| 1 | "Alert me when Snowflake adds a free tier or no-commitment pricing" | 0.92 | Clean single_event; pricing_change category; target Snowflake; qualifier free_or_no_commitment |
| 2 | "Alert me when Lumana is acquired" | 0.95 | Clean; m_a_event; target Lumana |
| 3 | "Alert me when Linear announces enterprise sales motion" | 0.78 | Ambiguous — "announces enterprise sales motion" maps to multiple events (hiring, pricing, page launch). Ask for clarification. Suggested: "I can watch for Linear's enterprise-related page launches, exec hires, OR pricing tier additions. Which?" |
| 4 | "Alert me when Anthropic releases a new Claude model" | 0.94 | product_launch; target Anthropic; subcategory model_release |
| 5 | "Alert me when our category gets covered in Stratechery" | 0.85 | press_coverage; target = category descriptor from user's ICP categories; source qualifier "Stratechery" |
| 6 | "Alert me when MongoDB or Snowflake mentions us in their materials" | 0.72 | Compound target (list); single_event with target.type = "companies", logic "any"; "mentions us" requires inverse-lookup (when watched company mentions user's company) — flag this as needing self-identification setup |
| 7 | "Alert me when a Fortune 500 company hires a Chief AI Officer" | 0.83 | exec_move; target = category ("Fortune 500"); role qualifier "Chief AI Officer". Could be aggregation if user meant "any" Fortune 500; ask whether they want every single one or want aggregation. |
| 8 | "Alert me when a competitor's status page shows 3+ outages in a week" | 0.86 | This is actually aggregation (3+ events in a window), not single_event. Parser corrects type. |
| 9 | "Alert me when Databricks lowers their entry price" | 0.91 | pricing_change → tier_lowered; target Databricks |
| 10 | "Alert me when Stripe and Anthropic announce a partnership together" | 0.88 | partnership_announcement; target.type = "companies", logic "all"; both must be mentioned in the same partnership announcement |

### 8.2 aggregation parses (8)

| # | User input | Parse confidence | Notes |
|---|---|---|---|
| 11 | "Alert me when 3+ VP Revenue Operations hires happen at Series B AI companies in 30 days" | 0.94 | Clean aggregation; min_count=3; window=30d; event exec_move with role_pattern for VP RevOps; filter: funding_stage=series_b, category=AI |
| 12 | "Alert me when 5+ exec departures happen from a single company in 60 days" | 0.87 | aggregation per-company; "from a single company" means group_by=company, min_count_per_group=5 — this is a slight extension of the basic aggregation; ask if intent is per-company or any-5-departures-anywhere |
| 13 | "Alert me when 4+ competitors add a free tier in any 30-day window" | 0.91 | aggregation; window=30d rolling; filter: target=user's competitive_set; event pricing_change with qualifier free_or_no_commitment |
| 14 | "Alert me when there are 5+ exec departures from a single company in 60 days" | 0.87 | (duplicate-ish of 12) — combined as one aggregation with per-company grouping |
| 15 | "Alert me about layoffs at companies in my watchlist" | 0.81 | Could be aggregation (≥1 layoff_event among watchlist) or single_event. Default to aggregation with min_count=1 (effectively single_event but with watchlist filter); flag interpretation. |
| 16 | "Alert me when an AI startup raises a round of $50M+" | 0.88 | aggregation min_count=1 (effectively single_event with monetary qualifier); event funding_round; filter: category=AI, amount_min=$50M; window default 30d |
| 17 | "Alert me when 3+ companies in our category enter YC in a single batch" | 0.84 | aggregation; min_count=3; window aligned to YC batch cadence; filter: ICP category match; event "yc_directory_addition" (subcategory of product_launch or category-emergence) |
| 18 | "Alert me when 'data residency' appears in 3+ HN frontpage discussions in a week" | 0.89 | aggregation; min_count=3; window=7d; event "press_coverage"/"hn_discussion"; topic=data_residency |

### 8.3 threshold parses (6)

| # | User input | Parse confidence | Notes |
|---|---|---|---|
| 19 | "Alert me when 'agentic workflow' Wikipedia pageviews grow 50% over rolling 60 days" | 0.94 | Clean threshold; metric_source=wikipedia_pageviews; target="Agentic_workflow"; metric_type=growth_pct; value=0.5; window=60d; baseline previous_60_day_window |
| 20 | "Alert me when 'workflow automation' search interest drops 30% from prior quarter" | 0.85 | threshold; metric Wikipedia or Google Trends (parser asks); metric_type=growth_pct; value=-0.3 (drop); baseline previous_calendar_quarter |
| 21 | "Alert me when our category appears in HN frontpage 10+ times in a week" | 0.91 | threshold; metric_source=hn_algolia_count; metric_type=raw_count; value=10; window=7d |
| 22 | "Alert me when [competitor]'s GitHub stars grow 20% in 30 days" | 0.92 | threshold; metric_source=github_stars; target=competitor repo; metric_type=growth_pct; value=0.2; window=30d |
| 23 | "Alert me when 'agentic' replaces 'workflow' on 5+ competitor hero pages" | 0.79 | This isn't a clean threshold — it's a cross-source state observation. Parser could interpret as threshold (count of pages showing replacement) but the underlying observation requires page-diff comparison. Flag as low-confidence; suggest a custom tracking setup. |
| 24 | "Alert me when our trial signups from any specific company exceed 5 in a week" | 0.10 | REJECT — requires user CRM data which is anti-CRM. Parser explicitly returns parse failure: "Signal Console doesn't track trial signups — that lives in your CRM/analytics. Want to watch for something publicly observable instead?" |

### 8.4 adjacency parses (4)

| # | User input | Parse confidence | Notes |
|---|---|---|---|
| 25 | "Alert me about anything happening with Lumana" | 0.93 | Clean adjacency; target Lumana; default relevance_threshold=0.6; default digest_mode=true |
| 26 | "Alert me about Notion at the enterprise tier" | 0.88 | adjacency with scope; target Notion; scope.context="enterprise tier" — parser converts to scope.topics=["enterprise"] |
| 27 | "Alert me about anything Stripe does in payments orchestration" | 0.86 | adjacency with scope; target Stripe; scope.context="payments orchestration" |
| 28 | "Alert me about any new entrants in the customer data platform category" | 0.81 | adjacency with target.type=category; category_descriptor="customer data platform"; relevance_threshold=0.6; exclude_event_categories=["press_coverage"] (so it only flags substantive entries, not just press coverage of existing players) |

### 8.5 silence parses (4)

| # | User input | Parse confidence | Notes |
|---|---|---|---|
| 29 | "Alert me if Stripe stops publishing blog posts for 30+ days" | 0.95 | Clean silence; target.type=source, source_type=company_blog, company=Stripe; silence_days=30 |
| 30 | "Alert me if our category gets quiet on HN for 14+ days" | 0.84 | silence; target.type=topic, topic=ICP category; sources=[hn_firebase, hn_algolia]; silence_days=14 |
| 31 | "Alert me if no exec moves happen in our target cohort for 60+ days" | 0.86 | silence; target.type=event_category, category=exec_move, filters from user's ICP cohort; silence_days=60 |
| 32 | "Alert me if Lumana hasn't updated their pricing page in 6 months" | 0.89 | silence with longer threshold; target.type=source, source_type=pricing_page, company=Lumana; silence_days=180 |

### 8.6 Edge cases — expected parser behavior

These are inputs the parser should HANDLE GRACEFULLY (not necessarily succeed at).

| # | User input | Expected behavior |
|---|---|---|
| E1 | "Alert me when something interesting happens" | parse_confidence ~0.25; ambiguities: "What's interesting? Specific events? Specific companies? A category trend?"; suggest 3-5 reformulations |
| E2 | "Alert me about everything" | Reject with explanation: "That would fire on every item — instead, let me know what you specifically want to watch for." |
| E3 | "Alert me when Snowflake adds a tier AND we have an active Snowflake deal AND it's before our QBR" | Compound; suggest splitting; explain Deal-Watch handles the second condition automatically; the third condition (QBR timing) is calendar-based and out of trigger grammar scope |
| E4 | "Alert me when stuff changes at our competitors" | Low confidence; ask "Which competitors? What kind of change?" |
| E5 | "Alert me ASAP when anything bad happens" | Reject; "Bad" is subjective. Ask for specific negative signals (layoffs? exec departures? outages?) |
| E6 | "Alert me when MongoDB acquires Lumana" | Clean single_event but very specific. Parses cleanly. The trigger will likely stay dormant — that's fine, the user pre-registered a low-probability hypothesis worth tracking. |
| E7 | "Alert me when our customers churn" | Reject; anti-CRM. "Signal Console doesn't track customer behavior — that's your CRM/analytics. Want to watch for publicly observable signals about your customers instead, like their hiring or funding?" |
| E8 | "Alert me when the agentic space gets hot" | Low confidence; "hot" is subjective. Suggest threshold trigger on specific metric (Wikipedia pageviews, HN mention count, etc.) |

---

## 9. Failure modes

| Failure | Cause | Mitigation |
|---|---|---|
| Parser commits low-confidence interpretation | Confidence threshold too low | Strict 0.70 threshold; below that, no commit |
| User confirms a wrong parse | Confirmation flow not clear enough | Rephrased confirmation must be plain English; trigger can be edited any time |
| Trigger never fires when it should | Filters too strict; role pattern too narrow; target mismatched | After 30 days dormant, system prompts review |
| Trigger fires false-positively | Filters too loose; target ambiguous | After 3 false_fires, system prompts refinement |
| Compound input misinterpreted as atomic | Parser overreaches | Parser explicitly suggests splits for compound inputs |
| Target name ambiguous | Common-name companies (e.g., "Notion" — there's both the SaaS and other companies) | Parser resolves against watchlist; if not in watchlist, asks |
| Time references vague | "Soon," "recently," "in the near future" | Parser asks for specific timeframes |
| Subjective qualifiers | "Significant," "important," "interesting" | Parser asks for quantification |
| Cross-source state observation | "When X replaces Y on competitor pages" — requires page diff observation | Parser flags as low-confidence; suggests custom setup or breaks into simpler sub-triggers |
| User wants CRM-shape signal | "When our trial signups exceed N" | Parser rejects with anti-CRM explanation; suggests publicly observable alternatives |

---

## 10. Open questions

1. **Per-company grouping in aggregations.** "5 exec departures from a single company" requires grouping. Should the grammar formalize a `group_by` field on aggregation queries? Probably yes, but only for v0.2 after seeing real usage patterns.

2. **Inverse-target triggers.** "When MongoDB or Snowflake mentions US in their materials" — the target is OUR company, mentioned BY THE WATCHED companies. This requires self-identification setup. Probably make self-identification a separate config step rather than a trigger-grammar concern.

3. **Calendar-aware triggers.** "Alert me before our QBR" or "Alert me 2 weeks before [date]" — pure time-based, not pipeline-driven. Out of scope for v0.1; consider for v0.2 as a separate trigger type.

4. **Composite metrics in threshold triggers.** "When 'agentic' mentions across both Substack AND HN exceed N" — requires aggregating across sources. v0.2.

5. **Hierarchical event taxonomy.** The EventCategory list is flat. As categories grow, hierarchy might help ("any pricing event" includes tier_added, tier_removed, price_change). Probably v0.2.

6. **Trigger priorities.** When multiple triggers fire on the same item, which surfaces first? User-set priority, or system-derived (rarity, criticality)?

7. **Trigger templates.** Common trigger shapes ("alert me when ANY competitor adds a free tier") could be templates. Reduce friction for first-time users. Probably v0.2.

8. **Trigger versioning.** When the user edits a trigger, the prior version is lost (or stored as audit?). Probably retain last 5 versions for rollback.

9. **Multi-user trigger sharing.** When teams use Signal Console, do triggers belong to a user or to the team? Beta is single-user; V1 needs to decide.

10. **Trigger import/export.** Can a user export their trigger set as a portable document? Might enable sharing between operators. v0.2.

---

## 11. What gets locked here vs Phase 5

Phase 4 locks:
- The five trigger types and their full schemas
- The parser prompt and confidence model
- The matching algorithm pseudocode per type
- The lifecycle states and transitions
- The validation set (32 examples)
- Failure modes and parser-rejection behavior

Phase 4 does NOT lock:
- The evaluation harness — that's Phase 5. The Phase 4 validation set IS test data for Phase 5's harness.
- The actual code implementation — design-only, per the no-shipping-pressure constraint.
- The UI flow for trigger creation — design-level only; visual design is later.

The `TriggerParsedQuery` shape in the GTM OS Read Interface Contracts §3.7 placeholder is now locked. Watchlist Triggers can be specified, parsed, matched, and surfaced as a real capability rather than aspiration.

---

## 12. Design completion criteria for Phase 4

- [ ] The five trigger types are reviewed and approved (no missing types, no surplus types)
- [ ] The parser prompt is reviewed for voice and constraints (it's NOT a synthesis prompt — different voice rules apply; it's a structured-extraction prompt)
- [ ] The confidence model thresholds (0.70 commit floor) are agreed
- [ ] The 32-example validation set is reviewed; flagged examples that the parser is expected to fail on are agreed
- [ ] The compound-input handling (suggest splits) is reviewed
- [ ] The anti-CRM rejection cases (E7, #24) are reviewed
- [ ] Lifecycle state transitions are reviewed
- [ ] Open questions in §10 are answered or explicitly deferred

Once locked, Phase 5 (Evaluation Harness) is the natural next step — and the Phase 4 validation set becomes one of its inputs.

---

*End of Watchlist Trigger Grammar v0.1.*
