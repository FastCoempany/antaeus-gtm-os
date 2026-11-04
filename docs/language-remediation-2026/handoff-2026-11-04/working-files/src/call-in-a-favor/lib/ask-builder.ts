import type {
    Advisor,
    AdvisorDeal,
    GeneratedAsk,
    Moment
} from "./types";

/**
 * Phase 4 / Room 10 Wave 2 — ask-builder + dealPressure.
 *
 * Faithful TypeScript port of legacy `buildAsk(ctx)` (lines 238-263)
 * and `dealPressure(deal)` (lines 198-206). Pure: no signals, no DOM —
 * takes (deal, advisor, moment, customAsk) explicitly so the same
 * function powers preview rendering and deployment-payload freezing.
 */

function dealName(deal: AdvisorDeal | null): string {
    return deal ? deal.accountName : "No deal selected";
}

function chooseBuyer(deal: AdvisorDeal | null): string {
    if (!deal) return "the right owner";
    return (
        deal.economicBuyer ||
        deal.champion ||
        deal.primaryContact ||
        deal.buyer ||
        "the right owner"
    );
}

/**
 * Per-deal pressure narrative used in the "Why now" line of the
 * generated ask + the proof blotter copy. Stage-aware, nextStepDate-
 * aware, and decision-process-aware.
 */
export function dealPressure(deal: AdvisorDeal | null): string {
    if (!deal) return "No deal is linked yet.";
    if (!deal.nextStepDate) {
        return "No dated next step is recorded.";
    }
    const nextDate = Date.parse(deal.nextStepDate);
    if (Number.isFinite(nextDate) && nextDate < Date.now()) {
        return "The recorded next-step date is overdue.";
    }
    const stage = deal.stage;
    if (
        (stage === "evaluation" ||
            stage === "poc" ||
            stage === "negotiation" ||
            stage === "verbal") &&
        !deal.decisionProcess
    ) {
        return "We still don't know how the buyer is going to make this decision.";
    }
    if (
        (stage === "negotiation" || stage === "verbal") &&
        !deal.economicBuyer
    ) {
        return "We're this late in the deal and we still haven't identified who has signing authority.";
    }
    if ((stage === "evaluation" || stage === "poc") && !deal.champion) {
        return "No champion is recorded for the buyer's team.";
    }
    return "Confirm the requested action and why this advisor is a relevant contact.";
}

export interface AskBuildInput {
    readonly deal: AdvisorDeal | null;
    readonly advisor: Advisor | null;
    readonly moment: Moment;
    /** Empty string = use the generated line; non-empty overrides. */
    readonly customAsk: string;
}

/** Build the generated ask (live preview + deployment freeze). */
export function buildAsk(input: AskBuildInput): GeneratedAsk {
    const { deal, advisor, moment, customAsk } = input;
    const company = dealName(deal);
    const buyer = chooseBuyer(deal);
    const askLine = moment.ask
        .replace(/\[company\]/g, company)
        .replace(/\[buyer\]/g, buyer);
    const advisorFirst = advisor ? advisor.name.split(" ")[0] : "[advisor]";
    const generated =
        `Hi ${advisorFirst},\n\n` +
        `${askLine}\n\n` +
        `Why now: ${dealPressure(deal)}\n\n` +
        "If you are open to helping, the suggested note is below. Please adapt it to reflect what you know directly.";
    const buyerOrPlaceholder = buyer === "the right owner" ? "[Buyer]" : buyer;
    const advisorName = advisor ? advisor.name : "[Advisor]";
    const forward =
        `Subject: Introduction regarding ${company}\n\n` +
        `${buyerOrPlaceholder} -\n\n` +
        `Would you be open to a conversation with [your company] about [specific business issue] at ${company}? ` +
        `${moment.advisorLine}\n\n` +
        "Worth a brief look?\n\n" +
        advisorName;
    return {
        ask: customAsk.trim().length > 0 ? customAsk : generated,
        forward,
        title: askLine,
        proof: moment.proof,
        outcome: moment.outcome
    };
}
