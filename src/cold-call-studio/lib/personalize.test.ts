import { describe, expect, it } from "vitest";
import {
    loomScore,
    personalize,
    requiredCorrectionCopy,
    weakestThreadCopy
} from "./personalize";

describe("personalize", () => {
    it("substitutes [account] / [pressure] / [company] from the context", () => {
        const result = personalize(
            "I am calling because [account] appears to be dealing with [pressure]. — [company]",
            {
                accountName: "Acme",
                topSignal: "the funding raise",
                companyName: "Antaeus"
            }
        );
        expect(result).toBe(
            "I am calling because Acme appears to be dealing with the funding raise. — Antaeus"
        );
    });

    it("replaces every occurrence of a token", () => {
        const result = personalize(
            "[account] / [account] / [account]",
            { accountName: "Acme" }
        );
        expect(result).toBe("Acme / Acme / Acme");
    });

    it("falls back to defaults when the context fields are empty", () => {
        const result = personalize(
            "[account] dealing with [pressure] — [company]",
            { accountName: "", topSignal: null, companyName: undefined }
        );
        expect(result).toBe(
            "[account] dealing with a visible operating pressure — [your company]"
        );
    });

    it("returns empty string for empty input", () => {
        expect(personalize("")).toBe("");
    });

    it("treats whitespace-only context fields as empty", () => {
        const result = personalize("[account]", { accountName: "   " });
        expect(result).toBe("[account]");
    });
});

describe("loomScore", () => {
    it("starts at 44 with nothing set", () => {
        expect(
            loomScore({
                hasAccount: false,
                heat: 0,
                threadId: "prep",
                hasReply: false
            })
        ).toBe(44);
    });

    it("adds 16 when an account is selected", () => {
        expect(
            loomScore({
                hasAccount: true,
                heat: 0,
                threadId: "prep",
                hasReply: false
            })
        ).toBe(60);
    });

    it("adds 12 when account heat exceeds 65", () => {
        expect(
            loomScore({
                hasAccount: true,
                heat: 80,
                threadId: "prep",
                hasReply: false
            })
        ).toBe(72);
        // boundary: heat===65 should NOT trigger
        expect(
            loomScore({
                hasAccount: true,
                heat: 65,
                threadId: "prep",
                hasReply: false
            })
        ).toBe(60);
    });

    it("adds 10 when active thread is proof or ask", () => {
        expect(
            loomScore({
                hasAccount: true,
                heat: 80,
                threadId: "proof",
                hasReply: false
            })
        ).toBe(82);
        expect(
            loomScore({
                hasAccount: true,
                heat: 80,
                threadId: "ask",
                hasReply: false
            })
        ).toBe(82);
        expect(
            loomScore({
                hasAccount: true,
                heat: 80,
                threadId: "exit",
                hasReply: false
            })
        ).toBe(72);
    });

    it("adds 5 when a buyer reply has been chosen", () => {
        expect(
            loomScore({
                hasAccount: true,
                heat: 80,
                threadId: "ask",
                hasReply: true
            })
        ).toBe(87);
    });

    it("caps at 92", () => {
        // Theoretical max without cap would be 44+16+12+10+5 = 87, so the
        // cap is mainly defensive. Ensure we never return >92.
        for (let heat = 0; heat <= 99; heat += 33) {
            const s = loomScore({
                hasAccount: true,
                heat,
                threadId: "ask",
                hasReply: true
            });
            expect(s).toBeLessThanOrEqual(92);
        }
    });
});

describe("weakestThreadCopy", () => {
    it("warns when no account is selected", () => {
        expect(weakestThreadCopy(false)).toContain("No account selected");
    });

    it("warns when an account is set but the call has no dated move yet", () => {
        expect(weakestThreadCopy(true)).toContain("dated move");
    });
});

describe("requiredCorrectionCopy", () => {
    it("prescribes naming the strain when no account is selected", () => {
        expect(requiredCorrectionCopy(false, "prep")).toContain(
            "Name the business strain"
        );
        expect(requiredCorrectionCopy(false, "ask")).toContain(
            "Name the business strain"
        );
    });

    it("prescribes forcing the strain on prep/opener threads", () => {
        expect(requiredCorrectionCopy(true, "prep")).toContain(
            "Force the strain"
        );
        expect(requiredCorrectionCopy(true, "opener")).toContain(
            "Force the strain"
        );
    });

    it("prescribes trade-proof-for-admission on pressure/proof threads", () => {
        expect(requiredCorrectionCopy(true, "pressure")).toContain(
            "Trade one proof point"
        );
        expect(requiredCorrectionCopy(true, "proof")).toContain(
            "Trade one proof point"
        );
    });

    it("prescribes locking the dated move on ask/exit threads", () => {
        expect(requiredCorrectionCopy(true, "ask")).toContain(
            "Lock the dated move"
        );
        expect(requiredCorrectionCopy(true, "exit")).toContain(
            "Lock the dated move"
        );
    });
});
