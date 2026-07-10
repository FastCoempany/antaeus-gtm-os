import { describe, it, expect } from "vitest";
import { priorForSection, readAcv } from "./priors";
import { SECTION_IDS } from "./types";

const BANNED = [
    /\bproof\b/i,
    /\bearned\b/i,
    /\bverdict\b/i,
    /\bunlock/i,
    /\bcast\b/i,
    /\bkill switch\b/i,
    /\bdimension\b/i
];

describe("priorForSection", () => {
    it("every section has a prior at every band", () => {
        for (const acv of [10_000, 50_000, 120_000, 300_000]) {
            for (const id of SECTION_IDS) {
                const p = priorForSection(id, acv);
                expect(p, `${id} @ ${acv}`).not.toBeNull();
                expect(p!.body.length).toBeGreaterThanOrEqual(2);
                expect(p!.note.length).toBeGreaterThan(20);
            }
        }
    });

    it("weaves the band's own benchmark numbers", () => {
        // Enterprise: win 15%, m2o 30%.
        const hits = priorForSection("who_hits", 120_000)!;
        expect(hits.body.join(" ")).toContain("15%");
        const leaks = priorForSection("won_and_leaked", 120_000)!;
        expect(leaks.body.join(" ")).toContain("30%");
        // SMB: win 25%.
        expect(priorForSection("who_hits", 10_000)!.body.join(" ")).toContain("25%");
    });

    it("the note names the deal size and never claims to be the operator's own result", () => {
        const p = priorForSection("why_we_win", 80_000)!;
        expect(p.note).toContain("$80k");
        expect(p.note.toLowerCase()).toContain("how it usually goes");
        expect(p.note.toLowerCase()).toContain("your own deals");
    });

    it("speaks the plain voice — no banned vocabulary", () => {
        for (const id of SECTION_IDS) {
            const p = priorForSection(id, 50_000)!;
            const text = `${p.note} ${p.body.join(" ")}`;
            for (const rx of BANNED) {
                expect(text, `${id}: ${rx}`).not.toMatch(rx);
            }
        }
    });
});

describe("readAcv", () => {
    const store = (data: Record<string, string>) => ({
        getItem: (k: string) => data[k] ?? null
    });

    it("reads the quota acv", () => {
        expect(readAcv(store({ gtmos_qw_inputs: JSON.stringify({ acv: 120_000 }) }))).toBe(120_000);
    });

    it("defaults to mid-market on empty or malformed storage", () => {
        expect(readAcv(store({}))).toBe(50_000);
        expect(readAcv(store({ gtmos_qw_inputs: "{nope" }))).toBe(50_000);
        expect(readAcv(store({ gtmos_qw_inputs: JSON.stringify({ acv: -3 }) }))).toBe(50_000);
    });
});
