import { describe, expect, it } from "vitest";
import {
    buildQuotaHref,
    hrefToColdCallStudio,
    hrefToDashboard,
    hrefToDealWorkspace,
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

    it("merges extra params (used by the dashboard mode)", () => {
        const url = buildQuotaHref({
            href: "/dashboard/",
            extra: { mode: "spotlight" }
        });
        expect(url).toContain("mode=spotlight");
    });
});

describe("convenience builders", () => {
    it("Outbound carries focusObject + room label", () => {
        expect(hrefToOutboundStudio()).toContain("focusRoom=Outbound+Studio");
    });

    it("Cold Call carries focusObject + room label", () => {
        expect(hrefToColdCallStudio()).toContain("focusRoom=Cold+Call+Studio");
    });

    it("Dashboard carries mode=spotlight", () => {
        expect(hrefToDashboard()).toContain("mode=spotlight");
    });

    it("Deal Workspace builder works", () => {
        const url = hrefToDealWorkspace();
        expect(url.startsWith("/deal-workspace/?")).toBe(true);
        expect(url).toContain("focusRoom=Deal+Workspace");
    });
});
