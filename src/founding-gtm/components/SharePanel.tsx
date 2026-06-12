import { useEffect, useState } from "preact/hooks";
import { t } from "@/lib/voice/t";
import { signal, type Signal } from "@preact/signals";
import { trackEvent } from "@/lib/observability";
import { createDataClient, type DataClient } from "@/lib/data-client";
import {
    buildShareSnapshot,
    buildShareUrl,
    createShare,
    listShares,
    regenerateShareSnapshot,
    revokeShare,
    type ShareRow
} from "../lib/share";
import { authoredSections, readinessVerdictLabel } from "../state";

/**
 * SharePanel — operator-side manage UI for Founding GTM share links.
 *
 * Locked by founder 2026-05-31: manage UI in the Founding GTM room
 * (not Settings), anonymous URL token, Founding-GTM-only scope. This
 * is the canon §4.19 share-link primitive made concrete.
 *
 * Surface:
 *   - Header: "Share this kit" with create-link affordance
 *   - Optional label input + Create button
 *   - List of active + revoked links with copy/regenerate/revoke
 *   - Demo-mode banner when running in localStorage-only mode
 *
 * Errors are non-blocking: a failed create or revoke surfaces in a
 * banner; the panel stays usable. Cloud failures are logged via
 * reportError (called inside the share.ts helpers).
 */

// Lazy DataClient — created on first interaction so demo workspaces
// don't try to instantiate a Supabase client (which throws on missing
// env vars). Cached after first successful creation.
let cachedClient: DataClient | null = null;

function tryGetClient(): DataClient | null {
    if (cachedClient) return cachedClient;
    try {
        cachedClient = createDataClient();
        return cachedClient;
    } catch {
        return null;
    }
}

function isDemoMode(): boolean {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem("gtmos_env_mode") === "demo";
}

// ─── Module-local signals (not test-friendly state, just UI atoms) ────

const sharesSignal: Signal<ReadonlyArray<ShareRow>> = signal([]);
const loadingSignal: Signal<boolean> = signal(false);
const errorBannerSignal: Signal<string | null> = signal(null);

async function refreshShares(client: DataClient): Promise<void> {
    loadingSignal.value = true;
    try {
        sharesSignal.value = await listShares(client);
    } finally {
        loadingSignal.value = false;
    }
}

