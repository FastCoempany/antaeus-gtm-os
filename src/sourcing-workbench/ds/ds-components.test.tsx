import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import type { Prospect } from "../lib/types";
import { resetSession, setProspects } from "../state";
import { WorkbenchObject } from "./components/WorkbenchObject";
import { WorkbenchBuilder } from "./components/WorkbenchBuilder";
import { SourcingWorkbenchDS } from "./SourcingWorkbenchDS";

function prospect(over: Partial<Prospect> = {}): Prospect {
    return {
        id: "pr1",
        accountName: "Acme Industries",
        contactName: "Sarah Chen",
        contactTitle: "CFO",
        sourceQueryId: "",
        leverage: "existing-proof-point",
        stage: "ready",
        entryPoint: "Warm intro via investor",
        approach: "",
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

describe("WorkbenchObject", () => {
    it("renders the read, the pipeline stats, and the staged prospects", () => {
        setProspects([prospect(), prospect({ id: "p2", accountName: "Cascadia", stage: "captured" })]);
        const { container, getByText } = render(<WorkbenchObject />);
        expect(container.querySelector(".swd-read")).not.toBeNull();
        expect(container.querySelector(".swd-stats")).not.toBeNull();
        // stage zones as ribbons
        expect(container.querySelectorAll(".ds-ribbon").length).toBeGreaterThanOrEqual(2);
        // prospect renders with its glyph + a ready prospect gets the push CTA
        expect(getByText("Acme Industries")).not.toBeNull();
        expect(container.querySelector(".ds-card__icon .ds-icon")).not.toBeNull();
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
        // a ready prospect carries the orange push move on its card
        expect(container.querySelector(".ds-card__foot .ds-btn--accent")).not.toBeNull();
    });

    it("is directional when there are no prospects", () => {
        const { container } = render(<WorkbenchObject />);
        expect(container.querySelector(".swd-empty")).not.toBeNull();
    });
});

describe("WorkbenchBuilder", () => {
    it("renders the two builders (query studio + prospect composer)", () => {
        const { container } = render(<WorkbenchBuilder />);
        expect(container.querySelectorAll(".swd-form").length).toBe(2);
        // a query Save (accent) + a prospect Capture (accent)
        expect(container.querySelectorAll(".ds-btn--accent").length).toBe(2);
    });

    it("disables the query save until a query is written", () => {
        const { getByText } = render(<WorkbenchBuilder />);
        expect(getByText("Save the query").closest("button")?.disabled).toBe(true);
    });
});

describe("SourcingWorkbenchDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the Decision Bench", () => {
        setProspects([prospect()]);
        const { container } = render(<SourcingWorkbenchDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-objectcontrols")).not.toBeNull();
    });
});
