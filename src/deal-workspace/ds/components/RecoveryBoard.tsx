import type { JSX } from "preact";
import { Kicker, Ribbon } from "@/components";
import { Icon } from "@/icons";
import { t } from "@/lib/voice/t";
import { activeDeals, allDeals, dealFilter } from "../../state";
import { rankRecovery } from "../../lib/recovery";
import { applyFilter } from "../lib/adapters";
import { DealCard } from "./DealCard";

/**
 * RecoveryBoard — the intervention queue (canon §4.13), library-composed.
 * Deals are ranked highest-pressure-first by the recovery engine, then
 * split into a NEEDS INTERVENTION zone (critical + at-risk, the
 * first-fold decay) and a KEEP HONEST zone (healthy, calm), each under a
 * library Ribbon. The empty state is directional — it names the one move
 * that fills the board, never a blank shell.
 */
export function RecoveryBoard(): JSX.Element {
    const total = allDeals.value.length;

    if (total === 0) {
        return (
            <section class="dwd-empty" aria-label={t("Get started")}>
                <div class="dwd-empty__head">
                    <Icon name="deal" size={24} />
                    <Kicker>{t("NO DEALS ON THE BOARD YET")}</Kicker>
                </div>
                <h2 class="dwd-empty__title">
                    {t("Load the first deal you're actively working.", {
                        class: "body"
                    })}
                </h2>
                <p class="dwd-empty__body">
                    {t(
                        "The board ranks deals by how close they are to going stale, and names the smallest corrective move on each. It needs one live deal to start.",
                        { class: "body" }
                    )}
                </p>
                <a class="ds-btn ds-btn--accent" href="/cold-call-studio/">
                    {t("Book a first meeting")}
                </a>
            </section>
        );
    }

    const ranked = rankRecovery(activeDeals.value);
    const filtered = applyFilter(ranked, dealFilter.value);
    const intervention = filtered.filter((a) => a.lane !== "healthy");
    const healthy = filtered.filter((a) => a.lane === "healthy");

    if (filtered.length === 0) {
        return (
            <section class="dwd-board" aria-label={t("Recovery board")}>
                <p class="dwd-board__empty">
                    {t("No deals match the current filter.", { class: "body" })}
                </p>
            </section>
        );
    }

    return (
        <section class="dwd-board" aria-label={t("Recovery board")}>
            {intervention.length > 0 ? (
                <div class="dwd-zone">
                    <Ribbon
                        label={t("NEEDS INTERVENTION")}
                        suffix={String(intervention.length)}
                        tone="red"
                    />
                    <div class="dwd-grid">
                        {intervention.map((a) => (
                            <DealCard key={a.deal.id} assessment={a} />
                        ))}
                    </div>
                </div>
            ) : null}
            {healthy.length > 0 ? (
                <div class="dwd-zone">
                    <Ribbon label={t("KEEP HONEST")} suffix={String(healthy.length)} />
                    <div class="dwd-grid">
                        {healthy.map((a) => (
                            <DealCard key={a.deal.id} assessment={a} />
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}
