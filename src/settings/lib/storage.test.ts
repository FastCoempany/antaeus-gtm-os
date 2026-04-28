import { beforeEach, describe, expect, it } from "vitest";
import {
    applyBackup,
    buildBackup,
    clearWorkspace,
    exitDemoMode,
    lastExportAt,
    loadCategory,
    loadDemoState,
    readBackup,
    recordExport,
    saveCategory
} from "./storage";

class FakeStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
    removeItem(k: string): void {
        this.map.delete(k);
    }
    key(i: number): string | null {
        return Array.from(this.map.keys())[i] ?? null;
    }
    get length(): number {
        return this.map.size;
    }
}

describe("loadCategory / saveCategory", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("defaults to cxai when missing", () => {
        expect(loadCategory(s)).toBe("cxai");
    });

    it("reads raw string", () => {
        s.setItem("gtmos_product_category", "legal");
        expect(loadCategory(s)).toBe("legal");
    });

    it("strips JSON-style quotes for legacy compatibility", () => {
        s.setItem("gtmos_product_category", '"revenue"');
        expect(loadCategory(s)).toBe("revenue");
    });

    it("saveCategory writes to storage", () => {
        saveCategory("ai-native", s);
        expect(s.getItem("gtmos_product_category")).toBe("ai-native");
    });
});

describe("loadDemoState / exitDemoMode", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("inactive when nothing stored", () => {
        const d = loadDemoState(s);
        expect(d.active).toBe(false);
        expect(d.seededAt).toBeNull();
        expect(d.scenario).toBeNull();
    });

    it("active when gtmos_demo_active is 1", () => {
        s.setItem("gtmos_demo_active", "1");
        s.setItem("gtmos_demo_scenario", "mm");
        s.setItem("gtmos_demo_seeded_at", "2026-04-28T00:00:00Z");
        const d = loadDemoState(s);
        expect(d.active).toBe(true);
        expect(d.scenario).toBe("mm");
        expect(d.seededAt).toBe("2026-04-28T00:00:00Z");
    });

    it("active when gtmos_demo_active is true", () => {
        s.setItem("gtmos_demo_active", "true");
        expect(loadDemoState(s).active).toBe(true);
    });

    it("exitDemoMode removes all 3 demo keys", () => {
        s.setItem("gtmos_demo_active", "1");
        s.setItem("gtmos_demo_scenario", "ent");
        s.setItem("gtmos_demo_seeded_at", "x");
        exitDemoMode(s);
        expect(s.getItem("gtmos_demo_active")).toBeNull();
        expect(s.getItem("gtmos_demo_scenario")).toBeNull();
        expect(s.getItem("gtmos_demo_seeded_at")).toBeNull();
    });
});

describe("buildBackup", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("captures every gtmos_* key, ignores others", () => {
        s.setItem("gtmos_a", "1");
        s.setItem("gtmos_b", "2");
        s.setItem("non_gtmos", "skip me");
        const snap = buildBackup(new Date("2026-04-28T00:00:00Z"), s);
        expect(Object.keys(snap.data).sort()).toEqual(["gtmos_a", "gtmos_b"]);
        expect(snap.capturedAt).toBe("2026-04-28T00:00:00.000Z");
        expect(snap.source).toBe("antaeus-settings-v2");
    });

    it("returns empty data when storage has no gtmos_ keys", () => {
        s.setItem("ignored", "x");
        const snap = buildBackup(new Date(), s);
        expect(snap.data).toEqual({});
    });
});

describe("applyBackup", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("writes every gtmos_* entry, skips non-gtmos", () => {
        const result = applyBackup(
            {
                capturedAt: "x",
                source: "test",
                data: {
                    gtmos_one: "1",
                    gtmos_two: "2",
                    non_gtmos: "skip"
                }
            },
            s
        );
        expect(result.applied).toBe(2);
        expect(result.skipped).toBe(1);
        expect(s.getItem("gtmos_one")).toBe("1");
        expect(s.getItem("non_gtmos")).toBeNull();
    });

    it("returns error when snapshot is malformed", () => {
        // @ts-expect-error testing the defensive path
        const result = applyBackup({}, s);
        expect(result.error).not.toBeNull();
        expect(result.applied).toBe(0);
    });

    it("skips non-string values", () => {
        const result = applyBackup(
            {
                capturedAt: "x",
                source: "test",
                data: {
                    gtmos_ok: "string",
                    // @ts-expect-error testing defensive path
                    gtmos_obj: { not: "string" }
                }
            },
            s
        );
        expect(result.applied).toBe(1);
        expect(result.skipped).toBe(1);
    });
});

describe("clearWorkspace", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("removes every gtmos_* key, returns count", () => {
        s.setItem("gtmos_a", "1");
        s.setItem("gtmos_b", "2");
        s.setItem("non_gtmos", "stay");
        const removed = clearWorkspace(s);
        expect(removed).toBe(2);
        expect(s.getItem("gtmos_a")).toBeNull();
        expect(s.getItem("non_gtmos")).toBe("stay");
    });
});

describe("recordExport / lastExportAt", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("roundtrips an ISO timestamp", () => {
        recordExport(new Date("2026-04-28T00:00:00Z"), s);
        expect(lastExportAt(s)).toBe("2026-04-28T00:00:00.000Z");
    });

    it("lastExportAt returns null when never recorded", () => {
        expect(lastExportAt(s)).toBeNull();
    });
});

describe("readBackup", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("counts gtmos_* keys + reports lastExportAt", () => {
        s.setItem("gtmos_a", "1");
        s.setItem("gtmos_b", "2");
        recordExport(new Date("2026-04-28T00:00:00Z"), s);
        const r = readBackup(s);
        // gtmos_last_backup_export_at also counts (it's a gtmos_ key).
        expect(r.keyCount).toBe(3);
        expect(r.capturedAt).toBe("2026-04-28T00:00:00.000Z");
    });
});
