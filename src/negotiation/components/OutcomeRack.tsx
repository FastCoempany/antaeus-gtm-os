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

const OUTCOMES: ReadonlyArray<NegotiationOutcome> = [
    "held_position",
    "moved_one_step",
    "moved_two_plus",
    "walked_away",
    "lost_to_pricing"
];

/**
 * OutcomeRack — capture what actually happened + lessons-learned log
 * + freeze-into-history affordance.
 *
 * Cross-room handoff lives in HandoffStrip (rendered below this
 * section in Negotiation.tsx) per Phase 4 — keeping outcome capture
 * separate from cross-room navigation matches the Phase 2 pattern
 * (Deal Workspace + Discovery Studio both render HandoffStrip as
 * the bottom-of-room band).
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

            <div class="ng-outcome__freeze">
                <button
                    type="button"
                    class="ng-handoff__btn ng-handoff__btn--primary"
                    onClick={() => freezeDraft()}
                >
                    Freeze this negotiation
                </button>
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
