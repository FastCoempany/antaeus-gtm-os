import type { JSX } from "preact";
import {
    appendLearning,
    draft,
    freezeDraft,
    learnings,
    logOutcome,
    setNotes
} from "../state";
import { OUTCOME_LABEL, type NegotiationOutcome } from "../lib/types";
import { hrefToAdvisorDeploy, hrefToDealWorkspace } from "../lib/cross-room";

const OUTCOMES: ReadonlyArray<NegotiationOutcome> = [
    "held_position",
    "moved_one_step",
    "moved_two_plus",
    "walked_away",
    "lost_to_pricing"
];

/**
 * OutcomeRack — capture what actually happened + lessons-learned log
 * + cross-room handoff CTAs.
 *
 * Per canon §4.16b: "rehearsal outcomes + concession ledger into
 * Deal Workspace; loss-pattern feedback into Future Autopsy; patterns
 * into Founding GTM §6 ('Why we win')." Outcomes feed back into
 * the Deal Workspace deal record; loss patterns reach Future Autopsy.
 */
export function OutcomeRack(): JSX.Element {
    const d = draft.value;
    const recent = learnings.value.slice(0, 5);
    return (
        <section class="ng-outcome" aria-label="Outcome + learnings">
            <h2 class="ng-section__title">
                After the conversation: what actually happened.
            </h2>

            <div class="ng-outcome__notes">
                <label class="ng-outcome__notes-label">
                    Notes (free-form)
                    <textarea
                        class="ng-outcome__notes-textarea"
                        rows={4}
                        value={d.notes}
                        placeholder="What surprised you? Where did pressure come from? What did they say after the third pushback?"
                        onInput={(e) =>
                            setNotes((e.currentTarget as HTMLTextAreaElement).value)
                        }
                    />
                </label>
            </div>

            <div class="ng-outcome__row">
                <p class="ng-outcome__label">Outcome</p>
                <div class="ng-outcome__buttons">
                    {OUTCOMES.map((o) => (
                        <button
                            key={o}
                            type="button"
                            class={`ng-outcome__btn${
                                d.outcome === o ? " is-active" : ""
                            }`}
                            onClick={() => logOutcome(o)}
                        >
                            {OUTCOME_LABEL[o]}
                        </button>
                    ))}
                </div>
            </div>

            <div class="ng-outcome__learning">
                <p class="ng-outcome__label">"We won't repeat this."</p>
                <LearningInput />
                {recent.length > 0 && (
                    <ul class="ng-learning__list">
                        {recent.map((l) => (
                            <li key={l.id} class="ng-learning__row">
                                {l.text}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div class="ng-outcome__handoff">
                <button
                    type="button"
                    class="ng-handoff__btn ng-handoff__btn--primary"
                    onClick={() => freezeDraft()}
                >
                    Freeze this negotiation
                </button>
                {d.dealId && (
                    <>
                        <a
                            class="ng-handoff__btn"
                            href={hrefToDealWorkspace(d.dealId)}
                        >
                            Push outcome to Deal Workspace
                        </a>
                        <a
                            class="ng-handoff__btn"
                            href={hrefToAdvisorDeploy(d.dealId)}
                        >
                            Get advisor air cover
                        </a>
                    </>
                )}
            </div>
        </section>
    );
}

function LearningInput(): JSX.Element {
    return (
        <form
            class="ng-learning__form"
            onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const input = form.querySelector("input") as HTMLInputElement | null;
                if (input && input.value.trim()) {
                    appendLearning(input.value);
                    input.value = "";
                }
            }}
        >
            <input
                type="text"
                class="ng-learning__input"
                placeholder="Lesson — one sentence."
            />
            <button type="submit" class="ng-learning__submit">
                Log
            </button>
        </form>
    );
}
