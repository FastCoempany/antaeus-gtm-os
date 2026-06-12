import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { allTouches } from "../state";

/**
 * Topbar — kicker + headline (demoted) + dynamic touch count.
 *
 * Outbound Studio audit (2026-05):
 *   - BackButton removed. Room is a primary destination.
 *   - H1 demoted from hero weight — the OutputPanel send line is
 *     the page's working hero.
 *   - Subtitle paragraph retired (design documentation; the
 *     switchboard form below already conveys what the inputs do).
 *   - "Named strain" / "Set the strain" vocabulary retired across
 *     the room (replaced with "angle") — "strain" was internal,
 *     unexplained to an operator.
 */
export function Topbar(): JSX.Element {
    const count = allTouches.value.length;
    const touchLabel = count === 1 ? "touch" : "touches";
    return (
        <header class="ob-topbar">
            <p class="ob-topbar__kicker">
                OUTBOUND STUDIO ·{" "}
                {count > 0
                    ? `${count} ${touchLabel} logged`
                    : t("no touches yet")}
            </p>
            <h1 class="ob-topbar__title">
                {t(
                    "Route one live line — to one named buyer, with one specific angle.",
                    { class: "body" }
                )}
            </h1>
        </header>
    );
}
