import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import {
    draft,
    effectiveBuyer,
    effectiveIndustry,
    recentIcps,
    totalWorked
} from "../state";
import { buildStatement } from "../lib/builders";
import { buildIcpQuality } from "../lib/quality";

/**
 * DarkHero — Wave 3 implementation.
 *
 * Per Part II §4.8 the dark hero carries the strategic headline above
 * the bright work area. Wave 3 fills it with:
 *   - kicker + serif title + canon-anchored note
 *   - live Thin ICP statement preview (or the placeholder)
 *   - tier-tinted score chip
 *   - 2 mono badges (saved ICPs + sessions worked)
 */

function parseActiveAccounts(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function DarkHero(): JSX.Element {
    const d = draft.value;
    const industry = effectiveIndustry.value;
    const buyer = effectiveBuyer.value;
    const statement = buildStatement({
        industry,
        size: d.size,
        geo: d.geo,
        buyer,
        pain: d.pain,
        trigger: d.trigger,
        proofWindow: d.proofWindow
    });
    const quality = buildIcpQuality({
        role: d.role,
        industry,
        size: d.size,
        geo: d.geo,
        buyer,
        pain: d.pain,
        trigger: d.trigger,
        proofWindow: d.proofWindow,
        activeAccounts: parseActiveAccounts(d.engineActive)
    });
    const worked = totalWorked.value;
    const saved = recentIcps.value.length;
    const placeholder = statement.text.startsWith("Fill the inputs");

    const kicker =
        saved > 0
            ? `ICP STUDIO · ${saved} ${saved === 1 ? "ICP" : "ICPs"} saved`
            : "ICP STUDIO";

    return (
        <section class="icp-hero" aria-label={t("ICP Studio hero")}>
            <div class="icp-hero__inner">
                <p class="icp-hero__kicker">{kicker}</p>
                <h1 class="icp-hero__title">
                    Sharpen <span>{t("one")}</span> ICP before scale compounds the
                    wrong things.
                </h1>
                <p class="icp-hero__note">
                    A thin ICP — one industry, one buyer, one pain — is what
                    every downstream room targets against.
                </p>
                {!placeholder ? (
                    <p class="icp-hero__statement">{statement.text}</p>
                ) : null}
                <div class="icp-hero__meta" role="status">
                    <span
                        class={`icp-hero__chip icp-hero__chip--${quality.tier}`}
                        aria-label={`Quality score ${quality.score} of 100, ${quality.label}`}
                    >
                        {quality.score} · {quality.label}
                    </span>
                    <span class="icp-hero__badge">
                        {worked} {worked === 1 ? "session" : "sessions"} worked
                    </span>
                </div>
            </div>
        </section>
    );
}
