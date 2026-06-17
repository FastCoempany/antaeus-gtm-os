import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The motion contract (spec 08 §4.2): a build performs only the named
 * vocabulary and uses only the token durations. These checks enforce
 * both against motion.css so an off-scale duration or a missing
 * reduced-motion stop is caught the way an un-banned word is.
 */
const css = readFileSync(
    resolve(process.cwd(), "src/components/motion.css"),
    "utf8"
);
/** CSS with comments stripped — value checks run against real rules,
 * not the prose that documents them (which names durations like 40ms). */
const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("motion layer (spec 08)", () => {
    it("defines the full named vocabulary (Part III)", () => {
        // First-load staging, read switch, state-settle, region collapse,
        // the pulse, escalation — the closed list.
        for (const cls of [
            ".ds-stage",
            ".ds-read",
            ".ds-settle",
            ".ds-collapse-exit",
            ".ds-pulse-dot",
            ".ds-escalate"
        ]) {
            expect(css).toContain(cls);
        }
    });

    it("drives every duration from the --ds-motion-* / --ds-stagger tokens", () => {
        // No raw millisecond literal in any rule — durations are tokens
        // (the §4.2 contract: a duration not on the scale is drift).
        expect(rules).not.toMatch(/\d+ms/);
        expect(rules).toContain("var(--ds-motion-considered)");
        expect(rules).toContain("var(--ds-motion-base)");
        expect(rules).toContain("var(--ds-motion-quick)");
        expect(rules).toContain("var(--ds-stagger)");
    });

    it("uses only the two approved easings (no bounce / spring / elastic)", () => {
        expect(css).toContain("var(--ds-ease-standard)");
        // The exit curve is used where something leaves.
        expect(css).toContain("var(--ds-ease-exit)");
        expect(css).not.toMatch(/bounce|elastic|spring|overshoot|back\(/i);
    });

    it("hard-stops the one looping motion under reduced motion (§4.1)", () => {
        const reduced = css.slice(
            css.indexOf("prefers-reduced-motion: reduce")
        );
        expect(reduced).toContain(".ds-pulse-dot");
        expect(reduced).toContain("animation: none");
    });

    it("keeps the pulse the single ambient loop (one infinite animation)", () => {
        const infinites = css.match(/infinite/g) ?? [];
        expect(infinites.length).toBe(1);
    });
});
