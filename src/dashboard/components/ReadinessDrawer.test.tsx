import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/preact";
import { ReadinessDrawer } from "./ReadinessDrawer";
import { evaluateReadiness, EMPTY_READINESS_INPUT } from "@/lib/readiness";

describe("ReadinessDrawer", () => {
    function makeSummary(over = {}) {
        return evaluateReadiness({ ...EMPTY_READINESS_INPUT, ...over });
    }

    it("renders the verdict label as the hero", () => {
        const { getByText } = render(
            <ReadinessDrawer
                summary={makeSummary()}
                onClose={() => {}}
            />
        );
        expect(getByText("You are the system")).toBeTruthy();
    });

    it("renders the totalScore in the kicker", () => {
        const { container } = render(
            <ReadinessDrawer
                summary={makeSummary()}
                onClose={() => {}}
            />
        );
        const kicker = container.querySelector(
            ".db-readiness-drawer__kicker"
        );
        expect(kicker?.textContent).toMatch(/0\/100/);
    });

    it("renders all 5 dimensions", () => {
        const { container } = render(
            <ReadinessDrawer
                summary={makeSummary()}
                onClose={() => {}}
            />
        );
        const dims = container.querySelectorAll(".db-readiness-dim");
        expect(dims.length).toBe(5);
    });

    it("renders gateBlockers when present", () => {
        const { container } = render(
            <ReadinessDrawer
                summary={makeSummary()}
                onClose={() => {}}
            />
        );
        const blockers = container.querySelectorAll(
            ".db-readiness-blocker"
        );
        expect(blockers.length).toBeGreaterThan(0);
    });

    it("hides the 'next' section when at top verdict (nextVerdict null)", () => {
        const summary = makeSummary({
            icpCount: 1,
            bestIcpQualityScore: 100,
            territoryAccountCount: 30,
            sourcingProspectsReady: 10,
            outboundTouches: 30,
            coldCallsLogged: 15,
            linkedinCues: 12,
            distinctAccountsTouched: 12,
            callPlannerSessions: 8,
            discoveryAdvancedCalls: 6,
            discoveryStudioSessions: 5,
            activeDeals: 6,
            dealsWithNextStep: 5,
            closedWonDeals: 3,
            closedLostDealsAnalyzed: 3,
            castProofs: 3,
            futureAutopsiesRun: 3,
            advisorDeployments: 3,
            handoffSectionsReady: 5
        });
        const { container } = render(
            <ReadinessDrawer summary={summary} onClose={() => {}} />
        );
        expect(
            container.querySelector(".db-readiness-drawer__next")
        ).toBeNull();
    });

    it("calls onClose when the close button is clicked", () => {
        const onClose = vi.fn();
        const { container } = render(
            <ReadinessDrawer summary={makeSummary()} onClose={onClose} />
        );
        const closeBtn = container.querySelector(
            ".db-readiness-drawer__close"
        );
        fireEvent.click(closeBtn!);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the backdrop is clicked", () => {
        const onClose = vi.fn();
        const { container } = render(
            <ReadinessDrawer summary={makeSummary()} onClose={onClose} />
        );
        const backdrop = container.querySelector(
            ".db-readiness-drawer__backdrop"
        );
        fireEvent.click(backdrop!);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Escape is pressed", () => {
        const onClose = vi.fn();
        render(
            <ReadinessDrawer summary={makeSummary()} onClose={onClose} />
        );
        fireEvent.keyDown(window, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose for unrelated keys", () => {
        const onClose = vi.fn();
        render(
            <ReadinessDrawer summary={makeSummary()} onClose={onClose} />
        );
        fireEvent.keyDown(window, { key: "Enter" });
        fireEvent.keyDown(window, { key: "a" });
        expect(onClose).not.toHaveBeenCalled();
    });
});
