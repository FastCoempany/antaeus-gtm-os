import { describe, expect, it } from "vitest";
import {
    DISCOVERY_RHYTHM_GENERATOR_ID,
    MIN_CALLS_PER_WEEK,
    WEEK_WINDOW_DAYS,
    countCallsInWindow,
    deriveDiscoveryRhythmObservations,
    type DiscoverySessionRecord
} from "./discovery-rhythm";
import { validateObservation } from "@/lib/voice/voice-document";

const NOW = new Date("2026-05-31T12:00:00.000Z");

function daysAgo(n: number): string {
    return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

function sess(over: Partial<DiscoverySessionRecord> = {}): DiscoverySessionRecord {
    return {
        call_date: daysAgo(1),
        created_at: daysAgo(1),
        ...over
    };
}

describe("countCallsInWindow", () => {
    it("counts sessions within the last WEEK_WINDOW_DAYS", () => {
        expect(
            countCallsInWindow(
                [sess({ call_date: daysAgo(2) }), sess({ call_date: daysAgo(5) })],
                NOW
            )
        ).toBe(2);
    });

    it("ignores sessions older than the window", () => {
        expect(
            countCallsInWindow(
                [sess({ call_date: daysAgo(WEEK_WINDOW_DAYS + 1) })],
                NOW
            )
        ).toBe(0);
    });

    it("uses created_at when call_date is null", () => {
        expect(
            countCallsInWindow(
                [sess({ call_date: null, created_at: daysAgo(2) })],
                NOW
            )
        ).toBe(1);
    });

    it("skips rows with unparseable timestamps", () => {
        expect(
            countCallsInWindow(
                [
                    sess({ call_date: "not-a-date", created_at: "also-not" })
                ] as DiscoverySessionRecord[],
                NOW
            )
        ).toBe(0);
    });
});

describe("deriveDiscoveryRhythmObservations", () => {
    it("emits nothing when count >= floor", () => {
        const out = deriveDiscoveryRhythmObservations(
            [sess({ call_date: daysAgo(2) })],
            NOW
        );
        expect(out).toEqual([]);
    });

    it("emits 'no calls' variant when count is zero", () => {
        const out = deriveDiscoveryRhythmObservations([], NOW);
        expect(out.length).toBe(1);
        expect(out[0]!.observationText).toContain("No discovery calls");
    });

    it("emits 'below floor' variant when count is 0 < floor", () => {
        // With MIN_CALLS_PER_WEEK = 1, the < floor case is only count === 0.
        // To make this exercise the singular-call branch when the floor
        // bumps in the future, assert directly.
        // Today: this branch is unreachable. Keep the test guarded.
        if (MIN_CALLS_PER_WEEK <= 1) return;
        const out = deriveDiscoveryRhythmObservations(
            [sess({ call_date: daysAgo(2) })],
            NOW
        );
        expect(out.length).toBe(1);
        expect(out[0]!.observationText).toMatch(/Only [0-9]+ discovery/);
    });

    it("emits a workspace-scoped observation (no related entity)", () => {
        const [c] = deriveDiscoveryRhythmObservations([], NOW);
        expect(c!.relatedObjectType).toBeNull();
        expect(c!.relatedObjectId).toBeNull();
        expect(c!.supersedesPrior).toBe(true);
    });

    it("the rendered text passes the Voice Document validator", () => {
        const [c] = deriveDiscoveryRhythmObservations([], NOW);
        const v = validateObservation(c!.observationText);
        expect(
            v.valid,
            `voice failed for: "${c!.observationText}" — ${v.violations.map((x) => x.message).join("; ")}`
        ).toBe(true);
    });
});

describe("DISCOVERY_RHYTHM_GENERATOR_ID", () => {
    it("follows phase-b/<name>", () => {
        expect(DISCOVERY_RHYTHM_GENERATOR_ID).toBe("phase-b/discovery-rhythm");
    });
});
