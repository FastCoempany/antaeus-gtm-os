import { describe, expect, it } from "vitest";
import { render } from "@testing-library/preact";
import { BackButton } from "./back-button";

describe("BackButton", () => {
    it("renders nothing when no context + no URL params", () => {
        const { container } = render(
            <BackButton context={{
                returnTo: null,
                returnLabel: null,
                focusObject: null,
                focusRoom: null,
                fromMode: null,
                fromSurface: null
            }} />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renders an anchor with returnLabel when both are present", () => {
        const { container } = render(
            <BackButton context={{
                returnTo: "/quota-workback/",
                returnLabel: "Back to Quota Workback",
                focusObject: null,
                focusRoom: null,
                fromMode: null,
                fromSurface: null
            }} />
        );
        const a = container.querySelector("a.c-back");
        expect(a).not.toBeNull();
        expect(a?.getAttribute("href")).toBe("/quota-workback/");
        expect(a?.textContent).toContain("Back to Quota Workback");
    });

    it("uses fallbackLabel when returnLabel missing", () => {
        const { container } = render(
            <BackButton
                context={{
                    returnTo: "/dashboard/",
                    returnLabel: null,
                    focusObject: null,
                    focusRoom: null,
                    fromMode: null,
                    fromSurface: null
                }}
                fallbackLabel="Back to Dashboard"
            />
        );
        const a = container.querySelector("a.c-back");
        expect(a?.textContent).toContain("Back to Dashboard");
    });

    it("uses 'Back' when no returnLabel + no fallback", () => {
        const { container } = render(
            <BackButton context={{
                returnTo: "/x/",
                returnLabel: null,
                focusObject: null,
                focusRoom: null,
                fromMode: null,
                fromSurface: null
            }} />
        );
        expect(container.querySelector("a.c-back")?.textContent).toContain(
            "Back"
        );
    });

    it("rejects unsafe returnTo values (open-redirect protection)", () => {
        const { container } = render(
            <BackButton context={{
                returnTo: "https://evil.example/phish",
                returnLabel: "Click me",
                focusObject: null,
                focusRoom: null,
                fromMode: null,
                fromSurface: null
            }} />
        );
        expect(container.firstChild).toBeNull();
    });

    it("merges custom className with c-back", () => {
        const { container } = render(
            <BackButton
                context={{
                    returnTo: "/x/",
                    returnLabel: "Back",
                    focusObject: null,
                    focusRoom: null,
                    fromMode: null,
                    fromSurface: null
                }}
                className="dw-back"
            />
        );
        const a = container.querySelector("a");
        expect(a?.className).toContain("c-back");
        expect(a?.className).toContain("dw-back");
    });
});
