import type { PushbackTemplate, ConcessionStep } from "./types";

/**
 * Seed script content carried forward from the legacy CFO Negotiation
 * room (`antaeus_studio_cfo_v2` localStorage shape, retired in the
 * architecture-reset). Per canon §4.16b "Migration content owed":
 * the procurement + finance scripts were the only substance worth
 * preserving from the old room. They land here as the starting set
 * for any fresh negotiation draft.
 *
 * Operators can edit + extend per-deal; these are templates, not
 * rules.
 */

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
    }
];

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

/** Get seed content based on the counterparty role. */
export function seedPushbacksFor(
    counterparty: "cfo" | "procurement" | "legal" | "gc"
): ReadonlyArray<PushbackTemplate> {
    switch (counterparty) {
        case "cfo":
            return SEED_PUSHBACKS_CFO;
        case "procurement":
            return SEED_PUSHBACKS_PROCUREMENT;
        case "legal":
        case "gc":
            return SEED_PUSHBACKS_LEGAL;
    }
}
