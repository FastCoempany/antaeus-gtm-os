import { reportError } from "@/lib/observability";
import type { ReadinessSummary } from "@/lib/readiness";
import {
    downloadFile,
    timestampForFilename
} from "@/lib/file-download";

/**
 * Readiness export — JSON snapshot of:
 *   - current verdict + dimension scores + blockers
 *   - cloud-stored verdict history (up to last 200 transitions)
 *
 * Format is intentionally human-readable JSON (2-space indent) so the
 * founder can open the file directly + share it with advisors. The
 * intent matches Founding GTM's "what would a hire inherit" lens —
 * the verdict + history + dimension scores together tell the story of
 * the motion's maturation over time.
 */

export interface ReadinessExportPayload {
    readonly capturedAt: string;
    readonly schemaVersion: number;
    readonly source: "antaeus-readiness-export-v1";
    readonly summary: {
        readonly verdict: string;
        readonly verdictLabel: string;
        readonly totalScore: number;
        readonly nextVerdict: string | null;
        readonly gateBlockers: ReadonlyArray<string>;
        readonly dimensions: ReadonlyArray<{
            readonly id: string;
            readonly label: string;
            readonly score: number;
            readonly evidence: ReadonlyArray<string>;
            readonly gaps: ReadonlyArray<string>;
        }>;
    };
    readonly history: ReadonlyArray<HistoryEntry>;
}

export interface HistoryEntry {
    readonly id: string;
    readonly atIso: string;
    readonly verdict: string;
    readonly direction: string | null;
    readonly from: string | null;
    readonly to: string | null;
}

const SCHEMA_VERSION = 1;

/**
 * Build the export payload from a summary + already-fetched history.
 * Pure — easy to test.
 */
export function buildReadinessExport(
    summary: ReadinessSummary,
    history: ReadonlyArray<HistoryEntry>
): ReadinessExportPayload {
    return {
        capturedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        source: "antaeus-readiness-export-v1",
        summary: {
            verdict: summary.verdict,
            verdictLabel: summary.verdictLabel,
            totalScore: summary.totalScore,
            nextVerdict: summary.nextVerdict,
            gateBlockers: summary.gateBlockers,
            dimensions: summary.dimensions.map((d) => ({
                id: d.id,
                label: d.label,
                score: d.score,
                evidence: d.evidence,
                gaps: d.gaps
            }))
        },
        history
    };
}

interface SnapshotRowShape {
    readonly id: string;
    readonly verdict: string | null;
    readonly created_at: string | null;
    readonly data: unknown;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown): string | null {
    return typeof v === "string" ? v : null;
}

/**
 * Fetch verdict history from cloud and shape into HistoryEntry rows.
 * Returns empty array on any error (export still ships current
 * summary in that case).
 */
export async function loadVerdictHistory(): Promise<ReadonlyArray<HistoryEntry>> {
    try {
        // Lazy-load the data-client so importing this module doesn't
        // pull @supabase/supabase-js into every consumer (in particular
        // the ReadinessDrawer test, which uses happy-dom and trips on
        // the transitive zimmerframe import otherwise).
        const { createDataClient } = await import("@/lib/data-client");
        const client = createDataClient();
        const rows = await client.readinessSnapshots.list({
            orderBy: { column: "created_at", ascending: false },
            limit: 200
        });
        const out: HistoryEntry[] = [];
        for (const row of rows as ReadonlyArray<SnapshotRowShape>) {
            const data = asObject(row.data);
            out.push({
                id: row.id,
                atIso: row.created_at ?? "",
                verdict: row.verdict ?? "",
                direction: data ? asString(data["direction"]) : null,
                from: data ? asString(data["from"]) : null,
                to: data ? asString(data["to"]) : null
            });
        }
        return out;
    } catch (err) {
        reportError(err, { op: "readiness-export.loadVerdictHistory" });
        return [];
    }
}

/**
 * End-to-end: load history, build payload, trigger download. Returns
 * true if the download fired.
 */
export async function exportReadinessJson(
    summary: ReadinessSummary
): Promise<boolean> {
    const history = await loadVerdictHistory();
    const payload = buildReadinessExport(summary, history);
    const content = JSON.stringify(payload, null, 2);
    return downloadFile({
        content,
        filename: `antaeus-readiness-${timestampForFilename()}.json`,
        mimeType: "application/json"
    });
}
