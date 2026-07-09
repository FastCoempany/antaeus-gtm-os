import { reportError } from "@/lib/observability";

/**
 * Pilot Desk extras (canon §4.15 — the guided pilot). The shipped proof
 * engine carries the SPEC (what it has to show / who signs off / when
 * you'll stop / the window); this additive layer carries the PEOPLE
 * OPERATION the 2026-07-06 mind expansion added: the circle, the
 * who's-missing prompts, check-ins with gated steps, the Share kit
 * sends, and the write-up the champion carries. Persisted per account
 * at gtmos_pilot_desk_v1 — never touches gtmos_poc_data.
 */

export const PILOT_KEY = "gtmos_pilot_desk_v1";

export type PersonKind = "hands_on" | "champion" | "signoff";

export interface CirclePerson {
    readonly id: string;
    readonly name: string;
    readonly role: string;
    readonly kind: PersonKind;
    /** Actually using the product (hands-on people only). */
    readonly active: boolean;
}

export interface CheckIn {
    readonly at: string;
    /** Actions taken this check-in (from the product's usage, or by hand). */
    readonly actions: number;
}

export interface PilotExtras {
    /** ISO when the spec was first locked — the window's day counter. */
    readonly startedAt: string | null;
    readonly circle: ReadonlyArray<CirclePerson>;
    readonly checkins: ReadonlyArray<CheckIn>;
    /** Kit item keys already shared. */
    readonly shared: ReadonlyArray<string>;
    /** Who's-missing prompts the operator dismissed or filled. */
    readonly closedGaps: ReadonlyArray<string>;
    /** Steps done in the CURRENT check-in cycle (0-3). */
    readonly stepsDone: number;
    /** Manual position within run → read → write-up (3 | 4 | 5). */
    readonly stage: 3 | 4 | 5;
    readonly writeup: string;
}

export const EMPTY_EXTRAS: PilotExtras = {
    startedAt: null,
    circle: [],
    checkins: [],
    shared: [],
    closedGaps: [],
    stepsDone: 0,
    stage: 3,
    writeup: ""
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

function parseExtras(raw: unknown): PilotExtras {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return EMPTY_EXTRAS;
    const r = raw as Record<string, unknown>;
    const circle = Array.isArray(r["circle"])
        ? r["circle"]
              .map((p): CirclePerson | null => {
                  if (!p || typeof p !== "object") return null;
                  const o = p as Record<string, unknown>;
                  const id = typeof o["id"] === "string" ? o["id"] : "";
                  const name = typeof o["name"] === "string" ? o["name"].trim() : "";
                  if (!id || !name) return null;
                  const kind = o["kind"];
                  return {
                      id,
                      name,
                      role: typeof o["role"] === "string" ? o["role"] : "",
                      kind:
                          kind === "champion" || kind === "signoff"
                              ? kind
                              : "hands_on",
                      active: o["active"] === true
                  };
              })
              .filter((p): p is CirclePerson => p !== null)
        : [];
    const checkins = Array.isArray(r["checkins"])
        ? r["checkins"]
              .map((c): CheckIn | null => {
                  if (!c || typeof c !== "object") return null;
                  const o = c as Record<string, unknown>;
                  const at = typeof o["at"] === "string" ? o["at"] : "";
                  if (!at) return null;
                  return {
                      at,
                      actions:
                          typeof o["actions"] === "number" &&
                          Number.isFinite(o["actions"])
                              ? o["actions"]
                              : 0
                  };
              })
              .filter((c): c is CheckIn => c !== null)
        : [];
    const strArr = (v: unknown): ReadonlyArray<string> =>
        Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    const stage = r["stage"];
    return {
        startedAt: typeof r["startedAt"] === "string" ? r["startedAt"] : null,
        circle,
        checkins,
        shared: strArr(r["shared"]),
        closedGaps: strArr(r["closedGaps"]),
        stepsDone:
            typeof r["stepsDone"] === "number" && Number.isFinite(r["stepsDone"])
                ? Math.max(0, Math.min(3, Math.floor(r["stepsDone"])))
                : 0,
        stage: stage === 4 || stage === 5 ? stage : 3,
        writeup: typeof r["writeup"] === "string" ? r["writeup"] : ""
    };
}

function accountKey(account: string): string {
    return account.trim().toLowerCase();
}

/** True when the extras carry nothing worth persisting yet. */
export function extrasEmpty(e: PilotExtras): boolean {
    return (
        e.circle.length === 0 &&
        e.checkins.length === 0 &&
        e.shared.length === 0 &&
        e.closedGaps.length === 0 &&
        e.stepsDone === 0 &&
        e.stage === 3 &&
        !e.writeup.trim() &&
        !e.startedAt
    );
}

export function loadExtras(account: string, s?: StorageLike | null): PilotExtras {
    const st = store(s);
    const key = accountKey(account);
    if (!st || !key) return EMPTY_EXTRAS;
    try {
        const raw = st.getItem(PILOT_KEY);
        if (!raw) return EMPTY_EXTRAS;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return EMPTY_EXTRAS;
        return parseExtras((parsed as Record<string, unknown>)[key]);
    } catch (err) {
        reportError(err, { op: "pilot-desk.loadExtras" });
        return EMPTY_EXTRAS;
    }
}

export function saveExtras(
    account: string,
    extras: PilotExtras,
    s?: StorageLike | null
): void {
    const st = store(s);
    const key = accountKey(account);
    if (!st || !key) return;
    try {
        const raw = st.getItem(PILOT_KEY);
        let root: Record<string, unknown> = {};
        if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                root = parsed as Record<string, unknown>;
            }
        }
        root[key] = extras;
        st.setItem(PILOT_KEY, JSON.stringify(root));
    } catch (err) {
        reportError(err, { op: "pilot-desk.saveExtras" });
    }
}

export function personId(now: number = Date.now()): string {
    return `pp_${now}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Right-size read — the desk sizes the circle to the deal (canon §4.15). */
export function circleTarget(dealValue: number): { min: number; max: number } {
    if (dealValue >= 100_000) return { min: 5, max: 8 };
    if (dealValue >= 40_000) return { min: 4, max: 6 };
    return { min: 2, max: 4 };
}

/** Adoption read — the pilot's success meter (canon §4.15). */
export interface AdoptionRead {
    readonly enrolled: number;
    readonly using: number;
    readonly actionsLast: number;
    /** "ready" | "almost" | "thin" */
    readonly band: "ready" | "almost" | "thin";
}

export function readAdoption(extras: PilotExtras): AdoptionRead {
    const handsOn = extras.circle.filter((p) => p.kind === "hands_on");
    const using = handsOn.filter((p) => p.active).length;
    const enrolled = handsOn.length;
    const actionsLast = extras.checkins[0]?.actions ?? 0;
    const ratio = enrolled > 0 ? using / enrolled : 0;
    const band: AdoptionRead["band"] =
        enrolled > 0 && ratio >= 2 / 3 && actionsLast > 0
            ? "ready"
            : ratio >= 0.5
              ? "almost"
              : "thin";
    return { enrolled, using, actionsLast, band };
}
