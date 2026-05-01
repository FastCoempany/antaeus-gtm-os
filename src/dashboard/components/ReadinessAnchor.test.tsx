import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/preact";
import { ReadinessAnchor } from "./ReadinessAnchor";

describe("ReadinessAnchor", () => {
    it("renders the kicker + verdict label + chevron", () => {
        const { getByText, container } = render(
            <ReadinessAnchor
                verdict="building"
                verdictLabel="Building"
                onOpen={() => {}}
            />
        );
        expect(getByText("READINESS")).toBeTruthy();
        expect(getByText("Building")).toBeTruthy();
        expect(container.querySelector(".db-readiness-anchor__chevron")).toBeTruthy();
    });

    it("applies tone class per verdict", () => {
        const { container, rerender } = render(
            <ReadinessAnchor
                verdict="hire_ready_repeatable"
                verdictLabel="Hire-ready, repeatable"
                onOpen={() => {}}
            />
        );
        expect(
            container.querySelector(".db-readiness-anchor--gold")
        ).toBeTruthy();

        rerender(
            <ReadinessAnchor
                verdict="you_are_the_system"
                verdictLabel="You are the system"
                onOpen={() => {}}
            />
        );
        expect(
            container.querySelector(".db-readiness-anchor--ink")
        ).toBeTruthy();
    });

    it("calls onOpen when clicked", () => {
        const onOpen = vi.fn();
        const { container } = render(
            <ReadinessAnchor
                verdict="hire_ready"
                verdictLabel="Hire-ready"
                onOpen={onOpen}
            />
        );
        const btn = container.querySelector(".db-readiness-anchor");
        fireEvent.click(btn!);
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("exposes accessible aria-label combining verdict + cta", () => {
        const { container } = render(
            <ReadinessAnchor
                verdict="inheritable_with_guardrails"
                verdictLabel="Inheritable with guardrails"
                onOpen={() => {}}
            />
        );
        const btn = container.querySelector(".db-readiness-anchor");
        const label = btn?.getAttribute("aria-label") ?? "";
        expect(label).toContain("Inheritable with guardrails");
        expect(label.toLowerCase()).toContain("open");
    });
});
