import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database.types";
import type { LearningEntry, Negotiation } from "./types";

/**
 * Negotiation ↔ Supabase row bridge.
 *
 * Negotiation owns TWO workspace-level bags:
 *   - `negotiations` — saved negotiation history (max 50 per state.ts)
 *   - `learnings`    — append-only lessons-learned log
 *
 * Both live in ONE row of `studio_artifacts` with
 * `data.kind='negotiation.workspace'`. Save UPSERTS the same row.
 * Realtime INSERT/UPDATE on the kind replaces the in-memory bags.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const KIND_NEGOTIATION_WORKSPACE = "negotiation.workspace";

export function looksLikePersistedId(id: string): boolean {
    return UUID_RE.test(id);
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asArray(v: unknown): unknown[] {
    return Array.isArray(v) ? v : [];
}

export function rowKind(row: Row<"studio_artifacts">): string | null {
    const data = asObject(row.data);
    if (!data) return null;
    return asString(data["kind"]) || null;
}

export interface NegotiationWorkspaceBag {
    readonly negotiations: ReadonlyArray<Negotiation>;
    readonly learnings: ReadonlyArray<LearningEntry>;
}

/**
 * Hydrate the workspace bag from a Supabase row. Returns null when
 * the row is not a negotiation.workspace kind. Missing arrays default
 * to empty so a partial row never breaks the form.
 */
export function rowToWorkspaceBag(
    row:
        | Row<"studio_artifacts">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): NegotiationWorkspaceBag | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"studio_artifacts">;
    const data = asObject(r.data);
    if (!data) return null;
    if (data["kind"] !== KIND_NEGOTIATION_WORKSPACE) return null;

    const negotiationsRaw = asArray(data["negotiations"]);
    const learningsRaw = asArray(data["learnings"]);

    const negotiations: Negotiation[] = [];
    for (const item of negotiationsRaw) {
        const o = asObject(item);
        if (!o) continue;
        if (typeof o["id"] !== "string") continue;
        // Trust the rest of the shape — defensive parsing here would
        // duplicate types.ts. If a malformed row makes it in, the room
        // surfaces it as an editable draft, not a crash.
        negotiations.push(item as Negotiation);
    }

    const learnings: LearningEntry[] = [];
    for (const item of learningsRaw) {
        const o = asObject(item);
        if (!o) continue;
        if (typeof o["id"] !== "string") continue;
        if (typeof o["text"] !== "string") continue;
        learnings.push(item as LearningEntry);
    }

    return { negotiations, learnings };
}

export function bagToInsert(
    bag: NegotiationWorkspaceBag
): InsertRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_NEGOTIATION_WORKSPACE,
            negotiations: bag.negotiations,
            learnings: bag.learnings
        } as unknown as Json
    };
}

export function bagToUpdate(
    bag: NegotiationWorkspaceBag
): UpdateRow<"studio_artifacts"> {
    return {
        data: {
            kind: KIND_NEGOTIATION_WORKSPACE,
            negotiations: bag.negotiations,
            learnings: bag.learnings
        } as unknown as Json
    };
}
