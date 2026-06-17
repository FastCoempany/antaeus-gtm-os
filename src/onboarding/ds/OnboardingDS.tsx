import type { JSX } from "preact";
import { PageFrame, Progress, WayfinderBar } from "@/components";
import { t } from "@/lib/voice/t";
import { PaletteTrigger } from "@/lib/palette/PaletteTrigger";
import { currentStep, progress, stepIndex } from "../state";
import { STEP_ORDER } from "../lib/types";
import {
    AccountStepDS,
    CategoryStepDS,
    CompanyStepDS,
    CompleteStepDS,
    IcpStepDS,
    IntroStepDS,
    QuotaStepDS,
    RoleStepDS
} from "./components/StepsDS";

/**
 * OnboardingDS — Onboarding (canon §4.3) composed on the design system
 * as a Threshold. One step at a time, one dominant move per surface.
 * The Endowed Progress Effect is carried by the library Progress (a
 * real-step ladder — "Step 1 of 7" on arrival, never a raw percent),
 * and each step's body is composed on the library inputs. Onboarding's
 * output BECOMES the Brief (the seed pipeline is unchanged); there is no
 * cross-room pulling cell mid-flow — the one move is the in-flow
 * Continue. The seed pipeline, validation, and cloud mirror are the
 * unchanged legacy lib.
 *
 * Flag-gated room_onboarding_v3, previewable via ?ds=1; the existing
 * room renders when the flag is off.
 */

const WORKING_STEPS = STEP_ORDER.slice(0, STEP_ORDER.length - 1);
const STEP_LABEL: Record<string, string> = {
    intro: "Intro",
    company: "Company",
    role: "Role",
    category: "Category",
    icp: "ICP",
    account: "Account",
    quota: "Quota"
};

function StepRouterDS(): JSX.Element {
    switch (currentStep.value) {
        case "intro":
            return <IntroStepDS />;
        case "company":
            return <CompanyStepDS />;
        case "role":
            return <RoleStepDS />;
        case "category":
            return <CategoryStepDS />;
        case "icp":
            return <IcpStepDS />;
        case "account":
            return <AccountStepDS />;
        case "quota":
            return <QuotaStepDS />;
        default:
            return <CompleteStepDS />;
    }
}

export function OnboardingDS(): JSX.Element {
    const p = progress.value;
    const idx = stepIndex.value;
    const isComplete = currentStep.value === "complete";

    const milestones = WORKING_STEPS.map((s, i) => ({
        label: STEP_LABEL[s] ?? s,
        done: isComplete || i < idx
    }));
    const count = isComplete
        ? t("All 7 steps complete")
        : `Step ${p.current} of ${p.total}`;
    const tail = isComplete ? t("Workspace live") : `Step ${p.current} of ${p.total}`;

    return (
        <div class="obd">
            <WayfinderBar room={t("ONBOARDING")} tail={tail} />
            <PageFrame>
                <div class="obd-flow">
                    <div class="obd-progress">
                        <Progress
                            milestones={milestones}
                            count={count}
                            label={t("Onboarding steps")}
                        />
                    </div>
                    <StepRouterDS />
                </div>
            </PageFrame>

            <PaletteTrigger />
        </div>
    );
}
