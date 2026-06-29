import { describe, expect, it } from "vitest";
import { ICP_FORKS, assembleIcp } from "./icp";
import { diagnoseDeal } from "./diagnose";
import { dealsForCoverage } from "../components/QuotaStep";
import { parseAccountEntries, parseAccountNames, roomStage } from "../draft";
import type { SeedDeal } from "../draft";

describe("assembleIcp", () => {
    it("builds the statement from the picks", () => {
        const s = assembleIcp([
            "Heads of Revenue Operations",
            "200–800-person",
            "have outgrown their spreadsheets"
        ]);
        expect(s).toBe(
            "Heads of Revenue Operations at 200–800-person B2B companies that have outgrown their spreadsheets."
        );
    });
    it("returns empty until every fork is answered", () => {
        expect(assembleIcp(["Heads of Revenue Operations"])).toBe("");
        expect(ICP_FORKS).toHaveLength(3);
    });
});

describe("parseAccountNames", () => {
    it("splits lines, trims, drops blanks + dupes (case-insensitive)", () => {
        expect(parseAccountNames("Northwind\n  Apex \n\nNORTHWIND\nCobalt")).toEqual([
            "Northwind",
            "Apex",
            "Cobalt"
        ]);
    });
    it("returns only the valid, normalized values", () => {
        expect(parseAccountNames("apex.com, x, a@b.com, Northwind")).toEqual(["apex.com", "Northwind"]);
    });
});

describe("parseAccountEntries", () => {
    it("splits on newlines, commas, and semicolons", () => {
        const e = parseAccountEntries("apex.com, Northwind Logistics; brightwave.io");
        expect(e.map((x) => x.value)).toEqual(["apex.com", "Northwind Logistics", "brightwave.io"]);
        expect(e.every((x) => x.valid)).toBe(true);
    });
    it("classifies and normalizes domains (strips protocol/www/path, lowercases)", () => {
        const [e] = parseAccountEntries("https://www.Acme.com/careers");
        expect(e).toMatchObject({ kind: "domain", valid: true, value: "acme.com" });
    });
    it("flags emails, too-short, and sentence-like junk with a reason", () => {
        const e = parseAccountEntries("a@b.com\nx\nthis is clearly not a company name at all here");
        expect(e.find((x) => x.raw.includes("@"))?.reason).toMatch(/email/);
        expect(e.find((x) => x.raw === "x")?.reason).toMatch(/short/);
        expect(e.find((x) => x.raw.startsWith("this is"))?.valid).toBe(false);
    });
    it("dedupes by normalized value", () => {
        const e = parseAccountEntries("Apex\napex\nAPEX");
        expect(e).toHaveLength(1);
    });
});

describe("roomStage", () => {
    it("maps 'unsure' to discovery and leaves real stages alone", () => {
        expect(roomStage("unsure")).toBe("discovery");
        expect(roomStage("proposal")).toBe("proposal");
        expect(roomStage("prospect")).toBe("prospect");
    });
});

function deal(p: Partial<SeedDeal>): SeedDeal {
    return {
        id: "d",
        account: "Acme",
        value: 100000,
        stage: "discovery",
        champion: "Champ",
        whoSigns: "CFO",
        stuck: "",
        ...p
    };
}

describe("diagnoseDeal", () => {
    it("flags late-stage with no economic buyer as at risk (red)", () => {
        const d = diagnoseDeal(deal({ stage: "proposal", whoSigns: "" }));
        expect(d.tone).toBe("red");
        expect(d.label).toMatch(/risk/i);
    });
    it("flags late-stage gone silent as at risk", () => {
        const d = diagnoseDeal(deal({ stage: "negotiation", whoSigns: "CFO", stuck: "silent 18 days" }));
        expect(d.tone).toBe("red");
    });
    it("flags single-threaded late as fragile (amber)", () => {
        const d = diagnoseDeal(deal({ stage: "negotiation", stuck: "single-threaded, one contact" }));
        expect(d.tone).toBe("amber");
        expect(d.label).toMatch(/fragile/i);
    });
    it("flags no champion (amber)", () => {
        const d = diagnoseDeal(deal({ stage: "discovery", champion: "" }));
        expect(d.tone).toBe("amber");
    });
    it("a well-qualified live deal reads green", () => {
        const d = diagnoseDeal(deal({ stage: "discovery", champion: "Champ", whoSigns: "CFO", stuck: "scheduling next call" }));
        expect(d.tone).toBe("green");
    });
    it("names a 'not sure yet' stage honestly (amber, stage unclear)", () => {
        const d = diagnoseDeal(deal({ stage: "unsure" }));
        expect(d.tone).toBe("amber");
        expect(d.label).toMatch(/unclear/i);
    });
});

describe("dealsForCoverage", () => {
    it("derives a sensible coverage count from quota math", () => {
        // $1.2M, $50k avg, 90-day cycle → low-twenties, per the 3.5x model.
        const n = dealsForCoverage(1_200_000, 50_000, 90);
        expect(n).toBeGreaterThanOrEqual(15);
        expect(n).toBeLessThanOrEqual(28);
    });
    it("returns 0 when inputs are missing", () => {
        expect(dealsForCoverage(0, 50_000, 90)).toBe(0);
        expect(dealsForCoverage(1_200_000, 0, 90)).toBe(0);
    });
});
