import type {
    OutboundStudioState,
    OutboundStudioStateBody
} from "../contracts";
import { uninitializedContract } from "./shell-helpers";

/**
 * Outbound Studio adapter (B.0c shell).
 *
 * Future data source: Outbound Studio writes `gtmos_outbound_touches`
 * (touch log) and `gtmos_angles` (saved hooks). The contract's
 * `hooks[]` surface maps to saved angles; `signal_triggers[]` and
 * `active_sequences[]` aren't first-class concepts in the current
 * room — they show up as soft surfaces (sequence templates baked
 * into the route method sheet). The adapter normalizes whatever
 * representation lands cloud-side into the contract shape.
 *
 * B.0c returns uninitialized.
 */
export function getOutboundStudioState(): OutboundStudioState {
    return uninitializedContract<OutboundStudioStateBody>(
        "Outbound Studio adapter shell — B.0c. Real read lands in a follow-up."
    );
}
