import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database-helpers";
import type { Proof } from "./types";
import {
    extractDataBlob,
    looksLikePersistedId,
    outcomeToState,
    proofToInsert,
    proofToUpdate,
    rowToProof,
    rowsToProofs,
    stateToOutcome
} from "./poc-bridge";

const FULL: Proof = {
    id: "poc_1730000000_abc",
    account: "Acme Legal",
    vendor: "Harvey",
    readoutOwner: "Sarah Chen",
    linkedDealId: "550e8400-e29b-41d4-a716-446655440000",
    linkedDealName: "Acme Legal — Pilot",
    durationDays: 14,
    outcome: "in_progress",
    successCriteria: "Cut review time by 30% on M&A docs",
    boundaries: "Stop if accuracy < 95%",
    qualityScore: 78,
    qualityBand: "workable",
    docs: {
        scope: "scope text",
        kickoff: "kickoff text",
        readout: "readout text",
        email: "email text"
    },
    updatedAt: "2026-04-02T12:00:00Z"
};

describe("looksLikePersistedId", () => {
    it("accepts canonical uuid", () => {
        expect(
            looksLikePersistedId("550e8400-e29b-41d4-a716-446655440000")
        ).toBe(true);
    });

    it("rejects legacy id + empty", () => {
        expect(looksLikePersistedId("poc_1730000000_abc")).toBe(false);
        expect(looksLikePersistedId("")).toBe(false);
    });
});

describe("outcomeToState / stateToOutcome", () => {
    it("round-trips happy path", () => {
        expect(outcomeToState("converted")).toBe("passed");
        expect(outcomeToState("failed")).toBe("failed");
        expect(outcomeToState("in_progress")).toBe("open");
        expect(outcomeToState("not_started")).toBe("open");
    });

    it("normalizes state to outcome", () => {
        expect(stateToOutcome("passed")).toBe("converted");
        expect(stateToOutcome("failed")).toBe("failed");
        expect(stateToOutcome("abandoned")).toBe("failed");
        expect(stateToOutcome("open")).toBe("in_progress");
        expect(stateToOutcome(null)).toBe("not_started");
    });
});

describe("rowToProof", () => {
    it("hydrates from a fully populated row", () => {
        const row: Row<"proofs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            workspace_id: "ws_1",
            created_by: "user_1",
            deal_id: "550e8400-e29b-41d4-a716-446655440001",
            claim: "Cut review time by 30%",
            claim_owner: "Sarah Chen",
            success_metric: "Cut review time by 30% on M&A docs",
            kill_rule: "Stop if accuracy < 95%",
            outcome_state: "open",
            duration_days: 14,
            data: {
                account: "Acme Legal",
                vendor: "Harvey",
                readoutOwner: "Sarah Chen",
                linkedDealName: "Acme Legal — Pilot",
                durationDays: 14,
                qualityScore: 78,
                qualityBand: "workable",
                docs: { ...FULL.docs },
                successCriteria: FULL.successCriteria,
                boundaries: FULL.boundaries
            } as never,
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-02T12:00:00Z"
        };
        const proof = rowToProof(row);
        expect(proof).not.toBeNull();
        expect(proof!.account).toBe("Acme Legal");
        expect(proof!.vendor).toBe("Harvey");
        expect(proof!.readoutOwner).toBe("Sarah Chen");
        expect(proof!.outcome).toBe("in_progress");
        expect(proof!.qualityBand).toBe("workable");
        expect(proof!.docs.scope).toBe("scope text");
    });

    it("returns null for missing id", () => {
        expect(
            rowToProof({ id: "", data: {} } as unknown as Row<"proofs">)
        ).toBeNull();
        expect(rowToProof(null)).toBeNull();
    });

    it("falls back to data.successCriteria when success_metric blank", () => {
        const row: Row<"proofs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            workspace_id: "w",
            created_by: "u",
            deal_id: null,
            claim: null,
            claim_owner: null,
            success_metric: null,
            kill_rule: null,
            outcome_state: "open",
            duration_days: 7,
            data: { account: "A", successCriteria: "from-data" },
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        expect(rowToProof(row)!.successCriteria).toBe("from-data");
    });

    it("normalizes invalid duration to 7", () => {
        const row: Row<"proofs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            workspace_id: "w",
            created_by: "u",
            deal_id: null,
            claim: null,
            claim_owner: null,
            success_metric: null,
            kill_rule: null,
            outcome_state: "open",
            duration_days: 30 as never,
            data: {},
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        expect(rowToProof(row)!.durationDays).toBe(7);
    });

    it("falls back qualityBand to 'thin' when invalid", () => {
        const row: Row<"proofs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            workspace_id: "w",
            created_by: "u",
            deal_id: null,
            claim: null,
            claim_owner: null,
            success_metric: null,
            kill_rule: null,
            outcome_state: "open",
            duration_days: 7,
            data: { qualityBand: "garbage" },
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        expect(rowToProof(row)!.qualityBand).toBe("thin");
    });

    it("returns empty docs when blob missing", () => {
        const row: Row<"proofs"> = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            workspace_id: "w",
            created_by: "u",
            deal_id: null,
            claim: null,
            claim_owner: null,
            success_metric: null,
            kill_rule: null,
            outcome_state: "open",
            duration_days: 7,
            data: {},
            created_at: "2026-04-01T12:00:00Z",
            updated_at: "2026-04-01T12:00:00Z"
        };
        const proof = rowToProof(row)!;
        expect(proof.docs.scope).toBe("");
        expect(proof.docs.email).toBe("");
    });
});

