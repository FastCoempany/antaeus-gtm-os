# Signal Console — Design Posture

**Version:** 0.1
**Date:** 17 May 2026
**Status:** Foundational commitment — locks before Recipe Layer Spec v0.4
**Function:** Articulates the epistemic stance the product takes toward its user

---

## 0. What this document is and why it precedes everything else

Most product documents specify what the system does. This one specifies what kind of relationship the system has with the person using it. That sounds abstract, but it is the deepest level of design — the level at which decisions about features, prompts, surfaces, and architecture all derive their shape. A team that has not committed to a posture will produce inconsistent design at every downstream level, because each individual decision will reflect whichever posture happened to be in mind that day.

The posture is also where ethics live in this product. Not in the narrow sense of preventing the system from saying something objectionable, but in the deeper sense of what the system owes its user. A product can technically work — return outputs, render screens, ship features — while quietly failing the user in ways the user does not yet have language for. The posture is the commitment to not fail in those ways.

This document is short and load-bearing. It precedes Recipe Layer Spec v0.4, which will cash out the posture in concrete pipeline stages, data models, and prompts. The recipe spec is downstream. The posture is upstream of everything.

---

## 1. The two postures available to an intelligence product

There are two coherent postures a product like Signal Console can take. They are not mutually exclusive in theory, but they pull in different directions when concrete design decisions arise, and a product that tries to occupy both ends up occupying neither convincingly.

The first is the **responsive posture**. The product's job is to give the user what they asked for, as well as it can be given. The user names a watchlist; the product watches those entities. The user defines an ICP; the product scores items against that ICP. The user states a hypothesis through a Watchlist Trigger; the product matches incoming items against that hypothesis. The user marks Patterns as Used or Noise; the product tunes its weights accordingly. The system is faithful to the user's stated preferences and gets sharper over time at serving them.

