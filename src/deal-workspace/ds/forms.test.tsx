import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import type { Deal } from "../lib/deal-shape";
import {
    __setAllDealsForTests,
    closeLossReason,
    openDealEditor,
    openLossReasonFor,
    resetSession
} from "../state";
import { DealHealthFormDS } from "./components/DealHealthFormDS";
import { LossReasonModalDS } from "./components/LossReasonModalDS";

function deal(over: Partial<Deal> = {}): Deal {
    return {
        id: "d1",
        accountName: "Acme Industries",
        value: 84000,
        stage: "discovery",
        ...over
    } as Deal;
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
    closeLossReason();
});

describe("DealHealthFormDS", () => {
    it("renders nothing when no deal is being edited", () => {
        const { container } = render(<DealHealthFormDS />);
        expect(container.querySelector(".dwd-form")).toBeNull();
    });

    it("renders the 9-field editor on the library when a deal opens", () => {
        openDealEditor(deal());
        const { container, getByText } = render(<DealHealthFormDS />);
        expect(container.querySelector(".dwd-form")).not.toBeNull();
        // library inputs, not legacy form controls
        expect(container.querySelectorAll(".ds-input").length).toBeGreaterThanOrEqual(8);
        expect(container.querySelector(".ds-textarea")).not.toBeNull();
        // the account field is seeded from the opened deal
        const account = container.querySelector(".ds-input") as HTMLInputElement;
        expect(account.value).toBe("Acme Industries");
        // the dominant save move
        expect(getByText("Save the deal")).not.toBeNull();
        // no legacy classes leaked in
        expect(container.querySelector(".dw-folio-form")).toBeNull();
    });

    it("adds a stakeholder row via the library controls", () => {
        openDealEditor(deal());
        const { container, getByText } = render(<DealHealthFormDS />);
        expect(container.querySelector(".dwd-stk__row")).toBeNull();
        fireEvent.click(getByText("Add one"));
        expect(container.querySelector(".dwd-stk__row")).not.toBeNull();
    });
});

describe("LossReasonModalDS", () => {
    it("is absent until a loss target is set", () => {
        const { container } = render(<LossReasonModalDS />);
        expect(container.querySelector(".ds-modal")).toBeNull();
    });

    it("renders a library Modal with a reason select when targeted", () => {
        __setAllDealsForTests([deal()]);
        openLossReasonFor("d1", "Acme Industries");
        const { container, getByText } = render(<LossReasonModalDS />);
        expect(container.querySelector(".ds-modal")).not.toBeNull();
        expect(container.querySelector(".dwd-loss .ds-input")).not.toBeNull();
        expect(getByText("Save the reason")).not.toBeNull();
        // no legacy modal classes
        expect(container.querySelector(".dw-modal")).toBeNull();
    });
});
