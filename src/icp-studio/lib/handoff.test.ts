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
            href: "/territory-architect/",
            focusObject: "Logistics",
            roomLabel: "Territory Architect"
        });
        expect(url).toContain("returnTo=%2Ficp-studio%2F");
        expect(url).toContain("returnLabel=Back+to+ICP+Studio");
        expect(url).toContain("focusObject=Logistics");
        expect(url).toContain("focusRoom=Territory+Architect");
        expect(url).toContain("fromMode=room");
        expect(url).toContain("fromSurface=icp-studio");
    });

    it("preserves pre-existing query params", () => {
        const url = buildIcpStudioHref({
            href: "/sourcing-workbench/?tier=t1",
            focusObject: "Logistics",
            roomLabel: "Sourcing Workbench"
        });
        expect(url).toContain("tier=t1");
        expect(url).toContain("returnTo=%2Ficp-studio%2F");
    });

    it("does not overwrite an existing returnTo on the href", () => {
        const url = buildIcpStudioHref({
            href: "/x/?returnTo=%2Fother%2F",
            focusObject: "Logistics",
            roomLabel: "X"
        });
        expect(url).toContain("returnTo=%2Fother%2F");
        expect(url).not.toContain("returnTo=%2Ficp-studio%2F");
    });
});

describe("convenience builders", () => {
    it("send to the right paths with industry as focus", () => {
        expect(hrefToTerritoryArchitect("Logistics")).toContain(
            "/territory-architect/"
        );
        expect(hrefToSourcingWorkbench("Logistics")).toContain(
            "/sourcing-workbench/"
        );
        expect(hrefToSignalConsole("Logistics")).toContain(
            "/signal-console/"
        );
        expect(hrefToOutboundStudio("Logistics")).toContain(
            "/outbound-studio/"
        );
    });

    it("omits focusObject when industry is empty (no placeholder)", () => {
        // Phase 2.3 audit — retired the "ICP ICP" placeholder per
        // continuity-params Invariant 8. Empty focusObject = no
        // param written. Same fix as LinkedIn Playbook P2 earlier.
        const url = hrefToTerritoryArchitect("");
        expect(url).not.toContain("focusObject=");
        // Continuity still present.
        expect(url).toContain("returnTo=%2Ficp-studio%2F");
        expect(url).toContain("fromMode=room");
    });
});
