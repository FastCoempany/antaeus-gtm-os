import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    loadLatestRun,
    triggerDiscovery
} from "./discovery";
import type { DataClient } from "@/lib/data-client";

vi.mock("@/lib/observability", () => ({
    reportError: vi.fn(),
    trackEvent: vi.fn()
}));

const invokeMock = vi.fn();
vi.mock("@/lib/supabase-client", () => ({
    getSupabaseClient: vi.fn(() => ({
        functions: { invoke: invokeMock }
    }))
}));

function mockDataClient(opts: {
    workspaceId?: string | null;
    runs?: ReadonlyArray<Record<string, unknown>>;
    runsThrow?: boolean;
}): DataClient {
    return {
        currentWorkspace: vi.fn(async () =>
            opts.workspaceId
                ? { id: opts.workspaceId, name: "Test workspace" }
                : null
        ),
        outdoorsEventsRuns: {
            list: vi.fn(async () => {
                if (opts.runsThrow) throw new Error("list failed");
                return opts.runs ?? [];
            })
        }
    } as unknown as DataClient;
}

describe("outdoors-events / discovery client", () => {
    beforeEach(() => {
        invokeMock.mockReset();
    });

    // ─── loadLatestRun ──────────────────────────────────────────

    it("loadLatestRun returns null when no runs exist", async () => {
        const data = mockDataClient({ runs: [] });
        expect(await loadLatestRun({ data })).toBeNull();
    });

    it("loadLatestRun parses the most recent row", async () => {
        const data = mockDataClient({
            runs: [
                {
                    id: "r1",
                    status: "completed",
                    started_at: "2026-06-01T10:00:00Z",
                    completed_at: "2026-06-01T10:00:42Z",
                    events_written: 7,
                    total_cost_usd: 0.18,
                    error_summary: null
                }
            ]
        });
        const run = await loadLatestRun({ data });
        expect(run).not.toBeNull();
        expect(run!.id).toBe("r1");
        expect(run!.status).toBe("completed");
        expect(run!.eventsWritten).toBe(7);
        expect(run!.totalCostUsd).toBeCloseTo(0.18);
    });

    it("loadLatestRun coerces unknown status to 'completed' safely", async () => {
        const data = mockDataClient({
            runs: [
                {
                    id: "r1",
                    status: "weird",
                    started_at: "2026-06-01T10:00:00Z",
                    completed_at: null,
                    events_written: 0,
                    total_cost_usd: 0,
                    error_summary: null
                }
            ]
        });
        const run = await loadLatestRun({ data });
        expect(run!.status).toBe("completed");
    });

    it("loadLatestRun returns null on failure (defensive)", async () => {
        const data = mockDataClient({ runsThrow: true });
        expect(await loadLatestRun({ data })).toBeNull();
    });

    // ─── triggerDiscovery ──────────────────────────────────────

    it("triggerDiscovery rejects when no workspace is active", async () => {
        const data = mockDataClient({ workspaceId: null });
        const result = await triggerDiscovery({ data });
        expect(result.ok).toBe(false);
        expect(result.error).toContain("No active workspace");
        // Should never reach the network when there's no workspace.
        expect(invokeMock).not.toHaveBeenCalled();
    });

    it("triggerDiscovery returns ok when the function returns { ok: true }", async () => {
        const data = mockDataClient({ workspaceId: "ws-1" });
        invokeMock.mockResolvedValue({
            data: { ok: true, result: { eventsWritten: 4 } },
            error: null
        });
        const result = await triggerDiscovery({ data });
        expect(result.ok).toBe(true);
        expect(result.error).toBeNull();
        expect(invokeMock).toHaveBeenCalledWith("outdoors-events-discovery", {
            body: { action: "run_one", workspaceId: "ws-1" }
        });
    });

    it("triggerDiscovery surfaces error.message from the function transport", async () => {
        const data = mockDataClient({ workspaceId: "ws-1" });
        invokeMock.mockResolvedValue({
            data: null,
            error: { message: "Function not found" }
        });
        const result = await triggerDiscovery({ data });
        expect(result.ok).toBe(false);
        expect(result.error).toBe("Function not found");
    });

    it("triggerDiscovery surfaces server-reported failure (ok:false payload)", async () => {
        const data = mockDataClient({ workspaceId: "ws-1" });
        invokeMock.mockResolvedValue({
            data: { ok: false, error: "Weekly cost ceiling reached" },
            error: null
        });
        const result = await triggerDiscovery({ data });
        expect(result.ok).toBe(false);
        expect(result.error).toContain("Weekly cost ceiling reached");
    });
});