describe("rowsToProofs", () => {
    it("filters malformed rows", () => {
        const rows = [
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                workspace_id: "w",
                created_by: "u",
                deal_id: null,
                claim: null,
                claim_owner: null,
                success_metric: null,
                kill_rule: null,
                outcome_state: "open",
                duration_days: 7,
                data: {},
                created_at: "2026-04-01T12:00:00Z",
                updated_at: "2026-04-01T12:00:00Z"
            },
            { id: "" } as unknown as Row<"proofs">,
            null as unknown as Row<"proofs">
        ];
        expect(rowsToProofs(rows as Row<"proofs">[])).toHaveLength(1);
    });
});

describe("extractDataBlob", () => {
    it("packs every non-top-level field", () => {
        const blob = extractDataBlob(FULL);
        expect(blob["account"]).toBe("Acme Legal");
        expect(blob["vendor"]).toBe("Harvey");
        expect(blob["qualityScore"]).toBe(78);
        expect(blob["qualityBand"]).toBe("workable");
        expect((blob["docs"] as { scope: string }).scope).toBe("scope text");
    });
});

describe("proofToInsert", () => {
    it("packs top-level columns + data blob", () => {
        const insert = proofToInsert(FULL);
        expect(insert.claim).toBe("Cut review time by 30% on M&A docs");
        expect(insert.claim_owner).toBe("Sarah Chen");
        expect(insert.success_metric).toBe(FULL.successCriteria);
        expect(insert.kill_rule).toBe(FULL.boundaries);
        expect(insert.outcome_state).toBe("open");
        expect(insert.duration_days).toBe(14);
        expect(insert.deal_id).toBe(FULL.linkedDealId);
        expect(typeof insert.data).toBe("object");
    });

    it("omits deal_id when linkedDealId is legacy", () => {
        const insert = proofToInsert({
            ...FULL,
            linkedDealId: "deal_1730_x"
        });
        expect(insert.deal_id).toBeUndefined();
    });

    it("derives claim from account+vendor when criteria blank", () => {
        const insert = proofToInsert({
            ...FULL,
            successCriteria: ""
        });
        expect(insert.claim).toBe("Harvey pilot at Acme Legal");
    });

    it("falls back to Untitled pilot when nothing", () => {
        const insert = proofToInsert({
            ...FULL,
            successCriteria: "",
            account: "",
            vendor: ""
        });
        expect(insert.claim).toBe("Untitled pilot");
    });

    it("does NOT include id (Supabase generates uuid)", () => {
        const insert = proofToInsert(FULL);
        expect((insert as Record<string, unknown>)["id"]).toBeUndefined();
    });
});

describe("proofToUpdate", () => {
    it("packs every column including a deal_id null when legacy", () => {
        const update = proofToUpdate({
            ...FULL,
            linkedDealId: "deal_1730_x"
        });
        expect(update.deal_id).toBeNull();
        expect(update.claim).toBe(
            "Cut review time by 30% on M&A docs"
        );
        expect(update.outcome_state).toBe("open");
        expect(update.duration_days).toBe(14);
    });

    it("preserves uuid deal_id on update", () => {
        const update = proofToUpdate(FULL);
        expect(update.deal_id).toBe(FULL.linkedDealId);
    });
});
