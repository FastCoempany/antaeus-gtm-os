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
                    ? `Connected — found ${r.matched} meeting${r.matched === 1 ? "" : "s"} with accounts you watch.`
                    : "Connected. No meetings with watched accounts in the current window — they'll count as they land."
                : r.error;
        });
    });
}
function disconnectCalendar(): void {
    calBusy.value = true;
    void saveCalendarUrl(null).then(() => {
        calBusy.value = false;
        calUrl.value = null;
        calMsg.value = "Disconnected. Nothing new gets read.";
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
                        <summary>{t("Bring your deal history", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("Sold before you had Antaeus? Paste your closed deals from a spreadsheet — one deal per line: account, deal size, won or lost, close date, and (for losses) why. A header row is fine. Your history switches on the reads that otherwise wait for new deals to close: who hits and who misses, the losses you paid for, why you win, and whether your plan is realistic.", { class: "body" })}
                            <textarea class="st4-paste" rows={5} value={backfillText.value}
                                placeholder={"account,value,outcome,date,reason\nNorthwind,\"$80,000\",won,2026-03-04,\nApex Mfg,64000,lost,2026-04-18,went with a competitor"}
                                onInput={(e) => { backfillText.value = (e.currentTarget as HTMLTextAreaElement).value; backfillDone.value = null; }} />
                            {(() => {
                                const parsed = parseBackfillCsv(backfillText.value);
                                const won = parsed.deals.filter((d) => d.won).length;
                                const lost = parsed.deals.length - won;
                                return (
                                    <div class="st4-abrow">
                                        <span class="st4-id">
                                            {parsed.deals.length > 0
                                                ? `${parsed.deals.length} ${t("deals read")} — ${won} ${t("won")}, ${lost} ${t("lost")}${parsed.skipped.length > 0 ? ` · ${parsed.skipped.length} ${t("lines skipped")}` : ""}`
                                                : backfillText.value.trim()
                                                  ? t("Nothing readable yet — check the columns.", { class: "body" })
                                                  : ""}
                                        </span>
                                        <button type="button" class="st4-btn" disabled={parsed.deals.length === 0 || backfillBusy.value}
                                            onClick={() => {
                                                backfillBusy.value = true;
                                                void commitBackfill(parsed.deals).then((r) => {
                                                    backfillBusy.value = false;
                                                    backfillText.value = "";
                                                    backfillDone.value = `${r.written} ${t("deals added to your history")}${r.duplicates > 0 ? ` · ${r.duplicates} ${t("already there, skipped")}` : ""}.`;
                                                });
                                            }}>
                                            {backfillBusy.value ? t("Adding…") : t("Add them")}
                                        </button>
                                    </div>
                                );
                            })()}
                            {backfillDone.value ? <div class="st4-ok">{backfillDone.value}</div> : null}
                        </div>
                    </details>
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

                {/* capture — getting the work counted without typing */}
                <section class="st4-sec">
                    <div class="st4-sh">{t("Counting your work automatically", { class: "body" })}</div>
                    <div class="st4-sd">{t("The less you have to log by hand, the truer every read gets. Three ways in — all optional.", { class: "body" })}</div>

                    <details class="st4-adv" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) ensureCaptureToken(); }}>
                        <summary>{t("Email — your BCC address", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("Add your Antaeus address to the BCC line when you send outreach, and the send counts itself: it's matched to the account you're watching and logged as a touch — the outreach tallies, the \"where you are with them\" read, and your daily pace all pick it up. What gets saved: the subject line, who it went to, and when — never the message itself.", { class: "body" })}
                            {(() => {
                                const domain = captureDomain();
                                if (!domain) {
                                    return (
                                        <div class="st4-cap-wait">
                                            {t("Your address isn't switched on quite yet — the moment it is, it appears right here, ready to copy.", { class: "body" })}
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
                                                    {t("Copy it")}
                                                </button>
                                            </>
                                        ) : (
                                            <button type="button" class="st4-btn" disabled={captureBusy.value}
                                                onClick={() => {
                                                    captureBusy.value = true;
                                                    captureErr.value = null;
                                                    void mintCaptureToken().then((r) => {
                                                        captureBusy.value = false;
                                                        captureToken.value = r.token;
                                                        captureErr.value = r.error;
                                                    });
                                                }}>
                                                {captureBusy.value ? t("Setting up…") : t("Create my address")}
                                            </button>
                                        )}
                                        {captureErr.value ? <span class="st4-id">{captureErr.value}</span> : null}
                                    </div>
                                );
                            })()}
                            <div class="st4-cap-steps">
                                <b>{t("Set it up once, per tool:")}</b>
                                <ul>
                                    <li>{t("Gmail: there's no automatic BCC — type (or paste) your address into the BCC line when you send outreach. After two or three sends it autocompletes on the first letter.", { class: "body" })}</li>
                                    <li>{t("Outlook: same — add it to the BCC line by hand. On desktop, you can pin it: New mail → Options → Bcc shows the field on every message.", { class: "body" })}</li>
                                    <li>{t("Superhuman, Outreach, Apollo, and most sales tools: Settings has an \"always BCC\" box — paste your address there once and every send counts itself.", { class: "body" })}</li>
                                </ul>
                            </div>
                        </div>
                    </details>

                    <details class="st4-adv" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) ensureCalendar(); }}>
                        <summary>{t("Calendar — paste your link", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("Paste your calendar's private link and meetings with accounts you're watching count themselves — no approvals, no setup on your calendar's side. Only meetings where someone from an account you're watching is invited get saved — the title, the time, and who. Everything else on your calendar is ignored and never stored.", { class: "body" })}
                            <div class="st4-cap-steps">
                                <b>{t("Where the link lives:")}</b>
                                <ul>
                                    <li>{t("Google Calendar: calendar.google.com → the gear → Settings → click your calendar on the left → scroll to \"Secret address in iCal format\" → copy.", { class: "body" })}</li>
                                    <li>{t("Outlook: outlook.com → the gear → Calendar → Shared calendars → publish your calendar → copy the ICS link.", { class: "body" })}</li>
                                    <li>{t("Apple iCloud: icloud.com/calendar → the share icon next to your calendar → Public Calendar → copy the link.", { class: "body" })}</li>
                                </ul>
                            </div>
                            {calUrl.value ? (
                                <div class="st4-abrow">
                                    <span class="st4-ok">{t("Your calendar is connected.")}</span>
                                    <button type="button" class="st4-btn is-ghost" disabled={calBusy.value}
                                        onClick={() => { calBusy.value = true; calMsg.value = null; void syncCalendarNow().then((r) => { calBusy.value = false; calMsg.value = r.ok ? `${t("Checked — ")}${r.matched} ${t("meetings with watched accounts in the current window.", { class: "body" })}` : r.error; }); }}>
                                        {calBusy.value ? t("Checking…") : t("Check my calendar now", { class: "body" })}
                                    </button>
                                    <button type="button" class="st4-btn is-ghost" disabled={calBusy.value} onClick={disconnectCalendar}>{t("Disconnect")}</button>
                                </div>
                            ) : (
                                <div class="st4-abrow">
                                    <input class="st4-cal-in" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
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
                        <summary>{t("Email — the deeper connection (optional, not on yet)", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("Later, you'll be able to connect your inbox read-only with one click, and sends and replies will count themselves with no BCC habit at all. It isn't on yet — Google has to security-review Antaeus itself (nothing about you) before your one-click approval can exist. When it lands, it will be exactly this: optional, read-only, matched only against accounts you're already watching — and the click-by-click will live right here. Until then, the BCC address above does the job.", { class: "body" })}
                        </div>
                    </details>

                    <details class="st4-adv">
                        <summary>{t("Calls — run them with your own tools", { class: "body" })}</summary>
                        <div class="st4-ab">
                            {t("There's no dialer in Antaeus, on purpose — call from whatever you already use: your phone, Zoom, Meet, OpenPhone, Aircall. Here's how the calls still count:", { class: "body" })}
                            <ul>
                                <li>{t("Cold calls: open Cold Call Studio before you dial — it hands you the game plan — and tap the outcome the moment you hang up (meeting booked, callback, voicemail…). A booked meeting creates the deal by itself.", { class: "body" })}</li>
                                <li>{t("Scheduled discovery calls: run the call inside Discovery Studio — it's built to be glanced at while you talk, and what you capture flows straight to the deal.", { class: "body" })}</li>
                                <li>{t("If your tool records or transcribes (Zoom, Meet, OpenPhone): after the call, skim the recap and put the two things that matter into the room you ran it from — what they admitted, and the dated next step. Two lines is enough; the rooms do the rest.", { class: "body" })}</li>
                                <li>{t("Direct connections to call tools may come later. The habit above costs about thirty seconds a call and keeps every read honest today.", { class: "body" })}</li>
                            </ul>
                        </div>
                    </details>
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
                            <div class="st4-it">{t("Show the live edge")}</div>
                            <div class="st4-id">{t("The left wall carries your day — your count, what just landed, who's gone quiet. Turn it off and a thin line stays; click that line any time to bring it back. Your work is counted either way.", { class: "body" })}</div>
                        </div>
                        <div class="st4-ia">
                            <button type="button" class={`st4-btn${liveEdgeOn.value ? "" : " is-ghost"}`} onClick={() => toggleLiveEdge(!liveEdgeOn.value)}>
                                {liveEdgeOn.value ? t("On") : t("Off")}
                            </button>
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
                                        <a class="st4-btn is-ghost" href="/demo-seed.html?autoseed=smb&return=/dashboard/">{t("SMB sample")}</a>
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
            <LiveEdge />
        </div>
    );
}
