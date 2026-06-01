/**
 * Outdoors Events — typed shapes (ADR-015).
 *
 * The room's domain noun is `OutdoorsEvent` — an offline gathering the
 * operator is tracking. Free-text kind + location + tags so the
 * operator authors freely; enum status for the lifecycle.
 */

export type OutdoorsEventStatus =
    | "watching"
    | "planning"
    | "attending"
    | "attended"
    | "passed"
    | "archived";

/**
 * Discovery relevance tier (ADR-016). The pipeline scores each
 * surfaced event into one of three buckets:
 *  - direct   — gathering specifically about the operator's product category
 *  - adjacent — gathering of buyer personas the operator sells INTO
 *  - indirect — gathering where the operator's ICP might show up
 */
export type OutdoorsEventTier = "direct" | "adjacent" | "indirect";

export const OUTDOORS_EVENT_TIERS: ReadonlyArray<OutdoorsEventTier> = [
    "direct",
    "adjacent",
    "indirect"
];

export const TIER_LABEL: Record<OutdoorsEventTier, string> = {
    direct: "Direct",
    adjacent: "Adjacent",
    indirect: "Indirect"
};

export const TIER_HINT: Record<OutdoorsEventTier, string> = {
    direct: "Gatherings about your product category.",
    adjacent: "Gatherings of buyer personas you sell into.",
    indirect: "Gatherings where your ICP might show up."
};

export function isOutdoorsEventTier(v: unknown): v is OutdoorsEventTier {
    return (
        typeof v === "string" &&
        (OUTDOORS_EVENT_TIERS as ReadonlyArray<string>).includes(v)
    );
}

export const OUTDOORS_EVENT_STATUSES: ReadonlyArray<OutdoorsEventStatus> = [
    "watching",
    "planning",
    "attending",
    "attended",
    "passed",
    "archived"
];

export const STATUS_LABEL: Record<OutdoorsEventStatus, string> = {
    watching: "Watching",
    planning: "Planning",
    attending: "Attending",
    attended: "Attended",
    passed: "Passed",
    archived: "Archived"
};

export interface OutdoorsEvent {
    readonly id: string;
    readonly name: string;
    readonly kind: string | null;
    readonly whereAt: string | null;
    readonly startDate: string | null;
    readonly endDate: string | null;
    readonly status: OutdoorsEventStatus;
    readonly tags: ReadonlyArray<string>;
    readonly notes: string | null;
    readonly sourceUrl: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    // ADR-016: discovery-pipeline fields. Null on legacy manual rows.
    readonly relevanceTier: OutdoorsEventTier | null;
    readonly relevanceReason: string | null;
    readonly discoveredAt: string | null;
    readonly sourceKind: "discovery_run" | "seed" | "manual" | null;
}

/**
 * Operator-authored fields the composer accepts. id / timestamps /
 * workspace are server-side.
 */
export interface OutdoorsEventDraft {
    readonly name: string;
    readonly kind: string;
    readonly whereAt: string;
    readonly startDate: string;
    readonly endDate: string;
    readonly status: OutdoorsEventStatus;
    readonly tags: ReadonlyArray<string>;
    readonly notes: string;
    readonly sourceUrl: string;
}

export const EMPTY_DRAFT: OutdoorsEventDraft = {
    name: "",
    kind: "",
    whereAt: "",
    startDate: "",
    endDate: "",
    status: "watching",
    tags: [],
    notes: "",
    sourceUrl: ""
};

export function isOutdoorsEventStatus(v: unknown): v is OutdoorsEventStatus {
    return (
        typeof v === "string" &&
        (OUTDOORS_EVENT_STATUSES as ReadonlyArray<string>).includes(v)
    );
}
