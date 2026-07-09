import type { JSX } from "preact";
import {
    Button,
    Card,
    FormField,
    Kicker,
    Select,
    Stat,
    StatusChip,
    TextInput,
    Textarea
} from "@/components";
import { t } from "@/lib/voice/t";
import {
    advisorDraft,
    advisors,
    deployments,
    patchAdvisorDraft,
    recentDeployments,
    removeAdvisor,
    saveAdvisorFromDraft,
    selectedAdvisor,
    setAdvisorId,
    updateDeploymentOutcome
} from "../../state";
import { TIERS } from "../../lib/tiers";
import { findMoment } from "../../lib/moments";
import { getCooldownStatus, daysSince } from "../../lib/cooldown";
import { advisorsForDeal } from "../../lib/recommend";
import { saveDeployment } from "../../lib/cloud-persistence";
import {
    deleteAdvisorInCloud,
    saveAdvisor
} from "../../lib/cloud-persistence-profile";
import {
    DEPLOYMENT_OUTCOMES,
    DEPLOYMENT_OUTCOME_LABELS,
    TIER_IDS,
    type DeploymentOutcome,
    type TierId
} from "../../lib/types";
import { impactReadings, impactTone, outcomeTone } from "../lib/adapters";

/**
 * DeskSide — the subordinate rail of the Advisor Deploy desk. The
 * rolodex (who can carry the current ask), the registry (who you can
 * deploy), the ask log (every loop, with its outcome), and the desk read
 * (how outside leverage is paying off). It serves the desk; the desk does
 * not serve it. Composed on the library over the unchanged cooldown +
 * impact engine.
 */

function fmtRelative(iso: string): string {
    const d = daysSince(iso);
    if (d === 0) return "today";
    if (d === 1) return "1d ago";
    return `${d}d ago`;
}

function onSaveAdvisor(): void {
    const advisor = saveAdvisorFromDraft();
    if (advisor) void saveAdvisor(advisor);
}

const OUTCOME_OPTS = DEPLOYMENT_OUTCOMES.map((o) => ({
    value: o,
    label: DEPLOYMENT_OUTCOME_LABELS[o]
}));
const TIER_OPTS = TIER_IDS.map((id) => ({ value: id, label: TIERS[id].label }));

