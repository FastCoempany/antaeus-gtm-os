import type { JSX } from "preact";
import { commandSummary, focusedCommandId, setFocusedCommand } from "../state";
import { explainCommandObject } from "../lib/command-intelligence";
import { CommandReasons } from "./CommandReasons";

/**
 * QueueView — Wave 4 implementation.
 *
 * Per canon §4.2 the Queue mode shows the ranked list as a triage
 * surface — same ranking as Spotlight but exposed wholesale so the
 * operator can scan and pick. Each row carries family kicker, title,
 * score, "Why this order" rationale, reason chips, and the dominant
 * action.
 */
export function QueueView(): JSX.Element {
    const summary = commandSummary.value;
    const focused = focusedCommandId.value;

    if (!summary.ranked.length) {
        return (
            <section class="db-queue" aria-label="Queue">
                <p class="db-queue__placeholder">
                    No items in the queue. Once a publishing room emits an
                    active deal, signal, or recovery move, the ranked rows
                    appear here.
                </p>
            </section>
        );
    }

    return (
        <section class="db-queue" aria-label="Queue">
            <ol class="db-queue__list">
                {summary.ranked.map((object, idx) => {
                    const explanation = explainCommandObject(object, "queue");
                    const primary = object.actions[0];
                    const isActive = object.id === focused;
                    return (
                        <li key={object.id}>
                            <article
                                class={`db-queue__item${isActive ? " is-active" : ""}`}
                            >
                                <header class="db-queue__item-header">
                                    <span class="db-queue__rank">
                                        {String(idx + 1).padStart(2, "0")}
                                    </span>
                                    <span class="db-queue__family">
                                        {object.roomFamilyLabel}
                                    </span>
                                    <span class="db-queue__score">{object.score}</span>
                                </header>
                                <h3 class="db-queue__title">
                                    <button
                                        type="button"
                                        class="db-queue__title-btn"
                                        onClick={() =>
                                            setFocusedCommand(
                                                isActive ? null : object.id
                                            )
                                        }
                                        aria-pressed={isActive}
                                    >
                                        {object.title}
                                    </button>
                                </h3>
                                <p class="db-queue__why">
                                    <span class="db-queue__why-title">
                                        {explanation.title}
                                    </span>{" "}
                                    <span class="db-queue__why-copy">
                                        {explanation.copy}
                                    </span>
                                </p>
                                <CommandReasons reasons={object.scoreReasons} />
                                {primary ? (
                                    <a
                                        class="db-queue__cta"
                                        href={primary.href}
                                    >
                                        {primary.label}
                                    </a>
                                ) : null}
                            </article>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
