import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    READINESS_SNAPSHOT_KEY,
    buildReadinessHealthSnapshot,
    bootReadinessSnapshotPublisher,
    publishReadinessSnapshot
} from "./readiness-snapshot-publisher";
import type { ReadinessSummary } from "@/lib/readiness";
import { __resetForTests, setReadinessInput } from "../state";
import { EMPTY_READINESS_INPUT } from "@/lib/readiness";

function makeSummary(
    overrides: Partial<ReadinessSummary> = {}
): ReadinessSummary {
    return {
        verdict: "building",
        verdictLabel: "Building",
        totalScore: 38,
        gateBlockers: [],
        nextVerdict: "inheritable_with_guardrails",
        dimensions: [
            { id: "icp", label: "ICP & targeting", score: 12, evidence: [], gaps: [] },
            { id: "outreach", label: "Outreach motion", score: 8, evidence: [], gaps: [] },
            { id: "discovery", label: "Discovery depth", score: 6, evidence: [], gaps: [] },
            { id: "deals", label: "Deal truth", score: 7, evidence: [], gaps: [] },
            { id: "proof", label: "Proof & playbook", score: 5, evidence: [], gaps: [] }
        ],
        ...overrides
    } as ReadinessSummary;
}

describe("buildReadinessHealthSnapshot", () => {
    it("projects score, fragility, and the weakest dimension label", () => {
        const snap = buildReadinessHealthSnapshot(
            makeSummary(),
            new Date("2026-06-12T12:00:00Z")
        );
        expect(snap.score).toBe(38);
        expect(snap.fragilityScore).toBe(62);
        expect(snap.weakestDimension).toBe("Proof & playbook");
        expect(snap.capturedAt).toBe("2026-06-12T12:00:00.000Z");
        expect(snap.verdict).toBe("building");
        expect(snap.verdictLabel).toBe("Building");
    });

    it("flags every dimension below 14/20 as weak, proof under the legacy playbook name", () => {
        const snap = buildReadinessHealthSnapshot(makeSummary());
        expect(snap.icpWeak).toBe(true);
        expect(snap.discoveryWeak).toBe(true);
        expect(snap.outreachWeak).toBe(true);
        expect(snap.dealsWeak).toBe(true);
        expect(snap.playbookWeak).toBe(true);
    });

    it("clears the weak flags at 14/20 and above", () => {
        const strong = makeSummary({
            totalScore: 90,
            dimensions: [
                { id: "icp", label: "ICP & targeting", score: 18, evidence: [], gaps: [] },
                { id: "outreach", label: "Outreach motion", score: 18, evidence: [], gaps: [] },
                { id: "discovery", label: "Discovery depth", score: 18, evidence: [], gaps: [] },
                { id: "deals", label: "Deal truth", score: 18, evidence: [], gaps: [] },
                { id: "proof", label: "Proof & playbook", score: 18, evidence: [], gaps: [] }
            ]
        });
        const snap = buildReadinessHealthSnapshot(strong);
        expect(snap.icpWeak).toBe(false);
        expect(snap.discoveryWeak).toBe(false);
        expect(snap.outreachWeak).toBe(false);
        expect(snap.dealsWeak).toBe(false);
        expect(snap.playbookWeak).toBe(false);
        expect(snap.fragilityScore).toBe(10);
    });

    it("handles an empty dimension list without throwing", () => {
        const snap = buildReadinessHealthSnapshot(
            makeSummary({ dimensions: [], totalScore: 0 })
        );
        expect(snap.weakestDimension).toBe("");
        expect(snap.score).toBe(0);
        expect(snap.fragilityScore).toBe(100);
        expect(snap.icpWeak).toBe(true);
    });
});

describe("publishReadinessSnapshot", () => {
    beforeEach(() => {
        localStorage.removeItem(READINESS_SNAPSHOT_KEY);
    });

    it("writes the snapshot to gtmos_readiness_snapshot", () => {
        const wrote = publishReadinessSnapshot(makeSummary(), localStorage);
        expect(wrote).toBe(true);
        const raw = localStorage.getItem(READINESS_SNAPSHOT_KEY);
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw as string) as Record<string, unknown>;
        expect(parsed.score).toBe(38);
        expect(parsed.weakestDimension).toBe("Proof & playbook");
    });

    it("skips the rewrite when the payload is unchanged (ignoring capturedAt)", () => {
        expect(publishReadinessSnapshot(makeSummary(), localStorage)).toBe(true);
        expect(publishReadinessSnapshot(makeSummary(), localStorage)).toBe(
            false
        );
    });

    it("rewrites when the summary actually changed", () => {
        expect(publishReadinessSnapshot(makeSummary(), localStorage)).toBe(true);
        expect(
            publishReadinessSnapshot(
                makeSummary({ totalScore: 55 }),
                localStorage
            )
        ).toBe(true);
        const parsed = JSON.parse(
            localStorage.getItem(READINESS_SNAPSHOT_KEY) as string
        ) as Record<string, unknown>;
        expect(parsed.score).toBe(55);
    });

    it("overwrites an unparseable existing payload", () => {
        localStorage.setItem(READINESS_SNAPSHOT_KEY, "{not json");
        expect(publishReadinessSnapshot(makeSummary(), localStorage)).toBe(true);
        expect(() =>
            JSON.parse(localStorage.getItem(READINESS_SNAPSHOT_KEY) as string)
        ).not.toThrow();
    });

    it("returns false and never throws without storage", () => {
        expect(publishReadinessSnapshot(makeSummary(), null)).toBe(false);
    });
});

describe("bootReadinessSnapshotPublisher", () => {
    beforeEach(() => {
        __resetForTests();
        localStorage.removeItem(READINESS_SNAPSHOT_KEY);
    });

    afterEach(() => {
        __resetForTests();
        localStorage.removeItem(READINESS_SNAPSHOT_KEY);
    });

    it("publishes immediately on boot and re-publishes on input change", () => {
        setReadinessInput(EMPTY_READINESS_INPUT);
        const dispose = bootReadinessSnapshotPublisher(localStorage);
        try {
            const first = localStorage.getItem(READINESS_SNAPSHOT_KEY);
            expect(first).not.toBeNull();
            const parsed = JSON.parse(first as string) as Record<
                string,
                unknown
            >;
            // Empty workspace → the floor verdict, honestly written.
            expect(parsed.verdict).toBe("you_are_the_system");

            setReadinessInput({
                ...EMPTY_READINESS_INPUT,
                icpCount: 1,
                bestIcpQualityScore: 80
            });
            const second = localStorage.getItem(READINESS_SNAPSHOT_KEY);
            expect(second).not.toBeNull();
            expect(second).not.toBe(first);
        } finally {
            dispose();
        }
    });
});
