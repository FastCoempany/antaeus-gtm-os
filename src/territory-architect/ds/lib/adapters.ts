import type { AccentRole } from "@/components";
import type { AllocationReadout, TierId } from "../../lib/types";
import {
    computeFieldRead,
    type FieldRead,
    type FieldReadBand
} from "../../lib/field-read";
import { accounts, allocation, approaches, focuses } from "../../state";
import { hrefToSourcingWorkbench } from "../../lib/handoff";

/**
 * Pure adapters — map the Territory Architect field-read + allocation
 * engine onto the design-system components the DS surface composes. The
 * engine is untouched; these translate the field read into the bench
 * top, the tiers + allocation into tone, and the runnable territory into
 * the Wayfinder pulling cell (the move onward into sourcing).
 */

/** Field-read band → the readout's tone. */
const BAND_TONE: Record<FieldReadBand, AccentRole | undefined> = {
    runnable: "green",
    tight: "blue",
    loose: "amber",
    empty: undefined
};

export function bandTone(band: FieldReadBand): AccentRole | undefined {
    return BAND_TONE[band];
}

/** Tier → tone. Tier 1 is the must-win commitment; the watch tier is neutral. */
const TIER_TONE: Record<TierId, AccentRole | undefined> = {
    t1: "red",
    t2: "amber",
    t3: "blue",
    t4: undefined
};

export function tierTone(tier: TierId): AccentRole | undefined {
    return TIER_TONE[tier];
}

/** 300-cap status → tone: headroom is healthy, at-cap caution, over is real. */
export function allocTone(status: AllocationReadout["status"]): AccentRole {
    if (status === "over") return "red";
    if (status === "at-cap") return "amber";
    return "green";
}

/** The live field read, computed from the current signals. */
export function fieldRead(): FieldRead {
    return computeFieldRead({
        accounts: accounts.value,
        focuses: focuses.value,
        approaches: approaches.value,
        allocation: allocation.value
    });
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: once the territory has focuses + accounts
 * in the field, the one next move is to push it into sourcing — find the
 * named prospects. Absent while the map is still theoretical (no focuses
 * or no accounts); then the work stays in-room and the field read's
 * operator move is the prompt.
 */
export function toPulling(focusObject: string): PullingData | undefined {
    const read = fieldRead();
    if (focuses.value.length === 0 || allocation.value.total === 0) {
        return undefined;
    }
    const topFocus = focuses.value[0];
    const object = focusObject.trim() || topFocus?.segment.trim() || topFocus?.title.trim() || "";
    return {
        verb: "Source prospects",
        object: object || "the territory",
        href: hrefToSourcingWorkbench(object || undefined),
        reasons: [read.operatorMove, read.mainRisk].slice(0, 4)
    };
}
