/**
 * Account enrichment seam (ADR-019, slice 4).
 *
 * The real trigger-finder is the web-search-grounded backend (the same
 * pattern as Outdoors Events discovery + the Briefing pipeline) — a
 * SEPARATE engineering track. This module is the INTERFACE it implements,
 * plus a deterministic dev stub so the wake-up is demonstrable while the
 * flow is flag-off in internal preview. When the backend lands, swap
 * `enrichAccounts` to call it; the UI is unchanged.
 *
 * Honesty note: the stub's signals are ILLUSTRATIVE, derived from the
 * account name, not real reads. They never reach a production operator —
 * the seeding flow is gated behind room_onboarding_seeding (off). The
 * "quiet — nothing fresh yet" honest-miss state is real behaviour the
 * backend will also produce on genuine coverage gaps.
 */

export interface EnrichedAccount {
    readonly name: string;
    readonly signal: string;
    readonly heat: number;
    readonly cold: boolean;
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
 * Enrich a list of account names against the ICP. Stub implementation;
 * the production backend implements the same async signature.
 */
export async function enrichAccounts(
    names: ReadonlyArray<string>,
    _icp: string
): Promise<EnrichmentResult> {
    const ranked = names.map((name) => {
        const h = hash(name);
        const heat = 20 + (h % 75); // 20–94
        const signal = STUB_SIGNALS[h % STUB_SIGNALS.length]!;
        return { name, heat, signal, cold: false };
    });
    ranked.sort((a, b) => b.heat - a.heat);
    // The lowest reads honest-quiet — coverage gaps are a feature, not a hide.
    const accounts: EnrichedAccount[] = ranked.map((a, i) =>
        i === ranked.length - 1
            ? { ...a, heat: Math.min(a.heat, 14), signal: "quiet — nothing fresh yet", cold: true }
            : a
    );

    const reads: EnrichmentRead[] = [];
    if (accounts.length > 0) {
        const top = accounts[0]!;
        reads.push({
            kind: "sees",
            title: "It sees what's happening",
            body: `${top.name} ${top.signal} — you never typed that. It's your hottest account now.`
        });
    }
    if (accounts.length > 2) {
        const odd = accounts[Math.floor(accounts.length / 2)]!;
        reads.push({
            kind: "doesnt-fit",
            title: "Harder to fool than you are",
            body: `${odd.name} may not fit who you said you sell to. Want to take a second look — or drop it?`
        });
    }
    reads.push({
        kind: "missed",
        title: "Already ahead of you",
        body: `There are companies you didn't list that fit your ICP better than some you did. The system will surface them as it watches the market.`
    });
    return { accounts, reads };
}
