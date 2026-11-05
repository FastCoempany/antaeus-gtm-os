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
    it("returns a connection script that references a real public topic", () => {
        const cue = findCue(2);
        const out = cueScript(cue, defaultMotion());
        expect(out).toContain("[Name]");
        expect(out).toContain("[topic]");
        expect(out).toContain("stay connected");
    });

    it("returns a resource DM without inventing benchmark proof", () => {
        const cue = findCue(3);
        const out = cueScript(cue, defaultMotion());
        expect(out).toContain("[resource]");
        expect(out).toContain("No meeting request");
        expect(out).not.toContain("[benchmark]");
    });

    it("returns a calendar ask tied to a specific issue", () => {
        const cue = findCue(4);
        const out = cueScript(cue, defaultMotion());
        expect(out).toContain("[specific issue]");
        expect(out).toContain("[day]");
        expect(out).toContain("15 minutes");
    });

    it("uses recorded-outbound support copy without a causal pattern claim", () => {
        const cue = findCue(0);
        const motion = deriveMotion({
            ...baseCtx,
            latestTouch: {
                accountName: "Beta",
                createdAt: "2026-04-27T00:00:00Z"
            }
        });
        const out = cueScript(cue, motion);
        expect(out).toContain("[topic]");
        expect(out).toContain("How are you handling that today?");
        expect(out.toLowerCase()).not.toContain("usually");
    });

    it("uses a plain public-comment script for the default path", () => {
        const cue = findCue(0);
        const out = cueScript(cue, defaultMotion());
        expect(out).toContain("[specific issue]");
        expect(out).toContain("How are you handling that today?");
        expect(out.toLowerCase()).not.toContain("tooling");
    });
});

describe("METHOD_TEMPLATES", () => {
    it("has four templates in the existing order", () => {
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

    it("Connection template references a topic + specific issue", () => {
        const t = METHOD_TEMPLATES[0];
        expect(t?.body).toContain("[topic]");
        expect(t?.body).toContain("[specific issue]");
    });

    it("Comment template explicitly avoids a product pitch", () => {
        const t = METHOD_TEMPLATES[1];
        expect(t?.small).toContain("Do not turn the comment into a product pitch");
    });

    it("templates do not manufacture benchmark or typical-pattern claims", () => {
        const text = METHOD_TEMPLATES.map((t) => `${t.heading} ${t.small} ${t.body}`).join(" ").toLowerCase();
        expect(text).not.toContain("[benchmark]");
        expect(text).not.toContain("usually");
        expect(text).not.toContain("tends to show up");
    });

    it("CUES action types still align with connect and ask template intentions", () => {
        expect(CUES[2]?.action).toBe("connection_request");
        expect(CUES[4]?.action).toBe("dm");
    });
});
