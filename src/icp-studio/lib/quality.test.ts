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
        expect(r.label).toBe("ICP quality: too broad");
    });

    it("emits a 'risk' check for each missing required field", () => {
        const r = buildIcpQuality(empty);
        const risks = r.checks.filter((c) => c.tone === "risk");
        const warns = r.checks.filter((c) => c.tone === "warn");
        expect(risks).toHaveLength(7);
        expect(warns).toHaveLength(1);
    });
});

describe("buildIcpQuality — full high-specificity input", () => {
    it("scores >=85 on a highly specific ICP", () => {
        const r = buildIcpQuality(FULL_INPUT);
        expect(r.score).toBeGreaterThanOrEqual(85);
        expect(r.tier).toBe("sharp");
        expect(r.label).toBe("ICP quality: highly specific");
    });

    it("emits no 'risk' checks on high-specificity input", () => {
        const r = buildIcpQuality(FULL_INPUT);
        expect(r.checks.filter((c) => c.tone === "risk")).toHaveLength(0);
    });
});

describe("buildIcpQuality — tier thresholds", () => {
    it("tier 'broad' for score < 50", () => {
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
        const baseline = buildIcpQuality(FULL_INPUT);
        expect(r.score).toBe(baseline.score - 3);
        const sizeCheck = r.checks.find((c) =>
            c.text.includes("enterprise range")
        );
        expect(sizeCheck?.tone).toBe("warn");
    });

    it("geo 'Global' yields warn +4", () => {
        const baseline = buildIcpQuality(FULL_INPUT);
        const r = buildIcpQuality({ ...FULL_INPUT, geo: "Global" });
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
            c.text.includes("primary buyer is still broad") || c.text.includes("primary buyer")
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
        expect(sevenDay.score).toBe(buildIcpQuality(FULL_INPUT).score);
        expect(ninetyDay.score).toBe(
            buildIcpQuality(FULL_INPUT).score - 2
        );
    });

    it("active-accounts < 20 yields warn +4", () => {
        const baseline = buildIcpQuality(FULL_INPUT);
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
            c.text.includes("Founder-led sales coverage")
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
            c.text.includes("first seller")
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
            founder.checks.find((c) => c.text.includes("Founder-led sales coverage"))
        ).toBeUndefined();
        const ae = buildIcpQuality({
            ...FULL_INPUT,
            role: "firstae",
            activeAccounts: 200
        });
        expect(
            ae.checks.find((c) => c.text.includes("first seller"))
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
