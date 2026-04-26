import type { JSX } from "preact";
import { ModeSwitcher } from "./ModeSwitcher";

/**
 * Topbar — kicker + title + mode switcher.
 *
 * Per canon §4.2 (Command Chamber family): "the dashboard is where the
 * hallway dies." The topbar is the only navigation surface in this
 * room; everything else is the ranked work itself.
 */
export function Topbar(): JSX.Element {
    return (
        <header class="db-topbar">
            <div class="db-topbar__lead">
                <p class="db-topbar__kicker">DASHBOARD · WAVE 1</p>
                <h1 class="db-topbar__title">What is under the most pressure right now.</h1>
                <p class="db-topbar__sub">
                    One ranked object. One dominant move. Three density modes —
                    same ranking, different surface.
                </p>
            </div>
            <ModeSwitcher />
        </header>
    );
}
