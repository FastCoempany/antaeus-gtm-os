import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    draft,
    linkedDeal,
    matchedAccount,
    topSignalHeadline
} from "../state";
import { evaluateQuality } from "../lib/quality";
import { getAdvanceAsk } from "../lib/advance";
import { questionsFor, unquoteQuestion } from "../lib/personas";

/**
 * AgendaSpine — Wave 3 implementation.
 *
 * Per canon §4.11 the canonical strips are: Open / Reason now / Probe /
 * Advance ask. Each strip renders the personalized copy from Wave 2's
 * helpers — opener varies on top signal, reason-now picks between
 * signal/notes/fallback, probe pulls 3 questions from the active
 * persona's bank, advance ask + note come from `getAdvanceAsk`.
 */
export function AgendaSpine(): JSX.Element {
    const d = draft.value;
    const m = matchedAccount.value;
    const linked = linkedDeal.value;
    const top = topSignalHeadline.value;
    const quality = evaluateQuality({
        draft: d,
        matchedAccount: m,
        linkedDeal: linked
    });
    const advance = getAdvanceAsk(quality, d, linked);
    const probes = questionsFor(d.persona);

    const openerScript = top
        ? `I noticed ${top.toLowerCase()} and wanted to understand how that is changing priorities on your side.`
        : "Thanks for making time. I wanted to start with how your team is handling this workflow today and where the handoff is breaking.";

    const whyNowTitle = top
        ? "Live pressure is already visible."
        : d.customNotes.trim().length >= 20
          ? "Manual context is carrying the why-now."
          : "The why-now is still thin.";
    const whyNowCopy = top
        ? top
        : d.customNotes.trim().length >= 20
          ? d.customNotes.trim()
          : "Use Signal Console or manual notes to justify why this meeting should happen now, not vaguely later.";
    const whyNowNote = top
        ? "Use the signal, not abstract curiosity, to justify the meeting."
        : "The call will stay soft until the reason now is concrete.";

    // Pressure Script V01 — scripted-quote lines per strip. The
    // operator should be able to say each <em> line out loud and
    // have it land. Authored sentences, not directorial commentary.
    const openerQuote = openerScript;
    const reasonNowQuote = top
        ? `Saw the ${top.toLowerCase()} signal land — wanted to understand how that's reshaping priorities on your side, before it shows up in the quarterly review.`
        : d.customNotes.trim().length >= 20
          ? `I'm bringing this conversation now because ${d.customNotes.trim().slice(0, 140)}${d.customNotes.trim().length > 140 ? "…" : ""}`
          : "Help me name the why-now in your words — what's changed since last quarter that makes this meeting worth holding?";
    const firstProbe = probes[0] ? unquoteQuestion(probes[0]) : "";
    const probeQuote = firstProbe.length > 0
        ? firstProbe
        : "Walk me through how this works today — where does the handoff break, and who owns the cleanup?";
    const advanceQuote = advance.ask;

    return (
        <section class="cp-spine" aria-label={t("Call agenda")}>
            <p class="cp-spine__kicker">{t("AGENDA")}</p>
            <h2 class="cp-spine__title">{t("Run the call in this order.")}</h2>
            <ol class="cp-spine__strips">
                <li class="cp-strip" data-cp-strip="open">
                    <p class="cp-strip__num">1.</p>
                    <p class="cp-strip__name">{t("Open")}</p>
                    <div class="cp-strip__body">
                        <p class="cp-strip__title">{t("Open from the operating burden.")}</p>
                        <p class="cp-strip__copy">{openerScript}</p>
                        <em class="cp-strip__quote">"{openerQuote}"</em>
                        <p class="cp-strip__note">
                            The opener should name a real burden fast enough
                            that the meeting stops sounding generic.
                        </p>
                    </div>
                </li>

                <li class="cp-strip" data-cp-strip="reason-now">
                    <p class="cp-strip__num">2.</p>
                    <p class="cp-strip__name">{t("Reason now")}</p>
                    <div class="cp-strip__body">
                        <p class="cp-strip__title">{whyNowTitle}</p>
                        <p class="cp-strip__copy">{whyNowCopy}</p>
                        <em class="cp-strip__quote">"{reasonNowQuote}"</em>
                        <p class="cp-strip__note">{whyNowNote}</p>
                    </div>
                </li>

                <li class="cp-strip" data-cp-strip="probe">
                    <p class="cp-strip__num">3.</p>
                    <p class="cp-strip__name">{t("Probe")}</p>
                    <div class="cp-strip__body">
                        <p class="cp-strip__title">
                            Ask only what the meeting can carry.
                        </p>
                        <p class="cp-strip__note">
                            Three probes are enough if they surface ownership,
                            authority, and timing.
                        </p>
                        <em class="cp-strip__quote">"{probeQuote}"</em>
                        <ol class="cp-probes">
                            {probes.map((q, i) => (
                                <li key={i} class="cp-probes__row">
                                    <span class="cp-probes__num">
                                        {i + 1}.
                                    </span>
                                    <span class="cp-probes__copy">
                                        {unquoteQuestion(q)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </li>

                <li class="cp-strip" data-cp-strip="advance">
                    <p class="cp-strip__num">4.</p>
                    <p class="cp-strip__name">{t("Advance ask")}</p>
                    <div class="cp-strip__body">
                        <p class="cp-strip__title">
                            Leave with a move the board can trust.
                        </p>
                        <p class="cp-strip__copy">{advance.ask}</p>
                        <em class="cp-strip__quote">"{advanceQuote}"</em>
                        <p class="cp-strip__note">{advance.note}</p>
                    </div>
                </li>
            </ol>
        </section>
    );
}
