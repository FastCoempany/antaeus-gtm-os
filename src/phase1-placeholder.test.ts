import { describe, it, expect } from "vitest";
import { phase1Placeholder } from "./phase1-placeholder";

describe("phase1 placeholder", () => {
    it("exposes the expected foundation metadata", () => {
        expect(phase1Placeholder.status).toBe("Phase 1 foundation active");
        expect(phase1Placeholder.stack).toContain("Preact");
        expect(phase1Placeholder.stack).toContain("TypeScript");
        expect(phase1Placeholder.stack).toContain("Vite");
        expect(phase1Placeholder.adr).toMatch(/^adr-001-/);
    });
});
