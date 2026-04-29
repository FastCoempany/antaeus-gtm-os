import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database.types";
import type { CallLogEntry } from "./types";
import {
    callEntryToInsert,
    callEntryToUpdate,
    extractDataBlob,
    LOG_TYPE_COLD_CALL,
    looksLikePersistedId,
    rowToCallEntry,
    rowsToCallEntries
} from "./coldcall-bridge";

const FULL: CallLogEntry = {
    id: "call_1730000000_abc",
    accountName: "Acme",
    contactName: "Jane",
    contactTitle: "VP Eng",
    threadId: "opener",
    threadTitle: "Opening thread",
    buyerResponse: "What's this about?",
    recommendedResponse: "I'll be quick — three buckets.",
    outcome: "meeting_booked",
    notes: "Strong fit.",
    source: "cold-call-studio-talk-loom",
    createdAt: "2026-04-02T12:00:00Z"
};

describe("looksLikePersistedId", () => {
    it("uuid yes legacy no", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
        expect(looksLikePersistedId("call_1730_x")).toBe(false);
    });
});

describe("rowToCallEntry", () => {
    it("hydrates a populated row", () => {
        const row: Row<"discovery_call_logs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            log_type: "cold-call",
            summary: "Acme · meeting_booked",
            data: {
                accountName: "Acme",
                contactName: "Jane",
                contactTitle: "VP Eng",
                threadId: "opener",
                threadTitle: "Opening thread",
                buyerResponse: "What's this about?",
                recommendedResponse: "I'll be quick — three buckets.",
                outcome: "meeting_booked",
                notes: "Strong fit.",
                source: "cold-call-studio-talk-loom"
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const entry = rowToCallEntry(row);
        expect(entry).not.toBeNull();
        expect(entry!.accountName).toBe("Acme");
        expect(entry!.threadId).toBe("opener");
        expect(entry!.outcome).toBe("meeting_booked");
    });

    it("returns null for non-cold-call log_type", () => {
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
        expect(rowToCallEntry(row)).toBeNull();
    });

    it("returns null on missing id / null", () => {
        expect(
            rowToCallEntry({
                id: ""
            } as unknown as Row<"discovery_call_logs">)
        ).toBeNull();
        expect(rowToCallEntry(null)).toBeNull();
    });

    it("normalizes invalid threadId to prep", () => {
        const row: Row<"discovery_call_logs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            log_type: "cold-call",
            summary: null,
            data: { threadId: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToCallEntry(row)!.threadId).toBe("prep");
    });

    it("normalizes invalid outcome to logged", () => {
        const row: Row<"discovery_call_logs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            log_type: "cold-call",
            summary: null,
            data: { outcome: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToCallEntry(row)!.outcome).toBe("logged");
    });
});

describe("rowsToCallEntries", () => {
    it("filters non-cold-call + malformed", () => {
        const rows = [
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                user_id: "u",
                workspace_id: "w",
                log_type: "cold-call",
                summary: null,
                data: {},
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440001",
                user_id: "u",
                workspace_id: "w",
                log_type: "discovery-agenda",
                summary: null,
                data: {},
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            }
        ];
        expect(
            rowsToCallEntries(rows as Row<"discovery_call_logs">[])
        ).toHaveLength(1);
    });
});

describe("extractDataBlob", () => {
    it("packs every non-top-level field", () => {
        const blob = extractDataBlob(FULL);
        expect(blob["accountName"]).toBe("Acme");
        expect(blob["threadId"]).toBe("opener");
        expect(blob["outcome"]).toBe("meeting_booked");
        expect(blob["source"]).toBe("cold-call-studio-talk-loom");
    });
});

describe("callEntryToInsert / callEntryToUpdate", () => {
    it("inserts log_type=cold-call + summary + data", () => {
        const insert = callEntryToInsert(FULL);
        expect(insert.log_type).toBe(LOG_TYPE_COLD_CALL);
        expect(insert.summary).toBe("Acme · meeting booked");
    });

    it("falls back to 'Unknown account' when name blank", () => {
        const insert = callEntryToInsert({ ...FULL, accountName: "" });
        expect(insert.summary).toBe("Unknown account · meeting booked");
    });

    it("update has the same shape", () => {
        const update = callEntryToUpdate(FULL);
        expect(update.log_type).toBe(LOG_TYPE_COLD_CALL);
    });
});
