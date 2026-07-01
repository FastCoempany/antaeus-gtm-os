import { useRef, useState } from "preact/hooks";
import { densityState } from "@/lib/density";
import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    PRODUCT_CATEGORIES,
    type ProductCategory
} from "../lib/types";
import {
    backup,
    category,
    clearAll,
    cloudConnection,
    cloudCounts,
    cloudVerifiedAt,
    deleteCloudData,
    demo,
    exitDemo,
    exportBackup,
    exportCloudData,
    importBackupFromFile,
    isDeletingCloud,
    isExportingCloud,
    isVerifyingCloud,
    isWorking,
    lastCloudDelete,
    lastCloudExport,
    phaseFEnabled,
    phaseFError,
    phaseFLoaded,
    phaseFSaving,
    refreshCloudStatus,
    setCategory,
    togglePhaseF,
    densityLoaded,
    densitySaving,
    densityError,
    setDensity,
} from "../state";

/**
 * SettingsCards — the four trust-annex cards.
 *
 * 1. Backup + restore (workspace-level): Export / Import / Clear
 * 2. Product category (workspace-level): single dropdown
 * 3. Demo mode (browser-only): Exit (the seed entry point lives
 *    elsewhere in the legacy demo-seed flow)
 * 4. Role + onboarding (account-level): link out to Onboarding
 *
 * Categorization labels are the canonical scope vocabulary from canon
 * §4.20: workspace-level, account-level, browser-only.
 */
export function SettingsCards(): JSX.Element {
    return (
        <div class="st-grid">
            <CloudSyncCard />
            <CloudExportCard />
            <BackupCard />
            <CategoryCard />
            <PhaseFCard />
            <DensityCard />
            <DemoCard />
            <RoleCard />
            <DeleteCloudDataCard />
        </div>
    );
}

const CONFIRM_PHRASE = "delete my data";

function DeleteCloudDataCard(): JSX.Element {
    const [phrase, setPhrase] = useState("");
    const deleting = isDeletingCloud.value;
    const last = lastCloudDelete.value;
    const counts = cloudCounts.value;
    const totalCloudRows =
        counts.icps +
        counts.deals +
        counts.proofs +
        counts.advisorDeployments +
        counts.signalConsoleAccounts +
        counts.sequences +
        counts.discoveryCallLogs +
        counts.studioArtifacts +
        counts.pipelineSettings;

    const phraseMatches = phrase.trim().toLowerCase() === CONFIRM_PHRASE;
    const canDelete = phraseMatches && !deleting;

    async function handleDelete(): Promise<void> {
        if (!canDelete) return;
        const ok =
            typeof window === "undefined"
                ? true
                : window.confirm(
                      "Final confirmation: this permanently deletes every row " +
                          "in your workspace data tables. This action cannot be " +
                          "undone. Continue?"
                  );
        if (!ok) return;
        await deleteCloudData();
        setPhrase("");
    }

    return (
        <article class="st-card st-card--danger">
            <header class="st-card__head">
                <span class="st-scope st-scope--workspace">{t("Workspace-level")}</span>
                <h2 class="st-card__title">{t("Delete my data")}</h2>
            </header>
            <p class="st-card__desc">
                Permanently delete every row in your workspace — ICPs,
                deals, pilot evidence, signals, advisor deployments, discovery
                call logs, and supporting artifacts. Your account stays
                intact; you can keep signing in. This action is
                irreversible. Export a backup first if you want a copy.
            </p>
            <ul class="st-status-list">
                <li>
                    <span>{t("Cloud rows in scope")}</span>
                    <strong>{totalCloudRows}</strong>
                </li>
                {last ? (
                    <li>
                        <span>{t("Last delete")}</span>
                        <strong>
                            {last.totalDeleted} rows
                            {last.errors.length > 0
                                ? ` · ${last.errors.length} errors`
                                : ""}
                        </strong>
                    </li>
                ) : null}
            </ul>
            <label class="st-confirm">
                <span class="st-confirm__label">
                    Type <code>{CONFIRM_PHRASE}</code> to enable the
                    destroy button:
                </span>
                <input
                    type="text"
                    class="st-confirm__input"
                    value={phrase}
                    placeholder={CONFIRM_PHRASE}
                    autoComplete="off"
                    spellcheck={false}
                    onInput={(e) =>
                        setPhrase((e.currentTarget as HTMLInputElement).value)
                    }
                />
            </label>
            <div class="st-card__actions">
                <button
                    type="button"
                    class="st-btn st-btn--danger"
                    onClick={handleDelete}
                    disabled={!canDelete}
                >
                    {deleting ? "Deleting…" : "Delete cloud data"}
                </button>
            </div>
            <p class="st-card__help">
                What survives: your account, your workspace shell,
                workspace membership. Re-signing in after deletion lands
                you in an empty workspace, identical to a fresh signup.
            </p>
        </article>
    );
}

