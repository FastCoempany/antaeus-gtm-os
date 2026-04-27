import { reportError } from "@/lib/observability";
import type { LinkedDealSummary, Proof } from "./types";

/**
 * Phase 4 / Room 5 Wave 5 — deal sync layer.
 *
 * Two-way bridge with Phase 4 / Room 1's `gtmos_deal_workspaces` mirror:
 *
 *   loadDealsForLinking  — reads the mirror, projects to LinkedDealSummary
 *                          (id / name / stage / value) for the dropdown.
 *   syncProofIntoDeal    — writes a `.poc` snapshot back into the matching
 *                          deal record (legacy `syncPocIntoDeal` parity)
 *                          so the deal carries the proof state.
 *
 * Same defensive posture as the rest of Phase 4: malformed input →
 * empty fallback, hostile storage swallowed via reportError.
 */

const DEAL_KEY = "gtmos_deal_workspaces";

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

export function loadDealsForLinking(
    storage: Pick<Storage, "getItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<LinkedDealSummary> {
    if (!storage) return [];
    try {
        const raw = storage.getItem(DEAL_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((row): LinkedDealSummary | null => {
                const o = asObject(row);
                if (!o) return null;
                const id = asString(o.id);
                if (!id) return null;
                const accountName =
                    asString(o.accountName) ||
                    asString(o.account_name) ||
                    asString(o.name);
                if (!accountName) return null;
                const stage = asString(o.stage) || "prospect";
                const value = asNumber(o.value ?? o.deal_value ?? o.amount);
                return { id, accountName, stage, value };
            })
            .filter((d): d is LinkedDealSummary => d !== null);
    } catch (err) {
        reportError(err, { op: "poc-framework.loadDealsForLinking" });
        return [];
    }
}

/**
 * Snapshot stored in the deal's `.poc` property — small,
 * downstream-readable. Matches the shape the legacy `syncPocIntoDeal`
 * wrote (lines 366-375 of `app/poc-framework/index.html`).
 */
export interface DealPocSnapshot {
    readonly status: string;
    readonly score: number;
    readonly band: string;
    readonly readoutOwner: string;
    readonly durationDays: number;
    readonly successCriteria: string;
    readonly boundaries: string;
    readonly updatedAt: string;
}

function proofToSnapshot(proof: Proof): DealPocSnapshot {
    return {
        status: proof.outcome,
        score: proof.qualityScore,
        band: proof.qualityBand,
        readoutOwner: proof.readoutOwner,
        durationDays: proof.durationDays,
        successCriteria: proof.successCriteria,
        boundaries: proof.boundaries,
        updatedAt: proof.updatedAt
    };
}

/**
 * Write the proof snapshot back into the linked deal in
 * `gtmos_deal_workspaces[]`. No-op if the deal isn't found or the
 * proof has no linkedDealId. Best-effort — never throws.
 */
export function syncProofIntoDeal(
    proof: Proof,
    storage: StorageLike | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): void {
    if (!storage || !proof.linkedDealId) return;
    try {
        const raw = storage.getItem(DEAL_KEY);
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;
        const idx = parsed.findIndex((row) => {
            const o = asObject(row);
            return !!o && asString(o.id) === proof.linkedDealId;
        });
        if (idx === -1) return;
        const next = parsed.slice();
        const target = asObject(next[idx]);
        if (!target) return;
        next[idx] = { ...target, poc: proofToSnapshot(proof) };
        storage.setItem(DEAL_KEY, JSON.stringify(next));
    } catch (err) {
        reportError(err, { op: "poc-framework.syncProofIntoDeal" });
    }
}
