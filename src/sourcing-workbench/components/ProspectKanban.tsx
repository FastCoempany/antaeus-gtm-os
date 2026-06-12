import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    LEVERAGE_LABELS,
    PROSPECT_STAGES,
    STAGE_LABELS,
    type Prospect,
    type ProspectStage
} from "../lib/types";
import { getProspectQuality } from "../lib/quality";
import {
    prospects,
    prospectsByStage,
    removeProspect,
    setProspectStage
} from "../state";
import {
    deleteArtifactInCloud,
    saveProspect
} from "../lib/cloud-persistence";

const COLUMN_ORDER: ReadonlyArray<ProspectStage> = PROSPECT_STAGES;

const NEXT_STAGE: Record<ProspectStage, ProspectStage | null> = {
    captured: "researched",
    researched: "ready",
    ready: "pushed",
    pushed: null,
    dropped: null
};

const PREV_STAGE: Record<ProspectStage, ProspectStage | null> = {
    captured: null,
    researched: "captured",
    ready: "researched",
    pushed: "ready",
    dropped: null
};

/**
 * ProspectKanban — lifecycle columns (captured / researched / ready /
 * pushed / dropped). The discipline is to walk a prospect across the
 * board: each advance is a small ranked action.
 */
export function ProspectKanban(): JSX.Element {
    const grouped = prospectsByStage.value;
    return (
        <section class="sw-kanban" aria-label={t("Prospect lifecycle")}>
            <header class="sw-section__head">
                <p class="sw-section__kicker">{t("PIPELINE")}</p>
                <h2 class="sw-section__title">{t("Walk names across the board.")}</h2>
                <p class="sw-section__sub">
                    Each column hardens the name a step further. Push only
                    when the entry can carry the meeting.
                </p>
            </header>
            <div class="sw-kanban__grid" role="list">
                {COLUMN_ORDER.map((stage) => (
                    <Column
                        key={stage}
                        stage={stage}
                        prospects={grouped[stage]}
                    />
                ))}
            </div>
        </section>
    );
}

function Column({
    stage,
    prospects
}: {
    readonly stage: ProspectStage;
    readonly prospects: ReadonlyArray<Prospect>;
}): JSX.Element {
    return (
        <section class={`sw-col sw-col--${stage}`} role="listitem">
            <header class="sw-col__head">
                <span class="sw-col__title">{STAGE_LABELS[stage]}</span>
                <span class="sw-col__count">{prospects.length}</span>
            </header>
            {prospects.length === 0 ? (
                <p class="sw-col__empty">—</p>
            ) : (
                <ul class="sw-col__list">
                    {prospects.map((p) => (
                        <li key={p.id}>
                            <Card prospect={p} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function Card({ prospect }: { readonly prospect: Prospect }): JSX.Element {
    const q = getProspectQuality(prospect);
    const next = NEXT_STAGE[prospect.stage];
    const prev = PREV_STAGE[prospect.stage];
    return (
        <article class={`sw-card sw-card--${q.band}`}>
            <header class="sw-card__head">
                <h3 class="sw-card__name">{prospect.accountName}</h3>
                <span class={`sw-card__score sw-card__score--${q.band}`}>
                    {q.score}
                </span>
            </header>
            {prospect.contactName ? (
                <p class="sw-card__contact">
                    {prospect.contactName}
                    {prospect.contactTitle ? ` · ${prospect.contactTitle}` : ""}
                </p>
            ) : null}
            <p class={`sw-leverage sw-leverage--${prospect.leverage}`}>
                {LEVERAGE_LABELS[prospect.leverage]}
            </p>
            {prospect.entryPoint ? (
                <p class="sw-card__line">
                    <span class="sw-mono">{t("Entry")}</span> {prospect.entryPoint}
                </p>
            ) : null}
            {prospect.approach ? (
                <p class="sw-card__line">
                    <span class="sw-mono">{t("Approach")}</span> {prospect.approach}
                </p>
            ) : null}
            {q.gaps.length > 0 ? (
                <p class="sw-card__gap">{q.gaps[0]}</p>
            ) : null}
            <footer class="sw-card__foot">
                {prev ? (
                    <button
                        type="button"
                        class="sw-btn sw-btn--ghost-sm"
                        onClick={() => {
                            setProspectStage(prospect.id, prev);
                            const updated = prospects.value.find(
                                (x) => x.id === prospect.id
                            );
                            if (updated) void saveProspect(updated);
                        }}
                    >
                        ← {STAGE_LABELS[prev]}
                    </button>
                ) : (
                    <span />
                )}
                <div class="sw-card__foot-right">
                    {prospect.stage !== "dropped" ? (
                        <button
                            type="button"
                            class="sw-btn sw-btn--ghost-sm"
                            onClick={() => {
                                setProspectStage(prospect.id, "dropped");
                                const updated = prospects.value.find(
                                    (x) => x.id === prospect.id
                                );
                                if (updated) void saveProspect(updated);
                            }}
                        >
                            Drop
                        </button>
                    ) : (
                        <button
                            type="button"
                            class="sw-btn sw-btn--ghost-sm"
                            onClick={() => {
                                removeProspect(prospect.id);
                                void deleteArtifactInCloud(prospect.id);
                            }}
                        >
                            Remove
                        </button>
                    )}
                    {next ? (
                        <button
                            type="button"
                            class="sw-btn sw-btn--primary-sm"
                            onClick={() => {
                                setProspectStage(prospect.id, next);
                                const updated = prospects.value.find(
                                    (x) => x.id === prospect.id
                                );
                                if (updated) void saveProspect(updated);
                            }}
                        >
                            {STAGE_LABELS[next]} →
                        </button>
                    ) : null}
                </div>
            </footer>
        </article>
    );
}
