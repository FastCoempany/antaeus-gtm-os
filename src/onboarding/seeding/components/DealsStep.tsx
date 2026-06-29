import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    DEAL_FLOOR,
    DEAL_STAGES,
    addDeal,
    dealCount,
    draft,
    type DealStage,
    type SeedDeal
} from "../draft";
import { nextStep } from "../state";
import { diagnoseDeal } from "../lib/diagnose";

/**
 * DealsStep (slice 5) — the heavy part. A real entry form for each live
 * deal; the account comes enriched, the operator adds the judgment (who
 * champions it, who signs, where it's stuck). Each add computes a real
 * diagnosis (deterministic, from the fields) and lands it on the board.
 * The counter climbs to the floor of ten; fewer is allowed but the app
 * says plainly it stays thin (Earned Depth #6, the honest edge case).
 */
const fAccount = signal("");
const fValue = signal("");
const fStage = signal<DealStage>("discovery");
const fChampion = signal("");
const fSigns = signal("");
const fStuck = signal("");

function reset(): void {
    fAccount.value = "";
    fValue.value = "";
    fStage.value = "discovery";
    fChampion.value = "";
    fSigns.value = "";
    fStuck.value = "";
}

function canAdd(): boolean {
    return fAccount.value.trim().length > 0;
}

function add(): void {
    if (!canAdd()) return;
    const deal: SeedDeal = {
        id: `seed_deal_${draft.value.deals.length}`,
        account: fAccount.value.trim(),
        value: Number(fValue.value.replace(/[^0-9.]/g, "")) || 0,
        stage: fStage.value,
        champion: fChampion.value.trim(),
        whoSigns: fSigns.value.trim(),
        stuck: fStuck.value.trim()
    };
    addDeal(deal);
    reset();
}

export function DealsStep(): JSX.Element {
    const n = dealCount.value;
    const names = draft.value.accountNames;
    const enough = n >= DEAL_FLOOR;
    return (
        <section class="sd-step">
            <p class="sd-kicker">{t("The heavy part · your live deals", { class: "body" })}</p>
            <h1 class="sd-h1">
                {t("The part no software can do for you — and the part that pays you back every morning.", { class: "body" })}
            </h1>
            <div class="sd-cols">
                <div class="sd-entry">
                    <label class="sd-f">
                        <span class="sd-f__l">{t("Account")}</span>
                        <input
                            class="sd-f__i"
                            list="sd-accts-list"
                            value={fAccount.value}
                            placeholder={t("Which company?", { class: "body" })}
                            onInput={(e) => { fAccount.value = (e.currentTarget as HTMLInputElement).value; }}
                        />
                        <datalist id="sd-accts-list">
                            {names.map((nm) => <option value={nm} key={nm} />)}
                        </datalist>
                    </label>
                    <div class="sd-frow">
                        <label class="sd-f">
                            <span class="sd-f__l">{t("Value ($)")}</span>
                            <input class="sd-f__i" value={fValue.value} placeholder="120000"
                                onInput={(e) => { fValue.value = (e.currentTarget as HTMLInputElement).value; }} />
                        </label>
                        <label class="sd-f">
                            <span class="sd-f__l">{t("Stage")}</span>
                            <select class="sd-f__i" value={fStage.value}
                                onChange={(e) => { fStage.value = (e.currentTarget as HTMLSelectElement).value as DealStage; }}>
                                {DEAL_STAGES.map((s) => <option value={s.id} key={s.id}>{s.label}</option>)}
                            </select>
                        </label>
                    </div>
                    <label class="sd-f">
                        <span class="sd-f__l">{t("Champion — who's fighting for it inside", { class: "body" })}</span>
                        <input class="sd-f__i" value={fChampion.value} placeholder={t("Name or role", { class: "body" })}
                            onInput={(e) => { fChampion.value = (e.currentTarget as HTMLInputElement).value; }} />
                    </label>
                    <label class="sd-f">
                        <span class="sd-f__l">{t("Who signs the check")}</span>
                        <input class="sd-f__i" value={fSigns.value} placeholder={t("The economic buyer", { class: "body" })}
                            onInput={(e) => { fSigns.value = (e.currentTarget as HTMLInputElement).value; }} />
                    </label>
                    <label class="sd-f">
                        <span class="sd-f__l">{t("Where it's stuck")}</span>
                        <input class="sd-f__i" value={fStuck.value} placeholder={t("The honest read", { class: "body" })}
                            onInput={(e) => { fStuck.value = (e.currentTarget as HTMLInputElement).value; }} />
                    </label>
                    <button type="button" class="sd-btn sd-btn--sm" disabled={!canAdd()} onClick={add}>
                        {t("Add this deal →", { class: "body" })}
                    </button>
                </div>

                <div class="sd-board">
                    <div class="sd-bhead">
                        <span class="sd-bhead__t">{t("Waking up")}</span>
                        <span class="sd-bhead__c"><b>{n}</b> {t("of 10 in", { class: "body" })}</span>
                    </div>
                    <div class="sd-track"><div class="sd-track__f" style={`width:${Math.min(n, 10) * 10}%`} /></div>
                    <div class="sd-diags">
                        {draft.value.deals.slice().reverse().slice(0, 4).map((d) => {
                            const dg = diagnoseDeal(d);
                            return (
                                <div class={`sd-diag is-${dg.tone}`} key={d.id}>
                                    <div class="sd-diag__h">
                                        <span class="sd-diag__n">{d.account}</span>
                                        <span class="sd-diag__t">{dg.label}</span>
                                    </div>
                                    <div class="sd-diag__r">{dg.read}</div>
                                    <div class="sd-diag__m">{dg.move}</div>
                                </div>
                            );
                        })}
                        {n === 0 ? (
                            <p class="sd-accts__loading">{t("Add your first live deal — watch it wake.", { class: "body" })}</p>
                        ) : null}
                    </div>
                </div>
            </div>

            <div class="sd-foot sd-foot--row">
                {enough ? (
                    <button type="button" class="sd-btn" onClick={() => nextStep()}>
                        {t("The math, then you're done →", { class: "body" })}
                    </button>
                ) : (
                    <button type="button" class="sd-btn sd-btn--ghost" onClick={() => nextStep()}>
                        {t("I've added them all — even if it's under ten", { class: "body" })}
                    </button>
                )}
                {!enough && n > 0 ? (
                    <span class="sd-foot__note">
                        {t("Under ten, it stays thin. Add the rest when you can.", { class: "body" })}
                    </span>
                ) : null}
            </div>
        </section>
    );
}
