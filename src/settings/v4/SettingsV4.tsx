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
    toggleLiveEdge,
    refreshCloudStatus,
    setDensity
} from "../state";
import { liveEdgeOn } from "@/lib/edge/edge-prefs";
import { densityState } from "@/lib/density";
import { PRODUCT_CATEGORIES, type ProductCategory } from "../lib/types";
import { getSupabaseClient } from "@/lib/supabase-client";
import { reportError } from "@/lib/observability";
import { parseBackfillCsv, commitBackfill } from "../lib/backfill";
import {
    loadCaptureToken,
    mintCaptureToken,
    captureDomain,
    captureAddress,
    loadCalendarUrl,
    saveCalendarUrl,
    syncCalendarNow
} from "../lib/capture";
import { GroundLine } from "@/lib/ground/GroundLine";
import { LiveEdge } from "@/lib/edge/LiveEdge";
import "./settings-v4.css";

/**
 * Settings shows verifiable cloud status, export/restore controls, local
 * device-backup controls, optional activity capture, preferences, and account
 * actions. Copy does not equate a successful connection probe with complete
 * synchronization and does not call partial export/delete scopes "everything."
 */

const deleteConfirm = signal("");
const restoreBusy = signal(false);
const backfillText = signal("");
const backfillBusy = signal(false);
const backfillDone = signal<string | null>(null);
const captureToken = signal<string | null>(null);
const captureBusy = signal(false);
const captureErr = signal<string | null>(null);
let captureLoaded = false;
function ensureCaptureToken(): void {
    if (captureLoaded) return;
    captureLoaded = true;
    void loadCaptureToken().then((r) => (captureToken.value = r.token));
}
const calUrl = signal<string | null>(null);
const calDraft = signal("");
const calBusy = signal(false);
const calMsg = signal<string | null>(null);
let calLoaded = false;
function ensureCalendar(): void {
    if (calLoaded) return;
    calLoaded = true;
    void loadCalendarUrl().then((r) => (calUrl.value = r.url));
}
function connectCalendar(): void {
    calBusy.value = true;
    calMsg.value = null;
    void saveCalendarUrl(calDraft.value).then((saved) => {
        if (!saved.ok) {
            calBusy.value = false;
            calMsg.value = saved.error;
            return;
        }
        calUrl.value = calDraft.value.trim();
        calDraft.value = "";
        void syncCalendarNow().then((r) => {
            calBusy.value = false;
            calMsg.value = r.ok
                ? r.matched > 0
                    ? `Connected. ${r.matched} meeting${r.matched === 1 ? "" : "s"} matched watched accounts in the current window.`
                    : "Connected. No meetings matched watched accounts in the current window."
                : r.error;
        });
    });
}
function disconnectCalendar(): void {
    calBusy.value = true;
    void saveCalendarUrl(null).then(() => {
        calBusy.value = false;
        calUrl.value = null;
        calMsg.value = "Calendar connection removed.";
    });
}

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

                <section class="st4-trust">
                    <div class="st4-k"><span class="st4-dot" />{t("Workspace data")}</div>
                    <h1>{t("Review cloud status, exports, restores, and device backups.", { class: "body" })}</h1>
                    <p>
                        {email ? (
                            <>
                                {t("You are signed in as", { class: "body" })} <b>{email}</b>
                                {workspaceName ? <> {t("on the")} <b>{workspaceName}</b> {t("workspace")}</> : null}.
                                {" "}{t("The status check below verifies that this session can reach the workspace and read the cloud-backed records included in the check.", { class: "body" })}
                            </>
                        ) : (
                            t("No signed-in cloud workspace is currently verified. Some workflows may still keep a local device copy.", { class: "body" })
                        )}
                    </p>
                    <div class="st4-meta">
                        {conn.status === "connected" ? (
                            <>{t("Cloud connection verified")}{cloudVerifiedAt.value ? <> · <b>{new Date(cloudVerifiedAt.value).toLocaleString()}</b></> : null}</>
                        ) : conn.status === "error" ? (
                            t("The cloud status check failed. Review the connection and try again.", { class: "body" })
                        ) : conn.status === "auth-missing" ? (
                            t("No authenticated cloud session is available.", { class: "body" })
                        ) : conn.status === "no-credentials" ? (
                            t("Cloud configuration is not available in this environment.", { class: "body" })
                        ) : (
                            t("Checking the connection…")
                        )}
                        <button type="button" class="st4-v" disabled={isVerifyingCloud.value} onClick={() => void refreshCloudStatus()}>
                            {isVerifyingCloud.value ? t("Checking…") : t("Check again →")}
                        </button>
                    </div>
                </section>

                <section class="st4-sec">
                    <div class="st4-sh">{t("Data controls")}</div>
                    <div class="st4-sd">{t("Export or restore the cloud data covered by the current Settings workflow, manage the device copy, or delete the core cloud workspace content covered by this control.", { class: "body" })}</div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("Download workspace export", { class: "body" })}</div>
                            <div class="st4-id">{t("Creates a JSON export of the cloud tables currently included in the Settings export. If a table cannot be read, the export records that error instead of implying the copy is complete.", { class: "body" })}</div>
                        </div>
                        <div class="st4-ia">
                            <button type="button" class="st4-btn" disabled={isExportingCloud.value} onClick={() => void exportCloudData()}>
                                {isExportingCloud.value ? t("Preparing…") : t("Download workspace export")}
                            </button>
                        </div>
                    </div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("Restore from an export", { class: "body" })}</div>
                            <div class="st4-id">{t("Restores the rows present in a prior Antaeus cloud export. Table-level restore errors are reported if any write fails.", { class: "body" })}</div>
                        </div>
                        <div class="st4-ia">
                            <label class={`st4-btn is-ghost${restoreBusy.value ? " is-busy" : ""}`}>
                                {restoreBusy.value ? t("Restoring…") : t("Restore from a file")}
                                <input type="file" accept="application/json,.json" onChange={onRestoreFile} hidden />
                            </label>
                        </div>
                    </div>
                    <details class="st4-adv">
                        <summary>{t("Import closed-deal history", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("Paste historical closed deals from a spreadsheet, one deal per line: account, deal size, outcome, close date, and loss reason where applicable. A header row is allowed. Historical deals can improve ICP, win/loss, and planning analysis before new deals close in Antaeus.", { class: "body" })}
                            <textarea class="st4-paste" rows={5} value={backfillText.value}
                                placeholder={"account,value,outcome,date,reason\nNorthwind,\"$80,000\",won,2026-03-04,\nApex Mfg,64000,lost,2026-04-18,went with a competitor"}
                                onInput={(e) => { backfillText.value = (e.currentTarget as HTMLTextAreaElement).value; backfillDone.value = null; }} />
                            {(() => {
                                const parsed = parseBackfillCsv(backfillText.value);
                                const won = parsed.deals.filter((deal) => deal.won).length;
                                const lost = parsed.deals.length - won;
                                return (
                                    <div class="st4-abrow">
                                        <span class="st4-id">
                                            {parsed.deals.length > 0
                                                ? `${parsed.deals.length} ${t("deals read")} · ${won} ${t("won")} · ${lost} ${t("lost")}${parsed.skipped.length > 0 ? ` · ${parsed.skipped.length} ${t("lines skipped")}` : ""}`
                                                : backfillText.value.trim()
                                                  ? t("No valid deal rows were found. Check the columns and values.", { class: "body" })
                                                  : ""}
                                        </span>
                                        <button type="button" class="st4-btn" disabled={parsed.deals.length === 0 || backfillBusy.value}
                                            onClick={() => {
                                                backfillBusy.value = true;
                                                void commitBackfill(parsed.deals).then((result) => {
                                                    backfillBusy.value = false;
                                                    backfillText.value = "";
                                                    backfillDone.value = `${result.written} ${t("deals added to history")}${result.duplicates > 0 ? ` · ${result.duplicates} ${t("duplicates skipped")}` : ""}.`;
                                                });
                                            }}>
                                            {backfillBusy.value ? t("Adding…") : t("Add deals")}
                                        </button>
                                    </div>
                                );
                            })()}
                            {backfillDone.value ? <div class="st4-ok">{backfillDone.value}</div> : null}
                        </div>
                    </details>
                    <details class="st4-adv">
                        <summary>{t("Device copy", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("Some workflows keep a local browser copy. Exporting or clearing this device copy does not delete the cloud records covered by the cloud workspace controls above.", { class: "body" })}
                            {b.capturedAt ? <> {t("Last device export:")} {new Date(b.capturedAt).toLocaleDateString()}.</> : null}
                            <div class="st4-abrow">
                                <button type="button" class="st4-btn is-ghost" disabled={isWorking.value} onClick={exportBackup}>{t("Export device copy")}</button>
                                <button type="button" class="st4-btn is-ghost" disabled={isWorking.value} onClick={() => { if (window.confirm(t("Clear this device copy? Cloud records are not deleted by this action.", { class: "body" }))) clearAll(); }}>{t("Clear device copy")}</button>
                            </div>
                        </div>
                    </details>
                    <div class="st4-danger">
                        <div class="st4-dt">{t("Delete core workspace data", { class: "body" })}</div>
                        <div class="st4-dd">
                            {t("This removes rows from the core workspace tables currently included in the delete workflow and clears the local Antaeus cache. It does not delete your account, workspace membership, or every workspace-scoped table. Export first if you may need the covered data later.", { class: "body" })}
                        </div>
                        <div class="st4-conf">
                            <span class="st4-cl">{t("Type")} <code>delete my workspace</code> {t("to enable the button:")}</span>
                            <input value={deleteConfirm.value} placeholder="delete my workspace"
                                onInput={(e) => (deleteConfirm.value = (e.currentTarget as HTMLInputElement).value)} />
                            <button type="button" class="st4-btn is-danger" disabled={!confirmOk || isDeletingCloud.value}
                                onClick={() => { void deleteCloudData(); deleteConfirm.value = ""; }}>
                                {isDeletingCloud.value ? t("Deleting…") : t("Delete core workspace data", { class: "body" })}
                            </button>
                        </div>
                    </div>
                </section>

                <section class="st4-sec">
                    <div class="st4-sh">{t("Automatic activity capture", { class: "body" })}</div>
                    <div class="st4-sd">{t("Optional capture methods can reduce manual logging. Review what each method records before enabling it.", { class: "body" })}</div>

                    <details class="st4-adv" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) ensureCaptureToken(); }}>
                        <summary>{t("Email BCC capture", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("Add your Antaeus capture address to BCC on outreach messages. The capture workflow attempts to match the send to a watched account and log the activity. The current capture flow stores message metadata rather than the message body.", { class: "body" })}
                            {(() => {
                                const domain = captureDomain();
                                if (!domain) {
                                    return (
                                        <div class="st4-cap-wait">
                                            {t("BCC capture is not configured in this environment yet.", { class: "body" })}
                                        </div>
                                    );
                                }
                                const tok = captureToken.value;
                                return (
                                    <div class="st4-abrow">
                                        {tok ? (
                                            <>
                                                <code class="st4-cap-addr">{captureAddress(tok, domain)}</code>
                                                <button type="button" class="st4-btn is-ghost"
                                                    onClick={() => { void navigator.clipboard?.writeText(captureAddress(tok, domain)).catch(() => undefined); }}>
                                                    {t("Copy address")}
                                                </button>
                                            </>
                                        ) : (
                                            <button type="button" class="st4-btn" disabled={captureBusy.value}
                                                onClick={() => {
                                                    captureBusy.value = true;
                                                    captureErr.value = null;
                                                    void mintCaptureToken().then((result) => {
                                                        captureBusy.value = false;
                                                        captureToken.value = result.token;
                                                        captureErr.value = result.error;
                                                    });
                                                }}>
                                                {captureBusy.value ? t("Setting up…") : t("Create capture address")}
                                            </button>
                                        )}
                                        {captureErr.value ? <span class="st4-id">{captureErr.value}</span> : null}
                                    </div>
                                );
                            })()}
                            <div class="st4-cap-steps">
                                <b>{t("How to use it")}</b>
                                <ul>
                                    <li>{t("Add the capture address to the BCC field when you send outreach.", { class: "body" })}</li>
                                    <li>{t("If your email or sales tool supports a persistent BCC setting, you can add the address there instead of entering it on every message.", { class: "body" })}</li>
                                </ul>
                            </div>
                        </div>
                    </details>

                    <details class="st4-adv" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) ensureCalendar(); }}>
                        <summary>{t("Calendar capture", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("Connect an ICS calendar URL to check for meetings that match watched accounts. The sync reports how many meetings matched in the current window.", { class: "body" })}
                            <div class="st4-cap-steps">
                                <b>{t("Calendar URL")}</b>
                                <ul>
                                    <li>{t("Use a calendar subscription URL that you are comfortable connecting to Antaeus. Follow your calendar provider's instructions for generating the appropriate ICS link.", { class: "body" })}</li>
                                </ul>
                            </div>
                            {calUrl.value ? (
                                <div class="st4-abrow">
                                    <span class="st4-ok">{t("Calendar URL connected.")}</span>
                                    <button type="button" class="st4-btn is-ghost" disabled={calBusy.value}
                                        onClick={() => { calBusy.value = true; calMsg.value = null; void syncCalendarNow().then((result) => { calBusy.value = false; calMsg.value = result.ok ? `${t("Checked:")} ${result.matched} ${t("meetings matched watched accounts in the current window.", { class: "body" })}` : result.error; }); }}>
                                        {calBusy.value ? t("Checking…") : t("Check calendar now")}
                                    </button>
                                    <button type="button" class="st4-btn is-ghost" disabled={calBusy.value} onClick={disconnectCalendar}>{t("Disconnect")}</button>
                                </div>
                            ) : (
                                <div class="st4-abrow">
                                    <input class="st4-cal-in" placeholder="https://…/calendar.ics"
                                        value={calDraft.value}
                                        onInput={(e) => (calDraft.value = (e.currentTarget as HTMLInputElement).value)} />
                                    <button type="button" class="st4-btn" disabled={!calDraft.value.trim() || calBusy.value} onClick={connectCalendar}>
                                        {calBusy.value ? t("Connecting…") : t("Connect")}
                                    </button>
                                </div>
                            )}
                            {calMsg.value ? <div class="st4-id" style="margin-top:8px">{calMsg.value}</div> : null}
                        </div>
                    </details>

                    <details class="st4-adv">
                        <summary>{t("Direct inbox connection")}</summary>
                        <div class="st4-ab">
                            {t("A direct read-only inbox connection is not available in this workflow today. Use BCC capture above when you want email activity captured automatically.", { class: "body" })}
                        </div>
                    </details>

                    <details class="st4-adv">
                        <summary>{t("Calls with your existing tools", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("Antaeus does not include a dialer. Use your existing calling tool and record the outcome through the relevant Antaeus workflow.", { class: "body" })}
                            <ul>
                                <li>{t("Cold calls: review the plan in Cold Call Studio before dialing, then record the outcome after the call. A booked meeting creates a deal automatically.", { class: "body" })}</li>
                                <li>{t("Scheduled discovery calls: use Discovery Studio during the call when you want its questions, notes, and deal fields available.", { class: "body" })}</li>
                                <li>{t("If your calling tool creates a recording or transcript, review it and add the relevant buyer information and dated next step to the Antaeus workflow you used.", { class: "body" })}</li>
                            </ul>
                        </div>
                    </details>
                </section>

                <section class="st4-sec">
                    <div class="st4-sh">{t("Preferences")}</div>
                    <div class="st4-sd">{t("Change these preferences at any time.", { class: "body" })}</div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("Product category")}</div>
                            <div class="st4-id">{t("Used to select category-specific discovery content and other relevant workspace defaults.", { class: "body" })}</div>
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
                            <div class="st4-it">{t("Explanation level")}</div>
                            <div class="st4-id"><b>{t("Show me how")}</b> {t("includes more explanation.")} <b>{t("Step back")}</b> {t("uses a more compact interface.")}</div>
                        </div>
                        <div class="st4-ia">
                            <button type="button" class={`st4-btn${density === "show_me_how" ? "" : " is-ghost"}`} onClick={() => void setDensity("show_me_how")}>{t("Show me how")}</button>
                            <button type="button" class={`st4-btn${density === "step_back" ? "" : " is-ghost"}`} onClick={() => void setDensity("step_back")}>{t("Step back")}</button>
                        </div>
                    </div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("Show recent activity", { class: "body" })}</div>
                            <div class="st4-id">{t("The recent-activity panel shows today's activity, new events, and accounts with no recent response. Hiding the panel does not stop activity tracking.", { class: "body" })}</div>
                        </div>
                        <div class="st4-ia">
                            <button type="button" class={`st4-btn${liveEdgeOn.value ? "" : " is-ghost"}`} onClick={() => toggleLiveEdge(!liveEdgeOn.value)}>
                                {liveEdgeOn.value ? t("On") : t("Off")}
                            </button>
                        </div>
                    </div>
                    <div class="st4-item">
                        <div>
                            <div class="st4-it">{t("Allow recommendations", { class: "body" })}</div>
                            <div class="st4-id">{t("Antaeus may surface patterns and recommendations. You can accept or dismiss them; no data changes automatically through this setting.", { class: "body" })}</div>
                        </div>
                        <div class="st4-ia">
                            <button type="button" class={`st4-btn${phaseFEnabled.value ? "" : " is-ghost"}`} onClick={() => void togglePhaseF(!phaseFEnabled.value)}>
                                {phaseFEnabled.value ? t("On") : t("Off")}
                            </button>
                        </div>
                    </div>
                    <details class="st4-adv">
                        <summary>{t("Sample workspace")}</summary>
                        <div class="st4-ab">
                            {t("Load demo data in this browser to explore the product without using your live workspace records.", { class: "body" })}
                            <div class="st4-abrow">
                                {d.active ? (
                                    <button type="button" class="st4-btn is-ghost" onClick={exitDemo}>{t("Exit sample")}</button>
                                ) : (
                                    <>
                                        <a class="st4-btn is-ghost" href="/demo-seed.html?autoseed=smb&return=/dashboard/">{t("SMB sample")}</a>
                                        <a class="st4-btn is-ghost" href="/demo-seed.html?autoseed=ent&return=/dashboard/">{t("Enterprise sample")}</a>
                                    </>
                                )}
                            </div>
                        </div>
                    </details>
                </section>

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
            <LiveEdge />
        </div>
    );
}
