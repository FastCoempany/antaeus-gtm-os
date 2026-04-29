import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database.types";
import type { Account, Signal } from "./types";

/**
 * Signal Console ↔ Supabase row bridge.
 *
 * Translates between the in-memory `Account` shape (heat + signals[] +
 * full editorial fields) and the `signal_console_accounts` Postgres
 * row (account_key + denormalized columns + a `data` jsonb blob that
 * holds everything else).
 *
 * Why the split: keeping account_name / domain / ticker / industry /
 * sector / heat / last_enriched_at as top-level columns means a
 * future read-replica or BI query can index/order on those without
 * unpacking JSON. Everything else lives inside `data` so the Account
 * shape can evolve without a migration per change.
 *
 * Convention: an Account.id IS the row id (uuid). Legacy localStorage
 * accounts have non-uuid ids (e.g. "acc_1730…_x4z"); on first cloud
 * sync those rows are inserted (Supabase generates a uuid) and the
 * Account.id is rewritten to the new uuid before save resolves.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when an Account id looks like a real Supabase row uuid. */
export function looksLikePersistedId(id: string): boolean {
    return UUID_RE.test(id);
}

/**
 * Slug-style account_key derived from the Account name. Used as a
 * stable identifier at the DB layer (independent of the row's
 * generated uuid id) so cross-room joins by name remain possible.
 *
 * Lowercase, alphanumeric + hyphen, capped at 64 chars.
 */
export function accountKeyFromName(name: string): string {
    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug.slice(0, 64) || "untitled-account";
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

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

/**
 * Hydrate a Signal from a `data.signals[]` blob entry. Mirrors the
 * legacy parseSignal in persistence.ts; centralized here so the
 * bridge owns the canonical schema.
 */
function rowToSignal(raw: unknown): Signal | null {
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
        ...(asString(o.fetched_at)
            ? { fetched_at: asString(o.fetched_at) }
            : {}),
        ...(asString(o.capturedAt)
            ? { capturedAt: asString(o.capturedAt) }
            : {}),
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

/**
 * Translate a Supabase row → in-memory Account. Pulls top-level
 * columns, then unpacks the `data` jsonb blob for everything else
 * (signals + tier + persona + thesis + approach + notes).
 *
 * Returns null when the row is malformed (missing id or name) so
 * callers can `.filter(Boolean)` instead of guarding per-row.
 */
export function rowToAccount(
    row: Row<"signal_console_accounts"> | { id?: unknown; account_name?: unknown; data?: unknown } | null | undefined
): Account | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"signal_console_accounts">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    const name =
        typeof r.account_name === "string" && r.account_name.length > 0
            ? r.account_name
            : null;
    if (!id || !name) return null;

    const data = asObject(r.data) ?? {};
    const signals = asArray(data["signals"])
        .map(rowToSignal)
        .filter((s): s is Signal => s !== null);

    const tier = asNumberMaybe(data["tier"]);

    const account: Account = {
        id,
        name,
        ...(asString(r.ticker) ? { ticker: asString(r.ticker) } : {}),
        ...(asString(r.domain) ? { domain: asString(r.domain) } : {}),
        ...(asString(r.industry) ? { industry: asString(r.industry) } : {}),
        ...(asString(data["hq"]) ? { hq: asString(data["hq"]) } : {}),
        ...(asString(data["employees"])
            ? { employees: asString(data["employees"]) }
            : {}),
        ...(asString(data["thesis"])
            ? { thesis: asString(data["thesis"]) }
            : {}),
        ...(tier !== undefined && [1, 2, 3, 4].includes(tier)
            ? { tier: tier as 1 | 2 | 3 | 4 }
            : {}),
        ...(asString(data["approach"])
            ? { approach: asString(data["approach"]) }
            : {}),
        ...(asString(data["persona"])
            ? { persona: asString(data["persona"]) }
            : {}),
        ...(asString(r.last_enriched_at)
            ? { enrichedAt: asString(r.last_enriched_at) }
            : {}),
        ...(asString(data["notes"]) ? { notes: asString(data["notes"]) } : {}),
        signals,
        ...(asString(r.created_at) ? { created_at: asString(r.created_at) } : {}),
        ...(asString(r.updated_at) ? { updated_at: asString(r.updated_at) } : {})
    };
    return account;
}

/**
 * Translate a list of Supabase rows → list of Accounts, dropping
 * malformed entries silently (and reporting nothing — that's the
 * caller's concern).
 */
export function rowsToAccounts(
    rows: ReadonlyArray<Row<"signal_console_accounts">>
): ReadonlyArray<Account> {
    return rows.map(rowToAccount).filter((a): a is Account => a !== null);
}

/**
 * Translate an in-memory Account → Insert row. Used on first save
 * for legacy-id Accounts (pre-cloud-sync localStorage rows).
 *
 * Drops the Account.id from the insert payload — Supabase generates
 * the canonical uuid on insert.
 */
export function accountToInsert(
    account: Account
): InsertRow<"signal_console_accounts"> {
    return {
        account_key: accountKeyFromName(account.name),
        account_name: account.name,
        ...(account.domain ? { domain: account.domain } : {}),
        ...(account.ticker ? { ticker: account.ticker } : {}),
        ...(account.industry ? { industry: account.industry } : {}),
        // sector intentionally omitted — not in the in-memory shape
        ...(account.enrichedAt ? { last_enriched_at: account.enrichedAt } : {}),
        data: extractDataBlob(account) as Json
    };
}

/**
 * Translate an in-memory Account → Update row. Used when the Account
 * already has a uuid id from a prior cloud sync.
 */
export function accountToUpdate(
    account: Account
): UpdateRow<"signal_console_accounts"> {
    return {
        account_key: accountKeyFromName(account.name),
        account_name: account.name,
        domain: account.domain ?? null,
        ticker: account.ticker ?? null,
        industry: account.industry ?? null,
        last_enriched_at: account.enrichedAt ?? null,
        data: extractDataBlob(account) as Json
    };
}

/**
 * Build the `data` jsonb blob — everything that isn't a top-level
 * column. Pure function, exported for tests.
 */
export function extractDataBlob(account: Account): Record<string, unknown> {
    const blob: Record<string, unknown> = {};
    if (account.hq) blob["hq"] = account.hq;
    if (account.employees) blob["employees"] = account.employees;
    if (account.thesis) blob["thesis"] = account.thesis;
    if (account.tier !== undefined) blob["tier"] = account.tier;
    if (account.approach) blob["approach"] = account.approach;
    if (account.persona) blob["persona"] = account.persona;
    if (account.notes) blob["notes"] = account.notes;
    blob["signals"] = account.signals;
    return blob;
}
