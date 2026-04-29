import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database.types";
import type { AgendaSnapshot } from "./types";
import {
    extractDataBlob,
    LOG_TYPE_DISCOVERY_AGENDA,
    rowToSnapshot,
    rowsToSnapshots,
    snapshotToInsert
} from "./planner-bridge";

const FULL: AgendaSnapshot = {
    contact: "Jane",
    company: "Acme",
    persona: "vp",
    linkedDeal: "deal_1",
    gates: [true, true, false, true, false],
    gateDetails: [
        { label: "Person", met: true, copy: "Jane bound." },
        { label: "Persona", met: true, copy: "Persona set." },
        { label: "Context", met: false, copy: "No signal." },
        { label: "Why now", met: true, copy: "Trigger present." },
        { label: "Advancement", met: false, copy: "No ask." }
    ],
    score: 65,
    band: "workable",
    nextMove: "Lock the advance ask.",
    signalHeadline: "Acme raised Series B.",
    customNotes: "Mind procurement.",
    linkedinUrl: "https://linkedin.com/in/jane",
    preparedAt: "2026-04-02T12:00:00Z"
};

describe("rowToSnapshot", () => {
    it("hydrates a populated row", () => {
        const row: Row<"discovery_call_logs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            log_type: "discovery-agenda",
            summary: "Acme · Jane · vp · workable",
            data: extractDataBlob(FULL) as never,
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const snap = rowToSnapshot(row);
        expect(snap).not.toBeNull();
        expect(snap!.contact).toBe("Jane");
        expect(snap!.company).toBe("Acme");
        expect(snap!.persona).toBe("vp");
        expect(snap!.gates).toHaveLength(5);
        expect(snap!.gateDetails[0]?.label).toBe("Person");
    });

    it("returns null for non-discovery-agenda log_type", () => {
        const row: Row<"discovery_call_logs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            log_type: "cold-call",
            summary: null,
            data: {},
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToSnapshot(row)).toBeNull();
    });

    it("returns null for missing id / null", () => {
        expect(
            rowToSnapshot({
                id: ""
            } as unknown as Row<"discovery_call_logs">)
        ).toBeNull();
        expect(rowToSnapshot(null)).toBeNull();
    });

    it("normalizes invalid persona to cxo", () => {
        const row: Row<"discovery_call_logs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            log_type: "discovery-agenda",
            summary: null,
            data: { persona: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToSnapshot(row)!.persona).toBe("cxo");
    });

    it("falls back preparedAt to created_at when blob blank", () => {
        const row: Row<"discovery_call_logs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            log_type: "discovery-agenda",
            summary: null,
            data: {},
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToSnapshot(row)!.preparedAt).toBe("2026-04-02T12:00:00Z");
    });
});

describe("rowsToSnapshots", () => {
    it("filters non-discovery-agenda rows", () => {
        const rows = [
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                user_id: "u",
                workspace_id: "w",
                log_type: "discovery-agenda",
                summary: null,
                data: {},
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440001",
                user_id: "u",
                workspace_id: "w",
                log_type: "cold-call",
                summary: null,
                data: {},
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            }
        ];
        expect(
            rowsToSnapshots(rows as Row<"discovery_call_logs">[])
        ).toHaveLength(1);
    });
});

describe("extractDataBlob", () => {
    it("packs every field", () => {
        const blob = extractDataBlob(FULL);
        expect(blob["company"]).toBe("Acme");
        expect(blob["score"]).toBe(65);
        expect(Array.isArray(blob["gates"])).toBe(true);
        expect(Array.isArray(blob["gateDetails"])).toBe(true);
    });
});

describe("snapshotToInsert", () => {
    it("packs log_type=discovery-agenda + summary + data", () => {
        const insert = snapshotToInsert(FULL);
        expect(insert.log_type).toBe(LOG_TYPE_DISCOVERY_AGENDA);
        expect(insert.summary).toBe("Acme · Jane · vp · workable");
        expect(typeof insert.data).toBe("object");
    });

    it("omits contact when blank", () => {
        const insert = snapshotToInsert({ ...FULL, contact: "" });
        expect(insert.summary).toBe("Acme · vp · workable");
    });

    it("falls back company to Unknown", () => {
        const insert = snapshotToInsert({ ...FULL, company: "" });
        expect(insert.summary).toBe("Unknown · Jane · vp · workable");
    });

    it("falls back band to thin when blank", () => {
        const insert = snapshotToInsert({ ...FULL, band: "" });
        expect(insert.summary).toBe("Acme · Jane · vp · thin");
    });
});
