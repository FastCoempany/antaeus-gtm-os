import { describe, expect, it } from "vitest";
import {
    EMPTY_CONTINUITY,
    readContinuity,
    safeReturnTo
} from "./continuity";

describe("readContinuity", () => {
    it("returns EMPTY_CONTINUITY when search is empty", () => {
        expect(readContinuity("")).toEqual(EMPTY_CONTINUITY);
    });

    it("returns EMPTY_CONTINUITY when search has no recognized params", () => {
        expect(readContinuity("?foo=bar&baz=qux")).toEqual(EMPTY_CONTINUITY);
    });

    it("parses all six canonical params", () => {
        const ctx = readContinuity(
            "?returnTo=/quota-workback/&returnLabel=Quota+Workback&focusObject=Acme&focusRoom=Quota+Workback&fromMode=system&fromSurface=quota-workback"
        );
        expect(ctx.returnTo).toBe("/quota-workback/");
        expect(ctx.returnLabel).toBe("Quota Workback");
        expect(ctx.focusObject).toBe("Acme");
        expect(ctx.focusRoom).toBe("Quota Workback");
        expect(ctx.fromMode).toBe("system");
        expect(ctx.fromSurface).toBe("quota-workback");
    });

    it("works without leading question mark", () => {
        const ctx = readContinuity("returnTo=/foo/&returnLabel=Foo");
        expect(ctx.returnTo).toBe("/foo/");
        expect(ctx.returnLabel).toBe("Foo");
    });

    it("normalizes whitespace-only values to null", () => {
        const ctx = readContinuity("?returnTo=%20%20&returnLabel=Real");
        expect(ctx.returnTo).toBeNull();
        expect(ctx.returnLabel).toBe("Real");
    });

    it("ignores unknown params", () => {
        const ctx = readContinuity("?account=Acme&deal=d1&returnTo=/x/");
        expect(ctx.returnTo).toBe("/x/");
        expect(ctx.focusObject).toBeNull();
    });
});

describe("safeReturnTo", () => {
    it("accepts in-domain paths", () => {
        expect(safeReturnTo("/quota-workback/")).toBe("/quota-workback/");
        expect(safeReturnTo("/app/dashboard/")).toBe("/app/dashboard/");
    });

    it("rejects null + empty", () => {
        expect(safeReturnTo(null)).toBeNull();
        expect(safeReturnTo("")).toBeNull();
    });

    it("rejects absolute URLs (open-redirect protection)", () => {
        expect(safeReturnTo("https://evil.example/phish")).toBeNull();
        expect(safeReturnTo("http://evil.example/")).toBeNull();
    });

    it("rejects protocol-relative URLs", () => {
        expect(safeReturnTo("//evil.example/")).toBeNull();
    });

    it("rejects javascript: and data: schemes", () => {
        expect(safeReturnTo("javascript:alert(1)")).toBeNull();
        expect(safeReturnTo("data:text/html,foo")).toBeNull();
    });

    it("rejects bare paths without leading slash", () => {
        expect(safeReturnTo("dashboard/")).toBeNull();
    });
});
