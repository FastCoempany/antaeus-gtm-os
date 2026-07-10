import { describe, it, expect, vi } from "vitest";
import {
    capturedMeetingsThisMonth,
    hydrateCapturedMeetings,
    CAPTURED_MEETINGS_KEY
} from "./captured-meetings";

let mockRows: unknown[] | null = null;
vi.mock("@/lib/data-client", () => ({
    createDataClient: () => {
        if (!mockRows) throw new Error("no env");
        return { capturedMeetings: { list: async () => mockRows } };
    }
}));

function mem(): { getItem(k: string): string | null; setItem(k: string, v: string): void; data: Record<string, string> } {
    const data: Record<string, string> = {};
    return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

const NOW = new Date("2026-07-10T12:00:00Z");

describe("captured meetings tally", () => {
    it("reads only the current month's tally", () => {
        const s = mem();
        s.data[CAPTURED_MEETINGS_KEY] = JSON.stringify({ month: "2026-07", held: 4 });
        expect(capturedMeetingsThisMonth(s, NOW)).toBe(4);
        s.data[CAPTURED_MEETINGS_KEY] = JSON.stringify({ month: "2026-06", held: 9 });
        expect(capturedMeetingsThisMonth(s, NOW)).toBe(0);
    });

    it("hydrates held-this-month from cloud rows (future meetings excluded)", async () => {
        const s = mem();
        mockRows = [
            { starts_at: "2026-07-03T15:00:00Z" },
            { starts_at: "2026-07-09T15:00:00Z" },
            { starts_at: "2026-07-12T15:00:00Z" }, // future — not held yet
            { starts_at: "2026-06-20T15:00:00Z" }  // last month
        ];
        try {
            const held = await hydrateCapturedMeetings(s, NOW);
            expect(held).toBe(2);
            expect(capturedMeetingsThisMonth(s, NOW)).toBe(2);
        } finally {
            mockRows = null;
        }
    });

    it("a failed hydrate keeps the previous tally", async () => {
        const s = mem();
        s.data[CAPTURED_MEETINGS_KEY] = JSON.stringify({ month: "2026-07", held: 3 });
        expect(await hydrateCapturedMeetings(s, NOW)).toBe(3);
    });
});
