import { describe, expect, it } from "vitest";
import {
    buildBuyingGroup,
    buildEvidence,
    buildFocus,
    buildStatement,
    containsBroadLanguage
} from "./builders";

describe("buildStatement", () => {
    const fullInput = {
        industry: "SaaS",
        size: "200-2000 employees",
        geo: "North America",
        buyer: "VP Operations",
        pain: "Manual reconciliation",
        trigger: "Hiring spike",
        proofWindow: "30 days"
    };

    it("returns the empty placeholder when any field is missing", () => {
        const result = buildStatement({ ...fullInput, buyer: "" });
        expect(result.text).toContain("Fill the inputs");
        expect(result.hint).toContain("one owner, one pain");
    });

    it("returns the empty placeholder when fields are whitespace-only", () => {
        const result = buildStatement({ ...fullInput, geo: "   " });
        expect(result.text).toContain("Fill the inputs");
    });

    it("composes the full Thin ICP statement when all 7 inputs are filled", () => {
        const result = buildStatement(fullInput);
        expect(result.text).toContain("SaaS companies");
        expect(result.text).toContain("200-2000 employees");
        expect(result.text).toContain("North America");
        expect(result.text).toContain("VP Operations");
        expect(result.text).toContain("Manual reconciliation");
        // Trigger is lowercased per legacy line 1188
        expect(result.text).toContain("hiring spike");
        expect(result.text).toContain("30 days");
        expect(result.hint).toContain("50 accounts");
    });

    it("lowercases the trigger inside the sentence (legacy parity)", () => {
        const result = buildStatement({
            ...fullInput,
            trigger: "BIG TRIGGER"
        });
        expect(result.text).toContain("big trigger");
        expect(result.text).not.toContain("BIG TRIGGER");
    });
});

describe("buildFocus", () => {
    it("uses explicit activeAccounts when > 0", () => {
        const result = buildFocus("founder", 80);
        expect(result).toContain("80 active accounts");
        expect(result).toContain("ranked top-20");
    });

    it("falls back to founder default with no override", () => {
        const result = buildFocus("founder", 0);
        expect(result).toContain("Founder-led default");
        expect(result).toContain("60-120");
    });

    it("falls back to first AE default with no override", () => {
        const result = buildFocus("firstae", 0);
        expect(result).toContain("First AE default");
        expect(result).toContain("120-220");
    });

    it("treats null / undefined activeAccounts as no override", () => {
        expect(buildFocus("founder", null)).toContain("Founder-led default");
        expect(buildFocus("founder", undefined)).toContain(
            "Founder-led default"
        );
    });

    it("treats negative or zero activeAccounts as no override", () => {
        expect(buildFocus("founder", -1)).toContain("Founder-led default");
        expect(buildFocus("firstae", 0)).toContain("First AE default");
    });
});

describe("buildBuyingGroup", () => {
    it("returns the prompt when buyer is empty", () => {
        const result = buildBuyingGroup("");
        expect(result).toEqual([
            "Select a Primary Buyer to populate buying-group minimum."
        ]);
    });

    it("returns the prompt when buyer is whitespace-only", () => {
        const result = buildBuyingGroup("   ");
        expect(result[0]).toContain("Select a Primary Buyer");
    });

    it("returns the buyer-specific group from the map", () => {
        const result = buildBuyingGroup("CFO");
        expect(result).toContain("CFO (economic buyer)");
        expect(result).toContain("Procurement");
        expect(result).toHaveLength(5);
    });

    it("returns DEFAULT_BUYING_GROUP for unknown buyer", () => {
        const result = buildBuyingGroup("Some Custom Title");
        expect(result).toHaveLength(6);
        expect(result).toContain("Economic buyer (budget owner)");
        expect(result).toContain("Champion (day-to-day operator)");
    });
});

describe("buildEvidence", () => {
    it("returns the prompt when either field is empty", () => {
        expect(buildEvidence("", "Hiring spike / org change")[0]).toContain(
            "Choose a Trigger and Pain"
        );
        expect(buildEvidence("Cost control / spend leakage", "")[0]).toContain(
            "Choose a Trigger and Pain"
        );
    });

    it("returns the no-map fallback for unmapped pain+trigger combo", () => {
        const result = buildEvidence("Custom unknown pain", "Custom unknown trigger");
        expect(result[0]).toContain("No evidence map");
    });

    it("combines trigger + pain evidence with trigger first", () => {
        const result = buildEvidence(
            "Cost control / spend leakage",
            "Hiring spike / org change"
        );
        // Trigger evidence first
        expect(result.indexOf("10+ relevant job posts")).toBeLessThan(
            result.indexOf("Duplicate tools/vendors")
        );
        // Both maps merged
        expect(result).toContain("Duplicate tools/vendors");
        expect(result).toContain("New leader announced");
    });

    it("dedupes overlapping signals across the two maps", () => {
        // Even though the legacy maps don't share entries today, the
        // merge logic must dedupe defensively.
        const result = buildEvidence(
            "Cost control / spend leakage",
            "Hiring spike / org change"
        );
        const seen = new Set<string>();
        for (const item of result) {
            expect(seen.has(item)).toBe(false);
            seen.add(item);
        }
    });
});

describe("containsBroadLanguage", () => {
    it("returns false for null / undefined / empty input", () => {
        expect(containsBroadLanguage(null)).toBe(false);
        expect(containsBroadLanguage(undefined)).toBe(false);
        expect(containsBroadLanguage("")).toBe(false);
        expect(containsBroadLanguage("   ")).toBe(false);
    });

    it("flags vague committee words", () => {
        expect(containsBroadLanguage("the leadership team")).toBe(true);
        expect(containsBroadLanguage("a committee")).toBe(true);
        expect(containsBroadLanguage("various stakeholders")).toBe(true);
        expect(containsBroadLanguage("All buyers")).toBe(true); // case-insensitive
        expect(containsBroadLanguage("Whoever owns it")).toBe(true);
    });

    it("does not flag specific titles", () => {
        expect(containsBroadLanguage("VP Operations")).toBe(false);
        expect(containsBroadLanguage("CFO")).toBe(false);
        expect(containsBroadLanguage("Director of IT")).toBe(false);
    });
});
