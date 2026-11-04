/**
 * seeding-enrichment Edge Function (ADR-019, slice 4 backend).
 *
 * The real account trigger-finder for the onboarding seeding flow. Takes
 * a list of account names + the operator's ICP, runs grounded web
 * searches (one pass, the model issues searches per company), and returns
 * each account with the single most relevant *recent* trigger — with a
 * real source URL, an account-priority assessment, and supporting explanations. By
 * construction: a signal without a real https source is dropped to the
 * "No recent source-backed change found" state; nothing is fabricated.
 *
 * Replaces the client-side dev stub in src/onboarding/seeding/lib/
 * enrichment.ts. Same response shape, so the UI is unchanged.
 *
 * Deploy: supabase functions deploy seeding-enrichment --no-verify-jwt
 * Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

// Deno entrypoint; validate with deno check before deployment.

import { callWithWebSearch } from "./anthropic.ts";
import { corsHeaders, extractJsonArray, json } from "./_shared.ts";

const MAX_ACCOUNTS = 12;

interface RawEntry {
    name?: unknown;
    signal?: unknown;
    sourceUrl?: unknown;
    heat?: unknown;
    fits?: unknown;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v.trim() : "";
}
function isHttps(u: string): boolean {
    return /^https:\/\//i.test(u);
}
function clampHeat(v: unknown): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return 30;
    return Math.max(0, Math.min(100, Math.round(n)));
}

function buildSystem(): string {
    return [
        "You are a B2B go-to-market analyst. For each company the operator names, search the live web for the most relevant RECENT reported change for the operator's ICP. A change can justify review; it does not prove buying intent.",
        "A relevant trigger is something like: a new executive hire (CFO, CRO, GC, VP RevOps), a funding round, an acquisition, an expansion, a hiring surge in the buyer's function, a compliance/audit event, a product launch, layoffs.",
        "Rules you must follow:",
        "- Only report a trigger you can back with a real, working https source URL. If you can't find one, return an empty signal and sourceUrl for that company.",
        "- Never invent a trigger, a date, or a URL. State when no recent source-backed change was found; do not infer that no change occurred.",
        "- Prefer the most recent trigger. One per company.",
        "- Judge fit against the ICP: set fits=false if the company clearly doesn't match (wrong size, wrong space).",
        "Return ONLY a JSON array, one object per company, in this exact shape:",
        '[{"name":"<exact company name>","signal":"<one complete factual sentence, or empty if no evidence>","sourceUrl":"<https url or empty>","heat":<0-100>,"fits":<true|false>}]',
        "heat: an assessed account-priority score from 0 to 100 based on the recency and ICP relevance of the reported change. It is not a probability of purchase. Accounts without source-backed changes score low."
    ].join("\n");
}

function buildUser(names: string[], icp: string): string {
    return [
        `Operator's ICP: ${icp || "(not specified)"}`,
        "",
        "Companies to research:",
        ...names.map((n) => `- ${n}`),
        "",
        "Also suggest ONE company NOT in this list that fits the ICP and is worth watching, as a final array entry with name set and a short reason in signal, heat, and fits=true — only if a source supports its fit. Include the working https sourceUrl and distinguish the observed facts from your fit assessment."
    ].join("\n");
}

function buildReads(
    accounts: Array<{ name: string; signal: string; heat: number; cold: boolean; fits: boolean; sourceUrl: string }>,
    suggested: { name: string; reason: string; sourceUrl: string } | null
): Array<{ kind: string; title: string; body: string; sourceUrl?: string }> {
    const reads: Array<{ kind: string; title: string; body: string; sourceUrl?: string }> = [];
    const hot = accounts.find((a) => !a.cold && a.signal);
    if (hot) {
        reads.push({
            kind: "sees",
            title: "Highest-priority account to review",
            body: `${hot.name}: ${hot.signal} This account ranks first among the supplied accounts based on the assessed recency and relevance of its reported change. Verify the source before acting.`
        });
    }
    const misfit = accounts.find((a) => a.fits === false);
    if (misfit) {
        reads.push({
            kind: "doesnt-fit",
            title: "Review ICP fit",
            body: `${misfit.name} may not match your stated ICP. Review its size, industry, and buyer roles before keeping it on your target list.`
        });
    }
    if (suggested) {
        reads.push({
            kind: "missed",
            title: "Additional account to assess",
            body: `${suggested.name}: ${suggested.reason} Review its fit before adding it to your target list.`,
            sourceUrl: suggested.sourceUrl
        });
    }
    return reads;
}

Deno.serve(async (req: Request): Promise<Response> => {
    const cors = corsHeaders(req);
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);

    let body: { accountNames?: unknown; icp?: unknown };
    try {
        body = await req.json();
    } catch {
        return json({ ok: false, error: "Invalid JSON body" }, 400, cors);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ ok: false, error: "A JSON object is required" }, 400, cors);
    }
    const names = Array.isArray(body.accountNames)
        ? body.accountNames.map(asString).filter((s) => s.length > 0).slice(0, MAX_ACCOUNTS)
        : [];
    const icp = asString(body.icp);
    if (names.length === 0) {
        return json({ ok: true, accounts: [], reads: [], cost_usd: 0, search_count: 0, error: null }, 200, cors);
    }

    const result = await callWithWebSearch({
        model: "sonnet_4_6",
        system_prompt: buildSystem(),
        user_prompt: buildUser(names, icp),
        max_tokens: 4096,
        max_searches: Math.min(names.length, 10)
    });

    if (!result.ok) {
        return json({ ok: false, error: result.error ?? "Enrichment failed", accounts: [], reads: [] }, 502, cors);
    }

    const parsed = extractJsonArray(result.text);
    const entries: RawEntry[] = Array.isArray(parsed) ? (parsed as RawEntry[]) : [];

    const nameSet = new Set(names.map((n) => n.toLowerCase()));
    const accounts: Array<{ name: string; signal: string; heat: number; cold: boolean; fits: boolean; sourceUrl: string }> = [];
    let suggested: { name: string; reason: string; sourceUrl: string } | null = null;

    for (const e of entries) {
        if (!e || typeof e !== "object") continue;
        const name = asString(e.name);
        if (!name || accounts.some((a) => a.name.toLowerCase() === name.toLowerCase())) continue;
        const signal = asString(e.signal);
        const url = asString(e.sourceUrl);
        const fits = e.fits !== false;
        const heat = clampHeat(e.heat);

        // A suggested off-list company → the "missed" read, not an account row.
        if (!nameSet.has(name.toLowerCase())) {
            if (!suggested && signal && isHttps(url) && fits) suggested = { name, reason: signal, sourceUrl: url };
            continue;
        }
        // Honest gate: a signal without a real source is not a signal.
        const hasReal = signal.length > 0 && isHttps(url);
        accounts.push(
            hasReal
                ? { name, signal, heat, cold: false, fits, sourceUrl: url }
                : { name, signal: "No recent source-backed change found", heat: Math.min(heat, 14), cold: true, fits, sourceUrl: "" }
        );
    }

    // Any named company the model skipped → quiet, so the list is complete.
    for (const n of names) {
        if (!accounts.some((a) => a.name.toLowerCase() === n.toLowerCase())) {
            accounts.push({ name: n, signal: "No recent source-backed change found", heat: 12, cold: true, fits: true, sourceUrl: "" });
        }
    }
    accounts.sort((a, b) => b.heat - a.heat);

    return json(
        {
            ok: true,
            accounts: accounts.map(({ name, signal, heat, cold, sourceUrl }) => ({ name, signal, heat, cold, sourceUrl })),
            reads: buildReads(accounts, suggested),
            cost_usd: result.cost_usd,
            search_count: result.search_count,
            error: null
        },
        200,
        cors
    );
});
