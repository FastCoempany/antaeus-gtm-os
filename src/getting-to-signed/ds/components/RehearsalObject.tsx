import type { JSX } from "preact";
import { signal } from "@preact/signals";
import {
    Button,
    Card,
    HandoffStrip,
    Kicker,
    StatusChip,
    Textarea
} from "@/components";
import { t } from "@/lib/voice/t";
import { showsAnnotations } from "@/lib/density";
import {
    appendLearning,
    draft,
    draftDeal,
    freezeDraft,
    learnings,
    logOutcome,
    setNotes
} from "../../state";
import { OUTCOME_LABEL, type NegotiationOutcome } from "../../lib/types";
import {
    hrefToAdvisorDeploy,
    hrefToDealWorkspace,
    hrefToFutureAutopsy,
    hrefToPocFramework
} from "../../lib/handoff";
import { costTone, outcomeTone, prepRead, prepTone } from "../lib/adapters";

/**
 * RehearsalObject — the dominant made thing of the Negotiation Live
 * Instrument (canon §4.16b: every concession is a deliberate move, not a
 * reflex). The rehearsal read carries the bet — has the operator
 * pre-decided, or are they about to improvise — the opening line shows
 * the actual first words, the concession ladder proves the escalation
 * path is decided in advance, the pushback sheet is the dialogue map,
 * the outcome capture closes the loop, and the handoff carries the
 * rehearsal back into the deal. Composed on the library over the
 * unchanged seed-script + persistence engine.
 */

const OUTCOMES: ReadonlyArray<NegotiationOutcome> = [
    "held_position",
    "moved_one_step",
    "moved_two_plus",
    "walked_away",
    "lost_to_pricing"
];

const COST_LABEL: Record<"free" | "low" | "mid" | "high", string> = {
    free: "FREE",
    low: "LOW",
    mid: "MID",
    high: "HIGH"
};

const flash = signal<string>("");
let flashTimer: ReturnType<typeof setTimeout> | null = null;
function setFlash(msg: string): void {
    flash.value = msg;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
        flash.value = "";
    }, 1800);
}

function onFreeze(): void {
    const frozen = freezeDraft();
    setFlash(
        frozen.outcome
            ? `Frozen — ${OUTCOME_LABEL[frozen.outcome].toLowerCase()}.`
            : "Frozen into the history log."
    );
}

function LearningInput(): JSX.Element {
    return (
        <form
            class="ngd-learning__form"
            onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const input = form.querySelector(
                    "input"
                ) as HTMLInputElement | null;
                if (input && input.value.trim()) {
                    appendLearning(input.value);
                    input.value = "";
                }
            }}
        >
            <input
                type="text"
                class="ds-input ngd-learning__input"
                placeholder={t("Lesson — one sentence.")}
            />
            <button type="submit" class="ds-btn ds-btn--secondary">
                {t("Log it")}
            </button>
        </form>
    );
}

