import { describe, expect, it, vi } from "vitest";
import { hydrateContext } from "./hydrate";
import type {
    ActiveDealsState,
    ICPStudioState,
    ModuleHealth,
    ModuleStateContract
} from "./contracts";

describe("hydrateContext — B.0c shells (everything uninitialized)", () => {
    it("returns a HydratedContext with all nine module slots null", () => {
        const ctx = hydrateContext();
        expect(ctx.icp).toBeNull();
        expect(ctx.discovery).toBeNull();
        expect(ctx.call_planner).toBeNull();
        expect(ctx.outbound).toBeNull();
        expect(ctx.asset_builder).toBeNull();
        expect(ctx.active_deals).toBeNull();
        expect(ctx.watchlist_triggers).toBeNull();
        expect(ctx.voice_document).toBeNull();
        expect(ctx.behavioral_feedback).toBeNull();
    });

    it("records every adapter in modules_read", () => {
        const ctx = hydrateContext();
        const modules = ctx.modules_read.map((m) => m.module).sort();
        expect(modules).toEqual([
            "active_deals",
            "asset_builder",
            "behavioral_feedback",
            "call_planner",
            "discovery_studio",
            "icp_studio",
            "outbound_studio",
            "voice_document",
            "watchlist_triggers"
        ]);
    });

    it("each module_read carries health='uninitialized'", () => {
        const ctx = hydrateContext();
        for (const m of ctx.modules_read) {
            expect(m.health).toBe("uninitialized");
            expect(m.error_message).toBeNull();
        }
    });

    it("empty watchlist_companies when nothing is hydrated", () => {
        const ctx = hydrateContext();
        expect(ctx.watchlist_companies).toEqual([]);
    });

    it("empty pain_lib by default (B.2 wires the global registry)", () => {
        const ctx = hydrateContext();
        expect(ctx.pain_lib).toEqual([]);
    });

    it("honors caller-provided contextId", () => {
        const ctx = hydrateContext({ contextId: "ctx_test_fixed" });
        expect(ctx.context_id).toBe("ctx_test_fixed");
    });

    it("falls back to 'default' userId", () => {
        const ctx = hydrateContext();
        expect(ctx.user_id).toBe("default");
    });

    it("honors caller-provided userId", () => {
        const ctx = hydrateContext({ userId: "user_42" });
        expect(ctx.user_id).toBe("user_42");
    });

    it("honors caller-provided now()", () => {
        const fixed = new Date("2026-05-23T15:00:00Z");
        const ctx = hydrateContext({ now: () => fixed });
        expect(ctx.hydrated_at).toBe("2026-05-23T15:00:00.000Z");
        for (const m of ctx.modules_read) {
            expect(m.read_at).toBe("2026-05-23T15:00:00.000Z");
        }
    });
});

describe("hydrateContext — error tolerance", () => {
    it("a single adapter throwing degrades only that slot to error", async () => {
        // Re-import with the icp-studio adapter mocked to throw.
        vi.resetModules();
        vi.doMock("./adapters/icp-studio", () => ({
            getIcpStudioState: () => {
                throw new Error("simulated icp adapter failure");
            }
        }));

        const { hydrateContext: hydrateFresh } = await import("./hydrate");
        const ctx = hydrateFresh();

        expect(ctx.icp).toBeNull();
        const icpRead = ctx.modules_read.find(
            (m) => m.module === "icp_studio"
        );
        expect(icpRead?.health).toBe("error");
        expect(icpRead?.error_message).toContain(
            "simulated icp adapter failure"
        );

        // Every other adapter should still report uninitialized — they
        // never ran the icp adapter's code path.
        const others = ctx.modules_read.filter(
            (m) => m.module !== "icp_studio"
        );
        for (const m of others) {
            expect(m.health).toBe("uninitialized");
            expect(m.error_message).toBeNull();
        }

        vi.doUnmock("./adapters/icp-studio");
        vi.resetModules();
    });

    it("a non-Error throw still yields a string error_message", async () => {
        vi.resetModules();
        vi.doMock("./adapters/discovery-studio", () => ({
            getDiscoveryStudioState: () => {
                // eslint-disable-next-line no-throw-literal
                throw "string-only failure";
            }
        }));
        const { hydrateContext: hydrateFresh } = await import("./hydrate");
        const ctx = hydrateFresh();
        const discoveryRead = ctx.modules_read.find(
            (m) => m.module === "discovery_studio"
        );
        expect(discoveryRead?.health).toBe("error");
        expect(discoveryRead?.error_message).toBe("string-only failure");
        vi.doUnmock("./adapters/discovery-studio");
        vi.resetModules();
    });

    it("an adapter returning a bogus health value is normalized to 'error'", async () => {
        vi.resetModules();
        vi.doMock("./adapters/call-planner", () => ({
            getCallPlannerState: (): ModuleStateContract<unknown> => ({
                schema_version: "1.0",
                last_modified_at: null,
                health: "exploded" as unknown as ModuleHealth,
                state: null
            })
        }));
        const { hydrateContext: hydrateFresh } = await import("./hydrate");
        const ctx = hydrateFresh();
        const cpRead = ctx.modules_read.find(
            (m) => m.module === "call_planner"
        );
        expect(cpRead?.health).toBe("error");
        vi.doUnmock("./adapters/call-planner");
        vi.resetModules();
    });
});

