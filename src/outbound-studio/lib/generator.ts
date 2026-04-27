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
 * Phase 4 / Room 6 Wave 2 — send-line generator.
 *
 * Faithful TypeScript port of the legacy `generate()` function (lines
 * 1124-1241 of `app/outbound-studio/index.html`). 5 temperature
 * branches × 4 persona variants per branch, building a `lines[]`
 * array that joins with \n.
 *
 * Pure: takes an explicit `now` for deterministic date suggestions
 * (Tuesday/Thursday next week, etc.).
 */

export interface GenerateInputs {
    readonly rack: OperatorRack;
    /** First signal headline from Signal Console; fallback to trigger meaning. */
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
    readonly qualityScore: number;
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

/**
 * Quality score derived from rack completeness — drives the motion
 * band. Faithful port of the legacy `getMotionState` quality logic
 * but distilled to the inputs that matter.
 */
function computeQuality(rack: OperatorRack, hasSignal: boolean): number {
    let score = 0;
    if (rack.accountName.trim()) score += 14;
    if (rack.contactName.trim()) score += 14;
    score += 16; // persona always set
    score += 16; // temperature always set
    score += 14; // trigger always set
    if (hasSignal) score += 14;
    if (rack.noAsk) score += 3; // discipline bonus per legacy
    return Math.min(100, score);
}

function bandFor(score: number): "thin" | "workable" | "ready" {
    if (score >= 80) return "ready";
    if (score >= 55) return "workable";
    return "thin";
}

export function generateSendLine(inputs: GenerateInputs): GenerateOutput {
    const { rack } = inputs;
    const now = inputs.now ?? Date.now();
    const account = rack.accountName.trim() || "[Company]";
    const contact = rack.contactName.trim() || "[Name]";
    const triggerData = TRIGGERS[rack.trigger];
    const signalText = inputs.signalHeadline?.trim() || triggerData.meaning;
    const angle = (triggerData.angles[0] ?? "value").toLowerCase();
    const companyName = inputs.companyName?.trim() || "[Your Company]";

    const ctaKey: CtaKey = rack.noAsk
        ? CTA_BY_TEMP[rack.temperature].noask
        : CTA_BY_TEMP[rack.temperature].normal;
    const asset = ASSET_MATRIX[rack.temperature][rack.persona];
    const assetLabel = ASSET_LABELS[asset];
    const channel: Channel =
        CHANNEL_ORDER[rack.temperature][rack.persona][0] ?? "email";

    const lines: string[] = [];

    // ── Ice Cold ──
    if (rack.temperature === "ice_cold") {
        lines.push(`Hi ${contact},`, "");
        lines.push(
            `I noticed ${ensurePeriod(lcFirst(signalText))}`
        );
        lines.push("");
        if (rack.persona === "csuite") {
            lines.push(
                `For ${account}, that likely puts ${angle} near the top of your priority stack this quarter.`
            );
            if (!rack.noAsk) {
                lines.push("");
                lines.push("Does that track with how you're thinking about it?");
            }
        } else if (rack.persona === "vp") {
            lines.push(
                `For teams at ${account}'s scale, that typically means ${angle} becomes urgent before the systems are ready for it.`
            );
            lines.push("");
            lines.push(
                "We've helped companies in a similar position — happy to share what we've seen if it's relevant."
            );
            if (!rack.noAsk) {
                lines.push("");
                lines.push("Worth a look?");
            }
        } else if (rack.persona === "ic") {
            lines.push(
                `For teams at ${account}, that usually means ${angle} work accelerates while the tooling stays the same.`
            );
            lines.push("");
            lines.push(
                `We've built something that addresses exactly this — specifically for teams dealing with ${triggerData.meaning.toLowerCase()}`
            );
            lines.push("");
            lines.push(
                `The short version: ${companyName} helps ${account} ${triggerData.angles
                    .join(" and ")
                    .toLowerCase()} without adding complexity to what you're already using.`
            );
            if (!rack.noAsk) {
                lines.push("");
                lines.push("Curious if this matches what you're seeing day-to-day?");
            }
        } else {
            lines.push(
                `For ${account}, that likely creates new requirements on the procurement side.`
            );
            if (!rack.noAsk) {
                lines.push("");
                lines.push("Does this resonate?");
            }
        }
        lines.push("");
        lines.push("Best,");
        lines.push("[Your Name]");
    }

    // ── Cool ──
    else if (rack.temperature === "cool") {
        lines.push(`Hi ${contact},`, "");
        lines.push(
            `Quick follow-up to the note I sent about ${triggerData.label.toLowerCase()} at ${account}.`
        );
        lines.push("");
        lines.push(
            `I put together a ${assetLabel.toLowerCase()} that's specific to how companies at ${account}'s scale are approaching ${angle}. It's based on what we've seen work across similar organizations — not a product pitch.`
        );
        if (!rack.noAsk) {
            lines.push("");
            lines.push(
                `Worth 15 minutes for me to walk you through it? I can do ${dayName(now, 2)} or ${dayName(now, 4)}.`
            );
        }
        lines.push("");
        lines.push("[Your Name]");
    }

    // ── Warm ──
    else if (rack.temperature === "warm") {
        lines.push(`Hi ${contact},`, "");
        lines.push(
            `Following up on our conversation. I've been thinking about the ${angle} challenge you mentioned and wanted to share something specific.`
        );
        lines.push("");
        if (rack.persona === "csuite") {
            lines.push(
                "I'd like to show you how a company in your space solved this in 20 minutes. No slides unless you want them."
            );
            if (!rack.noAsk) {
                lines.push(`Does ${dayName(now, 3)} work?`);
            }
        } else {
            lines.push(
                `Attached is a ${assetLabel.toLowerCase()} customized for ${account} — it shows the opportunity range based on what we've seen at comparable organizations.`
            );
            lines.push("");
            if (!rack.noAsk) {
                lines.push(
                    "Worth 20 minutes to walk through it together? I'd also want to understand who else on your team should be in the conversation."
                );
            }
        }
        lines.push("");
        lines.push("[Your Name]");
    }

    // ── Hot ──
    else if (rack.temperature === "hot") {
        lines.push(`Hi ${contact},`, "");
        lines.push("Wanted to send this ahead of our next conversation.");
        lines.push("");
        if (rack.persona === "csuite") {
            lines.push(
                `Attached is the business case for ${account} — the ROI model populated with the numbers your team shared. The payback period comes in at [X months]. Happy to walk through the assumptions on a quick call if useful.`
            );
        } else if (rack.persona === "procurement") {
            lines.push(
                "Attached: our security documentation, standard terms, and compliance certifications. Let me know what else you need from us to move forward — happy to pre-fill your vendor evaluation questionnaire if that saves time."
            );
        } else {
            lines.push(
                `Here's the ${assetLabel.toLowerCase()} we discussed. I've included the proof points most relevant to ${account}'s situation and a suggested mutual action plan for the path from here to decision.`
            );
            lines.push("");
            lines.push(
                "Let me know what questions come up — and whether it would be useful to include [stakeholder role] in the next conversation."
            );
        }
        lines.push("");
        lines.push("[Your Name]");
    }

    // ── Closing ──
    else if (rack.temperature === "closing") {
        lines.push(`Hi ${contact},`, "");
        lines.push("Checking in on the contract status. On our end, we're ready to move.");
        lines.push("");
        if (rack.persona === "procurement") {
            lines.push(
                "Attached is the complete security and compliance package in case your team needs it for review. Let me know if there are specific sections legal wants to discuss — happy to set up a call with our legal team to accelerate."
            );
        } else {
            lines.push(
                "If your team has any open questions for legal or procurement, I've preemptively attached our security documentation and standard terms. Anything I can do to reduce friction on your side?"
            );
            lines.push("");
            lines.push(
                "If we finalize by [date], we can kick off implementation by [date] and you'll see initial results by [date]."
            );
        }
        lines.push("");
        lines.push("[Your Name]");
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
