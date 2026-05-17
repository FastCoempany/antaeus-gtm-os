import { describe, expect, it } from "vitest";
import {
    buildWelcomeHref,
    hrefForActionDestination,
    hrefToDealWorkspace,
    hrefToOutboundStudio,
    hrefToQuotaWorkback,
    hrefToSettings
} from "./handoff";

describe("buildWelcomeHref", () => {
    it("writes the canonical continuity params", () => {
        const out = buildWelcomeHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace"
        });
        const u = new URL(out, "http://x");
        expect(u.pathname).toBe("/deal-workspace/");
        expect(u.searchParams.get("returnTo")).toBe("/welcome/");
        expect(u.searchParams.get("returnLabel")).toBe("Back to setup");
        expect(u.searchParams.get("focusRoom")).toBe("Deal Workspace");
        expect(u.searchParams.get("fromMode")).toBe("threshold");
        expect(u.searchParams.get("fromSurface")).toBe("welcome");
    });

    it("omits focusObject when not provided", () => {
        const out = buildWelcomeHref({
            href: "/signal-console/",
            roomLabel: "Signal Console"
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBeNull();
    });

    it("includes focusObject when provided", () => {
        const out = buildWelcomeHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            focusObject: "Meridian Logistics"
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
    });

    it("merges extra params without clobbering canonical params", () => {
        const out = buildWelcomeHref({
            href: "/outbound-studio/",
            roomLabel: "Outbound Studio",
            extra: { account: "Meridian", temperature: "warm" }
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("returnTo")).toBe("/welcome/");
        expect(u.searchParams.get("account")).toBe("Meridian");
        expect(u.searchParams.get("temperature")).toBe("warm");
    });

    it("skips empty extra values", () => {
        const out = buildWelcomeHref({
            href: "/outbound-studio/",
            roomLabel: "Outbound Studio",
            extra: { account: "", note: "ok" }
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("account")).toBeNull();
        expect(u.searchParams.get("note")).toBe("ok");
    });
});

describe("convenience builders", () => {
    it("hrefToDealWorkspace builds /deal-workspace/ with provenance", () => {
        const u = new URL(hrefToDealWorkspace(), "http://x");
        expect(u.pathname).toBe("/deal-workspace/");
        expect(u.searchParams.get("focusRoom")).toBe("Deal Workspace");
    });

    it("hrefToOutboundStudio builds /outbound-studio/", () => {
        const u = new URL(hrefToOutboundStudio(), "http://x");
        expect(u.pathname).toBe("/outbound-studio/");
        expect(u.searchParams.get("focusRoom")).toBe("Outbound Studio");
    });

    it("hrefToQuotaWorkback builds /quota-workback/", () => {
        const u = new URL(hrefToQuotaWorkback(), "http://x");
        expect(u.pathname).toBe("/quota-workback/");
    });

    it("hrefToSettings builds /settings/", () => {
        const u = new URL(hrefToSettings(), "http://x");
        expect(u.pathname).toBe("/settings/");
    });
});

describe("hrefForActionDestination", () => {
    it("maps known destinations to their continuity-wrapped href", () => {
        const u = new URL(
            hrefForActionDestination("/deal-workspace/"),
            "http://x"
        );
        expect(u.pathname).toBe("/deal-workspace/");
        expect(u.searchParams.get("returnTo")).toBe("/welcome/");
    });

    it("maps /quota-workback/ to its continuity-wrapped href", () => {
        const u = new URL(
            hrefForActionDestination("/quota-workback/"),
            "http://x"
        );
        expect(u.pathname).toBe("/quota-workback/");
        expect(u.searchParams.get("focusRoom")).toBe("Quota Workback");
    });

    it("falls back to a continuity-wrapped href for unknown destinations", () => {
        const u = new URL(
            hrefForActionDestination("/unknown-room/"),
            "http://x"
        );
        expect(u.pathname).toBe("/unknown-room/");
        // Falls back with no roomLabel but still sets fromMode/fromSurface.
        expect(u.searchParams.get("returnTo")).toBe("/welcome/");
        expect(u.searchParams.get("fromSurface")).toBe("welcome");
    });
});
