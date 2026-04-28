import { beforeEach, describe, expect, it } from "vitest";
import {
    actions,
    activation,
    counts,
    model,
    resetSession,
    roleLabel,
    setActivation,
    setCounts
} from "./state";
import { EMPTY_ACTIVATION, EMPTY_COUNTS } from "./lib/types";

describe("initial state", () => {
    beforeEach(() => resetSession());

    it("counts default to zero", () => {
        expect(counts.value).toEqual(EMPTY_COUNTS);
    });

    it("activation defaults to empty", () => {
        expect(activation.value).toEqual(EMPTY_ACTIVATION);
    });

    it("model is computed live", () => {
        expect(model.value.completed).toBe(0);
        setCounts({ ...EMPTY_COUNTS, icps: 1 });
        expect(model.value.completed).toBe(1);
    });
});

describe("computed signals", () => {
    beforeEach(() => resetSession());

    it("actions update when counts change", () => {
        const before = actions.value;
        setCounts({ ...EMPTY_COUNTS, icps: 1, accounts: 1 });
        const after = actions.value;
        expect(before).not.toBe(after);
        expect(after.find((a) => a.key === "icp")).toBeUndefined();
        expect(after.find((a) => a.key === "signal")).toBeUndefined();
    });

    it("roleLabel reflects activation role", () => {
        setActivation({
            companyName: null,
            role: "vp_sales",
            categoryLabel: null
        });
        expect(roleLabel.value).toBe("Vp Sales");
    });

    it("roleLabel falls back to Operator when role is null", () => {
        expect(roleLabel.value).toBe("Operator");
    });
});
