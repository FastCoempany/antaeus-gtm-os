import type { IcpStatement, RoleKey } from "./types";
import {
    BUYING_GROUP_MAP,
    DEFAULT_BUYING_GROUP,
    PAIN_EVIDENCE_MAP,
    TRIGGER_EVIDENCE_MAP
} from "./data";

/**
 * Phase 4 / Room 11 Wave 2 — build helpers.
 *
 * Faithful TypeScript port of the legacy build functions from
 * `app/icp-studio/index.html` lines 1175-1230. Pure: no signals, no
 * DOM. Wave 3 reads these to render the live build outputs.
 */

// ─── Statement composer ────────────────────────────────────────────────

const EMPTY_STATEMENT: IcpStatement = {
    text: "Fill the inputs above to generate a Thin ICP statement.",
    hint: "Tip: choose one owner, one pain, one trigger, one evidence window."
};

const WIN_HINT = "If you cannot list 50 accounts that match this, thin it again.";

export interface BuildStatementInput {
    readonly industry: string;
    readonly size: string;
    readonly geo: string;
    readonly buyer: string;
    readonly pain: string;
    readonly trigger: string;
    readonly proofWindow: string;
}

/**
 * Compose the Thin ICP statement. Returns the empty placeholder when
 * any of the 7 fields is missing — legacy line 1177-1182.
 */
export function buildStatement(input: BuildStatementInput): IcpStatement {
    const { industry, size, geo, buyer, pain, trigger, proofWindow } = input;
    if (
        !industry.trim() ||
        !size.trim() ||
        !geo.trim() ||
        !buyer.trim() ||
        !pain.trim() ||
        !trigger.trim() ||
        !proofWindow.trim()
    ) {
        return EMPTY_STATEMENT;
    }
    const text = `We win with ${industry} companies (${size}, ${geo}) where the ${buyer} owns ${pain}, triggered by ${trigger.toLowerCase()}, and we can prove value in ${proofWindow}.`;
    return { text, hint: WIN_HINT };
}

// ─── Focus recommendation ─────────────────────────────────────────────

/**
 * Recommend the working-list size + cadence based on the operator role
 * and any explicit active-accounts override. Legacy lines 1192-1199.
 *
 * - Active accounts > 0 → use it: "Work N active accounts in a 30-day
 *   window. Maintain a ranked top-20 and rotate weekly."
 * - Founder default (no override): 60-120 active accounts.
 * - First AE default: 120-220 active accounts.
 */
export function buildFocus(
    role: RoleKey,
    activeAccounts: number | null | undefined
): string {
    const n = typeof activeAccounts === "number" && activeAccounts > 0
        ? activeAccounts
        : 0;
    if (n > 0) {
        return `Work ${n} active accounts in a 30-day window (from Engine). Maintain a ranked top-20 and rotate weekly.`;
    }
    if (role === "founder") {
        return "Founder-led default: focus 60-120 active accounts for the next 30 days. If personalization is heavy, start at 60.";
    }
    return "First AE default: focus 120-220 active accounts for the next 30 days. Start lower if research depth is high.";
}

// ─── Buying group ──────────────────────────────────────────────────────

/**
 * Buying-group minimum for the selected primary buyer. Empty buyer
 * returns the prompt to select one (legacy line 1207). Unknown buyer
 * falls back to DEFAULT_BUYING_GROUP.
 */
export function buildBuyingGroup(buyer: string): ReadonlyArray<string> {
    const trimmed = buyer.trim();
    if (!trimmed) {
        return ["Select a Primary Buyer to populate buying-group minimum."];
    }
    return BUYING_GROUP_MAP[trimmed] ?? DEFAULT_BUYING_GROUP;
}

// ─── Evidence ──────────────────────────────────────────────────────────

/**
 * Evidence signals derived from the Trigger + Pain combination.
 * Combines + dedupes both maps. Empty trigger or pain returns the
 * prompt copy (legacy line 1212).
 */
export function buildEvidence(
    pain: string,
    trigger: string
): ReadonlyArray<string> {
    const p = pain.trim();
    const t = trigger.trim();
    if (!p || !t) {
        return ["Choose a Trigger and Pain to generate evidence signals."];
    }
    const triggerEvidence = TRIGGER_EVIDENCE_MAP[t] ?? [];
    const painEvidence = PAIN_EVIDENCE_MAP[p] ?? [];
    // Preserve trigger evidence first, then pain evidence; dedupe in order.
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of [...triggerEvidence, ...painEvidence]) {
        if (!seen.has(item)) {
            seen.add(item);
            out.push(item);
        }
    }
    if (out.length === 0) {
        return [
            "No evidence map found for this combo (pick a different pain/trigger)."
        ];
    }
    return out;
}

// ─── Broad-language detector ──────────────────────────────────────────

const BROAD_LANGUAGE_RE =
    /(anyone|everyone|multiple|various|several|committee|leadership team|all buyers|all teams|whoever|general)/;

/**
 * Detects vague / committee-shaped language in a buyer or other field.
 * Legacy lines 1219-1223.
 */
export function containsBroadLanguage(
    value: string | null | undefined
): boolean {
    const text = String(value ?? "")
        .trim()
        .toLowerCase();
    if (!text) return false;
    return BROAD_LANGUAGE_RE.test(text);
}
