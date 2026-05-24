import { describe, expect, it } from "vitest";
import { computeCost, MODELS, roundCost } from "./cost";

describe("MODELS registry", () => {
    it("has the three canonical models", () => {
        expect(MODELS).toHaveProperty("haiku_4_5");
        expect(MODELS).toHaveProperty("sonnet_4_6");
        expect(MODELS).toHaveProperty("opus_4_7");
    });

    it("every model has positive pricing", () => {
        for (const key of Object.keys(MODELS) as Array<keyof typeof MODELS>) {
            expect(MODELS[key].input_per_million_usd).toBeGreaterThan(0);
            expect(MODELS[key].output_per_million_usd).toBeGreaterThan(0);
        }
    });

    it("output is more expensive than input on every model", () => {
        for (const key of Object.keys(MODELS) as Array<keyof typeof MODELS>) {
            expect(MODELS[key].output_per_million_usd).toBeGreaterThan(
                MODELS[key].input_per_million_usd
            );
        }
    });

    it("Haiku is cheaper than Sonnet is cheaper than Opus on input", () => {
        expect(MODELS.haiku_4_5.input_per_million_usd).toBeLessThan(
            MODELS.sonnet_4_6.input_per_million_usd
        );
        expect(MODELS.sonnet_4_6.input_per_million_usd).toBeLessThan(
            MODELS.opus_4_7.input_per_million_usd
        );
    });
});

describe("computeCost", () => {
    it("Haiku 4.5: 1000 in + 500 out = $0.0035", () => {
        // 1000/1M * $1 + 500/1M * $5 = 0.001 + 0.0025 = 0.0035
        const cost = computeCost("haiku_4_5", {
            input_tokens: 1000,
            output_tokens: 500
        });
        expect(cost).toBeCloseTo(0.0035, 6);
    });

    it("Opus 4.7: 1000 in + 500 out = $0.0525", () => {
        // 1000/1M * $15 + 500/1M * $75 = 0.015 + 0.0375 = 0.0525
        const cost = computeCost("opus_4_7", {
            input_tokens: 1000,
            output_tokens: 500
        });
        expect(cost).toBeCloseTo(0.0525, 6);
    });

    it("zero tokens = zero cost", () => {
        expect(computeCost("haiku_4_5", { input_tokens: 0, output_tokens: 0 })).toBe(0);
    });

    it("a typical Haiku enrichment call (~600 in / ~400 out) is well under $0.01", () => {
        const cost = computeCost("haiku_4_5", {
            input_tokens: 600,
            output_tokens: 400
        });
        expect(cost).toBeLessThan(0.005);
    });
});

describe("roundCost", () => {
    it("rounds to four decimal places", () => {
        expect(roundCost(0.00345678)).toBe(0.0035);
    });

    it("handles whole numbers", () => {
        expect(roundCost(1)).toBe(1);
    });

    it("handles zero", () => {
        expect(roundCost(0)).toBe(0);
    });

    it("doesn't introduce floating-point artifacts on common Haiku values", () => {
        const cost = computeCost("haiku_4_5", {
            input_tokens: 627,
            output_tokens: 412
        });
        const rounded = roundCost(cost);
        // No infinite trailing decimals
        expect(rounded.toString()).toMatch(/^\d+\.\d{1,4}$|^\d+$/);
    });
});
