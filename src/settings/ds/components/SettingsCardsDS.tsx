import type { JSX, ComponentChildren } from "preact";
import { signal } from "@preact/signals";
import { Button, Card, Select, StatusChip, TextInput } from "@/components";
import { densityState } from "@/lib/density";
import { t } from "@/lib/voice/t";
import {
    PRODUCT_CATEGORIES,
    type ProductCategory
} from "../../lib/types";
import {
    backup,
    category,
    clearAll,
    cloudConnection,
    cloudVerifiedAt,
    deleteCloudData,
    demo,
    densityError,
    densityLoaded,
    densitySaving,
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
    setDensity,
    togglePhaseF
} from "../../state";
import { cloudStatusLabel, cloudTone, totalCloudRows } from "../lib/adapters";

/**
 * SettingsCardsDS — the trust-annex cards rebuilt on the component
 * library (canon §4.20: calm, plainspoken utility). Each setting group
 * is a Grounded Card; recovery moves are library Buttons; the
 * destructive cards carry the red anchored edge (tone="red") and gate
 * on a confirm. Every backup/restore, cloud sync, export, delete, Phase
 * F, and density flow is the unchanged state engine — only the surface
 * is composed on the library.
 */

function Rows(props: { readonly children: ComponentChildren }): JSX.Element {
    return <dl class="stgd-rows">{props.children}</dl>;
}

function Row(props: {
    readonly label: string;
    readonly children: ComponentChildren;
}): JSX.Element {
    return (
        <div class="stgd-row">
            <dt>{props.label}</dt>
            <dd>{props.children}</dd>
        </div>
    );
}