describe("hydrateContext — watchlist_companies derivation", () => {
    function okDealsContract(
        deals: ActiveDealsState["state"] extends infer T
            ? T extends null
                ? never
                : T
            : never
    ): ActiveDealsState {
        return {
            schema_version: "1.0",
            last_modified_at: "2026-05-23T10:00:00Z",
            health: "ok",
            state: deals
        };
    }

    function okIcpContract(
        icp: ICPStudioState["state"] extends infer T
            ? T extends null
                ? never
                : T
            : never
    ): ICPStudioState {
        return {
            schema_version: "1.0",
            last_modified_at: "2026-05-23T09:00:00Z",
            health: "ok",
            state: icp
        };
    }

    it("collects account names + competitors from active deals", async () => {
        vi.resetModules();
        vi.doMock("./adapters/active-deals", () => ({
            getActiveDealsState: () =>
                okDealsContract({
                    deals: [
                        {
                            deal_id: "dl_001",
                            account_name: "Acme",
                            account_url: null,
                            competitive_set: ["Snowflake", "Databricks"],
                            stage_estimate: "evaluation",
                            watch_for: [],
                            created_at: "2026-04-01T00:00:00Z",
                            closes_estimate_at: null,
                            notes: null
                        }
                    ]
                })
        }));
        const { hydrateContext: hydrateFresh } = await import("./hydrate");
        const ctx = hydrateFresh();
        expect(ctx.watchlist_companies).toEqual(
            expect.arrayContaining(["Acme", "Snowflake", "Databricks"])
        );
        expect(ctx.watchlist_companies).toHaveLength(3);
        vi.doUnmock("./adapters/active-deals");
        vi.resetModules();
    });

    it("merges target_industries from ICP into the watchlist", async () => {
        vi.resetModules();
        vi.doMock("./adapters/icp-studio", () => ({
            getIcpStudioState: () =>
                okIcpContract({
                    icp_summary: "B2B SaaS",
                    icp_criteria: [],
                    disqualifiers: [],
                    target_company_size: null,
                    target_revenue_band: null,
                    target_industries: ["B2B SaaS", "DevTools"],
                    target_geographies: [],
                    decision_maker_titles: [],
                    influencer_titles: []
                })
        }));
        const { hydrateContext: hydrateFresh } = await import("./hydrate");
        const ctx = hydrateFresh();
        expect(ctx.watchlist_companies).toEqual(
            expect.arrayContaining(["B2B SaaS", "DevTools"])
        );
        vi.doUnmock("./adapters/icp-studio");
        vi.resetModules();
    });

    it("deduplicates overlapping watchlist entries", async () => {
        vi.resetModules();
        vi.doMock("./adapters/active-deals", () => ({
            getActiveDealsState: () =>
                okDealsContract({
                    deals: [
                        {
                            deal_id: "dl_001",
                            account_name: "Acme",
                            account_url: null,
                            competitive_set: ["Snowflake"],
                            stage_estimate: "evaluation",
                            watch_for: [],
                            created_at: "2026-04-01T00:00:00Z",
                            closes_estimate_at: null,
                            notes: null
                        },
                        {
                            deal_id: "dl_002",
                            account_name: "Beta",
                            account_url: null,
                            competitive_set: ["Snowflake", "Databricks"],
                            stage_estimate: "negotiation",
                            watch_for: [],
                            created_at: "2026-04-15T00:00:00Z",
                            closes_estimate_at: null,
                            notes: null
                        }
                    ]
                })
        }));
        const { hydrateContext: hydrateFresh } = await import("./hydrate");
        const ctx = hydrateFresh();
        const unique = new Set(ctx.watchlist_companies);
        expect(unique.size).toBe(ctx.watchlist_companies.length);
        expect(unique).toContain("Snowflake");
        expect(unique).toContain("Databricks");
        expect(unique).toContain("Acme");
        expect(unique).toContain("Beta");
        vi.doUnmock("./adapters/active-deals");
        vi.resetModules();
    });

    it("skips empty/whitespace entries in the watchlist", async () => {
        vi.resetModules();
        vi.doMock("./adapters/active-deals", () => ({
            getActiveDealsState: () =>
                okDealsContract({
                    deals: [
                        {
                            deal_id: "dl_001",
                            account_name: "  ",
                            account_url: null,
                            competitive_set: ["", "Real Co"],
                            stage_estimate: "evaluation",
                            watch_for: [],
                            created_at: "2026-04-01T00:00:00Z",
                            closes_estimate_at: null,
                            notes: null
                        }
                    ]
                })
        }));
        const { hydrateContext: hydrateFresh } = await import("./hydrate");
        const ctx = hydrateFresh();
        expect(ctx.watchlist_companies).toEqual(["Real Co"]);
        vi.doUnmock("./adapters/active-deals");
        vi.resetModules();
    });
});
