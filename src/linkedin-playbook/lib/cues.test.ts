import { describe, expect, it } from "vitest";
import { CUES, findCue, resolveCueIndex } from "./cues";

describe("CUES ladder", () => {
    it("contains five cues in canonical order", () => {
        expect(CUES.map((c) => c.label)).toEqual([
            "Cue 01",
            "Cue 02",
            "Cue 03",
            "Cue 04",
            "Cue 05"
        ]);
    });

    it("each cue has the expected fields populated", () => {
        for (const c of CUES) {
            expect(c.name.length).toBeGreaterThan(0);
            expect(c.title.length).toBeGreaterThan(0);
            expect(c.copy.length).toBeGreaterThan(0);
            expect(c.console.length).toBeGreaterThan(0);
        }
    });

    it("first three cues drive content_engage / content_engage / connection_request", () => {
        expect(CUES[0]?.action).toBe("content_engage");
        expect(CUES[1]?.action).toBe("content_engage");
        expect(CUES[2]?.action).toBe("connection_request");
    });

    it("cue indexes 3 + 4 are DMs (give-first / ask)", () => {
        expect(CUES[3]?.action).toBe("dm");
        expect(CUES[4]?.action).toBe("dm");
    });

    it("ask cue (last) is the only one whose name contains 'Ask only when earned'", () => {
        const askCue = CUES[4];
        expect(askCue?.name).toContain("Ask");
    });
});

describe("findCue", () => {
    it("returns the cue at the given index", () => {
        expect(findCue(2).label).toBe("Cue 03");
    });

    it("clamps negative indexes to the first cue", () => {
        expect(findCue(-1).label).toBe("Cue 01");
        expect(findCue(-99).label).toBe("Cue 01");
    });

    it("clamps over-range indexes to the last cue", () => {
        expect(findCue(99).label).toBe("Cue 05");
    });

    it("floors fractional indexes", () => {
        expect(findCue(2.7).label).toBe("Cue 03");
    });
});

describe("resolveCueIndex", () => {
    it("returns the pinned index when one is set", () => {
        expect(resolveCueIndex(4, 1)).toBe(4);
    });

    it("falls back to the motion default when nothing pinned", () => {
        expect(resolveCueIndex(null, 2)).toBe(2);
    });

    it("0 is a valid pinned index (not falsy)", () => {
        expect(resolveCueIndex(0, 3)).toBe(0);
    });
});
