import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact";
import {
    MIGRATION_COMPLETE_KEY,
    MIGRATION_FEATURE_FLAG,
    runDataMigration,
    type MigrationReport
} from "@/lib/data-migration";
import { isFeatureEnabled, onFeatureFlagsReady } from "@/lib/observability";

/**
 * Data migration UI — Phase 2.3.
 *
 * A minimal, bright, composed control surface that lets a user move their
 * localStorage payload into Supabase. The page:
 *   1. Reports whether the Posthog flag is active for this session.
 *   2. Reports whether the completion marker is already set.
 *   3. Offers a dry-run button (preview what would move).
 *   4. Offers a live-run button (actually move it).
 *   5. Renders the report after either click.
 *
 * Design posture (Part II §4.7 Trust Annex, for the moment — this page
 * will retire once the migration is behind all users and rooms are
 * fully on Supabase): calm, plainspoken, trustworthy. No drama. Report
 * uses a monospace ledger style so parse errors + per-table counts are
 * scannable without visual noise.
 */
export function DataMigrationPage(): JSX.Element {
    const [report, setReport] = useState<MigrationReport | null>(null);
    const [running, setRunning] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    // Posthog fetches feature flags async after init(), so a synchronous
    // isFeatureEnabled() call on first mount often returns false before flags
    // arrive. We seed with the sync value, then subscribe to the flag-load
    // event and re-check. onFeatureFlagsReady fires once on first load and
    // again on subsequent flag updates (e.g. after identify()).
    const [flagOn, setFlagOn] = useState<boolean>(() =>
        isFeatureEnabled(MIGRATION_FEATURE_FLAG)
    );

    useEffect(() => {
        // Re-check immediately in case flags loaded between render + mount.
        setFlagOn(isFeatureEnabled(MIGRATION_FEATURE_FLAG));
        const unsubscribe = onFeatureFlagsReady(() => {
            setFlagOn(isFeatureEnabled(MIGRATION_FEATURE_FLAG));
        });
        return unsubscribe;
    }, []);

    const markerSetAt =
        typeof window !== "undefined" && window.localStorage
            ? window.localStorage.getItem(MIGRATION_COMPLETE_KEY)
            : null;
    const appEnv = (import.meta.env.VITE_APP_ENV ?? "development").toLowerCase();
    const supabaseHost = resolveSupabaseHost(
        import.meta.env.VITE_SUPABASE_URL ?? ""
    );

    async function run(dryRun: boolean): Promise<void> {
        setRunning(true);
        setLastError(null);
        try {
            const r = await runDataMigration({ dryRun });
            setReport(r);
        } catch (err) {
            setLastError(err instanceof Error ? err.message : String(err));
        } finally {
            setRunning(false);
        }
    }

    async function forceRerun(): Promise<void> {
        setRunning(true);
        setLastError(null);
        try {
            const r = await runDataMigration({ force: true });
            setReport(r);
        } catch (err) {
            setLastError(err instanceof Error ? err.message : String(err));
        } finally {
            setRunning(false);
        }
    }

    return (
        <main class="migration-page">
            <header class="migration-page__header">
                <p class="migration-page__kicker">DATA MIGRATION · PHASE 2.3</p>
                <h1 class="migration-page__title">
                    Move your local data to the server.
                </h1>
                <p class="migration-page__subtitle">
                    This reads everything your browser has cached under{" "}
                    <code>gtmos_*</code> keys and inserts it into your workspace
                    in Supabase. Your localStorage is not modified.
                </p>
            </header>

            <section
                class={`migration-page__env migration-page__env--${envTone(
                    appEnv
                )}`}
            >
                <div class="migration-page__env-inner">
                    <p class="migration-page__env-kicker">Target environment</p>
                    <p class="migration-page__env-value">
                        <strong>{appEnv}</strong>
                        {supabaseHost ? (
                            <>
                                {" "}
                                · Supabase <code>{supabaseHost}</code>
                            </>
                        ) : null}
                    </p>
                    <p class="migration-page__env-hint">
                        {envHint(appEnv)}
                    </p>
                </div>
            </section>

            <section class="migration-page__status">
                <StatusRow
                    label="Feature flag"
                    value={flagOn ? "ON for this session" : "OFF"}
                    tone={flagOn ? "active" : "thin"}
                />
                <StatusRow
                    label="Completion marker"
                    value={
                        markerSetAt
                            ? `Set on ${formatDate(markerSetAt)}`
                            : "Not set (first run)"
                    }
                    tone={markerSetAt ? "active" : "thin"}
                />
            </section>

            <section class="migration-page__actions">
                <button
                    type="button"
                    class="migration-page__btn migration-page__btn--ghost"
                    disabled={running || !flagOn}
                    onClick={() => run(true)}
                >
                    {running ? "Running…" : "Dry run"}
                </button>
                <button
                    type="button"
                    class="migration-page__btn migration-page__btn--primary"
                    disabled={running || !flagOn || Boolean(markerSetAt)}
                    onClick={() => run(false)}
                >
                    {running ? "Running…" : "Migrate now"}
                </button>
                {markerSetAt ? (
                    <button
                        type="button"
                        class="migration-page__btn migration-page__btn--warn"
                        disabled={running || !flagOn}
                        onClick={() => forceRerun()}
                    >
                        Force re-run (will duplicate data)
                    </button>
                ) : null}
            </section>

            {lastError ? (
                <section class="migration-page__error">
                    <p class="migration-page__error-label">Error</p>
                    <p class="migration-page__error-msg">{lastError}</p>
                </section>
            ) : null}

            {report ? <ReportView report={report} /> : null}

            <footer class="migration-page__footer">
                <p>
                    Ref:{" "}
                    <code>
                        deliverables/adr/adr-002-phase-2-data-architecture-rescope-2026-04-24.md
                        §6 Subphase 2.3
                    </code>
                </p>
            </footer>
        </main>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────

interface StatusRowProps {
    label: string;
    value: string;
    tone: "active" | "thin";
}

function StatusRow({ label, value, tone }: StatusRowProps): JSX.Element {
    return (
        <div class="migration-page__status-row">
            <span class="migration-page__status-label">{label}</span>
            <span
                class={`migration-page__status-value migration-page__status-value--${tone}`}
            >
                {value}
            </span>
        </div>
    );
}

function ReportView({ report }: { report: MigrationReport }): JSX.Element {
    if (report.gatedBy) {
        return (
            <section class="migration-page__report">
                <h2 class="migration-page__report-title">No-op</h2>
                <p>
                    Migration was blocked:{" "}
                    <strong>
                        {report.gatedBy === "flag_off"
                            ? "Feature flag is off"
                            : "Completion marker is set"}
                    </strong>
                    .
                </p>
            </section>
        );
    }

    const dryRunLabel = report.dryRun ? " (dry run)" : "";

    return (
        <section class="migration-page__report">
            <h2 class="migration-page__report-title">
                Result{dryRunLabel}
            </h2>

            <div class="migration-page__report-summary">
                <SummaryCell label="Started" value={formatDate(report.startedAt)} />
                <SummaryCell label="Finished" value={formatDate(report.finishedAt)} />
                <SummaryCell
                    label="Rows transformed"
                    value={String(report.totalTransformed)}
                />
                <SummaryCell
                    label="Rows inserted"
                    value={String(report.totalInserted)}
                />
                <SummaryCell
                    label="Errors"
                    value={String(report.totalErrors)}
                    tone={report.totalErrors > 0 ? "warn" : "ok"}
                />
            </div>

            <table class="migration-page__report-table">
                <thead>
                    <tr>
                        <th>Table</th>
                        <th>Keys read</th>
                        <th>Transformed</th>
                        <th>Inserted</th>
                        <th>Skipped</th>
                        <th>Errors</th>
                    </tr>
                </thead>
                <tbody>
                    {report.tables.map((t) => (
                        <tr key={t.table}>
                            <td>
                                <code>{t.table}</code>
                            </td>
                            <td>{t.keysRead.length}</td>
                            <td>{t.rowsTransformed}</td>
                            <td>{t.rowsInserted}</td>
                            <td>{t.rowsSkipped}</td>
                            <td>
                                {t.errors.length > 0 ? (
                                    <details>
                                        <summary>{t.errors.length}</summary>
                                        <ul>
                                            {t.errors.map((e, i) => (
                                                <li key={i}>
                                                    <code>{e.key}</code>:{" "}
                                                    {e.reason}
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                ) : (
                                    <span>—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

function SummaryCell({
    label,
    value,
    tone
}: {
    label: string;
    value: string;
    tone?: "ok" | "warn";
}): JSX.Element {
    return (
        <div
            class={`migration-page__summary-cell${
                tone ? ` migration-page__summary-cell--${tone}` : ""
            }`}
        >
            <span class="migration-page__summary-label">{label}</span>
            <span class="migration-page__summary-value">{value}</span>
        </div>
    );
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

/**
 * Parse the Supabase URL to show a short, copy-pasteable host (without
 * scheme or path), so the user can eyeball which project they're pointed
 * at before clicking the live-migration button.
 */
function resolveSupabaseHost(url: string): string {
    if (!url) return "";
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}

/**
 * Tone mapping for the env banner. Production is orange (pressure),
 * preview is blue (informational), anything else is a thin neutral.
 */
function envTone(env: string): "production" | "preview" | "thin" {
    if (env === "production") return "production";
    if (env === "preview") return "preview";
    return "thin";
}

function envHint(env: string): string {
    if (env === "production") {
        return "Writes land in the real Supabase project. Use Dry run first.";
    }
    if (env === "preview") {
        return "Writes land in the Supabase preview branch. Safe for smoke testing.";
    }
    return "Local development. Make sure VITE_SUPABASE_URL is set before running.";
}
