import type { JSX } from "preact";
import { signal } from "@preact/signals";
import {
    Card,
    HandoffStrip,
    Kicker,
    Meter,
    SegmentedControl,
    StatusChip
} from "@/components";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import { draft, linkedDeal } from "../../state";
import {
    buildIngotRead,
    deriveMolds
} from "../../lib/quality";
import { generateDocs } from "../../lib/docs";
import type { ProofDocs } from "../../lib/types";
import {
    hrefToAdvisorDeploy,
    hrefToDealWorkspace,
    hrefToFutureAutopsy,
    hrefToNegotiation
} from "../../lib/handoff";
import { bandTone, moldTone, quality } from "../lib/adapters";

/**
 * ProofObject — the dominant made thing of the PoC Framework Decision
 * Bench (canon §4.15: shape one piece of pilot evidence the buyer's boss
 * can act on). The quality read carries the bet, the heat ledger + the
 * five molds prove how forged the proof is, the weakest mold names the
 * next move, the documents are the carryable artifact, and the handoff
 * carries the proof into the deal. Composed on the library over the
 * unchanged quality + mold + doc engine.
 */

const DOC_KEYS: ReadonlyArray<keyof ProofDocs> = [
    "scope",
    "kickoff",
    "readout",
    "email"
];
const DOC_OPTIONS: ReadonlyArray<{ key: keyof ProofDocs; label: string }> = [
    { key: "scope", label: t("Pilot scope") },
    { key: "kickoff", label: t("Kickoff") },
    { key: "readout", label: t("Readout") },
    { key: "email", label: t("Proposal email") }
];

const activeDoc = signal<keyof ProofDocs>("scope");
const copyFlash = signal<string>("");
let copyTimer: ReturnType<typeof setTimeout> | null = null;

function copyDoc(text: string): void {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
        copyFlash.value = "Copy unavailable.";
        return;
    }
    navigator.clipboard
        .writeText(text)
        .then(() => {
            copyFlash.value = "Copied.";
            if (copyTimer) clearTimeout(copyTimer);
            copyTimer = setTimeout(() => {
                copyFlash.value = "";
            }, 1600);
        })
        .catch(() => {
            copyFlash.value = "Copy failed.";
        });
}

export function ProofObject(): JSX.Element {
    const drft = draft.value;
    const linked = linkedDeal.value;
    const q = quality();
    const tone = bandTone(q.band);
    const molds = deriveMolds(drft, q);
    const ingot = buildIngotRead(molds);
    const docs = generateDocs(drft, linked);
    const docKey = DOC_KEYS.includes(activeDoc.value) ? activeDoc.value : "scope";
    const annotate = showsAnnotations();

    return (
        <div class="pocd-object">
            {/* The quality read — the bench top: what truth is improving. */}
            <div class="pocd-read">
                <div class="pocd-read__head">
                    <Kicker>{t("WHAT THE BUYER'S BOSS WILL SEE")}</Kicker>
                    <StatusChip label={q.bandLabel} tone={tone} />
                    <span class="pocd-read__score">
                        {q.score}
                        <span class="pocd-read__cap">/100</span>
                    </span>
                </div>
                <p class="pocd-read__title">{q.title}</p>
                <p class="pocd-read__ingot">{ingot}</p>
            </div>

            {/* The heat ledger — claim / owner / kill. */}
            <div class="pocd-heat">
                <Meter
                    ratio={q.heat.claim.value / 100}
                    read={t("Claim — the pass/fail evidence", { class: "body" })}
                    tone={moldTone(q.heat.claim.value >= 80 ? "cast" : q.heat.claim.value >= 25 ? "hot" : "cold")}
                    label={t("Claim heat")}
                />
                <Meter
                    ratio={q.heat.owner.value / 100}
                    read={t("Owner — who signs off on the readout", { class: "body" })}
                    tone={moldTone(q.heat.owner.value >= 80 ? "cast" : q.heat.owner.value >= 25 ? "hot" : "cold")}
                    label={t("Owner heat")}
                />
                <Meter
                    ratio={q.heat.kill.value / 100}
                    read={t("Kill — when the pilot stops", { class: "body" })}
                    tone={moldTone(q.heat.kill.value >= 80 ? "cast" : q.heat.kill.value >= 25 ? "hot" : "cold")}
                    label={t("Kill heat")}
                />
            </div>

            {/* The five molds. */}
            <ul class="pocd-molds" aria-label={t("The five molds")}>
                {molds.map((m) => (
                    <li key={m.label} class="pocd-mold">
                        <Card kicker={m.label} tone={moldTone(m.state)}>
                            <p class="ds-card__copy">{m.value}</p>
                        </Card>
                    </li>
                ))}
            </ul>

            {/* The weakest mold — the next move. */}
            <div class="pocd-weakest">
                <Kicker>{t("WEAKEST MOLD · NEXT MOVE")}</Kicker>
                <p class="pocd-weakest__title">{q.weakest.title}</p>
                {annotate ? <p class="pocd-weakest__copy">{q.weakest.copy}</p> : null}
            </div>

            {/* The documents — the carryable artifact. */}
            <div class="pocd-docs">
                <div class="pocd-docs__head">
                    <Kicker>{t("DOCUMENTS")}</Kicker>
                    {copyFlash.value ? (
                        <span class="pocd-docs__flash" role="status">
                            {copyFlash.value}
                        </span>
                    ) : null}
                </div>
                <SegmentedControl<keyof ProofDocs>
                    label={t("Document")}
                    active={docKey}
                    onChange={(k) => {
                        activeDoc.value = k;
                    }}
                    options={DOC_OPTIONS}
                />
                <pre class="pocd-docs__body">{docs[docKey]}</pre>
                <button
                    type="button"
                    class="ds-btn ds-btn--secondary pocd-docs__copy"
                    onClick={() => copyDoc(docs[docKey])}
                >
                    {t("Copy the document")}
                </button>
            </div>

            {drft.account.trim() ? (
                <HandoffStrip
                    label={t("Carry the proof into the deal")}
                    kicker={t("CARRY THE PROOF")}
                    title={t("Make the pilot evidence the deal can use.", { class: "body" })}
                    routes={[
                        {
                            label: t("Open the deal"),
                            href: hrefToDealWorkspace(drft.account.trim(), linked?.id),
                            primary: true
                        },
                        { label: t("Pre-mortem the deal"), href: hrefToFutureAutopsy(drft.account.trim()) },
                        { label: t("Carry to an advisor"), href: hrefToAdvisorDeploy(drft.account.trim()) },
                        { label: t("Rehearse the negotiation"), href: hrefToNegotiation(drft.account.trim(), linked?.id) }
                    ]}
                />
            ) : null}
        </div>
    );
}
