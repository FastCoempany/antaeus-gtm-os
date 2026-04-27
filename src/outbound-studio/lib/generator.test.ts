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

    it("uses signal headline (ice_cold branch substitutes it directly)", () => {
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
        // "Capital deployed under board pressure." (funding default)
        expect(fallback.content.toLowerCase()).toContain("capital deployed");
    });

    it("each temperature emits a distinct body", () => {
        const ic = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "ice_cold"
            })
        });
        const cool = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "cool"
            })
        });
        const warm = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "warm"
            })
        });
        const hot = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "hot"
            })
        });
        const closing = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "closing"
            })
        });
        // Each temperature contains a distinctive phrase
        expect(ic.content).toContain("I noticed");
        expect(cool.content).toContain("Quick follow-up");
        expect(warm.content).toContain("Following up on our conversation");
        expect(hot.content).toContain("ahead of our next conversation");
        expect(closing.content).toContain("contract status");
    });

    it("noAsk strips the question mark line in cool", () => {
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
        expect(withAsk.content).toContain("Worth 15 minutes");
        expect(noAsk.content).not.toContain("Worth 15 minutes");
    });

    it("derived channel + asset + ctaKey come from the matrices", () => {
        const out = generateSendLine({
            rack: rack({
                accountName: "Acme",
                contactName: "Sarah",
                temperature: "warm",
                persona: "vp"
            })
        });
        // warm + vp first channel = email
        expect(out.channel).toBe("email");
        // warm + vp asset = case_study
        expect(out.asset).toBe("case_study");
        // warm CTA = meeting_request (when not no-ask)
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

    it("qualityScore + motionBand reflect rack completeness", () => {
        const empty = generateSendLine({ rack: rack() });
        const full = generateSendLine({
            rack: rack({ accountName: "Acme", contactName: "Sarah" }),
            signalHeadline: "Series C announced"
        });
        expect(empty.qualityScore).toBeLessThan(full.qualityScore);
        expect(full.motionBand).toMatch(/workable|ready/);
    });

    it("different personas produce different ice_cold copy", () => {
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

    it("uses companyName override in ic ice_cold body", () => {
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
    });
});
