import { describe, expect, it } from "vitest";
import {
    buildQuotaHref,
    hrefToColdCallStudio,
    hrefToDashboard,
    hrefToDealWorkspace,
    hrefToFoundingGtm,
    hrefToOutboundStudio
} from "./handoff";

describe("buildQuotaHref", () => {
    it("threads the canonical continuity params", () => {
        const url = buildQuotaHref({
            href: "/outbound-studio/",
            focusObject: "Quota plan",
            roomLabel: "Outbound Studio"
        });
        expect(url.startsWith("/outbound-studio/?")).toBe(true);
        expect(url).toContain("returnTo=%2Fquota-workback%2F");
        expect(url).toContain("returnLabel=Quota+Workback");
        expect(url).toContain("focusObject=Quota+plan");
        expect(url).toContain("focusRoom=Outbound+Studio");
        expect(url).toContain("fromMode=system");
        expect(url).toContain("fromSurface=quota-workback");
    });

    it("omits focusObject when empty (Invariant 8)", () => {
        // Phase 2.7 audit retired the "Quota pressure plan" placeholder.
        const url = buildQuotaHref({
            href: "/outbound-studio/",
            roomLabel: "Outbound Studio"
        });
        expect(url).not.toContain("focusObject=");
    });

    it("trims whitespace focusObject to no param (Invariant 8)", () => {
        const url = buildQuotaHref({
            href: "/outbound-studio/",
            focusObject: "   ",
            roomLabel: "Outbound Studio"
        });
        expect(url).not.toContain("focusObject=");
    });

    it("merges arbitrary extra params", () => {
        const url = buildQuotaHref({
            href: "/dashboard/",
            extra: { plan: "weekly" }
        });
        expect(url).toContain("plan=weekly");
    });
});

describe("convenience builders", () => {
    it("Outbound carries focusRoom label, no placeholder focus", () => {
        const url = hrefToOutboundStudio();
        expect(url).toContain("focusRoom=Outbound+Studio");
        expect(url).not.toContain("focusObject=");
    });

    it("Cold Call carries focusRoom label, no placeholder focus", () => {
        const url = hrefToColdCallStudio();
        expect(url).toContain("focusRoom=Cold+Call+Studio");
        expect(url).not.toContain("focusObject=");
    });

    it("Dashboard routes plain (no mode=spotlight leak)", () => {
        // Phase 2.7 audit retired the `mode=spotlight` extra +
        // incorrect focusRoom="Spotlight" (room is Dashboard).
        const url = hrefToDashboard();
        expect(url).toContain("/dashboard/");
        expect(url).toContain("focusRoom=Dashboard");
        expect(url).not.toContain("mode=spotlight");
        expect(url).not.toContain("focusObject=");
    });

    it("Deal Workspace builder works without placeholder", () => {
        const url = hrefToDealWorkspace();
        expect(url.startsWith("/deal-workspace/?")).toBe(true);
        expect(url).toContain("focusRoom=Deal+Workspace");
        expect(url).not.toContain("focusObject=");
    });

    it("Founding GTM builder (Phase 2.7 — new destination)", () => {
        const url = hrefToFoundingGtm();
        expect(url.startsWith("/founding-gtm/?")).toBe(true);
        expect(url).toContain("focusRoom=Founding+GTM");
        expect(url).not.toContain("focusObject=");
    });
});
