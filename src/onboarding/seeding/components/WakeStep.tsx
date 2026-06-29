import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { draft } from "../draft";
import { nextStep } from "../state";
import {
    enrichAccounts,
    type EnrichmentResult
} from "../lib/enrichment";

/**
 * WakeStep (slice 4) — the dashboard wakes up half-way on the accounts
 * they named. Kicks the enrichment seam on first render (the dev stub
 * for now; the real backend implements the same signature). The honest
 * "quiet" account is preserved. The obnoxious button drives them into
 * the heavy half.
 */
const result = signal<EnrichmentResult | null>(null);
const loading = signal(false);
let started = false;

export function startEnrichment(): void {
    if (started) return;
    started = true;
    loading.value = true;
    void enrichAccounts(draft.value.accountNames, draft.value.icpStatement)
        .then((r) => {
            result.value = r;
        })
        .finally(() => {
            loading.value = false;
        });
}

/** The enriched accounts, for the seed writer at the landing. */
export function enrichedAccounts(): EnrichmentResult["accounts"] {
    return result.value?.accounts ?? [];
}

/** @internal test reset. */
export function __resetWakeForTests(): void {
    started = false;
    result.value = null;
    loading.value = false;
}

export function WakeStep(): JSX.Element {
    startEnrichment();
    const r = result.value;
    const accounts = r?.accounts ?? [];
    const reads = r?.reads ?? [];
    return (
        <section class="sd-step">
            <p class="sd-kicker">{t("Half awake", { class: "body" })}</p>
            <h1 class="sd-h1">{t("It read your list. Here's what it already sees.", { class: "body" })}</h1>
            <div class="sd-wg">
                <div class="sd-accts">
                    <h4>{t("Your list · ranked by what's live", { class: "body" })}</h4>
                    {loading.value && accounts.length === 0 ? (
                        <p class="sd-accts__loading">{t("Reading your accounts…", { class: "body" })}</p>
                    ) : (
                        accounts.map((a, i) => (
                            <div class={`sd-ac${i === 0 ? " is-hot" : ""}`} key={a.name}>
                                <div>
                                    <div class="sd-ac__nm">{a.name}</div>
                                    <div class={`sd-ac__sg${a.cold ? " is-cold" : ""}`}>{a.signal}</div>
                                </div>
                                <div class="sd-ac__ht">heat {a.heat}</div>
                            </div>
                        ))
                    )}
                </div>
                <div class="sd-reads">
                    {reads.map((rd) => (
                        <div class={`sd-read${rd.kind === "doesnt-fit" ? " is-warn" : ""}`} key={rd.title}>
                            <div class="sd-read__k">{rd.title}</div>
                            <div class="sd-read__t">{rd.body}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div class="sd-foot">
                <button type="button" class="sd-btn sd-btn--big" onClick={() => nextStep()}>
                    {t("Make it rise up to meet you every morning →", { class: "body" })}
                </button>
            </div>
        </section>
    );
}
