import type { JSX } from "preact";
import { HandoffStrip } from "@/components";
import { t } from "@/lib/voice/t";
import { focusedAccount, nextStepLock } from "../../state";
import {
    hrefToCallPlanner,
    hrefToDealWorkspace,
    hrefToFutureAutopsy
} from "../../lib/handoff";

/**
 * HandoffStripDS — the bottom-of-room cross-room handoff on the library
 * HandoffStrip (canon §4.12: Discovery feeds Deal Workspace + Future
 * Autopsy + Call Planner). Three verb-shape routes with the continuity
 * wrap; the primary pushes the call into the deal. The href builders
 * (which thread the continuity params) are the unchanged lib.
 */
export function HandoffStripDS(): JSX.Element {
    const account = focusedAccount.value.trim() || undefined;
    const lock = nextStepLock.value;
    const locked = Boolean(lock.date && lock.owner && lock.purpose);

    return (
        <HandoffStrip
            label={t("Carry the call forward")}
            kicker={t("CARRY THE CALL FORWARD")}
            title={t("Push the deal, or set up what's next.", { class: "body" })}
            sub={
                locked
                    ? t("Next step locked — the deal inherits it.", { class: "body" })
                    : t("Lock the next step above before handing off.", { class: "body" })
            }
            routes={[
                {
                    label: t("Push to the deal"),
                    href: hrefToDealWorkspace(account),
                    primary: true,
                    dataHandoff: "deal-workspace"
                },
                {
                    label: t("Pre-mortem this deal"),
                    href: hrefToFutureAutopsy(account),
                    dataHandoff: "future-autopsy"
                },
                {
                    label: t("Plan the next call"),
                    href: hrefToCallPlanner(account),
                    dataHandoff: "call-planner"
                }
            ]}
        />
    );
}
