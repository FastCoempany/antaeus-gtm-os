import { describe, expect, it } from "vitest";
import { buildFoundingGtmHref } from "./handoff";

describe("buildFoundingGtmHref", () => {
    it("threads the continuity params onto a bare route", () => {
        const href = buildFoundingGtmHref("/dashboard/");
        const u = new URL(href, "http://x");
        expect(u.pathname).toBe("/dashboard/");
        expect(u.searchParams.get("returnTo")).toBe("/founding-gtm/");
        expect(u.searchParams.get("returnLabel")).toBe("Back to Founding GTM");
        expect(u.searchParams.get("fromMode")).toBe("room");
        expect(u.searchParams.get("fromSurface")).toBe("founding-gtm");
    });

    it("preserves an existing query string and does not overwrite returnTo", () => {
        const href = buildFoundingGtmHref("/quota-workback/?returnTo=%2Felsewhere%2F&x=1");
        const u = new URL(href, "http://x");
        expect(u.pathname).toBe("/quota-workback/");
        expect(u.searchParams.get("returnTo")).toBe("/elsewhere/");
        expect(u.searchParams.get("x")).toBe("1");
    });
});
