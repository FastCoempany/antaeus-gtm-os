import { describe, it, expect } from "vitest";
import { latestRunCandidates, parsePeripheryRow } from "./periphery-client";

/**
 * B.4c — the front-end shaping of periphery candidates.
 *
 * Supabase reads are thin; the logic worth locking is row coercion +
 * the latest-run filter the UI relies on so older-run rows don't bleed
 * into the surface when a fresh run hasn't produced new candidates.
 */

function row(over: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: "pc-1",
        run_id: "run-A",
        entity_name: "vensure employer solutions",
        entity_aliases: ["Vensure Inc", "Vensure"],
        co_occurrence_score: 4,
        vocab_overlap_score: 6,
        total_score: 5.5,
        supporting_item_ids: ["it-1", "it-2", "it-3", "it-4"],
        reasoning: "Appeared in 4 items alongside 11 watched entities. Shares 6 pain/topic tags with the watched set's items.",
        status: "candidate",
        ...over
    };
}

describe("parsePeripheryRow", () => {
    it("shapes a full row", () => {
        const c = parsePeripheryRow(row());
        expect(c).not.toBeNull();
        expect(c?.entity_name).toBe("vensure employer solutions");
        expect(c?.entity_aliases).toHaveLength(2);
        expect(c?.co_occurrence_score).toBe(4);
        expect(c?.total_score).toBe(5.5);
        expect(c?.supporting_item_ids).toHaveLength(4);
        expect(c?.status).toBe("candidate");
    });

    it("defaults missing arrays to empty + invalid status to candidate", () => {
        const c = parsePeripheryRow(row({ entity_aliases: null, supporting_item_ids: undefined, status: "mystery" }));
        expect(c?.entity_aliases).toEqual([]);
        expect(c?.supporting_item_ids).toEqual([]);
        expect(c?.status).toBe("candidate");
    });

    it("preserves the three real verdict statuses", () => {
        expect(parsePeripheryRow(row({ status: "added_to_watchlist" }))?.status).toBe("added_to_watchlist");
        expect(parsePeripheryRow(row({ status: "snoozed" }))?.status).toBe("snoozed");
        expect(parsePeripheryRow(row({ status: "dismissed" }))?.status).toBe("dismissed");
    });

    it("coerces non-numeric scores to 0", () => {
        const c = parsePeripheryRow(row({ co_occurrence_score: "lots", total_score: null }));
        expect(c?.co_occurrence_score).toBe(0);
        expect(c?.total_score).toBe(0);
    });

    it("returns null without a usable id", () => {
        expect(parsePeripheryRow(row({ id: "" }))).toBeNull();
        expect(parsePeripheryRow(null)).toBeNull();
        expect(parsePeripheryRow("nope")).toBeNull();
    });
});

describe("latestRunCandidates", () => {
    function mk(id: string, runId: string) {
        return parsePeripheryRow(row({ id, run_id: runId }))!;
    }

    it("keeps only the most recent run_id (input is created_at desc)", () => {
        const result = latestRunCandidates([
            mk("a", "run-B"),
            mk("b", "run-B"),
            mk("c", "run-A") // older run
        ]);
        expect(result).toHaveLength(2);
        expect(result.every((r) => r.run_id === "run-B")).toBe(true);
    });

    it("returns [] for no candidates", () => {
        expect(latestRunCandidates([])).toEqual([]);
    });

    it("returns all when they share a run", () => {
        const all = [mk("a", "r"), mk("b", "r"), mk("c", "r")];
        expect(latestRunCandidates(all)).toHaveLength(3);
    });
});
