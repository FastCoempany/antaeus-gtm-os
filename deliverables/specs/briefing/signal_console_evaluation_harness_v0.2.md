# Signal Console — Evaluation Harness v0.2 (Addendum)

**Version:** 0.2 (Addendum to v0.1)
**Date:** 17 May 2026
**Status:** Locked
**Supersedes:** Extends v0.1 (17 May 2026)
**Upstream commitments:** Recipe Layer Spec v0.4, Design Posture v0.1

---

## 0. What this document is and is not

This is an addendum, not a rewrite. The v0.1 specification — covering Synthesis Harness, Critic Harness, Parser Harness, and Enrichment Harness — stays in force unchanged for those four surfaces. Test sets, scoring methodologies, regression thresholds, A/B protocols, and human-in-the-loop review all carry forward as specified.

v0.2 adds three new evaluation tracks made necessary by Recipe Layer v0.4's three new pipeline elements:

1. **Contrarian Voice Harness** — evaluates the Contrarian Synthesis stage (3.5e) against its own anti-exemplars and reference test set, separately from the standard Synthesis Harness because the voice register, output shape, and success criteria are all different.

2. **Retroactive Correctness Scoring** — a long-cycle evaluation track that asks whether Patterns marked Noise by the user were actually right in retrospect. This is the harness mechanism that lets the system distinguish "user dismissed and was right" from "user dismissed and was wrong."

3. **Periphery Candidate Harness** — evaluates the Periphery Detection stage (3.3b) as a structured-extraction task with both in-cycle scoring (against hand-curated test cases) and long-cycle scoring (was the candidate genuinely useful when added to the watchlist?).

Plus, v0.2 changes how production sampling works in light of the Audit Envelope subsystem from v0.4 §5. Production samples now operate on whole envelopes — cluster, hydrated context, every LLM call, every gate decision — rather than just final Patterns. This enables retrospective deep-dive evaluation that was not possible in v0.1.

---

## 1. Design principles (extended)

All seven principles from v0.1 §1 carry forward. Two additions reflect the provocative posture:

8. **Provocative surfaces require precision-dominated scoring.** Standard synthesis (responsive surface) can tolerate higher recall — surfacing a borderline Pattern is acceptable. Contrarian and Periphery surfaces (provocative) cannot — every wrong fire damages user trust in the obligation itself. Scoring weights precision higher than recall for provocative surfaces.

9. **Some scoring is long-cycle and cannot be done at synthesis time.** Retroactive correctness, periphery candidate validation, and contrarian-acknowledgment outcomes all require waiting weeks or months before scoring is possible. The harness must support both in-cycle (synthesis-time) and long-cycle (months-later) evaluation tracks running in parallel.

---

## 2. The three new evaluation tracks at a glance

| Track | Evaluates | Cadence | Scoring shape |
|---|---|---|---|
| Contrarian Voice Harness | Stage 3.5e Contrarian Synthesis | Pre-merge + production sample (5% weekly) | Voice match, evidence grounding, assumption-challenge clarity, register compliance |
| Retroactive Correctness Scoring | Standard Pattern Noise dismissals | Long-cycle (60-90 days post-dismissal) | Did the underlying theme grow in evidence? Did similar patterns get Used later? |
| Periphery Candidate Harness | Stage 3.3b Periphery Detection | In-cycle (against test set) + long-cycle (90 days post-add) | In-cycle: signal-extraction precision/recall. Long-cycle: was the added watchlist entity actually useful? |

These run alongside the v0.1 harnesses, not as replacements.

---

## 3. Contrarian Voice Harness

### 3.1 Why it needs to be separate

The Standard Synthesis Harness in v0.1 §2.1 evaluates Patterns against the standard voice register — conversational gravity, declarative, evidence-anchored, willing to assert. The Contrarian Synthesis stage produces output in a *different* voice register: cooler, more clinical, analyst-presenting-findings-the-audience-will-resist. The exemplars are different. The anti-exemplars are different. The structural elements (the "challenged_assumption" field, the "suggested_reconsideration" field) don't exist in standard Patterns. Mixing the two in one harness would degrade scoring quality on both.

### 3.2 Test set composition

40-60 test cases of two shapes:

**Shape A — clusters that should produce ContrarianPatterns** (60% of test set):

