import type { AccentRole } from "@/components";
import type { Temperature, TouchOutcome } from "../../lib/types";
import { canGenerate, currentSendLine, rack } from "../../state";
import { hrefToLinkedInPlaybook } from "../../lib/handoff";

/**
 * Pure adapters — map the Outbound Studio generator + rack onto the
 * design-system components the DS surface composes. The send-line
 * generator is untouched; these translate temperature + motion band into
 * tone and a composed line into the Wayfinder pulling cell (the air
 * cover that follows a live outbound line).
 */

/** Engagement temperature → tone (the heat ladder). */
const TEMP_TONE: Record<Temperature, AccentRole | undefined> = {
    ice_cold: undefined,
    cool: "blue",
    warm: "amber",
    hot: "red",
    closing: "green"
};
export function temperatureTone(temp: Temperature): AccentRole | undefined {
    return TEMP_TONE[temp];
}

/** The generated line's motion band → tone. */
export function motionTone(band: "thin" | "workable" | "ready"): AccentRole {
    if (band === "ready") return "green";
    if (band === "workable") return "amber";
    return "red";
}

/** A logged touch's outcome → tone. */
export function outcomeTone(outcome: TouchOutcome | null): AccentRole | undefined {
    if (outcome === "replied" || outcome === "meeting_booked") return "green";
    if (outcome === "referred") return "blue";
    if (outcome === "no_response") return "amber";
    if (outcome === "unsubscribed") return "red";
    return undefined;
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: once a live line is routed, the one next
 * move (canon §4.8 flows-out) is to line up LinkedIn air cover for the
 * same account — the inbox is never the opening scene. Absent until the
 * rack can generate (account + contact).
 */
export function toPulling(): PullingData | undefined {
    if (!canGenerate.value) return undefined;
    const r = rack.value;
    const out = currentSendLine.value;
    const account = r.accountName.trim();
    return {
        verb: "Add air cover",
        object: account || "the account",
        href: hrefToLinkedInPlaybook(account),
        reasons: [
            `${out.channel} · ${out.motionBand}`,
            "Public cue first; the inbox is never the opening scene."
        ]
    };
}
