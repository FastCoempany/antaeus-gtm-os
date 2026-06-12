import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import type { CommandObject } from "../lib/types";
import { setFocusedCommand, focusedCommandId } from "../state";
import { Slice } from "./Slice";

/**
 * SliceRail — the right rail from the Soft Cut layout. Stacks ranked
 * Slice cards top-to-bottom.
 *
 * Mode behavior (per canon §4.2):
 *   - brief    → all Slices render at default weight. The narrative
 *                summary lives in the main column above the rail.
 *   - spotlight → first Slice gets the focal variant (visual
 *                emphasis); the rest render at default weight.
 *   - queue    → all Slices render at default weight, equal-weight
 *                triage list.
 *
 * Focused-command-id is honored across modes — clicking a Slice
 * title swaps the focal card in spotlight mode (the rest of the
 * room reflows automatically because focusedCommandId is reactive).
 */

interface Props {
    readonly objects: ReadonlyArray<CommandObject>;
    readonly mode: "brief" | "spotlight" | "queue";
}

export function SliceRail({ objects, mode }: Props): JSX.Element {
    const focused = focusedCommandId.value;
    // In spotlight mode, the focused-or-first card renders enlarged.
    // In brief / queue modes, every card is equal weight.
    const focalId = mode === "spotlight"
        ? (focused ?? objects[0]?.id ?? null)
        : null;

    if (objects.length === 0) {
        return (
            <aside class="db-rail db-rail--empty" aria-label={t("Ranked pressure")}>
                <header class="db-rail__head">
                    <p class="db-rail__kicker">{t("MOST PRESSURE")}</p>
                    <p class="db-rail__title">{t("What needs you")}</p>
                </header>
                <p class="db-rail__empty">
                    {t(
                        "No ranked items yet. The other rooms haven't sent anything for the dashboard to rank — the list lights up the moment one of them does.",
                        { class: "body" }
                    )}
                </p>
            </aside>
        );
    }

    return (
        <aside class="db-rail" aria-label={t("Ranked pressure")}>
            <header class="db-rail__head">
                <p class="db-rail__kicker">MOST PRESSURE · {objects.length}</p>
                <p class="db-rail__title">{t("What needs you")}</p>
            </header>
            <div class="db-rail__stack">
                {objects.map((object) => {
                    const isFocal = object.id === focalId;
                    return (
                        <Slice
                            key={object.id}
                            object={object}
                            variant={isFocal ? "focal" : "default"}
                            mode={mode}
                            onSelect={(id) =>
                                setFocusedCommand(id === focused ? null : id)
                            }
                        />
                    );
                })}
            </div>
        </aside>
    );
}
