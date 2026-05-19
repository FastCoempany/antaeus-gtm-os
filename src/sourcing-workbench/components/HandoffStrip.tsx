import type { JSX } from "preact";
import { inboundFocus, stats } from "../state";
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
 *
 * Phase 2.3 — inbound focusObject from ICP Studio / Territory
 * Architect propagates through to the destination room's
 * focusObject. The territory/icp link gets the inbound focus; signal
 * console + outbound get the focus too (re-piping the ICP label).
 */
export function HandoffStrip(): JSX.Element {
    const ready = stats.value.ready;
    const focus = inboundFocus.value || undefined;
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
                <a
                    class="sw-btn sw-btn--ghost"
                    href={hrefToTerritoryArchitect({ focusObject: focus })}
                >
                    Refine the territory
                </a>
                <a
                    class="sw-btn sw-btn--primary"
                    href={hrefToSignalConsole({ account: focus })}
                >
                    Rank live signals
                </a>
                <a
                    class="sw-btn sw-btn--ghost"
                    href={hrefToOutboundStudio({ account: focus })}
                >
                    Compose outbound
                </a>
            </div>
        </section>
    );
}
