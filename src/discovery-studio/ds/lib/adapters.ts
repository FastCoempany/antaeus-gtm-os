import type { AccentRole } from "@/components";
import type { CompressionMode, NextStepLock } from "../../state";

/**
 * Pure adapters — map the Discovery Studio control face onto the design-
 * system the DS surface composes. The 21 primitives, the 9-framework ×
 * 10-segment spine, and the control face are the unchanged engine; these
 * translate discrete chrome state into the library's tones + options.
 *
 * No clock, no tempo, no "push to the deal" pull (founder direction
 * 2026-06-16): a discovery call is human-driven and unpredictable — the
 * room answers whatever the buyer does, it does not pace the call on a
 * timer or presume the call's outcome. The handoff is outcome-driven
 * (the Post-call routing segment), not a premature pull.
 */

export const COMPRESSION_OPTIONS: ReadonlyArray<{
    key: CompressionMode;
    label: string;
}> = [
    { key: "off", label: "Off" },
    { key: "essentials", label: "Essentials" },
    // Emergency is the rescue state (see SegmentRail + DiscoveryStudioDS):
    // collapse to the segment you're in and bring the recover moves front
    // and center — the panic button when the call goes sideways.
    { key: "emergency", label: "Emergency" }
];

export type DocketStatus = "empty" | "partial" | "locked";

export function docketStatus(lock: NextStepLock): DocketStatus {
    const hasAny =
        lock.date || lock.owner || lock.attendees || lock.purpose || lock.reason;
    if (!hasAny) return "empty";
    if (lock.date && lock.owner && lock.purpose) return "locked";
    return "partial";
}

const DOCKET_TONE: Record<DocketStatus, AccentRole | undefined> = {
    empty: undefined,
    partial: "amber",
    locked: "green"
};
export function docketTone(status: DocketStatus): AccentRole | undefined {
    return DOCKET_TONE[status];
}

const DOCKET_LABEL: Record<DocketStatus, string> = {
    empty: "No lock yet",
    partial: "Partial",
    locked: "Locked"
};
export function docketLabel(status: DocketStatus): string {
    return DOCKET_LABEL[status];
}
