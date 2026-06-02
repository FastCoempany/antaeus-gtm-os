import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    decideProposal,
    loadPendingProposals,
    markProposalViewed
} from "./suggestions";
import type { DataClient } from "@/lib/data-client";

vi.mock("@/lib/observability", () => ({
    reportError: vi.fn(),
    trackEvent: vi.fn()
}));

function mockData(opts: {
    rows?: ReadonlyArray<Record<string, unknown>>;
    rowsThrow?: boolean;
    updateThrows?: boolean;
}): DataClient {
    return {
        proposedModifications: {
            list: vi.fn(async () => {
                if (opts.rowsThrow) throw new Error("network");
                return opts.rows ?? [];
            }),
            update: vi.fn(async () => {
                if (opts.updateThrows) throw new Error("rls-denied");
                return {};
            })
        }
    } as unknown as DataClient;
}

describe("briefing / suggestions client", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── loadPendingProposals ──────────────────────────────────

    it("returns [] on empty + on failure", async () => {
        expect(await loadPendingProposals({ data: mockData({ rows: [] }) })).toEqual(
            []
        );
        expect(
            await loadPendingProposals({ data: mockData({ rowsThrow: true }) })
        ).toEqual([]);
    });

    it("parses a well-formed row", async () => {
        const data = mockData({
            rows: [
                {
                    id: "p1",
                    kind: "skill_default",
                    title: "Make whats-at-risk default to negotiation stage?",
                    what_noticed:
                        "You ran the skill 7 times with the same filter.",
                    what_changes: "The recipe default flips to negotiation.",
                    proposed_at: "2026-06-02T10:00:00Z",
                    viewed_at: null
                }
            ]
        });
        const out = await loadPendingProposals({ data });
        expect(out.length).toBe(1);
        expect(out[0]!.kind).toBe("skill_default");
        expect(out[0]!.viewedAt).toBeNull();
    });

    it("drops rows with invalid kind or missing required fields", async () => {
        const data = mockData({
            rows: [
                {
                    id: "p1",
                    kind: "not-a-kind",
                    title: "x",
                    what_noticed: "y",
                    what_changes: "z",
                    proposed_at: "2026-06-02T10:00:00Z"
                },
                {
                    id: "p2",
                    kind: "observation_generator",
                    // missing title
                    what_noticed: "y",
                    what_changes: "z",
                    proposed_at: "2026-06-02T10:00:00Z"
                }
            ]
        });
        expect(await loadPendingProposals({ data })).toEqual([]);
    });

    // ── decideProposal ────────────────────────────────────────

    it("sets cooldown_until on dismiss/snooze, null on accept", async () => {
        const updateMock = vi.fn(async () => ({}));
        const data = {
            proposedModifications: { list: vi.fn(), update: updateMock }
        } as unknown as DataClient;

        const now = Date.parse("2026-06-02T10:00:00Z");

        await decideProposal("p1", "accepted", { data, now });
        expect(updateMock).toHaveBeenLastCalledWith("p1", {
            decision: "accepted",
            decided_at: "2026-06-02T10:00:00.000Z",
            cooldown_until: null
        });

        await decideProposal("p1", "dismissed", { data, now });
        expect(updateMock).toHaveBeenLastCalledWith("p1", {
            decision: "dismissed",
            decided_at: "2026-06-02T10:00:00.000Z",
            // 30 days later.
            cooldown_until: "2026-07-02T10:00:00.000Z"
        });

        await decideProposal("p1", "snoozed", { data, now });
        expect(updateMock).toHaveBeenLastCalledWith("p1", {
            decision: "snoozed",
            decided_at: "2026-06-02T10:00:00.000Z",
            cooldown_until: "2026-07-02T10:00:00.000Z"
        });
    });

    it("returns ok:false + error message on update failure", async () => {
        const data = mockData({ updateThrows: true });
        const result = await decideProposal("p1", "accepted", { data });
        expect(result.ok).toBe(false);
        expect(result.error).toContain("rls-denied");
    });

    // ── markProposalViewed ────────────────────────────────────

    it("markProposalViewed swallows errors", async () => {
        const data = mockData({ updateThrows: true });
        // Should not throw.
        await expect(
            markProposalViewed("p1", { data })
        ).resolves.toBeUndefined();
    });
});