The responsive posture is the default for most products, and for understandable reasons. It is lower friction (the user always gets what they expected), lower risk (the system never surfaces something the user dislikes), and easier to measure (success is whether the user's stated preferences are being met). Most consumer products, most B2B SaaS tools, most dashboards, are fundamentally responsive. The user is the customer; the customer is right; serve them.

The second is the **provocative posture**. The product still does everything the responsive posture does — the user's stated preferences are still served — but it takes on additional obligations beyond service. It tells the user not only what is happening in the world they have asked about, but also three things they did not ask for: what they might be missing, where their stated assumptions might be wrong, and how to defend the decisions they have made. The user's preferences are still met, but they are no longer the entire scope of what the product owes the user.

The provocative posture is harder to build and harder to live with. The user will sometimes be uncomfortable. The system will surface things the user did not ask for, and some of those things will sting. Some users will resist. The pipeline is more expensive, the storage requirements are larger, and the product is harder to evaluate quantitatively because some of its value is in challenging the user rather than serving them.

The reason Signal Console must be provocative, despite all of these costs, is that the buyer's job requires it. A founder-led B2B SaaS operator does not have the luxury of being right only about the things they have already noticed. The competitor that disrupts them will be the one they were not watching. The pricing reset that costs them deals will happen in a category they did not yet see as their category. The hypothesis they committed to about their ICP six months ago will calcify into a belief that ages badly, and the data has been telling them for months that they were wrong about it. A purely responsive product cannot help with any of these failures. A provocative product can, but only if the obligations are designed in deliberately rather than aspired to vaguely.

---

## 2. The structural commitment underneath the three obligations

Before naming the three obligations, it is worth stating the single epistemic move that generates them. The provocative posture is grounded in one commitment: the product treats the user's stated preferences as a *hypothesis under continuous evaluation*, not as a fixed truth to be served.

This sounds like a small distinction. It is not. In the responsive posture, when the user says "watch these companies," the product watches those companies, and the watchlist functions as a specification — it bounds what counts as relevant. In the provocative posture, when the user says "watch these companies," the product watches those companies *while also asking whether the watchlist is complete*. The watchlist functions as a hypothesis — it represents the user's current best guess at who matters, which the data may either support or refute over time.

The same shift happens at every layer. The ICP is a hypothesis about who the buyer is. The competitive set is a hypothesis about who is competing for the same dollars. The pain themes the user has tagged are hypotheses about what buyers actually care about. Each of these is testable against the data the pipeline is processing. A responsive product accepts them as given. A provocative product tests them continuously and tells the user when the evidence is not supporting the hypothesis.

This is the move. Once it is committed to, the three obligations follow.

---

## 3. The three obligations

### 3.1 The obligation to coverage

The product must surface entities, themes, and signals that the user has not named but that the data suggests they should be watching. This obligation exists because the user's stated watchlist is necessarily incomplete — they cannot watch what they have not yet noticed. The system, having access to a broader pool of source data than the user can consume directly, is positioned to notice what the user has missed. If the system does not surface those candidates, the user will continue not knowing.

Concretely, this obligation manifests as a Periphery Watch surface — a dedicated path in the pipeline that scores items by signals indicating relevance to the user's category even when the entities involved are not on the user's watchlist. Companies that co-occur frequently with watched competitors, that share investors or accelerator cohorts, that use the same operator-level vocabulary, that show up in case studies of buyers the user also targets, that hire from the same talent pool — these are all signals that an entity is becoming category-relevant whether the user has noticed or not. The Periphery Watch surface presents candidates with the specific reason for their inclusion, and the user decides whether to add them to the formal watchlist, dismiss them, or revisit later.

It is worth naming what this obligation is not. It is not a firehose of random entities — periphery candidates must clear their own signal threshold, even if that threshold is different from the standard relevance threshold. It is not a replacement for the user's curatorial role — the user still decides what gets added to the watchlist. And it is not a recommendation engine in the Netflix sense, because the goal is not to predict what the user will enjoy but to identify what they need to know about, which is a different and more demanding standard.

### 3.2 The obligation to framing

The product must challenge the interpretations the user has committed to, when the evidence in the pipeline contradicts or complicates those interpretations. This obligation exists because stated preferences calcify into beliefs, and beliefs age badly when the underlying world is changing — which is precisely the domain Signal Console operates in. The user's ICP from six months ago was a good guess given the data available then. The data available now may be telling a different story. A responsive system continues to serve the old ICP. A provocative system surfaces the discrepancy.

Concretely, this obligation manifests as a Contrarian Pattern surface — a parallel synthesis path that operates on a different prompt than the standard one. The standard synthesis asks "what is the most important pattern across this evidence?" The contrarian synthesis asks "what pattern in this evidence specifically contradicts or complicates the user's stated assumptions?" To do this, the contrarian synthesis must reference the user's assumptions explicitly. The ICP criteria, the competitive set ordering, the value proposition framing, the pain themes the user has prioritized — each of these is treated as a hypothesis the data can either support or refute. When the data refutes, the system surfaces a Pattern in a different register: cooler, more clinical, framed as "your stated assumption is X, the evidence suggests Y."

A concrete example will make this less abstract. Suppose the user's ICP weights "Series B AI companies with a CRO under 12 months" at high confidence. The standard synthesis pipeline scores items by relevance to this ICP, meaning items about Series A companies without a CRO score low and get filtered out before clustering. The contrarian synthesis pipeline, looking specifically for evidence that complicates the ICP, would generate a Pattern like: "Your ICP weights 'has a CRO under 12 months' at 0.92. Buyer-engagement signals over the last 90 days show stronger conversion in companies that have not yet hired a CRO — they are buying CDP infrastructure pre-emptively. Consider whether the CRO criterion is filtering out your highest-velocity cohort." This is uncomfortable for the user to read. That discomfort is not a side effect; it is the obligation operating as designed.

In addition to the Contrarian Pattern surface, the obligation to framing also includes two smaller mechanisms. An exploration budget reserves some portion of the system's enrichment capacity for items the user's behavioral history would otherwise filter out, hedging against the system narrowing too much over time as behavioral feedback accumulates. And a periodic ICP challenge runs quarterly, comparing the user's stated ICP criteria against the actual signal velocity in the data and surfacing the discrepancy when one exists. Together, these three mechanisms — Contrarian Patterns, exploration budget, ICP challenge — operationalize the obligation to framing at three different scales: per-Pattern, per-pipeline-run, and per-quarter.

What this obligation is not: it is not contrarianism for its own sake, where the system disagrees with the user as a default posture. The contrarian surface only generates Patterns when the data genuinely contradicts the user's stated assumptions. Most weeks it will surface nothing, and that is fine. It is not skepticism of the user, treating their judgment as suspect. It is the opposite — it is the system taking the user's judgment seriously enough to test it against evidence. And it is not adversarial — the contrarian Pattern is delivered with the same respect as the standard Briefing, but with a different voice register that signals "this is a challenge to your model, not an extension of it."

### 3.3 The obligation to defensibility

The product must preserve enough state at every Pattern's synthesis to let the user reconstruct what happened, on what basis, and with what supporting evidence — even months later. This obligation exists because every Pattern leads to action, every action has consequences, and every consequential decision might later need to be defended. A founder who refreshed an objection handler because Signal Console surfaced a Pattern about Snowflake's free-tier launch might be asked, six months later in a board review or a deal post-mortem, why they made that move on that date. The answer should not be "I don't remember exactly." The answer should be "the system surfaced this Pattern, which was based on these four pieces of evidence from these four sources, and here is the full reasoning chain that produced it."

Concretely, this obligation manifests as an audit envelope attached to every surfaced Pattern. The envelope contains the cluster as it existed at synthesis time, the HydratedContext as it existed at synthesis time (the user's ICP, watchlist, voice document, all preserved as they were that moment), the draft model output verbatim with model version and identifier, every critique iteration, every revision iteration, the quality gate decisions, and the final Pattern as surfaced. The envelope is append-only and immutable. When the Pattern is acted upon — when the user clicks Apply Move and drafts something in a downstream module — that action is also recorded, with the draft content and what the user saved.

This obligation does not require determinism, which is good, because deterministic LLM output is not achievable in practice. It requires *evidentiary reconstruction*: the ability to show what the system actually said at the time, even if re-running the pipeline today would produce something different. The standard is closer to a court reporter's transcript than a database query. The user can defend a decision by saying "here is what the system said, here is the evidence it was based on, here is what I did with that information," and that is sufficient even though it would not satisfy a BI auditor's stricter standard of identical reproducibility.

A show-your-work mode in the UI makes the audit envelope visible. Any Pattern can be expanded to reveal the cluster that produced it, the draft, the critique that flagged issues, the revisions that addressed those issues, the quality gate decisions, and the final output. This serves two functions. First, it lets the user defend decisions retrospectively, which is the original motivation. Second, it serves trust — users who can see how the sausage is made are more likely to trust the sausage, and they are also more likely to catch failures the system itself did not catch and feed that observation back into the evaluation harness.

What this obligation is not: it is not a compliance feature. The motivation is not regulatory; it is epistemic. The user is owed the ability to know what the system said and why, not because a regulator requires it but because acting on outputs you cannot reconstruct is a bad way to make consequential decisions. Compliance benefits follow naturally from the design, but they are not the reason for it.

---

## 4. How the three obligations relate

The obligations are not independent. They reinforce each other in ways worth understanding because the relationships will show up in design decisions later, and missing them would produce a fragmented product.

Coverage and framing are both responses to a single deeper problem: the user's mental model is incomplete in two different ways. Coverage addresses the entities the model has not yet included. Framing addresses the interpretations the model has committed to that are wrong. Together they form a coherent posture toward the user's epistemic state: the system is responsible for noticing both what is missing from the user's attention and what is mistaken in their interpretation. Either one alone would be partial; both together form the actual obligation.

Defensibility enables the other two. Periphery candidates need an audit trail showing why they were surfaced — what co-occurrence patterns, what investor overlaps, what vocabulary signals justified the suggestion. Contrarian Patterns need an even stronger audit trail, showing exactly which user assumption was being challenged, what evidence supported the challenge, and how the synthesis arrived at the framing. Without the audit infrastructure, the other two obligations would be impossible to defend when the user pushed back ("why are you surfacing this company I have never heard of?" or "why are you challenging my ICP?"). With the audit infrastructure, those questions have answers.

There is also a quieter relationship worth naming. The audit log feeds the evaluation harness, which means the system's own quality measurement depends on the same infrastructure that serves user defensibility. The harness samples production output, replays it through dimensional scoring, and detects drift over time. Without audit envelopes, the harness has nothing concrete to evaluate against. So the audit obligation is not just user-facing; it is also the foundation for the product's own self-improvement loop.

---

## 5. The trade-offs we are accepting

The provocative posture has costs. They should be named directly so they are not surprises later when something has to give.

The user will sometimes be uncomfortable. A Contrarian Pattern that challenges their ICP will land badly on the days when they were already feeling uncertain about their strategy. A Periphery candidate suggesting they should be watching a competitor they had explicitly dismissed will feel like the system second-guessing them. Some users will resist these obligations, and the product needs to hold the line: the uncomfortable surface is not a bug to be fixed; it is the obligation operating as designed. The mitigation is not removing the obligation but ensuring its voice register is respectful — the contrarian surface should not sneer, the periphery surface should not patronize.

The pipeline is more expensive. Periphery Detection adds a parallel scoring track. Contrarian Synthesis adds a parallel synthesis path with its own draft-critique-revise loop. Audit envelopes require persistent immutable storage for every Pattern. Each of these contributes to weekly per-user LLM cost. The cost model in Phase 7 needs updating to reflect these additions, probably adding twenty to thirty percent to the baseline weekly cost. The trade-off is between cheaper-and-merely-responsive versus more-expensive-and-properly-provocative, and the provocative version is what the product is for. The increased cost still leaves Tier 1 pricing comfortably above ninety percent gross margin, so the economics survive the addition.

The product is harder to evaluate quantitatively. A responsive product can be measured by whether it surfaces what users mark as Used. A provocative product needs to be measured by whether it surfaces what users *should have* marked as Used — including things they initially marked as Noise because the framing was uncomfortable. The evaluation harness needs metrics for this. Some Patterns that are marked Noise on first read but turn out to have been correct (the user later sees the evidence pile up) should retroactively count as wins for the system, not losses. This is harder to instrument than the responsive case, but it is necessary, and the addendum to the Phase 5 harness specification will need to handle it.

Finally, the product takes on an implicit claim that some users will find condescending: that the system can sometimes see things the user cannot. That claim has to be earned, not asserted. Every Periphery candidate surfaced incorrectly, every Contrarian Pattern that turns out to have been wrong, erodes trust in the obligation itself. The mitigation is precision over recall — the provocative surfaces should fire less often than the responsive ones, with higher confidence each time, because the cost of being wrong on a provocative surface is much higher than the cost of being wrong on a responsive one.

---

## 6. What this posture is not

Worth being explicit about boundaries, because the provocative posture is easy to misread as adjacent things it is not, and the misreadings will produce design drift if they are not named upfront.

It is not contrarianism. Disagreeing with the user as a default posture is corrosive and quickly stops being useful. The contrarian surface only generates Patterns when the data genuinely contradicts the user's stated assumptions. Most weeks it surfaces nothing, and that quietness is a feature.

It is not skepticism of the user's judgment. The opposite — it is the system taking the user's judgment seriously enough to test their stated preferences against evidence. The premise is that the user's preferences are good hypotheses worth verifying, not random opinions to be overridden.

It is not "AI that knows better than you." The system does not claim to know what the user should do. It surfaces evidence the user might not have seen and frames it in ways the user might not have considered. The user remains the decision-maker. The product's job is to widen the inputs to that decision, not to replace it.

It is not BI orthodoxy. Business intelligence values reproducibility, determinism, and self-service querying. The provocative posture is closer to investigative journalism than to BI — it is about finding the story the user did not know to ask about, not about querying a known data world. The two disciplines have different epistemic standards, and conflating them produces incoherent design.

It is not surveillance of the user's behavior. Behavioral feedback is used to tune the system, but it is also explicitly checked against — when behavioral feedback would narrow the system's coverage too much over time, the exploration budget and contrarian surfaces actively push back against that narrowing. The user's behavior shapes the system; it does not entirely determine the system. The user can be wrong about what they should be watching, and the system has to be willing to act on that possibility.

---

## 7. The downstream consequences

The posture has consequences at every layer of the existing design. They should be named here so they propagate cleanly into v0.4 of the recipe spec and the related artifacts.

The voice document needs a second voice register for the contrarian surface. The existing register — what we have called conversational gravity — is calibrated for Patterns that extend or refine the user's existing view. The contrarian surface needs a register that is cooler, more clinical, more analyst-presenting-findings. Exemplars and anti-exemplars for this register will need to be authored separately. The standard voice document remains the primary editorial brain; the contrarian voice is an extension of it, not a replacement.

The recipe spec needs three new pipeline elements. A Periphery Detection stage that runs parallel to the main enrichment and clustering paths, with its own scoring track and its own output shape. A Contrarian Synthesis stage that runs after the main synthesis, comparing surfaced clusters against the user's stated assumptions and generating a separate set of Patterns when contradictions are found. An audit envelope subsystem that wraps the existing pipeline and captures immutable state at every synthesis point. These are net additions, not modifications of the existing stages. The existing pipeline keeps its shape; the new posture adds parallel and supplementary paths around it.

The information architecture needs three new surface elements. A Periphery sub-surface, probably nested under the existing Watch List primary surface, where periphery candidates are presented with the reason for their inclusion. A Contrarian Briefing, probably a sibling tab to the standard Briefing rather than a sub-section of it, with its own cadence (monthly rather than weekly, because contradicting evidence accumulates more slowly than confirming evidence). A show-your-work modal accessible from any Pattern, exposing the audit envelope. These additions should be designed to feel like extensions of the existing IA rather than disruptions to it.

The cost model needs updating to reflect the new pipeline elements. Periphery Detection adds roughly ten percent to weekly per-user cost. Contrarian Synthesis adds roughly fifteen percent. Audit envelope storage is modest at single-user scale and grows linearly with scale; it should be modeled out to the thousand-user point. The total cost addition is probably in the range of twenty-five to thirty percent of the current baseline, which keeps Tier 1 margin healthy but is worth recomputing explicitly in the Phase 7 update.

The evaluation harness needs new dimensions for measuring provocative output. The synthesis harness needs to distinguish between standard and contrarian Patterns, with different reference test sets for each. The harness needs to handle the case where a user marks a contrarian Pattern as Noise initially but later evidence confirms it was correct — that retroactive correctness should count toward the contrarian surface's score, not against it. The harness specification in Phase 5 needs an addendum that handles retroactive scoring and the precision-over-recall calibration that the provocative surfaces require.

---

## 8. The single test to apply when designing forward

When any future design decision arises, the test is: does this serve the responsive product or the provocative one? If the decision can be made cleanly either way, it does not matter much. If it pulls in one direction, it should pull toward the provocative version. The reason is not that responsiveness is bad — it is the foundation, and everything the responsive product does, the provocative product also does. The reason is that any design pressure pulling away from provocation will be cumulative over time, and a year from now the product will have drifted back toward pure responsiveness if the posture is not actively defended at the decision level.

This document is the artifact that lets the test be applied. When the question comes up six months from now — "should this new feature surface things the user didn't ask for?" or "do we really need to keep an immutable record of every Pattern's synthesis path?" or "is the contrarian Briefing worth the cost?" — the answer is in here. The provocative posture is not a feature; it is the structural commitment that makes the product worth building. Every other commitment in the system is downstream of this one.

---

*End of Design Posture v0.1.*
*Locks before Recipe Layer Spec v0.4.*
