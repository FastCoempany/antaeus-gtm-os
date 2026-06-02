import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    ENABLED_DEFAULT,
    loadPhaseFToggle,
    savePhaseFToggle
} from "./phase-f-toggle";
import type { DataClient } from "@/lib/data-client";

vi.mock("@/lib/observability", () => ({
    reportError: vi.fn(),
    trackEvent: vi.fn()
}));

function mockData(opts: {
    rows?: ReadonlyArray<Record<string, unknown>>;
    listThrows?: boolean;
    updateThrows?: boolean;
}): DataClient {
    const update = vi.fn(async () => {
        if (opts.updateThrows) throw new Error("rls-denied");
        return {};
    });
    return {
        workspaceProfile: {
            list: vi.fn(async () => {
                if (opts.listThrows) throw new Error("network");
                return opts.rows ?? [];
            }),
            update
        }
    } as unknown as DataClient;
}

describe("phase-f-toggle", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── loadPhaseFToggle ──────────────────────────────────────

    it("returns default {enabled:true, hasRow:false} on empty", async () => {
        const out = await loadPhaseFToggle({ data: mockData({ rows: [] }) });
        expect(out).toEqual(ENABLED_DEFAULT);
    });

    it("returns default on failure", async () => {
        const out = await loadPhaseFToggle({
            data: mockData({ listThrows: true })
        });
        expect(out).toEqual(ENABLED_DEFAULT);
    });

    it("reads null as enabled (doctrinal default)", async () => {
        const out = await loadPhaseFToggle({
            data: mockData({
                rows: [
                    {
                        workspace_id: "ws-1",
                        phase_f_proposals_enabled: null
                    }
                ]
            })
        });
        expect(out.enabled).toBe(true);
        expect(out.hasRow).toBe(true);
    });

    it("reads explicit false as disabled", async () => {
        const out = await loadPhaseFToggle({
            data: mockData({
                rows: [
                    {
                        workspace_id: "ws-1",
                        phase_f_proposals_enabled: false
                    }
                ]
            })
        });
        expect(out.enabled).toBe(false);
        expect(out.hasRow).toBe(true);
    });

    it("reads explicit true as enabled", async () => {
        const out = await loadPhaseFToggle({
            data: mockData({
                rows: [
                    {
                        workspace_id: "ws-1",
                        phase_f_proposals_enabled: true
                    }
                ]
            })
        });
        expect(out.enabled).toBe(true);
        expect(out.hasRow).toBe(true);
    });

    // ── savePhaseFToggle ──────────────────────────────────────

    it("returns ok:false when no profile row exists", async () => {
        const result = await savePhaseFToggle(false, {
            data: mockData({ rows: [] })
        });
        expect(result.ok).toBe(false);
        expect(result.error).toContain("Complete onboarding");
    });

    it("calls update with the new value when a row exists", async () => {
        const data = mockData({
            rows: [
                {
                    workspace_id: "ws-42",
                    phase_f_proposals_enabled: true
                }
            ]
        });
        const result = await savePhaseFToggle(false, { data });
        expect(result.ok).toBe(true);
        const updateMock = (data.workspaceProfile.update as unknown) as ReturnType<
            typeof vi.fn
        >;
        expect(updateMock).toHaveBeenCalledWith("ws-42", {
            phase_f_proposals_enabled: false
        });
    });

    it("returns ok:false on update failure", async () => {
        const result = await savePhaseFToggle(false, {
            data: mockData({
                rows: [{ workspace_id: "ws-1", phase_f_proposals_enabled: true }],
                updateThrows: true
            })
        });
        expect(result.ok).toBe(false);
        expect(result.error).toContain("rls-denied");
    });
});
