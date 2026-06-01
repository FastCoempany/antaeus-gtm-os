import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/preact";
import { DraftsTray, __resetDraftsTrayForTests } from "./DraftsTray";
import { BRIEFING_DRAFTS_KEY } from "@/lib/briefing-drafts";

describe("DraftsTray", () => {
    beforeEach(() => {
        window.localStorage.removeItem(BRIEFING_DRAFTS_KEY);
        __resetDraftsTrayForTests();
    });

    it("renders nothing when there are no drafts", () => {
        const { container } = render(<DraftsTray />);
        expect(container.querySelector(".bf-drafts")).toBeNull();
    });

    it("renders the head with count when drafts exist", () => {
        window.localStorage.setItem(
            BRIEFING_DRAFTS_KEY,
            JSON.stringify([
                {
                    label: "Refresh Phase 4",
                    rationale: "Rationale text",
                    section: "Phase 4",
                    action: "refresh",
                    targetId: null,
                    patternId: "pat_abc",
                    roomPath: "/discovery-studio/",
                    acknowledgedAt: "2026-06-01T15:00:00Z"
                }
            ])
        );
        const { container } = render(<DraftsTray />);
        expect(container.querySelector(".bf-drafts")).not.toBeNull();
        expect(container.textContent).toContain("1 draft acknowledged");
    });

    it("expands to show breadcrumbs on click", () => {
        window.localStorage.setItem(
            BRIEFING_DRAFTS_KEY,
            JSON.stringify([
                {
                    label: "Refresh Phase 4",
                    rationale: "Rationale text",
                    section: "Phase 4",
                    action: "refresh",
                    targetId: null,
                    patternId: "pat_abc",
                    roomPath: "/discovery-studio/",
                    acknowledgedAt: "2026-06-01T15:00:00Z"
                }
            ])
        );
        const { container } = render(<DraftsTray />);
        const head = container.querySelector(
            ".bf-drafts__head"
        ) as HTMLButtonElement | null;
        expect(head).not.toBeNull();
        fireEvent.click(head!);
        expect(container.querySelector(".bf-drafts__body")).not.toBeNull();
        expect(container.textContent).toContain("Refresh Phase 4");
        expect(container.textContent).toContain("Discovery Studio");
    });

    it("clears a single draft on Clear click", () => {
        const draft = {
            label: "A",
            rationale: null,
            section: null,
            action: null,
            targetId: null,
            patternId: null,
            roomPath: "/discovery-studio/",
            acknowledgedAt: "2026-06-01T01:00:00Z"
        };
        window.localStorage.setItem(
            BRIEFING_DRAFTS_KEY,
            JSON.stringify([draft])
        );
        const { container } = render(<DraftsTray />);
        // expand
        fireEvent.click(
            container.querySelector(
                ".bf-drafts__head"
            ) as HTMLButtonElement
        );
        const clearBtn = container.querySelector(
            ".bf-drafts__row-clear"
        ) as HTMLButtonElement;
        fireEvent.click(clearBtn);
        // After clear, the tray re-evaluates → list empty → returns null
        expect(container.querySelector(".bf-drafts")).toBeNull();
        expect(
            JSON.parse(window.localStorage.getItem(BRIEFING_DRAFTS_KEY) ?? "[]")
        ).toEqual([]);
    });
});
