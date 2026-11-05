import type {
    AskMoment,
    ConcessionStep,
    CounterpartyRole,
    PushbackTemplate
} from "./types";

/**
 * Seed script content for the Negotiation room — Phase 4 of the
 * 2026-05 navigation-intelligence roadmap.
 *
 * The CFO, Procurement and Legal scripts originated in the retired
 * `antaeus_studio_cfo_v2` localStorage shape. Role and template IDs
 * remain stable; wording must not invent product capabilities or terms.
 *
 * VP Finance + General Counsel + InfoSec are net-new for Phase 4,
 * inferred from the recurring counterparty shapes in the Discovery
 * Studio framework families (Legal/GovTech segments for GC + Legal;
 * AI-native + Data-Intelligence segments for InfoSec; Sales/Revenue
 * Intelligence + Manufacturing segments for VP Finance). Authored to
 * address the role's responsibilities — VP Finance asks about
 * unit economics, not budget approval; InfoSec asks about SOC 2 +
 * pen-test + data-residency, not procurement rubrics.
 *
 * Operators must confirm capabilities, evidence and authority before
 * making commitments. Concessions are proposals requiring approval.
 */

// ─── CFO / Finance ───────────────────────────────────────────────────

export const SEED_PUSHBACKS_CFO: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_cfo_1",
        trigger: "We need a 20% discount.",
        response:
            "Never give a discount for nothing — ask what it buys: an earlier signature, a multi-year term, or more scope. A common trade is a smaller discount for a signature this month or a two-year term — confirm with your team that you can offer it. Set your walkaway — the lowest price and terms you won't accept — before the call, not in it."
    },
    {
        id: "p_cfo_2",
        trigger: "Procurement won't approve at this price.",
        response:
            "Ask which procurement rule the price breaks: total contract value, annual spend, or per-seat cost. If it's total value, a common trade is billing annually instead of up front; if it's per-seat, a common trade is right-sizing the seat count. Confirm with your team that you can offer either."
    },
    {
        id: "p_cfo_3",
        trigger: "We need to defer this to next quarter.",
        response:
            "Ask what changes next quarter that makes the decision easier. If it's budget timing, a common trade is starting now with a payment schedule that lands in their next budget — confirm with your team that you can offer it. If it's confidence in the business case, a payment change won't fix it; go back to what they still need to see."
    }
];

// ─── VP Finance (Phase 4 — new) ──────────────────────────────────────

export const SEED_PUSHBACKS_VP_FINANCE: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_vpf_1",
        trigger: "The unit economics don't work for us at list.",
        response:
            "Move the comparison from headline price to cost per result. Use a template like: if you're [N]× the price but materially more accurate, show the cost per correct result at their volume. Only use accuracy and volume numbers you can back up from their pilot or your verified results."
    },
    {
        id: "p_vpf_2",
        trigger: "We need to see CAC payback under 12 months.",
        response:
            "Ask to see their payback model, including setup costs and timing. Payback is usually slow while the first use case gets running, so ask which use cases they'll commit to in year one — a second use case is often what pulls payback forward. If 12 months isn't reachable on honest numbers, say so rather than stretching the model."
    },
    {
        id: "p_vpf_3",
        trigger: "What's the gross-margin impact on our P&L?",
        response:
            "Ask which costs actually change and how their finance team classifies this spend. Separate freed-up capacity from real cost cuts — finance teams discount capacity gains. If you have a cost-savings model built on their numbers, offer to send it."
    }
];

// ─── Procurement ─────────────────────────────────────────────────────

export const SEED_PUSHBACKS_PROCUREMENT: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_proc_1",
        trigger: "We have a preferred-vendor process.",
        response:
            "Ask for the approval steps, owners, and expected dates. Push to keep the evaluation work moving in parallel with the paperwork, not blocked behind it — deals that wait on vendor approval before any work starts often lose a quarter."
    },
    {
        id: "p_proc_2",
        trigger: "We need 3 references and 3 quotes.",
        response:
            "If you have customers who have agreed to take a reference call, offer them; confirm with your team before naming anyone. On the three quotes: don't bid against yourself by dropping price before you've seen a competing number. Ask whether the quotes are about value or a compliance rule, and answer that instead."
    },
    {
        id: "p_proc_3",
        trigger: "Can you match competitor X's pricing?",
        response:
            "Don't trade price for price. Compare what each vendor commits to deliver, who's accountable if it doesn't, and the total cost. If you do move on price, a common trade is a lower price for a longer term or a reference — confirm with your team that you can offer it."
    }
];

