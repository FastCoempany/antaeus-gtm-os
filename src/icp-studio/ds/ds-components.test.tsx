import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import type { IcpDraft } from "../lib/types";
import {
    __setDraftForTests,
    __setSavedIcpsForTests,
    draft,
    resetDraft
} from "../state";
import { IcpObject } from "./components/IcpObject";
import { IcpBuilder } from "./components/IcpBuilder";
import { IcpStudioDS } from "./IcpStudioDS";

const SHARP: IcpDraft = {
    role: "founder",
    industry: "Software (B2B SaaS)",
    industryCustom: "",
    size: "50-200 employees",
    geo: "US",
    buyer: "CFO",
    buyerCustom: "",
    pain: "Cost control / spend leakage",
    trigger: "Cost reduction mandate",
    proofWindow: "14 days",
    engineActive: "60"
};

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetDraft();
    __setSavedIcpsForTests([]);
});

describe("IcpObject", () => {
    it("renders the shaped ICP: statement, quality readout, handoff", () => {
        __setDraftForTests(SHARP);
        const { container, getByText } = render(<IcpObject />);
        expect(container.querySelector(".icpd-statement")).not.toBeNull();
        expect(getByText("ICP quality: highly specific")).not.toBeNull();
        expect(container.querySelector(".ds-card__icon .ds-icon")).not.toBeNull();
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
    });
});

describe("IcpBuilder", () => {
    it("renders the subordinate form (role toggle + the targeting selects)", () => {
        __setDraftForTests(SHARP);
        const { container } = render(<IcpBuilder />);
        expect(container.querySelector(".ds-seg")).not.toBeNull();
        expect(container.querySelectorAll(".ds-input").length).toBeGreaterThanOrEqual(6);
        const save = container.querySelector(".ds-btn--accent");
        expect(save).not.toBeNull();
        expect((save as HTMLButtonElement).disabled).toBe(false);
    });

    it("the role toggle selects the non-first segment (not hijacked by a label)", () => {
        __setDraftForTests({ ...SHARP, role: "founder" });
        const { getByText } = render(<IcpBuilder />);
        fireEvent.click(getByText("First AE"));
        expect(draft.value.role).toBe("firstae");
    });

    it("disables Save until industry + size + buyer are set", () => {
        resetDraft();
        const { container } = render(<IcpBuilder />);
        const save = container.querySelector(".ds-btn--accent") as HTMLButtonElement;
        expect(save.disabled).toBe(true);
    });
});

describe("IcpStudioDS", () => {
    it("composes the Wayfinder over the ICP decision surface", () => {
        __setDraftForTests(SHARP);
        const { container } = render(<IcpStudioDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-objectcontrols")).not.toBeNull();
    });
});
