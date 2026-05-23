import type {
    CallPlannerState,
    CallPlannerStateBody
} from "../contracts";
import { uninitializedContract } from "./shell-helpers";

/**
 * Call Planner adapter (B.0c shell).
 *
 * Future data source: Call Planner persists to `gtmos_discovery_agenda`
 * (and adjacent keys for the objection bank when that lands). The
 * objection bank isn't formally a Call Planner primitive yet —
 * canon §4.11 names the four-strip spine but objection handling
 * lives in Discovery Studio's framework files today. The contract
 * leaves room for the objection bank to live in either place once
 * the consolidation decision is made.
 *
 * B.0c returns uninitialized.
 */
export function getCallPlannerState(): CallPlannerState {
    return uninitializedContract<CallPlannerStateBody>(
        "Call Planner adapter shell — B.0c. Real read lands in a follow-up."
    );
}
