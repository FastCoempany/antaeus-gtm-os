import { describe, expect, it } from "vitest";
import { render } from "@testing-library/preact";
import { RoomChrome } from "./room-chrome";

describe("RoomChrome", () => {
    it("renders wordmark with kicker", () => {
        const { container } = render(<RoomChrome kicker="DEAL WORKSPACE" />);
        const wordmark = container.querySelector(".ant-wordmark");
        expect(wordmark).not.toBeNull();
        expect(wordmark?.textContent).toContain("ANTAEUS");
        expect(wordmark?.textContent).toContain("DEAL WORKSPACE");
    });

    it("wraps in .ant-room-chrome container", () => {
        const { container } = render(<RoomChrome kicker="DASHBOARD" />);
        expect(container.querySelector(".ant-room-chrome")).not.toBeNull();
    });

    it("includes BackButton (renders null without continuity)", () => {
        // Without a window.location.search carrying continuity, BackButton
        // returns null — so the chrome should NOT have a .c-back anchor.
        const { container } = render(<RoomChrome kicker="DISCOVERY STUDIO" />);
        expect(container.querySelector(".c-back")).toBeNull();
    });

    it("renders aux content slot when provided", () => {
        const { container } = render(
            <RoomChrome
                kicker="DASHBOARD"
                aux={<span class="test-aux">aux-content</span>}
            />
        );
        const aux = container.querySelector(".test-aux");
        expect(aux).not.toBeNull();
        expect(aux?.textContent).toBe("aux-content");
    });

    it("passes workspace through to wordmark", () => {
        const { container } = render(
            <RoomChrome kicker="DASHBOARD" workspace="Antaeus" />
        );
        const workspace = container.querySelector(".ant-wordmark__workspace");
        expect(workspace?.textContent).toBe("Antaeus");
    });
});
