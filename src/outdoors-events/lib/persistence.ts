/**
 * Outdoors Events persistence (ADR-015).
 *
 * Thin wrappers over the typed data-client. All operations defensive —
 * errors flow through reportError + return a safe degraded value rather
 * than throwing. RLS in the DB layer scopes everything to the operator's
 * workspace.
 */

import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";
import {
    isOutdoorsEventStatus,
    type OutdoorsEvent,
    type OutdoorsEventDraft,
    type OutdoorsEventStatus
} from "./types";

type Row = {
    id: string;
    name: string;
    kind: string | null;
    where_at: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    tags: string[];
    notes: string | null;
    source_url: string | null;
    created_at: string;
    updated_at: string;
};

function rowToEvent(row: Row): OutdoorsEvent {
    const status: OutdoorsEventStatus = isOutdoorsEventStatus(row.status)
        ? row.status
        : "watching";
    return {
        id: row.id,
        name: row.name,
        kind: row.kind,
        whereAt: row.where_at,
        startDate: row.start_date,
        endDate: row.end_date,
        status,
        tags: Array.isArray(row.tags) ? row.tags : [],
        notes: row.notes,
        sourceUrl: row.source_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function draftToInsert(draft: OutdoorsEventDraft): Record<string, unknown> {
    return {
        name: draft.name.trim(),
        kind: draft.kind.trim() || null,
        where_at: draft.whereAt.trim() || null,
        start_date: draft.startDate.trim() || null,
        end_date: draft.endDate.trim() || null,
        status: draft.status,
        tags: draft.tags
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        notes: draft.notes.trim() || null,
        source_url: draft.sourceUrl.trim() || null
    };
}

export async function listOutdoorsEvents(
    opts: { readonly data?: DataClient } = {}
): Promise<ReadonlyArray<OutdoorsEvent>> {
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.outdoorsEvents.list({
            orderBy: { column: "start_date", ascending: true }
        });
        return rows.map((r) => rowToEvent(r as unknown as Row));
    } catch (err) {
        reportError(err, { op: "outdoors-events.list" });
        return [];
    }
}

export async function insertOutdoorsEvent(
    draft: OutdoorsEventDraft,
    opts: { readonly data?: DataClient } = {}
): Promise<OutdoorsEvent | null> {
    try {
        const data = opts.data ?? createDataClient();
        const inserted = await data.outdoorsEvents.insert(
            draftToInsert(draft) as never
        );
        return rowToEvent(inserted as unknown as Row);
    } catch (err) {
        reportError(err, { op: "outdoors-events.insert" });
        return null;
    }
}

export async function updateOutdoorsEvent(
    id: string,
    patch: Partial<{
        readonly name: string;
        readonly kind: string | null;
        readonly whereAt: string | null;
        readonly startDate: string | null;
        readonly endDate: string | null;
        readonly status: OutdoorsEventStatus;
        readonly tags: ReadonlyArray<string>;
        readonly notes: string | null;
        readonly sourceUrl: string | null;
    }>,
    opts: { readonly data?: DataClient } = {}
): Promise<boolean> {
    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.kind !== undefined) updates.kind = patch.kind;
    if (patch.whereAt !== undefined) updates.where_at = patch.whereAt;
    if (patch.startDate !== undefined) updates.start_date = patch.startDate;
    if (patch.endDate !== undefined) updates.end_date = patch.endDate;
    if (patch.status !== undefined) updates.status = patch.status;
    if (patch.tags !== undefined)
        updates.tags = [...patch.tags]
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
    if (patch.notes !== undefined) updates.notes = patch.notes;
    if (patch.sourceUrl !== undefined) updates.source_url = patch.sourceUrl;
    try {
        const data = opts.data ?? createDataClient();
        await data.outdoorsEvents.update(id, updates as never);
        return true;
    } catch (err) {
        reportError(err, { op: "outdoors-events.update", id });
        return false;
    }
}

export async function deleteOutdoorsEvent(
    id: string,
    opts: { readonly data?: DataClient } = {}
): Promise<boolean> {
    try {
        const data = opts.data ?? createDataClient();
        await data.outdoorsEvents.remove(id);
        return true;
    } catch (err) {
        reportError(err, { op: "outdoors-events.delete", id });
        return false;
    }
}

/**
 * Parse a comma-separated tags string into a clean list. Used by the
 * composer to turn operator-typed input into the array shape.
 */
export function parseTags(raw: string): ReadonlyArray<string> {
    return raw
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
}

export function joinTags(tags: ReadonlyArray<string>): string {
    return tags.join(", ");
}
