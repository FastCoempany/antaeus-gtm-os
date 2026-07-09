import type { JSX } from "preact";
import { signal } from "@preact/signals";
import { t } from "@/lib/voice/t";
import {
    category,
    demo,
    backup,
    toast as toastSignal,
    isWorking,
    cloudConnection,
    isVerifyingCloud,
    cloudVerifiedAt,
    isDeletingCloud,
    isExportingCloud,
    phaseFEnabled,
    setCategory,
    exitDemo,
    exportBackup,
    importBackupFromFile,
    clearAll,
    dismissToast,
    exportCloudData,
    deleteCloudData,
    togglePhaseF,
    refreshCloudStatus,
    setDensity
} from "../state";
import { densityState } from "@/lib/density";
import { PRODUCT_CATEGORIES, type ProductCategory } from "../lib/types";
import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError } from "@/lib/observability";
import { GroundLine } from "@/lib/ground/GroundLine";
import "./settings-v4.css";

/**
 * SettingsV4 (canon §4.20) — the safe deposit, wired to production from
 * the settled 2026-07-07 design. Data safety leads: the plain trust
 * statement ("your workspace is safe — saved to the cloud, not trapped
 * on this laptop"), then YOUR DATA (one durable download · restore ·
 * the device-offline copy demoted to an Advanced disclosure · delete-
 * everything behind a type-to-confirm), then the quiet preferences, then
 * the recessive account row (sign out · re-run onboarding · privacy ·
 * terms). All flows reuse the shipped engine (cloud export/delete,
 * backup, category, density, the suggestions toggle). §4.20: no scope
 * kickers, no database words, no retired nouns.
 */

const deleteConfirm = signal("");
const restoreBusy = signal(false);

async function signOut(): Promise<void> {
    try {
        const sb = getSupabaseClient() as unknown as {
            auth: { signOut: () => Promise<unknown> };
        };
        await sb.auth.signOut();
        window.location.href = "/start.html";
    } catch (err) {
        reportError(err, { op: "settings.signOut" });
    }
}

function onRestoreFile(e: Event): void {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    restoreBusy.value = true;
    void importBackupFromFile(file).finally(() => {
        restoreBusy.value = false;
        input.value = "";
    });
}

