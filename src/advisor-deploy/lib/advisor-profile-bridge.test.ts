import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database-helpers";
import type { Advisor } from "./types";
import {
    advisorToInsert,
    advisorToUpdate,
    extractDataBlob,
    KIND_ADVISOR_PROFILE,
    looksLikePersistedId,
    rowKind,
    rowToAdvisor,
    rowsToAdvisors
} from "./advisor-profile-bridge";
import { buildStudioArtifactRow } from "@/lib/test-helpers/row-builders";

const FULL: Advisor = {
    id: "adv_1",
    name: "Sarah Chen",
    title: "Operator-investor",
    tier: "t1",
    expertise: "Enterprise SaaS · CX",
    equity: "0.5%",
    companies: ["Meridian", "Northstar"],
    notes: "Carries cleanly into procurement.",
    relationship: "active",
    createdAt: "2026-04-02T12:00:00Z"
};

describe("looksLikePersistedId", () => {
    it("uuid yes legacy no", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
        expect(looksLikePersistedId("adv_1")).toBe(false);
    });
});

describe("rowKind", () => {
    it("reads kind", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "advisor.profile" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowKind(row)).toBe("advisor.profile");
    });
});

describe("rowToAdvisor", () => {
    it("hydrates a populated row", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "advisor.profile",
                name: "Sarah Chen",
                title: "Operator-investor",
                tier: "t1",
                expertise: "Enterprise SaaS · CX",
                equity: "0.5%",
                companies: ["Meridian", "Northstar"],
                notes: "Carries cleanly into procurement.",
                relationship: "active"
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        const a = rowToAdvisor(row);
        expect(a).not.toBeNull();
        expect(a!.name).toBe("Sarah Chen");
        expect(a!.tier).toBe("t1");
        expect(a!.companies).toEqual(["Meridian", "Northstar"]);
    });

    it("returns null for wrong kind", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "territory.focus" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToAdvisor(row)).toBeNull();
    });

    it("returns null for missing id / null", () => {
        expect(rowToAdvisor(null)).toBeNull();
        expect(
            rowToAdvisor({ id: "" } as unknown as Row<"studio_artifacts">)
        ).toBeNull();
    });

    it("normalizes invalid tier to t2", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "advisor.profile", tier: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToAdvisor(row)!.tier).toBe("t2");
    });

    it("normalizes invalid relationship to active", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: { kind: "advisor.profile", relationship: "garbage" },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToAdvisor(row)!.relationship).toBe("active");
    });

    it("filters non-string companies", () => {
        const row: Row<"studio_artifacts"> = buildStudioArtifactRow({
            id: "550e8400-e29b-41d4-a716-446655440000",
            user_id: "u",
            workspace_id: "w",
            data: {
                kind: "advisor.profile",
                companies: ["Meridian", 42, null, "Northstar"]
            } as never,
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        });
        expect(rowToAdvisor(row)!.companies).toEqual([
            "Meridian",
            "Northstar"
        ]);
    });
});

describe("rowsToAdvisors", () => {
    it("filters non-advisor.profile rows", () => {
        const rows: Row<"studio_artifacts">[] = [
            buildStudioArtifactRow({
                id: "550e8400-e29b-41d4-a716-446655440001",
                data: { kind: "advisor.profile", name: "A" }
            }),
            buildStudioArtifactRow({
                id: "550e8400-e29b-41d4-a716-446655440002",
                data: { kind: "territory.focus" }
            })
        ];
        expect(rowsToAdvisors(rows)).toHaveLength(1);
    });
});

describe("extractDataBlob / advisorToInsert / advisorToUpdate", () => {
    it("packs kind + every field", () => {
        const blob = extractDataBlob(FULL);
        expect(blob["kind"]).toBe(KIND_ADVISOR_PROFILE);
        expect(blob["name"]).toBe("Sarah Chen");
        expect(blob["companies"]).toEqual(["Meridian", "Northstar"]);
    });

    it("insert + update have the same shape", () => {
        const insert = advisorToInsert(FULL);
        const update = advisorToUpdate(FULL);
        expect((insert.data as Record<string, unknown>)["kind"]).toBe(
            KIND_ADVISOR_PROFILE
        );
        expect((update.data as Record<string, unknown>)["kind"]).toBe(
            KIND_ADVISOR_PROFILE
        );
    });
});
