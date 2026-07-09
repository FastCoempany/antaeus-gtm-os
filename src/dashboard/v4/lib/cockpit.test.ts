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
    it("derives the five doors from the REAL publisher snapshot shapes", () => {
        const s = new FakeStorage();
        // shapes match the shipped publishers exactly (deal-workspace/
        // signal-console/founding-gtm/quota-workback health-snapshots)
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
        expect(items[0]!.value).toBe("2 will slip");
        expect(items[0]!.tone).toBe("bad");
        // Hottest reads the real topAccountName field
        expect(items[1]!.value).toContain("Ramp");
        expect(items[1]!.sub).toContain("4");
        // Pace: pipeline 480k < 100k×3.5=350k? no → on pace (good)
        expect(items[2]!.value).toBe("On pace");
        expect(items[2]!.tone).toBe("good");
        // Dying reads the real accountName + pulls days from the cause
        expect(items[3]!.value).toBe("Datadog · 16d");
        expect(items[3]!.tone).toBe("bad");
        // Handoff reads the real sections_ready field
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
        // 100k < 350k needed → Behind
        expect(items[2]!.value).toBe("Behind");
        expect(items[2]!.tone).toBe("warn");
    });

    it("degrades to calm defaults on an empty workspace", () => {
        const items = buildStanding(new FakeStorage());
        expect(items).toHaveLength(5);
        expect(items[0]!.value).toBe("Holding");
        expect(items[2]!.value).toBe("Not set");
        expect(items[4]!.value).toBe("0 / 7");
    });
});
