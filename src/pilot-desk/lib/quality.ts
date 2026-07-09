import type {
    HeatLabel,
    HeatLedger,
    HeatReading,
    LinkedDealSummary,
    MoldDiagnosis,
    ProofDraft,
    QualityBand
} from "./types";

/**
 * Phase 4 / Room 5 Wave 2 — quality engine.
 *
 * Faithful TypeScript port of the legacy `getPoCQuality` /
 * `heatLabel` / `heatColor` / `deriveMolds` (lines 137-180 of
 * `app/poc-framework/index.html`). No behavioral changes — same
 * inputs produce identical outputs.
 *
 * The room shapes one piece of pilot evidence the buyer's boss can
 * act on. Quality is derived from field completeness (account /
 * vendor / owner / success criteria / kill rules / linked deal).
 * Heat splits that into three dimensions (claim / owner / kill).
 * Weakest-mold picks the first failing gate so the operator knows
 * the next move.
 */

// ─── Helpers ──────────────────────────────────────────────────────────

function tx(v: string | undefined | null): string {
    return String(v ?? "").trim();
}

/**
 * Count newline-separated bullet lines in a textarea value. Matches
 * the legacy `countBulletLines` — splits on \n, trims each, drops
 * empties + single-character lines.
 */
export function countBulletLines(text: string | undefined | null): number {
    return tx(text)
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1).length;
}

function firstBullet(text: string | undefined | null, fallback: string): string {
    const lines = tx(text)
        .split(/\n+/)
        .map((s) => s.trim().replace(/^[-•*]\s+/, ""))
        .filter(Boolean);
    return lines[0] ?? fallback;
}

// ─── Heat ─────────────────────────────────────────────────────────────

export function heatLabel(value: number): HeatLabel {
    if (value >= 80) return "cast";
    if (value >= 55) return "hot";
    if (value >= 25) return "warming";
    return "cold";
}

const HEAT_COLOR: Record<HeatLabel, string> = {
    cast: "var(--poc-accent-green)",
    hot: "var(--poc-accent-orange)",
    warming: "var(--poc-accent-blue)",
    cold: "#8fa0b8"
};

export function heatColor(value: number): string {
    return HEAT_COLOR[heatLabel(value)];
}

function reading(value: number): HeatReading {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    return {
        value: clamped,
        label: heatLabel(clamped),
        color: heatColor(clamped)
    };
}

export interface HeatInputs {
    readonly successCount: number;
    readonly boundaryCount: number;
    readonly hasAccount: boolean;
    readonly hasOwner: boolean;
    readonly linkedDealOwner: string | null;
}

export function computeHeat(inputs: HeatInputs): HeatLedger {
    const claim = Math.min(
        100,
        inputs.successCount * 28 + (inputs.hasAccount ? 16 : 0)
    );
    const owner = inputs.hasOwner ? 100 : inputs.linkedDealOwner ? 72 : 18;
    const kill = Math.min(100, inputs.boundaryCount * 38);
    return {
        claim: reading(claim),
        owner: reading(owner),
        kill: reading(kill)
    };
}

// ─── Weakest mold ─────────────────────────────────────────────────────

const WEAKEST_MAP: Record<string, MoldDiagnosis> = {
    account: {
        id: "account",
        title: "Account",
        copy: "Name the account before scoping the evidence."
    },
    owner: {
        id: "owner",
        title: "Owner",
        copy: "Name the readout owner before the pilot starts."
    },
    metric: {
        id: "metric",
        title: "Metric",
        copy: "Add at least three pass/fail criteria."
    },
    kill_rule: {
        id: "kill_rule",
        title: "Kill rule",
        copy: "Define when the PoC stops."
    },
    readout: {
        id: "readout",
        title: "Readout",
        copy: "Carry the evidence into the decision meeting."
    }
};

export interface WeakestInputs {
    readonly hasAccount: boolean;
    readonly hasOwner: boolean;
    readonly successCount: number;
    readonly boundaryCount: number;
}

export function weakestMold(inputs: WeakestInputs): MoldDiagnosis {
    if (!inputs.hasAccount) return WEAKEST_MAP.account!;
    if (!inputs.hasOwner) return WEAKEST_MAP.owner!;
    if (inputs.successCount < 3) return WEAKEST_MAP.metric!;
    if (inputs.boundaryCount < 2) return WEAKEST_MAP.kill_rule!;
    return WEAKEST_MAP.readout!;
}

// ─── Quality score + band ─────────────────────────────────────────────

const BAND_TITLE: Record<QualityBand, string> = {
    ready: "The evidence is ready. The buyer's boss could act on this.",
    workable: "The evidence is hot, but the buyer can't carry it into the room yet.",
    thin: "There's interest, but you can't take this to the buyer's boss yet."
};

const BAND_LABEL: Record<QualityBand, string> = {
    ready: "Cast",
    workable: "Hot",
    thin: "Thin"
};

export interface QualitySummary {
    readonly score: number;
    readonly band: QualityBand;
    readonly bandLabel: string;
    readonly title: string;
    readonly weakest: MoldDiagnosis;
    readonly heat: HeatLedger;
    readonly successCount: number;
    readonly boundaryCount: number;
    readonly hasAccount: boolean;
    readonly hasOwner: boolean;
}

/**
 * Compute the full quality summary for a draft + linked deal.
 * Faithful port of the legacy `getPoCQuality()`.
 */
