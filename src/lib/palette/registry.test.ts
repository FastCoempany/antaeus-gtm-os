import { describe, expect, it } from "vitest";
import {
    ALL_ROOMS,
    FAMILY_LABEL,
    filterRooms,
    type PaletteEntry,
    type RoomFamily
} from "./registry";

describe("ALL_ROOMS — registry shape", () => {
    it("contains all 21 canonical rooms", () => {
        // 20 rooms per canon §4 plus Briefing (canon §4.21 + ADR-006).
        // Briefing sits under system-ledger as the closest neighbor
        // until the intelligence-surface family lands formally.
        expect(ALL_ROOMS).toHaveLength(21);
    });

    it("every entry has the required fields", () => {
        for (const room of ALL_ROOMS) {
            expect(room.id).toBeTruthy();
            expect(room.kicker).toBeTruthy();
            expect(room.label).toBeTruthy();
            expect(room.href).toMatch(/^\//);
            expect(room.family).toBeTruthy();
            expect(room.description).toBeTruthy();
        }
    });

    it("every id is unique", () => {
        const ids = ALL_ROOMS.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("every href is unique", () => {
        const hrefs = ALL_ROOMS.map((r) => r.href);
        expect(new Set(hrefs).size).toBe(hrefs.length);
    });

    it("every family is one of the 7 canonical families", () => {
        const valid: ReadonlyArray<RoomFamily> = [
            "threshold",
            "command-chamber",
            "live-instrument",
            "decision-bench",
            "diagnosis-table",
            "system-ledger",
            "trust-annex"
        ];
        for (const room of ALL_ROOMS) {
            expect(valid).toContain(room.family);
        }
    });

    it("FAMILY_LABEL covers every family value used", () => {
        for (const room of ALL_ROOMS) {
            expect(FAMILY_LABEL[room.family]).toBeTruthy();
        }
    });
});

describe("filterRooms", () => {
    it("empty query returns all rooms in registry order", () => {
        const result = filterRooms("");
        expect(result).toEqual(ALL_ROOMS);
    });

    it("whitespace-only query returns all rooms", () => {
        expect(filterRooms("   ")).toEqual(ALL_ROOMS);
    });

    it("matches against room label (case-insensitive)", () => {
        const result = filterRooms("dashboard");
        expect(result.some((r) => r.id === "dashboard")).toBe(true);
    });

    it("matches against room kicker", () => {
        const result = filterRooms("DEAL WORKSPACE");
        expect(result.some((r) => r.id === "deal-workspace")).toBe(true);
    });

    it("matches against family label", () => {
        const result = filterRooms("threshold");
        const ids = result.map((r) => r.id);
        expect(ids).toContain("welcome");
        expect(ids).toContain("onboarding");
    });

    it("matches against description", () => {
        const result = filterRooms("ranked pressure");
        expect(result.some((r) => r.id === "dashboard")).toBe(true);
    });

    it("matches against keywords", () => {
        // Negotiation has "indemnification" in keywords.
        const result = filterRooms("indemnification");
        expect(result.some((r) => r.id === "negotiation")).toBe(true);
    });

    it("returns empty array when nothing matches", () => {
        expect(filterRooms("xyzzy-never-matches")).toEqual([]);
    });

    it("matches partial substrings", () => {
        // "prosp" should match Sourcing Workbench (keyword: prospect)
        const result = filterRooms("prosp");
        expect(result.some((r) => r.id === "sourcing-workbench")).toBe(true);
    });

    it("custom room list filters the same way", () => {
        const subset: ReadonlyArray<PaletteEntry> = ALL_ROOMS.slice(0, 3);
        const result = filterRooms("dashboard", subset);
        expect(result.length).toBeLessThanOrEqual(subset.length);
    });
});
