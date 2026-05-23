# Signal Console — Cost Model v0.2

**Version:** 0.2 (Bookkeeping update for v0.4 + Harness v0.2 additions)
**Date:** 17 May 2026
**Status:** Locked
**Supersedes:** Cost Model v0.1 (17 May 2026)
**Upstream commitments:** Recipe Layer Spec v0.4, Evaluation Harness v0.2

---

## 0. Purpose

This document updates the cost numbers from Cost Model v0.1 to reflect the actual cost of running Signal Console after the Recipe Layer v0.4 additions and the Evaluation Harness v0.2 additions. The fundamental structure of v0.1 — variable LLM costs dominate, fixed costs negligible at small scale, pricing tier candidates intact — carries forward unchanged. What changes is the per-stage line items, the per-pipeline-run total, the projections at scale, and the effective headroom under the existing cost ceilings.

This is a bookkeeping update, not a redesign. The pricing tiers, the ceiling enforcement mechanism, the degradation policy, and the optimization opportunities from v0.1 all carry forward. v0.2 adds line items and recomputes totals.

---

## 1. New cost line items from Recipe Layer v0.4

### 1.1 Periphery Detection (Stage 3.3b)

Periphery Detection runs in parallel with standard enrichment. Most of the scoring math is deterministic (co-occurrence counts, investor map lookups, hiring overlap checks), but the vocabulary-overlap scoring depends on pain-tag extraction that the enrichment LLM is already doing, so no additional LLM call is needed there. Buyer-overlap scoring may require one-time Tier B fetches of competitor /customers pages, but these are amortized across pipeline runs.

Net cost addition: roughly $0.001-0.003 per filtered item that reaches periphery scoring (about 30% of filtered items reach periphery scoring, since items with no off-watchlist entities are skipped). With ~15 filtered items per weekly pipeline run, ~5 reach periphery scoring.

**Per user per week: ~$0.005-0.015. Midpoint estimate: $0.010.**

### 1.2 Contrarian Synthesis (Stage 3.5e)

Contrarian Synthesis evaluates each surfaced cluster against the user's stated assumptions. Sonnet 4.6 with extended thinking runs once per cluster being evaluated. The cost per ContrarianPattern synthesis is ~$0.025-0.040, but most cluster evaluations result in `should_emit: false` (which still consumes the call), so the cost is per cluster evaluated, not per ContrarianPattern emitted.

With ~5 clusters per pipeline run reaching the contrarian evaluation stage, and ~2 emitting Patterns:

**Per user per week: ~$0.125-0.200. Midpoint estimate: $0.165.**

This is the single largest new cost line item from v0.4.

Note that this is higher than the v0.4 spec's preliminary estimate (which assumed only 2 evaluations per month, not 5 per week). The corrected estimate here accounts for evaluating *every* surfaced cluster against user assumptions, which is necessary for the contrarian path to operate correctly. The cost is higher than originally projected, but still proportionate to the value of the obligation.

### 1.3 Briefing Compose (Stage 3.8)

Briefing Compose runs once per Briefing assembly to generate the one-line lead. Sonnet 4.6, no extended thinking, ~250 tokens in, ~50 tokens out.

**Per user per week: ~$0.005-0.010. Midpoint estimate: $0.008.**

Trivial relative to other line items, but real.

### 1.4 Audit Envelope storage

Audit envelopes capture immutable state at every Pattern synthesis, every surfacing decision, and every user action. Average envelope size is ~50-100 KB (mostly serialized JSON of LLM call records, with prompt and response text). At ~50 envelopes per user per week (synthesis + surfacing + user actions across all surface types), weekly storage growth is ~3-5 MB per user. Annualized: ~150-250 MB per user.

**Storage cost** at Supabase paid tier (~$0.10/GB/month beyond the included tier):

- At 1 user (beta): negligible — fits within free tier
- At 100 users: ~25 GB/year cumulative, ~$2.50/month total
- At 1000 users: ~250 GB/year cumulative, ~$25/month total
- At 10,000 users: ~2.5 TB/year cumulative, ~$250/month total

**Per user per week, at scale: ~$0.005-0.010. Midpoint estimate: $0.008.**

Storage is a fixed-cost line item per user, not LLM-cost-per-call. It scales linearly and grows over time as envelopes accumulate (subject to the 12-month hot / 7-year cold retention policy from v0.4 §5).

### 1.5 Corporate Ownership Map maintenance

Quarterly curation effort — not a per-user cost, but a fixed dev/curation cost. Estimated 1-2 hours per quarter to maintain. At a notional $100/hr internal cost, ~$400-800/year, distributed across the user base.

