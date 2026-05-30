import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    AUTOPSY_SNAPSHOT_KEY,
    loadAutopsySnapshots,
    saveAutopsySnapshots,
    startAutopsySnapshotPersistence,
    type AutopsySnapshotRecord
} from "./autopsy-snapshot";
import {
    __setAllVitalsForTests,
    resetSession,
    selectDeal,
    setVerdictMode
} from "../state";
import { computeVitalsForAll } from "./vitals";
import type { Deal } from "@/deal-workspace/lib/deal-shape";

/**
 * Per-deal autopsy snapshot tests. Covers:
 *   - load / save defensive parsing
 *   - the snapshot effect upserts on selection (and verdict-mode flips)
 *   - dedupe-by-dealId — opening the same deal twice updates in place
 *   - dispose() tears down the effect cleanly
 *
 * Vitals fixtures route through computeVitalsForAll so they carry the
 * ComputedVitals fields the cause-rules + autopsy generator depend on
 * (gates, missing-map, etc). The room itself runs vitals through the
 * same path on boot.
 */

function makeVitals(deal: Partial<Deal> = {}) {
    const d: Deal = {
        id: deal.id ?? "v",
        accountName: deal.accountName ?? "Acme",
        value: deal.value ?? 50_000,
        stage: deal.stage ?? "negotiation",
        ...deal
    };
    return computeVitalsForAll([d])[0]!;
}

class FakeStorage {
    private map = new Map<string, string>();
    getItem(key: string): string | null {
        return this.map.get(key) ?? null;
    }
    setItem(key: string, value: string): void {
        this.map.set(key, value);
    }
}

beforeEach(() => {
    resetSession();
    __setAllVitalsForTests([]);
});

afterEach(() => {
    resetSession();
    __setAllVitalsForTests([]);
});

describe("loadAutopsySnapshots / saveAutopsySnapshots — defensive parsing", () => {
    it("returns empty when key absent", () => {
        const s = new FakeStorage();
        expect(loadAutopsySnapshots(s)).toEqual([]);
    });

    it("survives malformed JSON", () => {
        const s = new FakeStorage();
        s.setItem(AUTOPSY_SNAPSHOT_KEY, "{{not json");
        expect(loadAutopsySnapshots(s)).toEqual([]);
    });

    it("drops records with missing dealId or invalid verdict", () => {
        const s = new FakeStorage();
        s.setItem(
            AUTOPSY_SNAPSHOT_KEY,
            JSON.stringify({
                snapshots: [
                    { dealId: "ok", verdictMode: "corrected" },
                    { verdictMode: "left" }, // no dealId
                    { dealId: "bad_v", verdictMode: "ambiguous" }
                ]
            })
        );
        const out = loadAutopsySnapshots(s);
        expect(out.length).toBe(1);
        expect(out[0]!.dealId).toBe("ok");
    });

    it("round-trips a saved record", () => {
        const s = new FakeStorage();
        const rec: AutopsySnapshotRecord = {
            dealId: "d_1",
            accountName: "Acme",
            verdictMode: "corrected",
            killSwitch: "If no EB by Tuesday, walk.",
            topCauseId: "champion_weak",
            topCauseLabel: "No champion at the EB level",
            generatedAtIso: "2026-05-30T10:00:00.000Z"
        };
        saveAutopsySnapshots([rec], s);
        const out = loadAutopsySnapshots(s);
        expect(out.length).toBe(1);
        expect(out[0]).toEqual(rec);
    });
});

describe("startAutopsySnapshotPersistence — write trigger", () => {
    it("does not write on boot (skipped initial fire)", () => {
        const s = new FakeStorage();
        const handle = startAutopsySnapshotPersistence({ storage: s });
        try {
            expect(loadAutopsySnapshots(s)).toEqual([]);
        } finally {
            handle.dispose();
        }
    });

    it("upserts a snapshot when a deal is selected", () => {
        const s = new FakeStorage();
        __setAllVitalsForTests([
            makeVitals({ id: "d_acme", accountName: "Acme" })
        ]);
        const handle = startAutopsySnapshotPersistence({
            storage: s,
            now: () => 1_700_000_000_000
        });
        try {
            selectDeal("d_acme");
            const snaps = loadAutopsySnapshots(s);
            expect(snaps.length).toBe(1);
            const r = snaps[0]!;
            expect(r.dealId).toBe("d_acme");
            expect(r.accountName).toBe("Acme");
            expect(r.verdictMode).toBe("left");
            // killSwitch is non-empty for a stalled high-risk deal.
            expect(typeof r.killSwitch).toBe("string");
            expect(r.generatedAtIso).toBeTruthy();
        } finally {
            handle.dispose();
        }
    });

    it("updates the same record when verdict mode flips on the same deal", () => {
        const s = new FakeStorage();
        __setAllVitalsForTests([makeVitals({ id: "d_acme", accountName: "Acme" })]);
        const handle = startAutopsySnapshotPersistence({ storage: s });
        try {
            selectDeal("d_acme");
            setVerdictMode("corrected");
            const snaps = loadAutopsySnapshots(s);
            expect(snaps.length).toBe(1);
            expect(snaps[0]!.verdictMode).toBe("corrected");
        } finally {
            handle.dispose();
        }
    });

    it("keeps one record per dealId across multiple selections", () => {
        const s = new FakeStorage();
        __setAllVitalsForTests([
            makeVitals({ id: "d_acme", accountName: "Acme" }),
            makeVitals({ id: "d_globex", accountName: "Globex" })
        ]);
        const handle = startAutopsySnapshotPersistence({ storage: s });
        try {
            selectDeal("d_acme");
            selectDeal("d_globex");
            selectDeal("d_acme"); // re-open Acme, should still be one Acme record
            const snaps = loadAutopsySnapshots(s);
            expect(snaps.length).toBe(2);
            expect(snaps.map((r) => r.dealId).sort()).toEqual([
                "d_acme",
                "d_globex"
            ]);
        } finally {
            handle.dispose();
        }
    });

    it("dispose() tears down the effect — no more writes", () => {
        const s = new FakeStorage();
        __setAllVitalsForTests([makeVitals({ id: "d_acme", accountName: "Acme" })]);
        const handle = startAutopsySnapshotPersistence({ storage: s });
        handle.dispose();
        selectDeal("d_acme");
        expect(loadAutopsySnapshots(s)).toEqual([]);
    });
});
