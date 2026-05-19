import { describe, expect, it } from "vitest";
import { loadFocuses } from "./persistence";
import type { Focus } from "./types";

/**
 * Persistence migration shim test.
 *
 * The 2026-05-19 voice-cleanup renamed Territory Architect's central
 * object from "Thesis" → "Focus" everywhere, including the localStorage
 * key (`gtmos_ta_theses` → `gtmos_ta_focuses`). Existing user data on
 * the legacy key has to migrate cleanly on first load — no silent
 * loss.
 *
 * loadFocuses() reads the canonical key first; if empty, it reads the
 * legacy key, copies the value to the canonical key, and clears the
 * legacy entry so subsequent loads are direct.
 */

class MemStorage {
    private store = new Map<string, string>();
    private removed: string[] = [];

    getItem(k: string): string | null {
        return this.store.has(k) ? (this.store.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.store.set(k, v);
    }
    removeItem(k: string): void {
        this.store.delete(k);
        this.removed.push(k);
    }
    seed(k: string, v: string): void {
        this.store.set(k, v);
    }
    removedKeys(): ReadonlyArray<string> {
        return this.removed;
    }
}

function makeFocus(id: string, title: string): Focus {
    return {
        id,
        title,
        pressure: "",
        segment: "",
        whyUs: "",
        tier: "t1",
        accountIds: [],
        createdAt: "2026-05-19T00:00:00Z",
        updatedAt: "2026-05-19T00:00:00Z"
    };
}

describe("loadFocuses — empty storage", () => {
    it("returns [] when neither key exists", () => {
        const s = new MemStorage();
        expect(loadFocuses(s)).toEqual([]);
    });
});

describe("loadFocuses — canonical key", () => {
    it("reads gtmos_ta_focuses directly", () => {
        const s = new MemStorage();
        const data = [makeFocus("f1", "Procurement consolidation Q2")];
        s.seed("gtmos_ta_focuses", JSON.stringify(data));
        const out = loadFocuses(s);
        expect(out).toHaveLength(1);
        expect(out[0]?.title).toBe("Procurement consolidation Q2");
    });
});

describe("loadFocuses — legacy key migration", () => {
    it("falls back to gtmos_ta_theses when canonical key is empty", () => {
        const s = new MemStorage();
        const legacyData = [makeFocus("f1", "AI compliance push")];
        s.seed("gtmos_ta_theses", JSON.stringify(legacyData));
        const out = loadFocuses(s);
        expect(out).toHaveLength(1);
        expect(out[0]?.title).toBe("AI compliance push");
    });

    it("migrates the legacy data to the canonical key on first read", () => {
        const s = new MemStorage();
        const legacyData = [makeFocus("f1", "Series B operators")];
        s.seed("gtmos_ta_theses", JSON.stringify(legacyData));
        loadFocuses(s);
        expect(s.getItem("gtmos_ta_focuses")).toBe(JSON.stringify(legacyData));
    });

    it("clears the legacy key after migration", () => {
        const s = new MemStorage();
        const legacyData = [makeFocus("f1", "X")];
        s.seed("gtmos_ta_theses", JSON.stringify(legacyData));
        loadFocuses(s);
        expect(s.getItem("gtmos_ta_theses")).toBe(null);
        expect(s.removedKeys()).toContain("gtmos_ta_theses");
    });

    it("prefers the canonical key when both exist (no overwrite)", () => {
        const s = new MemStorage();
        const newData = [makeFocus("f1", "New")];
        const legacyData = [makeFocus("f2", "Old")];
        s.seed("gtmos_ta_focuses", JSON.stringify(newData));
        s.seed("gtmos_ta_theses", JSON.stringify(legacyData));
        const out = loadFocuses(s);
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("f1");
        expect(out[0]?.title).toBe("New");
    });
});

describe("loadFocuses — malformed data", () => {
    it("returns [] on invalid JSON without throwing", () => {
        const s = new MemStorage();
        s.seed("gtmos_ta_focuses", "{not json");
        expect(loadFocuses(s)).toEqual([]);
    });

    it("drops rows missing id or title", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_ta_focuses",
            JSON.stringify([
                makeFocus("f1", "Valid"),
                { id: "f2" }, // no title
                { title: "f3" }, // no id
                makeFocus("f4", "Also valid")
            ])
        );
        const out = loadFocuses(s);
        expect(out).toHaveLength(2);
        expect(out.map((f) => f.id)).toEqual(["f1", "f4"]);
    });
});
