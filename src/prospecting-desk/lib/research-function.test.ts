/**
 * Executes the real prospecting-research Deno handler with transport
 * doubles (no paid calls, no DB writes) — same harness approach as
 * src/outdoors-events/lib/discovery-function.test.ts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import * as shared from "../../../supabase/functions/prospecting-research/_shared";


type Row = Record<string, unknown>;
const WS = "ws-a";
const SEARCHED = ["https://www.example.com/news/acme-raises", "https://acme.io/careers", "https://news.site/beta"];

const acme = {
    name: "Acme, Inc.",
    domain: "https://www.acme.io/",
    why_fit: "Acme sells payroll software to mid-size companies and just raised money to hire.",
    signal: { what: "Acme raised a $40M Series B.", date: "2026-10-02", source_url: "https://www.example.com/news/acme-raises" },
    sources: ["https://acme.io/careers"],
    who_to_target: { role: "VP of Sales", why: "They are building the sales team the round pays for." },
    opening_angle: "Ask how they plan to hire twenty sellers this year.",
    confidence: "high"
};

function harness(options: {
    member?: boolean;
    invalidToken?: boolean;
    spend?: number;
    failSpend?: boolean;
    failLedger?: boolean;
    callOk?: boolean;
    output?: unknown;
    resultUrls?: string[];
} = {}) {
    const tables: Record<string, Row[]> = {
        prospecting_research_runs: [],
        workspace_members: options.member === false ? [] : [{ workspace_id: WS, user_id: "user-a" }]
    };
    const sb = {
        auth: { getUser: vi.fn(async () => ({ data: { user: options.invalidToken ? null : { id: "user-a" } }, error: null })) },
        from(table: string) {
            let kind = "select";
            let payload: Row = {};
            let single = false;
            const filters: Array<(row: Row) => boolean> = [];
            const query = {
                select() { return query; },
                eq(key: string, value: unknown) { filters.push((row) => row[key] === value); return query; },
                gte() { return query; },
                maybeSingle() { single = true; return query; },
                single() { single = true; return query; },
                insert(value: Row) { kind = "insert"; payload = value; return query; },
                update(value: Row) { kind = "update"; payload = value; return query; },
                then(done: (value: unknown) => unknown) {
                    const rows = tables[table]!;
                    let data: Row[] = rows.filter((row) => filters.every((f) => f(row)));
                    let error: { message: string } | null = null;
                    if (table === "prospecting_research_runs" && kind === "select") {
                        data = [{ total_cost_usd: options.spend ?? 0 }];
                        if (options.failSpend) error = { message: "cost unavailable" };
                    } else if (kind === "insert") {
                        data = [{ ...payload, id: `run-${rows.length}` }];
                        rows.push(...data);
                    } else if (kind === "update") {
                        if (options.failLedger) error = { message: "ledger unavailable" };
                        else data.forEach((row) => Object.assign(row, payload));
                    }
                    return Promise.resolve({ data: single ? data[0] ?? null : data, error }).then(done);
                }
            };
            return query;
        }
    };
    const call = vi.fn(async (_inputs: Record<string, unknown>) => ({
        ok: options.callOk ?? true,
        text: JSON.stringify(options.output ?? [acme]),
        cost_usd: 0.21,
        search_count: 4,
        result_urls: options.resultUrls ?? SEARCHED,
        error: options.callOk === false ? "HTTP 529: overloaded" : null
    }));
    let handle!: (req: Request) => Promise<Response>;
    const source = readFileSync(resolve("supabase/functions/prospecting-research/index.ts"), "utf8");
    const compiled = ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
    }).outputText;
    runInNewContext(compiled, {
        exports: {}, Request, Response, Error, console, URL,
        require(name: string) {
            if (name.startsWith("https:")) return { createClient: () => sb };
            if (name === "./anthropic.ts") return { callWithWebSearch: call };
            if (name === "./_shared.ts") return shared;
            throw new Error(`Unexpected dependency ${name}`);
        },
        Deno: {
            env: { get: (key: string) => (key === "SUPABASE_URL" ? "https://example.supabase.co" : "service-key") },
            serve: (fn: typeof handle) => { handle = fn; }
        }
    });
    const request = (body: unknown, token: string | null = "user-token") =>
        handle(new Request("https://test/prospecting-research", {
            method: "POST",
            headers: token ? { authorization: `Bearer ${token}` } : {},
            body: JSON.stringify(body)
        }));
    return { handle, request, tables, call };
}

const FIND = { action: "find", workspaceId: WS, description: "Payroll software companies that just raised" };

describe("prospecting-research handler — request validation + auth", () => {
    it("answers the browser preflight and rejects non-POST", async () => {
        const h = harness();
        const pre = await h.handle(new Request("https://test", { method: "OPTIONS", headers: { "access-control-request-headers": "authorization, x-antaeus-client" } }));
        expect(pre.headers.get("access-control-allow-headers")).toContain("x-antaeus-client");
        expect((await h.handle(new Request("https://test"))).status).toBe(405);
    });

    it.each([
        null,
        { action: "typo", workspaceId: WS },
        { action: "find", workspaceId: " ", description: "x y z" },
        { action: "find", workspaceId: WS, description: "" },
        { action: "research", workspaceId: WS, companies: [] },
        { action: "research", workspaceId: WS, companies: ["a", "b", "c", "d", "e", "f"] }
    ])("rejects %j before any paid call", async (body) => {
        const h = harness();
        expect((await h.request(body)).status).toBe(400);
        expect(h.call).not.toHaveBeenCalled();
        expect(h.tables.prospecting_research_runs).toHaveLength(0);
    });

    it("requires a valid JWT and workspace membership", async () => {
        expect((await harness().request(FIND, null)).status).toBe(401);
        expect((await harness({ invalidToken: true }).request(FIND)).status).toBe(401);
        const denied = harness({ member: false });
        expect((await denied.request(FIND)).status).toBe(403);
        expect(denied.call).not.toHaveBeenCalled();
    });

    it("lets the service role run without a membership lookup", async () => {
        const h = harness({ member: false });
        const res = await h.request(FIND, "service-key");
        expect(await res.json()).toMatchObject({ ok: true });
    });
});

describe("prospecting-research handler — budget", () => {
    it("pauses at 150% of the weekly ceiling without calling the model or opening a run", async () => {
        const h = harness({ spend: shared.PAUSE_AT_USD });
        const body = await (await h.request(FIND)).json();
        expect(body).toMatchObject({ ok: false, status: "paused", budget: { state: "paused" } });
        expect(h.call).not.toHaveBeenCalled();
        expect(h.tables.prospecting_research_runs).toHaveLength(0);
    });

    it("throttles at the ceiling: fewer searches, still runs, ledger says throttled", async () => {
        const h = harness({ spend: shared.THROTTLE_AT_USD });
        const body = await (await h.request(FIND)).json();
        expect(body).toMatchObject({ ok: true, status: "throttled", budget: { state: "throttled" } });
        expect(h.call.mock.calls[0]![0]).toMatchObject({ max_searches: 3 });
        expect(h.tables.prospecting_research_runs![0]).toMatchObject({ status: "throttled" });
    });

    it("warns at 80% of the ceiling", async () => {
        const body = await (await harness({ spend: shared.WARN_AT_USD }).request(FIND)).json();
        expect(body).toMatchObject({ ok: true, status: "completed", budget: { state: "warn" } });
    });

    it("does not start a paid call when the cost lookup fails", async () => {
        const h = harness({ failSpend: true });
        expect((await h.request(FIND)).status).toBe(500);
        expect(h.call).not.toHaveBeenCalled();
    });
});

describe("prospecting-research handler — find", () => {
    it("returns cited companies and closes the run ledger with cost + searches", async () => {
        const h = harness();
        const body = await (await h.request(FIND)).json();
        expect(body.ok).toBe(true);
        expect(body.companies).toHaveLength(1);
        expect(body.companies[0]).toMatchObject({
            name: "Acme, Inc.",
            domain: "acme.io",
            signal: { what: "Acme raised a $40M Series B.", date: "2026-10-02", dated: true },
            confidence: "high"
        });
        expect(body.companies[0].sources).toEqual(["https://acme.io/careers", "https://www.example.com/news/acme-raises"]);
        expect(h.tables.prospecting_research_runs![0]).toMatchObject({
            action: "find", status: "completed", results_count: 1, total_cost_usd: 0.21,
            search_count: 4, llm_call_count: 1, created_by: "user-a", completed_at: expect.any(String)
        });
    });

    it("drops companies whose sources did not come from the web search", async () => {
        const invented = { ...acme, name: "Ghost Co", signal: null, sources: ["https://made-up.example/page"] };
        const body = await (await harness({ output: [invented, acme] }).request(FIND)).json();
        expect(body.companies.map((c: { name: string }) => c.name)).toEqual(["Acme, Inc."]);
    });

    it("drops an unsourced signal but keeps the company when it has another source", async () => {
        const noSigSource = { ...acme, signal: { what: "Acme hired a CRO.", date: null, source_url: "https://not-searched.example" } };
        const body = await (await harness({ output: [noSigSource] }).request(FIND)).json();
        expect(body.companies[0].signal).toBeNull();
        expect(body.companies[0].sources).toEqual(["https://acme.io/careers"]);
    });

    it("marks undated signals instead of inventing a date", async () => {
        const undated = { ...acme, signal: { ...acme.signal, date: "recently" } };
        const body = await (await harness({ output: [undated] }).request(FIND)).json();
        expect(body.companies[0].signal).toMatchObject({ date: null, dated: false });
    });

    it("dedupes companies and leaves out names already in the workspace", async () => {
        const beta = { ...acme, name: "Beta LLC", sources: ["https://news.site/beta"], signal: null };
        const dupe = { ...acme, name: "acme" };
        const h = harness({ output: [acme, dupe, beta] });
        const body = await (await h.request({ ...FIND, exclude: ["BETA"] })).json();
        expect(body.companies.map((c: { name: string }) => c.name)).toEqual(["Acme, Inc."]);
        expect(String(h.call.mock.calls[0]![0].user_prompt)).toContain("BETA");
    });

    it("voice-gates visible text: drops a company whose fit sentence is jargon, blanks a jargon angle", async () => {
        const jargon = { ...acme, why_fit: "A world-class synergy play." };
        const angle = { ...acme, name: "Beta", sources: ["https://news.site/beta"], signal: null, opening_angle: "Leverage their momentum." };
        const body = await (await harness({ output: [jargon, angle] }).request(FIND)).json();
        expect(body.companies).toHaveLength(1);
        expect(body.companies[0]).toMatchObject({ name: "Beta", opening_angle: "" });
    });

    it("records a failed model call with its cost and returns a structured failure", async () => {
        const h = harness({ callOk: false });
        const body = await (await h.request(FIND)).json();
        expect(body).toMatchObject({ ok: false, status: "failed", cost_usd: 0.21 });
        expect(h.tables.prospecting_research_runs![0]).toMatchObject({ status: "failed", total_cost_usd: 0.21 });
    });

    it("does not claim success when the ledger cannot be closed", async () => {
        const body = await (await harness({ failLedger: true }).request(FIND)).json();
        expect(body).toMatchObject({ ok: false, error: expect.stringContaining("run ledger update failed") });
    });
});

describe("prospecting-research handler — research", () => {
    const brief = {
        name: "acme inc",
        domain: "acme.io",
        what_they_do: "Acme sells payroll software to mid-size companies.",
        signals: [
            { what: "Acme raised a $40M Series B.", date: "2026-10-02", source_url: "https://www.example.com/news/acme-raises" },
            { what: "Acme opened a Denver office.", date: null, source_url: "https://invented.example/denver" }
        ],
        fit: { matches: ["Mid-size payroll company."], unknowns: ["Current sales tools are not public."] },
        who_to_target: { role: "VP of Sales", why: "Owns the hiring plan." },
        opening_angle: "Open with the Series B hiring plan.",
        draft_answers: { target_fit: "Yes, mid-size payroll.", way_in: "The Series B hiring push.", outreach: "Email the VP of Sales." },
        sources: ["https://acme.io/careers"]
    };

    it("returns a sourced brief per named company with draft answers, and lists companies with no sources", async () => {
        const h = harness({ output: [brief] });
        const body = await (await h.request({ action: "research", workspaceId: WS, companies: ["Acme", "Nowhere Co"] })).json();
        expect(body.ok).toBe(true);
        expect(body.companies).toHaveLength(1);
        const c = body.companies[0];
        expect(c.name).toBe("Acme");
        expect(c.signals).toHaveLength(1);
        expect(c.fit_unknowns).toEqual(["Current sales tools are not public."]);
        expect(c.draft_answers).toEqual({ target_fit: "Yes, mid-size payroll.", way_in: "The Series B hiring push.", outreach: "Email the VP of Sales." });
        expect(body.not_found).toEqual(["Nowhere Co"]);
        expect(h.tables.prospecting_research_runs![0]).toMatchObject({ action: "research", results_count: 1 });
    });

    it("ignores companies the seller did not ask about", async () => {
        const body = await (await harness({ output: [{ ...brief, name: "Other Corp" }] }).request({ action: "research", workspaceId: WS, companies: ["Acme"] })).json();
        expect(body.companies).toHaveLength(0);
        expect(body.not_found).toEqual(["Acme"]);
    });
});

describe("prospecting-research shared helpers", () => {
    it("normalizes company names across case, punctuation and legal suffixes", () => {
        expect(shared.normalizeCompanyName("Vanta, Inc.")).toBe("vanta");
        expect(shared.normalizeCompanyName("The Home Depot")).toBe("home depot");
        expect(shared.normalizeCompanyName("AT&T Corp")).toBe("at and t");
    });

    it("only treats https URLs as verifiable sources", () => {
        const allowed = shared.buildAllowedUrlSet(["http://plain.example/a", "https://ok.example/a/"]);
        expect(shared.verifiedUrl("https://www.ok.example/a", allowed)).toBe("https://www.ok.example/a");
        expect(shared.verifiedUrl("http://plain.example/a", allowed)).toBeNull();
    });

    it("collects URLs from web search results and text citations", () => {
        const urls = shared.collectResultUrls([
            { type: "web_search_tool_result", content: [{ type: "web_search_result", url: "https://a.example" }] },
            { type: "text", text: "x", citations: [{ type: "web_search_result_location", url: "https://b.example" }] },
            { type: "text", text: "no citations" }
        ]);
        expect(urls).toEqual(["https://a.example", "https://b.example"]);
    });

    it("maps spend to budget states", () => {
        expect(shared.budgetStateFor(0)).toBe("ok");
        expect(shared.budgetStateFor(shared.WARN_AT_USD)).toBe("warn");
        expect(shared.budgetStateFor(shared.THROTTLE_AT_USD)).toBe("throttled");
        expect(shared.budgetStateFor(shared.PAUSE_AT_USD)).toBe("paused");
    });
});
