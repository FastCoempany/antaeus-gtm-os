import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadAccountOptions } from "./account-loader";

const KEY = "gtmos_sc_v4";

describe("loadAccountOptions", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns empty when key is missing", () => {
        expect(loadAccountOptions()).toEqual([]);
    });

    it("returns empty on malformed JSON", () => {
        localStorage.setItem(KEY, "{not json");
        expect(loadAccountOptions()).toEqual([]);
    });

    it("projects Signal Console accounts to AccountOption shape", () => {
        localStorage.setItem(
            KEY,
            JSON.stringify({
                accounts: [
                    { id: "1", name: "Acme", heat: 80, band: "Active" },
                    { id: "2", name: "Beta", heat: 35, band: "Watch" }
                ]
            })
        );
        const out = loadAccountOptions();
        expect(out).toHaveLength(2);
        expect(out[0]).toMatchObject({
            id: "1",
            name: "Acme",
            heat: 80,
            band: "Active"
        });
    });

    it("filters rows missing id or name", () => {
        localStorage.setItem(
            KEY,
            JSON.stringify({
                accounts: [
                    { id: "ok", name: "Real" },
                    { id: "no-name" },
                    { name: "no-id" },
                    null
                ]
            })
        );
        const out = loadAccountOptions();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("ok");
    });

    it("omits heat/band when missing", () => {
        localStorage.setItem(
            KEY,
            JSON.stringify({ accounts: [{ id: "1", name: "Acme" }] })
        );
        const out = loadAccountOptions();
        expect(out[0]?.heat).toBeUndefined();
        expect(out[0]?.band).toBeUndefined();
    });
});
