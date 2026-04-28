import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database.types";
import type { Deployment } from "./types";
import {
    advisorTierToTierId,
    deploymentToInsert,
    deploymentToUpdate,
    extractDataBlob,
    looksLikePersistedId,
    outcomeToStamp,
    rowToDeployment,
    rowsToDeployments,
    tierIdToAdvisorTier
} from "./advisor-bridge";

const FULL: Deployment = {
    id: "dep_1730000000_abc",
    dealId: "550e8400-e29b-41d4-a716-446655440001",
    dealName: "Acme Legal",
    dealStage: "discovery",
    advisorId: "adv_1",
    advisorName: "Sarah Chen",
    momentId: "intro",
    momentName: "Warm introduction",
    ask: "Could you intro me to Jane at Acme?",
    forwardableNote: "Hi Jane, meet John...",
    outcome: "engaged",
    notes: "Sent from desk.",
    createdAt: "2026-04-02T12:00:00Z",
    outcomeDate: "2026-04-03T12:00:00Z"
};

describe("looksLikePersistedId", () => {
    it("accepts canonical uuid", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
    });

    it("rejects legacy ids", () => {
        expect(looksLikePersistedId("dep_1730_x")).toBe(false);
        expect(looksLikePersistedId("")).toBe(false);
    });
});

describe("tierIdToAdvisorTier / advisorTierToTierId", () => {
    it("maps tiers to coarse labels", () => {
        expect(tierIdToAdvisorTier("t1")).toBe("investor");
        expect(tierIdToAdvisorTier("t2")).toBe("advisor");
        expect(tierIdToAdvisorTier("t3")).toBe("advisor");
        expect(tierIdToAdvisorTier("t4")).toBe("customer");
    });

    it("normalizes coarse labels to tier ids", () => {
        expect(advisorTierToTierId("investor")).toBe("t1");
        expect(advisorTierToTierId("advisor")).toBe("t2");
        expect(advisorTierToTierId("customer")).toBe("t4");
        expect(advisorTierToTierId("other")).toBe("t2");
        expect(advisorTierToTierId(null)).toBe("t2");
    });
});

describe("outcomeToStamp", () => {
    it("send for any sent-then-X outcome", () => {
        expect(outcomeToStamp("pending")).toBe("send");
        expect(outcomeToStamp("engaged")).toBe("send");
        expect(outcomeToStamp("successful")).toBe("send");
        expect(outcomeToStamp("no_response")).toBe("send");
        expect(outcomeToStamp("declined")).toBe("send");
    });

    it("hold + reroute preserve", () => {
        expect(outcomeToStamp("hold")).toBe("hold");
        expect(outcomeToStamp("reroute")).toBe("reroute");
    });
});

describe("rowToDeployment", () => {
    it("hydrates from a populated row using fine-grained outcome", () => {
        const row: Row<"advisor_deployments"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            workspace_id: "ws_1",
            created_by: "user_1",
            deal_id: "550e8400-e29b-41d4-a716-446655440001",
            advisor_name: "Sarah Chen",
            advisor_tier: "advisor",
            ask_moment: "intro",
            ask_text: "ask body",
            outcome_stamp: "send",
            data: {
                dealId: "550e8400-e29b-41d4-a716-446655440001",
                dealName: "Acme Legal",
                dealStage: "discovery",
                advisorId: "adv_1",
                momentName: "Warm introduction",
                forwardableNote: "fwd note",
                notes: "Sent from desk.",
                outcome: "engaged",
                outcomeDate: "2026-04-03T12:00:00Z"
            },
            created_at: "2026-04-02T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const dep = rowToDeployment(row);
        expect(dep).not.toBeNull();
        expect(dep!.dealId).toBe("550e8400-e29b-41d4-a716-446655440001");
        expect(dep!.dealName).toBe("Acme Legal");
        expect(dep!.advisorName).toBe("Sarah Chen");
        expect(dep!.outcome).toBe("engaged");
        expect(dep!.momentId).toBe("intro");
    });

    it("falls back to outcome_stamp when blob outcome missing", () => {
        const row: Row<"advisor_deployments"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            workspace_id: "w",
            created_by: null,
            deal_id: null,
            advisor_name: null,
            advisor_tier: null,
            ask_moment: "intro",
            ask_text: null,
            outcome_stamp: "hold",
            data: {},
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        expect(rowToDeployment(row)!.outcome).toBe("hold");
    });

    it("returns null on missing id", () => {
        expect(
            rowToDeployment({
                id: "",
                data: {}
            } as unknown as Row<"advisor_deployments">)
        ).toBeNull();
        expect(rowToDeployment(null)).toBeNull();
    });

    it("normalizes invalid outcome to pending", () => {
        const row: Row<"advisor_deployments"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            workspace_id: "w",
            created_by: null,
            deal_id: null,
            advisor_name: null,
            advisor_tier: null,
            ask_moment: "intro",
            ask_text: null,
            outcome_stamp: "send",
            data: { outcome: "garbage" },
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        expect(rowToDeployment(row)!.outcome).toBe("pending");
    });

    it("treats outcomeDate empty string as null", () => {
        const row: Row<"advisor_deployments"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            workspace_id: "w",
            created_by: null,
            deal_id: null,
            advisor_name: null,
            advisor_tier: null,
            ask_moment: "intro",
            ask_text: null,
            outcome_stamp: "send",
            data: { outcomeDate: "" },
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        expect(rowToDeployment(row)!.outcomeDate).toBeNull();
    });
});

