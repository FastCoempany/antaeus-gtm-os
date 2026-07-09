import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    draft,
    setOpeningLine,
    setStartingPosition,
    setWalkawayPosition
} from "../state";

/**
 * PositionRack — start / walkaway / opening line.
 *
 * Per canon §4.16b: the room makes every concession a deliberate
 * move. That requires the operator to have ALREADY DECIDED on the
 * starting position, the walkaway, and the opening line — before
 * walking in. This rack captures all three as authored sentences,
 * not form fields.
 */
export function PositionRack(): JSX.Element {
    const d = draft.value;
    return (
        <section class="ng-positions" aria-label={t("Position rack")}>
            <h2 class="ng-section__title">{t("The three positions you've already decided.")}</h2>
            <div class="ng-positions__grid">
                <div class="ng-position">
                    <p class="ng-position__label">{t("Starting position")}</p>
                    <textarea
                        class="ng-position__textarea"
                        rows={3}
                        placeholder={t("What we open with. List price, full terms.", { class: "body" })}
                        value={d.startingPosition}
                        onInput={(e) =>
                            setStartingPosition(
                                (e.currentTarget as HTMLTextAreaElement).value
                            )
                        }
                    />
                </div>
                <div class="ng-position ng-position--walkaway">
                    <p class="ng-position__label">{t("Walkaway")}</p>
                    <textarea
                        class="ng-position__textarea"
                        rows={3}
                        placeholder={t("The line we won't cross. Below this we walk.", { class: "body" })}
                        value={d.walkawayPosition}
                        onInput={(e) =>
                            setWalkawayPosition(
                                (e.currentTarget as HTMLTextAreaElement).value
                            )
                        }
                    />
                </div>
                <div class="ng-position">
                    <p class="ng-position__label">{t("Opening line")}</p>
                    <textarea
                        class="ng-position__textarea"
                        rows={3}
                        placeholder={t("The actual first words. Authored, not improvised.", { class: "body" })}
                        value={d.openingLine}
                        onInput={(e) =>
                            setOpeningLine(
                                (e.currentTarget as HTMLTextAreaElement).value
                            )
                        }
                    />
                </div>
            </div>
        </section>
    );
}
