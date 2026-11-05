import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DataClient } from "@/lib/data-client";
import { callFind, callResearch, RESEARCH_MESSAGES, BUDGET_NOTES, splitCompanyNames } from "./research";

vi.mock("@/lib/observability", () => ({ reportError: vi.fn(), trackEvent: vi.fn() }));

const invokeMock = vi.fn();
vi.mock("@/lib/supabase-client", () => ({
    getSupabaseClient: vi.fn(() => ({ functions: { invoke: invokeMock } }))
}));

function data(workspaceId: string | null = "ws-1"): DataClient {
    return {
        currentWorkspace: vi.fn(async () => (workspaceId ? { id: workspaceId, name: "W" } : null))
    } as unknown as DataClient;
}

const live = { sampleMode: false, data: data() } as const;

const company = {
    name: "Acme",
    domain: "acme.io",
    why_fit: "Payroll software for mid-size companies.",
    signal: { what: "Raised a Series B.", date: "2026-10-02", dated: true, source_url: "https://news.example/acme" },
    sources: ["https://acme.io", "http://not-https.example"],
    who_to_target: { role: "VP of Sales", why: "Owns hiring." },
    opening_angle: "Ask about the hiring plan.",
    confidence: "high"
};

describe("prospecting-desk research client", () => {
    beforeEach(() => invokeMock.mockReset());

    it("requires a description before calling the function", async () => {
        const r = await callFind({ description: " " }, live);
        expect(r).toMatchObject({ ok: false, error: RESEARCH_MESSAGES.needDescription });
        expect(invokeMock).not.toHaveBeenCalled();
    });

    it("sends find with the workspace, context and exclude list, and parses cited results", async () => {
        invokeMock.mockResolvedValue({ data: { ok: true, companies: [company], budget: { state: "ok" } }, error: null });
        const r = await callFind({ description: "payroll cos", icp: "mid-size", focus: "West", exclude: ["Beta"] }, live);
        expect(invokeMock).toHaveBeenCalledWith("prospecting-research", {
            body: { action: "find", description: "payroll cos", icp: "mid-size", focus: "West", exclude: ["Beta"], workspaceId: "ws-1" }
        });
        expect(r.ok).toBe(true);
        expect(r.sample).toBe(false);
        expect(r.companies[0]).toMatchObject({
            name: "Acme",
            whyFit: "Payroll software for mid-size companies.",
            signal: { what: "Raised a Series B.", date: "2026-10-02", sourceUrl: "https://news.example/acme" },
            sources: ["https://acme.io"],
            confidence: "high"
        });
        expect(r.budgetNote).toBeNull();
    });

    it("drops results without an https source even if the server sent them", async () => {
        invokeMock.mockResolvedValue({ data: { ok: true, companies: [{ ...company, sources: ["javascript:alert(1)"] }] }, error: null });
        expect((await callFind({ description: "payroll cos" }, live)).companies).toHaveLength(0);
    });

    it("turns budget states into plain notes", async () => {
        invokeMock.mockResolvedValue({ data: { ok: true, companies: [], budget: { state: "throttled" } }, error: null });
        expect((await callFind({ description: "payroll cos" }, live)).budgetNote).toBe(BUDGET_NOTES.throttled);
    });

    it.each([
        [{ data: { ok: false, status: "paused", error: "Weekly research budget reached ($4.50)" }, error: null }, RESEARCH_MESSAGES.paused],
        [{ data: null, error: { message: "FunctionsHttpError: Edge Function returned a non-2xx status code" } }, RESEARCH_MESSAGES.failed],
        [{ data: { ok: false, error: "HTTP 529: overloaded" }, error: null }, RESEARCH_MESSAGES.failed]
    ])("never shows raw errors (%j)", async (response, message) => {
        invokeMock.mockResolvedValue(response);
        const r = await callFind({ description: "payroll cos" }, live);
        expect(r.error).toBe(message);
        expect(r.error).not.toMatch(/HTTP|Edge Function|\$/);
    });

    it("asks the seller to sign in when there is no workspace", async () => {
        const r = await callFind({ description: "payroll cos" }, { sampleMode: false, data: data(null) });
        expect(r.error).toBe(RESEARCH_MESSAGES.noWorkspace);
        expect(invokeMock).not.toHaveBeenCalled();
    });

    it("validates research names and caps them at five", async () => {
        expect((await callResearch({ companies: [] }, live)).error).toBe(RESEARCH_MESSAGES.needNames);
        expect((await callResearch({ companies: ["a,b,c,d,e,f"] }, live)).error).toBe(RESEARCH_MESSAGES.tooManyNames);
        expect(invokeMock).not.toHaveBeenCalled();
    });

    it("sends research and parses briefs with suggested answers", async () => {
        invokeMock.mockResolvedValue({
            data: {
                ok: true,
                not_found: ["Nowhere"],
                companies: [{
                    name: "Acme", domain: "acme.io", what_they_do: "Payroll software.",
                    signals: [company.signal, { what: "No link", date: null, source_url: "" }],
                    fit_matches: ["Mid-size."], fit_unknowns: ["Tools unknown."],
                    who_to_target: company.who_to_target, opening_angle: "Open with the raise.",
                    draft_answers: { target_fit: "Yes.", way_in: "The raise.", outreach: "Email." },
                    sources: ["https://acme.io"]
                }]
            },
            error: null
        });
        const r = await callResearch({ companies: ["Acme, Nowhere"] }, live);
        expect(invokeMock.mock.calls[0]![1].body).toMatchObject({ action: "research", companies: ["Acme", "Nowhere"] });
        expect(r.companies[0]!.signals).toHaveLength(1);
        expect(r.companies[0]!.suggested).toEqual({ targetFit: "Yes.", wayIn: "The raise.", outreach: "Email." });
        expect(r.notFound).toEqual(["Nowhere"]);
    });

    it("splits typed company lists and dedupes them", () => {
        expect(splitCompanyNames("Vanta, Drata;\nRamp, vanta")).toEqual(["Vanta", "Drata", "Ramp"]);
    });
});
