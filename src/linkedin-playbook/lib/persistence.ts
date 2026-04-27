import { reportError } from "@/lib/observability";
import {
    ACTION_TYPES,
    OUTCOMES,
    type ActionEntry,
    type ActionType,
    type Outcome
} from "./types";

/**
 * Phase 4 / Room 8 Wave 4 — persistence helpers.
 *
 * `gtmos_linkedin_log` stores the LinkedIn touch history under the legacy
 * `{actions: [...]}` envelope shape (line 103 of
 * `app/linkedin-playbook/index.html`). Defensive parser drops malformed
 * rows, normalizes unknown action / outcome enums to safe defaults,
 * preserves valid rows verbatim. Errors bubble through reportError().
 */

const ACTIONS_KEY = "gtmos_linkedin_log";

const ACTION_TYPE_SET: ReadonlySet<string> = new Set(ACTION_TYPES);
const OUTCOME_SET: ReadonlySet<string> = new Set(OUTCOMES);

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function getStorage(storage?: StorageLike | null): StorageLike | null {
    if (storage !== undefined) return storage;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asActionType(v: unknown): ActionType | null {
    return typeof v === "string" && ACTION_TYPE_SET.has(v)
        ? (v as ActionType)
        : null;
}

function asOutcome(v: unknown): Outcome | null {
    return typeof v === "string" && OUTCOME_SET.has(v)
        ? (v as Outcome)
        : null;
}

function asTemperature(v: unknown): ActionEntry["temperature"] {
    return v === "cool" || v === "warm" || v === "hot"
        ? v
        : "ice_cold";
}

function asMotionKey(v: unknown): ActionEntry["motionKey"] {
    return v === "warm_signal_account" ||
        v === "convert_connection" ||
        v === "add_air_cover" ||
        v === "credibility"
        ? v
        : "credibility";
}

function parseEntry(raw: unknown): ActionEntry | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = asString(r["id"]);
    const actionType = asActionType(r["actionType"]);
    if (!id || !actionType) return null;
    return {
        id,
        accountName: asString(r["accountName"]),
        contactName: asString(r["contactName"]),
        actionType,
        temperature: asTemperature(r["temperature"]),
        content: asString(r["content"]),
        motionKey: asMotionKey(r["motionKey"]),
        motionLabel: asString(r["motionLabel"]),
        cueLabel: asString(r["cueLabel"]),
        whyNow: asString(r["whyNow"]),
        recommendedNext: asString(r["recommendedNext"]),
        outcome: asOutcome(r["outcome"]),
        outcomeDate:
            typeof r["outcomeDate"] === "string"
                ? r["outcomeDate"]
                : null,
        createdAt:
            typeof r["createdAt"] === "string"
                ? r["createdAt"]
                : new Date().toISOString()
    };
}

export function loadActions(
    storage?: StorageLike | null
): ReadonlyArray<ActionEntry> {
    const s = getStorage(storage);
    if (!s) return [];
    try {
        const raw = s.getItem(ACTIONS_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return [];
        const arr = (parsed as { actions?: unknown }).actions;
        if (!Array.isArray(arr)) return [];
        const out: ActionEntry[] = [];
        for (const row of arr) {
            const entry = parseEntry(row);
            if (entry) out.push(entry);
        }
        return out;
    } catch (err) {
        reportError(err, { op: "linkedin-playbook.loadActions" });
        return [];
    }
}

export function saveActions(
    entries: ReadonlyArray<ActionEntry>,
    storage?: StorageLike | null
): void {
    const s = getStorage(storage);
    if (!s) return;
    try {
        s.setItem(ACTIONS_KEY, JSON.stringify({ actions: entries }));
    } catch (err) {
        reportError(err, { op: "linkedin-playbook.saveActions" });
    }
}
