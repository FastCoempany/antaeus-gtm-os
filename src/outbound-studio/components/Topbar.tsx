import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { allTouches } from "../state";

/**
 * Topbar — kicker + serif thesis + dynamic count.
 *
 * Per canon §4.8 the room routes "one live outbound line" — the
 * topbar reads as the operator rack: calm, focused, and serious about
 * not turning into a template-spam generator.
 */
export function Topbar(): JSX.Element {
    const count = allTouches.value.length;
    const touchLabel = count === 1 ? "touch" : "touches";
    return (
        <header class="ob-topbar">
            <BackButton />
            <p class="ob-topbar__kicker">
                OUTBOUND STUDIO · WAVE 1 ·{" "}
                {count > 0
                    ? `${count} ${touchLabel} logged`
                    : "no touches yet"}
            </p>
            <h1 class="ob-topbar__title">
                Route one live line. With a named strain.
            </h1>
            <p class="ob-topbar__sub">
                Account × buyer × temperature × trigger → the exact send
                line. No template spam, no generic category language. The
                operator rack carries the strain.
            </p>
        </header>
    );
}
