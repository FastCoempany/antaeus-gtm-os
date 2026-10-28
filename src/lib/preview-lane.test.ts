import { describe, expect, it } from "vitest";
import { isPreviewLane } from "./preview-lane";

describe("isPreviewLane", () => {
    it("reads the preview flag cookie", () => {
        expect(isPreviewLane("a=1; antaeus_mode=preview")).toBe(true);
        expect(isPreviewLane("antaeus_mode=preview; b=2")).toBe(true);
    });
    it("is false otherwise", () => {
        expect(isPreviewLane("")).toBe(false);
        expect(isPreviewLane("antaeus_mode=previewx")).toBe(false);
        expect(isPreviewLane("x_antaeus_mode=preview")).toBe(false);
    });
});
