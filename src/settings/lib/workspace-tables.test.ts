import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
    EXCLUDED_TABLES,
    sectionOrder,
    tablesToDelete,
    tablesToRestore,
    WORKSPACE_TABLES
} from "./workspace-tables";

const ROOT = resolve(__dirname, "../../..");

/** public-schema tables in database.types.ts → does the Row carry workspace_id? */
function typedTables(): Map<string, boolean> {
    const src = readFileSync(join(ROOT, "src/lib/database.types.ts"), "utf8");
    const pub = src.indexOf("\n  public: {");
    const start = src.indexOf("Tables: {", pub);
    const end = src.indexOf("\n    Views: {", start);
    const block = src.slice(start, end);
    const out = new Map<string, boolean>();
    const re = /\n {6}(\w+): \{\n(?: {8}\/\/[^\n]*\n)* {8}Row: \{\n([\s\S]*?)\n {8}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block))) {
        out.set(m[1]!, /\n? {10}workspace_id\??:/.test("\n" + m[2]!));
    }
    return out;
}

function migrationSql(): string {
    const dir = join(ROOT, "supabase/migrations");
    return readdirSync(dir)
        .filter((f) => f.endsWith(".sql"))
        .sort()
        .map((f) => readFileSync(join(dir, f), "utf8"))
        .join("\n");
}

/** Tables created by migrations (the legacy noun tables predate them). */
function migrationTables(): Set<string> {
    const names = new Set<string>();
    const re = /create table (?:if not exists )?(?:public\.)?(\w+)/gi;
    let m: RegExpExecArray | null;
    const sql = migrationSql();
    while ((m = re.exec(sql))) names.add(m[1]!);
    return names;
}

/** The table list inside the latest delete_workspace_data definition. */
function rpcTables(): string[] {
    const sql = migrationSql();
    const at = sql.lastIndexOf("create or replace function public.delete_workspace_data");
    expect(at).toBeGreaterThan(-1);
    const arr = sql.slice(at).match(/target_tables text\[\] := array\[([\s\S]*?)\];/);
    expect(arr).not.toBeNull();
    return [...arr![1]!.matchAll(/'(\w+)'/g)].map((x) => x[1]!);
}

const registered = new Set(WORKSPACE_TABLES.map((t) => t.table));
const excluded = new Set(Object.keys(EXCLUDED_TABLES));

describe("workspace table registry", () => {
    it("parses database.types.ts (sanity)", () => {
        const typed = typedTables();
        expect(typed.size).toBeGreaterThan(30);
        expect(typed.get("deals")).toBe(true);
        expect(typed.get("waitlist_signups")).toBe(false);
    });

    it("covers every typed table that has a workspace_id column", () => {
        const missing = [...typedTables()]
            .filter(([name, hasWs]) => hasWs && !registered.has(name) && !excluded.has(name))
            .map(([name]) => name);
        expect(missing).toEqual([]);
    });

    it("covers every table any migration creates", () => {
        const missing = [...migrationTables()].filter(
            (name) => !registered.has(name) && !excluded.has(name)
        );
        expect(missing).toEqual([]);
    });

    it("every typed table is either registered or excluded with a reason", () => {
        const unaccounted = [...typedTables().keys()].filter(
            (name) => !registered.has(name) && !excluded.has(name)
        );
        expect(unaccounted).toEqual([]);
        for (const reason of Object.values(EXCLUDED_TABLES)) {
            expect(reason.length).toBeGreaterThan(10);
        }
    });

    it("has no duplicates and no table both registered and excluded", () => {
        expect(registered.size).toBe(WORKSPACE_TABLES.length);
        for (const t of excluded) expect(registered.has(t)).toBe(false);
    });

    it("the server delete removes exactly the registry's delete set", () => {
        const fromRpc = rpcTables();
        expect(new Set(fromRpc)).toEqual(new Set(tablesToDelete().map((t) => t.table)));
        expect(fromRpc).not.toContain("profiles");
        expect(fromRpc).not.toContain("workspaces");
        expect(fromRpc).not.toContain("workspace_members");
    });

    it("the server delete runs children before parents", () => {
        const order = rpcTables();
        const before = (a: string, b: string) => expect(order.indexOf(a)).toBeLessThan(order.indexOf(b));
        before("signals", "signal_console_accounts");
        before("proofs", "deals");
        before("advisor_deployments", "deals");
        before("outdoors_events", "outdoors_events_runs");
        before("briefing_raw_items", "briefing_runs");
        before("briefing_trigger_fires", "briefing_watchlist_triggers");
    });

    it("restores parents before children", () => {
        const order = tablesToRestore().map((t) => t.table);
        const before = (a: string, b: string) => expect(order.indexOf(a)).toBeLessThan(order.indexOf(b));
        before("signal_console_accounts", "signals");
        before("deals", "proofs");
        before("deals", "advisor_deployments");
        before("briefing_runs", "briefing_raw_items");
        before("briefing_patterns", "briefing_audit_envelopes");
    });

    it("matches the RLS facts: member-deletable tables have a member delete policy", () => {
        const sql = migrationSql();
        const legacyLoopTables = [
            "icps",
            "deals",
            "sequences",
            "signal_console_accounts",
            "discovery_frameworks",
            "discovery_call_logs",
            "pipeline_settings",
            "studio_artifacts"
        ];
        for (const t of WORKSPACE_TABLES.filter((x) => x.memberDelete)) {
            if (legacyLoopTables.includes(t.table)) continue;
            const policy = new RegExp(`on public\\.${t.table}\\s+for delete`, "i");
            expect(policy.test(sql), `${t.table} should have a delete policy`).toBe(true);
        }
    });

    it("every section has a plain name and every table a label", () => {
        expect(sectionOrder().length).toBeGreaterThan(5);
        for (const t of WORKSPACE_TABLES) {
            expect(t.label.trim().length).toBeGreaterThan(0);
            expect(t.label).not.toMatch(/_/);
            expect(t.section).not.toMatch(/_/);
        }
    });
});
