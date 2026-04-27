import { describe, expect, it } from "vitest";
import { syncDeploymentToDeal } from "./sync-back";
import type { Deployment } from "./types";

class MemStorage {
    private store = new Map<string, string>();
    getItem(k: string): string | null {
        return this.store.has(k) ? (this.store.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.store.set(k, v);
    }
    seed(k: string, v: string): void {
        this.store.set(k, v);
    }
}

function makeDep(p: Partial<Deployment>): Deployment {
    return {
        id: p.id ?? "dep-1",
        dealId: p.dealId ?? "deal-1",
        dealName: p.dealName ?? "Acme",
        dealStage: p.dealStage ?? "discovery",
        advisorId: p.advisorId ?? "a-1",
        advisorName: p.advisorName ?? "Sarah Chen",
        momentId: p.momentId ?? "intro",
        momentName: p.momentName ?? "Warm intro",
        ask: p.ask ?? "",
        forwardableNote: p.forwardableNote ?? "",
        outcome: p.outcome ?? "pending",
        notes: p.notes ?? "",
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z",
        outcomeDate: p.outcomeDate ?? null
    };
}

const NOW = Date.parse("2026-04-27T00:00:00Z");

describe("syncDeploymentToDeal", () => {
    it("returns false when no dealId or storage is null", () => {
        expect(
            syncDeploymentToDeal(
                makeDep({ dealId: "" }),
                NOW,
                new MemStorage()
            )
        ).toBe(false);
        expect(
            syncDeploymentToDeal(makeDep({}), NOW, null)
        ).toBe(false);
    });

    it("returns false when storage is empty / no matching deal", () => {
        const s = new MemStorage();
        expect(syncDeploymentToDeal(makeDep({}), NOW, s)).toBe(false);
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([{ id: "other", accountName: "Other" }])
        );
        expect(syncDeploymentToDeal(makeDep({}), NOW, s)).toBe(false);
    });

    it("appends a new advisorHistory entry when one doesn't exist", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([{ id: "deal-1", accountName: "Acme" }])
        );
        const ok = syncDeploymentToDeal(makeDep({}), NOW, s);
        expect(ok).toBe(true);
        const raw = s.getItem("gtmos_deal_workspaces");
        const arr = JSON.parse(raw as string) as Array<{
            advisorHistory: ReadonlyArray<{ id: string; outcome: string }>;
            lastAdvisorMoment: string;
        }>;
        expect(arr[0]?.advisorHistory).toHaveLength(1);
        expect(arr[0]?.advisorHistory[0]?.id).toBe("dep-1");
        expect(arr[0]?.lastAdvisorMoment).toBe("Warm intro");
    });

    it("replaces an existing advisorHistory entry by id (no duplicates)", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([
                {
                    id: "deal-1",
                    accountName: "Acme",
                    advisorHistory: [
                        {
                            id: "dep-1",
                            advisorId: "a-1",
                            advisorName: "Sarah",
                            momentId: "intro",
                            momentName: "Warm intro",
                            outcome: "pending",
                            createdAt: "2026-04-26",
                            outcomeDate: null
                        }
                    ]
                }
            ])
        );
        syncDeploymentToDeal(
            makeDep({ id: "dep-1", outcome: "successful" }),
            NOW,
            s
        );
        const arr = JSON.parse(
            s.getItem("gtmos_deal_workspaces") as string
        ) as Array<{
            advisorHistory: ReadonlyArray<{ id: string; outcome: string }>;
        }>;
        expect(arr[0]?.advisorHistory).toHaveLength(1);
        expect(arr[0]?.advisorHistory[0]?.outcome).toBe("successful");
    });

    it("pending outcome only fills nextStep when currently empty (legacy parity)", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([
                {
                    id: "deal-1",
                    accountName: "Acme",
                    nextStep: "Existing step"
                }
            ])
        );
        syncDeploymentToDeal(makeDep({ outcome: "pending" }), NOW, s);
        const arr = JSON.parse(
            s.getItem("gtmos_deal_workspaces") as string
        ) as Array<{ nextStep: string; nextStepDate: string }>;
        expect(arr[0]?.nextStep).toBe("Existing step");
        // nextStepDate still gets stamped
        expect(arr[0]?.nextStepDate).toBeTruthy();
    });

    it("pending outcome fills default nextStep when empty", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([{ id: "deal-1", accountName: "Acme" }])
        );
        syncDeploymentToDeal(makeDep({ outcome: "pending" }), NOW, s);
        const arr = JSON.parse(
            s.getItem("gtmos_deal_workspaces") as string
        ) as Array<{ nextStep: string }>;
        expect(arr[0]?.nextStep).toContain("Send advisor ask");
    });

    it("engaged + successful set the momentum nextStep", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_deal_workspaces",
            JSON.stringify([{ id: "deal-1", accountName: "Acme" }])
        );
        syncDeploymentToDeal(makeDep({ outcome: "engaged" }), NOW, s);
        let arr = JSON.parse(
            s.getItem("gtmos_deal_workspaces") as string
        ) as Array<{ nextStep: string }>;
        expect(arr[0]?.nextStep).toContain("Convert advisor momentum");
        syncDeploymentToDeal(makeDep({ outcome: "successful" }), NOW, s);
        arr = JSON.parse(
            s.getItem("gtmos_deal_workspaces") as string
        ) as Array<{ nextStep: string }>;
        expect(arr[0]?.nextStep).toContain("Convert advisor momentum");
    });

    it("declined / no_response / hold / reroute set the leverage-path nextStep", () => {
        const s = new MemStorage();
        for (const outcome of [
            "declined",
            "no_response",
            "hold",
            "reroute"
        ] as const) {
            s.seed(
                "gtmos_deal_workspaces",
                JSON.stringify([{ id: "deal-1", accountName: "Acme" }])
            );
            syncDeploymentToDeal(makeDep({ outcome }), NOW, s);
            const arr = JSON.parse(
                s.getItem("gtmos_deal_workspaces") as string
            ) as Array<{ nextStep: string }>;
            expect(arr[0]?.nextStep).toContain("next leverage path");
        }
    });

    it("returns false on hostile JSON", () => {
        const s = new MemStorage();
        s.seed("gtmos_deal_workspaces", "{not json");
        expect(syncDeploymentToDeal(makeDep({}), NOW, s)).toBe(false);
    });
});