function CloudSyncCard(): JSX.Element {
    const conn = cloudConnection.value;
    const counts = cloudCounts.value;
    const verifying = isVerifyingCloud.value;
    const verifiedAt = cloudVerifiedAt.value;

    const statusLabel: Record<typeof conn.status, string> = {
        connected: "Connected",
        "no-credentials": "Not configured",
        "auth-missing": "Signed out",
        error: "Error"
    };
    const statusTone: Record<typeof conn.status, string> = {
        connected: "good",
        "no-credentials": "warn",
        "auth-missing": "warn",
        error: "bad"
    };

    const totalRows =
        counts.icps +
        counts.deals +
        counts.proofs +
        counts.advisorDeployments +
        counts.signalConsoleAccounts +
        counts.sequences +
        counts.discoveryCallLogs +
        counts.studioArtifacts +
        counts.pipelineSettings;

    const helpCopy: Record<typeof conn.status, string> = {
        connected:
            "Each room saves to the cloud as you work. The breakdown below shows what's stored cross-device — your durable workspace.",
        "no-credentials":
            "Cloud sync isn't configured for this build. The app will run from local storage only.",
        "auth-missing":
            "You're not signed in. Sign in to your workspace to enable cross-device sync.",
        error:
            "Cloud check failed. Settings reported the issue; the workspace keeps working from local storage in the meantime."
    };

    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--workspace">
                    Workspace-level
                </span>
                <h2 class="st-card__title">{t("Cloud sync")}</h2>
            </header>
            <p class="st-card__desc">{helpCopy[conn.status]}</p>
            <ul class="st-status-list">
                <li>
                    <span>{t("Connection")}</span>
                    <strong class={`st-cloud__status st-cloud__status--${statusTone[conn.status]}`}>
                        {statusLabel[conn.status]}
                    </strong>
                </li>
                <li>
                    <span>{t("Signed in as")}</span>
                    <strong>{conn.userEmail || "—"}</strong>
                </li>
                <li>
                    <span>{t("Workspace")}</span>
                    <strong>{conn.workspace?.name || "—"}</strong>
                </li>
                <li>
                    <span>{t("Total cloud rows")}</span>
                    <strong>
                        {conn.status === "connected" ? totalRows : "—"}
                    </strong>
                </li>
                <li>
                    <span>{t("Last verified")}</span>
                    <strong>
                        {verifiedAt ? new Date(verifiedAt).toLocaleString() : "—"}
                    </strong>
                </li>
            </ul>
            {conn.status === "connected" && totalRows > 0 ? (
                <details class="st-cloud__breakdown">
                    <summary>{t("Per-noun breakdown")}</summary>
                    <ul class="st-cloud__counts">
                        <li>
                            <span>{t("ICPs")}</span>
                            <strong>{counts.icps}</strong>
                        </li>
                        <li>
                            <span>{t("Deals")}</span>
                            <strong>{counts.deals}</strong>
                        </li>
                        <li>
                            <span>{t("Proofs")}</span>
                            <strong>{counts.proofs}</strong>
                        </li>
                        <li>
                            <span>{t("Advisor deployments")}</span>
                            <strong>{counts.advisorDeployments}</strong>
                        </li>
                        <li>
                            <span>{t("Signal accounts")}</span>
                            <strong>{counts.signalConsoleAccounts}</strong>
                        </li>
                        <li>
                            <span>{t("Sequences (outbound + LinkedIn + angles)")}</span>
                            <strong>{counts.sequences}</strong>
                        </li>
                        <li>
                            <span>{t("Call logs (cold call + planner)")}</span>
                            <strong>{counts.discoveryCallLogs}</strong>
                        </li>
                        <li>
                            <span>
                                Studio artifacts (territory + sourcing + autopsy + advisor profiles)
                            </span>
                            <strong>{counts.studioArtifacts}</strong>
                        </li>
                        <li>
                            <span>{t("Pipeline settings (quota workback)")}</span>
                            <strong>{counts.pipelineSettings}</strong>
                        </li>
                    </ul>
                </details>
            ) : null}
            <div class="st-card__actions">
                <button
                    type="button"
                    class="st-btn st-btn--primary"
                    onClick={() => void refreshCloudStatus()}
                    disabled={verifying}
                >
                    {verifying ? "Verifying…" : "Verify cloud sync"}
                </button>
            </div>
            {conn.errorMessage ? (
                <p class="st-cloud__error">{conn.errorMessage}</p>
            ) : null}
        </article>
    );
}

