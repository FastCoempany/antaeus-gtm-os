import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database.types";
import type { SavedIcp } from "./types";
import {
    extractDataBlob,
    icpToInsert,
    icpToUpdate,
    looksLikePersistedId,
    rowToIcp,
    rowsToIcps
} from "./icp-bridge";

const FULL: SavedIcp = {
    id: "icp_1730000000_abc",
    statement: "Mid-market legal teams under 200 lawyers needing AI assist.",
    role: "founder",
    industry: "legal",
    size: "mid_market",
    geo: "north_america",
    buyer: "general_counsel",
    pain: "review velocity",
    trigger: "new GC hire",
    proofWindow: "60 days",
    engineActive: 12,
    qualityScore: 78,
    qualityChecks: [
        { tone: "good", text: "Industry sharp." },
        { tone: "warn", text: "Geo could narrow." }
    ],
    createdAt: "2026-04-01T12:00:00Z",
    updatedAt: "2026-04-02T12:00:00Z"
};

describe("looksLikePersistedId", () => {
    it("accepts canonical uuid", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
    });

    it("rejects legacy id", () => {
        expect(looksLikePersistedId("icp_1730000000_abc")).toBe(false);
    });

    it("rejects empty + garbage", () => {
        expect(looksLikePersistedId("")).toBe(false);
        expect(looksLikePersistedId("not-a-uuid")).toBe(false);
    });
});

describe("rowToIcp", () => {
    it("hydrates from a fully populated row", () => {
        const row: Row<"icps"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "user_1",
            workspace_id: "ws_1",
            name: "legal",
            worked: true,
            summary: FULL.statement,
            data: {
                role: "founder",
                industry: "legal",
                size: "mid_market",
                geo: "north_america",
                buyer: "general_counsel",
                pain: "review velocity",
                trigger: "new GC hire",
                proofWindow: "60 days",
                engineActive: 12,
                qualityScore: 78,
                qualityChecks: [
                    { tone: "good", text: "Industry sharp." },
                    { tone: "warn", text: "Geo could narrow." }
                ]
            },
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const icp = rowToIcp(row);
        expect(icp).not.toBeNull();
        expect(icp!.id).toBe("550e8400-e29b-41d4-a716-446655440000");
        expect(icp!.statement).toBe(FULL.statement);
        expect(icp!.industry).toBe("legal");
        expect(icp!.engineActive).toBe(12);
        expect(icp!.qualityChecks).toHaveLength(2);
        expect(icp!.qualityChecks[0]?.tone).toBe("good");
    });

    it("returns null for missing id", () => {
        const row = { id: "", name: "x", data: {} } as unknown as Row<"icps">;
        expect(rowToIcp(row)).toBeNull();
    });

    it("returns null for null/undefined", () => {
        expect(rowToIcp(null)).toBeNull();
        expect(rowToIcp(undefined)).toBeNull();
    });

    it("falls back from summary to data.statement when summary blank", () => {
        const row: Row<"icps"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            name: "legal",
            worked: false,
            summary: null,
            data: { statement: "from-data-blob", industry: "legal" },
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        expect(rowToIcp(row)!.statement).toBe("from-data-blob");
    });

    it("normalizes invalid role to founder", () => {
        const row: Row<"icps"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            name: "legal",
            worked: false,
            summary: "x",
            data: { role: "intern", industry: "legal" },
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        expect(rowToIcp(row)!.role).toBe("founder");
    });

    it("filters malformed quality checks", () => {
        const row: Row<"icps"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            name: "legal",
            worked: false,
            summary: "x",
            data: {
                qualityChecks: [
                    { tone: "good", text: "ok" },
                    { tone: "garbage", text: "fixed" },
                    { text: 42 } as never,
                    null
                ]
            },
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        const icp = rowToIcp(row)!;
        expect(icp.qualityChecks).toHaveLength(2);
        expect(icp.qualityChecks[1]?.tone).toBe("warn");
    });

    it("handles missing timestamps with sensible fallbacks", () => {
        const row: Row<"icps"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            name: "legal",
            worked: false,
            summary: "x",
            data: {},
            created_at: "",
            updated_at: ""
        };
        const icp = rowToIcp(row)!;
        expect(icp.createdAt).toBeTruthy();
        expect(icp.updatedAt).toBeTruthy();
    });
});

describe("rowsToIcps", () => {
    it("filters malformed entries silently", () => {
        const rows = [
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                user_id: "u",
                workspace_id: "w",
                name: "legal",
                worked: false,
                summary: "x",
                data: { industry: "legal" },
                created_at: "2026-04-01T12:00:00Z",
                updated_at: "2026-04-01T12:00:00Z"
            },
            { id: "" } as unknown as Row<"icps">,
            null as unknown as Row<"icps">
        ];
        expect(rowsToIcps(rows as Row<"icps">[])).toHaveLength(1);
    });
});

describe("extractDataBlob", () => {
    it("packs every non-top-level field", () => {
        const blob = extractDataBlob(FULL);
        expect(blob["role"]).toBe("founder");
        expect(blob["industry"]).toBe("legal");
        expect(blob["engineActive"]).toBe(12);
        expect(blob["qualityScore"]).toBe(78);
        expect(Array.isArray(blob["qualityChecks"])).toBe(true);
    });
});

describe("icpToInsert", () => {
    it("uses industry as name when present", () => {
        const insert = icpToInsert(FULL);
        expect(insert.name).toBe("legal");
        expect(insert.worked).toBe(false);
        expect(insert.summary).toBe(FULL.statement);
        expect(typeof insert.data).toBe("object");
    });

    it("falls back to buyer when industry blank", () => {
        const insert = icpToInsert({
            ...FULL,
            industry: "",
            buyer: "general_counsel"
        });
        expect(insert.name).toBe("general_counsel buyer");
    });

    it("falls back to Untitled ICP when both blank", () => {
        const insert = icpToInsert({ ...FULL, industry: "", buyer: "" });
        expect(insert.name).toBe("Untitled ICP");
    });

    it("clears summary when statement is empty", () => {
        const insert = icpToInsert({ ...FULL, statement: "" });
        expect(insert.summary).toBeNull();
    });

    it("does NOT include id (Supabase generates uuid)", () => {
        const insert = icpToInsert(FULL);
        expect((insert as Record<string, unknown>)["id"]).toBeUndefined();
    });
});

describe("icpToUpdate", () => {
    it("packs name + summary + data; omits worked", () => {
        const update = icpToUpdate(FULL);
        expect(update.name).toBe("legal");
        expect(update.summary).toBe(FULL.statement);
        expect(typeof update.data).toBe("object");
        expect((update as Record<string, unknown>)["worked"]).toBeUndefined();
    });

    it("clears summary when statement is empty", () => {
        const update = icpToUpdate({ ...FULL, statement: "" });
        expect(update.summary).toBeNull();
    });
});
