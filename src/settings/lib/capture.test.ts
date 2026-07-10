import { describe, it, expect, vi } from "vitest";
import { loadCaptureToken, mintCaptureToken, captureAddress } from "./capture";
import type { DataClient } from "@/lib/data-client";

function clientWith(rows: unknown[], onUpdate?: (id: string, patch: unknown) => void): DataClient {
    return {
        workspaceProfile: {
            list: vi.fn().mockResolvedValue(rows),
            update: vi.fn().mockImplementation((id: string, patch: unknown) => {
                onUpdate?.(id, patch);
                return Promise.resolve({});
            })
        }
    } as unknown as DataClient;
}

describe("capture address", () => {
    it("formats log+token@domain", () => {
        expect(captureAddress("abc123def456", "in.antaeus.app")).toBe("log+abc123def456@in.antaeus.app");
    });

    it("loads an existing token", async () => {
        const c = clientWith([{ workspace_id: "w1", data: { capture_token: "aabbccddeeff" } }]);
        expect(await loadCaptureToken({ data: c })).toEqual({ token: "aabbccddeeff", hasRow: true });
    });

    it("reports no token when the blob lacks one", async () => {
        const c = clientWith([{ workspace_id: "w1", data: {} }]);
        expect(await loadCaptureToken({ data: c })).toEqual({ token: null, hasRow: true });
    });

    it("mint is idempotent — an existing token is returned, never rotated", async () => {
        const updates: unknown[] = [];
        const c = clientWith([{ workspace_id: "w1", data: { capture_token: "aabbccddeeff" } }], (_, p) => updates.push(p));
        const r = await mintCaptureToken({ data: c });
        expect(r.token).toBe("aabbccddeeff");
        expect(updates).toHaveLength(0);
    });

    it("mints into the profile blob without clobbering siblings", async () => {
        let patch: Record<string, unknown> | null = null;
        const c = clientWith([{ workspace_id: "w1", data: { other: "keep" } }], (_, p) => (patch = p as Record<string, unknown>));
        const r = await mintCaptureToken({ data: c });
        expect(r.token).toMatch(/^[0-9a-f]{24}$/);
        const data = (patch as unknown as { data: Record<string, unknown> }).data;
        expect(data["other"]).toBe("keep");
        expect(data["capture_token"]).toBe(r.token);
    });

    it("fails plainly when the profile row is missing", async () => {
        const r = await mintCaptureToken({ data: clientWith([]) });
        expect(r.token).toBeNull();
        expect(r.error).toContain("onboarding");
    });
});
