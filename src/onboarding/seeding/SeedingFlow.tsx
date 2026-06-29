import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    SEEDING_STEPS,
    nextStep,
    seedingIndex,
    seedingStep,
    type SeedingStepId
} from "./state";
import { EvidenceMargin } from "./components/EvidenceMargin";
import { Doorway } from "./components/Doorway";
import "./seeding.css";

/**
 * SeedingFlow (ADR-019) — the Earned Depth onboarding rebuild, slice 1:
 * the flow shell + the sourced evidence margin + the doorway. Flag-gated
 * (room_onboarding_seeding; previewable via ?seeding=1); the existing
 * onboarding renders otherwise. Steps 2–7 (ICP / accounts / wake / deals
 * / quota / landing) land in following slices; they render a labelled
 * placeholder for now so the shell is navigable in internal preview.
 *
 * Hook-free — module-level signals carry the step state.
 */

const STEP_LABEL: Record<SeedingStepId, string> = {
    door: "Doorway",
    icp: "Your ICP",
    accounts: "Your accounts",
    wake: "The wake-up",
    deals: "Your live deals",
    quota: "The math",
    landing: "Awake"
};

function StepBody(): JSX.Element {
    const step = seedingStep.value;
    if (step === "door") return <Doorway />;
    return (
        <section class="sd-step sd-step--stub">
            <p class="sd-kicker">{STEP_LABEL[step]}</p>
            <h1 class="sd-h1">
                {t("This step is coming next.", { class: "body" })}
            </h1>
            <p class="sd-lede">
                {t(
                    "The shell, the evidence margin, and the doorway are real. The remaining steps land in the following slices, each wiring into a real room.",
                    { class: "body" }
                )}
            </p>
        </section>
    );
}

function Footer(): JSX.Element {
    const idx = seedingIndex.value;
    const isLast = idx >= SEEDING_STEPS.length - 1;
    if (isLast) {
        return (
            <a class="sd-btn" href="/dashboard/">
                {t("Open my morning →", { class: "body" })}
            </a>
        );
    }
    const label = seedingStep.value === "door" ? "Start →" : "Continue →";
    return (
        <button type="button" class="sd-btn" onClick={() => nextStep()}>
            {t(label, { class: "body" })}
        </button>
    );
}

export function SeedingFlow(): JSX.Element {
    const idx = seedingIndex.value;
    return (
        <div class="sd-frame">
            <div class="sd-main">
                <header class="sd-top">
                    <span class="sd-mark">ANTAEUS</span>
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
                <footer class="sd-foot">
                    <Footer />
                </footer>
            </div>
            <EvidenceMargin />
        </div>
    );
}
