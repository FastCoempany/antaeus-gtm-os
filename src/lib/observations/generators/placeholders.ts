/**
 * Placeholder-row guards for the observation generators.
 *
 * The Phase 2.3 localStorage→Supabase migration (ADR-002) inserted a
 * single passthrough row into several noun tables to preserve the raw
 * blob — e.g. a `deals` row whose account_name is
 * "__gtmos_migration_blob__". Those rows are NOT real entities; they're
 * a frozen snapshot. The generators must not surface them as deals /
 * accounts / proofs, or the operator sees junk like "__gtmos_migration
 * _blob__ has been at discovery for 37 days."
 *
 * The heuristic: a name wrapped in double underscores (or empty after
 * trimming) is a placeholder. Real account/deal names never look like
 * that.
 */

export function isPlaceholderName(name: string | null | undefined): boolean {
    if (name === null || name === undefined) return false;
    const trimmed = name.trim();
    if (trimmed.length === 0) return false;
    // __anything__ → placeholder (migration blob + any future
    // double-underscore sentinel).
    if (/^__.*__$/.test(trimmed)) return true;
    // Direct match on the known migration sentinel, in case it ever
    // ships without the wrapping underscores.
    if (trimmed.toLowerCase().includes("gtmos_migration_blob")) return true;
    return false;
}