```yaml
test_case:
  cluster:
    anchor: "string"
    items: [...]
    accounts_involved: [...]
  user_assumptions:
    icp_criteria: [...]
    competitive_set: [...]
    value_prop: "string"
    prioritized_pain_themes: [...]
  expected_outcome:
    should_emit: true
    expected_challenged_field: "icp_criterion | competitive_set | value_prop | pain_theme"
    expected_challenged_assumption_text: "string"
    expected_confidence_range: [0.7, 1.0]
  reference_contrarian_pattern:
    name: "string"
    challenged_assumption: "string"
    evidence_against_assumption: "string"
    what_this_means: "string"
    suggested_reconsideration: "string"
```

**Shape B — clusters that should NOT produce ContrarianPatterns** (40% of test set):

These are clusters where the evidence is consistent with the user's assumptions, or where the cluster simply doesn't speak to any of the user's stated positions. The harness measures whether the contrarian synthesis correctly returns `should_emit: false` rather than forcing a contrarian Pattern.

```yaml
test_case:
  cluster: { ... }
  user_assumptions: { ... }
  expected_outcome:
    should_emit: false
    expected_skip_reason: "string (e.g., 'evidence is consistent with user's stated ICP')"
```

This split matters: a contrarian synthesis that fires on every cluster is broken in a way the harness must catch. Forty percent skip-cases force the system to discriminate.

### 3.3 Scoring dimensions

Six dimensions, each 0-5, composite 0-30 normalized to 0-1:

| Dimension | What it measures | Weight |
|---|---|---|
| Emission accuracy | Did the system correctly emit / skip per expected outcome? Binary; 5 if matches, 0 if wrong direction | 0.25 |
| Voice-register match (contrarian) | Embedding similarity to contrarian voice exemplars + banned-vocab + structural compliance | 0.20 |
| Assumption-challenge clarity | Does the Pattern name the specific assumption being challenged, verbatim or near-verbatim from user state? | 0.15 |
| Evidence-against-assumption grounding | Proportion of "evidence against" claims that tie to specific evidence items | 0.15 |
| Suggested-reconsideration concreteness | Specificity of what the user should reconsider — vague gestures score lower than specific changes | 0.15 |
| Tone calibration (anti-sneer) | Is the voice clinical without being patronizing or sneering? LLM-judge with rubric | 0.10 |

The tone-calibration dimension is the most important and the hardest to measure. The contrarian voice is supposed to be cool, not cold; clinical, not condescending; analyst presenting findings the audience may resist, not lecturing them. The line between "clinical" and "patronizing" is narrow. Anti-exemplars specifically catalog the patronizing failure mode.

### 3.4 Contrarian voice exemplars (seed set for the harness)

Three reference passages demonstrating the contrarian register. The harness uses these as ground-truth anchors for voice-register-match scoring.

**Exemplar A — challenging ICP criterion:**

> Your ICP weights "has a CRO under 12 months in role" at 0.92. Buyer-engagement signals over the last 90 days show stronger conversion in companies that have not yet hired a CRO — they are buying CDP infrastructure pre-emptively, before the sales motion gets built around it. The criterion may be filtering out your highest-velocity cohort. Consider whether pre-CRO Series A companies deserve to weight as high or higher than CRO-in-role accounts.

**Exemplar B — challenging competitive set ordering:**

> Your competitive set lists Segment as primary and Hightouch as asymmetric. Over the last quarter, Hightouch has appeared in deal-loss notes from three of your active deals; Segment has appeared in only one. The data does not support the current ordering. If Hightouch is showing up more often in lost deals, it is operating as a direct competitor, not an asymmetric one.

**Exemplar C — challenging value proposition framing:**

> Your positioning leads with "orchestration depth." Buyer pain language across operator content over the last 90 days suggests buyers are increasingly framing the problem as "data residency" first and orchestration second. Either your positioning page lags the buyer vocabulary, or your buyers are not the operators producing this content. Worth a closer look at which is true.

### 3.5 Contrarian anti-exemplars (failure modes catalogued)

Five failure modes the harness specifically tests against:

**Failure 1 — Sneering or patronizing:**

> Your ICP is wrong. You clearly didn't think through how Series A companies behave differently from Series B. The data has been telling you this for months. Time to update your assumptions and pay attention.

The information may be correct; the delivery is hostile. The contrarian register names contradictions without scolding.