export function DeskSide(): JSX.Element {
    const d = advisorDraft.value;
    const list = advisors.value;
    const deps = deployments.value;
    const recent = recentDeployments.value;
    const impact = impactReadings();
    const activeAdvisorId = selectedAdvisor.value?.id ?? "";

    // Rolodex: exact-company carriers first.
    const exactIds = new Set(
        advisorsForDeal(list, null).map((a) => a.id)
    );
    const rolodex = list
        .slice()
        .sort((a, b) => (exactIds.has(b.id) ? 1 : 0) - (exactIds.has(a.id) ? 1 : 0))
        .slice(0, 5);

    return (
        <div class="add-side">
            {/* Rolodex — who can carry the ask. */}
            <section class="add-rolodex" aria-label={t("Advisor rolodex")}>
                <Kicker>{t("CARRIERS")}</Kicker>
                {rolodex.length === 0 ? (
                    <p class="add-empty">
                        {t("No advisors registered yet — add one below to start routing.", { class: "body" })}
                    </p>
                ) : (
                    <ul class="add-rolodex__list">
                        {rolodex.map((a) => {
                            const status = getCooldownStatus(a, deps);
                            const isActive = activeAdvisorId === a.id;
                            return (
                                <li key={a.id}>
                                    <button
                                        type="button"
                                        class={`add-rolodex__tab${isActive ? " is-active" : ""}`}
                                        onClick={() => setAdvisorId(a.id)}
                                    >
                                        <span class="add-rolodex__name">{a.name}</span>
                                        <span class="add-rolodex__meta">
                                            {a.title || TIERS[a.tier]?.label || "Advisor"}
                                        </span>
                                        <StatusChip
                                            label={status.label}
                                            tone={status.ok ? "green" : "amber"}
                                        />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Registry — who you can deploy. */}
            <section class="add-registry" aria-label={t("Advisor registry")}>
                <Kicker>{t("REGISTER AN ADVISOR")}</Kicker>
                <FormField label={t("Name")}>
                    <TextInput
                        value={d.name}
                        onInput={(name) => patchAdvisorDraft({ name })}
                        placeholder={t("Sarah Chen", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Role")}>
                    <TextInput
                        value={d.title}
                        onInput={(title) => patchAdvisorDraft({ title })}
                        placeholder={t("Board member, operator", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Tier")}>
                    <Select
                        value={d.tier}
                        onChange={(v) => patchAdvisorDraft({ tier: v as TierId })}
                        options={TIER_OPTS}
                    />
                </FormField>
                <FormField
                    label={t("Companies")}
                    microcopy={t("Comma-separated — matched against the deal account.", { class: "body" })}
                >
                    <TextInput
                        value={d.companies}
                        onInput={(companies) => patchAdvisorDraft({ companies })}
                        placeholder={t("Meridian Logistics, Northstar", { class: "body" })}
                    />
                </FormField>
                <FormField label={t("Notes")}>
                    <Textarea
                        rows={2}
                        value={d.notes}
                        onInput={(notes) => patchAdvisorDraft({ notes })}
                        placeholder={t("What ask should this person carry?", { class: "body" })}
                    />
                </FormField>
                <Button
                    variant="secondary"
                    onClick={onSaveAdvisor}
                    disabled={d.name.trim().length === 0}
                    disabledWhy={
                        d.name.trim().length === 0
                            ? t("Name the advisor first.", { class: "body" })
                            : undefined
                    }
                >
                    {t("Save advisor")}
                </Button>

                {list.length > 0 ? (
                    <ul class="add-registry__list">
                        {list.map((a) => {
                            const status = getCooldownStatus(a, deps);
                            return (
                                <li key={a.id} class="add-registry__row">
                                    <span class="add-registry__name">{a.name}</span>
                                    <StatusChip
                                        label={status.label}
                                        tone={status.ok ? "green" : "amber"}
                                    />
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            removeAdvisor(a.id);
                                            void deleteAdvisorInCloud(a.id);
                                        }}
                                    >
                                        {t("Remove")}
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                ) : null}
            </section>

            {/* Ask log — every loop. */}
            {recent.length > 0 ? (
                <section class="add-log" aria-label={t("Ask log")}>
                    <Kicker>{t("ASK LOG")}</Kicker>
                    <ul class="add-log__list">
                        {recent.slice(0, 6).map((dep) => {
                            const moment = findMoment(dep.momentId);
                            return (
                                <li key={dep.id} class="add-log__row">
                                    <div class="add-log__body">
                                        <span class="add-log__deal">{dep.dealName || "Unknown deal"}</span>
                                        <span class="add-log__meta">
                                            {dep.advisorName || "Unknown"} · {moment.name} · {fmtRelative(dep.createdAt)}
                                        </span>
                                    </div>
                                    <StatusChip
                                        label={DEPLOYMENT_OUTCOME_LABELS[dep.outcome]}
                                        tone={outcomeTone(dep.outcome)}
                                    />
                                    <Select
                                        value={dep.outcome}
                                        onChange={(v) => {
                                            const updated = updateDeploymentOutcome(
                                                dep.id,
                                                v as DeploymentOutcome
                                            );
                                            if (updated) void saveDeployment(updated);
                                        }}
                                        options={OUTCOME_OPTS}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ) : null}

            {/* Desk read — how leverage is paying off. */}
            <section class="add-impact" aria-label={t("Desk read")}>
                <Kicker>{t("DESK READ")}</Kicker>
                <div class="add-impact__cells">
                    {impact.cells.map((c, i) => (
                        <Stat key={i} value={c.value} label={c.label} />
                    ))}
                </div>
                <ul class="add-impact__rows">
                    {impact.rows.map((r, i) => (
                        <li key={i}>
                            <Card kicker={r.title} tone={impactTone(r.tone)}>
                                <p class="ds-card__copy">{r.copy}</p>
                            </Card>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
