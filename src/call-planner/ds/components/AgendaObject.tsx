import type { JSX } from "preact";
import { signal } from "@preact/signals";
import {
    Button,
    Card,
    Kicker,
    Meter,
    StatusChip
} from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import {
    currentCompany,
    draft,
    linkedDeal,
    logOutcome,
    matchedAccount,
    persistAgendaState
} from "../../state";
import { buildAgendaBrief } from "../../lib/brief";
import {
    hrefToDealWorkspace,
    hrefToDiscoveryStudio
} from "../../lib/handoff";
import { saveAgendaSnapshotToCloud } from "../../lib/cloud-persistence";
import { OUTCOMES, OUTCOME_LABELS, type Outcome } from "../../lib/types";
import { agendaQuality, agendaStops, bandTone } from "../lib/adapters";

/**
 * AgendaObject — the dominant half of the Call Planner Decision-Bench-
 * shaped Live Instrument (canon §4.11). The prepared plan is the made
 * thing the witness form serves: the quality read shows what truth is
 * being improved, the four stops (Open / Reason now / Probe / Advance
 * ask) carry the rep's pre-conviction, and the cross-room routes carry
 * the plan into the live call so it dies in the call, not in the planner.
 *
 * Composed on the library over the unchanged quality + persona +
 * advance-ask engine. The persist-then-route mind is preserved: the
 * cross-room moves write gtmos_call_handoff before navigating so
 * Discovery Studio reads the current agenda on its boot.
 */

const flash = signal<string>("");
let flashTimer: ReturnType<typeof setTimeout> | null = null;
function setFlash(msg: string): void {
    flash.value = msg;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
        flash.value = "";
    }, 1800);
}

function onOutcome(o: Outcome): void {
    const result = logOutcome(o);
    setFlash(
        `Logged ${OUTCOME_LABELS[o].toLowerCase()} (score ${result.snapshot.score}/100).`
    );
    void saveAgendaSnapshotToCloud(result.snapshot);
}

function focusLabel(): string {
    const d = draft.value;
    return d.contactName.trim() || currentCompany.value || "Call Planner";
}

function runDiscovery(): void {
    const result = persistAgendaState(null);
    void saveAgendaSnapshotToCloud(result.snapshot);
    if (typeof window === "undefined") return;
    window.location.href = hrefToDiscoveryStudio(
        focusLabel(),
        currentCompany.value || ""
    );
}

function openDeal(): void {
    const result = persistAgendaState(null);
    void saveAgendaSnapshotToCloud(result.snapshot);
    if (typeof window === "undefined") return;
    window.location.href = hrefToDealWorkspace(
        focusLabel(),
        currentCompany.value || "",
        result.snapshot.linkedDeal || ""
    );
}

function copyBrief(): void {
    const brief = buildAgendaBrief({
        draft: draft.value,
        matchedAccount: matchedAccount.value,
        linkedDeal: linkedDeal.value
    });
    if (
        typeof navigator === "undefined" ||
        !navigator.clipboard ||
        !navigator.clipboard.writeText
    ) {
        setFlash("Copy unavailable.");
        return;
    }
    navigator.clipboard
        .writeText(brief)
        .then(() => setFlash("Agenda brief copied."))
        .catch(() => setFlash("Copy failed."));
}

export function AgendaObject(): JSX.Element {
    const quality = agendaQuality();
    const stops = agendaStops();
    const linked = linkedDeal.value;
    const tone = bandTone(quality.band);
    const annotate = showsAnnotations();

    return (
        <div class="cpd-object">
            {/* The quality read — the Decision Bench top: what truth is
                being improved. */}
            <div class="cpd-quality">
                <div class="cpd-quality__head">
                    <Kicker>{t("AGENDA QUALITY")}</Kicker>
                    <StatusChip label={quality.bandLabel} tone={tone} />
                    <span class="cpd-quality__score">
                        {quality.score}
                        <span class="cpd-quality__cap">/100</span>
                    </span>
                </div>
                <Meter
                    ratio={quality.score / 100}
                    read={quality.nextMove}
                    tone={tone}
                    label={t("Agenda quality")}
                />
                {annotate ? (
                    <ul class="cpd-gates">
                        {quality.gates.map((g) => (
                            <li key={g.key} class="cpd-gate">
                                <span
                                    class={`cpd-gate__mark cpd-gate__mark--${g.met ? "met" : "unmet"}`}
                                >
                                    <Icon
                                        name={g.met ? "ready" : "attention"}
                                        size={16}
                                    />
                                </span>
                                <span class="cpd-gate__text">{g.label}</span>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>

            {/* The four stops — the rep's pre-conviction, in sequence. */}
            <div class="cpd-stops">
                <Card icon="call" kicker={t("OPEN")}>
                    <p class="ds-card__copy">{stops.opener}</p>
                </Card>
                <Card icon="signal" kicker={t("REASON NOW")} tone={tone}>
                    <p class="ds-card__copy">{stops.reasonNow}</p>
                </Card>
                <Card icon="prep" kicker={t("PROBE")}>
                    <ol class="cpd-probes">
                        {stops.probes.map((q, i) => (
                            <li key={i} class="cpd-probe">
                                <span class="cpd-probe__num">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span class="cpd-probe__text">{q}</span>
                            </li>
                        ))}
                    </ol>
                </Card>
                <Card icon="deal" kicker={t("ADVANCE ASK")}>
                    <p class="ds-card__copy">{stops.advanceAsk}</p>
                    {annotate ? (
                        <p class="cpd-advance__note">{stops.advanceNote}</p>
                    ) : null}
                </Card>
            </div>

            {/* The outcomes — log how the call landed. */}
            <div class="cpd-outcomes">
                <div class="cpd-outcomes__head">
                    <Kicker>{t("LOG THE OUTCOME")}</Kicker>
                    {flash.value ? (
                        <span class="cpd-flash" role="status">
                            {flash.value}
                        </span>
                    ) : null}
                </div>
                <div
                    class="cpd-outcomes__row"
                    role="group"
                    aria-label={t("Log call outcome")}
                >
                    {OUTCOMES.map((o) => (
                        <Button
                            key={o}
                            variant="secondary"
                            onClick={() => onOutcome(o)}
                        >
                            {OUTCOME_LABELS[o]}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Cross-room — carry the plan into the live call. The mind:
                persist gtmos_call_handoff first, then route. */}
            <section class="cpd-routes" aria-label={t("Carry the plan forward")}>
                <header class="cpd-routes__head">
                    <Kicker>{t("RUN THE CALL")}</Kicker>
                    <p class="cpd-routes__copy">
                        {t(
                            "The plan dies in the call, not in the planner.",
                            { class: "body" }
                        )}
                    </p>
                </header>
                <div class="cpd-routes__row">
                    <Button variant="accent" onClick={runDiscovery}>
                        {t("Run the discovery call")}
                    </Button>
                    <Button variant="secondary" onClick={openDeal}>
                        {linked ? t("Open the deal") : t("Open Deal Workspace")}
                    </Button>
                    <Button variant="ghost" onClick={copyBrief}>
                        {t("Copy the brief")}
                    </Button>
                </div>
            </section>
        </div>
    );
}
