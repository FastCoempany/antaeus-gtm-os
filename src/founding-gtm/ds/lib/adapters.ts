import type { AccentRole } from "@/components";
import type { SectionStatus, SurpriseCallout } from "../../lib/types";
import { authoredSections } from "../../state";
import { countReady } from "../../lib/sections";

/**
 * Pure adapters — map the Founding GTM section engine onto the design-
 * system tones the DS surface composes. The seven authoring engines, the
 * cross-room readers, the health publisher, and the ceremony subscriber
 * are untouched. These translate the per-section status + the surprise
 * tone, and route the kit-reader into the daily rhythm on the Dashboard.
 */

const STATUS_TONE: Record<SectionStatus, AccentRole | undefined> = {
    ready: "green",
    partial: "amber",
    empty: undefined
};
export function statusTone(status: SectionStatus): AccentRole | undefined {
    return STATUS_TONE[status];
}

const SURPRISE_TONE: Record<SurpriseCallout["tone"], AccentRole> = {
    corrective: "amber",
    affirming: "green",
    neutral: "blue"
};
export function surpriseTone(tone: SurpriseCallout["tone"]): AccentRole {
    return SURPRISE_TONE[tone];
}

/** The live section-readiness counts off the authored sections. */
export function sectionCounts(): { ready: number; partial: number; empty: number } {
    return countReady(authoredSections.value);
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the kit is read-mode here; real updates
 * come from the working rooms, and the first hire's day starts on the
 * Dashboard. Absent until at least one section is ready.
 */
export function toPulling(): PullingData | undefined {
    const counts = sectionCounts();
    if (counts.ready === 0) return undefined;
    return {
        verb: "Open the dashboard",
        object: "the daily rhythm",
        href: "/dashboard/",
        reasons: [
            `${counts.ready} of 7 sections ready to hand off`,
            "The kit is read-mode — updates come from the rooms"
        ]
    };
}