function BackupCard(): JSX.Element {
    const fileRef = useRef<HTMLInputElement>(null);
    const b = backup.value;
    const working = isWorking.value;

    function handlePick(): void {
        fileRef.current?.click();
    }

    async function handleFile(e: Event): Promise<void> {
        const input = e.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        await importBackupFromFile(file);
        input.value = "";
    }

    function handleClear(): void {
        const ok =
            typeof window === "undefined"
                ? true
                : window.confirm(
                      "Clear every gtmos_* key on this device? Cloud sync will not be touched, but the local view will be empty until the next sync."
                  );
        if (ok) clearAll();
    }

    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--workspace">{t("Workspace-level")}</span>
                <h2 class="st-card__title">{t("Backup and restore")}</h2>
            </header>
            <p class="st-card__desc">
                Export every <code>{t("gtmos_*")}</code> key on this device into a
                JSON backup file. Import to restore from a previous backup.
                Clear empties the local cache on this device only — cloud
                sync is unaffected.
            </p>
            <ul class="st-status-list">
                <li>
                    <span>{t("Keys captured")}</span>
                    <strong>{b.keyCount}</strong>
                </li>
                <li>
                    <span>{t("Last export")}</span>
                    <strong>
                        {b.capturedAt
                            ? new Date(b.capturedAt).toLocaleString()
                            : "—"}
                    </strong>
                </li>
            </ul>
            <div class="st-card__actions">
                <button
                    type="button"
                    class="st-btn st-btn--primary"
                    onClick={() => exportBackup()}
                    disabled={working}
                >
                    Export backup
                </button>
                <button
                    type="button"
                    class="st-btn st-btn--ghost"
                    onClick={handlePick}
                    disabled={working}
                >
                    Import backup
                </button>
                <button
                    type="button"
                    class="st-btn st-btn--danger"
                    onClick={handleClear}
                    disabled={working}
                >
                    Clear local data
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    style="display:none"
                    onChange={handleFile}
                />
            </div>
            <p class="st-card__help">
                Export creates an offline recovery file. Import merges the
                backup over the current local cache (matching keys are
                replaced; non-<code>{t("gtmos_*")}</code> keys are skipped). Clear
                removes every <code>{t("gtmos_*")}</code> key from this device.
            </p>
        </article>
    );
}