export function SharePanel() {
    const [labelInput, setLabelInput] = useState("");
    const [busy, setBusy] = useState<string | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const demo = isDemoMode();
    const client = demo ? null : tryGetClient();

    useEffect(() => {
        if (!client) return;
        void refreshShares(client);
        trackEvent("founding_gtm_share_panel_opened", {});
    }, [client]);

    async function handleCreate(): Promise<void> {
        if (!client) return;
        setBusy("create");
        errorBannerSignal.value = null;
        try {
            const snapshot = buildShareSnapshot({
                sections: authoredSections.value,
                workspaceName: "Your workspace",
                verdictLabel: readinessVerdictLabel.value
            });
            const created = await createShare(client, {
                snapshot,
                label: labelInput.trim() || undefined
            });
            if (!created) {
                errorBannerSignal.value =
                    "Couldn't create the share link. Check your connection and try again.";
                return;
            }
            setLabelInput("");
            await refreshShares(client);
            trackEvent("founding_gtm_share_created", {
                has_label: Boolean(created.label)
            });
        } finally {
            setBusy(null);
        }
    }

    async function handleRevoke(id: string): Promise<void> {
        if (!client) return;
        setBusy(id);
        errorBannerSignal.value = null;
        try {
            const ok = await revokeShare(client, id);
            if (!ok) {
                errorBannerSignal.value =
                    "Couldn't revoke the link. Check your connection and try again.";
                return;
            }
            await refreshShares(client);
            trackEvent("founding_gtm_share_revoked", {});
        } finally {
            setBusy(null);
        }
    }

    async function handleRegenerate(id: string): Promise<void> {
        if (!client) return;
        setBusy(id);
        errorBannerSignal.value = null;
        try {
            const snapshot = buildShareSnapshot({
                sections: authoredSections.value,
                workspaceName: "Your workspace",
                verdictLabel: readinessVerdictLabel.value
            });
            const ok = await regenerateShareSnapshot(client, id, snapshot);
            if (!ok) {
                errorBannerSignal.value =
                    "Couldn't refresh the snapshot. Check your connection and try again.";
                return;
            }
            await refreshShares(client);
            trackEvent("founding_gtm_share_regenerated", {});
        } finally {
            setBusy(null);
        }
    }

    async function handleCopy(token: string): Promise<void> {
        const origin =
            typeof window !== "undefined" ? window.location.origin : null;
        const url = buildShareUrl(token, origin);
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
            trackEvent("founding_gtm_share_copied", {});
        } catch {
            errorBannerSignal.value =
                "Couldn't copy to clipboard. Select the link below and copy manually.";
        }
    }

    if (demo) {
        return (
            <section class="fg-share fg-share--demo" aria-label={t("Share this kit")}>
                <header class="fg-share__head">
                    <p class="fg-share__kicker">{t("SHARE THIS KIT")}</p>
                    <h2 class="fg-share__title">
                        Sign in to share the kit with a hire
                    </h2>
                    <p class="fg-share__demo-body">
                        Share links live in your real workspace. Demo
                        workspaces stay on this device — there's no
                        cloud-resident kit to share yet.
                    </p>
                </header>
            </section>
        );
    }

    if (!client) {
        return (
            <section class="fg-share fg-share--disabled" aria-label={t("Share this kit")}>
                <header class="fg-share__head">
                    <p class="fg-share__kicker">{t("SHARE THIS KIT")}</p>
                    <h2 class="fg-share__title">{t("Share links unavailable")}</h2>
                    <p class="fg-share__demo-body">
                        The cloud sync isn't configured for this build. Share
                        links need a connected workspace.
                    </p>
                </header>
            </section>
        );
    }

    const shares = sharesSignal.value;
    const active = shares.filter((s) => !s.revokedAtIso);
    const revoked = shares.filter((s) => s.revokedAtIso);
    const errorBanner = errorBannerSignal.value;
    const isLoading = loadingSignal.value;

    return (
        <section class="fg-share" aria-label={t("Share this kit")}>
            <header class="fg-share__head">
                <p class="fg-share__kicker">{t("SHARE THIS KIT")}</p>
                <h2 class="fg-share__title">
                    Send the kit to a hire as a read-only link
                </h2>
                <p class="fg-share__lede">
                    The recipient sees a frozen snapshot of all seven sections.
                    They can't edit anything; you can revoke the link or refresh
                    the snapshot whenever the kit changes.
                </p>
            </header>

            {errorBanner && (
                <div class="fg-share__error" role="alert">
                    {errorBanner}
                </div>
            )}

            <div class="fg-share__create">
                <label class="fg-share__label-input">
                    <span class="fg-share__label-input-tag">
                        Optional label
                    </span>
                    <input
                        type="text"
                        value={labelInput}
                        onInput={(e) =>
                            setLabelInput((e.target as HTMLInputElement).value)
                        }
                        placeholder={t("e.g. Sarah Chen, week 12")}
                        maxLength={120}
                        disabled={busy === "create"}
                    />
                </label>
                <button
                    type="button"
                    class="fg-share__create-btn"
                    onClick={() => void handleCreate()}
                    disabled={busy === "create"}
                >
                    {busy === "create" ? "Creating…" : "Create share link"}
                </button>
            </div>

            <div class="fg-share__list-wrap">
                {isLoading && shares.length === 0 ? (
                    <p class="fg-share__empty">{t("Loading existing links…")}</p>
                ) : shares.length === 0 ? (
                    <p class="fg-share__empty">
                        No share links yet. Create one above when the kit is
                        ready to hand off.
                    </p>
                ) : (
                    <>
                        {active.length > 0 && (
                            <ShareList
                                title={t("Active")}
                                items={active}
                                busy={busy}
                                copiedToken={copiedToken}
                                onCopy={(t) => void handleCopy(t)}
                                onRegenerate={(id) => void handleRegenerate(id)}
                                onRevoke={(id) => void handleRevoke(id)}
                            />
                        )}
                        {revoked.length > 0 && (
                            <ShareList
                                title={t("Revoked")}
                                items={revoked}
                                busy={busy}
                                copiedToken={null}
                                onCopy={null}
                                onRegenerate={null}
                                onRevoke={null}
                            />
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

interface ShareListProps {
    readonly title: string;
    readonly items: ReadonlyArray<ShareRow>;
    readonly busy: string | null;
    readonly copiedToken: string | null;
    readonly onCopy: ((token: string) => void) | null;
    readonly onRegenerate: ((id: string) => void) | null;
    readonly onRevoke: ((id: string) => void) | null;
}

function ShareList(props: ShareListProps) {
    return (
        <div class="fg-share__list">
            <h3 class="fg-share__list-title">{props.title}</h3>
            <ul class="fg-share__rows">
                {props.items.map((s) => {
                    const isCopied = props.copiedToken === s.token;
                    const isBusy = props.busy === s.id;
                    return (
                        <li class="fg-share__row" key={s.id}>
                            <div class="fg-share__row-meta">
                                <p class="fg-share__row-label">
                                    {s.label ?? "Untitled link"}
                                </p>
                                <p class="fg-share__row-detail">
                                    Snapshot {formatIso(s.snapshotIso)}
                                    {s.revokedAtIso
                                        ? ` · revoked ${formatIso(s.revokedAtIso)}`
                                        : ""}
                                </p>
                            </div>
                            {props.onCopy && (
                                <div class="fg-share__row-actions">
                                    <button
                                        type="button"
                                        class="fg-share__row-btn fg-share__row-btn--primary"
                                        onClick={() => props.onCopy?.(s.token)}
                                    >
                                        {isCopied ? "Copied" : "Copy link"}
                                    </button>
                                    <button
                                        type="button"
                                        class="fg-share__row-btn"
                                        onClick={() =>
                                            props.onRegenerate?.(s.id)
                                        }
                                        disabled={isBusy}
                                    >
                                        Refresh snapshot
                                    </button>
                                    <button
                                        type="button"
                                        class="fg-share__row-btn fg-share__row-btn--danger"
                                        onClick={() => props.onRevoke?.(s.id)}
                                        disabled={isBusy}
                                    >
                                        Revoke
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function formatIso(iso: string): string {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    } catch {
        return iso;
    }
}
