import type { LearningEntry, Negotiation } from "./types";

/**
 * Negotiation persistence — localStorage layer.
 *
 * Cloud-sync follows the same template the other Phase 4 rooms used
 * (a follow-up PR after the room ships, mirroring to a Supabase
 * `studio_artifacts` row with `kind='negotiation'`). For now: local
 * mirror with the same key name the legacy `antaeus_studio_cfo_v2`
 * room used, retitled to `gtmos_negotiation`.
 */

const NEGOTIATIONS_KEY = "gtmos_negotiation";
const LEARNINGS_KEY = "gtmos_negotiation_learnings";

interface StorageLike {
    getItem(k: string): string | null;
    setItem(k: string, v: string): void;
}

function storage(): StorageLike | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

function parse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function loadNegotiations(): ReadonlyArray<Negotiation> {
    const s = storage();
    if (!s) return [];
    const data = parse(s.getItem(NEGOTIATIONS_KEY), { negotiations: [] }) as {
        negotiations: ReadonlyArray<Negotiation>;
    };
    return Array.isArray(data.negotiations) ? data.negotiations : [];
}

export function saveNegotiations(
    negotiations: ReadonlyArray<Negotiation>
): void {
    const s = storage();
    if (!s) return;
    try {
        s.setItem(NEGOTIATIONS_KEY, JSON.stringify({ negotiations }));
    } catch {
        // ignore quota
    }
}

export function loadLearnings(): ReadonlyArray<LearningEntry> {
    const s = storage();
    if (!s) return [];
    const data = parse(s.getItem(LEARNINGS_KEY), { learnings: [] }) as {
        learnings: ReadonlyArray<LearningEntry>;
    };
    return Array.isArray(data.learnings) ? data.learnings : [];
}

export function saveLearnings(
    learnings: ReadonlyArray<LearningEntry>
): void {
    const s = storage();
    if (!s) return;
    try {
        s.setItem(LEARNINGS_KEY, JSON.stringify({ learnings }));
    } catch {
        // ignore
    }
}
