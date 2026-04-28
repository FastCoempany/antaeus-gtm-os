import { describe, expect, it } from "vitest";
import {
    BUYING_GROUP_MAP,
    DEFAULT_BUYING_GROUP,
    findTemplate,
    ICP_TEMPLATES,
    PAIN_EVIDENCE_MAP,
    TRIGGER_EVIDENCE_MAP
} from "./data";

describe("BUYING_GROUP_MAP", () => {
    it("contains the 7 canonical buyers", () => {
        expect(Object.keys(BUYING_GROUP_MAP)).toEqual([
            "CFO",
            "COO",
            "VP Operations",
            "Head of Procurement",
            "CHRO / Head of People",
            "VP Revenue Operations",
            "CISO / Security"
        ]);
    });

    it("each buyer maps to a 5-row group", () => {
        for (const rows of Object.values(BUYING_GROUP_MAP)) {
            expect(rows).toHaveLength(5);
        }
    });
});

describe("DEFAULT_BUYING_GROUP", () => {
    it("is a 6-row default fallback", () => {
        expect(DEFAULT_BUYING_GROUP).toHaveLength(6);
        expect(DEFAULT_BUYING_GROUP[0]).toContain("Economic buyer");
    });
});

describe("TRIGGER_EVIDENCE_MAP / PAIN_EVIDENCE_MAP", () => {
    it("each trigger maps to a 4-row evidence list", () => {
        for (const rows of Object.values(TRIGGER_EVIDENCE_MAP)) {
            expect(rows).toHaveLength(4);
        }
    });

    it("each pain maps to a 4-row evidence list", () => {
        for (const rows of Object.values(PAIN_EVIDENCE_MAP)) {
            expect(rows).toHaveLength(4);
        }
    });

    it("contains 6 triggers + 6 pains (legacy parity)", () => {
        expect(Object.keys(TRIGGER_EVIDENCE_MAP)).toHaveLength(6);
        expect(Object.keys(PAIN_EVIDENCE_MAP)).toHaveLength(6);
    });
});

describe("ICP_TEMPLATES", () => {
    it("contains the 5 canonical templates in legacy order", () => {
        expect(ICP_TEMPLATES.map((t) => t.id)).toEqual([
            "mid-market-saas",
            "enterprise-finserv",
            "smb-ecommerce",
            "healthtech",
            "startup-pre-rev"
        ]);
    });

    it("each template has all 9 fields populated", () => {
        for (const t of ICP_TEMPLATES) {
            expect(t.id).toBeTruthy();
            expect(t.name).toBeTruthy();
            expect(t.industry).toBeTruthy();
            expect(t.size).toBeTruthy();
            expect(t.geo).toBeTruthy();
            expect(t.buyer).toBeTruthy();
            expect(t.pain).toBeTruthy();
            expect(t.trigger).toBeTruthy();
            expect(t.proofWindow).toBeTruthy();
            expect(typeof t.activeAccounts).toBe("number");
        }
    });
});

describe("findTemplate", () => {
    it("returns the template by id", () => {
        const t = findTemplate("healthtech");
        expect(t?.name).toContain("Healthcare");
    });

    it("returns null for unknown id", () => {
        expect(findTemplate("ghost")).toBeNull();
        expect(findTemplate("")).toBeNull();
    });
});
