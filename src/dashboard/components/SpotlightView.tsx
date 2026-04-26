import type { JSX } from "preact";
import { commandSummary, spotlightObject } from "../state";
import { FocalObject } from "./FocalObject";
import { QueueRail } from "./QueueRail";

/**
 * SpotlightView — Wave 3 implementation.
 *
 * Per canon §4.2: one focal object + one dominant move + a recessive
 * "next 6" rail. Focal object resolves via spotlightObject (focused id
 * if present, else engine's top-ranked). The rail shows the rest of
 * the queue. Both react to engineInput / focusedCommandId via signals.
 *
 * Wave 5 will provide the live engineInput from the cross-room
 * snapshot aggregator. Until then, the room renders its empty state.
 */
export function SpotlightView(): JSX.Element {
    const summary = commandSummary.value;
    const focal = spotlightObject.value;

    if (!focal) {
        return (
            <section class="db-spotlight" aria-label="Spotlight">
                <div class="db-spotlight__focus">
                    <p class="db-spotlight__placeholder">
                        Nothing under pressure. The Brief / Spotlight / Queue
                        modes light up once at least one room publishes an
                        active deal, signal, or recovery move.
                    </p>
                </div>
                <aside class="db-spotlight__rail" aria-label="Next ranked items">
                    <p class="db-spotlight__rail-kicker">NEXT</p>
                    <p class="db-spotlight__rail-empty">—</p>
                </aside>
            </section>
        );
    }

    return (
        <section class="db-spotlight" aria-label="Spotlight">
            <div class="db-spotlight__focus">
                <FocalObject object={focal} />
            </div>
            <QueueRail objects={summary.queue} />
        </section>
    );
}
