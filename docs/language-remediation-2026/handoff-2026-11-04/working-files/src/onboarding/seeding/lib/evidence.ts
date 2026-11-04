import { t } from "@/lib/voice/t";
import type { SeedingStepId } from "../state";

/** Explains how each onboarding input is used by the application.
 * Product behavior is the basis for these notes; no external outcome claims. */

export interface EvidenceSource {
    readonly label: string;
    readonly url: string;
}

export interface EvidenceNote {
    readonly note: string;
    readonly source: EvidenceSource | null;
}

export const EVIDENCE: Record<SeedingStepId, EvidenceNote> = {
    door: {
        note: t(
            "Each step explains how its inputs will be used. Review these notes as you enter your workspace information.",
            { class: "body" }
        ),
        source: null
    },
    icp: {
        note: t(
            "Your ICP describes the companies and buyer roles you want to target. Antaeus uses it to assess account relevance; a match still needs verification.",
            { class: "body" }
        ),
        source: null
    },
    accounts: {
        note: t(
            "Account names define which companies to research. The next step looks for recent changes with source links. If research is unavailable, you can continue with your list.",
            { class: "body" }
        ),
        source: null
    },
    wake: {
        note: t(
            "Review the reported changes and their sources before acting. Priority reflects an assessment of recency and ICP relevance, not confirmed buying intent.",
            { class: "body" }
        ),
        source: null
    },
    deals: {
        note: t(
            "Record what you know about the champion, signer, budget, timeline, and current obstacle. The initial assessment checks stage, champion, signer, and obstacle information to suggest what to verify next.",
            { class: "body" }
        ),
        source: null
    },
    quota: {
        note: t(
            "Your quota and closed-won total set the revenue target and remaining gap used in Quota Workback. Required pipeline depends on the conversion assumptions you enter.",
            { class: "body" }
        ),
        source: null
    },
    landing: {
        note: t(
            "Your inputs initialize the workspace. Review the resulting accounts, deals, and recommendations, and update them as you obtain new evidence.",
            { class: "body" }
        ),
        source: null
    }
};

export function evidenceFor(id: SeedingStepId): EvidenceNote {
    return EVIDENCE[id];
}
