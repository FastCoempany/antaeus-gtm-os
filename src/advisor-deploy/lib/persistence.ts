import { reportError } from "@/lib/observability";
import {
    DEPLOYMENT_OUTCOMES,
    MOMENT_IDS,
    TIER_IDS,
    type Advisor,
    type Deployment,
    type DeploymentOutcome,
    type MomentId,
    type RelationshipState,
    type TierId
} from "./types";

/**
 * Phase 4 / Room 10 Wave 4 — persistence helpers.
 *
 * Two storage keys preserve the legacy envelope shapes:
 *   gtmos_advisor_registry      = { advisors: Advisor[] }
 *   gtmos_advisor_deployments   = { deployments: Deployment[] }
 *
 * Defensive parsers drop rows missing id; normalize unknown enums to
 * safe defaults; bubble errors through reportError() per CLAUDE.md
 * Part II.5 §2.
 */

const ADVISOR_KEY = "gtmos_advisor_registry";
const DEPLOYMENT_KEY = "gtmos_advisor_deployments";

const TIER_SET: ReadonlySet<string> = new Set(TIER_IDS);
const MOMENT_SET: ReadonlySet<string> = new Set(MOMENT_IDS);
const OUTCOME_SET: ReadonlySet<string> = new Set(DEPLOYMENT_OUTCOMES);
const RELATIONSHIPS: ReadonlyArray<RelationshipState> = [
    "active",
    "dormant",
    "lapsed"
];

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function getStorage(storage?: StorageLike | null): StorageLike | null {
    if (storage !== undefined) return storage;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asTier(v: unknown): TierId {
    return typeof v === "string" && TIER_SET.has(v) ? (v as TierId) : "t2";
}

function asMomentId(v: unknown): MomentId {
    return typeof v === "string" && MOMENT_SET.has(v)
        ? (v as MomentId)
        : "intro";
}

function asOutcome(v: unknown): DeploymentOutcome {
    return typeof v === "string" && OUTCOME_SET.has(v)
        ? (v as DeploymentOutcome)
        : "pending";
}

function asRelationship(v: unknown): RelationshipState {
    return typeof v === "string" &&
        (RELATIONSHIPS as ReadonlyArray<string>).includes(v)
        ? (v as RelationshipState)
        : "active";
}

function asStringArray(v: unknown): ReadonlyArray<string> {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

// ─── Advisors ───────────────────────────────────────────────────────────

function parseAdvisor(raw: unknown): Advisor | null {
    const r = asObject(raw);
    if (!r) return null;
    const id = asString(r["id"]);
    const name = asString(r["name"]);
    if (!id || !name) return null;
    return {
        id,
        name,
        title: asString(r["title"]),
        tier: asTier(r["tier"]),
        expertise: asString(r["expertise"]),
        equity: asString(r["equity"]),
        companies: asStringArray(r["companies"]),
        notes: asString(r["notes"]),
        relationship: asRelationship(r["relationship"]),
        createdAt: asString(r["createdAt"]) || new Date().toISOString()
    };
}

export function loadAdvisors(
    storage?: StorageLike | null
): ReadonlyArray<Advisor> {
    const s = getStorage(storage);
    if (!s) return [];
    try {
        const raw = s.getItem(ADVISOR_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed);
        if (!root) return [];
        const arr = Array.isArray(root["advisors"])
            ? (root["advisors"] as ReadonlyArray<unknown>)
            : [];
        const out: Advisor[] = [];
        for (const row of arr) {
            const a = parseAdvisor(row);
            if (a) out.push(a);
        }
        return out;
    } catch (err) {
        reportError(err, { op: "advisor-deploy.loadAdvisors" });
        return [];
    }
}

export function saveAdvisors(
    advisors: ReadonlyArray<Advisor>,
    storage?: StorageLike | null
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(ADVISOR_KEY, JSON.stringify({ advisors }));
    } catch (err) {
        reportError(err, { op: "advisor-deploy.saveAdvisors" });
    }
}

// ─── Deployments ────────────────────────────────────────────────────────

function parseDeployment(raw: unknown): Deployment | null {
    const r = asObject(raw);
    if (!r) return null;
    const id = asString(r["id"]);
    if (!id) return null;
    return {
        id,
        dealId: asString(r["dealId"]),
        dealName: asString(r["dealName"]),
        dealStage: asString(r["dealStage"]),
        advisorId: asString(r["advisorId"]),
        advisorName: asString(r["advisorName"]),
        momentId: asMomentId(r["momentId"]),
        momentName: asString(r["momentName"]),
        ask: asString(r["ask"]),
        forwardableNote: asString(r["forwardableNote"]),
        outcome: asOutcome(r["outcome"]),
        notes: asString(r["notes"]),
        createdAt: asString(r["createdAt"]) || new Date().toISOString(),
        outcomeDate:
            typeof r["outcomeDate"] === "string"
                ? r["outcomeDate"]
                : null
    };
}

export function loadDeployments(
    storage?: StorageLike | null
): ReadonlyArray<Deployment> {
    const s = getStorage(storage);
    if (!s) return [];
    try {
        const raw = s.getItem(DEPLOYMENT_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed);
        if (!root) return [];
        const arr = Array.isArray(root["deployments"])
            ? (root["deployments"] as ReadonlyArray<unknown>)
            : [];
        const out: Deployment[] = [];
        for (const row of arr) {
            const d = parseDeployment(row);
            if (d) out.push(d);
        }
        return out;
    } catch (err) {
        reportError(err, { op: "advisor-deploy.loadDeployments" });
        return [];
    }
}

export function saveDeployments(
    deployments: ReadonlyArray<Deployment>,
    storage?: StorageLike | null
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(DEPLOYMENT_KEY, JSON.stringify({ deployments }));
    } catch (err) {
        reportError(err, { op: "advisor-deploy.saveDeployments" });
    }
}

/** Stable id helper (mirrors legacy `uid(prefix)`). */
export function uid(prefix: string, now: number = Date.now()): string {
    return `${prefix}_${now}_${Math.random().toString(36).slice(2, 7)}`;
}
