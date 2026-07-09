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
 * The CFO + Procurement + Legal scripts are carried forward verbatim
 * from the legacy `antaeus_studio_cfo_v2` localStorage shape, retired
 * in the architecture-reset. Per canon §4.16b "Migration content
 * owed" — the procurement + finance scripts were the only substance
 * worth preserving.
 *
 * VP Finance + General Counsel + InfoSec are net-new for Phase 4,
 * inferred from the recurring counterparty shapes in the Discovery
 * Studio framework families (Legal/GovTech segments for GC + Legal;
 * AI-native + Data-Intelligence segments for InfoSec; Sales/Revenue
 * Intelligence + Manufacturing segments for VP Finance). Authored to
 * match the role's actual pressure shape — VP Finance asks about
 * unit economics, not budget approval; InfoSec asks about SOC 2 +
 * pen-test + data-residency, not procurement rubrics.
 *
 * Operators can edit + extend per-deal; these are templates, not
 * rules.
 */

// ─── CFO / Finance ───────────────────────────────────────────────────

export const SEED_PUSHBACKS_CFO: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_cfo_1",
        trigger: "We need a 20% discount.",
        response:
            "What's the business case 20% buys us — earlier signature, multi-year, expansion commitment? We can shape the discount around what you're solving."
    },
    {
        id: "p_cfo_2",
        trigger: "Procurement won't approve at this price.",
        response:
            "Help me understand the procurement rubric. If it's TCV-based we can structure annual; if it's per-seat we can right-size. What rubric are they running?"
    },
    {
        id: "p_cfo_3",
        trigger: "We need to defer this to next quarter.",
        response:
            "What changes between now and then that makes the decision easier? If it's budget timing, we have annual prepay options. If it's confidence, that's a different conversation."
    }
];

// ─── VP Finance (Phase 4 — new) ──────────────────────────────────────

export const SEED_PUSHBACKS_VP_FINANCE: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_vpf_1",
        trigger: "The unit economics don't work for us at list.",
        response:
            "Let's pressure-test the unit math together — what's the cost-per-outcome you're comparing against? If we're 2× more expensive but 4× more accurate, that's a different ratio than headline price suggests."
    },
    {
        id: "p_vpf_2",
        trigger: "We need to see CAC payback under 12 months.",
        response:
            "Show me the payback model you're running. Most teams in your shape see payback at month 7-9 once the second use case lights up — but the first six months are honest. Which use cases are you committing to in year one?"
    },
    {
        id: "p_vpf_3",
        trigger: "What's the gross-margin impact on our P&L?",
        response:
            "If this displaces three FTEs at $180K loaded, the GM math swings positive in quarter two. The conversation is whether you're treating this as COGS or OpEx — and that's a CFO call. Want me to send the displacement model?"
    }
];

// ─── Procurement ─────────────────────────────────────────────────────

export const SEED_PUSHBACKS_PROCUREMENT: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_proc_1",
        trigger: "We have a preferred-vendor process.",
        response:
            "Understood. What's the typical timeline once a sponsor is identified? We can sequence around your gating — but the work needs to be moving in parallel with the paperwork, not blocked behind it."
    },
    {
        id: "p_proc_2",
        trigger: "We need 3 references and 3 quotes.",
        response:
            "Here are 3 references in your shape. On quotes — we don't bid against ourselves. If the question is value, we can show the ROI math. If it's compliance, point me at the rubric."
    },
    {
        id: "p_proc_3",
        trigger: "Can you match competitor X's pricing?",
        response:
            "Pricing-on-pricing isn't the conversation. Outcome-on-outcome is. What did they promise, what did we, who's accountable when it doesn't ship? Let's compare those."
    }
];

// ─── Legal ───────────────────────────────────────────────────────────

export const SEED_PUSHBACKS_LEGAL: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_legal_1",
        trigger: "We need indemnification carve-outs.",
        response:
            "Standard indemnification covers IP and gross negligence. What's the specific risk you're seeing? If it's data residency, that's an MSA appendix. If it's IP, we can be specific."
    },
    {
        id: "p_legal_2",
        trigger: "We can't agree to auto-renewal.",
        response:
            "Auto-renewal isn't worth dying on. We can move to opt-in renewal with 90-day notice. The behavior we're trying to prevent is silent churn, which opt-in solves."
    },
    {
        id: "p_legal_3",
        trigger: "Your limitation-of-liability cap is too low.",
        response:
            "Our cap matches the 12-month subscription value, which is the industry pattern for SaaS at this ACV. If there's a specific risk vector you're sizing for, let's name it and decide if it belongs in the contract or in an insurance rider."
    }
];

