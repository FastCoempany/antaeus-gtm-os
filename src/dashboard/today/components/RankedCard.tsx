import type { JSX } from "preact";
import { Card, RiskCard } from "@/components";
import type { CommandObject } from "../../lib/types";
import { ActionLink } from "./ActionLink";
import { causeOf, scoreOf, toneOf } from "../lib/adapters";

/**
 * One ranked object as a Grounded card. Risk-family objects render as a
 * RiskCard (cause + score + the move at recovery scale); the rest as a
 * toned Card carrying their copy + actions. `offset` lets a zone mark
 * its single most-pressured item (spec 03 §2.4).
 */
export function RankedCard(props: {
    readonly object: CommandObject;
    readonly offset?: boolean;
    readonly offsetTag?: string;
}): JSX.Element {
    const o = props.object;
    const primary = o.actions.find((a) => a.variant === "primary") ?? o.actions[0];
    const actions = (
        <>
            {primary ? <ActionLink action={primary} primary /> : null}
            {o.actions
                .filter((a) => a !== primary)
                .slice(0, 1)
                .map((a) => (
                    <ActionLink key={a.href + a.label} action={a} />
                ))}
        </>
    );

    if (o.commandFamily === "risk") {
        return (
            <RiskCard
                kicker={o.roomFamilyLabel}
                title={o.title}
                cause={causeOf(o)}
                score={scoreOf(o)}
                actions={actions}
            />
        );
    }

    return (
        <Card
            kicker={o.roomFamilyLabel}
            title={o.title}
            tone={toneOf(o)}
            offset={props.offset}
            offsetTag={props.offsetTag}
            footer={actions}
        >
            {o.copy ? <p class="ds-card__copy">{o.copy}</p> : null}
        </Card>
    );
}
