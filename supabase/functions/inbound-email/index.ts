/**
 * Inbound email capture — the BCC address (auto-capture stage 1).
 *
 * The operator BCCs outreach to `log+<token>@<capture domain>`; the
 * mail provider (Postmark inbound webhook shape) POSTs it here. We
 * resolve the workspace by token, match the real recipient to a
 * watched Signal Console account, and insert an outbound touch into
 * the `sequences` table — the same rows Outbound Studio reads, so the
 * room, the pace read, and the temperature ladder light up with no
 * new reader.
 *
 * Privacy: the touch stores the subject line, recipient address, and
 * timestamp. Message bodies are never stored.
 *
 * Auth: the provider must send the shared secret in the
 * `x-inbound-secret` header (or `?secret=`), compared against the
 * INBOUND_EMAIL_SECRET function secret. 401 without it.
 *
 * Responses are 200 even for "no capture token" / "unknown token" so
 * providers don't retry forever on mail we'll never want; genuinely
 * malformed payloads get 400.
 *
 * Founder setup (deploy + provider + DNS):
 *   docs/founder-bcc-capture-setup.md
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    parseInbound,
    matchAccount,
    buildTouchBlob,
    type InboundPayload,
    type WatchedAccount
} from "./_shared.ts";

const CAPTURE_LOCAL_PART = "log";

function json(status: number, body: Record<string, unknown>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" }
    });
}

Deno.serve(async (req: Request) => {
    if (req.method !== "POST") return json(405, { error: "POST only" });

    const secret = Deno.env.get("INBOUND_EMAIL_SECRET") ?? "";
    const given =
        req.headers.get("x-inbound-secret") ??
        new URL(req.url).searchParams.get("secret") ??
        "";
    if (!secret || given !== secret) {
        return json(401, { error: "bad secret" });
    }

    let payload: InboundPayload;
    try {
        payload = (await req.json()) as InboundPayload;
    } catch {
        return json(400, { error: "not json" });
    }

    const mail = parseInbound(payload, CAPTURE_LOCAL_PART);
    if (!mail.captureToken) {
        return json(200, { ok: true, skipped: "no capture address" });
    }
    if (mail.recipients.length === 0) {
        return json(200, { ok: true, skipped: "no real recipient" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
        return json(500, { error: "function not configured" });
    }
    const sb = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    });

    // Token → workspace.
    const { data: profiles, error: profErr } = await sb
        .from("workspace_profile")
        .select("workspace_id, data")
        .eq("data->>capture_token", mail.captureToken)
        .limit(1);
    if (profErr) return json(500, { error: "workspace lookup failed" });
    const workspaceId = profiles?.[0]?.workspace_id as string | undefined;
    if (!workspaceId) {
        return json(200, { ok: true, skipped: "unknown capture token" });
    }

    // Watched accounts for the match.
    const { data: accountRows } = await sb
        .from("signal_console_accounts")
        .select("name, data")
        .eq("workspace_id", workspaceId)
        .limit(500);
    const accounts: WatchedAccount[] = (accountRows ?? []).map((r) => {
        const blob = (r.data ?? {}) as Record<string, unknown>;
        return {
            name: String(r.name ?? ""),
            domain: typeof blob["domain"] === "string" ? (blob["domain"] as string) : null
        };
    });

    const matched = matchAccount(mail.recipients, accounts);
    const recipient = mail.recipients[0]!;
    // Unmatched mail still counts as motion — the touch lands under the
    // recipient's domain so the tally is honest; the operator can tie
    // it to an account later by watching that company.
    const accountName = matched ?? (recipient.split("@")[1] ?? recipient);

    const blob = buildTouchBlob({
        accountName,
        recipient,
        subject: mail.subject,
        sentAt: mail.sentAt
    });
    const { error: insErr } = await sb.from("sequences").insert({
        workspace_id: workspaceId,
        sequence_key: "outbound",
        name: accountName,
        title: mail.subject || "(captured send)",
        data: blob
    });
    if (insErr) return json(500, { error: "touch insert failed" });

    return json(200, {
        ok: true,
        captured: true,
        account: accountName,
        matched: matched !== null
    });
});
