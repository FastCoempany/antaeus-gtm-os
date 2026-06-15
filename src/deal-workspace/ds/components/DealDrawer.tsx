import type { JSX } from "preact";
import { Drawer } from "@/components";
import { t } from "@/lib/voice/t";
import { closeDealEditor, editingDeal } from "../../state";
import { DealHealthFormDS } from "./DealHealthFormDS";

/**
 * DealDrawer — the 9-field deal-health editor (canon §4.13) in a library
 * Drawer. The form is reused from the classic room (it owns the cloud
 * save + the closed-lost → loss-reason trigger); only the surface around
 * it is recomposed. Depth over the page, no route change — Esc / scrim /
 * the form's own close all dismiss it.
 */
export function DealDrawer(): JSX.Element {
    return (
        <Drawer
            open={editingDeal.value !== null}
            onClose={closeDealEditor}
            label={t("Deal health")}
        >
            <div class="dwd-drawer">
                <DealHealthFormDS />
            </div>
        </Drawer>
    );
}
