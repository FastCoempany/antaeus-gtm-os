import { describe, expect, it } from "vitest";
import {
    buildDealWorkspaceHref,
    hrefToAdvisorDeploy,
    hrefToCallPlanner,
    hrefToFutureAutopsy,
    hrefToNegotiation,
    hrefToPocFramework
} from "./handoff";

describe("buildDealWorkspaceHref", () => {
    it("writes the canonical continuity params", () => {
        const out = buildDealWorkspaceHref({
            href: "/future-autopsy/",
            roomLabel: "Future Autopsy"
        });
        const u = new URL(out, "http://x");
        expect(u.pathname).toBe("/future-autopsy/");
        expect(u.searchParams.get("returnTo")).toBe("/deal-workspace/");
        expect(u.searchParams.get("returnLabel")).toBe("Back to Deal Workspace");
        expect(u.searchParams.get("focusRoom")).toBe("Future Autopsy");
        expect(u.searchParams.get("fromMode")).toBe("room");
        expect(u.searchParams.get("fromSurface")).toBe("deal-workspace");
    });

    it("omits focusObject when not provided", () => {
        const out = buildDealWorkspaceHref({
            href: "/poc-framework/",
            roomLabel: "PoC Framework"
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBeNull();
    });

    it("propagates focusObject when provided", () => {
        const out = buildDealWorkspaceHref({
            href: "/advisor-deploy/",
            roomLabel: "Advisor Deploy",
            focusObject: "Meridian Logistics"
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
    });

    it("trims whitespace focusObject to no param (Invariant 8)", () => {
        const out = buildDealWorkspaceHref({
            href: "/future-autopsy/",
            roomLabel: "Future Autopsy",
            focusObject: "   "
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBeNull();
    });
});

describe("convenience builders", () => {
    it("hrefToFutureAutopsy routes correctly with focus", () => {
        const u = new URL(hrefToFutureAutopsy("Meridian"), "http://x");
        expect(u.pathname).toBe("/future-autopsy/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian");
    });

    it("hrefToPocFramework routes correctly with focus", () => {
        const u = new URL(hrefToPocFramework("Meridian"), "http://x");
        expect(u.pathname).toBe("/poc-framework/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian");
    });

    it("hrefToAdvisorDeploy routes correctly with focus", () => {
        const u = new URL(hrefToAdvisorDeploy("Meridian"), "http://x");
        expect(u.pathname).toBe("/advisor-deploy/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian");
    });

    it("hrefToCallPlanner threads ?account= for Call Planner inbound", () => {
        const u = new URL(hrefToCallPlanner("Meridian"), "http://x");
        expect(u.pathname).toBe("/call-planner/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian");
        expect(u.searchParams.get("account")).toBe("Meridian");
    });

    it("all convenience builders omit focusObject when account is empty", () => {
        expect(new URL(hrefToFutureAutopsy(), "http://x").searchParams.get("focusObject")).toBeNull();
        expect(new URL(hrefToPocFramework(), "http://x").searchParams.get("focusObject")).toBeNull();
        expect(new URL(hrefToAdvisorDeploy(), "http://x").searchParams.get("focusObject")).toBeNull();
        expect(new URL(hrefToCallPlanner(), "http://x").searchParams.get("focusObject")).toBeNull();
    });

    it("hrefToNegotiation threads ?deal= and focusObject for the negotiation room", () => {
        const u = new URL(hrefToNegotiation("deal-123", "Meridian"), "http://x");
        expect(u.pathname).toBe("/negotiation/");
        expect(u.searchParams.get("deal")).toBe("deal-123");
        expect(u.searchParams.get("focusObject")).toBe("Meridian");
        expect(u.searchParams.get("focusRoom")).toBe("Negotiation");
        expect(u.searchParams.get("returnTo")).toBe("/deal-workspace/");
    });

    it("hrefToNegotiation Invariant-8 — omits focusObject + ?deal= when both args missing", () => {
        const u = new URL(hrefToNegotiation(), "http://x");
        expect(u.pathname).toBe("/negotiation/");
        expect(u.searchParams.has("deal")).toBe(false);
        expect(u.searchParams.has("focusObject")).toBe(false);
    });
});
