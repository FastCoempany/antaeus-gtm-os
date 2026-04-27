import { describe, expect, it } from "vitest";
import {
    buildOutboundRoomHref,
    hrefToColdCallStudio,
    hrefToLinkedInPlaybook,
    hrefToSignalConsole,
    readInboundRack
} from "./handoff";

function params(url: string): URLSearchParams {
    return new URLSearchParams(url.split("?")[1] ?? "");
}

describe("buildOutboundRoomHref", () => {
    it("attaches the canonical continuity params", () => {
        const url = buildOutboundRoomHref({
            href: "/app/signal-console/",
            focusObject: "Acme",
            roomLabel: "Signal Console"
        });
        const p = params(url);
        expect(p.get("returnTo")).toBe("/app/outbound-studio/");
        expect(p.get("returnLabel")).toBe("Back to Outbound Studio");
        expect(p.get("focusObject")).toBe("Acme");
        expect(p.get("focusRoom")).toBe("Signal Console");
        expect(p.get("fromMode")).toBe("room");
        expect(p.get("fromSurface")).toBe("outbound-studio");
    });

    it("preserves existing query params", () => {
        const url = buildOutboundRoomHref({
            href: "/app/cold-call-studio/?account=Beta",
            focusObject: "Beta",
            roomLabel: "Cold Call Studio"
        });
        expect(params(url).get("account")).toBe("Beta");
    });

    it("merges in extra params", () => {
        const url = buildOutboundRoomHref({
            href: "/app/signal-console/",
            focusObject: "Acme",
            roomLabel: "Signal Console",
            extra: { custom: "value" }
        });
        expect(params(url).get("custom")).toBe("value");
    });
});

describe("convenience builders", () => {
    it("hrefToSignalConsole targets /app/signal-console/", () => {
        expect(hrefToSignalConsole("Acme").startsWith("/app/signal-console/?")).toBe(
            true
        );
    });

    it("hrefToLinkedInPlaybook targets /app/linkedin-playbook/", () => {
        expect(
            hrefToLinkedInPlaybook("Acme").startsWith("/app/linkedin-playbook/?")
        ).toBe(true);
    });

    it("hrefToColdCallStudio targets /app/cold-call-studio/", () => {
        expect(
            hrefToColdCallStudio("Acme").startsWith("/app/cold-call-studio/?")
        ).toBe(true);
    });
});

describe("readInboundRack", () => {
    it("returns empty when no params", () => {
        expect(readInboundRack("")).toEqual({});
    });

    it("reads account, temperature, trigger, persona", () => {
        const out = readInboundRack(
            "?account=Acme&temperature=hot&trigger=funding&persona=csuite"
        );
        expect(out).toEqual({
            accountName: "Acme",
            temperature: "hot",
            trigger: "funding",
            persona: "csuite"
        });
    });

    it("ignores invalid enum values silently", () => {
        const out = readInboundRack(
            "?account=Acme&temperature=garbage&trigger=fake&persona=evil"
        );
        expect(out).toEqual({ accountName: "Acme" });
    });

    it("survives malformed search strings", () => {
        expect(readInboundRack("?%")).toEqual({});
    });

    it("ignores empty account string", () => {
        expect(readInboundRack("?account=")).toEqual({});
    });
});