// ─── Legal ───────────────────────────────────────────────────────────

export const SEED_PUSHBACKS_LEGAL: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_legal_1",
        trigger: "We need indemnification carve-outs.",
        response:
            "Ask what specific risk the carve-out covers. Standard indemnification usually covers IP infringement and gross negligence; if their worry is narrower, a common trade is a specific clause or appendix for that one risk instead of a broad carve-out. Confirm the wording with your legal team."
    },
    {
        id: "p_legal_2",
        trigger: "We can't agree to auto-renewal.",
        response:
            "Auto-renewal is rarely worth losing a deal over. A common trade is opt-in renewal with 90-day notice — it protects you from a renewal that quietly lapses and gives them control. Confirm with your contracts team that you can offer it."
    },
    {
        id: "p_legal_3",
        trigger: "Your limitation-of-liability cap is too low.",
        response:
            "Ask which losses they're trying to cover. A cap equal to 12 months of fees is common for SaaS at this deal size. If they need more for a specific risk, a common trade is a separate, higher cap for that risk or an insurance rider instead of raising the whole cap — confirm with your legal team that you can offer it."
    }
];

// ─── General Counsel (Phase 4 — new) ─────────────────────────────────

export const SEED_PUSHBACKS_GC: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_gc_1",
        trigger: "We need exclusive rights in our vertical.",
        response:
            "Ask what exclusivity is protecting them from — usually being undercut by a competitor getting a better deal. A common trade is most-favored pricing for the first 12 months instead of exclusivity — confirm with your team that you can offer it. Ask what time horizon they actually need."
    },
    {
        id: "p_gc_2",
        trigger: "Termination-for-convenience must be 30 days.",
        response:
            "Ask why they need 30 days. The first months are usually setup work that only pays off later, so a very short exit puts that work at risk. A common trade is accepting 60 days in exchange for a one-time setup fee — confirm with your team that you can offer it."
    },
    {
        id: "p_gc_3",
        trigger: "We need full source-code escrow.",
        response:
            "Ask what continuity risk escrow is standing in for — usually 'what happens to our data if you go away.' A common trade is a data-export clause: they can pull all their data out in standard formats on notice. Confirm with your team what you can offer — escrow, a data-export clause, or both."
    }
];

// ─── InfoSec / Security (Phase 4 — new) ──────────────────────────────

export const SEED_PUSHBACKS_INFOSEC: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_is_1",
        trigger: "We need SOC 2 Type II before we can sign.",
        response:
            "Which controls and reporting period must the SOC 2 Type II report cover? I'll confirm our audit status and what documentation our security team is authorized to share before promising a delivery date."
    },
    {
        id: "p_is_2",
        trigger: "Customer data has to stay in our region.",
        response:
            "Which region and data types does the requirement cover? I'll confirm our current storage and processing locations, including subprocessors, before assessing whether we can meet it. If you don't host in their region yet, a common trade is a contract clause with a committed date for regional hosting — confirm with your team that you can offer it."
    },
    {
        id: "p_is_3",
        trigger: "We need penetration-test results from the last 12 months.",
        response:
            "What test scope and remediation evidence do you need? I'll confirm the date and scope of our latest assessment and which report or remediation details our security team can share. Security teams often care more about how findings were fixed than the test itself, so if you have a remediation log, offer it alongside the report."
    }
];

// ─── Concession ladders ──────────────────────────────────────────────

