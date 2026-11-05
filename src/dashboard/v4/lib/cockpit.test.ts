import { describe, expect, it } from "vitest";
import { buildMasthead, buildStanding } from "./cockpit";
import type { ReadinessSummary } from "@/lib/readiness";
import { computeHandoffSectionsReady } from "@/founding-gtm/lib/sections-ready";
import { loadSectionsInput } from "@/founding-gtm/lib/cross-room";
import { authorAllSections, countReady } from "@/founding-gtm/lib/sections";
import { heat as computeHeat } from "@/signal-console/lib/heat";
import { loadAccounts } from "@/signal-console/lib/persistence";
import { buildHero } from "@/deal-workspace/v4/lib/views";
import { legacyDealToDeal } from "@/deal-workspace/lib/deal-bridge";
import { isClosed } from "@/deal-workspace/lib/deal-shape";
import { readCoverageStanding } from "@/quota-workback/lib/coverage";

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
        expect(items[2]!.value).toBe("Meets benchmark");
        expect(items[2]!.tone).toBe("good");
        expect(items[3]!.value).toBe("Datadog · 16d");
        expect(items[3]!.tone).toBe("bad");
        // The handoff count is computed live from the workspace (the
        // same way Founding GTM computes it); this fixture has no handoff
        // material, so the stale "2" snapshot is ignored.
        expect(items[4]!.value).toBe("0 / 7");
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
        expect(items[2]!.value).toBe("Below benchmark");
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
describe("buildStanding — numbers agree with the rooms that own them", () => {
    const DAY = 86_400_000;
    const iso = (daysAgo: number): string => new Date(Date.now() - daysAgo * DAY).toISOString();

    function workspace(): FakeStorage {
        const s = new FakeStorage();
        // Stale snapshots that disagree with the real data on purpose.
        s.setItem("gtmos_founding_gtm_health", JSON.stringify({ sections_ready: 7 }));
        s.setItem(
            "gtmos_signal_room_health",
            JSON.stringify({ topAccountName: "Boeing", topHeat: 93, readyCount: 3 })
        );
        s.setItem(
            "gtmos_deal_workspace_health",
            JSON.stringify({ pipeline_value: 1, top_pressure: [{}, {}, {}, {}, {}] })
        );
        s.setItem(
            "gtmos_quota_targets",
            JSON.stringify({ monthly_target: 166667, coverage_target: 3.5, touches_day: 19 })
        );
        s.setItem(
            "gtmos_outbound_seed",
            JSON.stringify({ annual_quota: 2_000_000, avg_deal_size: 280_000, win_rate: 22, touch_to_meeting: 2 })
        );
        s.setItem(
            "gtmos_sc_v4",
            JSON.stringify({
                accounts: [
                    {
                        id: "a1",
                        name: "Boeing",
                        _heat: 93,
                        signals: [
                            { id: "s1", headline: "Hiring ramp", published_date: iso(2), ai: true },
                            { id: "s2", headline: "New CHRO", published_date: iso(40) }
                        ]
                    },
                    { id: "a2", name: "Nordstrom", _heat: 60, signals: [{ id: "s3", published_date: iso(200) }] }
                ]
            })
        );
        s.setItem(
            "gtmos_deal_workspaces",
            JSON.stringify([
                { id: "d1", accountName: "Boeing", value: 480000, stage: "negotiation", updated_at: iso(2), nextStepDate: iso(-3), nextStep: "Security review" },
                { id: "d2", accountName: "Nordstrom", value: 260000, stage: "evaluation", updated_at: iso(21) },
                { id: "d3", accountName: "Uber", value: 180000, stage: "prospect", updated_at: iso(13) },
                { id: "d4", accountName: "Chipotle", value: 300000, stage: "closed-won", updated_at: iso(80) }
            ])
        );
        return s;
    }

    it("shows the same handoff count Founding GTM shows", () => {
        const s = workspace();
        const items = buildStanding(s);
        const roomCount = countReady(authorAllSections(loadSectionsInput({ storage: s }))).ready;
        expect(items[4]!.value).toBe(`${roomCount} / 7`);
        expect(computeHandoffSectionsReady({ storage: s }).ready).toBe(roomCount);
    });

    it("shows the account priority Signal Console computes, not a stored number", () => {
        const s = workspace();
        const items = buildStanding(s);
        const boeing = loadAccounts(s).find((a) => a.name === "Boeing")!;
        const scHeat = computeHeat(boeing);
        expect(scHeat).not.toBe(93);
        expect(items[1]!.value).toBe(`Boeing · ${scHeat}`);
    });

    it("counts deals at elevated risk the way Deal Workspace does", () => {
        const s = workspace();
        const items = buildStanding(s);
        const rows = JSON.parse(s.getItem("gtmos_deal_workspaces")!) as unknown[];
        const active = rows
            .map((r, i) => legacyDealToDeal(r, `legacy_${i}`))
            .filter((d) => !isClosed(d.stage));
        const hero = buildHero(active);
        const expected =
            hero.atRiskCount > 0 ? `${hero.atRiskCount} at elevated risk` : "No elevated risk";
        expect(items[0]!.value).toBe(expected);
        expect(items[0]!.sub).toContain("$920k");
    });

    it("reads quota coverage the way Quota Workback does", () => {
        const s = workspace();
        const items = buildStanding(s);
        const cov = readCoverageStanding(s);
        expect(cov.hasQuota).toBe(true);
        // Same "N× / M×" the Quota Workback room shows.
        expect(items[2]!.value).toBe(`${cov.ratio.toFixed(1)}× / ${cov.targetMultiple}×`);
        // Stage-weighted pipeline is far below $2M × the enterprise benchmark.
        expect(cov.behind).toBe(true);
        expect(items[2]!.tone).toBe("warn");
    });
});
