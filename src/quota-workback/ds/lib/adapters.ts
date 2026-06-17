import type { AccentRole } from "@/components";
import type { QualityTone } from "../../lib/types";
import { benchmark, coverage, inputs, metrics, quality } from "../../state";
import { hrefToOutboundStudio } from "../../lib/handoff";

/**
 * Pure adapters — map the Quota Workback engine onto the design-system
 * tones the DS surface composes. The workback math, the benchmarks, the
 * coverage computation, and the quality band are untouched. These
 * translate the quality + coverage tone and route the weekly pressure
 * into Outbound Studio where the touches actually get run.
 */

const QUALITY_TONE: Record<QualityTone, AccentRole> = {
    good: "green",
    warn: "amber",
    bad: "red"
};
export function qualityTone(tone: QualityTone): AccentRole {
    return QUALITY_TONE[tone];
}

/**
 * The coverage tone: green at/over the benchmark multiple, amber within
 * 60%, red below. Mirrors the legacy CoveragePanel thresholds.
 */
export function coverageTone(): AccentRole | undefined {
    const c = coverage.value;
    const target = benchmark.value.coverage;
    if (!inputs.value.quota || !c.hasDeals || c.ratio <= 0) return undefined;
    if (c.ratio >= target) return "green";
    if (c.ratio >= target * 0.6) return "amber";
    return "red";
}

/** The coverage fill ratio (0..1) against the benchmark target. */
export function coverageRatio(): number {
    const c = coverage.value;
    const target = benchmark.value.coverage || 1;
    return Math.min(1, c.ratio / target);
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the workback turns a quota into weekly
 * pressure; the one next move is to go run the outbound that pressure
 * demands. Absent until the operator sets a quota.
 */
export function toPulling(): PullingData | undefined {
    if (!inputs.value.quota || inputs.value.quota <= 0) return undefined;
    const m = metrics.value;
    const q = quality.value;
    return {
        verb: "Run the outbound",
        object: `${m.touchesDay} touches/day`,
        href: hrefToOutboundStudio(),
        reasons: [
            `${m.meetingsWeek} meetings/week, ${m.dealsQuarter} deals/quarter`,
            `Plan posture: ${q.label}`
        ]
            .filter((s) => s && s.length > 0)
            .slice(0, 4)
    };
}
