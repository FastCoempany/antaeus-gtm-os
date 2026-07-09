import { describe, expect, it } from "vitest";
import {
    buildSourcingHref,
    hrefToOutboundStudio,
    hrefToSignalConsole,
    hrefToTerritoryArchitect,
    readInboundAccount
} from "./handoff";

describe("buildSourcingHref", () => {
    it("threads canonical continuity params", () => {
        const url = buildSourcingHref({
            href: "/signal-console/",
            focusObject: "Acme",
            roomLabel: "Signal Console",
            account: "Acme"
        });
        expect(url.startsWith("/signal-console/?")).toBe(true);
        expect(url).toContain("returnTo=%2Fsourcing-workbench%2F");
        expect(url).toContain("returnLabel=Sourcing+Workbench");
        expect(url).toContain("focusObject=Acme");
        expect(url).toContain("focusRoom=Signal+Console");
        expect(url).toContain("fromMode=sourcing");
        expect(url).toContain("fromSurface=workbench");
        expect(url).toContain("account=Acme");
    });

    it("merges extra params", () => {
        const url = buildSourcingHref({
            href: "/x/",
            extra: { custom: "yes", priority: "1" }
        });
        expect(url).toContain("custom=yes");
        expect(url).toContain("priority=1");
    });

    it("omits focus params when not given", () => {
        const url = buildSourcingHref({ href: "/x/" });
        expect(url).not.toContain("focusObject=");
        expect(url).not.toContain("focusRoom=");
        expect(url).not.toContain("account=");
    });
});

describe("convenience builders", () => {
    it("Territory Architect targets new-stack path", () => {
        const url = hrefToTerritoryArchitect();
        expect(url.startsWith("/territory-architect/?")).toBe(true);
    });

    it("Signal Console encodes account into both focusObject + account", () => {
        const url = hrefToSignalConsole({ account: "Meridian Logistics" });
        expect(url).toContain("focusObject=Meridian+Logistics");
        expect(url).toContain("account=Meridian+Logistics");
    });

    it("Outbound Studio threads account", () => {
        const url = hrefToOutboundStudio({ account: "Acme" });
        expect(url.startsWith("/outbound-studio/?")).toBe(true);
        expect(url).toContain("account=Acme");
    });

    it("each builder works with no args", () => {
        expect(hrefToTerritoryArchitect()).toContain("returnTo=");
        expect(hrefToSignalConsole()).toContain("returnTo=");
        expect(hrefToOutboundStudio()).toContain("returnTo=");
    });
});

describe("readInboundAccount", () => {
    it("returns null for empty input", () => {
        expect(readInboundAccount("")).toBeNull();
    });

    it("parses ?account=", () => {
        expect(readInboundAccount("?account=Acme")).toBe("Acme");
        expect(readInboundAccount("account=Meridian")).toBe("Meridian");
    });

    it("trims whitespace", () => {
        expect(readInboundAccount("?account=%20Acme%20")).toBe("Acme");
    });

    it("returns null when account is missing", () => {
        expect(readInboundAccount("?focusObject=Acme")).toBeNull();
    });

    it("returns null on malformed input", () => {
        // URLSearchParams is fairly forgiving so this returns null because
        // the param simply isn't present.
        expect(readInboundAccount("not-a-query-string")).toBeNull();
    });
});
