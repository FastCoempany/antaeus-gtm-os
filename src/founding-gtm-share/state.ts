import { signal, type Signal } from "@preact/signals";
import type { ShareSnapshot } from "../founding-gtm/lib/share";

export type ShareStatus =
    | "loading"
    | "ready"
    | "not-found"
    | "missing-token";

export const snapshotSignal: Signal<ShareSnapshot | null> = signal(null);
export const statusSignal: Signal<ShareStatus> = signal("loading");
