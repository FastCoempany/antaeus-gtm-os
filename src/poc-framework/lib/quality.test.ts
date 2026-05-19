import { describe, expect, it } from "vitest";
import {
    buildIngotRead,
    computeHeat,
    computeQuality,
    countBulletLines,
    deriveMolds,
    heatColor,
    heatLabel,
    weakestMold
} from "./quality";
import type { MoldRow } from "./quality";
import type { ProofDraft } from "./types";
import { EMPTY_DRAFT } from "./types";

function draft(partial: Partial<ProofDraft> = {}): ProofDraft {
    return { ...EMPTY_DRAFT, ...partial } as ProofDraft;
}

const longText = (n: number): string => "x".repeat(n);

describe("countBulletLines", () => {
    it("returns 0 for empty / whitespace", () => {
        expect(countBulletLines("")).toBe(0);
        expect(countBulletLines("   ")).toBe(0);
        expect(countBulletLines(undefined)).toBe(0);
    });

    it("counts newline-separated lines, dropping empties", () => {
        expect(countBulletLines("one\ntwo\nthree")).toBe(3);
    });

    it("ignores lines shorter than 2 chars", () => {
        expect(countBulletLines("ok\na\nlong line")).toBe(2);
    });
});

describe("heatLabel + heatColor", () => {
    it("Cast (≥80), Hot (≥55), Warming (≥25), Cold (<25)", () => {
        expect(heatLabel(95)).toBe("cast");
        expect(heatLabel(80)).toBe("cast");
        expect(heatLabel(79)).toBe("hot");
        expect(heatLabel(55)).toBe("hot");
        expect(heatLabel(54)).toBe("warming");
        expect(heatLabel(25)).toBe("warming");
        expect(heatLabel(24)).toBe("cold");
        expect(heatLabel(0)).toBe("cold");
    });

    it("color follows the band", () => {
        expect(heatColor(95)).toContain("green");
        expect(heatColor(70)).toContain("orange");
        expect(heatColor(40)).toContain("blue");
        expect(heatColor(10)).toBe("#8fa0b8");
    });
});

describe("computeHeat", () => {
    it("claim heat = successCount * 28 + (hasAccount ? 16 : 0), clamped", () => {
        const out = computeHeat({
            successCount: 3,
            boundaryCount: 0,
            hasAccount: true,
            hasOwner: false,
            linkedDealOwner: null
        });
        // 3 * 28 + 16 = 100
        expect(out.claim.value).toBe(100);
    });

    it("owner heat = 100 if hasOwner, 72 if linked-deal owner exists, else 18", () => {
        const owned = computeHeat({
            successCount: 0,
            boundaryCount: 0,
            hasAccount: false,
            hasOwner: true,
            linkedDealOwner: null
        });
        expect(owned.owner.value).toBe(100);

        const linked = computeHeat({
            successCount: 0,
            boundaryCount: 0,
            hasAccount: false,
            hasOwner: false,
            linkedDealOwner: "Sarah"
        });
        expect(linked.owner.value).toBe(72);

        const none = computeHeat({
            successCount: 0,
            boundaryCount: 0,
            hasAccount: false,
            hasOwner: false,
            linkedDealOwner: null
        });
        expect(none.owner.value).toBe(18);
    });

    it("kill heat = boundaryCount * 38, clamped", () => {
        expect(
            computeHeat({
                successCount: 0,
                boundaryCount: 0,
                hasAccount: false,
                hasOwner: false,
                linkedDealOwner: null
            }).kill.value
        ).toBe(0);
        expect(
            computeHeat({
                successCount: 0,
                boundaryCount: 2,
                hasAccount: false,
                hasOwner: false,
                linkedDealOwner: null
            }).kill.value
        ).toBe(76);
        expect(
            computeHeat({
                successCount: 0,
                boundaryCount: 5,
                hasAccount: false,
                hasOwner: false,
                linkedDealOwner: null
            }).kill.value
        ).toBe(100);
    });
});

describe("weakestMold", () => {
    it("Account first when missing", () => {
        expect(
            weakestMold({
                hasAccount: false,
                hasOwner: false,
                successCount: 0,
                boundaryCount: 0
            }).id
        ).toBe("account");
    });

    it("Owner next when account is set but owner is not", () => {
        expect(
            weakestMold({
                hasAccount: true,
                hasOwner: false,
                successCount: 5,
                boundaryCount: 5
            }).id
        ).toBe("owner");
    });

    it("Metric when fewer than 3 success criteria", () => {
        expect(
            weakestMold({
                hasAccount: true,
                hasOwner: true,
                successCount: 2,
                boundaryCount: 5
            }).id
        ).toBe("metric");
    });

    it("Kill rule when fewer than 2 boundaries", () => {
        expect(
            weakestMold({
                hasAccount: true,
                hasOwner: true,
                successCount: 5,
                boundaryCount: 1
            }).id
        ).toBe("kill_rule");
    });

    it("Readout fallback when everything else is filled", () => {
        expect(
            weakestMold({
                hasAccount: true,
                hasOwner: true,
                successCount: 5,
                boundaryCount: 5
            }).id
        ).toBe("readout");
    });
});

