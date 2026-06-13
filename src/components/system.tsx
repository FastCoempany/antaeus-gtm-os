import type { ComponentChildren, JSX } from "preact";
import { t } from "@/lib/voice/t";
import { Button } from "./action";
import { Card } from "./card";
import { Kicker } from "./display";

/**
 * System cards (03 §4.1 System) — compositions of the core that carry
 * a specific cross-room shape.
 *
 * PatternCard is the Briefing's read: an authored claim, its
 * evidence, and how sure the system is — stated plainly, never
 * hedged into mush (01 §2.4). ProposalCard is the Phase F surface:
 * what the system noticed, what would change, and the operator's
 * three moves (accept / snooze / dismiss) — bounded self-modification
 * stays bounded by acceptance. ReadinessReadout is a plain-sentence
 * state — never a score bar, never a container noun.
 */

export function PatternCard(props: {
    /** The authored read — one to three sentences. */
    readonly claim: string;
    readonly evidence: ReadonlyArray<string>;
    /** How sure the system is, as a plain phrase. */
    readonly howSure: string;
    readonly kicker?: string;
    readonly moves?: ComponentChildren;
}): JSX.Element {
    return (
        <Card kicker={props.kicker ?? t("THE SYSTEM'S READ")} tone="blue">
            <p class="ds-card__copy ds-pattern__claim">{props.claim}</p>
            <ul class="ds-pattern__evidence">
                {props.evidence.map((e) => (
                    <li key={e}>{e}</li>
                ))}
            </ul>
            <p class="ds-pattern__sure">{props.howSure}</p>
            {props.moves ? (
                <footer class="ds-card__foot">{props.moves}</footer>
            ) : null}
        </Card>
    );
}

export function ProposalCard(props: {
    /** What the system noticed, as a peer would say it. */
    readonly noticed: string;
    /** What would change if the operator says yes. */
    readonly change: string;
    readonly onAccept: () => void;
    readonly onSnooze: () => void;
    readonly onDismiss: () => void;
    readonly busy?: boolean;
}): JSX.Element {
    return (
        <Card kicker={t("THE SYSTEM HAS A SUGGESTION")} tone="orange">
            <p class="ds-card__copy">{props.noticed}</p>
            <p class="ds-card__copy ds-proposal__change">{props.change}</p>
            <footer class="ds-card__foot">
                <Button
                    variant="accent"
                    onClick={props.onAccept}
                    disabled={props.busy}
                >
                    {t("Yes, make that change")}
                </Button>
                <Button variant="ghost" onClick={props.onSnooze} disabled={props.busy}>
                    {t("Ask me again in a month")}
                </Button>
                <Button variant="ghost" onClick={props.onDismiss} disabled={props.busy}>
                    {t("Not now")}
                </Button>
            </footer>
        </Card>
    );
}

/**
 * ReadinessReadout — the state as one plain sentence the operator can
 * act on. The state name leads; the sentence carries the value.
 */
export function ReadinessReadout(props: {
    /** The gate-based state name, e.g. "Inheritable with guardrails". */
    readonly state: string;
    /** The one-sentence read under it. */
    readonly read: string;
}): JSX.Element {
    return (
        <div class="ds-readiness">
            <Kicker>{t("READINESS")}</Kicker>
            <p class="ds-readiness__state">{props.state}</p>
            <p class="ds-readiness__read">{props.read}</p>
        </div>
    );
}
