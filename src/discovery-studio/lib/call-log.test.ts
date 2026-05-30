import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    CALL_LOG_KEY,
    computeSegmentKeysWorked,
    loadCallLog,
    saveCallLog,
    startCallLogPersistence,
    type DiscoveryCallRecord
} from "./call-log";
import {
    __setFrameworkRegistryForTests,
    callDisposition,
    focusedAccount,
    recordSignal,
    resetSession,
    selectFramework,
    type Framework
} from "../state";

/**
 * Per-call log tests. Covers:
 *   - loadCallLog / saveCallLog defensive parsing
 *   - computeSegmentKeysWorked walks the framework registry to map
 *     worked nodes back to their segments
 *   - startCallLogPersistence's transition logic: in-progress → terminal
 *     commits a new record; subsequent edits update the same record;
 *     reset to in-progress starts a fresh session
 */

const FIXTURE: Framework = {
    id: "legal",
    label: "Legal",
    short: "Legal",
    storageKey: "legal",
    segments: [
        {
            key: "opening-frame",
            num: 1,
            title: "Opening frame",
            cue: "",
            essential: true,
            nodes: [
                { id: "of-1", essential: true, tone: "blu", badge: "", text: "", branches: [] },
                { id: "of-2", essential: false, tone: "blu", badge: "", text: "", branches: [] }
            ]
        },
        {
            key: "pain-and-consequence",
            num: 2,
            title: "Pain and consequence",
            cue: "",
            essential: true,
            nodes: [
                { id: "pc-1", essential: true, tone: "red", badge: "", text: "", branches: [] }
            ]
        },
        {
            key: "trigger-and-urgency",
            num: 3,
            title: "Trigger and urgency",
            cue: "",
            essential: false,
            nodes: [
                { id: "tu-1", essential: false, tone: "blu", badge: "", text: "", branches: [] }
            ]
        }
    ],
    supportDossier: [],
    objectionLibrary: [],
    inboundQuestionHandlers: [],
    skipAheadHandlers: [],
    interrupts: []
};

class FakeStorage {
    private map = new Map<string, string>();
    getItem(key: string): string | null {
        return this.map.get(key) ?? null;
    }
    setItem(key: string, value: string): void {
        this.map.set(key, value);
    }
    raw(): string | null {
        return this.map.get(CALL_LOG_KEY) ?? null;
    }
}

beforeEach(() => {
    __setFrameworkRegistryForTests([FIXTURE]);
    resetSession();
    focusedAccount.value = "";
});

afterEach(() => {
    resetSession();
    focusedAccount.value = "";
});

describe("loadCallLog / saveCallLog — defensive parsing", () => {
    it("returns empty when storage is null or key absent", () => {
        const s = new FakeStorage();
        expect(loadCallLog(s)).toEqual([]);
    });

    it("survives malformed JSON", () => {
        const s = new FakeStorage();
        s.setItem(CALL_LOG_KEY, "{{not json");
        expect(loadCallLog(s)).toEqual([]);
    });

    it("drops records missing id or with an invalid disposition", () => {
        const s = new FakeStorage();
        s.setItem(
            CALL_LOG_KEY,
            JSON.stringify({
                calls: [
                    { id: "ok_1", createdAt: "2026-05-30", disposition: "advanced" },
                    { disposition: "advanced" }, // no id
                    { id: "bad_2", disposition: "in-progress" }, // not terminal
                    { id: "bad_3", disposition: "unknown" }
                ]
            })
        );
        const out = loadCallLog(s);
        expect(out.length).toBe(1);
        expect(out[0].id).toBe("ok_1");
    });

    it("round-trips a saved record", () => {
        const s = new FakeStorage();
        const rec: DiscoveryCallRecord = {
            id: "dcl_1",
            createdAt: "2026-05-30T10:00:00.000Z",
            updatedAt: "2026-05-30T10:00:00.000Z",
            accountName: "Acme",
            activeFramework: "legal",
            segmentKeysWorked: ["opening-frame"],
            nodeIdsWorked: ["of-1"],
            disposition: "advanced"
        };
        saveCallLog([rec], s);
        const out = loadCallLog(s);
        expect(out.length).toBe(1);
        expect(out[0]).toEqual(rec);
    });

    it("caps history at 200 records", () => {
        const s = new FakeStorage();
        const many: DiscoveryCallRecord[] = Array.from({ length: 250 }, (_, i) => ({
            id: `dcl_${i}`,
            createdAt: "2026-05-30",
            updatedAt: "2026-05-30",
            accountName: "",
            activeFramework: null,
            segmentKeysWorked: [],
            nodeIdsWorked: [],
            disposition: "advanced" as const
        }));
        saveCallLog(many, s);
        const out = loadCallLog(s);
        expect(out.length).toBe(200);
        // Newest preserved — slice(-MAX) keeps the tail.
        expect(out[out.length - 1].id).toBe("dcl_249");
    });
});

