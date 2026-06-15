import type { AccentRole } from "@/components";
import type { CueIndex, Motion, MotionKey, Outcome } from "../../lib/types";
import { findCue, resolveCueIndex } from "../../lib/cues";
import { deriveMotion } from "../../lib/motion";
import {
    activeCueIndex,
    bestIcp,
    hottestAccount,
    latestTouch,
    stats
} from "../../state";
import { hrefToOutboundStudio } from "../../lib/handoff";

/**
 * Pure adapters — map the LinkedIn Playbook cue ladder + motion engine
 * onto the design-system components the DS surface composes. The cue
 * data, the motion engine, and the scripts are untouched. These
 * translate the cue + motion + outcome into tone, resolve the active
 * cue (motion default or operator pin), and route a composed cue into
 * the Wayfinder pulling cell (the outbound line the air cover supports).
 */

/** Cue rung → tone (watch warm → ask earned-red). */
const CUE_TONE: Record<CueIndex, AccentRole | undefined> = {
    0: "amber",
    1: "blue",
    2: "green",
    3: "amber",
    4: "red"
};
export function cueTone(index: CueIndex): AccentRole | undefined {
    return CUE_TONE[index];
}

/** Motion key → tone. */
const MOTION_TONE: Record<MotionKey, AccentRole> = {
    credibility: "amber",
    warm_signal_account: "red",
    convert_connection: "green",
    add_air_cover: "blue"
};
export function motionTone(key: MotionKey): AccentRole {
    return MOTION_TONE[key];
}

/** Logged-cue outcome → tone. */
export function outcomeTone(outcome: Outcome | null): AccentRole | undefined {
    if (outcome === "accepted" || outcome === "replied") return "green";
    if (outcome === "no_response") return "amber";
    if (outcome === "declined") return "red";
    return undefined;
}

/** The live motion, derived from the current cross-room context. */
export function motion(): Motion {
    return deriveMotion({
        icp: bestIcp.value,
        hottestAccount: hottestAccount.value,
        latestTouch: latestTouch.value,
        stats: stats.value
    });
}

/** The active cue index — the operator's pin, else the motion default. */
export function activeCueResolved() {
    const m = motion();
    const idx = resolveCueIndex(activeCueIndex.value, m.cueIndex);
    return { index: idx, cue: findCue(idx), motion: m };
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the cue ladder is air cover for an
 * outbound line, so once the motion names an account the one next move
 * is to compose that line in Outbound Studio. Absent until the context
 * names an account.
 */
export function toPulling(): PullingData | undefined {
    const m = motion();
    const account = m.accountName.trim() || hottestAccount.value?.name?.trim() || "";
    if (!account) return undefined;
    return {
        verb: "Compose the line",
        object: account,
        href: hrefToOutboundStudio(account),
        reasons: [m.whyNow, m.recovery].filter((s) => s && s.length > 0).slice(0, 4)
    };
}
