import { describe, expect, it } from "vitest";
import {
    QUIET_DAYS,
    WIRE_CAP,
    ageLabel,
    mergeEvents,
    quietLine,
    readDailyGoal,
    readEdge,
    readLastMovement,
    readLocalEvents,
    readStillQuiet,
    readTodayCount,
    type EdgeEvent
} from "./edge-data";
import { EDGE_PREFS_KEY, readEdgeOn } from "./edge-prefs";

function memStorage(seed: Record<string, unknown> = {}): {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
} {
    const map = new Map<string, string>();
    for (const [k, v] of Object.entries(seed)) {
        map.set(k, typeof v === "string" ? v : JSON.stringify(v));
    }
    return {
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => {
            map.set(k, v);
        }
    };
}

const NOW = new Date("2026-07-16T15:00:00");
const iso = (hoursAgo: number): string =>
    new Date(NOW.getTime() - hoursAgo * 3600_000).toISOString();

describe("readTodayCount", () => {
    it("counts today's logged touches + calls + LinkedIn moves", () => {
        const s = memStorage({
            gtmos_outbound_touches: { touches: [{ createdAt: iso(2) }, { createdAt: iso(30) }] },
            gtmos_cold_call_log: { calls: [{ createdAt: iso(1), outcome: "voicemail" }] },
            gtmos_linkedin_log: { actions: [{ createdAt: iso(3) }] }
        });
        // iso(30) is yesterday relative to 15:00 — only 3 land today
        expect(readTodayCount(s, NOW)).toBe(3);
    });

    it("the hand count is a floor, never an add-on", () => {
        const s = memStorage({
            gtmos_outbound_touches: { touches: [{ createdAt: iso(2) }] },
            gtmos_bulk_outreach_v1: { "2026-07-16": 40 }
        });
        expect(readTodayCount(s, NOW)).toBe(40);
    });

    it("empty storage counts zero", () => {
        expect(readTodayCount(memStorage(), NOW)).toBe(0);
    });
});

describe("readDailyGoal", () => {
    it("reads the Quota room's daily habit", () => {
        const s = memStorage({ gtmos_quota_targets: { touches_day: 88.6 } });
        expect(readDailyGoal(s)).toBe(89);
    });
    it("null when no plan is on record", () => {
        expect(readDailyGoal(memStorage())).toBeNull();
        expect(readDailyGoal(memStorage({ gtmos_quota_targets: { touches_day: 0 } }))).toBeNull();
    });
});

describe("readLocalEvents", () => {
    it("tags the three voices and sorts newest first", () => {
        const s = memStorage({
            gtmos_outbound_touches: {
                touches: [
                    {
                        id: "t1",
                        accountName: "Northwind",
                        createdAt: iso(5),
                        outcome: "replied",
                        outcomeDate: iso(1)
                    }
                ]
            },
            gtmos_cold_call_log: {
                calls: [
                    { id: "c1", account: "Torch Labs", createdAt: iso(3), outcome: "voicemail" },
                    { id: "c2", account: "Ramp", createdAt: iso(2), outcome: "meeting_booked" }
                ]
            }
        });
        const events = readLocalEvents(s, NOW);
        expect(events[0].who).toBe("buyer"); // the reply, 1h ago
        expect(events[0].big).toBe(true);
        expect(events[0].text).toContain("Northwind");
        const booked = events.find((e) => e.id === "ccm:c2");
        expect(booked?.who).toBe("buyer");
        expect(booked?.big).toBe(true);
        const dialed = events.find((e) => e.id === "cc:c1");
        expect(dialed?.who).toBe("you");
        const sent = events.find((e) => e.id === "touch:t1");
        expect(sent?.who).toBe("you");
        // strictly newest-first
        for (let i = 1; i < events.length; i++) {
            expect(events[i - 1].ts).toBeGreaterThanOrEqual(events[i].ts);
        }
    });

    it("drops events outside the wire window", () => {
        const s = memStorage({
            gtmos_outbound_touches: { touches: [{ id: "old", createdAt: iso(80) }] }
        });
        expect(readLocalEvents(s, NOW)).toHaveLength(0);
    });

    it("survives malformed storage", () => {
        const s = memStorage({ gtmos_outbound_touches: "{not json" });
        expect(readLocalEvents(s, NOW)).toHaveLength(0);
    });
});

