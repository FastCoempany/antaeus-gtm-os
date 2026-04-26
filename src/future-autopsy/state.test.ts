import { beforeEach, describe, expect, it } from "vitest";
import {
    __setAllVitalsForTests,
    allVitals,
    autopsyUniverse,
    currentForensicSheet,
    currentVerdictMode,
    resetSession,
    selectDeal,
    selectedDealId,
    selectedVitals,
    setForensicSheet,
    setTaskLog,
    setVerdictMode,
    taskLog
} from "./state";
import type { Vitals } from "./lib/types";
import { MAX_LEDGER_CASES } from "./lib/types";

function makeVitals(partial: Partial<Vitals>): Vitals {
    return {
        id: partial.id ?? "v",
        name: partial.name ?? "Acme",
        value: partial.value ?? 50000,
        stageRaw: partial.stageRaw ?? "negotiation",
        stage: partial.stage ?? "Negotiation",
        qualScore: partial.qualScore ?? 8,
        riskScore: partial.riskScore ?? 50,
        staleDays: partial.staleDays ?? 5,
        isClosed: partial.isClosed ?? false,
        hasNextStep: partial.hasNextStep ?? true,
        ...partial
    };
}

describe("autopsyUniverse", () => {
    beforeEach(() => resetSession());

    it("returns empty array when no vitals are loaded", () => {
        expect(autopsyUniverse.value).toHaveLength(0);
    });

    it("excludes closed deals", () => {
        __setAllVitalsForTests([
            makeVitals({ id: "open", isClosed: false }),
            makeVitals({ id: "closed", isClosed: true })
        ]);
        expect(autopsyUniverse.value.map((v) => v.id)).toEqual(["open"]);
    });

    it("ranks by riskScore (desc)", () => {
        __setAllVitalsForTests([
            makeVitals({ id: "low", riskScore: 20 }),
            makeVitals({ id: "high", riskScore: 80 }),
            makeVitals({ id: "mid", riskScore: 50 })
        ]);
        expect(autopsyUniverse.value.map((v) => v.id)).toEqual([
            "high",
            "mid",
            "low"
        ]);
    });

    it(`caps at ${MAX_LEDGER_CASES} cases`, () => {
        const many = Array.from({ length: 12 }, (_, i) =>
            makeVitals({ id: `v-${i}`, riskScore: 100 - i })
        );
        __setAllVitalsForTests(many);
        expect(autopsyUniverse.value).toHaveLength(MAX_LEDGER_CASES);
    });

    it("breaks risk-score ties by staleDays (desc)", () => {
        __setAllVitalsForTests([
            makeVitals({ id: "fresh", riskScore: 50, staleDays: 2 }),
            makeVitals({ id: "stale", riskScore: 50, staleDays: 30 })
        ]);
        expect(autopsyUniverse.value.map((v) => v.id)).toEqual([
            "stale",
            "fresh"
        ]);
    });
});

describe("selectedVitals", () => {
    beforeEach(() => resetSession());

    it("returns null when no deals are loaded", () => {
        expect(selectedVitals.value).toBeNull();
    });

    it("falls back to the universe top when nothing is explicitly selected", () => {
        __setAllVitalsForTests([
            makeVitals({ id: "top", riskScore: 90 }),
            makeVitals({ id: "low", riskScore: 10 })
        ]);
        expect(selectedVitals.value?.id).toBe("top");
    });

    it("honors an explicit selection in the universe", () => {
        __setAllVitalsForTests([
            makeVitals({ id: "top", riskScore: 90 }),
            makeVitals({ id: "second", riskScore: 80 })
        ]);
        selectDeal("second");
        expect(selectedVitals.value?.id).toBe("second");
    });

    it("falls through to the full vitals list when selection is outside the top-N", () => {
        const vitals = Array.from({ length: 12 }, (_, i) =>
            makeVitals({ id: `v-${i}`, riskScore: 100 - i })
        );
        __setAllVitalsForTests(vitals);
        selectDeal("v-10");
        expect(selectedVitals.value?.id).toBe("v-10");
    });

    it("falls back to top when selected id does not exist", () => {
        __setAllVitalsForTests([makeVitals({ id: "top", riskScore: 90 })]);
        selectDeal("ghost");
        expect(selectedVitals.value?.id).toBe("top");
    });
});

describe("verdict + sheet + task log", () => {
    beforeEach(() => resetSession());

    it("toggles verdict mode", () => {
        expect(currentVerdictMode.value).toBe("left");
        setVerdictMode("corrected");
        expect(currentVerdictMode.value).toBe("corrected");
    });

    it("switches forensic sheet", () => {
        expect(currentForensicSheet.value).toBe("pattern");
        setForensicSheet("proof");
        expect(currentForensicSheet.value).toBe("proof");
    });

    it("seeds and replaces the task log", () => {
        expect(taskLog.value).toEqual({});
        setTaskLog({ "deal-1": { lastRunAt: "now", tasks: { t1: { done: true } } } });
        expect(taskLog.value["deal-1"]?.tasks.t1?.done).toBe(true);
    });
});

describe("resetSession", () => {
    it("clears every signal", () => {
        __setAllVitalsForTests([makeVitals({ id: "v" })]);
        selectDeal("v");
        setVerdictMode("corrected");
        setForensicSheet("proof");
        setTaskLog({ v: { tasks: {} } });
        resetSession();
        expect(allVitals.value).toHaveLength(0);
        expect(selectedDealId.value).toBeNull();
        expect(currentVerdictMode.value).toBe("left");
        expect(currentForensicSheet.value).toBe("pattern");
        expect(taskLog.value).toEqual({});
    });
});