function CloudExportCard(): JSX.Element {
    const busy = isExportingCloud.value;
    const last = lastCloudExport.value;
    const counts = cloudCounts.value;
    const totalRows =
        counts.icps +
        counts.deals +
        counts.proofs +
        counts.advisorDeployments +
        counts.signalConsoleAccounts +
        counts.sequences +
        counts.discoveryCallLogs +
        counts.studioArtifacts +
        counts.pipelineSettings;

    async function handleExport(): Promise<void> {
        await exportCloudData();
    }

    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--workspace">{t("Workspace-level")}</span>
                <h2 class="st-card__title">{t("Export cloud data")}</h2>
            </header>
            <p class="st-card__desc">
                Download every row from your workspace as a JSON file —
                ICPs, deals, pilot evidence, signals, advisor deployments,
                discovery call logs, the works. This is the portable
                copy of what's actually durable. The local "Backup and
                restore" card below only captures the browser cache.
            </p>
            <ul class="st-status-list">
                <li>
                    <span>{t("Cloud rows in scope")}</span>
                    <strong>{totalRows}</strong>
                </li>
                {last ? (
                    <li>
                        <span>{t("Last export")}</span>
                        <strong>
                            {last.totalRows} rows
                            {last.errors.length > 0
                                ? ` · ${last.errors.length} errors`
                                : ""}
                            {" · "}
                            {new Date(last.capturedAt).toLocaleString()}
                        </strong>
                    </li>
                ) : null}
            </ul>
            <div class="st-card__actions">
                <button
                    type="button"
                    class="st-btn st-btn--primary"
                    onClick={handleExport}
                    disabled={busy}
                >
                    {busy ? "Exporting…" : "Export cloud data"}
                </button>
            </div>
            <p class="st-card__help">
                Reads happen workspace-scoped via RLS — only your rows
                are included. The file is JSON with a per-table layout
                so a future import path can be added cleanly. No data
                leaves the browser except the download itself.
            </p>
        </article>
    );
}

function PhaseFCard(): JSX.Element {
    const enabled = phaseFEnabled.value;
    const loaded = phaseFLoaded.value;
    const saving = phaseFSaving.value;
    const err = phaseFError.value;

    function handleToggle(): void {
        void togglePhaseF(!enabled);
    }

    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--workspace">{t("Workspace-level")}</span>
                <h2 class="st-card__title">{t("System suggestions")}</h2>
            </header>
            <p class="st-card__desc">
                The system will sometimes notice a pattern in how you work —
                a skill you keep running with the same setup, a room you
                open before any other most weeks — and suggest a small
                change. You always accept or dismiss. Nothing changes
                without you.
            </p>
            <ul class="st-status-list">
                <li>
                    <span>{t("Status")}</span>
                    <strong class={enabled ? "is-good" : "is-warn"}>
                        {loaded ? (enabled ? "On" : "Off") : "Checking…"}
                    </strong>
                </li>
            </ul>
            <div class="st-card__actions">
                <button
                    type="button"
                    class={
                        enabled
                            ? "st-btn st-btn--ghost"
                            : "st-btn st-btn--primary"
                    }
                    onClick={handleToggle}
                    disabled={!loaded || saving}
                >
                    {saving
                        ? "Saving…"
                        : enabled
                        ? "Turn suggestions off"
                        : "Turn suggestions on"}
                </button>
            </div>
            {err ? <p class="st-card__error">{err}</p> : null}
            <p class="st-card__help">
                When off, the system stops watching for patterns and
                never proposes a change. Existing suggestions stay
                where they are — they just won't grow.
            </p>
        </article>
    );
}

function CategoryCard(): JSX.Element {
    const cur = category.value;
    function handleChange(e: Event): void {
        const v = (e.currentTarget as HTMLSelectElement).value as ProductCategory;
        setCategory(v);
    }
    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--workspace">{t("Workspace-level")}</span>
                <h2 class="st-card__title">{t("Product category")}</h2>
            </header>
            <p class="st-card__desc">
                Pick the category that matches what you sell. This loads
                the matching discovery framework for live calls.
            </p>
            <select
                class="st-select"
                value={cur}
                onChange={handleChange}
                aria-label={t("Product category")}
            >
                {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                        {c.label}
                    </option>
                ))}
            </select>
            <p class="st-card__help">
                Workspace-scoped — switching the category re-routes
                discovery and call guidance across the workspace.
            </p>
        </article>
    );
}

