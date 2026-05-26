/**
 * Briefing seed derivation (ADR-007, PR 5).
 *
 * The pure transform at the heart of Stage 3.0 hydration: takes the
 * raw Supabase rows the Briefing reads (the commercial profile, the
 * ICP rows, the competitor-flagged accounts) and derives the seed the
 * pipeline acts on — the ICP body, the commercial profile, and the
 * watchlist of companies + category terms that drive the
 * watchlist-specific source queries (HN search, Wikipedia tracking,
 * GitHub repos, page diffs).
 *
 * This is the canonical reference + vitest-tested. The Edge Function
 * does the Supabase reads (Deno, can't run in vitest) and calls a
 * verbatim mirror of this transform. Same Node/Deno split as the
 * parsers + LLM layer + cluster core.
 *
 * Single source of truth (ADR-007): nothing here invents data. The
 * commercial profile comes from workspace_profile (ICP Studio),
 * competitors from accounts flagged competitor (Signal Console),
 * industries + buyers from the ICP rows. The Briefing only reads.
 */

export interface ProfileRow {
    readonly product_category: string | null;
    readonly what_we_sell: string | null;
    readonly value_prop: string | null;
}

export interface IcpRow {
    readonly industry: string | null;
    readonly primary_buyer: string | null;
    readonly statement: string | null;
    readonly company_size: string | null;
    readonly geography: string | null;
    readonly pain_point: string | null;
}

export interface CommercialProfileSeed {
    readonly product_category: string | null;
    readonly what_we_sell: string | null;
    readonly value_prop: string | null;
}

export interface IcpBodySeed {
    readonly icp_summary: string;
    readonly target_industries: ReadonlyArray<string>;
    readonly decision_maker_titles: ReadonlyArray<string>;
    readonly geographies: ReadonlyArray<string>;
    readonly pains: ReadonlyArray<string>;
}

export interface BriefingSeed {
    /** workspace_profile content; null when no row / all-empty. */
    readonly commercial_profile: CommercialProfileSeed | null;
    /** Aggregated ICP body; null when no ICP rows have content. */
    readonly icp: IcpBodySeed | null;
    /** Competitor names + ICP industries, deduped — drives source queries. */
    readonly watchlist_companies: ReadonlyArray<string>;
    /** Health flags for the modules_read diagnostic slice. */
    readonly icp_health: "ok" | "uninitialized";
    readonly profile_health: "ok" | "uninitialized";
}

export interface SeedInput {
    readonly profile: ProfileRow | null;
    readonly icpRows: ReadonlyArray<IcpRow>;
    readonly competitorNames: ReadonlyArray<string>;
}

function clean(value: string | null | undefined): string | null {
    if (typeof value !== "string") return null;
    const t = value.trim();
    return t.length > 0 ? t : null;
}

function uniqueNonEmpty(values: ReadonlyArray<string | null>): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of values) {
        const c = clean(v);
        if (c === null) continue;
        const key = c.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(c);
    }
    return out;
}

export function deriveBriefingSeed(input: SeedInput): BriefingSeed {
    // ── Commercial profile ──
    const pc = clean(input.profile?.product_category);
    const ws = clean(input.profile?.what_we_sell);
    const vp = clean(input.profile?.value_prop);
    const hasProfile = pc !== null || ws !== null || vp !== null;
    const commercial_profile: CommercialProfileSeed | null = hasProfile
        ? { product_category: pc, what_we_sell: ws, value_prop: vp }
        : null;

    // ── ICP body (aggregate across rows) ──
    const industries = uniqueNonEmpty(input.icpRows.map((r) => r.industry));
    const buyers = uniqueNonEmpty(input.icpRows.map((r) => r.primary_buyer));
    const geographies = uniqueNonEmpty(input.icpRows.map((r) => r.geography));
    const pains = uniqueNonEmpty(input.icpRows.map((r) => r.pain_point));
    // Prefer an explicit statement for the summary; else synthesize a
    // terse one from the first row's industry + buyer.
    const statements = uniqueNonEmpty(input.icpRows.map((r) => r.statement));
    const icpSummary =
        statements[0] ??
        (industries.length > 0
            ? `B2B ${industries[0]}${buyers.length > 0 ? ` selling to ${buyers[0]}` : ""}`
            : "");
    const hasIcp =
        industries.length > 0 ||
        buyers.length > 0 ||
        icpSummary.length > 0;
    const icp: IcpBodySeed | null = hasIcp
        ? {
              icp_summary: icpSummary,
              target_industries: industries,
              decision_maker_titles: buyers,
              geographies,
              pains
          }
        : null;

    // ── Watchlist: competitors + category terms (industries) ──
    const watchlist_companies = uniqueNonEmpty([
        ...input.competitorNames,
        ...industries
    ]);

    return {
        commercial_profile,
        icp,
        watchlist_companies,
        icp_health: hasIcp ? "ok" : "uninitialized",
        profile_health: hasProfile ? "ok" : "uninitialized"
    };
}
