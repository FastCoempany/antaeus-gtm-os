import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database.types";
import type { Touch } from "./types";
import {
    extractDataBlob,
    looksLikePersistedId,
    rowToTouch,
    rowsToTouches,
    SEQUENCE_KEY_OUTBOUND,
    touchToInsert,
    touchToUpdate
} from "./outbound-bridge";

const FULL: Touch = {
    id: "touch_1730000000_abc",
    account: "acme",
    accountName: "Acme",
    contactName: "Jane",
    contactTitle: "VP Eng",
    persona: "vp",
    temperature: "warm",
    channel: "email",
    trigger: "funding",
    ctaType: "meeting_request",
    assetUsed: "case_study",
    content: "Hi Jane,\nFollowing your Series B...",
    outcome: "sent",
    outcomeDate: "2026-04-03T12:00:00Z",
    dealId: "deal_1",
    qualityScore: 76,
    motionBand: "ready",
    createdAt: "2026-04-02T12:00:00Z"
};

describe("looksLikePersistedId", () => {
    it("accepts canonical uuid", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
    });

    it("rejects legacy + empty", () => {
        expect(looksLikePersistedId("touch_1730_x")).toBe(false);
        expect(looksLikePersistedId("")).toBe(false);
    });
});

describe("rowToTouch", () => {
    it("hydrates from a populated row", () => {
        const row: Row<"sequences"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "outbound",
            name: "Acme",
            title: "Hi Jane,",
            data: {
                account: "acme",
                accountName: "Acme",
                contactName: "Jane",
                contactTitle: "VP Eng",
                persona: "vp",
                temperature: "warm",
                channel: "email",
                trigger: "funding",
                ctaType: "meeting_request",
                assetUsed: "case_study",
                content: "Hi Jane,\nFollowing your Series B...",
                outcome: "sent",
                outcomeDate: "2026-04-03T12:00:00Z",
                dealId: "deal_1",
                qualityScore: 76,
                motionBand: "ready"
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const t = rowToTouch(row);
        expect(t).not.toBeNull();
        expect(t!.accountName).toBe("Acme");
        expect(t!.persona).toBe("vp");
        expect(t!.outcome).toBe("sent");
        expect(t!.qualityScore).toBe(76);
    });

    it("returns null for non-outbound sequence_key", () => {
        const row: Row<"sequences"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "linkedin",
            name: "Acme",
            title: null,
            data: {},
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToTouch(row)).toBeNull();
    });

    it("returns null for missing id", () => {
        expect(
            rowToTouch({ id: "" } as unknown as Row<"sequences">)
        ).toBeNull();
        expect(rowToTouch(null)).toBeNull();
    });

    it("normalizes invalid persona to vp", () => {
        const row: Row<"sequences"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "outbound",
            name: "Acme",
            title: null,
            data: { persona: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToTouch(row)!.persona).toBe("vp");
    });

    it("normalizes invalid outcome to null", () => {
        const row: Row<"sequences"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "outbound",
            name: "Acme",
            title: null,
            data: { outcome: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToTouch(row)!.outcome).toBeNull();
    });
});

describe("rowsToTouches", () => {
    it("filters non-outbound rows + malformed", () => {
        const rows = [
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                user_id: "u",
                workspace_id: "w",
                sequence_key: "outbound",
                name: "Acme",
                title: null,
                data: {},
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440001",
                user_id: "u",
                workspace_id: "w",
                sequence_key: "linkedin",
                name: "Acme",
                title: null,
                data: {},
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            }
        ];
        expect(rowsToTouches(rows as Row<"sequences">[])).toHaveLength(1);
    });
});

describe("extractDataBlob", () => {
    it("packs every non-top-level field", () => {
        const blob = extractDataBlob(FULL);
        expect(blob["persona"]).toBe("vp");
        expect(blob["temperature"]).toBe("warm");
        expect(blob["outcome"]).toBe("sent");
        expect(blob["qualityScore"]).toBe(76);
    });
});

describe("touchToInsert", () => {
    it("populates top-level columns + data blob with sequence_key=outbound", () => {
        const insert = touchToInsert(FULL);
        expect(insert.sequence_key).toBe(SEQUENCE_KEY_OUTBOUND);
        expect(insert.name).toBe("Acme");
        expect(insert.title).toBe("Hi Jane,");
        expect(typeof insert.data).toBe("object");
    });

    it("clears name when accountName blank", () => {
        const insert = touchToInsert({ ...FULL, accountName: "" });
        expect(insert.name).toBeNull();
    });

    it("falls back to 'Outbound touch' for blank content", () => {
        const insert = touchToInsert({ ...FULL, content: "" });
        expect(insert.title).toBe("Outbound touch");
    });

    it("does NOT include id (Supabase generates uuid)", () => {
        const insert = touchToInsert(FULL);
        expect((insert as Record<string, unknown>)["id"]).toBeUndefined();
    });
});

describe("touchToUpdate", () => {
    it("packs same shape as insert", () => {
        const update = touchToUpdate(FULL);
        expect(update.sequence_key).toBe(SEQUENCE_KEY_OUTBOUND);
        expect(update.name).toBe("Acme");
        expect(update.title).toBe("Hi Jane,");
    });
});
