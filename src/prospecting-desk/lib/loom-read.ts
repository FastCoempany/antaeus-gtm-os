import type { Prospect, WorkbenchStats } from "./types";
import { t } from "@/lib/voice/t";

/**
 * Prospecting Desk status read.
 *
 * The score is an internal summary of how much account qualification work
 * is present and how much has moved to ready/sent states. User-facing copy
 * describes the observed counts and next workflow action; it does not turn
 * the score into a causal or predictive claim.
 */

export type LoomReadBand = "empty" | "loose" | "working" | "shipping";

export interface LoomRead {
    readonly score: number;
    readonly band: LoomReadBand;
    readonly bandLabel: string;
    readonly weekRead: string;
    readonly operatorMove: string;
}

export interface LoomReadInputs {
    readonly prospects: ReadonlyArray<Prospect>;
    readonly stats: WorkbenchStats;
}

const BAND_LABELS: Readonly<Record<LoomReadBand, string>> = {
    shipping: "Confirmed accounts available",
    working: "In progress",
    loose: "Qualification incomplete",
    empty: "Empty"
};

export function computeLoomRead(input: LoomReadInputs): LoomRead {
    const { prospects, stats } = input;
    const dropped = prospects.filter((p) => p.stage === "dropped").length;

    const score = computeScore({ stats, dropped });
    const band = scoreToBand(score, stats);

    return {
        score,
        band,
        bandLabel: BAND_LABELS[band],
        weekRead: pickWeekRead({ stats, dropped }),
        operatorMove: pickOperatorMove({ stats, dropped })
    };
}

interface ScoreInputs {
    readonly stats: WorkbenchStats;
    readonly dropped: number;
}

function computeScore(s: ScoreInputs): number {
    let score = 30;
    if (s.stats.total > 0) score += 6;
    if (s.stats.researched >= 1) score += 8;
    if (s.stats.ready >= 1) score += 12;
    if (s.stats.ready >= 3) score += 14;
    if (s.stats.pushed >= 1) score += 10;
    if (s.stats.pushed >= 3) score += 8;
    if (s.dropped > 0 && s.stats.total > 0) {
        const dropRatio = s.dropped / (s.dropped + s.stats.total);
        if (dropRatio > 0.5) score -= 8;
    }
    if (s.stats.captured >= 5 && s.stats.researched === 0) score -= 6;
    return Math.max(0, Math.min(92, score));
}

function scoreToBand(score: number, stats: WorkbenchStats): LoomReadBand {
    if (stats.total === 0) return "empty";
    if (score >= 70) return "shipping";
    if (score >= 50) return "working";
    return "loose";
}

interface WeekReadInputs {
    readonly stats: WorkbenchStats;
    readonly dropped: number;
}

function pickWeekRead(s: WeekReadInputs): string {
    if (s.stats.total === 0 && s.dropped === 0) {
        return t("No companies have been added yet. Save target criteria and add the first company.", { class: "body" });
    }
    if (s.stats.total === 0 && s.dropped > 0) {
        return t("All companies added so far have been set aside. Review the target criteria before adding more.", { class: "body" });
    }
    if (s.stats.captured >= 5 && s.stats.researched === 0) {
        return t("Five or more companies are waiting for qualification and none has been confirmed. Complete qualification before adding more.", { class: "body" });
    }
    if (s.stats.ready === 0 && s.stats.captured > 0 && s.stats.researched === 0) {
        return t("Companies have been added, but none has completed the qualification checks yet.", { class: "body" });
    }
    if (s.dropped > 0 && s.dropped >= s.stats.total) {
        return t("More companies have been set aside than remain active. Review the target criteria before adding more.", { class: "body" });
    }
    if (s.stats.ready >= 3) {
        return `${s.stats.ready} ${t("accounts have completed qualification and are ready to send to Signal Console.", { class: "body" })}`;
    }
    if (s.stats.pushed >= s.stats.total - s.stats.pushed && s.stats.pushed > 0) {
        return t("Most active accounts have already been sent to Signal Console. Add more companies if you need additional coverage.", { class: "body" });
    }
    return t("Continue completing qualification checks before adding more companies.", { class: "body" });
}

interface OperatorMoveInputs {
    readonly stats: WorkbenchStats;
    readonly dropped: number;
}

function pickOperatorMove(s: OperatorMoveInputs): string {
    if (s.stats.total === 0) {
        return t("Save target criteria and add the first company.", { class: "body" });
    }
    if (s.stats.ready >= 1) {
        return t("Send a confirmed account to Signal Console.", { class: "body" });
    }
    if (s.stats.researched >= 3) {
        return t("Complete the remaining qualification check on one account.", { class: "body" });
    }
    if (s.stats.captured >= 5 && s.stats.researched === 0) {
        return t("Complete qualification on one account before adding more companies.", { class: "body" });
    }
    if (s.stats.researched >= 1) {
        return t("Complete the qualification checks on one active account.", { class: "body" });
    }
    return t("Open an account and complete its qualification checks.", { class: "body" });
}
