import { describe, expect, it } from "vitest";
import {
    buildDiscoveryHref,
    hrefToCallPlanner,
    hrefToDealWorkspace,
    hrefToFutureAutopsy
} from "./handoff";

describe("buildDiscoveryHref", () => {
    it("writes the canonical continuity params", () => {
        const out = buildDiscoveryHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace"
        });
        const u = new URL(out, "http://x");
        expect(u.pathname).toBe("/deal-workspace/");
        expect(u.searchParams.get("returnTo")).toBe("/discovery-studio/");
        expect(u.searchParams.get("returnLabel")).toBe("Back to Discovery");
        expect(u.searchParams.get("focusRoom")).toBe("Deal Workspace");
        expect(u.searchParams.get("fromMode")).toBe("room");
        expect(u.searchParams.get("fromSurface")).toBe("discovery-studio");
    });

    it("omits focusObject when not provided", () => {
        const out = buildDiscoveryHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace"
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBeNull();
    });

    it("propagates focusObject when provided", () => {
        const out = buildDiscoveryHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            focusObject: "Meridian Logistics"
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
    });

    it("trims whitespace-only focusObject to no param (Invariant 8)", () => {
        const out = buildDiscoveryHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            focusObject: "   "
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBeNull();
    });
});

describe("convenience builders", () => {
    it("hrefToDealWorkspace routes to /deal-workspace/", () => {
        const u = new URL(hrefToDealWorkspace("Meridian"), "http://x");
        expect(u.pathname).toBe("/deal-workspace/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian");
        expect(u.searchParams.get("focusRoom")).toBe("Deal Workspace");
    });

    it("hrefToFutureAutopsy routes to /future-autopsy/", () => {
        const u = new URL(hrefToFutureAutopsy("Meridian"), "http://x");
        expect(u.pathname).toBe("/future-autopsy/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian");
    });

    it("hrefToCallPlanner routes to /call-planner/ with ?account=", () => {
        const u = new URL(hrefToCallPlanner("Meridian"), "http://x");
        expect(u.pathname).toBe("/call-planner/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian");
        // Call Planner's inbound reader uses `?account=` for prefill.
        expect(u.searchParams.get("account")).toBe("Meridian");
    });

    it("convenience builders omit focusObject when account is empty", () => {
        const u1 = new URL(hrefToDealWorkspace(), "http://x");
        const u2 = new URL(hrefToFutureAutopsy(), "http://x");
        const u3 = new URL(hrefToCallPlanner(), "http://x");
        expect(u1.searchParams.get("focusObject")).toBeNull();
        expect(u2.searchParams.get("focusObject")).toBeNull();
        expect(u3.searchParams.get("focusObject")).toBeNull();
    });
});
