import { describe, expect, it } from "vitest";
import { generateSendLine } from "./generator";
import type { OperatorRack } from "./types";
import { EMPTY_RACK } from "./types";

const NOW = new Date("2026-04-27T12:00:00Z").getTime();

function rack(partial: Partial<OperatorRack> = {}): OperatorRack {
    return { ...EMPTY_RACK, ...partial } as OperatorRack;
}

describe("generateSendLine", () => {
    it("uses [Company] / [Name] placeholders when blank", () => {
        const out = generateSendLine({ rack: rack() });
        expect(out.content).toContain("[Name]");
        expect(out.content).toContain("[Company]");
    });

    it("substitutes account + contact into greeting + body", () => {
        const out = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah Chen"
            })
        });
        expect(out.content).toContain("Hi Sarah Chen,");
        expect(out.content).toContain("Acme");
    });

    it("uses a live signal when supplied and otherwise names the selected trigger condition", () => {
        const withSignal = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "ice_cold"
            }),
            signalHeadline: "Acme just announced a $50M Series C"
        });
        expect(withSignal.content).toContain("Series C");

        const fallback = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "ice_cold"
            })
        });
        expect(fallback.content.toLowerCase()).toContain("announced new funding");
        expect(fallback.content.toLowerCase()).not.toContain("board pressure");
    });

    it("each outreach stage emits a distinct body", () => {
        const ic = generateSendLine({
            rack: rack({ accountName: "Acme", contactName: "Sarah", temperature: "ice_cold" })
        });
        const cool = generateSendLine({
            rack: rack({ accountName: "Acme", contactName: "Sarah", temperature: "cool" })
        });
        const warm = generateSendLine({
            rack: rack({ accountName: "Acme", contactName: "Sarah", temperature: "warm" })
        });
        const hot = generateSendLine({
            rack: rack({ accountName: "Acme", contactName: "Sarah", temperature: "hot" })
        });
        const closing = generateSendLine({
            rack: rack({ accountName: "Acme", contactName: "Sarah", temperature: "closing" })
        });
        expect(ic.content).toContain("I noticed");
        expect(cool.content).toContain("Quick follow-up");
        expect(warm.content).toContain("Following up on our conversation");
        expect(hot.content).toContain("before our next conversation");
        expect(closing.content).toContain("contract and approval status");
    });

    it("noAsk removes the meeting request from follow-up copy", () => {
        const withAsk = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "cool",
                noAsk: false
            }),
            now: NOW
        });
        const noAsk = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "cool",
                noAsk: true
            }),
            now: NOW
        });
        expect(withAsk.content).toContain("short conversation");
        expect(noAsk.content).not.toContain("short conversation");
    });

    it("derived channel + asset + ctaKey still come from the matrices", () => {
        const out = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "warm",
                persona: "vp"
            })
        });
        expect(out.channel).toBe("email");
        expect(out.asset).toBe("case_study");
        expect(out.ctaKey).toBe("meeting_request");
    });

    it("noAsk overrides ctaKey to no_ask", () => {
        const out = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "hot",
                persona: "csuite",
                noAsk: true
            })
        });
        expect(out.ctaKey).toBe("no_ask");
    });

    it("qualityScore + motionBand remain a completeness heuristic", () => {
        const empty = generateSendLine({ rack: rack() });
        const full = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                nextQuestion: "How fast can we be live?"
            }),
            signalHeadline: "Series C announced"
        });
        expect(empty.qualityScore).toBeLessThan(full.qualityScore);
        expect(full.motionBand).toMatch(/workable|ready/);
    });

    it("different personas produce different first-outreach copy", () => {
        const csuite = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "ice_cold",
                persona: "csuite"
            })
        });
        const ic = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "ice_cold",
                persona: "ic"
            })
        });
        expect(csuite.content).not.toBe(ic.content);
        expect(ic.content.length).toBeGreaterThan(csuite.content.length);
    });

    it("uses companyName override without claiming unsupported customer proof", () => {
        const out = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "ice_cold",
                persona: "ic"
            }),
            companyName: "Antaeus"
        });
        expect(out.content).toContain("Antaeus");
        expect(out.content.toLowerCase()).not.toContain("similar organizations");
        expect(out.content.toLowerCase()).not.toContain("we've seen work");
        expect(out.content.toLowerCase()).not.toContain("solved this");
    });

    it("does not fabricate an attachment, ROI result, or comparable-company outcome", () => {
        const stages = ["cool", "warm", "hot", "closing"] as const;
        for (const temperature of stages) {
            const out = generateSendLine({
                rack: rack({
                    accountName: "Acme",
                    contactName: "Sarah",
                    temperature,
                    persona: "csuite"
                })
            });
            const text = out.content.toLowerCase();
            expect(text).not.toContain("attached is");
            expect(text).not.toContain("payback period comes in");
            expect(text).not.toContain("companies in a similar position");
            expect(text).not.toContain("comparable organizations");
        }
    });
});
