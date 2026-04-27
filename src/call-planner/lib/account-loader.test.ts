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
    it("returns [] when storage is null or empty", () => {
        expect(loadAccountOptions(null)).toHaveLength(0);
        expect(loadAccountOptions(new MemStorage())).toHaveLength(0);
    });

    it("returns [] on malformed JSON / wrong shape", () => {
        const a = new MemStorage();
        a.seed("gtmos_sc_v4", "{not json");
        expect(loadAccountOptions(a)).toHaveLength(0);

        const b = new MemStorage();
        b.seed("gtmos_sc_v4", JSON.stringify({ accounts: "nope" }));
        expect(loadAccountOptions(b)).toHaveLength(0);
    });

    it("projects valid accounts with id + name + heat + topSignal", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    {
                        id: "1",
                        name: "Acme",
                        heat: 80,
                        signals: [
                            {
                                headline: "Acme raised Series B",
                                published_date: "2026-04-25"
                            }
                        ]
                    }
                ]
            })
        );
        const out = loadAccountOptions(s);
        expect(out).toHaveLength(1);
        expect(out[0]?.name).toBe("Acme");
        expect(out[0]?.heat).toBe(80);
        expect(out[0]?.topSignal?.headline).toBe("Acme raised Series B");
    });

    it("falls back to legacy `_heat` when `heat` is absent", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({ accounts: [{ id: "1", name: "X", _heat: 70 }] })
        );
        expect(loadAccountOptions(s)[0]?.heat).toBe(70);
    });

    it("respects an explicit `heat: 0` over a stale `_heat`", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    { id: "1", name: "Cold", heat: 0, _heat: 80 },
                    { id: "2", name: "Warm", heat: 50 }
                ]
            })
        );
        const out = loadAccountOptions(s);
        const cold = out.find((a) => a.name === "Cold");
        expect(cold?.heat).toBe(0);
    });

    it("topSignal is null when signals[] is missing or empty", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    { id: "1", name: "NoSignals", heat: 50 },
                    { id: "2", name: "EmptyArr", heat: 50, signals: [] }
                ]
            })
        );
        const out = loadAccountOptions(s);
        expect(out[0]?.topSignal).toBeNull();
        expect(out[1]?.topSignal).toBeNull();
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
        expect(loadAccountOptions(s).map((a) => a.name)).toEqual(["Acme"]);
    });
});
