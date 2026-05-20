import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database.types";
import type { Prospect, QueryCard } from "./types";
import {
    KIND_PROSPECT,
    KIND_QUERY_CARD,
    looksLikePersistedId,
    partitionSourcingRows,
    prospectToInsert,
    prospectToUpdate,
    queryCardToInsert,
    queryCardToUpdate,
    rowKind,
    rowToProspect,
    rowToQueryCard
} from "./sourcing-bridge";

const FULL_CARD: QueryCard = {
    id: "qc_1",
    platform: "linkedin",
    query: "VP Engineering AND legal",
    intent: "Find legal-ops VPs",
    notes: "filter on Series B",
    targetIcp: "legal_midmarket",
    createdAt: "2026-04-02T12:00:00Z",
    updatedAt: "2026-04-02T12:00:00Z"
};

const FULL_PROSPECT: Prospect = {
    id: "pr_1",
    accountName: "Acme Legal",
    contactName: "Jane",
    contactTitle: "VP Eng",
    sourceQueryId: "qc_1",
    leverage: "network-connection",
    stage: "researched",
    entryPoint: "Mutual connection at Series A.",
    approach: "Procurement-led intro.",
    notes: "Live in 30 days.",
    createdAt: "2026-04-02T12:00:00Z",
    updatedAt: "2026-04-02T12:00:00Z"
};

describe("looksLikePersistedId", () => {
    it("uuid yes legacy no", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
        expect(looksLikePersistedId("qc_1")).toBe(false);
    });
});

describe("rowKind", () => {
    it("reads kind from data blob", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "sourcing.queryCard" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowKind(row)).toBe("sourcing.queryCard");
    });
});

describe("rowToQueryCard", () => {
    it("hydrates a query-card row", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "sourcing.queryCard",
                platform: "linkedin",
                query: FULL_CARD.query,
                intent: FULL_CARD.intent,
                notes: FULL_CARD.notes,
                targetIcp: FULL_CARD.targetIcp
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const c = rowToQueryCard(row);
        expect(c).not.toBeNull();
        expect(c!.platform).toBe("linkedin");
        expect(c!.query).toBe(FULL_CARD.query);
    });

    it("returns null on wrong kind", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "sourcing.prospect" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToQueryCard(row)).toBeNull();
    });

    it("normalizes invalid platform to linkedin", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "sourcing.queryCard", platform: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToQueryCard(row)!.platform).toBe("linkedin");
    });
});

describe("rowToProspect", () => {
    it("hydrates a prospect row", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "sourcing.prospect",
                accountName: FULL_PROSPECT.accountName,
                contactName: FULL_PROSPECT.contactName,
                contactTitle: FULL_PROSPECT.contactTitle,
                sourceQueryId: FULL_PROSPECT.sourceQueryId,
                leverage: FULL_PROSPECT.leverage,
                stage: FULL_PROSPECT.stage,
                entryPoint: FULL_PROSPECT.entryPoint,
                approach: FULL_PROSPECT.approach,
                notes: FULL_PROSPECT.notes
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const p = rowToProspect(row);
        expect(p).not.toBeNull();
        expect(p!.accountName).toBe(FULL_PROSPECT.accountName);
        expect(p!.stage).toBe("researched");
    });

    it("normalizes invalid stage to captured", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "sourcing.prospect", stage: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToProspect(row)!.stage).toBe("captured");
    });

    it("normalizes invalid leverage to cold", () => {
        const row: Row<"studio_artifacts"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "sourcing.prospect", leverage: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        expect(rowToProspect(row)!.leverage).toBe("cold");
    });
});

describe("partitionSourcingRows", () => {
    it("buckets rows by kind, drops other kinds", () => {
        const rows: Row<"studio_artifacts">[] = [
            {
                id: "550e8400-e29b-41d4-a716-446655440001",
                user_id: "u",
                workspace_id: "w",
                data: { kind: "sourcing.queryCard", platform: "linkedin" },
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440002",
                user_id: "u",
                workspace_id: "w",
                data: { kind: "sourcing.prospect" },
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440003",
                user_id: "u",
                workspace_id: "w",
                data: { kind: "territory.focus" },
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            }
        ];
        const out = partitionSourcingRows(rows);
        expect(out.queryCards).toHaveLength(1);
        expect(out.prospects).toHaveLength(1);
    });
});

describe("insert/update factories tag with the right kind", () => {
    it("queryCardToInsert / queryCardToUpdate", () => {
        const insert = queryCardToInsert(FULL_CARD);
        const update = queryCardToUpdate(FULL_CARD);
        expect((insert.data as Record<string, unknown>)["kind"]).toBe(
            KIND_QUERY_CARD
        );
        expect((update.data as Record<string, unknown>)["kind"]).toBe(
            KIND_QUERY_CARD
        );
    });

    it("prospectToInsert / prospectToUpdate", () => {
        const insert = prospectToInsert(FULL_PROSPECT);
        const update = prospectToUpdate(FULL_PROSPECT);
        expect((insert.data as Record<string, unknown>)["kind"]).toBe(
            KIND_PROSPECT
        );
        expect((update.data as Record<string, unknown>)["kind"]).toBe(
            KIND_PROSPECT
        );
    });
});
