/**
 * Watchlist Trigger matchers (B.3a).
 *
 * Pure evaluation of the five trigger types against the data the
 * pipeline has. Per Watchlist Trigger Grammar v0.1 §6. The runner
 * (Deno triggers/runner.ts) supplies the items / metric values and
 * applies the stateful rules (fire_once, cooldown, fire_once_per_window)
 * around these pure content predicates.
 *
 * What's observable today drives what's matchable: enrichment extracts
 * event_category, entities.companies, exec_move (role/company),
 * topic_tags, and user_relevance_score. Filters that need data the
 * enricher doesn't yet extract (funding stage, geography, company size)
 * are best-effort: applied when the field is present, ignored otherwise,
 * rather than silently suppressing or over-firing.
 *
 * Canonical reference + vitest-tested; Deno mirror in triggers/_shared.ts.
 */

import type {
    AdjacencyQuery,
    AggregationQuery,
    EventCategory,
    SilenceQuery,
    SingleEventQuery,
    ThresholdQuery,
    TriggerTarget
} from "./types";

/** The enriched-item fields the matchers read. */
export interface MatchableItem {
    readonly enriched_id: string;
    readonly companies: ReadonlyArray<string>;
    readonly exec_move_company: string | null;
    readonly exec_move_role: string | null;
    readonly event_category: string;
    readonly topic_tags: ReadonlyArray<string>;
    readonly user_relevance_score: number;
    /** summary + what_changed, lowercased — for qualifier / freeform checks. */
    readonly text: string;
    readonly published_date: string | null;
}

function lc(s: string): string {
    return s.trim().toLowerCase();
}

function companySet(item: MatchableItem): Set<string> {
    const set = new Set<string>();
    for (const c of item.companies) {
        const k = lc(c);
        if (k.length > 0) set.add(k);
    }
    if (item.exec_move_company) {
        const k = lc(item.exec_move_company);
        if (k.length > 0) set.add(k);
    }
    return set;
}

/** Does the item's company set satisfy the trigger's target? */
export function targetMatches(item: MatchableItem, target: TriggerTarget | undefined): boolean {
    if (!target || target.type === "any") return true;
    const companies = companySet(item);
    if (target.type === "company") {
        const names = [target.name, ...(target.aliases ?? [])].map(lc);
        return names.some((n) => n.length > 0 && companies.has(n));
    }
    if (target.type === "companies") {
        const names = target.names.map(lc).filter((n) => n.length > 0);
        if (names.length === 0) return false;
        return target.logic === "all"
            ? names.every((n) => companies.has(n))
            : names.some((n) => companies.has(n));
    }
    // category: best-effort — descriptor appears in a company name, a
    // topic tag, or the item text.
    const descriptor = lc(target.category_descriptor);
    if (descriptor.length === 0) return false;
    if ([...companies].some((c) => c.includes(descriptor))) return true;
    if (item.topic_tags.some((t) => lc(t).includes(descriptor))) return true;
    return item.text.includes(descriptor);
}

/** Does the item's event category match (with "any" wildcard)? */
export function eventCategoryMatches(item: MatchableItem, category: EventCategory): boolean {
    if (category === "any") return true;
    return lc(item.event_category) === lc(category);
}

/** Best-effort role-pattern match against the item's exec-move role. */
export function rolePatternMatches(item: MatchableItem, pattern: string | undefined): boolean {
    if (!pattern || pattern.trim().length === 0) return true;
    const role = item.exec_move_role;
    if (!role) return false;
    try {
        return new RegExp(pattern, "i").test(role);
    } catch {
        // Not a valid regex — fall back to substring.
        return lc(role).includes(lc(pattern));
    }
}

function qualifierSatisfied(item: MatchableItem, qualifier: string | undefined): boolean {
    if (!qualifier || qualifier.trim().length === 0) return true;
    // Freeform: split on non-word chars, require any token to appear in
    // the item text or topic tags. Best-effort — the enricher doesn't
    // yet emit structured qualifier metadata.
    const tokens = lc(qualifier)
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 3);
    if (tokens.length === 0) return true;
    const hay = item.text + " " + item.topic_tags.map(lc).join(" ");
    return tokens.some((t) => hay.includes(t));
}

// ─── single_event ──────────────────────────────────────────────

/** Content predicate (the runner applies fire_once / cooldown). */
export function matchSingleEvent(item: MatchableItem, q: SingleEventQuery): boolean {
    if (!eventCategoryMatches(item, q.event.category)) return false;
    if (!targetMatches(item, q.target)) return false;
    if (!qualifierSatisfied(item, q.event.qualifier)) return false;
    return true;
}

// ─── adjacency ─────────────────────────────────────────────────

