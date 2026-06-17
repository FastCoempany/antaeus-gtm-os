import type { AccentRole } from "@/components";
import type { IconName } from "@/icons";
import type { RecoveryAssessment, RecoveryLane } from "../../lib/recovery";
import { hrefToFutureAutopsy } from "../../lib/handoff";

/**
 * Pure adapters — map the Deal Workspace recovery engine onto the
 * design-system components the DS surface composes. The engine
 * (rankRecovery / assessDeal) is untouched; these translate lanes into
 * card tone + glyph and the top assessment into the Wayfinder pulling
 * cell. Kept pure so the mapping is unit-tested without rendering.
 */

/** Recovery lane → the card's gauge/edge tone (canon §3: red = real
 *  risk/intervention, amber = caution; healthy is the quiet neutral). */
const LANE_TONE: Record<RecoveryLane, AccentRole | undefined> = {
    critical: "red",
    "at-risk": "amber",
    healthy: undefined
};

export function laneTone(lane: RecoveryLane): AccentRole | undefined {
    return LANE_TONE[lane];
}

/** Critical wears the at-risk mark; everything else the deal glyph. */
export function laneIcon(lane: RecoveryLane): IconName {
    return lane === "critical" ? "at-risk" : "deal";
}

export function fmtMoney(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the single most-pressured deal's corrective
 * route. The board is ranked highest-pressure-first, so the head of the
 * list is the move — pre-mortem the deal that will close-lost if nothing
 * happens. Absent when nothing needs intervention (everything healthy or
 * the board is empty).
 */
export function toPulling(
    ranked: ReadonlyArray<RecoveryAssessment>
): PullingData | undefined {
    const top = ranked[0];
    if (!top || top.lane === "healthy") return undefined;
    return {
        verb: "Pre-mortem",
        object: top.deal.accountName,
        href: hrefToFutureAutopsy(top.deal.accountName),
        reasons: [...top.causes, top.nextMove].slice(0, 4)
    };
}

export type DealBoardFilter = "all" | "at-risk" | "stalled" | "this-quarter";

const STALE_PHRASE = /(stalled|days since)/i;
const QUARTER_PHRASE = /(quarter|overdue)/i;

/**
 * Apply the board filter to ranked assessments. `at-risk` keeps anything
 * off the healthy lane; `stalled` and `this-quarter` read the engine's
 * own cause phrases so the filter and the card agree on why a deal shows.
 */
export function applyFilter(
    ranked: ReadonlyArray<RecoveryAssessment>,
    filter: DealBoardFilter
): ReadonlyArray<RecoveryAssessment> {
    if (filter === "all") return ranked;
    if (filter === "at-risk") return ranked.filter((a) => a.lane !== "healthy");
    if (filter === "stalled")
        return ranked.filter((a) => a.causes.some((c) => STALE_PHRASE.test(c)));
    return ranked.filter((a) => a.causes.some((c) => QUARTER_PHRASE.test(c)));
}
