import type {
    DiscoveryStudioState,
    DiscoveryStudioStateBody
} from "../contracts";
import { uninitializedContract } from "./shell-helpers";

/**
 * Discovery Studio adapter (B.0c shell).
 *
 * Future data source: Discovery Studio's runtime state currently
 * lives in localStorage (`gtmos_discovery_session_v1` and the
 * framework runtime files under js/). When the room hits ADR-005
 * Step 5 it'll move to cloud rows; this adapter absorbs that flip
 * without changing its return shape.
 *
 * B.0c returns uninitialized.
 */
export function getDiscoveryStudioState(): DiscoveryStudioState {
    return uninitializedContract<DiscoveryStudioStateBody>(
        "Discovery Studio adapter shell — B.0c. Real read lands in a follow-up."
    );
}
