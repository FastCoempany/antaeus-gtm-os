import type { AccentRole } from "@/components";
import { t } from "@/lib/voice/t";
import type { LeverageKey, ProspectStage, QualityBand } from "../../lib/types";
import { computeLoomRead, type LoomRead, type LoomReadBand } from "../../lib/loom-read";
import { prospects, stats } from "../../state";
import { hrefToSignalConsole } from "../../lib/handoff";

/**
 * Pure adapters — map the Sourcing Workbench read + quality engine onto
 * the design-system components the DS surface composes. The engine is
 * untouched (the "loom read" name stays a code identifier; the surface
 * label is rewritten). These translate the read into the bench top, the
 * stages + quality into tone, and a ready prospect into the Wayfinder
 * pulling cell (the push into Signal Console).
 */

/**
 * The edge a prospect gives you in — plain labels for the surface (the
 * engine's own LEVERAGE_LABELS carry the banned word "leverage"; the
 * code keys stay, the operator-facing labels are rewritten).
 */
export const EDGE_LABELS: Record<LeverageKey, string> = {
    "network-connection": t("Network intro"),
    "existing-proof-point": t("Proof point"),
    "market-signal": t("Live signal"),
    "geographic-advantage": t("Local advantage"),
    cold: t("Cold entry")
};

/** Workbench read band → the readout's tone. */
const BAND_TONE: Record<LoomReadBand, AccentRole | undefined> = {
    shipping: "green",
    working: "blue",
    loose: "amber",
    empty: undefined
};
export function bandTone(band: LoomReadBand): AccentRole | undefined {
    return BAND_TONE[band];
}

/** Prospect stage → the card's tone. Ready is the goal (green); dropped
 *  is the dead end (red); the middle stages warm/cool by progress. */
const STAGE_TONE: Record<ProspectStage, AccentRole | undefined> = {
    captured: "amber",
    researched: "blue",
    ready: "green",
    pushed: undefined,
    dropped: "red"
};
export function stageTone(stage: ProspectStage): AccentRole | undefined {
    return STAGE_TONE[stage];
}

/** A prospect's quality band → tone. */
const QUALITY_TONE: Record<QualityBand, AccentRole> = {
    ready: "green",
    researched: "blue",
    captured: "amber"
};
export function qualityTone(band: QualityBand): AccentRole {
    return QUALITY_TONE[band];
}

/** The live workbench read, computed from the current signals. */
export function workbenchRead(): LoomRead {
    return computeLoomRead({ prospects: prospects.value, stats: stats.value });
}

export interface PullingData {
    readonly verb: string;
    readonly object: string;
    readonly href: string;
    readonly reasons: ReadonlyArray<string>;
}

/**
 * The Wayfinder pulling cell: once a prospect is ready, the one next
 * move is to push the cleanest one into Signal Console (the flows-out:
 * qualified accounts only). Absent while nothing is ready — the work
 * stays in-room, researching captured names forward.
 */
export function toPulling(focusObject: string): PullingData | undefined {
    const read = workbenchRead();
    const ready = prospects.value.find((p) => p.stage === "ready");
    if (!ready) return undefined;
    const object = ready.accountName.trim() || focusObject.trim() || "the prospect";
    return {
        verb: "Push to Signal",
        object,
        href: hrefToSignalConsole({ account: ready.accountName || undefined }),
        reasons: [read.operatorMove, read.weekRead].slice(0, 4)
    };
}
