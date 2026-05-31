import { describe, expect, it } from "vitest";
import { ALL_SKILLS, filterSkills, findSkillById } from "./registry";

describe("ALL_SKILLS — registry shape", () => {
    it("ships the five v1 starter skills", () => {
        expect(ALL_SKILLS).toHaveLength(5);
    });

    it("every recipe parsed cleanly (registry would throw at load otherwise)", () => {
        for (const s of ALL_SKILLS) {
            expect(s.id).toBeTruthy();
            expect(s.label).toBeTruthy();
            expect(s.description).toBeTruthy();
            expect(s.body).toBeTruthy();
        }
    });

    it("every skill id is unique", () => {
        const ids = ALL_SKILLS.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("every skill id follows the canon — lowercase + hyphenated", () => {
        for (const s of ALL_SKILLS) {
            expect(s.id).toMatch(/^[a-z][a-z0-9-]+$/);
        }
    });

    it("includes each named v1 starter skill", () => {
        const ids = new Set(ALL_SKILLS.map((s) => s.id));
        expect(ids.has("triage-week-reads")).toBe(true);
        expect(ids.has("prep-next-call")).toBe(true);
        expect(ids.has("whats-at-risk")).toBe(true);
        expect(ids.has("cast-proof-for-hottest-deal")).toBe(true);
        expect(ids.has("compose-this-weeks-outbound")).toBe(true);
    });
});

describe("filterSkills", () => {
    it("empty query returns the full registry", () => {
        expect(filterSkills("")).toHaveLength(ALL_SKILLS.length);
        expect(filterSkills("   ")).toHaveLength(ALL_SKILLS.length);
    });

    it("filters by label substring", () => {
        const out = filterSkills("triage");
        expect(out.length).toBeGreaterThanOrEqual(1);
        expect(out[0]!.id).toBe("triage-week-reads");
    });

    it("filters by keyword", () => {
        const out = filterSkills("stalled");
        expect(out.length).toBeGreaterThanOrEqual(1);
        expect(out.some((s) => s.id === "whats-at-risk")).toBe(true);
    });

    it("filters by description substring", () => {
        const out = filterSkills("hottest account");
        expect(out.length).toBeGreaterThanOrEqual(1);
    });

    it("case-insensitive", () => {
        const upper = filterSkills("TRIAGE");
        const lower = filterSkills("triage");
        expect(upper.length).toBe(lower.length);
    });
});

describe("findSkillById", () => {
    it("returns the skill when id matches", () => {
        expect(findSkillById("triage-week-reads")?.label).toBe(
            "Triage the week's reads"
        );
    });
    it("returns null for unknown id", () => {
        expect(findSkillById("nope")).toBeNull();
    });
});
