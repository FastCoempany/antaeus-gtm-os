import type {
    WatchlistTriggersState,
    WatchlistTriggersStateBody
} from "../contracts";
import { uninitializedContract } from "./shell-helpers";

/**
 * Watchlist Triggers adapter (B.0c shell).
 *
 * The Watchlist Triggers module doesn't exist yet — it's built in
 * B.3 per the build phase plan (NL parser + five matchers + UI).
 * Until then, every adapter call returns uninitialized. B.1's
 * pipeline-orchestrator pseudo-code already references this — the
 * `matches_triggers[]` field on enriched items stays empty until
 * B.3 wires real triggers.
 *
 * The contract is here so B.3's UI work doesn't have to wait on a
 * separate contract PR — it can write the storage layer and the
 * adapter will be ready.
 */
export function getWatchlistTriggersState(): WatchlistTriggersState {
    return uninitializedContract<WatchlistTriggersStateBody>(
        "Watchlist Triggers adapter shell — B.0c. Module lands in B.3."
    );
}
