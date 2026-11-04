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

    it("the doorway explains the setup without an external claim", () => {
        expect(EVIDENCE.door.source).toBeNull();
    });

    it("states the limits of account assessments and pipeline calculations", () => {
        expect(EVIDENCE.icp.note).toMatch(/verification/i);
        expect(EVIDENCE.wake.note).toMatch(/not confirmed buying intent/i);
        expect(EVIDENCE.quota.note).toMatch(/conversion assumptions/i);
    });

    it("does not present unsourced outcome percentages as a reason to enter inputs", () => {
        for (const { note, source } of Object.values(EVIDENCE)) {
            if (!source) expect(note).not.toMatch(/\d+%/);
        }
    });
});
