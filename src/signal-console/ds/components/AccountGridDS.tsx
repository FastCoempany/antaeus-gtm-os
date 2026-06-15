import type { JSX } from "preact";
import { Kicker } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { allAccounts, inboundFocus, visibleAccounts } from "../../state";
import { rankByHeat } from "../../lib/heat";
import { AddAccountFormDS } from "./AddAccountFormDS";
import { AccountCardDS } from "./AccountCardDS";

/**
 * AccountGridDS — the heat-ranked radar, library-composed. Heat ranking
 * IS the room's organizing logic (canon §4.7): no manual reorder, no
 * drag handles. The empty state is directional — it names why the radar
 * matters and embeds the add-account form as the dominant move (never a
 * blank shell). The manual add form is reused from the legacy room (it
 * owns the cloud write); only the surface around it is recomposed.
 */
export function AccountGridDS(): JSX.Element {
    const visible = visibleAccounts.value;
    const total = allAccounts.value.length;

    if (total === 0) {
        const focus = inboundFocus.value;
        return (
            <section class="scd-empty" aria-label={t("Get started")}>
                <div class="scd-empty__head">
                    <Icon name="account" size={24} />
                    <Kicker>
                        {focus
                            ? `TARGETING: ${focus}`
                            : t("NO ACCOUNTS ON THE RADAR YET")}
                    </Kicker>
                </div>
                <h2 class="scd-empty__title">
                    {focus
                        ? `Add the first account that fits ${focus}.`
                        : t("Drop in the first one — anything you've been watching.", {
                              class: "body"
                          })}
                </h2>
                <p class="scd-empty__body">
                    {t(
                        "A customer mentioned them. An exec posted something. You saw them in a competitor's case study. The room starts ranking accounts by signal strength the moment one is in.",
                        { class: "body" }
                    )}
                </p>
                <AddAccountFormDS embedded />
            </section>
        );
    }

    if (visible.length === 0) {
        return (
            <section class="scd-grid scd-grid--empty" aria-label={t("Account grid")}>
                <p class="scd-grid__empty">
                    {t("No accounts match the current filter.", { class: "body" })}
                </p>
            </section>
        );
    }

    const ranked = rankByHeat(visible);

    return (
        <section class="scd-grid" aria-label={t("Account grid")}>
            <ul class="scd-grid__list">
                {ranked.map((a) => (
                    <li key={a.id}>
                        <AccountCardDS account={a} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