**Per user per week at 100+ user scale: <$0.001. Negligible.**

### 1.6 Cost ceiling enforcement

Not a cost driver — this is the savings mechanism. The CostTracker singleton wraps every LLM call but the wrapper itself is deterministic computation. No additional LLM cost from enforcement.

---

## 2. New cost line items from Evaluation Harness v0.2

### 2.1 Contrarian Voice Harness — pre-merge gate

Runs against the 40-60 case contrarian test set when contrarian prompts are edited. Each run costs ~$2-4 (smaller test set than standard synthesis harness, fewer multi-stage replays).

At realistic prompt-edit cadence (1-3 contrarian-prompt edits per month during active development): **~$6-12/month total during active development; lower in steady state**. Amortized across user base.

**Per user per week at 100+ users: <$0.005. Negligible.**

### 2.2 Retroactive Correctness Scoring — long-cycle batch jobs

Mostly deterministic checks (cluster persistence growth, similar-theme Used marks, deal action lookups). Minimal LLM cost — the only LLM-involving step is computing theme overlap on candidate similar-theme Patterns, which is a cheap embedding comparison rather than full synthesis.

**Per user per week: ~$0.002-0.005. Midpoint estimate: $0.003.**

### 2.3 Periphery Candidate Harness — in-cycle and long-cycle

In-cycle test set runs are mostly deterministic computation (verifying periphery score math against expected values). Cost is minimal per run.

Long-cycle scoring (was the added candidate useful within 90 days) is deterministic queries against production data — no LLM cost.

**Per user per week: ~$0.002-0.005. Midpoint estimate: $0.003.**

### 2.4 Audit Envelope sampling (the bigger one)

Weekly production sampling per Harness v0.2 §6.3:
- 5% random sample of all envelopes
- 100% sample of envelopes for Patterns marked Noise
- 100% sample of envelopes that hit the human-review queue

For each sampled envelope, the harness replays the synthesis through current prompts to score against historical output. The replay cost is roughly equal to the original synthesis cost.

Estimating realistically:
- 50 envelopes/week per user (typical pipeline activity)
- 5% random sample = 2.5 envelopes/week
- ~1 Pattern marked Noise per week = 1 envelope
- Rare human-review-queue hits ≈ 0.2/week

Total replays per user per week: ~4 envelopes × ~$0.05 average replay cost = **~$0.20/user/week**.

This is the largest single new line item from Harness v0.2.

For power users with more activity (10+ Patterns surfacing per week, multiple Noise marks), this could approach $0.50-1.00/user/week. The v0.2 spec already flagged this and called for a per-user evaluation-cost ceiling separate from the production-pipeline ceiling. v0.2 of the cost model formalizes that: **a separate harness-cost-per-user ceiling at $0.50/week for Tier 1 users**, with overflow weeks downsampled to 50% sampling.

**Per user per week, conservative: $0.10-0.20. Midpoint estimate: $0.15.**

---

## 3. Updated per-pipeline-run cost

Restating the v0.1 baseline plus all v0.4 and v0.2 additions:

| Cost component | v0.1 baseline | v0.2 additions | v0.2 total |
|---|---|---|---|
| Enrichment (Stage 3.3) | $0.015 | — | $0.015 |
| Periphery Detection (Stage 3.3b) | — | $0.010 | $0.010 |
| Standard Synthesis CL × N (Stages 5a-c) | $0.179 (2 patterns) | — | $0.179 |
| Contrarian Synthesis (Stage 5e) | — | $0.165 | $0.165 |
| Briefing Compose (Stage 3.8) | — | $0.008 | $0.008 |
| Audit Envelope storage | — | $0.008 | $0.008 |
| Harness sampling (replays) | — | $0.150 | $0.150 |
| Other harness tracks (retro, periphery in-cycle) | — | $0.006 | $0.006 |
| **Total per user per week** | **$0.194** | **+$0.347** | **$0.541** |

The new baseline is **~$0.54/user/week**, compared to v0.1's ~$0.20/user/week. That's a roughly 2.8x increase, larger than the v0.4 spec's preliminary "~25%" estimate and larger than the ballpark figure given in chat.

The reason for the gap between estimate and reality is the Contrarian Synthesis runs against every surfaced cluster (not just the 1-2 that emit Patterns, but all ~5 that are evaluated) and the Harness sampling at full v0.2 §6.3 distribution is substantial. Both were undercounted in earlier estimates.

