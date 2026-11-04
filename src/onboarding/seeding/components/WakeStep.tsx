import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import { draft } from "../draft";
import { nextStep } from "../state";
import { enrichAccounts, type EnrichmentResult } from "../lib/enrichment";

/**
 * Account research step. Calls the research backend and reports unavailable
 * results explicitly. Shows an estimated progress meter while the web
 * searches run — timed to how many companies it's reading, cycling
 * through their names, snapping to done when the real result lands. If the
 * operator goes back and changes the list, the enrichment re-runs.
 */
const result = signal<EnrichmentResult | null>(null);
const loading = signal(false);
const progress = signal(0);
const statusName = signal("");
let enrichedKey = "";
let progressTimer: ReturnType<typeof setInterval> | null = null;
let statusTimer: ReturnType<typeof setInterval> | null = null;

function stopTimers(): void {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    if (statusTimer) { clearInterval(statusTimer); statusTimer = null; }
}

function startMeter(names: ReadonlyArray<string>): void {
    stopTimers();
    progress.value = 4;
    statusName.value = names[0] ?? "";
    // Eases toward 92% over an estimate scaled to the company count; the
    // real result snaps it to 100. Never completes on its own — honest.
    progressTimer = setInterval(() => {
        const target = loading.value ? 92 : 100;
        progress.value = Math.min(target, progress.value + (target - progress.value) * 0.06);
    }, 150);
    let i = 0;
    statusTimer = setInterval(() => {
        i = (i + 1) % Math.max(names.length, 1);
        statusName.value = names[i] ?? "";
    }, 950);
}

export function startEnrichment(): void {
    const names = draft.value.accountNames;
    const key = JSON.stringify([names.map(name => name.toLowerCase()), draft.value.icpStatement]);
    // Already running or done for this exact list — leave it.
    if (key === enrichedKey && (loading.value || result.value)) return;
    enrichedKey = key;
    result.value = null;
    loading.value = true;
    startMeter(names);
    void enrichAccounts(names, draft.value.icpStatement)
        .then((r) => {
            result.value = r;
        })
        .finally(() => {
            loading.value = false;
            progress.value = 100;
            stopTimers();
        });
}

/** The enriched accounts, for the seed writer at the landing. */
export function enrichedAccounts(): EnrichmentResult["accounts"] {
    return result.value?.accounts ?? [];
}

/** @internal test reset. */
export function __resetWakeForTests(): void {
    stopTimers();
    enrichedKey = "";
    result.value = null;
    loading.value = false;
    progress.value = 0;
    statusName.value = "";
}

export function WakeStep(): JSX.Element {
    startEnrichment();
    const r = result.value;
    const accounts = r?.accounts ?? [];
    const reads = r?.reads ?? [];
    const busy = loading.value;
    const pct = Math.round(progress.value);
    return (
        <section class="sd-step">
            <p class="sd-kicker">{t("Account research", { class: "body" })}</p>
            <h1 class="sd-h1">{t("Review recent changes at your target accounts.", { class: "body" })}</h1>

            {busy ? (
                <div class="sd-meter">
                    <div class="sd-meter__bar">
                        <div class="sd-meter__f" style={`width:${pct}%`} />
                    </div>
                    <div class="sd-meter__row">
                        <span class="sd-meter__status">
                            {pct < 88
                                ? t("Searching the web for {name}…", { class: "body" }).replace(
                                      "{name}",
                                      statusName.value || t("your accounts", { class: "body" })
                                  )
                                : t("Assessing recent findings…", { class: "body" })}
                        </span>
                        <span class="sd-meter__pct">{pct}%</span>
                    </div>
                    <p class="sd-meter__note">
                        {t("Searching for source-backed company updates. The progress percentage is an estimate.", { class: "body" })}
                    </p>
                </div>
            ) : (
                <div class="sd-wg">
                    <div class="sd-accts">
                        <h4>{r?.unavailable ? t("Your account list", { class: "body" }) : t("Accounts ranked by recent findings", { class: "body" })}</h4>
                        {!r?.unavailable && <p>{t("Priority is an assessment of recency and relevance to your ICP, not buying intent.", { class: "body" })}</p>}
                        {accounts.map((a, i) => (
                            <div class={`sd-ac${i === 0 ? " is-hot" : ""}`} key={a.name}>
                                <div>
                                    <div class="sd-ac__nm">{a.name}</div>
                                    <div class={`sd-ac__sg${a.cold ? " is-cold" : ""}`}>{a.signal}</div>
                                    {a.sourceUrl && /^https:\/\//i.test(a.sourceUrl) && <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer">{t("Review source", { class: "body" })}</a>}
                                </div>
                                {!r?.unavailable && <div class="sd-ac__ht">{t("Priority", { class: "body" })} {a.heat}/100</div>}
                            </div>
                        ))}
                    </div>
                    <div class="sd-reads">
                        {reads.map((rd) => (
                            <div class={`sd-read${rd.kind === "doesnt-fit" ? " is-warn" : ""}`} key={rd.title}>
                                <div class="sd-read__k">{rd.title}</div>
                                <div class="sd-read__t">{rd.body}</div>
                                {rd.sourceUrl && <a href={rd.sourceUrl} target="_blank" rel="noopener noreferrer">{t("Review source", { class: "body" })}</a>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div class="sd-foot">
                <button
                    type="button"
                    class="sd-btn sd-btn--big"
                    disabled={busy}
                    onClick={() => nextStep()}
                >
                    {t("Continue setup →", { class: "body" })}
                </button>
            </div>
        </section>
    );
}
