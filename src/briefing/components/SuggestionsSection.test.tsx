import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/preact";
import { SuggestionsSection } from "./SuggestionsSection";
import {
    pendingProposals,
    pendingProposalsLoaded,
    decisionBusyId,
    decisionError,
    __resetBriefingStateForTests
} from "../state";
import type { PendingProposal } from "../lib/suggestions";

vi.mock("@/lib/observability", () => ({
    reportError: vi.fn(),
    trackEvent: vi.fn()
}));

vi.mock("../lib/suggestions", async () => {
    const actual = await vi.importActual<
        typeof import("../lib/suggestions")
    >("../lib/suggestions");
    return {
        ...actual,
        loadPendingProposals: vi.fn(async () => []),
        decideProposal: vi.fn(async () => ({ ok: true, error: null })),
        markProposalViewed: vi.fn(async () => undefined)
    };
});

function mkProposal(over: Partial<PendingProposal> = {}): PendingProposal {
    return {
        id: over.id ?? "p1",
        kind: over.kind ?? "skill_default",
        title: over.title ?? "Make whats-at-risk default to negotiation?",
        whatNoticed:
            over.whatNoticed ??
            "You scheduled the skill and it has fired 6 times in the last 30 days.",
        whatChanges:
            over.whatChanges ??
            "Your scheduled parameters become the recipe default.",
        proposedAt: over.proposedAt ?? "2026-06-02T10:00:00Z",
        viewedAt: over.viewedAt ?? null
    };
}

describe("SuggestionsSection", () => {
    beforeEach(() => {
        __resetBriefingStateForTests();
        decisionBusyId.value = null;
        decisionError.value = null;
    });

    it("renders nothing until loaded", () => {
        const { container } = render(<SuggestionsSection />);
        expect(container.querySelector(".bf-suggestion")).toBeNull();
    });

    it("renders nothing when pending list is empty", () => {
        pendingProposalsLoaded.value = true;
        pendingProposals.value = [];
        const { container } = render(<SuggestionsSection />);
        expect(container.querySelector(".bf-suggestion")).toBeNull();
    });

    it("renders the title + noticed + changes + 3 buttons when one is pending", () => {
        pendingProposalsLoaded.value = true;
        pendingProposals.value = [mkProposal()];
        const { container } = render(<SuggestionsSection />);
        const root = container.querySelector(".bf-suggestion");
        expect(root).not.toBeNull();
        expect(root!.textContent).toContain(
            "Make whats-at-risk default to negotiation?"
        );
        expect(root!.textContent).toContain(
            "fired 6 times in the last 30 days"
        );
        expect(root!.textContent).toContain("recipe default");
        const btns = root!.querySelectorAll("button");
        expect(btns.length).toBe(3);
        expect(btns[0]!.textContent).toMatch(/make that change/i);
        expect(btns[1]!.textContent).toMatch(/ask me again/i);
        expect(btns[2]!.textContent).toMatch(/not now/i);
    });

    it("disables all 3 buttons while decision is busy on that proposal", () => {
        pendingProposalsLoaded.value = true;
        pendingProposals.value = [mkProposal({ id: "p1" })];
        decisionBusyId.value = "p1";
        const { container } = render(<SuggestionsSection />);
        const btns = container.querySelectorAll("button");
        for (const b of Array.from(btns)) {
            expect((b as HTMLButtonElement).disabled).toBe(true);
        }
    });

    it("surfaces an inline error when decision fails", () => {
        pendingProposalsLoaded.value = true;
        pendingProposals.value = [mkProposal()];
        decisionError.value = "RLS denied the update.";
        const { container } = render(<SuggestionsSection />);
        const err = container.querySelector(".bf-suggestion__error");
        expect(err).not.toBeNull();
        expect(err!.textContent).toContain("RLS denied");
    });

    it("prefers un-viewed proposals when picking the next to show", () => {
        pendingProposalsLoaded.value = true;
        pendingProposals.value = [
            mkProposal({
                id: "old",
                title: "Old proposal already viewed",
                viewedAt: "2026-06-01T00:00:00Z"
            }),
            mkProposal({
                id: "fresh",
                title: "Fresh proposal not yet viewed",
                viewedAt: null
            })
        ];
        const { container } = render(<SuggestionsSection />);
        const root = container.querySelector(".bf-suggestion");
        expect(root!.textContent).toContain("Fresh proposal not yet viewed");
        expect(root!.textContent).not.toContain(
            "Old proposal already viewed"
        );
    });

    it("clicking 'make that change' fires the accept decision", async () => {
        pendingProposalsLoaded.value = true;
        pendingProposals.value = [mkProposal({ id: "p1" })];
        const suggestionsModule = await import("../lib/suggestions");
        const decideMock = vi.mocked(suggestionsModule.decideProposal);
        const { container } = render(<SuggestionsSection />);
        const acceptBtn = container.querySelectorAll("button")[0] as
            | HTMLButtonElement
            | undefined;
        expect(acceptBtn).not.toBeUndefined();
        fireEvent.click(acceptBtn!);
        // Settle micro-task queue from the optimistic flow.
        await new Promise((r) => setTimeout(r, 0));
        expect(decideMock).toHaveBeenCalledWith("p1", "accepted");
    });
});