describe("rowsToDeployments", () => {
    it("filters malformed rows", () => {
        const rows = [
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                workspace_id: "w",
                created_by: null,
                deal_id: null,
                advisor_name: null,
                advisor_tier: null,
                ask_moment: "intro",
                ask_text: null,
                outcome_stamp: "send",
                data: {},
                created_at: "2026-04-01T12:00:00Z",
                updated_at: "2026-04-01T12:00:00Z"
            },
            { id: "" } as unknown as Row<"advisor_deployments">,
            null as unknown as Row<"advisor_deployments">
        ];
        expect(
            rowsToDeployments(rows as Row<"advisor_deployments">[])
        ).toHaveLength(1);
    });
});

describe("extractDataBlob", () => {
    it("packs every non-top-level field", () => {
        const blob = extractDataBlob(FULL);
        expect(blob["dealName"]).toBe("Acme Legal");
        expect(blob["advisorId"]).toBe("adv_1");
        expect(blob["forwardableNote"]).toBe("Hi Jane, meet John...");
        expect(blob["outcome"]).toBe("engaged");
        expect(blob["outcomeDate"]).toBe("2026-04-03T12:00:00Z");
    });
});

describe("deploymentToInsert", () => {
    it("populates top-level columns + data blob; respects passed tier", () => {
        const insert = deploymentToInsert(FULL, "t1");
        expect(insert.advisor_name).toBe("Sarah Chen");
        expect(insert.advisor_tier).toBe("investor");
        expect(insert.ask_moment).toBe("intro");
        expect(insert.outcome_stamp).toBe("send");
        expect(insert.deal_id).toBe(FULL.dealId);
    });

    it("omits deal_id when legacy", () => {
        const insert = deploymentToInsert(
            { ...FULL, dealId: "deal_legacy" },
            "t2"
        );
        expect(insert.deal_id).toBeUndefined();
    });

    it("does NOT include id (Supabase generates uuid)", () => {
        const insert = deploymentToInsert(FULL, "t2");
        expect((insert as Record<string, unknown>)["id"]).toBeUndefined();
    });

    it("clears blanks to null on top-level columns", () => {
        const insert = deploymentToInsert(
            { ...FULL, advisorName: "", ask: "" },
            "t2"
        );
        expect(insert.advisor_name).toBeNull();
        expect(insert.ask_text).toBeNull();
    });
});

describe("deploymentToUpdate", () => {
    it("packs top-level columns + clears legacy deal_id to null", () => {
        const update = deploymentToUpdate(
            { ...FULL, dealId: "deal_legacy" },
            "t2"
        );
        expect(update.deal_id).toBeNull();
        expect(update.advisor_tier).toBe("advisor");
        expect(update.ask_moment).toBe("intro");
    });

    it("preserves uuid deal_id on update", () => {
        const update = deploymentToUpdate(FULL, "t2");
        expect(update.deal_id).toBe(FULL.dealId);
    });
});
