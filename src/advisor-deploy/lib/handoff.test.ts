import { describe, expect, it } from "vitest";
import {
    buildAdvisorRoomHref,
    hrefToDealWorkspace,
    hrefToFutureAutopsy,
    hrefToPocFramework,
    readInboundDealId
} from "./handoff";

describe("buildAdvisorRoomHref", () => {
    it("appends the canonical continuity params", () => {
        const url = buildAdvisorRoomHref({
            href: "/deal-workspace/",
            focusObject: "Acme",
            roomLabel: "Deal Workspace"
        });
        expect(url).toContain("returnTo=%2Fadvisor-deploy%2F");
        expect(url).toContain("returnLabel=Back+to+Advisor+Deploy");
        expect(url).toContain("focusObject=Acme");
        expect(url).toContain("focusRoom=Deal+Workspace");
        expect(url).toContain("fromMode=room");
        expect(url).toContain("fromSurface=advisor-deploy");
    });

    it("preserves any pre-existing query params on the href", () => {
        const url = buildAdvisorRoomHref({
            href: "/deal-workspace/?deal=d1",
            focusObject: "Acme",
            roomLabel: "Deal Workspace"
        });
        expect(url).toContain("deal=d1");
        expect(url).toContain("returnTo=%2Fadvisor-deploy%2F");
    });

    it("does not overwrite returnTo when href already has one (legacy parity)", () => {
        const url = buildAdvisorRoomHref({
            href: "/deal-workspace/?returnTo=%2Felsewhere%2F",
            focusObject: "Acme",
            roomLabel: "Deal Workspace"
        });
        expect(url).toContain("returnTo=%2Felsewhere%2F");
        expect(url).not.toContain("returnTo=%2Fadvisor-deploy%2F");
    });

    it("merges extra params, ignoring blanks", () => {
        const url = buildAdvisorRoomHref({
            href: "/app/foo/",
            focusObject: "Acme",
            roomLabel: "Foo",
            extra: { stage: "demo", blank: "" }
        });
        expect(url).toContain("stage=demo");
        expect(url).not.toContain("blank=");
    });
});

describe("hrefToDealWorkspace / hrefToFutureAutopsy / hrefToPocFramework", () => {
    it("threads the dealId via ?deal=", () => {
        expect(hrefToDealWorkspace("d-1", "Acme")).toContain("deal=d-1");
        expect(hrefToFutureAutopsy("d-1", "Acme")).toContain("deal=d-1");
        expect(hrefToPocFramework("d-1", "Acme")).toContain("deal=d-1");
    });

    it("URL-encodes the dealId (form-encoded — URLSearchParams roundtrips)", () => {
        // URLSearchParams encodes space as `+`. Both `+` and `%20` are
        // valid in query strings; the destination parses either back to
        // the original string. We just need to confirm the dealId made
        // it through and is escaped (no raw space).
        const url = hrefToDealWorkspace("d 1", "Acme");
        expect(url).toMatch(/deal=d(\+|%20)1/);
        expect(url).not.toContain("deal=d 1");
    });

    it("falls back to the room root when dealId is empty", () => {
        const url = hrefToDealWorkspace("", "Acme");
        expect(url).not.toContain("deal=");
        expect(url).toContain("/deal-workspace/");
    });

    it("uses 'Advisor deployment' fallback when accountName is blank", () => {
        const url = hrefToFutureAutopsy("d-1", "");
        expect(url).toContain("focusObject=Advisor+deployment");
    });
});

describe("readInboundDealId", () => {
    it("reads ?deal= when present", () => {
        expect(readInboundDealId("?deal=abc")).toBe("abc");
    });

    it("falls back to ?focusObject= when ?deal= is missing", () => {
        expect(readInboundDealId("?focusObject=acme")).toBe("acme");
    });

    it("returns null when neither is set", () => {
        expect(readInboundDealId("")).toBeNull();
        expect(readInboundDealId("?other=42")).toBeNull();
    });

    it("prefers ?deal= over ?focusObject= when both are set", () => {
        expect(readInboundDealId("?deal=abc&focusObject=other")).toBe(
            "abc"
        );
    });
});
