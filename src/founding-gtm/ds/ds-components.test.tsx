import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import { __resetForTests } from "../state";
import { SectionCard } from "./components/SectionCard";
import { FoundingGtmDS } from "./FoundingGtmDS";
import type { AuthoredSection } from "../lib/types";

function readySection(): AuthoredSection {
    return {
        id: "who_hits",
        kicker: "§1 / Who",
        title: "Who hits, who misses, why",
        status: "ready",
        body: ["Mid-market ops teams with a new CFO closed the most.", "Enterprise IT stalled."],
        evidence: ["Won: Northwind (Mid-market ops)", "Lost: Atlas (Enterprise IT)"],
        surprise: {
            headline: "Your stated ICP doesn't match the actual close pattern.",
            body: "You named enterprise IT, but every win was mid-market ops.",
            tone: "corrective"
        }
    };
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    __resetForTests();
});

describe("SectionCard", () => {
    it("renders the section with its status, body, evidence, and surprise", () => {
        const { container, getByText } = render(
            <SectionCard id="who_hits" section={readySection()} />
        );
        expect(container.querySelector(".ds-card")).not.toBeNull();
        expect(getByText("Who hits, who misses, why")).not.toBeNull();
        expect(container.querySelectorAll(".fgd-section__para").length).toBe(2);
        expect(container.querySelector(".fgd-surprise")).not.toBeNull();
        expect(container.querySelector(".fgd-surprise__rule")?.getAttribute("data-tone")).toBe("amber");
    });
    it("renders the empty state when no section is authored", () => {
        const { container } = render(<SectionCard id="who_hits" section={null} />);
        expect(container.querySelector(".fgd-section__empty")).not.toBeNull();
        expect(container.querySelector(".fgd-surprise")).toBeNull();
    });
});

describe("FoundingGtmDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the seven sections", () => {
        const { container } = render(<FoundingGtmDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".fgd-summary")).not.toBeNull();
        // seven section cards
        expect(container.querySelectorAll(".fgd-section").length).toBe(7);
        // the kit-readiness progress ladder
        expect(container.querySelector(".ds-progress")).not.toBeNull();
        // legacy shell gone
        expect(container.querySelector(".fg-shell")).toBeNull();
    });
});
