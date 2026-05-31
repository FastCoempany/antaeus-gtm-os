import type { ObservationView } from "@/lib/observations/types";

/**
 * Display-side filter for the "this week's reads" Dashboard card.
 *
 * The deal_decay generator always fires at the most-sensitive
 * threshold (≥ 7 days at the same stage; ADR-009 §"Dashboard card
 * with 14/7 display filter"). The Dashboard card filters the resulting
 * observations down by a SEPARATE display threshold the operator can
 * toggle inline (14d default, 7d when they want more sensitivity).
 *
 * This module is the parser: pull the "N days" out of an observation
 * text like "Acme has been at negotiation for 21 days with no dated
 * next step" and use that to compare against the display threshold.
 *
 * Generators other than deal_decay don't have a day-count component
 * (signal_decay has one, but it's not the same shape; the toggle is
 * deal-decay-specific). The filter pass-through is: observations
 * whose text doesn't parse as deal-decay are NEVER filtered out by
 * the threshold. Only deal_decay rows obey the toggle.
 */

export const DEAL_DECAY_GENERATOR_ID = "phase-b/deal-decay";

export type DecayThresholdDays = 7 | 14;
export const DEFAULT_DECAY_THRESHOLD: DecayThresholdDays = 14;
const VALID_THRESHOLDS: ReadonlyArray<DecayThresholdDays> = [7, 14];

const DAY_COUNT_RE = /\bfor (\d+) days?\b/i;

/**
 * Pull the day-count out of a deal-decay observation text. Returns
 * null if the text doesn't match the deal-decay shape.
 */
export function parseDealDecayDays(text: string): number | null {
    const m = DAY_COUNT_RE.exec(text);
    if (!m) return null;
    const n = Number.parseInt(m[1]!, 10);
    return Number.isFinite(n) ? n : null;
}

export function filterByDecayThreshold(
    observations: ReadonlyArray<ObservationView>,
    threshold: DecayThresholdDays
): ReadonlyArray<ObservationView> {
    return observations.filter((o) => {
        if (o.sourceGenerator !== DEAL_DECAY_GENERATOR_ID) return true;
        const days = parseDealDecayDays(o.observationText);
        if (days === null) return true; // ambiguous shape → keep
        return days >= threshold;
    });
}

// ─── localStorage persistence of the toggle ────────────────────────────

export const THRESHOLD_STORAGE_KEY = "gtmos_dashboard_decay_threshold";

export function loadStoredThreshold(): DecayThresholdDays {
    if (typeof localStorage === "undefined") return DEFAULT_DECAY_THRESHOLD;
    try {
        const raw = localStorage.getItem(THRESHOLD_STORAGE_KEY);
        if (!raw) return DEFAULT_DECAY_THRESHOLD;
        const parsed = Number.parseInt(raw, 10);
        if (
            !Number.isFinite(parsed) ||
            !VALID_THRESHOLDS.includes(parsed as DecayThresholdDays)
        ) {
            return DEFAULT_DECAY_THRESHOLD;
        }
        return parsed as DecayThresholdDays;
    } catch {
        return DEFAULT_DECAY_THRESHOLD;
    }
}

export function saveStoredThreshold(t: DecayThresholdDays): void {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(THRESHOLD_STORAGE_KEY, String(t));
    } catch {
        // Quota exceeded or storage disabled — fine, the user's
        // choice doesn't persist but the session UI still works.
    }
}
