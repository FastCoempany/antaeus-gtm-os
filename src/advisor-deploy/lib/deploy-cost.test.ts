import { describe, expect, it } from "vitest";
import { deployCost, findDoNotUseCandidate } from "./deploy-cost";
import type { Advisor, TierId } from "./types";

const ISO = "2026-05-19T00:00:00Z";

function advisor(id: string, tier: TierId, name: string = id): Advisor {
    return {
        id,
        name,
        title: "",
        tier,
        expertise: "",
        equity: "",
        companies: [],
        notes: "",
        relationship: "active",
        createdAt: ISO
    };
}

describe("deployCost — too-expensive branch", () => {
    it("flags T1 advisors for low-stakes intro moments", () => {
        expect(deployCost(advisor("a", "t1"), "intro")).toBe("too-expensive");
        expect(deployCost(advisor("a", "t1"), "reference")).toBe(
            "too-expensive"
        );
        expect(deployCost(advisor("a", "t1"), "renewal")).toBe("too-expensive");
    });

    it("returns null when T1 is deployed for high-stakes moments", () => {
        expect(deployCost(advisor("a", "t1"), "board_decision")).toBeNull();
        expect(deployCost(advisor("a", "t1"), "eb_bridge")).toBeNull();
    });
});

describe("deployCost — underpowered branch", () => {
    it("flags T4 advisors for high-stakes moments", () => {
        expect(deployCost(advisor("a", "t4"), "board_decision")).toBe(
            "underpowered"
        );
        expect(deployCost(advisor("a", "t4"), "eb_bridge")).toBe(
            "underpowered"
        );
        expect(deployCost(advisor("a", "t4"), "budget_kill")).toBe(
            "underpowered"
        );
    });

    it("returns null when T4 is deployed for a customer reference moment", () => {
        expect(deployCost(advisor("a", "t4"), "reference")).toBeNull();
    });
});

describe("deployCost — middle tiers", () => {
    it("returns null for T2 and T3 across all moments", () => {
        expect(deployCost(advisor("a", "t2"), "intro")).toBeNull();
        expect(deployCost(advisor("a", "t2"), "board_decision")).toBeNull();
        expect(deployCost(advisor("a", "t3"), "intro")).toBeNull();
        expect(deployCost(advisor("a", "t3"), "board_decision")).toBeNull();
    });
});

describe("findDoNotUseCandidate", () => {
    it("returns null when the registry has no cost-flagged advisors", () => {
        const advisors = [advisor("a", "t2"), advisor("b", "t3")];
        expect(findDoNotUseCandidate(advisors, "intro", null)).toBeNull();
    });

    it("prefers too-expensive T1 over underpowered T4", () => {
        const advisors = [
            advisor("a", "t4", "Customer"),
            advisor("b", "t1", "Board")
        ];
        const c = findDoNotUseCandidate(advisors, "intro", null);
        // intro is low-stakes — T1 is too-expensive; T4 is fine here.
        expect(c?.cost).toBe("too-expensive");
        expect(c?.advisor.name).toBe("Board");
    });

    it("falls back to underpowered when no T1 is in the registry", () => {
        const advisors = [advisor("a", "t4", "Customer")];
        const c = findDoNotUseCandidate(advisors, "board_decision", null);
        expect(c?.cost).toBe("underpowered");
        expect(c?.advisor.name).toBe("Customer");
    });

    it("skips the active advisor (operator deliberately picked them)", () => {
        const advisors = [
            advisor("a", "t1", "Board"),
            advisor("b", "t1", "Investor")
        ];
        const c = findDoNotUseCandidate(advisors, "intro", "a");
        expect(c?.advisor.name).toBe("Investor");
    });

    it("returns the reason copy alongside the candidate", () => {
        const advisors = [advisor("a", "t1", "Board")];
        const c = findDoNotUseCandidate(advisors, "intro", null);
        expect(c?.reason.toLowerCase()).toContain("board capital");
    });
});
