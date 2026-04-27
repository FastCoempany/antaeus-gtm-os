import type { JSX } from "preact";
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

    return (
        <section class="cp-spine" aria-label="Agenda spine">
            <p class="cp-spine__kicker">PRESSURE SEQUENCE</p>
            <h2 class="cp-spine__title">Interrogate in this order.</h2>
            <p class="cp-spine__copy">
                Good agenda means the meeting can actually advance: the
                person is clear, the reason now is credible, and the
                result has somewhere durable to land.
            </p>
            <ol class="cp-spine__strips">
                <li class="cp-strip" data-cp-strip="open">
                    <p class="cp-strip__num">01</p>
                    <p class="cp-strip__name">Open</p>
                    <div class="cp-strip__body">
                        <p class="cp-strip__title">Open from the operating burden.</p>
                        <p class="cp-strip__copy">{openerScript}</p>
                        <p class="cp-strip__note">
                            The opener should name a real burden fast enough
                            that the meeting stops sounding generic.
                        </p>
                    </div>
                </li>

                <li class="cp-strip" data-cp-strip="reason-now">
                    <p class="cp-strip__num">02</p>
                    <p class="cp-strip__name">Reason now</p>
                    <div class="cp-strip__body">
                        <p class="cp-strip__title">{whyNowTitle}</p>
                        <p class="cp-strip__copy">{whyNowCopy}</p>
                        <p class="cp-strip__note">{whyNowNote}</p>
                    </div>
                </li>

                <li class="cp-strip" data-cp-strip="probe">
                    <p class="cp-strip__num">03</p>
                    <p class="cp-strip__name">Probe</p>
                    <div class="cp-strip__body">
                        <p class="cp-strip__title">
                            Ask only what the meeting can carry.
                        </p>
                        <p class="cp-strip__note">
                            Three probes are enough if they surface ownership,
                            authority, and timing.
                        </p>
                        <ol class="cp-probes">
                            {probes.map((q, i) => (
                                <li key={i} class="cp-probes__row">
                                    <span class="cp-probes__num">
                                        {String(i + 1).padStart(2, "0")}
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
                    <p class="cp-strip__num">04</p>
                    <p class="cp-strip__name">Advance ask</p>
                    <div class="cp-strip__body">
                        <p class="cp-strip__title">
                            Leave with a move the board can trust.
                        </p>
                        <p class="cp-strip__copy">{advance.ask}</p>
                        <p class="cp-strip__note">{advance.note}</p>
                    </div>
                </li>
            </ol>
        </section>
    );
}
