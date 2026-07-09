import type { Prospect, WorkbenchStats } from "./types";
import { t } from "@/lib/voice/t";

/**
 * Program 6 / PR 13 — Loom Read engine.
 *
 * Per the picked-winner Variant 02 / Ticket Loom wireframe
 * (deliverables/prototypes/wireframes/antaeus-sourcing-workbench-
 * triptych-2026-04-17.html line 348+), the workbench should not just
 * count rows — the loom-dock aside surfaces a Week read + an
 * Operator move so the operator sees what the workbench is saying,
 * not just what it contains.
 *
 *   - Loom score     — 0-92 derived posture
 *   - Band           — empty / loose / working / shipping
 *   - Week read      — diagnostic, what this week looks like
 *   - Operator move  — prescribed next action
 *
 * Pure: takes the prospect list + stats explicitly so tests can
 * probe every branch.
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
    shipping: "Shipping",
    working: "Working",
    loose: "Loose",
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
    // Penalize a heavy drop ratio — many captures that never converted.
    if (s.dropped > 0 && s.stats.total > 0) {
        const dropRatio = s.dropped / (s.dropped + s.stats.total);
        if (dropRatio > 0.5) score -= 8;
    }
    // Penalize a captured pile-up with nothing researched.
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
        return t("Nothing in the funnel yet. Describe a search to bring companies in.", { class: "body" });
    }
    if (s.stats.total === 0 && s.dropped > 0) {
        return t("Everything so far has been set aside. Sharpen who you're targeting before adding more.", { class: "body" });
    }
    // Stricter pile-up signal (5+ adds with nothing confirmed) fires
    // before the general "added but none confirmed" rule so the
    // heavier-debt case gets the targeted prescription.
    if (s.stats.captured >= 5 && s.stats.researched === 0) {
        return t("Companies are piling up unconfirmed. Confirm a few before you add more.", { class: "body" });
    }
    if (s.stats.ready === 0 && s.stats.captured > 0 && s.stats.researched === 0) {
        return t("Companies are added but none is confirmed yet. Adding is cheap; confirming is what moves them forward.", { class: "body" });
    }
    if (s.dropped > 0 && s.dropped >= s.stats.total) {
        return t("More set aside than kept. The search may be off — sharpen it before adding more.", { class: "body" });
    }
    if (s.stats.ready >= 3) {
        return `${s.stats.ready} ${t("ready to send. The funnel is producing this week.", { class: "body" })}`;
    }
    if (s.stats.pushed >= s.stats.total - s.stats.pushed && s.stats.pushed > 0) {
        return t("Most accounts are already in Signal Console. The funnel is short — bring in new companies.", { class: "body" });
    }
    return t("The funnel is moving. Keep confirming before you add more.", { class: "body" });
}

interface OperatorMoveInputs {
    readonly stats: WorkbenchStats;
    readonly dropped: number;
}

function pickOperatorMove(s: OperatorMoveInputs): string {
    if (s.stats.total === 0) {
        return t("Describe a search and add the first company.", { class: "body" });
    }
    if (s.stats.ready >= 1) {
        return t("Send the cleanest ready account to Signal Console.", { class: "body" });
    }
    if (s.stats.researched >= 3) {
        return t("Finish confirming one account — the last question is usually how you'll reach out.", { class: "body" });
    }
    if (s.stats.captured >= 5 && s.stats.researched === 0) {
        return t("Confirm one account. Stop adding until one gets through.", { class: "body" });
    }
    if (s.stats.researched >= 1) {
        return t("Finish confirming the strongest account.", { class: "body" });
    }
    return t("Walk one account forward. The funnel rewards forward motion.", { class: "body" });
}
