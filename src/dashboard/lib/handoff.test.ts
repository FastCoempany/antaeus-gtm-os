import { describe, expect, it } from "vitest";
import {
    buildDashboardHref,
    hrefToCallPlannerForAccount,
    hrefToDealForDeal,
    hrefToFutureAutopsyForDeal,
    hrefToOutboundForAccount,
    hrefToSignalForAccount
} from "./handoff";

describe("buildDashboardHref", () => {
    it("writes the canonical continuity params", () => {
        const out = buildDashboardHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace"
        });
        const u = new URL(out, "http://x");
        expect(u.pathname).toBe("/deal-workspace/");
        expect(u.searchParams.get("returnTo")).toBe("/dashboard/");
        expect(u.searchParams.get("returnLabel")).toBe("Back to Dashboard");
        expect(u.searchParams.get("focusRoom")).toBe("Deal Workspace");
        expect(u.searchParams.get("fromMode")).toBe("command");
        expect(u.searchParams.get("fromSurface")).toBe("dashboard");
    });

    it("includes focusObject when provided", () => {
        const out = buildDashboardHref({
            href: "/deal-workspace/",
            roomLabel: "Deal Workspace",
            focusObject: "Meridian Logistics"
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
    });

    it("merges extra params without clobbering canonical params", () => {
        const out = buildDashboardHref({
            href: "/outbound-studio/",
            roomLabel: "Outbound Studio",
            extra: { account: "Meridian", temperature: "warm" }
        });
        const u = new URL(out, "http://x");
        expect(u.searchParams.get("returnTo")).toBe("/dashboard/");
        expect(u.searchParams.get("account")).toBe("Meridian");
        expect(u.searchParams.get("temperature")).toBe("warm");
    });
});

describe("convenience builders", () => {
    it("hrefToOutboundForAccount routes a move card to Outbound (not Signal)", () => {
        // The Phase 2.2 finding: move cards used to route to
        // Signal Console, which mismatched Sarah's hand-reach intent
        // ("compose outbound"). Now they route to Outbound Studio.
        const u = new URL(
            hrefToOutboundForAccount("Meridian Logistics"),
            "http://x"
        );
        expect(u.pathname).toBe("/outbound-studio/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
        expect(u.searchParams.get("account")).toBe("Meridian Logistics");
        expect(u.searchParams.get("focusRoom")).toBe("Outbound Studio");
    });

    it("hrefToSignalForAccount routes the secondary move CTA to Signal", () => {
        const u = new URL(
            hrefToSignalForAccount("Meridian Logistics"),
            "http://x"
        );
        expect(u.pathname).toBe("/signal-console/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
    });

    it("hrefToDealForDeal routes a risk card to Deal Workspace with focus", () => {
        const u = new URL(
            hrefToDealForDeal("deal_42", "Meridian Logistics"),
            "http://x"
        );
        expect(u.pathname).toBe("/deal-workspace/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
        expect(u.searchParams.get("deal")).toBe("deal_42");
    });

    it("hrefToDealForDeal handles a missing deal id", () => {
        const u = new URL(hrefToDealForDeal("", "Meridian Logistics"), "http://x");
        expect(u.pathname).toBe("/deal-workspace/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
        expect(u.searchParams.get("deal")).toBeNull();
    });

    it("hrefToFutureAutopsyForDeal routes the secondary risk CTA", () => {
        const u = new URL(
            hrefToFutureAutopsyForDeal("deal_42", "Meridian Logistics"),
            "http://x"
        );
        expect(u.pathname).toBe("/future-autopsy/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
    });

    it("hrefToCallPlannerForAccount builds /call-planner/ with focus", () => {
        const u = new URL(
            hrefToCallPlannerForAccount("Meridian Logistics"),
            "http://x"
        );
        expect(u.pathname).toBe("/call-planner/");
        expect(u.searchParams.get("focusObject")).toBe("Meridian Logistics");
        expect(u.searchParams.get("account")).toBe("Meridian Logistics");
    });
});
