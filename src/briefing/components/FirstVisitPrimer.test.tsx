import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/preact";
import {
    FirstVisitPrimer,
    __resetFirstVisitPrimerForTests
} from "./FirstVisitPrimer";

const KEY = "gtmos_briefing_primer_seen_v1";

describe("FirstVisitPrimer", () => {
    beforeEach(() => {
        window.localStorage.removeItem(KEY);
        __resetFirstVisitPrimerForTests();
    });

    it("renders on first visit (no seen flag)", () => {
        const { container } = render(<FirstVisitPrimer />);
        expect(container.querySelector(".bf-primer")).not.toBeNull();
        expect(container.textContent).toContain(
            "This room is what the system saw"
        );
    });

    it("renders nothing when the seen flag is set", () => {
        window.localStorage.setItem(KEY, "true");
        __resetFirstVisitPrimerForTests();
        const { container } = render(<FirstVisitPrimer />);
        expect(container.querySelector(".bf-primer")).toBeNull();
    });

    it("dismisses + persists the flag on close button", () => {
        const { container } = render(<FirstVisitPrimer />);
        const close = container.querySelector(
            ".bf-primer__close"
        ) as HTMLButtonElement | null;
        expect(close).not.toBeNull();
        fireEvent.click(close!);
        expect(container.querySelector(".bf-primer")).toBeNull();
        expect(window.localStorage.getItem(KEY)).toBe("true");
    });

    it("dismisses on 'Got it' ack button", () => {
        const { container } = render(<FirstVisitPrimer />);
        const ack = container.querySelector(
            ".bf-primer__ack"
        ) as HTMLButtonElement | null;
        expect(ack).not.toBeNull();
        fireEvent.click(ack!);
        expect(container.querySelector(".bf-primer")).toBeNull();
        expect(window.localStorage.getItem(KEY)).toBe("true");
    });
});
