import type { JSX } from "preact";
import { setDealFilter, setFolioTab } from "../state";

/**
 * Hero — left column of the stage-grid per variant-B.
 *
 * Eyebrow + serif thesis h1 + sub line + 3-action row.
 * The thesis is sentence-shaped per canon Part II §3 — the room's
 * authored declaration that *the board lies; sharpen the live thread
 * first.*
 *
 * Hero actions are rationed: one primary (orange), one ghost,
 * one link. Per canon Part III §3 Rule 1 (one dominant move).
 */
export function Hero(): JSX.Element {
    return (
        <section class="dw-hero" aria-label="Deal workspace thesis">
            <p class="dw-hero__eyebrow">Deal review</p>
            <h1 class="dw-hero__title">
                Make the board confess where it is weak.
            </h1>
            <p class="dw-hero__sub">
                Don't scan the whole pipeline as if every deal is equal.
                Start with the live thread that's making the board flatter
                than reality.
            </p>
            <div class="dw-hero__actions">
                <button
                    type="button"
                    class="dw-hero__btn dw-hero__btn--primary"
                    onClick={() => {
                        setDealFilter("at-risk");
                        setFolioTab("queue");
                    }}
                >
                    Run intervention
                </button>
                <button
                    type="button"
                    class="dw-hero__btn dw-hero__btn--ghost"
                    onClick={() => setDealFilter("at-risk")}
                >
                    Open at-risk only
                </button>
                <button
                    type="button"
                    class="dw-hero__btn dw-hero__btn--link"
                    onClick={() => setFolioTab("win")}
                >
                    One-session win
                </button>
            </div>
        </section>
    );
}
