import { describe, it, expect } from "vitest";
import { parseLeadFromRunData } from "./compose-client";

describe("parseLeadFromRunData", () => {
    it("shapes a lead-present run", () => {
        const summary = parseLeadFromRunData("run-1", "2026-05-28T14:00:00Z", {
            compose_lead: "Three EOR competitors are repricing upward.",
            compose_refusal_reason: null,
            compose_cost_usd: 0.004
        });
        expect(summary?.lead).toBe("Three EOR competitors are repricing upward.");
        expect(summary?.refusal_reason).toBeNull();
        expect(summary?.run_id).toBe("run-1");
    });

    it("shapes a refused run (no lead, has reason)", () => {
        const summary = parseLeadFromRunData("run-2", "2026-05-28T14:00:00Z", {
            compose_lead: null,
            compose_refusal_reason: "Zero patterns + zero fires.",
            compose_cost_usd: 0.003
        });
        expect(summary?.lead).toBeNull();
        expect(summary?.refusal_reason).toBe("Zero patterns + zero fires.");
    });

    it("returns null for a pre-B.9a run (no compose fields at all)", () => {
        expect(
            parseLeadFromRunData("run-old", "2026-05-20T14:00:00Z", {
                hydrated_context: { foo: "bar" }
            })
        ).toBeNull();
    });

    it("treats empty-string compose_lead as null", () => {
        const summary = parseLeadFromRunData("run-3", "2026-05-28T14:00:00Z", {
            compose_lead: "   ",
            compose_refusal_reason: null
        });
        // Empty lead AND no refusal → returns null because neither field is set
        expect(summary).toBeNull();
    });

    it("trims whitespace from lead + refusal", () => {
        const summary = parseLeadFromRunData("run-4", "2026-05-28T14:00:00Z", {
            compose_lead: "  Real lead.  ",
            compose_refusal_reason: null
        });
        expect(summary?.lead).toBe("Real lead.");
    });

    it("returns null for non-object data", () => {
        expect(parseLeadFromRunData("run-x", "t", null)).toBeNull();
        expect(parseLeadFromRunData("run-x", "t", "nope")).toBeNull();
        expect(parseLeadFromRunData("run-x", "t", undefined)).toBeNull();
    });
});
