import type { DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";
import type { AuthoredSection } from "./types";

/**
 * Founding GTM share-link mechanic per canon §4.19.
 *
 * Anonymous URL token, Founding-GTM-only scope, managed from inside
 * the room. The operator hits "Create share link," we generate a long
 * random token, snapshot the seven authored sections + workspace name
 * + current readiness verdict into a JSONB blob, and write one row to
 * `founding_gtm_shares`. Recipients open `/founding-gtm/share/<token>`
 * and the read-mode entry point resolves the snapshot through the
 * SECURITY DEFINER RPC — never touching live workspace tables.
 *
 * Locked by founder 2026-05-31 — see canon Part V §6 entry for the
 * three scoping decisions (auth model / scope / manage UI).
 */

export const SHARE_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export interface ShareSnapshot {
    readonly schemaVersion: typeof SHARE_SNAPSHOT_SCHEMA_VERSION;
    readonly snapshotIso: string;
    readonly workspaceName: string;
    readonly verdictLabel: string | null;
    readonly sections: ReadonlyArray<AuthoredSection>;
}

export interface ShareRow {
    readonly id: string;
    readonly token: string;
    readonly label: string | null;
    readonly createdAtIso: string;
    readonly updatedAtIso: string;
    readonly revokedAtIso: string | null;
    readonly snapshotIso: string;
}

// ─── Token generation ──────────────────────────────────────────────────

/**
 * Generate a URL-safe random token. ~256 bits of entropy, ~43 chars,
 * no padding. Anonymous URL access only — entropy is the only gate
 * between an attacker and a snapshot's content, so this must use the
 * crypto API, not Math.random.
 */
export function generateShareToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    // base64url without padding
    let bin = "";
    for (let i = 0; i < bytes.length; i++) {
        bin += String.fromCharCode(bytes[i]!);
    }
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Snapshot composition ──────────────────────────────────────────────

interface BuildSnapshotInput {
    readonly sections: ReadonlyArray<AuthoredSection>;
    readonly workspaceName: string;
    readonly verdictLabel: string | null;
    readonly nowIso?: string;
}

export function buildShareSnapshot(
    input: BuildSnapshotInput
): ShareSnapshot {
    return {
        schemaVersion: SHARE_SNAPSHOT_SCHEMA_VERSION,
        snapshotIso: input.nowIso ?? new Date().toISOString(),
        workspaceName: input.workspaceName,
        verdictLabel: input.verdictLabel,
        sections: input.sections
    };
}

// ─── Defensive parse (read-mode side) ──────────────────────────────────

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

/**
 * Parse a snapshot returned by the resolve RPC. Returns null when the
 * shape doesn't match — schemaVersion mismatch, sections array missing,
 * etc. The read-mode route shows an "expired link" state on null.
 */
export function parseShareSnapshot(raw: unknown): ShareSnapshot | null {
    const o = asObject(raw);
    if (!o) return null;
    if (o.schemaVersion !== SHARE_SNAPSHOT_SCHEMA_VERSION) return null;
    const sectionsRaw = asArray(o.sections);
    if (sectionsRaw.length === 0) return null;
    return {
        schemaVersion: SHARE_SNAPSHOT_SCHEMA_VERSION,
        snapshotIso: asString(o.snapshotIso),
        workspaceName: asString(o.workspaceName),
        verdictLabel:
            typeof o.verdictLabel === "string" ? o.verdictLabel : null,
        sections: sectionsRaw as ReadonlyArray<AuthoredSection>
    };
}

// ─── Resolver (read-mode anonymous side) ───────────────────────────────

/**
 * Resolve a token to its snapshot through the SECURITY DEFINER RPC.
 * Used by /founding-gtm/share/<token>. Returns null when the token is
 * unknown, revoked, or the call fails — every error path produces the
 * same "expired link" UI on the recipient side, so we don't leak why.
 */
export async function resolveShareToken(
    data: DataClient,
    token: string
): Promise<ShareSnapshot | null> {
    try {
        const { data: snapshot, error } = await data.client.rpc(
            "resolve_founding_gtm_share",
            { p_token: token }
        );
        if (error) {
            reportError(error, {
                op: "founding-gtm.resolveShareToken"
            });
            return null;
        }
        return parseShareSnapshot(snapshot);
    } catch (err) {
        reportError(err, { op: "founding-gtm.resolveShareToken.throw" });
        return null;
    }
}

// ─── CRUD on the operator side ─────────────────────────────────────────

function rowFromSupabase(
    raw: { id: string; token: string; label: string | null; created_at: string; updated_at: string; revoked_at: string | null; snapshot: unknown }
): ShareRow {
    const snap = asObject(raw.snapshot);
    return {
        id: raw.id,
        token: raw.token,
        label: raw.label,
        createdAtIso: raw.created_at,
        updatedAtIso: raw.updated_at,
        revokedAtIso: raw.revoked_at,
        snapshotIso: asString(snap?.snapshotIso, raw.created_at)
    };
}

export async function listShares(data: DataClient): Promise<ReadonlyArray<ShareRow>> {
    try {
        const rows = await data.foundingGtmShares.list({
            orderBy: { column: "created_at", ascending: false }
        });
        return rows.map((r) =>
            rowFromSupabase({
                id: r.id,
                token: r.token,
                label: r.label,
                created_at: r.created_at,
                updated_at: r.updated_at,
                revoked_at: r.revoked_at,
                snapshot: r.snapshot
            })
        );
    } catch (err) {
        reportError(err, { op: "founding-gtm.listShares" });
        return [];
    }
}

export interface CreateShareInput {
    readonly snapshot: ShareSnapshot;
    readonly label?: string;
    /** Override token generation in tests. */
    readonly token?: string;
}

export async function createShare(
    data: DataClient,
    input: CreateShareInput
): Promise<ShareRow | null> {
    try {
        const token = input.token ?? generateShareToken();
        const inserted = await data.foundingGtmShares.insert({
            token,
            label: input.label ?? null,
            snapshot: input.snapshot as never // jsonb
        });
        return rowFromSupabase({
            id: inserted.id,
            token: inserted.token,
            label: inserted.label,
            created_at: inserted.created_at,
            updated_at: inserted.updated_at,
            revoked_at: inserted.revoked_at,
            snapshot: inserted.snapshot
        });
    } catch (err) {
        reportError(err, { op: "founding-gtm.createShare" });
        return null;
    }
}

export async function revokeShare(
    data: DataClient,
    id: string
): Promise<boolean> {
    try {
        await data.foundingGtmShares.update(id, {
            revoked_at: new Date().toISOString()
        });
        return true;
    } catch (err) {
        reportError(err, { op: "founding-gtm.revokeShare" });
        return false;
    }
}

export async function regenerateShareSnapshot(
    data: DataClient,
    id: string,
    snapshot: ShareSnapshot
): Promise<boolean> {
    try {
        await data.foundingGtmShares.update(id, {
            snapshot: snapshot as never
        });
        return true;
    } catch (err) {
        reportError(err, { op: "founding-gtm.regenerateShareSnapshot" });
        return false;
    }
}

// ─── URL helpers ──────────────────────────────────────────────────────

/**
 * Build the absolute URL for a share token, given the current origin.
 * Returns "" if origin can't be resolved — caller should disable copy.
 *
 * Route is the Vite-multi-entry `/founding-gtm-share/` with `?t=<token>`.
 * Search param (not path segment) because Vite outputs one index.html
 * per entry — no path-segment routing — and a query is simpler than
 * adding a host-level rewrite rule per route.
 */
export function buildShareUrl(
    token: string,
    origin: string | null | undefined
): string {
    if (!origin || !token) return "";
    return `${origin.replace(/\/+$/, "")}/founding-gtm-share/?t=${encodeURIComponent(token)}`;
}
