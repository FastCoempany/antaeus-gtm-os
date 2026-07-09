import { reportError } from "@/lib/observability";

/**
 * Getting to Signed — the fronts model (canon §4.16b). The shipped
 * negotiation engine carries positions + outcomes; this additive layer
 * carries the RUN-TO-SIGNED war room the 2026-07-07 rename added: the
 * four fronts (their ask → your line → status), the committee with
 * engagement reads, the papers-ready strip, the security coverage map,
 * and the plan-to-signed. Persisted per deal at
 * gtmos_getting_to_signed_v1.
 */

export const GTS_KEY = "gtmos_getting_to_signed_v1";

export type FrontId = "legal" | "security" | "finance" | "business";
export const FRONT_IDS: ReadonlyArray<FrontId> = [
    "legal",
    "security",
    "finance",
    "business"
];

export type FrontStatus = "blocking" | "clearing" | "todo" | "at_risk" | "settled";
export const FRONT_STATUSES: ReadonlyArray<FrontStatus> = [
    "blocking",
    "clearing",
    "todo",
    "at_risk",
    "settled"
];

export interface Front {
    readonly theirAsk: string;
    readonly yourLine: string;
    readonly status: FrontStatus;
}

export type MemberKind = "champion" | "signer" | "other";

export interface CommitteeMember {
    readonly id: string;
    readonly name: string;
    readonly role: string;
    readonly kind: MemberKind;
    /** ISO of the last real touch — drives warm / quiet reads. */
    readonly lastTouch: string | null;
}

export interface PapersReady {
    readonly soc2: boolean;
    readonly subprocessors: boolean;
    readonly pentest: boolean;
    readonly dpa: boolean;
}

/** The security coverage map — how many questions your papers answer. */
export interface Coverage {
    readonly total: number;
    readonly covered: number;
    /** Of the open ones, how many have saved answers (vs need engineering). */
    readonly saved: number;
}

export interface SignedState {
    readonly fronts: Readonly<Record<FrontId, Front>>;
    readonly committee: ReadonlyArray<CommitteeMember>;
    readonly papers: PapersReady;
    readonly coverage: Coverage;
    readonly planToSigned: string;
    /** "to signed by …" — the shared target. */
    readonly targetDate: string;
}

const EMPTY_FRONT: Front = { theirAsk: "", yourLine: "", status: "todo" };

export const EMPTY_SIGNED_STATE: SignedState = {
    fronts: {
        legal: EMPTY_FRONT,
        security: EMPTY_FRONT,
        finance: EMPTY_FRONT,
        business: { ...EMPTY_FRONT, status: "at_risk" }
    },
    committee: [],
    papers: { soc2: false, subprocessors: false, pentest: false, dpa: false },
    coverage: { total: 0, covered: 0, saved: 0 },
    planToSigned: "",
    targetDate: ""
};

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function store(s?: StorageLike | null): StorageLike | null {
    if (s) return s;
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

function asStr(v: unknown): string {
    return typeof v === "string" ? v : "";
}
function asNum(v: unknown): number {
    return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

function parseFront(raw: unknown): Front {
    if (!raw || typeof raw !== "object") return EMPTY_FRONT;
    const r = raw as Record<string, unknown>;
    const status = r["status"];
    return {
        theirAsk: asStr(r["theirAsk"]),
        yourLine: asStr(r["yourLine"]),
        status: (FRONT_STATUSES as ReadonlyArray<unknown>).includes(status)
            ? (status as FrontStatus)
            : "todo"
    };
}

function parseState(raw: unknown): SignedState {
    if (!raw || typeof raw !== "object") return EMPTY_SIGNED_STATE;
    const r = raw as Record<string, unknown>;
    const fr = (r["fronts"] ?? {}) as Record<string, unknown>;
    const committee = Array.isArray(r["committee"])
        ? r["committee"]
              .map((m): CommitteeMember | null => {
                  if (!m || typeof m !== "object") return null;
                  const o = m as Record<string, unknown>;
                  const id = asStr(o["id"]);
                  const name = asStr(o["name"]).trim();
                  if (!id || !name) return null;
                  const kind = o["kind"];
                  return {
                      id,
                      name,
                      role: asStr(o["role"]),
                      kind: kind === "champion" || kind === "signer" ? kind : "other",
                      lastTouch:
                          typeof o["lastTouch"] === "string" ? o["lastTouch"] : null
                  };
              })
              .filter((m): m is CommitteeMember => m !== null)
        : [];
    const papers = (r["papers"] ?? {}) as Record<string, unknown>;
    const cov = (r["coverage"] ?? {}) as Record<string, unknown>;
    return {
        fronts: {
            legal: parseFront(fr["legal"]),
            security: parseFront(fr["security"]),
            finance: parseFront(fr["finance"]),
            business: parseFront(fr["business"])
        },
        committee,
        papers: {
            soc2: papers["soc2"] === true,
            subprocessors: papers["subprocessors"] === true,
            pentest: papers["pentest"] === true,
            dpa: papers["dpa"] === true
        },
        coverage: {
            total: asNum(cov["total"]),
            covered: Math.min(asNum(cov["covered"]), asNum(cov["total"])),
            saved: asNum(cov["saved"])
        },
        planToSigned: asStr(r["planToSigned"]),
        targetDate: asStr(r["targetDate"])
    };
}

function dealKey(dealId: string): string {
    return dealId.trim() || "__no_deal__";
}

export function loadSignedState(dealId: string, s?: StorageLike | null): SignedState {
    const st = store(s);
    if (!st) return EMPTY_SIGNED_STATE;
    try {
        const raw = st.getItem(GTS_KEY);
        if (!raw) return EMPTY_SIGNED_STATE;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return EMPTY_SIGNED_STATE;
        return parseState((parsed as Record<string, unknown>)[dealKey(dealId)]);
    } catch (err) {
        reportError(err, { op: "getting-to-signed.loadSignedState" });
        return EMPTY_SIGNED_STATE;
    }
}

export function saveSignedState(
    dealId: string,
    state: SignedState,
    s?: StorageLike | null
): void {
    const st = store(s);
    if (!st) return;
    try {
        const raw = st.getItem(GTS_KEY);
        let root: Record<string, unknown> = {};
        if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                root = parsed as Record<string, unknown>;
            }
        }
        root[dealKey(dealId)] = state;
        st.setItem(GTS_KEY, JSON.stringify(root));
    } catch (err) {
        reportError(err, { op: "getting-to-signed.saveSignedState" });
    }
}

export function memberId(now: number = Date.now()): string {
    return `cm_${now}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Engagement read: warm (< 7d) / quiet Nd / new (never touched). */
export function engagementRead(
    m: CommitteeMember,
    now: number = Date.now()
): { band: "warm" | "quiet" | "new"; days: number } {
    if (!m.lastTouch) return { band: "new", days: 0 };
    const ts = Date.parse(m.lastTouch);
    if (!Number.isFinite(ts)) return { band: "new", days: 0 };
    const days = Math.floor((now - ts) / 86_400_000);
    return days >= 7 ? { band: "quiet", days } : { band: "warm", days };
}

/** The front the face-off leads with: blocking wins; else at_risk; else first open. */
export function pickBlocking(state: SignedState): FrontId | null {
    const open = FRONT_IDS.filter((id) => state.fronts[id].status !== "settled");
    if (open.length === 0) return null;
    return (
        open.find((id) => state.fronts[id].status === "blocking") ??
        open.find((id) => state.fronts[id].status === "at_risk") ??
        open[0]!
    );
}