describe("computeQuality", () => {
    it("scores 0 for an empty draft", () => {
        expect(computeQuality(draft(), null).score).toBe(0);
    });

    it("clamps to 100 even with maximum inputs", () => {
        const q = computeQuality(
            draft({
                vendor: "VendorCo",
                account: "Acme",
                readoutOwner: "Sarah",
                successCriteria:
                    "criterion one\ncriterion two\ncriterion three\ncriterion four\ncriterion five",
                boundaries: "stop one\nstop two\nstop three\nstop four"
            }),
            { id: "d", accountName: "Acme", stage: "poc", value: 100000 }
        );
        expect(q.score).toBe(100);
    });

    it("bands: ready ≥80, workable ≥60, thin <60", () => {
        const filled = longText(40);
        const ready = computeQuality(
            draft({
                vendor: "v",
                account: "a",
                readoutOwner: "o",
                successCriteria: "c1\nc2\nc3\nc4",
                boundaries: "b1\nb2\nb3"
            }),
            { id: "d", accountName: "a", stage: "poc", value: 100000 }
        );
        expect(ready.band).toBe("ready");
        expect(ready.bandLabel).toBe("Cast");
        expect(ready.title).toMatch(/buyer's boss could act/i);

        const workable = computeQuality(
            draft({
                vendor: "v",
                account: "a",
                readoutOwner: "o",
                successCriteria: "c1\nc2",
                boundaries: "b1"
            }),
            null
        );
        expect(workable.band).toBe("workable");

        const thin = computeQuality(draft({ account: "a" }), null);
        expect(thin.band).toBe("thin");
        expect(thin.bandLabel).toBe("Thin");
        // Use string match — the underlying void character may vary.
        void filled;
    });

    it("includes heat ledger + weakest mold", () => {
        const q = computeQuality(draft({ account: "Acme" }), null);
        expect(q.heat.claim.value).toBeGreaterThanOrEqual(0);
        expect(q.weakest.id).toBe("owner");
    });
});

describe("deriveMolds", () => {
    it("returns the 5 mold rows in canonical order", () => {
        const d = draft({
            account: "Acme",
            readoutOwner: "Sarah",
            successCriteria: "criterion one is long enough\ncriterion two\ncriterion three",
            boundaries: "stop rule one is long\nstop rule two"
        });
        const q = computeQuality(d, null);
        const molds = deriveMolds(d, q);
        expect(molds.map((m) => m.label)).toEqual([
            "Claim",
            "Baseline",
            "Owner",
            "Metric",
            "Kill"
        ]);
    });

    it("Claim row state flips hot when successCount > 0, red otherwise", () => {
        const empty = computeQuality(draft({}), null);
        expect(deriveMolds(draft({}), empty)[0]?.state).toBe("red");

        const filled = computeQuality(
            draft({ successCriteria: "criterion one is long" }),
            null
        );
        expect(deriveMolds(draft({ successCriteria: "criterion one is long" }), filled)[0]?.state).toBe(
            "hot"
        );
    });

    it("Owner row reads readoutOwner when present", () => {
        const d = draft({ readoutOwner: "Sarah Chen" });
        const q = computeQuality(d, null);
        const ownerRow = deriveMolds(d, q).find((m) => m.label === "Owner");
        expect(ownerRow?.value).toBe("Sarah Chen");
        expect(ownerRow?.state).toBe("cast");
    });
});

describe("buildIngotRead (Program 6 / PR 14)", () => {
    function mold(label: string, state: MoldRow["state"]): MoldRow {
        return { label, value: "", state };
    }

    it("returns empty-foundry copy when nothing has started", () => {
        const molds = [
            mold("Claim", "cold"),
            mold("Baseline", "cold"),
            mold("Owner", "cold"),
            mold("Metric", "cold"),
            mold("Kill", "cold")
        ];
        const r = buildIngotRead(molds);
        expect(r.toLowerCase()).toContain("still empty");
    });

    it("returns ready-to-carry copy when all molds are locked", () => {
        const molds = [
            mold("Claim", "cast"),
            mold("Baseline", "cast"),
            mold("Owner", "cast"),
            mold("Metric", "cast"),
            mold("Kill", "cast")
        ];
        const r = buildIngotRead(molds);
        expect(r.toLowerCase()).toContain("ready");
        expect(r.toLowerCase()).toContain("locked");
    });

    it("synthesizes locked + hot + broken molds into clauses", () => {
        const molds = [
            mold("Claim", "cast"),
            mold("Baseline", "hot"),
            mold("Owner", "red"),
            mold("Metric", "hot"),
            mold("Kill", "red")
        ];
        const r = buildIngotRead(molds);
        // Has a locked clause naming the claim mold.
        expect(r.toLowerCase()).toContain("claim");
        expect(r.toLowerCase()).toContain("locked");
        // Has a hot clause naming at least one hot mold.
        expect(r.toLowerCase()).toMatch(/baseline|metric/);
        expect(r.toLowerCase()).toContain("hot");
        // Has a broken clause naming the weakest red mold.
        expect(r.toLowerCase()).toContain("broken");
    });

    it("returns empty-board fallback for an empty mold list", () => {
        expect(buildIngotRead([])).toMatch(/start the forge/i);
    });

    it("prefers red over cold for the weakness clause", () => {
        const molds = [
            mold("Claim", "cast"),
            mold("Baseline", "cold"),
            mold("Owner", "red"),
            mold("Metric", "cast"),
            mold("Kill", "cold")
        ];
        const r = buildIngotRead(molds);
        // Owner (red) should be named, not Baseline or Kill (cold).
        expect(r.toLowerCase()).toContain("owner");
        expect(r.toLowerCase()).toContain("broken");
    });
});
