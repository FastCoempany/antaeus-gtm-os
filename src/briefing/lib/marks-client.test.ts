import { describe, expect, it } from "vitest";
import { parseMarkRow } from "./marks-client";

/**
 * Marks client tests. Reads + writes go through Supabase + an RPC,
 * which we don't unit-test (covered by the migration's own SQL
 * checks + the e2e walk on the deployed function). The pure surface
 * to lock is parseMarkRow — defensive row coercion for the read
 * path. Garbage in must always produce null (so the room's map stays
 * trustworthy) and the three real marks must round-trip.
 */

describe("parseMarkRow", () => {
    it("parses a valid used row", () => {
        const r = parseMarkRow({
            pattern_id: "p-1",
            mark: "used",
            marked_at: "2026-05-29T01:00:00Z"
        });
        expect(r).not.toBeNull();
        expect(r?.pattern_id).toBe("p-1");
        expect(r?.mark).toBe("used");
        expect(r?.marked_at).toBe("2026-05-29T01:00:00Z");
    });

    it("parses met + noise marks", () => {
        expect(parseMarkRow({ pattern_id: "p-1", mark: "met" })?.mark).toBe("met");
        expect(parseMarkRow({ pattern_id: "p-1", mark: "noise" })?.mark).toBe("noise");
    });

    it("returns null on unknown mark", () => {
        expect(parseMarkRow({ pattern_id: "p-1", mark: "love" })).toBeNull();
        expect(parseMarkRow({ pattern_id: "p-1", mark: "" })).toBeNull();
        expect(parseMarkRow({ pattern_id: "p-1", mark: null })).toBeNull();
    });

    it("returns null without pattern_id", () => {
        expect(parseMarkRow({ pattern_id: "", mark: "used" })).toBeNull();
        expect(parseMarkRow({ mark: "used" })).toBeNull();
        expect(parseMarkRow({ pattern_id: 42, mark: "used" })).toBeNull();
    });

    it("returns null on non-object input", () => {
        expect(parseMarkRow(null)).toBeNull();
        expect(parseMarkRow(undefined)).toBeNull();
        expect(parseMarkRow("p-1")).toBeNull();
        expect(parseMarkRow(42)).toBeNull();
    });

    it("falls back to empty marked_at when missing", () => {
        const r = parseMarkRow({ pattern_id: "p-1", mark: "used" });
        expect(r?.marked_at).toBe("");
    });
});
