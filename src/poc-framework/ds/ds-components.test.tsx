import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { draft, patchDraft, resetSession } from "../state";
import { ProofObject } from "./components/ProofObject";
import { ForgeForm } from "./components/ForgeForm";
import { PocFrameworkDS } from "./PocFrameworkDS";

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("ProofObject", () => {
    it("renders the quality read, the heat ledger, the five molds, and the documents", () => {
        const { container, getByText } = render(<ProofObject />);
        expect(container.querySelector(".pocd-read")).not.toBeNull();
        expect(container.querySelectorAll(".pocd-heat .ds-meter").length).toBe(3);
        expect(container.querySelectorAll(".pocd-molds .ds-card").length).toBe(5);
        expect(container.querySelector(".pocd-docs__body")).not.toBeNull();
        expect(getByText("Copy the document")).not.toBeNull();
    });
    it("surfaces the handoff once an account is named", () => {
        patchDraft({ account: "Acme Industries" });
        const { container } = render(<ProofObject />);
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
    });
});

describe("ForgeForm", () => {
    it("renders the forge controls", () => {
        const { container, getByText } = render(<ForgeForm />);
        expect(container.querySelectorAll(".ds-field").length).toBeGreaterThanOrEqual(6);
        expect(getByText("Cast the evidence")).not.toBeNull();
    });
    it("the pilot-window toggle selects the non-first segment (not hijacked by a label)", () => {
        const { getByText } = render(<ForgeForm />);
        // Regression: the SegmentedControl must NOT be wrapped in a
        // FormField <label> — a label forwards clicks to its first
        // segment, so "14-day" would never select.
        fireEvent.click(getByText("14-day"));
        expect(draft.value.durationDays).toBe(14);
    });
    it("drives the account through the draft", () => {
        const { container } = render(<ForgeForm />);
        const input = container.querySelector(
            'input[type="text"]'
        ) as HTMLInputElement;
        fireEvent.input(input, { target: { value: "Acme Industries" } });
        expect(draft.value.account).toBe("Acme Industries");
    });
});

describe("PocFrameworkDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the ObjectControls bench", () => {
        const { container } = render(<PocFrameworkDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-objectcontrols")).not.toBeNull();
        // bright — no legacy dark forge shell
        expect(container.querySelector(".poc-forge")).toBeNull();
    });
});
