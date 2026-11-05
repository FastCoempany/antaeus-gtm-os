/**
 * The canonical list of every workspace table that "Download my
 * workspace" and "Delete everything" cover.
 *
 * One registry, three consumers:
 *   - exportCloudWorkspace() reads every `memberRead` table and files
 *     its rows under the table's plain-English section.
 *   - deleteCloudWorkspace() asks the server (`delete_workspace_data`
 *     RPC) to remove every `deleteScope: "workspace"` table; the
 *     per-table fallback only handles the tables members can delete
 *     under RLS directly (`memberDelete`).
 *   - restoreCloudExport() puts back the tables a member can write
 *     (`restore` != "none"), in registry order so parent rows land
 *     before the rows that point at them.
 *
 * ORDER MATTERS: parents before children (restore order). Delete runs
 * in reverse.
 *
 * `workspace-tables.test.ts` fails if a table with a `workspace_id`
 * column shows up in `database.types.ts` or in a migration without an
 * entry here (or an explicit, reasoned exclusion), and if the delete
 * RPC's table list drifts from this registry.
 *
 * The RLS facts below were read from supabase/migrations/*.sql
 * (2026-11-05). If a policy changes, update the flag here.
 */

export type RestoreMode =
    /** Member can insert + update: upsert on the primary key. */
    | "upsert"
    /** Member can insert but not update: insert, skip rows already there. */
    | "insert"
    /** Written by the system (service role) only; it rebuilds itself. */
    | "none";

export interface WorkspaceTable {
    /** Postgres table name in the public schema. */
    readonly table: string;
    /** Plain-English group the download files this table under. */
    readonly section: string;
    /** Plain-English name for this table's rows inside the section. */
    readonly label: string;
    /** Column the export filters on to stay inside one workspace. */
    readonly scopeColumn: "workspace_id" | "user_id";
    /** Stable sort column for paging through every row. */
    readonly orderBy: string;
    /** Members can SELECT this table under RLS. */
    readonly memberRead: boolean;
    /** Members can DELETE this table under RLS (fallback path). */
    readonly memberDelete: boolean;
    /** "workspace" = removed by Delete everything; "kept" = not removed. */
    readonly deleteScope: "workspace" | "kept";
    /** How a JSON download puts this table back. */
    readonly restore: RestoreMode;
}

function entry(
    table: string,
    section: string,
    label: string,
    rls: {
        readonly memberDelete: boolean;
        readonly restore: RestoreMode;
        readonly orderBy?: string;
        readonly scopeColumn?: "workspace_id" | "user_id";
        readonly deleteScope?: "workspace" | "kept";
    }
): WorkspaceTable {
    return {
        table,
        section,
        label,
        scopeColumn: rls.scopeColumn ?? "workspace_id",
        orderBy: rls.orderBy ?? "id",
        memberRead: true,
        memberDelete: rls.memberDelete,
        deleteScope: rls.deleteScope ?? "workspace",
        restore: rls.restore
    };
}

const FULL = { memberDelete: true, restore: "upsert" } as const;
const SYSTEM = { memberDelete: false, restore: "none" } as const;

export const SECTION = {
    business: "Your company and who you sell to",
    accounts: "Accounts and signals",
    prospecting: "Prospecting",
    outreach: "Outreach and meetings",
    deals: "Deals",
    discovery: "Discovery calls",
    pilots: "Pilots",
    favors: "Favors from your network",
    readiness: "Readiness and the handoff",
    events: "Events",
    briefing: "Briefing",
    observations: "Things the system noticed",
    automation: "Suggestions and scheduled skills",
    content: "Saved studio content",
    session: "Where you left off",
    account: "Your account profile"
} as const;

