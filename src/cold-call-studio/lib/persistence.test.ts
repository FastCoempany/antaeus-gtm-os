import { describe, expect, it } from "vitest";
import {
    incrementDiscoveryStats,
    loadCallLog,
    loadCompanyName,
    loadDiscoveryStats,
    saveCallLog,
    saveDiscoveryStats
} from "./persistence";
import type { CallLogEntry } from "./types";

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

function makeEntry(p: Partial<CallLogEntry>): CallLogEntry {
    return {
        id: p.id ?? "call_1",
        accountName: p.accountName ?? "Acme",
        contactName: p.contactName ?? "Sarah",
        contactTitle: p.contactTitle ?? "",
        threadId: p.threadId ?? "opener",
        threadTitle: p.threadTitle ?? "Opening thread",
        buyerResponse: p.buyerResponse ?? "I am busy.",
        recommendedResponse: p.recommendedResponse ?? "Fair.",
        outcome: p.outcome ?? "logged",
        notes: p.notes ?? "",
        source: "cold-call-studio-talk-loom",
        createdAt: p.createdAt ?? "2026-04-27T00:00:00Z"
    };
}

describe("loadCallLog", () => {
    it("returns [] when storage is empty", () => {
        const s = new MemStorage();
        expect(loadCallLog(s)).toHaveLength(0);
    });

    it("returns [] when JSON is malformed", () => {
        const s = new MemStorage();
        s.seed("gtmos_cold_call_log", "{not json");
        expect(loadCallLog(s)).toHaveLength(0);
    });

    it("returns [] when shape is wrong", () => {
        const s = new MemStorage();
        s.seed("gtmos_cold_call_log", JSON.stringify(["not-an-object"]));
        expect(loadCallLog(s)).toHaveLength(0);
    });

    it("drops malformed call rows but keeps good ones", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_cold_call_log",
            JSON.stringify({
                calls: [
                    makeEntry({ id: "good-1" }),
                    null,
                    { missing: "fields" },
                    {
                        ...makeEntry({}),
                        threadId: "ghost-thread"
                    },
                    {
                        ...makeEntry({}),
                        outcome: "made-up-outcome"
                    },
                    makeEntry({ id: "good-2" })
                ]
            })
        );
        const out = loadCallLog(s);
        expect(out.map((c) => c.id)).toEqual(["good-1", "good-2"]);
    });

    it("preserves all CallLogEntry fields", () => {
        const s = new MemStorage();
        const entry = makeEntry({
            id: "x",
            accountName: "Acme",
            contactName: "Sarah",
            contactTitle: "VP Eng",
            threadId: "ask",
            threadTitle: "Ask thread",
            buyerResponse: "Yes.",
            recommendedResponse: "Good.",
            outcome: "meeting_booked",
            notes: "Wanted demo Friday."
        });
        s.seed(
            "gtmos_cold_call_log",
            JSON.stringify({ calls: [entry] })
        );
        const out = loadCallLog(s);
        expect(out[0]).toEqual(entry);
    });
});

describe("saveCallLog", () => {
    it("writes the calls[] envelope shape (legacy parity)", () => {
        const s = new MemStorage();
        saveCallLog([makeEntry({ id: "a" }), makeEntry({ id: "b" })], s);
        const raw = s.getItem("gtmos_cold_call_log");
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw as string) as { calls: unknown[] };
        expect(Array.isArray(parsed.calls)).toBe(true);
        expect(parsed.calls).toHaveLength(2);
    });

    it("round-trips through loadCallLog", () => {
        const s = new MemStorage();
        const entries = [makeEntry({ id: "1" }), makeEntry({ id: "2" })];
        saveCallLog(entries, s);
        expect(loadCallLog(s).map((c) => c.id)).toEqual(["1", "2"]);
    });
});

describe("discovery stats", () => {
    it("loads empty stats when missing", () => {
        const s = new MemStorage();
        expect(loadDiscoveryStats(s)).toEqual({
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

    it("incrementDiscoveryStats bumps totalCalls only on non-meeting outcomes", () => {
        const s = new MemStorage();
        let next = incrementDiscoveryStats("voicemail", s);
        expect(next).toEqual({ totalCalls: 1, advancedCalls: 0 });
        next = incrementDiscoveryStats("rejected", s);
        expect(next).toEqual({ totalCalls: 2, advancedCalls: 0 });
    });

    it("incrementDiscoveryStats bumps both on meeting_booked", () => {
        const s = new MemStorage();
        const next = incrementDiscoveryStats("meeting_booked", s);
        expect(next).toEqual({ totalCalls: 1, advancedCalls: 1 });
    });

    it("saveDiscoveryStats round-trips", () => {
        const s = new MemStorage();
        saveDiscoveryStats({ totalCalls: 4, advancedCalls: 1 }, s);
        expect(loadDiscoveryStats(s)).toEqual({
            totalCalls: 4,
            advancedCalls: 1
        });
    });
});

describe("loadCompanyName", () => {
    it("returns empty string when missing", () => {
        const s = new MemStorage();
        expect(loadCompanyName(s)).toBe("");
    });

    it("reads gtmos_playbook.company", () => {
        const s = new MemStorage();
        s.seed(
            "gtmos_playbook",
            JSON.stringify({ company: "Antaeus", other: "ignored" })
        );
        expect(loadCompanyName(s)).toBe("Antaeus");
    });

    it("returns empty string when company is non-string", () => {
        const s = new MemStorage();
        s.seed("gtmos_playbook", JSON.stringify({ company: 42 }));
        expect(loadCompanyName(s)).toBe("");
    });

    it("returns empty string when JSON is malformed", () => {
        const s = new MemStorage();
        s.seed("gtmos_playbook", "{bad");
        expect(loadCompanyName(s)).toBe("");
    });
});