export function computeQuality(
    drft: ProofDraft,
    linkedDeal: LinkedDealSummary | null
): QualitySummary {
    const successCount = countBulletLines(drft.successCriteria);
    const boundaryCount = countBulletLines(drft.boundaries);
    const hasVendor = !!tx(drft.vendor);
    const hasAccount = !!tx(drft.account);
    const hasOwner = !!tx(drft.readoutOwner);

    let score = 0;
    if (hasVendor) score += 10;
    if (hasAccount) score += 10;
    score += Math.min(successCount, 4) * 10;
    score += Math.min(boundaryCount, 3) * 8;
    if (hasOwner) score += 16;
    if (linkedDeal) score += 10;
    if (linkedDeal && (linkedDeal.stage === "poc" || linkedDeal.stage === "proposal")) {
        score += 4;
    }
    score = Math.min(100, score);

    const band: QualityBand =
        score >= 80 ? "ready" : score >= 60 ? "workable" : "thin";

    const heat = computeHeat({
        successCount,
        boundaryCount,
        hasAccount,
        hasOwner,
        linkedDealOwner: null
    });

    const weakest = weakestMold({
        hasAccount,
        hasOwner,
        successCount,
        boundaryCount
    });

    return {
        score,
        band,
        bandLabel: BAND_LABEL[band],
        title: BAND_TITLE[band],
        weakest,
        heat,
        successCount,
        boundaryCount,
        hasAccount,
        hasOwner
    };
}

// ─── Mold grid (5 cards on the cast side) ─────────────────────────────

export type MoldState = "cast" | "hot" | "cold" | "red";

export interface MoldRow {
    readonly label: string;
    readonly value: string;
    readonly state: MoldState;
}

export function deriveMolds(
    drft: ProofDraft,
    quality: QualitySummary
): ReadonlyArray<MoldRow> {
    const owner =
        tx(drft.readoutOwner) || "No readout owner";
    return [
        {
            label: "Claim",
            value: firstBullet(drft.successCriteria, "Name the evidence claim"),
            state: quality.successCount > 0 ? "hot" : "red"
        },
        {
            label: "Baseline",
            value:
                quality.successCount >= 2
                    ? "Criteria can be tested."
                    : "Current state is not measurable.",
            state: quality.successCount >= 2 ? "cast" : "cold"
        },
        {
            label: "Owner",
            value: owner,
            state: quality.hasOwner ? "cast" : "red"
        },
        {
            label: "Metric",
            value:
                quality.successCount >= 3
                    ? `${quality.successCount} pass/fail criteria`
                    : "Need 3 criteria",
            state: quality.successCount >= 3 ? "cast" : "hot"
        },
        {
            label: "Kill",
            value:
                quality.boundaryCount >= 2
                    ? `${quality.boundaryCount} stop rules`
                    : "Kill rule too soft",
            state: quality.boundaryCount >= 2 ? "cast" : "red"
        }
    ];
}

// ─── Ingot read (Program 6 / PR 14 — Proof Foundry V03) ───────────────

/**
 * buildIngotRead — synthesize the 5-mold state into a 2-3 clause
 * read so the operator gets a single-glance view of what's hot vs
 * what's empty, mirroring the picked-winner Variant 03 / Proof
 * Foundry wireframe sentence: "The buyer pain is hot. The metric
 * mold is usable. The authority mold is empty."
 *
 * Pure: takes the mold rows and returns one string of 1-3 clauses
 * separated by sentences. Never throws; returns the empty-board
 * copy when no molds have advanced past `cold`.
 *
 * State → reading word:
 *   cast → "locked"
 *   hot  → "hot"
 *   cold → "empty"
 *   red  → "broken"
 */
const STATE_WORD: Readonly<Record<MoldState, string>> = {
    cast: "locked",
    hot: "hot",
    cold: "empty",
    red: "broken"
};

export function buildIngotRead(molds: ReadonlyArray<MoldRow>): string {
    if (molds.length === 0) {
        return "No molds yet — start the forge.";
    }
    const cast = molds.filter((m) => m.state === "cast");
    const hot = molds.filter((m) => m.state === "hot");
    const cold = molds.filter((m) => m.state === "cold");
    const red = molds.filter((m) => m.state === "red");

    // All locked → ready to carry.
    if (cast.length === molds.length) {
        return "All five molds are locked. The evidence is ready — the buyer's boss could act on this.";
    }
    // Nothing started → empty foundry.
    if (cast.length === 0 && hot.length === 0) {
        return "All five molds are still empty. The evidence has not been forged yet.";
    }

    const clauses: string[] = [];

    // Lead with the strongest molds (locked + hot), then the weakest
    // (broken + empty). Cap at 3 clauses to keep the read scannable.
    if (cast.length >= 2) {
        const names = cast.slice(0, 2).map((m) => m.label.toLowerCase());
        clauses.push(`${capitalize(names.join(" and "))} molds are locked.`);
    } else if (cast.length === 1) {
        clauses.push(`The ${cast[0]!.label.toLowerCase()} mold is locked.`);
    }

    if (hot.length === 1) {
        clauses.push(`The ${hot[0]!.label.toLowerCase()} mold is hot.`);
    } else if (hot.length >= 2) {
        const names = hot.slice(0, 2).map((m) => m.label.toLowerCase());
        clauses.push(`${capitalize(names.join(" and "))} molds are hot.`);
    }

    // Add ONE weakness clause — the broken / empty mold the operator
    // most needs to harden next. Prefer red (broken) over cold (empty).
    const weakest = red[0] ?? cold[0] ?? null;
    if (weakest && clauses.length < 3) {
        clauses.push(
            `The ${weakest.label.toLowerCase()} mold is ${STATE_WORD[weakest.state]}.`
        );
    }

    return clauses.join(" ");
}

function capitalize(s: string): string {
    if (s.length === 0) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}
