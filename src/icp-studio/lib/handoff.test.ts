import { describe, expect, it } from "vitest";
import {
    buildIcpStudioHref,
    hrefToOutboundStudio,
    hrefToSignalConsole,
    hrefToSourcingWorkbench,
    hrefToTerritoryArchitect
} from "./handoff";

describe("buildIcpStudioHref", () => {
    it("appends the canonical continuity params", () => {
        const url = buildIcpStudioHref({
            href: "/app/territory-architect/",
            focusObject: "Logistics",
            roomLabel: "Territory Architect"
        });
        expect(url).toContain("returnTo=%2Fapp%2Ficp-studio%2F");
        expect(url).toContain("returnLabel=Back+to+ICP+Studio");
        expect(url).toContain("focusObject=Logistics");
        expect(url).toContain("focusRoom=Territory+Architect");
        expect(url).toContain("fromMode=room");
        expect(url).toContain("fromSurface=icp-studio");
    });

    it("preserves pre-existing query params", () => {
        const url = buildIcpStudioHref({
            href: "/app/sourcing-workbench/?tier=t1",
            focusObject: "Logistics",
            roomLabel: "Sourcing Workbench"
        });
        expect(url).toContain("tier=t1");
        expect(url).toContain("returnTo=%2Fapp%2Ficp-studio%2F");
    });

    it("does not overwrite an existing returnTo on the href", () => {
        const url = buildIcpStudioHref({
            href: "/app/x/?returnTo=%2Fother%2F",
            focusObject: "Logistics",
            roomLabel: "X"
        });
        expect(url).toContain("returnTo=%2Fother%2F");
        expect(url).not.toContain("returnTo=%2Fapp%2Ficp-studio%2F");
    });
});

describe("convenience builders", () => {
    it("send to the right paths with industry as focus", () => {
        expect(hrefToTerritoryArchitect("Logistics")).toContain(
            "/app/territory-architect/"
        );
        expect(hrefToSourcingWorkbench("Logistics")).toContain(
            "/app/sourcing-workbench/"
        );
        expect(hrefToSignalConsole("Logistics")).toContain(
            "/app/signal-console/"
        );
        expect(hrefToOutboundStudio("Logistics")).toContain(
            "/app/outbound-studio/"
        );
    });

    it("uses fallback focus when industry is empty", () => {
        const url = hrefToTerritoryArchitect("");
        expect(url).toContain("focusObject=ICP+wedge");
    });
});
