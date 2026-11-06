/** Execute the actual Deno handler with transport doubles; no paid calls or DB writes. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import * as shared from "../../../supabase/functions/outdoors-events-discovery/_shared";

type Row = Record<string, unknown>;
const WS = "ws-a";
const event = { name: "Sales Summit", kind: "conference", where_at: "Chicago", start_date: "2027-01-15", end_date: null, tags: ["sales"], source_url: "https://example.com/event", relevance_tier: "direct", relevance_reason: "The agenda addresses sales operations." };

function harness(options: { existing?: Row[]; profiles?: Row[]; member?: boolean; invalidToken?: boolean; failInsert?: boolean; failAfter?: number; failSpend?: boolean; failLedger?: boolean; race?: boolean; events?: Row[]; spend?: number } = {}) {
    const tables: Record<string, Row[]> = {
        outdoors_events: options.existing ?? [],
        outdoors_events_runs: [],
        workspace_profile: options.profiles ?? [{ workspace_id: WS, product_category: "Sales software" }],
        workspace_members: options.member === false ? [] : [{ workspace_id: WS, user_id: "user-a" }]
    };
    const operations: Array<{ table: string; kind: string; value?: unknown }> = [];
    let raced = false;
    const sb = {
        auth: { getUser: vi.fn(async () => ({ data: { user: options.invalidToken ? null : { id: "user-a" } }, error: null })) },
        from(table: string) {
            let kind = "select";
            let payload: Row | Row[] = {};
            let single = false;
            const filters: Array<(row: Row) => boolean> = [];
            const query = {
                select() { return query; },
                eq(key: string, value: unknown) { filters.push(row => row[key] === value); return query; },
                not(key: string, _operator: string, value: unknown) { filters.push(row => row[key] !== value); return query; },
                gte() { return query; },
                maybeSingle() { single = true; return query; },
                single() { single = true; return query; },
                insert(value: Row | Row[]) { kind = "insert"; payload = value; return query; },
                update(value: Row) { kind = "update"; payload = value; return query; },
                then(resolveResult: (value: unknown) => unknown) {
                    operations.push({ table, kind, value: payload });
                    const rows = tables[table]!;
                    let data: Row[] = rows.filter(row => filters.every(f => f(row)));
                    let error: { message: string; code?: string } | null = null;
                    if (table === "outdoors_events_runs" && kind === "select") data = [{ total_cost_usd: options.spend ?? 0 }];
                    if (table === "outdoors_events_runs" && kind === "select" && options.failSpend) error = { message: "cost unavailable" };
                    if (kind === "insert") {
                        if (table === "outdoors_events" && options.failInsert && rows.length >= (options.failAfter ?? 0)) error = { message: "insert unavailable" };
                        else if (table === "outdoors_events" && options.race && !raced) {
                            raced = true;
                            rows.push({ ...payload, id: "race-event", status: "attending", notes: "operator note", tags: ["operator tag"] });
                            error = { code: "23505", message: "duplicate key" };
                        } else {
                            data = (Array.isArray(payload) ? payload : [payload]).map((row, i) => ({ ...row, id: `${table}-${rows.length + i}` }));
                            rows.push(...data);
                        }
                    } else if (kind === "update") {
                        if (table === "outdoors_events_runs" && options.failLedger) error = { message: "ledger unavailable" };
                        else data.forEach(row => Object.assign(row, payload));
                    }
                    return Promise.resolve({ data: single ? data[0] ?? null : data, error }).then(resolveResult);
                }
            };
            return query;
        }
    };
    const call = vi.fn(async () => ({ ok: true, text: JSON.stringify(options.events ?? [event]), cost_usd: 0.15, search_count: 2, error: null }));
    let handle!: (req: Request) => Promise<Response>;
    const source = readFileSync(resolve("supabase/functions/outdoors-events-discovery/index.ts"), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
    runInNewContext(compiled, {
        exports: {}, Request, Response, Error, console,
        require(name: string) {
            if (name.startsWith("https:")) return { createClient: () => sb };
            if (name === "./anthropic.ts") return { callWithWebSearch: call };
            if (name === "./_shared.ts") return shared;
            throw new Error(`Unexpected dependency ${name}`);
        },
        Deno: { env: { get: (key: string) => key === "SUPABASE_URL" ? "https://example.supabase.co" : "service-key" }, serve: (fn: typeof handle) => { handle = fn; } }
    });
    const request = (body: unknown = { action: "run_one", workspaceId: WS }, token = "user-token") => handle(new Request("https://test/discovery", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(body) }));
    return { handle, request, tables, operations, call };
}

describe("Outdoors discovery deployed handler contract", () => {
    it("allows the actual browser preflight headers and rejects non-POST methods", async () => {
        const h = harness();
        const preflight = await h.handle(new Request("https://test", { method: "OPTIONS", headers: { "access-control-request-headers": "authorization, x-antaeus-client, apikey" } }));
        expect(preflight.headers.get("access-control-allow-headers")).toContain("x-antaeus-client");
        expect(preflight.headers.get("access-control-allow-methods")).toContain("POST");
        expect((await h.handle(new Request("https://test"))).status).toBe(405);
        expect(h.call).not.toHaveBeenCalled();
    });
    it.each([null, [], {}, { action: "typo" }, { action: "run_one", workspaceId: " " }])("rejects invalid body %j without starting discovery", async body => {
        const h = harness();
        expect((await h.request(body)).status).toBe(400);
        expect(h.call).not.toHaveBeenCalled();
        expect(h.operations).toHaveLength(0);
    });
    it.each(["", "{"])("rejects empty or malformed JSON %j", async body => {
        const h = harness();
        expect((await h.handle(new Request("https://test", { method: "POST", body }))).status).toBe(400);
        expect(h.operations).toHaveLength(0);
    });
    it("checks authentication and workspace membership before service-role writes", async () => {
        const missing = harness();
        expect((await missing.handle(new Request("https://test", { method: "POST", body: JSON.stringify({ action: "run_one", workspaceId: WS }) }))).status).toBe(401);
        const invalid = harness({ invalidToken: true });
        expect((await invalid.request()).status).toBe(401);
        const denied = harness({ member: false });
        expect((await denied.request()).status).toBe(403);
        expect(denied.call).not.toHaveBeenCalled();
        expect((await missing.request({ action: "run_all" })).status).toBe(403);
    });
    it("returns the client envelope, dedupes repeated events and closes the schema's completed_at ledger", async () => {
        const h = harness({ events: [event, event] });
        const res = await h.request();
        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({ ok: true, result: { eventsWritten: 1, status: "completed", cost: 0.15 } });
        expect(h.tables.outdoors_events).toHaveLength(1);
        expect(h.tables.outdoors_events![0]).toMatchObject({ status: "watching", source_kind: "discovery_run", dedupe_key: "sales-summit__2027-01__chicago" });
        expect(h.tables.outdoors_events_runs![0]).toMatchObject({ status: "completed", total_cost_usd: 0.15, llm_call_count: 1, completed_at: expect.any(String) });
        expect(h.tables.outdoors_events_runs![0]).not.toHaveProperty("finished_at");
    });
    it("preserves operator fields and scopes refreshes to the requested workspace", async () => {
        const original = { id: "existing", workspace_id: WS, dedupe_key: shared.buildDedupeKey(event.name, event.start_date, event.where_at), status: "attending", notes: "Call Sam", name: "My event title", tags: ["VIP"] };
        const other = { ...original, id: "other", workspace_id: "ws-b" };
        const h = harness({ existing: [{ ...original }, { ...other }] });
        await h.request();
        expect(h.tables.outdoors_events![0]).toMatchObject(original);
        expect(h.tables.outdoors_events![0]).toHaveProperty("relevance_reason", event.relevance_reason);
        expect(h.tables.outdoors_events![1]).toEqual(other);
    });
    it("recovers a concurrent insert without resetting the winning row's operator state", async () => {
        const h = harness({ race: true });
        expect(await (await h.request()).json()).toMatchObject({ ok: true, result: { eventsWritten: 1 } });
        expect(h.tables.outdoors_events![0]).toMatchObject({ status: "attending", notes: "operator note", tags: ["operator tag"] });
    });
    it("keeps paid-call cost when persistence fails and returns a structured failure", async () => {
        const h = harness({ failInsert: true });
        expect(await (await h.request()).json()).toMatchObject({ ok: false, result: { status: "failed", cost: 0.15, searchCount: 2 }, error: expect.stringContaining("insert unavailable") });
        expect(h.tables.outdoors_events_runs![0]).toMatchObject({ status: "failed", total_cost_usd: 0.15, llm_call_count: 1 });
    });
    it("does not claim success when ledger writes fail or let a second ledger error escape", async () => {
        const h = harness({ failLedger: true });
        expect(await (await h.request()).json()).toMatchObject({ ok: false, error: expect.stringContaining("run ledger update failed"), result: { cost: 0.15 } });
    });
    it("records partial writes if a later event fails", async () => {
        const h = harness({ events: [event, { ...event, name: "Another event" }], failInsert: true, failAfter: 1 });
        expect(await (await h.request()).json()).toMatchObject({ ok: false, result: { eventsWritten: 1, cost: 0.15 } });
        expect(h.tables.outdoors_events_runs![0]).toMatchObject({ events_written: 1, status: "failed", total_cost_usd: 0.15 });
    });
    it("does not start a paid call if cost lookup fails", async () => {
        const h = harness({ failSpend: true });
        expect((await h.request()).status).toBe(500);
        expect(h.call).not.toHaveBeenCalled();
    });
    it("keeps weekly budget pause behavior", async () => {
        const h = harness({ spend: 3 });
        expect(await (await h.request()).json()).toMatchObject({ ok: false, result: { status: "paused", eventsWritten: 0 } });
        expect(h.call).not.toHaveBeenCalled();
    });
    it("administrative run_all selects eligible profiles and preserves aggregate response", async () => {
        const h = harness({ profiles: [{ workspace_id: WS, product_category: "Sales" }, { workspace_id: "blank", product_category: " " }, { workspace_id: "empty", product_category: null }], events: [] });
        expect(await (await h.request({ action: "run_all" }, "service-key")).json()).toMatchObject({ ok: true, workspaces: 1, totals: { eventsWritten: 0, cost: 0.15, failed: 0 }, results: [{ workspaceId: WS }] });
        expect(h.operations.some(op => op.table === "workspace_members")).toBe(false);
    });
});