describe("mergeEvents", () => {
    it("dedupes by id, sorts, and caps the wire", () => {
        const mk = (id: string, minsAgo: number): EdgeEvent => ({
            id,
            who: "you",
            text: id,
            ts: NOW.getTime() - minsAgo * 60_000
        });
        const a = [mk("x", 1), mk("y", 5)];
        const b = [mk("x", 1), ...Array.from({ length: 12 }, (_, i) => mk(`z${i}`, i + 2))];
        const merged = mergeEvents(a, b);
        expect(merged).toHaveLength(WIRE_CAP);
        expect(merged.filter((e) => e.id === "x")).toHaveLength(1);
        expect(merged[0].ts).toBeGreaterThanOrEqual(merged[merged.length - 1].ts);
    });
});

describe("readStillQuiet", () => {
    it("names the watched account quiet the longest", () => {
        const s = memStorage({
            gtmos_sc_v4: {
                accounts: [
                    { id: "a", name: "Mercury", signals: [{ fetched_at: iso(24 * 9) }] },
                    { id: "b", name: "Vanta", signals: [{ fetched_at: iso(24 * 6) }] },
                    { id: "c", name: "Ramp", signals: [{ fetched_at: iso(2) }] }
                ]
            }
        });
        const quiet = readStillQuiet(s, NOW);
        expect(quiet?.name).toBe("Mercury");
        expect(quiet?.days).toBe(9);
    });

    it("outreach to the account resets its silence", () => {
        const s = memStorage({
            gtmos_sc_v4: {
                accounts: [{ id: "a", name: "Mercury", signals: [{ fetched_at: iso(24 * 9) }] }]
            },
            gtmos_outbound_touches: {
                touches: [{ accountName: "mercury", createdAt: iso(24) }]
            }
        });
        expect(readStillQuiet(s, NOW)).toBeNull();
    });

    it(`nothing under ${QUIET_DAYS} days, null on empty console`, () => {
        const s = memStorage({
            gtmos_sc_v4: {
                accounts: [{ id: "a", name: "Fresh", signals: [{ fetched_at: iso(24) }] }]
            }
        });
        expect(readStillQuiet(s, NOW)).toBeNull();
        expect(readStillQuiet(memStorage(), NOW)).toBeNull();
    });
});

describe("ageLabel + quietLine", () => {
    it("re-stamps ages in place", () => {
        expect(ageLabel(NOW.getTime() - 20_000, NOW)).toBe("just now");
        expect(ageLabel(NOW.getTime() - 28 * 60_000, NOW)).toBe("28m");
        expect(ageLabel(NOW.getTime() - 3 * 3600_000, NOW)).toBe("3h");
        expect(ageLabel(NOW.getTime() - 30 * 3600_000, NOW)).toBe("yesterday");
        expect(ageLabel(NOW.getTime() - 90 * 3600_000, NOW)).toBe("3d");
    });

    it("the dead-morning line is honest, never fake-busy", () => {
        expect(quietLine(null, NOW)).toContain("Nothing captured yet");
        const yesterday = new Date("2026-07-15T16:12:00").getTime();
        const line = quietLine(yesterday, NOW);
        expect(line).toContain("Nothing yet today");
        expect(line).toContain("yesterday");
    });
});

describe("readLastMovement", () => {
    it("finds the most recent action across sources, even outside the window", () => {
        const s = memStorage({
            gtmos_outbound_touches: { touches: [{ createdAt: iso(200) }] },
            gtmos_cold_call_log: { calls: [{ createdAt: iso(100) }] }
        });
        expect(readLastMovement(s)).toBe(NOW.getTime() - 100 * 3600_000);
    });
    it("null when nothing was ever logged", () => {
        expect(readLastMovement(memStorage())).toBeNull();
    });
});

describe("readEdge", () => {
    it("assembles the whole rail read", () => {
        const s = memStorage({
            gtmos_quota_targets: { touches_day: 90 },
            gtmos_outbound_touches: { touches: [{ id: "t", accountName: "Ramp", createdAt: iso(1) }] }
        });
        const read = readEdge(s, NOW);
        expect(read.todayCount).toBe(1);
        expect(read.dailyGoal).toBe(90);
        expect(read.events).toHaveLength(1);
        expect(read.shiftTotal).toBeGreaterThanOrEqual(1);
        expect(read.lastMovement).not.toBeNull();
    });
});

describe("edge prefs", () => {
    it("defaults ON; a stored off wins; malformed falls back on", () => {
        expect(readEdgeOn(memStorage())).toBe(true);
        expect(readEdgeOn(memStorage({ [EDGE_PREFS_KEY]: { on: false } }))).toBe(false);
        expect(readEdgeOn(memStorage({ [EDGE_PREFS_KEY]: "{bad" }))).toBe(true);
    });
});
