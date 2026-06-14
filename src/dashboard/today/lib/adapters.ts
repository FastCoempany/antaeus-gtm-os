import type { AccentRole } from "@/components";
import type {
    CommandContextSummary,
    CommandFamily,
    CommandObject
} from "../../lib/types";

/**
 * Pure adapters — map the command-intelligence engine's output onto the
 * design-system components the today surface composes (spec 04). The
 * engine is untouched; these translate its CommandObjects into RiskCard
 * props, the Wayfinder pulling cell, and the Pulse timeline's zones.
 * Kept pure so the mapping is unit-tested without rendering.
 */

/** The gauge/edge tone for a ranked object, by its command family. */
const FAMILY_TONE: Record<CommandFamily, AccentRole | undefined> = {
    risk: "red",
    advisor: "blue",
    opportunity: "amber",
    move: "amber",
    icp: "blue",
    system: undefined
};

export function toneOf(object: CommandObject): AccentRole | undefined {
    return FAMILY_TONE[object.commandFamily];
}

/** The cause line, in plain words — copy first, else the top reason. */
export function causeOf(object: CommandObject): string {
    if (object.copy && object.copy.trim()) return object.copy.trim();
    if (object.scoreReasons.length > 0) return object.scoreReasons[0]!;
    if (object.subtitle && object.subtitle.trim()) return object.subtitle.trim();
    return object.metricValue || "";
}

export function scoreOf(object: CommandObject): number {
    return Math.round(object.score);
}

/**
 * A staleness phrase, mirroring the engine's own stale-detection
 * (signal-profile's testCardText) — the only quiet signal surfaced on
 * the CommandObject besides nextStepOverdue.
 */
const QUIET_PHRASE = /(stalled|stale|days since|gone quiet|no reply|no activity|drift|dark|silent)/i;

/**
 * True for an object that has gone quiet — its next step is overdue, or
 * its reasons read as stalled/silent. The Queue's GONE QUIET zone is
 * exactly these (absence is a signal); without the text check it would
 * stay perpetually empty because the engine doesn't surface staleDays
 * on the object.
 */
export function isQuiet(object: CommandObject): boolean {
    if (object.nextStepOverdue === true) return true;
    const text = `${object.copy ?? ""} ${object.scoreReasons.join(" ")}`;
    return QUIET_PHRASE.test(text);
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell (spec 04 §2.4): the system's one next
 * move, drawn from the spotlight object's primary action. Verb = the
 * action's imperative; object = the object's title; reasons = the
 * ranking reasons the `Why` panel renders. Absent when nothing ranks.
 */
export function toPulling(summary: CommandContextSummary): PullingData | undefined {
    const s = summary.spotlight;
    if (!s || s.actions.length === 0) return undefined;
    const primary = s.actions.find((a) => a.variant === "primary") ?? s.actions[0]!;
    return {
        verb: primary.label,
        object: s.title,
        href: primary.href,
        reasons: s.scoreReasons.slice(0, 4)
    };
}

export interface PulseZones {
    readonly now: ReadonlyArray<CommandObject>;
    readonly thisWeek: ReadonlyArray<CommandObject>;
    readonly goneQuiet: ReadonlyArray<CommandObject>;
}

/**
 * Bucket the pressure-ranked list into the Pulse timeline's time-zones
 * (spec 03 §2.1 + spec 04 §3.2): the quiet/overdue objects fall to GONE
 * QUIET (absence is a signal); of the rest, the most-pressured top few
 * are NOW and the remainder is THIS WEEK. The engine ranks by pressure;
 * the surface assigns the zones from its signals.
 */
export function toZones(
    ranked: ReadonlyArray<CommandObject>,
    nowCount = 3
): PulseZones {
    const quiet = ranked.filter(isQuiet);
    const live = ranked.filter((o) => !isQuiet(o));
    return {
        now: live.slice(0, Math.max(0, nowCount)),
        thisWeek: live.slice(Math.max(0, nowCount)),
        goneQuiet: quiet
    };
}
