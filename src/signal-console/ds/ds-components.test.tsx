import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import type { Account, Signal } from "../lib/types";
import { __setAllAccountsForTests, resetSession } from "../state";
import { AccountCardDS } from "./components/AccountCardDS";
import { SignalConsoleDS } from "./SignalConsoleDS";

function sig(over: Partial<Signal> = {}): Signal {
    return {
        id: `s_${Math.random().toString(36).slice(2)}`,
        headline: "Acme raised a Series B",
        published_date: "2026-06-10T00:00:00Z",
        confidence: 0.95,
        is_ai: true,
        ...over
    };
}

function acct(over: Partial<Account> = {}): Account {
    return {
        id: "a1",
        name: "Acme Industries",
        ticker: "ACME",
        industry: "Logistics",
        signals: [sig(), sig()],
        ...over
    } as Account;
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("AccountCardDS", () => {
    it("renders the account as a library Card with its glyph + heat Meter", () => {
        const { container, getByText } = render(<AccountCardDS account={acct()} />);
        expect(getByText("Acme Industries")).not.toBeNull();
        // Library Card shell + the account glyph in the kicker row.
        expect(container.querySelector(".ds-card")).not.toBeNull();
        expect(container.querySelector(".ds-card__icon .ds-icon")).not.toBeNull();
        // Heat is the library Meter (its one data-viz primitive).
        expect(container.querySelector(".ds-meter")).not.toBeNull();
    });

    it("renders signal rows each carrying the signal glyph", () => {
        const { container } = render(<AccountCardDS account={acct()} />);
        const rows = container.querySelectorAll(".scd-card__signal");
        expect(rows.length).toBe(2);
        expect(
            container.querySelector(".scd-card__signal-mark .ds-icon")
        ).not.toBeNull();
    });

    it("carries the dominant move as the one orange CTA", () => {
        const { container } = render(<AccountCardDS account={acct()} />);
        const accent = container.querySelector(".ds-card__foot .ds-btn--accent");
        expect(accent).not.toBeNull();
        expect(accent?.getAttribute("href")).toContain("/outbound-studio/");
    });
});

describe("SignalConsoleDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the radar", () => {
        __setAllAccountsForTests([acct()]);
        const { container, getAllByText } = render(<SignalConsoleDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        // Appears in the card title and the Wayfinder pulling cell.
        expect(getAllByText("Acme Industries").length).toBeGreaterThan(0);
        expect(container.querySelector(".scd-grid")).not.toBeNull();
    });

    it("shows the directional empty state when the radar is empty", () => {
        __setAllAccountsForTests([]);
        const { container } = render(<SignalConsoleDS />);
        expect(container.querySelector(".scd-empty")).not.toBeNull();
    });
});
