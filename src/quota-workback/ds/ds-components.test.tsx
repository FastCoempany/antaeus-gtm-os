import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { inputs, patchInputs, resetSession } from "../state";
import { PlanLedger } from "./components/PlanLedger";
import { InputControls } from "./components/InputControls";
import { QuotaWorkbackDS } from "./QuotaWorkbackDS";

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("PlanLedger", () => {
    it("renders the weekly-pressure hero, the cascade, and the coverage", () => {
        patchInputs({ quota: 1_200_000, acv: 50_000 });
        const { container } = render(<PlanLedger />);
        expect(container.querySelector(".qwd-hero")).not.toBeNull();
        expect(container.querySelectorAll(".qwd-cascade .ds-card").length).toBe(4);
        expect(container.querySelector(".qwd-coverage")).not.toBeNull();
    });
    it("surfaces the handoff once a quota is set", () => {
        patchInputs({ quota: 1_200_000, acv: 50_000 });
        const { container } = render(<PlanLedger />);
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
    });
    it("shows the empty hero with no quota", () => {
        const { container } = render(<PlanLedger />);
        expect(container.querySelector(".qwd-hero__value")?.textContent).toBe("—");
        expect(container.querySelector(".ds-handoff")).toBeNull();
    });
});

describe("InputControls", () => {
    it("renders the target controls", () => {
        const { container, getByText } = render(<InputControls />);
        expect(container.querySelectorAll(".ds-field").length).toBeGreaterThanOrEqual(3);
        expect(getByText("Apply benchmark")).not.toBeNull();
    });
    it("drives the quota through the inputs", () => {
        const { container } = render(<InputControls />);
        const input = container.querySelector("input") as HTMLInputElement;
        fireEvent.input(input, { target: { value: "1,500,000" } });
        expect(inputs.value.quota).toBe(1_500_000);
    });
});

describe("QuotaWorkbackDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the ObjectControls ledger", () => {
        const { container } = render(<QuotaWorkbackDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-objectcontrols")).not.toBeNull();
        // bright — no legacy shell
        expect(container.querySelector(".qw-plan")).toBeNull();
    });
});