export function RehearsalObject(): JSX.Element {
    const d = draft.value;
    const read = prepRead();
    const tone = prepTone(read.band);
    const ladder = d.concessionLadder;
    const pushbacks = d.pushbacks;
    const deal = draftDeal.value;
    const recent = learnings.value.slice(0, 5);
    const annotate = showsAnnotations();
    const accountName = deal?.accountName?.trim() || undefined;
    const dealId = d.dealId ?? undefined;

    return (
        <div class="ngd-object">
            {/* The rehearsal read — what you're walking in with. */}
            <div class="ngd-read">
                <div class="ngd-read__head">
                    <Kicker>{t("WHAT YOU'RE WALKING IN WITH")}</Kicker>
                    <StatusChip label={read.bandLabel} tone={tone} />
                    <span class="ngd-read__score">
                        {read.score}
                        <span class="ngd-read__cap">/100</span>
                    </span>
                </div>
                <p class="ngd-read__title">{read.title}</p>
                <p class="ngd-read__move">{read.nextMove}</p>
                {annotate && read.gaps.length > 0 ? (
                    <ul class="ngd-read__gaps">
                        {read.gaps.map((g) => (
                            <li key={g}>{g}</li>
                        ))}
                    </ul>
                ) : null}
            </div>

            {/* The opening line — the actual first words. */}
            <div class="ngd-opening">
                <Kicker>{t("OPENING LINE")}</Kicker>
                {d.openingLine.trim() ? (
                    <p class="ngd-opening__line">“{d.openingLine.trim()}”</p>
                ) : (
                    <p class="ngd-opening__empty">
                        {t(
                            "Author your opening line in the controls — the first words, decided in advance.",
                            { class: "body" }
                        )}
                    </p>
                )}
            </div>

            {/* The concession ladder — ascending cost, decided in advance. */}
            <div class="ngd-ladder">
                <Kicker>{t("THE CONCESSION LADDER")}</Kicker>
                <p class="ngd-ladder__note">
                    {t("Whatever you give, you give for something — in advance.", {
                        class: "body"
                    })}
                </p>
                <ol class="ngd-ladder__steps" aria-label={t("Concession ladder")}>
                    {ladder.map((s, i) => (
                        <li key={s.id} class="ngd-ladder__step">
                            <Card
                                kicker={`STEP ${String(i + 1).padStart(2, "0")} · ${COST_LABEL[s.cost]}`}
                                tone={costTone(s.cost)}
                            >
                                <p class="ngd-give">
                                    <span class="ngd-give__label">{t("GIVE")}</span>
                                    {s.give}
                                </p>
                                <p class="ngd-ask">
                                    <span class="ngd-ask__label">{t("ASK")}</span>
                                    {s.ask}
                                </p>
                            </Card>
                        </li>
                    ))}
                </ol>
            </div>

            {/* The pushback sheet — the dialogue map. */}
            <div class="ngd-pushbacks">
                <Kicker>{t("WHEN THEY PUSH BACK")}</Kicker>
                <ul class="ngd-pushbacks__list" aria-label={t("Pushback templates")}>
                    {pushbacks.map((p) => (
                        <li key={p.id} class="ngd-pushback">
                            <p class="ngd-pushback__trigger">
                                <span class="ngd-pushback__label">{t("They say")}</span>
                                <em>{p.trigger}</em>
                            </p>
                            <p class="ngd-pushback__response">
                                <span class="ngd-pushback__label">{t("You say")}</span>
                                {p.response}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>

            {/* The outcome capture — close the loop after the conversation. */}
            <div class="ngd-outcome">
                <div class="ngd-outcome__head">
                    <Kicker>{t("AFTER THE CONVERSATION")}</Kicker>
                    {flash.value ? (
                        <span class="ngd-flash" role="status">
                            {flash.value}
                        </span>
                    ) : null}
                </div>
                <Textarea
                    rows={3}
                    value={d.notes}
                    onInput={setNotes}
                    placeholder={t("What surprised you? Where did the pressure come from?", {
                        class: "body"
                    })}
                />
                <div class="ngd-outcome__pick">
                    <span class="ds-field__label">{t("Outcome")}</span>
                    <div
                        class="ngd-outcome__buttons"
                        role="group"
                        aria-label={t("Log the outcome")}
                    >
                        {OUTCOMES.map((o) => (
                            <Button
                                key={o}
                                variant={d.outcome === o ? "primary" : "secondary"}
                                onClick={() => logOutcome(o)}
                            >
                                {OUTCOME_LABEL[o]}
                            </Button>
                        ))}
                    </div>
                    {d.outcome ? (
                        <StatusChip
                            label={OUTCOME_LABEL[d.outcome]}
                            tone={outcomeTone(d.outcome)}
                        />
                    ) : null}
                </div>
                <div class="ngd-learning">
                    <Kicker>{t("WE WON'T REPEAT THIS")}</Kicker>
                    <LearningInput />
                    {recent.length > 0 ? (
                        <ul class="ngd-learning__list">
                            {recent.map((l) => (
                                <li key={l.id}>{l.text}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <Button variant="secondary" onClick={onFreeze}>
                    {t("Freeze this negotiation")}
                </Button>
            </div>

            <HandoffStrip
                label={t("Carry the negotiation forward")}
                kicker={t("CARRY THE NEGOTIATION FORWARD")}
                title={
                    accountName
                        ? t("Push the rehearsal into the deal.", { class: "body" })
                        : t("Push this rehearsal back into the deal.", { class: "body" })
                }
                sub={
                    dealId
                        ? t("Outcome + concession ledger land on the linked deal.", {
                              class: "body"
                          })
                        : t("Link a deal in the controls first, or pick once you're there.", {
                              class: "body"
                          })
                }
                routes={[
                    {
                        label: t("Update the deal"),
                        href: hrefToDealWorkspace(dealId, accountName),
                        primary: true,
                        dataHandoff: "deal-workspace"
                    },
                    {
                        label: t("Pre-mortem this deal"),
                        href: hrefToFutureAutopsy(dealId, accountName),
                        dataHandoff: "future-autopsy"
                    },
                    {
                        label: t("Carry to an advisor"),
                        href: hrefToAdvisorDeploy(dealId, accountName),
                        dataHandoff: "advisor-deploy"
                    },
                    {
                        label: t("Sharpen the evidence"),
                        href: hrefToPocFramework(dealId, accountName),
                        dataHandoff: "poc-framework"
                    }
                ]}
            />
        </div>
    );
}
