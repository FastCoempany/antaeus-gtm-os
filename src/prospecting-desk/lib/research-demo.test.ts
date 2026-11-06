/**
 * The demo's sample research must come only from the demo dataset:
 * no invented companies, facts, or URLs. These tests load the real seed
 * files and check every sample field against them.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { SAMPLE_COMPANIES, detectDemoBook, type DemoBook } from "./research-demo";
import { callFind, callResearch } from "./research";

vi.mock("@/lib/observability", () => ({ reportError: vi.fn(), trackEvent: vi.fn() }));

interface SeedSignal { headline: string; detail: string; why_it_matters: string; source_name: string; published_date: string }
interface SeedAccount { name: string; domain: string; industry: string; employees: string; signals: SeedSignal[] }
interface SeedBook {
    accounts: SeedAccount[];
    deals: Array<{ accountName: string }>;
    territory: { approaches: Array<{ description: string }> };
    sourcing: { prospects: Array<{ name: string }>; personaMaps: Array<{ title: string; notes: string }> };
}

function loadSeed(): Record<DemoBook, SeedBook> {
    const window: Record<string, unknown> = {};
    for (const f of ["js/demo-seed-data-ent.js", "js/demo-seed-data-smb.js"]) {
        runInNewContext(readFileSync(resolve(f), "utf8"), { window, Date });
    }
    return (window as { __LUCA_SEED__: Record<DemoBook, SeedBook> }).__LUCA_SEED__;
}

const SEED = loadSeed();
const NOW = Date.now();
const allSeedDomains = new Set(
    (["ent", "smb"] as const).flatMap((b) => SEED[b].accounts.map((a) => a.domain))
);

describe("demo sample research is built only from the demo dataset", () => {
    it.each(SAMPLE_COMPANIES.map((c) => [c.book, c.name, c] as const))("%s · %s matches its seeded account", (book, _name, c) => {
        const seed = SEED[book];
        const acct = seed.accounts.find((a) => a.name === c.name);
        expect(acct, `${c.name} is a seeded account`).toBeDefined();
        expect(acct!.domain).toBe(c.domain);
        expect(acct!.industry).toBe(c.industry);
        expect(acct!.employees).toBe(c.employees);
        expect(acct!.signals.map((s) => s.why_it_matters)).toContain(c.why);
        for (const s of c.signals) {
            const match = acct!.signals.find((x) => x.headline === s.headline);
            expect(match, s.headline).toBeDefined();
            expect(match!.detail).toBe(s.detail);
            expect(match!.source_name).toBe(s.source);
            const ago = Math.round((NOW - new Date(match!.published_date).getTime()) / 86_400_000);
            expect(Math.abs(ago - s.agoDays)).toBeLessThanOrEqual(1);
        }
        expect(seed.sourcing.personaMaps.some((m) => m.title === c.personaTitle && m.notes === c.personaNote)).toBe(true);
        expect(seed.territory.approaches.map((a) => a.description)).toContain(c.approach);
    });

    it("suggests companies that are not already open deals or seeded prospects", () => {
        for (const c of SAMPLE_COMPANIES) {
            const seed = SEED[c.book];
            expect(seed.deals.map((d) => d.accountName)).not.toContain(c.name);
            expect(seed.sourcing.prospects.map((p) => p.name)).not.toContain(c.name);
        }
    });

    it("every URL in sample find + research output is a seeded company domain, and no signal carries a link", async () => {
        const urls: string[] = [];
        const signals: Array<{ sourceUrl: string | null; sourceName: string | null }> = [];
        for (const book of ["ent", "smb"] as const) {
            localStorage.setItem("gtmos_demo_seed_meta", JSON.stringify({ mode: book }));
            const found = await callFind({ description: "anything" }, { sampleMode: true, now: NOW });
            expect(found.sample).toBe(true);
            expect(found.companies.length).toBeGreaterThan(0);
            for (const f of found.companies) {
                urls.push(...f.sources);
                if (f.signal) signals.push(f.signal);
            }
        }
        const brief = await callResearch({ companies: SAMPLE_COMPANIES.map((c) => c.name).slice(0, 5) }, { sampleMode: true, now: NOW });
        expect(brief.companies).toHaveLength(5);
        for (const r of brief.companies) {
            urls.push(...r.sources);
            signals.push(...r.signals);
            expect(r.suggested.targetFit && r.suggested.wayIn && r.suggested.outreach).toBeTruthy();
        }
        expect(urls.length).toBeGreaterThan(0);
        for (const u of urls) {
            const m = u.match(/^https:\/\/([^/]+)$/);
            expect(m, u).not.toBeNull();
            expect(allSeedDomains.has(m![1]!), u).toBe(true);
        }
        for (const s of signals) {
            expect(s.sourceUrl).toBeNull();
            expect(s.sourceName).toBeTruthy();
        }
        localStorage.removeItem("gtmos_demo_seed_meta");
    });

    it("picks the book from the seed meta and leaves out companies already in the workspace", async () => {
        localStorage.setItem("gtmos_demo_seed_meta", JSON.stringify({ mode: "smb" }));
        expect(detectDemoBook()).toBe("smb");
        const r = await callFind({ description: "x y z", exclude: ["duolingo"] }, { sampleMode: true });
        expect(r.companies.map((c) => c.name)).not.toContain("Duolingo");
        expect(r.companies.every((c) => SAMPLE_COMPANIES.find((s) => s.name === c.name)?.book === "smb")).toBe(true);
        localStorage.removeItem("gtmos_demo_seed_meta");
        expect(detectDemoBook()).toBe("ent");
    });

    it("reports names the demo has no sample for instead of inventing one", async () => {
        const r = await callResearch({ companies: ["Workday", "Totally Unknown Co"] }, { sampleMode: true });
        expect(r.companies.map((c) => c.name)).toEqual(["Workday"]);
        expect(r.notFound).toEqual(["Totally Unknown Co"]);
    });
});
