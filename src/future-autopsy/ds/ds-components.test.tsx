import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import type { Deal } from "@/deal-workspace/lib/deal-shape";
import { computeVitalsForAll, type ComputedVitals } from "../lib/vitals";
import { __setAllVitalsForTests, resetSession, selectDeal } from "../state";
import { LedgerDS } from "./components/LedgerDS";
import { PinnedCaseDS } from "./components/PinnedCaseDS";
import { FutureAutopsyDS } from "./FutureAutopsyDS";

// Real ComputedVitals from the engine — the autopsy generator reads
// computed-only fields. A stale discovery deal with no next step.
function vitals(over: Partial<Deal> = {}): ComputedVitals {
    const deal: Deal = {
        id: "d1",
        accountName: "Apex Manufacturing",
        value: 84000,
        stage: "discovery",
        updated_at: new Date(Date.now() - 42 * 86400000).toISOString(),
        ...over
    } as Deal;
    return computeVitalsForAll([deal])[0]!;
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("LedgerDS", () => {
    it("lists pinned cases with the at-risk glyph + a risk chip", () => {
        __setAllVitalsForTests([vitals(), vitals({ id: "d2", accountName: "Cascadia" })]);
        const { container, getByText } = render(<LedgerDS />);
        expect(container.querySelectorAll(".fad-ledger__row").length).toBe(2);
        expect(container.querySelector(".fad-ledger__mark .ds-icon")).not.toBeNull();
        expect(getByText("Apex Manufacturing")).not.toBeNull();
    });

    it("is directional when empty", () => {
        __setAllVitalsForTests([]);
        const { container } = render(<LedgerDS />);
        expect(container.querySelector(".fad-ledger--empty")).not.toBeNull();
    });
});

describe("PinnedCaseDS", () => {
    it("renders the forensic light-table: vitals, sheets, kill switch", () => {
        __setAllVitalsForTests([vitals()]);
        selectDeal("d1");
        const { container, getByText } = render(<PinnedCaseDS />);
        expect(getByText("Apex Manufacturing")).not.toBeNull();
        // three evidence sheets as library Cards (+ the docket card)
        expect(container.querySelectorAll(".ds-card").length).toBeGreaterThanOrEqual(3);
        // the verdict toggle is a SegmentedControl
        expect(container.querySelector(".ds-seg")).not.toBeNull();
        // the kill switch is a red Alert
        expect(container.querySelector(".ds-alert--red")).not.toBeNull();
        // the corrective route is a HandoffStrip
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
    });

    it("is directional when nothing is pinned", () => {
        __setAllVitalsForTests([]);
        const { container } = render(<PinnedCaseDS />);
        expect(container.querySelector(".fad-pinned--empty")).not.toBeNull();
    });
});

describe("FutureAutopsyDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the light-table", () => {
        __setAllVitalsForTests([vitals()]);
        const { container, getAllByText } = render(<FutureAutopsyDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-focalrail")).not.toBeNull();
        expect(getAllByText("Apex Manufacturing").length).toBeGreaterThan(0);
    });
});
