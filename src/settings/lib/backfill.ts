import { createDataClient } from "@/lib/data-client";
import { reportError, trackEvent } from "@/lib/observability";
import type { Deal, LossReason } from "@/deal-workspace/lib/deal-shape";
import { dealToDbWrite } from "@/deal-workspace/lib/deal-bridge";

/**
 * The backfill lane — bring your deal history (the capture + priors
 * plan, step 3). A founder with months of closed deals in a
 * spreadsheet pastes them once, and the surfaces that need outcomes —
 * the handoff book's win/loss reads, Future Autopsy's patterns, the
 * plan's believability — start from their real history instead of a
 * quarter of waiting.
 *
 * The parser is deliberately forgiving: header names are matched
 * loosely (account/company/name; value/amount/size; outcome/stage/
 * result; date/closed; reason/why), money survives "$80,000", and
 * rows that can't be read are reported by line — never silently
 * dropped.
 */

export interface BackfillDeal {
    readonly accountName: string;
    readonly value: number;
    readonly won: boolean;
    readonly closeDate: string | null;
    readonly lossReason: LossReason | null;
    readonly lossNotes: string | null;
}

export interface BackfillParse {
    readonly deals: ReadonlyArray<BackfillDeal>;
    readonly skipped: ReadonlyArray<{ line: number; reason: string }>;
}

const HEADER_MATCHERS: ReadonlyArray<[RegExp, keyof RawColumns]> = [
    [/account|company|^name$|customer/i, "account"],
    [/value|amount|size|acv|price|\$/i, "value"],
    [/outcome|stage|result|status|won/i, "outcome"],
    [/date|closed?(?!.*reason)/i, "date"],
    [/reason|why|lost.*because/i, "reason"]
];

interface RawColumns {
    account?: number;
    value?: number;
    outcome?: number;
    date?: number;
    reason?: number;
}

/**
 * Split one row. Spreadsheet copies (Excel / Google Sheets) are
 * tab-delimited — a tab in the line wins, and TSV needs no quote
 * handling. Otherwise CSV with double-quoted cells.
 */
export function splitCsvLine(line: string): string[] {
    if (line.includes("\t")) {
        return line.split("\t").map((c) => c.trim());
    }
    return splitCommaLine(line);
}

function splitCommaLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === "," && !inQuotes) {
            out.push(cur.trim());
            cur = "";
        } else {
            cur += ch;
        }
    }
    out.push(cur.trim());
    return out;
}

function parseMoney(raw: string): number {
    const cleaned = raw.replace(/[$,\s]/g, "");
    // Number("") is 0 — a blank value cell must read as unreadable,
    // never as a $0 deal.
    if (!cleaned) return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : NaN;
}

function parseOutcome(raw: string): boolean | null {
    const v = raw.toLowerCase();
    if (/won|win|closed[-_ ]?won|yes|signed/.test(v)) return true;
    if (/lost|loss|closed[-_ ]?lost|no[-_ ]?decision|churn/.test(v)) return false;
    return null;
}

function parseDate(raw: string): string | null {
    if (!raw.trim()) return null;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) return null;
    return new Date(t).toISOString().slice(0, 10);
}

function mapLossReason(raw: string): LossReason | null {
    const v = raw.toLowerCase();
    if (/competit|rival|other vendor/.test(v)) return "competitor";
    if (/no[-_ ]?decision|status quo|went quiet|silence|stall/.test(v)) return "no_decision";
    if (/budget|price|cost|funding|freeze/.test(v)) return "budget";
    if (/champion|contact left|sponsor/.test(v)) return "champion_left";
    if (/timing|later|next (quarter|year)|not now/.test(v)) return "timing";
    return null;
}

export function parseBackfillCsv(text: string): BackfillParse {
    const lines = text
        .split(/\r?\n/)
        .map((l, i) => ({ raw: l, n: i + 1 }))
        .filter((l) => l.raw.trim().length > 0);
    if (lines.length === 0) return { deals: [], skipped: [] };

    // Header detection: the first line maps to columns when at least
    // account + outcome are recognizable; otherwise assume the fixed
    // order account,value,outcome,date,reason with no header.
    const headerCells = splitCsvLine(lines[0]!.raw);
    const cols: RawColumns = {};
    for (let i = 0; i < headerCells.length; i++) {
        for (const [rx, key] of HEADER_MATCHERS) {
            if (cols[key] === undefined && rx.test(headerCells[i]!)) {
                cols[key] = i;
                break;
            }
        }
    }
    const hasHeader = cols.account !== undefined && cols.outcome !== undefined;
    const body = hasHeader ? lines.slice(1) : lines;
    const at: Required<RawColumns> = {
        account: cols.account ?? 0,
        value: cols.value ?? 1,
        outcome: cols.outcome ?? 2,
        date: cols.date ?? 3,
        reason: cols.reason ?? 4
    };

    const deals: BackfillDeal[] = [];
    const skipped: Array<{ line: number; reason: string }> = [];
    for (const { raw, n } of body) {
        const cells = splitCsvLine(raw);
        const account = (cells[at.account] ?? "").trim();
        if (!account) {
            skipped.push({ line: n, reason: "no account name" });
            continue;
        }
        const won = parseOutcome(cells[at.outcome] ?? "");
        if (won === null) {
            skipped.push({ line: n, reason: "couldn't read won/lost" });
            continue;
        }
        const value = parseMoney(cells[at.value] ?? "");
        if (!Number.isFinite(value)) {
            skipped.push({ line: n, reason: "couldn't read the deal value" });
            continue;
        }
        const reasonRaw = (cells[at.reason] ?? "").trim();
        deals.push({
            accountName: account,
            value,
            won,
            closeDate: parseDate(cells[at.date] ?? ""),
            lossReason: won ? null : mapLossReason(reasonRaw),
            lossNotes: !won && reasonRaw ? reasonRaw : null
        });
    }
    return { deals, skipped };
}