export function SettingsV4(): JSX.Element {
    const conn = cloudConnection.value;
    const email = conn.userEmail;
    const workspaceName = conn.workspace?.name ?? null;
    const b = backup.value;
    const d = demo.value;
    const density = densityState.value;
    const confirmOk = deleteConfirm.value.trim().toLowerCase() === "delete my workspace";

    return (
        <div class="st4">
            <div class="st4-wrap">
                <div class="st4-top">
                    <span class="st4-bn">{t("Settings")}</span>
                    <span class="st4-r">{email ? `${t("signed in")} · ${email}` : t("not signed in")}</span>
                </div>

                {/* the trust statement */}
                <section class="st4-trust">
                    <div class="st4-k"><span class="st4-dot" />{t("Your workspace is safe")}</div>
                    <h1>{t("Everything you build is saved — not trapped on this laptop.", { class: "body" })}</h1>
                    <p>
                        {t("As you work, every room saves to the cloud automatically.", { class: "body" })}{" "}
                        {email ? (
                            <>
                                {t("You're signed in as")} <b>{email}</b>
                                {workspaceName ? <> {t("on the")} <b>{workspaceName}</b> {t("workspace")}</> : null}
                                {t(", so your targeting, deals, calls, and the rest follow you to any device.", { class: "body" })}{" "}
                            </>
                        ) : (
                            <>{t("Sign in and your targeting, deals, calls, and the rest follow you to any device.", { class: "body" })}{" "}</>
                        )}
                        {t("You can take a full copy or wipe it whenever you want — it's yours.", { class: "body" })}
                    </p>
                    <div class="st4-meta">
                        {conn.status === "connected" ? (
                            <>{t("Connected")}{cloudVerifiedAt.value ? <> · <b>{t("everything's in sync")}</b></> : null}</>
                        ) : conn.status === "error" ? (
                            t("Couldn't reach the cloud just now — your work still saves on this device.", { class: "body" })
                        ) : (
                            t("Checking the connection…")
                        )}
                        <button type="button" class="st4-v" disabled={isVerifyingCloud.value} onClick={() => void refreshCloudStatus()}>
                            {isVerifyingCloud.value ? t("Checking…") : t("Check again →")}
                        </button>
                    </div>
                </section>

                {/* your data */}
                <section class="st4-sec">
                    <div class="st4-sh">{t("Your data")}</div>
                    <div class="st4-sd">{t("Take a copy of everything, put a copy back, or erase it all. Your call, any time.", { class: "body" })}</div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("Download a copy of everything", { class: "body" })}</div>
                            <div class="st4-id">{t("A full file of your whole workspace — take it anywhere, keep it as a backup.", { class: "body" })}</div>
                        </div>
                        <div class="st4-ia">
                            <button type="button" class="st4-btn" disabled={isExportingCloud.value} onClick={() => void exportCloudData()}>
                                {isExportingCloud.value ? t("Preparing…") : t("Download my workspace")}
                            </button>
                        </div>
                    </div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("Put a copy back")}</div>
                            <div class="st4-id">{t("Restore your workspace from a file you downloaded before.", { class: "body" })}</div>
                        </div>
                        <div class="st4-ia">
                            <label class={`st4-btn is-ghost${restoreBusy.value ? " is-busy" : ""}`}>
                                {restoreBusy.value ? t("Restoring…") : t("Restore from a file")}
                                <input type="file" accept="application/json,.json" onChange={onRestoreFile} hidden />
                            </label>
                        </div>
                    </div>
                    <details class="st4-adv">
                        <summary>{t("Advanced — this device's offline copy", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("The app also keeps a working copy on this device for offline use. You can export or clear just this device's copy — it doesn't touch your cloud workspace.", { class: "body" })}
                            {b.capturedAt ? <> {t("Last device export:")} {new Date(b.capturedAt).toLocaleDateString()}.</> : null}
                            <div class="st4-abrow">
                                <button type="button" class="st4-btn is-ghost" disabled={isWorking.value} onClick={exportBackup}>{t("Export this device")}</button>
                                <button type="button" class="st4-btn is-ghost" disabled={isWorking.value} onClick={() => { if (window.confirm(t("Clear this device's offline copy? Your cloud workspace is untouched.", { class: "body" }))) clearAll(); }}>{t("Clear this device")}</button>
                            </div>
                        </div>
                    </details>
                    <div class="st4-danger">
                        <div class="st4-dt">{t("Delete everything")}</div>
                        <div class="st4-dd">
                            {t("Permanently erase your entire workspace — your targeting, deals, calls, pilot evidence, and everything else. Your account stays; the data is gone for good. Download a copy first if you might want it.", { class: "body" })}
                        </div>
                        <div class="st4-conf">
                            <span class="st4-cl">{t("Type")} <code>delete my workspace</code> {t("to turn the button on:")}</span>
                            <input value={deleteConfirm.value} placeholder="delete my workspace"
                                onInput={(e) => (deleteConfirm.value = (e.currentTarget as HTMLInputElement).value)} />
                            <button type="button" class="st4-btn is-danger" disabled={!confirmOk || isDeletingCloud.value}
                                onClick={() => { void deleteCloudData(); deleteConfirm.value = ""; }}>
                                {isDeletingCloud.value ? t("Deleting…") : t("Delete everything")}
                            </button>
                        </div>
                    </div>
                </section>

                {/* preferences */}
                <section class="st4-sec">
                    <div class="st4-sh">{t("How the app works for you")}</div>
                    <div class="st4-sd">{t("Small preferences — change them any time.", { class: "body" })}</div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("What you sell")}</div>
                            <div class="st4-id">{t("Loads the right discovery playbook for your live calls.", { class: "body" })}</div>
                        </div>
                        <div class="st4-ia">
                            <select class="st4-sel" value={category.value}
                                onChange={(e) => setCategory((e.currentTarget as HTMLSelectElement).value as ProductCategory)}>
                                {PRODUCT_CATEGORIES.map((c) => <option value={c.key} key={c.key}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("How much the app explains")}</div>
                            <div class="st4-id"><b>{t("Show me how")}</b> {t("walks you through everything.")} <b>{t("Step back")}</b> {t("trusts you and gets dense.")}</div>
                        </div>
                        <div class="st4-ia">
                            <button type="button" class={`st4-btn${density === "show_me_how" ? "" : " is-ghost"}`} onClick={() => void setDensity("show_me_how")}>{t("Show me how")}</button>
                            <button type="button" class={`st4-btn${density === "step_back" ? "" : " is-ghost"}`} onClick={() => void setDensity("step_back")}>{t("Step back")}</button>
                        </div>
                    </div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("Let the system suggest things", { class: "body" })}</div>
                            <div class="st4-id">{t("It'll flag a pattern now and then. You always accept or dismiss — nothing changes on its own.", { class: "body" })}</div>
                        </div>
                        <div class="st4-ia">
                            <button type="button" class={`st4-btn${phaseFEnabled.value ? "" : " is-ghost"}`} onClick={() => void togglePhaseF(!phaseFEnabled.value)}>
                                {phaseFEnabled.value ? t("On") : t("Off")}
                            </button>
                        </div>
                    </div>
                    <details class="st4-adv">
                        <summary>{t("Try a sample workspace")}</summary>
                        <div class="st4-ab">
                            {t("Load a demo workspace into this browser to explore — it never touches your real data.", { class: "body" })}
                            <div class="st4-abrow">
                                {d.active ? (
                                    <button type="button" class="st4-btn is-ghost" onClick={exitDemo}>{t("Exit the sample")}</button>
                                ) : (
                                    <>
                                        <a class="st4-btn is-ghost" href="/demo-seed.html?autoseed=mm&return=/dashboard/">{t("Mid-market sample")}</a>
                                        <a class="st4-btn is-ghost" href="/demo-seed.html?autoseed=ent&return=/dashboard/">{t("Enterprise sample")}</a>
                                    </>
                                )}
                            </div>
                        </div>
                    </details>
                </section>

                {/* account row */}
                <div class="st4-acct">
                    <span class="st4-who">
                        {email ? <>{t("Signed in as")} <b>{email}</b>{workspaceName ? ` · ${workspaceName}` : ""}</> : t("Not signed in")}
                    </span>
                    <span class="st4-sp">
                        <a class="st4-link" href="/onboarding/?returnTo=%2Fsettings%2F&returnLabel=Settings">{t("Re-run onboarding")}</a>
                        <a class="st4-link" href="/privacy.html">{t("Privacy")}</a>
                        <a class="st4-link" href="/terms.html">{t("Terms")}</a>
                        <button type="button" class="st4-btn is-ghost" onClick={() => void signOut()}>{t("Sign out")}</button>
                    </span>
                </div>
            </div>

            {toastSignal.value ? (
                <div class="st4-toast" onClick={dismissToast}>{toastSignal.value.message}</div>
            ) : null}
            <GroundLine />
        </div>
    );
}
