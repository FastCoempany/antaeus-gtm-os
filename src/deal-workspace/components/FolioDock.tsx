import type { JSX } from "preact";
import type { FolioTab } from "../state";

const TABS: ReadonlyArray<FolioTab> = ["drags", "win", "weighted", "queue"];

export interface FolioDockProps {
    readonly active: FolioTab;
    readonly onChange: (tab: FolioTab) => void;
    readonly label: Record<FolioTab, string>;
}

/**
 * FolioDock — the 4-tab strip on the target folio.
 *
 * The risk tab (`drags`) gets a tone-tinted accent so the "active
 * drags" count reads loud. Other tabs are recessive until selected.
 */
export function FolioDock(props: FolioDockProps): JSX.Element {
    return (
        <nav class="dw-folio-dock" role="tablist" aria-label="Folio view">
            {TABS.map((tab) => {
                const isActive = tab === props.active;
                const isRisk = tab === "drags";
                return (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        class={`dw-folio-dock__tab${
                            isActive ? " is-active" : ""
                        }${isRisk ? " is-risk" : ""}`}
                        onClick={() => props.onChange(tab)}
                    >
                        {props.label[tab]}
                    </button>
                );
            })}
        </nav>
    );
}
