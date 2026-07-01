import type { AutopsyDoc, CauseId, Vitals } from "./types";
import { topCauses } from "./causes";
import {
    chapterFor,
    chooseTasks,
    stageLead,
    stageWinLead,
    winConditionsFor
} from "./autopsy-data";
import { DEFAULT_PREFS, type ComputedVitals, type Prefs } from "./vitals";

/**
 * Phase 4 / Room 4 Wave 3 — autopsy generator.
 *
 * Orchestrates the legacy `generateAutopsy(v)` pipeline (lines
 * 1860-1917 of app/future-autopsy/index.html):
 *   1. topCauses(vitals)            — failure patterns from cause engine
 *   2. chapterFor(cause)            — narrative line per cause (CHAPTERS)
 *   3. winConditionsFor(causes)     — mirror win conditions, padded to 5
 *   4. stageLead + cause variation  — lose-side narrative (with tail)
 *   5. stageWinLead                  — win-side narrative (with tail)
 *   6. chooseTasks                   — top countermeasure docket
 *   7. killSwitchFor                 — recommended-kill heuristic
 *
 * Returns the typed AutopsyDoc that Wave 4's PinnedCase + Wave 5's
 * route rack consume.
 */

export interface GenerateOptions {
    readonly prefs?: Prefs;
    readonly horizonDays?: number;
}

const STORY_MAX = 700;

function clip(s: string, max = STORY_MAX): string {
    return s.length > max ? s.slice(0, max) : s;
}

export function generateAutopsy(
    vitals: ComputedVitals,
    options: GenerateOptions = {}
): AutopsyDoc {
    const prefs = options.prefs ?? DEFAULT_PREFS;
    const horizonDays = options.horizonDays ?? prefs.autopsyHorizonDays;

    const causes = topCauses(vitals, prefs, 5);
    const chapters = causes
        .map((c) => chapterFor(c.id))
        .filter((c): c is NonNullable<ReturnType<typeof chapterFor>> => c !== null);
    const winConditions = winConditionsFor(causes);
    const countermeasures = chooseTasks(vitals, causes, {
        highValueUSD: prefs.highValueUSD
    });

    const topCauseId: CauseId | "" = causes[0]?.id ?? "";
    const loseLead = stageLead(vitals.stageRaw, topCauseId);
    const winLead = stageWinLead(vitals.stageRaw);

    const loseTail =
        causes.length > 0
            ? " Key failure pattern: " +
                  causes
                      .slice(0, 3)
                      .map((c) => (c.label ?? c.id).toLowerCase())
                      .join(" ") +
                  " The loss was not dramatic; it was procedural, then inevitable."
            : "";
    const winTail =
        " Key win pattern: " +
        winConditions
            .slice(0, 3)
            .map((w) => w.story)
            .join(" ") +
        " You forced the evidence early, so the close became an execution step, not a hope exercise.";

    return {
        deal: vitals as Vitals,
        horizonDays,
        causes,
        chapters,
        winConditions,
        countermeasures,
        killSwitch: killSwitchFor(vitals, prefs),
        loseStory: clip(loseLead + loseTail),
        winStory: clip(winLead + winTail)
    };
}

/**
 * Recommend abandoning the deal when value is low + thread is critically
 * stale + qualification is weak + risk is high. Faithful port of the
 * legacy `killSwitch(v)` (line 1851-1858).
 */
export function killSwitchFor(
    vitals: ComputedVitals,
    prefs: Prefs = DEFAULT_PREFS
): string {
    const recommended =
        vitals.value <= prefs.killValueUSD &&
        vitals.staleDays >= prefs.staleCriticalDays &&
        vitals.qualScore <= 6 &&
        vitals.riskScore >= 70;
    if (recommended) {
        return "Low value + stale + weak qualification + high risk — recommend closing this out.";
    }
    return "Criteria not fully met for kill switch.";
}

/**
 * Universe ranker — the legacy `autopsyUniverseScore` from
 * `app/future-autopsy/index.html` lines 1959-1966.
 */
export function autopsyUniverseScore(
    vitals: ComputedVitals,
    prefs: Prefs = DEFAULT_PREFS
): number {
    let score = 2 * vitals.riskScore + Math.min(vitals.staleDays, 60);
    if (vitals.value >= prefs.highValueUSD) score += 20;
    if (vitals.stageRaw === "negotiation" || vitals.stageRaw === "verbal") {
        score += 10;
    }
    if (vitals.qualScore <= 6) score += 8;
    return score;
}

/**
 * Rank the full vitals list and return the top N pinned cases. Closed
 * deals filtered. Stable on ties via input index.
 */
export function rankAutopsyUniverse(
    vitals: ReadonlyArray<ComputedVitals>,
    options: { readonly limit?: number; readonly prefs?: Prefs } = {}
): ReadonlyArray<ComputedVitals> {
    const prefs = options.prefs ?? DEFAULT_PREFS;
    const limit = options.limit ?? 6;
    const open = vitals.filter((v) => !v.isClosed);
    const scored = open.map((v, i) => ({
        v,
        i,
        score: autopsyUniverseScore(v, prefs)
    }));
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.i - b.i;
    });
    return scored.slice(0, limit).map((s) => s.v);
}
