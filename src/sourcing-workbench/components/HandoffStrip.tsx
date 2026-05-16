import type { JSX } from "preact";
import { stats } from "../state";
import {
    hrefToOutboundStudio,
    hrefToSignalConsole,
    hrefToTerritoryArchitect
} from "../lib/handoff";

/**
 * HandoffStrip — bottom-of-room handoff. Per canon §4.6, the room
 * pushes qualified accounts into Signal Console (downstream) and
 * inherits thesis vocabulary from Territory Architect (upstream).
 * Outbound Studio is the third route once a name is push-ready.
 */
export function HandoffStrip(): JSX.Element {
    const ready = stats.value.ready;
    return (
        <section class="sw-handoff" aria-label="Cross-room handoff">
            <header class="sw-section__head">
                <p class="sw-section__kicker">CARRY THE WORK FORWARD</p>
                <h2 class="sw-section__title">Hand the names off.</h2>
                <p class="sw-section__sub">
                    {ready === 0
                        ? "Nothing is push-ready yet. Sharpen a name to ready before routing."
                        : `${ready} ${
                              ready === 1 ? "name is" : "names are"
                          } ready to leave the workbench.`}
                </p>
            </header>
            <div class="sw-handoff__row">
                <a class="sw-btn sw-btn--ghost" href={hrefToTerritoryArchitect()}>
                    Refine the territory
                </a>
                <a class="sw-btn sw-btn--primary" href={hrefToSignalConsole()}>
                    Rank live signals
                </a>
                <a class="sw-btn sw-btn--ghost" href={hrefToOutboundStudio()}>
                    Compose outbound
                </a>
            </div>
        </section>
    );
}
