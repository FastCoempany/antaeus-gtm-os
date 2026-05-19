import { describe, expect, it } from "vitest";
import { buildIcpQuality, type QualityInput } from "./quality";

const FULL_INPUT: QualityInput = {
    role: "founder",
    industry: "SaaS",
    size: "200-2000 employees",
    geo: "US",
    buyer: "VP Operations",
    pain: "Manual reconciliation",
    trigger: "Hiring spike / org change",
    proofWindow: "14 days",
    activeAccounts: 80
};

describe("buildIcpQuality — empty input", () => {
    const empty: QualityInput = {
        role: "founder",
        industry: "",
        size: "",
        geo: "",
        buyer: "",
        pain: "",
        trigger: "",
        proofWindow: "",
        activeAccounts: 0
    };

    it("returns score 0 with all fields missing", () => {
        const r = buildIcpQuality(empty);
        expect(r.score).toBe(0);
        expect(r.tier).toBe("broad");
        expect(r.label).toBe("Too broad to trust yet.");
    });

    it("emits a 'risk' check for each missing required field", () => {
        const r = buildIcpQuality(empty);
        // 7 required risk + 1 warn for missing activeAccounts
        const risks = r.checks.filter((c) => c.tone === "risk");
        const warns = r.checks.filter((c) => c.tone === "warn");
        expect(risks).toHaveLength(7);
        expect(warns).toHaveLength(1);
    });
});

describe("buildIcpQuality — full sharp input", () => {
    it("scores >=85 on a sharp ICP (founder, tight geo, 14d proof, 80 accounts)", () => {
        const r = buildIcpQuality(FULL_INPUT);
        expect(r.score).toBeGreaterThanOrEqual(85);
        expect(r.tier).toBe("sharp");
        expect(r.label).toBe("Sharp enough to run.");
    });

    it("emits no 'risk' checks on sharp input", () => {
        const r = buildIcpQuality(FULL_INPUT);
        expect(r.checks.filter((c) => c.tone === "risk")).toHaveLength(0);
    });
});

describe("buildIcpQuality — tier thresholds", () => {
    it("tier 'broad' for score < 50", () => {
        // Only industry + pain (15 + 15 = 30) plus active warn 0
        const input: QualityInput = {
            role: "founder",
            industry: "SaaS",
            size: "",
            geo: "",
            buyer: "",
            pain: "Manual reconciliation",
            trigger: "",
            proofWindow: "",
            activeAccounts: 0
        };
        const r = buildIcpQuality(input);
        expect(r.score).toBe(30);
        expect(r.tier).toBe("broad");
    });

    it("tier 'forming' for 50..69", () => {
        // industry 15 + size 10 + geo 10 + pain 15 + trigger 15 = 65
        const input: QualityInput = {
            role: "founder",
            industry: "SaaS",
            size: "200-2000 employees",
            geo: "US",
            buyer: "",
            pain: "Manual reconciliation",
            trigger: "Hiring spike",
            proofWindow: "",
            activeAccounts: 0
        };
        const r = buildIcpQuality(input);
        expect(r.score).toBe(65);
        expect(r.tier).toBe("forming");
    });

    it("tier 'workable' for 70..84", () => {
        // industry 15 + size 10 + geo 10 + buyer 15 + pain 15 + trigger 15 = 80
        const input: QualityInput = {
            role: "founder",
            industry: "SaaS",
            size: "200-2000 employees",
            geo: "US",
            buyer: "VP Operations",
            pain: "Manual reconciliation",
            trigger: "Hiring spike",
            proofWindow: "",
            activeAccounts: 0
        };
        const r = buildIcpQuality(input);
        expect(r.score).toBe(80);
        expect(r.tier).toBe("workable");
    });
});