export const SEED_LADDER_DEFAULT: ReadonlyArray<ConcessionStep> = [
    {
        id: "l_1",
        give: "Proposed 5% off list (approval required)",
        ask: "2-year commitment + signature this week",
        cost: "low"
    },
    {
        id: "l_2",
        give: "Proposed 10% off list + waive setup fee (approval required)",
        ask: "3-year commitment + reference call",
        cost: "mid"
    },
    {
        id: "l_3",
        give: "Proposed 15% off list + extended payment terms (approval required)",
        ask: "Multi-year + case study + 1 year price-lock",
        cost: "high"
    }
];

/** Get seed pushbacks based on the counterparty role. */
export function seedPushbacksFor(
    counterparty: CounterpartyRole
): ReadonlyArray<PushbackTemplate> {
    switch (counterparty) {
        case "cfo":
            return SEED_PUSHBACKS_CFO;
        case "vp_finance":
            return SEED_PUSHBACKS_VP_FINANCE;
        case "procurement":
            return SEED_PUSHBACKS_PROCUREMENT;
        case "legal":
            return SEED_PUSHBACKS_LEGAL;
        case "gc":
            return SEED_PUSHBACKS_GC;
        case "infosec":
            return SEED_PUSHBACKS_INFOSEC;
    }
}

// ─── Ask-moment recommendations ──────────────────────────────────────

/**
 * Per-ask-moment opening-line suggestion. Authored sentences the
 * operator can carry forward into the actual opening line field.
 * These questions identify the buyer's constraint without assuming
 * their motives or implying that an unapproved term is available.
 */
export const ASK_MOMENT_OPENINGS: Record<AskMoment, string> = {
    pricing_position:
        "Which outcomes and scope are you evaluating at this price? Let's agree on the comparison before discussing individual line items.",
    discount_request:
        "What constraint would a discount address, and what commitment could accompany it?",
    terms_and_payment:
        "What payment schedule do you need, and which budget or cash-flow requirements does it address?",
    contract_length:
        "What concerns do you have about the contract length? Which results, review points, or commercial terms would help you assess a longer commitment?",
    auto_renewal:
        "What renewal process does your team require, including notice, approval, and cancellation dates?",
    indemnification:
        "Which risks and potential losses should the indemnification terms address? Let's identify them for the legal review.",
    security_review:
        "Which security controls and supporting documents does your review require, and who will assess them?",
    rampup_schedule:
        "What work and team capacity would deployment require in the first 90 days? Let's distinguish evaluation milestones from implementation commitments.",
    expansion_commitment:
        "If the first phase meets the agreed criteria, what additional scope might you consider, and who would approve it?",
    decision_deadline:
        "What is the target decision date, and which approvals or unresolved questions could change it?"
};

/**
 * Per-counterparty × ask-moment recommended pushback template id —
 * lights up the most-relevant seed pushback for the operator's
 * current setup. Null when no specific recommendation exists.
 */
export function recommendedPushbackId(
    counterparty: CounterpartyRole,
    askMoment: AskMoment
): string | null {
    const KEY: ReadonlyArray<[CounterpartyRole, AskMoment, string]> = [
        ["cfo", "discount_request", "p_cfo_1"],
        ["cfo", "pricing_position", "p_cfo_2"],
        ["cfo", "decision_deadline", "p_cfo_3"],
        ["vp_finance", "pricing_position", "p_vpf_1"],
        ["vp_finance", "discount_request", "p_vpf_2"],
        ["vp_finance", "terms_and_payment", "p_vpf_3"],
        ["procurement", "pricing_position", "p_proc_1"],
        ["procurement", "discount_request", "p_proc_3"],
        ["procurement", "decision_deadline", "p_proc_2"],
        ["legal", "indemnification", "p_legal_1"],
        ["legal", "auto_renewal", "p_legal_2"],
        ["legal", "contract_length", "p_legal_3"],
        ["gc", "expansion_commitment", "p_gc_1"],
        ["gc", "contract_length", "p_gc_2"],
        ["gc", "indemnification", "p_gc_3"],
        ["infosec", "security_review", "p_is_1"],
        ["infosec", "indemnification", "p_is_2"],
        ["infosec", "rampup_schedule", "p_is_3"]
    ];
    const match = KEY.find(
        ([c, m]) => c === counterparty && m === askMoment
    );
    return match ? match[2] : null;
}
