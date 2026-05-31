import type { ObservationView } from "./types";

/**
 * Cross-deduping infrastructure: workspace observations × active
 * Briefing Patterns.
 *
 * Per ADR-009 §"Cross-deduping infrastructure for the Briefing":
 * when a Briefing Pattern is active and names the same entity that a
 * workspace observation would surface (with a generator that shadows
 * the Pattern's trigger class), the workspace observation is
 * suppressed so the operator doesn't see two reads of the same
 * underlying state. The Briefing Pattern is the richer read; the
 * workspace observation is the cheaper one.
 *
 * Today the Briefing isn't shipping Patterns (B.0+ queued), so the
 * `patterns` parameter is empty in production and this filter is a
 * no-op. The shape is wired now so when Patterns land, the dedupe
 * lights up without re-plumbing the Dashboard reader.
 *
 * Shadow map: workspace_generator_id → briefing_trigger_classes that
 * make it redundant. Conservative; only obvious overlaps. Multiple
 * trigger classes can shadow the same generator.
 */

export interface BriefingPatternIndex {
    /**
     * Active Patterns indexed by `(entity_type, entity_id)`. Workspace
     * observations whose related-object pair matches an indexed
     * Pattern's primary entity AND whose generator is in the Pattern's
     * shadow set are suppressed.
     */
    readonly patterns: ReadonlyArray<ActiveBriefingPattern>;
}

export interface ActiveBriefingPattern {
    readonly id: string;
    /** Primary entity the Pattern is about. */
    readonly entityType: "account" | "deal" | "proof" | "advisor" | null;
    readonly entityId: string | null;
    /** Trigger class the Pattern was synthesized from. */
    readonly triggerClass: BriefingTriggerClass;
}

export type BriefingTriggerClass =
    | "silence"
    | "single_event"
    | "aggregation"
    | "threshold"
    | "adjacency";

/**
 * Empty default — production today. The Dashboard card will use this
 * until Briefing B.0+ ships an actual Patterns reader.
 */
export const EMPTY_BRIEFING_PATTERN_INDEX: BriefingPatternIndex = {
    patterns: []
};

/**
 * Mapping: a workspace-generator's observation IS shadowed by an
 * active Briefing Pattern with these trigger classes on the same
 * entity. Other generators are never shadowed.
 *
 * `signal_decay` shadowed by silence — both read "this account has
 * gone quiet." The Briefing's silence trigger is richer (it knows
 * whether the silence is the operator-watched account's absence
 * specifically, vs the broader category going quiet).
 *
 * `deal_decay` is NOT shadowed — Briefing Patterns don't read the
 * operator's internal deal pipeline. The two streams don't overlap on
 * that surface.
 *
 * `proof_staleness` is NOT shadowed — same reason.
 *
 * `discovery_rhythm` is workspace-scoped (no entity), so Pattern
 * shadowing doesn't apply at the entity-match layer.
 */
const SHADOW_MAP: Readonly<Record<string, ReadonlyArray<BriefingTriggerClass>>> = {
    "phase-b/signal-decay": ["silence"]
};

export function isShadowedByBriefing(
    observation: ObservationView,
    index: BriefingPatternIndex
): boolean {
    const shadowed = SHADOW_MAP[observation.sourceGenerator];
    if (!shadowed || shadowed.length === 0) return false;
    if (!observation.relatedObjectId || !observation.relatedObjectType) {
        return false;
    }
    for (const p of index.patterns) {
        if (p.entityId !== observation.relatedObjectId) continue;
        if (p.entityType !== observation.relatedObjectType) continue;
        if (shadowed.includes(p.triggerClass)) return true;
    }
    return false;
}

export function filterShadowedByBriefing(
    observations: ReadonlyArray<ObservationView>,
    index: BriefingPatternIndex
): ReadonlyArray<ObservationView> {
    if (index.patterns.length === 0) return observations; // no-op fast path
    return observations.filter((o) => !isShadowedByBriefing(o, index));
}
