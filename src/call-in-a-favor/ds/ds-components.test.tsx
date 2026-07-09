import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import {
    __setAdvisorsForTests,
    __setDealOptionsForTests,
    advisorDraft,
    resetSession,
    setAdvisorId,
    setDealId
} from "../state";
import type { Advisor, AdvisorDeal } from "../lib/types";
import { AskDesk } from "./components/AskDesk";
import { DeskSide } from "./components/DeskSide";
import { AdvisorDeployDS } from "./AdvisorDeployDS";

function advisor(over: Partial<Advisor> = {}): Advisor {
    return {
        id: "adv1",
        name: "Sarah Chen",
        title: "Board member",
        tier: "t1",
        expertise: "Enterprise SaaS",
        equity: "",
        companies: ["Northwind Robotics"],
        notes: "",
        relationship: "active",
        createdAt: new Date().toISOString(),
        ...over
    };
}

function deal(over: Partial<AdvisorDeal> = {}): AdvisorDeal {
    return {
        id: "d1",
        accountName: "Northwind Robotics",
        stage: "negotiation",
        value: 80000,
        nextStep: "Procurement review",
        nextStepDate: new Date(Date.now() + 86400000).toISOString(),
        champion: "Jamie Lin",
        economicBuyer: "CFO",
        primaryContact: "Jamie Lin",
        buyer: "CFO",
        decisionProcess: "Board sign-off",
        advisorHistory: [],
        ...over
    };
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("AskDesk", () => {
    it("renders the spend read, the route, the prepared ask, and the stamps", () => {
        const { container, getByText } = render(<AskDesk />);
        expect(container.querySelector(".add-read")).not.toBeNull();
        expect(container.querySelector(".ds-meter")).not.toBeNull();
        expect(container.querySelectorAll(".add-route .ds-field").length).toBe(3);
        expect(container.querySelector("textarea")).not.toBeNull();
        expect(getByText("Send the ask")).not.toBeNull();
    });
    it("surfaces the handoff once a deal is on the desk", () => {
        __setDealOptionsForTests([deal()]);
        setDealId("d1");
        const { container } = render(<AskDesk />);
        expect(container.querySelector(".ds-handoff")).not.toBeNull();
    });
});

describe("DeskSide", () => {
    it("renders the registry form + the desk read", () => {
        const { container } = render(<DeskSide />);
        expect(container.querySelector(".add-registry")).not.toBeNull();
        expect(container.querySelector(".add-impact")).not.toBeNull();
        expect(container.querySelectorAll(".add-impact__cells .ds-stat").length).toBe(4);
    });
    it("drives the advisor draft name", () => {
        const { container } = render(<DeskSide />);
        const input = container.querySelector(
            ".add-registry input"
        ) as HTMLInputElement;
        fireEvent.input(input, { target: { value: "Dana Cole" } });
        expect(advisorDraft.value.name).toBe("Dana Cole");
    });
    it("lists registered carriers in the rolodex", () => {
        __setAdvisorsForTests([advisor()]);
        setAdvisorId("adv1");
        const { container, getAllByText } = render(<DeskSide />);
        expect(container.querySelector(".add-rolodex__tab")).not.toBeNull();
        expect(getAllByText("Sarah Chen").length).toBeGreaterThanOrEqual(1);
    });
});

describe("AdvisorDeployDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the FocalRail desk", () => {
        const { container } = render(<AdvisorDeployDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-focalrail")).not.toBeNull();
        // bright — no legacy dark desk shell
        expect(container.querySelector(".ad-desk")).toBeNull();
    });
});
