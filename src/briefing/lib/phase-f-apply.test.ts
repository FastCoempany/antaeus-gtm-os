import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyAcceptedProposal } from "./phase-f-apply";
import type { DataClient } from "@/lib/data-client";

vi.mock("@/lib/observability", () => ({
    reportError: vi.fn(),
    trackEvent: vi.fn()
}));

function mockData(opts: {
    proposal?: Record<string, unknown> | null;
    skillExisting?: Array<Record<string, unknown>>;
    skillInsertThrows?: boolean;
    skillUpdateThrows?: boolean;
    variantExisting?: Array<Record<string, unknown>>;
    variantInsertThrows?: boolean;
}): {
    data: DataClient;
    skillInsert: ReturnType<typeof vi.fn>;
    skillUpdate: ReturnType<typeof vi.fn>;
    variantInsert: ReturnType<typeof vi.fn>;
    variantUpdate: ReturnType<typeof vi.fn>;
} {
    const skillInsert = vi.fn(async () => {
        if (opts.skillInsertThrows) throw new Error("insert-failed");
        return { id: "new-override" };
    });
    const skillUpdate = vi.fn(async () => {
        if (opts.skillUpdateThrows) throw new Error("update-failed");
        return {};
    });
    const variantInsert = vi.fn(async () => {
        if (opts.variantInsertThrows) throw new Error("insert-failed");
        return { id: "new-variant" };
    });
    const variantUpdate = vi.fn(async () => ({}));

    const data = {
        proposedModifications: {
            get: vi.fn(async () => opts.proposal ?? null)
        },
        workspaceSkillOverrides: {
            list: vi.fn(async () => opts.skillExisting ?? []),
            insert: skillInsert,
            update: skillUpdate
        },
        activeObservationVariants: {
            list: vi.fn(async () => opts.variantExisting ?? []),
            insert: variantInsert,
            update: variantUpdate
        }
    } as unknown as DataClient;

    return { data, skillInsert, skillUpdate, variantInsert, variantUpdate };
}

describe("phase-f-apply", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 'Proposal not found' when the row is missing", async () => {
        const { data } = mockData({ proposal: null });
        const r = await applyAcceptedProposal("p1", { data });
        expect(r.ok).toBe(false);
        expect(r.error).toContain("not found");
    });

    it("returns error on unknown kind", async () => {
        const { data } = mockData({
            proposal: {
                id: "p1",
                kind: "exotic",
                payload: {},
                workspace_id: "ws-1"
            }
        });
        const r = await applyAcceptedProposal("p1", { data });
        expect(r.ok).toBe(false);
        expect(r.error).toContain("Unknown");
    });

    // ── Lane 1: skill_default ────────────────────────────────

    it("Lane 1 inserts when no existing override + ok:true", async () => {
        const { data, skillInsert } = mockData({
            proposal: {
                id: "p1",
                kind: "skill_default",
                payload: {
                    skill_id: "whats-at-risk",
                    params: { stage: "negotiation" }
                },
                workspace_id: "ws-1"
            },
            skillExisting: []
        });
        const r = await applyAcceptedProposal("p1", { data });
        expect(r.ok).toBe(true);
        expect(skillInsert).toHaveBeenCalledWith({
            skill_id: "whats-at-risk",
            params: { stage: "negotiation" },
            accepted_proposal_id: "p1"
        });
    });

    it("Lane 1 updates when an override already exists (replace semantics)", async () => {
        const { data, skillUpdate, skillInsert } = mockData({
            proposal: {
                id: "p2",
                kind: "skill_default",
                payload: {
                    skill_id: "whats-at-risk",
                    params: { stage: "verbal-yes" }
                },
                workspace_id: "ws-1"
            },
            skillExisting: [{ id: "existing-override-id" }]
        });
        const r = await applyAcceptedProposal("p2", { data });
        expect(r.ok).toBe(true);
        expect(skillUpdate).toHaveBeenCalledWith(
            "existing-override-id",
            expect.objectContaining({
                params: { stage: "verbal-yes" },
                accepted_proposal_id: "p2"
            })
        );
        expect(skillInsert).not.toHaveBeenCalled();
    });

    it("Lane 1 surfaces missing skill_id payload", async () => {
        const { data } = mockData({
            proposal: {
                id: "p3",
                kind: "skill_default",
                payload: { params: { stage: "demo" } },
                workspace_id: "ws-1"
            }
        });
        const r = await applyAcceptedProposal("p3", { data });
        expect(r.ok).toBe(false);
        expect(r.error).toContain("skill_id");
    });

    it("Lane 1 surfaces insert errors", async () => {
        const { data } = mockData({
            proposal: {
                id: "p4",
                kind: "skill_default",
                payload: {
                    skill_id: "whats-at-risk",
                    params: { stage: "negotiation" }
                },
                workspace_id: "ws-1"
            },
            skillExisting: [],
            skillInsertThrows: true
        });
        const r = await applyAcceptedProposal("p4", { data });
        expect(r.ok).toBe(false);
        expect(r.error).toContain("insert-failed");
    });

    // ── Lane 2: observation_generator ────────────────────────

    it("Lane 2 inserts a new active variant on first accept", async () => {
        const { data, variantInsert } = mockData({
            proposal: {
                id: "p5",
                kind: "observation_generator",
                payload: {
                    generator_id: "deal_decay",
                    variant_name: "weekly_focus_deal_workspace",
                    filter: { room: "deal-workspace" }
                },
                workspace_id: "ws-1"
            },
            variantExisting: []
        });
        const r = await applyAcceptedProposal("p5", { data });
        expect(r.ok).toBe(true);
        expect(variantInsert).toHaveBeenCalledWith({
            base_generator_id: "deal_decay",
            variant_name: "weekly_focus_deal_workspace",
            filter: { room: "deal-workspace" },
            accepted_proposal_id: "p5"
        });
    });

    it("Lane 2 updates an existing variant rather than inserting a duplicate", async () => {
        const { data, variantUpdate, variantInsert } = mockData({
            proposal: {
                id: "p6",
                kind: "observation_generator",
                payload: {
                    generator_id: "deal_decay",
                    variant_name: "weekly_focus_deal_workspace",
                    filter: { room: "deal-workspace", refined: true }
                },
                workspace_id: "ws-1"
            },
            variantExisting: [{ id: "existing-variant-id" }]
        });
        const r = await applyAcceptedProposal("p6", { data });
        expect(r.ok).toBe(true);
        expect(variantUpdate).toHaveBeenCalledWith(
            "existing-variant-id",
            expect.objectContaining({
                filter: { room: "deal-workspace", refined: true },
                accepted_proposal_id: "p6"
            })
        );
        expect(variantInsert).not.toHaveBeenCalled();
    });

    it("Lane 2 surfaces missing variant_name payload", async () => {
        const { data } = mockData({
            proposal: {
                id: "p7",
                kind: "observation_generator",
                payload: { generator_id: "deal_decay", filter: {} },
                workspace_id: "ws-1"
            }
        });
        const r = await applyAcceptedProposal("p7", { data });
        expect(r.ok).toBe(false);
        expect(r.error).toContain("variant_name");
    });
});
