/**
 * Phase A orchestration layer (ADR-004) — observation types.
 *
 * The TypeScript view of the observations ledger (Supabase table
 * `observations`). Plus the generator contract — what a Phase B+
 * observation generator implements.
 *
 * Storage: supabase/migrations/20260519180001_observations_ledger.sql
 *
 * Voice rule: every `observation_text` MUST pass canon Part III §11.
 * No startup-jargon, no sales-shorthand, no us-vs-them framing, no
 * single-noun abstractions — sentences a CRO would say to a peer at
 * another company.
 */

import type { FocusedObjectType } from "@/lib/session/types";

/**
 * Confidence band. High-confidence observations can ride the
 * birdseye strip + push to the operator. Low-confidence ones stay in
 * the system's ledger without pushing.
 *
 * `null` means "not classified" — the writer didn't pick a band. The
 * reader treats `null` as `low` for sorting purposes.
 */
export type ObservationConfidence = "high" | "medium" | "low" | null;

/**
 * Lifecycle status. Observations are NEVER hard-deleted — the audit
 * trail of what the system noticed + when matters more than tidiness.
 */
export type ObservationStatus = "active" | "dismissed" | "superseded";

export const OBSERVATION_STATUSES: ReadonlyArray<ObservationStatus> = [
    "active",
    "dismissed",
    "superseded"
];

export const OBSERVATION_CONFIDENCES: ReadonlyArray<NonNullable<ObservationConfidence>> = [
    "high",
    "medium",
    "low"
];

/**
 * The TypeScript view of an observations row. camelCase, tightly
 * typed enums. Use this everywhere in app code; convert at the
 * data-client boundary.
 */
export interface ObservationView {
    readonly id: string;
    readonly workspaceId: string;
    readonly writtenAt: string;
    readonly observationText: string;
    readonly relatedObjectType: FocusedObjectType | null;
    readonly relatedObjectId: string | null;
    readonly sourceGenerator: string;
    readonly confidence: ObservationConfidence;
    readonly status: ObservationStatus;
    readonly supersededBy: string | null;
    readonly dismissedAt: string | null;
    readonly dismissedReason: string | null;
}

/**
 * What a generator produces before dedupe + insert. The writer fills
 * in workspace_id + written_at + status='active' at write time. The
 * generator only authors the OBSERVATION CONTENT plus the metadata
 * that classifies it.
 */
export interface ObservationCandidate {
    /**
     * The actual sentence. MUST pass canon Part III §11 voice rule.
     * Generator authors are responsible for this; the writer does
     * not rewrite copy.
     */
    readonly observationText: string;
    readonly relatedObjectType?: FocusedObjectType | null;
    readonly relatedObjectId?: string | null;
    readonly confidence?: ObservationConfidence;
    /**
     * Optional: if set, the writer will mark any prior active
     * observations from the same generator for the same related
     * object as superseded by this new observation. Use this when
     * a generator wants to REPLACE its prior reading (e.g. "this
     * deal was stalled, now it's moving").
     */
    readonly supersedesPrior?: boolean;
}

/**
 * What a generator receives — the read-only workspace state it can
 * inspect. Generators must NOT mutate this; they're pure functions
 * from state → candidates.
 *
 * Phase A defines the shape; Phase B+ generators implement actual
 * pattern detection against it. The shape is intentionally minimal
 * here — generators that need more data will widen it via dedicated
 * sub-fetches inside the heartbeat (e.g. fetching signals for a
 * specific account).
 */
export interface GeneratorContext {
    readonly workspaceId: string;
    /** ISO 8601 — the moment the heartbeat fired. */
    readonly now: string;
    /**
     * The current session for this workspace (if any). Lets
     * generators know what the operator is currently focused on —
     * useful for prioritization.
     */
    readonly session: {
        readonly focusedObjectType: FocusedObjectType | null;
        readonly focusedObjectId: string | null;
    } | null;
}

/**
 * The signature every observation generator implements. Takes the
 * workspace context, returns an array of candidates (zero or more).
 * Pure — no I/O inside the generator itself; the heartbeat handles
 * the I/O wrapper.
 */
export type Generator = (
    ctx: GeneratorContext
) => Promise<ReadonlyArray<ObservationCandidate>>;

/**
 * A generator + its identifier. The id is what gets stored in the
 * `source_generator` column (format: 'phase-b/signal-decay' etc.) and
 * used for dedupe.
 */
export interface RegisteredGenerator {
    readonly id: string;
    readonly run: Generator;
}

// ─── Parsing (Supabase row → typed view) ──────────────────────────

function isFocusedObjectType(value: unknown): value is FocusedObjectType {
    return (
        value === "account" ||
        value === "deal" ||
        value === "signal" ||
        value === "call" ||
        value === "proof" ||
        value === "advisor" ||
        value === "focus" ||
        value === "approach"
    );
}

function isStatus(value: unknown): value is ObservationStatus {
    return value === "active" || value === "dismissed" || value === "superseded";
}

function isConfidence(value: unknown): value is ObservationConfidence {
    return value === null || value === "high" || value === "medium" || value === "low";
}

/**
 * Convert a Supabase observations row → typed view. Defensive: bad
 * enum values fall back to safe defaults rather than crashing.
 */
export function rowToObservation(row: {
    id: string;
    workspace_id: string;
    written_at: string;
    observation_text: string;
    related_object_type: string | null;
    related_object_id: string | null;
    source_generator: string;
    confidence: string | null;
    status: string;
    superseded_by: string | null;
    dismissed_at: string | null;
    dismissed_reason: string | null;
}): ObservationView {
    const relatedObjectType = isFocusedObjectType(row.related_object_type)
        ? row.related_object_type
        : null;
    const confidence = isConfidence(row.confidence) ? row.confidence : null;
    const status: ObservationStatus = isStatus(row.status) ? row.status : "active";
    return {
        id: row.id,
        workspaceId: row.workspace_id,
        writtenAt: row.written_at,
        observationText: row.observation_text,
        relatedObjectType,
        relatedObjectId: row.related_object_id,
        sourceGenerator: row.source_generator,
        confidence,
        status,
        supersededBy: row.superseded_by,
        dismissedAt: row.dismissed_at,
        dismissedReason: row.dismissed_reason
    };
}

/**
 * Sort key — high-confidence + newest first, then medium, then low/
 * null. Used by the Dashboard "this week's reads" card + the
 * birdseye strip.
 */
export function compareObservationsForDisplay(
    a: ObservationView,
    b: ObservationView
): number {
    const aWeight = confidenceWeight(a.confidence);
    const bWeight = confidenceWeight(b.confidence);
    if (aWeight !== bWeight) return bWeight - aWeight; // higher confidence first
    return b.writtenAt.localeCompare(a.writtenAt); // newer first
}

function confidenceWeight(c: ObservationConfidence): number {
    if (c === "high") return 3;
    if (c === "medium") return 2;
    if (c === "low") return 1;
    return 0; // null
}
