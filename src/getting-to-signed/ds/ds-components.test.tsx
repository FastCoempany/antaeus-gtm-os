import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import {
    __resetForTests,
    draft,
    learnings,
    setDealId,
    setLinkedDeals,
    setOpeningLine,
    setStartingPosition,
    setWalkawayPosition
} from "../state";
import type { LinkedDealSummary } from "../lib/types";
import { RehearsalObject } from "./components/RehearsalObject";
import { RouteControls } from "./components/RouteControls";
import { NegotiationDS } from "./NegotiationDS";

function deal(over: Partial<LinkedDealSummary> = {}): LinkedDealSummary {
    return {
        id: "d1",
        accountName: "Northwind Robotics",
        stage: "negotiation",
        value: 80000,
        ...over
    };
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    __resetForTests();
});

describe("RehearsalObject", () => {
    it("renders the read, the opening line, the ladder, the pushbacks, the outcome, and the handoff", () => {
        const { container } = render(<RehearsalObject />);
        expect(container.querySelector(".ngd-read")).not.toBeNull();
        // seed ladder + pushbacks present from __resetForTests
        expect(container.querySelector(".ngd-ladder__steps")).not.toBeNull();
        expect(container.querySelectorAll(".ngd-ladder__step").length).toBeGreaterThan(0);
        expect(container.querySelector(".ngd-pushbacks__list")).not.toBeNull();
        expect(container.querySelectorAll(".ngd-pushback").length).toBeGreaterThan(0);
        expect(container.querySelector(".ngd-outcome")).not.toBeNull();
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
    });

    it("reads improvising with an empty draft and rehearsed once the positions are decided", () => {
        const first = render(<RehearsalObject />);
        expect(first.getByText("Improvising")).not.toBeNull();
        cleanup();

        setWalkawayPosition("No below 15% off.");
        setStartingPosition("List price, full terms.");
        setOpeningLine("Thanks for making time today.");
        const second = render(<RehearsalObject />);
        expect(second.getByText("Rehearsed")).not.toBeNull();
        // the opening line surfaces as the actual first words
        expect(second.container.querySelector(".ngd-opening__line")).not.toBeNull();
    });

    it("shows the empty opening-line prompt before one is authored", () => {
        const { container } = render(<RehearsalObject />);
        expect(container.querySelector(".ngd-opening__empty")).not.toBeNull();
        expect(container.querySelector(".ngd-opening__line")).toBeNull();
    });

    it("logs a lesson-learned through the form", () => {
        const { container } = render(<RehearsalObject />);
        const input = container.querySelector(
            ".ngd-learning__input"
        ) as HTMLInputElement;
        const form = container.querySelector(
            ".ngd-learning__form"
        ) as HTMLFormElement;
        input.value = "Never open with the discount.";
        fireEvent.submit(form);
        expect(learnings.value[0]?.text).toBe("Never open with the discount.");
    });

    it("logs no outcome until one is picked, then highlights only that one", () => {
        const first = render(<RehearsalObject />);
        // no button is primary before the conversation is logged
        expect(
            first.container.querySelector(".ngd-outcome__buttons .ds-btn--primary")
        ).toBeNull();
        const held = first.getByText("Held position");
        fireEvent.click(held);
        expect(draft.value.outcome).toBe("held_position");
        cleanup();

        const second = render(<RehearsalObject />);
        const primaries = second.container.querySelectorAll(
            ".ngd-outcome__buttons .ds-btn--primary"
        );
        expect(primaries.length).toBe(1);
        expect(primaries[0]!.textContent).toBe("Held position");
    });

    it("threads the linked deal into the handoff primary route", () => {
        setLinkedDeals([deal()]);
        setDealId("d1");
        const { container } = render(<RehearsalObject />);
        const primary = container.querySelector(
            '[data-handoff="deal-workspace"]'
        ) as HTMLAnchorElement | null;
        expect(primary).not.toBeNull();
        expect(primary!.getAttribute("href")).toContain("deal=d1");
    });
});

describe("RouteControls", () => {
    it("renders the route + the three pre-decided positions", () => {
        const { container, getByText } = render(<RouteControls />);
        expect(getByText("THE ROUTE")).not.toBeNull();
        expect(getByText("THE THREE YOU'VE DECIDED")).not.toBeNull();
        // 3 textareas: starting / walkaway / opening
        expect(container.querySelectorAll("textarea").length).toBe(3);
    });

    it("switching the counterparty swaps the seed pushbacks", () => {
        render(<RouteControls />);
        const before = draft.value.pushbacks;
        // segmented control renders the counterparty options as buttons
        const proc = document.querySelector(
            '[aria-label="Counterparty role"]'
        );
        expect(proc).not.toBeNull();
        const procBtn = Array.from(proc!.querySelectorAll("button")).find((b) =>
            (b.textContent ?? "").includes("Procurement")
        );
        expect(procBtn).toBeDefined();
        fireEvent.click(procBtn!);
        expect(draft.value.counterparty).toBe("procurement");
        expect(draft.value.pushbacks).not.toBe(before);
    });
});

describe("NegotiationDS", () => {
    it("mounts the wayfinder + the object-controls composition", () => {
        const { container } = render(<NegotiationDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ngd-object")).not.toBeNull();
        expect(container.querySelector(".ngd-controls")).not.toBeNull();
    });

    it("surfaces the pulling cell only once a deal is linked", () => {
        const noDeal = render(<NegotiationDS />);
        expect(noDeal.container.querySelector(".ds-wayfinder__pulling")).toBeNull();
        cleanup();

        setLinkedDeals([deal()]);
        setDealId("d1");
        const withDeal = render(<NegotiationDS />);
        expect(
            withDeal.container.querySelector(".ds-wayfinder__pulling")
        ).not.toBeNull();
    });
});