**Annualized per user: ~$28/year** (vs. v0.1's $10.40/year).

---

## 4. Updated user-scale projections

| User scale | Weekly LLM cost | Monthly cost | Annual cost | Storage cost (additional) |
|---|---|---|---|---|
| 1 user (beta) | $0.54 | $2.32 | $28 | Free tier |
| 10 users | $5.40 | $23 | $280 | Free tier / first paid tier $25/mo |
| 100 users | $54-108 (with power-user variance) | $230-465 | $2,800-5,600 | ~$25/mo |
| 1,000 users | $540-1,080 | $2,320-4,650 | $28,000-56,000 | ~$250/mo |
| 10,000 users | $5,400-10,800 | $23,200-46,500 | $280,000-560,000 | ~$2,500/mo |

The total cost at 1,000 users is now roughly $2,500-5,000/month, up from v0.1's $1,000-2,200/month estimate. Total at 10,000 users is roughly $25,000-50,000/month.

These numbers assume midpoint usage. Power users (heavy synthesis, frequent dismissals triggering retroactive harness sampling, large active deal registers) can push the per-user cost 2-3× higher. That's why the cost ceiling enforcement is critical at scale.

---

## 5. Updated pricing tier analysis

**Tier 1 — Solo Operator ($25-49/month, $299-499/year)**

- Annual LLM + storage cost: ~$28-35/year per user
- Gross margin at $299/year: **~88-91%** (down from v0.1's 95%+)
- Gross margin at $499/year: **~93-94%**
- Still healthy SaaS economics; tier-1 economics survive the additions.

**Tier 2 — Founder GTM ($79-129/month, $799-1,299/year)**

- Daily pipelines push weekly cost to ~$1.80-2.50 (3-4× baseline)
- Annual cost per user: ~$95-130/year
- Gross margin at $799/year: **~84-88%**
- Gross margin at $1,299/year: **~90-93%**
- Still healthy.

**Tier 3 — Founder-led Team ($199-399/month, $1,999-3,999/year per seat)**

- Heavy usage at this tier: ~$3-5/week per seat
- Annual cost per seat: ~$160-260/year
- Gross margin at $1,999/year: **~87-92%**
- Gross margin at $3,999/year: **~93-96%**
- Still healthy.

The pricing tiers all survive the cost increases. Margins compressed from v0.1 but well within healthy SaaS ranges. No pricing changes required from v0.1 to v0.2.

---

## 6. Updated cost ceiling design

v0.1's ceilings were set at ~10x the per-user baseline. With the v0.2 baseline of ~$0.54/week, the v0.1 ceilings now provide less headroom:

| Tier | v0.1 ceiling (weekly) | v0.1 headroom over baseline | v0.2 headroom over baseline |
|---|---|---|---|
| Tier 1 | $2.00 | 10× | ~3.7× |
| Tier 2 | $5.00 | 6.3× | ~2.7× (Tier 2 baseline higher) |
| Tier 3 | $15.00/seat | 10× | ~5× |

The Tier 1 headroom of ~3.7× is tight. A power user who runs daily pipelines, has 30+ active deals, and triggers full harness replay could plausibly hit the ceiling. v0.2 recommends raising the Tier 1 weekly ceiling to **$3.00/week** to restore ~5.5× headroom while keeping Tier 1 margins above 85%.

Updated ceilings:

| Tier | Weekly ceiling | Daily ceiling |
|---|---|---|
| Tier 1 | $3.00 (was $2.00) | $0.75 (was $0.50) |
| Tier 2 | $7.00 (was $5.00) | $2.00 (was $1.50) |
| Tier 3 | $20.00/seat (was $15.00) | $5.00/seat (was $4.00) |

Plus a separate harness-cost ceiling per user, distinct from the production-pipeline ceiling:

| Tier | Harness-cost weekly ceiling |
|---|---|
| Tier 1 | $0.50/week |
| Tier 2 | $1.50/week |
| Tier 3 | $5.00/week per seat |

When harness ceiling is hit, sampling rate drops from full 100%/100%/5% to 50%/50%/2.5% for the remainder of the period.

Degradation policy from v0.1 §5.3 carries forward unchanged: warning at 80%, throttle at 100% (Sonnet substitution + relevance threshold tightening), pause at 150%.

---

## 7. New optimization opportunities specific to v0.4 / v0.2 additions

### 7.1 Contrarian Synthesis batching

The single largest new line item is Contrarian Synthesis at ~$0.165/week. Each cluster currently gets its own contrarian evaluation call. Possible optimization: batch the user's assumptions once, then evaluate all 5 clusters in a single multi-cluster prompt rather than 5 separate prompts. Expected savings: ~50% of contrarian cost.

Worth testing in v0.5; not committed in v0.2 because batched contrarian evaluation could degrade quality if model attention spreads across multiple clusters.

### 7.2 Audit envelope compression

Envelopes are stored as JSON. Most of the storage volume is in LLM call records (prompt + response text). These compress well — typical zstd compression ratio on JSON text is 5-8x.

If envelope storage becomes a meaningful line item (which it isn't yet at small scale, but will be at 10,000+ users), compressing the LLM-call records before storage saves ~80% of storage cost. Implementation is a single-line addition to the storage write path.

Worth implementing once user count exceeds 500.

### 7.3 Harness sampling adaptive rate

Currently fixed at 5% random + 100% Noise + 100% human-review. Could be adaptive — when the harness composite scores are stable over the last 4 weeks, drop random sample to 2.5%; when scores are unstable, raise to 10%. Saves cost during stable periods without losing signal during regression-prone periods.

Worth implementing once enough harness history exists to define stability windows (probably 8-12 weeks post-launch).

### 7.4 Periphery scoring early-exit

Currently periphery scoring computes all 5 signals for every off-watchlist entity. Many entities will obviously not be candidates after the first 1-2 signals are computed (e.g., zero co-occurrence with watched entities). Adding early-exit logic — if `co_occurrence_score < 0.2`, skip remaining signal computation — saves ~30-40% of periphery scoring cost.

Easy implementation. Probably worth doing immediately.

---

## 8. Updated failure modes (cost-specific)

All v0.1 cost-specific failure modes carry forward. New v0.2 additions:

| Failure | Cause | Mitigation |
|---|---|---|
| Contrarian Synthesis runs hot on a quiet week | Few standard Patterns surface, but contrarian path evaluates them all anyway | Per-cluster contrarian-cost cap; degraded contrarian mode on cost overflow |
| Audit envelope storage growth exceeds projection | Heavy user with verbose synthesis paths (many revisions) | Per-user storage ceiling at 1 GB; oldest envelopes auto-archive when approaching limit |
| Harness sampling cost spikes after high Noise-mark week | User dismisses many Patterns; 100% Noise sampling balloons | Harness-cost ceiling separate from production ceiling; sampling rate drops on overflow |
| Contrarian batching (if implemented) degrades quality | Multi-cluster prompts spread model attention thin | Track A/B against per-cluster contrarian; revert if quality drops |
| Audit envelope compression breaks retrieval | Compression library version mismatch on read | Pin compression library version; test retrieval during quarterly review |
| Power user discovers cost-ceiling override | Habitual ceiling overrides become normal | Track override frequency; surface as upgrade prompt at 3+ overrides/month |

---

## 9. Summary of changes from v0.1

| Area | v0.1 | v0.2 |
|---|---|---|
| Per-user-per-week baseline | $0.20 | $0.54 |
| Annualized per-user | $10.40 | $28 |
| Cost components | 4 (enrichment, draft, critique, revise) | 8 (added periphery, contrarian, briefing compose, audit storage, harness sampling) |
| Tier 1 gross margin at $299/year | ~95% | ~88-91% |
| Cost ceilings | $2/$5/$15 weekly | $3/$7/$20 weekly |
| Harness-cost ceiling | (not separately specified) | $0.50/$1.50/$5 per tier |
| Pricing tiers | Unchanged | Unchanged |
| Pricing recommended | $299/$799/$1,999 minimum | $299/$799/$1,999 minimum (no change) |

The product still has healthy unit economics. The cost additions are real but proportionate to the value the additions provide: coverage (Periphery), framing (Contrarian), defensibility (Audit), and quality assurance (Harness). None of these are optional — they are the cash-out of the Design Posture obligations — and the cost of all four together is roughly 2.8× the original baseline, which sits well within the margin envelope.

---

## 10. Design completion criteria for Cost Model v0.2

- [x] All v0.4 cost additions itemized and quantified
- [x] All Harness v0.2 cost additions itemized and quantified
- [x] Per-user-per-week baseline recomputed
- [x] User-scale projections recomputed at 1/10/100/1000/10000
- [x] Pricing tier margins recomputed (all stay above 85%)
- [x] Cost ceilings updated to restore headroom
- [x] New harness-specific cost ceilings introduced
- [x] New optimization opportunities catalogued
- [x] New failure modes added
- [x] Storage scaling addressed (compression as deferred optimization)

Cost Model v0.2 is locked. No subsequent revision anticipated until either v0.5 of the Recipe Layer Spec ships or actual production usage data substantially diverges from the projections here.

---

*End of Cost Model v0.2.*
