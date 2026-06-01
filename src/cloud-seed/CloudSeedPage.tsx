import { signal, type Signal } from "@preact/signals";
import { createDataClient } from "@/lib/data-client";
import { runCloudSeed, type SeedReport } from "./lib/runner";
import {
    SEED_ACCOUNTS,
    SEED_DEALS,
    SEED_PROOFS,
    SEED_SIGNALS
} from "./lib/seed-data";

/**
 * CloudSeedPage — Phase E follow-up "see everything we build WORK"
 * surface. Served at /cloud-seed/. Internal tooling — populates the
 * operator's real workspace with realistic deals/accounts/signals/
 * proofs so every orchestration surface lights up on the next
 * heartbeat tick.
 *
 * Hook-free (canon Phase 4 / Room 9 note); module-level signals.
 */

const busySignal: Signal<boolean> = signal(false);
const reportSignal: Signal<SeedReport | null> = signal(null);
const errorBannerSignal: Signal<string | null> = signal(null);

async function handleRun(opts: { readonly dryRun: boolean }): Promise<void> {
    busySignal.value = true;
    errorBannerSignal.value = null;
    reportSignal.value = null;
    try {
        const data = createDataClient();
        const result = await runCloudSeed({ data, dryRun: opts.dryRun });
        reportSignal.value = result;
    } catch (err) {
        errorBannerSignal.value =
            err instanceof Error ? err.message : String(err);
    } finally {
        busySignal.value = false;
    }
}

export function CloudSeedPage() {
    const busy = busySignal.value;
    const report = reportSignal.value;
    const errorBanner = errorBannerSignal.value;

    return (
        <main class="cs-shell">
            <header class="cs-head">
                <p class="cs-kicker">CLOUD SEED · INTERNAL TOOLING</p>
                <h1 class="cs-title">Populate your workspace with realistic data</h1>
                <p class="cs-lede">
                    Writes deals, watched accounts, signals, and proofs into
                    your cloud workspace so every orchestration surface lights
                    up — Phase B observations fire, the Birdseye gets a
                    ranked next move, and Phase C / E skills resolve a
                    destination to route to.
                </p>
                <p class="cs-lede cs-lede--quiet">
                    Idempotent — re-running is safe. To re-seed cleanly,
                    delete the marker row (
                    <code>signal_console_accounts</code> where{" "}
                    <code>account_key = "__cloud_seed_marker__"</code>) and
                    run again.
                </p>
            </header>

            <section class="cs-counts">
                <CountTile label="Deals" value={SEED_DEALS.length} />
                <CountTile label="Watched accounts" value={SEED_ACCOUNTS.length} />
                <CountTile label="Signals" value={SEED_SIGNALS.length} />
                <CountTile label="Proofs" value={SEED_PROOFS.length} />
            </section>

            <section class="cs-actions">
                <button
                    type="button"
                    class="cs-btn cs-btn--ghost"
                    disabled={busy}
                    onClick={() => void handleRun({ dryRun: true })}
                >
                    {busy ? "Working…" : "Dry run (check, don't write)"}
                </button>
                <button
                    type="button"
                    class="cs-btn cs-btn--primary"
                    disabled={busy}
                    onClick={() => void handleRun({ dryRun: false })}
                >
                    {busy ? "Writing…" : "Populate workspace"}
                </button>
            </section>

            {errorBanner && (
                <div class="cs-banner cs-banner--error" role="alert">
                    {errorBanner}
                </div>
            )}

            {report && <ReportPanel report={report} />}

            <footer class="cs-foot">
                <p>
                    After the seed completes, manually trigger the heartbeat
                    so Phase B generators write observations against the new
                    data. Then reload <code>/dashboard/</code> and the
                    "this week's reads" card + Birdseye + scheduled skills
                    should all light up.
                </p>
            </footer>
        </main>
    );
}

function CountTile(props: { label: string; value: number }) {
    return (
        <div class="cs-count">
            <p class="cs-count__value">{props.value}</p>
            <p class="cs-count__label">{props.label}</p>
        </div>
    );
}

function ReportPanel(props: { report: SeedReport }) {
    const r = props.report;
    if (r.skipped === "already-seeded") {
        return (
            <div class="cs-banner cs-banner--info">
                <strong>Workspace already seeded.</strong> The marker row is
                in place. Delete it manually if you want to re-seed.
            </div>
        );
    }
    return (
        <div
            class={`cs-banner ${
                r.ok ? "cs-banner--success" : "cs-banner--warn"
            }`}
        >
            <p class="cs-banner__head">
                {r.ok ? "Seed succeeded." : "Seed completed with errors."}
            </p>
            <dl class="cs-banner__counts">
                <div><dt>Deals</dt><dd>{r.counts.deals}</dd></div>
                <div><dt>Accounts</dt><dd>{r.counts.accounts}</dd></div>
                <div><dt>Signals</dt><dd>{r.counts.signals}</dd></div>
                <div><dt>Proofs</dt><dd>{r.counts.proofs}</dd></div>
            </dl>
            {r.errors.length > 0 && (
                <details class="cs-banner__errors">
                    <summary>{r.errors.length} error(s)</summary>
                    <ul>
                        {r.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}
