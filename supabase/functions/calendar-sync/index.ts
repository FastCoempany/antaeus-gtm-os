/**
 * Calendar sync — the paste-your-link lane (auto-capture stage 3).
 *
 * The operator pastes their calendar's secret iCal address in Settings
 * (Google / Outlook / Apple all expose one — no OAuth, no Workspace,
 * no admin). This function fetches the feed, keeps ONLY meetings with
 * an attendee at a watched Signal Console account, and upserts them
 * into `captured_meetings`. Personal events are never stored.
 *
 * Two modes:
 *   POST {"action":"sync_one"}  — caller's workspace (user JWT; the
 *     Settings "Connect" button invokes this for instant feedback).
 *   POST {"action":"run_all"}?secret=… — every workspace with a saved
 *     link (service cron; secret compared to CALENDAR_SYNC_SECRET).
 *
 * Founder setup is deploy + cron only (no provider, no DNS):
 *   supabase functions deploy calendar-sync
 *   + the commented cron block in migration 20260710210001.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    matchedMeetingsFromIcs,
    type WatchedAccount
} from "./_shared.ts";

function json(status: number, body: Record<string, unknown>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" }
    });
}

interface SyncResult {
    readonly ok: boolean;
    readonly matched: number;
    readonly written: number;
    readonly error?: string;
}

async function syncWorkspace(
    sb: ReturnType<typeof createClient>,
    workspaceId: string,
    icsUrl: string
): Promise<SyncResult> {
    let icsText = "";
    try {
        const res = await fetch(icsUrl, {
            headers: { accept: "text/calendar, text/plain, */*" }
        });
        if (!res.ok) {
            return { ok: false, matched: 0, written: 0, error: `feed returned ${res.status}` };
        }
        icsText = await res.text();
    } catch {
        return { ok: false, matched: 0, written: 0, error: "couldn't reach the feed" };
    }
    if (!icsText.includes("BEGIN:VCALENDAR")) {
        return { ok: false, matched: 0, written: 0, error: "not a calendar feed" };
    }

    const { data: accountRows } = await sb
        .from("signal_console_accounts")
        .select("account_key, account_name, domain")
        .eq("workspace_id", workspaceId)
        .limit(500);
    const accounts: WatchedAccount[] = (accountRows ?? []).map((r) => ({
        name: String(r.account_name ?? r.account_key ?? ""),
        domain: typeof r.domain === "string" ? r.domain : null
    }));

    const meetings = matchedMeetingsFromIcs(icsText, accounts);
    let written = 0;
    for (const m of meetings) {
        const { error } = await sb.from("captured_meetings").upsert(
            {
                workspace_id: workspaceId,
                account_name: m.accountName,
                title: m.title,
                starts_at: m.startsAt,
                ends_at: m.endsAt,
                attendees: m.attendees,
                source: "ics",
                ics_uid: m.icsUid
            },
            { onConflict: "workspace_id,ics_uid,starts_at", ignoreDuplicates: true }
        );
        if (!error) written++;
    }
    return { ok: true, matched: meetings.length, written };
}

function readIcsUrl(profileData: unknown): string | null {
    const data = (profileData ?? {}) as Record<string, unknown>;
    const url = data["calendar_ics_url"];
    return typeof url === "string" && /^https?:\/\//.test(url) ? url : null;
}

Deno.serve(async (req: Request) => {
    if (req.method !== "POST") return json(405, { error: "POST only" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
        return json(500, { error: "function not configured" });
    }
    const sb = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    });

    let body: { action?: string } = {};
    try {
        body = (await req.json()) as { action?: string };
    } catch {
        body = {};
    }

    if (body.action === "run_all") {
        const secret = Deno.env.get("CALENDAR_SYNC_SECRET") ?? "";
        const given = new URL(req.url).searchParams.get("secret") ?? "";
        if (!secret || given !== secret) return json(401, { error: "bad secret" });

        const { data: profiles } = await sb
            .from("workspace_profile")
            .select("workspace_id, data")
            .not("data->>calendar_ics_url", "is", null)
            .limit(500);
        let synced = 0;
        let written = 0;
        for (const p of profiles ?? []) {
            const url = readIcsUrl(p.data);
            if (!url) continue;
            const r = await syncWorkspace(sb, String(p.workspace_id), url);
            if (r.ok) {
                synced++;
                written += r.written;
            }
        }
        return json(200, { ok: true, workspaces: synced, written });
    }

    // sync_one — the caller's workspace, authenticated by their JWT.
    const auth = req.headers.get("authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt) return json(401, { error: "sign in first" });
    const { data: userData } = await sb.auth.getUser(jwt);
    const userId = userData?.user?.id;
    if (!userId) return json(401, { error: "sign in first" });

    const { data: memberships } = await sb
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)
        .limit(1);
    const workspaceId = memberships?.[0]?.workspace_id as string | undefined;
    if (!workspaceId) return json(200, { ok: false, error: "no workspace yet" });

    const { data: profiles } = await sb
        .from("workspace_profile")
        .select("data")
        .eq("workspace_id", workspaceId)
        .limit(1);
    const icsUrl = readIcsUrl(profiles?.[0]?.data);
    if (!icsUrl) return json(200, { ok: false, error: "no calendar link saved" });

    const r = await syncWorkspace(sb, workspaceId, icsUrl);
    return json(200, r as unknown as Record<string, unknown>);
});
