import type { LinkedDealSummary, ProofDocs, ProofDraft } from "./types";

/**
 * Phase 4 / Room 5 Wave 4 — proof document generators.
 *
 * Faithful TypeScript port of the four legacy doc templates from
 * `app/poc-framework/index.html` lines 216-292: scope, kickoff,
 * readout, email. Each is a markdown string the operator can copy
 * into any tool.
 *
 * Pure: accepts an explicit `now` for deterministic tests.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function safe(value: string | undefined | null, fallback: string): string {
    const trimmed = String(value ?? "").trim();
    return trimmed || fallback;
}

function fmtDate(d: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
    }).format(d);
}

function fmtMoney(n: number | undefined): string {
    if (!n) return "$0";
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${Math.round(n)}`;
}

const STAGE_LABELS: Record<string, string> = {
    prospect: "Prospect",
    discovery: "Discovery",
    evaluation: "Solution Fit",
    poc: "PoC / Pilot",
    proposal: "Proposal",
    negotiation: "Negotiation",
    verbal: "Verbal Commit",
    "closed-won": "Closed Won",
    "closed-lost": "Closed Lost"
};

export interface DocsOptions {
    readonly now?: number;
}

/**
 * Generate the four proof documents from the current draft.
 * Faithful port of the legacy generatePoC() inline templates.
 */
export function generateDocs(
    drft: ProofDraft,
    linkedDeal: LinkedDealSummary | null,
    options: DocsOptions = {}
): ProofDocs {
    const now = options.now ?? Date.now();
    const today = new Date(now);
    const end = new Date(now + drft.durationDays * DAY_MS);

    const vendor = safe(drft.vendor, "[Vendor]");
    const account = safe(drft.account, "[Account]");
    const owner = safe(drft.readoutOwner, "[Readout owner]");
    const success = safe(
        drft.successCriteria,
        "- [Success criterion 1]\n- [Success criterion 2]"
    );
    const boundaries = safe(
        drft.boundaries,
        "- [Boundary 1]\n- [Boundary 2]"
    );
    const dealLine = linkedDeal
        ? `Linked deal: ${safe(linkedDeal.accountName, account)} (${
              STAGE_LABELS[linkedDeal.stage] ?? safe(linkedDeal.stage, "Live")
          }, ${fmtMoney(linkedDeal.value)})`
        : "Linked deal: None";

    const scope = `POC SCOPE - ${vendor} x ${account}

Run dates: ${fmtDate(today)} to ${fmtDate(end)} (${drft.durationDays} days)
Readout owner: ${owner}
${dealLine}

Decision question:
Can ${vendor} produce enough buyer-owned proof for ${account} to make an expand / pause / stop decision?

Success criteria:
${success}

Boundaries / kill rules:
${boundaries}

Required readout:
1. What changed during the proof window?
2. Which criteria passed, failed, or stayed ambiguous?
3. What decision is now justified?

If the readout owner is not present, the PoC does not count as decision proof.`;

    const kickoff = `POC KICKOFF AGENDA - ${account}

1. Confirm the proof claim.
"The purpose of this PoC is to prove whether ${vendor} can produce an outcome ${account}'s decision-makers can act on, not to explore every possible feature."

2. Confirm the success criteria.
${success}

3. Confirm the boundaries.
${boundaries}

4. Confirm owner and readout.
Owner: ${owner}
Readout date: ${fmtDate(end)}

5. Confirm stop condition.
If the proof cannot be carried into a buyer decision, the PoC stops instead of drifting.`;

    const readout = `POC READOUT AGENDA - ${account}

1. Restate the decision question.
Can ${vendor} produce enough proof for ${account} to make an expand / pause / stop decision?

2. Read the criteria.
${success}

3. Read the boundaries.
${boundaries}

4. Decide.
- Expand if criteria passed and a buyer owner accepts the next step.
- Pause if data or ownership is missing.
- Stop if the proof did not survive the agreed boundary.

5. Name the next move.
Owner: ${owner}
Date: ${fmtDate(end)}`;

    const email = `Subject: ${account} PoC scope and readout owner

Hi team,

Here is the proposed ${drft.durationDays}-day PoC structure for ${vendor} and ${account}.

The goal is not to run an open-ended trial. The goal is to produce evidence the buyer's boss can act on, against the criteria below:

${success}

We will keep the scope inside these boundaries:

${boundaries}

Readout owner: ${owner}
Readout target: ${fmtDate(end)}

If this still matches how you want to evaluate, we can lock the PoC and start the proof window.

Best,`;

    return { scope, kickoff, readout, email };
}
