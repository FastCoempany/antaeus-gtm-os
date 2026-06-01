import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/preact";
import {
    BriefingDraftBanner,
    __resetBriefingDraftBannerForTests
} from "./briefing-draft-banner";

const DRAFTS_KEY = "gtmos_briefing_drafts_pending";

function setLocation(search: string): void {
    window.history.replaceState({}, "", `/test/${search}`);
}

describe("BriefingDraftBanner", () => {
    beforeEach(() => {
        __resetBriefingDraftBannerForTests();
        window.localStorage.removeItem(DRAFTS_KEY);
        setLocation("");
    });

    afterEach(() => {
        setLocation("");
    });

    it("renders nothing when there's no fromMode=briefing-draft", () => {
        const { container } = render(<BriefingDraftBanner />);
        expect(container.querySelector(".bf-draft-banner")).toBeNull();
    });

    it("renders the banner with label, rationale, section, action", () => {
        setLocation(
            "?fromMode=briefing-draft" +
                "&briefingDraftLabel=" +
                encodeURIComponent("Refresh Phase 4 procurement question") +
                "&briefingDraftRationale=" +
                encodeURIComponent("Vendors now require AI fallback policy.") +
                "&briefingDraftSection=" +
                encodeURIComponent("Phase 4") +
                "&briefingDraftAction=refresh"
        );
        const { container } = render(<BriefingDraftBanner />);
        const banner = container.querySelector(".bf-draft-banner");
        expect(banner).not.toBeNull();
        expect(banner!.textContent).toContain(
            "Refresh Phase 4 procurement question"
        );
        expect(banner!.textContent).toContain(
            "Vendors now require AI fallback policy."
        );
        expect(banner!.textContent).toContain("Phase 4");
        expect(banner!.textContent?.toUpperCase()).toContain("REFRESH");
    });

    it("renders nothing without a label", () => {
        setLocation("?fromMode=briefing-draft");
        const { container } = render(<BriefingDraftBanner />);
        expect(container.querySelector(".bf-draft-banner")).toBeNull();
    });

    it("persists a breadcrumb to localStorage on acknowledge + dismisses", () => {
        setLocation(
            "?fromMode=briefing-draft" +
                "&briefingDraftLabel=" +
                encodeURIComponent("Test move") +
                "&briefingDraftAction=new"
        );
        const { container } = render(<BriefingDraftBanner />);
        const primary = container.querySelector(
            ".bf-draft-banner__btn--primary"
        ) as HTMLButtonElement | null;
        expect(primary).not.toBeNull();
        fireEvent.click(primary!);
        // Banner dismissed.
        expect(container.querySelector(".bf-draft-banner")).toBeNull();
        // Breadcrumb persisted.
        const stored = JSON.parse(
            window.localStorage.getItem(DRAFTS_KEY) ?? "[]"
        ) as Array<Record<string, unknown>>;
        expect(stored.length).toBe(1);
        expect(stored[0]!.label).toBe("Test move");
        expect(stored[0]!.action).toBe("new");
    });

    it("dismisses without persisting on dismiss click", () => {
        setLocation(
            "?fromMode=briefing-draft&briefingDraftLabel=Test"
        );
        const { container } = render(<BriefingDraftBanner />);
        const ghost = container.querySelector(
            ".bf-draft-banner__btn--ghost"
        ) as HTMLButtonElement | null;
        expect(ghost).not.toBeNull();
        fireEvent.click(ghost!);
        expect(container.querySelector(".bf-draft-banner")).toBeNull();
        const stored = window.localStorage.getItem(DRAFTS_KEY);
        expect(stored).toBeNull();
    });
});
