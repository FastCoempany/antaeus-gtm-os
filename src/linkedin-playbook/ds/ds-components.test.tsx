import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import type { ActionEntry } from "../lib/types";
import {
    __setActionsForTests,
    __setHottestAccountForTests,
    activeCueIndex,
    resetSession
} from "../state";
import { MotionRead } from "./components/MotionRead";
import { CueStage } from "./components/CueStage";
import { CueLadder } from "./components/CueLadder";
import { ChannelBoard } from "./components/ChannelBoard";
import { MethodSheetsDS } from "./components/MethodSheetsDS";
import { LinkedinPlaybookDS } from "./LinkedinPlaybookDS";

function action(over: Partial<ActionEntry> = {}): ActionEntry {
    return {
        id: "li1",
        accountName: "Acme Industries",
        contactName: "Sarah Chen",
        actionType: "connection_request",
        temperature: "ice_cold",
        content: "",
        motionKey: "warm_signal_account",
        motionLabel: "Warm signal account",
        cueLabel: "Cue 03",
        whyNow: "",
        recommendedNext: "",
        outcome: "accepted",
        outcomeDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ...over
    };
}

beforeEach(() => {
    cleanup();
    localStorage.clear();
    resetSession();
});

describe("CueLadder", () => {
    it("renders the five cues, the active one marked", () => {
        const { container } = render(<CueLadder />);
        expect(container.querySelectorAll(".lpd-rail__row").length).toBe(5);
        expect(container.querySelector(".lpd-rail__row.is-active")).not.toBeNull();
    });
    it("pins a cue when clicked", () => {
        const { container } = render(<CueLadder />);
        const rows = container.querySelectorAll(".lpd-rail__row");
        fireEvent.click(rows[4] as HTMLButtonElement);
        expect(activeCueIndex.value).toBe(4);
    });
});

describe("CueStage", () => {
    it("renders the active cue title, the console DO, the script + the log form", () => {
        const { container, getByText } = render(<CueStage />);
        expect(container.querySelector(".lpd-stage__title")).not.toBeNull();
        expect(container.querySelector(".lpd-say__line")).not.toBeNull();
        expect(container.querySelectorAll(".lpd-log .ds-input").length).toBeGreaterThanOrEqual(3);
        expect(getByText("Log the cue")).not.toBeNull();
    });
});

describe("MotionRead", () => {
    it("names the play + the next move + the recovery cable", () => {
        __setHottestAccountForTests({ name: "Acme Industries", heat: 85 });
        const { container } = render(<MotionRead />);
        expect(container.querySelector(".lpd-motion")).not.toBeNull();
        expect(container.querySelector(".lpd-motion__why")).not.toBeNull();
        expect(container.querySelectorAll(".lpd-motion__move").length).toBeGreaterThanOrEqual(1);
    });
});

describe("ChannelBoard", () => {
    it("is absent with no actions", () => {
        const { container } = render(<ChannelBoard />);
        expect(container.querySelector(".lpd-board")).toBeNull();
    });
    it("renders the channel stats + the logged cues", () => {
        __setActionsForTests([action()]);
        const { container } = render(<ChannelBoard />);
        expect(container.querySelector(".lpd-board__row")).not.toBeNull();
        expect(container.querySelector(".lpd-board__stats")).not.toBeNull();
    });
});

describe("MethodSheetsDS", () => {
    it("renders the four method-template cards, each with a copy button + marked tokens", () => {
        const { container, getAllByText } = render(<MethodSheetsDS />);
        const cards = container.querySelectorAll(".lpd-method__card");
        expect(cards.length).toBe(4);
        // each card carries a copy button
        expect(getAllByText("Copy line").length).toBe(4);
        // the [token] blanks are marked (not rendered as plain brackets only)
        expect(
            container.querySelectorAll(".lpd-method__token").length
        ).toBeGreaterThan(0);
        // the four archetypes are present by kicker
        for (const kicker of ["Connection", "Public cue", "Give-first", "Ask"]) {
            expect(
                [...container.querySelectorAll(".lpd-method__kicker")].some(
                    (el) => el.textContent === kicker
                )
            ).toBe(true);
        }
    });

    it("copy is wired (clicking the button does not throw without a clipboard)", () => {
        const { getAllByText } = render(<MethodSheetsDS />);
        // jsdom has no clipboard by default — the handler must degrade, not throw
        expect(() => fireEvent.click(getAllByText("Copy line")[0])).not.toThrow();
    });
});

describe("LinkedinPlaybookDS", () => {
    it("composes the Wayfinder (with the brand lockup) over the cue ladder", () => {
        const { container } = render(<LinkedinPlaybookDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        expect(container.querySelector(".ds-wayfinder__mark svg")).not.toBeNull();
        expect(container.querySelector(".ds-arch-focalrail")).not.toBeNull();
        // bright — no legacy dark stage
        expect(container.querySelector(".lp-stage")).toBeNull();
        // the method-sheets reference panel is restored
        expect(container.querySelector(".lpd-method")).not.toBeNull();
    });
});
