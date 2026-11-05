import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    autoRerunEnabled,
    DEMO_AUTO_RERUN_KEY,
    isDueForRecheck,
    loadAutoRerun,
    saveAutoRerun
} from "./auto-rerun";
import type { DataClient } from "@/lib/data-client";

function memStore(): Pick<Storage, "getItem" | "setItem"> & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

function fakeData(row: Record<string, unknown> | null) {
    const update = vi.fn(async () => ({}));
    const data = {
        workspaceProfile: { list: vi.fn(async () => (row ? [row] : [])), update }
    } as unknown as DataClient;
    return { data, update };
}

describe("auto re-check switch", () => {
    beforeEach(() => {
        autoRerunEnabled.value = null;
    });

    it("is off by default for a real workspace", async () => {
        const { data } = fakeData({ workspace_id: "ws", prospecting_auto_rerun_enabled: false });
        expect(await loadAutoRerun({ demo: false, data })).toBe(false);
        const none = fakeData({ workspace_id: "ws" });
        expect(await loadAutoRerun({ demo: false, data: none.data })).toBe(false);
    });

    it("saves the workspace switch", async () => {
        const { data, update } = fakeData({ workspace_id: "ws", prospecting_auto_rerun_enabled: false });
        const r = await saveAutoRerun(true, { demo: false, data });
        expect(r.ok).toBe(true);
        expect(update).toHaveBeenCalledWith("ws", { prospecting_auto_rerun_enabled: true });
        expect(autoRerunEnabled.value).toBe(true);
    });

    it("rolls back when there is no workspace profile", async () => {
        autoRerunEnabled.value = false;
        const { data } = fakeData(null);
        const r = await saveAutoRerun(true, { demo: false, data });
        expect(r.ok).toBe(false);
        expect(autoRerunEnabled.value).toBe(false);
    });

    it("is on by default in the demo and remembers being turned off", async () => {
        const s = memStore();
        expect(await loadAutoRerun({ demo: true, storage: s })).toBe(true);
        await saveAutoRerun(false, { demo: true, storage: s });
        expect(s.map.get(DEMO_AUTO_RERUN_KEY)).toBe("off");
        expect(await loadAutoRerun({ demo: true, storage: s })).toBe(false);
    });

    it("treats never-checked and week-old searches as due", () => {
        const now = Date.parse("2026-11-05T12:00:00Z");
        expect(isDueForRecheck(undefined, now)).toBe(true);
        expect(isDueForRecheck("2026-10-29T12:00:00Z", now)).toBe(true);
        expect(isDueForRecheck("2026-11-03T12:00:00Z", now)).toBe(false);
    });
});
