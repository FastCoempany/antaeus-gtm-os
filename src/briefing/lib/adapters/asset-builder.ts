import type {
    AssetBuilderState,
    AssetBuilderStateBody
} from "../contracts";
import { uninitializedContract } from "./shell-helpers";

/**
 * Asset Builder adapter (B.0c shell).
 *
 * Asset Builder doesn't exist as a room in canon §4 yet — the
 * Briefing's `recommended_moves[].destination` references it
 * (battlecard refresh, executive one-pager) but no operator-facing
 * surface ships those primitives today. The contract is here so
 * the synthesis stage (B.2) can route to it once it lands.
 *
 * B.0c returns uninitialized. The "room doesn't exist yet" case is
 * not an error — it's the canonical uninitialized state.
 */
export function getAssetBuilderState(): AssetBuilderState {
    return uninitializedContract<AssetBuilderStateBody>(
        "Asset Builder adapter shell — B.0c. Room not in canon §4 yet; contract reserved for future use."
    );
}
