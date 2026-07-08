import { describe, expect, it } from "vitest";
import { buildMasthead, buildStanding } from "./cockpit";
import type { ReadinessSummary } from "@/lib/readiness";

function summaryOf(p: Partial<ReadinessSummary>): ReadinessSummary {
    return {
        verdict: "building",
        verdictLabel: "Building",
        totalScore: 40,
        dimensions: [],
        gateBlockers: [],
        nextVerdict: "inheritable_with_guardrails",
        ...p
    } as ReadinessSummary;
}

class FakeStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
}

describe("buildMasthead", () => {
    it("marks the gate ladder relative to the current verdict", () => {
        const m = buildMasthead(summaryOf({ verdict: "building", verdictLabel: "Building" }));
        expect(m.verdictLabel).toBe("Building");
        expect(m.gates).toHaveLength(5);
        expect(m.gates[0]!.state).toBe("done"); // You are the system (rank 1 < 2)
        expect(m.gates[1]!.state).toBe("on"); // Building (rank 2)
        expect(m.gates[2]!.state).toBe("next"); // Inheritable (rank 3)
        expect(m.gates[3]!.state).toBe("todo");
    });

    it("uses the first gate blocker as the next-stage line", () => {
        const m = buildMasthead(
            summaryOf({ gateBlockers: ["Run one pilot that gives a buyer's boss a result."] })
        );
        expect(m.nextStage).toContain("pilot");
    });

    it("composes a grammatical headline for every verdict", () => {
        const base = buildMasthead(
            summaryOf({ verdict: "you_are_the_system", verdictLabel: "You are the system" })
        );
        // never the ungrammatical "You're You are the system."
        expect(base.headlinePre).toBe("Right now,");
        expect(base.headlineEm).toBe("you're the system");
        const building = buildMasthead(summaryOf({ verdict: "building", verdictLabel: "Building" }));
        expect(building.headlinePre).toBe("You're");
        expect(building.headlineEm).toBe("Building");
    });
});

describe("buildStanding", () => {
    it("derives the five doors from the health snapshots", () => {
        const s = new FakeStorage();
        s.setItem(
            "gtmos_deal_workspace_health",
            JSON.stringify({
                pipeline_value: 480000,
                top_pressure: [
                    { title: "Datadog", meta: ["16d"] },
                    { title: "Northwind", meta: ["8d"] }
                ]
            })
        );
        s.setItem(
            "gtmos_signal_room_health",
            JSON.stringify({ topName: "Ramp", topHeat: 88, readyCount: 4 })
        );
        s.setItem("gtmos_founding_gtm_health", JSON.stringify({ readyCount: 2 }));
        const items = buildStanding(s);
        expect(items).toHaveLength(5);
        expect(items[0]!.key).toBe("Deals");
        expect(items[0]!.value).toBe("2 will slip");
        expect(items[0]!.tone).toBe("bad");
        expect(items[1]!.value).toContain("Ramp");
        expect(items[3]!.key).toBe("Dying");
        expect(items[3]!.value).toContain("Datadog");
        expect(items[4]!.value).toBe("2 / 7");
        expect(items[4]!.tone).toBe("warn"); // < 5
        // every door carries continuity params
        for (const it of items) expect(it.href).toContain("returnTo");
    });

    it("degrades to calm defaults on an empty workspace", () => {
        const items = buildStanding(new FakeStorage());
        expect(items).toHaveLength(5);
        expect(items[0]!.value).toBe("Holding");
        expect(items[2]!.value).toBe("Not set");
        expect(items[4]!.value).toBe("0 / 7");
    });
});
