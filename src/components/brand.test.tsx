import { describe, expect, it } from "vitest";
import { render, cleanup } from "@testing-library/preact";
import { BrandLockup, BrandLockupSerif, BrandMark } from "./brand";

describe("brand lockups (spec 10 §3)", () => {
    it("BrandMark drops the crossbar at 16px (the ground line is the signature)", () => {
        const big = render(<BrandMark size={28} />);
        // legs + crossbar + ground = 3 paths at display size
        expect(big.container.querySelectorAll("path").length).toBe(3);
        cleanup();
        const small = render(<BrandMark size={16} />);
        // legs + ground only at 16
        expect(small.container.querySelectorAll("path").length).toBe(2);
        cleanup();
    });

    it("L2 is the caps lockup (product chrome)", () => {
        const { getByText, container } = render(<BrandLockup />);
        expect(getByText("ANTAEUS")).not.toBeNull();
        expect(container.querySelector(".ds-lockup__name")).not.toBeNull();
        cleanup();
    });

    it("L1 is the serif lockup (landing + docs)", () => {
        const { getByText, container } = render(<BrandLockupSerif />);
        expect(getByText("Antaeus")).not.toBeNull();
        expect(container.querySelector(".ds-lockup--serif")).not.toBeNull();
        expect(container.querySelector(".ds-lockup__name-serif")).not.toBeNull();
        expect(container.querySelector(".ds-lockup--reversed")).toBeNull();
        cleanup();
    });

    it("L1 reversed is the white-on-navy variant (legal/footer only)", () => {
        const { container } = render(<BrandLockupSerif reversed />);
        expect(container.querySelector(".ds-lockup--reversed")).not.toBeNull();
        cleanup();
    });
});
