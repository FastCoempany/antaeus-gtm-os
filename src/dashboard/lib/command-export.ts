import type { CommandContextSummary } from "./types";
import {
    downloadFile,
    timestampForFilename
} from "@/lib/file-download";

/**
 * Command Center export — JSON snapshot of the ranked-objects state
 * the Dashboard's command-intelligence rail produced for this session.
 *
 * Per the post-beta backlog: "Command Center export (Dashboard's
 * ranked-objects snapshot) — owed."
 *
 * Shape captures both the ranked list (top-N spotlight + queue) and
 * the per-family slices so a reader can reconstruct what the operator
 * was looking at on a given day. Useful as a handoff artifact: "this
 * is what the system surfaced as the highest-pressure work the morning
 * I wrote up this brief."
 */

export interface CommandCenterExportPayload {
    readonly capturedAt: string;
    readonly schemaVersion: number;
    readonly source: "antaeus-command-center-export-v1";
    readonly mode: string | null;
    readonly ranked: ReadonlyArray<RankedObjectShape>;
    readonly spotlight: RankedObjectShape | null;
    readonly queue: ReadonlyArray<RankedObjectShape>;
    readonly riskCards: ReadonlyArray<RankedObjectShape>;
    readonly moveCards: ReadonlyArray<RankedObjectShape>;
    readonly systemCards: ReadonlyArray<RankedObjectShape>;
}

export interface RankedObjectShape {
    readonly id: string;
    readonly family: string;
    readonly title: string;
    readonly score: number;
    readonly reasons: ReadonlyArray<string>;
    readonly rankingConfidence: number;
    readonly rankingConfidenceLabel: string;
}

const SCHEMA_VERSION = 1;

interface CommandObjectLike {
    readonly id: string;
    readonly commandFamily: string;
    readonly title: string;
    readonly score: number;
    readonly scoreReasons: ReadonlyArray<string>;
    readonly rankingConfidence: number;
    readonly rankingConfidenceLabel: string;
}

function shapeObject(o: CommandObjectLike): RankedObjectShape {
    return {
        id: o.id,
        family: o.commandFamily,
        title: o.title,
        score: o.score,
        reasons: o.scoreReasons,
        rankingConfidence: o.rankingConfidence,
        rankingConfidenceLabel: o.rankingConfidenceLabel
    };
}

export function buildCommandExport(
    summary: CommandContextSummary,
    mode: string | null
): CommandCenterExportPayload {
    return {
        capturedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        source: "antaeus-command-center-export-v1",
        mode,
        ranked: summary.ranked.map(shapeObject),
        spotlight: summary.spotlight ? shapeObject(summary.spotlight) : null,
        queue: summary.queue.map(shapeObject),
        riskCards: summary.riskCards.map(shapeObject),
        moveCards: summary.moveCards.map(shapeObject),
        systemCards: summary.systemCards.map(shapeObject)
    };
}

export function exportCommandCenterJson(
    summary: CommandContextSummary,
    mode: string | null
): boolean {
    const payload = buildCommandExport(summary, mode);
    const content = JSON.stringify(payload, null, 2);
    return downloadFile({
        content,
        filename: `antaeus-command-center-${timestampForFilename()}.json`,
        mimeType: "application/json"
    });
}
