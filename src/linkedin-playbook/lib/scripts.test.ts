import { describe, expect, it } from "vitest";
import { CUES, findCue } from "./cues";
import { cueScript, METHOD_TEMPLATES } from "./scripts";
import { deriveMotion } from "./motion";
import { EMPTY_STATS, type Motion, type MotionContext } from "./types";

const baseCtx: MotionContext = {
    icp: null,
    hottestAccount: null,
    latestTouch: null,
    stats: EMPTY_STATS
};

function defaultMotion(): Motion {
    return deriveMotion(baseCtx);
}

describe("cueScript", () => {
    it("returns the connect-script when cue.action is connection_request", () => {
        const cue = findCue(2); // Cue 03 — Connect after recognition
        const out = cueScript(cue, defaultMotion());
        expect(out).toContain("[Name]");
        expect(out).toContain("stay connected");
    });

    it("returns the give-first DM script for a non-Ask DM cue", () => {
        const cue = findCue(3); // Cue 04 — Give proof before asking
        const out = cueScript(cue, defaultMotion());
        expect(out).toContain("[benchmark]");
        expect(out).toContain("No ask");
    });

    it("returns the calendar-ask DM script for the Ask cue (last)", () => {
        const cue = findCue(4); // Cue 05 — Ask only when earned
        const out = cueScript(cue, defaultMotion());
        expect(out).toContain("[day]");
        expect(out).toContain("15 minutes");
    });

    it("uses the air-cover content script when motion is add_air_cover", () => {
        const cue = findCue(0);
        const motion = deriveMotion({
            ...baseCtx,
            latestTouch: {
                accountName: "Beta",
                createdAt: "2026-04-27T00:00:00Z"
            }
        });
        const out = cueScript(cue, motion);
        expect(out).toContain("queue");
        expect(out).toContain("forecast");
    });

    it("uses the credibility/default content script for non-air-cover motions", () => {
        const cue = findCue(0);
        const out = cueScript(cue, defaultMotion());
        expect(out).toContain("response time");
        expect(out).toContain("tooling");
    });
});

describe("METHOD_TEMPLATES", () => {
    it("has four templates in canonical order", () => {
        expect(METHOD_TEMPLATES.map((t) => t.key)).toEqual([
            "connect",
            "comment",
            "give",
            "ask"
        ]);
    });

    it("each template has kicker, heading, small, body all populated", () => {
        for (const t of METHOD_TEMPLATES) {
            expect(t.kicker.length).toBeGreaterThan(0);
            expect(t.heading.length).toBeGreaterThan(0);
            expect(t.small.length).toBeGreaterThan(0);
            expect(t.body.length).toBeGreaterThan(0);
        }
    });

    it("Connection template references a topic + specific strain", () => {
        const t = METHOD_TEMPLATES[0];
        expect(t?.body).toContain("[topic]");
        expect(t?.body).toContain("[specific strain]");
    });

    it("Public-cue template warns about pitching in comments", () => {
        const t = METHOD_TEMPLATES[1];
        expect(t?.small).toContain("Do not pitch");
    });

    it("CUES action types align with the method-template flow (connect→connection_request, ask→dm)", () => {
        // Sanity check: cue action types and method-template intentions
        // shouldn't drift apart.
        expect(CUES[2]?.action).toBe("connection_request"); // matches Connection template
        expect(CUES[4]?.action).toBe("dm"); // matches Ask template
    });
});
