import { describe, expect, it, vi } from "vitest";
import { dispatchSkill } from "./dispatcher";
import type { Skill } from "./types";

function storage(rows: Record<string, unknown>): {
    getItem(key: string): string | null;
} {
    const map = new Map<string, string>(
        Object.entries(rows).map(([k, v]) => [k, JSON.stringify(v)])
    );
    return { getItem: (key) => map.get(key) ?? null };
}

function skill(action: Skill["action"]): Skill {
    return {
        id: "test",
        label: "Test",
        description: "Test the dispatcher.",
        keywords: [],
        body: "",
        action
    };
}

describe("dispatchSkill — route action", () => {
    it("navigates to the static target", async () => {
        const nav = vi.fn();
        const r = await dispatchSkill(
            skill({ kind: "route", target: "/dashboard/" }),
            { navigate: nav }
        );
        expect(r.kind).toBe("navigated");
        if (r.kind !== "navigated") return;
        expect(r.url).toBe("/dashboard/");
        expect(nav).toHaveBeenCalledWith("/dashboard/");
    });
});

describe("dispatchSkill — compose-context-and-route", () => {
    it("injects resolved sources as URL params", async () => {
        const nav = vi.fn();
        const r = await dispatchSkill(
            skill({
                kind: "compose-context-and-route",
                target: "/outbound-studio/",
                sources: [
                    {
                        source: "hottest-signal-console-account",
                        paramName: "account"
                    }
                ]
            }),
            {
                navigate: nav,
                storage: storage({
                    gtmos_sc_v4: {
                        accounts: [{ name: "Hottest", heat: 80 }]
                    }
                })
            }
        );
        expect(r.kind).toBe("navigated");
        if (r.kind !== "navigated") return;
        expect(r.url).toBe("/outbound-studio/?account=Hottest");
    });

    it("skips optional sources that resolve to none", async () => {
        const nav = vi.fn();
        const r = await dispatchSkill(
            skill({
                kind: "compose-context-and-route",
                target: "/dashboard/",
                sources: [
                    {
                        source: "hottest-signal-console-account",
                        paramName: "account",
                        required: false
                    }
                ]
            }),
            { navigate: nav, storage: storage({}) }
        );
        expect(r.kind).toBe("navigated");
        if (r.kind !== "navigated") return;
        expect(r.url).toBe("/dashboard/");
    });

    it("blocks routing when a required source returns none", async () => {
        const nav = vi.fn();
        const r = await dispatchSkill(
            skill({
                kind: "compose-context-and-route",
                target: "/discovery-studio/",
                sources: [
                    {
                        source: "latest-call-planner-agenda",
                        paramName: "account",
                        required: true
                    }
                ]
            }),
            { navigate: nav, storage: storage({}) }
        );
        expect(r.kind).toBe("missing-required-source");
        expect(nav).not.toHaveBeenCalled();
    });

    it("composes multiple sources into a single URL", async () => {
        const nav = vi.fn();
        const r = await dispatchSkill(
            skill({
                kind: "compose-context-and-route",
                target: "/discovery-studio/",
                sources: [
                    {
                        source: "latest-call-planner-agenda",
                        paramName: "account"
                    },
                    {
                        source: "top-pressure-open-deal",
                        paramName: "deal"
                    }
                ]
            }),
            {
                navigate: nav,
                storage: storage({
                    gtmos_discovery_agenda: { accountName: "Acme" },
                    gtmos_deal_workspaces: [
                        { id: "d_top", stage: "negotiation", recovery_rank: 10 }
                    ]
                })
            }
        );
        expect(r.kind).toBe("navigated");
        if (r.kind !== "navigated") return;
        expect(r.url).toContain("account=Acme");
        expect(r.url).toContain("deal=d_top");
    });

    it("URL-encodes resolved values", async () => {
        const nav = vi.fn();
        const r = await dispatchSkill(
            skill({
                kind: "compose-context-and-route",
                target: "/outbound-studio/",
                sources: [
                    {
                        source: "hottest-signal-console-account",
                        paramName: "account"
                    }
                ]
            }),
            {
                navigate: nav,
                storage: storage({
                    gtmos_sc_v4: {
                        accounts: [
                            { name: "Acme & Globex", heat: 80 }
                        ]
                    }
                })
            }
        );
        if (r.kind !== "navigated") throw new Error("not navigated");
        // URLSearchParams encodes & and spaces
        expect(r.url).toContain("Acme+%26+Globex");
    });
});

describe("dispatchSkill — filter-and-route", () => {
    it("passes the resolved list to the target as a comma-joined param", async () => {
        const nav = vi.fn();
        const r = await dispatchSkill(
            skill({
                kind: "filter-and-route",
                target: "/deal-workspace/",
                source: "top-stalled-deals",
                filter: { kind: "passthrough" },
                paramName: "ids",
                limit: 3
            }),
            {
                navigate: nav,
                storage: storage({
                    gtmos_deal_workspaces: [
                        { id: "d_a", stage: "negotiation", recovery_rank: 5 },
                        { id: "d_b", stage: "discovery", recovery_rank: 12 },
                        { id: "d_c", stage: "evaluation", recovery_rank: 8 },
                        { id: "d_d", stage: "negotiation", recovery_rank: 3 }
                    ]
                })
            }
        );
        if (r.kind !== "navigated") throw new Error("not navigated");
        // The order is d_b > d_c > d_a; capped to 3. Commas get encoded.
        expect(r.url).toContain("ids=d_b%2Cd_c%2Cd_a");
    });

    it("returns no-data when the source returns none", async () => {
        const nav = vi.fn();
        const r = await dispatchSkill(
            skill({
                kind: "filter-and-route",
                target: "/deal-workspace/",
                source: "top-stalled-deals",
                filter: { kind: "passthrough" },
                paramName: "ids"
            }),
            { navigate: nav, storage: storage({}) }
        );
        expect(r.kind).toBe("no-data");
        expect(nav).not.toHaveBeenCalled();
    });
});

describe("dispatchSkill — never throws", () => {
    it("returns error result if navigate throws", async () => {
        const r = await dispatchSkill(
            skill({ kind: "route", target: "/dashboard/" }),
            {
                navigate: () => {
                    throw new Error("nav failed");
                }
            }
        );
        expect(r.kind).toBe("error");
        if (r.kind !== "error") return;
        expect(r.error).toBe("nav failed");
    });
});
