import { describe, expect, it } from "vitest";
import { crc32 } from "@/lib/zip-store";
import type { CloudExportSnapshot } from "./cloud-sync";
import {
    buildExportFile,
    buildSpreadsheetZip,
    fileSafe,
    readableHeader,
    tableToCsv
} from "./workspace-export-formats";

const snapshot: CloudExportSnapshot = {
    schemaVersion: 2,
    source: "antaeus-workspace-export-v2",
    capturedAt: "2026-11-05T12:00:00.000Z",
    workspaceId: "ws-1",
    workspaceName: "Acme",
    userEmail: "t@t.com",
    sections: {
        Deals: {
            name: "Deals",
            rowCount: 2,
            tables: [
                {
                    table: "deals",
                    label: "Deals",
                    rowCount: 2,
                    rows: [
                        { workspace_id: "ws-1", id: "d1", account_name: "Northwind, Inc.", data: { stage: "pilot" }, is_won: true },
                        { id: "d2", account_name: "Apex", value_usd: 64000 }
                    ],
                    error: null
                }
            ]
        },
        "Things the system noticed": {
            name: "Things the system noticed",
            rowCount: 0,
            tables: [
                { table: "observations", label: "Observations about your work", rowCount: 0, rows: [], error: "boom" }
            ]
        }
    },
    manifest: [
        { section: "Deals", label: "Deals", table: "deals", rowCount: 2, error: null },
        { section: "Things the system noticed", label: "Observations about your work", table: "observations", rowCount: 0, error: "boom" }
    ],
    notIncluded: ["Your sign-in and password"],
    perTableCount: { deals: 2, observations: 0 },
    errors: [{ table: "observations", reason: "boom" }],
    totalRows: 2
};

/** Read the file names out of a store-only zip's central directory. */
function zipNames(zip: Uint8Array): string[] {
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const endAt = zip.length - 22;
    expect(view.getUint32(endAt, true)).toBe(0x06054b50);
    const count = view.getUint16(endAt + 10, true);
    let p = view.getUint32(endAt + 16, true);
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
        expect(view.getUint32(p, true)).toBe(0x02014b50);
        const len = view.getUint16(p + 28, true);
        names.push(new TextDecoder().decode(zip.subarray(p + 46, p + 46 + len)));
        p += 46 + len;
    }
    return names;
}

function zipFile(zip: Uint8Array, name: string): string {
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    let p = 0;
    while (view.getUint32(p, true) === 0x04034b50) {
        const size = view.getUint32(p + 18, true);
        const nameLen = view.getUint16(p + 26, true);
        const n = new TextDecoder().decode(zip.subarray(p + 30, p + 30 + nameLen));
        const data = zip.subarray(p + 30 + nameLen, p + 30 + nameLen + size);
        expect(view.getUint32(p + 14, true)).toBe(crc32(data));
        if (n === name) return new TextDecoder().decode(data);
        p += 30 + nameLen + size;
    }
    throw new Error(`no ${name}`);
}

describe("workspace download formats", () => {
    it("crc32 matches the standard check value", () => {
        expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    });

    it("readable headers", () => {
        expect(readableHeader("created_at")).toBe("Created at");
        expect(readableHeader("workspace_id")).toBe("Workspace ID");
        expect(readableHeader("icp_id")).toBe("ICP ID");
        expect(fileSafe("Readiness and the handoff")).toBe("Readiness and the handoff");
        expect(fileSafe("a/b:c")).toBe("a b c");
    });

    it("CSV puts id first, flattens objects, quotes commas, says yes/no", () => {
        const csv = tableToCsv(snapshot.sections["Deals"]!.tables[0]!);
        const [header, row1, row2] = csv.trim().split("\r\n");
        expect(header).toBe("ID,Workspace ID,Account name,Data,Is won,Value USD");
        expect(row1).toBe('d1,ws-1,"Northwind, Inc.","{""stage"":""pilot""}",yes,');
        expect(row2).toBe("d2,,Apex,,,64000");
    });

    it("JSON is the sectioned snapshot", () => {
        const file = buildExportFile(snapshot, "json");
        expect(file.filename).toBe("antaeus-workspace-2026-11-05T12-00-00-000Z.json");
        const parsed = JSON.parse(file.body as string);
        expect(Object.keys(parsed.sections)).toEqual(["Deals", "Things the system noticed"]);
        expect(parsed.manifest).toHaveLength(2);
    });

    it("spreadsheets zip: readme, contents, one CSV per non-empty part in a folder per section", () => {
        const file = buildExportFile(snapshot, "spreadsheets");
        expect(file.filename.endsWith("-spreadsheets.zip")).toBe(true);
        const zip = buildSpreadsheetZip(snapshot);
        expect(zipNames(zip)).toEqual(["README.txt", "00 Contents.csv", "01 Deals/Deals.csv"]);
        const contents = zipFile(zip, "00 Contents.csv");
        expect(contents).toContain("Deals,Deals,2,01 Deals/Deals.csv,");
        expect(contents).toContain("Couldn't read this part: boom");
        expect(zipFile(zip, "README.txt")).toContain("Workspace: Acme");
        expect(zipFile(zip, "01 Deals/Deals.csv")).toContain("Northwind");
    });
});
