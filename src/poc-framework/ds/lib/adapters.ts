import type { AccentRole } from "@/components";
import type { MoldState, QualitySummary } from "../../lib/quality";
import type { QualityBand } from "../../lib/types";
import { computeQuality } from "../../lib/quality";
import { draft, linkedDeal } from "../../state";
import { hrefToDealWorkspace } from "../../lib/handoff";

/**
 * Pure adapters — map the PoC Framework quality + mold engine onto the
 * design-system tones the DS surface composes. The quality score, the
 * heat ledger, the mold derivation, the ingot read, and the doc
 * generators are untouched. These translate band/mold-state → tone and
 * route the cast proof into the Deal Workspace where it becomes risk
 * the deal can carry.
 */

const BAND_TONE: Record<QualityBand, AccentRole> = {
    ready: "green",
    workable: "amber",
    thin: "red"
};
export function bandTone(band: QualityBand): AccentRole {
    return BAND_TONE[band];
}

const MOLD_TONE: Record<MoldState, AccentRole | undefined> = {
    cast: "green",
    hot: "amber",
    cold: undefined,
    red: "red"
};
export function moldTone(state: MoldState): AccentRole | undefined {
    return MOLD_TONE[state];
}

/** The live quality summary, off the current draft + linked deal. */
export function quality(): QualitySummary {
    return computeQuality(draft.value, linkedDeal.value);
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: the room forges one piece of evidence; once
 * an account is named the one next move is to carry the proof into the
 * deal it backs. Absent until the account mold is filled.
 */
export function toPulling(): PullingData | undefined {
    const d = draft.value;
    if (!d.account.trim()) return undefined;
    const q = quality();
    const linked = linkedDeal.value;
    return {
        verb: "Carry the evidence",
        object: d.account.trim(),
        href: hrefToDealWorkspace(d.account.trim(), linked?.id),
        reasons: [q.title, `${q.weakest.title}: ${q.weakest.copy}`]
            .filter((s) => s && s.length > 0)
            .slice(0, 4)
    };
}
