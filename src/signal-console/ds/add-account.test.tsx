import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { resetSession } from "../state";
import { AddAccountFormDS } from "./components/AddAccountFormDS";

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("AddAccountFormDS", () => {
    it("embedded: renders the library form with the dominant add move", () => {
        const { container, getByText } = render(<AddAccountFormDS embedded />);
        expect(container.querySelector(".scd-add")).not.toBeNull();
        // library inputs, not the legacy sc-add-form
        expect(container.querySelectorAll(".ds-input").length).toBeGreaterThanOrEqual(4);
        expect(container.querySelector(".ds-textarea")).not.toBeNull();
        expect(getByText("Add the account")).not.toBeNull();
        expect(container.querySelector(".sc-add-form")).toBeNull();
    });

    it("toggled: starts as a trigger, expands to the form on click", () => {
        const { container, getByText } = render(<AddAccountFormDS />);
        expect(container.querySelector(".scd-add-trigger")).not.toBeNull();
        expect(container.querySelector(".scd-add")).toBeNull();
        fireEvent.click(getByText("Add an account"));
        expect(container.querySelector(".scd-add")).not.toBeNull();
    });

    it("disables the add until a name is entered", () => {
        const { getByText } = render(<AddAccountFormDS embedded />);
        expect(getByText("Add the account").closest("button")?.disabled).toBe(true);
    });
});
