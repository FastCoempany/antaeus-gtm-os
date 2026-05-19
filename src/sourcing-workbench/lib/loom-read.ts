import type { Prospect, WorkbenchStats } from "./types";

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
        return "No prospects in the workbench yet. The territory has nothing pushable.";
    }
    if (s.stats.total === 0 && s.dropped > 0) {
        return "Every prospect has dropped off the bench. Reset the thesis before adding more.";
    }
    // Stricter pile-up signal (5+ captures with no research) fires
    // before the general "any captured with nothing researched" rule
    // so the heavier-debt case gets the targeted prescription.
    if (s.stats.captured >= 5 && s.stats.researched === 0) {
        return "Names are piling up but nothing is hardening. Tighten the research bar before adding more captures.";
    }
    if (s.stats.ready === 0 && s.stats.captured > 0 && s.stats.researched === 0) {
        return "Captured names with nothing researched. Names cost nothing — research costs everything.";
    }
    if (s.dropped > 0 && s.dropped >= s.stats.total) {
        return "More drops than keeps. The sourcing thesis may be off — review the query cards before more captures.";
    }
    if (s.stats.ready >= 3) {
        return `${s.stats.ready} ready to push. The workbench is producing this week.`;
    }
    if (s.stats.pushed >= s.stats.total - s.stats.pushed && s.stats.pushed > 0) {
        return "Most prospects already pushed forward. The bench is short — backfill with new captures.";
    }
    return "Workbench is moving. Keep researching captured names before adding more.";
}

interface OperatorMoveInputs {
    readonly stats: WorkbenchStats;
    readonly dropped: number;
}

function pickOperatorMove(s: OperatorMoveInputs): string {
    if (s.stats.total === 0) {
        return "Capture the first name from QueryStudio.";
    }
    if (s.stats.ready >= 1) {
        return "Push the cleanest ready name to Signal Console.";
    }
    if (s.stats.researched >= 3) {
        return "Tighten one researched prospect into ready — the gap is usually the owner.";
    }
    if (s.stats.captured >= 5 && s.stats.researched === 0) {
        return "Research one captured prospect. Stop adding until one converts.";
    }
    if (s.stats.researched >= 1) {
        return "Tighten the highest-quality researched prospect into ready.";
    }
    return "Walk one prospect forward. The workbench rewards forward motion.";
}
