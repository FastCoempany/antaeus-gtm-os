import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { SEEDING_STEPS, seedingIndex, seedingStep, prevStep } from "./state";
import { EvidenceMargin } from "./components/EvidenceMargin";
import { Doorway } from "./components/Doorway";
import { IcpStep } from "./components/IcpStep";
import { AccountsStep } from "./components/AccountsStep";
import { WakeStep } from "./components/WakeStep";
import { DealsStep } from "./components/DealsStep";
import { QuotaStep } from "./components/QuotaStep";
import { LandingStep } from "./components/LandingStep";
import "./seeding.css";

/**
 * SeedingFlow (ADR-019) — the Earned Depth onboarding rebuild, full flow:
 *   doorway → ICP (real choosing) → accounts → wake-up → live deals →
 *   quota → landing.
 *
 * Flag-gated (room_onboarding_seeding; previewable via ?seeding=1); the
 * existing onboarding renders otherwise. Each step renders its own footer
 * and writes into the seeding draft; the landing persists the draft into
 * the living rooms. Hook-free — module-level signals carry all state.
 */
function StepBody(): JSX.Element {
    switch (seedingStep.value) {
        case "door":
            return <Doorway />;
        case "icp":
            return <IcpStep />;
        case "accounts":
            return <AccountsStep />;
        case "wake":
            return <WakeStep />;
        case "deals":
            return <DealsStep />;
        case "quota":
            return <QuotaStep />;
        case "landing":
            return <LandingStep />;
        default:
            return <Doorway />;
    }
}

export function SeedingFlow(): JSX.Element {
    const idx = seedingIndex.value;
    // Back travels every step except the doorway (nothing before it) and
    // the landing (terminal — the workspace is already written).
    const canGoBack = idx > 0 && seedingStep.value !== "landing";
    return (
        <div class="sd-frame">
            <div class="sd-main">
                <header class="sd-top">
                    <div class="sd-top__l">
                        <span class="sd-mark">ANTAEUS</span>
                        {canGoBack ? (
                            <button type="button" class="sd-back" onClick={() => prevStep()}>
                                {t("← Back", { class: "body" })}
                            </button>
                        ) : null}
                    </div>
                    <div class="sd-rail" aria-hidden="true">
                        {SEEDING_STEPS.map((s, i) => (
                            <span
                                key={s}
                                class={`sd-pip${i < idx ? " is-done" : i === idx ? " is-on" : ""}`}
                            />
                        ))}
                    </div>
                </header>
                <div class="sd-body">
                    <StepBody />
                </div>
            </div>
            <EvidenceMargin />
        </div>
    );
}
