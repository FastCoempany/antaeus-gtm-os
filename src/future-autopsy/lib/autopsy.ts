import type { AutopsyDoc, CauseId, Vitals } from "./types";
import { topCauses } from "./causes";
import {
    chapterFor,
    chooseTasks,
    stageLead,
    stageWinLead,
    winConditionsFor
} from "./autopsy-data";
import { DEFAULT_PREFS, type ComputedVitals, type Prefs } from "./vitals";

/**
 * Future Autopsy document generator.
 *
 * The stable AutopsyDoc contract is preserved for downstream readers. The
 * generator ranks observed risk conditions, produces a current assessment,
 * lists corrected conditions, and recommends actions. It must not present a
 * modeled horizon as a factual loss date or claim that a recorded condition
 * caused a future win/loss.
 */

export interface GenerateOptions {
    readonly prefs?: Prefs;
    readonly horizonDays?: number;
}

const STORY_MAX = 700;

function clip(s: string, max = STORY_MAX): string {
    return s.length > max ? s.slice(0, max) : s;
}

/**
 * Produce a review horizon from the existing explainable heuristic.
 *
 * - risk score sets the initial review window, clamped to 7–90 days;
 * - a recorded close date can shorten that window;
 * - a past close date places the deal inside the final seven-day review band.
 *
 * This remains a heuristic, not a calibrated probability model. The horizon
 * controls urgency/order in the product; it is not a prediction that the deal
 * will be lost on that date.
 */
export function projectHorizonDays(
    vitals: Pick<ComputedVitals, "riskScore" | "closeDate">,
    fallback: number = DEFAULT_PREFS.autopsyHorizonDays,
    now: Date = new Date()
): number {
    const risk = Number(vitals.riskScore);
    if (!Number.isFinite(risk) || risk <= 0) return fallback;
    let days = Math.max(7, Math.min(90, Math.round(90 - risk)));
    if (vitals.closeDate) {
        const closeMs = Date.parse(vitals.closeDate);
        if (Number.isFinite(closeMs)) {
            const toClose = Math.ceil((closeMs - now.getTime()) / 86_400_000);
            days = toClose <= 0 ? Math.min(days, 7) : Math.min(days, toClose);
        }
    }
    return Math.max(1, days);
}

export function generateAutopsy(
    vitals: ComputedVitals,
    options: GenerateOptions = {}
): AutopsyDoc {
    const prefs = options.prefs ?? DEFAULT_PREFS;
    const horizonDays =
        options.horizonDays ?? projectHorizonDays(vitals, prefs.autopsyHorizonDays);

    const causes = topCauses(vitals, prefs, 5);
    const chapters = causes
        .map((c) => chapterFor(c.id))
        .filter((c): c is NonNullable<ReturnType<typeof chapterFor>> => c !== null);
    const winConditions = winConditionsFor(causes);
    const countermeasures = chooseTasks(vitals, causes, {
        highValueUSD: prefs.highValueUSD
    });

    const topCauseId: CauseId | "" = causes[0]?.id ?? "";
    const riskLead = stageLead(vitals.stageRaw, topCauseId);
    const correctedLead = stageWinLead(vitals.stageRaw);

    const riskTail =
        causes.length > 0
            ? " Recorded risk factors: " +
              causes
                  .slice(0, 3)
                  .map((c) => c.label ?? c.id)
                  .join(" ") +
              " These are contributing conditions in the current assessment, not proof that any one condition caused a loss."
            : "";

    const correctedTail =
        " Corrected conditions: " +
        winConditions
            .slice(0, 3)
            .map((w) => w.story)
            .join(" ") +
        " Addressing these conditions reduces the identified risk; it does not guarantee a close.";

    return {
        deal: vitals as Vitals,
        horizonDays,
        causes,
        chapters,
        winConditions,
        countermeasures,
        killSwitch: killSwitchFor(vitals, prefs),
        // Stable field names retained for compatibility with existing readers.
        loseStory: clip(riskLead + riskTail),
        winStory: clip(correctedLead + correctedTail)
    };
}

/**
 * Recommend considering closure when low value, prolonged inactivity, weak
 * qualification, and high modeled risk are all present. Stable function name
 * retained for compatibility with existing callers.
 */
export function killSwitchFor(
    vitals: ComputedVitals,
    prefs: Prefs = DEFAULT_PREFS
): string {
    const recommended =
        vitals.value <= prefs.killValueUSD &&
        vitals.staleDays >= prefs.staleCriticalDays &&
        vitals.qualScore <= 6 &&
        vitals.riskScore >= 70;
    if (recommended) {
        return "Consider closing this opportunity: low value, prolonged inactivity, weak qualification, and high modeled risk are all present.";
    }
    return "Continue working the opportunity for now. Consider closing it only if the recommended corrective actions do not produce buyer engagement or clearer qualification.";
}

/**
 * Stable ranking score used to order open deals for review.
 */
export function autopsyUniverseScore(
    vitals: ComputedVitals,
    prefs: Prefs = DEFAULT_PREFS
): number {
    let score = 2 * vitals.riskScore + Math.min(vitals.staleDays, 60);
    if (vitals.value >= prefs.highValueUSD) score += 20;
    if (vitals.stageRaw === "negotiation" || vitals.stageRaw === "verbal") {
        score += 10;
    }
    if (vitals.qualScore <= 6) score += 8;
    return score;
}

/**
 * Rank open deals and return the top N for review. Stable on ties via input
 * index. Closed deals are excluded.
 */
export function rankAutopsyUniverse(
    vitals: ReadonlyArray<ComputedVitals>,
    options: { readonly limit?: number; readonly prefs?: Prefs } = {}
): ReadonlyArray<ComputedVitals> {
    const prefs = options.prefs ?? DEFAULT_PREFS;
    const limit = options.limit ?? 6;
    const open = vitals.filter((v) => !v.isClosed);
    const scored = open.map((v, i) => ({
        v,
        i,
        score: autopsyUniverseScore(v, prefs)
    }));
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.i - b.i;
    });
    return scored.slice(0, limit).map((s) => s.v);
}