export function matchAdjacency(item: MatchableItem, q: AdjacencyQuery): boolean {
    if (!targetMatches(item, q.target)) return false;
    const threshold = Number.isFinite(q.relevance_threshold) ? q.relevance_threshold : 0.6;
    if (item.user_relevance_score < threshold) return false;
    if (q.exclude_event_categories && q.exclude_event_categories.length > 0) {
        if (q.exclude_event_categories.some((c) => eventCategoryMatches(item, c))) return false;
    }
    if (q.scope) {
        if (q.scope.topics && q.scope.topics.length > 0) {
            const topics = q.scope.topics.map(lc);
            const itemTopics = item.topic_tags.map(lc);
            const hit =
                topics.some((t) => itemTopics.includes(t) || item.text.includes(t));
            if (!hit) return false;
        }
        if (q.scope.categories && q.scope.categories.length > 0) {
            if (!q.scope.categories.some((c) => eventCategoryMatches(item, c))) return false;
        }
    }
    return true;
}

// ─── aggregation ───────────────────────────────────────────────

/** Per-item predicate: does this item count toward the aggregation? */
export function aggregationItemMatches(item: MatchableItem, q: AggregationQuery): boolean {
    if (!eventCategoryMatches(item, q.event.category)) return false;
    if (!targetMatches(item, q.target)) return false;
    if (!qualifierSatisfied(item, q.event.qualifier)) return false;
    if (!rolePatternMatches(item, q.filters.role_pattern)) return false;
    if (q.filters.exclude_companies && q.filters.exclude_companies.length > 0) {
        const excluded = new Set(q.filters.exclude_companies.map(lc));
        const companies = companySet(item);
        if ([...companies].some((c) => excluded.has(c))) return false;
    }
    return true;
}

/**
 * Given the items that already passed aggregationItemMatches and fall
 * within the window, decide whether the aggregation fires. distinct on
 * enriched_id so the same item can't be double-counted.
 */
export function aggregationFires(
    matchingItems: ReadonlyArray<MatchableItem>,
    q: AggregationQuery
): { count: number; fires: boolean } {
    const ids = new Set(matchingItems.map((i) => i.enriched_id));
    const count = ids.size;
    return { count, fires: count >= q.min_count };
}

/** Is an item within `window_days` of `nowIso`? Used to prune the window. */
export function withinWindow(
    item: MatchableItem,
    windowDays: number,
    nowIso: string,
    fallbackDate?: string | null
): boolean {
    const dateStr = item.published_date ?? fallbackDate ?? null;
    if (!dateStr) return true; // undated — count it (conservative)
    const itemMs = new Date(dateStr).getTime();
    const nowMs = new Date(nowIso).getTime();
    if (!Number.isFinite(itemMs) || !Number.isFinite(nowMs)) return true;
    const ageDays = (nowMs - itemMs) / (24 * 60 * 60 * 1000);
    return ageDays <= windowDays && ageDays >= 0 - 1; // tolerate slight clock skew
}

// ─── threshold ─────────────────────────────────────────────────

/**
 * Pure threshold evaluation given the already-fetched current + baseline
 * metric values. The caller fetches them (metric sources mature in B.4).
 */
export function evaluateThreshold(
    currentValue: number,
    baselineValue: number,
    q: ThresholdQuery
): boolean {
    let observed: number;
    switch (q.metric.metric_type) {
        case "growth_pct":
        case "growth_rate":
            observed = baselineValue !== 0 ? (currentValue - baselineValue) / baselineValue : 0;
            break;
        case "ratio_vs_baseline":
            observed = baselineValue !== 0 ? currentValue / baselineValue : 0;
            break;
        case "raw_count":
        case "percentile":
        default:
            observed = currentValue;
            break;
    }
    return compare(observed, q.comparison, q.value);
}

function compare(observed: number, comparison: ThresholdQuery["comparison"], value: number): boolean {
    switch (comparison) {
        case "greater_than":
        case "crosses_above":
            return observed > value;
        case "greater_than_or_equal":
            return observed >= value;
        case "less_than":
        case "crosses_below":
            return observed < value;
        case "less_than_or_equal":
            return observed <= value;
        default:
            return false;
    }
}

// ─── silence ───────────────────────────────────────────────────

/**
 * Fire when the target has been quiet for >= silence_days. `null` means
 * no activity ever recorded — fires when silence_days > 0 (a registered
 * expectation that's never been met).
 */
export function evaluateSilence(daysSinceLastActivity: number | null, q: SilenceQuery): boolean {
    if (daysSinceLastActivity === null) return q.silence_days > 0;
    return daysSinceLastActivity >= q.silence_days;
}
