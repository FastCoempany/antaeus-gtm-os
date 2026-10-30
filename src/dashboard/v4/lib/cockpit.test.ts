import { describe, expect, it } from "vitest";
import { buildMasthead, buildStanding } from "./cockpit";
import type { ReadinessSummary } from "@/lib/readiness";

function summaryOf(p: Partial<ReadinessSummary>): ReadinessSummary {
    return {
        verdict: "building",
        verdictLabel: "Partially documented",
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
        const m = buildMasthead(summaryOf({ verdict: "building", verdictLabel: "Partially documented" }));
        expect(m.verdictLabel).toBe("Partially documented");
        expect(m.gates).toHaveLength(5);
        expect(m.gates[0]!.state).toBe("done");
        expect(m.gates[1]!.state).toBe("on");
        expect(m.gates[2]!.state).toBe("next");
        expect(m.gates[3]!.state).toBe("todo");
    });

    it("uses the first gate blocker as the next-stage line", () => {
        const m = buildMasthead(
            summaryOf({ gateBlockers: ["Run one pilot that gives a buyer's boss a result."] })
        );
        expect(m.nextStage).toContain("pilot");
    });

    it("composes an explicit readiness headline for every verdict", () => {
        const base = buildMasthead(
            summaryOf({ verdict: "you_are_the_system", verdictLabel: "Founder-dependent" })
        );
        expect(base.headlinePre).toBe("Current readiness:");
        expect(base.headlineEm).toBe("Founder-dependent");
        const building = buildMasthead(
            summaryOf({ verdict: "building", verdictLabel: "Partially documented" })
        );
        expect(building.headlinePre).toBe("Current readiness:");
        expect(building.headlineEm).toBe("Partially documented");
    });
});

describe("buildStanding", () => {
    it("derives the five doors from the REAL publisher snapshot shapes", () => {
        const s = new FakeStorage();
        s.setItem(
            "gtmos_deal_workspace_health",
            JSON.stringify({
                pipeline_value: 480000,
                top_pressure: [
                    { accountName: "Datadog", stage: "negotiation", score: 90, cause: "16 days from lost" },
                    { accountName: "Northwind", stage: "proposal", score: 70, cause: "drifting" }
                ]
            })
        );
        s.setItem(
            "gtmos_signal_room_health",
            JSON.stringify({ topAccountName: "Ramp", topHeat: 88, readyCount: 4 })
        );
        s.setItem("gtmos_founding_gtm_health", JSON.stringify({ sections_ready: 2 }));
        s.setItem(
            "gtmos_quota_targets",
            JSON.stringify({ monthly_target: 100000, coverage_target: 3.5 })
        );
        const items = buildStanding(s);
        expect(items).toHaveLength(5);
        expect(items[0]!.value).toBe("2 at elevated risk");
        expect(items[0]!.tone).toBe("bad");
        expect(items[1]!.value).toContain("Ramp");
        expect(items[1]!.sub).toContain("4");
        expect(items[2]!.value).toBe("On pace");
        expect(items[2]!.tone).toBe("good");
        expect(items[3]!.value).toBe("Datadog · 16d");
        expect(items[3]!.tone).toBe("bad");
        expect(items[4]!.value).toBe("2 / 7");
        expect(items[4]!.tone).toBe("warn");
        for (const it of items) expect(it.href).toContain("returnTo");
    });

    it("marks Pace behind when pipeline is below coverage", () => {
        const s = new FakeStorage();
        s.setItem("gtmos_deal_workspace_health", JSON.stringify({ pipeline_value: 100000 }));
        s.setItem(
            "gtmos_quota_targets",
            JSON.stringify({ monthly_target: 100000, coverage_target: 3.5 })
        );
        const items = buildStanding(s);
        expect(items[2]!.value).toBe("Below required pace");
        expect(items[2]!.tone).toBe("warn");
    });

    it("degrades to calm defaults on an empty workspace", () => {
        const items = buildStanding(new FakeStorage());
        expect(items).toHaveLength(5);
        expect(items[0]!.value).toBe("No elevated risk");
        expect(items[2]!.value).toBe("Not set");
        expect(items[4]!.value).toBe("0 / 7");
    });
});