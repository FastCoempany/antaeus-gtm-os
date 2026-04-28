import { describe, expect, it } from "vitest";
import {
    buildPocRoomHref,
    hrefToAdvisorDeploy,
    hrefToDealWorkspace,
    hrefToFutureAutopsy,
    readInboundDealId
} from "./handoff";

function params(url: string): URLSearchParams {
    return new URLSearchParams(url.split("?")[1] ?? "");
}

describe("buildPocRoomHref", () => {
    it("attaches the canonical continuity params", () => {
        const url = buildPocRoomHref({
            href: "/deal-workspace/",
            focusObject: "Acme",
            roomLabel: "Deal Workspace"
        });
        const p = params(url);
        expect(p.get("returnTo")).toBe("/poc-framework/");
        expect(p.get("returnLabel")).toBe("Back to PoC Framework");
        expect(p.get("focusObject")).toBe("Acme");
        expect(p.get("focusRoom")).toBe("Deal Workspace");
        expect(p.get("fromMode")).toBe("room");
        expect(p.get("fromSurface")).toBe("poc-framework");
    });

    it("preserves existing query params", () => {
        const url = buildPocRoomHref({
            href: "/deal-workspace/?deal=existing",
            focusObject: "Acme",
            roomLabel: "Deal Workspace"
        });
        expect(params(url).get("deal")).toBe("existing");
    });

    it("merges in extra params", () => {
        const url = buildPocRoomHref({
            href: "/deal-workspace/",
            focusObject: "Acme",
            roomLabel: "Deal Workspace",
            extra: { deal: "d-1" }
        });
        expect(params(url).get("deal")).toBe("d-1");
    });
});

describe("convenience builders", () => {
    it("hrefToDealWorkspace includes deal id when provided", () => {
        expect(params(hrefToDealWorkspace("Acme", "d-1")).get("deal")).toBe("d-1");
    });

    it("hrefToFutureAutopsy targets /future-autopsy/", () => {
        expect(hrefToFutureAutopsy("Acme").startsWith("/future-autopsy/?")).toBe(
            true
        );
    });

    it("hrefToAdvisorDeploy targets /advisor-deploy/", () => {
        expect(hrefToAdvisorDeploy("Acme").startsWith("/advisor-deploy/?")).toBe(
            true
        );
    });
});

describe("readInboundDealId", () => {
    it("returns the deal param when present", () => {
        expect(readInboundDealId("?deal=d-99")).toBe("d-99");
    });

    it("returns null when missing", () => {
        expect(readInboundDealId("")).toBeNull();
        expect(readInboundDealId("?other=x")).toBeNull();
    });
});
