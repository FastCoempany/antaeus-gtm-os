import type { ICPStudioState, ICPStudioStateBody } from "../contracts";
import { uninitializedContract } from "./shell-helpers";

/**
 * ICP Studio adapter (B.0c shell).
 *
 * Future data source: ICP Studio writes to `gtmos_icp_analytics` in
 * localStorage today (per Phase 4 / Room 11). Step 5 of the ADR-005
 * retrofit will move that to a cloud `icps` row; this adapter flips
 * its read source then with zero contract-shape change.
 *
 * B.0c returns uninitialized — the contract surface exists and is
 * consumable by B.1+ pipeline code, but no real ICP data crosses
 * the boundary yet. Real translation lands in a follow-up sub-PR.
 */
export function getIcpStudioState(): ICPStudioState {
    return uninitializedContract<ICPStudioStateBody>(
        "ICP Studio adapter shell — B.0c. Real read lands in a follow-up."
    );
}
