import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError } from "@/lib/observability";

/**
 * Account enrichment (ADR-019, slice 4).
 *
 * `enrichAccounts` calls the `seeding-enrichment` Edge Function — the
 * real web-search-grounded trigger-finder (one search pass per company,
 * source-URL-gated, honest "quiet" when nothing's found). When the
 * function isn't reachable (not deployed, no API key, network), it falls
 * back to the deterministic dev stub so internal preview still works.
 * The flow is flag-off in production, so operators only ever see the real
 * results once the function is deployed.
 */

export interface EnrichedAccount {
    readonly name: string;
    readonly signal: string;
    readonly heat: number;
    readonly cold: boolean;
    /** Real source for the trigger (empty for quiet / stub). */
    readonly sourceUrl?: string;
}

export interface EnrichmentRead {
    readonly kind: "sees" | "doesnt-fit" | "missed";
    readonly title: string;
    readonly body: string;
}

export interface EnrichmentResult {
    readonly accounts: ReadonlyArray<EnrichedAccount>;
    readonly reads: ReadonlyArray<EnrichmentRead>;
}

// ── Real path ───────────────────────────────────────────────────────────

function parseResult(res: unknown): EnrichmentResult | null {
    if (!res || typeof res !== "object") return null;
    const r = res as { ok?: unknown; accounts?: unknown; reads?: unknown };
    if (r.ok !== true || !Array.isArray(r.accounts)) return null;
    const accounts: EnrichedAccount[] = [];
    for (const a of r.accounts) {
        if (!a || typeof a !== "object") continue;
        const o = a as Record<string, unknown>;
        if (typeof o.name !== "string") continue;
        accounts.push({
            name: o.name,
            signal: typeof o.signal === "string" ? o.signal : "",
            heat: typeof o.heat === "number" ? o.heat : 30,
            cold: o.cold === true,
            sourceUrl: typeof o.sourceUrl === "string" ? o.sourceUrl : ""
        });
    }
    const reads: EnrichmentRead[] = [];
    if (Array.isArray(r.reads)) {
        for (const rd of r.reads) {
            if (!rd || typeof rd !== "object") continue;
            const o = rd as Record<string, unknown>;
            if (o.kind === "sees" || o.kind === "doesnt-fit" || o.kind === "missed") {
                reads.push({
                    kind: o.kind,
                    title: typeof o.title === "string" ? o.title : "",
                    body: typeof o.body === "string" ? o.body : ""
                });
            }
        }
    }
    if (accounts.length === 0) return null;
    return { accounts, reads };
}

export async function enrichAccounts(
    names: ReadonlyArray<string>,
    icp: string
): Promise<EnrichmentResult> {
    if (names.length === 0) return { accounts: [], reads: [] };
    try {
        const sb = getSupabaseClient();
        const { data, error } = await sb.functions.invoke("seeding-enrichment", {
            body: { accountNames: [...names], icp }
        });
        if (!error) {
            const parsed = parseResult(data);
            if (parsed) return parsed;
        }
    } catch (err) {
        // Not deployed / no session / network — fall back to the stub.
        reportError(err, { op: "seeding.enrichAccounts.fallback" });
    }
    return enrichAccountsStub(names, icp);
}

// ── Dev stub (fallback) ──────────────────────────────────────────────────

const STUB_SIGNALS = [
    "opened a senior leadership search",
    "named a new CFO",
    "closed a funding round",
    "opened a new office",
    "hiring across RevOps",
    "shipped a major product launch",
    "announced layoffs in another division",
    "posted a compliance/audit role"
];

function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}

/**
 * Deterministic stub — illustrative signals derived from the name, NOT
 * real reads. Powers internal preview while the flow is flag-off. The
 * "quiet" honest-miss state is real behaviour the backend also produces.
 */
export async function enrichAccountsStub(
    names: ReadonlyArray<string>,
    _icp: string
): Promise<EnrichmentResult> {
    const ranked = names.map((name) => {
        const h = hash(name);
        return { name, heat: 20 + (h % 75), signal: STUB_SIGNALS[h % STUB_SIGNALS.length]!, cold: false };
    });
    ranked.sort((a, b) => b.heat - a.heat);
    const accounts: EnrichedAccount[] = ranked.map((a, i) =>
        i === ranked.length - 1
            ? { ...a, heat: Math.min(a.heat, 14), signal: "quiet — nothing fresh yet", cold: true }
            : a
    );
    const reads: EnrichmentRead[] = [];
    if (accounts.length > 0) {
        reads.push({ kind: "sees", title: "It sees what's happening", body: `${accounts[0]!.name} ${accounts[0]!.signal} — you never typed that. It's your hottest account now.` });
    }
    if (accounts.length > 2) {
        const odd = accounts[Math.floor(accounts.length / 2)]!;
        reads.push({ kind: "doesnt-fit", title: "Harder to fool than you are", body: `${odd.name} may not fit who you said you sell to. Want to take a second look — or drop it?` });
    }
    reads.push({ kind: "missed", title: "Already ahead of you", body: `There are companies you didn't list that fit your ICP better than some you did. The system surfaces them as it watches the market.` });
    return { accounts, reads };
}
