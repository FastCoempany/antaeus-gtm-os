import type { Account, Signal } from "./types";
import { reportError } from "@/lib/observability";

/**
 * Phase 4 / Room 3 Wave 4 — Signal Console persistence.
 *
 * The Signal Console is the source-of-truth for accounts + signals.
 * The legacy room writes the array to `gtmos_sc_v4`; every consumer
 * (Dashboard's command-intelligence rail, Deal Workspace's account
 * lookup, Outbound Studio's persona match, etc.) reads from there.
 *
 * Until every consumer migrates, the new room dual-writes:
 *   1. `gtmos_sc_v4` — canonical shape, same as the legacy room
 *   2. (later) the `signal_console_accounts` Supabase table
 *
 * Wave 4 ships the localStorage path. Supabase wiring lands in a
 * follow-up wave once we have a stable per-account write path that
 * doesn't clobber the legacy room's writes during cutover.
 *
 * Errors are swallowed — the room stays usable in-memory if storage
 * is hostile. Same posture as Phase 4 / Room 1's legacy mirror.
 */

export const STORAGE_KEY = "gtmos_sc_v4";

interface PersistedShape {
    readonly accounts?: ReadonlyArray<Account>;
    readonly lastSavedAt?: string;
}

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

function asString(v: unknown): string | undefined {
    return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asNumberMaybe(v: unknown): number | undefined {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function parseSignal(raw: unknown): Signal | null {
    const o = asObject(raw);
    if (!o) return null;
    const id = asString(o.id);
    if (!id) return null;
    const sig: Signal = {
        id,
        ...(asString(o.type) ? { type: asString(o.type) } : {}),
        ...(asString(o.cat) ? { cat: asString(o.cat) } : {}),
        ...(asString(o.headline) ? { headline: asString(o.headline) } : {}),
        ...(asString(o.title) ? { title: asString(o.title) } : {}),
        ...(asString(o.source) ? { source: asString(o.source) } : {}),
        ...(asString(o.url) ? { url: asString(o.url) } : {}),
        ...(asString(o.published_date)
            ? { published_date: asString(o.published_date) }
            : {}),
        ...(asString(o.fetched_at) ? { fetched_at: asString(o.fetched_at) } : {}),
        ...(asString(o.capturedAt) ? { capturedAt: asString(o.capturedAt) } : {}),
        ...(asNumberMaybe(o.confidence) !== undefined
            ? { confidence: asNumberMaybe(o.confidence)! }
            : {}),
        ...(o.is_ai === true ? { is_ai: true } : {}),
        ...(o.ai === true ? { ai: true } : {}),
        ...(asString(o.status) ? { status: asString(o.status) } : {}),
        ...(o.flagged === true ? { flagged: true } : {}),
        ...(asString(o.note) ? { note: asString(o.note) } : {})
    };
    return sig;
}

function parseAccount(raw: unknown): Account | null {
    const o = asObject(raw);
    if (!o) return null;
    const id = asString(o.id);
    const name = asString(o.name);
    if (!id || !name) return null;
    const signals = asArray(o.signals)
        .map(parseSignal)
        .filter((s): s is Signal => s !== null);
    const account: Account = {
        id,
        name,
        ...(asString(o.ticker) ? { ticker: asString(o.ticker) } : {}),
        ...(asString(o.domain) ? { domain: asString(o.domain) } : {}),
        ...(asString(o.industry) ? { industry: asString(o.industry) } : {}),
        ...(asString(o.hq) ? { hq: asString(o.hq) } : {}),
        ...(asString(o.employees) ? { employees: asString(o.employees) } : {}),
        // Read canonical `focus`, falling back to legacy `thesis` for
        // existing user data persisted before the 2026-05-19 rename.
        ...((): { focus?: string } => {
            const value = asString(o.focus) || asString(o.thesis);
            return value ? { focus: value } : {};
        })(),
        ...(asNumberMaybe(o.tier) !== undefined &&
        [1, 2, 3, 4].includes(asNumberMaybe(o.tier)!)
            ? { tier: asNumberMaybe(o.tier) as 1 | 2 | 3 | 4 }
            : {}),
        ...(asString(o.approach) ? { approach: asString(o.approach) } : {}),
        ...(asString(o.persona) ? { persona: asString(o.persona) } : {}),
        ...(asString(o.enrichedAt) ? { enrichedAt: asString(o.enrichedAt) } : {}),
        ...(asString(o.notes) ? { notes: asString(o.notes) } : {}),
        signals,
        ...(asString(o.created_at) ? { created_at: asString(o.created_at) } : {}),
        ...(asString(o.updated_at) ? { updated_at: asString(o.updated_at) } : {})
    };
    return account;
}

/**
 * Read the persisted accounts array. Returns an empty array if the
 * key is missing, malformed, or not an object — never throws.
 */
export function loadAccounts(
    storage: Pick<Storage, "getItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<Account> {
    if (!storage) return [];
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed) as PersistedShape | null;
        const arr = asArray(root?.accounts);
        return arr.map(parseAccount).filter((a): a is Account => a !== null);
    } catch (err) {
        reportError(err, { op: "signal-console.loadAccounts" });
        return [];
    }
}

/**
 * Persist the current accounts array. Best-effort — failures (quota
 * exceeded, hostile storage, private mode) are reported but never
 * thrown. Same posture as Phase 4 / Room 1's mirror.
 */
export function saveAccounts(
    accounts: ReadonlyArray<Account>,
    storage: Pick<Storage, "setItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): void {
    if (!storage) return;
    try {
        const payload: PersistedShape = {
            accounts,
            lastSavedAt: new Date().toISOString()
        };
        storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
        reportError(err, { op: "signal-console.saveAccounts" });
    }
}
