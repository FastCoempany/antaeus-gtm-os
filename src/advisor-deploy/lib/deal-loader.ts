import { reportError } from "@/lib/observability";
import type { AdvisorDeal, DealAdvisorEntry } from "./types";

/**
 * Phase 4 / Room 10 Wave 5 — deal loader.
 *
 * Reads deals from `gtmos_deal_workspaces` (Phase 4 / Room 1's
 * Deal Workspace mirror) and projects each row into the AdvisorDeal
 * shape this room consumes. Tolerates camelCase + snake_case field
 * names since the legacy room writes both shapes interchangeably
 * (legacy line 124: `deal.accountName || deal.account_name || deal.name`).
 *
 * Defensive: malformed JSON / wrong shape / hostile types → empty
 * fallback, errors via reportError.
 */

const STORAGE_KEY = "gtmos_deal_workspaces";

interface StorageReader {
    getItem(key: string): string | null;
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
    return 0;
}

function pickString(
    o: Record<string, unknown>,
    ...keys: ReadonlyArray<string>
): string {
    for (const k of keys) {
        const v = o[k];
        if (typeof v === "string" && v.length > 0) return v;
    }
    return "";
}

function parseAdvisorHistory(v: unknown): ReadonlyArray<DealAdvisorEntry> {
    if (!Array.isArray(v)) return [];
    const out: DealAdvisorEntry[] = [];
    for (const row of v) {
        const r = asObject(row);
        if (!r) continue;
        const id = asString(r["id"]);
        if (!id) continue;
        const momentId = asString(r["momentId"]);
        out.push({
            id,
            advisorId: asString(r["advisorId"]),
            advisorName: asString(r["advisorName"]),
            momentId:
                momentId === "intro" ||
                momentId === "eb_bridge" ||
                momentId === "poc_stall" ||
                momentId === "procurement" ||
                momentId === "competitor" ||
                momentId === "champion_left" ||
                momentId === "budget_kill" ||
                momentId === "board_decision" ||
                momentId === "reference" ||
                momentId === "renewal"
                    ? momentId
                    : "intro",
            momentName: asString(r["momentName"]),
            outcome: asString(r["outcome"]) === "successful"
                ? "successful"
                : asString(r["outcome"]) === "engaged"
                  ? "engaged"
                  : asString(r["outcome"]) === "no_response"
                    ? "no_response"
                    : asString(r["outcome"]) === "declined"
                      ? "declined"
                      : asString(r["outcome"]) === "hold"
                        ? "hold"
                        : asString(r["outcome"]) === "reroute"
                          ? "reroute"
                          : "pending",
            createdAt: asString(r["createdAt"]),
            outcomeDate:
                typeof r["outcomeDate"] === "string"
                    ? r["outcomeDate"]
                    : null
        });
    }
    return out;
}

export function loadDeals(
    storage?: StorageReader | null
): ReadonlyArray<AdvisorDeal> {
    const s =
        storage !== undefined
            ? storage
            : typeof localStorage !== "undefined"
              ? localStorage
              : null;
    if (!s) return [];
    try {
        const raw = s.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const out: AdvisorDeal[] = [];
        for (const row of parsed) {
            const o = asObject(row);
            if (!o) continue;
            const id = asString(o["id"]);
            if (!id) continue;
            const accountName = pickString(
                o,
                "accountName",
                "account_name",
                "name"
            );
            if (!accountName) continue;
            out.push({
                id,
                accountName,
                stage: asString(o["stage"]) || "prospect",
                value: asNumber(o["value"]),
                nextStep: asString(o["nextStep"]),
                nextStepDate:
                    typeof o["nextStepDate"] === "string"
                        ? o["nextStepDate"]
                        : null,
                champion: pickString(o, "champion"),
                economicBuyer: pickString(
                    o,
                    "economicBuyer",
                    "economic_buyer"
                ),
                primaryContact: pickString(
                    o,
                    "primaryContact",
                    "primary_contact"
                ),
                buyer: pickString(o, "buyer"),
                decisionProcess: pickString(
                    o,
                    "decisionProcess",
                    "decision_process"
                ),
                advisorHistory: parseAdvisorHistory(o["advisorHistory"])
            });
        }
        return out;
    } catch (err) {
        reportError(err, { op: "advisor-deploy.loadDeals" });
        return [];
    }
}
