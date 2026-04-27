import { reportError } from "@/lib/observability";
import {
    MAX_PROOF_HISTORY,
    type LinkedDealSummary,
    type Outcome,
    type Proof,
    type ProofDocs,
    type ProofDraft,
    type QualityBand
} from "./types";
import { computeQuality } from "./quality";
import { generateDocs } from "./docs";

/**
 * Phase 4 / Room 5 Wave 4 — PoC persistence.
 *
 * `gtmos_poc_data` is the canonical key (matches legacy + the
 * `js/proof-layer.js` reader). Shape:
 *
 *   { pocs: Proof[] }   // most-recent first; capped at MAX_PROOF_HISTORY
 *
 * Same defensive posture as Phase 4 Rooms 1-4: malformed JSON →
 * empty list, hostile storage → swallowed via reportError.
 *
 * Wave 5 will add the deal sync-back (writing `.poc` into
 * `gtmos_deal_workspaces[]`).
 */

export const STORAGE_KEY = "gtmos_poc_data";

interface PersistedShape {
    readonly pocs?: ReadonlyArray<Proof>;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asArray(v: unknown): ReadonlyArray<unknown> {
    return Array.isArray(v) ? v : [];
}

function asString(v: unknown): string | undefined {
    return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asNumberOr(v: unknown, fallback: number): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    return fallback;
}

const VALID_BANDS: ReadonlySet<string> = new Set(["thin", "workable", "ready"]);
const VALID_OUTCOMES: ReadonlySet<string> = new Set([
    "not_started",
    "in_progress",
    "converted",
    "failed"
]);

function parseProof(raw: unknown): Proof | null {
    const o = asObject(raw);
    if (!o) return null;
    const id = asString(o.id);
    const account = asString(o.account);
    if (!id || !account) return null;

    const docsRaw = asObject(o.docs) ?? {};
    const docs: ProofDocs = {
        scope: asString(docsRaw.scope) ?? "",
        kickoff: asString(docsRaw.kickoff) ?? "",
        readout: asString(docsRaw.readout) ?? "",
        email: asString(docsRaw.email) ?? ""
    };

    const durationDays = asNumberOr(o.durationDays, 7) === 14 ? 14 : 7;
    const outcome: Outcome = VALID_OUTCOMES.has(String(o.outcome))
        ? (o.outcome as Outcome)
        : "not_started";
    const qualityBand: QualityBand = VALID_BANDS.has(String(o.qualityBand))
        ? (o.qualityBand as QualityBand)
        : "thin";

    return {
        id,
        account,
        vendor: asString(o.vendor) ?? "",
        readoutOwner: asString(o.readoutOwner) ?? "",
        linkedDealId: asString(o.linkedDealId) ?? "",
        linkedDealName: asString(o.linkedDealName) ?? "",
        durationDays,
        outcome,
        successCriteria: asString(o.successCriteria) ?? "",
        boundaries: asString(o.boundaries) ?? "",
        qualityScore: asNumberOr(o.qualityScore, 0),
        qualityBand,
        docs,
        updatedAt: asString(o.updatedAt) ?? new Date().toISOString()
    };
}

export function loadProofs(
    storage: Pick<Storage, "getItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<Proof> {
    if (!storage) return [];
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed) as PersistedShape | null;
        const arr = asArray(root?.pocs);
        return arr.map(parseProof).filter((p): p is Proof => p !== null);
    } catch (err) {
        reportError(err, { op: "poc-framework.loadProofs" });
        return [];
    }
}

export function saveProofs(
    proofs: ReadonlyArray<Proof>,
    storage: Pick<Storage, "setItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): void {
    if (!storage) return;
    try {
        // Cap history; most-recent first
        const capped = proofs.slice(0, MAX_PROOF_HISTORY);
        storage.setItem(STORAGE_KEY, JSON.stringify({ pocs: capped }));
    } catch (err) {
        reportError(err, { op: "poc-framework.saveProofs" });
    }
}

/**
 * Build a Proof entry from the current draft + linked deal. Computes
 * quality + docs at save-time so the persisted record carries the
 * snapshot, not just the inputs.
 */
export function freezeDraftIntoProof(
    drft: ProofDraft,
    linkedDeal: LinkedDealSummary | null,
    options: { readonly now?: number; readonly id?: string } = {}
): Proof {
    const now = options.now ?? Date.now();
    const quality = computeQuality(drft, linkedDeal);
    const docs = generateDocs(drft, linkedDeal, { now });
    const slug = (drft.account || "untitled")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const id = options.id ?? `${slug || "proof"}-${now}`;
    return {
        id,
        account: drft.account,
        vendor: drft.vendor,
        readoutOwner: drft.readoutOwner,
        linkedDealId: drft.linkedDealId,
        linkedDealName: linkedDeal?.accountName ?? "",
        durationDays: drft.durationDays,
        outcome: drft.outcome,
        successCriteria: drft.successCriteria,
        boundaries: drft.boundaries,
        qualityScore: quality.score,
        qualityBand: quality.band,
        docs,
        updatedAt: new Date(now).toISOString()
    };
}
