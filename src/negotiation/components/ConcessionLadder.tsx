import type { JSX } from "preact";
import { draft } from "../state";
import type { ConcessionStep } from "../lib/types";

const COST_LABEL: Record<ConcessionStep["cost"], string> = {
    free: "FREE",
    low: "LOW",
    mid: "MID",
    high: "HIGH"
};

/**
 * ConcessionLadder — the 3-step ladder per canon §4.16b primitive.
 *
 * Each step is a give/ask pair with a cost classification (free /
 * low / mid / high). Read top-to-bottom = ascending cost; the
 * ladder is the operator's pre-decided escalation path. Whatever
 * we give, we give in exchange for what we ask.
 */
export function ConcessionLadder(): JSX.Element {
    const ladder = draft.value.concessionLadder;
    return (
        <section class="ng-ladder" aria-label="Concession ladder">
            <h2 class="ng-section__title">
                The ladder. Whatever we give, we give for something.
            </h2>
            <ol class="ng-ladder__steps">
                {ladder.map((s, i) => (
                    <li
                        key={s.id}
                        class={`ng-ladder__step ng-ladder__step--${s.cost}`}
                    >
                        <span class="ng-ladder__index">
                            STEP {String(i + 1).padStart(2, "0")}
                        </span>
                        <span class={`ng-ladder__cost ng-ladder__cost--${s.cost}`}>
                            {COST_LABEL[s.cost]}
                        </span>
                        <div class="ng-ladder__pair">
                            <p class="ng-ladder__give">
                                <span class="ng-ladder__give-label">GIVE</span>
                                {s.give}
                            </p>
                            <p class="ng-ladder__ask">
                                <span class="ng-ladder__ask-label">ASK</span>
                                {s.ask}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>
            <p class="ng-ladder__note">
                Seed ladder from the legacy CFO Negotiation room. Carry
                forward, edit per deal, never improvise the order in the
                room.
            </p>
        </section>
    );
}
