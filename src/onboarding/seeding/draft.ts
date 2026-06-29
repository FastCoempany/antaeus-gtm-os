import { computed, signal, type ReadonlySignal, type Signal } from "@preact/signals";

/**
 * The seeding draft (ADR-019) — the operator's inputs accumulated across
 * the flow, before they're written into the living rooms at the landing.
 * Module-level signals (hook-free).
 */

export interface SeedDeal {
    readonly id: string;
    readonly account: string;
    /** The trigger the enrichment found, carried for context. */
    readonly enrichedSignal?: string;
    readonly value: number;
    readonly stage: DealStage;
    readonly champion: string;
    readonly whoSigns: string;
    readonly stuck: string;
}

export type DealStage =
    | "prospect"
    | "discovery"
    | "proposal"
    | "negotiation"
    | "verbal-yes"
    | "unsure";

export const DEAL_STAGES: ReadonlyArray<{ id: DealStage; label: string }> = [
    { id: "prospect", label: "Prospecting" },
    { id: "discovery", label: "Discovery" },
    { id: "proposal", label: "Proposal" },
    { id: "negotiation", label: "Negotiation" },
    { id: "verbal-yes", label: "Verbal yes" },
    { id: "unsure", label: "Not sure yet" }
];

/**
 * The stage a seeded deal is written into the live rooms as. "Not sure
 * yet" is honest in the flow but isn't a real pipeline stage — it maps to
 * Discovery so the Deal Workspace + downstream stay valid. The operator's
 * uncertainty still shows in the in-flow diagnosis.
 */
export function roomStage(stage: DealStage): Exclude<DealStage, "unsure"> {
    return stage === "unsure" ? "discovery" : stage;
}

export interface SeedingDraft {
    icpPicks: string[];
    icpStatement: string;
    accountNames: string[];
    deals: SeedDeal[];
    annualQuota: number;
    avgDeal: number;
    winRate: number;
    cycleDays: number;
}

export const DEAL_FLOOR = 10;

/**
 * The fewest valid companies the operator can advance the accounts step
 * with. Low enough not to punish the earliest operators, high enough that
 * the wake-up has something real to shine on. Junk is dropped, not counted.
 */
export const ACCOUNT_FLOOR = 5;

function empty(): SeedingDraft {
    return {
        icpPicks: [],
        icpStatement: "",
        accountNames: [],
        deals: [],
        annualQuota: 0,
        avgDeal: 0,
        winRate: 22,
        cycleDays: 90
    };
}

export const draft: Signal<SeedingDraft> = signal(empty());

export const dealCount: ReadonlySignal<number> = computed(
    () => draft.value.deals.length
);

export function patchDraft(patch: Partial<SeedingDraft>): void {
    draft.value = { ...draft.value, ...patch };
}

export function addDeal(deal: SeedDeal): void {
    draft.value = { ...draft.value, deals: [...draft.value.deals, deal] };
}

/**
 * One parsed account candidate. The accounts step shows these back as
 * chips so the operator sees exactly what was accepted vs flagged —
 * never a freeform box they can paste junk into and click past.
 */
export interface AccountEntry {
    /** What they typed, trimmed. */
    readonly raw: string;
    /** Normalized value stored + handed to enrichment (domain lowercased). */
    readonly value: string;
    readonly kind: "domain" | "name";
    readonly valid: boolean;
    /** Why it was flagged (only when invalid). */
    readonly reason?: string;
}

function normalizeDomain(s: string): string {
    let d = s.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
    d = d.split(/[/\s?#]/)[0] ?? d;
    return d.replace(/\.+$/, "");
}

// A bare domain: at least one dot, a 2+ char TLD, no spaces.
const DOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

function classify(rawToken: string): AccountEntry {
    const raw = rawToken.trim().replace(/^["'`]+|["'`]+$/g, "");
    if (!raw) return { raw, value: "", kind: "name", valid: false, reason: "empty" };

    if (raw.includes("@")) {
        return { raw, value: raw, kind: "name", valid: false, reason: "looks like an email" };
    }

    // Domain candidate: no internal spaces and a dotted TLD.
    if (!/\s/.test(raw) && /\.[a-z]{2,}$/i.test(normalizeDomain(raw))) {
        const value = normalizeDomain(raw);
        const valid = DOMAIN_RE.test(value);
        return valid
            ? { raw, value, kind: "domain", valid: true }
            : { raw, value, kind: "domain", valid: false, reason: "not a valid web address" };
    }

    // Otherwise a company name.
    const name = raw.replace(/\s+/g, " ");
    if (name.length < 2) return { raw, value: name, kind: "name", valid: false, reason: "too short" };
    if (/^[0-9]+$/.test(name)) return { raw, value: name, kind: "name", valid: false, reason: "just a number" };
    if (name.split(" ").length > 6) {
        return { raw, value: name, kind: "name", valid: false, reason: "looks like a sentence, not a company" };
    }
    return { raw, value: name, kind: "name", valid: true };
}

/**
 * Parse a pasted block into structured, validated entries. Splits on
 * newlines, commas, AND semicolons (no formatting required), accepts a
 * domain OR a name (domains preferred — they're unambiguous for search),
 * flags junk with a reason, and drops case-insensitive dupes by value.
 */
export function parseAccountEntries(raw: string): AccountEntry[] {
    const seen = new Set<string>();
    const out: AccountEntry[] = [];
    for (const token of raw.split(/[\n,;]+/)) {
        const entry = classify(token);
        if (entry.reason === "empty") continue;
        const key = entry.value.toLowerCase();
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        out.push(entry);
    }
    return out;
}

/**
 * The accepted account values from a pasted block — valid entries only,
 * normalized. Back-compat shape for the seed writer + cloud mirror.
 */
export function parseAccountNames(raw: string): string[] {
    return parseAccountEntries(raw)
        .filter((e) => e.valid)
        .map((e) => e.value);
}

/** @internal test reset. */
export function __resetDraftForTests(): void {
    draft.value = empty();
}
