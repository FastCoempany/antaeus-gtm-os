/**
 * Trigger a browser file download from in-memory content.
 *
 * Shared by Settings (JSON backup), Deal Workspace (CSV export),
 * Readiness Score (JSON export), and Dashboard (Command Center
 * snapshot export). Keeps the blob/anchor dance in one place.
 *
 * Returns true if the download fired; false in non-DOM environments
 * (SSR, tests) so callers can branch on success when needed.
 */
export interface DownloadOptions {
    readonly content: string;
    readonly filename: string;
    /** Defaults to "text/plain". JSON: "application/json". CSV: "text/csv". */
    readonly mimeType?: string;
}

export function downloadFile(opts: DownloadOptions): boolean {
    if (typeof document === "undefined") return false;
    const blob = new Blob([opts.content], {
        type: opts.mimeType ?? "text/plain"
    });
    const url = URL.createObjectURL(blob);
    try {
        const a = document.createElement("a");
        a.href = url;
        a.download = opts.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
    } finally {
        URL.revokeObjectURL(url);
    }
}

/**
 * Format a date for a filename. Uses local timezone; replaces unsafe
 * characters so the filename works on every OS.
 */
export function timestampForFilename(date: Date = new Date()): string {
    return date.toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
}

/**
 * Escape a single CSV cell. Wraps in double quotes if the value
 * contains a comma, quote, newline, or leading/trailing whitespace.
 * Doubles internal quotes per RFC 4180.
 */
export function csvEscape(value: unknown): string {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (
        s.includes(",") ||
        s.includes("\"") ||
        s.includes("\n") ||
        s.includes("\r") ||
        s !== s.trim()
    ) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

/**
 * Build a CSV string from a header row + body rows. Each cell is
 * coerced via csvEscape, so the caller doesn't have to worry about
 * quoting.
 */
export function buildCsv(
    headers: ReadonlyArray<string>,
    rows: ReadonlyArray<ReadonlyArray<unknown>>
): string {
    const lines: string[] = [];
    lines.push(headers.map((h) => csvEscape(h)).join(","));
    for (const row of rows) {
        lines.push(row.map((cell) => csvEscape(cell)).join(","));
    }
    return lines.join("\n") + "\n";
}