export function SettingsCardsDS(): JSX.Element {
    return (
        <div class="stgd-grid">
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

function CloudSyncCard(): JSX.Element {
    const conn = cloudConnection.value;
    const verifying = isVerifyingCloud.value;
    const verifiedAt = cloudVerifiedAt.value;
    const total = totalCloudRows();

    const helpCopy: Record<typeof conn.status, string> = {
        connected: t(
            "Each room saves to the cloud as you work. The breakdown is what's stored cross-device — your durable workspace.",
            { class: "body" }
        ),
        "no-credentials": t(
            "Cloud sync isn't configured for this build. The app runs from local storage only.",
            { class: "body" }
        ),
        "auth-missing": t(
            "You're not signed in. Sign in to your workspace to enable cross-device sync.",
            { class: "body" }
        ),
        error: t(
            "Cloud check failed. The workspace keeps working from local storage in the meantime.",
            { class: "body" }
        )
    };

    return (
        <Card kicker={t("WORKSPACE-LEVEL · CLOUD SYNC")}>
            <p class="ds-card__copy">{helpCopy[conn.status]}</p>
            <Rows>
                <Row label={t("Connection")}>
                    <StatusChip
                        label={cloudStatusLabel(conn.status)}
                        tone={cloudTone(conn.status)}
                    />
                </Row>
                <Row label={t("Signed in as")}>{conn.userEmail || "—"}</Row>
                <Row label={t("Workspace")}>{conn.workspace?.name || "—"}</Row>
                <Row label={t("Total cloud rows")}>
                    {conn.status === "connected" ? total : "—"}
                </Row>
                <Row label={t("Last verified")}>
                    {verifiedAt ? new Date(verifiedAt).toLocaleString() : "—"}
                </Row>
            </Rows>
            <div class="stgd-actions">
                <Button
                    variant="primary"
                    onClick={() => void refreshCloudStatus()}
                    disabled={verifying}
                >
                    {verifying ? t("Verifying…") : t("Verify cloud sync")}
                </Button>
            </div>
            {conn.errorMessage ? (
                <p class="stgd-error">{conn.errorMessage}</p>
            ) : null}
        </Card>
    );
}

function CloudExportCard(): JSX.Element {
    const busy = isExportingCloud.value;
    const last = lastCloudExport.value;
    const total = totalCloudRows();
    return (
        <Card kicker={t("WORKSPACE-LEVEL · EXPORT CLOUD DATA")}>
            <p class="ds-card__copy">
                {t(
                    "Download every row from your workspace as a JSON file — the portable copy of what's actually durable. The local backup card below only captures the browser cache.",
                    { class: "body" }
                )}
            </p>
            <Rows>
                <Row label={t("Cloud rows in scope")}>{total}</Row>
                {last ? (
                    <Row label={t("Last export")}>
                        {last.totalRows} rows
                        {last.errors.length > 0
                            ? ` · ${last.errors.length} errors`
                            : ""}
                        {" · "}
                        {new Date(last.capturedAt).toLocaleString()}
                    </Row>
                ) : null}
            </Rows>
            <div class="stgd-actions">
                <Button
                    variant="primary"
                    onClick={() => void exportCloudData()}
                    disabled={busy}
                >
                    {busy ? t("Exporting…") : t("Export cloud data")}
                </Button>
            </div>
        </Card>
    );
}

// Module-level DOM ref (callback ref, no preact/hooks — the DS-component
// pattern in this repo, which also sidesteps the @preact/preset-vite
// hook-name transform issue the canon documents).
let backupFileEl: HTMLInputElement | null = null;

function BackupCard(): JSX.Element {
    const b = backup.value;
    const working = isWorking.value;

    function handlePick(): void {
        backupFileEl?.click();
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
                      "Clear every gtmos_* key on this device? Cloud sync is untouched, but the local view is empty until the next sync."
                  );
        if (ok) clearAll();
    }

    return (
        <Card kicker={t("WORKSPACE-LEVEL · BACKUP AND RESTORE")}>
            <p class="ds-card__copy">
                {t(
                    "Export every local key on this device into a JSON file. Import to restore. Clear empties the local cache on this device only — cloud sync is unaffected.",
                    { class: "body" }
                )}
            </p>
            <Rows>
                <Row label={t("Keys captured")}>{b.keyCount}</Row>
                <Row label={t("Last export")}>
                    {b.capturedAt ? new Date(b.capturedAt).toLocaleString() : "—"}
                </Row>
            </Rows>
            <div class="stgd-actions">
                <Button
                    variant="primary"
                    onClick={() => exportBackup()}
                    disabled={working}
                >
                    {t("Export backup")}
                </Button>
                <Button variant="ghost" onClick={handlePick} disabled={working}>
                    {t("Import backup")}
                </Button>
                <Button variant="secondary" onClick={handleClear} disabled={working}>
                    {t("Clear local data")}
                </Button>
                <input
                    ref={(el) => {
                        backupFileEl = el;
                    }}
                    type="file"
                    accept="application/json,.json"
                    style="display:none"
                    onChange={handleFile}
                />
            </div>
        </Card>
    );
}

function CategoryCard(): JSX.Element {
    const cur = category.value;
    return (
        <Card kicker={t("WORKSPACE-LEVEL · PRODUCT CATEGORY")}>
            <p class="ds-card__copy">
                {t(
                    "Pick the category that matches what you sell. This loads the matching discovery framework for live calls.",
                    { class: "body" }
                )}
            </p>
            <Select
                value={cur}
                onChange={(v) => setCategory(v as ProductCategory)}
                options={PRODUCT_CATEGORIES.map((c) => ({
                    value: c.key,
                    label: c.label
                }))}
            />
        </Card>
    );
}

function PhaseFCard(): JSX.Element {
    const enabled = phaseFEnabled.value;
    const loaded = phaseFLoaded.value;
    const saving = phaseFSaving.value;
    const err = phaseFError.value;
    return (
        <Card kicker={t("WORKSPACE-LEVEL · SYSTEM SUGGESTIONS")}>
            <p class="ds-card__copy">
                {t(
                    "The system will sometimes notice a pattern in how you work and suggest a small change. You always accept or dismiss. Nothing changes without you.",
                    { class: "body" }
                )}
            </p>
            <Rows>
                <Row label={t("Status")}>
                    <StatusChip
                        label={loaded ? (enabled ? "On" : "Off") : "Checking…"}
                        tone={loaded ? (enabled ? "green" : "amber") : undefined}
                    />
                </Row>
            </Rows>
            <div class="stgd-actions">
                <Button
                    variant={enabled ? "ghost" : "primary"}
                    onClick={() => void togglePhaseF(!enabled)}
                    disabled={!loaded || saving}
                >
                    {saving
                        ? t("Saving…")
                        : enabled
                          ? t("Turn suggestions off")
                          : t("Turn suggestions on")}
                </Button>
            </div>
            {err ? <p class="stgd-error">{err}</p> : null}
        </Card>
    );
}

function densityWhy(
    loaded: boolean,
    saving: boolean,
    isCurrent: boolean
): string | undefined {
    if (!loaded) return t("Checking…");
    if (saving) return t("Saving…");
    if (isCurrent) return t("Already on");
    return undefined;
}

function DensityCard(): JSX.Element {
    const state = densityState.value;
    const loaded = densityLoaded.value;
    const saving = densitySaving.value;
    const err = densityError.value;
    const isShowMeHow = state === "show_me_how";
    return (
        <Card kicker={t("WORKSPACE-LEVEL · HOW IT SHOWS UP")}>
            <p class="ds-card__copy">
                {t(
                    "Show me how — the system walks you through every surface with explanations. Step back — it trusts you to know your way around and gets dense. Switch any time.",
                    { class: "body" }
                )}
            </p>
            <Rows>
                <Row label={t("Right now")}>
                    <StatusChip
                        label={
                            loaded
                                ? isShowMeHow
                                    ? "Show me how"
                                    : "Step back"
                                : "Checking…"
                        }
                        tone={loaded ? (isShowMeHow ? "blue" : "green") : undefined}
                    />
                </Row>
            </Rows>
            <div class="stgd-actions">
                <Button
                    variant={isShowMeHow ? "primary" : "ghost"}
                    onClick={() => void setDensity("show_me_how")}
                    disabled={!loaded || saving || isShowMeHow}
                    disabledWhy={densityWhy(loaded, saving, isShowMeHow)}
                >
                    {t("Show me how")}
                </Button>
                <Button
                    variant={!isShowMeHow ? "primary" : "ghost"}
                    onClick={() => void setDensity("step_back")}
                    disabled={!loaded || saving || !isShowMeHow}
                    disabledWhy={densityWhy(loaded, saving, !isShowMeHow)}
                >
                    {t("Step back")}
                </Button>
            </div>
            {err ? <p class="stgd-error">{err}</p> : null}
        </Card>
    );
}

function DemoCard(): JSX.Element {
    const d = demo.value;
    return (
        <Card kicker={t("BROWSER-ONLY · DEMO MODE")}>
            <p class="ds-card__copy">
                {t(
                    "Demo mode loads a sample workspace into this browser only. It never overwrites your real cloud workspace.",
                    { class: "body" }
                )}
            </p>
            <Rows>
                <Row label={t("Status")}>
                    <StatusChip
                        label={d.active ? "Active on this browser" : "Off"}
                        tone={d.active ? "amber" : "green"}
                    />
                </Row>
                {d.scenario ? <Row label={t("Scenario")}>{d.scenario}</Row> : null}
                {d.seededAt ? (
                    <Row label={t("Seeded")}>
                        {new Date(d.seededAt).toLocaleString()}
                    </Row>
                ) : null}
            </Rows>
            <div class="stgd-actions">
                <a
                    class="ds-btn ds-btn--ghost"
                    href="/demo-seed.html?autoseed=mm&return=/dashboard/"
                >
                    {t("Enter demo (mid-market)")}
                </a>
                <a
                    class="ds-btn ds-btn--ghost"
                    href="/demo-seed.html?autoseed=ent&return=/dashboard/"
                >
                    {t("Enter demo (enterprise)")}
                </a>
                <Button
                    variant="secondary"
                    onClick={() => exitDemo()}
                    disabled={!d.active}
                >
                    {t("Exit demo")}
                </Button>
            </div>
        </Card>
    );
}

function RoleCard(): JSX.Element {
    return (
        <Card kicker={t("ACCOUNT-LEVEL · ROLE + ONBOARDING")}>
            <p class="ds-card__copy">
                {t(
                    "Changed roles or starting fresh? Re-run onboarding to reconfigure the workspace. Existing ICPs, deals, signals, and motions stay safe — onboarding only retunes the activation path.",
                    { class: "body" }
                )}
            </p>
            <div class="stgd-actions">
                <a class="ds-btn ds-btn--ghost" href="/onboarding/">
                    {t("Re-run onboarding")}
                </a>
                <a class="ds-btn ds-btn--ghost" href="/welcome/">
                    {t("Visit Welcome")}
                </a>
            </div>
        </Card>
    );
}

const CONFIRM_PHRASE = "delete my data";
const deletePhrase = signal("");

function DeleteCloudDataCard(): JSX.Element {
    const phrase = deletePhrase.value;
    const deleting = isDeletingCloud.value;
    const last = lastCloudDelete.value;
    const total = totalCloudRows();
    const phraseMatches = phrase.trim().toLowerCase() === CONFIRM_PHRASE;
    const canDelete = phraseMatches && !deleting;

    async function handleDelete(): Promise<void> {
        if (!canDelete) return;
        const ok =
            typeof window === "undefined"
                ? true
                : window.confirm(
                      "Final confirmation: this permanently deletes every row in your workspace data tables. This cannot be undone. Continue?"
                  );
        if (!ok) return;
        await deleteCloudData();
        deletePhrase.value = "";
    }

    return (
        <Card kicker={t("WORKSPACE-LEVEL · DELETE MY DATA")} tone="red">
            <p class="ds-card__copy">
                {t(
                    "Permanently delete every row in your workspace — ICPs, deals, proofs, signals, advisor deployments, discovery call logs, and supporting artifacts. Your account stays intact. This is irreversible. Export a backup first if you want a copy.",
                    { class: "body" }
                )}
            </p>
            <Rows>
                <Row label={t("Cloud rows in scope")}>{total}</Row>
                {last ? (
                    <Row label={t("Last delete")}>
                        {last.totalDeleted} rows
                        {last.errors.length > 0
                            ? ` · ${last.errors.length} errors`
                            : ""}
                    </Row>
                ) : null}
            </Rows>
            <div class="stgd-confirm">
                <span class="stgd-confirm__label">
                    {t("Type the confirm phrase to enable the destroy button:", {
                        class: "body"
                    })}{" "}
                    <code>{CONFIRM_PHRASE}</code>
                </span>
                <TextInput
                    value={phrase}
                    onInput={(v) => {
                        deletePhrase.value = v;
                    }}
                    placeholder={CONFIRM_PHRASE}
                />
            </div>
            <div class="stgd-actions">
                <Button
                    variant="secondary"
                    onClick={() => void handleDelete()}
                    disabled={!canDelete}
                >
                    {deleting ? t("Deleting…") : t("Delete cloud data")}
                </Button>
            </div>
        </Card>
    );
}
