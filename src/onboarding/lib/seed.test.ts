import { beforeEach, describe, expect, it } from "vitest";
import { isOnboardingComplete, seedFromDraft, validate } from "./seed";
import { EMPTY_DRAFT, type OnboardingDraft } from "./types";

class FakeStorage {
    private map = new Map<string, string>();
    getItem(k: string): string | null {
        return this.map.has(k) ? (this.map.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.map.set(k, v);
    }
}

const NOW = 1_730_000_000_000;

function makeDraft(p: Partial<OnboardingDraft>): OnboardingDraft {
    return { ...EMPTY_DRAFT, ...p };
}

describe("seedFromDraft", () => {
    let s: FakeStorage;
    beforeEach(() => {
        s = new FakeStorage();
    });

    it("empty draft seeds nothing meaningful but still records completion", () => {
        const r = seedFromDraft(makeDraft({}), { now: NOW, storage: s });
        expect(r.seeded).toBe(false);
        expect(r.items).toEqual([]);
        expect(s.getItem("gtmos_onboarding_completed_at")).not.toBeNull();
    });

    it("company name + role seeds activation context", () => {
        const r = seedFromDraft(
            makeDraft({ companyName: "Antaeus", role: "founder" }),
            { now: NOW, storage: s }
        );
        expect(r.items).toContain("Activation context");
        const ctx = JSON.parse(s.getItem("gtmos_activation_context") ?? "{}");
        expect(ctx.company).toBe("Antaeus");
        expect(ctx.role).toBe("founder");
        expect(ctx.source).toBe("onboarding-v2");
    });

    it("category writes both context + product_category key", () => {
        seedFromDraft(makeDraft({ category: "legal" }), {
            now: NOW,
            storage: s
        });
        expect(s.getItem("gtmos_product_category")).toBe("legal");
        const ctx = JSON.parse(s.getItem("gtmos_activation_context") ?? "{}");
        expect(ctx.categoryLabel).toBe("Legal AI");
    });

    it("ICP statement seeds gtmos_icp_analytics", () => {
        const r = seedFromDraft(
            makeDraft({
                icpStatement: "Mid-market freight forwarders in EU.",
                icpPain: "Compliance prep is manual."
            }),
            { now: NOW, storage: s }
        );
        expect(r.items).toContain("First ICP");
        const data = JSON.parse(s.getItem("gtmos_icp_analytics") ?? "{}");
        expect(data.icps).toHaveLength(1);
        expect(data.icps[0].statement).toContain("freight forwarders");
        expect(data.icps[0].pain).toContain("Compliance");
    });

    it("first account seeds gtmos_sc_v4 with one signal when provided", () => {
        const r = seedFromDraft(
            makeDraft({
                firstAccountName: "Meridian Logistics",
                firstAccountSignal: "Just announced EU expansion."
            }),
            { now: NOW, storage: s }
        );
        expect(r.items).toContain("First account in Signal Console");
        const sc = JSON.parse(s.getItem("gtmos_sc_v4") ?? "{}");
        expect(sc.accounts).toHaveLength(1);
        expect(sc.accounts[0].name).toBe("Meridian Logistics");
        expect(sc.accounts[0].signals).toHaveLength(1);
        expect(sc.accounts[0].signals[0].headline).toContain("EU expansion");
    });

    it("first account without signal still seeds the account (empty signals[])", () => {
        seedFromDraft(makeDraft({ firstAccountName: "Acme Corp" }), {
            now: NOW,
            storage: s
        });
        const sc = JSON.parse(s.getItem("gtmos_sc_v4") ?? "{}");
        expect(sc.accounts[0].signals).toEqual([]);
    });

    it("annual quota seeds qw_inputs + outbound_seed with band detection", () => {
        const r = seedFromDraft(
            makeDraft({ annualQuota: 1_200_000, avgDealSize: 75_000 }),
            { now: NOW, storage: s }
        );
        expect(r.items).toContain("Quota target seeded");
        const qw = JSON.parse(s.getItem("gtmos_qw_inputs") ?? "{}");
        expect(qw.quota).toBe(1_200_000);
        expect(qw.acv).toBe(75_000);
        const seed = JSON.parse(s.getItem("gtmos_outbound_seed") ?? "{}");
        expect(seed.acv_band).toBe("enterprise");
    });

    it.each([
        [10_000, "small"],
        [50_000, "mid"],
        [150_000, "enterprise"],
        [500_000, "strategic"]
    ])("ACV %i → band %s", (acv, band) => {
        seedFromDraft(makeDraft({ annualQuota: 100_000, avgDealSize: acv }), {
            now: NOW,
            storage: s
        });
        const seed = JSON.parse(s.getItem("gtmos_outbound_seed") ?? "{}");
        expect(seed.acv_band).toBe(band);
    });

    it("isOnboardingComplete reflects the completion marker", () => {
        expect(isOnboardingComplete(s)).toBe(false);
        seedFromDraft(makeDraft({}), { now: NOW, storage: s });
        expect(isOnboardingComplete(s)).toBe(true);
    });

    it("trims whitespace before persisting", () => {
        seedFromDraft(
            makeDraft({
                companyName: "  Antaeus  ",
                icpStatement: "  Mid-market.  "
            }),
            { now: NOW, storage: s }
        );
        const ctx = JSON.parse(s.getItem("gtmos_activation_context") ?? "{}");
        const data = JSON.parse(s.getItem("gtmos_icp_analytics") ?? "{}");
        expect(ctx.company).toBe("Antaeus");
        expect(data.icps[0].statement).toBe("Mid-market.");
    });
});

describe("validate", () => {
    it("empty draft has 2 missing required + nothing seedable", () => {
        const v = validate(EMPTY_DRAFT);
        expect(v.canFinish).toBe(false);
        expect(v.missingRequired).toHaveLength(2);
        expect(v.canSeedAnything).toBe(false);
    });

    it("role + ICP unblocks canFinish", () => {
        const v = validate(
            makeDraft({ role: "founder", icpStatement: "Mid-market." })
        );
        expect(v.canFinish).toBe(true);
        expect(v.missingRequired).toEqual([]);
    });

    it("any single non-empty field allows seedAnything", () => {
        expect(validate(makeDraft({ companyName: "Acme" })).canSeedAnything).toBe(true);
        expect(validate(makeDraft({ role: "operator" })).canSeedAnything).toBe(true);
        expect(validate(makeDraft({ annualQuota: 100 })).canSeedAnything).toBe(true);
    });
});
