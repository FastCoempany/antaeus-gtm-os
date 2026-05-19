import type {
    Advisor,
    AdvisorDeal,
    Moment,
    SpendBand,
    SpendRead
} from "./types";
import { advisorsForDeal } from "./recommend";

/**
 * Phase 4 / Room 10 Wave 2 — spend-read score.
 *
 * Faithful TypeScript port of legacy `spendRead(ctx)` (lines 265-274).
 * Returns a score 30-92 capped, an ask-readiness band, and human-
 * readable label + copy that drive the desk-read aside.
 *
 * Boost rules (verbatim):
 *   base 30
 *   + 15 if a deal is selected
 *   + 15 if an advisor is selected
 *   + 14 if at least one advisor exact-company match exists for the deal
 *   +  8 if the deal has a nextStepDate
 *   +  8 if the deal has either an economicBuyer or a champion
 *   +  5 if the moment is non-intro
 *   Math.min(92, score)
 *
 * Bands:
 *   ≥ 72 → ask_ready
 *   ≥ 54 → narrow_first
 *   else → not_ready
 */

const BAND_LABELS: Readonly<Record<SpendBand, string>> = {
    ask_ready: "Ask-ready",
    narrow_first: "Narrow first",
    not_ready: "Not ready"
};

const BAND_COPY: Readonly<Record<SpendBand, string>> = {
    ask_ready:
        "Specific enough to send, and small enough that it won't cost you trust with the advisor.",
    narrow_first:
        "A path exists. Tighten the buyer or proof line before sending.",
    not_ready:
        "Don't ask an advisor for help yet — the deal and the ask still aren't clear enough."
};

export interface SpendReadInput {
    readonly deal: AdvisorDeal | null;
    readonly advisor: Advisor | null;
    readonly moment: Moment;
    readonly advisors: ReadonlyArray<Advisor>;
}

export function computeSpendRead(input: SpendReadInput): SpendRead {
    const { deal, advisor, moment, advisors } = input;
    let score = 30;
    if (deal) score += 15;
    if (advisor) score += 15;
    if (deal && advisorsForDeal(advisors, deal).length > 0) score += 14;
    if (deal && deal.nextStepDate) score += 8;
    if (deal && (deal.economicBuyer || deal.champion)) score += 8;
    if (moment.id !== "intro") score += 5;
    const finalScore = Math.min(92, score);
    const band: SpendBand =
        finalScore >= 72
            ? "ask_ready"
            : finalScore >= 54
              ? "narrow_first"
              : "not_ready";
    return {
        score: finalScore,
        band,
        bandLabel: BAND_LABELS[band],
        bandCopy: BAND_COPY[band]
    };
}
