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
            "What commitment would accompany a 20% discount: an earlier signature, a multi-year term, or additional scope? I can assess that exchange against our approved pricing limits."
    },
    {
        id: "p_cfo_2",
        trigger: "Procurement won't approve at this price.",
        response:
            "Which procurement rule does this price exceed: total contract value, annual spend, or per-seat cost? Let's review whether an approved change in term or scope would meet it."
    },
    {
        id: "p_cfo_3",
        trigger: "We need to defer this to next quarter.",
        response:
            "What is expected to change next quarter: available budget, approval timing, or confidence in the business case? Let's identify that constraint before proposing a schedule or payment option."
    }
];

// ─── VP Finance (Phase 4 — new) ──────────────────────────────────────

export const SEED_PUSHBACKS_VP_FINANCE: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_vpf_1",
        trigger: "The unit economics don't work for us at list.",
        response:
            "What cost per outcome are you comparing against? Let's use your expected volume and verified performance results to compare total cost, benefits, and assumptions."
    },
    {
        id: "p_vpf_2",
        trigger: "We need to see CAC payback under 12 months.",
        response:
            "Can we review your payback model, including implementation costs, expected benefits, and timing? Which year-one use cases have enough evidence to support a forecast, and what would need to change to reach 12 months?"
    },
    {
        id: "p_vpf_3",
        trigger: "What's the gross-margin impact on our P&L?",
        response:
            "Which costs would change, and how would your finance team classify them? Let's separate potential capacity gains from actual cost reductions before estimating the gross-margin impact."
    }
];

// ─── Procurement ─────────────────────────────────────────────────────

export const SEED_PUSHBACKS_PROCUREMENT: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_proc_1",
        trigger: "We have a preferred-vendor process.",
        response:
            "What are the required vendor-approval steps, owners, and expected dates? Which evaluation activities are permitted while those approvals are in progress?"
    },
    {
        id: "p_proc_2",
        trigger: "We need 3 references and 3 quotes.",
        response:
            "What criteria must the references and quotes satisfy? I'll confirm which relevant customers have agreed to a reference call and which supporting materials we can provide."
    },
    {
        id: "p_proc_3",
        trigger: "Can you match competitor X's pricing?",
        response:
            "Let's compare scope, expected outcomes, service commitments, and total cost alongside price. Which differences matter to your decision, and what evidence supports each offer?"
    }
];

// ─── Legal ───────────────────────────────────────────────────────────

export const SEED_PUSHBACKS_LEGAL: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_legal_1",
        trigger: "We need indemnification carve-outs.",
        response:
            "Which risk do the requested carve-outs address? Let's identify the relevant contract language and have our legal teams review the proposed coverage and exclusions."
    },
    {
        id: "p_legal_2",
        trigger: "We can't agree to auto-renewal.",
        response:
            "What concern does auto-renewal create for your team? I can ask our contracts team to review an opt-in renewal option and the notice period each side would need."
    },
    {
        id: "p_legal_3",
        trigger: "Your limitation-of-liability cap is too low.",
        response:
            "Which potential losses are you trying to cover, and how does the proposed cap fall short? Let's have our legal teams review the current cap, requested exceptions, and any relevant insurance coverage."
    }
];

// ─── General Counsel (Phase 4 — new) ─────────────────────────────────

export const SEED_PUSHBACKS_GC: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_gc_1",
        trigger: "We need exclusive rights in our vertical.",
        response:
            "What business risk would exclusivity address, and for which market and duration? I'll confirm whether any exclusivity or pricing protection is permitted before proposing terms."
    },
    {
        id: "p_gc_2",
        trigger: "Termination-for-convenience must be 30 days.",
        response:
            "Why is a 30-day termination period necessary? Let's review the implementation commitments and costs, then ask our contracts teams which notice period and fees they can approve."
    },
    {
        id: "p_gc_3",
        trigger: "We need full source-code escrow.",
        response:
            "Which continuity risk are you addressing with source-code escrow? I'll confirm our escrow and data-export capabilities, then review with you whether either meets your requirements."
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
            "Which region and data types does the requirement cover? I'll confirm our current storage and processing locations, including subprocessors, before assessing whether we can meet it."
    },
    {
        id: "p_is_3",
        trigger: "We need penetration-test results from the last 12 months.",
        response:
            "What test scope and remediation evidence do you need? I'll confirm the date and scope of our latest assessment and which report or remediation details our security team can share."
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
