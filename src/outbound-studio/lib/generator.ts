import type {
    Asset,
    Channel,
    CtaKey,
    OperatorRack
} from "./types";
import {
    ASSET_LABELS,
    ASSET_MATRIX,
    CHANNEL_ORDER,
    CTA_BY_TEMP,
    TRIGGERS
} from "./data";

/**
 * Outbound message generator.
 *
 * The generator may use only the account/contact fields, the selected
 * outreach stage, the selected trigger, an optional live signal headline,
 * and the optional question captured in the rack. It must not invent proof,
 * customer outcomes, buyer priorities, urgency, payback periods, or attached
 * documents that are not present in those inputs.
 */

export interface GenerateInputs {
    readonly rack: OperatorRack;
    /** First signal headline from Signal Console; fallback to selected trigger description. */
    readonly signalHeadline?: string;
    /** Sender's company name for substitutions; fallback "[Your Company]". */
    readonly companyName?: string;
    /** Wallclock for deterministic date suggestions. */
    readonly now?: number;
}

export interface GenerateOutput {
    readonly content: string;
    readonly channel: Channel;
    readonly asset: Asset;
    readonly ctaKey: CtaKey;
    readonly assetLabel: string;
    /** Completeness heuristic for the fields available to the generator. */
    readonly qualityScore: number;
    /** Internal completeness band retained for compatibility with existing consumers. */
    readonly motionBand: "thin" | "workable" | "ready";
}

const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

function dayName(now: number, offsetDays: number): string {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    return DAYS[d.getDay()] ?? "Tuesday";
}

function lcFirst(s: string): string {
    if (!s) return s;
    return s.charAt(0).toLowerCase() + s.slice(1);
}

function ensurePeriod(s: string): string {
    if (!s) return s;
    return /[.!?]$/.test(s) ? s : s + ".";
}

/** Completeness score over generator inputs; not an outcome-quality score. */
function computeQuality(rack: OperatorRack, hasSignal: boolean): number {
    let score = 0;
    if (rack.accountName.trim()) score += 14;
    if (rack.contactName.trim()) score += 14;
    score += 16; // persona is always set
    score += 16; // outreach stage is always set
    score += 14; // trigger is always set
    if (hasSignal) score += 14;
    if (rack.nextQuestion?.trim()) score += 6;
    return Math.min(100, score);
}

function bandFor(score: number): "thin" | "workable" | "ready" {
    if (score >= 80) return "ready";
    if (score >= 55) return "workable";
    return "thin";
}

function reasonSentence(signalText: string): string {
    return `I noticed ${ensurePeriod(lcFirst(signalText))}`;
}

function assetOffer(assetLabel: string, angle: string): string {
    if (assetLabel === "No attachment") {
        return `If ${angle} is relevant, I can send a short explanation of how we approach it.`;
    }
    return `If ${angle} is relevant, I can send a ${assetLabel.toLowerCase()} focused on that question.`;
}