// ─── General Counsel (Phase 4 — new) ─────────────────────────────────

export const SEED_PUSHBACKS_GC: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_gc_1",
        trigger: "We need exclusive rights in our vertical.",
        response:
            "Exclusivity isn't on the table at this stage — but most-favored-nation pricing for the first 12 months is. The behavior you're protecting is being undercut, which MFN solves. What time horizon are you actually trying to fence?"
    },
    {
        id: "p_gc_2",
        trigger: "Termination-for-convenience must be 30 days.",
        response:
            "Standard SaaS termination-for-convenience is 90 days. The work we do in months one through three is the integration that makes month four valuable. We can compress to 60 if you accept a one-time setup fee that reflects that work."
    },
    {
        id: "p_gc_3",
        trigger: "We need full source-code escrow.",
        response:
            "We don't do source escrow — the product evolves too fast. What we do offer is a documented data-export contract: any data you put in, you can pull out in standard formats with 30 days' notice. That solves the continuity concern source-escrow is usually a proxy for."
    }
];

// ─── InfoSec / Security (Phase 4 — new) ──────────────────────────────

export const SEED_PUSHBACKS_INFOSEC: ReadonlyArray<PushbackTemplate> = [
    {
        id: "p_is_1",
        trigger: "We need SOC 2 Type II before we can sign.",
        response:
            "We're SOC 2 Type II audited — the report is current and under NDA. I can have it in your hands tomorrow. Walk me through which controls you're going to focus on so we can pre-flag any that need explanation."
    },
    {
        id: "p_is_2",
        trigger: "Customer data has to stay in our region.",
        response:
            "Data residency is on the roadmap for EU and APAC; we can commit to a date. For now we operate single-region US. If region commitment is a hard gate, let's talk about a contractual data-residency clause with a date-certain on the regional pod."
    },
    {
        id: "p_is_3",
        trigger: "We need penetration-test results from the last 12 months.",
        response:
            "We run quarterly external pen tests through a named firm — happy to share the most recent report and remediation tracker. The pattern most security teams want is the remediation log, not just the test result. Want both?"
    }
];

// ─── Concession ladders ──────────────────────────────────────────────

export const SEED_LADDER_DEFAULT: ReadonlyArray<ConcessionStep> = [
    {
        id: "l_1",
        give: "5% off list",
        ask: "2-year commitment + signature this week",
        cost: "low"
    },
    {
        id: "l_2",
        give: "10% off list + waive setup fee",
        ask: "3-year commitment + reference call",
        cost: "mid"
    },
    {
        id: "l_3",
        give: "15% off list + extended payment terms",
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
 * Inferred from Discovery Studio's decision-architecture segments
 * across the nine framework families — these are the recurring
 * opener shapes that hold pressure without leaking confidence.
 */
export const ASK_MOMENT_OPENINGS: Record<AskMoment, string> = {
    pricing_position:
        "Before we get into line items, let's anchor on the outcome you're buying — that's what determines whether the price is the right one.",
    discount_request:
        "I want to understand the case for a discount on its own terms. What business event does it unlock that list price doesn't?",
    terms_and_payment:
        "Payment terms are usually a proxy for a different concern. What's the cash-flow constraint we're actually solving?",
    contract_length:
        "Contract length is a confidence question, not a price question. What would you need to see in the first 90 days to be comfortable signing a longer term?",
    auto_renewal:
        "I hear you on auto-renewal — let's separate the behavior we're trying to prevent from the contractual mechanism.",
    indemnification:
        "Walk me through the specific risk vector. Standard carve-outs cover IP and gross negligence; if you're sizing for something else, name it.",
    security_review:
        "Tell me which controls you're going to focus on so I can pre-flag anything that needs explanation up front.",
    rampup_schedule:
        "The first 90 days set whether the second use case lights up. What's your team's bandwidth to actually deploy versus evaluate?",
    expansion_commitment:
        "If we structure for expansion now, we both win on the second wave. What's the realistic shape of phase two if phase one works?",
    decision_deadline:
        "Let's name the decision date out loud. What's blocking that date from being firm?"
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
