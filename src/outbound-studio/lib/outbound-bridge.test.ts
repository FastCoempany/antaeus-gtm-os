import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database-helpers";
import type { Angle, Touch } from "./types";
import {
    angleToInsert,
    angleToUpdate,
    extractAngleDataBlob,
    extractDataBlob,
    looksLikePersistedId,
    rowToAngle,
    rowToTouch,
    rowsToAngles,
    rowsToTouches,
    SEQUENCE_KEY_OUTBOUND,
    SEQUENCE_KEY_OUTBOUND_ANGLE,
    touchToInsert,
    touchToUpdate
} from "./outbound-bridge";
import { buildSequenceRow } from "@/lib/test-helpers/row-builders";

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
        const row: Row<"sequences"> = buildSequenceRow({
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
        });
        const t = rowToTouch(row);
        expect(t).not.toBeNull();
        expect(t!.accountName).toBe("Acme");
        expect(t!.persona).toBe("vp");
        expect(t!.outcome).toBe("sent");
        expect(t!.qualityScore).toBe(76);
    });

    it("returns null for non-outbound sequence_key", () => {
        const row: Row<"sequences"> = buildSequenceRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "linkedin",
            name: "Acme",
            title: null,
            data: {},
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToTouch(row)).toBeNull();
    });

    it("returns null for missing id", () => {
        expect(
            rowToTouch({ id: "" } as unknown as Row<"sequences">)
        ).toBeNull();
        expect(rowToTouch(null)).toBeNull();
    });

    it("normalizes invalid persona to vp", () => {
        const row: Row<"sequences"> = buildSequenceRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "outbound",
            name: "Acme",
            title: null,
            data: { persona: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToTouch(row)!.persona).toBe("vp");
    });

    it("normalizes invalid outcome to null", () => {
        const row: Row<"sequences"> = buildSequenceRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "outbound",
            name: "Acme",
            title: null,
            data: { outcome: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
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

    it("falls back to title when accountName blank", () => {
        // sequences.name is NOT NULL in the schema; bridge falls back
        // to the derived title rather than emitting null.
        const insert = touchToInsert({ ...FULL, accountName: "" });
        expect(insert.name).toBe(insert.title);
        expect(typeof insert.name).toBe("string");
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

const FULL_ANGLE: Angle = {
    id: "angle_1730000000_abc",
    company: "Acme",
    trigger: "funding",
    persona: "vp",
    email: "Hi Jane,\nFollowing your Series B...",
    temperature: "warm",
    channel: "email",
    ctaType: "meeting_request",
    assetUsed: "case_study",
    qualityScore: 76,
    motionBand: "ready",
    nextMove: "Send pricing.",
    savedAt: "2026-04-02T12:00:00Z"
};

describe("rowToAngle", () => {
    it("hydrates a populated row", () => {
        const row: Row<"sequences"> = buildSequenceRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            sequence_key: "outbound-angle",
            name: "Acme",
            title: "Hi Jane,",
            data: {
                company: "Acme",
                trigger: "funding",
                persona: "vp",
                email: FULL_ANGLE.email,
                temperature: "warm",
                channel: "email",
                ctaType: "meeting_request",
                assetUsed: "case_study",
                qualityScore: 76,
                motionBand: "ready",
                nextMove: "Send pricing."
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        const a = rowToAngle(row);
        expect(a).not.toBeNull();
        expect(a!.company).toBe("Acme");
        expect(a!.persona).toBe("vp");
        expect(a!.qualityScore).toBe(76);
    });

    it("returns null for non-angle sequence_key", () => {
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
        expect(rowToAngle(row)).toBeNull();
    });

    it("returns null on missing id / null", () => {
        expect(rowToAngle({ id: "" } as unknown as Row<"sequences">)).toBeNull();
        expect(rowToAngle(null)).toBeNull();
    });
});

describe("rowsToAngles", () => {
    it("filters non-angle + malformed rows", () => {
        const rows = [
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                user_id: "u",
                workspace_id: "w",
                sequence_key: "outbound-angle",
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
                sequence_key: "outbound",
                name: "Acme",
                title: null,
                data: {},
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            }
        ];
        expect(rowsToAngles(rows as Row<"sequences">[])).toHaveLength(1);
    });
});

describe("extractAngleDataBlob", () => {
    it("packs every non-top-level field", () => {
        const blob = extractAngleDataBlob(FULL_ANGLE);
        expect(blob["trigger"]).toBe("funding");
        expect(blob["persona"]).toBe("vp");
        expect(blob["nextMove"]).toBe("Send pricing.");
    });
});

describe("angleToInsert / angleToUpdate", () => {
    it("packs sequence_key=outbound-angle + name + title", () => {
        const insert = angleToInsert(FULL_ANGLE);
        expect(insert.sequence_key).toBe(SEQUENCE_KEY_OUTBOUND_ANGLE);
        expect(insert.name).toBe("Acme");
        expect(insert.title).toBe("Hi Jane,");
    });

    it("falls back to title when company blank", () => {
        // sequences.name is NOT NULL in the schema; bridge falls back
        // to the derived title rather than emitting null.
        const insert = angleToInsert({ ...FULL_ANGLE, company: "" });
        expect(insert.name).toBe(insert.title);
        expect(typeof insert.name).toBe("string");
    });

    it("falls back title to 'Saved angle' for blank email", () => {
        const insert = angleToInsert({ ...FULL_ANGLE, email: "" });
        expect(insert.title).toBe("Saved angle");
    });

    it("update has the same shape", () => {
        const update = angleToUpdate(FULL_ANGLE);
        expect(update.sequence_key).toBe(SEQUENCE_KEY_OUTBOUND_ANGLE);
        expect(update.name).toBe("Acme");
    });
});
