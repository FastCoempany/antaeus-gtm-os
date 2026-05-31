/**
 * Shared types for the heartbeat Edge Function runtime.
 *
 * Sync source: src/lib/observations/generators/types.ts.
 * The src side is canonical; this file duplicates the wire shapes
 * Deno needs because the Deno runtime can't import across the
 * Node/Deno boundary into the src/ tree.
 *
 * Before this module landed (post-PR-216 cleanup), the same three
 * types were duplicated in BOTH `index.ts` and `generators.ts` on the
 * Deno side. Now both files import from here.
 */

export type RelatedObjectType =
    | "account"
    | "deal"
    | "signal"
    | "call"
    | "proof"
    | "advisor"
    | "focus"
    | "approach";

export type ObservationConfidence = "high" | "medium" | "low" | null;

export interface ObservationCandidate {
    readonly observationText: string;
    readonly relatedObjectType?: RelatedObjectType | null;
    readonly relatedObjectId?: string | null;
    readonly confidence?: ObservationConfidence;
    readonly supersedesPrior?: boolean;
}

export interface GeneratorContext {
    readonly workspaceId: string;
    readonly now: string;
    readonly session: {
        readonly focusedObjectType: RelatedObjectType | null;
        readonly focusedObjectId: string | null;
    } | null;
}
