import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database-helpers";
import type { Approach, TerritoryAccount, Focus } from "./types";
import {
    accountToInsert,
    accountToUpdate,
    approachToInsert,
    approachToUpdate,
    KIND_ACCOUNT,
    KIND_APPROACH,
    KIND_FOCUS,
    looksLikePersistedId,
    partitionTerritoryRows,
    rowKind,
    rowToAccount,
    rowToApproach,
    rowToThesis,
    focusToInsert,
    focusToUpdate
} from "./territory-bridge";
import { buildStudioArtifactRow } from "@/lib/test-helpers/row-builders";

const FULL_THESIS: Focus = {
    id: "th_1",
    title: "Procurement consolidation Q2",
    pressure: "Audit + cost pressure",
    segment: "mid_market_legal",
    whyUs: "We've shipped this 3 times.",
    tier: "t1",
    accountIds: ["acct_1"],
    createdAt: "2026-04-02T12:00:00Z",
    updatedAt: "2026-04-02T12:00:00Z"
};

const FULL_APPROACH: Approach = {
    id: "ap_1",
    name: "Procurement-led intro",
    trigger: "Vendor consolidation memo",
    script: "Open with the savings line.",
    bridge: "Yes-and the audit comment.",
    focusId: "th_1",
    createdAt: "2026-04-02T12:00:00Z",
    updatedAt: "2026-04-02T12:00:00Z"
};

const FULL_ACCOUNT: TerritoryAccount = {
    id: "acct_1",
    name: "Acme Legal",
    tier: "t1",
    focusId: "th_1",
    approachId: "ap_1",
    disposition: "active",
    notes: "Live in 30 days.",
    createdAt: "2026-04-02T12:00:00Z",
    updatedAt: "2026-04-02T12:00:00Z"
};

describe("looksLikePersistedId", () => {
    it("uuid yes legacy no", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
        expect(looksLikePersistedId("th_1")).toBe(false);
    });
});

describe("rowKind", () => {
    it("reads kind from data blob", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "territory.focus" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowKind(row)).toBe("territory.focus");
    });

    it("returns null for missing data", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: null as never,
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowKind(row)).toBeNull();
    });
});

describe("rowToThesis", () => {
    it("hydrates a focus row", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "territory.focus",
                title: FULL_THESIS.title,
                pressure: FULL_THESIS.pressure,
                segment: FULL_THESIS.segment,
                whyUs: FULL_THESIS.whyUs,
                tier: "t1",
                accountIds: ["acct_1"]
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        const t = rowToThesis(row);
        expect(t).not.toBeNull();
        expect(t!.title).toBe(FULL_THESIS.title);
        expect(t!.tier).toBe("t1");
        expect(t!.accountIds).toEqual(["acct_1"]);
    });

    it("returns null on wrong kind", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "territory.approach" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToThesis(row)).toBeNull();
    });

    it("returns null on missing id", () => {
        expect(
            rowToThesis({ id: "" } as unknown as Row<"studio_artifacts">)
        ).toBeNull();
        expect(rowToThesis(null)).toBeNull();
    });

    it("normalizes invalid tier to t1", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "territory.focus", tier: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToThesis(row)!.tier).toBe("t1");
    });
});

describe("rowToApproach", () => {
    it("hydrates an approach row", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "territory.approach",
                name: FULL_APPROACH.name,
                trigger: FULL_APPROACH.trigger,
                script: FULL_APPROACH.script,
                bridge: FULL_APPROACH.bridge,
                focusId: FULL_APPROACH.focusId
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        const a = rowToApproach(row);
        expect(a).not.toBeNull();
        expect(a!.name).toBe(FULL_APPROACH.name);
    });

    it("returns null on wrong kind", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "territory.focus" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToApproach(row)).toBeNull();
    });
});

describe("rowToAccount", () => {
    it("hydrates an account row", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "territory.account",
                name: FULL_ACCOUNT.name,
                tier: "t1",
                focusId: FULL_ACCOUNT.focusId,
                approachId: FULL_ACCOUNT.approachId,
                disposition: "active",
                notes: FULL_ACCOUNT.notes
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        const a = rowToAccount(row);
        expect(a).not.toBeNull();
        expect(a!.name).toBe(FULL_ACCOUNT.name);
    });

    it("normalizes invalid disposition to active", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "territory.account", disposition: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToAccount(row)!.disposition).toBe("active");
    });
});

describe("partitionTerritoryRows", () => {
    it("buckets rows by kind, drops non-territory", () => {
        const rows: Row<"studio_artifacts">[] = [
            buildStudioArtifactRow({
                id: "550e8400-e29b-41d4-a716-446655440001",
                user_id: "u",
                workspace_id: "w",
                data: {
                    kind: "territory.focus",
                    title: "T",
                    tier: "t1",
                    accountIds: []
                },
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            }),
            buildStudioArtifactRow({
                id: "550e8400-e29b-41d4-a716-446655440002",
                user_id: "u",
                workspace_id: "w",
                data: { kind: "territory.approach", name: "A" },
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            }),
            buildStudioArtifactRow({
                id: "550e8400-e29b-41d4-a716-446655440003",
                user_id: "u",
                workspace_id: "w",
                data: { kind: "territory.account", name: "Acme" },
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            }),
            buildStudioArtifactRow({
                id: "550e8400-e29b-41d4-a716-446655440004",
                user_id: "u",
                workspace_id: "w",
                data: { kind: "sourcing.prospect" },
                created_at: "2026-04-02T12:00:00Z",
                updated_at: "2026-04-02T12:00:00Z"
            })
        ];
        const out = partitionTerritoryRows(rows);
        expect(out.focuses).toHaveLength(1);
        expect(out.approaches).toHaveLength(1);
        expect(out.accounts).toHaveLength(1);
    });
});

describe("insert/update factories tag with the right kind", () => {
    it("focusToInsert / focusToUpdate", () => {
        const insert = focusToInsert(FULL_THESIS);
        const update = focusToUpdate(FULL_THESIS);
        expect((insert.data as Record<string, unknown>)["kind"]).toBe(
            KIND_FOCUS
        );
        expect((update.data as Record<string, unknown>)["kind"]).toBe(
            KIND_FOCUS
        );
    });

    it("approachToInsert / approachToUpdate", () => {
        const insert = approachToInsert(FULL_APPROACH);
        const update = approachToUpdate(FULL_APPROACH);
        expect((insert.data as Record<string, unknown>)["kind"]).toBe(
            KIND_APPROACH
        );
        expect((update.data as Record<string, unknown>)["kind"]).toBe(
            KIND_APPROACH
        );
    });

    it("accountToInsert / accountToUpdate", () => {
        const insert = accountToInsert(FULL_ACCOUNT);
        const update = accountToUpdate(FULL_ACCOUNT);
        expect((insert.data as Record<string, unknown>)["kind"]).toBe(
            KIND_ACCOUNT
        );
        expect((update.data as Record<string, unknown>)["kind"]).toBe(
            KIND_ACCOUNT
        );
    });
});
