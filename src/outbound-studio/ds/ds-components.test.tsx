import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import type { Touch } from "../lib/types";
import {
    __setAllTouchesForTests,
    resetSession,
    setAccount,
    setContact
} from "../state";
import { SendLinePanel } from "./components/SendLinePanel";
import { OperatorRack } from "./components/OperatorRack";
import { TouchLogDS } from "./components/TouchLogDS";
import { OutboundStudioDS } from "./OutboundStudioDS";

function touch(over: Partial<Touch> = {}): Touch {
    return {
        id: "t1",
        account: "acme industries",
        accountName: "Acme Industries",
        contactName: "Sarah Chen",
        contactTitle: "",
        persona: "vp",
        temperature: "cool",
        channel: "email",
        trigger: "funding",
        ctaType: "micro_ask",
        assetUsed: "none",
        content: "Saw the funding news — congrats. One question on how you're handling spend.",
        outcome: null,
        outcomeDate: null,
        dealId: null,
        qualityScore: 70,
        motionBand: "workable",
        createdAt: new Date().toISOString(),
        ...over
    };
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("SendLinePanel", () => {
    it("is a directional prompt until the rack can generate", () => {
        const { container } = render(<SendLinePanel />);
        expect(container.querySelector(".osd-line--empty")).not.toBeNull();
        expect(container.querySelector(".osd-line__content")).toBeNull();
    });

    it("renders the routed line + the three moves when account + contact are set", () => {
        setAccount("Acme Industries");
        setContact("Sarah Chen");
        const { container, getByText } = render(<SendLinePanel />);
        expect(container.querySelector(".osd-line__content")).not.toBeNull();
        // the motion band chip + the copy/log/save moves
        expect(container.querySelector(".osd-line__chips .ds-chip")).not.toBeNull();
        expect(getByText("Copy the line")).not.toBeNull();
        expect(getByText("Log the touch")).not.toBeNull();
        expect(getByText("Save the angle")).not.toBeNull();
    });
});

describe("OperatorRack", () => {
    it("renders the rack inputs (account, contact, buyer, temperature, trigger)", () => {
        const { container } = render(<OperatorRack />);
        expect(container.querySelector(".osd-rack")).not.toBeNull();
        expect(container.querySelectorAll(".ds-input").length).toBeGreaterThanOrEqual(5);
        // the no-ask toggle
        expect(container.querySelector(".ds-toggle")).not.toBeNull();
    });
});

describe("TouchLogDS", () => {
    it("is absent with no account in the rack", () => {
        const { container } = render(<TouchLogDS />);
        expect(container.querySelector(".osd-log")).toBeNull();
    });

    it("lists the account's touches with an outcome select", () => {
        setAccount("Acme Industries");
        __setAllTouchesForTests([touch()]);
        const { container } = render(<TouchLogDS />);
        expect(container.querySelector(".osd-log__row")).not.toBeNull();
        expect(container.querySelector(".osd-log__row .ds-input")).not.toBeNull();
    });
});

describe("OutboundStudioDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the console", () => {
        setAccount("Acme Industries");
        setContact("Sarah Chen");
        const { container } = render(<OutboundStudioDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-objectcontrols")).not.toBeNull();
        // the line routed → the air-cover pull is present
        expect(container.querySelector(".ds-wayfinder__pulling")).not.toBeNull();
    });
});
