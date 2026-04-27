import { describe, expect, it } from "vitest";
import {
    buildPlannerHref,
    hrefToDealWorkspace,
    hrefToDiscoveryStudio,
    hrefToSignalConsole,
    readInboundAccount
} from "./handoff";

describe("buildPlannerHref", () => {
    it("appends the canonical continuity params", () => {
        const url = buildPlannerHref({
            href: "/app/discovery-studio/",
            focusObject: "Sarah Chen",
            roomLabel: "Discovery Studio"
        });
        expect(url).toContain("returnTo=%2Fapp%2Fdiscovery-agenda%2F");
        expect(url).toContain("returnLabel=Back+to+Call+Planner");
        expect(url).toContain("focusObject=Sarah+Chen");
        expect(url).toContain("focusRoom=Discovery+Studio");
        expect(url).toContain("fromMode=room");
        expect(url).toContain("fromSurface=call-planner");
    });

    it("includes ?account= when supplied", () => {
        const url = buildPlannerHref({
            href: "/app/signal-console/",
            focusObject: "Sarah",
            roomLabel: "Signal Console",
            account: "Acme"
        });
        expect(url).toContain("account=Acme");
    });

    it("includes ?deal= when supplied", () => {
        const url = buildPlannerHref({
            href: "/app/deal-workspace/",
            focusObject: "Sarah",
            roomLabel: "Deal Workspace",
            deal: "deal-123"
        });
        expect(url).toContain("deal=deal-123");
    });

    it("preserves any pre-existing query params on the href", () => {
        const url = buildPlannerHref({
            href: "/app/discovery-studio/?stage=opening",
            focusObject: "Sarah",
            roomLabel: "Discovery Studio"
        });
        expect(url).toContain("stage=opening");
        expect(url).toContain("returnTo=%2Fapp%2Fdiscovery-agenda%2F");
    });

    it("merges extra params, ignoring blanks", () => {
        const url = buildPlannerHref({
            href: "/app/poc-framework/",
            focusObject: "Sarah",
            roomLabel: "PoC",
            extra: { mood: "tense", blank: "" }
        });
        expect(url).toContain("mood=tense");
        expect(url).not.toContain("blank=");
    });

    it("omits focusObject when blank", () => {
        const url = buildPlannerHref({
            href: "/app/x/",
            focusObject: "",
            roomLabel: "X"
        });
        expect(url).not.toContain("focusObject=");
    });
});

describe("hrefToDiscoveryStudio / hrefToDealWorkspace / hrefToSignalConsole", () => {
    it("send to the right destination paths", () => {
        expect(hrefToDiscoveryStudio("Sarah", "Acme")).toContain(
            "/app/discovery-studio/"
        );
        expect(hrefToDealWorkspace("Sarah", "Acme", "")).toContain(
            "/app/deal-workspace/"
        );
        expect(hrefToSignalConsole("Sarah", "Acme")).toContain(
            "/app/signal-console/"
        );
    });

    it("hrefToDealWorkspace threads ?deal= when provided", () => {
        const url = hrefToDealWorkspace("Sarah", "Acme", "d-1");
        expect(url).toContain("deal=d-1");
    });

    it("hrefToDealWorkspace omits ?deal= when blank", () => {
        const url = hrefToDealWorkspace("Sarah", "Acme", "");
        expect(url).not.toContain("deal=");
    });

    it("falls back to 'Call Planner' focus when focus arg is empty", () => {
        const url = hrefToDiscoveryStudio("", "Acme");
        expect(url).toContain("focusObject=Call+Planner");
    });
});

describe("readInboundAccount", () => {
    it("reads ?account= when present", () => {
        expect(readInboundAccount("?account=Acme")).toBe("Acme");
    });

    it("does NOT fall back to ?focusObject= (placeholder-pollution guard)", () => {
        expect(readInboundAccount("?focusObject=Call+Planner")).toBeNull();
        expect(readInboundAccount("?focusObject=Beta")).toBeNull();
    });

    it("returns null when ?account= is not set", () => {
        expect(readInboundAccount("")).toBeNull();
        expect(readInboundAccount("?other=42")).toBeNull();
    });
});
