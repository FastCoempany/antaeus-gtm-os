import { describe, expect, it } from "vitest";
import { MOMENTS, findMoment } from "./moments";

describe("MOMENTS data", () => {
    it("contains exactly 10 moments in canonical order", () => {
        expect(MOMENTS.map((m) => m.id)).toEqual([
            "intro",
            "eb_bridge",
            "poc_stall",
            "procurement",
            "competitor",
            "champion_left",
            "budget_kill",
            "board_decision",
            "reference",
            "renewal"
        ]);
    });

    it("each moment has all five required fields populated", () => {
        for (const m of MOMENTS) {
            expect(m.name.length).toBeGreaterThan(0);
            expect(m.short.length).toBeGreaterThan(0);
            expect(m.ask.length).toBeGreaterThan(0);
            expect(m.proof.length).toBeGreaterThan(0);
            expect(m.advisorLine.length).toBeGreaterThan(0);
            expect(m.outcome.length).toBeGreaterThan(0);
        }
    });

    it("intro and eb_bridge ask templates contain [buyer] + [company] tokens", () => {
        const intro = MOMENTS[0];
        expect(intro?.ask).toContain("[buyer]");
        expect(intro?.ask).toContain("[company]");
        const eb = MOMENTS[1];
        expect(eb?.ask).toContain("[buyer]");
        expect(eb?.ask).toContain("[company]");
    });
});

describe("findMoment", () => {
    it("returns the moment by id", () => {
        expect(findMoment("renewal").name).toContain("Renewal");
    });

    it("falls back to intro when id is unknown", () => {
        expect(findMoment("ghost").id).toBe("intro");
        expect(findMoment(null).id).toBe("intro");
        expect(findMoment(undefined).id).toBe("intro");
    });
});
