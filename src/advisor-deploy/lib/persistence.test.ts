import { describe, expect, it } from "vitest";
import {
    loadAdvisors,
    loadDeployments,
    saveAdvisors,
    saveDeployments,
    uid
} from "./persistence";
import type { Advisor, Deployment } from "./types";

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

function makeAdvisor(p: Partial<Advisor>): Advisor {
    return {
        id: p.id ?? "a-1",
        name: p.name ?? "Sarah Chen",
        title: p.title ?? "Operator",
        tier: p.tier ?? "t2",
        expertise: p.expertise ?? "",
        equity: p.equity ?? "",
        companies: p.companies ?? [],
        notes: p.notes ?? "",
        relationship: p.relationship ?? "active",
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z"
    };
}

function makeDeployment(p: Partial<Deployment>): Deployment {
    return {
        id: p.id ?? "dep-1",
        dealId: p.dealId ?? "deal-1",
        dealName: p.dealName ?? "Meridian",
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

describe("loadAdvisors", () => {
    it("returns [] when storage is null", () => {
        expect(loadAdvisors(null)).toHaveLength(0);
    });

    it("returns [] when key is missing or malformed", () => {
        const s = new MemStorage();
        expect(loadAdvisors(s)).toHaveLength(0);
        s.seed("gtmos_advisor_registry", "{not json");
        expect(loadAdvisors(s)).toHaveLength(0);
    });

    it("drops rows missing id or name", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_advisor_registry",
            JSON.stringify({
                advisors: [
                    makeAdvisor({ id: "good" }),
                    { ...makeAdvisor({}), id: "" },
                    { ...makeAdvisor({}), name: "" },
                    null
                ]
            })
        );
        expect(loadAdvisors(s).map((a) => a.id)).toEqual(["good"]);
    });

    it("normalizes unknown tier to t2 and unknown relationship to active", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_advisor_registry",
            JSON.stringify({
                advisors: [
                    {
                        ...makeAdvisor({}),
                        tier: "ghost",
                        relationship: "weird"
                    }
                ]
            })
        );
        const out = loadAdvisors(s);
        expect(out[0]?.tier).toBe("t2");
        expect(out[0]?.relationship).toBe("active");
    });

    it("filters non-string entries from companies", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_advisor_registry",
            JSON.stringify({
                advisors: [
                    {
                        ...makeAdvisor({}),
                        companies: ["A", 42, "", null, "B"]
                    }
                ]
            })
        );
        expect(loadAdvisors(s)[0]?.companies).toEqual(["A", "B"]);
    });

    it("round-trips through saveAdvisors", () => {
        const s = new MemStorage();
        const advisors = [
            makeAdvisor({ id: "a", companies: ["Acme"] }),
            makeAdvisor({ id: "b", tier: "t1" })
        ];
        saveAdvisors(advisors, s);
        const out = loadAdvisors(s);
        expect(out.map((a) => a.id)).toEqual(["a", "b"]);
        expect(out[0]?.companies).toEqual(["Acme"]);
        expect(out[1]?.tier).toBe("t1");
    });
});

describe("loadDeployments", () => {
    it("returns [] when storage is null or malformed", () => {
        expect(loadDeployments(null)).toHaveLength(0);
        const s = new MemStorage();
        s.seed("gtmos_advisor_deployments", "{bad");
        expect(loadDeployments(s)).toHaveLength(0);
    });

    it("drops rows missing id", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_advisor_deployments",
            JSON.stringify({
                deployments: [
                    makeDeployment({ id: "good" }),
                    { ...makeDeployment({}), id: "" }
                ]
            })
        );
        expect(loadDeployments(s).map((d) => d.id)).toEqual(["good"]);
    });

    it("normalizes unknown outcome to pending and unknown momentId to intro", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_advisor_deployments",
            JSON.stringify({
                deployments: [
                    {
                        ...makeDeployment({}),
                        outcome: "ghost",
                        momentId: "made-up"
                    }
                ]
            })
        );
        const out = loadDeployments(s);
        expect(out[0]?.outcome).toBe("pending");
        expect(out[0]?.momentId).toBe("intro");
    });

    it("round-trips through saveDeployments preserving the envelope shape", () => {
        const s = new MemStorage();
        saveDeployments([makeDeployment({ id: "1" })], s);
        const raw = s.getItem("gtmos_advisor_deployments");
        const parsed = JSON.parse(raw as string) as { deployments: unknown[] };
        expect(Array.isArray(parsed.deployments)).toBe(true);
        expect(loadDeployments(s).map((d) => d.id)).toEqual(["1"]);
    });
});

describe("uid", () => {
    it("returns a string starting with the prefix and including timestamp", () => {
        const id = uid("dep", 1746000000000);
        expect(id.startsWith("dep_1746000000000_")).toBe(true);
    });

    it("two consecutive ids with same `now` differ in the random suffix", () => {
        const a = uid("adv", 100);
        const b = uid("adv", 100);
        // overwhelmingly unlikely to be equal
        expect(a).not.toBe(b);
    });
});
