import { describe, expect, it } from "vitest";
import type { RecoveryAssessment } from "../../lib/recovery";
import type { Deal } from "../../lib/deal-shape";
import {
    applyFilter,
    fmtMoney,
    laneIcon,
    laneTone,
    toPulling
} from "./adapters";

function deal(over: Partial<Deal> = {}): Deal {
    return {
        id: `d_${Math.random().toString(36).slice(2)}`,
        accountName: "Acme Industries",
        value: 84000,
        stage: "discovery",
        ...over
    } as Deal;
}

function assess(over: Partial<RecoveryAssessment> = {}): RecoveryAssessment {
    return {
        deal: deal(),
        score: 160,
        lane: "critical",
        causes: ["Stalled 42 days"],
        nextMove: "Lock a real next step today.",
        ...over
    };
}

describe("laneTone / laneIcon", () => {
    it("tones the lanes (red critical, amber at-risk, neutral healthy)", () => {
        expect(laneTone("critical")).toBe("red");
        expect(laneTone("at-risk")).toBe("amber");
        expect(laneTone("healthy")).toBeUndefined();
    });
    it("critical wears the at-risk mark; the rest the deal glyph", () => {
        expect(laneIcon("critical")).toBe("at-risk");
        expect(laneIcon("at-risk")).toBe("deal");
        expect(laneIcon("healthy")).toBe("deal");
    });
});

describe("fmtMoney", () => {
    it("abbreviates k and M", () => {
        expect(fmtMoney(84000)).toBe("$84k");
        expect(fmtMoney(1_500_000)).toBe("$1.5M");
        expect(fmtMoney(500)).toBe("$500");
    });
});

describe("toPulling", () => {
    it("is absent on an empty board or an all-healthy board", () => {
        expect(toPulling([])).toBeUndefined();
        expect(toPulling([assess({ lane: "healthy" })])).toBeUndefined();
    });
    it("routes the most-pressured deal to a pre-mortem with its reasons", () => {
        const p = toPulling([assess({ deal: deal({ accountName: "Cascadia" }) })]);
        expect(p?.verb).toBe("Pre-mortem");
        expect(p?.object).toBe("Cascadia");
        expect(p?.href).toContain("/future-autopsy/");
        expect(p?.reasons).toContain("Stalled 42 days");
        expect(p?.reasons).toContain("Lock a real next step today.");
    });
});

describe("applyFilter", () => {
    const ranked = [
        assess({ lane: "critical", causes: ["Stalled 42 days"] }),
        assess({ lane: "at-risk", causes: ["Next step 3 days overdue"] }),
        assess({ lane: "healthy", causes: [] }),
        assess({ lane: "at-risk", causes: ["Closing this quarter"] })
    ];
    it("all returns everything", () => {
        expect(applyFilter(ranked, "all").length).toBe(4);
    });
    it("at-risk drops the healthy lane", () => {
        expect(applyFilter(ranked, "at-risk").every((a) => a.lane !== "healthy")).toBe(true);
        expect(applyFilter(ranked, "at-risk").length).toBe(3);
    });
    it("stalled keys off the staleness cause phrase", () => {
        const r = applyFilter(ranked, "stalled");
        expect(r.length).toBe(1);
        expect(r[0]!.causes[0]).toContain("Stalled");
    });
    it("this-quarter keys off the quarter / overdue cause phrase", () => {
        const r = applyFilter(ranked, "this-quarter");
        expect(r.map((a) => a.causes[0])).toEqual(
            expect.arrayContaining(["Next step 3 days overdue", "Closing this quarter"])
        );
    });
});