export function generateSendLine(inputs: GenerateInputs): GenerateOutput {
    const { rack } = inputs;
    const now = inputs.now ?? Date.now();
    const account = rack.accountName.trim() || "[Company]";
    const contact = rack.contactName.trim() || "[Name]";
    const triggerData = TRIGGERS[rack.trigger];
    const signalText = inputs.signalHeadline?.trim() || triggerData.meaning;
    const angle = (triggerData.angles[0] ?? "the issue").toLowerCase();
    const companyName = inputs.companyName?.trim() || "[Your Company]";
    const buyerQuestion = rack.nextQuestion?.trim();

    const ctaKey: CtaKey = rack.noAsk
        ? CTA_BY_TEMP[rack.temperature].noask
        : CTA_BY_TEMP[rack.temperature].normal;
    const asset = ASSET_MATRIX[rack.temperature][rack.persona];
    const assetLabel = ASSET_LABELS[asset];
    const channel: Channel =
        CHANNEL_ORDER[rack.temperature][rack.persona][0] ?? "email";

    const lines: string[] = [];

    // ── First outreach ────────────────────────────────────────────────
    if (rack.temperature === "ice_cold") {
        lines.push(`Hi ${contact},`, "");
        lines.push(reasonSentence(signalText));
        lines.push("");

        if (rack.persona === "csuite") {
            lines.push(
                `I’m reaching out because that change could make ${angle} more relevant at ${account}.`
            );
            if (!rack.noAsk) {
                lines.push("");
                lines.push("Is that part of the conversation internally right now?");
            }
        } else if (rack.persona === "vp") {
            lines.push(
                `I’m reaching out because ${angle} often becomes a practical question when this kind of change is underway.`
            );
            lines.push("");
            lines.push(assetOffer(assetLabel, angle));
            if (!rack.noAsk) {
                lines.push("");
                lines.push("Is that relevant to what your team is working through?");
            }
        } else if (rack.persona === "ic") {
            lines.push(
                `I’m reaching out because this kind of change can affect ${angle} at the team level.`
            );
            lines.push("");
            lines.push(
                `${companyName} works on this area. If it is on your plate, I can send a concise overview rather than assume how ${account} is handling it.`
            );
            if (!rack.noAsk) {
                lines.push("");
                lines.push("Is this something you are dealing with day to day?");
            }
        } else {
            lines.push(
                `I’m reaching out because this change may create vendor, documentation, or approval questions for ${account}.`
            );
            if (!rack.noAsk) {
                lines.push("");
                lines.push("Are any new requirements showing up on your side?");
            }
        }
        lines.push("", "Best,", "[Your Name]");
    }

    // ── Follow-up ────────────────────────────────────────────────────
    else if (rack.temperature === "cool") {
        lines.push(`Hi ${contact},`, "");
        lines.push(
            `Quick follow-up on my note about ${triggerData.label.toLowerCase()} at ${account}.`
        );
        lines.push("");
        lines.push(assetOffer(assetLabel, angle));
        if (!rack.noAsk) {
            lines.push("");
            lines.push(
                `If a short conversation is easier, I can do ${dayName(now, 2)} or ${dayName(now, 4)}. If not, I can just send the material.`
            );
        }
        lines.push("", "[Your Name]");
    }

    // ── Contact has replied ──────────────────────────────────────────
    else if (rack.temperature === "warm") {
        lines.push(`Hi ${contact},`, "");
        lines.push("Following up on our conversation.");
        if (buyerQuestion) {
            lines.push("", `You asked: “${buyerQuestion}”`);
        }
        lines.push("", assetOffer(assetLabel, angle));
        if (!rack.noAsk) {
            lines.push("");
            lines.push(
                `Would 20 minutes on ${dayName(now, 3)} work to go through it and make sure I’m addressing the right question?`
            );
        }
        lines.push("", "[Your Name]");
    }

    // ── Active back-and-forth ────────────────────────────────────────
    else if (rack.temperature === "hot") {
        lines.push(`Hi ${contact},`, "");
        lines.push("Sending a quick note before our next conversation.");
        if (buyerQuestion) {
            lines.push("", `I have your open question as: “${buyerQuestion}”`);
        }
        lines.push("");

        if (rack.persona === "procurement") {
            lines.push(
                "I can send the security or compliance material your review requires. If there is a specific document or questionnaire, send it over and I’ll route it to the right person."
            );
        } else {
            lines.push(
                `I can bring the ${assetLabel.toLowerCase()} and focus it on the points we have already discussed rather than introduce new assumptions.`
            );
            if (!rack.noAsk) {
                lines.push("");
                lines.push("What should we make sure is resolved in the next conversation?");
            }
        }
        lines.push("", "[Your Name]");
    }

    // ── Approval / contract stage ────────────────────────────────────
    else if (rack.temperature === "closing") {
        lines.push(`Hi ${contact},`, "");
        lines.push("Checking in on the contract and approval status.");
        lines.push("");
        if (rack.persona === "procurement") {
            lines.push(
                "If legal, security, or procurement has open questions, send them over and I’ll get the right person involved."
            );
        } else {
            lines.push(
                `I can send or update the ${assetLabel.toLowerCase()} based on the approvals that are still open.`
            );
        }
        if (buyerQuestion) {
            lines.push("", `I also have this question still open: “${buyerQuestion}”`);
        }
        if (!rack.noAsk) {
            lines.push("", "What still needs to happen on your side before the agreement can move forward?");
        }
        lines.push("", "[Your Name]");
    }

    const content = lines.join("\n");
    const qualityScore = computeQuality(rack, !!inputs.signalHeadline?.trim());
    const motionBand = bandFor(qualityScore);

    return {
        content,
        channel,
        asset,
        ctaKey,
        assetLabel,
        qualityScore,
        motionBand
    };
}
