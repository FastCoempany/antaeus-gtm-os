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