describe("computeSegmentKeysWorked", () => {
    it("returns [] when framework is null", () => {
        expect(computeSegmentKeysWorked(null, ["of-1"])).toEqual([]);
    });

    it("returns [] when no nodes match the framework's nodes", () => {
        expect(
            computeSegmentKeysWorked("legal", ["unknown-node"])
        ).toEqual([]);
    });

    it("maps worked nodes to their segments (deduped)", () => {
        const out = computeSegmentKeysWorked("legal", [
            "of-1",
            "of-2",
            "pc-1"
        ]);
        // of-1 + of-2 both live in "opening-frame" → deduped to one entry.
        expect(out).toContain("opening-frame");
        expect(out).toContain("pain-and-consequence");
        expect(out.length).toBe(2);
    });
});

describe("startCallLogPersistence — write trigger", () => {
    it("does not write while disposition stays in-progress", () => {
        const s = new FakeStorage();
        const handle = startCallLogPersistence({ storage: s });
        try {
            // No transition.
            expect(loadCallLog(s)).toEqual([]);
            expect(handle.__currentCallIdForTests()).toBeNull();
        } finally {
            handle.dispose();
        }
    });

    it("commits a new record when disposition transitions to terminal", () => {
        const s = new FakeStorage();
        selectFramework("legal");
        focusedAccount.value = "Acme";
        recordSignal("of-1", 0, "blu");
        recordSignal("pc-1", 0, "red");
        const handle = startCallLogPersistence({
            storage: s,
            now: () => 1_700_000_000_000
        });
        try {
            callDisposition.value = "advanced";
            const log = loadCallLog(s);
            expect(log.length).toBe(1);
            const rec = log[0]!;
            expect(rec.accountName).toBe("Acme");
            expect(rec.activeFramework).toBe("legal");
            expect(rec.disposition).toBe("advanced");
            expect(rec.nodeIdsWorked).toContain("of-1");
            expect(rec.nodeIdsWorked).toContain("pc-1");
            expect(rec.segmentKeysWorked).toContain("opening-frame");
            expect(rec.segmentKeysWorked).toContain("pain-and-consequence");
            // The in-flight id is held until reset.
            expect(handle.__currentCallIdForTests()).toBe(rec.id);
        } finally {
            handle.dispose();
        }
    });

    it("updates the same record when disposition changes within a session", () => {
        const s = new FakeStorage();
        selectFramework("legal");
        recordSignal("of-1", 0, "blu");
        const handle = startCallLogPersistence({ storage: s });
        try {
            callDisposition.value = "advanced";
            recordSignal("pc-1", 0, "red");
            callDisposition.value = "stalled";
            const log = loadCallLog(s);
            expect(log.length).toBe(1);
            const rec = log[0]!;
            expect(rec.disposition).toBe("stalled");
            // The later signal made it in via the update path.
            expect(rec.nodeIdsWorked).toContain("pc-1");
            expect(rec.updatedAt >= rec.createdAt).toBe(true);
        } finally {
            handle.dispose();
        }
    });

    it("commits a fresh record after reset → new terminal", () => {
        const s = new FakeStorage();
        selectFramework("legal");
        recordSignal("of-1", 0, "blu");
        const handle = startCallLogPersistence({ storage: s });
        try {
            // First session.
            callDisposition.value = "advanced";
            // Reset (new call begins).
            callDisposition.value = "in-progress";
            expect(handle.__currentCallIdForTests()).toBeNull();
            // Second session.
            selectFramework("legal");
            recordSignal("pc-1", 0, "red");
            callDisposition.value = "lost";
            const log = loadCallLog(s);
            expect(log.length).toBe(2);
            expect(log[0]!.disposition).toBe("advanced");
            expect(log[1]!.disposition).toBe("lost");
            // Distinct ids.
            expect(log[0]!.id).not.toBe(log[1]!.id);
        } finally {
            handle.dispose();
        }
    });

    it("dispose() tears down the effect — no more writes", () => {
        const s = new FakeStorage();
        selectFramework("legal");
        const handle = startCallLogPersistence({ storage: s });
        handle.dispose();
        callDisposition.value = "advanced";
        expect(loadCallLog(s)).toEqual([]);
    });
});
