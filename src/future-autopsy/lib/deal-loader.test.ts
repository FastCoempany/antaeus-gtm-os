import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEAL_WORKSPACES_KEY, loadDealsFromMirror } from "./deal-loader";

describe("loadDealsFromMirror", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("returns empty array when key is missing", () => {
        expect(loadDealsFromMirror()).toEqual([]);
    });

    it("returns empty array on malformed JSON", () => {
        localStorage.setItem(DEAL_WORKSPACES_KEY, "{not json");
        expect(loadDealsFromMirror()).toEqual([]);
    });

    it("returns empty array when the value is not an array", () => {
        localStorage.setItem(DEAL_WORKSPACES_KEY, JSON.stringify({ deals: [] }));
        expect(loadDealsFromMirror()).toEqual([]);
    });

    it("parses the canonical Phase 4 / Room 1 mirror shape", () => {
        const arr = [
            {
                id: "d-1",
                accountName: "Acme",
                value: 100000,
                stage: "negotiation",
                nextStep: "Send proposal",
                nextStepDate: "2026-05-15",
                champion: "Jane",
                economicBuyer: "Sarah"
            }
        ];
        localStorage.setItem(DEAL_WORKSPACES_KEY, JSON.stringify(arr));
        const out = loadDealsFromMirror();
        expect(out).toHaveLength(1);
        expect(out[0]?.accountName).toBe("Acme");
        expect(out[0]?.value).toBe(100000);
        expect(out[0]?.stage).toBe("negotiation");
        expect(out[0]?.nextStep).toBe("Send proposal");
    });

    it("accepts snake_case field names from legacy data", () => {
        const arr = [
            {
                id: "legacy-1",
                account_name: "Beta",
                deal_value: 50000,
                stage: "evaluation",
                next_steps: "Demo",
                next_step_date: "2026-05-20"
            }
        ];
        localStorage.setItem(DEAL_WORKSPACES_KEY, JSON.stringify(arr));
        const out = loadDealsFromMirror();
        expect(out[0]?.accountName).toBe("Beta");
        expect(out[0]?.value).toBe(50000);
        expect(out[0]?.nextStep).toBe("Demo");
        expect(out[0]?.nextStepDate).toBe("2026-05-20");
    });

    it("filters rows missing required fields", () => {
        localStorage.setItem(
            DEAL_WORKSPACES_KEY,
            JSON.stringify([
                { id: "ok", accountName: "Ok", stage: "discovery", value: 0 },
                { accountName: "no-id" },
                null,
                "string"
            ])
        );
        const out = loadDealsFromMirror();
        expect(out).toHaveLength(1);
        expect(out[0]?.id).toBe("ok");
    });
});
