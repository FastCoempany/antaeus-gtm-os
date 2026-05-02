import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { allNegotiations, draft } from "../state";

export function Topbar(): JSX.Element {
    const count = allNegotiations.value.length;
    const counterparty = draft.value.counterpartyName;
    return (
        <header class="ng-topbar">
            <BackButton />
            <p class="ng-topbar__kicker">
                Live instrument · Negotiation desk{count > 0 ? ` · ${count} on file` : ""}
            </p>
            <h1 class="ng-topbar__title">
                Every concession is a deliberate move, not a reflex.
            </h1>
            <p class="ng-topbar__sub">
                Procurement, finance, legal, GC. Walk in with a starting
                position, a walkaway, and a concession ladder you've
                already decided on. Whatever you give, you give on purpose.
            </p>
            {counterparty && (
                <p class="ng-topbar__active">Drafting against: <strong>{counterparty}</strong></p>
            )}
        </header>
    );
}
