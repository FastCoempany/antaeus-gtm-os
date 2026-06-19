import { describe, expect, it } from "vitest";
import {
    GENERIC_HELP,
    helpForPath,
    SUPPORT_EMAIL,
    supportMailto
} from "./registry";

describe("helpForPath", () => {
    it("resolves a known room", () => {
        const h = helpForPath("/deal-workspace/");
        expect(h.whatItIsFor).toMatch(/recovery board/i);
        expect(h.theMoveHere.length).toBeGreaterThan(0);
        expect(h.ifStuck.length).toBeGreaterThan(0);
    });

    it("matches the longest prefix on a sub-path", () => {
        const h = helpForPath("/signal-console/account/123?x=1");
        expect(h.whatItIsFor).toMatch(/signal console/i);
    });

    it("strips query + hash before matching", () => {
        const h = helpForPath("/dashboard/?mode=focus#top");
        expect(h.whatItIsFor).toMatch(/ranks everything under pressure/i);
    });

    it("falls back to GENERIC for an unlisted path", () => {
        expect(helpForPath("/some-room-that-does-not-exist/")).toBe(GENERIC_HELP);
        expect(helpForPath("/")).toBe(GENERIC_HELP);
    });

    it("every entry has all three plain lines", () => {
        const paths = [
            "/dashboard/",
            "/welcome/",
            "/onboarding/",
            "/icp-studio/",
            "/signal-console/",
            "/deal-workspace/",
            "/outbound-studio/",
            "/settings/",
            "/briefing/",
            "/outdoors-events/"
        ];
        for (const p of paths) {
            const h = helpForPath(p);
            expect(h.whatItIsFor.trim().length).toBeGreaterThan(10);
            expect(h.theMoveHere.trim().length).toBeGreaterThan(10);
            expect(h.ifStuck.trim().length).toBeGreaterThan(10);
        }
    });
});

describe("supportMailto", () => {
    it("builds a mailto to the support address with the room in the subject", () => {
        const m = supportMailto("Deal Workspace");
        expect(m.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true);
        expect(m).toContain(encodeURIComponent("Help with Deal Workspace"));
        expect(m).toContain("body=");
    });

    it("falls back to Antaeus when the room label is blank", () => {
        const m = supportMailto("   ");
        expect(m).toContain(encodeURIComponent("Help with Antaeus"));
    });
});
