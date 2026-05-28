import { describe, it, expect } from "vitest";
import { parseAuditEnvelopeRow, parseCallRecord } from "./audit-envelope-client";

/**
 * B.6b — defensive parsing of audit envelope rows. Envelopes are
 * JSONB blobs that may evolve over time; the parser tolerates
 * malformed shapes by returning null call records rather than
 * crashing the room.
 */

function fullCallRecord(): Record<string, unknown> {
    return {
        model: "opus_4_7",
        prompt_version: "synthesis-1.0",
        system_prompt: "You are the synthesis stage...",
        user_prompt: "EVIDENCE THIS RUN: ...",
        response_text: "{ \"name\": \"Atlas is moving\" ... }",
        cost_usd: 0.123,
        model_v_hash: "abc123",
        input_tokens: 3200,
        output_tokens: 1200,
        ok: true,
        error: null
    };
}

describe("parseCallRecord", () => {
    it("shapes a full draft-style record", () => {
        const r = parseCallRecord(fullCallRecord());
        expect(r).not.toBeNull();
        expect(r?.model).toBe("opus_4_7");
        expect(r?.cost_usd).toBe(0.123);
        expect(r?.input_tokens).toBe(3200);
        expect(r?.ok).toBe(true);
    });

    it("returns null for null / non-object inputs (contrarian critique_record case)", () => {
        expect(parseCallRecord(null)).toBeNull();
        expect(parseCallRecord(undefined)).toBeNull();
        expect(parseCallRecord("nope")).toBeNull();
    });

    it("returns null for empty objects (no model + no system_prompt)", () => {
        expect(parseCallRecord({})).toBeNull();
        expect(parseCallRecord({ cost_usd: 0 })).toBeNull();
    });

    it("accepts a record that has only a system_prompt", () => {
        const r = parseCallRecord({ system_prompt: "x", response_text: "y" });
        expect(r).not.toBeNull();
        expect(r?.model).toBe("");
    });

    it("coerces non-numeric tokens to 0", () => {
        const r = parseCallRecord({
            ...fullCallRecord(),
            input_tokens: "lots",
            output_tokens: null
        });
        expect(r?.input_tokens).toBe(0);
        expect(r?.output_tokens).toBe(0);
    });

    it("preserves error string when present", () => {
        const r = parseCallRecord({
            ...fullCallRecord(),
            ok: false,
            error: "HTTP 500"
        });
        expect(r?.ok).toBe(false);
        expect(r?.error).toBe("HTTP 500");
    });
});

describe("parseAuditEnvelopeRow", () => {
    function row(over: Record<string, unknown> = {}): Record<string, unknown> {
        return {
            id: "env-1",
            pattern_id: "pat-1",
            cluster_snapshot: { cluster_id: "c-1", anchor: "valuation" },
            hydrated_context_snapshot: { watchlist_companies: ["Deel"] },
            draft_record: fullCallRecord(),
            critique_record: { ...fullCallRecord(), model: "sonnet_4_6" },
            revise_record: null,
            gate_decisions: { passes: true, failures: [] },
            total_cost: 0.456,
            created_at: "2026-05-28T12:00:00Z",
            ...over
        };
    }

    it("shapes a full standard-synthesis envelope", () => {
        const e = parseAuditEnvelopeRow(row());
        expect(e).not.toBeNull();
        expect(e?.pattern_id).toBe("pat-1");
        expect(e?.draft_record?.model).toBe("opus_4_7");
        expect(e?.critique_record?.model).toBe("sonnet_4_6");
        expect(e?.revise_record).toBeNull();
        expect(e?.total_cost).toBe(0.456);
    });

    it("shapes a contrarian envelope (critique + revise null)", () => {
        const e = parseAuditEnvelopeRow(row({
            critique_record: null,
            revise_record: null,
            cluster_snapshot: {
                kind: "contrarian_stated_positions",
                stated_positions: { what_we_sell: "x" },
                evidence: []
            }
        }));
        expect(e?.draft_record).not.toBeNull();
        expect(e?.critique_record).toBeNull();
        expect(e?.revise_record).toBeNull();
    });

    it("returns null without an id", () => {
        expect(parseAuditEnvelopeRow(row({ id: "" }))).toBeNull();
        expect(parseAuditEnvelopeRow(row({ id: undefined }))).toBeNull();
    });

    it("returns null without a pattern_id", () => {
        expect(parseAuditEnvelopeRow(row({ pattern_id: "" }))).toBeNull();
    });

    it("returns null on non-object input", () => {
        expect(parseAuditEnvelopeRow(null)).toBeNull();
        expect(parseAuditEnvelopeRow("nope")).toBeNull();
    });

    it("preserves snapshot blobs verbatim (unknown-typed)", () => {
        const snapshot = { weird: "shape", deeply: { nested: 1 } };
        const e = parseAuditEnvelopeRow(row({ cluster_snapshot: snapshot }));
        expect(e?.cluster_snapshot).toEqual(snapshot);
    });

    it("tolerates a missing draft_record (degraded envelope)", () => {
        const e = parseAuditEnvelopeRow(row({ draft_record: null }));
        expect(e?.draft_record).toBeNull();
    });

    it("coerces non-numeric total_cost to 0", () => {
        const e = parseAuditEnvelopeRow(row({ total_cost: "expensive" }));
        expect(e?.total_cost).toBe(0);
    });
});