**Failure 2 — Hedging away the challenge:**

> There may be some reasons to consider whether perhaps the CRO criterion in your ICP could potentially be filtering out some companies that might be relevant. It's possible this is worth reviewing, although there are many factors to weigh.

Eight hedging adverbs in two sentences. If the contrarian path is going to challenge the user at all, the challenge has to commit. Hedged challenge is unread challenge.

**Failure 3 — Generic challenge not tied to specific assumption:**

> Your assumptions about the market are outdated. The data suggests a different picture than the one your ICP implies. You should revisit your assumptions.

No specific assumption named. No specific evidence cited. The challenge has nothing to actually respond to.

**Failure 4 — Using standard voice register:**

> The CRO-required criterion is filtering out companies that are actually buying, and we need to talk about it. Your sub-$50K POCs are increasingly happening at pre-CRO companies, and your ICP can't see them. Pre-CRO is the buyer cohort emerging.

This reads as a standard editorial Pattern, not a contrarian one. It is conversational and committed, but it doesn't position itself *as a challenge to a stated assumption*. The contrarian register has to signal "this challenges what you said" or it just looks like another Pattern.

**Failure 5 — Missing the so-what:**

> Your ICP weights "has a CRO under 12 months" at 0.92. The data shows pre-CRO companies are buying faster than the criterion would suggest.

States the contradiction; doesn't say what the user should do about it. Contrarian Patterns must include `suggested_reconsideration` — the user needs to know whether to update the criterion, lower its weight, or just track the discrepancy.

### 3.6 Storage and versioning

Test set lives at `/eval/contrarian/v0.1/` with the same directory structure as the v0.1 synthesis test set. Each test case is a directory with `cluster.json`, `user_assumptions.json`, `expected_outcome.json`, and `reference_contrarian_pattern.json` (or `expected_skip_reason.json` for skip-cases). Version increments quarterly; production-promoted cases get added between versions with date-stamped additions.

### 3.7 Regression detection

Same regression thresholds as v0.1 §4: composite drop ≤3% is noise; 3-10% triggers human review; 10-20% blocks the change; >20% triggers hard revert. Per-dimension regression flag at >25% triggers investigation regardless of composite direction.

The tone-calibration dimension gets an additional rule: any drop of 15%+ on tone-calibration alone blocks the change. Sneering output is more damaging than slightly-worse output, because users only forgive bad-voice contrarian Patterns once.

---

## 4. Retroactive Correctness Scoring

### 4.1 What it measures

Standard scoring at synthesis time: user marks Pattern as Used, Met, or Noise. Used and Met are wins; Noise is a loss. But this misses an entire failure category — Patterns the user dismissed where the system was actually right, and the user was wrong (the dismissal was based on resistance, distraction, or being early to the trend).

Retroactive correctness asks, 60-90 days after a Noise dismissal, whether the underlying signal turned out to matter. If it did, the original "loss" gets re-classified as a retroactive win, and the system's scoring of itself, the source's historical_snr, and the user's behavioral feedback all adjust accordingly.

### 4.2 The mechanism

For every Pattern marked Noise at time T, the system runs an asynchronous job at T+60 days and again at T+90 days asking: did the underlying signal materialize?

Three retroactive correctness signals are tracked:

**Signal A — cluster persistence and growth.** The cluster underlying the dismissed Pattern is checked for ongoing evidence accumulation. If between T and T+60d the same pain_tag/company/exec_move cluster gained ≥50% more weighted_evidence than at original surfacing, that's evidence the dismissal was premature.

```python
retro_signal_a = (cluster_evidence_at_T_plus_60d / cluster_evidence_at_T) >= 1.5
```

**Signal B — similar-theme Used marks.** If the user marked Used on Patterns with substantially-similar themes (overlapping pain_tags, same anchor company, same exec_move person) between T and T+90d, the user came around. That's a retroactive correctness signal.

```python
retro_signal_b = exists_used_pattern_with_theme_overlap(
    dismissed_pattern=P,
    window=(T, T + 90d),
    overlap_threshold=0.5
)
```

**Signal C — Deal action on the same theme.** If a Deal-Watch alert on the same underlying theme caused a user action (Apply Move clicked, draft saved) between T and T+90d, the theme proved actionable even though the original Pattern wasn't acted on.

