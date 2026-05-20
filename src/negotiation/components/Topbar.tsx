import type { JSX } from "preact";
import { allNegotiations, draft, draftDeal } from "../state";
import { ASK_MOMENT_LABEL, COUNTERPARTY_LABEL } from "../lib/types";

/**
 * Topbar — kicker + headline + active counterparty/deal context.
 *
 * Phase 4: gained a contextual kicker tail (NEGOTIATION · {deal} ·
 * {counterparty} · {ask-moment}) so Sarah can see, before her eyes
 * have left the topbar, which deal she's preparing against. Same
 * pattern Settings + Dashboard adopted in Phase 2.
 *
 * Program 6 / PR 1: the room-level BackButton was hoisted into the
 * RoomChrome strip (top-of-room, right side) so every room renders
 * the back-pill consistently. Topbar no longer owns it.
 */
export function Topbar(): JSX.Element {
    const count = allNegotiations.value.length;
    const counterparty = draft.value.counterparty;
    const askMoment = draft.value.askMoment;
    const counterpartyName = draft.value.counterpartyName.trim();
    const deal = draftDeal.value;

    const kickerParts: string[] = ["Live instrument · Negotiation desk"];
    if (deal && deal.accountName) kickerParts.push(deal.accountName);
    kickerParts.push(COUNTERPARTY_LABEL[counterparty]);
    kickerParts.push(ASK_MOMENT_LABEL[askMoment]);
    if (count > 0) kickerParts.push(`${count} on file`);

    return (
        <header class="ng-topbar">
            <p class="ng-topbar__kicker">{kickerParts.join(" · ")}</p>
            <h1 class="ng-topbar__title">
                Every concession is a deliberate move, not a reflex.
            </h1>
            <p class="ng-topbar__sub">
                Procurement, finance, legal, GC, infosec. Walk in with a
                starting position, a walkaway, and a concession ladder
                you've already decided on. Whatever you give, you give on
                purpose.
            </p>
            {counterpartyName && (
                <p class="ng-topbar__active">
                    Drafting against: <strong>{counterpartyName}</strong>
                </p>
            )}
        </header>
    );
}
