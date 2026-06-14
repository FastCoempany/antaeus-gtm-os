import { describe, expect, it } from "vitest";
import { causeOf, isQuiet, scoreOf, toPulling, toZones, toneOf } from "./adapters";
import type { CommandContextSummary, CommandObject } from "../../lib/types";

function obj(over: Partial<CommandObject> = {}): CommandObject {
    return {
        id: "o1",
        title: "Acme Industries",
        objectType: "deal",
        commandFamily: "risk",
        badge: "84",
        badgeTone: "red",
        metricLabel: "risk",
        metricValue: "84",
        meta: [],
        actions: [{ label: "Open the deal", href: "/deal-workspace/", variant: "primary" }],
        sheetKey: "",
        focusObject: "Acme Industries",
        focusRoom: "deal-workspace",
        stateKey: "",
        rankingSignals: null,
        score: 84,
        baseScore: 80,
        stabilityBonus: 0,
        rankingConfidence: 70,
        rankingConfidenceLabel: "lead",
        roomFamilyLabel: "DEAL · RECOVERY",
        scoreReasons: ["Champion quiet for twelve days", "Close date inside the month"],
        truthDebtCount: 0,
        nextStepOverdue: false,
        copy: "Champion quiet for twelve days.",
        ...over
    } as CommandObject;
}

describe("today-surface adapters", () => {
    it("toneOf maps risk → red, advisor → blue, system → neutral", () => {
        expect(toneOf(obj({ commandFamily: "risk" }))).toBe("red");
        expect(toneOf(obj({ commandFamily: "advisor" }))).toBe("blue");
        expect(toneOf(obj({ commandFamily: "system" }))).toBeUndefined();
    });

    it("causeOf prefers copy, falls back to the top reason", () => {
        expect(causeOf(obj())).toBe("Champion quiet for twelve days.");
        expect(causeOf(obj({ copy: "" }))).toBe("Champion quiet for twelve days");
    });

    it("scoreOf rounds the pressure score", () => {
        expect(scoreOf(obj({ score: 83.6 }))).toBe(84);
    });

    it("toPulling draws the one move from the spotlight's primary action", () => {
        const summary = {
            ranked: [obj()],
            spotlight: obj(),
            queue: []
        } as unknown as CommandContextSummary;
        const p = toPulling(summary);
        expect(p?.verb).toBe("Open the deal");
        expect(p?.object).toBe("Acme Industries");
        expect(p?.href).toBe("/deal-workspace/");
        expect(p?.reasons.length).toBe(2);
    });

    it("toPulling is undefined when nothing ranks", () => {
        const summary = {
            ranked: [],
            spotlight: null,
            queue: []
        } as unknown as CommandContextSummary;
        expect(toPulling(summary)).toBeUndefined();
    });

    it("toZones sends overdue objects to GONE QUIET; top live to NOW", () => {
        const ranked = [
            obj({ id: "a", score: 90 }),
            obj({ id: "b", score: 80 }),
            obj({ id: "c", score: 70 }),
            obj({ id: "d", score: 60 }),
            obj({ id: "e", score: 50, nextStepOverdue: true })
        ];
        const z = toZones(ranked, 3);
        expect(z.now.map((o) => o.id)).toEqual(["a", "b", "c"]);
        expect(z.thisWeek.map((o) => o.id)).toEqual(["d"]);
        expect(z.goneQuiet.map((o) => o.id)).toEqual(["e"]);
    });

    it("isQuiet: overdue OR a staleness phrase in the reasons", () => {
        expect(isQuiet(obj({ nextStepOverdue: true }))).toBe(true);
        expect(
            isQuiet(obj({ nextStepOverdue: false, copy: "", scoreReasons: ["Stalled 42 days"] }))
        ).toBe(true);
        expect(
            isQuiet(obj({ nextStepOverdue: false, copy: "Healthy and moving", scoreReasons: ["On track"] }))
        ).toBe(false);
    });
});