export const WORKSPACE_TABLES: ReadonlyArray<WorkspaceTable> = [
    // ── Your company + targeting ──────────────────────────────────
    entry("workspace_profile", SECTION.business, "Company profile and app preferences", {
        ...FULL,
        orderBy: "workspace_id"
    }),
    entry("icps", SECTION.business, "Ideal customer profiles", FULL),
    entry("pipeline_settings", SECTION.business, "Pipeline settings", FULL),

    // ── Accounts + signals (parent before child) ──────────────────
    entry("signal_console_accounts", SECTION.accounts, "Watched accounts", FULL),
    entry("signals", SECTION.accounts, "Signals on watched accounts", FULL),

    // ── Prospecting ───────────────────────────────────────────────
    entry("prospecting_research_runs", SECTION.prospecting, "Account searches Antaeus ran", SYSTEM),

    // ── Outreach ──────────────────────────────────────────────────
    entry("sequences", SECTION.outreach, "Messages and outreach you logged", FULL),
    entry("captured_meetings", SECTION.outreach, "Meetings found on your calendar", SYSTEM),

    // ── Deals ─────────────────────────────────────────────────────
    entry("deals", SECTION.deals, "Deals", FULL),

    // ── Discovery ─────────────────────────────────────────────────
    entry("discovery_frameworks", SECTION.discovery, "Discovery frameworks", FULL),
    entry("discovery_call_logs", SECTION.discovery, "Discovery call notes", FULL),

    // ── Pilots + favors (both point at deals) ─────────────────────
    entry("proofs", SECTION.pilots, "Pilots", FULL),
    entry("advisor_deployments", SECTION.favors, "Favors you asked for", FULL),

    // ── Readiness + handoff ───────────────────────────────────────
    // readiness_snapshots is append-only for members (insert + select).
    entry("readiness_snapshots", SECTION.readiness, "Readiness history", {
        memberDelete: false,
        restore: "insert"
    }),
    entry("handoff_artifacts", SECTION.readiness, "Handoff documents", FULL),
    entry("founding_gtm_shares", SECTION.readiness, "Read-only share links", FULL),

    // ── Events (runs before events: events.run_id → runs.id) ──────
    entry("outdoors_events_runs", SECTION.events, "Event searches Antaeus ran", SYSTEM),
    entry("outdoors_events", SECTION.events, "Events", FULL),

    // ── Briefing (runs → items → clusters → patterns → children) ──
    entry("briefing_runs", SECTION.briefing, "Briefing runs", FULL),
    entry("briefing_raw_items", SECTION.briefing, "News items collected", FULL),
    entry("briefing_enriched_items", SECTION.briefing, "News items read and tagged", FULL),
    entry("briefing_clusters", SECTION.briefing, "Groups of related news", FULL),
    entry("briefing_patterns", SECTION.briefing, "Briefing reads", FULL),
    // Audit envelopes are immutable for members: insert + update, no delete.
    entry("briefing_audit_envelopes", SECTION.briefing, "How each briefing read was written", {
        memberDelete: false,
        restore: "upsert"
    }),
    entry("briefing_pattern_eval", SECTION.briefing, "Quality checks on briefing reads", SYSTEM),
    // Feedback: members delete only their own marks.
    entry("briefing_pattern_feedback", SECTION.briefing, "Your marks on briefing reads", {
        memberDelete: false,
        restore: "upsert"
    }),
    entry("briefing_periphery_candidates", SECTION.briefing, "Companies the briefing suggested you watch", FULL),
    entry("briefing_watchlist_entities", SECTION.briefing, "Companies on your briefing watchlist", FULL),
    entry("briefing_watchlist_triggers", SECTION.briefing, "Briefing alerts you set", FULL),
    entry("briefing_trigger_fires", SECTION.briefing, "Briefing alerts that went off", FULL),
    entry("briefing_html_snapshots", SECTION.briefing, "Saved copies of past briefings", FULL),

    // ── Observations (written by the system; members only dismiss) ─
    entry("observations", SECTION.observations, "Observations about your work", SYSTEM),

    // ── Suggestions + scheduled skills ────────────────────────────
    entry("proposed_modifications", SECTION.automation, "Suggestions the system made", SYSTEM),
    entry("workspace_skill_overrides", SECTION.automation, "Suggestions you accepted for skills", FULL),
    entry("active_observation_variants", SECTION.automation, "Suggestions you accepted for observations", FULL),
    entry("scheduled_skills", SECTION.automation, "Scheduled skills", FULL),
    entry("scheduled_skill_fires", SECTION.automation, "Times a scheduled skill ran", SYSTEM),

    // ── Saved content + session ───────────────────────────────────
    entry("studio_artifacts", SECTION.content, "Saved studio content", FULL),
    entry("workspace_sessions", SECTION.session, "Where you left off", FULL),

    // ── Account profile (downloaded, never deleted) ───────────────
    // Profiles are per person, not per workspace: the export reads
    // only your own row, and Delete everything keeps it so you can
    // keep signing in.
    entry("profiles", SECTION.account, "Your profile", {
        memberDelete: false,
        restore: "none",
        scopeColumn: "user_id",
        deleteScope: "kept"
    })
];

/**
 * Tables with a workspace_id (or that otherwise look like workspace
 * data) that the download/delete deliberately leave alone. Each needs
 * a reason.
 */
export const EXCLUDED_TABLES: Readonly<Record<string, string>> = {
    // The workspace row itself. Its name + id go in the download's
    // header; deleting it would end the workspace, not empty it.
    workspaces: "the workspace itself — named in the download header, kept by delete",
    // Who is on the workspace. Deleting membership would lock the
    // operator out (RLS keys every read on it).
    workspace_members: "membership — kept so you can keep signing in",
    // Pre-launch waitlist; not tied to any workspace.
    waitlist_signups: "not workspace data (no workspace_id)"
};

/** Tables Delete everything removes, in delete order (children first). */
export function tablesToDelete(): ReadonlyArray<WorkspaceTable> {
    return WORKSPACE_TABLES.filter((t) => t.deleteScope === "workspace")
        .slice()
        .reverse();
}

/** Tables a JSON download puts back, in restore order (parents first). */
export function tablesToRestore(): ReadonlyArray<WorkspaceTable> {
    return WORKSPACE_TABLES.filter((t) => t.restore !== "none");
}

/** Section names in the order the download presents them. */
export function sectionOrder(): ReadonlyArray<string> {
    const seen: string[] = [];
    for (const t of WORKSPACE_TABLES) {
        if (!seen.includes(t.section)) seen.push(t.section);
    }
    return seen;
}

export function findTable(name: string): WorkspaceTable | undefined {
    return WORKSPACE_TABLES.find((t) => t.table === name);
}
