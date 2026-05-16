import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import { closeCeremony } from "../state";

/**
 * CeremonyOverlay — the §4.19 set-piece moment.
 *
 * Per canon: "fire a set-piece moment (not a toast). Scope: animated
 * reveal in the Founding GTM room — the verdict change, the kit
 * count moving (e.g. 2/7 → 4/7), a serif headline ('the kit just
 * became real'), and a one-time CTA to share the workspace in
 * read-mode. Only fires once per workspace per upward transition.
 * Downward transitions are silent."
 *
 * The overlay covers the room. Closing paths: explicit Continue,
 * Escape. No backdrop click — the moment is supposed to land, not
 * be dismissed accidentally.
 */

export interface CeremonyOverlayProps {
    readonly fromLabel: string;
    readonly toLabel: string;
    readonly sectionsBefore: number;
    readonly sectionsAfter: number;
}

export function CeremonyOverlay(props: CeremonyOverlayProps): JSX.Element {
    useEffect(() => {
        function onKey(e: KeyboardEvent): void {
            if (e.key === "Escape") closeCeremony();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div class="fg-ceremony" role="dialog" aria-modal="true">
            <div class="fg-ceremony__backdrop" aria-hidden="true" />
            <div class="fg-ceremony__panel">
                <p class="fg-ceremony__kicker">MILESTONE</p>
                <h2 class="fg-ceremony__headline">
                    The kit just became real.
                </h2>
                <p class="fg-ceremony__sub">
                    Readiness moved from <strong>{props.fromLabel}</strong>{" "}
                    to <strong>{props.toLabel}</strong>. This kit is now
                    something a first hire could actually open on day one.
                </p>
                <div class="fg-ceremony__counts">
                    <div class="fg-ceremony__count-cell">
                        <span class="fg-ceremony__count-num">
                            {props.sectionsBefore}/7
                        </span>
                        <span class="fg-ceremony__count-cap">before</span>
                    </div>
                    <span class="fg-ceremony__arrow">→</span>
                    <div class="fg-ceremony__count-cell fg-ceremony__count-cell--after">
                        <span class="fg-ceremony__count-num">
                            {props.sectionsAfter}/7
                        </span>
                        <span class="fg-ceremony__count-cap">now</span>
                    </div>
                </div>
                <div class="fg-ceremony__actions">
                    <button
                        type="button"
                        class="fg-ceremony__btn fg-ceremony__btn--primary"
                        onClick={closeCeremony}
                    >
                        Read the kit
                    </button>
                </div>
            </div>
        </div>
    );
}