function toDeal(b: BackfillDeal, id: string): Deal {
    // The pace/believability reads sum closed-won by the row's
    // created_at/updated_at — stamp both with the close date so a
    // backfilled win lands in the right month and year.
    const stamp = b.closeDate
        ? new Date(`${b.closeDate}T12:00:00`).toISOString()
        : new Date().toISOString();
    return {
        id,
        accountName: b.accountName,
        value: b.value,
        stage: b.won ? "closed-won" : "closed-lost",
        closeDate: b.closeDate ?? undefined,
        lossReason: b.lossReason ?? undefined,
        lossNotes: b.lossNotes ?? undefined,
        notes: "Brought in from your deal history.",
        created_at: stamp,
        updated_at: stamp
    };
}

export interface BackfillCommit {
    readonly written: number;
    readonly cloudWritten: number;
    readonly duplicates: number;
}

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

/**
 * Write the parsed history: cloud rows through the deals accessor
 * (best-effort per row — one failure never aborts the batch) and the
 * `gtmos_deal_workspaces` mirror every sibling room reads. Duplicates
 * (same account + same close date already present) are skipped so a
 * re-paste is safe.
 */
export async function commitBackfill(
    deals: ReadonlyArray<BackfillDeal>,
    storage?: StorageLike | null
): Promise<BackfillCommit> {
    const store: StorageLike | null =
        storage !== undefined
            ? storage
            : typeof localStorage !== "undefined"
              ? localStorage
              : null;

    let existing: Array<Record<string, unknown>> = [];
    try {
        const raw = store?.getItem("gtmos_deal_workspaces");
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        if (Array.isArray(parsed)) existing = parsed as Array<Record<string, unknown>>;
    } catch {
        existing = [];
    }
    const seen = new Set(
        existing.map((d) =>
            `${String(d["accountName"] ?? d["account_name"] ?? d["name"] ?? "").toLowerCase()}|${String(d["closeDate"] ?? d["close_date"] ?? "")}`
        )
    );

    let client: ReturnType<typeof createDataClient> | null = null;
    try {
        client = createDataClient();
    } catch {
        client = null; // offline / no env — the mirror still gets the rows
    }

    // The device mirror can be empty on a fresh browser while the cloud
    // already holds a previous import — seed the dedupe set from the
    // cloud rows too, so a re-paste never doubles the history.
    if (client) {
        try {
            const cloudRows = (await client.deals.list({ limit: 1000 })) as ReadonlyArray<
                Record<string, unknown>
            >;
            for (const d of cloudRows) {
                seen.add(
                    `${String(d["account_name"] ?? d["accountName"] ?? "").toLowerCase()}|${String(d["close_date"] ?? d["closeDate"] ?? "")}`
                );
                // Phase-2.3 passthrough rows carry the real deals inside
                // data.migrated_from_localstorage.gtmos_deal_workspaces —
                // expand them so a legacy-migrated workspace dedupes too.
                const data = d["data"] as Record<string, unknown> | null | undefined;
                const blob = (data?.["migrated_from_localstorage"] as Record<string, unknown> | undefined)?.[
                    "gtmos_deal_workspaces"
                ];
                if (Array.isArray(blob)) {
                    for (const m of blob as Array<Record<string, unknown>>) {
                        seen.add(
                            `${String(m["accountName"] ?? m["account_name"] ?? m["name"] ?? "").toLowerCase()}|${String(m["closeDate"] ?? m["close_date"] ?? "")}`
                        );
                    }
                }
            }
        } catch (err) {
            reportError(err, { op: "settings.backfill.cloudDedupe" });
        }
    }

    let written = 0;
    let cloudWritten = 0;
    let duplicates = 0;
    const appended: Deal[] = [];
    for (const b of deals) {
        const key = `${b.accountName.toLowerCase()}|${b.closeDate ?? ""}`;
        if (seen.has(key)) {
            duplicates++;
            continue;
        }
        seen.add(key);
        let id = `backfill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const deal = toDeal(b, id);
        if (client) {
            try {
                // Carry the close-date stamp to the cloud row too —
                // Deal Workspace republishes the mirror from cloud, and
                // the pace reads sum closed-won by these stamps.
                const row = await client.deals.insert({
                    ...dealToDbWrite(deal),
                    created_at: deal.created_at,
                    updated_at: deal.updated_at
                });
                const rowId = (row as { id?: unknown } | null)?.id;
                if (typeof rowId === "string" && rowId) id = rowId;
                cloudWritten++;
            } catch (err) {
                reportError(err, { op: "settings.backfill.cloudInsert" });
            }
        }
        appended.push({ ...deal, id });
        written++;
    }

    if (appended.length > 0) {
        try {
            store?.setItem(
                "gtmos_deal_workspaces",
                JSON.stringify([...existing, ...appended])
            );
        } catch (err) {
            reportError(err, { op: "settings.backfill.mirror" });
        }
        trackEvent("settings_backfill_committed", {
            deals: written,
            cloud: cloudWritten
        });
    }
    return { written, cloudWritten, duplicates };
}
