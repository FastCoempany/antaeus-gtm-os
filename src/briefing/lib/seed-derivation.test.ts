import { describe, expect, it } from "vitest";
import { deriveBriefingSeed, type SeedInput } from "./seed-derivation";

function input(overrides: Partial<SeedInput> = {}): SeedInput {
    return {
        profile: null,
        icpRows: [],
        competitorNames: [],
        ...overrides
    };
}

describe("deriveBriefingSeed — commercial profile", () => {
    it("derives the profile when present", () => {
        const seed = deriveBriefingSeed(
            input({
                profile: {
                    product_category: "revenue OS",
                    what_we_sell: "a GTM operating system",
                    value_prop: "inheritable motion"
                }
            })
        );
        expect(seed.commercial_profile).toEqual({
            product_category: "revenue OS",
            what_we_sell: "a GTM operating system",
            value_prop: "inheritable motion"
        });
        expect(seed.profile_health).toBe("ok");
    });

    it("null profile when row absent", () => {
        const seed = deriveBriefingSeed(input({ profile: null }));
        expect(seed.commercial_profile).toBeNull();
        expect(seed.profile_health).toBe("uninitialized");
    });

    it("null profile when all fields empty/whitespace", () => {
        const seed = deriveBriefingSeed(
            input({
                profile: { product_category: "  ", what_we_sell: "", value_prop: null }
            })
        );
        expect(seed.commercial_profile).toBeNull();
        expect(seed.profile_health).toBe("uninitialized");
    });

    it("partial profile keeps the set fields", () => {
        const seed = deriveBriefingSeed(
            input({
                profile: { product_category: "CDP", what_we_sell: null, value_prop: null }
            })
        );
        expect(seed.commercial_profile?.product_category).toBe("CDP");
        expect(seed.commercial_profile?.what_we_sell).toBeNull();
        expect(seed.profile_health).toBe("ok");
    });
});

describe("deriveBriefingSeed — ICP body", () => {
    it("aggregates distinct industries + buyers across rows", () => {
        const seed = deriveBriefingSeed(
            input({
                icpRows: [
                    {
                        industry: "B2B SaaS",
                        primary_buyer: "CRO",
                        statement: null,
                        company_size: null,
                        geography: "North America",
                        pain_point: "handoff confusion"
                    },
                    {
                        industry: "DevTools",
                        primary_buyer: "VP Sales",
                        statement: null,
                        company_size: null,
                        geography: "North America",
                        pain_point: null
                    },
                    {
                        // duplicate industry — should dedup
                        industry: "B2B SaaS",
                        primary_buyer: "CRO",
                        statement: null,
                        company_size: null,
                        geography: null,
                        pain_point: null
                    }
                ]
            })
        );
        expect(seed.icp?.target_industries).toEqual(["B2B SaaS", "DevTools"]);
        expect(seed.icp?.decision_maker_titles).toEqual(["CRO", "VP Sales"]);
        expect(seed.icp?.geographies).toEqual(["North America"]);
        expect(seed.icp?.pains).toEqual(["handoff confusion"]);
        expect(seed.icp_health).toBe("ok");
    });

    it("uses an explicit statement as the summary when present", () => {
        const seed = deriveBriefingSeed(
            input({
                icpRows: [
                    {
                        industry: "B2B SaaS",
                        primary_buyer: "CRO",
                        statement: "Founder-led Series B teams rebuilding their motion",
                        company_size: null,
                        geography: null,
                        pain_point: null
                    }
                ]
            })
        );
        expect(seed.icp?.icp_summary).toBe(
            "Founder-led Series B teams rebuilding their motion"
        );
    });

    it("synthesizes a summary from industry + buyer when no statement", () => {
        const seed = deriveBriefingSeed(
            input({
                icpRows: [
                    {
                        industry: "B2B SaaS",
                        primary_buyer: "CRO",
                        statement: null,
                        company_size: null,
                        geography: null,
                        pain_point: null
                    }
                ]
            })
        );
        expect(seed.icp?.icp_summary).toBe("B2B B2B SaaS selling to CRO");
    });

    it("null icp when no rows have content", () => {
        const seed = deriveBriefingSeed(input({ icpRows: [] }));
        expect(seed.icp).toBeNull();
        expect(seed.icp_health).toBe("uninitialized");
    });

    it("null icp when rows are all-empty", () => {
        const seed = deriveBriefingSeed(
            input({
                icpRows: [
                    {
                        industry: null,
                        primary_buyer: null,
                        statement: null,
                        company_size: null,
                        geography: null,
                        pain_point: null
                    }
                ]
            })
        );
        expect(seed.icp).toBeNull();
    });
});

describe("deriveBriefingSeed — watchlist_companies", () => {
    it("combines competitor names + ICP industries, deduped", () => {
        const seed = deriveBriefingSeed(
            input({
                competitorNames: ["Snowflake", "Databricks"],
                icpRows: [
                    {
                        industry: "Customer data platform",
                        primary_buyer: "CDO",
                        statement: null,
                        company_size: null,
                        geography: null,
                        pain_point: null
                    }
                ]
            })
        );
        expect(seed.watchlist_companies).toEqual([
            "Snowflake",
            "Databricks",
            "Customer data platform"
        ]);
    });

    it("dedupes case-insensitively across competitors + industries", () => {
        const seed = deriveBriefingSeed(
            input({
                competitorNames: ["Segment", "segment"],
                icpRows: [
                    {
                        industry: "Segment",
                        primary_buyer: null,
                        statement: null,
                        company_size: null,
                        geography: null,
                        pain_point: null
                    }
                ]
            })
        );
        expect(seed.watchlist_companies).toEqual(["Segment"]);
    });

    it("empty when no competitors + no industries", () => {
        const seed = deriveBriefingSeed(input());
        expect(seed.watchlist_companies).toEqual([]);
    });

    it("skips empty/whitespace competitor names", () => {
        const seed = deriveBriefingSeed(
            input({ competitorNames: ["", "  ", "Real Co"] })
        );
        expect(seed.watchlist_companies).toEqual(["Real Co"]);
    });
});

describe("deriveBriefingSeed — fully configured workspace", () => {
    it("produces a complete seed (the post-PR-2/3 happy path)", () => {
        const seed = deriveBriefingSeed({
            profile: {
                product_category: "founder-to-first-operator revenue OS",
                what_we_sell: "a GTM operating system",
                value_prop: "make the motion inheritable before scale"
            },
            icpRows: [
                {
                    industry: "B2B SaaS",
                    primary_buyer: "Founder/CEO",
                    statement: "Series A-B founder-led B2B SaaS",
                    company_size: "20-200",
                    geography: "North America",
                    pain_point: "first hire inherits confusion"
                }
            ],
            competitorNames: ["Clari", "Gong", "Apollo"]
        });
        expect(seed.profile_health).toBe("ok");
        expect(seed.icp_health).toBe("ok");
        expect(seed.commercial_profile?.product_category).toContain("revenue OS");
        expect(seed.icp?.target_industries).toEqual(["B2B SaaS"]);
        expect(seed.watchlist_companies).toEqual([
            "Clari",
            "Gong",
            "Apollo",
            "B2B SaaS"
        ]);
    });
});
