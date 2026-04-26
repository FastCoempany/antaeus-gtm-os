import { describe, expect, it } from "vitest";
import {
    buildSignalRoomHref,
    hrefToColdCall,
    hrefToDealWorkspace,
    hrefToDiscoveryAgenda,
    hrefToOutbound
} from "./handoff";

function params(url: string): URLSearchParams {
    const qs = url.split("?")[1] ?? "";
    return new URLSearchParams(qs);
}

describe("buildSignalRoomHref", () => {
    it("attaches the canonical continuity params", () => {
        const url = buildSignalRoomHref({
            href: "/app/deal-workspace/",
            focusObject: "Acme",
            roomLabel: "Deal Workspace"
        });
        const p = params(url);
        expect(p.get("returnTo")).toBe("/app/signal-console/");
        expect(p.get("returnLabel")).toBe("Back to Signal Console");
        expect(p.get("focusObject")).toBe("Acme");
        expect(p.get("focusRoom")).toBe("Deal Workspace");
        expect(p.get("fromMode")).toBe("room");
        expect(p.get("fromSurface")).toBe("signal-console");
    });

    it("preserves existing query params on the destination href", () => {
        const url = buildSignalRoomHref({
            href: "/app/outbound-studio/?account=Acme&temperature=warm",
            focusObject: "Acme",
            roomLabel: "Outbound Studio"
        });
        const p = params(url);
        expect(p.get("account")).toBe("Acme");
        expect(p.get("temperature")).toBe("warm");
        expect(p.get("focusObject")).toBe("Acme");
    });

    it("merges in extra params when provided", () => {
        const url = buildSignalRoomHref({
            href: "/app/discovery-agenda/",
            focusObject: "Acme",
            roomLabel: "Call Planner",
            extra: { account: "Acme", custom: "value" }
        });
        const p = params(url);
        expect(p.get("account")).toBe("Acme");
        expect(p.get("custom")).toBe("value");
    });
});

describe("convenience builders", () => {
    it("hrefToOutbound includes account + temperature when provided", () => {
        const p = params(hrefToOutbound("Beta", "hot"));
        expect(p.get("account")).toBe("Beta");
        expect(p.get("temperature")).toBe("hot");
        expect(p.get("focusRoom")).toBe("Outbound Studio");
    });

    it("hrefToDealWorkspace targets /app/deal-workspace/", () => {
        const url = hrefToDealWorkspace("Gamma");
        expect(url.startsWith("/app/deal-workspace/?")).toBe(true);
        expect(params(url).get("focusRoom")).toBe("Deal Workspace");
    });

    it("hrefToDiscoveryAgenda + hrefToColdCall pass account through", () => {
        expect(params(hrefToDiscoveryAgenda("Acme")).get("account")).toBe("Acme");
        expect(params(hrefToColdCall("Acme")).get("account")).toBe("Acme");
    });
});
