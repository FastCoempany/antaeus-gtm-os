import { createDataClient, type DataClient } from "@/lib/data-client";
import { reportError } from "@/lib/observability";

/**
 * The email capture address (auto-capture stage 1, the capture +
 * priors plan). Each workspace gets one token; mail BCC'd to
 * `log+<token>@<capture domain>` is matched to watched accounts and
 * logged as an outbound touch by the inbound-email function.
 *
 * The token lives in workspace_profile.data.capture_token — no schema
 * change; same jsonb blob ADR-007 owns. The mail domain is build
 * config (VITE_CAPTURE_EMAIL_DOMAIN), set once the founder's inbound
 * mail provider + DNS are live (docs/founder-bcc-capture-setup.md).
 */

export interface CaptureAddressState {
    readonly token: string | null;
    readonly hasRow: boolean;
}

export function captureDomain(): string | null {
    const d = (import.meta.env.VITE_CAPTURE_EMAIL_DOMAIN as string | undefined) ?? "";
    return d.trim() ? d.trim() : null;
}

export function captureAddress(token: string, domain: string): string {
    return `log+${token}@${domain}`;
}

function randomToken(): string {
    const bytes = new Uint8Array(12);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Read the workspace's capture token; null when none is minted yet. */
export async function loadCaptureToken(
    opts: { readonly data?: DataClient } = {}
): Promise<CaptureAddressState> {
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.workspaceProfile.list({ limit: 1 });
        if (!Array.isArray(rows) || rows.length === 0) {
            return { token: null, hasRow: false };
        }
        const row = rows[0] as unknown as {
            data?: Record<string, unknown> | null;
        };
        const token = row.data?.["capture_token"];
        return {
            token: typeof token === "string" && token.length >= 8 ? token : null,
            hasRow: true
        };
    } catch (err) {
        reportError(err, { op: "settings.loadCaptureToken" });
        return { token: null, hasRow: false };
    }
}

export interface MintResult {
    readonly token: string | null;
    readonly error: string | null;
}

/**
 * Mint the workspace's capture token (idempotent — an existing token
 * is returned, never rotated, so a printed address keeps working).
 */
export async function mintCaptureToken(
    opts: { readonly data?: DataClient } = {}
): Promise<MintResult> {
    try {
        const data = opts.data ?? createDataClient();
        const rows = await data.workspaceProfile.list({ limit: 1 });
        if (!Array.isArray(rows) || rows.length === 0) {
            return {
                token: null,
                error: "Your workspace profile isn't set up yet. Complete onboarding first."
            };
        }
        const row = rows[0] as unknown as {
            workspace_id: string;
            data?: Record<string, unknown> | null;
        };
        const existing = row.data?.["capture_token"];
        if (typeof existing === "string" && existing.length >= 8) {
            return { token: existing, error: null };
        }
        const token = randomToken();
        await data.workspaceProfile.update(row.workspace_id, {
            data: { ...(row.data ?? {}), capture_token: token }
        });
        return { token, error: null };
    } catch (err) {
        reportError(err, { op: "settings.mintCaptureToken" });
        return {
            token: null,
            error: "Couldn't set up the address just now. Check your connection and try again."
        };
    }
}
