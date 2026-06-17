import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import type { Focus, TerritoryAccount } from "../lib/types";
import { resetSession, setAccounts, setFocuses } from "../state";
import { TerritoryObject } from "./components/TerritoryObject";
import { TerritoryBuilder } from "./components/TerritoryBuilder";
import { TerritoryArchitectDS } from "./TerritoryArchitectDS";

function focus(over: Partial<Focus> = {}): Focus {
    return {
        id: "th1",
        title: "Procurement consolidation",
        pressure: "Budgets just got cut",
        segment: "Software (B2B SaaS)",
        whyUs: "We've done this exact migration",
        tier: "t1",
        accountIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...over
    };
}

function account(over: Partial<TerritoryAccount> = {}): TerritoryAccount {
    return {
        id: "acct1",
        name: "Acme Industries",
        tier: "t1",
        focusId: "th1",
        approachId: "",
        disposition: "active",
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...over
    };
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("TerritoryObject", () => {
    it("renders the field read, the 300-cap, and the focuses", () => {
        setFocuses([focus()]);
        setAccounts([account()]);
        const { container, getByText } = render(<TerritoryObject />);
        // field read readout
        expect(container.querySelector(".tad-read")).not.toBeNull();
        // the 300-cap allocation as a library Card + Meters
        expect(container.querySelector(".ds-meter")).not.toBeNull();
        // the focus renders with its glyph + the strategic narrative
        expect(getByText("Procurement consolidation")).not.toBeNull();
        expect(container.querySelector(".ds-card__icon .ds-icon")).not.toBeNull();
        // with focuses + accounts, the sourcing handoff is present
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
    });

    it("is directional when there are no focuses", () => {
        const { container } = render(<TerritoryObject />);
        expect(container.querySelector(".tad-empty")).not.toBeNull();
    });
});

describe("TerritoryBuilder", () => {
    it("renders the three builders (focus / approach / account)", () => {
        setFocuses([focus()]);
        const { container } = render(<TerritoryBuilder />);
        expect(container.querySelectorAll(".tad-form").length).toBe(3);
        // the dominant Save-the-focus move
        const save = container.querySelector(".ds-btn--accent");
        expect(save).not.toBeNull();
    });

    it("disables the account add at the 300 ceiling", () => {
        setFocuses([focus()]);
        // 300 active accounts → at ceiling
        setAccounts(Array.from({ length: 300 }, (_, i) => account({ id: `a${i}` })));
        const { container, getByText } = render(<TerritoryBuilder />);
        // the account add button is disabled with the ceiling reason
        expect(getByText("Add the account").closest("button")?.disabled).toBe(true);
        expect(container.textContent).toContain("300 ceiling");
    });
});

describe("TerritoryArchitectDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the Decision Bench", () => {
        setFocuses([focus()]);
        setAccounts([account()]);
        const { container } = render(<TerritoryArchitectDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-objectcontrols")).not.toBeNull();
    });
});
