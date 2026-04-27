import { describe, expect, it } from "vitest";
import { getAdvanceAsk } from "./advance";
import type { AgendaQuality, Draft, LinkedDeal } from "./types";
import { EMPTY_DRAFT } from "./types";

function makeQuality(p: Partial<AgendaQuality>): AgendaQuality {
    return {
        score: p.score ?? 50,
        band: p.band ?? "thin",
        bandLabel: p.bandLabel ?? "Thin",
        gates: p.gates ?? [],
        nextMove: p.nextMove ?? "",
        hasSignal: p.hasSignal ?? false
    };
}

function makeDraft(p: Partial<Draft> = {}): Draft {
    return { ...EMPTY_DRAFT, ...p };
}

function makeDeal(p: Partial<LinkedDeal> = {}): LinkedDeal {
    return {
        id: p.id ?? "deal-1",
        accountName: p.accountName ?? "Acme",
        value: p.value ?? 50000,
        stage: p.stage ?? "prospect"
    };
}

describe("getAdvanceAsk — ask copy", () => {
    it("references the linked deal accountName when one is present", () => {
        const out = getAdvanceAsk(
            makeQuality({}),
            makeDraft(),
            makeDeal({ accountName: "Acme Robotics" })
        );
        expect(out.ask).toContain("Acme Robotics");
        expect(out.ask).toContain("dated next step");
        expect(out.ask).toContain("named internal owner");
    });

    it("falls back to a generic ask when no deal is linked", () => {
        const out = getAdvanceAsk(makeQuality({}), makeDraft(), null);
        expect(out.ask).toContain("attach the result to a real deal");
    });

    it("uses 'the linked deal' fallback when accountName is empty", () => {
        const out = getAdvanceAsk(
            makeQuality({}),
            makeDraft(),
            makeDeal({ accountName: "" })
        );
        expect(out.ask).toContain("the linked deal");
    });
});

describe("getAdvanceAsk — note copy precedence", () => {
    it("hasSignal wins → 'live pressure' line", () => {
        const out = getAdvanceAsk(
            makeQuality({ hasSignal: true }),
            makeDraft({ customNotes: "long enough custom notes here" }),
            null
        );
        expect(out.note).toContain("live pressure");
    });

    it("custom notes (≥ 20) wins when no signal → 'manual context' line", () => {
        const out = getAdvanceAsk(
            makeQuality({ hasSignal: false }),
            makeDraft({ customNotes: "Twenty-character context here please." }),
            null
        );
        expect(out.note).toContain("Manual context");
    });

    it("falls back to vague-warning line when no signal AND notes < 20", () => {
        const out = getAdvanceAsk(
            makeQuality({ hasSignal: false }),
            makeDraft({ customNotes: "short" }),
            null
        );
        expect(out.note).toContain("vague");
    });
});
