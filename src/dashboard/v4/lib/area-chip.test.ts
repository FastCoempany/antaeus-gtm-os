import { describe, expect, it } from "vitest";
import { evaluateReadiness, EMPTY_READINESS_INPUT } from "@/lib/readiness";
import { chipFor } from "./area-chip";

describe("chipFor — readiness area chips agree with the next-step blockers", () => {
    it("does not call the pilot area plainly 'solid' when no pilot result is recorded", () => {
        // Enterprise demo shape: no completed pilot, but deal-risk reviews,
        // Call in a Favor requests and 7/7 handoff sections are recorded.
        const summary = evaluateReadiness({
            ...EMPTY_READINESS_INPUT,
            castProofs: 0,
            futureAutopsiesRun: 3,
            advisorDeployments: 4,
            handoffSectionsReady: 7
        });
        const area = summary.dimensions.find((d) => d.id === "proof")!;
        expect(area.label).toBe("Pilots, reviews and handoff records");
        const chip = chipFor(area);
        expect(chip.word).toBe("solid, but few pilot results are recorded");
    });

    it("says plainly 'solid' once pilot results are recorded", () => {
        const summary = evaluateReadiness({
            ...EMPTY_READINESS_INPUT,
            castProofs: 3,
            futureAutopsiesRun: 3,
            advisorDeployments: 4,
            handoffSectionsReady: 7
        });
        const area = summary.dimensions.find((d) => d.id === "proof")!;
        expect(chipFor(area).word).toBe("solid");
    });
});
