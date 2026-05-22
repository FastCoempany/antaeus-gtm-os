import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database-helpers";
import type { ActionEntry } from "./types";
import {
    actionToInsert,
    actionToUpdate,
    extractDataBlob,
    looksLikePersistedId,
    rowToAction,
    rowsToActions,
    SEQUENCE_KEY_LINKEDIN
} from "./linkedin-bridge";
import { buildSequenceRow } from "@/lib/test-helpers/row-builders";

const FULL: ActionEntry = {
    id: "li_1730000000_abc",
    accountName: "Acme",
    contactName: "Jane",
    actionType: "connection_request",
    temperature: "warm",
    content: "Comment + connect.",
    motionKey: "convert_connection",
    motionLabel: "Convert this connection",
    cueLabel: "Cue 03",
    whyNow: "Public engagement landed.",
    recommendedNext: "Send a calendar ask.",
    outcome: "accepted",
    outcomeDate: "2026-04-03T12:00:00Z",
    createdAt: "2026-04-02T12:00:00Z"
};

describe("looksLikePersistedId", () => {
    it("uuid yes, legacy no", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
        expect(looksLikePersistedId("li_1730_x")).toBe(false);
    });
});

describe("rowToAction", () => {
    it("hydrates a populated row", () => {
        const row: Row<"sequences"> = buildSequenceRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "linkedin",
            name: "Acme",
            title: "Convert this connection",
            data: {
                accountName: "Acme",
                contactName: "Jane",
                actionType: "connection_request",
                temperature: "warm",
                content: "Comment + connect.",
                motionKey: "convert_connection",
                motionLabel: "Convert this connection",
                cueLabel: "Cue 03",
                whyNow: "Public engagement landed.",
                recommendedNext: "Send a calendar ask.",
                outcome: "accepted",
                outcomeDate: "2026-04-03T12:00:00Z"
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        const a = rowToAction(row);
        expect(a).not.toBeNull();
        expect(a!.accountName).toBe("Acme");
        expect(a!.actionType).toBe("connection_request");
        expect(a!.outcome).toBe("accepted");
    });

    it("returns null for non-linkedin sequence_key", () => {
        const row: Row<"sequences"> = buildSequenceRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "outbound",
            name: "Acme",
            title: null,
            data: {},
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToAction(row)).toBeNull();
    });

    it("normalizes invalid actionType to content_engage", () => {
        const row: Row<"sequences"> = buildSequenceRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "linkedin",
            name: "Acme",
            title: null,
            data: { actionType: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToAction(row)!.actionType).toBe("content_engage");
    });

    it("normalizes invalid outcome to null", () => {
        const row: Row<"sequences"> = buildSequenceRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "linkedin",
            name: "Acme",
            title: null,
            data: { outcome: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToAction(row)!.outcome).toBeNull();
    });

    it("returns null on missing id / null", () => {
        expect(rowToAction({ id: "" } as unknown as Row<"sequences">)).toBeNull();
        expect(rowToAction(null)).toBeNull();
    });
});

describe("rowsToActions", () => {
    it("filters non-linkedin + malformed", () => {
        const rows = [
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                user_id: "u",
                workspace_id: "w",
                sequence_key: "linkedin",
                name: "A",
                title: null,
                data: {},
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440001",
                user_id: "u",
                workspace_id: "w",
                sequence_key: "outbound",
                name: "A",
                title: null,
                data: {},
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            }
        ];
        expect(rowsToActions(rows as Row<"sequences">[])).toHaveLength(1);
    });
});

describe("extractDataBlob", () => {
    it("packs every non-top-level field", () => {
        const blob = extractDataBlob(FULL);
        expect(blob["actionType"]).toBe("connection_request");
        expect(blob["motionKey"]).toBe("convert_connection");
        expect(blob["outcome"]).toBe("accepted");
    });
});

describe("actionToInsert / actionToUpdate", () => {
    it("packs sequence_key=linkedin + name + title", () => {
        const insert = actionToInsert(FULL);
        expect(insert.sequence_key).toBe(SEQUENCE_KEY_LINKEDIN);
        expect(insert.name).toBe("Acme");
        expect(insert.title).toBe("Convert this connection");
    });

    it("falls back title to action type when motion label blank", () => {
        const insert = actionToInsert({ ...FULL, motionLabel: "" });
        expect(insert.title).toBe("LinkedIn connection_request");
    });

    it("update has the same shape", () => {
        const update = actionToUpdate(FULL);
        expect(update.sequence_key).toBe(SEQUENCE_KEY_LINKEDIN);
        expect(update.name).toBe("Acme");
    });

    it("falls back to title when accountName blank", () => {
        // sequences.name is NOT NULL in the schema; bridge falls back
        // to the derived title rather than emitting null.
        const insert = actionToInsert({ ...FULL, accountName: "" });
        expect(insert.name).toBe(insert.title);
        expect(typeof insert.name).toBe("string");
    });
});