function DemoCard(): JSX.Element {
    const d = demo.value;
    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--browser">{t("Browser-only")}</span>
                <h2 class="st-card__title">{t("Demo mode")}</h2>
            </header>
            <p class="st-card__desc">
                Demo mode loads a sample workspace into this browser only. It
                never overwrites your real cloud workspace. Use it to preview
                what a fully configured workspace looks like.
            </p>
            <ul class="st-status-list">
                <li>
                    <span>{t("Status")}</span>
                    <strong class={d.active ? "is-warn" : "is-good"}>
                        {d.active ? "Active on this browser" : "Off"}
                    </strong>
                </li>
                {d.scenario ? (
                    <li>
                        <span>{t("Scenario")}</span>
                        <strong>{d.scenario}</strong>
                    </li>
                ) : null}
                {d.seededAt ? (
                    <li>
                        <span>{t("Seeded")}</span>
                        <strong>{new Date(d.seededAt).toLocaleString()}</strong>
                    </li>
                ) : null}
            </ul>
            <div class="st-card__actions">
                <a
                    class="st-btn st-btn--ghost"
                    href="/demo-seed.html?autoseed=mm&return=/dashboard/"
                >
                    Enter demo (mid-market)
                </a>
                <a
                    class="st-btn st-btn--ghost"
                    href="/demo-seed.html?autoseed=ent&return=/dashboard/"
                >
                    Enter demo (enterprise)
                </a>
                <button
                    type="button"
                    class="st-btn st-btn--danger"
                    onClick={() => exitDemo()}
                    disabled={!d.active}
                >
                    Exit demo
                </button>
            </div>
            <p class="st-card__help">
                Demo state lives on this browser only. Exit clears the
                demo flag — to also wipe the demo data, use Backup →
                Clear local data.
            </p>
        </article>
    );
}

function RoleCard(): JSX.Element {
    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--account">{t("Account-level")}</span>
                <h2 class="st-card__title">{t("Role + onboarding")}</h2>
            </header>
            <p class="st-card__desc">
                Changed roles or starting fresh? Re-run onboarding to
                reconfigure the workspace. Existing ICPs, deals, signals, and
                motions stay safe — onboarding only retunes the activation
                path.
            </p>
            <div class="st-card__actions">
                <a class="st-btn st-btn--ghost" href="/onboarding/">
                    Re-run onboarding
                </a>
                <a class="st-btn st-btn--ghost" href="/welcome/">
                    Visit Welcome
                </a>
            </div>
            <p class="st-card__help">
                Re-running onboarding retunes the workspace without
                deleting your ICPs, deals, signals, or motions.
            </p>
        </article>
    );
}

function DensityCard(): JSX.Element {
    const state = densityState.value;
    const loaded = densityLoaded.value;
    const saving = densitySaving.value;
    const err = densityError.value;
    const isShowMeHow = state === "show_me_how";

    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--workspace">{t("Workspace-level")}</span>
                <h2 class="st-card__title">{t("How the system shows up")}</h2>
            </header>
            <p class="st-card__desc">
                Show me how — the system walks you through every surface,
                with explanations and tips. Step back — the system trusts
                you to know your way around and gets dense and immediate.
                You can switch any time.
            </p>
            <ul class="st-status-list">
                <li>
                    <span>{t("Right now")}</span>
                    <strong class={isShowMeHow ? "is-warn" : "is-good"}>
                        {loaded
                            ? isShowMeHow
                                ? "Show me how"
                                : "Step back"
                            : "Checking…"}
                    </strong>
                </li>
            </ul>
            <div class="st-card__actions">
                <button
                    type="button"
                    class={
                        isShowMeHow
                            ? "st-btn st-btn--primary"
                            : "st-btn st-btn--ghost"
                    }
                    onClick={() => void setDensity("show_me_how")}
                    disabled={!loaded || saving || isShowMeHow}
                >
                    {t("Show me how")}
                </button>
                <button
                    type="button"
                    class={
                        !isShowMeHow
                            ? "st-btn st-btn--primary"
                            : "st-btn st-btn--ghost"
                    }
                    onClick={() => void setDensity("step_back")}
                    disabled={!loaded || saving || !isShowMeHow}
                >
                    {t("Step back")}
                </button>
            </div>
            {err ? <p class="st-card__error">{err}</p> : null}
            <p class="st-card__help">
                Your choice is remembered for this workspace and follows
                you across devices.
            </p>
        </article>
    );
}
