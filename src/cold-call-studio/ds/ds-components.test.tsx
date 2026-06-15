import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import type { AccountSummary, CallLogEntry } from "../lib/types";
import {
    __setAccountOptionsForTests,
    __setCallLogForTests,
    activeReply,
    activeThread,
    resetSession
} from "../state";
import { AccountBar } from "./components/AccountBar";
import { ThreadConsole } from "./components/ThreadConsole";
import { ThreadRail } from "./components/ThreadRail";
import { CallMemoryDS } from "./components/CallMemoryDS";
import { ColdCallStudioDS } from "./ColdCallStudioDS";

function account(over: Partial<AccountSummary> = {}): AccountSummary {
    return { id: "a1", name: "Acme Industries", topSignal: "Funding", heat: 80, ...over };
}
function call(over: Partial<CallLogEntry> = {}): CallLogEntry {
    return {
        id: "c1",
        accountName: "Acme Industries",
        contactName: "",
        contactTitle: "",
        threadId: "ask",
        threadTitle: "Ask thread",
        buyerResponse: "Send me something.",
        recommendedResponse: "",
        outcome: "meeting_booked",
        notes: "",
        source: "cold-call-studio-talk-loom",
        createdAt: new Date().toISOString(),
        ...over
    };
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("ThreadRail", () => {
    it("renders the six threads, the active one marked", () => {
        const { container } = render(<ThreadRail />);
        expect(container.querySelectorAll(".ccd-rail__row").length).toBe(6);
        expect(container.querySelector(".ccd-rail__row.is-active")).not.toBeNull();
    });
});

describe("ThreadConsole", () => {
    it("renders the active thread say-line + the buyer branches + outcomes", () => {
        const { container } = render(<ThreadConsole />);
        expect(container.querySelector(".ccd-say__line")).not.toBeNull();
        expect(container.querySelectorAll(".ccd-branch").length).toBeGreaterThanOrEqual(2);
        expect(container.querySelectorAll(".ccd-outcome").length).toBe(7);
    });

    it("reveals the recommended next line when a branch is picked", () => {
        const { container } = render(<ThreadConsole />);
        expect(container.querySelector(".ccd-next")).toBeNull();
        const branch = container.querySelector(".ccd-branch") as HTMLButtonElement;
        fireEvent.click(branch);
        expect(activeReply.value).not.toBeNull();
        expect(container.querySelector(".ccd-next__line")).not.toBeNull();
    });

    it("advances the active thread on 'Pull the next thread'", () => {
        // prep's first branch advances to opener
        activeThread.value = "prep";
        const { container, getByText } = render(<ThreadConsole />);
        fireEvent.click(container.querySelector(".ccd-branch") as HTMLButtonElement);
        fireEvent.click(getByText("Pull the next thread"));
        expect(activeThread.value).toBe("opener");
    });
});

describe("AccountBar", () => {
    it("renders the account select + contact + the live read", () => {
        __setAccountOptionsForTests([account()]);
        const { container } = render(<AccountBar />);
        expect(container.querySelector(".ccd-bar")).not.toBeNull();
        expect(container.querySelectorAll(".ds-input").length).toBeGreaterThanOrEqual(3);
        expect(container.querySelector(".ccd-read")).not.toBeNull();
    });
});

describe("CallMemoryDS", () => {
    it("is absent with no calls", () => {
        const { container } = render(<CallMemoryDS />);
        expect(container.querySelector(".ccd-memory")).toBeNull();
    });
    it("lists logged calls with their outcomes + counts", () => {
        __setCallLogForTests([call()]);
        const { container, getByText } = render(<CallMemoryDS />);
        expect(container.querySelector(".ccd-memory__row")).not.toBeNull();
        expect(getByText("meeting booked")).not.toBeNull();
    });
});

describe("ColdCallStudioDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the live console", () => {
        const { container } = render(<ColdCallStudioDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-focalrail")).not.toBeNull();
    });
});
