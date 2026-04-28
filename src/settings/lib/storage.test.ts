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

class FakeSession {
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
}

describe("loadDemoState / exitDemoMode", () => {
    let s: FakeStorage;
    let session: FakeSession;
    beforeEach(() => {
        s = new FakeStorage();
        session = new FakeSession();
    });

    it("inactive when sessionStorage gtmos_env_mode is missing", () => {
        const d = loadDemoState({ storage: s, session });
        expect(d.active).toBe(false);
        expect(d.seededAt).toBeNull();
        expect(d.scenario).toBeNull();
    });

    it("inactive when env_mode is `prod`", () => {
        session.setItem("gtmos_env_mode", "prod");
        const d = loadDemoState({ storage: s, session });
        expect(d.active).toBe(false);
    });

    it("active when sessionStorage gtmos_env_mode is `demo`", () => {
        session.setItem("gtmos_env_mode", "demo");
        s.setItem("gtmos_demo_scenario", "mm");
        s.setItem("gtmos_demo_seeded_at", "2026-04-28T00:00:00Z");
        const d = loadDemoState({ storage: s, session });
        expect(d.active).toBe(true);
        expect(d.scenario).toBe("mm");
        expect(d.seededAt).toBe("2026-04-28T00:00:00Z");
    });

    it("ignores legacy gtmos_demo_active localStorage key (Wave 1 mistake)", () => {
        // Wave 1 wrote `gtmos_demo_active` to localStorage; nothing in
        // the rest of the app actually wrote that key. Make sure we no
        // longer accidentally pick it up as authoritative — env_mode
        // remains the canonical flag.
        s.setItem("gtmos_demo_active", "1");
        const d = loadDemoState({ storage: s, session });
        expect(d.active).toBe(false);
    });

    it("exitDemoMode removes the env_mode session flag + scenario localStorage", () => {
        session.setItem("gtmos_env_mode", "demo");
        s.setItem("gtmos_demo_scenario", "ent");
        s.setItem("gtmos_demo_seeded_at", "x");
        exitDemoMode({ storage: s, session });
        expect(session.getItem("gtmos_env_mode")).toBeNull();
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

    it("excludes gtmos_demo__-prefixed keys from real-mode backup", () => {
        s.setItem("gtmos_real", "real-value");
        s.setItem("gtmos_demo__gtmos_real", "demo-value");
        s.setItem("gtmos_demo__gtmos_other", "demo-other");
        const snap = buildBackup(new Date(), s);
        // Backup only captures real-mode data; demo namespace is left alone.
        expect(Object.keys(snap.data)).toEqual(["gtmos_real"]);
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

    it("preserves gtmos_demo__-prefixed keys (sibling demo workspace)", () => {
        // Simulates a user in real mode pressing Clear with a sibling
        // demo workspace seeded into localStorage. Without the
        // demo-namespace skip, every demo key would also be deleted.
        s.setItem("gtmos_real", "1");
        s.setItem("gtmos_demo__gtmos_real", "shadow-1");
        s.setItem("gtmos_demo__gtmos_other", "shadow-2");
        const removed = clearWorkspace(s);
        expect(removed).toBe(1);
        expect(s.getItem("gtmos_real")).toBeNull();
        expect(s.getItem("gtmos_demo__gtmos_real")).toBe("shadow-1");
        expect(s.getItem("gtmos_demo__gtmos_other")).toBe("shadow-2");
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
