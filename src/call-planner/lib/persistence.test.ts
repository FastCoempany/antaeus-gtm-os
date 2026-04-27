import { describe, expect, it } from "vitest";
import {
    incrementDiscoveryStats,
    loadAgendaSnapshot,
    loadCallHandoff,
    loadDiscoveryStats,
    saveAgendaSnapshot,
    saveCallHandoff,
    saveDiscoveryStats
} from "./persistence";
import type { AgendaSnapshot, CallHandoffPayload } from "./types";

class MemStorage {
    private store = new Map<string, string>();
    getItem(k: string): string | null {
        return this.store.has(k) ? (this.store.get(k) ?? null) : null;
    }
    setItem(k: string, v: string): void {
        this.store.set(k, v);
    }
    seed(k: string, v: string): void {
        this.store.set(k, v);
    }
}

function makeSnapshot(p: Partial<AgendaSnapshot> = {}): AgendaSnapshot {
    return {
        contact: p.contact ?? "Sarah Chen",
        company: p.company ?? "Acme Robotics",
        persona: p.persona ?? "vp",
        linkedDeal: p.linkedDeal ?? "deal-1",
        gates: p.gates ?? [true, true, true, false, false],
        gateDetails: p.gateDetails ?? [
            { label: "Real person selected", met: true, copy: "" }
        ],
        score: p.score ?? 70,
        band: p.band ?? "Workable",
        nextMove: p.nextMove ?? "Capture a real why-now angle.",
        signalHeadline: p.signalHeadline ?? "Series B announced",
        customNotes: p.customNotes ?? "",
        linkedinUrl: p.linkedinUrl ?? "",
        preparedAt: p.preparedAt ?? "2026-04-27T18:00:00Z"
    };
}

function makeHandoff(p: Partial<CallHandoffPayload> = {}): CallHandoffPayload {
    return {
        contact: p.contact ?? "Sarah Chen",
        outcome: p.outcome ?? "planned",
        timestamp: p.timestamp ?? "2026-04-27T18:00:00Z",
        linkedDeal: p.linkedDeal ?? "deal-1",
        company: p.company ?? "Acme Robotics",
        persona: p.persona ?? "vp",
        logType: p.logType ?? "call_plan",
        summary: p.summary ?? "Discovery plan ready",
        agendaScore: p.agendaScore ?? 70,
        agendaBand: p.agendaBand ?? "Workable",
        nextMove: p.nextMove ?? "Capture a real why-now angle."
    };
}

describe("loadAgendaSnapshot", () => {
    it("returns null when storage is null or empty", () => {
        expect(loadAgendaSnapshot(null)).toBeNull();
        expect(loadAgendaSnapshot(new MemStorage())).toBeNull();
    });

    it("returns null when JSON is malformed", () => {
        const s = new MemStorage();
        s.seed("gtmos_discovery_agenda", "{not json");
        expect(loadAgendaSnapshot(s)).toBeNull();
    });

    it("preserves all snapshot fields on round-trip", () => {
        const s = new MemStorage();
        const snap = makeSnapshot();
        saveAgendaSnapshot(snap, s);
        expect(loadAgendaSnapshot(s)).toEqual(snap);
    });

    it("normalizes unknown persona to cxo", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_discovery_agenda",
            JSON.stringify({ ...makeSnapshot(), persona: "ghost" })
        );
        expect(loadAgendaSnapshot(s)?.persona).toBe("cxo");
    });

    it("falls back to current ISO when preparedAt is missing/non-string", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_discovery_agenda",
            JSON.stringify({ ...makeSnapshot(), preparedAt: 42 })
        );
        const out = loadAgendaSnapshot(s);
        expect(out?.preparedAt).toBeTruthy();
        // Just sanity-check it parses as a date
        expect(Number.isNaN(Date.parse(out?.preparedAt ?? ""))).toBe(false);
    });

    it("drops malformed gateDetails rows", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_discovery_agenda",
            JSON.stringify({
                ...makeSnapshot(),
                gateDetails: [
                    { label: "good", met: true, copy: "ok" },
                    null,
                    "string-row",
                    { label: "also good", met: false, copy: "miss" }
                ]
            })
        );
        const out = loadAgendaSnapshot(s);
        expect(out?.gateDetails).toHaveLength(2);
    });
});

describe("saveCallHandoff + loadCallHandoff", () => {
    it("returns null when storage empty", () => {
        expect(loadCallHandoff(new MemStorage())).toBeNull();
    });

    it("preserves all payload fields on round-trip", () => {
        const s = new MemStorage();
        const payload = makeHandoff({
            outcome: "advanced",
            logType: "call_outcome",
            summary: "Discovery call - Advanced"
        });
        saveCallHandoff(payload, s);
        expect(loadCallHandoff(s)).toEqual(payload);
    });

    it("normalizes unknown outcome to 'planned'", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_call_handoff",
            JSON.stringify({ ...makeHandoff(), outcome: "ghost" })
        );
        expect(loadCallHandoff(s)?.outcome).toBe("planned");
    });

    it("normalizes empty linkedDeal string to null", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_call_handoff",
            JSON.stringify({ ...makeHandoff(), linkedDeal: "" })
        );
        expect(loadCallHandoff(s)?.linkedDeal).toBeNull();
    });
});

describe("discovery stats", () => {
    it("loads zeros when missing", () => {
        expect(loadDiscoveryStats(new MemStorage())).toEqual({
            totalCalls: 0,
            advancedCalls: 0
        });
    });

    it("clamps malformed stats to 0", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_discovery_stats",
            JSON.stringify({ totalCalls: -5, advancedCalls: "fifty" })
        );
        expect(loadDiscoveryStats(s)).toEqual({
            totalCalls: 0,
            advancedCalls: 0
        });
    });

    it("incrementDiscoveryStats bumps totalCalls always", () => {
        const s = new MemStorage();
        let next = incrementDiscoveryStats("stalled", s);
        expect(next).toEqual({ totalCalls: 1, advancedCalls: 0 });
        next = incrementDiscoveryStats("no_show", s);
        expect(next).toEqual({ totalCalls: 2, advancedCalls: 0 });
        next = incrementDiscoveryStats("rescheduled", s);
        expect(next).toEqual({ totalCalls: 3, advancedCalls: 0 });
        next = incrementDiscoveryStats("lost", s);
        expect(next).toEqual({ totalCalls: 4, advancedCalls: 0 });
    });

    it("incrementDiscoveryStats bumps advancedCalls only on 'advanced'", () => {
        const s = new MemStorage();
        let next = incrementDiscoveryStats("advanced", s);
        expect(next).toEqual({ totalCalls: 1, advancedCalls: 1 });
        next = incrementDiscoveryStats("stalled", s);
        expect(next).toEqual({ totalCalls: 2, advancedCalls: 1 });
        next = incrementDiscoveryStats("advanced", s);
        expect(next).toEqual({ totalCalls: 3, advancedCalls: 2 });
    });

    it("saveDiscoveryStats round-trips", () => {
        const s = new MemStorage();
        saveDiscoveryStats({ totalCalls: 7, advancedCalls: 2 }, s);
        expect(loadDiscoveryStats(s)).toEqual({
            totalCalls: 7,
            advancedCalls: 2
        });
    });
});
