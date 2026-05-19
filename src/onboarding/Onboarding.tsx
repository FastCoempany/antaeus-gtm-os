import type { JSX } from "preact";
import { currentStep } from "./state";
import { ProgressRail } from "./components/ProgressRail";
import { RoomChrome } from "@/lib/room-chrome";
import {
    AccountStep,
    CategoryStep,
    CompanyStep,
    CompleteStep,
    IcpStep,
    QuotaStep,
    RoleStep,
    IntroStep
} from "./components/Steps";

/**
 * Onboarding — Phase 4 / Room 17 root.
 *
 * Per canon §4.3 (Threshold family) + Part III §5: produce real Brief
 * items as a side effect of setup so the Dashboard wakes up live.
 * Greenfield rebuild — not a migration. Bright field per founder
 * directive.
 *
 * 7-step flow (thesis → company → role → category → ICP → account →
 * quota) with one dominant move per surface, hide-able back button,
 * and a final completion screen routing to Welcome / Dashboard.
 */
export function Onboarding(): JSX.Element {
    return (
        <div class="ob-shell">
            <RoomChrome kicker="ONBOARDING"/>
            <ProgressRail />
            <main class="ob-stage">
                <StepRouter />
            </main>
        </div>
    );
}

function StepRouter(): JSX.Element {
    switch (currentStep.value) {
        case "intro":
            return <IntroStep />;
        case "company":
            return <CompanyStep />;
        case "role":
            return <RoleStep />;
        case "category":
            return <CategoryStep />;
        case "icp":
            return <IcpStep />;
        case "account":
            return <AccountStep />;
        case "quota":
            return <QuotaStep />;
        case "complete":
        default:
            return <CompleteStep />;
    }
}
