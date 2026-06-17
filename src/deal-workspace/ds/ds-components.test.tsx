import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import type { Deal } from "../lib/deal-shape";
import { assessDeal } from "../lib/recovery";
import { __setAllDealsForTests, resetSession } from "../state";
import { DealCard } from "./components/DealCard";
import { DealWorkspaceDS } from "./DealWorkspaceDS";

function deal(over: Partial<Deal> = {}): Deal {
    return {
        id: "d1",
        accountName: "Acme Industries",
        value: 84000,
        stage: "negotiation",
        // 60 days stale → critical
        updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
        ...over
    } as Deal;
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("DealCard", () => {
    it("renders an at-risk deal as a RiskCard with cause, move + score", () => {
        const a = assessDeal(deal())!;
        const { container, getByText } = render(<DealCard assessment={a} />);
        expect(getByText("Acme Industries")).not.toBeNull();
        expect(container.querySelector(".ds-riskcard__score")).not.toBeNull();
        // The corrective route line is present (Diagnosis Table law).
        expect(container.querySelector(".ds-riskcard__move")).not.toBeNull();
        // The deal glyph rides in the kicker row.
        expect(container.querySelector(".ds-card__icon .ds-icon")).not.toBeNull();
        // The dominant move is the one orange button.
        expect(container.querySelector(".ds-btn--accent")).not.toBeNull();
    });

    it("renders a healthy deal as a calm Card (no risk score)", () => {
        const a = assessDeal(
            deal({ updated_at: new Date().toISOString(), nextStep: "Demo booked", nextStepDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) })
        )!;
        expect(a.lane).toBe("healthy");
        const { container } = render(<DealCard assessment={a} />);
        expect(container.querySelector(".ds-riskcard__score")).toBeNull();
        expect(container.querySelector(".ds-card")).not.toBeNull();
    });
});

describe("DealWorkspaceDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the recovery board", () => {
        __setAllDealsForTests([deal()]);
        const { container, getAllByText } = render(<DealWorkspaceDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".dwd-board")).not.toBeNull();
        // Appears in the card title (and possibly the pulling cell).
        expect(getAllByText("Acme Industries").length).toBeGreaterThan(0);
    });

    it("shows the directional empty state when the board is empty", () => {
        __setAllDealsForTests([]);
        const { container } = render(<DealWorkspaceDS />);
        expect(container.querySelector(".dwd-empty")).not.toBeNull();
    });
});
