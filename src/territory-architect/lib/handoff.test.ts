import { describe, expect, it } from "vitest";
import {
    buildTerritoryHref,
    hrefToIcpStudio,
    hrefToSignalConsole,
    hrefToSourcingWorkbench
} from "./handoff";

describe("buildTerritoryHref", () => {
    it("writes the canonical continuity params", () => {
        const out = buildTerritoryHref({
            href: "/prospecting-desk/",
            roomLabel: "Prospecting Desk"
        });
        const u = new URL(out, "http://x");
        expect(u.pathname).toBe("/prospecting-desk/");
        expect(u.searchParams.get("returnTo")).toBe("/territory-architect/");
        expect(u.searchParams.get("returnLabel")).toBe("Back to Territory");
        expect(u.searchParams.get("focusRoom")).toBe("Prospecting Desk");
        expect(u.searchParams.get("fromMode")).toBe("room");
        expect(u.searchParams.get("fromSurface")).toBe("territory-architect");
    });

    it("omits focusObject when not provided", () => {
        const out = buildTerritoryHref({
            href: "/signal-console/",
            roomLabel: "Signal Console"
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBeNull();
    });

    it("propagates focusObject when provided", () => {
        const out = buildTerritoryHref({
            href: "/signal-console/",
            roomLabel: "Signal Console",
            focusObject: "Mid-market freight forwarders"
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBe(
            "Mid-market freight forwarders"
        );
    });

    it("trims whitespace-only focusObject to no param", () => {
        // Invariant 8: empty/placeholder focus does not write.
        const out = buildTerritoryHref({
            href: "/signal-console/",
            roomLabel: "Signal Console",
            focusObject: "   "
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBeNull();
    });

    it("merges extra params without clobbering canonical params", () => {
        const out = buildTerritoryHref({
            href: "/prospecting-desk/",
            roomLabel: "Prospecting Desk",
            extra: { account: "Meridian" }
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("returnTo")).toBe("/territory-architect/");
        expect(u.searchParams.get("account")).toBe("Meridian");
    });
});

describe("convenience builders", () => {
    it("hrefToSourcingWorkbench builds /prospecting-desk/ with provenance", () => {
        const u = new URL(hrefToSourcingWorkbench(), "http://x");
        expect(u.pathname).toBe("/prospecting-desk/");
        expect(u.searchParams.get("focusRoom")).toBe("Prospecting Desk");
    });

    it("hrefToSignalConsole builds /signal-console/", () => {
        const u = new URL(hrefToSignalConsole("Mid-market freight"), "http://x");
        expect(u.pathname).toBe("/signal-console/");
        expect(u.searchParams.get("focusObject")).toBe("Mid-market freight");
    });

    it("hrefToIcpStudio builds /icp-studio/", () => {
        const u = new URL(hrefToIcpStudio(), "http://x");
        expect(u.pathname).toBe("/icp-studio/");
        expect(u.searchParams.get("returnTo")).toBe("/territory-architect/");
    });
});
