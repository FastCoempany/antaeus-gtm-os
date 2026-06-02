/**
 * Shared CSV/JSON export utility (Feb 2026 hygiene Phase 3 / 2026-06-02).
 *
 * Used by the per-room exporters (Deal Workspace CSV, Readiness JSON,
 * Dashboard ranked-commands CSV). Centralises the boring parts —
 * RFC-4180 quoting, file-download trigger, ISO-timestamp filenames —
 * so each room only writes its own row-shape mapping.
 *
 * Does NOT require a Supabase client: callers pass the rows in.
 * Defensive: empty input still produces a header-only file rather than
 * failing silently.
 */

export interface CsvColumn<Row> {
    readonly header: string;
    readonly value: (row: Row) => string | number | null | undefined;
}

/**
 * Render an array of typed rows into an RFC-4180 CSV string. Header
 * row is always emitted. Each cell is quoted only when it contains a
 * comma, quote, or newline; quotes are doubled per spec.
 */
export function toCsv<Row>(
    rows: ReadonlyArray<Row>,
    columns: ReadonlyArray<CsvColumn<Row>>
): string {
    const lines: string[] = [];
    lines.push(columns.map((c) => quote(c.header)).join(","));
    for (const row of rows) {
        const cells = columns.map((c) => {
            const v = c.value(row);
            if (v === null || v === undefined) return "";
            return quote(String(v));
        });
        lines.push(cells.join(","));
    }
    // RFC-4180: CRLF between lines, trailing CRLF.
    return lines.join("\r\n") + "\r\n";
}

function quote(value: string): string {
    if (/[",\r\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Trigger a file download in the browser. Skips silently when called
 * outside a DOM (tests, SSR). Returns true when a download was
 * triggered.
 */
export function downloadBlob(
    body: string,
    opts: { readonly filename: string; readonly mimeType?: string }
): boolean {
    if (typeof document === "undefined" || typeof URL === "undefined") {
        return false;
    }
    try {
        const blob = new Blob([body], {
            type: opts.mimeType ?? "text/csv;charset=utf-8"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = opts.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (err) {
        console.error("[export-utils] download failed", err);
        return false;
    }
}

/**
 * Build an ISO timestamp safe to embed in a filename — replaces `:` +
 * `.` with `-`. Example: 2026-06-02T18-30-00-000Z.
 */
export function isoForFilename(date: Date = new Date()): string {
    return date.toISOString().replace(/[:.]/g, "-");
}
