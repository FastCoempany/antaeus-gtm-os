/**
 * Periphery Detection scoring (B.4a).
 *
 * Two pure functions + one combiner. Co-occurrence is the primary
 * signal: if an off-watchlist entity shows up in N items alongside an
 * entity you already watch, it probably belongs on your radar.
 * Vocabulary overlap is the supporting signal: if its items talk about
 * the same pain points and topics as your watched set's items, that
 * tightens the case.
 *
 * Precision over recall (spec §B.4 risk note): the default thresholds
 * target 0-2 candidates per week, not 5+. If you loosen them, the
 * surface fires more often, the operator dismisses more, and trust
 * erodes. The Deno mirror in supabase/functions/briefing-pipeline/
 * periphery/_shared.ts keeps a verbatim copy.
 */

import {
    type CandidateScore,
    DEFAULT_SCORING_CONFIG,
    type ScoringConfig,
    type ScoringItem
} from "./types";

/** Lowercase + trim, so "Deel Inc" and "deel inc " collide. */
export function normalizeEntity(name: string): string {
    return name.trim().toLowerCase();
}

interface CoOccurrenceEntry {
    count: number;
    aliases: Set<string>;
    supporting_item_ids: Set<string>;
}

/**
 * Count items where each off-watchlist entity appears alongside any
 * watched entity. Returns a map keyed by normalized entity name.
 */
export function computeCoOccurrence(
    items: ReadonlyArray<ScoringItem>,
    watched: ReadonlySet<string>
): Map<string, CoOccurrenceEntry> {
    const map = new Map<string, CoOccurrenceEntry>();
    for (const item of items) {
        const present = item.entities.map((e) => ({ raw: e, norm: normalizeEntity(e) }));
        const hasWatched = present.some((p) => watched.has(p.norm));
        if (!hasWatched) continue;
        for (const { raw, norm } of present) {
            if (norm.length === 0 || watched.has(norm)) continue;
            let entry = map.get(norm);
            if (!entry) {
                entry = { count: 0, aliases: new Set(), supporting_item_ids: new Set() };
                map.set(norm, entry);
            }
            entry.count += 1;
            entry.aliases.add(raw);
            entry.supporting_item_ids.add(item.id);
        }
    }
    return map;
}

interface VocabOverlapEntry {
    overlap: number;
    supporting_item_ids: Set<string>;
}

/**
 * For each off-watchlist entity, count the pain+topic tags on its items
 * that also appeared on watched-entity items. The watched-tag set is
 * computed once from items that mention a watched entity, then each
 * non-watched-entity item contributes its overlap with that set.
 */
export function computeVocabOverlap(
    items: ReadonlyArray<ScoringItem>,
    watched: ReadonlySet<string>
): Map<string, VocabOverlapEntry> {
    const watchedTags = new Set<string>();
    for (const item of items) {
        const present = item.entities.map(normalizeEntity);
        if (present.some((e) => watched.has(e))) {
            for (const t of item.pain_tags) watchedTags.add(t);
            for (const t of item.topic_tags) watchedTags.add(t);
        }
    }
    const map = new Map<string, VocabOverlapEntry>();
    if (watchedTags.size === 0) return map;
    for (const item of items) {
        const present = item.entities.map(normalizeEntity);
        const itemTags = new Set<string>();
        for (const t of item.pain_tags) itemTags.add(t);
        for (const t of item.topic_tags) itemTags.add(t);
        let overlap = 0;
        for (const t of itemTags) if (watchedTags.has(t)) overlap += 1;
        if (overlap === 0) continue;
        for (const norm of present) {
            if (norm.length === 0 || watched.has(norm)) continue;
            let entry = map.get(norm);
            if (!entry) {
                entry = { overlap: 0, supporting_item_ids: new Set() };
                map.set(norm, entry);
            }
            entry.overlap += overlap;
            entry.supporting_item_ids.add(item.id);
        }
    }
    return map;
}

function buildReasoning(co: number, vocab: number, vocabMin: number, watchedSize: number): string {
    const sample = watchedSize === 0 ? "the watched set" : `${watchedSize} watched entit${watchedSize === 1 ? "y" : "ies"}`;
    const head = `Appeared in ${co} item${co === 1 ? "" : "s"} alongside ${sample}.`;
    if (vocab >= vocabMin) {
        return `${head} Shares ${vocab} pain/topic tag${vocab === 1 ? "" : "s"} with the watched set's items.`;
    }
    return head;
}

/**
 * Score every off-watchlist entity that appears alongside a watched
 * one, filter by the co-occurrence floor, weight in vocab overlap, sort
 * by total, cap at max_candidates. Returns the rows the pipeline
 * inserts into briefing_periphery_candidates.
 */
export function rankCandidates(
    items: ReadonlyArray<ScoringItem>,
    watched: ReadonlySet<string>,
    config?: Partial<ScoringConfig>
): ReadonlyArray<CandidateScore> {
    const cfg: ScoringConfig = { ...DEFAULT_SCORING_CONFIG, ...(config ?? {}) };
    const co = computeCoOccurrence(items, watched);
    const vocab = computeVocabOverlap(items, watched);

    const candidates: CandidateScore[] = [];
    for (const [norm, coEntry] of co) {
        if (coEntry.count < cfg.co_min) continue;
        const vEntry = vocab.get(norm);
        const vOverlap = vEntry ? vEntry.overlap : 0;
        // Weight vocab as a tiebreaker — up to the co-occurrence count
        // itself, so a candidate can't ride into the top of the list on
        // tag overlap alone. Keeps co-occurrence as the primary signal.
        const total = coEntry.count + Math.min(vOverlap / 4, coEntry.count);
        const ids = new Set(coEntry.supporting_item_ids);
        if (vEntry) for (const id of vEntry.supporting_item_ids) ids.add(id);
        const aliases = Array.from(coEntry.aliases).filter((a) => normalizeEntity(a) !== norm);
        candidates.push({
            entity_name: norm,
            entity_aliases: aliases,
            co_occurrence_score: coEntry.count,
            vocab_overlap_score: vOverlap,
            total_score: Number(total.toFixed(3)),
            supporting_item_ids: Array.from(ids),
            reasoning: buildReasoning(coEntry.count, vOverlap, cfg.vocab_min, watched.size)
        });
    }
    candidates.sort((a, b) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score;
        // Stable tiebreak on entity_name so the same input always sorts
        // the same way (matters for snapshot-style tests + run reruns).
        return a.entity_name < b.entity_name ? -1 : a.entity_name > b.entity_name ? 1 : 0;
    });
    return candidates.slice(0, cfg.max_candidates);
}
