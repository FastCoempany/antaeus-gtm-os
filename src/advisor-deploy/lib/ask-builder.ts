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
    if (!deal) return "No live deal linked yet.";
    if (!deal.nextStepDate) {
        return "No dated next step is holding the thread together.";
    }
    const nextDate = Date.parse(deal.nextStepDate);
    if (Number.isFinite(nextDate) && nextDate < Date.now()) {
        return "Next step is overdue and momentum is decaying.";
    }
    const stage = deal.stage;
    if (
        (stage === "evaluation" ||
            stage === "poc" ||
            stage === "negotiation" ||
            stage === "verbal") &&
        !deal.decisionProcess
    ) {
        return "Decision process is still blurry for the current stage.";
    }
    if (
        (stage === "negotiation" || stage === "verbal") &&
        !deal.economicBuyer
    ) {
        return "Economic buyer is still not explicit late in the deal.";
    }
    if ((stage === "evaluation" || stage === "poc") && !deal.champion) {
        return "There is still no named internal driver carrying the evaluation.";
    }
    return "The ask must be precise enough to justify outside trust.";
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
        `Proof line: ${moment.proof}\n\n` +
        "If you are open, the forwardable note is below. It should take less than two minutes to adapt.";
    const buyerOrPlaceholder = buyer === "the right owner" ? "[Buyer]" : buyer;
    const advisorName = advisor ? advisor.name : "[Advisor]";
    const forward =
        `Subject: Quick read on ${company}\n\n` +
        `${buyerOrPlaceholder} -\n\n` +
        `I wanted to connect you with the Antaeus team because the work they are doing around this problem looks relevant to the thread at ${company}. ` +
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