```python
retro_signal_c = exists_deal_action_on_same_theme(
    dismissed_pattern=P,
    window=(T, T + 90d)
)
```

**Composite retroactive correctness flag:**

```python
retro_correctness = (
    retro_signal_a OR retro_signal_b OR retro_signal_c
)
```

If true, the Pattern's classification effectively shifts from `noise` to `retroactively_correct_noise`, which counts as a partial win in subsequent SNR and weighting calculations.

### 4.3 How retroactive correctness propagates

Several downstream effects, all asynchronous:

**Source historical_snr adjustment.** The standard formula in Recipe Layer v0.4 §3.4 was:

```
historical_snr[S] = EMA(
  (used + met) / (used + met + noise + ε),
  decay_factor = 0.95
)
```

v0.2 adjusts:

```
historical_snr[S] = EMA(
  (used + met + 0.7 × retroactively_correct_noise) /
  (used + met + actually_correct_noise + 0.3 × retroactively_correct_noise + ε),
  decay_factor = 0.95
)
```

The 0.7 / 0.3 weighting gives retroactively-correct items partial credit on the numerator (they were signal, just early) while still keeping some weight in the denominator (the user dismissed them, so they were imperfect surfacings). This prevents the SNR from rewarding sources for surfacing things that took 60 days to validate as aggressively as sources that surfaced things the user acted on immediately.

