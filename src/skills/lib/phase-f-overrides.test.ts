import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSkillOverride } from "./phase-f-overrides";
import type { DataClient } from "@/lib/data-client";

vi.mock("@/lib/observability", () => ({
    reportError: vi.fn(),
    trackEvent: vi.fn()
}));

function mockData(opts: {
    rows?: ReadonlyArray<Record<string, unknown>>;
    rowsThrow?: boolean;
}): DataClient {
    return {
        workspaceSkillOverrides: {
            list: vi.fn(async () => {
                if (opts.rowsThrow) throw new Error("network");
                return opts.rows ?? [];
            })
        }
    } as unknown as DataClient;
}

describe("loadSkillOverride", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns null when no row exists", async () => {
        expect(
            await loadSkillOverride("whats-at-risk", {
                data: mockData({ rows: [] })
            })
        ).toBeNull();
    });

    it("returns null on a network error (defensive)", async () => {
        expect(
            await loadSkillOverride("whats-at-risk", {
                data: mockData({ rowsThrow: true })
            })
        ).toBeNull();
    });

    it("parses params jsonb into the typed shape", async () => {
        const out = await loadSkillOverride("whats-at-risk", {
            data: mockData({
                rows: [
                    {
                        skill_id: "whats-at-risk",
                        params: { stage: "negotiation", priority: "high" }
                    }
                ]
            })
        });
        expect(out).not.toBeNull();
        expect(out!.skillId).toBe("whats-at-risk");
        expect(out!.params).toEqual({
            stage: "negotiation",
            priority: "high"
        });
    });

    it("treats missing params as empty object", async () => {
        const out = await loadSkillOverride("whats-at-risk", {
            data: mockData({
                rows: [{ skill_id: "whats-at-risk", params: null }]
            })
        });
        expect(out!.params).toEqual({});
    });

    it("returns null if the row's skill_id is missing", async () => {
        const out = await loadSkillOverride("whats-at-risk", {
            data: mockData({ rows: [{ params: {} }] })
        });
        expect(out).toBeNull();
    });
});
