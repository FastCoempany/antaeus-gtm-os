import { describe, expect, it } from "vitest";
import { render } from "@testing-library/preact";
import { Icon } from "./Icon";
import { DEFAULT_ACCENTS, GLYPHS, ICON_NAMES } from "./manifest";

describe("the icon inventory", () => {
    it("carries exactly the 46 glyphs spec 09 §3 names", () => {
        expect(ICON_NAMES).toHaveLength(46);
        // One spot-check per category: noun, verb, system, status.
        for (const name of ["signal", "send", "wayfinder", "at-risk"]) {
            expect(ICON_NAMES).toContain(name);
        }
    });

    it("every name resolves to a component", () => {
        for (const name of ICON_NAMES) {
            expect(GLYPHS[name]).toBeTypeOf("function");
        }
    });

    it("accents are rationed: few glyphs carry one, in role colors only", () => {
        const accented = Object.entries(DEFAULT_ACCENTS);
        expect(accented.length).toBeLessThanOrEqual(12); // rationed, not a palette
        for (const [, accent] of accented) {
            expect(["orange", "blue", "green", "amber", "red"]).toContain(
                accent,
            );
        }
        // The canonical pair: Signal is blue, Send is orange (09 §1.2).
        expect(DEFAULT_ACCENTS["signal"]).toBe("blue");
        expect(DEFAULT_ACCENTS["send"]).toBe("orange");
    });
});

describe("<Icon> rendering", () => {
    it("renders an aria-hidden SVG at the default 20px beside text", () => {
        const { container } = render(<Icon name="account" />);
        const svg = container.querySelector("svg");
        expect(svg).not.toBeNull();
        expect(svg?.getAttribute("aria-hidden")).toBe("true");
        expect(svg?.getAttribute("width")).toBe("20");
        expect(container.querySelector("[role='img']")).toBeNull();
    });

    it("spec 09 construction holds: 2px keyline, flat terminals, miter joins", () => {
        const { container } = render(<Icon name="deal" />);
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("stroke-width")).toBe("2");
        expect(svg?.getAttribute("stroke-linecap")).toBe("butt");
        expect(svg?.getAttribute("stroke-linejoin")).toBe("miter");
        expect(svg?.getAttribute("fill")).toBe("none");
    });

    it("icon-alone carries the accessible name", () => {
        const { container } = render(<Icon name="close" label="Close" />);
        const wrapper = container.querySelector("[role='img']");
        expect(wrapper?.getAttribute("aria-label")).toBe("Close");
    });

    it("sets the rationed-tick variable from the manifest default", () => {
        const { container } = render(<Icon name="signal" />);
        const span = container.querySelector("span");
        expect(span?.getAttribute("style") ?? "").toContain(
            "--ds-icon-accent",
        );
    });

    it("renders all 46 without throwing", () => {
        for (const name of ICON_NAMES) {
            const { container } = render(<Icon name={name} size={16} />);
            expect(container.querySelector("svg")).not.toBeNull();
        }
    });
});