**User feedback weighting recalibration.** If the user has a high retroactive_correctness rate on their Noise marks (let's say >25%), the system surfaces this to the user as a periodic insight: "About a quarter of the Patterns you marked Noise turned out to have been right within 90 days. Consider being more cautious with quick dismissals." This is itself a kind of contrarian surface — it challenges the user's behavioral feedback patterns.

**Pattern shape evolution.** If certain Pattern shapes (e.g., narrative-shift patterns) have systematically higher retroactive correctness than others (e.g., exec-move patterns), the synthesis voice document can evolve to use slightly different framing for high-retro-correctness shapes — explicitly hedging the timing while committing to the direction.

### 4.4 Surfacing to the user

Retroactive correctness is mostly invisible plumbing. But two surfaces expose it:

**Quarterly retrospective report.** Every 90 days, the user gets a brief retrospective: "Over the last quarter, you dismissed N Patterns as Noise. Of those, M turned out to have been retroactively correct. Here are the three that should have been Used." This is informational, not corrective. The user can review the cases and decide whether their dismissal heuristic is sound.

**Per-Pattern indicator on archived dismissals.** When a user revisits an archived (Noise-marked) Pattern that has subsequently been flagged retroactively correct, the Pattern surface shows a small badge: "Retroactively confirmed by [evidence_summary]." This earns the system credibility without rubbing the user's face in it.

### 4.5 What this is not

It is not a "we told you so" mechanism. The retroactive correctness flag never surfaces aggressively. It does not block the user from making the same dismissal in the future. It is a self-correction signal for the system's own scoring, with quiet surfacing to the user.

It is also not a behavioral-change tool. The user remains the decision-maker. The retroactive surface gives them information about their own dismissal patterns; it does not tell them to dismiss less.

### 4.6 Failure modes

| Failure | Cause | Mitigation |
|---|---|---|
| Retroactive correctness rate too high (>40%) | Synthesis surfacing too many premature Patterns | Investigate clustering threshold; the system may be firing too early |
| Retroactive correctness rate too low (<5%) | User dismissals are well-calibrated | Working as intended; reduce or stop quarterly retrospective surfacing |
| Specific source consistently flagged retroactively correct | That source produces real signal the user systematically dismisses | Surface source-level pattern; user may want to weight it manually |
| Retro signal A fires for clusters that simply repeat | Same news re-syndicated; not actual evidence growth | Dedupe before scoring; require source diversity in evidence growth |

---

## 5. Periphery Candidate Harness

### 5.1 What it evaluates

The Periphery Detection stage (Recipe Layer v0.4 §3.3b) produces PeripheryCandidates with score breakdowns across five signals. Two evaluation tracks are needed:

**In-cycle scoring** — does the periphery scoring math correctly identify entities the test set marks as "should be a candidate"?

**Long-cycle scoring** — when the user adds a periphery candidate to their watchlist, does that addition prove useful within 90 days?

### 5.2 In-cycle test set composition

80-120 test cases of two shapes:

**Shape A — known-true periphery cases** (60% of test set):

```yaml
test_case:
  filtered_items: [...]                      # the input items
  user_context:
    watchlist: [...]
    competitive_set: [...]
    icp: { ... }
    pain_lib: [...]
  expected_outcome:
    candidates:
      - entity: "string"
        expected_score_range: [0.7, 1.0]
        expected_signal_contributions:
          co_occurrence_score: [0.7, 1.0]
          investor_overlap_score: [0.4, 1.0]
          # ... other signals
  notes: "string (why this entity should surface)"
```

**Shape B — known-false candidates** (40% of test set):

Cases where entities appear in items but should NOT be flagged as periphery candidates, either because they're irrelevant to the user's category, because they're already in the watchlist, or because the co-occurrence is coincidental.

```yaml
test_case:
  filtered_items: [...]
  user_context: { ... }
  expected_outcome:
    candidates: []  # nothing should emerge as candidate
    rejected_entities:
      - entity: "string"
        reason: "string (e.g., 'already in watchlist', 'coincidental co-occurrence', 'wrong category')"
```

### 5.3 In-cycle scoring dimensions

Five dimensions, each 0-5, composite 0-25 normalized to 0-1:

| Dimension | What it measures | Weight |
|---|---|---|
| Candidate emission precision | Of candidates emitted, what % match expected candidates? | 0.30 |
| Candidate emission recall | Of expected candidates, what % were emitted? | 0.25 |
| Score-range accuracy | For emitted candidates, are scores within expected ranges? | 0.15 |
| Signal-contribution accuracy | Do the per-signal scores (co-occurrence, investor, etc.) match expected contributions? | 0.20 |
| Rejection accuracy | Of explicitly-rejected entities, are they correctly excluded? | 0.10 |

Periphery emphasizes precision over recall (per the provocative-surface principle). A periphery surface that emits too many candidates teaches the user to ignore the surface; a periphery surface that misses some legitimate candidates can be supplemented over time as the test set grows.

### 5.4 Long-cycle scoring — was the candidate useful?

When a user clicks "Add to Watchlist" on a periphery candidate at time T, the system tracks the entity's subsequent contributions for 90 days:

**Usefulness signal 1 — items mentioning the added entity surface in user-relevant clusters.** Within 90 days of adding the entity, does it appear in at least 3 enriched items that score `user_relevance_score >= 0.5`?

**Usefulness signal 2 — Patterns about the added entity get Used marks.** Within 90 days, does the added entity appear in at least one Pattern that the user marks Used or Met?

**Usefulness signal 3 — Deal-Watch alerts on the added entity cause user actions.** Within 90 days, does any Deal-Watch alert involving the added entity result in an Apply Move click?

**Composite usefulness flag:**

```python
candidate_usefulness = (
    sum([signal_1, signal_2, signal_3]) >= 2
)
```

At least two of the three signals must fire for the candidate to be marked "useful." This is deliberately strict — the cost of false positives is higher than false negatives on the periphery surface.

### 5.5 How long-cycle scoring propagates

Same as retroactive correctness — adjustments to the per-signal weights in the Periphery Detection scoring formula. The five signals (co-occurrence, investor, vocabulary, buyer, hiring) each have base weights (0.25, 0.20, 0.20, 0.20, 0.15). Over time, the system tracks which signals best predict usefulness:

```python
# For each signal s, compute its predictive value
signal_predictive_value[s] = (
    P(candidate_useful | high s score) /
    P(candidate_useful | low s score)
)

# Adjust signal weights via EMA on predictive value
```

Signals that prove more predictive get weighted higher; signals that prove less predictive get weighted lower. The base weights are starting hypotheses; usage data is the ongoing test.

### 5.6 Failure modes

| Failure | Cause | Mitigation |
|---|---|---|
| Test set produces high in-cycle scores but low long-cycle usefulness | Test set is unrealistic — the curated "true candidates" aren't actually useful in practice | Refresh test set quarterly with production-validated candidates |
| User adds many candidates but few prove useful | Periphery threshold too loose; or user's add-decisions aren't well-calibrated | Surface user's add-vs-useful ratio; suggest higher add threshold |
| User never adds candidates | Periphery surface not being seen, or surface UX is broken | Telemetry on surface visits; user research |
| Specific signal proves uninformative | One of the five signals is noise for this user/category | Auto-decay that signal's weight; surface to product team |

---

## 6. Audit Envelope as evaluation data source

### 6.1 The shift from v0.1's production sampling

In v0.1 §6.1, weekly production sampling pulled 5% of last week's surfaced Patterns and re-scored them through the harness. The Patterns came with their final output but not with their full reasoning chain. Retrospective debugging required cross-referencing logs, prompt versions, model versions — often impractical.

With Recipe Layer v0.4's Audit Envelope subsystem, every surfaced Pattern has a complete envelope containing the cluster, the HydratedContext snapshot, every LLM call verbatim, every gate decision, and the final output. The envelope is immutable and queryable.

v0.2 production sampling shifts to operate on envelopes rather than just Patterns. This enables three new evaluation activities not possible in v0.1.

### 6.2 New evaluation activities enabled by envelopes

**Per-stage retrospective scoring.** When a Pattern was a problem (user marked Noise, or retro correctness signal absent), the envelope lets the harness re-evaluate which stage failed. Was the cluster well-formed but the draft was bad? Was the draft fine but the critic was too lenient? Was the critic right but the revision didn't apply the critique properly? Each stage's contribution to the final quality is visible in the envelope. Previously this would have been guesswork; now it's a data query.

**Critic regression detection.** Pull a sample of envelopes where the critic flagged blocker issues that were addressed in the revise pass. Replay the same drafts through the current critic prompt. If the current critic catches fewer or more issues than the historical critic did, that's drift — either critic-too-strict (production regression) or critic-too-lenient (silent quality drop).

**Cross-model ensemble validation.** v0.4 uses Sonnet 4.6 for critique and Opus 4.7 for draft and revise — different model families for ensemble protection. Envelopes record which model produced which output. The harness can sample envelopes and ask: are the disagreements between draft model and critique model still tracking actual issues, or have the models drifted into systematically similar outputs (which would reduce ensemble value)?

### 6.3 Envelope sampling strategy

Weekly job samples envelopes across three buckets:

1. **5% random sample** of all envelopes from the prior week — general health monitoring
2. **100% sample of envelopes for Patterns marked Noise** — concentrating evaluation effort on the cases most likely to reveal failures
3. **100% sample of envelopes that hit the quality gate's human-review queue** — these were already flagged; the audit captures what happened next

Each sampled envelope gets scored on the relevant track (Standard Synthesis, Contrarian Voice, or Periphery) using its current production-prompt-version scoring rubric. Discrepancies between historical and current scoring surface as drift signals.

### 6.4 Privacy and retention considerations

Audit envelopes contain user state (HydratedContext snapshots) that includes ICP definitions, watchlist companies, voice document, behavioral feedback. When envelopes are sampled for evaluation, the harness uses anonymized envelopes — user_id stripped, account names hashed unless the test specifically requires named entities. Anonymization happens at the sampling step, not in storage.

Per Recipe Layer v0.4 §5, envelopes are retained 7 years total: 12 months at full retrieval speed, archived afterward. Harness sampling pulls from the 12-month hot window; deeper historical analysis can pull archived envelopes on request.

---

## 7. Updates to v0.1 surfaces

Five small updates to the existing v0.1 harness surfaces driven by v0.2 additions:

### 7.1 Standard Synthesis Harness — new dimensions

Two new optional dimensions added to v0.1 §3.1's five scoring dimensions:

- **Retroactive correctness adjustment** (post-hoc): when a sampled Pattern's user-marked verdict gets retroactively flipped from Noise to retroactively-correct-Noise, the original test-time composite score is annotated with the retro flag for downstream analysis.
- **Audit-envelope traceability score**: does the Pattern's audit envelope cleanly trace from cluster through draft, critique, revise, gate, and final output without missing stages? Binary; flags envelope-recording bugs.

### 7.2 Critic Harness — calibration check via envelopes

v0.1 §2.2 specified a Critic Harness with 40-60 test drafts and known issues. v0.2 adds an envelope-based calibration: monthly, sample 50 envelopes from production where the critic flagged blockers, and ask "would the current critic prompt flag the same blockers on these historical drafts?" Drift in critic strictness over time becomes visible.

### 7.3 Parser Harness — extended validation set

The Parser Harness's 32-example validation set in Phase 4 §8 carries forward unchanged. v0.2 adds: when a user creates a trigger that fires false-positive 3+ times within 30 days, that user's natural-language input gets added to the test set's "should-have-clarified" cases. Real production confusions become future test inputs.

### 7.4 Enrichment Harness — corporate ownership map test

v0.4's addition of the Corporate Ownership Map to enrichment creates a new test case shape: items mentioning parent/subsidiary pairs. The enrichment must surface the relationship in `entities.companies` (e.g., "Segment (Twilio-owned)"). The Enrichment Harness adds 15-20 test cases specifically for ownership-relationship surfacing.

### 7.5 Production sampling cadence

v0.1 §6.1 specified weekly 5% sampling. v0.2 maintains weekly cadence but redistributes sample sources per §6.3 above (5% random + 100% of Noise-marked + 100% of human-review-queued).

---

## 8. New failure modes (v0.2)

| Failure | Cause | Mitigation |
|---|---|---|
| Contrarian Harness over-flags sneering on legitimate contrarian Patterns | Sneer-detection rubric too strict | Calibrate against human-judged samples quarterly |
| Retroactive correctness signal A fires on syndicated repeats | Same event re-syndicated across sources increases cluster evidence without representing new signal | Dedupe at the source-event level before retro scoring |
| Periphery long-cycle scoring biased toward power users | Power users add and use more candidates; light users add few | Per-user-tier scoring buckets; don't aggregate across tiers |
| Envelope sampling creates evaluation cost spikes | 100% sampling of Noise-marked Patterns + 100% of human-review-queue + 5% random can exceed budget on noisy weeks | Hard cap on evaluation cost per week; degrade to 50% sampling on overflow weeks |
| Test set freshness lag for contrarian voice | Voice register evolves but exemplars don't | Quarterly review + production-validated promotion |
| Long-cycle scoring delays signal feedback by 60-90 days | By design; long-cycle is structurally slow | Use in-cycle signals as leading indicators; surface long-cycle as confirmatory rather than primary |

---

## 9. Open questions

1. **Tone-calibration LLM-judge stability.** The contrarian voice's "anti-sneer" dimension is scored by an LLM judge with a rubric. Different judge models may calibrate sneer differently. Pinned judge model with quarterly human-spot-verification, but worth monitoring whether judge drift over Anthropic model versions affects scoring stability.

2. **Retroactive correctness for ContrarianPatterns.** Do contrarian patterns get retroactive correctness scoring on the same 60-90-day window? Probably yes, but the signals are different — instead of "user came around and marked similar Used," the relevant signal is "user updated their ICP/competitive_set/value_prop in the direction the contrarian challenged." Mechanism worth designing in v0.3.

3. **Periphery long-cycle window length.** 90 days is a starting hypothesis. Some entities prove useful slowly; others reveal themselves within weeks. Per-signal calibration may justify variable windows.

4. **Cross-user test set sharing.** When multiple users have similar ICPs, their test sets are similar. Worth exploring shared test-set infrastructure with per-user overlays in V1.0 multi-user phase.

5. **Audit envelope evaluation cost.** Replaying envelopes through the harness incurs LLM cost. Daily replay of 50 Noise-marked envelopes plus 100 random samples could approach $5-10/week per user. Tractable for power users; needs ceiling for light users. Probably belongs in the Phase 7 cost model addendum.

6. **Retroactive correctness gaming.** If users figure out that Noise marks get retroactively second-guessed, will they shift behavior? Probably not — the retroactive surface is quiet and informational, not gamified. But worth watching once the surface is live.

---

## 10. Design completion criteria for Phase 5 v0.2

- [x] Contrarian Voice Harness fully specified with test set composition, scoring dimensions, and reference exemplars
- [x] Retroactive Correctness Scoring mechanism specified with signals, formulas, and propagation
- [x] Periphery Candidate Harness fully specified with in-cycle and long-cycle scoring
- [x] Audit envelope sampling strategy specified
- [x] v0.1 harness surface updates documented
- [x] New failure modes catalogued
- [x] Open questions documented

Phase 5 v0.2 is locked. The next natural artifact is a Phase 7 cost model addendum (v0.2) reflecting the actual cost addition from v0.4 and v0.2 harness updates — but that's a small revision rather than a new phase.

---

*End of Evaluation Harness v0.2 addendum.*
