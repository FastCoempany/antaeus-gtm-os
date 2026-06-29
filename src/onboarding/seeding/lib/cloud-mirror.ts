import { reportError } from "@/lib/observability";
import { createDataClient, type DataClient } from "@/lib/data-client";
import { roomStage, type SeedingDraft } from "../draft";
import type { EnrichedAccount } from "./enrichment";

/**
 * Cloud mirror (ADR-019). At the landing, the seeded ICP, accounts (+
 * their signals), and deals are written to Supabase so the workspace is
 * cross-device from the first morning — not waiting for the operator to
 * open each room and trigger its lazy localStorage→cloud migration.
 *
 * Insert shapes match the rooms' own bridge builders exactly (icps,
 * signal_console_accounts, signals, deals). RLS sets workspace_id via the
 * table DEFAULT, so we never pass it. Fire-and-forget + per-item
 * defensive: a single insert failing never blocks the operator's landing,
 * and the localStorage seed is the immediate path regardless.
 */

function slug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "account";
}

function shortName(statement: string): string {
    const s = statement.trim();
    return s.length <= 64 ? s : `${s.slice(0, 61)}…`;
}

export interface MirrorResult {
    readonly icps: number;
    readonly accounts: number;
    readonly deals: number;
}

export async function mirrorSeedToCloud(
    draft: SeedingDraft,
    enriched: ReadonlyArray<EnrichedAccount>,
    opts: { readonly data?: DataClient } = {}
): Promise<MirrorResult> {
    let icps = 0;
    let accounts = 0;
    let deals = 0;
    let data: DataClient;
    try {
        data = opts.data ?? createDataClient();
    } catch (err) {
        // No Supabase env / session — localStorage is the path. Not an error.
        reportError(err, { op: "seeding.mirror.client" });
        return { icps: 0, accounts: 0, deals: 0 };
    }

    // ICP
    if (draft.icpStatement.trim()) {
        try {
            await data.icps.insert({
                name: shortName(draft.icpStatement),
                worked: false,
                summary: draft.icpStatement.trim(),
                data: { source: "seeding-v1" } as never
            } as never);
            icps = 1;
        } catch (err) {
            reportError(err, { op: "seeding.mirror.icp" });
        }
    }

    // Accounts (+ signals)
    const list = enriched.length > 0
        ? enriched
        : draft.accountNames.map((name) => ({ name, signal: "", heat: 40, cold: false, sourceUrl: "" }) as EnrichedAccount);
    for (const a of list) {
        try {
            const row = (await data.signalConsoleAccounts.insert({
                account_key: slug(a.name),
                account_name: a.name,
                relationship_type: "prospect",
                data: { heat: a.heat, source: "seeding-v1" } as never
            } as never)) as { id?: string };
            accounts += 1;
            if (row?.id && a.signal && !a.cold) {
                try {
                    await data.signals.insert({
                        account_id: row.id,
                        headline: a.signal,
                        is_ai: true,
                        flagged: false,
                        confidence: 0.7,
                        ...(a.sourceUrl ? { url: a.sourceUrl } : {}),
                        data: { source: "seeding-v1" } as never
                    } as never);
                } catch (err) {
                    reportError(err, { op: "seeding.mirror.signal" });
                }
            }
        } catch (err) {
            reportError(err, { op: "seeding.mirror.account" });
        }
    }

    // Deals
    for (const d of draft.deals) {
        try {
            await data.deals.insert({
                account_name: d.account,
                stage: roomStage(d.stage),
                deal_value: d.value,
                data: {
                    champion: d.champion,
                    economicBuyer: d.whoSigns,
                    notes: d.stuck,
                    source: "seeding-v1"
                } as never
            } as never);
            deals += 1;
        } catch (err) {
            reportError(err, { op: "seeding.mirror.deal" });
        }
    }

    return { icps, accounts, deals };
}
