import { reportError } from "@/lib/observability";
import type {
    DealAdvisorEntry,
    Deployment,
    DeploymentOutcome
} from "./types";

/**
 * Phase 4 / Room 10 Wave 5 — sync deployment back into the deal mirror.
 *
 * Faithful TypeScript port of legacy `syncDeploymentToDeal` (lines
 * 478-512). On every logged or updated deployment, the room mirrors a
 * `DealAdvisorEntry` into the matching deal row in `gtmos_deal_workspaces`
 * and updates the deal's nextStep / nextStepDate based on the outcome.
 *
 * Outcome → nextStep mapping (legacy lines 499-510):
 *   pending      → 'Send advisor ask and book the follow-up thread'
 *                  (only set when nextStep is currently empty); +3d
 *   engaged      → 'Convert advisor momentum into the next stakeholder
 *                   step'; +3d
 *   successful   → same nextStep as engaged; +2d
 *   declined     → 'Choose the next leverage path without waiting on
 *   no_response   this advisor thread'; +4d
 *   hold
 *   reroute
 *
 * Pure: takes the storage interface explicitly so tests pass an in-memory
 * stub and assert the wire shape directly.
 */

const STORAGE_KEY = "gtmos_deal_workspaces";

interface StorageReadWrite {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function addDaysIso(now: number, days: number): string {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function entryFromDeployment(dep: Deployment): DealAdvisorEntry {
    return {
        id: dep.id,
        advisorId: dep.advisorId,
        advisorName: dep.advisorName,
        momentId: dep.momentId,
        momentName: dep.momentName,
        outcome: dep.outcome,
        createdAt: dep.createdAt,
        outcomeDate: dep.outcomeDate
    };
}

function nextStepFor(
    outcome: DeploymentOutcome,
    currentNextStep: string,
    currentNextStepDate: string | null,
    now: number
): {
    readonly nextStep: string;
    readonly nextStepDate: string;
} | null {
    if (outcome === "pending") {
        // PR #26 Codex P1 fix: legacy lines 500-501 fill BOTH nextStep
        // and nextStepDate only when each is currently empty
        // (`deal.nextStep = deal.nextStep || ...; deal.nextStepDate =
        // deal.nextStepDate || addDaysIso(3)`). The previous version
        // overwrote nextStepDate unconditionally, which silently
        // corrupted any planned deadline. Preserve both when set.
        return {
            nextStep:
                currentNextStep ||
                "Send advisor ask and book the follow-up thread",
            nextStepDate: currentNextStepDate || addDaysIso(now, 3)
        };
    }
    if (outcome === "engaged" || outcome === "successful") {
        return {
            nextStep:
                "Convert advisor momentum into the next stakeholder step",
            nextStepDate: addDaysIso(now, outcome === "successful" ? 2 : 3)
        };
    }
    // declined / no_response / hold / reroute
    return {
        nextStep:
            "Choose the next leverage path without waiting on this advisor thread",
        nextStepDate: addDaysIso(now, 4)
    };
}

/**
 * Mirror a deployment's effect onto the matching deal in
 * `gtmos_deal_workspaces`. Returns true when a deal was found and
 * updated, false otherwise (deal missing, no dealId, hostile storage).
 */
export function syncDeploymentToDeal(
    dep: Deployment,
    now: number = Date.now(),
    storage: StorageReadWrite | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): boolean {
    if (!dep.dealId || !storage) return false;
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return false;
        const next = parsed.slice();
        const idx = next.findIndex((d) => {
            const o = asObject(d);
            if (!o) return false;
            return String(o["id"] ?? "") === dep.dealId;
        });
        if (idx < 0) return false;
        const dealRaw = asObject(next[idx]);
        if (!dealRaw) return false;
        const deal = { ...dealRaw };

        const history = Array.isArray(deal["advisorHistory"])
            ? (deal["advisorHistory"] as ReadonlyArray<unknown>)
            : [];
        const entry = entryFromDeployment(dep);
        const replaced = history.map((row) => {
            const o = asObject(row);
            if (!o) return row;
            return o["id"] === entry.id ? entry : row;
        });
        const found = history.some((row) => {
            const o = asObject(row);
            return o && o["id"] === entry.id;
        });
        deal["advisorHistory"] = found ? replaced : [...history, entry];
        deal["lastAdvisorDeployment"] = entry;
        deal["lastAdvisorDeploymentAt"] = dep.createdAt;
        deal["lastAdvisorMoment"] = dep.momentName;

        const update = nextStepFor(
            dep.outcome,
            String(deal["nextStep"] ?? ""),
            typeof deal["nextStepDate"] === "string"
                ? (deal["nextStepDate"] as string)
                : null,
            now
        );
        if (update) {
            deal["nextStep"] = update.nextStep;
            deal["nextStepDate"] = update.nextStepDate;
        }

        next[idx] = deal;
        storage.setItem(STORAGE_KEY, JSON.stringify(next));
        return true;
    } catch (err) {
        reportError(err, { op: "advisor-deploy.syncDeploymentToDeal" });
        return false;
    }
}
