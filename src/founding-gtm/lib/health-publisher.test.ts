import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    buildHealthSnapshot,
    FOUNDING_GTM_HEALTH_KEY,
    startHealthPublishing
} from "./health-publisher";
import type { AuthoredSection } from "./types";
import { __resetForTests, setSectionsInput } from "../state";
import { authorAllSections } from "./sections";

class MemStorage {
    map: Record<string, string> = {};
    setItem(k: string, v: string): void {
        this.map[k] = v;
    }
}

const empty: AuthoredSection = {
    id: "who_hits",
    kicker: "x",
    title: "x",
    status: "empty",
    body: [],
    evidence: [],
    surprise: null
};

describe("buildHealthSnapshot", () => {
    it("returns 0/0 with no sections", () => {
        const s = buildHealthSnapshot([], "2026-05-01T00:00:00Z");
        expect(s.sections_ready).toBe(0);
        expect(s.sections_partial).toBe(0);
        expect(s.captured_at).toBe("2026-05-01T00:00:00Z");
    });

    it("counts ready vs partial vs empty", () => {
        const sections: AuthoredSection[] = [
            { ...empty, status: "ready" },
            { ...empty, status: "ready" },
            { ...empty, status: "partial" },
            { ...empty, status: "empty" }
        ];
        const s = buildHealthSnapshot(sections, "2026-05-01T00:00:00Z");
        expect(s.sections_ready).toBe(2);
        expect(s.sections_partial).toBe(1);
    });
});

describe("startHealthPublishing", () => {
    beforeEach(() => __resetForTests());
    afterEach(() => __resetForTests());

    it("skips first run, then writes on input change", () => {
        const storage = new MemStorage();
        let publishCount = 0;
        const stop = startHealthPublishing({
            storage,
            now: () => "2026-05-01T00:00:00Z",
            onPublish: () => {
                publishCount += 1;
            }
        });
        // First run was the boot — should not have written.
        expect(publishCount).toBe(0);
        expect(storage.map[FOUNDING_GTM_HEALTH_KEY]).toBeUndefined();

        // Drive an input change that flips at least one section to non-empty.
        // §1 needs ICPs to leave 'empty'.
        setSectionsInput({
            icps: [
                {
                    id: "i1",
                    name: "x",
                    persona: "p",
                    trigger: "t",
                    worked: true,
                    qualityScore: 50
                }
            ],
            closedWon: [],
            closedLost: [],
            openDeals: [],
            touches: [],
            cues: [],
            coldCalls: [],
            callPlanner: [],
            autopsies: [],
            autopsySnapshots: [],
            proofs: [],
            advisorDeployments: [],
            quota: null,
            discoveryCalls: [],
            discoveryStats: null,
            discoveryWorked: []
        });

        expect(publishCount).toBe(1);
        expect(storage.map[FOUNDING_GTM_HEALTH_KEY]).toBeDefined();
        const written = JSON.parse(
            storage.map[FOUNDING_GTM_HEALTH_KEY]
        );
        expect(written.sections_ready).toBe(0);
        expect(written.sections_partial).toBe(1);

        stop();
    });

    it("does NOT re-publish when only captured_at would change", () => {
        const storage = new MemStorage();
        let publishCount = 0;
        let nowCounter = 0;
        const stop = startHealthPublishing({
            storage,
            now: () =>
                new Date(2026, 4, 1, 0, 0, ++nowCounter).toISOString(),
            onPublish: () => {
                publishCount += 1;
            }
        });

        // First run = no-op.
        // Second run: real change.
        setSectionsInput({
            icps: [
                {
                    id: "i1",
                    name: "x",
                    persona: "",
                    trigger: "",
                    worked: false,
                    qualityScore: 0
                }
            ],
            closedWon: [],
            closedLost: [],
            openDeals: [],
            touches: [],
            cues: [],
            coldCalls: [],
            callPlanner: [],
            autopsies: [],
            autopsySnapshots: [],
            proofs: [],
            advisorDeployments: [],
            quota: null,
            discoveryCalls: [],
            discoveryStats: null,
            discoveryWorked: []
        });
        expect(publishCount).toBe(1);

        // Same input → same section statuses → no re-publish.
        setSectionsInput({
            icps: [
                {
                    id: "i1",
                    name: "x",
                    persona: "",
                    trigger: "",
                    worked: false,
                    qualityScore: 0
                }
            ],
            closedWon: [],
            closedLost: [],
            openDeals: [],
            touches: [],
            cues: [],
            coldCalls: [],
            callPlanner: [],
            autopsies: [],
            autopsySnapshots: [],
            proofs: [],
            advisorDeployments: [],
            quota: null,
            discoveryCalls: [],
            discoveryStats: null,
            discoveryWorked: []
        });
        expect(publishCount).toBe(1);

        stop();
    });

    it("aggregates correctly through authorAllSections() round-trip", () => {
        const sections = authorAllSections({
            icps: [],
            closedWon: [],
            closedLost: [],
            openDeals: [],
            touches: [],
            cues: [],
            coldCalls: [],
            callPlanner: [],
            autopsies: [],
            autopsySnapshots: [],
            proofs: [],
            advisorDeployments: [],
            quota: null,
            discoveryCalls: [],
            discoveryStats: null,
            discoveryWorked: []
        });
        const snap = buildHealthSnapshot(sections, "2026-05-01T00:00:00Z");
        expect(snap.sections_ready).toBe(0);
        expect(snap.sections_partial).toBe(0);
    });
});
