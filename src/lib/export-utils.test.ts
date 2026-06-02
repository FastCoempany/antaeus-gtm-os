import { describe, it, expect } from "vitest";
import { toCsv, isoForFilename, type CsvColumn } from "./export-utils";

interface Row {
    name: string;
    value: number | null;
    note?: string | null;
}

const COLS: ReadonlyArray<CsvColumn<Row>> = [
    { header: "Name", value: (r) => r.name },
    { header: "Value", value: (r) => r.value },
    { header: "Note", value: (r) => r.note ?? "" }
];

describe("toCsv", () => {
    it("emits a header-only file when rows are empty", () => {
        expect(toCsv<Row>([], COLS)).toBe("Name,Value,Note\r\n");
    });

    it("emits one CRLF-terminated line per row + a trailing CRLF", () => {
        const out = toCsv(
            [{ name: "Acme", value: 100, note: "trial" }],
            COLS
        );
        expect(out).toBe("Name,Value,Note\r\nAcme,100,trial\r\n");
    });

    it("renders null and undefined as empty cells", () => {
        const out = toCsv(
            [{ name: "Acme", value: null, note: null }],
            COLS
        );
        expect(out).toContain("Acme,,\r\n");
    });

    it("quotes cells containing commas, quotes, or newlines (RFC-4180)", () => {
        const out = toCsv(
            [
                {
                    name: "Acme, Inc.",
                    value: 0,
                    note: 'said "ok"'
                },
                { name: "BetaCo", value: 1, note: "line1\nline2" }
            ],
            COLS
        );
        expect(out).toContain('"Acme, Inc."');
        expect(out).toContain('"said ""ok"""');
        expect(out).toContain('"line1\nline2"');
    });

    it("preserves numeric zero as '0', not blank", () => {
        const out = toCsv([{ name: "Acme", value: 0, note: "" }], COLS);
        expect(out).toContain("Acme,0,\r\n");
    });
});

describe("isoForFilename", () => {
    it("replaces colons and dots with hyphens", () => {
        const fixed = new Date("2026-06-02T19:30:42.123Z");
        expect(isoForFilename(fixed)).toBe("2026-06-02T19-30-42-123Z");
    });

    it("produces a string safe for filenames (no path separators)", () => {
        const out = isoForFilename(new Date("2026-06-02T19:30:42.000Z"));
        expect(out).not.toMatch(/[/\\:?*<>|]/);
    });
});
