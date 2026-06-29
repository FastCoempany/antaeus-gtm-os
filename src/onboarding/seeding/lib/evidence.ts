import { t } from "@/lib/voice/t";
import type { SeedingStepId } from "../state";

/**
 * The evidence margin's content (ADR-019). Every ask in the seeding flow
 * carries a recessive, blue (system-intelligence role) "why we ask" note
 * that opens to a real, citable source. The doctrine is Earned Depth
 * (canon Part III §12): we never ask for anything without showing the
 * reason — and the reason is evidence, not assertion.
 *
 * Sources are real and sourced (not blog-grade vibes). Where the only
 * available figures were secondary, the note stays directional rather
 * than citing a number it can't stand behind.
 */

export interface EvidenceSource {
    readonly label: string;
    readonly url: string;
}

export interface EvidenceNote {
    readonly note: string;
    readonly source: EvidenceSource | null;
}

const SALESFORCE_ICP: EvidenceSource = {
    label: "Salesforce · Ideal Customer Profile",
    url: "https://www.salesforce.com/sales/ideal-customer-profile/"
};
const SALESFORCE_STATE_OF_SALES: EvidenceSource = {
    label: "Salesforce · State of Sales",
    url: "https://www.salesforce.com/news/stories/sales-research-2023/"
};
const GRADIENT_COVERAGE: EvidenceSource = {
    label: "Pipeline coverage · Gradient Works",
    url: "https://www.gradient.works/blog/2025-b2b-sales-performance-benchmarks"
};
const CLOZD_WIN_LOSS: EvidenceSource = {
    label: "Clozd · 2025 State of Win-Loss",
    url: "https://www.clozd.com/guides/win-loss-analysis"
};

export const EVIDENCE: Record<SeedingStepId, EvidenceNote> = {
    door: {
        note: t(
            "Everything we ask, we ask for a reason — and we show you the reason, right here, the whole way through. Nothing in this flow is busywork.",
            { class: "body" }
        ),
        source: null
    },
    icp: {
        note: t(
            "Teams with one documented, sharp ICP report higher win rates and shorter sales cycles than teams chasing a broad one. Narrow isn't a limit — it's what makes every signal downstream mean something.",
            { class: "body" }
        ),
        source: SALESFORCE_ICP
    },
    accounts: {
        note: t(
            "Sellers spend under 30% of the week actually selling — a real chunk of the rest is manual account research. Paste the names; the system does that part in a minute, and keeps doing it.",
            { class: "body" }
        ),
        source: SALESFORCE_STATE_OF_SALES
    },
    wake: {
        note: t(
            "This is the easy half — it only read your target list. A real motion carries about ten live deals at once. That's where it stops being a list and starts telling you which deal is about to slip.",
            { class: "body" }
        ),
        source: GRADIENT_COVERAGE
    },
    deals: {
        note: t(
            "This is the part that makes it not a prettier CRM. No tool can find this for you — it isn't on the internet, it's in your head: who's really championing the deal, where it's stuck, the truth about budget and timing.",
            { class: "body" }
        ),
        source: GRADIENT_COVERAGE
    },
    quota: {
        note: t(
            "Healthy teams carry three to four times their quota in live pipeline. Put your number in and the system tells you weekly whether you're actually covered, or just hoping.",
            { class: "body" }
        ),
        source: GRADIENT_COVERAGE
    },
    landing: {
        note: t(
            "Teams that study their wins and losses win more — 63% see their rate climb, 84% once the habit is two years old. That's the next thing the system will ask you for. Later. You've done enough today.",
            { class: "body" }
        ),
        source: CLOZD_WIN_LOSS
    }
};

export function evidenceFor(id: SeedingStepId): EvidenceNote {
    return EVIDENCE[id];
}