describe("buildIcpQuality — per-check arithmetic", () => {
    it("size '5,000+ employees' yields warn +7 instead of good +10", () => {
        const r = buildIcpQuality({
            ...FULL_INPUT,
            size: "5,000+ employees"
        });
        // Expected delta from FULL_INPUT (which has size band good +10):
        // -3 (10 → 7)
        const baseline = buildIcpQuality(FULL_INPUT);
        expect(r.score).toBe(baseline.score - 3);
        const sizeCheck = r.checks.find((c) =>
            c.text.includes("enterprise breadth")
        );
        expect(sizeCheck?.tone).toBe("warn");
    });

    it("geo 'Global' yields warn +4", () => {
        const baseline = buildIcpQuality(FULL_INPUT);
        const r = buildIcpQuality({ ...FULL_INPUT, geo: "Global" });
        // FULL_INPUT geo "US" → good +10; Global → warn +4 = -6
        expect(r.score).toBe(baseline.score - 6);
    });

    it("geo regional ('North America' / 'EMEA' / 'APAC') yields warn +8", () => {
        const baseline = buildIcpQuality(FULL_INPUT);
        for (const geo of ["North America", "EMEA", "APAC"] as const) {
            const r = buildIcpQuality({ ...FULL_INPUT, geo });
            expect(r.score).toBe(baseline.score - 2);
        }
    });

    it("broad-language buyer ('the leadership team') yields warn +8 instead of good +15", () => {
        const baseline = buildIcpQuality(FULL_INPUT);
        const r = buildIcpQuality({
            ...FULL_INPUT,
            buyer: "the leadership team"
        });
        expect(r.score).toBe(baseline.score - 7);
        const buyerCheck = r.checks.find((c) =>
            c.text.includes("Primary buyer still sounds broad")
        );
        expect(buyerCheck?.tone).toBe("warn");
    });

    it("proof '7 days' or '14 days' yields good +10; other values yield good +8", () => {
        const sevenDay = buildIcpQuality({
            ...FULL_INPUT,
            proofWindow: "7 days"
        });
        const ninetyDay = buildIcpQuality({
            ...FULL_INPUT,
            proofWindow: "90 days"
        });
        // 7 days: good +10 (FULL_INPUT uses 14 days = good +10 too)
        expect(sevenDay.score).toBe(buildIcpQuality(FULL_INPUT).score);
        // 90 days: good +8 = -2
        expect(ninetyDay.score).toBe(
            buildIcpQuality(FULL_INPUT).score - 2
        );
    });

    it("active-accounts < 20 yields warn +4", () => {
        const baseline = buildIcpQuality(FULL_INPUT); // 80 active = good +10
        const r = buildIcpQuality({ ...FULL_INPUT, activeAccounts: 10 });
        expect(r.score).toBe(baseline.score - 6);
    });

    it("active-accounts 161-220 yields warn +7", () => {
        const baseline = buildIcpQuality(FULL_INPUT);
        const r = buildIcpQuality({ ...FULL_INPUT, activeAccounts: 200 });
        expect(r.score).toBe(baseline.score - 3);
    });

    it("active-accounts > 220 yields warn +2", () => {
        const baseline = buildIcpQuality(FULL_INPUT);
        const r = buildIcpQuality({ ...FULL_INPUT, activeAccounts: 250 });
        expect(r.score).toBe(baseline.score - 8);
    });

    it("active-accounts = 0 yields warn +0", () => {
        const baseline = buildIcpQuality(FULL_INPUT);
        const r = buildIcpQuality({ ...FULL_INPUT, activeAccounts: 0 });
        expect(r.score).toBe(baseline.score - 10);
    });
});

describe("buildIcpQuality — role-aware overage warnings", () => {
    it("founder-role warning triggers when activeAccounts > 120", () => {
        const r = buildIcpQuality({
            ...FULL_INPUT,
            role: "founder",
            activeAccounts: 150
        });
        const founderWarn = r.checks.find((c) =>
            c.text.includes("Founder-led motion")
        );
        expect(founderWarn).toBeDefined();
    });

    it("first AE warning triggers when activeAccounts > 220", () => {
        const r = buildIcpQuality({
            ...FULL_INPUT,
            role: "firstae",
            activeAccounts: 250
        });
        const aeWarn = r.checks.find((c) =>
            c.text.includes("First AE motion is probably too wide")
        );
        expect(aeWarn?.tone).toBe("risk");
    });

    it("no role-aware warning under threshold", () => {
        const founder = buildIcpQuality({
            ...FULL_INPUT,
            role: "founder",
            activeAccounts: 100
        });
        expect(
            founder.checks.find((c) => c.text.includes("Founder-led motion"))
        ).toBeUndefined();
        const ae = buildIcpQuality({
            ...FULL_INPUT,
            role: "firstae",
            activeAccounts: 200
        });
        expect(
            ae.checks.find((c) => c.text.includes("First AE motion"))
        ).toBeUndefined();
    });
});

describe("buildIcpQuality — score clamping", () => {
    it("clamps score to 0..100", () => {
        const r = buildIcpQuality(FULL_INPUT);
        expect(r.score).toBeLessThanOrEqual(100);
        expect(r.score).toBeGreaterThanOrEqual(0);
    });
});
