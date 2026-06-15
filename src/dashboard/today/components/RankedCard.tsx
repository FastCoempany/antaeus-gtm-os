import type { JSX } from "preact";
import { Card, RiskCard } from "@/components";
import { sliceAffordances } from "@/lib/density";
import type { IconName } from "@/icons";
import type { CommandFamily, CommandObject } from "../../lib/types";
import { ActionLink } from "./ActionLink";
import { causeOf, scoreOf, toneOf } from "../lib/adapters";

/**
 * The sacred-noun glyph for a ranked object, by command family (spec
 * 09). A risk card wears the at-risk mark; an advisor object the
 * advisor mark; an opportunity reads as a signal; a move as a send.
 */
const FAMILY_ICON: Record<CommandFamily, IconName> = {
    risk: "at-risk",
    advisor: "advisor",
    opportunity: "signal",
    move: "send",
    icp: "icp",
    system: "observation"
};

/**
 * One ranked object as a Grounded card. Risk-family objects render as a
 * RiskCard (cause + score + the move at recovery scale); the rest as a
 * toned Card carrying their copy + actions. Each card wears its sacred-
 * noun glyph. Actions respect the density gradient — Show me how reveals
 * every move; Step back keeps the primary + one and collapses the rest.
 * `offset` lets a zone mark its single most-pressured item (spec §2.4).
 */
export function RankedCard(props: {
    readonly object: CommandObject;
    readonly offset?: boolean;
    readonly offsetTag?: string;
}): JSX.Element {
    const o = props.object;
    const primary = o.actions.find((a) => a.variant === "primary") ?? o.actions[0];
    // Primary always leads; density decides how many of the rest show.
    const ordered = primary
        ? [primary, ...o.actions.filter((a) => a !== primary)]
        : [...o.actions];
    const { visible } = sliceAffordances(ordered, { sliceIndex: 2 });
    const actions = (
        <>
            {visible.map((a) => (
                <ActionLink key={a.href + a.label} action={a} primary={a === primary} />
            ))}
        </>
    );
    const icon = FAMILY_ICON[o.commandFamily];

    if (o.commandFamily === "risk") {
        return (
            <RiskCard
                kicker={o.roomFamilyLabel}
                icon={icon}
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
            icon={icon}
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
