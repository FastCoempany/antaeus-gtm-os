/**
 * File formats for Settings "Download my workspace".
 *
 * Both formats are organized the same way the app is: by plain-English
 * section ("Deals", "Accounts and signals", "Pilots", …), not by raw
 * database table.
 *
 *   json         — one file. `sections` keyed by section name, each
 *                  holding its tables (label, row count, rows), plus a
 *                  `manifest` listing every table. This is the file
 *                  Restore reads back.
 *   spreadsheets — one .zip. A "Contents" sheet listing every part and
 *                  its row count, then one CSV per part filed in a
 *                  folder per section, with readable column headers.
 *                  For reading and sharing; Restore doesn't take it.
 */
import { toCsv, type CsvColumn } from "@/lib/export-utils";
import { createZip, type ZipEntry } from "@/lib/zip-store";
import type { CloudExportSnapshot, ExportedTable } from "./cloud-sync";

export type WorkspaceExportFormat = "json" | "spreadsheets";

export const EXPORT_FORMATS: ReadonlyArray<{
    readonly value: WorkspaceExportFormat;
    readonly label: string;
}> = [
    { value: "json", label: "One file you can restore later (JSON)" },
    { value: "spreadsheets", label: "Spreadsheets, one per part (CSV files in a .zip)" }
];

export interface ExportFile {
    readonly filename: string;
    readonly mimeType: string;
    readonly body: string | Uint8Array;
}

function stamp(iso: string): string {
    return iso.replace(/[:.]/g, "-");
}

/** Safe file/folder name: keeps letters, digits, spaces, dashes. */
export function fileSafe(name: string): string {
    return (
        name
            .replace(/[\\/:*?"<>|]+/g, " ")
            .replace(/[^\p{L}\p{N} \-&,()']+/gu, "")
            .replace(/\s+/g, " ")
            .trim() || "part"
    );
}

const ACRONYMS: Readonly<Record<string, string>> = {
    id: "ID",
    icp: "ICP",
    url: "URL",
    usd: "USD",
    llm: "LLM",
    ics: "ICS",
    uid: "UID",
    eb: "EB",
    acv: "ACV"
};

/** "created_at" → "Created at", "workspace_id" → "Workspace ID". */
export function readableHeader(column: string): string {
    const words = column.split(/_+/).filter(Boolean);
    if (words.length === 0) return column;
    return words
        .map((w, i) => {
            const lower = w.toLowerCase();
            if (ACRONYMS[lower]) return ACRONYMS[lower];
            return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
        })
        .join(" ");
}

function cellValue(v: unknown): string | number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? "yes" : "no";
    if (typeof v === "string") return v;
    return JSON.stringify(v);
}

/** Every column that appears in any row, in first-seen order, id first. */
function columnsOf(rows: ReadonlyArray<Record<string, unknown>>): string[] {
    const seen: string[] = [];
    for (const row of rows) {
        for (const key of Object.keys(row)) {
            if (!seen.includes(key)) seen.push(key);
        }
    }
    const idIdx = seen.indexOf("id");
    if (idIdx > 0) {
        seen.splice(idIdx, 1);
        seen.unshift("id");
    }
    return seen;
}

export function tableToCsv(table: ExportedTable): string {
    const cols = columnsOf(table.rows);
    if (cols.length === 0) {
        return toCsv<Record<string, unknown>>([], [
            { header: "No records", value: () => null }
        ]);
    }
    const columns: CsvColumn<Record<string, unknown>>[] = cols.map((c) => ({
        header: readableHeader(c),
        value: (row) => cellValue(row[c])
    }));
    return toCsv(table.rows, columns);
}

function contentsCsv(snapshot: CloudExportSnapshot, paths: Map<string, string>): string {
    return toCsv(snapshot.manifest, [
        { header: "Part of the app", value: (m) => m.section },
        { header: "What it holds", value: (m) => m.label },
        { header: "Records", value: (m) => m.rowCount },
        { header: "File", value: (m) => paths.get(m.table) ?? "" },
        {
            header: "Note",
            value: (m) =>
                m.error ? `Couldn't read this part: ${m.error}` : m.rowCount === 0 ? "Empty" : ""
        }
    ]);
}

function readme(snapshot: CloudExportSnapshot): string {
    const lines = [
        "Antaeus — your workspace",
        "",
        `Workspace: ${snapshot.workspaceName ?? "(unnamed)"}`,
        `Downloaded: ${snapshot.capturedAt}`,
        `Records: ${snapshot.totalRows}`,
        "",
        "Start with \"00 Contents.csv\". It lists every part of the workspace,",
        "how many records each holds, and which file it's in. Each folder is",
        "one part of the app. Empty parts are listed but have no file.",
        "",
        "To put this workspace back later, download the JSON file instead —",
        "Restore reads that one, not these spreadsheets.",
        "",
        "Not in this download:",
        ...snapshot.notIncluded.map((n) => `  - ${n}`)
    ];
    if (snapshot.errors.length > 0) {
        lines.push("", "Parts that couldn't be read:");
        for (const e of snapshot.errors) lines.push(`  - ${e.table}: ${e.reason}`);
    }
    return lines.join("\r\n") + "\r\n";
}

export function buildSpreadsheetZip(snapshot: CloudExportSnapshot): Uint8Array {
    const entries: ZipEntry[] = [];
    const paths = new Map<string, string>();
    const sectionNames = Object.keys(snapshot.sections);
    sectionNames.forEach((name, i) => {
        const section = snapshot.sections[name]!;
        const folder = `${String(i + 1).padStart(2, "0")} ${fileSafe(name)}`;
        for (const t of section.tables) {
            if (t.rowCount === 0) continue;
            const path = `${folder}/${fileSafe(t.label)}.csv`;
            paths.set(t.table, path);
            // BOM so Excel reads UTF-8 correctly.
            entries.push({ name: path, data: "﻿" + tableToCsv(t) });
        }
    });
    entries.unshift(
        { name: "README.txt", data: readme(snapshot) },
        { name: "00 Contents.csv", data: "﻿" + contentsCsv(snapshot, paths) }
    );
    return createZip(entries, new Date(snapshot.capturedAt));
}

export function buildExportFile(
    snapshot: CloudExportSnapshot,
    format: WorkspaceExportFormat
): ExportFile {
    const base = `antaeus-workspace-${stamp(snapshot.capturedAt)}`;
    if (format === "spreadsheets") {
        return {
            filename: `${base}-spreadsheets.zip`,
            mimeType: "application/zip",
            body: buildSpreadsheetZip(snapshot)
        };
    }
    return {
        filename: `${base}.json`,
        mimeType: "application/json",
        body: JSON.stringify(snapshot, null, 2)
    };
}
