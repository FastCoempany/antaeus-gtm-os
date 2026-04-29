import { trackEvent } from "./observability";

/**
 * Cloud sync user feedback (Priority B2).
 *
 * Each room's `bootCloudPersistence` resolves with a tagged BootResult:
 *
 *   - "cloud":       cloud has rows; local was replaced. (no toast — silent)
 *   - "migrated":    cloud was empty; local was pushed up. (first-sync toast)
 *   - "empty":       both empty. (silent)
 *   - "local-only":  cloud unreachable / no credentials. (warning toast)
 *
 * Operators care about two cases:
 *   1. First-time cross-device sync ("data is now in the cloud — second
 *      device will see it on next visit") — fires on mode='migrated' so the
 *      operator knows the sync happened.
 *   2. Cloud unreachable ("you're working offline; data will save locally
 *      until cloud reconnects") — fires on mode='local-only' so the operator
 *      knows their work isn't backed up cross-device this session.
 *
 * The "migrated" toast is gated by a localStorage flag so it only fires
 * ONCE per room — subsequent boots don't nag.
 */

const TOAST_CONTAINER_ID = "antaeus-cloud-sync-toasts";
const FIRST_SYNC_FLAG_PREFIX = "gtmos_cloud_first_sync__";
const TOAST_TIMEOUT_MS = 5500;

interface ToastOptions {
    readonly tone: "good" | "warn" | "info";
    readonly message: string;
    readonly testid?: string;
}

interface MinimalDocument {
    getElementById(id: string): HTMLElement | null;
    createElement<K extends keyof HTMLElementTagNameMap>(
        tag: K
    ): HTMLElementTagNameMap[K];
    body: HTMLElement;
}

interface MinimalStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

interface MinimalWindow {
    setTimeout(handler: () => void, ms: number): unknown;
}

export interface NotifyContext {
    readonly doc?: MinimalDocument | null;
    readonly storage?: MinimalStorage | null;
    readonly win?: MinimalWindow | null;
}

function getDoc(ctx?: NotifyContext): MinimalDocument | null {
    if (ctx?.doc !== undefined) return ctx.doc;
    if (typeof document === "undefined") return null;
    return document as unknown as MinimalDocument;
}

function getStorage(ctx?: NotifyContext): MinimalStorage | null {
    if (ctx?.storage !== undefined) return ctx.storage;
    if (typeof localStorage === "undefined") return null;
    return localStorage as MinimalStorage;
}

function getWin(ctx?: NotifyContext): MinimalWindow | null {
    if (ctx?.win !== undefined) return ctx.win;
    if (typeof window === "undefined") return null;
    return window as unknown as MinimalWindow;
}

/**
 * Ensure the toast container element exists in the DOM and is styled
 * correctly. Idempotent — repeat calls reuse the same node.
 */
function ensureContainer(doc: MinimalDocument): HTMLElement {
    const existing = doc.getElementById(TOAST_CONTAINER_ID);
    if (existing) return existing;
    const el = doc.createElement("div");
    el.id = TOAST_CONTAINER_ID;
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.style.cssText = [
        "position: fixed",
        "top: 16px",
        "right: 16px",
        "z-index: 9999",
        "display: flex",
        "flex-direction: column",
        "gap: 8px",
        "max-width: 360px",
        "pointer-events: none",
        "font-family: 'Public Sans', 'Plus Jakarta Sans', sans-serif"
    ].join(";");
    doc.body.appendChild(el);
    return el;
}

const TONE_STYLES: Record<ToastOptions["tone"], string> = {
    good: "background: #f4faf6; border-left: 3px solid #22c55e; color: #0a1c40;",
    warn: "background: #fff7ed; border-left: 3px solid #f59e0b; color: #0a1c40;",
    info: "background: #f0f7ff; border-left: 3px solid #2563eb; color: #0a1c40;"
};

export function flashCloudSyncToast(
    options: ToastOptions,
    ctx?: NotifyContext
): void {
    const doc = getDoc(ctx);
    const win = getWin(ctx);
    if (!doc || !win) return;
    const container = ensureContainer(doc);
    const toast = doc.createElement("div");
    if (options.testid) {
        toast.setAttribute("data-testid", options.testid);
    }
    toast.style.cssText = [
        TONE_STYLES[options.tone],
        "padding: 10px 14px",
        "border-radius: 6px",
        "box-shadow: 0 4px 12px rgba(10, 28, 64, 0.10)",
        "font-size: 13px",
        "line-height: 1.4",
        "pointer-events: auto",
        "opacity: 0",
        "transform: translateX(8px)",
        "transition: opacity 0.18s ease, transform 0.18s ease"
    ].join(";");
    toast.textContent = options.message;
    container.appendChild(toast);
    // Force reflow so the transition runs.
    void toast.offsetHeight;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";

    win.setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(8px)";
        win.setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 220);
    }, TOAST_TIMEOUT_MS);
}

export interface BootResultLike {
    readonly mode: "cloud" | "migrated" | "local-only" | "empty";
}

export interface NotifyOptions {
    readonly room: string;
    /** Optional row count for "Pushed N rows" copy. */
    readonly rowCount?: number;
}

function alreadyToastedMigration(
    room: string,
    storage: MinimalStorage | null
): boolean {
    if (!storage) return false;
    return storage.getItem(FIRST_SYNC_FLAG_PREFIX + room) !== null;
}

function markMigrationToasted(
    room: string,
    storage: MinimalStorage | null
): void {
    if (!storage) return;
    storage.setItem(FIRST_SYNC_FLAG_PREFIX + room, new Date().toISOString());
}

/**
 * Surface user feedback for a BootResult. Called from each room's
 * main.tsx after bootCloudPersistence resolves.
 *
 * Returns the toast that fired (for tests) or null if no toast.
 */
export function notifyBootResult(
    options: NotifyOptions,
    result: BootResultLike,
    ctx?: NotifyContext
): "migrated" | "local-only" | null {
    const storage = getStorage(ctx);
    if (result.mode === "migrated") {
        if (alreadyToastedMigration(options.room, storage)) {
            // Telemetry still fires through the per-room boot trackEvent.
            return null;
        }
        const count = options.rowCount;
        const message = count !== undefined
            ? `${options.room}: pushed ${count} row${count === 1 ? "" : "s"} to cloud. Cross-device sync is live.`
            : `${options.room}: cross-device sync is live.`;
        flashCloudSyncToast(
            {
                tone: "good",
                message,
                testid: `cloud-sync-toast-migrated-${options.room}`
            },
            ctx
        );
        markMigrationToasted(options.room, storage);
        trackEvent("cloud_sync_first_sync_toast", { room: options.room });
        return "migrated";
    }
    if (result.mode === "local-only") {
        flashCloudSyncToast(
            {
                tone: "warn",
                message: `${options.room}: working offline. Data is saving locally; cloud sync will retry next session.`,
                testid: `cloud-sync-toast-local-only-${options.room}`
            },
            ctx
        );
        trackEvent("cloud_sync_local_only_toast", { room: options.room });
        return "local-only";
    }
    return null;
}

/**
 * Test-only — clear the localStorage flag so a room can re-test the
 * migration toast.
 */
export function __clearMigrationFlagForTests(
    room: string,
    storage?: MinimalStorage | null
): void {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
    if (!s) return;
    // Storage.removeItem isn't on the minimal interface; use setItem-and-let-tests-handle
    // — production callers don't need this path.
    if ("removeItem" in s && typeof (s as { removeItem?: unknown }).removeItem === "function") {
        (s as { removeItem(key: string): void }).removeItem(
            FIRST_SYNC_FLAG_PREFIX + room
        );
    }
}
