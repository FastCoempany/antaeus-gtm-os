import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import * as shared from "../../../../supabase/functions/seeding-enrichment/_shared";

function harness(entries: unknown[]) {
    let handle!: (req: Request) => Promise<Response>;
    const call = vi.fn(async () => ({ ok: true, text: JSON.stringify(entries), cost_usd: 0.1, search_count: 1 }));
    const code = ts.transpileModule(readFileSync(resolve("supabase/functions/seeding-enrichment/index.ts"), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
    runInNewContext(code, { exports: {}, Request, Response, Error,
        require: (name: string) => name === "./_shared.ts" ? shared : { callWithWebSearch: call },
        Deno: { serve: (fn: typeof handle) => { handle = fn; } }
    });
    return { call, request: (body: unknown = { accountNames: ["Acme", "Beta"], icp: "Sales teams" }) => handle(new Request("https://test", { method: "POST", body: JSON.stringify(body) })) };
}

describe("Deployed onboarding enrichment", () => {
    it("exposes source-backed account evidence and avoids dialect or invented buying intent", async () => {
        const h = harness([{ name: "Acme", signal: "Acme announced an expansion.", heat: 80, sourceUrl: "https://example.com/news", fits: true }]);
        const result = await (await h.request()).json();
        expect(result.accounts).toEqual([
            { name: "Acme", signal: "Acme announced an expansion.", heat: 80, sourceUrl: "https://example.com/news", cold: false },
            { name: "Beta", signal: "No recent source-backed change found", heat: 12, sourceUrl: "", cold: true }
        ]);
        expect(result.reads[0].title).toBe("Highest-priority account to review");
        expect(JSON.stringify(result)).not.toMatch(/hottest|It sees|ahead of you|fool than/);
        const prompt = h.call.mock.calls[0] as unknown as [{ system_prompt: string }];
        expect(prompt[0].system_prompt).toContain("does not prove buying intent");
    });
    it("rejects source-less off-list suggestions and preserves one entry per account", async () => {
        const h = harness([null, { name: "Extra", signal: "Fits perfectly", fits: true }, { name: "Acme", signal: "A change", sourceUrl: "https://example.com", heat: 70 }, { name: "Acme", signal: "Duplicate", sourceUrl: "https://example.com", heat: 90 }]);
        const result = await (await h.request()).json();
        expect(result.accounts).toHaveLength(2);
        expect(result.reads.some((r: { kind: string }) => r.kind === "missed")).toBe(false);
    });
    it("returns supporting source for a suggested account", async () => {
        const h = harness([{ name: "Extra", signal: "Extra reports 50 sales employees.", fits: true, sourceUrl: "https://example.com/extra" }]);
        const result = await (await h.request()).json();
        expect(result.reads).toContainEqual(expect.objectContaining({ kind: "missed", sourceUrl: "https://example.com/extra" }));
    });
    it("rejects a null request without starting research", async () => {
        const h = harness([]);
        expect((await h.request(null)).status).toBe(400);
        expect(h.call).not.toHaveBeenCalled();
    });
});
