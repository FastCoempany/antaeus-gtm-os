import type { Deal } from "./deal-shape";
import { STAGE_LABELS } from "./deal-shape";
import {
    buildCsv,
    downloadFile,
    timestampForFilename
} from "@/lib/file-download";

/**
 * Build a CSV string from the workspace's deals.
 *
 * Columns kept stable + human-readable. Each deal is one row.
 * Stakeholders + stage history get flattened into pipe-separated
 * strings so a downstream spreadsheet doesn't get extra rows.
 */
export function buildDealsCsv(deals: ReadonlyArray<Deal>): string {
    const headers = [
        "Account",
        "Stage",
        "Value (USD)",
        "Close date",
        "Next step",
        "Next step date",
        "Forecast",
        "Momentum",
        "Champion",
        "Economic buyer",
        "Use case",
        "Pain",
        "Competition",
        "Decision process",
        "Notes",
        "Stakeholders",
        "Loss reason",
        "Loss notes",
        "Created at",
        "Updated at"
    ];

    const rows = deals.map((d) => [
        d.accountName,
        STAGE_LABELS[d.stage] ?? d.stage,
        d.value ?? 0,
        d.closeDate ?? "",
        d.nextStep ?? "",
        d.nextStepDate ?? "",
        d.forecastCategory ?? "",
        d.momentum ?? "",
        d.champion ?? "",
        d.economicBuyer ?? "",
        d.useCase ?? "",
        d.pain ?? "",
        d.competition ?? "",
        d.decisionProcess ?? "",
        d.notes ?? "",
        (d.stakeholders ?? [])
            .map((s) => `${s.name}${s.role ? ` (${s.role})` : ""}${s.engaged ? " ✓" : ""}`)
            .join(" | "),
        d.lossReason ?? "",
        d.lossNotes ?? "",
        d.created_at ?? "",
        d.updated_at ?? ""
    ]);

    return buildCsv(headers, rows);
}

export function exportDealsCsv(deals: ReadonlyArray<Deal>): boolean {
    const csv = buildDealsCsv(deals);
    return downloadFile({
        content: csv,
        filename: `antaeus-deals-${timestampForFilename()}.csv`,
        mimeType: "text/csv"
    });
}
