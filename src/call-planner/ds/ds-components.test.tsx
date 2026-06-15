import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import {
    __setAccountOptionsForTests,
    __setDealOptionsForTests,
    draft,
    resetSession,
    setContactName
} from "../state";
import { AgendaObject } from "./components/AgendaObject";
import { WitnessForm } from "./components/WitnessForm";
import { CallPlannerDS } from "./CallPlannerDS";

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("AgendaObject", () => {
    it("renders the quality read, the four stops, the outcomes, and the routes", () => {
        const { container, getByText } = render(<AgendaObject />);
        expect(container.querySelector(".cpd-quality")).not.toBeNull();
        expect(container.querySelector(".ds-meter")).not.toBeNull();
        // four stops
        expect(container.querySelectorAll(".cpd-stops .ds-card").length).toBe(4);
        // three probes
        expect(container.querySelectorAll(".cpd-probe").length).toBe(3);
        expect(getByText("Run the discovery call")).not.toBeNull();
        expect(container.querySelectorAll(".cpd-outcomes__row .ds-btn").length).toBe(5);
    });
});

describe("WitnessForm", () => {
    it("renders the witness controls + the dossier", () => {
        const { container } = render(<WitnessForm />);
        expect(container.querySelectorAll(".ds-field").length).toBeGreaterThanOrEqual(4);
        expect(container.querySelector(".cpd-dossier")).not.toBeNull();
    });
    it("drives the contact name through the draft", () => {
        const { container } = render(<WitnessForm />);
        const input = container.querySelector(
            'input[type="text"]'
        ) as HTMLInputElement;
        fireEvent.input(input, { target: { value: "Sarah Chen" } });
        expect(draft.value.contactName).toBe("Sarah Chen");
    });
    it("shows the top signal in the dossier when an account matches", () => {
        __setAccountOptionsForTests([
            {
                id: "a1",
                name: "Acme Industries",
                heat: 90,
                topSignal: { headline: "New CFO hired", publishedDate: "" }
            }
        ]);
        setContactName("Acme Industries");
        const { getByText } = render(<WitnessForm />);
        expect(getByText("New CFO hired")).not.toBeNull();
    });
});

describe("CallPlannerDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the ObjectControls bench", () => {
        const { container } = render(<CallPlannerDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-objectcontrols")).not.toBeNull();
        // bright — no legacy 2-col board shell
        expect(container.querySelector(".cp-board")).toBeNull();
    });
    it("surfaces the pulling cell once a contact is named", () => {
        __setDealOptionsForTests([]);
        setContactName("Sarah Chen");
        const { container, getByText } = render(<CallPlannerDS />);
        expect(getByText("Run discovery")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__pulling")).not.toBeNull();
    });
});
