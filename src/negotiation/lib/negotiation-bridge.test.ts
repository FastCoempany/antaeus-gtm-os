import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database.types";
import {
    bagToInsert,
    bagToUpdate,
    KIND_NEGOTIATION_WORKSPACE,
    looksLikePersistedId,
    rowKind,
    rowToWorkspaceBag,
    type NegotiationWorkspaceBag
} from "./negotiation-bridge";
import type { LearningEntry, Negotiation } from "./types";

const SAMPLE_NEGOTIATION: Negotiation = {
    id: "neg_1",
    counterparty: "cfo",
    counterpartyName: "Acme CFO",
    askMoment: "pricing_position",
    dealId: "deal_42",
    status: "drafting",
    outcome: null,
    startingPosition: "Annual contract at list price",
    walkawayPosition: "10% discount, paid annually",
    openingLine: "We've designed this to start at...",
    notes: "Tight on procurement timing",
    pushbacks: [],
    concessionLadder: [],
    createdAt: "2026-05-04T12:00:00Z",
    updatedAt: "2026-05-04T12:00:00Z"
};

const SAMPLE_LEARNING: LearningEntry = {
    id: "learn_1",
    negotiationId: "neg_1",
    text: "Procurement always opens 25% lower than they'll close",
    createdAt: "2026-05-04T12:30:00Z"
};

const FULL_BAG: NegotiationWorkspaceBag = {
    negotiations: [SAMPLE_NEGOTIATION],
    learnings: [SAMPLE_LEARNING]
};

describe("looksLikePersistedId", () => {
    it("uuid yes legacy no", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
        expect(looksLikePersistedId("neg_legacy_id")).toBe(false);
    });
});

describe("rowKind", () => {
    it("reads kind discriminator", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: KIND_NEGOTIATION_WORKSPACE },
            created_at: "2026-05-04T12:00:00Z",
            updated_at: "2026-05-04T12:00:00Z"
        };
        expect(rowKind(row)).toBe(KIND_NEGOTIATION_WORKSPACE);
    });

    it("returns null for missing data", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: null as never,
            created_at: "2026-05-04T12:00:00Z",
            updated_at: "2026-05-04T12:00:00Z"
        };
        expect(rowKind(row)).toBe(null);
    });
});

describe("rowToWorkspaceBag", () => {
    it("hydrates a populated row", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: KIND_NEGOTIATION_WORKSPACE,
                negotiations: FULL_BAG.negotiations,
                learnings: FULL_BAG.learnings
            } as never,
            created_at: "2026-05-04T12:00:00Z",
            updated_at: "2026-05-04T12:00:00Z"
        };
        const bag = rowToWorkspaceBag(row);
        expect(bag).not.toBe(null);
        expect(bag?.negotiations).toHaveLength(1);
        expect(bag?.negotiations[0]?.id).toBe("neg_1");
        expect(bag?.learnings).toHaveLength(1);
        expect(bag?.learnings[0]?.id).toBe("learn_1");
    });

    it("returns null for wrong kind", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "future-autopsy.taskLog" } as never,
            created_at: "2026-05-04T12:00:00Z",
            updated_at: "2026-05-04T12:00:00Z"
        };
        expect(rowToWorkspaceBag(row)).toBe(null);
    });

    it("returns empty bag for kind-only row", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: KIND_NEGOTIATION_WORKSPACE } as never,
            created_at: "2026-05-04T12:00:00Z",
            updated_at: "2026-05-04T12:00:00Z"
        };
        const bag = rowToWorkspaceBag(row);
        expect(bag).toEqual({ negotiations: [], learnings: [] });
    });

    it("drops malformed entries (missing id)", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: KIND_NEGOTIATION_WORKSPACE,
                negotiations: [
                    SAMPLE_NEGOTIATION,
                    { counterparty: "cfo" } // missing id
                ],
                learnings: [
                    SAMPLE_LEARNING,
                    { id: "no-text" } // missing text
                ]
            } as never,
            created_at: "2026-05-04T12:00:00Z",
            updated_at: "2026-05-04T12:00:00Z"
        };
        const bag = rowToWorkspaceBag(row);
        expect(bag?.negotiations).toHaveLength(1);
        expect(bag?.learnings).toHaveLength(1);
    });

    it("returns null for null input", () => {
        expect(rowToWorkspaceBag(null)).toBe(null);
        expect(rowToWorkspaceBag(undefined)).toBe(null);
    });
});

describe("bagToInsert / bagToUpdate", () => {
    it("packs bag into data with kind discriminator", () => {
        const insert = bagToInsert(FULL_BAG);
        const inserted = insert.data as unknown as {
            kind: string;
            negotiations: ReadonlyArray<Negotiation>;
            learnings: ReadonlyArray<LearningEntry>;
        };
        expect(inserted.kind).toBe(KIND_NEGOTIATION_WORKSPACE);
        expect(inserted.negotiations).toEqual(FULL_BAG.negotiations);
        expect(inserted.learnings).toEqual(FULL_BAG.learnings);
    });

    it("update mirrors insert shape", () => {
        const insert = bagToInsert(FULL_BAG);
        const update = bagToUpdate(FULL_BAG);
        expect(update.data).toEqual(insert.data);
    });

    it("does not set user_id (DB default fills it)", () => {
        const insert = bagToInsert(FULL_BAG);
        expect("user_id" in insert).toBe(false);
    });
});

describe("roundtrip", () => {
    it("rowToWorkspaceBag(bagToInsert(b)) preserves shape", () => {
        const insert = bagToInsert(FULL_BAG);
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: insert.data as never,
            created_at: "2026-05-04T12:00:00Z",
            updated_at: "2026-05-04T12:00:00Z"
        };
        const hydrated = rowToWorkspaceBag(row);
        expect(hydrated?.negotiations).toEqual(FULL_BAG.negotiations);
        expect(hydrated?.learnings).toEqual(FULL_BAG.learnings);
    });
});
