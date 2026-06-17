import { describe, expect, it } from "vitest";
import type { Deal } from "@/deal-workspace/lib/deal-shape";
import type { ComputedVitals } from "../../lib/vitals";
import { computeVitalsForAll } from "../../lib/vitals";
import { generateAutopsy } from "../../lib/autopsy";
import { fmtMoney, riskTone, sentenceTitlesFor, toPulling } from "./adapters";

// A real ComputedVitals from the engine (the autopsy generator reads
// computed-only fields like `missing` + `nextStepHasDate`). A stale
// discovery deal with no next step.
function vitals(over: Partial<Deal> = {}): ComputedVitals {
    const deal: Deal = {
        id: "d1",
        accountName: "Apex Manufacturing",
        value: 84000,
        stage: "discovery",
        updated_at: new Date(Date.now() - 42 * 86400000).toISOString(),
        ...over
    } as Deal;
    return computeVitalsForAll([deal])[0]!;
}

describe("fmtMoney", () => {
    it("abbreviates k and M", () => {
        expect(fmtMoney(84000)).toBe("$84k");
        expect(fmtMoney(2_000_000)).toBe("$2.0M");
        expect(fmtMoney(0)).toBe("$0");
    });
});

describe("riskTone", () => {
    it("escalates blue → amber → red with the risk score", () => {
        expect(riskTone(10)).toBe("blue");
        expect(riskTone(50)).toBe("amber");
        expect(riskTone(80)).toBe("red");
    });
});

describe("toPulling", () => {
    it("is absent with no doc", () => {
        expect(toPulling(null)).toBeUndefined();
    });
    it("carries the pinned case's primary corrective route + reasons", () => {
        const doc = generateAutopsy(vitals());
        const p = toPulling(doc);
        expect(p).toBeDefined();
        expect(p!.object).toBe("Apex Manufacturing");
        expect(p!.verb.length).toBeGreaterThan(0);
        expect(p!.href).toContain("/");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });
});

describe("sentenceTitlesFor", () => {
    it("authors a sentence per evidence sheet (not categorical labels)", () => {
        const doc = generateAutopsy(vitals());
        const titles = sentenceTitlesFor(doc);
        // sentence-shaped: ends with a period
        expect(titles.symptom.endsWith(".")).toBe(true);
        expect(titles.underneath.length).toBeGreaterThan(0);
        expect(titles.pattern.length).toBeGreaterThan(0);
        // no-next-step deal → the pattern names the missing dated step
        expect(titles.pattern.toLowerCase()).toContain("next step");
    });
});
