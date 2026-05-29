import { describe, expect, it } from "vitest";
import { parsePatternEvalRow, parseVoiceSignalRow } from "./eval-client";

/**
 * Eval client tests. Reads are thin Supabase queries scoped by RLS;
 * the pure surface to lock is the defensive row coercion so a future
 * schema drift (extra column, type mismatch, nullable that wasn't)
 * never crashes the room.
 */

describe("parsePatternEvalRow", () => {
    function row(over: Record<string, unknown> = {}): Record<string, unknown> {
        return {
            id: "ev-1",
            pattern_id: "pat-1",
            captured_at: "2026-05-29T01:00:00Z",
            gate_passes: true,
            gate_failures: [],
            repair_used: false,
            cluster_type: "pain_tag",
            anchor: "compliance_burden",
            confidence: 0.75,
            synthesis_cost_usd: 0.1492,
            critic_score: null,
            ...over
        };
    }

    it("shapes a passing row", () => {
        const r = parsePatternEvalRow(row());
        expect(r).not.toBeNull();
        expect(r?.pattern_id).toBe("pat-1");
        expect(r?.gate_passes).toBe(true);
        expect(r?.gate_failures).toEqual([]);
        expect(r?.confidence).toBe(0.75);
        expect(r?.synthesis_cost_usd).toBe(0.1492);
        expect(r?.critic_score).toBeNull();
    });

    it("shapes a failed-gate row with named failures", () => {
        const r = parsePatternEvalRow(
            row({
                gate_passes: false,
                gate_failures: ["banned_vocabulary", "evidence_id_provenance"],
                repair_used: true
            })
        );
        expect(r?.gate_passes).toBe(false);
        expect(r?.gate_failures).toEqual(["banned_vocabulary", "evidence_id_provenance"]);
        expect(r?.repair_used).toBe(true);
    });

    it("coerces string numerics from PostgREST", () => {
        // PostgREST often returns numeric columns as strings; the
        // parser has to coerce defensively.
        const r = parsePatternEvalRow(
            row({ confidence: "0.62", synthesis_cost_usd: "0.0500", critic_score: "0.81" })
        );
        expect(r?.confidence).toBe(0.62);
        expect(r?.synthesis_cost_usd).toBe(0.05);
        expect(r?.critic_score).toBe(0.81);
    });

    it("returns null for nullable critic_score, not 0", () => {
        const r = parsePatternEvalRow(row({ critic_score: null }));
        expect(r?.critic_score).toBeNull();
    });

    it("defaults non-array gate_failures to []", () => {
        expect(parsePatternEvalRow(row({ gate_failures: null }))?.gate_failures).toEqual([]);
        expect(parsePatternEvalRow(row({ gate_failures: "banned" }))?.gate_failures).toEqual([]);
    });

    it("returns null without id or pattern_id", () => {
        expect(parsePatternEvalRow(row({ id: "" }))).toBeNull();
        expect(parsePatternEvalRow(row({ pattern_id: "" }))).toBeNull();
        expect(parsePatternEvalRow(row({ id: 42 }))).toBeNull();
    });

    it("returns null on non-object input", () => {
        expect(parsePatternEvalRow(null)).toBeNull();
        expect(parsePatternEvalRow(undefined)).toBeNull();
        expect(parsePatternEvalRow("ev-1")).toBeNull();
    });

    it("treats boolean fields strictly (any non-true value → false)", () => {
        expect(parsePatternEvalRow(row({ gate_passes: "true" }))?.gate_passes).toBe(false);
        expect(parsePatternEvalRow(row({ gate_passes: 1 }))?.gate_passes).toBe(false);
        expect(parsePatternEvalRow(row({ repair_used: "yes" }))?.repair_used).toBe(false);
    });
});

describe("parseVoiceSignalRow", () => {
    function vrow(over: Record<string, unknown> = {}): Record<string, unknown> {
        return {
            cluster_type: "narrative_shift",
            anchor: "valuation",
            pattern_count: 5,
            gate_pass_rate: 0.8,
            repair_rate: 0.2,
            mean_confidence: 0.71,
            mean_cost_usd: 0.1492,
            last_captured_at: "2026-05-29T01:00:00Z",
            ...over
        };
    }

    it("shapes a full voice-signal row", () => {
        const r = parseVoiceSignalRow(vrow());
        expect(r?.cluster_type).toBe("narrative_shift");
        expect(r?.anchor).toBe("valuation");
        expect(r?.pattern_count).toBe(5);
        expect(r?.gate_pass_rate).toBeCloseTo(0.8, 4);
    });

    it("coerces postgres numerics returned as strings", () => {
        const r = parseVoiceSignalRow(
            vrow({ gate_pass_rate: "0.8", repair_rate: "0.2", mean_confidence: "0.71" })
        );
        expect(r?.gate_pass_rate).toBe(0.8);
        expect(r?.repair_rate).toBe(0.2);
        expect(r?.mean_confidence).toBe(0.71);
    });

    it("returns null without cluster_type or anchor", () => {
        expect(parseVoiceSignalRow(vrow({ cluster_type: "" }))).toBeNull();
        expect(parseVoiceSignalRow(vrow({ anchor: "" }))).toBeNull();
        expect(parseVoiceSignalRow(vrow({ cluster_type: null }))).toBeNull();
    });

    it("returns null on non-object input", () => {
        expect(parseVoiceSignalRow(null)).toBeNull();
        expect(parseVoiceSignalRow(42)).toBeNull();
    });
});
