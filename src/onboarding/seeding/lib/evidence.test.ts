import { describe, expect, it } from "vitest";
import { EVIDENCE, evidenceFor } from "./evidence";
import { SEEDING_STEPS } from "../state";

describe("seeding evidence registry", () => {
    it("has a note for every step", () => {
        for (const step of SEEDING_STEPS) {
            const ev = evidenceFor(step);
            expect(ev).toBeDefined();
            expect(ev.note.trim().length).toBeGreaterThan(20);
        }
    });

    it("every source (where present) is a real https URL", () => {
        for (const step of SEEDING_STEPS) {
            const src = EVIDENCE[step].source;
            if (src) {
                expect(src.label.length).toBeGreaterThan(0);
                expect(src.url.startsWith("https://")).toBe(true);
            }
        }
    });

    it("the doorway makes a promise, not a citation (no source)", () => {
        expect(EVIDENCE.door.source).toBeNull();
    });

    it("the load-bearing steps carry a citation", () => {
        // ICP, accounts, deals, quota, landing are the asks we must justify
        // with evidence, not assertion (Earned Depth #3).
        for (const step of ["icp", "accounts", "deals", "quota", "landing"] as const) {
            expect(EVIDENCE[step].source).not.toBeNull();
        }
    });

    it("does not smuggle in a fabricated percentage where the source is directional", () => {
        // ICP win-rate percentages floating around the web are blog-grade;
        // the note stays directional rather than citing a number we can't
        // stand behind (the honesty flag from the sourcing pass).
        expect(EVIDENCE.icp.note).not.toMatch(/\d+%/);
    });
});
