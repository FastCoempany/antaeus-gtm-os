import { describe, expect, it } from "vitest";
import {
    buildFutureAutopsyRoomHref,
    hrefToCallPlanner,
    hrefToDealWorkspace,
    hrefToDiscoveryStudio,
    hrefToPoC
} from "./handoff";

function params(url: string): URLSearchParams {
    return new URLSearchParams(url.split("?")[1] ?? "");
}

describe("buildFutureAutopsyRoomHref", () => {
    it("attaches the canonical continuity params", () => {
        const url = buildFutureAutopsyRoomHref({
            href: "/deal-workspace/",
            focusObject: "Acme",
            roomLabel: "Deal Workspace"
        });
        const p = params(url);
        expect(p.get("returnTo")).toBe("/future-autopsy/");
        expect(p.get("returnLabel")).toBe("Back to Future Autopsy");
        expect(p.get("focusObject")).toBe("Acme");
        expect(p.get("focusRoom")).toBe("Deal Workspace");
        expect(p.get("fromMode")).toBe("room");
        expect(p.get("fromSurface")).toBe("future-autopsy");
    });

    it("preserves existing query params", () => {
        const url = buildFutureAutopsyRoomHref({
            href: "/call-planner/?account=Acme",
            focusObject: "Acme",
            roomLabel: "Call Planner"
        });
        const p = params(url);
        expect(p.get("account")).toBe("Acme");
        expect(p.get("focusObject")).toBe("Acme");
    });

    it("merges in extra params", () => {
        const url = buildFutureAutopsyRoomHref({
            href: "/deal-workspace/",
            focusObject: "Acme",
            roomLabel: "Deal Workspace",
            extra: { deal: "deal-1" }
        });
        expect(params(url).get("deal")).toBe("deal-1");
    });
});

describe("convenience builders", () => {
    it("hrefToDealWorkspace includes deal id when provided", () => {
        expect(params(hrefToDealWorkspace("Acme", "deal-7")).get("deal")).toBe(
            "deal-7"
        );
    });

    it("hrefToCallPlanner targets call-planner + carries account", () => {
        const url = hrefToCallPlanner("Acme");
        expect(url.startsWith("/call-planner/?")).toBe(true);
        expect(params(url).get("account")).toBe("Acme");
        expect(params(url).get("focusRoom")).toBe("Call Planner");
    });

    it("hrefToPoC targets poc-framework", () => {
        expect(hrefToPoC("Acme").startsWith("/poc-framework/?")).toBe(true);
    });

    it("hrefToDiscoveryStudio targets discovery-studio + carries account", () => {
        expect(params(hrefToDiscoveryStudio("Acme")).get("account")).toBe("Acme");
    });
});
