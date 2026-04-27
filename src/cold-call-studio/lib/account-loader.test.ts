import { describe, expect, it } from "vitest";
import { loadAccountOptions } from "./account-loader";

class MemStorage {
    private store = new Map<string, string>();
    getItem(k: string): string | null {
        return this.store.has(k) ? (this.store.get(k) ?? null) : null;
    }
    seed(k: string, v: string): void {
        this.store.set(k, v);
    }
}

describe("loadAccountOptions", () => {
    it("returns [] when storage is null", () => {
        expect(loadAccountOptions(null)).toHaveLength(0);
    });

    it("returns [] when key is missing", () => {
        const s = new MemStorage();
        expect(loadAccountOptions(s)).toHaveLength(0);
    });

    it("returns [] when JSON is malformed", () => {
        const s = new MemStorage();
        s.seed("gtmos_sc_v4", "{not json");
        expect(loadAccountOptions(s)).toHaveLength(0);
    });

    it("returns [] when shape is wrong (no accounts array)", () => {
        const s = new MemStorage();
        s.seed("gtmos_sc_v4", JSON.stringify({ accounts: "nope" }));
        expect(loadAccountOptions(s)).toHaveLength(0);
    });

    it("projects valid accounts and ranks by heat desc", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    {
                        id: "1",
                        name: "Beta",
                        heat: 50,
                        signals: [
                            { headline: "Hiring spike at Beta" }
                        ]
                    },
                    {
                        id: "2",
                        name: "Acme",
                        heat: 80,
                        signals: [
                            { headline: "Acme raised Series B" }
                        ]
                    },
                    { id: "3", name: "Gamma", heat: 0 }
                ]
            })
        );
        const out = loadAccountOptions(s);
        expect(out.map((a) => a.name)).toEqual(["Acme", "Beta", "Gamma"]);
        expect(out[0]?.heat).toBe(80);
        expect(out[0]?.topSignal).toContain("Series B");
    });

    it("falls back to legacy `_heat` when `heat` is absent", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    { id: "1", name: "LegacyOnly", _heat: 70 }
                ]
            })
        );
        const out = loadAccountOptions(s);
        expect(out[0]?.heat).toBe(70);
    });

    it("drops rows missing id or name", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    { id: "", name: "NoId", heat: 99 },
                    { id: "good", name: "", heat: 80 },
                    { id: "ok", name: "Acme", heat: 50 },
                    null,
                    "string-row"
                ]
            })
        );
        const out = loadAccountOptions(s);
        expect(out.map((a) => a.name)).toEqual(["Acme"]);
    });

    it("returns empty topSignal when signals[] is missing or empty", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    { id: "1", name: "NoSignals", heat: 30 },
                    { id: "2", name: "EmptyArr", heat: 40, signals: [] }
                ]
            })
        );
        const out = loadAccountOptions(s);
        expect(out[0]?.topSignal).toBe("");
        expect(out[1]?.topSignal).toBe("");
    });
});
