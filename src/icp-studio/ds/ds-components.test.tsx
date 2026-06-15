import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import type { IcpDraft } from "../lib/types";
import { __setDraftForTests, __setSavedIcpsForTests, resetDraft } from "../state";
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
        expect(getByText("Sharp enough to run.")).not.toBeNull();
        // quality readout chip + the ICP card with the icp glyph
        expect(container.querySelector(".ds-card__icon .ds-icon")).not.toBeNull();
        // sharp → the strategy-flow handoff is present
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
    });
});

describe("IcpBuilder", () => {
    it("renders the subordinate form (role toggle + the targeting selects)", () => {
        __setDraftForTests(SHARP);
        const { container } = render(<IcpBuilder />);
        expect(container.querySelector(".ds-seg")).not.toBeNull();
        // several library selects (industry / size / geo / buyer / pain / …)
        expect(container.querySelectorAll(".ds-input").length).toBeGreaterThanOrEqual(6);
        // the dominant Save move is present + enabled for a sharp draft
        const save = container.querySelector(".ds-btn--accent");
        expect(save).not.toBeNull();
        expect((save as HTMLButtonElement).disabled).toBe(false);
    });

    it("disables Save until industry + size + buyer are set", () => {
        resetDraft();
        const { container } = render(<IcpBuilder />);
        const save = container.querySelector(".ds-btn--accent") as HTMLButtonElement;
        expect(save.disabled).toBe(true);
    });
});

describe("IcpStudioDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the Decision Bench", () => {
        __setDraftForTests(SHARP);
        const { container } = render(<IcpStudioDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        // the ObjectControls archetype — object dominant, controls aside
        expect(container.querySelector(".ds-arch-objectcontrols")).not.toBeNull();
    });
});
