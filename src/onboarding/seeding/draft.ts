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
    | "verbal-yes";

export const DEAL_STAGES: ReadonlyArray<{ id: DealStage; label: string }> = [
    { id: "prospect", label: "Prospecting" },
    { id: "discovery", label: "Discovery" },
    { id: "proposal", label: "Proposal" },
    { id: "negotiation", label: "Negotiation" },
    { id: "verbal-yes", label: "Verbal yes" }
];

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
 * Parse a pasted block of account names — one per line, trimmed, blanks
 * and dupes (case-insensitive) dropped.
 */
export function parseAccountNames(raw: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const line of raw.split(/\r?\n/)) {
        const name = line.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(name);
    }
    return out;
}

/** @internal test reset. */
export function __resetDraftForTests(): void {
    draft.value = empty();
}
