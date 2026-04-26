import type { CommandFamily, RawCommandCard, CommandEngineInput, HealthSummaries } from "./types";

/**
 * Pure helpers for the command-intelligence engine.
 *
 * Faithful port of the parser + signal-profile section of the legacy
 * `js/command-intelligence.js`. No behavioral changes — same numeric
 * inputs produce the same outputs.
 */

export function tx(value: unknown): string {
    return String(value ?? "").trim();
}

export function slug(value: unknown): string {
    return (
        tx(value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "item"
    );
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function pushReason(list: string[], reason: string): void {
    const next = tx(reason);
    if (!next) return;
    if (list.indexOf(next) >= 0) return;
    list.push(next);
}

export function parseNumber(source: unknown): number {
    const match = String(source ?? "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
}

export function parseRisk(card: RawCommandCard | null | undefined): number {
    return clamp(parseNumber(card?.badge), 0, 100);
}

export function parseHeat(card: RawCommandCard | null | undefined): number {
    const meta = Array.isArray(card?.meta) ? card!.meta : [];
    for (let i = 0; i < meta.length; i++) {
        if (/heat/i.test(meta[i]!)) return clamp(parseNumber(meta[i]), 0, 100);
    }
    return 0;
}

export function parseStaleDays(card: RawCommandCard | null | undefined): number {
    const meta = Array.isArray(card?.meta) ? card!.meta : [];
    for (let i = 0; i < meta.length; i++) {
        if (/stale/i.test(meta[i]!)) return clamp(parseNumber(meta[i]), 0, 365);
    }
    return 0;
}

export function parseMoney(card: RawCommandCard | null | undefined): number {
    const meta = Array.isArray(card?.meta) ? card!.meta : [];
    for (let i = 0; i < meta.length; i++) {
        if (/\$/.test(meta[i]!)) return clamp(parseNumber(meta[i]), 0, 100000000);
    }
    return 0;
}

export function hasAction(
    card: RawCommandCard | null | undefined,
    pattern: RegExp
): boolean {
    const actions = Array.isArray(card?.actions) ? card!.actions : [];
    return actions.some((action) => pattern.test(String(action?.label ?? "")));
}

export function countActions(card: RawCommandCard | null | undefined): number {
    const actions = Array.isArray(card?.actions) ? card!.actions : [];
    return actions.length;
}

export function normalizeTone(
    card: { badgeTone?: string } | null | undefined,
    family: CommandFamily | string
): string {
    if (card?.badgeTone) return card.badgeTone;
    if (family === "risk") return "state-risk";
    if (family === "system") return "state-risk";
    if (family === "icp") return "state-ready";
    return "state-live";
}

export function familyPriority(family: string): number {
    if (family === "risk") return 5;
    if (family === "advisor") return 4;
    if (family === "opportunity") return 4;
    if (family === "move") return 3;
    if (family === "icp") return 2;
    if (family === "system") return 1;
    return 0;
}

export function roomFamilyLabel(family: string): string {
    if (family === "risk") return "Pipeline";
    if (family === "advisor") return "Leverage";
    if (family === "opportunity") return "Motion";
    if (family === "move") return "Command";
    if (family === "icp") return "Truth";
    if (family === "system") return "System";
    return "Command";
}

export function amountPressure(amount: number): number {
    if (amount >= 1000000) return 16;
    if (amount >= 500000) return 13;
    if (amount >= 250000) return 10;
    if (amount >= 100000) return 7;
    if (amount > 0) return 3;
    return 0;
}

// ─── Signal access ──────────────────────────────────────────────────────

type Bag = Record<string, unknown> | null | undefined;

export function readSignals(card: RawCommandCard | null | undefined): Bag {
    return card?.rankingSignals && typeof card.rankingSignals === "object"
        ? (card.rankingSignals as Record<string, unknown>)
        : {};
}

export function signalNumber(
    bag: Bag,
    key: string,
    fallback: number,
    min: number,
    max: number
): number {
    const v = bag ? bag[key] : undefined;
    if (v !== undefined && v !== null && v !== "") {
        return clamp(parseNumber(v), min, max);
    }
    return fallback;
}

export function signalBool(bag: Bag, key: string, fallback: boolean): boolean {
    const v = bag ? bag[key] : undefined;
    if (v !== undefined && v !== null) return !!v;
    return !!fallback;
}

export function signalText(bag: Bag, key: string, fallback: string): string {
    const v = bag ? bag[key] : undefined;
    return tx(v !== undefined && v !== null ? v : fallback);
}

export function readHealthSummary(
    input: CommandEngineInput,
    key: keyof HealthSummaries
): Bag {
    const summaries =
        input.healthSummaries && typeof input.healthSummaries === "object"
            ? (input.healthSummaries as Record<string, unknown>)
            : {};
    const summary = summaries[key];
    return summary && typeof summary === "object"
        ? (summary as Record<string, unknown>)
        : null;
}

export function summaryNumber(
    bag: Bag,
    key: string,
    fallback: number,
    min: number,
    max: number
): number {
    return signalNumber(bag, key, fallback, min, max);
}

export function summaryBool(bag: Bag, key: string, fallback: boolean): boolean {
    return signalBool(bag, key, fallback);
}

export function summaryText(bag: Bag, key: string, fallback: string): string {
    return signalText(bag, key, fallback);
}

export function formatCauseLabel(causeId: string): string {
    const label = tx(causeId).replace(/_/g, " ");
    if (!label) return "";
    if (label === "no nextstep") return "next step missing";
    if (label === "stale thread") return "thread stale";
    if (label === "no champion") return "champion missing";
    if (label === "champion weak") return "champion weak";
    if (label === "no eb") return "economic buyer missing";
    if (label === "no process") return "process unclear";
    if (label === "impact not real") return "impact vague";
    if (label === "usecase blurry") return "use case blurry";
    if (label === "single threaded") return "single-threaded";
    if (label === "next step overdue") return "next step overdue";
    return label;
}

export function testCardText(
    card: RawCommandCard | null | undefined,
    pattern: RegExp
): boolean {
    const meta = Array.isArray(card?.meta) ? card!.meta.join(" ") : "";
    const source = [
        tx(card?.title),
        // legacy also reads card.copy; RawCommandCard exposes it via index
        tx((card as unknown as { copy?: string })?.copy),
        meta
    ].join(" ");
    return pattern.test(source);
}
