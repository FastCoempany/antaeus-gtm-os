import { describe, expect, it } from "vitest";
import { formatDedupeKey } from "./dedupe";

describe("formatDedupeKey", () => {
    it("composes generator + entity coordinates", () => {
        expect(
            formatDedupeKey("phase-b/deal-decay", {
                observationText: "x",
                relatedObjectType: "deal",
                relatedObjectId: "d_1"
            })
        ).toBe("phase-b/deal-decay:deal:d_1");
    });

    it("renders null coordinates as the literal 'null'", () => {
        expect(
            formatDedupeKey("phase-b/proof-staleness", {
                observationText: "x"
            })
        ).toBe("phase-b/proof-staleness:null:null");
    });
});
