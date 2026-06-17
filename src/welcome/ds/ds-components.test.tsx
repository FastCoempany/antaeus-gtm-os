import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import {
    __setActivationForTests,
    __setCountsForTests,
    resetSession
} from "../state";
import { EMPTY_COUNTS } from "../lib/types";
import { anchorCount, dsMilestones, toPulling } from "./lib/adapters";
import { ActionsObject } from "./components/ActionsObject";
import { WelcomeDS } from "./WelcomeDS";

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("adapters", () => {
    it("toPulling carries the top-ranked action — present even when empty", () => {
        __setCountsForTests(EMPTY_COUNTS);
        const p = toPulling();
        expect(p).toBeDefined();
        expect(p!.href).toContain("/icp-studio/");
        expect(p!.object).toBe("your workspace");
        expect(p!.reasons.length).toBeGreaterThan(0);
    });

    it("toPulling never reads 'all done' — at 4/4 it still names a real next move", () => {
        __setCountsForTests({
            icps: 1,
            deals: 1,
            accounts: 1,
            signals: 1,
            touches: 1,
            calls: 0
        });
        const p = toPulling();
        expect(p).toBeDefined();
        // a real destination room, never empty / "all done"
        expect(p!.href).toMatch(/\/[a-z-]+\//);
        expect(p!.verb.length).toBeGreaterThan(0);
    });

    it("uses the company name as the pull object when present", () => {
        __setCountsForTests(EMPTY_COUNTS);
        __setActivationForTests({
            companyName: "Northwind",
            role: "founder",
            categoryLabel: null
        });
        expect(toPulling()!.object).toBe("Northwind");
    });

    it("maps the milestone ladder + a count sentence (never a percent)", () => {
        __setCountsForTests({
            icps: 1,
            deals: 0,
            accounts: 1,
            signals: 0,
            touches: 0,
            calls: 0
        });
        const ms = dsMilestones();
        expect(ms.length).toBe(4);
        expect(ms[0]!.done).toBe(true); // ICP done
        expect(anchorCount()).toBe("2 of 4 anchors live");
        expect(anchorCount()).not.toContain("%");
    });
});

describe("ActionsObject", () => {
    it("renders the dominant action as the offset card with the orange CTA", () => {
        __setCountsForTests(EMPTY_COUNTS);
        const { container } = render(<ActionsObject />);
        const cards = container.querySelectorAll(".ds-card");
        expect(cards.length).toBeGreaterThan(0);
        // the offset (dominant) card carries the offset tag + an accent CTA
        expect(container.querySelector(".ds-offset")).not.toBeNull();
        expect(container.querySelector(".weld-cta.ds-btn--accent")).not.toBeNull();
    });
});

describe("WelcomeDS", () => {
    it("mounts the wayfinder pull, the hero statement, the actions focal, and the progress rail", () => {
        __setCountsForTests({
            icps: 1,
            deals: 0,
            accounts: 0,
            signals: 0,
            touches: 0,
            calls: 0
        });
        const { container } = render(<WelcomeDS />);
        expect(container.querySelector(".ds-wayfinder__pulling")).not.toBeNull();
        expect(container.querySelector(".weld-hero")).not.toBeNull();
        expect(container.querySelector(".weld-actions")).not.toBeNull();
        expect(container.querySelector(".ds-progress")).not.toBeNull();
    });
});
