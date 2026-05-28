/**
 * Deno-side mirror of the Periphery scoring layer (B.4a + B.4b).
 *
 * Mirrors src/briefing/lib/periphery/{types,scoring}.ts verbatim. The
 * src/ files are canonical + vitest-tested; behavior changes caught by
 * vitest must be hand-mirrored here. Same Node/Deno split as the LLM +
 * cluster + synthesis + triggers layers.
 */

// ─── Types (mirror of types.ts) ────────────────────────────────

export interface ScoringItem {
    readonly id: string;
    readonly entities: ReadonlyArray<string>;
    readonly pain_tags: ReadonlyArray<string>;
    readonly topic_tags: ReadonlyArray<string>;
}

export interface ScoringConfig {
    readonly co_min: number;
    readonly vocab_min: number;
    readonly max_candidates: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
    co_min: 3,
    vocab_min: 2,
    max_candidates: 5
};

export interface CandidateScore {
    readonly entity_name: string;
    readonly entity_aliases: ReadonlyArray<string>;
    readonly co_occurrence_score: number;
    readonly vocab_overlap_score: number;
    readonly total_score: number;
    readonly supporting_item_ids: ReadonlyArray<string>;
    readonly reasoning: string;
}

// ─── Scoring (mirror of scoring.ts) ────────────────────────────

export function normalizeEntity(name: string): string {
    return name.trim().toLowerCase();
}

interface CoOccurrenceEntry {
    count: number;
    aliases: Set<string>;
    supporting_item_ids: Set<string>;
}

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
        return a.entity_name < b.entity_name ? -1 : a.entity_name > b.entity_name ? 1 : 0;
    });
    return candidates.slice(0, cfg.max_candidates);
}
