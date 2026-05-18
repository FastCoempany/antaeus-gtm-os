import { describe, expect, it } from "vitest";
import { loadStamp } from "./stamp";

function fakeStorage(map: Record<string, string>): {
    getItem(key: string): string | null;
} {
    return {
        getItem(key: string) {
            return map[key] ?? null;
        }
    };
}

describe("loadStamp", () => {
    it("returns Week 1 · Day 1 on empty storage", () => {
        const s = loadStamp(fakeStorage({}));
        expect(s.week).toBe(1);
        expect(s.day).toBe(1);
        expect(s.label).toBe("Week 1 · Day 1");
    });

    it("returns Week 1 · Day 1 on missing completedAt", () => {
        const s = loadStamp(
            fakeStorage({ gtmos_onboarding: JSON.stringify({ completed: true }) })
        );
        expect(s.label).toBe("Week 1 · Day 1");
    });

    it("returns Week 1 · Day 1 on malformed JSON", () => {
        const s = loadStamp(fakeStorage({ gtmos_onboarding: "not-json" }));
        expect(s.label).toBe("Week 1 · Day 1");
    });

    it("computes Day N + 1 from completedAt = now (same day)", () => {
        const now = new Date("2026-05-18T12:00:00Z");
        const completedAt = new Date("2026-05-18T08:00:00Z").toISOString();
        const s = loadStamp(
            fakeStorage({
                gtmos_onboarding: JSON.stringify({ completedAt })
            }),
            now
        );
        // 4 hours later → 0 days since → Day 1
        expect(s.week).toBe(1);
        expect(s.day).toBe(1);
    });

    it("returns Week 1 · Day 4 four days in", () => {
        const completedAt = new Date("2026-05-15T08:00:00Z").toISOString();
        const now = new Date("2026-05-18T08:00:00Z");
        const s = loadStamp(
            fakeStorage({
                gtmos_onboarding: JSON.stringify({ completedAt })
            }),
            now
        );
        expect(s.week).toBe(1);
        expect(s.day).toBe(4);
        expect(s.label).toBe("Week 1 · Day 4");
    });

    it("rolls into Week 2 at day 8", () => {
        const completedAt = new Date("2026-05-01T00:00:00Z").toISOString();
        const now = new Date("2026-05-08T00:00:00Z");
        const s = loadStamp(
            fakeStorage({
                gtmos_onboarding: JSON.stringify({ completedAt })
            }),
            now
        );
        expect(s.week).toBe(2);
        expect(s.day).toBe(8);
    });

    it("caps very old workspaces at Week 99 · Day 999", () => {
        const completedAt = new Date("2020-01-01T00:00:00Z").toISOString();
        const now = new Date("2026-05-18T00:00:00Z");
        const s = loadStamp(
            fakeStorage({
                gtmos_onboarding: JSON.stringify({ completedAt })
            }),
            now
        );
        expect(s.week).toBe(99);
        expect(s.day).toBe(999);
    });

    it("treats future completedAt as Day 1 (not negative)", () => {
        const completedAt = new Date("2027-01-01T00:00:00Z").toISOString();
        const now = new Date("2026-05-18T00:00:00Z");
        const s = loadStamp(
            fakeStorage({
                gtmos_onboarding: JSON.stringify({ completedAt })
            }),
            now
        );
        expect(s.day).toBe(1);
    });

    it("returns default when storage is null", () => {
        const s = loadStamp(null);
        expect(s.label).toBe("Week 1 · Day 1");
    });
});
